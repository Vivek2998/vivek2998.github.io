# vivek2998.github.io

My portfolio. **Live at [vivek2998.github.io](https://vivek2998.github.io/)**.

Built with React 19, Vite, Tailwind CSS v4 and Framer Motion. Dark-first, with the
heavier visual effects — glassmorphism, aurora gradients, 3D — used as accents
rather than as the whole design.

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
npm run build    # type-check + production build into dist/
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
| `src/components/HeroScene.tsx` | Rotating point-sphere, hand-rolled 3D projection on a 2D canvas |
| `src/components/Reveal.tsx` | Scroll-into-view animation wrapper |
| `src/components/Section.tsx` | Shared numbered section chrome |

### On the 3D

The hero sphere is ~130 points projected by hand rather than by a 3D library —
Three.js would have cost roughly 600 kB to rotate a few points. Because the sphere is
rigid, the links between points are computed once at startup and only re-projected
each frame. It pauses when scrolled out of view or when the tab is hidden, and
renders a single static frame when `prefers-reduced-motion` is set.

## Previous version

The original 2023 site, hand-written without a framework, is archived at
[Vivek2998/personal_portfolio](https://github.com/Vivek2998/personal_portfolio)
(tag `v1.0-original`) and still live
[here](https://vivek2998.github.io/personal_portfolio/).
