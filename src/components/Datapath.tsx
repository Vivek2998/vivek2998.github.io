import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import trace from '../data/pipelineTrace.json'

/**
 * One instruction, followed all the way through the processor.
 *
 * The companion to the cycle-by-cycle view, for anyone who does not already
 * know what a pipeline stage is. Same source of truth: the numbers below are
 * lifted out of the same Icarus Verilog trace, so 5 + 7 = 12 is a sum this
 * hardware actually computed rather than one written into the page.
 */

type Cycle = {
  s2: { pc: number; asm: string; rs1: number | null; rs1v: number; rs2: number | null; rs2v: number; rd: number } | null
  s3: { pc: number; value: number; wrote: boolean } | null
}

const cycles = trace.cycles as Cycle[]
const listing = trace.listing as Record<string, { word: number; asm: string }>

const ABI = [
  'zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2', 's0', 's1',
  'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7',
  's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11',
  't3', 't4', 't5', 't6',
]

type Example = {
  key: string
  verb: string
  sign: string
  pc: number
  word: number
  rd: string
  rs1: string
  rs2: string
  a: number
  b: number
  result: number
}

/** Pull a worked example straight out of the trace. */
function findExample(mnemonic: string, verb: string, sign: string): Example | null {
  const cycle = cycles.find((c) => c.s2?.asm.startsWith(`${mnemonic} `))
  const s2 = cycle?.s2
  if (!s2 || s2.rs1 === null || s2.rs2 === null) return null
  const written = cycles.find((c) => c.s3?.pc === s2.pc && c.s3.wrote)
  const entry = listing[String(s2.pc)]
  if (!written?.s3 || !entry) return null
  return {
    key: mnemonic,
    verb,
    sign,
    pc: s2.pc,
    word: entry.word,
    rd: ABI[s2.rd],
    rs1: ABI[s2.rs1],
    rs2: ABI[s2.rs2],
    a: s2.rs1v,
    b: s2.rs2v,
    result: written.s3.value,
  }
}

const EXAMPLES = [
  findExample('add', 'add', '+'),
  findExample('sub', 'subtract', '−'),
].filter((e): e is Example => e !== null)

/* --------------------------------------------------------------- geometry */

type BlockKey = 'pc' | 'imem' | 'dec' | 'regs' | 'alu' | 'out'
type WireKey = 'w1' | 'w2' | 'w3' | 'w4' | 'w5' | 'w6' | 'w7' | 'w8' | 'w9'

const BLOCKS: Record<BlockKey, { x: number; y: number; w: number; h: number; title: string; hint: string }> = {
  pc:   { x: 20,  y: 28,  w: 132, h: 58, title: 'program counter', hint: 'which one is next' },
  imem: { x: 224, y: 28,  w: 176, h: 58, title: 'instruction memory', hint: 'where the program lives' },
  dec:  { x: 472, y: 28,  w: 150, h: 58, title: 'decoder', hint: 'what do these bits mean' },
  regs: { x: 132, y: 194, w: 180, h: 116, title: 'register file', hint: '32 places to keep a number' },
  alu:  { x: 420, y: 210, w: 140, h: 84, title: 'ALU', hint: 'does the arithmetic' },
  out:  { x: 660, y: 210, w: 160, h: 84, title: 'write back', hint: 'keeps the answer' },
}

/** Wire paths, plus where a value travelling along one gets its label. */
const WIRES: Record<WireKey, { d: string; label: [number, number] }> = {
  w1: { d: 'M152,57 H216',                    label: [184, 44] },
  w2: { d: 'M400,57 H464',                    label: [432, 44] },
  w3: { d: 'M520,86 V150 H222 V188',          label: [366, 140] },
  w4: { d: 'M580,86 V178 H490 V204',          label: [538, 168] },
  w5: { d: 'M312,238 H412',                   label: [362, 229] },
  w6: { d: 'M312,268 H412',                   label: [362, 259] },
  w7: { d: 'M560,252 H652',                   label: [606, 243] },
  w8: { d: 'M740,294 V336 H222 V316',         label: [470, 350] },
  w9: { d: 'M86,86 V118 H10 V46 H14',         label: [40, 108] },
}

