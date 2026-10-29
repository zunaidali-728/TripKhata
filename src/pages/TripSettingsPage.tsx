import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { nowISO } from '../utils/helpers'
import {
  Save, Download, Upload, Trash2, Sun, Moon,
  User, MapPin, Calendar, AlertTriangle
} from 'lucide-react'
import Toast from '../components/ui/Toast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { TripExport } from '../domain/models/types'

export default function TripSettingsPage() {
  const {
    trips,
    activeTrip,
    members,
    expenses,
    settlements,
    updateTrip,
    deleteTrip,
    displayName,
    setDisplayName,
    theme,
    toggleTheme,
    importTrip,
  } = useApp()
  const navigate = useNavigate()
  const { tripId } = useParams()

  const currentTrip = (tripId ? trips.find((t) => t.id === tripId) : null) || activeTrip

  // Form states
  const [name, setName] = useState(currentTrip?.name || '')
  const [destination, setDestination] = useState(currentTrip?.destination || '')
  const [startDate, setStartDate] = useState(currentTrip?.startDate || '')
  const [endDate, setEndDate] = useState(currentTrip?.endDate || '')

  // Keep form state in sync when canonical trip updates
  useEffect(() => {
    if (currentTrip) {
      setName(currentTrip.name || '')
      setDestination(currentTrip.destination || '')
      setStartDate(currentTrip.startDate || '')
      setEndDate(currentTrip.endDate || '')
    }
  }, [currentTrip])

  // User display name state
  const [prefName, setPrefName] = useState(displayName)

  // Dialogs
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!currentTrip) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 64 }}>
        <p style={{ color: 'var(--text-muted)' }}>No trip selected.</p>
      </div>
    )
  }

  // Update Trip info
  async function handleUpdateTrip(e: React.FormEvent) {
    e.preventDefault()
    if (!currentTrip) return
    if (!name.trim()) {
      setToast({ message: 'Trip name is required.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      await updateTrip({
        ...currentTrip,
        name: name.trim(),
        destination: destination.trim() || currentTrip.destination,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      setToast({ message: 'Trip settings saved!', type: 'success' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update trip.'
      setToast({ message: msg, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update User Display Name
  function handleSaveDisplayName(e: React.FormEvent) {
    e.preventDefault()
    setDisplayName(prefName.trim())
    setToast({ message: 'Display name preference updated!', type: 'success' })
  }

  // Export Trip JSON
  function handleExportTrip() {
    if (!currentTrip) return
    try {
      const exportData: TripExport = {
        exportVersion: 1,
        exportedAt: nowISO(),
        trip: currentTrip,
        members,
        expenses,
        settlements,
      }

      const jsonStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const sanitizedName = currentTrip.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
      a.href = url
      a.download = `tripkhata-${sanitizedName}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setToast({ message: 'Trip exported successfully!', type: 'success' })
    } catch {
      setToast({ message: 'Failed to export trip data.', type: 'error' })
    }
  }

  // Import Trip JSON
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as TripExport

      if (!parsed.trip || !parsed.members || !parsed.expenses) {
        throw new Error('Invalid TripKhata backup file format.')
      }

      await importTrip(parsed.trip, parsed.members, parsed.expenses, parsed.settlements || [])
      setToast({ message: `Successfully imported "${parsed.trip.name}"!`, type: 'success' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import trip.'
      setToast({ message: msg, type: 'error' })
    } finally {
      e.target.value = ''
    }
  }

  // Delete Trip
  async function handleDeleteTrip() {
    if (!currentTrip) return
    try {
      await deleteTrip(currentTrip.id)
      navigate('/trips')
    } catch {
      setToast({ message: 'Failed to delete trip.', type: 'error' })
    }
  }

  return (
    <div className="page" style={{ maxWidth: 760, margin: '0 auto' }}>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Trip Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Configure settings and preferences for <strong style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{currentTrip.name}</strong>
        </p>
      </div>

      {/* Section 1: Trip Metadata */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 16 }}>Trip Details</h2>
        <form onSubmit={handleUpdateTrip}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="form-label" htmlFor="trip-name">Trip Name *</label>
              <input
                id="trip-name"
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" htmlFor="trip-destination">
                <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                Destination *
              </label>
              <input
                id="trip-destination"
                className="form-input"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label" htmlFor="trip-start-date">
                <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                Start Date
              </label>
              <input
                id="trip-start-date"
                className="form-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label" htmlFor="trip-end-date">
                <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                End Date
              </label>
              <input
                id="trip-end-date"
                className="form-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Personal Preferences (Display Name) */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 8 }}>
          Your Display Name Preference
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          Used to automatically pre-fill &quot;Recorded By&quot; when logging expenses. Stored locally in your browser.
        </p>

        <form onSubmit={handleSaveDisplayName}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <input
                className="form-input"
                type="text"
                placeholder="Enter your name (e.g. Zunaid)"
                value={prefName}
                onChange={(e) => setPrefName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary">
              <User size={16} /> Save Name
            </button>
            {prefName && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setPrefName('')
                  setDisplayName('')
                  setToast({ message: 'Display name cleared.', type: 'success' })
                }}
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Section 3: Appearance */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 8 }}>Theme Appearance</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          Switch between dark forest green and crisp daylight themes
        </p>
        <button
          className="btn-secondary"
          onClick={toggleTheme}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          Switch to {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
        </button>
      </div>

      {/* Section 4: Backup & Data Portability */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 8 }}>
          Backup &amp; Data Portability
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          TripKhata stores all records locally on your device. Export a backup JSON file anytime or restore an existing trip.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handleExportTrip}>
            <Download size={16} /> Export Trip (.json)
          </button>

          <label className="btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
            <Upload size={16} /> Import Trip (.json)
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </label>
        </div>
      </div>

      {/* Section 5: Danger Zone */}
      <div
        className="card"
        style={{
          padding: 24,
          borderColor: 'rgba(224, 123, 106, 0.4)',
          backgroundColor: 'rgba(224, 123, 106, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--status-negative)', marginBottom: 8 }}>
          <AlertTriangle size={18} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Danger Zone</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          Permanently delete this trip and all its members, expenses, allocations, and settlement history.
          This action cannot be undone unless you have a JSON backup.
        </p>

        <button
          className="btn-danger"
          onClick={() => setShowDeleteConfirm(true)}
          id="delete-trip-btn"
        >
          <Trash2 size={16} /> Delete Entire Trip
        </button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Entire Trip?"
          message={`Are you absolutely sure you want to permanently delete "${currentTrip.name}"? All ${expenses.length} expense(s) and ${settlements.length} settlement(s) will be erased from local storage.`}
          confirmLabel="Delete Trip"
          onConfirm={handleDeleteTrip}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
