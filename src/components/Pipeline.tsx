import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { Datapath } from './Datapath'
import trace from '../data/pipelineTrace.json'

/**
 * A replay of the RV32I core executing a program.
 *
 * Nothing here is choreographed. The data is a real trace: `tb_msrv32_trace.v`
 * records what every pipeline stage holds each cycle while Icarus Verilog runs
 * the design, and `tools/trace.py` joins that against the assembler's listing.
 * This component only steps through the result — which is the point, because it
 * means the forwarding paths and the flush on a trap are the ones the hardware
 * actually took, not an illustration of what it ought to do.
 *
 * Two ways in. "How it works" follows a single sum through the datapath and
 * assumes nothing; "cycle by cycle" is the engineer's view, three instructions
 * in flight at once. Both read the same trace, and the friendly one opens first.
 */

type Stage2 = {
  pc: number
  asm: string
  source: string
  rs1: number | null
  rs1v: number
  byp1: boolean
  rs2: number | null
  rs2v: number
  byp2: boolean
  rd: number
  imm: number
  iadder: number
  branch: boolean
}

type Stage3 = {
  pc: number
  asm: string
  rd: number
  value: number
  wrote: boolean
  alu: number
}

type Cycle = {
  cycle: number
  state: 'reset' | 'run' | 'trap' | 'mret'
  flush: boolean
  fetch: number
  s2: Stage2 | null
  s3: Stage3 | null
  mem: { write: boolean; addr: number; data: number; mask: number } | null
  trap: { cause: number; name: string } | null
}

type ListingEntry = { word: number; asm: string; source: string; line: number }

const cycles = trace.cycles as Cycle[]
const listing = trace.listing as Record<string, ListingEntry>

const ABI = [
  'zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2', 's0', 's1',
  'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7',
  's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11',
  't3', 't4', 't5', 't6',
]

const hex = (n: number, width = 8) => n.toString(16).padStart(width, '0')
const addr = (n: number) => `0x${hex(n, 4)}`

const STATE_LABEL: Record<Cycle['state'], string> = {
  reset: 'reset',
  run: 'running',
  trap: 'trap taken',
  mret: 'returning',
}

/**
 * The program for the listing column, one row per source line.
 *
 * `li` and `la` each assemble to two instructions, so several addresses can
 * share a line. Grouping them keeps the listing looking like the file that was
 * written rather than repeating a line once per address it produced.
 */
const program = Object.entries(listing)
  .map(([pc, entry]) => ({ pc: Number(pc), ...entry }))
  .sort((a, b) => a.pc - b.pc)
  .reduce<{ pc: number; addresses: number[]; source: string; line: number }[]>((rows, entry) => {
    const last = rows[rows.length - 1]
    if (last && last.line === entry.line) last.addresses.push(entry.pc)
    else rows.push({ pc: entry.pc, addresses: [entry.pc], source: entry.source, line: entry.line })
    return rows
  }, [])

/**
 * Register contents at a given cycle, replayed from the writes in the trace.
 *
 * Cheaper and more honest than dumping all 32 registers every cycle: the trace
 * carries only what changed, and this reconstructs the rest.
 */
function registersAt(index: number) {
  const regs = new Array<number>(32).fill(0)
  let lastWrite = -1
  for (let i = 0; i <= index; i += 1) {
    const s3 = cycles[i].s3
    if (s3?.wrote) {
      regs[s3.rd] = s3.value
      if (i === index) lastWrite = s3.rd
    }
  }
  return { regs, lastWrite }
}

