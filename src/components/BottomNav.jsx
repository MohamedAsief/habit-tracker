export default function BottomNav({ active, onChange }) {
  // Main 5 tabs
  const mainTabs = [
    { id: 'home', label: 'Home',
      icon: (on) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.5:1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> },
    { id: 'journal', label: 'Journal',
      icon: (on) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.5:1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
    { id: 'repetition', label: 'Revision',
      icon: (on) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.5:1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v6h6M21.5 22v-6h-6"/><path d="M22 11.5A10 10 0 003.2 7.2M2 12.5a10 10 0 0018.8 4.2"/></svg> },
    { id: 'timer', label: 'Timer',
      icon: (on) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.5:1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg> },
    { id: 'report', label: 'Report',
      icon: (on) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.5:1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 17V13M12 17V9M16 17v-5"/></svg> },
  ]

  // Extra 3 tabs
  const extraTabs = [
    { id: 'analytics',  label: 'Stats',
      icon: (on) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.5:1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { id: 'challenges', label: 'Goals',
      icon: (on) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.5:1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
    { id: 'friends',    label: 'Friends',
      icon: (on) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.5:1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  ]

  const allExtra = extraTabs.some(t => t.id === active)

  return (
    <>
      {/* Extra tabs nav — second bar above main nav */}
      <nav className="fixed bottom-[56px] left-0 right-0 z-39 glass border-t border-theme">
        <div className="flex max-w-lg mx-auto">
          {extraTabs.map(t => {
            const on = active === t.id
            return (
              <button key={t.id} onClick={() => onChange(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-all ${on ? 'text-accent' : 'text-muted opacity-60'}`}
                aria-label={t.label}>
                {t.icon(on)}
                <span className="text-[9px] font-semibold">{t.label}</span>
                {on && <span className="w-1 h-1 rounded-full bg-accent"/>}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-theme">
        <div className="flex max-w-lg mx-auto">
          {mainTabs.map(t => {
            const on = active === t.id
            return (
              <button key={t.id} onClick={() => onChange(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all ${on ? 'text-accent' : 'text-muted'}`}
                aria-label={t.label} aria-current={on ? 'page' : undefined}>
                {t.icon(on)}
                <span className="text-[10px] font-semibold">{t.label}</span>
                {on && <span className="w-1 h-1 rounded-full bg-accent"/>}
              </button>
            )
          })}
        </div>
        <div style={{height:'env(safe-area-inset-bottom,0px)'}}/>
      </nav>
    </>
  )
}
