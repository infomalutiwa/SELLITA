import { createRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/open-sans/latin-600.css' // nur für die Zeile „Heizung & Sanitär“ im Logo
import './index.css'
import App from './App'

document.documentElement.classList.add('js')

createRoot(document.getElementById('root')!).render(<App />)
