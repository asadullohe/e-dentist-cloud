import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/schibsted-grotesk'
import './app/styles/tokens.scss'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'

const root = document.getElementById('root')
if (!root) throw new Error('#root topilmadi')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
