import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as THREE from 'three'

extend({ OrbitControls })
import { WateringCan } from './WateringCan'
import Background from './Background'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  trunk:       '#7a5c3a',
  trunkDark:   '#5c3d1e',
  uiText:      '#4a3228',
  uiTextLight: '#7a5a50',
  uiAccent:    '#a86a65',
  uiAccent2:   '#754b4d',
  badge1:      '#ddbea9',
  badge2:      '#cb997e',
  badge3:      '#a5a58d',
  badge4:      '#6b705c',
  barFill1:    '#cb997e',
  barFill2:    '#754b4d',
}

// ─── Flower color options ─────────────────────────────────────────────────────
const FLOWER_PALETTES = [
  { id: 'sakura',    name: 'Sakura',      light: '#ffc8d8', dark: '#ffdde8', center: '#d63384', petal: '#ffb7c5' },
  { id: 'blush',     name: 'Blush Rose',  light: '#f4a9b0', dark: '#f9cdd0', center: '#b5394a', petal: '#f08090' },
  { id: 'lavender',  name: 'Lavender',    light: '#d4b8e8', dark: '#e8d4f4', center: '#7c4dab', petal: '#c8a8e0' },
  { id: 'peach',     name: 'Peach',       light: '#f8c8a0', dark: '#fde0c0', center: '#c06830', petal: '#f0b080' },
  { id: 'ivory',     name: 'Ivory',       light: '#f5ede0', dark: '#faf5ee', center: '#c8a060', petal: '#eeddc8' },
  { id: 'dustyrose', name: 'Dusty Rose',  light: '#d4908a', dark: '#e8b0aa', center: '#8c3a38', petal: '#c87870' },
  { id: 'sage',      name: 'Sage Bloom',  light: '#b8d4b0', dark: '#d0e8cc', center: '#4a7848', petal: '#a8c8a0' },
  { id: 'copper',    name: 'Copper',      light: '#d4a070', dark: '#e8c098', center: '#8a4820', petal: '#c88858' },
]

// ─── Stage logic ──────────────────────────────────────────────────────────────
function getEarnedStage(points) {
  if (points < 6)  return 1
  if (points < 11) return 2
  if (points < 20) return 3
  return 4
}

function getWaterCost(currentStage) {
  if (currentStage === 1) return 5
  if (currentStage === 2) return 5
  if (currentStage === 3) return 9
  return 0
}

const STAGE_NAMES  = ['', 'Sprout', 'Sapling', 'Young Tree', 'Full Blossom']
const STAGE_COLORS = ['', C.badge1, C.badge2, C.badge3, C.badge4]

// ─── Trunk ────────────────────────────────────────────────────────────────────
function Trunk({ height = 1, radiusTop = 0.06, radiusBottom = 0.12 }) {
  return (
    <mesh castShadow position={[0, height / 2, 0]}>
      <cylinderGeometry args={[radiusTop, radiusBottom, height, 10]} />
      <meshStandardMaterial color={C.trunk} roughness={0.95} />
    </mesh>
  )
}

// ─── Branch ───────────────────────────────────────────────────────────────────
function Branch({ start, end, radius = 0.04 }) {
  const s = new THREE.Vector3(...start)
  const e = new THREE.Vector3(...end)
  const dir = e.clone().sub(s)
  const mid = s.clone().add(dir.clone().multiplyScalar(0.5))
  const length = dir.length()
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  return (
    <mesh castShadow position={[mid.x, mid.y, mid.z]} quaternion={quaternion}>
      <cylinderGeometry args={[radius * 0.6, radius, length, 6]} />
      <meshStandardMaterial color={C.trunkDark} roughness={0.9} />
    </mesh>
  )
}

// ─── Cherry blossom flower ────────────────────────────────────────────────────
function CherryBlossomFlower({ scale = 1, palette }) {
  const pal = palette || FLOWER_PALETTES[0]
  const petalShape = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.bezierCurveTo(-0.22, 0.15, -0.28, 0.55, 0, 0.82)
    shape.bezierCurveTo(0.28, 0.55, 0.22, 0.15, 0, 0)
    return shape
  }, [])
  const petalGeo = useMemo(() => new THREE.ShapeGeometry(petalShape, 16), [petalShape])
  const stamens  = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2
      return { pos: [Math.cos(a) * 0.13, 0.04, Math.sin(a) * 0.13] }
    }), [])

  return (
    <group scale={scale}>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} geometry={petalGeo} rotation={[Math.PI / 2 - 0.18, 0, (i / 5) * Math.PI * 2]} castShadow>
          <meshStandardMaterial color={i % 2 === 0 ? pal.light : pal.dark} side={THREE.DoubleSide} roughness={0.55} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.16, 16]} />
        <meshStandardMaterial color={pal.center} side={THREE.DoubleSide} roughness={0.5} />
      </mesh>
      {stamens.map((st, i) => (
        <group key={i} position={st.pos}>
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.14, 4]} />
            <meshStandardMaterial color={pal.center} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.028, 6, 6]} />
            <meshStandardMaterial color="#f5c518" roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── Blossom cluster ──────────────────────────────────────────────────────────
