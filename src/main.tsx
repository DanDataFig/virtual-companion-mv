import { StrictMode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import App from './App.tsx'
import "./main.css"
import "@github/spark/spark"

function ErrorFallback({error}: {error: Error}) {
  return (
    <div role="alert" className="p-6 text-center">
      <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
      <details className="text-sm text-gray-600">
        <summary className="cursor-pointer mb-2">Error details</summary>
        <pre className="whitespace-pre-wrap text-left bg-gray-100 p-2 rounded">
          {error.message}
        </pre>
      </details>
    </div>
  )
}

export default (
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  </StrictMode>
)







