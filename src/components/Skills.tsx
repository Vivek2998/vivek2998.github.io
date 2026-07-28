import { Section } from './Section'
import { Reveal } from './Reveal'
import { skills } from '../content'

export function Skills() {
  return (
    <Section
      id="skills"
      index="04"
      title="Toolkit"
      lead="What I reach for, grouped by the kind of problem it solves."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {skills.map((group, i) => (
          <Reveal key={group.label} step={i}>
            <div className="panel h-full p-6 sm:p-7">
              <h3 className="font-mono text-xs tracking-[0.18em] text-signal uppercase">
                {group.label}
              </h3>

              <ul className="mt-5 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-hairline bg-slate-raised/40 px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-signal/30 hover:text-ink"
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