function BlossomCluster({ position, radius = 0.6, count = 18, palette }) {
  const flowers = useMemo(() => Array.from({ length: count }, () => {
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.random() * Math.PI
    const r     = (0.5 + Math.random() * 0.5) * radius
    return {
      pos: [
        position[0] + r * Math.sin(phi) * Math.cos(theta),
        position[1] + r * Math.cos(phi) * 0.55,
        position[2] + r * Math.sin(phi) * Math.sin(theta),
      ],
      scale: 0.18 + Math.random() * 0.10,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
    }
  }), [position[0], position[1], position[2], radius, count])

  return (
    <>
      {flowers.map((f, i) => (
        <group key={i} position={f.pos} rotation={[f.rotX, f.rotY, f.rotZ]}>
          <CherryBlossomFlower scale={f.scale} palette={palette} />
        </group>
      ))}
    </>
  )
}

// ─── Falling petals ───────────────────────────────────────────────────────────
function FallingPetals({ count = 60, color = '#ffb7c5' }) {
  const mesh  = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const petals = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 16, y: Math.random() * 12, z: (Math.random() - 0.5) * 16,
    speed: 0.010 + Math.random() * 0.018,
    sway: Math.random() * Math.PI * 2, swaySpeed: 0.4 + Math.random() * 0.8,
    rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.05,
    size: 0.05 + Math.random() * 0.055,
  })), [count])

  useFrame(() => {
    if (!mesh.current) return
    petals.forEach((p, i) => {
      p.y -= p.speed; p.sway += p.swaySpeed * 0.016; p.rot += p.rotSpeed
      if (p.y < -1) { p.y = 10 + Math.random() * 4; p.x = (Math.random() - 0.5) * 16; p.z = (Math.random() - 0.5) * 16 }
      dummy.position.set(p.x + Math.sin(p.sway) * 0.3, p.y, p.z)
      dummy.rotation.set(p.rot, p.rot * 0.5, p.rot * 0.8)
      dummy.scale.setScalar(p.size)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.82} roughness={0.6} />
    </instancedMesh>
  )
}

// ─── Orbit controls (three.js, no drei) ────────────────────────────────────────
function SceneOrbitControls() {
  const { camera, gl } = useThree()
  return (
    <orbitControls
      args={[camera, gl.domElement]}
      enablePan={false}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2.05}
      minDistance={4}
      maxDistance={20}
      target={[0, 2, 0]}
    />
  )
}

// ─── Clouds (simple mesh, no drei) ─────────────────────────────────────────────
function SimpleCloud() {
  return (
    <group scale={[4, 1, 1]}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.6, 10, 10]} />
        <meshBasicMaterial color="#f0e8e0" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.4, 0.15, 0.1]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial color="#f0e8e0" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-0.3, 0.1, -0.05]}>
        <sphereGeometry args={[0.45, 8, 8]} />
        <meshBasicMaterial color="#f0e8e0" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

function MovingCloud({ startX, y, z, speed }) {
  const ref = useRef()
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.position.x += speed * delta
    if (ref.current.position.x > 35) ref.current.position.x = -35
  })
  return (
    <group ref={ref} position={[startX, y, z]}>
      <SimpleCloud />
    </group>
  )
}

function Clouds() {
  const data = useMemo(() => [
    { startX: -22, y: 14, z: -8,  speed: 0.30 },
    { startX:  -5, y: 16, z: -12, speed: 0.20 },
    { startX:  14, y: 13, z: -6,  speed: 0.40 },
    { startX:   3, y: 17, z: -14, speed: 0.25 },
    { startX: -14, y: 15, z: -9,  speed: 0.35 },
  ], [])
  return <>{data.map((c, i) => <MovingCloud key={i} {...c} />)}</>
}

