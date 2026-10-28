import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw, AlertTriangle, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  isChunkError: boolean
}

const CHUNK_RETRY_KEY = 'tripkhata_chunk_retry_attempted'

export default class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      isChunkError: false,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    const message = error?.message || ''
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Importing a module script failed') ||
      message.includes('error loading dynamically imported module')

    return {
      hasError: true,
      error,
      isChunkError,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RouteErrorBoundary caught an error:', error, errorInfo)

    // For chunk errors on stale deployments, attempt one safe automatic reload
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed')

    if (isChunkError && typeof window !== 'undefined') {
      const alreadyRetried = sessionStorage.getItem(CHUNK_RETRY_KEY)
      if (!alreadyRetried) {
        sessionStorage.setItem(CHUNK_RETRY_KEY, 'true')
        window.location.reload()
      }
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CHUNK_RETRY_KEY)
      window.location.reload()
    }
  }

  handleReset = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CHUNK_RETRY_KEY)
      window.location.href = '/trips'
    }
  }

  render() {
    if (this.state.hasError) {
      const { isChunkError, error } = this.state

      return (
        <div
          className="page"
          style={{
            minHeight: '65vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            className="card-elevated"
            style={{
              maxWidth: 520,
              width: '100%',
              padding: '36px 28px',
              textAlign: 'center',
              borderRadius: 16,
              border: '1px solid rgba(224, 86, 36, 0.3)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'rgba(224, 86, 36, 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-warning)',
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h2
              className="font-display"
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              {isChunkError ? 'New Update Detected' : 'Unable to Load Section'}
            </h2>

            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              {isChunkError
                ? 'A newer version of TripKhata was deployed or your connection was interrupted. Please reload to fetch the latest assets.'
                : error?.message || 'An unexpected error occurred while loading this view.'}
            </p>

            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                className="btn-primary"
                onClick={this.handleReload}
                style={{ padding: '9px 18px', fontSize: '0.88rem' }}
              >
                <RotateCcw size={16} /> Reload Application
              </button>
              <button
                className="btn-secondary"
                onClick={this.handleReset}
                style={{ padding: '9px 18px', fontSize: '0.88rem' }}
              >
                <Home size={16} /> Return to Trips
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
