import { useEffect, useRef } from 'react'

export default function Drawer({ open, onClose, children }) {
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    // small delay so the open click doesn't immediately close
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handler)
      document.addEventListener('touchstart', handler)
    }, 100)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open, onClose])

  // Swipe right to close
  const touchX = useRef(null)
  const handleTouchStart = (e) => { touchX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchX.current !== null && e.changedTouches[0].clientX - touchX.current > 60) onClose()
    touchX.current = null
  }

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />

      {/* Drawer panel — slides from right */}
      <div ref={ref}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 right-0 h-full z-50 w-72 flex flex-col transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--card)', borderLeft: '1px solid var(--border)' }}>
        {children}
      </div>
    </>
  )
}
