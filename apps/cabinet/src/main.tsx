import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/schibsted-grotesk'
import './styles.css'
import './kabinet.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { AuthTaminlovchi } from './lib/auth'

const ildiz = document.getElementById('root')
if (!ildiz) throw new Error('#root topilmadi')

createRoot(ildiz).render(
  <StrictMode>
    <BrowserRouter>
      <AuthTaminlovchi>
        <App />
      </AuthTaminlovchi>
    </BrowserRouter>
  </StrictMode>,
)
