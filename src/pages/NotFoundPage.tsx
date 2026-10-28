import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Compass, Home, LayoutDashboard, ArrowLeft } from 'lucide-react'
import LoFiForestBackground from '../components/layout/LoFiForestBackground'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const { activeTrip } = useApp()

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'hidden',
        backgroundColor: '#081713',
      }}
    >
      <LoFiForestBackground imageSrc="/photos/misty-valley.jpg" />

      <div
        className="card-elevated"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 480,
          width: '100%',
          padding: '40px 32px',
          textAlign: 'center',
          borderRadius: 20,
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(12, 28, 22, 0.88)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'rgba(101, 201, 139, 0.12)',
            border: '1px solid var(--accent-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            marginBottom: 20,
          }}
        >
          <Compass size={32} />
        </div>

        <span
          style={{
            display: 'inline-block',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--accent-primary)',
            marginBottom: 8,
          }}
        >
          Error 404
        </span>

        <h1
          className="font-display"
          style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 10px 0',
          }}
        >
          Expedition Trail Lost
        </h1>

        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          The coordinates or path you entered don't exist in TripKhata. The route may have changed or the link might be incomplete.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {activeTrip && (
            <button
              className="btn-primary"
              onClick={() => navigate(`/trip/${activeTrip.id}/dashboard`)}
              style={{ justifyContent: 'center', width: '100%', padding: '10px 16px' }}
            >
              <LayoutDashboard size={16} /> Back to {activeTrip.name}
            </button>
          )}

          <button
            className={activeTrip ? 'btn-secondary' : 'btn-primary'}
            onClick={() => navigate('/trips')}
            style={{ justifyContent: 'center', width: '100%', padding: '10px 16px' }}
          >
            <Home size={16} /> View All Trips
          </button>

          <button
            className="btn-ghost"
            onClick={() => navigate(-1)}
            style={{ justifyContent: 'center', width: '100%', padding: '8px 16px', color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={15} /> Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
