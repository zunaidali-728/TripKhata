import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatPaiseAsINR, parseINRtoPaise, paiseToDecimal } from '../domain/finance/money'
import { todayISO, formatDate } from '../utils/helpers'
import {
  HandCoins, ArrowRight, CheckCircle2, Copy, ExternalLink,
  Plus, Trash2, Calendar, FileText, User, IndianRupee, ShieldCheck
} from 'lucide-react'
import Toast from '../components/ui/Toast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { RecommendedTransfer } from '../domain/models/types'

export default function SettlementsPage() {
  const {
    trips,
    activeTrip,
    members,
    settlements,
    recommendedTransfers,
    addSettlement,
    deleteSettlement,
    displayName,
  } = useApp()
  const { tripId } = useParams()
  const currentTrip = (tripId ? trips.find((t) => t.id === tripId) : null) || activeTrip

  // Record Settlement Form State
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [fromMemberId, setFromMemberId] = useState(members[0]?.id || '')
  const [toMemberId, setToMemberId] = useState(members[1]?.id || members[0]?.id || '')
  const [amountInput, setAmountInput] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')

  // Confirmation dialogs
  const [confirmTransfer, setConfirmTransfer] = useState<RecommendedTransfer | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!currentTrip) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 64 }}>
        <p style={{ color: 'var(--text-muted)' }}>No trip selected.</p>
      </div>
    )
  }

  const memberMap = new Map(members.map((m) => [m.id, m]))

  // Copy to clipboard helper
  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setToast({ message: `${label} copied to clipboard!`, type: 'success' })
    } catch {
      setToast({ message: 'Failed to copy to clipboard.', type: 'error' })
    }
  }

  // Generate UPI Payment URI
  function buildUpiUri(upiId: string, payeeName: string, amountPaise: number): string {
    const amountRupees = paiseToDecimal(amountPaise).toFixed(2)
    const encodedPa = encodeURIComponent(upiId)
    const encodedPn = encodeURIComponent(payeeName)
    const encodedTn = encodeURIComponent(`TripKhata - ${currentTrip?.name || 'Trip'} Settlement`)
    return `upi://pay?pa=${encodedPa}&pn=${encodedPn}&am=${amountRupees}&cu=INR&tn=${encodedTn}`
  }

  // Pre-fill form from a recommended transfer
  function handleInitiateTransfer(t: RecommendedTransfer) {
    setFromMemberId(t.fromMemberId)
    setToMemberId(t.toMemberId)
    setAmountInput(paiseToDecimal(t.amountPaise).toString())
    setDate(todayISO())
    setNote('Settlement via TripKhata recommendation')
    setShowRecordForm(true)
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  // Quick "Mark as Paid" action
  async function handleQuickMarkAsPaid() {
    if (!confirmTransfer) return
    setIsSubmitting(true)
    try {
      const matchedRecorder = displayName.trim()
        ? members.find((m) => m.name.trim().toLowerCase() === displayName.trim().toLowerCase())?.id
        : null
      const recordedBy = matchedRecorder || confirmTransfer.fromMemberId

      await addSettlement({
        fromMemberId: confirmTransfer.fromMemberId,
        toMemberId: confirmTransfer.toMemberId,
        amountPaise: confirmTransfer.amountPaise,
        date: todayISO(),
        note: 'Marked as paid from recommendation',
        recordedByMemberId: recordedBy,
      })
      setToast({
        message: `Settlement of ${formatPaiseAsINR(confirmTransfer.amountPaise)} recorded.`,
        type: 'success',
      })
      setConfirmTransfer(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record settlement.'
      setToast({ message: msg, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manual record form submission
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromMemberId || !toMemberId) {
      setToast({ message: 'Please select both sender and recipient.', type: 'error' })
      return
    }
    if (fromMemberId === toMemberId) {
      setToast({ message: 'Sender and recipient cannot be the same member.', type: 'error' })
      return
    }

    let amtPaise = 0
    try {
      amtPaise = parseINRtoPaise(amountInput)
    } catch {
      setToast({ message: 'Please enter a valid amount.', type: 'error' })
      return
    }

    if (amtPaise <= 0) {
      setToast({ message: 'Settlement amount must be positive.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const matchedRecorder = displayName.trim()
        ? members.find((m) => m.name.trim().toLowerCase() === displayName.trim().toLowerCase())?.id
        : null
      const recordedBy = matchedRecorder || fromMemberId

      await addSettlement({
        fromMemberId,
        toMemberId,
        amountPaise: amtPaise,
        date,
        note: note.trim() || undefined,
        recordedByMemberId: recordedBy,
      })

      setToast({ message: 'Settlement recorded successfully!', type: 'success' })
      setAmountInput('')
      setNote('')
      setShowRecordForm(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record settlement.'
      setToast({ message: msg, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete settlement
  async function handleDeleteSettlement() {
    if (!deleteTargetId) return
    try {
      await deleteSettlement(deleteTargetId)
      setToast({ message: 'Settlement record removed.', type: 'success' })
    } catch {
      setToast({ message: 'Failed to delete settlement.', type: 'error' })
    }
    setDeleteTargetId(null)
  }

  return (
    <div className="page" style={{ maxWidth: 840, margin: '0 auto' }}>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Settle Up</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Simplified peer-to-peer transfers and settlement tracking
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowRecordForm((prev) => !prev)}
          id="toggle-record-settlement-btn"
        >
          <Plus size={16} /> {showRecordForm ? 'Close Form' : 'Record Settlement'}
        </button>
      </div>

      {/* Recommended Settlements (Who Owes Whom) */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <HandCoins size={20} color="var(--accent-secondary)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
            Recommended Transfers ({recommendedTransfers.length})
          </h2>
        </div>

        {recommendedTransfers.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <CheckCircle2 size={40} color="var(--status-positive)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 6 }}>All Settled Up!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              No outstanding debts remain. Everyone in this trip is squared away.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recommendedTransfers.map((transfer, idx) => {
              const recipient = memberMap.get(transfer.toMemberId)
              const recipientUpi = recipient?.upiId
              const amountDecimalStr = paiseToDecimal(transfer.amountPaise).toFixed(2)

              return (
                <div
                  key={`${transfer.fromMemberId}-${transfer.toMemberId}-${idx}`}
                  className="card"
                  style={{ padding: 18 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                    {/* Transfer Parties & Amount */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                        {transfer.fromMemberName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-secondary)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>pays</span>
                        <ArrowRight size={16} />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                        {transfer.toMemberName}
                      </div>
                      <div
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 700,
                          color: 'var(--status-positive)',
                          marginLeft: 8,
                        }}
                      >
                        {formatPaiseAsINR(transfer.amountPaise)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      {/* Pay Now UPI Deep-link (if UPI ID is configured) */}
                      {recipientUpi ? (
                        <a
                          href={buildUpiUri(recipientUpi, transfer.toMemberName, transfer.amountPaise)}
                          className="btn-primary"
                          style={{ textDecoration: 'none', padding: '7px 12px', fontSize: '0.82rem' }}
                          title="Open UPI payment app (Google Pay, PhonePe, Paytm)"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={14} /> Pay Now (UPI)
                        </a>
                      ) : null}

                      {/* Fallback: Copy UPI ID */}
                      {recipientUpi ? (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                          onClick={() => copyToClipboard(recipientUpi, 'UPI ID')}
                          title={`Copy ${recipientUpi}`}
                        >
                          <Copy size={13} /> Copy UPI ID
                        </button>
                      ) : null}

                      {/* Fallback: Copy Amount */}
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                        onClick={() => copyToClipboard(amountDecimalStr, 'Amount')}
                        title={`Copy ₹${amountDecimalStr}`}
                      >
                        <Copy size={13} /> Copy ₹
                      </button>

                      {/* Explicit Mark as Paid confirmation */}
                      <button
                        type="button"
                        className="btn-primary"
                        style={{
                          backgroundColor: 'var(--surface-elevated)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border)',
                          padding: '7px 12px',
                          fontSize: '0.82rem',
                        }}
                        onClick={() => setConfirmTransfer(transfer)}
                      >
                        <ShieldCheck size={14} color="var(--accent-primary)" /> Mark as Paid
                      </button>

                      {/* Custom Settlement button */}
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                        onClick={() => handleInitiateTransfer(transfer)}
                      >
                        Custom Edit
                      </button>
                    </div>
                  </div>

                  {recipientUpi && (
                    <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Payee UPI: <strong style={{ color: 'var(--text-secondary)' }}>{recipientUpi}</strong>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Record Settlement Form */}
      {showRecordForm && (
        <div className="card" style={{ padding: 24, marginBottom: 32, border: '1px solid var(--accent-primary)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 16 }}>
            Record a Settlement Payment
          </h2>
          <form onSubmit={handleFormSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="form-label" htmlFor="settlement-from">
                  <User size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Who Paid? (Debtor) *
                </label>
                <select
                  id="settlement-from"
                  className="form-input"
                  value={fromMemberId}
                  onChange={(e) => setFromMemberId(e.target.value)}
                  required
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="settlement-to">
                  <User size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Paid To? (Creditor) *
                </label>
                <select
                  id="settlement-to"
                  className="form-input"
                  value={toMemberId}
                  onChange={(e) => setToMemberId(e.target.value)}
                  required
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="form-label" htmlFor="settlement-amount">
                  <IndianRupee size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Amount (₹ INR) *
                </label>
                <input
                  id="settlement-amount"
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" htmlFor="settlement-date">
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Date
                </label>
                <input
                  id="settlement-date"
                  className="form-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label" htmlFor="settlement-note">
                <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
                Reference / Note (Optional)
              </label>
              <input
                id="settlement-note"
                className="form-input"
                type="text"
                placeholder="e.g. Paid via Google Pay / Cash / Bank transfer"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowRecordForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || fromMemberId === toMemberId || !amountInput}
              >
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settlement History List */}
      <div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 14 }}>
          Settlement History ({settlements.length})
        </h2>

        {settlements.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            No settlements recorded yet for this trip.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...settlements]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((s) => {
                const payer = memberMap.get(s.fromMemberId)?.name || 'Unknown'
                const receiver = memberMap.get(s.toMemberId)?.name || 'Unknown'

                return (
                  <div
                    key={s.id}
                    className="card"
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                        <span>{payer}</span>
                        <ArrowRight size={14} color="var(--text-muted)" />
                        <span>{receiver}</span>
                        <span style={{ fontWeight: 700, color: 'var(--status-positive)', marginLeft: 6 }}>
                          {formatPaiseAsINR(s.amountPaise)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        <span>{formatDate(s.date)}</span>
                        {s.note && <span>· {s.note}</span>}
                      </div>
                    </div>

                    <button
                      className="btn-icon"
                      onClick={() => setDeleteTargetId(s.id)}
                      title="Undo / Delete Settlement"
                      aria-label="Delete settlement"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for "Mark as Paid" */}
      {confirmTransfer && (
        <ConfirmDialog
          title="Mark Settlement as Paid"
          message={`Confirm that ${confirmTransfer.fromMemberName} paid ${formatPaiseAsINR(confirmTransfer.amountPaise)} to ${confirmTransfer.toMemberName}? This will record a completed settlement and update both members' balances.`}
          confirmLabel="Confirm & Record"
          onConfirm={handleQuickMarkAsPaid}
          onCancel={() => setConfirmTransfer(null)}
        />
      )}

      {/* Confirmation Modal for Deleting a Settlement */}
      {deleteTargetId && (
        <ConfirmDialog
          title="Delete Settlement Record"
          message="Are you sure you want to delete this recorded settlement? Member balances will be updated accordingly."
          confirmLabel="Delete"
          onConfirm={handleDeleteSettlement}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  )
}