// ─── Tree stages (all accept palette) ────────────────────────────────────────
function Sprout({ palette }) {
  const ref = useRef()
  const pal = palette || FLOWER_PALETTES[0]
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d * 0.2 })
  return (
    <group ref={ref}>
      <Trunk height={0.5} radiusTop={0.03} radiusBottom={0.055} />
      <mesh position={[0, 0.67, 0]}>
        <sphereGeometry args={[0.13, 7, 7]} />
        <meshStandardMaterial color={pal.light} roughness={0.7} />
      </mesh>
      {[[-0.13, 0.56, 0], [0.13, 0.56, 0]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, 0, i === 0 ? 0.5 : -0.5]}>
          <sphereGeometry args={[0.09, 6, 6]} />
          <meshStandardMaterial color={pal.dark} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function Sapling({ palette }) {
  return (
    <group>
      <Trunk height={1.5} radiusTop={0.055} radiusBottom={0.1} />
      <Branch start={[0, 0.95, 0]} end={[0.55, 1.5, 0.2]}    radius={0.036} />
      <Branch start={[0, 0.95, 0]} end={[-0.5, 1.45, -0.15]}  radius={0.036} />
      <BlossomCluster position={[0.55, 1.52, 0.2]}    radius={0.38} count={14} palette={palette} />
      <BlossomCluster position={[-0.5, 1.48, -0.15]}   radius={0.36} count={14} palette={palette} />
      <BlossomCluster position={[0, 1.65, 0]}           radius={0.42} count={16} palette={palette} />
    </group>
  )
}

function YoungTree({ palette }) {
  const ref = useRef()
  useFrame((st) => { if (ref.current) ref.current.rotation.z = Math.sin(st.clock.elapsedTime * 0.55) * 0.016 })
  return (
    <group ref={ref}>
      <Trunk height={2.3} radiusTop={0.075} radiusBottom={0.14} />
      {[
        { s: [0, 1.25, 0], e: [0.95, 2.1, 0.35] },
        { s: [0, 1.25, 0], e: [-0.9, 2.0, -0.25] },
        { s: [0, 1.7,  0], e: [0.65, 2.55, -0.45] },
        { s: [0, 1.7,  0], e: [-0.55, 2.45, 0.45] },
      ].map((b, i) => <Branch key={i} start={b.s} end={b.e} radius={0.042} />)}
      <BlossomCluster position={[0.95, 2.15, 0.35]}  radius={0.58} count={24} palette={palette} />
      <BlossomCluster position={[-0.9, 2.05, -0.25]} radius={0.55} count={22} palette={palette} />
      <BlossomCluster position={[0.65, 2.6, -0.45]}  radius={0.55} count={22} palette={palette} />
      <BlossomCluster position={[-0.55, 2.5, 0.45]}  radius={0.55} count={22} palette={palette} />
      <BlossomCluster position={[0, 2.75, 0]}          radius={0.62} count={26} palette={palette} />
    </group>
  )
}

function FullTree({ palette }) {
  const ref = useRef()
  useFrame((st) => { if (ref.current) ref.current.rotation.z = Math.sin(st.clock.elapsedTime * 0.6) * 0.023 })
  return (
    <group ref={ref}>
      <Trunk height={3.3} radiusTop={0.11} radiusBottom={0.21} />
      {[
        { s: [0, 1.55, 0], e: [1.45, 2.7, 0.55] },
        { s: [0, 1.55, 0], e: [-1.35, 2.6, -0.35] },
        { s: [0, 2.1,  0], e: [1.05, 3.3, -0.65] },
        { s: [0, 2.1,  0], e: [-0.95, 3.1, 0.65] },
        { s: [0, 2.6,  0], e: [0.65, 3.7, 0.25] },
        { s: [0, 2.6,  0], e: [-0.55, 3.6, -0.35] },
      ].map((b, i) => <Branch key={i} start={b.s} end={b.e} radius={0.052} />)}
      {[
        { pos: [1.45, 2.75, 0.55],   r: 0.8  },
        { pos: [-1.35, 2.65, -0.35], r: 0.75 },
        { pos: [1.05, 3.35, -0.65],  r: 0.72 },
        { pos: [-0.95, 3.15, 0.65],  r: 0.72 },
        { pos: [0.65, 3.75, 0.25],   r: 0.68 },
        { pos: [-0.55, 3.65, -0.35], r: 0.68 },
        { pos: [0, 4.0, 0],           r: 0.78 },
        { pos: [0.45, 2.9, 0.85],    r: 0.58 },
        { pos: [-0.65, 2.8, -0.75],  r: 0.58 },
        { pos: [0, 2.5, 0],           r: 0.6  },
      ].map((c, i) => <BlossomCluster key={i} position={c.pos} radius={c.r} count={30} palette={palette} />)}
    </group>
  )
}

// ─── Single tree instance in scene ───────────────────────────────────────────
function TreeInstance({ tree, isActive, waterState, onPickUp, onWaterTree }) {
  const Trees = [null, Sprout, Sapling, YoungTree, FullTree]
  const TreeComp = Trees[tree.displayStage]
  const pal = FLOWER_PALETTES.find(p => p.id === tree.paletteId) || FLOWER_PALETTES[0]

  return (
    <group position={[tree.x, 0, tree.z]}>
      <TreeComp palette={pal} />
      {/* Watering can & hitbox only for the active tree */}
      {isActive && (
        <>
          <WateringCan waterState={waterState} onPickUp={onPickUp} position={[3.2, 0.4, 2.5]} />
          {waterState === 'held' && (
            <mesh position={[0, 2, 0]} onClick={onWaterTree}>
              <cylinderGeometry args={[1.5, 1.5, 4, 12]} />
              <meshStandardMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </>
      )}
    </group>
  )
}

// ─── Ground click handler — raycasts to y=0 plane ────────────────────────────
function GroundClickPlane({ active, onPlace }) {
  const { camera, gl } = useThree()
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  const handleClick = useCallback((e) => {
    if (!active) return
    e.stopPropagation()
    const rect   = gl.domElement.getBoundingClientRect()
    const mouse  = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width)  * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )
    raycaster.setFromCamera(mouse, camera)
    const hit = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, hit)
    if (hit) onPlace(hit.x, hit.z)
  }, [active, camera, gl, plane, raycaster, onPlace])

  useEffect(() => {
    if (!active) return
    gl.domElement.addEventListener('click', handleClick)
    return () => gl.domElement.removeEventListener('click', handleClick)
  }, [active, handleClick, gl])

  return null
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ trees, activeTreeIdx, waterState, onPickUp, onWaterTree, plantingMode, onPlace }) {
  // Collect all petal colors for falling petals
  const petalColors = trees.map(t => {
    const pal = FLOWER_PALETTES.find(p => p.id === t.paletteId) || FLOWER_PALETTES[0]
    return pal.petal
  })

  return (
    <>
      <Background />
      <ambientLight intensity={0.85} />
      <directionalLight castShadow position={[6, 14, 6]} intensity={1.4} shadow-mapSize={[2048, 2048]} />
      <hemisphereLight skyColor="#d4c0b0" groundColor="#a89078" intensity={0.5} />
      <Clouds />

      {trees.map((tree, i) => (
        <TreeInstance
          key={tree.id}
          tree={tree}
          isActive={i === activeTreeIdx}
          waterState={i === activeTreeIdx ? waterState : 'idle'}
          onPickUp={onPickUp}
          onWaterTree={onWaterTree}
        />
      ))}

      {/* One FallingPetals per unique color, lightweight */}
      {[...new Set(petalColors)].map((col, i) => (
        <FallingPetals key={col} count={30} color={col} />
      ))}

      <GroundClickPlane active={plantingMode} onPlace={onPlace} />

      <SceneOrbitControls />
    </>
  )
}

