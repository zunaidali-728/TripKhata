import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatPaiseAsINR } from '../domain/finance/money'
import { verifyZeroSum } from '../domain/finance/balances'
import { Scale, CheckCircle2, AlertTriangle, TrendingUp, HandCoins } from 'lucide-react'

export default function BalancesPage() {
  const { trips, activeTrip, members, memberBalances, totalTripSpending } = useApp()
  const navigate = useNavigate()
  const { tripId } = useParams()
  const currentTrip = (tripId ? trips.find((t) => t.id === tripId) : null) || activeTrip
  const currentTripId = tripId || currentTrip?.id || ''

  if (!currentTrip) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 64 }}>
        <p style={{ color: 'var(--text-muted)' }}>No trip selected.</p>
      </div>
    )
  }

  const { valid: isZeroSum, sumPaise: discrepancyPaise } = verifyZeroSum(memberBalances)

  const activeMembers = members.filter((m) => m.status === 'active')

  return (
    <div className="page" style={{ maxWidth: 840, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Trip Balances</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Transparent breakdown of payments, allocated expenses, settlements, and net positions
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate(`/trip/${currentTripId}/settlements`)}
          id="go-to-settlements-btn"
        >
          <HandCoins size={16} /> Settle Up
        </button>
      </div>

      {/* Top Banner: Total Spending & Zero-Sum Verification */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 28 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <TrendingUp size={20} color="var(--accent-secondary)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Trip Spending
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
            {formatPaiseAsINR(totalTripSpending)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Sum of all logged trip expenses
          </div>
        </div>

        <div className="card" style={{ padding: 20, borderColor: isZeroSum ? 'var(--status-positive)' : 'var(--status-negative)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {isZeroSum ? (
              <CheckCircle2 size={20} color="var(--status-positive)" />
            ) : (
              <AlertTriangle size={20} color="var(--status-negative)" />
            )}
            <span style={{ fontSize: '0.85rem', color: isZeroSum ? 'var(--status-positive)' : 'var(--status-negative)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isZeroSum ? 'Ledger Balanced (Zero-Sum)' : 'Ledger Invariant Discrepancy'}
            </span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {isZeroSum
              ? 'Exact mathematical parity (Net sum = ₹0.00)'
              : `Discrepancy: ${formatPaiseAsINR(discrepancyPaise)}`}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Every rupee owed is matched by a rupee to be received
          </div>
        </div>
      </div>

      {/* Balance Formula Explanation Card */}
      <div
        className="card-elevated"
        style={{
          padding: '14px 18px',
          marginBottom: 24,
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Scale size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Formula: </strong>
          Net balance = (Total Paid − Allocated Share) + (Settlements Paid − Settlements Received).
          Positive (+) = Member receives money. Negative (−) = Member owes money.
        </div>
      </div>

      {/* Member Balances Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {activeMembers.map((member) => {
          const bal = memberBalances.get(member.id)
          const net = bal?.netBalancePaise ?? 0
          const totalPaid = bal?.totalPaidPaise ?? 0
          const totalAllocated = bal?.totalAllocatedPaise ?? 0
          const settPaid = bal?.settlementsPaidPaise ?? 0
          const settRecv = bal?.settlementsReceivedPaise ?? 0

          const isCreditor = net > 0
          const isDebtor = net < 0
          const isSettled = net === 0

          return (
            <div
              key={member.id}
              className="card"
              style={{
                padding: '18px 22px',
                borderLeft: `4px solid ${
                  isCreditor
                    ? 'var(--status-positive)'
                    : isDebtor
                    ? 'var(--status-negative)'
                    : 'var(--border)'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{member.name}</span>
                    {member.upiId && (
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        UPI: {member.upiId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Net Badge */}
                <div
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    backgroundColor: isCreditor
                      ? 'var(--status-positive-bg)'
                      : isDebtor
                      ? 'var(--status-negative-bg)'
                      : 'var(--status-neutral-bg)',
                    color: isCreditor
                      ? 'var(--status-positive)'
                      : isDebtor
                      ? 'var(--status-negative)'
                      : 'var(--text-muted)',
                  }}
                >
                  {isCreditor && `Gets back ${formatPaiseAsINR(net)}`}
                  {isDebtor && `Owes ${formatPaiseAsINR(Math.abs(net))}`}
                  {isSettled && 'Settled Up (₹0.00)'}
                </div>
              </div>

              {/* Financial Breakdown Table / Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 12,
                  padding: '12px 14px',
                  backgroundColor: 'var(--surface-elevated)',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Paid for Expenses</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{formatPaiseAsINR(totalPaid)}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Allocated Share</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{formatPaiseAsINR(totalAllocated)}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Settlements Paid</div>
                  <div style={{ fontWeight: 600, marginTop: 2, color: settPaid > 0 ? 'var(--status-positive)' : 'inherit' }}>
                    {formatPaiseAsINR(settPaid)}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Settlements Received</div>
                  <div style={{ fontWeight: 600, marginTop: 2, color: settRecv > 0 ? 'var(--status-negative)' : 'inherit' }}>
                    {formatPaiseAsINR(settRecv)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
