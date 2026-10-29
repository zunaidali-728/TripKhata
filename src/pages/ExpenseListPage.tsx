import { useState, useMemo, useCallback, memo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { preloadRoute } from '../utils/navigation'
import { formatPaiseAsINR } from '../domain/finance/money'
import { formatDate, CATEGORY_ICONS, CATEGORY_LABELS } from '../utils/helpers'
import { Plus, Search, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Toast from '../components/ui/Toast'
import type { Expense, ExpenseCategory } from '../domain/models/types'

const CATEGORIES: { value: ExpenseCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'food', label: 'Food & Drinks' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'activities', label: 'Activities' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
]

export default function ExpenseListPage() {
  const { activeTrip, expenses, members, deleteExpense } = useApp()
  const navigate = useNavigate()
  const { tripId } = useParams()
  const id = tripId || activeTrip?.id || ''
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return expenses
      .filter((e) => {
        const matchSearch = q === '' || e.title.toLowerCase().includes(q)
        const matchCat = categoryFilter === 'all' || e.category === categoryFilter
        return matchSearch && matchCat
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          const diff = new Date(b.date).getTime() - new Date(a.date).getTime()
          return sortDir === 'desc' ? diff : -diff
        } else {
          const diff = b.amountPaise - a.amountPaise
          return sortDir === 'desc' ? diff : -diff
        }
      })
  }, [expenses, search, categoryFilter, sortBy, sortDir])

  const totalFiltered = useMemo(
    () => filtered.reduce((s, e) => s + e.amountPaise, 0),
    [filtered]
  )

  const handleToggleExpand = useCallback((expenseId: string) => {
    setExpandedId((prev) => (prev === expenseId ? null : expenseId))
  }, [])

  const handleEdit = useCallback(
    (expenseId: string) => {
      navigate(`/trip/${id}/expenses/${expenseId}/edit`)
    },
    [navigate, id]
  )

  const handleDeleteTarget = useCallback((expenseId: string) => {
    setDeleteTarget(expenseId)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteExpense(deleteTarget)
      setToast('Expense deleted.')
    } catch {
      setToast('Failed to delete expense.')
    }
    setDeleteTarget(null)
  }, [deleteExpense, deleteTarget])

  return (
    <div className="page">
      {toast && (
        <Toast
          message={toast}
          type={toast.includes('Failed') ? 'error' : 'success'}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>Expenses</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {filtered.length} expense{filtered.length === 1 ? '' : 's'} · {formatPaiseAsINR(totalFiltered)}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate(`/trip/${id}/expenses/add`)}
          onMouseEnter={preloadRoute.addExpense}
          onFocus={preloadRoute.addExpense}
          id="add-expense-btn"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Search & filters */}
      <div className="expense-filters-bar">
        <div className="expense-search-container">
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            type="search"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
            aria-label="Search expenses"
          />
        </div>

        <div className="expense-controls-row">
          <div className="expense-category-wrapper">
            <select
              className="form-input expense-category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'all')}
              aria-label="Filter by category"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="expense-category-icon" aria-hidden="true" />
          </div>

          <div className="expense-sort-group">
            <button
              className="btn-secondary"
              onClick={() => {
                if (sortBy === 'date') {
                  setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
                } else {
                  setSortBy('date')
                  setSortDir('desc')
                }
              }}
              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
              aria-label="Sort by date"
            >
              Date {sortBy === 'date' && (sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                if (sortBy === 'amount') {
                  setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
                } else {
                  setSortBy('amount')
                  setSortDir('desc')
                }
              }}
              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
              aria-label="Sort by amount"
            >
              Amount {sortBy === 'amount' && (sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
            </button>
          </div>
        </div>
      </div>

      {/* Expense list */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.95rem' }}>
            {expenses.length === 0 ? 'No expenses recorded yet.' : 'No expenses match your search.'}
          </p>
          {expenses.length === 0 && (
            <button
              className="btn-primary"
              onClick={() => navigate(`/trip/${id}/expenses/add`)}
              onMouseEnter={preloadRoute.addExpense}
              onFocus={preloadRoute.addExpense}
            >
              <Plus size={16} /> Add First Expense
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              memberMap={memberMap}
              expanded={expandedId === expense.id}
              onExpand={handleToggleExpand}
              onEdit={handleEdit}
              onDelete={handleDeleteTarget}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Expense"
          message="This expense and all its allocations will be permanently deleted. Member balances will be recalculated."
          confirmLabel="Delete Expense"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

interface ExpenseRowProps {
  expense: Expense
  memberMap: Map<string, { name: string; initials: string }>
  expanded: boolean
  onExpand: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const ExpenseRow = memo(function ExpenseRow({
  expense,
  memberMap,
  expanded,
  onExpand,
  onEdit,
  onDelete,
}: ExpenseRowProps) {
  const payer = memberMap.get(expense.paidByMemberId)
  const recorder = memberMap.get(expense.recordedByMemberId)

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
        onClick={() => onExpand(expense.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onExpand(expense.id)
        }}
        aria-expanded={expanded}
        aria-label={`${expense.title}, ${formatPaiseAsINR(expense.amountPaise)}`}
      >
        <div style={{ fontSize: '1.4rem', width: 36, textAlign: 'center', flexShrink: 0 }}>
          {CATEGORY_ICONS[expense.category]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {expense.title}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
              {CATEGORY_LABELS[expense.category]}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Paid by {payer?.name ?? '?'}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatDate(expense.date)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{formatPaiseAsINR(expense.amountPaise)}</span>
          {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 16px', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
            <Detail label="Paid By" value={payer?.name ?? '?'} />
            <Detail label="Recorded By" value={recorder?.name ?? payer?.name ?? '?'} />
            <Detail label="Split Method" value={expense.splitMethod.charAt(0).toUpperCase() + expense.splitMethod.slice(1)} />
            {expense.description && <Detail label="Description" value={expense.description} />}
          </div>

          <h4 style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Allocation Breakdown
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {expense.allocations.map((alloc) => {
              const m = memberMap.get(alloc.memberId)
              const pct = ((alloc.amountPaise / expense.amountPaise) * 100).toFixed(1)
              return (
                <div key={alloc.memberId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="avatar avatar-sm">{m?.initials ?? '?'}</div>
                  <span style={{ flex: 1, fontSize: '0.85rem' }}>{m?.name ?? alloc.memberId}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{pct}%</span>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{formatPaiseAsINR(alloc.amountPaise)}</span>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
            <button
              className="btn-ghost"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(expense.id)
              }}
              style={{ fontSize: '0.82rem' }}
            >
              <Edit size={14} /> Edit
            </button>
            <button
              className="btn-ghost"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(expense.id)
              }}
              style={{ fontSize: '0.82rem', color: 'var(--status-negative)' }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}
