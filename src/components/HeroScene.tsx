import { useEffect, useRef } from 'react'
import { globePins, type GlobePin } from '../content'

type Vec = { x: number; y: number; z: number }

/** Even coverage of a sphere — the Fibonacci lattice, no clustering at the poles. */
function sphereLattice(count: number): Vec[] {
  const points: Vec[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const radius = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    points.push({ x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius })
  }
  return points
}

/** Geographic coordinates onto the unit sphere. Longitude 0 faces +z. */
function latLonToVec(lat: number, lon: number): Vec {
  const phi = (lat * Math.PI) / 180
  const lambda = (lon * Math.PI) / 180
  return {
    x: Math.cos(phi) * Math.sin(lambda),
    y: Math.sin(phi),
    z: Math.cos(phi) * Math.cos(lambda),
  }
}

/**
 * Wires each lattice point to its near neighbours.
 *
 * This is what gives the sphere its web of lines running in every direction,
 * rather than the strictly vertical meridians a lat/long graticule produces.
 * The sphere is rigid, so the pairs are found once at startup and only
 * re-projected per frame — a few hundred operations, not a search.
 */
function buildLinks(points: Vec[], maxChord: number): Array<[number, number]> {
  const links: Array<[number, number]> = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x
      const dy = points[i].y - points[j].y
      const dz = points[i].z - points[j].z
      if (Math.hypot(dx, dy, dz) < maxChord) links.push([i, j])
    }
  }
  return links
}

const POINT_COUNT = 150
/** Chord length below which two lattice points get wired together. */
const LINK_DISTANCE = 0.4
const AUTO_SPIN = 0.0014
/** How long after letting go before the globe starts turning on its own again. */
const IDLE_BEFORE_RESUME = 2200

