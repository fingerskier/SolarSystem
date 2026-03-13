import { Stars } from '@react-three/drei'

export default function Starfield() {
  return <Stars radius={500} depth={100} count={5000} factor={4} saturation={0} fade speed={0} />
}
