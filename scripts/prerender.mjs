import { readFile, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const indexPath = resolve(root, 'dist/index.html')
const ssrEntry = resolve(root, '.prerender/entry-server.js')

const { render } = await import(ssrEntry)
const appHtml = render()

const template = await readFile(indexPath, 'utf8')
const marker = '<div id="root"></div>'

if (!template.includes(marker)) {
  throw new Error(
    `prerender: could not find ${marker} in dist/index.html — the root element ` +
      `markup changed, so the rendered app has nowhere to go.`,
  )
}

await writeFile(
  indexPath,
  template.replace(marker, `<div id="root">${appHtml}</div>`),
  'utf8',
)

// The SSR bundle is a build artefact, not something to ship.
await rm(resolve(root, '.prerender'), { recursive: true, force: true })

const kb = (Buffer.byteLength(appHtml, 'utf8') / 1024).toFixed(1)
console.log(`prerendered ${kb} kB of markup into dist/index.html`)
