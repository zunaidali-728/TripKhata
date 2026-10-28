import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { preloadRoute } from '../utils/navigation'
import { formatPaiseAsINR } from '../domain/finance/money'
import { formatDate, CATEGORY_ICONS } from '../utils/helpers'
import {
  Plus, TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft,
  Receipt, Users, Scale, HandCoins, MapPin, Calendar, Mountain
} from 'lucide-react'

export default function DashboardPage() {
  const { activeTrip, members, expenses, memberBalances, totalTripSpending, recommendedTransfers } = useApp()
  const navigate = useNavigate()
  const { tripId } = useParams()
  const id = tripId || activeTrip?.id || ''

  // Compute summary for "my" perspective: creator or first member
  const myMemberId = activeTrip?.creatorMemberId ?? ''
  const myBalance = memberBalances.get(myMemberId)
  const myNet = myBalance?.netBalancePaise ?? 0
  const myToPay = myNet < 0 ? Math.abs(myNet) : 0
  const myToReceive = myNet > 0 ? myNet : 0

  const pendingPayCount = useMemo(
    () => recommendedTransfers.filter((t) => t.fromMemberId === myMemberId).length,
    [recommendedTransfers, myMemberId]
  )

  const pendingReceiveCount = useMemo(
    () => recommendedTransfers.filter((t) => t.toMemberId === myMemberId).length,
    [recommendedTransfers, myMemberId]
  )

  const recentExpenses = useMemo(
    () =>
      [...expenses]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [expenses]
  )

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  )

  if (!activeTrip) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 64 }}>
        <p style={{ color: 'var(--text-muted)' }}>No trip selected.</p>
      </div>
    )
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      {/* Header Banner with Subtle Atmospheric Himalayan Texture */}
      <div
        className="card"
        style={{
          position: 'relative',
          padding: '28px 24px',
          marginBottom: 28,
          overflow: 'hidden',
          backgroundColor: 'rgba(18, 42, 34, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(41, 66, 55, 0.7)',
          borderRadius: 16,
        }}
      >
        {/* Subtle Himalayan Landscape Watermark in Header */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('/photos/misty-valley.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            opacity: 0.09,
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-primary)',
                  backgroundColor: 'rgba(101, 201, 139, 0.12)',
                  padding: '3px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(101, 201, 139, 0.25)',
                }}
              >
                Active Expedition
              </span>
            </div>
            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)',
                fontWeight: 700,
                color: '#F4F5EE',
                marginBottom: 10,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}
            >
              {activeTrip.name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-secondary)',
                  fontSize: '0.84rem',
                  backgroundColor: 'rgba(8, 23, 19, 0.5)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: '1px solid rgba(41, 66, 55, 0.6)',
                }}
              >
                <MapPin size={13} color="var(--accent-primary)" /> {activeTrip.destination}
              </span>
              {activeTrip.startDate && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--text-secondary)',
                    fontSize: '0.84rem',
                    backgroundColor: 'rgba(8, 23, 19, 0.5)',
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: '1px solid rgba(41, 66, 55, 0.6)',
                  }}
                >
                  <Calendar size={13} color="var(--accent-secondary)" /> {formatDate(activeTrip.startDate)}
                  {activeTrip.endDate ? ` – ${formatDate(activeTrip.endDate)}` : ''}
                </span>
              )}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-secondary)',
                  fontSize: '0.84rem',
                  backgroundColor: 'rgba(8, 23, 19, 0.5)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: '1px solid rgba(41, 66, 55, 0.6)',
                }}
              >
                <Users size={13} color="var(--accent-primary)" /> {members.filter((m) => m.status === 'active').length} members
              </span>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => navigate(`/trip/${id}/expenses/add`)}
            onMouseEnter={preloadRoute.addExpense}
            onFocus={preloadRoute.addExpense}
            id="dashboard-add-expense-btn"
            style={{
              padding: '11px 22px',
              fontSize: '0.92rem',
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(101, 201, 139, 0.3)',
            }}
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <SummaryCard
          label="Total Trip Spending"
          value={formatPaiseAsINR(totalTripSpending)}
          icon={<TrendingUp size={20} color="var(--accent-secondary)" />}
          color="var(--accent-secondary)"
          sub={`${expenses.length} expense${expenses.length === 1 ? '' : 's'}`}
        />
        <SummaryCard
          label="My Net Balance"
          value={formatPaiseAsINR(myNet)}
          icon={<Wallet size={20} color={myNet >= 0 ? 'var(--status-positive)' : 'var(--status-negative)'} />}
          color={myNet >= 0 ? 'var(--status-positive)' : 'var(--status-negative)'}
          positive={myNet > 0}
          negative={myNet < 0}
          sub={myNet > 0 ? 'to receive' : myNet < 0 ? 'to pay' : 'all settled'}
        />
        <SummaryCard
          label="I Need to Pay"
          value={formatPaiseAsINR(myToPay)}
          icon={<ArrowUpRight size={20} color="var(--status-negative)" />}
          color="var(--status-negative)"
          negative={myToPay > 0}
          sub={`${pendingPayCount} transfer(s) pending`}
        />
        <SummaryCard
          label="I Will Receive"
          value={formatPaiseAsINR(myToReceive)}
          icon={<ArrowDownLeft size={20} color="var(--status-positive)" />}
          color="var(--status-positive)"
          positive={myToReceive > 0}
          sub={`${pendingReceiveCount} transfer(s) due`}
        />
      </div>

      {/* Main Content Sections Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {/* Recent Expenses Card */}
        <div
          className="card"
          style={{
            padding: '22px',
            backgroundColor: 'rgba(18, 42, 34, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 14,
            border: '1px solid rgba(41, 66, 55, 0.7)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F4F5EE', margin: 0 }}>
              Recent Expenses
            </h2>
            <button
              className="btn-ghost"
              onClick={() => navigate(`/trip/${id}/expenses`)}
              style={{ fontSize: '0.82rem', padding: '4px 8px' }}
            >
              View all
            </button>
          </div>

          {recentExpenses.length === 0 ? (
            /* Improved Understated Empty State */
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(101, 201, 139, 0.08)',
                  border: '1px solid rgba(101, 201, 139, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: 'var(--accent-primary)',
                }}
              >
                <Mountain size={22} />
              </div>
              <p style={{ margin: '0 0 14px 0', color: 'var(--text-secondary)' }}>
                No expenses logged yet. Ready to record your first shared expense?
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate(`/trip/${id}/expenses/add`)}
                style={{ fontSize: '0.84rem', padding: '8px 16px' }}
              >
                <Plus size={14} /> Add First Expense
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentExpenses.map((expense) => {
                const payer = memberMap.get(expense.paidByMemberId)
                return (
                  <div
                    key={expense.id}
                    className="dashboard-expense-item"
                    onClick={() => navigate(`/trip/${id}/expenses`)}
                  >
                    <div style={{ fontSize: '1.25rem', width: 34, textAlign: 'center' }}>
                      {CATEGORY_ICONS[expense.category]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: '0.9rem',
                          color: '#F4F5EE',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {expense.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Paid by {payer?.name ?? 'Unknown'} · {formatDate(expense.date)}
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: 'var(--text-primary)',
                        flexShrink: 0,
                      }}
                    >
                      {formatPaiseAsINR(expense.amountPaise)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Member Balances Card */}
        <div
          className="card"
          style={{
            padding: '22px',
            backgroundColor: 'rgba(18, 42, 34, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 14,
            border: '1px solid rgba(41, 66, 55, 0.7)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F4F5EE', margin: 0 }}>
              Member Positions
            </h2>
            <button
              className="btn-ghost"
              onClick={() => navigate(`/trip/${id}/balances`)}
              style={{ fontSize: '0.82rem', padding: '4px 8px' }}
            >
              View breakdown
            </button>
          </div>

          {members.length === 0 ? (
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
                textAlign: 'center',
                padding: '24px 0',
              }}
            >
              No members yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {members
                .filter((m) => m.status === 'active')
                .map((member) => {
                  const bal = memberBalances.get(member.id)
                  const net = bal?.netBalancePaise ?? 0
                  return (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 10,
                        backgroundColor: 'rgba(8, 23, 19, 0.4)',
                        border: '1px solid rgba(41, 66, 55, 0.4)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            backgroundColor: 'var(--surface-elevated)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: 'var(--accent-primary)',
                          }}
                        >
                          {member.initials}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#F4F5EE' }}>
                            {member.name}
                          </div>
                          {member.id === activeTrip.creatorMemberId && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)' }}>
                              Organizer
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          color:
                            net > 0
                              ? 'var(--status-positive)'
                              : net < 0
                              ? 'var(--status-negative)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {net > 0
                          ? `+${formatPaiseAsINR(net)}`
                          : net < 0
                          ? `${formatPaiseAsINR(net)}`
                          : 'Settled'}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Who Owes Whom (Debt Simplification) */}
        {recommendedTransfers.length > 0 && (
          <div
            className="card"
            style={{
              padding: '22px',
              backgroundColor: 'rgba(18, 42, 34, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 14,
              border: '1px solid rgba(41, 66, 55, 0.7)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}
            >
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F4F5EE', margin: 0 }}>
                Who Owes Whom
              </h2>
              <button
                className="btn-ghost"
                onClick={() => navigate(`/trip/${id}/settlements`)}
                style={{ fontSize: '0.82rem', padding: '4px 8px' }}
              >
                Settle Up
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recommendedTransfers.slice(0, 4).map((transfer, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 10,
                    backgroundColor: 'rgba(224, 123, 106, 0.08)',
                    border: '1px solid rgba(224, 123, 106, 0.2)',
                  }}
                >
                  <div style={{ flex: 1, fontSize: '0.86rem', color: '#F4F5EE' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{transfer.fromMemberName}</strong>
                    <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>pays</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{transfer.toMemberName}</strong>
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      color: 'var(--status-negative)',
                    }}
                  >
                    {formatPaiseAsINR(transfer.amountPaise)}
                  </div>
                </div>
              ))}
              {recommendedTransfers.length > 4 && (
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  +{recommendedTransfers.length - 4} more transfer(s)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions Card */}
        <div
          className="card"
          style={{
            padding: '22px',
            backgroundColor: 'rgba(18, 42, 34, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 14,
            border: '1px solid rgba(41, 66, 55, 0.7)',
          }}
        >
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F4F5EE', marginBottom: 16 }}>
            Expedition Shortcuts
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: <Receipt size={16} />, label: 'Expenses', path: `/trip/${id}/expenses` },
              { icon: <Users size={16} />, label: 'Members', path: `/trip/${id}/members` },
              { icon: <Scale size={16} />, label: 'Balances', path: `/trip/${id}/balances` },
              { icon: <HandCoins size={16} />, label: 'Settle Up', path: `/trip/${id}/settlements` },
            ].map((action) => (
              <button
                key={action.label}
                className="btn-secondary"
                onClick={() => navigate(action.path)}
                style={{
                  fontSize: '0.84rem',
                  padding: '12px 14px',
                  justifyContent: 'center',
                  borderRadius: 10,
                  backgroundColor: 'rgba(8, 23, 19, 0.5)',
                  border: '1px solid rgba(41, 66, 55, 0.6)',
                  transition: 'all 150ms ease',
                }}
              >
                <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
                  {action.icon}
                </span>
                <span style={{ fontWeight: 500 }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  sub?: string
  positive?: boolean
  negative?: boolean
}

function SummaryCard({ label, value, icon, color, sub, positive, negative }: SummaryCardProps) {
  return (
    <div className="card summary-card">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <p
          style={{
            fontSize: '0.74rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            margin: 0,
          }}
        >
          {label}
        </p>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize: '1.45rem',
          fontWeight: 700,
          color: positive
            ? 'var(--status-positive)'
            : negative
            ? 'var(--status-negative)'
            : 'var(--text-primary)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: 6, margin: '6px 0 0 0' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
