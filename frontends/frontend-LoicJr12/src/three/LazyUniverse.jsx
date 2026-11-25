import { lazy, Suspense } from 'react'

// L'univers 3D (Three.js, ~270 Ko compressés) est chargé APRÈS le texte de la page :
// le contenu s'affiche immédiatement, puis l'espace apparaît en fondu.
const Universe = lazy(() => import('./Universe'))

export default function LazyUniverse(props) {
  return (
    <Suspense fallback={<div className="universe universe--loading" aria-hidden="true" />}>
      <Universe {...props} />
    </Suspense>
  )
}
