import { useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import Sun from './Sun'
import Planet from './Planet'
import OrbitLine from './OrbitLine'
import Starfield from './Starfield'
import ShipCamera from './ShipCamera'
import { AU_KM } from '../solarSystemData'

// Map sim coords to Three.js (Y-up): sim.x -> x, sim.y -> -z, sim.z -> y
function simToThree(sx, sy, sz) {
  return [sx, sz || 0, -sy]
}

function visualRadius(radiusKm, isStar) {
  const realAU = radiusKm / AU_KM
  if (isStar) return Math.max(realAU * 200, 0.01)
  return Math.max(realAU * 500, 0.002)
}

export default function SolarSystemScene({ simRef, keysRef, onHudUpdate }) {
  const bodiesRef = useRef([])
  const meshRefs = useRef({})
  const lastHudUpdate = useRef(0)

  const setMeshRef = useCallback((name, ref) => {
    meshRefs.current[name] = ref
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const state = simRef.current.update(dt, keysRef.current)
    bodiesRef.current = state.bodies

    // Update mesh positions via refs (no React re-renders)
    for (const body of state.bodies) {
      const mesh = meshRefs.current[body.name]
      if (mesh) {
        const [x, y, z] = simToThree(body.px, body.py, body.pz)
        mesh.position.set(x, y, z)
      }
    }

    // Throttled HUD updates (~15fps)
    const now = performance.now()
    if (now - lastHudUpdate.current > 66) {
      lastHudUpdate.current = now

      // Find nearest body
      let nearest = state.bodies[0]
      let nearestDist = Infinity
      for (const b of state.bodies) {
        const dx = b.px - state.ship.x
        const dy = b.py - state.ship.y
        const dz = (b.pz || 0) - state.ship.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < nearestDist) {
          nearestDist = dist
          nearest = b
        }
      }

      onHudUpdate({
        speed: state.ship.speed,
        throttle: state.ship.throttle,
        x: state.ship.x,
        y: state.ship.y,
        z: state.ship.z,
        heading: state.ship.heading,
        pitch: state.ship.pitch,
        nearest: nearest.name,
        nearestDist: nearestDist * AU_KM,
        simTime: state.simTime,
        timeWarp: state.timeWarp,
      })
    }
  })

  // Build initial body list from simulation state
  const state = simRef.current.getState()
  const bodies = state.bodies

  return (
    <>
      <ShipCamera simRef={simRef} />
      <ambientLight intensity={0.05} />
      <Starfield />

      {bodies.map(body => {
        if (body.isStar) {
          return (
            <Sun
              key={body.name}
              body={body}
              radius={visualRadius(body.radius, true)}
              setRef={setMeshRef}
            />
          )
        }
        return (
          <group key={body.name}>
            <Planet
              body={body}
              radius={visualRadius(body.radius, false)}
              setRef={setMeshRef}
            />
            {body.orbitRadius > 0 && (
              <OrbitLine radius={body.orbitRadius} />
            )}
          </group>
        )
      })}
    </>
  )
}
