import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Euler } from 'three'

export default function ShipCamera({ simRef }) {
  const { camera } = useThree()
  const euler = useRef(new Euler(0, 0, 0, 'YXZ'))

  useFrame(() => {
    const state = simRef.current.getState()
    const { ship } = state

    // Map sim coords to Three.js (Y-up): sim.x -> x, sim.y -> -z, sim.z -> y
    camera.position.set(ship.x, ship.z, -ship.y)

    // Build rotation: heading rotates around Y, pitch rotates around X
    // In Three.js Y-up: heading maps to Y rotation, pitch maps to X rotation
    // sim heading: 0 = +x, pi/2 = +y(sim) = -z(three)
    // Three.js: rotation.y = 0 looks down -z. So yaw = -heading - pi/2
    const e = euler.current
    e.set(-ship.pitch, -ship.heading - Math.PI / 2, ship.roll, 'YXZ')
    camera.rotation.copy(e)
  })

  return null
}
