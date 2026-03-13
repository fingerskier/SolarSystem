import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial } from 'three'

const SEGMENTS = 128

export default function OrbitLine({ radius }) {
  const geometry = useMemo(() => {
    const points = []
    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2
      // Orbit in XZ plane (sim Y maps to -Z in Three.js, orbits are in sim XY plane)
      points.push(
        radius * Math.cos(angle),
        0,
        -radius * Math.sin(angle)
      )
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(points, 3))
    return geo
  }, [radius])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="white" transparent opacity={0.08} />
    </line>
  )
}
