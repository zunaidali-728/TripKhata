import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { MapPin, Users, ArrowRight, Upload, Mountain } from 'lucide-react'
import { validateImport } from '../services/ExportImportService'
import LoFiForestBackground from '../components/layout/LoFiForestBackground'

export default function WelcomePage() {
  const { createTrip, importTrip, setActiveTripId } = useApp()
  const navigate = useNavigate()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [tripName, setTripName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)
  const [importError, setImportError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!tripName.trim()) newErrors.tripName = 'Trip name is required.'
    if (!destination.trim()) newErrors.destination = 'Destination is required.'
    if (!creatorName.trim()) newErrors.creatorName = 'Your name is required.'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setCreating(true)
    try {
      const trip = await createTrip({
        name: tripName.trim(),
        destination: destination.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        currency: 'INR',
        status: 'active',
        creatorName: creatorName.trim(),
      })
      setActiveTripId(trip.id)
      navigate(`/trip/${trip.id}/dashboard`)
    } catch (err) {
      setErrors({ submit: (err as Error).message })
    } finally {
      setCreating(false)
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string)
        const result = validateImport(raw)
        if (!result.valid || !result.data) {
          setImportError(`Import failed: ${result.errors.map((e) => e.message).join(', ')}`)
          return
        }
        const { trip, members, expenses, settlements } = result.data
        await importTrip(trip, members, expenses, settlements)
        setActiveTripId(trip.id)
        navigate(`/trip/${trip.id}/dashboard`)
      } catch {
        setImportError(
          'Failed to read the file. Please ensure it is a valid TripKhata JSON export.'
        )
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (showCreateForm) {
    return (
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          overflow: 'hidden',
        }}
      >
        {/* Cinematic Lo-Fi Himalayan Forest Background */}
        <LoFiForestBackground imageSrc="/photos/misty-valley.jpg" />

        <div
          className="card card-glass"
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: '480px',
            padding: '32px',
            border: '1px solid rgba(101, 201, 139, 0.35)',
            borderRadius: 16,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
            animation: 'scaleIn 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(101, 201, 139, 0.12)',
                border: '1px solid rgba(101, 201, 139, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mountain size={22} color="var(--accent-primary)" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                New Expedition
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '2px 0 0 0' }}>
                Set up your group adventure
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} noValidate>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="creator-name">
                Your Name *
              </label>
              <input
                id="creator-name"
                className="form-input"
                type="text"
                placeholder="e.g. Rahul, Maya"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                autoFocus
              />
              {errors.creatorName && <p className="form-error">{errors.creatorName}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="trip-name">
                Trip Name *
              </label>
              <input
                id="trip-name"
                className="form-input"
                type="text"
                placeholder="e.g. Sikkim Silk Route, Ladakh 2026"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
              />
              {errors.tripName && <p className="form-error">{errors.tripName}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="destination">
                Destination *
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--accent-primary)',
                  }}
                />
                <input
                  id="destination"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Gangtok & North Sikkim"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
              </div>
              {errors.destination && <p className="form-error">{errors.destination}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="form-label" htmlFor="start-date">
                  Start Date
                </label>
                <input
                  id="start-date"
                  className="form-input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="end-date">
                  End Date
                </label>
                <input
                  id="end-date"
                  className="form-input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(230, 184, 120, 0.1)',
                border: '1px solid rgba(230, 184, 120, 0.3)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginBottom: 20,
              }}
            >
              <strong style={{ color: 'var(--accent-secondary)' }}>INR only</strong> — TripKhata
              currently supports Indian Rupees (₹) with exact paise precision.
            </div>

            {errors.submit && (
              <p className="form-error" style={{ marginBottom: 12 }}>
                {errors.submit}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowCreateForm(false)}
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={creating}
                style={{ flex: 2, justifyContent: 'center' }}
              >
                {creating ? 'Creating...' : 'Create Trip'}
                {!creating && <ArrowRight size={16} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
      }}
    >
      {/* Cinematic Lo-Fi Himalayan Forest Background */}
      <LoFiForestBackground imageSrc="/photos/misty-valley.jpg" />

      {/* Main Centered Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '460px', textAlign: 'center' }}>
        {/* Brand & Heading */}
        <div style={{ marginBottom: 32, animation: 'slideUp 0.5s ease' }}>
          <div
            className="welcome-badge-glass"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 18,
              padding: '6px 16px',
              borderRadius: 999,
              backdropFilter: 'blur(10px)',
            }}
          >
            <MapPin size={16} color="var(--accent-primary)" />
            <span
              className="font-display"
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.04em',
              }}
            >
              TripKhata
            </span>
          </div>

          <h2
            className="font-display text-cinematic-title"
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 2.1rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 12,
              letterSpacing: '-0.02em',
            }}
          >
            Your next adventure starts here.
          </h2>
          <p
            className="text-cinematic-sub"
            style={{
              fontSize: '0.96rem',
              lineHeight: 1.6,
            }}
          >
            Plan the trip. Share the expenses. Keep everything sorted.
          </p>
        </div>

        {/* Action Cards with Lo-Fi Forest Glassmorphism */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            animation: 'slideUp 0.5s ease 0.1s both',
          }}
        >
          {/* Card 1: Create a New Trip */}
          <button
            id="create-trip-btn"
            className="card card-glass"
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              borderRadius: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = 'var(--accent-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = ''
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(101, 201, 139, 0.15)',
                border: '1px solid rgba(101, 201, 139, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Mountain size={22} color="var(--accent-primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, fontSize: '0.98rem' }}>
                Create a New Trip
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Start fresh with your group
              </div>
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
          </button>

          {/* Card 2: Import Existing Trip */}
          <label
            className="card card-glass"
            style={{
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              borderRadius: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = 'var(--accent-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = ''
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(230, 184, 120, 0.15)',
                border: '1px solid rgba(230, 184, 120, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Upload size={22} color="var(--accent-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, fontSize: '0.98rem' }}>
                Import Existing Trip
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Load a TripKhata JSON backup
              </div>
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
              id="import-file-input"
            />
          </label>

          {/* Card 3: View All Trips */}
          <button
            className="card card-glass"
            onClick={() => navigate('/trips')}
            style={{
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              borderRadius: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = 'rgba(168, 184, 173, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = ''
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(168, 184, 173, 0.12)',
                border: '1px solid rgba(168, 184, 173, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Users size={22} color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, fontSize: '0.98rem' }}>
                View All Trips
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Browse your saved trips
              </div>
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
          </button>
        </div>

        {importError && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 10,
              backgroundColor: 'rgba(224, 123, 106, 0.15)',
              border: '1px solid rgba(224, 123, 106, 0.4)',
              color: 'var(--status-negative)',
              fontSize: '0.84rem',
              textAlign: 'left',
              backdropFilter: 'blur(8px)',
            }}
          >
            {importError}
            <button
              onClick={() => setImportError('')}
              style={{
                marginLeft: 8,
                color: 'inherit',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        <p
          className="text-cinematic-sub"
          style={{
            fontSize: '0.8rem',
            marginTop: 32,
          }}
        >
          Data stored locally in your browser · No account required
        </p>
      </div>
    </div>
  )
}
