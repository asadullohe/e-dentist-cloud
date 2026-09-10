import '@fontsource-variable/inter'
import './app/styles/index.css'

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
