import { Section } from './Section'
import { Reveal } from './Reveal'
import { education, experience, type TimelineEntry } from '../content'

function Marker({ entry }: { entry: TimelineEntry }) {
  if (entry.current) {
    return (
      <span className="relative mt-1.5 flex h-3 w-3 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-signal" />
      </span>
    )
  }

  return (
    <span
      className={`mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 ${
        entry.kind === 'break'
          ? 'border-ink-faint bg-void'
          : 'border-pulse bg-void'
      }`}
    />
  )
}

function Timeline({ entries, label }: { entries: TimelineEntry[]; label: string }) {
  return (
    <div>
      <h3 className="font-mono text-xs tracking-[0.2em] text-signal uppercase">
        {label}
      </h3>

      <ol className="mt-7">
        {entries.map((entry, i) => {
          // Not a `last:` variant — this div is its <li>'s only child, so
          // `last:` would match every single item and cancel the spacing.
          const isLast = i === entries.length - 1

          return (
            <Reveal key={`${entry.title}-${entry.period}`} step={i} as="li">
              <div className={`relative flex gap-5 ${isLast ? '' : 'pb-12'}`}>
                {/* Connector — omitted on the last item so no line dangles. */}
                {!isLast && (
                  <span
                    aria-hidden
                    className="absolute top-6 bottom-1 left-[5px] w-px bg-gradient-to-b from-hairline to-hairline/25"
                  />
                )}

                <Marker entry={entry} />

                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-ink-faint">{entry.period}</p>

                  <p className="mt-1.5 font-medium text-ink">
                    {entry.title}
                    {entry.current && (
                      <span className="ml-2 rounded-full border border-signal/30 bg-signal/10 px-2 py-0.5 align-middle font-mono text-[0.65rem] tracking-wide text-signal">
                        now
                      </span>
                    )}
                  </p>

                  {entry.org && (
                    <p className="mt-0.5 text-sm text-pulse-bright">{entry.org}</p>
                  )}

                  <p className="mt-2.5 text-sm leading-relaxed text-ink-muted text-pretty">
                    {entry.detail}
                  </p>
                </div>
              </div>
            </Reveal>
          )
        })}
      </ol>
    </div>
  )
}

export function Journey() {
  return (
    <Section
      id="journey"
      index="03"
      title="Journey"
      lead="Electronics to embedded to software — not a straight line, and better for it."
    >
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
        <Timeline entries={experience} label="Experience" />
        <Timeline entries={education} label="Education" />
      </div>
    </Section>
  )
}
