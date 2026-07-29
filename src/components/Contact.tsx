import { useEffect, useRef, useState } from 'react'
import { Section } from './Section'
import { Reveal } from './Reveal'
import { ActionButton } from './ActionButton'
import { ContactForm } from './ContactForm'
import { contactForm, links, profile } from '../content'

const socials = [
  { label: 'GitHub', href: links.github, handle: 'Vivek2998' },
  { label: 'LinkedIn', href: links.linkedin, handle: 'in/vk30' },
  { label: 'X', href: links.twitter, handle: '@Khudozhnik_29' },
  { label: 'Instagram', href: links.instagram, handle: '@khudozhnik_29' },
]

type Panel = 'socials' | 'form' | 'sent'

function SocialList() {
  return (
    <div className="grid h-full gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {socials.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noreferrer"
          className="panel group flex items-center justify-between gap-4 p-5 transition-colors hover:border-signal/40"
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
      ))}
    </div>
  )
}

function Sent({ secondsLeft }: { secondsLeft: number }) {
  return (
    <div className="panel flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/12 text-signal">
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
          <path d="M5 11.5 9 15.5 17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </span>

      <div>
        <p className="text-lg font-medium">Message sent</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          Thanks for reaching out — I'll get back to you within a day or two.
        </p>
      </div>

      <p className="font-mono text-xs text-ink-faint" aria-live="polite">
        Back to the links in {secondsLeft}s
      </p>
    </div>
  )
}

export function Contact() {
  const [panel, setPanel] = useState<Panel>('socials')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearInterval)
    timers.current = []
  }

  useEffect(() => clearTimers, [])

  const handleSent = () => {
    setPanel('sent')
    const total = Math.round(contactForm.successHoldMs / 1000)
    setSecondsLeft(total)

    clearTimers()
    // One interval drives both the countdown and the switch back, so the number
    // on screen can never disagree with when it actually flips.
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTimers()
          setPanel('socials')
          return 0
        }
        return s - 1
      })
    }, 1000)
    timers.current.push(id)
  }

  const showForm = () => {
    clearTimers()
    setPanel('form')
  }

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

            <div className="flex flex-wrap items-center gap-4">
              <ActionButton
                as="button"
                onClick={showForm}
                className="w-fit"
                aria-expanded={panel === 'form'}
                aria-controls="contact-panel"
              >
                {panel === 'form' ? 'Fill in the form' : 'Say hello'}
              </ActionButton>

              {panel !== 'socials' && (
                <button
                  type="button"
                  onClick={() => {
                    clearTimers()
                    setPanel('socials')
                  }}
                  className="font-mono text-xs text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  show links instead
                </button>
              )}
            </div>
          </div>
        </Reveal>

        {/* Swaps between the social links, the form, and the confirmation —
            all in the same slot so the section never jumps height. */}
        <Reveal step={1}>
          <div id="contact-panel" className="h-full">
            {/* Keyed so React swaps the subtree outright, which restarts the
                CSS entry animation. No exit animation — the outgoing panel is
                replaced instantly, and at 0.28s in nobody reads it as a cut. */}
            <div key={panel} className="h-full [animation:panel-in_0.28s_cubic-bezier(0.22,1,0.36,1)_both]">
              {panel === 'socials' && <SocialList />}
              {panel === 'form' && (
                <div className="glass h-full p-6 sm:p-7">
                  <ContactForm onSent={handleSent} />
                </div>
              )}
              {panel === 'sent' && <Sent secondsLeft={secondsLeft} />}
            </div>
          </div>
        </Reveal>
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