// ─── Color picker carousel ────────────────────────────────────────────────────
function ColorCarousel({ onSelect, onCancel }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [angle, setAngle]         = useState(0)
  const animRef = useRef(null)
  const targetAngle = useRef(0)
  const currentAngle = useRef(0)

  const COUNT  = FLOWER_PALETTES.length
  const RADIUS = 160   // px — orbit radius

  // Smooth rotation animation
  useEffect(() => {
    const animate = () => {
      currentAngle.current += (targetAngle.current - currentAngle.current) * 0.08
      setAngle(currentAngle.current)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  function rotateTo(idx) {
    setActiveIdx(idx)
    targetAngle.current = -(idx / COUNT) * Math.PI * 2
  }

  function handlePrev() { rotateTo((activeIdx - 1 + COUNT) % COUNT) }
  function handleNext() { rotateTo((activeIdx + 1) % COUNT) }

  const activePal = FLOWER_PALETTES[activeIdx]

  return (
    <div style={cs.overlay}>
      {/* Title */}
      <div style={cs.title}>Choose Your Blossom Color</div>
      <div style={cs.subtitle}>Select a flower palette for your tree</div>

      {/* Carousel orbit */}
      <div style={cs.orbitWrap}>
        {FLOWER_PALETTES.map((pal, i) => {
          const theta   = angle + (i / COUNT) * Math.PI * 2
          const x       = Math.sin(theta) * RADIUS
          const zDepth  = Math.cos(theta)           // -1 to 1, back to front
          const scale   = 0.55 + 0.45 * ((zDepth + 1) / 2)   // 0.55 → 1.0
          const opacity = 0.4 + 0.6 * ((zDepth + 1) / 2)
          const isActive = i === activeIdx
          const zIndex  = Math.round(zDepth * 100) + 100

          return (
            <div
              key={pal.id}
              onClick={() => rotateTo(i)}
              style={{
                ...cs.card,
                transform: `translateX(calc(-50% + ${x}px)) translateY(${-zDepth * 18}px) scale(${scale})`,
                opacity,
                zIndex,
                background: isActive
                  ? `linear-gradient(145deg, ${pal.light}, ${pal.dark})`
                  : `linear-gradient(145deg, ${pal.light}cc, ${pal.dark}99)`,
                boxShadow: isActive
                  ? `0 12px 40px ${pal.center}55, 0 4px 0 ${pal.center}88, inset 0 1px 0 rgba(255,255,255,0.6)`
                  : `0 4px 16px rgba(0,0,0,0.1), 0 2px 0 ${pal.center}44`,
                border: isActive
                  ? `2px solid ${pal.center}aa`
                  : `1.5px solid ${pal.light}88`,
              }}
            >
              {/* Flower preview circles */}
              <div style={cs.flowerPreview}>
                {[0, 1, 2, 3, 4].map(pi => {
                  const pa = (pi / 5) * Math.PI * 2
                  return (
                    <div key={pi} style={{
                      ...cs.petalDot,
                      background: pi % 2 === 0 ? pal.light : pal.dark,
                      left: `calc(50% + ${Math.cos(pa) * 16}px - 8px)`,
                      top:  `calc(50% + ${Math.sin(pa) * 16}px - 8px)`,
                    }} />
                  )
                })}
                <div style={{ ...cs.centerDot, background: pal.center }} />
              </div>
              <div style={{ ...cs.cardName, color: pal.center }}>{pal.name}</div>
            </div>
          )
        })}

        {/* Center preview (large active color swatch) */}
        <div style={{
          ...cs.centerSwatch,
          background: `radial-gradient(circle, ${activePal.light} 0%, ${activePal.dark} 60%, ${activePal.center}44 100%)`,
          boxShadow: `0 0 40px ${activePal.center}44`,
        }} />
      </div>

      {/* Arrow nav */}
      <div style={cs.navRow}>
        <button style={cs.navBtn} onClick={handlePrev}>‹</button>
        <div style={cs.activeName}>
          <div style={{ ...cs.activeSwatchDot, background: activePal.center }} />
          {activePal.name}
        </div>
        <button style={cs.navBtn} onClick={handleNext}>›</button>
      </div>

      {/* Action buttons */}
      <div style={cs.actionRow}>
        <button style={cs.cancelBtn} onClick={onCancel}>Cancel</button>
        <button
          style={{ ...cs.confirmBtn, background: `linear-gradient(180deg, ${activePal.light}, ${activePal.center})` }}
          onClick={() => onSelect(activePal.id)}
        >
          Plant This Tree 
        </button>
      </div>
    </div>
  )
}

// ─── Progress UI panel ────────────────────────────────────────────────────────
function StageSegment({ stage, displayStage }) {
  const reached  = displayStage >= stage
  const isCurrent = displayStage === stage
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
      <div style={{
        width: '100%', height: 4, borderRadius: 2,
        background: reached ? `linear-gradient(90deg, ${C.barFill1}, ${C.barFill2})` : 'rgba(168,106,101,0.2)',
        transition: 'background 0.5s',
      }} />
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: reached ? STAGE_COLORS[stage] : 'rgba(168,106,101,0.2)',
        boxShadow: isCurrent ? `0 0 8px ${STAGE_COLORS[stage]}` : 'none',
        transform: isCurrent ? 'scale(1.4)' : 'scale(1)',
        transition: 'all 0.4s',
        border: `1.5px solid ${reached ? STAGE_COLORS[stage] : 'rgba(168,106,101,0.3)'}`,
      }} />
      <span style={{ fontSize: 9, color: reached ? C.uiText : C.uiTextLight, letterSpacing: '0.5px', fontWeight: reached ? 600 : 400 }}>
        {STAGE_NAMES[stage]}
      </span>
    </div>
  )
}

