import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Stagger position — each step delays the reveal by 70ms. */
  step?: number
  className?: string
  as?: 'div' | 'li' | 'section' | 'article'
}

/**
 * Fades content up as it scrolls into view, once. When the visitor prefers
 * reduced motion the content is simply present from the start.
 */
export function Reveal({ children, step = 0, className, as = 'div' }: Props) {
  const reduced = useReducedMotion()
  const Component = motion[as]

  if (reduced) {
    const Plain = as
    return <Plain className={className}>{children}</Plain>
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.6,
        delay: step * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </Component>
  )
}
