import { AU_KM } from './solarSystemData'

// Minimum visual radius in pixels so small bodies remain visible
const MIN_VISUAL_RADIUS = 2
const STAR_COUNT = 600

let stars = null

function initStars() {
  stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * 4000 - 2000,
    y: Math.random() * 4000 - 2000,
    brightness: Math.random() * 0.7 + 0.3,
    size: Math.random() * 1.5 + 0.5,
  }))
}

export function render(ctx, canvas, state, camera) {
  if (!stars) initStars()

  const { width, height } = canvas
  const cx = width / 2
  const cy = height / 2

  // Clear to space black
  ctx.fillStyle = '#000008'
  ctx.fillRect(0, 0, width, height)

  // Draw starfield (parallax at 5% of camera movement)
  const parallax = 0.05
  ctx.save()
  for (const star of stars) {
    const sx = ((star.x - camera.x * parallax * camera.zoom * 100) % width + width) % width
    const sy = ((star.y - camera.y * parallax * camera.zoom * 100) % height + height) % height
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`
    ctx.beginPath()
    ctx.arc(sx, sy, star.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // World-to-screen transform
  // camera.x, camera.y are in AU; camera.zoom is pixels per AU
  function toScreen(wx, wy) {
    return {
      sx: cx + (wx - camera.x) * camera.zoom,
      sy: cy + (wy - camera.y) * camera.zoom,
    }
  }

  // Draw orbit paths
  ctx.save()
  for (const body of state.bodies) {
    if (body.orbitRadius === 0) continue
    const { sx, sy } = toScreen(0, 0)
    const orbitPx = body.orbitRadius * camera.zoom
    if (orbitPx < 2) continue // too small to see
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(sx, sy, orbitPx, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()

  // Draw bodies
  for (const body of state.bodies) {
    const { sx, sy } = toScreen(body.px, body.py)

    // Skip if far off screen
    if (sx < -200 || sx > width + 200 || sy < -200 || sy > height + 200) {
      // Draw indicator arrow at edge of screen for off-screen bodies
      drawOffscreenIndicator(ctx, width, height, cx, cy, sx, sy, body)
      continue
    }

    // Radius in pixels: real radius in km / AU_KM gives AU, times zoom gives px
    let radiusPx = (body.radius / AU_KM) * camera.zoom
    radiusPx = Math.max(radiusPx, MIN_VISUAL_RADIUS)

    // Sun glow
    if (body.isStar) {
      const glowRadius = Math.max(radiusPx * 4, 20)
      const gradient = ctx.createRadialGradient(sx, sy, radiusPx * 0.5, sx, sy, glowRadius)
      gradient.addColorStop(0, 'rgba(253, 184, 19, 0.6)')
      gradient.addColorStop(0.5, 'rgba(253, 184, 19, 0.15)')
      gradient.addColorStop(1, 'rgba(253, 184, 19, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(sx, sy, glowRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw the body
    ctx.fillStyle = body.color
    ctx.beginPath()
    ctx.arc(sx, sy, radiusPx, 0, Math.PI * 2)
    ctx.fill()

    // Saturn's rings
    if (body.rings) {
      let innerPx = (body.rings.innerRadius / AU_KM) * camera.zoom
      let outerPx = (body.rings.outerRadius / AU_KM) * camera.zoom
      innerPx = Math.max(innerPx, radiusPx * 1.3)
      outerPx = Math.max(outerPx, radiusPx * 2.2)
      ctx.strokeStyle = body.rings.color
      ctx.lineWidth = Math.max(outerPx - innerPx, 1.5)
      ctx.beginPath()
      ctx.ellipse(sx, sy, (innerPx + outerPx) / 2, (innerPx + outerPx) / 4, 0.3, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(body.name, sx, sy + radiusPx + 14)
  }

  // Draw the ship
  drawShip(ctx, cx, cy, state.ship.heading)
}

function drawShip(ctx, cx, cy, heading) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(heading + Math.PI / 2)

  // Ship triangle
  ctx.fillStyle = '#00FF88'
  ctx.strokeStyle = '#00FF88'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, -10)
  ctx.lineTo(-6, 8)
  ctx.lineTo(0, 5)
  ctx.lineTo(6, 8)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

function drawOffscreenIndicator(ctx, w, h, cx, cy, sx, sy, body) {
  const dx = sx - cx
  const dy = sy - cy
  const angle = Math.atan2(dy, dx)
  const margin = 30
  const edgeX = cx + Math.cos(angle) * (w / 2 - margin)
  const edgeY = cy + Math.sin(angle) * (h / 2 - margin)

  // Clamp to screen edge
  const ex = Math.max(margin, Math.min(w - margin, edgeX))
  const ey = Math.max(margin, Math.min(h - margin, edgeY))

  ctx.save()
  ctx.fillStyle = body.color
  ctx.globalAlpha = 0.6
  ctx.beginPath()
  ctx.arc(ex, ey, 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.font = '9px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(body.name, ex, ey - 8)
  ctx.restore()
}
