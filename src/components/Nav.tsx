import { useCallback, useEffect, useRef, useState } from 'react'
import { profile, sections } from '../content'

export function Nav() {
  const [active, setActive] = useState<string>(sections[0].id)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  // Highlight whichever section currently owns the middle of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    )

    for (const { id } of sections) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  /* The sliding pill is a single positioned element measured against the active
     link, rather than an animation library laying out a shared element. */
  const measurePill = useCallback(() => {
    const list = listRef.current
    if (!list) return
    const target = list.querySelector<HTMLElement>(`[data-nav="${active}"]`)
    if (!target) return
    setPill({ left: target.offsetLeft, width: target.offsetWidth })
  }, [active])

  useEffect(() => {
    measurePill()
  }, [measurePill])

  useEffect(() => {
    window.addEventListener('resize', measurePill)
    return () => window.removeEventListener('resize', measurePill)
  }, [measurePill])

  // Re-measure once the webfont swaps in, since it changes label widths.
  useEffect(() => {
    document.fonts?.ready.then(measurePill).catch(() => {})
  }, [measurePill])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Keep the page from scrolling behind the open mobile sheet.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-lg focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-hairline bg-paper/75 backdrop-blur-xl'
            : 'border-b border-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <a
            href="#home"
            className="group font-mono text-sm tracking-tight text-ink"
            aria-label={`${profile.name} — home`}
          >
            <span className="text-signal">~/</span>
            <span className="text-ink-muted transition-colors group-hover:text-ink">
              vivek
            </span>
          </a>

          <ul ref={listRef} className="relative hidden items-center gap-1 md:flex">
            {pill && (
              <span
                aria-hidden
                className="absolute top-0 bottom-0 -z-10 rounded-full border border-signal/30 bg-signal/8 transition-[transform,width] duration-300 ease-out"
                style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
              />
            )}

            {sections.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  data-nav={id}
                  aria-current={active === id ? 'true' : undefined}
                  className={`block rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    active === id ? 'text-ink' : 'text-ink-faint hover:text-ink-muted'
                  }`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="relative z-60 flex h-10 w-10 items-center justify-center rounded-lg border border-hairline text-ink-muted transition-colors hover:text-ink md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path
                d={open ? 'M4 4 L14 14 M14 4 L4 14' : 'M2 5h14M2 12h14'}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </nav>
      </header>

      {/* Kept mounted and toggled with opacity/visibility so the transition
          doesn't need an animation library to handle the exit. */}
      <div
        id="mobile-nav"
        className={`fixed inset-0 z-55 bg-paper/96 backdrop-blur-2xl transition-[opacity,visibility] duration-200 md:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <ul className="flex h-full flex-col items-center justify-center gap-2">
          {sections.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={() => setOpen(false)}
                tabIndex={open ? undefined : -1}
                className={`block px-6 py-3 text-2xl transition-colors ${
                  active === id ? 'text-signal' : 'text-ink-muted'
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
