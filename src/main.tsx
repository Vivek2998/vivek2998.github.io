import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'

/* Fonts are self-hosted rather than pulled from Google. Two third-party origins
   meant two extra DNS + TLS round trips in front of a render-blocking
   stylesheet — the single largest chunk of the delay before anything appeared.
   See fonts.css for why the faces are declared by hand. */
import './fonts.css'

import './index.css'
import App from './App.tsx'

/* The markup is already in the HTML — see scripts/prerender.mjs — so this
   attaches to it rather than rebuilding it. */
hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <App />
  </StrictMode>,
)
