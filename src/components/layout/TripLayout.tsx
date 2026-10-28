import { useState, useEffect } from 'react'
import { Outlet, useParams, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import TripNotFoundPage from '../../pages/TripNotFoundPage'
import { Archive, RotateCcw } from 'lucide-react'

function TripLoadingFallback() {
  return (
    <div
      className="page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 16,
      }}
      role="status"
      aria-label="Loading expedition details"
    >
      <div
        className="skeleton"
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          opacity: 0.85,
        }}
      />
      <div
        className="skeleton"
        style={{
          width: 160,
          height: 14,
          borderRadius: 6,
          opacity: 0.6,
        }}
      />
    </div>
  )
}

function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.78rem',
      }}
    >
      © {new Date().getFullYear()} Md Zunaid Ali. All rights reserved. · TripKhata
    </footer>
  )
}

export default function TripLayout() {
  const { tripId } = useParams<{ tripId: string }>()
  const location = useLocation()
  const { trips, activeTrip, setActiveTripId, isLoading, restoreTrip } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [restoring, setRestoring] = useState(false)

  // Close mobile sidebar on route transition
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Sync activeTripId with tripId in URL on mount or URL change
  useEffect(() => {
    if (tripId && activeTrip?.id !== tripId) {
      setActiveTripId(tripId)
    }
  }, [tripId, activeTrip?.id, setActiveTripId])

  // While trips are initializing from local storage / IndexedDB
  if (isLoading && !activeTrip) {
    return <TripLoadingFallback />
  }

  // Once loading completes, verify trip existence
  const currentTrip = activeTrip || trips.find((t) => t.id === tripId)
  if (!isLoading && !currentTrip && trips.length > 0) {
    return <TripNotFoundPage tripId={tripId} />
  }

  const isArchived = currentTrip?.status === 'archived'

  async function handleRestore() {
    if (!currentTrip) return
    setRestoring(true)
    try {
      await restoreTrip(currentTrip.id)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="app-layout">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        {/* Archived notice banner if viewing an archived trip */}
        {isArchived && (
          <div
            style={{
              backgroundColor: 'rgba(224, 86, 36, 0.12)',
              borderBottom: '1px solid rgba(224, 86, 36, 0.28)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Archive size={16} color="var(--accent-warning)" />
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                This expedition is archived in read-only view.
              </span>
            </div>
            <button
              className="btn-secondary"
              onClick={handleRestore}
              disabled={restoring}
              style={{ fontSize: '0.78rem', padding: '5px 10px', gap: 5 }}
            >
              <RotateCcw size={13} /> {restoring ? 'Restoring...' : 'Restore Expedition'}
            </button>
          </div>
        )}

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  )
}
