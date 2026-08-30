import type { ReactNode } from 'react'

type Common = {
  children: ReactNode
  /** Solid fill for the primary call to action, outline for the secondary one. */
  variant?: 'solid' | 'outline'
  className?: string
}

type Props = Common &
  (
    | ({ as?: 'a'; href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
    | ({ as: 'button'; href?: never } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  )

/**
 * The site's one button, rendered as either a link or a real <button>.
 *
 * The hover does three things at once instead of just scaling: a light sweep
 * crosses the face, the label slides left, and the arrow leaves to the right
 * while a second arrow arrives from the left to replace it. The two arrows are
 * the same glyph offset by one width, so the swap reads as one continuous
 * motion rather than a fade.
 */
export function ActionButton({
  children,
  variant = 'solid',
  className = '',
  as = 'a',
  ...rest
}: Props) {
  const solid = variant === 'solid'

  const classes = `group relative inline-flex items-center overflow-hidden rounded-full px-6 py-3 text-sm font-medium transition-[transform,border-color,color] duration-300 ease-out active:scale-[0.98] ${
    solid
      ? 'bg-signal text-surface-raised'
      : 'border border-hairline text-ink-muted hover:border-signal/50 hover:text-ink'
  } ${className}`

  const inner = (
    <>
      {/* Light sweep. Starts off the left edge, crosses on hover. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full ${
          solid ? 'via-white/30' : 'via-signal/10'
        }`}
      />

      <span className="relative flex items-center">
        <span className="transition-transform duration-300 ease-out group-hover:-translate-x-0.5">
          {children}
        </span>

        {/* One path, two subpaths, one stroke — a real arrow.

            Two earlier attempts were worse than the thing they replaced. The
            first crossfaded two whole arrows through a slot one arrow wide, so
            halfway through you saw the head of one beside the shaft of the
            other. The second built the arrow out of a div for the shaft and an
            SVG for the head so it could lengthen, which is two elements
            pretending to be one glyph and looks it.

            The motion is just travel now. The slot is fixed so nothing
            reflows, and overflow is clipped so the arrow slides under the
            button's edge rather than escaping it. */}
        <span aria-hidden className="ml-2 h-[15px] w-[18px] overflow-hidden">
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            className="transition-transform duration-300 ease-out group-hover:translate-x-[5px]"
          >
            <path
              d="M1.5 7.5h11M8.5 3.5l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </span>
      </span>
    </>
  )

  if (as === 'button') {
    const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>
    return (
      <button type="button" className={classes} {...buttonProps}>
        {inner}
      </button>
    )
  }

  const anchorProps = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>
  return (
    <a className={classes} {...anchorProps}>
      {inner}
    </a>
  )
}
