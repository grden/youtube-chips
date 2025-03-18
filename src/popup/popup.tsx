import React from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'
import App from './app/app'

const container = document.createElement('div')
document.body.appendChild(container)
createRoot(container).render(<App />)
