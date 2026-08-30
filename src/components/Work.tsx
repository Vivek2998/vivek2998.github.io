import { useRef, type ReactNode } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { Section } from './Section'
import { Reveal } from './Reveal'
import { accentVar, projects, type Project } from '../content'

/**
 * The second place 3D shows up: cards pitch and yaw toward the cursor.
 *
 * Written against the CSS transform directly rather than through animation
 * state, so the movement stays on the compositor and costs nothing per frame.
 */
function Tilt({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || reduced) return
    const rect = el.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateZ(0)`
    // Let the sheen follow the cursor too.
    el.style.setProperty('--mx', `${(px + 0.5) * 100}%`)
    el.style.setProperty('--my', `${(py + 0.5) * 100}%`)
  }

  const reset = () => {
    const el = ref.current
    if (el) el.style.transform = ''
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      className={`transition-transform duration-300 ease-out will-change-transform ${className}`}
    >
      {children}
    </div>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-hairline bg-surface/70 px-2.5 py-1 font-mono text-[0.68rem] text-ink-faint transition-colors group-hover:border-[color-mix(in_oklab,var(--accent)_35%,transparent)]">
      {children}
    </span>
  )
}

function ProjectLinks({ project }: { project: Project }) {
  if (!project.repo && !project.demo) {
    return (
      <span className="font-mono text-xs text-ink-faint">
        {project.private ? 'Private repository' : 'Not published'}
      </span>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {project.repo && (
        <a
          href={project.repo}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-[var(--accent)]"
        >
          Source
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden className="transition-transform group-hover:translate-x-px group-hover:-translate-y-px">
            <path d="M2.5 8.5 8.5 2.5M4 2.5h4.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </a>
      )}
      {project.demo && (
        <a
          href={project.demo}
          target="_blank"
          rel="noreferrer"
          className="text-accent group inline-flex items-center gap-1.5 font-mono text-xs transition-opacity hover:opacity-80"
        >
          Live
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden className="transition-transform group-hover:translate-x-px group-hover:-translate-y-px">
            <path d="M2.5 8.5 8.5 2.5M4 2.5h4.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </a>
      )}
    </div>
  )
}

function FeaturedCard({ project, step }: { project: Project; step: number }) {
  return (
    <Reveal step={step} as="article">
      <Tilt className="h-full">
        <div
          /* --accent drives the heading, border, badges and sheen together. */
          style={{ '--accent': accentVar(project.accent) } as React.CSSProperties}
          className="group glass accent-card accent-sheen relative flex h-full flex-col overflow-hidden p-7 transition-colors hover:accent-card-hover sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {project.name}
            </h3>
            <span className="shrink-0 font-mono text-xs text-ink-faint">
              {project.year}
            </span>
          </div>

          <p className="text-accent mt-3 text-[0.95rem] leading-relaxed">
            {project.blurb}
          </p>

          <p className="mt-4 text-sm leading-relaxed text-ink-muted text-pretty">
            {project.detail}
          </p>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {project.stack.map((tech) => (
              <Badge key={tech}>{tech}</Badge>
            ))}
          </div>

          {/* Grows to fill whatever slack the tallest card leaves, so the link
              rows share a baseline — with mt-7 as the floor when there's none. */}
          <div aria-hidden className="mt-7 flex-1" />

          <div className="border-t border-hairline pt-5">
            <ProjectLinks project={project} />
          </div>
        </div>
      </Tilt>
    </Reveal>
  )
}

function CompactRow({ project, step }: { project: Project; step: number }) {
  return (
    <Reveal step={step} as="article" className="h-full">
      <div
        style={{ '--accent': accentVar(project.accent) } as React.CSSProperties}
        className="panel accent-card accent-sheen group relative flex h-full flex-col p-6 transition-colors hover:accent-card-hover"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-lg font-medium tracking-tight">{project.name}</h3>
          <span className="font-mono text-xs text-ink-faint">{project.year}</span>
        </div>

        <p className="text-accent mt-2 text-sm text-pretty">{project.blurb}</p>

        {/* Smaller and quieter than the featured cards' copy, so these stay
            secondary while still getting to say what they are. */}
        <p className="mt-3 text-xs leading-relaxed text-ink-muted text-pretty">
          {project.detail}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.stack.map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>

        {/* Pushes the links to a shared baseline across the row. */}
        <div aria-hidden className="mt-5 flex-1" />

        <ProjectLinks project={project} />
      </div>
    </Reveal>
  )
}

export function Work() {
  const featured = projects.filter((p) => p.featured)
  const rest = projects.filter((p) => !p.featured)

  return (
    <Section
      id="work"
      accent="teal"
      index="02"
      title="Selected work"
      lead="Things I've built — from Linux images that ship on hardware to a physics engine for school students."
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {featured.map((project, i) => (
          <FeaturedCard key={project.name} project={project} step={i} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {rest.map((project, i) => (
          <CompactRow key={project.name} project={project} step={i} />
        ))}
      </div>
    </Section>
  )
}
