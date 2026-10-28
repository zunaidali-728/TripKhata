import { useEffect, useState, useRef } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const dismiss = () => {
    setIsExiting(true)
    setTimeout(() => onCloseRef.current(), 180)
  }

  useEffect(() => {
    const timer = setTimeout(dismiss, duration)
    return () => clearTimeout(timer)
  }, [duration])

  return (
    <div
      className={`toast ${type === 'success' ? 'toast-success' : 'toast-error'}`}
      style={{
        transition: 'opacity 180ms ease, transform 180ms ease',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateX(24px)' : 'translateX(0)',
      }}
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
        onClick={dismiss}
        className="btn-icon"
        style={{ padding: 4 }}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}
