// Clé de stockage de la position de Nova — déclarée AVANT `journey`, qui la lit dès sa création
const GUIDE_KEY = 'nova-position'

// État partagé du "voyage" entre la page HTML et la scène 3D.
// Objet mutable (pas de state React) : lu à chaque frame par Three.js sans re-render.
export const journey = {
  scrollY: 0, // défilement brut (px)
  scrollSmooth: 0, // défilement lissé, utilisé par la scène
  velocity: 0, // vitesse lissée (px/s) → effet "hyper-espace"
  progress: 0, // 0 → 1 sur toute la page
  heroProgress: 0, // 0 → 1 sur le premier écran (robot qui rejoint son coin)
  forceCorner: false, // vrai hors de l'accueil : Nova reste dans son coin
  pointer: { x: 0, y: 0 }, // souris normalisée [-1, 1]
  // Nova déplacé à la main : position du centre en fraction de l'écran { x, y } (0 → 1), ou null = placement auto
  guidePos: loadGuidePos(),
  guideDragging: false, // vrai pendant qu'on fait glisser Nova
  guideHover: false, // survol de Nova (petit grossissement)
  reducedMotion:
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
}

function loadGuidePos() {
  try {
    const v = JSON.parse(window.localStorage.getItem(GUIDE_KEY))
    return v && Number.isFinite(v.x) && Number.isFinite(v.y) ? v : null
  } catch {
    return null
  }
}

// Mémorise la position choisie (null = retour au placement automatique)
export function setGuidePos(pos) {
  journey.guidePos = pos
  try {
    if (pos) window.localStorage.setItem(GUIDE_KEY, JSON.stringify(pos))
    else window.localStorage.removeItem(GUIDE_KEY)
  } catch {
    /* stockage indisponible (navigation privée…) : la position vaut pour cette visite */
  }
}

let started = false

export function startJourneyTracking() {
  if (started) return
  started = true

  const onScroll = () => {
    journey.scrollY = window.scrollY
    const max = document.documentElement.scrollHeight - window.innerHeight
    journey.progress = max > 0 ? window.scrollY / max : 0
    journey.heroProgress = Math.min(1, window.scrollY / (window.innerHeight * 0.8))
  }
  const onPointer = (e) => {
    journey.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    journey.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  window.addEventListener('pointermove', onPointer, { passive: true })
  onScroll()
}

// Lissage appelé à chaque frame par la scène 3D
export function updateJourney(delta) {
  const prev = journey.scrollSmooth
  const k = 1 - Math.exp(-delta * 6)
  journey.scrollSmooth += (journey.scrollY - journey.scrollSmooth) * k
  const instant = delta > 0 ? (journey.scrollSmooth - prev) / delta : 0
  journey.velocity += (instant - journey.velocity) * (1 - Math.exp(-delta * 4))
}