function ProgressUI({ points, bank, activeTree, treeCount, onSwitchTree, onOpenCarousel, canPlantNew }) {
  const displayStage = activeTree?.displayStage || 1
  const cost         = getWaterCost(displayStage)
  const pal          = FLOWER_PALETTES.find(p => p.id === activeTree?.paletteId) || FLOWER_PALETTES[0]

  return (
    <div style={ui.panel}>
      <div style={ui.header}>
        <div>
          <div style={ui.tagline}>Grow Some Trees</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ ...ui.stageChip, background: `${pal.light}88`, borderColor: `${pal.center}55` }}>
            <span style={{ ...ui.stageDot, background: pal.center }} />
            {STAGE_NAMES[displayStage]}
          </div>
        </div>
      </div>

      <div style={ui.divider} />

      {/* Active tree color indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ ...ui.colorSwatch, background: `linear-gradient(135deg, ${pal.light}, ${pal.center})` }} />
        <span style={{ fontSize: 11, color: C.uiTextLight }}>
          Tree {(activeTree?.id ?? 0) + 1} · <strong style={{ color: C.uiText }}>{pal.name}</strong>
        </span>
        {treeCount > 1 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {Array.from({ length: treeCount }, (_, i) => (
              <button key={i} onClick={() => onSwitchTree(i)} style={{
                width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: i === (activeTree?.id ?? 0)
                  ? `linear-gradient(135deg, ${FLOWER_PALETTES.find(p => p.id === (activeTree?.paletteId))?.light || '#ffc8d8'}, ${FLOWER_PALETTES.find(p => p.id === (activeTree?.paletteId))?.center || '#d63384'})`
                  : 'rgba(168,106,101,0.2)',
                boxShadow: i === (activeTree?.id ?? 0) ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                fontSize: 10, fontWeight: 700, color: '#fff',
              }}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>

      <div style={ui.divider} />

      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start', paddingTop: 4 }}>
        {[1, 2, 3, 4].map(st => <StageSegment key={st} stage={st} displayStage={displayStage} />)}
      </div>

      <div style={ui.divider} />

      <div style={ui.bankRow}>
        <div style={ui.bankBlock}>
          <div style={ui.bankLabel}>Total Pts</div>
          <div style={ui.bankValue}>{points}</div>
        </div>
        <div style={ui.bankSep} />
        <div style={ui.bankBlock}>
          <div style={ui.bankLabel}>Bank</div>
          <div style={{ ...ui.bankValue, color: bank > 0 ? C.uiAccent : C.uiTextLight }}>{bank}</div>
        </div>
        <div style={ui.bankSep} />
        <div style={ui.bankBlock}>
          <div style={ui.bankLabel}>Next</div>
          <div style={ui.bankValue}>{displayStage < 4 ? `${cost}p` : '🌸'}</div>
        </div>
      </div>

      {/* Plant new tree button */}
      {canPlantNew && (
        <>
          <div style={ui.divider} />
          <button style={ui.plantBtn} onClick={onOpenCarousel}>
            Plant New Tree
          </button>
        </>
      )}
    </div>
  )
}

