import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass, ShieldCheck, Cpu, Wallet, Heart } from 'lucide-react'

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="page" style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ marginBottom: 20 }}>
        <button
          className="btn-icon"
          onClick={() => navigate(-1)}
          aria-label="Back"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Hero Header */}
      <div
        className="card-elevated"
        style={{
          padding: '40px 32px',
          textAlign: 'center',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--surface-hover)',
            border: '1px solid var(--accent-primary)',
            color: 'var(--accent-primary)',
            marginBottom: 16,
          }}
        >
          <Compass size={32} />
        </div>
        <h1 className="font-display" style={{ fontSize: '2.4rem', fontWeight: 700, margin: '0 0 8px 0' }}>
          TripKhata
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--accent-secondary)', fontStyle: 'italic', margin: '0 0 16px 0' }}>
          Travel together. Settle up effortlessly.
        </p>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Version 1.0.0 · Local-First Travel Expense Management
        </div>
      </div>

      {/* Key Architectural Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, color: 'var(--accent-primary)' }}>
            <Cpu size={22} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Paise-Integer Arithmetic</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Every monetary calculation is executed in integer paise. No IEEE-754 floating-point inaccuracies, ensuring mathematical parity down to the exact paisa.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, color: 'var(--accent-secondary)' }}>
            <ShieldCheck size={22} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Private &amp; Offline-First</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Your trip data lives locally in your browser&apos;s IndexedDB. No mandatory logins, no tracking, and full JSON export and import capabilities.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, color: 'var(--accent-primary)' }}>
            <Wallet size={22} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Smart Debt Simplification</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Automated minimum cash-flow graph optimization calculates the fewest transactions required to square away all group balances.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, color: 'var(--accent-secondary)' }}>
            <Heart size={22} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>UPI Payment Deep Links</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Instant Pay Now handoff using standard Indian UPI intent URIs, with quick copy fallbacks for UPI ID and exact payment amounts.
          </p>
        </div>
      </div>

      {/* Product Credits & Ownership */}
      <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 40 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 6 }}>
          Product Ownership &amp; Rights
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 4 }}>
          Product Owner: <strong>Md Zunaid Ali</strong>
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
          © 2026 Md Zunaid Ali. All rights reserved.
        </p>
      </div>
    </div>
  )
}
