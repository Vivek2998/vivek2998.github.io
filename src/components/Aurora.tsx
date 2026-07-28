/**
 * The aurora accent: three slow-drifting colour fields behind a hairline grid.
 *
 * This is the only place the "glass" look comes from — the glass cards
 * elsewhere are transparent, so they only read as glass when they sit over
 * this. Pure CSS, no canvas, so it costs nothing on the main thread.
 *
 * On the bone ground the washes stay low: enough to tint the paper and give the
 * blurred surfaces something to pick up, never enough to fight body text.
 */
export function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Colour fields */}
      <div className="absolute -top-1/3 -left-1/4 h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(circle,var(--color-signal-deep)_0%,transparent_62%)] opacity-[0.16] blur-3xl animate-drift" />
      <div
        className="absolute top-1/4 -right-1/4 h-[62vmax] w-[62vmax] rounded-full bg-[radial-gradient(circle,var(--color-pulse)_0%,transparent_62%)] opacity-[0.11] blur-3xl animate-drift"
        style={{ animationDelay: '-8s', animationDuration: '30s' }}
      />
      <div
        className="absolute -bottom-1/4 left-1/3 h-[54vmax] w-[54vmax] rounded-full bg-[radial-gradient(circle,var(--color-hue-amber)_0%,transparent_65%)] opacity-[0.15] blur-3xl animate-drift"
        style={{ animationDelay: '-16s', animationDuration: '38s' }}
      />

      {/* Hairline grid, faded out toward the edges */}
      <div
        className="absolute inset-0 hairline-grid opacity-70"
        style={{
          maskImage:
            'radial-gradient(ellipse 90% 70% at 50% 40%, black 20%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 70% at 50% 40%, black 20%, transparent 78%)',
        }}
      />

      {/* Settles the edges back to plain paper so the washes never reach the
          rim of the viewport. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,var(--color-paper)_96%)]" />
    </div>
  )
}
