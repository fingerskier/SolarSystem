import { useRef, useEffect } from 'react'
import { AdditiveBlending } from 'three'
import { useTexture } from '@react-three/drei'

export default function Sun({ body, radius, setRef }) {
  const meshRef = useRef()

  useEffect(() => {
    if (meshRef.current) setRef(body.name, meshRef.current)
  }, [body.name, setRef])

  return (
    <group>
      {/* Main sun sphere - self-lit */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color={body.color} />
      </mesh>

      {/* Point light emanating from sun */}
      <pointLight
        position={[0, 0, 0]}
        intensity={2}
        distance={0}
        decay={0}
        color="#FFF5E0"
      />

      {/* Glow sprite */}
      <sprite scale={[radius * 8, radius * 8, 1]}>
        <spriteMaterial
          color="#FDB813"
          transparent
          opacity={0.3}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  )
}
