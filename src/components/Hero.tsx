import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { HeroScene } from './HeroScene'
import { links, profile } from '../content'

/** Types a word out, holds, deletes, moves on. */
function useTypedWord(words: readonly string[], enabled: boolean) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const word = words[index % words.length]
    const complete = text === word

    // Pause at the end of a word, type fast, delete faster.
    const delay = deleting ? 34 : complete ? 1800 : 72

    const timer = setTimeout(() => {
      if (!deleting && complete) {
        setDeleting(true)
      } else if (deleting && text === '') {
        setDeleting(false)
        setIndex((i) => (i + 1) % words.length)
      } else {
        setText(
          deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1),
        )
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [text, deleting, index, words, enabled])

  return enabled ? text : words[0]
}

export function Hero() {
  const reduced = useReducedMotion()
  const typed = useTypedWord(profile.rotatingRoles, !reduced)

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-24 pb-16"
    >
      {/* The 3D bit — behind the copy, generous on desktop, restrained on phones. */}
      <HeroScene className="pointer-events-none absolute top-1/2 right-[-18%] h-[min(88vh,760px)] w-[min(88vh,760px)] -translate-y-1/2 opacity-45 sm:right-[-8%] sm:opacity-60 lg:right-[2%] lg:opacity-85" />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <p className="mb-6 flex items-center gap-2.5 font-mono text-xs tracking-[0.2em] text-signal uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
            </span>
            {profile.location}
          </p>

          <h1 className="text-[clamp(2.6rem,8vw,5rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance">
            {profile.name}
          </h1>

          <p className="mt-5 font-mono text-[clamp(1rem,2.6vw,1.4rem)] text-ink-muted">
            <span className="text-ink-faint">{'>'} </span>
            <span className="text-signal text-glow">{typed}</span>
            {!reduced && (
              <motion.span
                aria-hidden
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{ duration: 1.05, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
                className="ml-0.5 inline-block h-[1.05em] w-[0.5ch] translate-y-[0.14em] bg-signal"
              />
            )}
          </p>

          <p className="mt-7 max-w-lg text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">
            {profile.tagline}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#work"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-signal px-6 py-3 text-sm font-medium text-void transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              See the work
              <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                <path d="M2 7.5h10M8 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </a>

            <a
              href={`mailto:${links.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-hairline px-6 py-3 text-sm text-ink-muted transition-colors hover:border-signal/40 hover:text-ink"
            >
              Get in touch
            </a>
          </div>

          <p className="mt-12 font-mono text-xs text-ink-faint">
            {profile.disciplines.join('  ·  ')}
          </p>
        </motion.div>
      </div>

    </section>
  )
}
