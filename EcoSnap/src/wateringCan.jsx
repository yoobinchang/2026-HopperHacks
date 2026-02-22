import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Teardrop geometry helper ─────────────────────────────────────────────────
// Built with LatheGeometry: a profile rotated around Y axis.
// The profile draws a rounded top tapering to a point at the bottom.
function createTeardropGeometry() {
  const points = []
  const segments = 14
  for (let i = 0; i <= segments; i++) {
    const t = i / segments          // 0 = tip (bottom), 1 = top
    const angle = t * Math.PI       // 0 → π sweeps a half-circle profile
    // radius: 0 at tip, peaks around t=0.6, narrows slightly at top
    const r = Math.sin(angle) * (0.5 + 0.5 * Math.sin(angle * 0.8))
    const y = t * 1.0 - 0.15       // shift so tip is at bottom
    points.push(new THREE.Vector2(r * 0.5, y))
  }
  return new THREE.LatheGeometry(points, 10)
}

// ─── Water stream ─────────────────────────────────────────────────────────────
// The can sits at world position [2.2, 1.8, 1.5].
// The tree base is at [0, 0, 0].
// We compute each drop's world-space arc from nozzle → ground at tree.
function WaterStream({ active }) {
  const meshRef = useRef()
  const dummy   = useMemo(() => new THREE.Object3D(), [])
  const geo     = useMemo(() => createTeardropGeometry(), [])
  const COUNT   = 35

  // Can world pos & target — must match TreeScene values
  const CAN_WORLD = useMemo(() => new THREE.Vector3(2.2, 1.8, 1.5), [])
  const TREE_BASE = useMemo(() => new THREE.Vector3(0.0, 0.3, 0.0), [])

  // The can mesh is wrapped in scale=0.45.
  // Spout group local pos: [0.3, 0.1, 0], rotation Z = -0.55 rad
  // Nozzle tip sits 0.72 units along the spout's local +Y.
  // Rotating [0, 0.72] by -0.55 rad around Z:
  //   x_rotated =  0.72 * sin(0.55) ≈  0.374
  //   y_rotated =  0.72 * cos(0.55) ≈  0.599
  // Add spout group offset [0.3, 0.1], then multiply whole thing by scale 0.45:
  const NOZZLE_OFFSET = useMemo(() => {
    const SCALE      = 0.45
    const spoutAngle = 0.55
    const neckTip    = 0.72
    const localX     = 0.3 + neckTip * Math.sin(spoutAngle)
    const localY     = 0.1 + neckTip * Math.cos(spoutAngle)
    return new THREE.Vector3(localX * SCALE, localY * SCALE, 0)
  }, [])

  const drops = useMemo(() => Array.from({ length: COUNT }, (_, i) => ({
    life:     i / COUNT,          // stagger so they don't all start together
    spread:   (Math.random() - 0.5) * 0.12,   // tiny lateral spread
    spreadZ:  (Math.random() - 0.5) * 0.12,
    timeScale: 0.85 + Math.random() * 0.3,   // slight speed variation
  })), [])

  useFrame(() => {
    if (!meshRef.current) return

    // World-space nozzle start
    const nozzle = CAN_WORLD.clone().add(NOZZLE_OFFSET)
    const target = TREE_BASE.clone()

    // Horizontal displacement vector (nozzle → target, XZ only)
    const dx = target.x - nozzle.x   // ≈ -2.85
    const dz = target.z - nozzle.z   // ≈ -1.35
    const dy = target.y - nozzle.y   // ≈ -1.5 (downward)

    drops.forEach((d, i) => {
      if (active) {
        d.life += 0.010 * d.timeScale
        if (d.life > 1) {
          d.life = 0
          d.spread  = (Math.random() - 0.5) * 0.12
          d.spreadZ = (Math.random() - 0.5) * 0.12
        }

        const t = d.life

        // Projectile arc: x/z travel linearly, y adds a gentle upward arc then falls
        const arcHeight = 0.5   // how high above the straight line the arc peaks
        const wx = nozzle.x + dx * t + d.spread
        const wy = nozzle.y + dy * t + arcHeight * Math.sin(t * Math.PI)
        const wz = nozzle.z + dz * t + d.spreadZ

        dummy.position.set(wx, wy, wz)

        // Orient teardrop: point it along the velocity direction
        // velocity = derivative of position w.r.t t
        const vx = dx
        const vy = dy + arcHeight * Math.PI * Math.cos(t * Math.PI)
        const vz = dz
        const vel = new THREE.Vector3(vx, vy, vz).normalize()
        // Default lathe geometry points along Y — rotate to align with vel
        const up  = new THREE.Vector3(0, 1, 0)
        const q   = new THREE.Quaternion().setFromUnitVectors(up, vel)
        dummy.setRotationFromQuaternion(q)

        // Scale: slightly bigger in the middle of flight
        const s = 0.055 + 0.025 * Math.sin(t * Math.PI)
        dummy.scale.setScalar(s)
      } else {
        dummy.scale.setScalar(0)
      }

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[geo, null, COUNT]} frustumCulled={false}>
      <meshStandardMaterial
        color="#7ec8f0"
        transparent
        opacity={0.82}
        roughness={0.15}
        metalness={0.15}
      />
    </instancedMesh>
  )
}

// ─── Watering Can mesh ────────────────────────────────────────────────────────
function WateringCanMesh({ isHeld, isWatering, onClick }) {
  const groupRef = useRef()
  const tiltRef  = useRef()

  useFrame((state) => {
    if (!groupRef.current || !tiltRef.current) return
    const t = state.clock.elapsedTime

    if (!isHeld) {
      // Gentle bob + slow spin to invite a click
      groupRef.current.position.y = Math.sin(t * 1.4) * 0.12
      groupRef.current.rotation.y = t * 0.15
      tiltRef.current.rotation.z  = 0
    } else if (isWatering) {
      // Slow, smooth tilt: lerp factor 0.015 instead of 0.06
      tiltRef.current.rotation.z = THREE.MathUtils.lerp(
        tiltRef.current.rotation.z, -1.1, 0.015
      )
      // Stop spinning
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y, 0, 0.03
      )
    } else {
      // Held but not yet watering
      tiltRef.current.rotation.z = THREE.MathUtils.lerp(
        tiltRef.current.rotation.z, 0, 0.06
      )
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y, 0, 0.08
      )
    }
  })

  const canColor   = 'hsla(12, 29%, 82%, 1.00)'
  const darkBlue   = 'hsla(3, 26%, 68%, 1.00)'
  const spoutColor = 'hsla(12, 29%, 82%, 1.00)'

  return (
    <group ref={groupRef} onClick={onClick} scale={0.45}>
      <group ref={tiltRef}>

        {/* Body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.38, 0.32, 0.7, 18]} />
          <meshStandardMaterial color={canColor} roughness={0.3} metalness={0.25} />
        </mesh>

        {/* Lid */}
        <mesh position={[0, 0.36, 0]}>
          <cylinderGeometry args={[0.39, 0.39, 0.04, 18]} />
          <meshStandardMaterial color={darkBlue} roughness={0.3} metalness={0.3} />
        </mesh>

        {/* Bottom cap */}
        <mesh position={[0, -0.36, 0]}>
          <cylinderGeometry args={[0.33, 0.33, 0.04, 18]} />
          <meshStandardMaterial color={darkBlue} roughness={0.3} metalness={0.3} />
        </mesh>

        {/* Spout group — rotation matches the arc calculation above */}
        <group position={[0.3, 0.1, 0]} rotation={[0, 0, -0.55]}>
          <mesh>
            <cylinderGeometry args={[0.09, 0.13, 0.28, 10]} />
            <meshStandardMaterial color={spoutColor} roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.36, 0]}>
            <cylinderGeometry args={[0.055, 0.09, 0.45, 10]} />
            <meshStandardMaterial color={spoutColor} roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <cylinderGeometry args={[0.07, 0.055, 0.1, 10]} />
            <meshStandardMaterial color={darkBlue} roughness={0.3} metalness={0.3} />
          </mesh>
        </group>

        {/* Handle */}
        <group position={[-0.38, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.28, 0.045, 8, 16, Math.PI]} />
            <meshStandardMaterial color={darkBlue} roughness={0.35} metalness={0.25} />
          </mesh>
        </group>

        {/* Decorative ring */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.385, 0.385, 0.06, 18]} />
          <meshStandardMaterial color={darkBlue} roughness={0.3} metalness={0.3} />
        </mesh>

      </group>
    </group>
  )
}

// ─── Exported component ───────────────────────────────────────────────────────
export function WateringCan({ waterState, onPickUp, position = [3, 0.5, 2] }) {
  if (waterState === 'idle' || waterState === 'done') return null

  const isHeld     = waterState === 'held' || waterState === 'watering'
  const isWatering = waterState === 'watering'
  const canPos     = isHeld ? [2.2, 1.8, 1.5] : position

  return (
    <>
      {/* Can mesh at its position */}
      <group position={canPos}>
        <WateringCanMesh
          isHeld={isHeld}
          isWatering={isWatering}
          onClick={!isHeld ? onPickUp : undefined}
        />
      </group>

      {/* Water stream lives at scene root so it can use world-space coords */}
      <WaterStream active={isWatering} />
    </>
  )
}
