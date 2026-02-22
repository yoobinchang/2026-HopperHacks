import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Palette ──────────────────────────────────────────────────────────────────
const P = {
  zenith:      '#7a9bb5',   // muted blue-grey sky top
  midSky:      '#b8cdd8',   // soft greyish blue mid
  horizon:     '#e8d5c4',   // rosewater/peach horizon
  lowHaze:     '#d4b8a8',   // dusty rose base haze
  mountainFar: '#8fa3b1',   // distant mountain blue-grey
  mountainMid: '#a5a58d',   // sage fern mid mountains
  mountainNear:'#7a8c72',   // olive-sage near foothills
  snow:        '#f0ebe4',   // china doll / cream snow
  snowShadow:  '#d4c8be',   // soft shadow on snow
  ground:      '#c8b89a',   // terracotta-sand ground
  groundInner: '#d4c4a8',   // lighter inner ground
  fence:       '#f0ebe4',   // china doll white fence
  fencePost:   '#e0d4c8',   // slightly warmer post
}

// ─── Sky ──────────────────────────────────────────────────────────────────────
function Sky() {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(78, 32, 32)
    const pos = g.attributes.position
    const colors = []
    const zenith  = new THREE.Color(P.zenith)
    const mid     = new THREE.Color(P.midSky)
    const horizon = new THREE.Color(P.horizon)
    const haze    = new THREE.Color(P.lowHaze)

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      const t = (y + 78) / 156   // 0=base, 1=top
      const c = new THREE.Color()
      if (t < 0.15)      c.lerpColors(haze, horizon, t / 0.15)
      else if (t < 0.40) c.lerpColors(horizon, mid, (t - 0.15) / 0.25)
      else               c.lerpColors(mid, zenith, (t - 0.40) / 0.60)
      colors.push(c.r, c.g, c.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return g
  }, [])

  return (
    <mesh geometry={geo}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} />
    </mesh>
  )
}

// ─── Mountain helper ──────────────────────────────────────────────────────────
function Mountain({ points2D, color, position }) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(points2D[0][0], points2D[0][1])
    for (let i = 1; i < points2D.length; i++) shape.lineTo(points2D[i][0], points2D[i][1])
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: false })
  }, [])
  return (
    <mesh geometry={geo} position={position}>
      <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
    </mesh>
  )
}

// ─── Pretty layered mountains ─────────────────────────────────────────────────
function Mountains() {

  // Layer 1 — farthest, palest, wide rolling hills
  const layer1 = useMemo(() => [
    [-40, 0], [-30, 5], [-22, 3.5], [-14, 7], [-6, 5], [0, 8],
    [6, 5], [14, 7], [22, 3.5], [30, 5], [40, 0], [40, -1], [-40, -1]
  ], [])

  // Layer 2 — mid-far, slightly taller, gentle rounded peaks
  const layer2 = useMemo(() => [
    [-40, 0], [-32, 4], [-24, 6.5], [-16, 4.5], [-10, 8.5],
    [-4, 6], [2, 9.5], [8, 6.5], [14, 9], [20, 5.5],
    [26, 7], [34, 4], [40, 0], [40, -1], [-40, -1]
  ], [])

  // Layer 3 — main background peaks, most prominent
  const layer3 = useMemo(() => [
    [-40, 0], [-34, 3], [-26, 7.5], [-18, 5], [-12, 10],
    [-5, 7], [0, 12], [5, 7], [12, 10],
    [18, 5], [26, 7.5], [34, 3], [40, 0], [40, -1], [-40, -1]
  ], [])

  // Layer 4 — nearer foothills, darker, grounds the scene
  const layer4L = useMemo(() => [
    [-40, 0], [-32, 5], [-24, 3.5], [-16, 6], [-10, 4],
    [-4, 5.5], [2, 3], [6, 0], [6, -0.5], [-40, -0.5]
  ], [])

  const layer4R = useMemo(() => [
    [-6, 0], [-2, 3], [4, 5.5], [10, 4],
    [16, 6], [24, 3.5], [32, 5], [40, 0], [40, -0.5], [-6, -0.5]
  ], [])

  // Soft snow/light touches on the tallest peaks of layer 3
  const snowLeft = useMemo(() => [
    [-13.5, 9.2], [-12, 10], [-11, 9.5], [-12.2, 8.8], [-13.5, 9.2]
  ], [])

  const snowCenter = useMemo(() => [
    [-1.5, 10.8], [0, 12], [1.5, 10.8], [0.8, 10.2], [-0.8, 10.2], [-1.5, 10.8]
  ], [])

  const snowRight = useMemo(() => [
    [11, 9.5], [12, 10], [13.5, 9.2], [12.2, 8.8], [11, 9.5]
  ], [])

  return (
    <group position={[0, -0.8, -18]}>
 {/* Farthest — pale dusty blue */}
<Mountain points2D={layer1} color="#a8bfcc" position={[0, 0.4, 0]} />

{/* Mid-far — soft blue-grey */}
<Mountain points2D={layer2} color="#8aaab8" position={[0, 0.2, 1.5]} />

{/* Main peaks — medium blue-grey */}
<Mountain points2D={layer3} color="#6b8899" position={[0, 0, 3]} />

{/* Soft snow caps — keep as is */}
<Mountain points2D={snowLeft}   color="#ede5dc" position={[0, 0, 3.2]} />
<Mountain points2D={snowCenter} color="#f0ebe4" position={[0, 0, 3.2]} />
<Mountain points2D={snowRight}  color="#ede5dc" position={[0, 0, 3.2]} />

{/* Near foothills — darker blue-slate */}
<Mountain points2D={layer4L} color="#4f6b7a" position={[0, -0.2, 4.5]} />
<Mountain points2D={layer4R} color="#4f6b7a" position={[0, -0.2, 4.5]} />
    </group>
  )
}




