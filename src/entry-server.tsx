import { renderToString } from 'react-dom/server'
import App from './App'

/**
 * Renders the whole page to a string at build time.
 *
 * The site is static content, so there's no reason for a visitor to wait on a
 * JavaScript bundle before any of it appears. This output is baked into
 * dist/index.html by scripts/prerender.mjs, and the client hydrates it.
 *
 * Effects never run here, so anything that touches the DOM — the globe canvas,
 * the scroll observers, the typewriter — is inert until hydration, which is
 * exactly what we want.
 */
export function render() {
  return renderToString(<App />)
}
