import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Robot } from './Robot'
import { journey } from '../journey/store'

const tmp = new THREE.Vector3()
const anchor = new THREE.Vector3()
const ray = new THREE.Vector3()
const corner = new THREE.Vector3()
const prevPos = new THREE.Vector3()

// Point de l'écran (fractions 0 → 1) → point de la scène sur le plan z = 0, là où vit Nova
function screenToWorld(fx, fy, camera, out) {
  ray.set(fx * 2 - 1, -(fy * 2 - 1), 0.5).unproject(camera).sub(camera.position).normalize()
  const t = -camera.position.z / ray.z
  return out.copy(camera.position).addScaledVector(ray, t)
}

// Coordonnées écran (px) d'un point 3D
function toScreen(v, camera, size) {
  v.project(camera)
  return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height]
}

// Place Nova (placement auto à côté du nom → coin de l'écran, OU position choisie à la main),
// puis cale sur lui la bulle de dialogue et la poignée de déplacement (HTML, voir GuideBubble.jsx)
export function Guide({ waving, bubbleRef }) {
  const rig = useRef()
  const placed = useRef(false)

  useFrame((state) => {
    const { camera, size } = state
    const { width, height } = state.viewport.getCurrentViewport(camera, [0, 0, 0])
    const mobile = width < height
    const h = journey.forceCorner ? 1 : journey.heroProgress
    const ease = h * h * (3 - 2 * h)

    // Mobile : Nova se pose en haut à droite, au-dessus du texte d'accueil
    const heroPos = mobile ? [width * 0.26, height * 0.33, 0] : [width * 0.28, 0.1, 0]
    const cornerPos = [width / 2 - (mobile ? 0.8 : 1.3), -height / 2 + (mobile ? 1.0 : 1.5), 0]
    const heroScale = mobile ? 0.58 : 1.3
    const cornerScale = mobile ? 0.45 : 0.62

    const custom = journey.guidePos
    if (custom) {
      // Position choisie par l'utilisateur (Nova garde la taille "compagnon")
      screenToWorld(custom.x, custom.y, camera, tmp)
      tmp.z = 0
    } else {
      tmp.set(
        THREE.MathUtils.lerp(heroPos[0], cornerPos[0], ease),
        THREE.MathUtils.lerp(heroPos[1], cornerPos[1], ease),
        0,
      )
    }
    const baseScale = custom ? cornerScale : THREE.MathUtils.lerp(heroScale, cornerScale, ease)
    const s = baseScale * (journey.guideHover || journey.guideDragging ? 1.08 : 1)

    // 1re image : Nova apparaît directement à sa place ; pendant le glisser il suit le doigt de près
    const k = !placed.current ? 1 : journey.guideDragging ? 0.35 : 0.12
    placed.current = true
    prevPos.copy(rig.current.position)
    rig.current.position.lerp(tmp, k)
    rig.current.scale.lerp(tmp.set(s, s, s), k)
    rig.current.rotation.x = THREE.MathUtils.lerp(
      rig.current.rotation.x,
      -Math.min(journey.velocity / 4000, 0.4),
      0.1,
    )
    // Il se penche dans le sens où on le tire
    const lean = journey.guideDragging ? THREE.MathUtils.clamp(-(rig.current.position.x - prevPos.x) * 4, -0.5, 0.5) : 0
    rig.current.rotation.z = THREE.MathUtils.lerp(rig.current.rotation.z, lean, 0.15)

    const els = bubbleRef.current
    if (!els) return
    const sc = rig.current.scale.x
    const pos = rig.current.position

    // Poignée invisible calée sur le corps de Nova (de l'antenne au réacteur)
    if (els.handle) {
      const [x1, y1] = toScreen(corner.copy(pos).add(tmp.set(-0.62 * sc, 1.15 * sc, 0)), camera, size)
      const [x2, y2] = toScreen(corner.copy(pos).add(tmp.set(0.62 * sc, -1.05 * sc, 0)), camera, size)
      const hs = els.handle.style
      hs.transform = `translate3d(${x1.toFixed(1)}px, ${y1.toFixed(1)}px, 0)`
      hs.width = `${(x2 - x1).toFixed(1)}px`
      hs.height = `${(y2 - y1).toFixed(1)}px`
    }

    // Bulle : au-dessus à gauche par défaut, elle passe à droite / en dessous près des bords
    if (els.bubble) {
      const [cx, cy] = toScreen(corner.copy(pos), camera, size)
      const right = cx < size.width * 0.42
      const below = cy < size.height * 0.3
      const dx = right ? 0.55 : -0.55
      const dy = below ? -1.15 : 1.3
      const [x, y] = toScreen(anchor.copy(pos).add(tmp.set(dx * sc, dy * sc, 0)), camera, size)
      const b = els.bubble
      b.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      const side = `${right ? 'right' : 'left'} ${below ? 'below' : 'above'}`
      if (b.dataset.side !== side) b.dataset.side = side
    }
  })

  return (
    <group ref={rig}>
      <Robot waving={waving} />
    </group>
  )
}