/** A sentence describing what this particular cycle is doing. */
function caption(c: Cycle): string {
  if (c.state === 'reset')
    return 'Held in reset. Stage 2 is fed a NOP so nothing commits before the first real fetch.'
  if (c.trap)
    return `${c.s2?.asm ?? 'This instruction'} raises a trap — ${c.trap.name}. The cause is latched at the end of this cycle.`
  if (c.state === 'trap')
    return `Trap taken. Stage 2 is flushed and the fetch address has already moved to the handler at ${addr(c.fetch)}.`
  if (c.state === 'mret')
    return `mret. Fetch returns to mepc — ${addr(c.fetch)} — and the pipeline is flushed once more.`

  const parts: string[] = []
  if (c.s2?.branch)
    parts.push(
      `The branch is taken. It resolved here in stage 2, so ${addr(c.s2.iadder & ~1)} is already the address being fetched this same cycle — no bubble.`,
    )
  if (c.s2 && (c.s2.byp1 || c.s2.byp2)) {
    const names = [
      c.s2.byp1 && c.s2.rs1 !== null ? ABI[c.s2.rs1] : null,
      c.s2.byp2 && c.s2.rs2 !== null ? ABI[c.s2.rs2] : null,
    ].filter(Boolean)
    const isLoad = c.s3?.asm.startsWith('lw') || c.s3?.asm.startsWith('lb') || c.s3?.asm.startsWith('lh')
    parts.push(
      `${names.join(' and ')} ${names.length > 1 ? 'come' : 'comes'} straight from stage 3 on the forwarding path` +
        (isLoad
          ? ' — a load feeding the instruction right behind it, which on a longer pipeline would cost a stall.'
          : ', not out of the register file, which has not been written yet.'),
    )
  }
  if (c.mem)
    parts.push(`Stage 2 drives a store: ${hex(c.mem.data)} into ${addr(c.mem.addr)}.`)
  if (parts.length === 0 && c.s3?.wrote)
    parts.push(`${ABI[c.s3.rd]} takes ${hex(c.s3.value)} at the edge that ends this cycle.`)
  if (parts.length === 0 && c.s2) parts.push(`${c.s2.asm} is decoding and reading its operands.`)
  return parts.join(' ')
}

function Operand({ name, value, forwarded }: { name: string; value: number; forwarded: boolean }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 ' +
        (forwarded
          ? 'bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-ink'
          : 'text-ink-muted')
      }
    >
      <span className="text-ink-faint">{name}</span>
      <span className="tabular-nums">{hex(value)}</span>
      {forwarded && <span className="text-accent" aria-label="forwarded">↩</span>}
    </span>
  )
}

function StageBox({
  label,
  sub,
  children,
  active,
}: {
  label: string
  sub: string
  children: React.ReactNode
  active: boolean
}) {
  return (
    <div
      className={
        'flex min-h-[7.5rem] flex-1 flex-col rounded-xl border p-3 transition-colors duration-200 ' +
        (active
          ? 'border-[color-mix(in_oklab,var(--accent)_38%,transparent)] bg-surface-raised/80'
          : 'border-hairline bg-surface/40')
      }
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[0.63rem] uppercase tracking-[0.14em] text-ink-faint">
          {label}
        </span>
        <span className="font-mono text-[0.63rem] text-ink-faint">{sub}</span>
      </div>
      <div className="mt-2 flex-1 font-mono text-xs leading-relaxed">{children}</div>
    </div>
  )
}

