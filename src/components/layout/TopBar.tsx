import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { preloadRoute } from '../../utils/navigation'
import { Menu, Plus, MapPin } from 'lucide-react'

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { activeTrip } = useApp()
  const { tripId } = useParams()
  const navigate = useNavigate()
  const id = tripId || activeTrip?.id

  return (
    <header
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg-secondary)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Mobile menu button */}
      <button
        className="btn-icon"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        style={{ display: 'flex' }}
      >
        <Menu size={20} />
      </button>

      {/* Trip name (mobile) */}
      {activeTrip && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
          <MapPin size={14} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
            {activeTrip.name}
          </span>
        </div>
      )}

      {/* Quick add expense */}
      {id && (
        <button
          className="btn-primary"
          onClick={() => navigate(`/trip/${id}/expenses/add`)}
          onMouseEnter={preloadRoute.addExpense}
          onFocus={preloadRoute.addExpense}
          style={{ fontSize: '0.82rem', padding: '7px 12px', gap: 5 }}
          aria-label="Add new expense"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Add Expense</span>
        </button>
      )}
    </header>
  )
}
