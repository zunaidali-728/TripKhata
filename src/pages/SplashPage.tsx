import { useEffect, useRef, useState } from 'react'
import { MapPin, ArrowRight, User, Mountain } from 'lucide-react'
import { useApp } from '../context/AppContext'

interface SplashPageProps {
  onContinue: () => void
}

export default function SplashPage({ onContinue }: SplashPageProps) {
  const { displayName, setDisplayName } = useApp()
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [imgLoaded, setImgLoaded] = useState(false)
  const [btnHovered, setBtnHovered] = useState(false)
  const hasAutoAdvanced = useRef(false)

  // Respect reduced-motion
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced && !hasAutoAdvanced.current) {
      hasAutoAdvanced.current = true
    }
  }, [])

  // Preload background image
  useEffect(() => {
    const img = new Image()
    img.src = '/photos/mountain-road.jpg'
    img.onload = () => setImgLoaded(true)
    img.onerror = () => setImgLoaded(true) // graceful fallback
  }, [])

  function handleBeginClick() {
    if (!displayName) {
      setShowNamePrompt(true)
    } else {
      onContinue()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        backgroundColor: '#081713',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      {/* Background Landscape: Authentic Sikkim Mountain Road & Sea of Clouds */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('/photos/mountain-road.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 32%',
          opacity: imgLoaded ? 1 : 0,
          transition: 'opacity 1.2s ease-out',
          animation: 'subtleCinematicZoom 35s ease-in-out infinite alternate',
          transformOrigin: 'center center',
          filter: 'brightness(0.92) contrast(1.05)',
        }}
        aria-hidden="true"
      />

      {/* Atmospheric Vignette (darkened edges, clear center) */}
      <div className="cinematic-vignette" aria-hidden="true" />

      {/* Ambient Dawn Glow (warm dawn light breaking through misty ridges) */}
      <div className="ambient-dawn-glow" aria-hidden="true" />

      {/* Drifting Translucent Fog Layer 1 */}
      <div className="fog-layer-1" aria-hidden="true" />

      {/* Drifting Translucent Fog Layer 2 */}
      <div className="fog-layer-2" aria-hidden="true" />

      {/* Film Grain Texture for 35mm Travel Documentary Feel */}
      <div className="film-grain" aria-hidden="true" />

      {/* Scrim Gradient: preserves upper landscape visibility, provides contrast for typography */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(8, 23, 19, 0.15) 0%, rgba(8, 23, 19, 0.3) 35%, rgba(8, 23, 19, 0.7) 70%, rgba(8, 23, 19, 0.94) 100%)',
          pointerEvents: 'none',
          zIndex: 6,
        }}
        aria-hidden="true"
      />

      {/* Hero Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '32px 24px',
          width: '100%',
          maxWidth: '680px',
          margin: '0 auto',
        }}
      >
        {/* Brand Pill */}
        <div
          className="hero-fade-up"
          style={{
            animationDelay: '0.15s',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px',
            padding: '7px 18px',
            borderRadius: '999px',
            backgroundColor: 'rgba(10, 28, 22, 0.75)',
            border: '1px solid rgba(101, 201, 139, 0.35)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <MapPin size={15} color="#65C98B" />
          <span
            style={{
              color: '#65C98B',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            TripKhata
          </span>
        </div>

        {/* Main Headline */}
        <h1
          className="font-display hero-fade-up"
          style={{
            animationDelay: '0.3s',
            fontSize: 'clamp(2.5rem, 6.5vw, 4.2rem)',
            fontWeight: 800,
            color: '#F4F5EE',
            lineHeight: 1.08,
            marginBottom: '18px',
            letterSpacing: '-0.025em',
            textShadow: '0 2px 20px rgba(0, 0, 0, 0.85), 0 4px 40px rgba(8, 23, 19, 0.7)',
          }}
        >
          Travel together.
          <br />
          <span
            style={{
              color: '#65C98B',
              textShadow: '0 0 25px rgba(101, 201, 139, 0.4), 0 2px 14px rgba(0, 0, 0, 0.8)',
            }}
          >
            Settle up
          </span>{' '}
          effortlessly.
        </h1>

        {/* Supporting Tagline */}
        <p
          className="hero-fade-up"
          style={{
            animationDelay: '0.45s',
            color: '#D2DCD4',
            fontSize: 'clamp(1rem, 2.2vw, 1.15rem)',
            lineHeight: 1.6,
            maxWidth: '420px',
            margin: '0 auto 36px',
            textShadow: '0 1px 10px rgba(0, 0, 0, 0.8)',
            fontWeight: 400,
          }}
        >
          Plan the trip. Share the expenses.
          <br />
          Keep everything sorted.
        </p>

        {/* CTA or Display Name Prompt */}
        {!showNamePrompt ? (
          <div className="hero-fade-up" style={{ animationDelay: '0.6s' }}>
            <button
              id="splash-begin-btn"
              onClick={handleBeginClick}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              className="btn-primary"
              style={{
                fontSize: '1.02rem',
                padding: '14px 34px',
                borderRadius: '999px',
                backgroundColor: '#65C98B',
                color: '#081713',
                fontWeight: 700,
                boxShadow: btnHovered
                  ? '0 6px 28px rgba(101, 201, 139, 0.5), 0 0 16px rgba(101, 201, 139, 0.3)'
                  : '0 4px 18px rgba(0, 0, 0, 0.4)',
                gap: '10px',
                transform: btnHovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
              }}
              aria-label="Begin your journey with TripKhata"
            >
              Begin Journey
              <ArrowRight size={18} />
            </button>

            <p
              style={{
                color: 'rgba(210, 220, 212, 0.7)',
                fontSize: '0.78rem',
                marginTop: '18px',
                textShadow: '0 1px 6px rgba(0, 0, 0, 0.8)',
                letterSpacing: '0.02em',
              }}
            >
              No sign-up required · All data stored locally
            </p>
          </div>
        ) : (
          /* Interactive Display Name Form */
          <div
            className="hero-fade-up"
            style={{
              padding: '26px 28px',
              textAlign: 'left',
              backgroundColor: 'rgba(14, 34, 27, 0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(101, 201, 139, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 20px rgba(101, 201, 139, 0.15)',
              maxWidth: 420,
              margin: '0 auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#65C98B' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(101, 201, 139, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={16} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#F4F5EE' }}>
                What should we call you?
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#A8B8AD', marginBottom: 18, lineHeight: 1.5 }}>
              Optional. Enter your name to pre-fill who records expenses. You can change this anytime in Settings.
            </p>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Zunaid"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
              style={{
                marginBottom: 18,
                backgroundColor: 'rgba(8, 23, 19, 0.75)',
                borderColor: 'rgba(41, 66, 55, 0.8)',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (nameInput.trim()) {
                    setDisplayName(nameInput.trim())
                  }
                  onContinue()
                }
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={onContinue}
                id="skip-display-name-btn"
                style={{ fontSize: '0.88rem', color: '#A8B8AD' }}
              >
                Skip for now
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (nameInput.trim()) {
                    setDisplayName(nameInput.trim())
                  }
                  onContinue()
                }}
                id="save-display-name-btn"
                style={{ padding: '8px 20px', fontSize: '0.88rem' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Photo Attributions Badge (Discreet bottom-right indicator) */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 20,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.72rem',
          color: 'rgba(168, 184, 173, 0.6)',
          letterSpacing: '0.04em',
          pointerEvents: 'none',
        }}
      >
        <Mountain size={12} />
        <span>Sikkim Silk Route, Himalayas</span>
      </div>
    </div>
  )
}
