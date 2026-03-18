import { useState, useEffect, useCallback } from 'react'

let _add = null
export function toast(msg, action = null) { _add?.({ msg, action, id: Date.now() }) }

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])
  _add = useCallback((t) => {
    setToasts(p => [...p, t])
    setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 5000)
  }, [])

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto flex items-center gap-3 bg-card border border-theme rounded-xl px-4 py-3 shadow-xl animate-slide-up max-w-sm w-full">
          <span className="text-main text-sm flex-1">{t.msg}</span>
          {t.action && (
            <button onClick={() => { t.action.fn(); setToasts(p => p.filter(x => x.id !== t.id)) }}
              className="text-accent text-sm font-semibold shrink-0">{t.action.label}</button>
          )}
        </div>
      ))}
    </div>
  )
}
