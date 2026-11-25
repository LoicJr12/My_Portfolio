import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'

// Page projet téléchargée seulement quand on clique sur « Explorer »
const ProjetDetail = lazy(() => import('./pages/ProjetDetail'))

// Structure des pages (remplies étape par étape) :
//  /                 → expérience principale : hero 3D, parcours (R1, R7), projets (R2, R8),
//                      stats (R3), graphe de compétences (R5)
//  /projets/:slug    → détail d'un projet (R6) + projets similaires (R4)
export default function App() {
  return (
    <Suspense fallback={<div className="route-loading">Atterrissage…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projets/:slug" element={<ProjetDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
