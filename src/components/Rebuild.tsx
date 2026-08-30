import { useState } from 'react'
import { Section } from './Section'
import { Reveal } from './Reveal'
import { accentVar, rebuild, type Accent } from '../content'

/**
 * Before/after wipe.
 *
 * The drag is a real <input type="range"> stretched over the whole frame rather
 * than pointer handlers on a div — that way it comes with keyboard and touch
 * support already working, instead of being mouse-only.
 */
function Compare() {
  const [position, setPosition] = useState(50)
  const { before, after } = rebuild

  return (
    <figure className="group relative aspect-[1280/800] w-full overflow-hidden rounded-panel border border-hairline bg-surface select-none">
      {/* Both images carry alt="" and the description lives in the caption
          below instead. An <img> that hasn't arrived yet renders its alt text,
          and two sentences of it sprawling across the frame — overlapping,
          since both are absolutely positioned — reads as a broken page rather
          than a loading one. Empty alt means the gap is just the panel's own
          background until the picture lands. */}
      <img
        src={after.image}
        alt=""
        width={1280}
        height={800}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-top"
      />

      {/* 2023 on top, revealed from the left up to the handle. */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={before.image}
          alt=""
          width={1280}
          height={800}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </div>

      <figcaption className="sr-only">
        A slider comparing two versions of this site. On the left, {before.alt}{' '}
        On the right, {after.alt}
      </figcaption>

      {/* Year labels, each fading out as the handle passes over it. */}
      <span
        className="pointer-events-none absolute top-3 left-3 rounded-full bg-paper/70 px-3 py-1 font-mono text-[0.7rem] tracking-wide text-ink backdrop-blur-sm transition-opacity sm:top-4 sm:left-4"
        style={{ opacity: position < 16 ? 0 : 1 }}
      >
        {before.year} · {before.caption}
      </span>
      <span
        className="text-accent pointer-events-none absolute top-3 right-3 rounded-full bg-paper/70 px-3 py-1 font-mono text-[0.7rem] tracking-wide backdrop-blur-sm transition-opacity sm:top-4 sm:right-4"
        style={{ opacity: position > 84 ? 0 : 1 }}
      >
        {after.year} · {after.caption}
      </span>

      {/* Divider + grip — tinted by the section's accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[var(--accent)]"
        style={{ left: `${position}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--accent)] bg-paper shadow-[0_0_24px_color-mix(in_oklab,var(--accent)_50%,transparent)]">
          <svg width="18" height="18" viewBox="0 0 18 18" className="text-accent">
            <path
              d="M7 5 4 9l3 4M11 5l3 4-3 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label={`Reveal the ${before.year} site on the left, the ${after.year} site on the right`}
        className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0"
      />
    </figure>
  )
}

export function Rebuild() {
  const { before, after, note } = rebuild

  return (
    <Section
      id="rebuild"
      accent="amber"
      index="03"
      title="Then and now"
      lead={rebuild.lead}
    >
      <Reveal>
        <Compare />
      </Reveal>

      <p className="mt-4 text-center font-mono text-xs text-ink-faint">
        Drag the handle — or focus it and use the arrow keys
      </p>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {([
          [before, 'azure'],
          [after, 'teal'],
        ] as Array<[typeof before | typeof after, Accent]>).map(([side, hue], i) => (
          <Reveal key={side.year} step={i}>
            <div
              style={{ '--accent': accentVar(hue) } as React.CSSProperties}
              className="panel accent-card h-full p-6 sm:p-7"
            >
              <p className="text-accent font-mono text-xs tracking-[0.18em] uppercase">
                {side.year} · {side.caption}
              </p>
              <p className="mt-4 leading-relaxed text-ink-muted text-pretty">
                {side.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal step={2}>
        <div className="glass mt-5 p-6 sm:p-8">
          <h3 className="text-accent font-mono text-xs tracking-[0.18em] uppercase">
            {note.title}
          </h3>
          <p className="mt-4 leading-relaxed text-ink-muted text-pretty">
            {note.body}
          </p>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink text-pretty">
            {note.punchline}
          </p>

          <a
            href="https://vivek2998.github.io/personal_portfolio/"
            target="_blank"
            rel="noreferrer"
            className="group mt-7 inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-[var(--accent)]"
          >
            Visit the 2023 site — still live
            <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden className="transition-transform group-hover:translate-x-px group-hover:-translate-y-px">
              <path d="M2.5 8.5 8.5 2.5M4 2.5h4.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </a>
        </div>
      </Reveal>
    </Section>
  )
}