export default function Pipeline({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<'datapath' | 'cycles'>('datapath')
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const reduced = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const activeLineRef = useRef<HTMLLIElement>(null)
  /* Read inside the key handler, which is bound once. */
  const viewRef = useRef(view)
  viewRef.current = view

  const current = cycles[index]
  const { regs, lastWrite } = useMemo(() => registersAt(index), [index])
  const atEnd = index >= cycles.length - 1

  const step = useCallback((delta: number) => {
    setPlaying(false)
    setIndex((i) => Math.min(cycles.length - 1, Math.max(0, i + delta)))
  }, [])

  // Playback. Stops at the last cycle rather than looping, so the end of the
  // program is a place you arrive at rather than something that flicks past.
  useEffect(() => {
    if (!playing || view !== 'cycles') return
    if (atEnd) {
      setPlaying(false)
      return
    }
    const id = window.setInterval(() => setIndex((i) => Math.min(cycles.length - 1, i + 1)), 900 / speed)
    return () => window.clearInterval(id)
  }, [playing, speed, atEnd, view])

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: 'nearest' })
  }, [index])

  // Escape closes; the arrows step. Scroll is locked while the overlay is up.
  useEffect(() => {
    closeRef.current?.focus()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      // The datapath view has its own controls; leave its keys alone.
      if (viewRef.current !== 'cycles') return
      if (event.key === 'ArrowRight') step(1)
      else if (event.key === 'ArrowLeft') step(-1)
      else if (event.key === ' ') {
        event.preventDefault()
        setPlaying((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose, step])

  const s2 = current.s2
  const s3 = current.s3
  const forwarding = Boolean(s2 && (s2.byp1 || s2.byp2))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(26_24_21/0.42)] p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (!panelRef.current?.contains(event.target as Node)) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="RV32I core, running a program cycle by cycle"
        style={{ '--accent': 'var(--color-hue-lime)' } as React.CSSProperties}
        className="glass accent-card flex max-h-full w-full max-w-5xl flex-col overflow-hidden"
      >
        {/* ---- header ---- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-tight">
              RV32I core <span className="text-ink-faint">·</span>{' '}
              <span className="font-mono text-xs text-ink-muted">10_pipeline_demo.s</span>
            </h2>
            <p className="mt-0.5 font-mono text-[0.68rem] text-ink-faint">
              a real Icarus Verilog trace, {cycles.length} cycles
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex rounded-lg border border-hairline p-0.5 font-mono text-[0.68rem]">
              {(['datapath', 'cycles'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={
                    'rounded px-2 py-1 transition-colors ' +
                    (view === v
                      ? 'bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-ink'
                      : 'text-ink-faint hover:text-ink-muted')
                  }
                >
                  {v === 'datapath' ? 'how it works' : 'cycle by cycle'}
                </button>
              ))}
            </div>
            {view === 'cycles' && (
              <span className="font-mono text-xs tabular-nums text-ink-muted">
                cycle {current.cycle}/{cycles[cycles.length - 1].cycle}
              </span>
            )}
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg border border-hairline px-2 py-1 font-mono text-xs text-ink-muted transition-colors hover:border-[color-mix(in_oklab,var(--accent)_45%,transparent)] hover:text-ink"
            >
              esc
            </button>
          </div>
        </div>

        {/* ---- body ---- */}
        {view === 'datapath' && <Datapath />}

        {view === 'cycles' && (
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[15rem_1fr]">
          {/* program listing */}
          <div className="hidden border-r border-hairline p-3 lg:block">
            <p className="px-1 pb-2 font-mono text-[0.63rem] uppercase tracking-[0.14em] text-ink-faint">
              program
            </p>
            <ol className="max-h-[26rem] overflow-y-auto font-mono text-[0.68rem] leading-[1.7]">
              {program.map((line) => {
                const inS2 = s2 !== null && line.addresses.includes(s2.pc)
                const inS3 = s3 !== null && line.addresses.includes(s3.pc)
                return (
                  <li
                    key={line.pc}
                    ref={inS2 ? activeLineRef : undefined}
                    className={
                      'flex gap-2 rounded px-1 transition-colors duration-150 ' +
                      (inS2
                        ? 'bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-ink'
                        : inS3
                          ? 'bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] text-ink-muted'
                          : 'text-ink-faint')
                    }
                  >
                    <span className="shrink-0 tabular-nums opacity-60">{hex(line.pc, 4)}</span>
                    <span className="truncate">{line.source}</span>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* stages, registers, caption */}
          <div className="flex min-w-0 flex-col gap-3 p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <StageBox label="stage 1 · fetch" sub={addr(current.fetch)} active>
                <span className="text-ink-muted">
                  requesting the instruction at{' '}
                  <span className="text-ink tabular-nums">{addr(current.fetch)}</span>
                </span>
              </StageBox>

              <StageBox
                label="stage 2 · decode / read"
                sub={s2 ? addr(s2.pc) : '—'}
                active={Boolean(s2)}
              >
                {s2 ? (
                  <>
                    <div className="text-ink">{s2.asm}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {s2.rs1 !== null && (
                        <Operand name={ABI[s2.rs1]} value={s2.rs1v} forwarded={s2.byp1} />
                      )}
                      {s2.rs2 !== null && (
                        <Operand name={ABI[s2.rs2]} value={s2.rs2v} forwarded={s2.byp2} />
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-ink-faint">{current.flush ? 'flushed — NOP' : '—'}</span>
                )}
              </StageBox>

              <StageBox
                label="stage 3 · execute / wb"
                sub={s3 ? addr(s3.pc) : '—'}
                active={Boolean(s3)}
              >
                {s3 ? (
                  <>
                    <div className="text-ink-muted">{s3.asm}</div>
                    {s3.wrote && (
                      <div className="mt-1.5 text-ink">
                        <span className="text-ink-faint">{ABI[s3.rd]}</span> ←{' '}
                        <span className="tabular-nums">{hex(s3.value)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </StageBox>
            </div>

            {/* the forwarding path, drawn only when it is carrying something */}
            <div
              className={
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[0.68rem] transition-all duration-200 ' +
                (forwarding
                  ? 'border-[color-mix(in_oklab,var(--accent)_40%,transparent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-ink opacity-100'
                  : 'border-hairline text-ink-faint opacity-45')
              }
            >
              <span className="text-accent">↩</span>
              <span>
                {forwarding
                  ? 'stage 3 → stage 2 · result forwarded before the register file is written'
                  : 'forwarding path idle'}
              </span>
            </div>

            {/* register file */}
            <div>
              <p className="pb-1.5 font-mono text-[0.63rem] uppercase tracking-[0.14em] text-ink-faint">
                integer register file
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[0.66rem] sm:grid-cols-4">
                {regs.map((value, i) => {
                  const written = i === lastWrite
                  const read = s2?.rs1 === i || s2?.rs2 === i
                  return (
                    <div
                      key={i}
                      className={
                        'flex items-baseline justify-between gap-2 rounded px-1.5 py-0.5 transition-colors duration-200 ' +
                        (written
                          ? 'bg-[color-mix(in_oklab,var(--accent)_22%,transparent)] text-ink'
                          : read
                            ? 'bg-[color-mix(in_oklab,var(--color-ink)_5%,transparent)] text-ink'
                            : value
                              ? 'text-ink-muted'
                              : 'text-ink-faint opacity-45')
                      }
                    >
                      <span>{ABI[i]}</span>
                      <span className="tabular-nums">{hex(value)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* what this cycle is doing */}
            <p className="min-h-[2.6rem] rounded-lg border border-hairline bg-surface/50 px-3 py-2 text-xs leading-relaxed text-ink-muted">
              <span className="font-mono text-[0.63rem] uppercase tracking-[0.14em] text-ink-faint">
                {STATE_LABEL[current.state]}
              </span>
              <span className="mx-2 text-ink-faint">·</span>
              {caption(current)}
            </p>
          </div>
        </div>

        )}

        {/* ---- transport, for the cycle view ---- */}
        {view === 'cycles' && (
        <div className="flex flex-wrap items-center gap-3 border-t border-hairline px-4 py-3 sm:px-5">
          <button
            onClick={() => step(-1)}
            disabled={index === 0}
            aria-label="Previous cycle"
            className="rounded-lg border border-hairline px-2.5 py-1 font-mono text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-35"
          >
            ◀
          </button>
          <button
            onClick={() => (atEnd ? (setIndex(0), setPlaying(true)) : setPlaying((p) => !p))}
            className="rounded-lg border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] px-3 py-1 font-mono text-xs text-ink transition-colors hover:bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]"
          >
            {atEnd ? 'replay' : playing ? 'pause' : 'play'}
          </button>
          <button
            onClick={() => step(1)}
            disabled={atEnd}
            aria-label="Next cycle"
            className="rounded-lg border border-hairline px-2.5 py-1 font-mono text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-35"
          >
            ▶
          </button>

          <input
            type="range"
            min={0}
            max={cycles.length - 1}
            value={index}
            aria-label="Cycle"
            onChange={(event) => {
              setPlaying(false)
              setIndex(Number(event.target.value))
            }}
            className="accent-[var(--accent)] h-1 min-w-[8rem] flex-1 cursor-pointer"
          />

          <div className="flex items-center gap-1.5 font-mono text-[0.68rem] text-ink-faint">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={
                  'rounded px-1.5 py-0.5 transition-colors ' +
                  (speed === s ? 'text-accent' : 'hover:text-ink-muted')
                }
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
        )}

        {!reduced && view === 'cycles' && (
          <span className="sr-only" aria-live="polite">
            cycle {current.cycle}: {caption(current)}
          </span>
        )}
      </div>
    </div>
  )
}
