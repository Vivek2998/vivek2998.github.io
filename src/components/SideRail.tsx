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
 * Decorative, and marked as such: the nav already offers these jumps, so
 * repeating them would only read the same list to a screen reader twice.
 */
export function SideRail() {
  return (
    <>
      <Rail />
      <Coordinates />
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
    <div
      aria-hidden
      className="pointer-events-none fixed inset-y-0 left-1/2 z-30 hidden w-full max-w-6xl -translate-x-1/2 xl:block"
    >
      {/* Sits well clear of the column — at 40px the rail read as attached to
          the content rather than as its own thing in the margin. 1280 is the
          exception: pushing out that far there would put the ticks off the
          left edge of the screen. */}
      <div className="absolute top-24 bottom-14 -left-9 w-px [@media(min-width:1440px)]:-left-16">
        {/* Track, then the part of it you've already passed. */}
        <span className="absolute inset-0 bg-ink-faint/30" />
        <span ref={fillRef} className="absolute top-0 left-0 w-px bg-signal/60" />

        {marks.map(({ id, label, pct }) => {
          const on = active === id
          return (
            <div
              key={id}
              className="absolute right-0 flex -translate-y-1/2 items-center gap-2.5"
              style={{ top: `${pct}%` }}
            >
              <span
                className={`hidden font-mono text-[0.6rem] tracking-[0.16em] whitespace-nowrap text-signal uppercase transition-opacity duration-300 2xl:block ${
                  on ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {label}
              </span>
              <span
                className={`h-px transition-all duration-300 ${
                  on ? 'w-6 bg-signal' : 'w-2.5 bg-ink-faint/65'
                }`}
              />
            </div>
          )
        })}
      </div>

    </div>
  )
}

/**
 * Vertical type at the far edge of the left margin.
 *
 * Reads bottom to top, the convention for a left-hand margin — the other
 * direction makes you tilt your head the wrong way.
 *
 * Anchored to the viewport rather than to the content column, unlike the rail:
 * pinned to the column it moved inward as the window narrowed and ended up
 * 12px from the rail. Here it stays at the edge and the gap between the two
 * only ever grows. It waits for 1700px, which is where the rail's labels are
 * clear of it.
 */
function Coordinates() {
  return (
    <span
      aria-hidden
      className="pointer-events-none fixed bottom-16 left-8 z-30 hidden font-mono text-[0.6rem] tracking-[0.42em] whitespace-nowrap text-ink-faint/70 uppercase [writing-mode:vertical-rl] [@media(min-width:1700px)]:block"
    >
      <span className="rotate-180 [writing-mode:vertical-rl]">
        {profile.coordinates}
      </span>
    </span>
  )
}
