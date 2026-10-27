import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatPaiseAsINR } from '../domain/finance/money'
import { UserPlus, Edit2, Archive, RotateCcw, QrCode } from 'lucide-react'
import Toast from '../components/ui/Toast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { Member } from '../domain/models/types'

export default function MembersPage() {
  const { activeTrip, members, memberBalances, addMember, updateMember, archiveMember, restoreMember } = useApp()
  const { tripId } = useParams()
  void tripId

  const [isAdding, setIsAdding] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Member | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [editName, setEditName] = useState('')
  const [editUpiId, setEditUpiId] = useState('')

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  if (!activeTrip) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 64 }}>
        <p style={{ color: 'var(--text-muted)' }}>No trip selected.</p>
      </div>
    )
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setToast({ message: 'Member name is required.', type: 'error' })
      return
    }

    try {
      await addMember(name.trim(), upiId.trim() || undefined)
      setName('')
      setUpiId('')
      setIsAdding(false)
      setToast({ message: `Member ${name.trim()} added.`, type: 'success' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add member.'
      setToast({ message: msg, type: 'error' })
    }
  }

  async function handleUpdateMember(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMember) return
    if (!editName.trim()) {
      setToast({ message: 'Member name is required.', type: 'error' })
      return
    }

    try {
      await updateMember({
        ...editingMember,
        name: editName.trim(),
        upiId: editUpiId.trim() || undefined,
      })
      setEditingMember(null)
      setToast({ message: 'Member details updated.', type: 'success' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update member.'
      setToast({ message: msg, type: 'error' })
    }
  }

  async function handleArchiveMember() {
    if (!archiveTarget) return
    const bal = memberBalances.get(archiveTarget.id)
    if (bal && bal.netBalancePaise !== 0) {
      setToast({
        message: `Cannot archive ${archiveTarget.name} because they have an unsettled balance (${formatPaiseAsINR(bal.netBalancePaise)}).`,
        type: 'error',
      })
      setArchiveTarget(null)
      return
    }

    try {
      await archiveMember(archiveTarget.id)
      setToast({ message: `${archiveTarget.name} archived.`, type: 'success' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to archive member.'
      setToast({ message: msg, type: 'error' })
    }
    setArchiveTarget(null)
  }

  async function handleRestoreMember(m: Member) {
    try {
      await restoreMember(m.id)
      setToast({ message: `${m.name} restored to active.`, type: 'success' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to restore member.'
      setToast({ message: msg, type: 'error' })
    }
  }

  const activeMembers = members.filter((m) => m.status === 'active')
  const archivedMembers = members.filter((m) => m.status === 'archived')

  return (
    <div className="page" style={{ maxWidth: 800, margin: '0 auto' }}>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Trip Members</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            {activeMembers.length} active member{activeMembers.length === 1 ? '' : 's'} in {activeTrip.name}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setIsAdding(true)
            setName('')
            setUpiId('')
          }}
          id="add-member-btn"
        >
          <UserPlus size={16} /> Add Member
        </button>
      </div>

      {/* Add Member Form Card */}
      {isAdding && (
        <div className="card" style={{ padding: 20, marginBottom: 24, border: '1px solid var(--accent-primary)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 14 }}>Add New Member</h2>
          <form onSubmit={handleAddMember}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div>
                <label className="form-label" htmlFor="new-member-name">Name *</label>
                <input
                  id="new-member-name"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Tenzing, Maya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="form-label" htmlFor="new-member-upi">
                  UPI ID (Optional, for instant settle payments)
                </label>
                <input
                  id="new-member-upi"
                  className="form-input"
                  type="text"
                  placeholder="e.g. name@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Add Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 460, padding: 24 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Edit Member</h2>
            <form onSubmit={handleUpdateMember}>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label" htmlFor="edit-member-name">Name *</label>
                <input
                  id="edit-member-name"
                  className="form-input"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label" htmlFor="edit-member-upi">UPI ID (Optional)</label>
                <input
                  id="edit-member-upi"
                  className="form-input"
                  type="text"
                  placeholder="name@okhdfcbank"
                  value={editUpiId}
                  onChange={(e) => setEditUpiId(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingMember(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Members List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {activeMembers.map((member) => {
          const isCreator = member.id === activeTrip.creatorMemberId
          const balance = memberBalances.get(member.id)
          const net = balance?.netBalancePaise ?? 0

          return (
            <div
              key={member.id}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    fontSize: '1rem',
                  }}
                >
                  {member.initials}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{member.name}</span>
                    {isCreator && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: 12,
                          backgroundColor: 'var(--accent-secondary)',
                          color: '#081713',
                          fontWeight: 700,
                        }}
                      >
                        Organizer
                      </span>
                    )}
                  </div>
                  {member.upiId ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
                      <QrCode size={13} color="var(--accent-primary)" />
                      <span>{member.upiId}</span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
                      No UPI ID configured
                    </div>
                  )}
                </div>
              </div>

              {/* Balance & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Net Balance
                  </div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color:
                        net > 0
                          ? 'var(--status-positive)'
                          : net < 0
                          ? 'var(--status-negative)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {net > 0
                      ? `+${formatPaiseAsINR(net)} (Gets back)`
                      : net < 0
                      ? `${formatPaiseAsINR(net)} (Owes)`
                      : 'Settled'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn-icon"
                    onClick={() => {
                      setEditingMember(member)
                      setEditName(member.name)
                      setEditUpiId(member.upiId || '')
                    }}
                    title="Edit Member"
                    aria-label={`Edit ${member.name}`}
                  >
                    <Edit2 size={16} />
                  </button>
                  {!isCreator && (
                    <button
                      className="btn-icon"
                      onClick={() => setArchiveTarget(member)}
                      title="Archive Member"
                      aria-label={`Archive ${member.name}`}
                    >
                      <Archive size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Archived Members (if any) */}
      {archivedMembers.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
            Archived Members ({archivedMembers.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {archivedMembers.map((m) => (
              <div
                key={m.id}
                className="card"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: 0.7,
                }}
              >
                <span>{m.name}</span>
                <button
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => handleRestoreMember(m)}
                >
                  <RotateCcw size={14} /> Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      {archiveTarget && (
        <ConfirmDialog
          title="Archive Member"
          message={`Are you sure you want to archive ${archiveTarget.name}? They will not be selectable for new expenses, but historical records will be preserved.`}
          confirmLabel="Archive"
          onConfirm={handleArchiveMember}
          onCancel={() => setArchiveTarget(null)}
        />
      )}
    </div>
  )
}
