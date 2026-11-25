import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
// Polices limitées à l'alphabet latin (français) : moins de fichiers à télécharger
import '@fontsource/unbounded/latin-700.css'
import '@fontsource/unbounded/latin-800.css'
import '@fontsource/unbounded/latin-900.css'
import '@fontsource/space-grotesk/latin-400.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
