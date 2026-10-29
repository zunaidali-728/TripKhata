import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { preloadRoute } from '../../utils/navigation'
import {
  LayoutDashboard, Receipt, Users, Scale, HandCoins,
  Settings, MapPin, X, ArrowLeft, Moon, Sun, Info
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { trips, activeTrip, setActiveTripId, theme, toggleTheme, displayName } = useApp()
  const { tripId } = useParams()
  const navigate = useNavigate()
  const currentTrip = (tripId ? trips.find((t) => t.id === tripId) : null) || activeTrip
  const id = tripId || currentTrip?.id || ''

  const navItems = [
    { to: `/trip/${id}/dashboard`, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: `/trip/${id}/expenses`, icon: <Receipt size={18} />, label: 'Expenses', preload: preloadRoute.expenses },
    { to: `/trip/${id}/members`, icon: <Users size={18} />, label: 'Members', preload: preloadRoute.members },
    { to: `/trip/${id}/balances`, icon: <Scale size={18} />, label: 'Balances', preload: preloadRoute.balances },
    { to: `/trip/${id}/settlements`, icon: <HandCoins size={18} />, label: 'Settle Up', preload: preloadRoute.settlements },
    { to: `/trip/${id}/settings`, icon: <Settings size={18} />, label: 'Trip Settings', preload: preloadRoute.settings },
  ]

  return (
    <nav
      className={`sidebar${open ? ' open' : ''}`}
      aria-label="Main navigation"
      role="navigation"
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => { setActiveTripId(null); navigate('/trips') }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Go to all trips"
        >
          <MapPin size={18} color="var(--accent-primary)" />
          <span className="font-display" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>TripKhata</span>
        </button>
        <button className="btn-icon md:hidden" onClick={onClose} aria-label="Close navigation">
          <X size={18} />
        </button>
      </div>

      {/* Active trip name */}
      {currentTrip && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontWeight: 600 }}>Current Trip</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrip.name}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <MapPin size={11} /> {currentTrip.destination}
          </p>
        </div>
      )}

      {/* Nav items */}
      <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onMouseEnter={item.preload}
            onFocus={item.preload}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 8,
              marginBottom: 4,
              fontSize: '0.88rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'rgba(101, 201, 139, 0.12)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
            })}
          >
            <span style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="divider" />

        <NavLink
          to="/trips"
          onClick={() => setActiveTripId(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'background-color 150ms ease, color 150ms ease' }}
        >
          <ArrowLeft size={18} /> All Trips
        </NavLink>

        <NavLink
          to="/about"
          onMouseEnter={preloadRoute.about}
          onFocus={preloadRoute.about}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'background-color 150ms ease, color 150ms ease' }}
        >
          <Info size={18} /> About
        </NavLink>
      </div>

      {/* Bottom: active user & theme toggle */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        {displayName && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              backgroundColor: 'rgba(101, 201, 139, 0.08)',
              border: '1px solid rgba(101, 201, 139, 0.22)',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 150ms ease',
            }}
          >
            <div
              className="avatar avatar-sm"
              style={{
                width: 24,
                height: 24,
                fontSize: '0.62rem',
                flexShrink: 0,
              }}
            >
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                Logged in as
              </p>
              <p
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {displayName}
              </p>
            </div>
          </div>
        )}
        <button
          className="btn-ghost"
          onClick={toggleTheme}
          style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem' }}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.4 }}>
          © {new Date().getFullYear()} Md Zunaid Ali
        </p>
      </div>
    </nav>
  )
}
