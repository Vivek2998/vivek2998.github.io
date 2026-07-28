import { Section } from './Section'
import { Reveal } from './Reveal'
import { accentVar, skills } from '../content'

export function Skills() {
  return (
    <Section
      id="skills"
      accent="lime"
      index="05"
      title="Toolkit"
      lead="What I reach for, and the kind of problem that makes me reach for it."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {skills.map((group, i) => (
          <Reveal
            key={group.label}
            step={i}
            /* An odd number of cards would leave the last one stranded in a
               half-width column, so it takes the full row instead. */
            className={`h-full ${
              skills.length % 2 === 1 && i === skills.length - 1
                ? 'sm:col-span-2'
                : ''
            }`}
          >
            <div
              style={{ '--accent': accentVar(group.accent) } as React.CSSProperties}
              className="glass accent-card group relative flex h-full flex-col overflow-hidden p-6 transition-colors hover:accent-card-hover sm:p-7"
            >
              {/* Oversized index watermark — gives each card a distinct
                  silhouette without adding another element to read. */}
              <span
                aria-hidden
                className="text-accent pointer-events-none absolute top-4 right-5 font-mono text-7xl leading-none font-medium opacity-[0.08] transition-opacity duration-500 group-hover:opacity-[0.15]"
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              <h3 className="text-accent font-mono text-xs tracking-[0.18em] uppercase">
                {group.label}
              </h3>

              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted text-pretty">
                {group.when}
              </p>

              <div aria-hidden className="mt-6 flex-1" />

              <ul className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-hairline bg-slate-raised/30 px-3 py-1.5 text-sm text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_45%,transparent)] hover:text-ink"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
