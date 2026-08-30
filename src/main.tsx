import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

/* Fonts are self-hosted rather than pulled from Google. Two third-party origins
   meant two extra DNS + TLS round trips in front of a render-blocking
   stylesheet — the single largest chunk of the delay before anything appeared.
   See fonts.css for why the faces are declared by hand. */
import './fonts.css'

import './index.css'
import App from './App.tsx'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

/* A production build ships the markup already rendered — see
   scripts/prerender.mjs — so it attaches to what's there. The dev server does
   no such pass and hands over an empty root; hydrating that would make React
   report a mismatch and rebuild the whole tree on every reload. */
if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
