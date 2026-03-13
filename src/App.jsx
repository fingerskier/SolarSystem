import { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { createSimulation } from './simulation'
import SolarSystemScene from './scene/SolarSystemScene'
import CockpitOverlay from './cockpit/CockpitOverlay'
import HudPanels from './cockpit/HudPanels'
import './App.css'

const TIME_WARP_LEVELS = [1, 60, 3600, 86400, 604800, 2592000]

export default function App() {
  const simRef = useRef(null)
  const keysRef = useRef({
    left: false, right: false, up: false, down: false,
    brake: false, pitchUp: false, pitchDown: false,
    yawDelta: 0, pitchDelta: 0,
  })
  const timeWarpIdxRef = useRef(0)
  const [hud, setHud] = useState({
    speed: 0, throttle: 0, x: 0, y: 0, z: 0,
    heading: 0, pitch: 0,
    nearest: '', nearestDist: 0, simTime: 0, timeWarp: 1,
  })

  // Initialize simulation once
  if (!simRef.current) {
    simRef.current = createSimulation()
  }

  const handleTimeWarp = useCallback((delta) => {
    timeWarpIdxRef.current = Math.max(0, Math.min(TIME_WARP_LEVELS.length - 1, timeWarpIdxRef.current + delta))
    simRef.current?.setTimeWarp(TIME_WARP_LEVELS[timeWarpIdxRef.current])
  }, [])

  useEffect(() => {
    function onKeyDown(e) {
      const k = keysRef.current
      switch (e.key) {
        case 'ArrowLeft': case 'a': k.left = true; break
        case 'ArrowRight': case 'd': k.right = true; break
        case 'ArrowUp': case 'w': k.up = true; break
        case 'ArrowDown': case 's': k.down = true; break
        case 'q': k.pitchUp = true; break
        case 'e': k.pitchDown = true; break
        case ' ': k.brake = true; e.preventDefault(); break
        case ',': handleTimeWarp(-1); break
        case '.': handleTimeWarp(1); break
      }
    }
    function onKeyUp(e) {
      const k = keysRef.current
      switch (e.key) {
        case 'ArrowLeft': case 'a': k.left = false; break
        case 'ArrowRight': case 'd': k.right = false; break
        case 'ArrowUp': case 'w': k.up = false; break
        case 'ArrowDown': case 's': k.down = false; break
        case 'q': k.pitchUp = false; break
        case 'e': k.pitchDown = false; break
        case ' ': k.brake = false; break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [handleTimeWarp])

  // Pointer lock for mouse look
  const handleCanvasClick = useCallback((e) => {
    const canvas = e.target.closest('canvas')
    if (canvas) canvas.requestPointerLock()
  }, [])

  useEffect(() => {
    const SENSITIVITY = 0.002

    function onMouseMove(e) {
      if (document.pointerLockElement) {
        keysRef.current.yawDelta += e.movementX * SENSITIVITY
        keysRef.current.pitchDelta -= e.movementY * SENSITIVITY
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    return () => document.removeEventListener('mousemove', onMouseMove)
  }, [])

  return (
    <div className="app" onClick={handleCanvasClick}>
      <Canvas
        gl={{ logarithmicDepthBuffer: true, antialias: true }}
        camera={{ fov: 75, near: 0.0001, far: 1000 }}
      >
        <SolarSystemScene
          simRef={simRef}
          keysRef={keysRef}
          onHudUpdate={setHud}
        />
      </Canvas>
      <CockpitOverlay />
      <HudPanels hud={hud} />
    </div>
  )
}
