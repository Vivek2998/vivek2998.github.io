import { useEffect, useRef, useState } from 'react'
import { Section } from './Section'
import { Reveal } from './Reveal'
import { ActionButton } from './ActionButton'
import { ContactForm } from './ContactForm'
import { useReducedMotion } from '../hooks/useReducedMotion'
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

const SWAP_MS = 380

export function Contact() {
  const [panel, setPanel] = useState<Panel>('socials')
  /* The panel being replaced. It stays mounted for the length of the swap so
     it can slide out — without it the outgoing one would simply vanish, which
     is what made the change feel like a cut. */
  const [outgoing, setOutgoing] = useState<Panel | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const panelRef = useRef<Panel>('socials')
  const timers = useRef<number[]>([])
  const swapTimer = useRef<number>(0)
  const reduced = useReducedMotion()

  const clearTimers = () => {
    timers.current.forEach(clearInterval)
    timers.current = []
  }

  useEffect(
    () => () => {
      clearTimers()
      clearTimeout(swapTimer.current)
    },
    [],
  )

  /* The current panel is mirrored in a ref so this can read it without a stale
     closure — the countdown interval calls goTo long after its own render.
     Scheduling the outgoing panel inside a setPanel updater would be worse:
     updaters have to be pure, and StrictMode runs them twice. */
  const goTo = (next: Panel) => {
    const current = panelRef.current
    if (current === next) return
    panelRef.current = next

    if (!reduced) {
      setOutgoing(current)
      clearTimeout(swapTimer.current)
      swapTimer.current = window.setTimeout(() => setOutgoing(null), SWAP_MS)
    }

    setPanel(next)
  }

  const handleSent = () => {
    goTo('sent')
    const total = Math.round(contactForm.successHoldMs / 1000)
    setSecondsLeft(total)

    clearTimers()
    // One interval drives both the countdown and the switch back, so the number
    // on screen can never disagree with when it actually flips.
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTimers()
          goTo('socials')
          return 0
        }
        return s - 1
      })
    }, 1000)
    timers.current.push(id)
  }

  const showForm = () => {
    clearTimers()
    /* With the form already open this button used to do nothing at all —
       goTo returns early when you're on the panel you asked for, so it just
       sat there reading "Fill in the form" and ignoring clicks. Now it does
       what it says and puts the cursor in the first field. */
    if (panelRef.current === 'form') {
      document
        .querySelector<HTMLInputElement>('#contact-panel input[name="name"]')
        ?.focus()
      return
    }
    goTo('form')
  }

  const renderPanel = (which: Panel) => {
    if (which === 'form') {
      return (
        <div className="glass h-full p-6 sm:p-7">
          <ContactForm onSent={handleSent} />
        </div>
      )
    }
    if (which === 'sent') return <Sent secondsLeft={secondsLeft} />
    return <SocialList />
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
                  /* goTo, not setPanel. Setting the state directly left
                     panelRef pointing at 'form', so the next goTo('form') saw
                     itself as already there and returned — the form could be
                     closed once and never reopened. */
                  onClick={() => {
                    clearTimers()
                    goTo('socials')
                  }}
                  className="font-mono text-xs text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  show links
                </button>
              )}
            </div>
          </div>
        </Reveal>

        {/* Swaps between the social links, the form and the confirmation.
            The slot holds a floor height so the section doesn't resize as they
            change — the form is taller than the links, and without it the whole
            section grew and shunted itself down the page mid-interaction. */}
        {/* A floor under the slot, so swapping panels can't resize the section.
            Measured: the links are 356px tall on desktop against the form's
            300, and at the sm breakpoint they drop to 172 against the same 300
            — so the section was shrinking 56px on desktop and growing 128px on
            tablet mid-interaction. Each floor is the taller of the two states
            at that width. */}
        <Reveal step={1} className="min-h-[356px] sm:min-h-[300px] lg:min-h-[356px]">
          <div id="contact-panel" className="h-full">
            {/* The outgoing panel is taken out of flow so the incoming one
                sets the height and the two overlap mid-slide. The wrapper is
                padded and pulled back by the same amount so clipping the
                slide doesn't also clip the cards' shadows. */}
            <div className="relative -m-3 h-[calc(100%+1.5rem)] overflow-hidden p-3">
              {outgoing && (
                <div
                  key={`${outgoing}-out`}
                  aria-hidden
                  className="absolute inset-3 [animation:panel-out_0.38s_cubic-bezier(0.4,0,0.2,1)_both]"
                >
                  {renderPanel(outgoing)}
                </div>
              )}

              <div
                key={panel}
                className="h-full [animation:panel-in_0.38s_cubic-bezier(0.22,1,0.36,1)_both]"
              >
                {renderPanel(panel)}
              </div>
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
