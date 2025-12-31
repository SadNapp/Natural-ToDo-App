import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles//index.css'
//import '../index.css'
import App from './TodoApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
 