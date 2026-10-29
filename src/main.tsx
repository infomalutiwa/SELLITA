import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

if (location.search.includes('export')) {
  // Film-Zeit wird vom Export-Skript gesetzt (window.__setTime)
  let t = 0
  ;(window as unknown as { __setTime: (v: number) => void }).__setTime = (v) => { t = v }
  performance.now = () => t * 1000
}

createRoot(document.getElementById('root')!).render(<App />)