export function HeroScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const lattice = sphereLattice(POINT_COUNT)
    const links = buildLinks(lattice, LINK_DISTANCE)
    const pinVectors = globePins.map((p) => latLonToVec(p.lat, p.lon))

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let radius = 0
    let frame = 0
    let running = false

    // Start with India toward the viewer, so the "you are here" pin is visible.
    let yaw = -1.35
    let pitch = -0.35
    let spinVelocity = 0
    let dragging = false
    let lastPointer = { x: 0, y: 0 }
    let lastInteraction = 0
    let hovered = -1
    // Screen positions from the last frame, for hit-testing the pins.
    let pinScreen: Array<{ x: number; y: number; front: boolean }> = []

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      radius = Math.min(width, height) * 0.36
    }

    const rotate = (v: Vec) => {
      const cosY = Math.cos(yaw)
      const sinY = Math.sin(yaw)
      const cosX = Math.cos(pitch)
      const sinX = Math.sin(pitch)
      const x1 = v.x * cosY - v.z * sinY
      const z1 = v.x * sinY + v.z * cosY
      const y2 = v.y * cosX - z1 * sinX
      const z2 = v.y * sinX + z1 * cosX
      return { x: x1, y: y2, z: z2 }
    }

    const project = (v: Vec) => {
      const r = rotate(v)
      // z runs -1..1, so the divisor stays comfortably positive.
      const scale = (1 / (2.6 - r.z)) * 2.6
      return {
        x: width / 2 + r.x * radius * scale,
        y: height / 2 + r.y * radius * scale,
        z: r.z,
        depth: (r.z + 1) / 2,
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      if (radius <= 0) return

      // Project every lattice point once, then reuse for links and dots.
      const projected = lattice.map(project)

      // The web. Lines run in every direction, and the far hemisphere's
      // clutter is dropped so the sphere still reads as solid.
      ctx.lineWidth = 1
      for (const [a, bIdx] of links) {
        const pa = projected[a]
        const pb = projected[bIdx]
        const depth = (pa.depth + pb.depth) / 2
        if (depth < 0.3) continue
        ctx.strokeStyle = `rgba(12, 122, 113, ${(depth - 0.3) * 0.5})`
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.stroke()
      }

      for (const p of projected) {
        if (p.z < 0) continue
        ctx.beginPath()
        ctx.arc(p.x, p.y, 0.6 + p.depth * 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(26, 24, 21, ${0.08 + p.depth * 0.24})`
        ctx.fill()
      }

      // Pins, back to front so nearer ones overlap the rest.
      pinScreen = pinVectors.map((v) => {
        const p = project(v)
        return { x: p.x, y: p.y, front: p.z > 0.06 }
      })

      const order = pinVectors
        .map((v, i) => ({ i, z: project(v).z }))
        .sort((a, b) => a.z - b.z)

      for (const { i, z } of order) {
        if (z <= 0.06) continue
        const pin = globePins[i]
        const s = pinScreen[i]
        const isHome = pin.home
        const active = hovered === i
        // Fade pins out as they approach the limb.
        const alpha = Math.min(1, (z - 0.06) * 4)

        const colour = isHome ? '107, 79, 224' : '201, 62, 99'
        const size = active ? 6 : isHome ? 5 : 4

        // Halo
        ctx.beginPath()
        ctx.arc(s.x, s.y, size * (active ? 3.2 : 2.4), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${colour}, ${alpha * (active ? 0.22 : 0.12)})`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(s.x, s.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${colour}, ${alpha})`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(s.x, s.y, size, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(250, 247, 241, ${alpha * 0.9})`
        ctx.lineWidth = 1.5
        ctx.stroke()

        drawLabel(pin, s.x, s.y, alpha, active)
      }
    }

    const drawLabel = (
      pin: GlobePin,
      x: number,
      y: number,
      alpha: number,
      active: boolean,
    ) => {
      // Only the hovered pin gets its place line; the rest show just a name so
      // six labels at once don't turn into soup.
      const lines = active ? [pin.label, pin.place] : [pin.label]
      if (!active && alpha < 0.55) return

      ctx.font =
        '500 12px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.textBaseline = 'middle'

      const widths = lines.map((l) => ctx.measureText(l).width)
      const boxW = Math.max(...widths) + 16
      const boxH = lines.length * 15 + 9
      // Flip the label to the left when it would run off the right edge.
      const flip = x + 14 + boxW > width
      const bx = flip ? x - 14 - boxW : x + 14
      const by = y - boxH / 2

      ctx.beginPath()
      ctx.roundRect(bx, by, boxW, boxH, 6)
      ctx.fillStyle = `rgba(250, 247, 241, ${alpha * (active ? 0.97 : 0.82)})`
      ctx.fill()
      ctx.strokeStyle = `rgba(226, 220, 207, ${alpha})`
      ctx.lineWidth = 1
      ctx.stroke()

      lines.forEach((line, i) => {
        ctx.fillStyle =
          i === 0
            ? `rgba(28, 26, 23, ${alpha})`
            : `rgba(107, 101, 91, ${alpha})`
        ctx.fillText(line, bx + 8, by + 12 + i * 15)
      })
    }

    const tick = () => {
      if (!running) return

      if (!dragging) {
        const idle = performance.now() - lastInteraction > IDLE_BEFORE_RESUME
        if (Math.abs(spinVelocity) > 0.00005) {
          yaw += spinVelocity
          spinVelocity *= 0.94 // inertia
        } else if (idle) {
          yaw += AUTO_SPIN
        }
      }

      draw()
      frame = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running || reduced) return
      running = true
      frame = requestAnimationFrame(tick)
    }

    const stop = () => {
      running = false
      cancelAnimationFrame(frame)
    }

    const localPoint = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const onPointerDown = (event: PointerEvent) => {
      dragging = true
      lastPointer = localPoint(event)
      lastInteraction = performance.now()
      spinVelocity = 0
      canvas.setPointerCapture(event.pointerId)
      canvas.style.cursor = 'grabbing'
    }

    const onPointerMove = (event: PointerEvent) => {
      const p = localPoint(event)

      if (dragging) {
        const dx = p.x - lastPointer.x
        const dy = p.y - lastPointer.y
        yaw += dx * 0.006
        // Clamp the tilt so the globe never flips past its poles.
        pitch = Math.max(-1.1, Math.min(1.1, pitch + dy * 0.005))
        spinVelocity = dx * 0.006
        lastPointer = p
        lastInteraction = performance.now()
        if (reduced) draw()
        return
      }

      // Hit-test the pins; nearest front-facing one within 18px wins.
      let best = -1
      let bestDistance = 18
      pinScreen.forEach((s, i) => {
        if (!s.front) return
        const d = Math.hypot(s.x - p.x, s.y - p.y)
        if (d < bestDistance) {
          bestDistance = d
          best = i
        }
      })

      if (best !== hovered) {
        hovered = best
        canvas.style.cursor = best >= 0 ? 'pointer' : 'grab'
        if (reduced) draw()
      }
    }

    const endDrag = (event: PointerEvent) => {
      if (!dragging) return
      dragging = false
      lastInteraction = performance.now()
      canvas.style.cursor = hovered >= 0 ? 'pointer' : 'grab'
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
    }

    const onPointerLeave = () => {
      hovered = -1
      canvas.style.cursor = 'grab'
      if (reduced) draw()
    }

    const onVisibility = () => (document.hidden ? stop() : start())

    resize()
    canvas.style.cursor = 'grab'

    const resizeObserver = new ResizeObserver(() => {
      resize()
      if (reduced || !running) draw()
    })
    resizeObserver.observe(canvas)

    // Don't burn frames once the hero is scrolled past.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    )
    io.observe(canvas)

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', endDrag)
    canvas.addEventListener('pointercancel', endDrag)
    canvas.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)

    if (reduced) draw()
    else start()

    return () => {
      stop()
      resizeObserver.disconnect()
      io.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', endDrag)
      canvas.removeEventListener('pointercancel', endDrag)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} aria-hidden className={className} />

      {/* The globe is decorative canvas, so its content is given to assistive
          tech in text form here. */}
      <p className="sr-only">
        An interactive globe marking companies I'd like to work with:{' '}
        {globePins
          .filter((p) => !p.home)
          .map((p) => `${p.label} in ${p.place}`)
          .join(', ')}
        . It also marks {globePins.find((p) => p.home)?.place.toLowerCase()},
        Gurugram, India.
      </p>
    </>
  )
}