// ─── Points counter ───────────────────────────────────────────────────────────
function PointsCounter({ points, bank, onAdd, onSpend, activeTree, showEarnButtons = true }) {
  const displayStage = activeTree?.displayStage || 1
  const cost     = getWaterCost(displayStage)
  const canSpend = bank >= cost && displayStage < 4

  return (
    <div style={ui.counterCard}>
      {showEarnButtons && (
        <>
          <div style={ui.counterSection}>
            <div style={ui.counterLabel}>Earn Points</div>
            <div style={ui.counterBtnRow}>
              <button style={ui.btn3d}             onClick={() => onAdd(1)}>+1</button>
              <button style={{ ...ui.btn3d, ...ui.btn3dAccent }} onClick={() => onAdd(5)}>+5</button>
              <button style={{ ...ui.btn3d, ...ui.btn3dAccent }} onClick={() => onAdd(10)}>+10</button>
            </div>
          </div>
          <div style={ui.counterDividerV} />
        </>
      )}
      <div style={ui.counterSection}>
        <div style={ui.counterLabel}>Bank: <strong style={{ color: C.uiAccent }}>{bank}</strong></div>
        <button
          style={{ ...ui.btn3dWide, opacity: canSpend ? 1 : 0.45, cursor: canSpend ? 'pointer' : 'not-allowed' }}
          onClick={canSpend ? onSpend : undefined}
        >
          {displayStage < 4 ? `Water (${cost} pts)` : 'fully Grown!'}
        </button>
      </div>
    </div>
  )
}

function WaterHint({ waterState }) {
  if (waterState === 'idle' || waterState === 'done') return null
  const msg = { ready: 'click the watering can', held: 'click the tree to water', watering: 'growing' }
  return <div style={ui.hint}>{msg[waterState] || ''}</div>
}

function PlantingHint({ active }) {
  if (!active) return null
  return <div style={{ ...ui.hint, bottom: 110, background: 'rgba(168,106,101,0.85)', color: '#fff' }}>
    🌱  Click anywhere on the ground to plant your tree
  </div>
}

// ─── Root export ──────────────────────────────────────────────────────────────
const DEFAULT_TREES = [{ id: 0, x: 0, z: 0, paletteId: 'sakura', displayStage: 1 }]

