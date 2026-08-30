import { Section } from './Section'
import { Reveal } from './Reveal'
import { profile, skills } from '../content'

/* Three things that are true and checkable, rather than invented "10+ projects".
   Counting my own disciplines and calling it a statistic used to sit in the
   middle slot; naming the machine says more and can be looked up. */
const facts = [
  { value: '2021', label: 'Graduated, B.E. ECE' },
  { value: 'Mantra 3.0', label: "SSI's surgical robot — I test it in production" },
  { value: 'RV32I', label: 'RISC-V core, in Verilog' },
]

export function About() {
  return (
    <Section
      id="about"
      accent="violet"
      index="01"
      title="About"
      lead={profile.tagline}
    >
      <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
        <div>
          <p className="text-[1.0625rem] leading-[1.75] text-ink-muted text-pretty">
            {profile.intro}
          </p>
          <p className="mt-5 text-[1.0625rem] leading-[1.75] text-ink-muted text-pretty">
            {profile.secondary}
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-4">
            {facts.map((fact, i) => (
              <Reveal key={fact.label} step={i}>
                <div className="panel h-full px-4 py-5">
                  <dt className="font-mono text-xl text-signal sm:text-2xl">
                    {fact.value}
                  </dt>
                  <dd className="mt-2 text-xs leading-snug text-ink-faint">
                    {fact.label}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>

        {/* Glass here because it sits over the aurora — see Aurora.tsx */}
        <Reveal step={1}>
          <div className="glass p-6 sm:p-7">
            <p className="font-mono text-xs tracking-[0.18em] text-ink-faint uppercase">
              Currently
            </p>
            <p className="mt-4 leading-relaxed text-ink">
              On a production floor most days, checking a surgical robot's actuators
              behave before the unit ships. Away from it, building the embedded
              Linux that machines like it boot.
            </p>

            <div className="mt-7 space-y-5">
              {skills.slice(0, 2).map((group) => (
                <div key={group.label}>
                  <p className="font-mono text-[0.7rem] tracking-[0.16em] text-signal uppercase">
                    {group.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {group.items.join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
