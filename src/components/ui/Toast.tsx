import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div
      className={`toast ${type === 'success' ? 'toast-success' : 'toast-error'}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {type === 'success' ? (
        <CheckCircle size={16} color="var(--status-positive)" aria-hidden="true" />
      ) : (
        <XCircle size={16} color="var(--status-negative)" aria-hidden="true" />
      )}
      <span style={{ flex: 1, fontSize: '0.875rem' }}>{message}</span>
      <button
        onClick={onClose}
        className="btn-icon"
        style={{ padding: 4 }}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}
