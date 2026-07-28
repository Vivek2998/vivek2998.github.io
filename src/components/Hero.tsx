import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { HeroScene } from './HeroScene'
import { ActionButton } from './ActionButton'
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
      {/* The globe. Draggable from lg upward, where it has its own column and
          can't swallow taps meant for the copy or the buttons. */}
      <HeroScene className="pointer-events-none absolute top-1/2 right-[-18%] h-[min(88vh,760px)] w-[min(88vh,760px)] -translate-y-1/2 opacity-60 sm:right-[-8%] sm:opacity-75 lg:right-[1%] lg:opacity-100 lg:pointer-events-auto" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8">
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
            <span className="text-signal">{typed}</span>
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
            <ActionButton href="#work">See the work</ActionButton>
            <ActionButton href={`mailto:${links.email}`} variant="outline">
              Get in touch
            </ActionButton>
          </div>

          <p className="mt-12 font-mono text-xs text-ink-faint">
            {profile.disciplines.join('  ·  ')}
          </p>

          {/* Only worth saying where the globe is actually draggable. */}
          <p className="mt-4 hidden font-mono text-xs text-ink-faint lg:block">
            <span className="text-signal">↻</span> Drag the globe — the pins are
            where I'd like this to lead
          </p>
        </motion.div>
      </div>

    </section>
  )
}
