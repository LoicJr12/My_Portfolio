import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { GUIDE_NAME } from '../journey/stops'
import { journey, setGuidePos } from '../journey/store'

// Texte qui s'écrit lettre par lettre (basé sur le temps écoulé : reste fluide même si le PC rame)
function useTypewriter(text, speed = 22) {
  const [out, setOut] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setOut('')
    setDone(false)
    const start = performance.now()
    const id = setInterval(() => {
      const n = Math.min(text.length, Math.floor((performance.now() - start) / speed))
      setOut(text.slice(0, n))
      if (n >= text.length) {
        clearInterval(id)
        setDone(true)
      }
    }, 30)
    return () => clearInterval(id)
  }, [text, speed])
  return { typed: out, done }
}

// Après lecture, la bulle se replie en pastille pour ne pas masquer le contenu
// (plus court sur mobile, où l'écran est petit)
const READ_TIME =
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches ? 4000 : 7000

const DRAG_THRESHOLD = 6 // px : en dessous, c'est un clic ; au-delà, on déplace Nova
const DOUBLE_DELAY = 260 // ms : deux clics/taps rapprochés = remettre Nova à sa place
const KEY_STEP = 0.03 // déplacement au clavier (3 % de l'écran par appui sur une flèche)
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// Poignée invisible posée sur Nova (sa taille et sa position sont mises à jour par Guide.jsx).
// Elle capte souris ET doigt ; `touch-action: none` ne bloque le défilement que lorsqu'on touche Nova.
const NovaHandle = forwardRef(function NovaHandle({ onNext, onReset }, ref) {
  const drag = useRef(null)
  const clickTimer = useRef(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => () => clearTimeout(clickTimer.current), [])

  // Clic simple → réplique suivante ; double clic → retour à la place automatique
  const tap = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      onReset()
      return
    }
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null
      onNext()
    }, DOUBLE_DELAY)
  }

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const r = e.currentTarget.getBoundingClientRect()
    drag.current = {
      x0: e.clientX,
      y0: e.clientY,
      // Décalage entre le doigt et le centre de Nova : il ne "saute" pas sous le pointeur
      offX: e.clientX - (r.left + r.width / 2),
      offY: e.clientY - (r.top + r.height / 2),
      moved: false,
    }
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < DRAG_THRESHOLD) return
      d.moved = true
      journey.guideDragging = true
      setDragging(true)
    }
    journey.guidePos = {
      x: clamp((e.clientX - d.offX) / window.innerWidth, 0.04, 0.96),
      y: clamp((e.clientY - d.offY) / window.innerHeight, 0.08, 0.94),
    }
  }

  const endDrag = (e, cancelled) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    journey.guideDragging = false
    setDragging(false)
    if (d.moved) setGuidePos(journey.guidePos) // mémorisé pour les prochaines visites
    else if (!cancelled) tap()
  }

  // Clavier : Entrée/Espace = réplique suivante, flèches = déplacer, Échap = remettre à sa place
  const onKeyDown = (e) => {
    const steps = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    if (steps[e.key]) {
      e.preventDefault()
      const r = e.currentTarget.getBoundingClientRect()
      const cur = journey.guidePos ?? {
        x: (r.left + r.width / 2) / window.innerWidth,
        y: (r.top + r.height / 2) / window.innerHeight,
      }
      const [dx, dy] = steps[e.key]
      setGuidePos({ x: clamp(cur.x + dx * KEY_STEP, 0.04, 0.96), y: clamp(cur.y + dy * KEY_STEP, 0.08, 0.94) })
    } else if (e.key === 'Escape') {
      onReset()
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`nova-handle ${dragging ? 'is-dragging' : ''}`}
      aria-label={`${GUIDE_NAME}, ton guide. Entrée : réplique suivante. Flèches : le déplacer. Échap : le remettre à sa place.`}
      title="Clique pour la suite · fais-moi glisser pour me déplacer · double-clic pour me remettre à ma place"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e, false)}
      onPointerCancel={(e) => endDrag(e, true)}
      onPointerEnter={() => (journey.guideHover = true)}
      onPointerLeave={() => (journey.guideHover = false)}
      // Clic clavier uniquement (detail = 0) : les clics souris/tactiles passent par les événements pointer
      onClick={(e) => e.detail === 0 && onNext()}
      onKeyDown={onKeyDown}
    />
  )
})

// Bulle de dialogue + poignée de Nova. Leurs positions sont mises à jour par la scène 3D (Guide.jsx).
const GuideBubble = forwardRef(function GuideBubble({ text, hasMore, onNext }, ref) {
  const { typed, done } = useTypewriter(text)
  const [collapsed, setCollapsed] = useState(false)
  const anchorRef = useRef()
  const handleRef = useRef()

  // Guide.jsx lit ces deux éléments à chaque image (getters : toujours l'élément affiché)
  useImperativeHandle(
    ref,
    () => ({
      get bubble() {
        return anchorRef.current
      },
      get handle() {
        return handleRef.current
      },
    }),
    [],
  )

  useEffect(() => {
    setCollapsed(false)
  }, [text])
  useEffect(() => {
    if (!done) return
    const id = setTimeout(() => setCollapsed(true), READ_TIME)
    return () => clearTimeout(id)
  }, [done, text])

  const reset = () => {
    setGuidePos(null)
    setCollapsed(false)
  }

  return (
    <>
      <NovaHandle ref={handleRef} onNext={onNext} onReset={reset} />
      <div ref={anchorRef} className="bubble-anchor">
        {collapsed ? (
          <button
            type="button"
            className="bubble bubble--mini"
            onClick={() => setCollapsed(false)}
            aria-label={`Rouvrir le message de ${GUIDE_NAME}`}
          >
            <span className="bubble__dots">
              <i />
              <i />
              <i />
            </span>
          </button>
        ) : (
          <button type="button" className="bubble" onClick={onNext} aria-live="polite">
            <span className="bubble__name">{GUIDE_NAME} · guide</span>
            <p>
              {typed}
              <span className="bubble__caret" />
            </p>
            {hasMore && <span className="bubble__hint">clique pour la suite ↻</span>}
          </button>
        )}
      </div>
    </>
  )
})

export default GuideBubble
