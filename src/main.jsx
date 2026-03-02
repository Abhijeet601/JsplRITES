import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const normalizedPath = window.location.pathname.replace(/\/{2,}/g, '/')
if (normalizedPath !== window.location.pathname) {
  window.history.replaceState(
    window.history.state,
    '',
    `${normalizedPath}${window.location.search}${window.location.hash}`,
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
