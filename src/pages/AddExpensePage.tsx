import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { parseINRtoPaise, formatPaiseAsINR, paiseToDecimal } from '../domain/finance/money'
import { splitEqual, splitCustom, splitPercentage } from '../domain/finance/splitter'
import { todayISO, CATEGORY_ICONS } from '../utils/helpers'
import type { ExpenseCategory, SplitMethod, Allocation, Expense } from '../domain/models/types'
import { ArrowLeft, Save, IndianRupee, Tag, Calendar, User, UserCheck, FileText, Check, AlertCircle } from 'lucide-react'
import Toast from '../components/ui/Toast'

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'food', label: 'Food & Drinks' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'activities', label: 'Activities' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
]

export default function AddExpensePage() {
  const { activeTrip, members, expenses, addExpense, updateExpense, displayName } = useApp()
  const navigate = useNavigate()
  const { tripId, expenseId } = useParams()
  const currentTripId = tripId || activeTrip?.id || ''

  const isEditing = Boolean(expenseId)
  const existingExpense = isEditing ? expenses.find((e) => e.id === expenseId) : null

  // Form State
  const [title, setTitle] = useState(existingExpense?.title ?? '')
  const [amountInput, setAmountInput] = useState(
    existingExpense ? paiseToDecimal(existingExpense.amountPaise).toString() : ''
  )
  const [category, setCategory] = useState<ExpenseCategory>(existingExpense?.category ?? 'food')
  const [date, setDate] = useState(existingExpense?.date ?? todayISO())
  const [paidByMemberId, setPaidByMemberId] = useState(
    existingExpense?.paidByMemberId ?? members[0]?.id ?? ''
  )

  // Match display name unambiguously to a member
  const matchedMember = React.useMemo(() => {
    const clean = displayName.trim().toLowerCase()
    if (!clean) return null
    const matches = members.filter((m) => m.name.trim().toLowerCase() === clean)
    return matches.length === 1 ? matches[0] : null
  }, [displayName, members])

  const [recordedByMemberId, setRecordedByMemberId] = useState<string>(() => {
    if (existingExpense?.recordedByMemberId) {
      return existingExpense.recordedByMemberId
    }
    if (matchedMember) {
      return matchedMember.id
    }
    return existingExpense?.paidByMemberId ?? members[0]?.id ?? ''
  })

  // Prevent automatic overwrites once the user has manually changed recorder or when editing
  const isRecordedByManual = React.useRef(Boolean(existingExpense))

  const [description, setDescription] = useState(existingExpense?.description ?? '')
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(
    existingExpense?.splitMethod ?? 'equal'
  )

  // Split state
  // Equal split: selected member IDs
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    existingExpense
      ? existingExpense.allocations.map((a) => a.memberId)
      : members.map((m) => m.id)
  )

  // Custom split: memberId -> INR amount string
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => {
    if (existingExpense && existingExpense.splitMethod === 'custom') {
      const map: Record<string, string> = {}
      for (const a of existingExpense.allocations) {
        map[a.memberId] = paiseToDecimal(a.amountPaise).toString()
      }
      return map
    }
    return {}
  })

  // Percentage split: memberId -> % string
  const [percentages, setPercentages] = useState<Record<string, string>>(() => {
    if (existingExpense && existingExpense.splitMethod === 'percentage') {
      const map: Record<string, string> = {}
      for (const a of existingExpense.allocations) {
        const pct = ((a.amountPaise / existingExpense.amountPaise) * 100).toFixed(2)
        map[a.memberId] = pct
      }
      return map
    }
    return {}
  })

  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update defaults if members load later or displayName updates (for new expenses only)
  useEffect(() => {
    if (!paidByMemberId && members.length > 0) {
      setPaidByMemberId(members[0].id)
    }
    if (selectedMembers.length === 0 && members.length > 0 && !existingExpense) {
      setSelectedMembers(members.map((m) => m.id))
    }
    if (!isEditing && !isRecordedByManual.current && members.length > 0) {
      if (matchedMember) {
        setRecordedByMemberId(matchedMember.id)
      } else if (!recordedByMemberId) {
        setRecordedByMemberId(paidByMemberId || members[0].id)
      }
    }
  }, [members, paidByMemberId, selectedMembers.length, existingExpense, isEditing, matchedMember, recordedByMemberId])

  const totalPaise = React.useMemo(() => {
    try {
      return parseINRtoPaise(amountInput || '0')
    } catch {
      return 0
    }
  }, [amountInput])

  // Compute live allocations based on split method (memoized)
  const { computedAllocations, splitError } = React.useMemo(() => {
    let allocs: Allocation[] = []
    let err: string | null = null

    if (totalPaise > 0) {
      if (splitMethod === 'equal') {
        if (selectedMembers.length === 0) {
          err = 'Please select at least one member to split with.'
        } else {
          const result = splitEqual(totalPaise, selectedMembers)
          if (result.ok) {
            allocs = result.allocations
          } else {
            err = result.error
          }
        }
      } else if (splitMethod === 'custom') {
        const inputs = members.map((m) => {
          let amtPaise = 0
          try {
            amtPaise = parseINRtoPaise(customAmounts[m.id] || '0')
          } catch {
            amtPaise = 0
          }
          return { memberId: m.id, amountPaise: amtPaise }
        })
        const result = splitCustom(totalPaise, inputs)
        if (result.ok) {
          allocs = result.allocations
        } else {
          err = result.error
        }
      } else if (splitMethod === 'percentage') {
        const inputs = members.map((m) => ({
          memberId: m.id,
          percentage: parseFloat(percentages[m.id] || '0'),
        }))
        const result = splitPercentage(totalPaise, inputs)
        if (result.ok) {
          allocs = result.allocations
        } else {
          err = result.error
        }
      }
    }
    return { computedAllocations: allocs, splitError: err }
  }, [totalPaise, splitMethod, selectedMembers, customAmounts, percentages, members])



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setToast({ message: 'Please enter a title for the expense.', type: 'error' })
      return
    }
    if (totalPaise <= 0) {
      setToast({ message: 'Expense amount must be greater than zero.', type: 'error' })
      return
    }
    if (!paidByMemberId) {
      setToast({ message: 'Please select who paid for the expense.', type: 'error' })
      return
    }
    if (splitError || computedAllocations.length === 0) {
      setToast({ message: splitError || 'Invalid split allocation.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing && existingExpense) {
        const updated: Expense = {
          ...existingExpense,
          title: title.trim(),
          amountPaise: totalPaise,
          category,
          date,
          paidByMemberId,
          splitMethod,
          allocations: computedAllocations,
          description: description.trim() || undefined,
          recordedByMemberId: recordedByMemberId || paidByMemberId,
        }
        await updateExpense(updated)
        setToast({ message: 'Expense updated successfully!', type: 'success' })
      } else {
        await addExpense({
          title: title.trim(),
          amountPaise: totalPaise,
          category,
          date,
          paidByMemberId,
          splitMethod,
          allocations: computedAllocations,
          description: description.trim() || undefined,
          recordedByMemberId: recordedByMemberId || paidByMemberId,
        })
        setToast({ message: 'Expense added successfully!', type: 'success' })
      }
      setTimeout(() => {
        navigate(`/trip/${currentTripId}/expenses`)
      }, 500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save expense.'
      setToast({ message: msg, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  function toggleMemberEqual(memberId: string) {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    )
  }

  return (
    <div className="page" style={{ maxWidth: 720, margin: '0 auto' }}>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          type="button"
          className="btn-icon"
          onClick={() => navigate(`/trip/${currentTripId}/expenses`)}
          title="Back to expenses"
          aria-label="Back to expenses"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            {activeTrip?.name} · All calculations are saved in paise precision
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label" htmlFor="expense-title">
              Expense Title *
            </label>
            <input
              id="expense-title"
              className="form-input"
              type="text"
              placeholder="e.g. Hotel Stay, Dinner at Café, Taxi ride"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Amount & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label" htmlFor="expense-amount">
                <IndianRupee size={14} style={{ display: 'inline', marginRight: 4 }} />
                Amount (₹ INR) *
              </label>
              <input
                id="expense-amount"
                className="form-input"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                style={{ fontSize: '1.15rem', fontWeight: 600 }}
                required
              />
              {totalPaise > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: 4 }}>
                  Stored as {totalPaise.toLocaleString('en-IN')} paise ({formatPaiseAsINR(totalPaise)})
                </div>
              )}
            </div>

            <div>
              <label className="form-label" htmlFor="expense-category">
                <Tag size={14} style={{ display: 'inline', marginRight: 4 }} />
                Category
              </label>
              <select
                id="expense-category"
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {CATEGORY_ICONS[c.value]} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid By, Recorded By & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label" htmlFor="expense-payer">
                <User size={14} style={{ display: 'inline', marginRight: 4 }} />
                Paid By *
              </label>
              <select
                id="expense-payer"
                className="form-input"
                value={paidByMemberId}
                onChange={(e) => {
                  const newPayerId = e.target.value
                  setPaidByMemberId(newPayerId)
                  if (!isRecordedByManual.current && !matchedMember) {
                    setRecordedByMemberId(newPayerId)
                  }
                }}
                required
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === activeTrip?.creatorMemberId ? '(Organizer)' : ''}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                Member who paid the bill
              </span>
            </div>

            <div>
              <label className="form-label" htmlFor="expense-recorder">
                <UserCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
                Recorded By
              </label>
              <select
                id="expense-recorder"
                className="form-input"
                value={recordedByMemberId}
                onChange={(e) => {
                  isRecordedByManual.current = true
                  setRecordedByMemberId(e.target.value)
                }}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                {matchedMember && recordedByMemberId === matchedMember.id
                  ? `Defaulted from preference "${displayName}"`
                  : 'Member logging this expense'}
              </span>
            </div>

            <div>
              <label className="form-label" htmlFor="expense-date">
                <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                Date
              </label>
              <input
                id="expense-date"
                className="form-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Description / Notes */}
          <div style={{ marginBottom: 12 }}>
            <label className="form-label" htmlFor="expense-notes">
              <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
              Notes / Description (Optional)
            </label>
            <textarea
              id="expense-notes"
              className="form-input"
              rows={2}
              placeholder="e.g. Receipt #402, paid via UPI, includes tips"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Split Method & Allocations */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>
            Split Among Members
          </h2>

          {/* Split Method Tabs */}
          <div className="split-method-grid" role="tablist" aria-label="Split method">
            {(
              [
                { method: 'equal', label: 'Equally' },
                { method: 'custom', label: 'Exact Amounts (₹)' },
                { method: 'percentage', label: 'By Percentage (%)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.method}
                type="button"
                role="tab"
                aria-selected={splitMethod === tab.method}
                className={`split-method-btn ${splitMethod === tab.method ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSplitMethod(tab.method)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Equal Split Selection */}
          {splitMethod === 'equal' && (
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Select who is sharing this expense. Any leftover remainder paise will be distributed deterministically.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {members.map((member) => {
                  const isChecked = selectedMembers.includes(member.id)
                  const alloc = computedAllocations.find((a) => a.memberId === member.id)
                  return (
                    <label
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 8,
                        backgroundColor: isChecked ? 'var(--surface-elevated)' : 'transparent',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--accent-primary)' : 'var(--border)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMemberEqual(member.id)}
                          style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16 }}
                        />
                        <span style={{ fontWeight: 500 }}>{member.name}</span>
                      </div>
                      <span style={{ fontSize: '0.9rem', color: isChecked ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {isChecked && alloc ? formatPaiseAsINR(alloc.amountPaise) : '₹0.00'}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custom Exact Amount Split */}
          {splitMethod === 'custom' && (
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Enter the exact amount in rupees for each member. Sum must match total {formatPaiseAsINR(totalPaise)}.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {members.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '8px 12px',
                      borderRadius: 8,
                      backgroundColor: 'var(--surface-elevated)',
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{member.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: 140 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>₹</span>
                      <input
                        className="form-input"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={customAmounts[member.id] || ''}
                        onChange={(e) =>
                          setCustomAmounts((prev) => ({ ...prev, [member.id]: e.target.value }))
                        }
                        style={{ padding: '6px 10px', textAlign: 'right' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Percentage Split */}
          {splitMethod === 'percentage' && (
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Enter the percentage split for each member. Must total exactly 100%.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {members.map((member) => {
                  const alloc = computedAllocations.find((a) => a.memberId === member.id)
                  return (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '8px 12px',
                        borderRadius: 8,
                        backgroundColor: 'var(--surface-elevated)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{member.name}</span>
                        {alloc && totalPaise > 0 && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {formatPaiseAsINR(alloc.amountPaise)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: 120 }}>
                        <input
                          className="form-input"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0.00"
                          value={percentages[member.id] || ''}
                          onChange={(e) =>
                            setPercentages((prev) => ({ ...prev, [member.id]: e.target.value }))
                          }
                          style={{ padding: '6px 10px', textAlign: 'right' }}
                        />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Split Status / Errors */}
          {totalPaise > 0 && (
            <div style={{ marginTop: 16 }}>
              {splitError ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 8,
                    backgroundColor: 'var(--status-negative-bg)',
                    color: 'var(--status-negative)',
                    fontSize: '0.85rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{splitError}</span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 8,
                    backgroundColor: 'var(--status-positive-bg)',
                    color: 'var(--status-positive)',
                    fontSize: '0.85rem',
                  }}
                >
                  <Check size={16} />
                  <span>
                    Allocations balanced: {formatPaiseAsINR(totalPaise)} allocated across{' '}
                    {computedAllocations.length} member(s).
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 40 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/trip/${currentTripId}/expenses`)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || Boolean(splitError) || totalPaise <= 0}
            id="save-expense-btn"
          >
            <Save size={16} />
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Expense' : 'Save Expense'}
          </button>
        </div>
      </form>
    </div>
  )
}
