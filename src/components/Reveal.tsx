import { useEffect, useRef, type ReactNode } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

type Props = {
  children: ReactNode
  /** Stagger position — each step delays the reveal by 70ms. */
  step?: number
  className?: string
  as?: 'div' | 'li' | 'section' | 'article'
}

/**
 * Fades content up as it scrolls into view, once.
 *
 * Content is visible by default and only ever hidden by script, which matters
 * for two reasons: the prerendered HTML is readable before any JavaScript runs,
 * and anything already on screen at load is left completely alone. Hiding
 * above-the-fold content on mount just to fade it back in would undo the
 * prerender and make the page feel slower than it is.
 */
export function Reveal({ children, step = 0, className, as: Tag = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return

    // Already in view — leave it as it is rather than flashing it out.
    if (el.getBoundingClientRect().top < window.innerHeight) return

    el.dataset.reveal = 'pending'

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.dataset.reveal = 'in'
        observer.disconnect()
      },
      { rootMargin: '0px 0px -80px 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced])

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={className}
      style={step ? ({ '--reveal-delay': `${step * 70}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}
