import '@fontsource-variable/source-serif-4'
import '@fontsource-variable/dm-sans'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './layout/App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
