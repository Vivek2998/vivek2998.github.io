import { useEffect, useRef } from 'react'

type Point = { x: number; y: number; z: number }

/** Even coverage of a sphere — the Fibonacci lattice, no clustering at the poles. */
function sphereLattice(count: number): Point[] {
  const points: Point[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const radius = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    points.push({ x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius })
  }
  return points
}

const POINT_COUNT = 132
/** Chord length below which two lattice points get wired together. */
const LINK_DISTANCE = 0.42

/**
 * A slowly rotating point-sphere, drawn with hand-rolled 3D projection on a 2D
 * canvas.
 *
 * Three.js would be ~600 kB for what amounts to rotating 132 points, so the
 * maths is inline instead. Because the sphere is rigid, the links between
 * points never change — they are computed once and only re-projected per frame,
 * which keeps the loop to a few hundred operations.
 */
export function HeroScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const points = sphereLattice(POINT_COUNT)

    // Rigid body: wire up neighbours once rather than every frame.
    const links: Array<[number, number]> = []
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x
        const dy = points[i].y - points[j].y
        const dz = points[i].z - points[j].z
        if (Math.hypot(dx, dy, dz) < LINK_DISTANCE) links.push([i, j])
      }
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let radius = 0
    let frame = 0
    let running = true
    // Rotation carries on across pauses so the sphere never snaps back.
    let angle = reduced ? 0.6 : 0
    let pointerX = 0
    let pointerY = 0
    let tiltX = 0
    let tiltY = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      radius = Math.min(width, height) * 0.38
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      if (radius <= 0) return

      const cx = width / 2
      const cy = height / 2

      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)
      const cosT = Math.cos(tiltX)
      const sinT = Math.sin(tiltX)

      // Project every point once, then reuse for links and dots.
      const projected = points.map((p) => {
        // Yaw about Y, then a small pitch about X driven by the pointer.
        const x1 = p.x * cosA - p.z * sinA
        const z1 = p.x * sinA + p.z * cosA
        const y2 = p.y * cosT - z1 * sinT
        const z2 = p.y * sinT + z1 * cosT

        // Perspective divide: z2 runs -1..1, so the divisor stays comfortably > 0.
        const scale = 1 / (2.6 - z2)
        return {
          x: cx + x1 * radius * scale * 2.6 + tiltY * 18,
          y: cy + y2 * radius * scale * 2.6,
          depth: (z2 + 1) / 2, // 0 = far, 1 = near
        }
      })

      // Links first, so the dots sit on top.
      ctx.lineWidth = 1
      for (const [a, b] of links) {
        const pa = projected[a]
        const pb = projected[b]
        const depth = (pa.depth + pb.depth) / 2
        if (depth < 0.28) continue // hide the far hemisphere's clutter
        ctx.strokeStyle = `rgba(56, 225, 212, ${(depth - 0.28) * 0.30})`
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.stroke()
      }

      for (const p of projected) {
        const size = 0.7 + p.depth * 2.0
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        // Near points warm toward violet, far points stay cyan and dim.
        const mix = Math.round(124 * p.depth)
        ctx.fillStyle = `rgba(${56 + mix * 0.4}, ${225 - mix * 0.5}, ${212 + mix * 0.3}, ${
          0.15 + p.depth * 0.75
        })`
        ctx.fill()
      }
    }

    const tick = () => {
      if (!running) return
      angle += 0.0016
      // Ease the pointer tilt so it glides rather than tracks exactly.
      tiltX += (pointerY * 0.32 - tiltX) * 0.045
      tiltY += (pointerX - tiltY) * 0.045
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

    const onPointerMove = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth) * 2 - 1
      pointerY = (event.clientY / window.innerHeight) * 2 - 1
    }

    const onVisibility = () => (document.hidden ? stop() : start())

    resize()
    const resizeObserver = new ResizeObserver(() => {
      resize()
      if (reduced) draw()
    })
    resizeObserver.observe(canvas)

    // Stop burning frames when the hero is scrolled past.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    )
    io.observe(canvas)

    if (reduced) {
      running = false
      draw()
    } else {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.addEventListener('visibilitychange', onVisibility)
      frame = requestAnimationFrame(tick)
    }

    return () => {
      stop()
      resizeObserver.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      /* Sized by CSS; the effect syncs the backing store to match. */
    />
  )
}
