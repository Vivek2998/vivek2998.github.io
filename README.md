# vivek2998.github.io

My portfolio. **Live at [vivek2998.github.io](https://vivek2998.github.io/)**.

Built with React 19, Vite and Tailwind CSS v4. Light, on a warm
bone ground rather than plain white, with the heavier visual effects —
glassmorphism, aurora gradients, 3D — used as accents rather than as the whole
design.

## Editing the content

Everything you'd want to change — bio, timeline, projects, skills, links — lives in
a single file:

```
src/content.ts
```

The components read from it and hold no copy of their own, so you never need to dig
through JSX to fix a date or add a project.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check, build, then prerender into dist/
npm run preview  # serve the built output
```

Node 20+ required (Vite 8).

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and
publishes `dist/` to GitHub Pages. No manual step.

## How it's put together

| Path | Purpose |
| --- | --- |
| `src/content.ts` | All site copy and data |
| `src/index.css` | Design tokens, base styles, the `panel` / `glass` / `hairline-grid` utilities |
| `src/components/Aurora.tsx` | Drifting background gradients + grid — the only source of the "glass" look |
| `src/components/HeroScene.tsx` | The draggable globe — hand-rolled 3D projection on a 2D canvas |
| `src/landMask.ts` | Generated land/sea bitmask — rebuild with `scripts/build-land-mask.py` |
| `src/components/Reveal.tsx` | Scroll-into-view animation wrapper |
| `src/components/Section.tsx` | Shared numbered section chrome |
| `src/components/ContactForm.tsx` | The form that swaps in for the social links |

### On the 3D

The hero globe projects a graticule, a point lattice and a handful of location pins
by hand on a 2D canvas rather than pulling in a 3D library — Three.js would have cost
roughly 600 kB to spin a sphere. Drag to rotate; it carries inertia, and picks the
auto-spin back up once you've left it alone. Pins sit at real coordinates, and a
faint land layer — sampled from a 1-degree bitmask baked in at build time — puts
them on recognisable ground. That layer is kept deliberately sparse: dense enough
for solid coastlines and it stops being a wireframe. It pauses when scrolled out of view or
when the tab is hidden, and renders a single static frame under
`prefers-reduced-motion`. The pins are listed in text for screen readers, since the
canvas itself says nothing.

### On speed

The page is prerendered to static HTML at build time (`src/entry-server.tsx` +
`scripts/prerender.mjs`) and the client hydrates it, so the text is on screen
before the bundle has finished downloading. Fonts are self-hosted, latin subset
only. There's no animation library — the scroll reveals, the nav pill and the
panel swaps are CSS, which is why `Reveal` only ever hides things that are
off-screen: hiding prerendered content on mount would give the work back.

Measured on a throttled connection (4 Mbps, 150 ms RTT, 4x CPU slowdown),
first contentful paint went from ~1.8 s to ~0.7 s.

### On the contact form

GitHub Pages is static, so it cannot send mail. `contactForm.endpoint` in
`src/content.ts` is empty by default and the form falls back to composing a
`mailto:` — it works with no service at all. Point it at a Formspree or Web3Forms
endpoint to have submissions delivered instead.

## Previous version

The original 2023 site, hand-written with no build step, is archived at
[Vivek2998/personal_portfolio](https://github.com/Vivek2998/personal_portfolio)
(tag `v1.0-original`) and still live
[here](https://vivek2998.github.io/personal_portfolio/).
