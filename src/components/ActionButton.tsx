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

        {/* One arrow that lengthens, drawn as a shaft plus a separate head.

            It used to be two whole arrows crossfading through a slot exactly
            one arrow wide. Halfway through, the outgoing arrow's shaft sat in
            the right half of the slot while the incoming arrow's head sat in
            the left half — so you read a head, then a shaft, and it looked
            like two arrows rather than one moving.

            The shaft scales from its left edge by 4px and the head travels the
            same 4px, so they stay joined and there is only ever one arrow. The
            slot is wide enough for the grown state, so nothing reflows. */}
        <span aria-hidden className="ml-2 flex h-[15px] w-[20px] items-center">
          <span className="h-[1.6px] w-[10px] origin-left rounded-full bg-current transition-transform duration-300 ease-out group-hover:scale-x-[1.4]" />
          <svg
            width="7"
            height="11"
            viewBox="0 0 7 11"
            className="-ml-px shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-[4px]"
          >
            <path
              d="M1 1l4.6 4.5L1 10"
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
