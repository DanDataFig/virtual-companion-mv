import { createRoot } from 'react-dom/client'
import "@github/spark/spark"
import "@github/spark/spark"


import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
    <App />

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>