export default function TreeScene({
  userPoints,
  userBank,
  userTrees,
  onBankChange,
  onTreesChange,
  embedded = false,
  onDoubleClick,
} = {}) {
  const [points, setPoints] = useState(0)
  const [bank, setBank] = useState(0)
  const [waterState, setWaterState] = useState('idle')
  const [activeTreeIdx, setActiveTreeIdx] = useState(0)
  const [showCarousel, setShowCarousel] = useState(false)
  const [plantingMode, setPlantingMode] = useState(false)
  const [pendingPalette, setPendingPalette] = useState(null)
  const [trees, setTrees] = useState(DEFAULT_TREES)

  const isControlled = embedded && typeof userPoints === 'number' && onBankChange && onTreesChange
  const pointsVal = isControlled ? userPoints : points
  const bankVal = isControlled ? (userBank ?? userPoints ?? 0) : bank
  const treesVal = isControlled ? (userTrees ?? DEFAULT_TREES) : trees

  const activeTree = treesVal[activeTreeIdx]
  const allFullyGrown = treesVal.length > 0 && treesVal.every(t => t.displayStage === 4)
  const canPlantNew = allFullyGrown && !showCarousel && !plantingMode

  function handleAdd(n) {
    if (isControlled) return
    setPoints(p => p + n)
    setBank(b => b + n)
  }

  function handleSpend() {
    const cost = getWaterCost(activeTree?.displayStage)
    if (bankVal >= cost && activeTree?.displayStage < 4) {
      if (isControlled) onBankChange(bankVal - cost)
      else setBank(b => b - cost)
      setWaterState('ready')
    }
  }

  function handlePickUp() { setWaterState('held') }

  function handleWaterTree() {
    setWaterState('watering')
    setTimeout(() => {
      const updated = treesVal.map((t, i) =>
        i === activeTreeIdx ? { ...t, displayStage: Math.min(t.displayStage + 1, 4) } : t
      )
      if (isControlled) onTreesChange(updated)
      else setTrees(updated)
      setWaterState('idle')
    }, 2500)
  }

  function handleOpenCarousel() { setShowCarousel(true) }

  function handleSelectPalette(paletteId) {
    setShowCarousel(false)
    setPlantingMode(true)
    setPendingPalette(paletteId)
  }

  function handlePlace(x, z) {
    if (!plantingMode || !pendingPalette) return
    const newTree = {
      id: treesVal.length,
      x: Math.max(-6, Math.min(6, x)),
      z: Math.max(-6, Math.min(6, z)),
      paletteId: pendingPalette,
      displayStage: 1,
    }
    const nextTrees = [...treesVal, newTree]
    if (isControlled) onTreesChange(nextTrees)
    else setTrees(nextTrees)
    setActiveTreeIdx(treesVal.length)
    setPlantingMode(false)
    setPendingPalette(null)
  }

  const rootStyle = embedded ? { ...ui.root, position: 'absolute', inset: 0, width: '100%', height: '100%' } : ui.root

  return (
    <div style={rootStyle} onDoubleClick={onDoubleClick}>
      <Canvas
        shadows
        camera={{ position: [0, 4, 11], fov: 50 }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        gl={{ antialias: true }}
        onDoubleClick={onDoubleClick}
      >
        <Scene
          trees={treesVal}
          activeTreeIdx={activeTreeIdx}
          waterState={waterState}
          onPickUp={handlePickUp}
          onWaterTree={handleWaterTree}
          plantingMode={plantingMode}
          onPlace={handlePlace}
        />
      </Canvas>

      {showCarousel && (
        <ColorCarousel
          onSelect={handleSelectPalette}
          onCancel={() => setShowCarousel(false)}
        />
      )}

      {!showCarousel && (
        <>
          <ProgressUI
            points={pointsVal}
            bank={bankVal}
            activeTree={activeTree}
            treeCount={treesVal.length}
            onSwitchTree={setActiveTreeIdx}
            onOpenCarousel={handleOpenCarousel}
            canPlantNew={canPlantNew}
          />
          <PointsCounter
            points={pointsVal}
            bank={bankVal}
            onAdd={handleAdd}
            onSpend={handleSpend}
            activeTree={activeTree}
            showEarnButtons={!isControlled}
          />
          <WaterHint waterState={waterState} />
          <PlantingHint active={plantingMode} />
        </>
      )}
    </div>
  )
}









// ─── UI Styles ────────────────────────────────────────────────────────────────
const ui = {
  root: {
    position: 'fixed', inset: 0, width: '100vw', height: '100vh',
    overflow: 'hidden', fontFamily: "'Georgia', 'Palatino Linotype', serif",
  },
  panel: {
    position: 'absolute', top: 20, left: 20, zIndex: 10,
    display: 'flex', flexDirection: 'column', gap: 12,
    background: 'rgba(240,228,220,0.55)',
    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(168,106,101,0.25)',
    borderRadius: 20, padding: '18px 20px', minWidth: 260,
    boxShadow: '0 4px 24px rgba(117,75,77,0.12)',
  },
  header:    { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark:  { fontSize: 34, lineHeight: 1, color: C.uiAccent, textShadow: '0 0 16px rgba(168,106,101,0.5)' },
  appName:   { fontSize: 20, fontWeight: 700, color: C.uiText, letterSpacing: '-0.2px' },
  tagline:   { fontSize: 10, color: C.uiTextLight, letterSpacing: '1.6px', textTransform: 'uppercase', marginTop: 1 },
  stageChip: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: C.uiText, borderRadius: 20, padding: '3px 10px', border: '1.5px solid' },
  stageDot:  { display: 'inline-block', width: 7, height: 7, borderRadius: '50%' },
  colorSwatch: { width: 20, height: 20, borderRadius: '50%', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' },
  divider:   { height: 1, background: 'linear-gradient(90deg, transparent, rgba(168,106,101,0.25), transparent)' },
  bankRow:   { display: 'flex', alignItems: 'center', background: 'rgba(212,184,168,0.25)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(168,106,101,0.15)' },
  bankBlock: { flex: 1, textAlign: 'center', padding: '8px 4px' },
  bankLabel: { fontSize: 9, color: C.uiTextLight, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 3 },
  bankValue: { fontSize: 18, fontWeight: 700, color: C.uiText },
  bankSep:   { width: 1, alignSelf: 'stretch', background: 'rgba(168,106,101,0.18)' },
  plantBtn:  {
    padding: '9px 0', border: 'none', borderRadius: 12, cursor: 'pointer',
    background: 'linear-gradient(180deg, #cb997e, #754b4d)',
    color: '#fff', fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: 13,
    boxShadow: '0 3px 0 rgba(80,30,35,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
    letterSpacing: '0.3px',
  },
  counterCard: {
    position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
    display: 'flex', alignItems: 'center',
    background: 'rgba(240,228,220,0.60)',
    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(168,106,101,0.25)', borderRadius: 24,
    boxShadow: '0 6px 28px rgba(117,75,77,0.15), 0 1px 0 rgba(255,255,255,0.6) inset',
    overflow: 'hidden',
  },
  counterSection:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 20px' },
  counterLabel:     { fontSize: 10, color: C.uiTextLight, letterSpacing: '1.2px', textTransform: 'uppercase' },
  counterDividerV:  { width: 1, alignSelf: 'stretch', background: 'rgba(168,106,101,0.2)' },
  counterBtnRow:    { display: 'flex', gap: 8 },
  btn3d: {
    padding: '7px 14px', border: 'none', borderRadius: 10,
    background: 'linear-gradient(180deg, #e8d5c8 0%, #d4b8a8 100%)',
    color: C.uiText, fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: 13, cursor: 'pointer',
    boxShadow: '0 3px 0 rgba(117,75,77,0.35), inset 0 1px 0 rgba(255,255,255,0.5)',
  },
  btn3dAccent: {
    background: `linear-gradient(180deg, ${C.uiAccent} 0%, ${C.uiAccent2} 100%)`,
    color: '#fff',
    boxShadow: `0 3px 0 rgba(80,30,35,0.45), inset 0 1px 0 rgba(255,255,255,0.25)`,
  },
  btn3dWide: {
    padding: '9px 22px', border: 'none', borderRadius: 12,
    background: 'linear-gradient(180deg, #cb997e 0%, #a86a65 50%, #754b4d 100%)',
    color: '#fff', fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: 13, cursor: 'pointer',
    boxShadow: '0 4px 0 rgba(80,30,35,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  hint: {
    position: 'absolute', bottom: 110, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
    background: 'rgba(240,228,220,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(168,106,101,0.3)', borderRadius: 30, padding: '10px 24px',
    color: C.uiText, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none',
  },
}









// ─── Carousel Styles ──────────────────────────────────────────────────────────
const cs = {
  overlay: {
    position: 'absolute', inset: 0, zIndex: 50,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(212,184,168,0.55)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    fontFamily: "'Georgia', 'Palatino Linotype', serif",
  },
  title: {
    fontSize: 28, fontWeight: 700, color: C.uiText,
    letterSpacing: '-0.3px', marginBottom: 4,
    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
  },
  subtitle: {
    fontSize: 12, color: C.uiTextLight, letterSpacing: '1.5px',
    textTransform: 'uppercase', marginBottom: 40,
  },
  orbitWrap: {
    position: 'relative', width: 480, height: 220,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 36,
  },
  card: {
    position: 'absolute',
    width: 100, height: 120,
    borderRadius: 18,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 10, cursor: 'pointer',
    transition: 'box-shadow 0.2s',
    userSelect: 'none',
  },
  flowerPreview: {
    position: 'relative', width: 48, height: 48,
  },
  petalDot: {
    position: 'absolute', width: 16, height: 16, borderRadius: '50%',
  },
  centerDot: {
    position: 'absolute', width: 12, height: 12, borderRadius: '50%',
    left: 'calc(50% - 6px)', top: 'calc(50% - 6px)',
    zIndex: 2,
  },
  cardName: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.4px',
    textAlign: 'center',
  },
  centerSwatch: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: '50%',
    pointerEvents: 'none', zIndex: 0,
    transition: 'background 0.4s, box-shadow 0.4s',
  },
  navRow: {
    display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24,
  },
  navBtn: {
    width: 44, height: 44, borderRadius: '50%', border: 'none',
    background: 'rgba(168,106,101,0.15)', color: C.uiText,
    fontSize: 24, fontWeight: 300, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(117,75,77,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
    transition: 'background 0.2s',
  },
  activeName: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 16, fontWeight: 700, color: C.uiText,
    minWidth: 140, justifyContent: 'center',
  },
  activeSwatchDot: {
    width: 14, height: 14, borderRadius: '50%',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
  },
  actionRow: {
    display: 'flex', gap: 14,
  },
  cancelBtn: {
    padding: '11px 28px', border: '1.5px solid rgba(168,106,101,0.4)',
    borderRadius: 14, background: 'rgba(240,228,220,0.6)',
    color: C.uiTextLight, fontFamily: "'Georgia', serif",
    fontWeight: 600, fontSize: 14, cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(117,75,77,0.1)',
  },
  confirmBtn: {
    padding: '11px 32px', border: 'none', borderRadius: 14,
    color: '#fff', fontFamily: "'Georgia', serif",
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
    boxShadow: '0 4px 0 rgba(80,30,35,0.35), 0 2px 12px rgba(117,75,77,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
    letterSpacing: '0.3px',
  },
}