/* ------------------------------------------------------------------ steps */

type Step = {
  caption: string
  blocks: BlockKey[]
  wires: Partial<Record<WireKey, string>>
  alu?: 'compute' | 'result'
  fields?: string[]
  stored?: boolean
}

function buildSteps(e: Example): Step[] {
  return [
    {
      caption: `Everything starts with an address. The program counter is just a number saying which instruction comes next — this one is kept at 0x${e.pc.toString(16).padStart(4, '0')}.`,
      blocks: ['pc'],
      wires: { w1: `0x${e.pc.toString(16).padStart(4, '0')}` },
    },
    {
      caption: 'Memory hands that instruction back. At this point it is only a 32-bit number — nothing in the machine knows yet what it is for.',
      blocks: ['imem'],
      wires: { w2: `0x${e.word.toString(16).padStart(8, '0')}` },
    },
    {
      caption: `The decoder pulls the number apart. One group of bits means "${e.verb}"; the others name the registers to read from and the one to put the answer in.`,
      blocks: ['dec'],
      wires: {},
      fields: ['funct7', 'rs2', 'rs1', 'funct3', 'rd', 'opcode'],
    },
    {
      caption: `Two orders go out at once: the ALU is told to ${e.verb}, and the register file is asked for whatever is in ${e.rs1} and ${e.rs2}.`,
      blocks: ['dec', 'regs', 'alu'],
      wires: { w3: `read ${e.rs1}, ${e.rs2}`, w4: e.verb },
      fields: ['rs1', 'rs2', 'funct7'],
    },
    {
      caption: `The register file is 32 small boxes, each holding one number. ${e.rs1} has ${e.a} in it and ${e.rs2} has ${e.b}. Both travel down the wires to the ALU.`,
      blocks: ['regs'],
      wires: { w5: String(e.a), w6: String(e.b) },
      fields: ['rs1', 'rs2'],
    },
    {
      caption: `The ALU is the part that actually does the arithmetic — two numbers in, one out. ${e.a} ${e.sign} ${e.b} = ${e.result}.`,
      blocks: ['alu'],
      wires: {},
      alu: 'compute',
    },
    {
      caption: `The answer travels back and is put away. ${e.rd} now holds ${e.result}, ready for whatever instruction wants it next.`,
      blocks: ['alu', 'out', 'regs'],
      wires: { w7: String(e.result), w8: `${e.rd} = ${e.result}` },
      alu: 'result',
      fields: ['rd'],
      stored: true,
    },
    {
      caption: 'The counter moves on by four bytes, and the whole journey begins again for the next instruction — tens of millions of times a second.',
      blocks: ['pc'],
      wires: { w9: '+4' },
      alu: 'result',
      stored: true,
    },
  ]
}

/* --------------------------------------------------------------- bit view */

const FIELDS: { name: string; from: number; to: number }[] = [
  { name: 'funct7', from: 0, to: 7 },
  { name: 'rs2', from: 7, to: 12 },
  { name: 'rs1', from: 12, to: 17 },
  { name: 'funct3', from: 17, to: 20 },
  { name: 'rd', from: 20, to: 25 },
  { name: 'opcode', from: 25, to: 32 },
]

function fieldMeaning(name: string, e: Example) {
  switch (name) {
    case 'funct7': return e.verb
    case 'rs2': return e.rs2
    case 'rs1': return e.rs1
    case 'funct3': return 'which one'
    case 'rd': return e.rd
    default: return 'arithmetic'
  }
}

/* ------------------------------------------------------------- the view */

