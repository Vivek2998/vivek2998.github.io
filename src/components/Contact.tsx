import { Section } from './Section'
import { Reveal } from './Reveal'
import { ActionButton } from './ActionButton'
import { links, profile } from '../content'

const socials = [
  { label: 'GitHub', href: links.github, handle: 'Vivek2998' },
  { label: 'LinkedIn', href: links.linkedin, handle: 'in/vk30' },
  { label: 'X', href: links.twitter, handle: '@Khudozhnik_29' },
  { label: 'Instagram', href: links.instagram, handle: '@khudozhnik_29' },
]

export function Contact() {
  return (
    <Section
      id="contact"
      accent="azure"
      index="06"
      title="Get in touch"
      lead="Working on something at the hardware/software seam, or just want to compare notes? Mail lands fastest."
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* Glass over the aurora again — the one call-to-action on the page. */}
        <Reveal>
          <div className="glass flex h-full flex-col justify-between gap-8 p-7 sm:p-9">
            <div>
              <p className="font-mono text-xs tracking-[0.18em] text-ink-faint uppercase">
                Email
              </p>
              <a
                href={`mailto:${links.email}`}
                className="mt-3 inline-block text-[clamp(1.1rem,3vw,1.65rem)] font-medium tracking-tight break-all text-ink transition-colors hover:text-signal"
              >
                {links.email}
              </a>
              <p className="mt-4 text-sm text-ink-faint">
                Based in {profile.location} · usually reply within a day or two
              </p>
            </div>

            <ActionButton href={`mailto:${links.email}`} className="w-fit">
              Say hello
            </ActionButton>
          </div>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {socials.map((social, i) => (
            <Reveal key={social.label} step={i + 1}>
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="panel group flex items-center justify-between gap-4 p-5 transition-colors hover:border-signal/30"
              >
                <span>
                  <span className="block text-sm text-ink">{social.label}</span>
                  <span className="mt-0.5 block font-mono text-xs text-ink-faint">
                    {social.handle}
                  </span>
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0 text-ink-faint transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal">
                  <path d="M3.5 10.5 10.5 3.5M5 3.5h5.5V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-mono text-xs text-ink-faint">
          © {new Date().getFullYear()} {profile.name}
        </p>
        <p className="font-mono text-xs text-ink-faint">
          Built with React, Vite and Tailwind ·{' '}
          <a
            href="https://github.com/Vivek2998/vivek2998.github.io"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-signal"
          >
            source
          </a>
        </p>
      </div>
    </footer>
  )
}