// ─── Ground ───────────────────────────────────────────────────────────────────
function Ground() {
  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[16, 64]} />
        <meshStandardMaterial color={P.ground} roughness={0.95} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0, 4, 48]} />
        <meshStandardMaterial color={P.groundInner} roughness={0.9} />
      </mesh>
    </>
  )
}

// ─── White Fence ─────────────────────────────────────────────────────────────
// Runs in a U-shape around the back and sides of the scene
function FencePost({ x, z, rotation = 0 }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      {/* Post */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.09, 1.1, 0.09]} />
        <meshStandardMaterial color={P.fencePost} roughness={0.6} />
      </mesh>
      {/* Post cap */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[0.12, 0.1, 0.12]} />
        <meshStandardMaterial color={P.fence} roughness={0.5} />
      </mesh>
    </group>
  )
}

function FenceRail({ x1, z1, x2, z2, y }) {
  const mid = [(x1 + x2) / 2, y, (z1 + z2) / 2]
  const dx  = x2 - x1
  const dz  = z2 - z1
  const len = Math.sqrt(dx * dx + dz * dz)
  const angle = Math.atan2(dx, dz)

  return (
    <mesh position={mid} rotation={[0, angle, 0]} castShadow>
      <boxGeometry args={[0.07, 0.07, len]} />
      <meshStandardMaterial color={P.fence} roughness={0.55} />
    </mesh>
  )
}

function Fence() {
  // Post positions along a semi-circle behind and to the sides
  const postSpacing = 2.4
  const fenceRadius = 7.5
  const posts = useMemo(() => {
    const arr = []
    // Back arc — from left side to right side
    const startAngle = Math.PI * 0.08   // slight inward from front
    const endAngle   = Math.PI * 0.92
    const steps = 12
    for (let i = 0; i <= steps; i++) {
      const t     = i / steps
      const angle = startAngle + t * (endAngle - startAngle)
      arr.push({
        x:   Math.cos(angle) * fenceRadius,
        z:  -Math.sin(angle) * fenceRadius + 1,
        rot: -(angle - Math.PI / 2),
      })
    }
    return arr
  }, [])

  return (
    <group>
      {posts.map((p, i) => (
        <FencePost key={i} x={p.x} z={p.z} rotation={p.rot} />
      ))}
      {/* Rails between consecutive posts */}
      {posts.slice(0, -1).map((p, i) => {
        const next = posts[i + 1]
        return (
          <group key={i}>
            <FenceRail x1={p.x} z1={p.z} x2={next.x} z2={next.z} y={0.75} />
            <FenceRail x1={p.x} z1={p.z} x2={next.x} z2={next.z} y={0.38} />
          </group>
        )
      })}
    </group>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────
export default function Background() {
  return (
    <>
      <Sky />
      <Mountains />
      <Ground />
      <Fence />
    </>
  )
}

export { Sky, Ground, Fence, Mountains }