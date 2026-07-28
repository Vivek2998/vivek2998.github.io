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
        <span className="transition-transform duration-300 ease-out group-hover:-translate-x-1">
          {children}
        </span>

        {/* Fixed-width slot so the swapping arrows never shift the label. */}
        <span className="relative ml-2 h-[15px] w-[15px] overflow-hidden">
          <Arrow className="absolute inset-0 transition-transform duration-300 ease-out group-hover:translate-x-full" />
          <Arrow className="absolute inset-0 -translate-x-full transition-transform duration-300 ease-out group-hover:translate-x-0" />
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

function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden className={className}>
      <path
        d="M2 7.5h10M8 3.5l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
