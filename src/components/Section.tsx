import type { ReactNode } from 'react'
import { Reveal } from './Reveal'
import { accentVar, type Accent } from '../content'

type Props = {
  id: string
  index: string
  title: string
  lead?: string
  /** Tints the section number and its rule. Defaults to the primary accent. */
  accent?: Accent
  children: ReactNode
}

/**
 * Shared section chrome: a numbered monospace label, a heading, and an optional
 * lead paragraph. The numbering is what gives the page its instrument-panel feel.
 */
export function Section({ id, index, title, lead, accent = 'teal', children }: Props) {
  return (
    <section
      id={id}
      style={{ '--accent': accentVar(accent) } as React.CSSProperties}
      className="relative scroll-mt-24 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="text-accent font-mono text-xs tracking-[0.22em]">
              {index}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-[color-mix(in_oklab,var(--accent)_30%,var(--color-hairline))] to-transparent" />
          </div>

          <h2 className="mt-5 text-[clamp(1.9rem,4.5vw,2.9rem)] leading-tight font-semibold tracking-[-0.025em]">
            {title}
          </h2>

          {lead && (
            <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">
              {lead}
            </p>
          )}
        </Reveal>

        <div className="mt-12">{children}</div>
      </div>
    </section>
  )
}