export function Datapath() {
  const [choice, setChoice] = useState(0)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)
  const reduced = useReducedMotion()

  const example = EXAMPLES[choice]
  const steps = useMemo(() => (example ? buildSteps(example) : []), [example])
  const current = steps[step]
  const atEnd = step >= steps.length - 1

  useEffect(() => {
    if (!playing || atEnd) {
      if (atEnd) setPlaying(false)
      return
    }
    const id = window.setInterval(() => setStep((s) => Math.min(steps.length - 1, s + 1)), 3600)
    return () => window.clearInterval(id)
  }, [playing, atEnd, steps.length])

  if (!example || !current) return null

  const bits = example.word.toString(2).padStart(32, '0')
  const liveBlocks = new Set(current.blocks)
  const liveWires = Object.keys(current.wires) as WireKey[]
  const liveFields = new Set(current.fields ?? [])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
      {/* which sum to follow */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[0.63rem] uppercase tracking-[0.14em] text-ink-faint">
          following
        </span>
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.key}
            onClick={() => {
              setChoice(i)
              setStep(0)
              setPlaying(true)
            }}
            className={
              'rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors ' +
              (i === choice
                ? 'border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-ink'
                : 'border-hairline text-ink-muted hover:text-ink')
            }
          >
            {ex.a} {ex.sign} {ex.b}
          </button>
        ))}
        <span className="ml-auto font-mono text-[0.68rem] text-ink-faint">
          step {step + 1} of {steps.length}
        </span>
      </div>

      {/* the diagram */}
      <svg
        viewBox="0 0 860 372"
        className="w-full"
        role="img"
        aria-label={`Datapath diagram, step ${step + 1}: ${current.caption}`}
      >
        <defs>
          <marker id="dp-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="var(--color-hairline)" />
          </marker>
          <marker id="dp-arrow-live" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="var(--accent)" />
          </marker>
        </defs>

        {/* wires first, so the blocks sit on top of where they meet */}
        {(Object.keys(WIRES) as WireKey[]).map((id) => {
          const live = liveWires.includes(id)
          return (
            <g key={id}>
              <path
                d={WIRES[id].d}
                fill="none"
                strokeWidth={1.5}
                stroke={live ? 'color-mix(in oklab, var(--accent) 45%, transparent)' : 'var(--color-hairline)'}
                markerEnd={`url(#${live ? 'dp-arrow-live' : 'dp-arrow'})`}
              />
              {live && (
                <path
                  className="wire-pulse"
                  d={WIRES[id].d}
                  pathLength={100}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                />
              )}
            </g>
          )
        })}

        {/* the value each live wire is carrying */}
        {liveWires.map((id) => {
          const text = current.wires[id]
          if (!text) return null
          const [x, y] = WIRES[id].label
          const width = text.length * 6.4 + 14
          return (
            <g key={`label-${id}`}>
              <rect
                x={x - width / 2}
                y={y - 11}
                width={width}
                height={19}
                rx={5}
                fill="var(--color-surface-raised)"
                stroke="color-mix(in oklab, var(--accent) 40%, transparent)"
              />
              <text
                x={x}
                y={y + 2}
                textAnchor="middle"
                className="font-mono"
                fontSize={11}
                fill="var(--color-ink)"
              >
                {text}
              </text>
            </g>
          )
        })}

        {/* blocks */}
        {(Object.keys(BLOCKS) as BlockKey[]).map((id) => {
          const b = BLOCKS[id]
          const live = liveBlocks.has(id)
          return (
            <g key={id}>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={10}
                fill={live ? 'color-mix(in oklab, var(--accent) 12%, var(--color-surface-raised))' : 'var(--color-surface)'}
                stroke={live ? 'var(--accent)' : 'var(--color-hairline)'}
                strokeWidth={live ? 1.8 : 1}
              />
              <text
                x={b.x + b.w / 2}
                y={b.y + (id === 'regs' || (id === 'alu' && current.alu) ? 24 : b.h / 2 - 2)}
                textAnchor="middle"
                fontSize={13}
                fontWeight={live ? 600 : 500}
                fill={live ? 'var(--color-ink)' : 'var(--color-ink-muted)'}
              >
                {b.title}
              </text>

              {id === 'alu' && current.alu ? (
                /* Once it has both operands the ALU shows its working. */
                <text
                  x={b.x + b.w / 2}
                  y={b.y + 54}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize={16}
                  fill="var(--color-ink)"
                >
                  {example.a} {example.sign} {example.b} = {example.result}
                </text>
              ) : id === 'regs' ? (
                /* The register file lists what it is holding, and gains a row
                   when the answer is written back. */
                <>
                  <text x={b.x + b.w / 2} y={b.y + 40} textAnchor="middle" fontSize={10.5} fill="var(--color-ink-faint)">
                    {b.hint}
                  </text>
                  {[
                    { name: example.rs1, value: example.a, fresh: false },
                    { name: example.rs2, value: example.b, fresh: false },
                    ...(current.stored ? [{ name: example.rd, value: example.result, fresh: true }] : []),
                  ].map((row, i) => (
                    <g key={row.name} className="font-mono" fontSize={11}>
                      <text x={b.x + 46} y={b.y + 62 + i * 18} fill={row.fresh ? 'var(--accent)' : 'var(--color-ink-faint)'}>
                        {row.name}
                      </text>
                      <text x={b.x + 128} y={b.y + 62 + i * 18} textAnchor="end" fill={row.fresh ? 'var(--accent)' : 'var(--color-ink-muted)'}>
                        {row.value}
                      </text>
                    </g>
                  ))}
                </>
              ) : (
                <text
                  x={b.x + b.w / 2}
                  y={b.y + b.h / 2 + 15}
                  textAnchor="middle"
                  fontSize={10.5}
                  fill="var(--color-ink-faint)"
                >
                  {b.hint}
                </text>
              )}
            </g>
          )
        })}

      </svg>

      {/* the instruction word, split the way the decoder splits it */}
      <div className="rounded-lg border border-hairline bg-surface/50 px-3 py-2">
        <p className="pb-1.5 font-mono text-[0.63rem] uppercase tracking-[0.14em] text-ink-faint">
          the instruction, as 32 bits
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FIELDS.map((f) => {
            const on = liveFields.has(f.name)
            return (
              <div
                key={f.name}
                className={
                  'rounded border px-1.5 py-1 text-center transition-colors duration-200 ' +
                  (on
                    ? 'border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]'
                    : 'border-hairline')
                }
              >
                <div className={'font-mono text-[0.7rem] ' + (on ? 'text-ink' : 'text-ink-faint')}>
                  {bits.slice(f.from, f.to)}
                </div>
                <div className={'text-[0.6rem] ' + (on ? 'text-accent' : 'text-ink-faint')}>
                  {fieldMeaning(f.name, example)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* what is happening, in words */}
      <p className="min-h-[3.2rem] rounded-lg border border-hairline bg-surface/50 px-3 py-2 text-sm leading-relaxed text-ink-muted">
        {current.caption}
      </p>

      {/* transport */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            setPlaying(false)
            setStep((s) => Math.max(0, s - 1))
          }}
          disabled={step === 0}
          aria-label="Previous step"
          className="rounded-lg border border-hairline px-2.5 py-1 font-mono text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-35"
        >
          ◀
        </button>
        <button
          onClick={() => (atEnd ? (setStep(0), setPlaying(true)) : setPlaying((p) => !p))}
          className="rounded-lg border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] px-3 py-1 font-mono text-xs text-ink transition-colors hover:bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]"
        >
          {atEnd ? 'replay' : playing ? 'pause' : 'play'}
        </button>
        <button
          onClick={() => {
            setPlaying(false)
            setStep((s) => Math.min(steps.length - 1, s + 1))
          }}
          disabled={atEnd}
          aria-label="Next step"
          className="rounded-lg border border-hairline px-2.5 py-1 font-mono text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-35"
        >
          ▶
        </button>
        <div className="flex flex-1 gap-1">
          {steps.map((_, i) => (
            <button
              key={i}
              aria-label={`Step ${i + 1}`}
              onClick={() => {
                setPlaying(false)
                setStep(i)
              }}
              className={
                'h-1 flex-1 rounded-full transition-colors ' +
                (i <= step ? 'bg-[var(--accent)]' : 'bg-hairline')
              }
            />
          ))}
        </div>
      </div>

      {!reduced && (
        <span className="sr-only" aria-live="polite">
          {current.caption}
        </span>
      )}
    </div>
  )
}
