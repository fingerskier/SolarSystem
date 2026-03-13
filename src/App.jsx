import { useEffect, useRef, useState, useCallback } from 'react'
import { createSimulation } from './simulation'
import { render } from './renderer'
import { AU_KM, SPEED_OF_LIGHT_KM_S } from './solarSystemData'
import './App.css'

const TIME_WARP_LEVELS = [1, 60, 3600, 86400, 604800, 2592000]
const TIME_WARP_LABELS = ['1x', '1 min/s', '1 hr/s', '1 day/s', '1 wk/s', '1 mo/s']

export default function App() {
  const canvasRef = useRef(null)
  const simRef = useRef(null)
  const keysRef = useRef({ left: false, right: false, up: false, down: false, brake: false })
  const cameraRef = useRef({ x: 0, y: 1.2, zoom: 800 })
  const [hud, setHud] = useState({
    speed: 0,
    throttle: 0,
    x: 0,
    y: 0,
    nearest: '',
    nearestDist: 0,
    simTime: 0,
    timeWarpIdx: 0,
  })
  const timeWarpIdxRef = useRef(0)

  const handleTimeWarp = useCallback((delta) => {
    timeWarpIdxRef.current = Math.max(0, Math.min(TIME_WARP_LEVELS.length - 1, timeWarpIdxRef.current + delta))
    simRef.current?.setTimeWarp(TIME_WARP_LEVELS[timeWarpIdxRef.current])
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const sim = createSimulation()
    simRef.current = sim

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Key handlers
    function onKeyDown(e) {
      const k = keysRef.current
      switch (e.key) {
        case 'ArrowLeft': case 'a': k.left = true; break
        case 'ArrowRight': case 'd': k.right = true; break
        case 'ArrowUp': case 'w': k.up = true; break
        case 'ArrowDown': case 's': k.down = true; break
        case ' ': k.brake = true; break
        case ',': handleTimeWarp(-1); break
        case '.': handleTimeWarp(1); break
        case 'z': cameraRef.current.zoom *= 1.5; break
        case 'x': cameraRef.current.zoom /= 1.5; break
      }
    }
    function onKeyUp(e) {
      const k = keysRef.current
      switch (e.key) {
        case 'ArrowLeft': case 'a': k.left = false; break
        case 'ArrowRight': case 'd': k.right = false; break
        case 'ArrowUp': case 'w': k.up = false; break
        case 'ArrowDown': case 's': k.down = false; break
        case ' ': k.brake = false; break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // Mouse wheel zoom
    function onWheel(e) {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      cameraRef.current.zoom *= factor
      cameraRef.current.zoom = Math.max(0.5, Math.min(1e8, cameraRef.current.zoom))
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // Game loop
    let lastTime = performance.now()
    let frameId
    function loop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      const state = sim.update(dt, keysRef.current)

      // Camera follows ship
      const cam = cameraRef.current
      const lerp = 1 - Math.pow(0.001, dt)
      cam.x += (state.ship.x - cam.x) * lerp
      cam.y += (state.ship.y - cam.y) * lerp

      render(ctx, canvas, state, cam)

      // Find nearest body
      let nearest = state.bodies[0]
      let nearestDist = Infinity
      for (const b of state.bodies) {
        const dx = b.px - state.ship.x
        const dy = b.py - state.ship.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < nearestDist) {
          nearestDist = dist
          nearest = b
        }
      }

      // Update HUD (throttled to avoid excessive renders)
      setHud({
        speed: state.ship.speed,
        throttle: state.ship.throttle,
        x: state.ship.x,
        y: state.ship.y,
        nearest: nearest.name,
        nearestDist: nearestDist * AU_KM,
        simTime: state.simTime,
        timeWarpIdx: timeWarpIdxRef.current,
      })

      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [handleTimeWarp])

  const speedPct = (hud.speed / SPEED_OF_LIGHT_KM_S) * 100
  const simDays = Math.floor(hud.simTime)
  const simYears = (hud.simTime / 365.25).toFixed(2)

  function formatDist(km) {
    if (km < 1_000_000) return `${km.toFixed(0)} km`
    if (km < AU_KM) return `${(km / 1_000_000).toFixed(2)} M km`
    return `${(km / AU_KM).toFixed(4)} AU`
  }

  function formatSpeed(kmps) {
    if (kmps < 1) return `${(kmps * 1000).toFixed(0)} m/s`
    if (kmps < 1000) return `${kmps.toFixed(1)} km/s`
    return `${kmps.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} km/s`
  }

  return (
    <div className="app">
      <canvas ref={canvasRef} />

      <div className="hud top-left">
        <div className="hud-title">NAVIGATION</div>
        <div>Speed: {formatSpeed(hud.speed)}</div>
        <div>Throttle: {speedPct.toFixed(1)}% c</div>
        <div className="throttle-bar">
          <div className="throttle-fill" style={{ width: `${speedPct}%` }} />
        </div>
        <div>Position: ({hud.x.toFixed(3)}, {hud.y.toFixed(3)}) AU</div>
      </div>

      <div className="hud top-right">
        <div className="hud-title">PROXIMITY</div>
        <div>Nearest: {hud.nearest}</div>
        <div>Distance: {formatDist(hud.nearestDist)}</div>
      </div>

      <div className="hud bottom-left">
        <div className="hud-title">TIME</div>
        <div>Day {simDays} ({simYears} years)</div>
        <div>Warp: {TIME_WARP_LABELS[hud.timeWarpIdx]}</div>
      </div>

      <div className="hud bottom-right controls">
        <div className="hud-title">CONTROLS</div>
        <div>W/&#x2191; Accelerate</div>
        <div>S/&#x2193; Decelerate</div>
        <div>A/&#x2190; Turn left</div>
        <div>D/&#x2192; Turn right</div>
        <div>Space Brake</div>
        <div>Z/X Zoom in/out</div>
        <div>Scroll Zoom</div>
        <div>, / . Time warp -/+</div>
      </div>
    </div>
  )
}
