import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  Plus, MapPin, Calendar, Archive,
  RotateCcw, Trash2, Moon, Sun, Mountain, ArrowRight
} from 'lucide-react'
import { formatDate, formatRelativeTime } from '../utils/helpers'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LoFiForestBackground from '../components/layout/LoFiForestBackground'

export default function TripListPage() {
  const { trips, setActiveTripId, deleteTrip, archiveTrip, restoreTrip, theme, toggleTheme, isLoading } = useApp()
  const navigate = useNavigate()
  const [showArchived, setShowArchived] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const activeTrips = trips.filter((t) => t.status === 'active')
  const archivedTrips = trips.filter((t) => t.status === 'archived')
  const displayed = showArchived ? archivedTrips : activeTrips

  function handleOpenTrip(tripId: string) {
    setActiveTripId(tripId)
    navigate(`/trip/${tripId}/dashboard`)
  }

  async function handleDelete() {
    if (deleteTarget) {
      await deleteTrip(deleteTarget)
      setDeleteTarget(null)
    }
  }

  if (isLoading) {
    return (
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#081713',
        }}
      >
        <LoFiForestBackground imageSrc="/photos/misty-valley.jpg" />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your trips...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Cinematic Lo-Fi Himalayan Forest Background */}
      <LoFiForestBackground imageSrc="/photos/misty-valley.jpg" />

      {/* Top Glassmorphic Navigation Bar */}
      <header
        className="topbar-glass"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={18} color="var(--accent-primary)" />
          <span
            className="font-display"
            style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}
          >
            TripKhata
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn-icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate('/welcome')}
            style={{ fontSize: '0.85rem', padding: '8px 16px', borderRadius: 8 }}
          >
            <Plus size={15} /> New Trip
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 820,
          margin: '0 auto',
          padding: '36px 24px 60px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            className="font-display text-cinematic-title"
            style={{
              fontSize: 'clamp(1.7rem, 4.5vw, 2.2rem)',
              fontWeight: 700,
              marginBottom: 6,
              letterSpacing: '-0.02em',
            }}
          >
            Your Trips
          </h1>
          <p className="text-cinematic-sub" style={{ fontSize: '0.92rem' }}>
            {activeTrips.length === 0
              ? "You haven't created any trips yet."
              : `${activeTrips.length} active expedition${activeTrips.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => setShowArchived(false)}
            style={{
              fontSize: '0.86rem',
              fontWeight: !showArchived ? 600 : 500,
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              border: !showArchived ? '1px solid rgba(101, 201, 139, 0.4)' : '1px solid rgba(41, 66, 55, 0.7)',
              backgroundColor: !showArchived ? 'rgba(101, 201, 139, 0.16)' : 'rgba(18, 42, 34, 0.7)',
              color: !showArchived ? 'var(--accent-primary)' : 'var(--text-secondary)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transition: 'all 150ms ease',
            }}
          >
            Active ({activeTrips.length})
          </button>
          <button
            onClick={() => setShowArchived(true)}
            style={{
              fontSize: '0.86rem',
              fontWeight: showArchived ? 600 : 500,
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              border: showArchived ? '1px solid rgba(168, 184, 173, 0.4)' : '1px solid rgba(41, 66, 55, 0.7)',
              backgroundColor: showArchived ? 'rgba(168, 184, 173, 0.16)' : 'rgba(18, 42, 34, 0.7)',
              color: showArchived ? 'var(--text-primary)' : 'var(--text-muted)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 150ms ease',
            }}
          >
            <Archive size={14} /> Archived ({archivedTrips.length})
          </button>
        </div>

        {/* Empty State */}
        {displayed.length === 0 && (
          <div
            className="card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              backgroundColor: 'rgba(18, 42, 34, 0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(41, 66, 55, 0.7)',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'rgba(101, 201, 139, 0.1)',
                border: '1px solid rgba(101, 201, 139, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--accent-primary)',
              }}
            >
              <Mountain size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#F4F5EE', marginBottom: 8 }}>
              {showArchived ? 'No archived trips' : 'No trips yet'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 22, maxWidth: 360, margin: '0 auto 22px' }}>
              {showArchived
                ? 'Trips that you archive will appear safely preserved here.'
                : 'Create your first group trip to organize shared expenses effortlessly.'}
            </p>
            {!showArchived && (
              <button
                className="btn-primary"
                onClick={() => navigate('/welcome')}
                style={{ padding: '10px 22px', borderRadius: 999 }}
              >
                <Plus size={16} /> Create Your First Trip
              </button>
            )}
          </div>
        )}

        {/* Trip Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {displayed.map((trip, i) => (
            <TripCard
              key={trip.id}
              trip={trip}
              index={i}
              onOpen={() => handleOpenTrip(trip.id)}
              onArchive={() => archiveTrip(trip.id)}
              onRestore={() => restoreTrip(trip.id)}
              onDelete={() => setDeleteTarget(trip.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <footer
          className="text-cinematic-sub"
          style={{
            marginTop: 56,
            textAlign: 'center',
            fontSize: '0.8rem',
          }}
        >
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} Md Zunaid Ali. All rights reserved. · TripKhata</p>
          <p style={{ marginTop: 6, margin: '6px 0 0 0' }}>
            Data is stored locally in your browser and is not shared with any server.
          </p>
          <button
            className="btn-ghost"
            onClick={() => navigate('/about')}
            style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--accent-primary)' }}
          >
            About TripKhata
          </button>
        </footer>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Trip"
          message="This will permanently delete the trip, all its expenses, members, and settlements. This cannot be undone."
          confirmLabel="Delete Trip"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

interface TripCardProps {
  trip: {
    id: string
    name: string
    destination: string
    startDate?: string
    endDate?: string
    status: string
    updatedAt: string
  }
  index: number
  onOpen: () => void
  onArchive: () => void
  onRestore: () => void
  onDelete: () => void
}

function TripCard({ trip, index, onOpen, onArchive, onRestore, onDelete }: TripCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="card card-glass"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        animation: `slideUp 0.4s ease ${index * 0.05}s both`,
        cursor: 'pointer',
        borderRadius: 14,
        borderColor: hovered ? 'var(--accent-primary)' : undefined,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 10px 28px rgba(0, 0, 0, 0.35)' : undefined,
      }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen()
      }}
      aria-label={`Open trip: ${trip.name}`}
    >
      {/* Icon */}
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          backgroundColor: 'rgba(101, 201, 139, 0.12)',
          border: '1px solid rgba(101, 201, 139, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Mountain size={22} color="var(--accent-primary)" />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: '1.02rem',
            color: 'var(--text-primary)',
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {trip.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
            }}
          >
            <MapPin size={12} color="var(--accent-primary)" /> {trip.destination}
          </span>
          {(trip.startDate || trip.endDate) && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
              }}
            >
              <Calendar size={12} color="var(--accent-secondary)" />
              {trip.startDate ? formatDate(trip.startDate) : '?'}
              {trip.endDate ? ` – ${formatDate(trip.endDate)}` : ''}
            </span>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
            Updated {formatRelativeTime(trip.updatedAt)}
          </span>
          {trip.status === 'archived' && <span className="badge badge-neutral">Archived</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        {trip.status === 'active' ? (
          <button
            className="btn-icon"
            onClick={onArchive}
            title="Archive trip"
            aria-label="Archive trip"
          >
            <Archive size={16} />
          </button>
        ) : (
          <button
            className="btn-icon"
            onClick={onRestore}
            title="Restore trip"
            aria-label="Restore trip"
          >
            <RotateCcw size={16} />
          </button>
        )}
        <button
          className="btn-icon"
          onClick={onDelete}
          title="Delete trip"
          aria-label="Delete trip"
          style={{ color: 'var(--status-negative)' }}
        >
          <Trash2 size={16} />
        </button>
        <ArrowRight size={16} color="var(--text-muted)" style={{ alignSelf: 'center', marginLeft: 4 }} />
      </div>
    </div>
  )
}
