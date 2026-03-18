import { useEffect, useRef } from 'react'

export default function Modal({ title, onClose, children, size = 'md' }) {
  const ref = useRef()
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} className={`relative w-full ${sizes[size]} glass border border-theme rounded-t-3xl sm:rounded-2xl px-5 pt-5 pb-8 sm:pb-6 animate-slide-up z-10 max-h-[90vh] overflow-y-auto`}>
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-main">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-main transition-colors p-1 rounded-lg" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
