import { useRef, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { DoubleSide } from 'three'

export default function Planet({ body, radius, setRef }) {
  const meshRef = useRef()

  useEffect(() => {
    if (meshRef.current) setRef(body.name, meshRef.current)
  }, [body.name, setRef])

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial color={body.color} roughness={0.8} metalness={0.1} />

        {/* Billboard label */}
        <Html
          center
          distanceFactor={1}
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '11px',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            transform: `translateY(${radius * 400 + 15}px)`,
          }}
        >
          {body.name}
        </Html>
      </mesh>

      {/* Saturn's rings */}
      {body.rings && (
        <mesh rotation={[Math.PI / 2, 0, 0.3]}>
          <ringGeometry args={[radius * 1.4, radius * 2.3, 64]} />
          <meshStandardMaterial
            color={body.rings.color}
            side={DoubleSide}
            transparent
            opacity={0.5}
            roughness={0.9}
          />
        </mesh>
      )}
    </group>
  )
}
