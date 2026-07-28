import { Section } from './Section'
import { Reveal } from './Reveal'
import { journey, type TimelineEntry } from '../content'

const KIND_LABEL: Record<TimelineEntry['kind'], string> = {
  work: 'Role',
  study: 'Education',
  break: 'Detour',
}

function Node({ entry }: { entry: TimelineEntry }) {
  if (entry.current) {
    return (
      <span className="relative mt-1 flex h-3.5 w-3.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
        <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-signal" />
      </span>
    )
  }

  if (entry.kind === 'work') {
    return (
      <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-pulse bg-paper" />
    )
  }

  // Education and the GATE year read as waypoints, not milestones: smaller,
  // hollow, and set in the muted ink so the eye slides past them.
  return (
    <span className="mt-[0.4rem] h-2 w-2 shrink-0 rotate-45 border border-ink-faint bg-paper" />
  )
}

/** Roles get the full treatment: a card with the story in it. */
function MajorEntry({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="panel accent-card accent-sheen group p-5 transition-colors hover:accent-card-hover sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-accent font-mono text-xs">{entry.period}</span>
        {entry.current && (
          <span className="rounded-full border border-signal/30 bg-signal/10 px-2 py-0.5 font-mono text-[0.65rem] tracking-wide text-signal">
            now
          </span>
        )}
      </div>

      <h4 className="mt-2 text-lg font-medium tracking-tight">{entry.title}</h4>
      {entry.org && <p className="mt-0.5 text-sm text-pulse-bright">{entry.org}</p>}

      <p className="mt-3 text-sm leading-relaxed text-ink-muted text-pretty">
        {entry.detail}
      </p>
    </div>
  )
}

/** Education and the GATE year: one line, no card, deliberately quiet. */
function MinorEntry({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="py-1">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-xs text-ink-faint">{entry.period}</span>
        <span className="text-sm text-ink-muted">{entry.title}</span>
        {entry.credential && (
          <span className="rounded border border-hairline px-1.5 py-0.5 font-mono text-[0.65rem] text-ink-faint">
            {entry.credential}
          </span>
        )}
      </div>

      {entry.org && (
        <p className="mt-1 text-xs text-ink-faint">{entry.org}</p>
      )}

      {entry.detail && (
        <p className="mt-1.5 text-xs leading-relaxed text-ink-faint text-pretty">
          {entry.detail}
        </p>
      )}
    </div>
  )
}

export function Journey() {
  return (
    <Section
      id="journey"
      accent="rose"
      index="04"
      title="Journey"
      lead="Electronics to embedded to software — not a straight line, and better for it."
    >
      <ol className="relative max-w-3xl">
        {journey.map((entry, i) => {
          const isLast = i === journey.length - 1
          const major = entry.kind === 'work'

          return (
            <Reveal key={`${entry.title}-${entry.period}`} step={Math.min(i, 5)} as="li">
              <div className={`relative flex gap-5 ${isLast ? '' : 'pb-8'}`}>
                {/* The spine. Fades toward the bottom, where the entries do too. */}
                {!isLast && (
                  <span
                    aria-hidden
                    className="absolute top-6 bottom-0 left-[7px] w-px bg-gradient-to-b from-hairline to-hairline/20"
                  />
                )}

                <span className="flex w-3.5 shrink-0 justify-center">
                  <Node entry={entry} />
                </span>

                <div className="min-w-0 flex-1">
                  <span className="sr-only">{KIND_LABEL[entry.kind]}: </span>
                  {major ? <MajorEntry entry={entry} /> : <MinorEntry entry={entry} />}
                </div>
              </div>
            </Reveal>
          )
        })}
      </ol>
    </Section>
  )
}
