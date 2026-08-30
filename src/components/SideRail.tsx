import { useEffect, useRef, useState } from 'react'
import { profile, sections } from '../content'
import { useActiveSection } from '../hooks/useActiveSection'

type Mark = { id: string; label: string; pct: number }

/**
 * A rail down the left margin: a full-height track, a tick for each section at
 * its real position in the document, and a fill that follows you down.
 *
 * Wide screens leave a lot of room either side of the 1152px column and the
 * left half was doing nothing. Ticks are placed by each section's actual
 * offset rather than spaced evenly, so the rail is a map of the page rather
 * than a second menu — a long section looks long.
 *
 * The fill tracks the middle of the viewport, which is also what decides the
 * active section, so the fill reaches a tick exactly when that section takes
 * over. It's written straight to the element's style rather than held in
 * state: this fires on every scroll frame and has no business re-rendering
 * React each time.
 *
 * Everything grows leftward from the line, out into the margin — an earlier
 * version ran the labels inward and they sat 22px on top of the content.
 *
 * The ticks are real links, not decoration with a hover trick: revealing a name
 * on hover invites a click, and a target that lights up and does nothing is
 * worse than one that never lit up. The track and the fill behind them stay
 * decorative and hidden from assistive tech; the links themselves are exposed,
 * which is a second route to the same sections rather than a trap.
 */
export function SideRail() {
  return (
    <>
      <Rail />
      <MarginType />
    </>
  )
}

function Rail() {
  const active = useActiveSection()
  const [marks, setMarks] = useState<Mark[]>([])
  const fillRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const measure = () => {
      const doc = document.documentElement.scrollHeight
      if (!doc) return
      setMarks(
        sections.map(({ id, label }) => {
          const el = document.getElementById(id)
          return { id, label, pct: el ? (el.offsetTop / doc) * 100 : 0 }
        }),
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement.scrollHeight
      if (!doc || !fillRef.current) return
      const middle = window.scrollY + window.innerHeight / 2
      fillRef.current.style.height = `${Math.min(100, (middle / doc) * 100)}%`
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-y-0 left-1/2 z-30 hidden w-full max-w-6xl -translate-x-1/2 xl:block">
      {/* Sits well clear of the column — at 40px the rail read as attached to
          the content rather than as its own thing in the margin. 1280 is the
          exception: pushing out that far there would put the ticks off the
          left edge of the screen. */}
      <div className="absolute top-24 bottom-14 -left-9 w-px [@media(min-width:1440px)]:-left-16">
        {/* Track, then the part of it you've already passed. */}
        <span aria-hidden className="absolute inset-0 bg-ink-faint/30" />
        <span aria-hidden ref={fillRef} className="absolute top-0 left-0 w-px bg-signal/60" />

        {marks.map(({ id, label, pct }) => {
          const on = active === id
          return (
            <a
              key={id}
              href={`#${id}`}
              aria-current={on ? 'true' : undefined}
              /* py-2 only: the row is pinned by its right edge to the line, so
                 horizontal padding would drag the tick off it. */
              className="group pointer-events-auto absolute right-0 flex -translate-y-1/2 items-center gap-2.5 py-2"
              style={{ top: `${pct}%` }}
            >
              {/* Hidden below 2xl because there is nowhere for it to go — at
                  1440 the longest label runs off the left of the screen. */}
              <span
                className={`hidden font-mono text-[0.6rem] tracking-[0.16em] whitespace-nowrap text-signal uppercase transition-opacity duration-200 2xl:block ${
                  on ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                }`}
              >
                {label}
              </span>
              <span
                className={`h-px transition-all duration-200 ${
                  on
                    ? 'w-6 bg-signal'
                    : 'w-2.5 bg-ink-faint/65 group-hover:w-5 group-hover:bg-signal group-focus-visible:w-5 group-focus-visible:bg-signal'
                }`}
              />
            </a>
          )
        })}
      </div>

    </div>
  )
}

/**
 * Vertical type in the margins: a line down the left, the home pin's
 * coordinates down the right.
 *
 * Both read the way their side wants to be read — left margins bottom to top,
 * right margins top to bottom. The other direction on either side makes you
 * tilt your head the wrong way.
 *
 * Anchored to the viewport rather than to the content column, unlike the rail:
 * pinned to the column they drift inward as the window narrows, and the left
 * one finished 12px off the rail. At the edges the gaps only grow. They wait
 * for 1700px, which is where the rail's labels are clear of them.
 */
function MarginType() {
  return (
    <>
      {/* Carries real colour, but not extra weight — bold read as heavy-handed
          for a margin. At 0.6rem in ink-faint/70 it sat
          around 2.8:1 — the sort of thing you only notice once you're looking
          for it, which is not what a line down the margin is for. */}
      <span
        aria-hidden
        className="pointer-events-none fixed bottom-16 left-20 z-30 hidden rotate-180 font-mono text-[0.65rem] tracking-[0.28em] whitespace-nowrap text-ink-faint uppercase [writing-mode:vertical-rl] [@media(min-width:1700px)]:block"
      >
        {profile.quote}
      </span>

      <span
        aria-hidden
        className="pointer-events-none fixed top-32 right-8 z-30 hidden font-mono text-[0.6rem] tracking-[0.42em] whitespace-nowrap text-ink-faint/60 uppercase [writing-mode:vertical-rl] [@media(min-width:1700px)]:block"
      >
        {profile.coordinates}
      </span>
    </>
  )
}
