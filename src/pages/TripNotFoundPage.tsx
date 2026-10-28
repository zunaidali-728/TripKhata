import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, Home } from 'lucide-react'
import LoFiForestBackground from '../components/layout/LoFiForestBackground'

interface TripNotFoundPageProps {
  tripId?: string
}

export default function TripNotFoundPage({ tripId }: TripNotFoundPageProps) {
  const navigate = useNavigate()

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
            backgroundColor: 'rgba(224, 86, 36, 0.12)',
            border: '1px solid rgba(224, 86, 36, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-warning)',
            marginBottom: 20,
          }}
        >
          <MapPin size={32} />
        </div>

        <h1
          className="font-display"
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 10px 0',
          }}
        >
          Expedition Not Found
        </h1>

        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {tripId ? (
            <>
              We couldn&apos;t find an expedition with ID{' '}
              <code
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  color: 'var(--accent-primary)',
                  fontSize: '0.82rem',
                }}
              >
                {tripId}
              </code>
              . It may have been deleted, or created on another browser or device.
            </>
          ) : (
            'No expedition ID was provided in the URL.'
          )}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <button
            className="btn-primary"
            onClick={() => navigate('/trips')}
            style={{ justifyContent: 'center', width: '100%', padding: '10px 16px' }}
          >
            <Home size={16} /> Browse My Trips
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigate('/welcome')}
            style={{ justifyContent: 'center', width: '100%', padding: '10px 16px' }}
          >
            <Plus size={16} /> Create New Trip
          </button>
        </div>
      </div>
    </div>
  )
}
