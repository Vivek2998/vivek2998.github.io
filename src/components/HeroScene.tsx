import { useEffect, useRef } from 'react'
import { globePins, type GlobePin } from '../content'
import { isLand } from '../landMask'

type Vec = { x: number; y: number; z: number }

/**
 * Land points, so the sphere is recognisably Earth and the pins sit on the
 * countries they belong to.
 *
 * A dense Fibonacci lattice — even coverage, no clustering at the poles —
 * generated in lat/lon and sampled against the land mask. Going through
 * latLonToVec rather than placing the point directly is deliberate: the
 * lattice's own angle is measured from a different axis than a longitude is,
 * so deriving one from the other silently rotates every continent away from
 * the pins.
 */
function landPoints(candidates: number): Vec[] {
  const points: Vec[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < candidates; i++) {
    const y = 1 - (i / (candidates - 1)) * 2
    const lat = (Math.asin(y) * 180) / Math.PI
    // Wrap the running angle into -180..180.
    const lon = ((((golden * i * 180) / Math.PI + 180) % 360) + 360) % 360 - 180

    if (isLand(lat, lon)) points.push(latLonToVec(lat, lon))
  }
  return points
}

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

/** The airy wireframe the sphere is built from. */
const POINT_COUNT = 150
/** Chord length below which two lattice points get wired together. */
const LINK_DISTANCE = 0.4
/* Candidates sampled for the land layer; about a third land on land.
   Kept low on purpose. This layer exists so the pins sit on recognisable
   ground, not to render the Earth — pushed dense enough for solid coastlines
   it stops being a wireframe and turns into a dotted globe, which is not what
   this is. The mesh stays the thing you see. */
const LAND_SAMPLES = 9000
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
    const land = landPoints(LAND_SAMPLES)
    const pinVectors = globePins.map((p) => latLonToVec(p.lat, p.lon))

    /* Land is drawn in a handful of fixed shades rather than a unique colour
       per point. Assigning ctx.fillStyle means building a string and parsing a
       CSS colour, and doing that a few thousand times a frame was the single
       biggest cost in here — bucketing turns it into one assignment and one
       fill() per shade. The scratch arrays are allocated once. */
    const SHADES = 10
    const SHADE_ALPHA_MIN = 0.03
    const SHADE_ALPHA_RANGE = 0.42
    const SHADE_STYLES = Array.from({ length: SHADES }, (_, i) => {
      const alpha = SHADE_ALPHA_MIN + ((i + 0.5) / SHADES) * SHADE_ALPHA_RANGE
      return `rgba(11, 105, 99, ${alpha.toFixed(3)})`
    })
    const landX = new Float32Array(land.length)
    const landY = new Float32Array(land.length)
    const landSize = new Float32Array(land.length)
    const landShade = new Uint8Array(land.length)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let radius = 0
    let frame = 0
    let running = false

    /* Start with India toward the viewer, so the "you are here" pin is visible.
       Yaw equals the target longitude in radians — a point at longitude L ends
       up nearest the camera when the yaw matches it, which is why the sign
       matters. Gurugram is 77.03E. Pitch tilts the north pole toward us by
       about 24 degrees, which is the angle a globe on a stand sits at. */
    let yaw = (globePins.find((p) => p.home)?.lon ?? 0) * (Math.PI / 180)
    let pitch = 0.42
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

    /* Rotation is the same for every point in a frame, so the four values are
       computed once in draw() rather than per point — at a few thousand points
       that was twenty thousand trig calls a frame. */
    let cosY = 1
    let sinY = 0
    let cosX = 1
    let sinX = 0

    const syncRotation = () => {
      cosY = Math.cos(yaw)
      sinY = Math.sin(yaw)
      cosX = Math.cos(pitch)
      sinX = Math.sin(pitch)
    }

    const rotate = (v: Vec) => {
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
        // Negated: latitude runs north-positive but canvas y runs downward, so
        // without this the globe renders upside down.
        y: height / 2 - r.y * radius * scale,
        z: r.z,
        depth: (r.z + 1) / 2,
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      if (radius <= 0) return
      syncRotation()

      /* No fill of any kind.
         An earlier pass shaded the disc to fake volume and it turned the globe
         into a frosted marble. The sphere should stay something you look
         through — that transparency is the whole character of it. */

      // Project the wireframe once, then reuse for links and vertices.
      const projected = lattice.map(project)

      /* The mesh is the subject. Everything else on the sphere is set below it
         so this stays what you actually see. */
      ctx.lineWidth = 1
      for (const [a, bIdx] of links) {
        const pa = projected[a]
        const pb = projected[bIdx]
        const depth = (pa.depth + pb.depth) / 2
        if (depth < 0.3) continue
        ctx.strokeStyle = `rgba(12, 122, 113, ${(depth - 0.3) * 0.62})`
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.stroke()
      }

      for (const p of projected) {
        if (p.z < 0) continue
        ctx.beginPath()
        ctx.arc(p.x, p.y, 0.6 + p.depth * 1.6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(26, 24, 21, ${0.08 + p.depth * 0.24})`
        ctx.fill()
      }

      /* Land. Carried stronger than the mesh so the continents are what you
         actually read, and kept on the far side too — seeing the back of the
         world through the front is what sells it as a globe rather than a disc.

         A small globe doesn't have the pixels to resolve this many points, so
         it thins them out instead of drawing thousands into the same spot. */
      /* Thin the points out where the extra density buys nothing: below the lg
         breakpoint the globe isn't draggable and sits at reduced opacity, so
         it's decoration, and phones are exactly where the frame budget is
         tightest. */
      const decorative = window.innerWidth < 1024
      const stride = decorative ? 3 : radius < 185 ? 2 : 1

      const halfW = width / 2
      const halfH = height / 2
      let visible = 0

      for (let i = 0; i < land.length; i += stride) {
        // Projection inlined: project() allocates a result object, and a few
        // thousand short-lived objects a frame is pure GC churn.
        const v = land[i]
        const x1 = v.x * cosY - v.z * sinY
        const z1 = v.x * sinY + v.z * cosY
        const y2 = v.y * cosX - z1 * sinX
        const z2 = v.y * sinX + z1 * cosX

        const scale = (1 / (2.6 - z2)) * 2.6 * radius
        const t = (z2 + 1) / 2
        const near = z2 > 0
        const alpha = near ? 0.12 + t * 0.32 : 0.03 + t * 0.05

        landX[visible] = halfW + x1 * scale
        landY[visible] = halfH - y2 * scale
        landSize[visible] = near ? 0.9 + t * 0.9 : 0.8
        landShade[visible] = Math.min(
          SHADES - 1,
          Math.max(
            0,
            Math.floor(((alpha - SHADE_ALPHA_MIN) / SHADE_ALPHA_RANGE) * SHADES),
          ),
        )
        visible++
      }

      // Rectangles rather than arcs: at a couple of pixels the shape is
      // indistinguishable, and rect() batches into one path per shade.
      for (let shade = 0; shade < SHADES; shade++) {
        let started = false
        for (let i = 0; i < visible; i++) {
          if (landShade[i] !== shade) continue
          if (!started) {
            ctx.beginPath()
            started = true
          }
          const s = landSize[i]
          ctx.rect(landX[i] - s / 2, landY[i] - s / 2, s, s)
        }
        if (started) {
          ctx.fillStyle = SHADE_STYLES[shade]
          ctx.fill()
        }
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
