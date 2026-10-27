import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal" style={{ maxWidth: 400, padding: '28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: danger ? 'var(--status-negative-bg)' : 'var(--status-pending-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} color={danger ? 'var(--status-negative)' : 'var(--status-pending)'} />
          </div>
          <div>
            <h2 id="confirm-title" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onCancel} style={{ fontSize: '0.88rem' }}>{cancelLabel}</button>
          <button
            ref={confirmRef}
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            style={{ fontSize: '0.88rem' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
