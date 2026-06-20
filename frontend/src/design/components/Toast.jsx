import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message, { variant = 'info', duration = 3000 } = {}) => {
      const id = ++_id
      setToasts((list) => [...list, { id, message, variant }])
      if (duration > 0) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="ds-toast__container">
        {toasts.map((t) => (
          <div key={t.id} className={`ds-toast ds-toast--${t.variant}`}>
            <span>{t.message}</span>
            <button className="ds-toast__close" onClick={() => dismiss(t.id)} aria-label="닫기">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
