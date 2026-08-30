import { sections } from '../content'
import { useActiveSection } from '../hooks/useActiveSection'

/**
 * A vertical rail down the left margin.
 *
 * Wide screens leave a lot of empty space either side of the 1152px column and
 * the left half of it was doing nothing. This gives that space a job: a
 * hairline running the full height with a tick per section, and the name of
 * whichever one you're in.
 *
 * Everything grows leftward from the line, into the margin — an earlier version
 * ran the labels inward and they landed 22px on top of the content. Only the
 * active label is drawn, so the rail stays narrow enough to sit in the gap
 * without crowding it, and it only appears from 1440px up, which is the first
 * width with room for it.
 *
 * Decorative, and marked as such: the nav already offers these jumps, so
 * repeating them would just read the list to a screen reader twice.
 */
export function SideRail() {
  const active = useActiveSection()

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-y-0 left-1/2 z-30 hidden w-full max-w-6xl -translate-x-1/2 [@media(min-width:1440px)]:block"
    >
      <div className="absolute inset-y-0 -left-10 w-px">
        {/* Faded at both ends so it reads as continuing past the screen rather
            than stopping at it. */}
        <span className="absolute inset-0 bg-gradient-to-b from-transparent via-hairline to-transparent" />

        <ul className="absolute top-1/2 right-0 flex -translate-y-1/2 flex-col items-end gap-6">
          {sections.map(({ id, label }) => {
            const on = active === id
            return (
              <li key={id} className="flex items-center gap-2.5">
                <span
                  className={`font-mono text-[0.6rem] tracking-[0.16em] whitespace-nowrap text-signal uppercase transition-opacity duration-300 ${
                    on ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {label}
                </span>
                <span
                  className={`h-px transition-all duration-300 ${
                    on ? 'w-6 bg-signal' : 'w-2.5 bg-ink-faint/40'
                  }`}
                />
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
