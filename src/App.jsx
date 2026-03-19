import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth.js'
import { useStore } from './hooks/useStore.js'
import { useTheme } from './hooks/useTheme.js'
import BottomNav from './components/BottomNav.jsx'
import Drawer from './components/Drawer.jsx'
import ToastContainer from './components/Toast.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import HomePage from './pages/HomePage.jsx'
import JournalPage from './pages/JournalPage.jsx'
import RepetitionPage from './pages/RepetitionPage.jsx'
import TimerPage from './pages/TimerPage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import FriendsPage from './pages/FriendsPage.jsx'
import ChallengesPage from './pages/ChallengesPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'

export default function App() {
  const { user, profile, loading: authLoading, login, logout, saveProfile } = useAuth()
  const [loginLoading, setLoginLoading] = useState(false)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [showProfile, setShowProfile]   = useState(false)
  const store = useStore(user)
  const { state, setActiveTab, setTheme } = store
  const tab   = state.settings?.activeTab || 'home'
  const theme = state.settings?.theme || 'system'

  useTheme(theme)

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const root = document.documentElement
      mq.matches
        ? (root.setAttribute('data-theme','dark'), root.classList.add('dark'))
        : (root.setAttribute('data-theme','light'), root.classList.remove('dark'))
    }
    mq.addEventListener('change', apply); apply()
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  const handleLogin = async () => {
    setLoginLoading(true)
    try { await login() } catch(e) { console.error(e) }
    setLoginLoading(false)
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
          style={{background:'linear-gradient(135deg,#7c6aff,#b8ff6a)'}}>
          <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
            <path d="M22 6L38 38H6L22 6Z" stroke="white" strokeWidth="3" strokeLinejoin="round" fill="none"/>
            <path d="M13 28h18" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="22" cy="22" r="3" fill="white"/>
          </svg>
        </div>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{borderColor:'#7c6aff',borderTopColor:'transparent'}}/>
      </div>
    </div>
  )

  if (!user) return <LoginPage onLogin={handleLogin} loading={loginLoading} />
  if (!profile) return <OnboardingPage user={user} onComplete={saveProfile} />

  const pages = {
    home:       <HomePage store={store} />,
    journal:    <JournalPage store={store} />,
    repetition: <RepetitionPage store={store} />,
    timer:      <TimerPage store={store} />,
    report:     <ReportPage store={store} />,
    friends:    <FriendsPage user={user} store={store} />,
    challenges: <ChallengesPage store={store} />,
    analytics:  <AnalyticsPage store={store} />,
  }

  const drawerItems = [
    { id: 'analytics',  label: 'Stats',      emoji: '📊' },
    { id: 'challenges', label: 'Goals',       emoji: '🏆' },
    { id: 'friends',    label: 'Friends',     emoji: '👥' },
  ]

  const themeOptions = [
    { val: 'dark',   icon: '🌙', label: 'Dark' },
    { val: 'light',  icon: '☀️', label: 'Light' },
    { val: 'system', icon: '⚙️', label: 'System' },
  ]

  return (
    <div className="max-w-lg mx-auto min-h-screen relative overflow-x-hidden" style={{background:'var(--bg)'}}>
      {/* Dot grid bg */}
      <div className="fixed inset-0 pointer-events-none"
        style={{backgroundImage:'radial-gradient(circle at 1px 1px,var(--border) 1px,transparent 0)',
          backgroundSize:'28px 28px',opacity:0.35}}/>

      <ToastContainer/>

      {/* Hamburger button — top right, clean glass */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed top-3 right-3 z-40 w-9 h-9 rounded-xl glass border border-theme flex items-center justify-center text-muted hover:text-main transition-all"
        aria-label="Open menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Page content */}
      <div style={{paddingBottom:'112px'}}>
        {pages[tab] || pages.home}
      </div>

      {/* Bottom nav — single row */}
      <BottomNav active={tab} onChange={setActiveTab}/>

      {/* Side Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            {user.photoURL
              ? <img src={user.photoURL} className="w-10 h-10 rounded-xl" alt="avatar"/>
              : <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold">
                  {(profile?.name||'?')[0].toUpperCase()}
                </div>
            }
            <div>
              <p className="text-sm font-bold text-main">{profile?.name || 'User'}</p>
              <p className="text-xs text-muted truncate max-w-[140px]">{user.email}</p>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="text-muted hover:text-main p-1" aria-label="Close drawer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <div className="flex flex-col px-3 py-3 gap-1 flex-1">
          {drawerItems.map(item => (
            <button key={item.id}
              onClick={() => { setActiveTab(item.id); setDrawerOpen(false) }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left
                ${tab === item.id ? 'bg-accent text-white' : 'text-muted hover:bg-surface hover:text-main'}`}>
              <span className="text-lg">{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Theme selector */}
        <div className="px-4 pb-3 border-t border-theme pt-3">
          <p className="text-[10px] text-muted font-mono uppercase tracking-widest mb-2">Theme</p>
          <div className="flex gap-1.5">
            {themeOptions.map(t => (
              <button key={t.val} onClick={() => setTheme(t.val)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-0.5
                  ${theme === t.val ? 'bg-accent text-white' : 'border border-theme text-muted'}`}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Profile + Logout */}
        <div className="px-4 pb-6 flex flex-col gap-2">
          <button onClick={() => { setShowProfile(true); setDrawerOpen(false) }}
            className="w-full btn-secondary py-2.5 text-sm">
            👤 View Profile
          </button>
          <button onClick={async () => { await logout(); setDrawerOpen(false) }}
            className="w-full btn-danger py-2.5 text-sm">
            Sign Out
          </button>
        </div>
      </Drawer>

      {showProfile && (
        <ProfilePage user={user} profile={profile}
          onClose={() => setShowProfile(false)}
          onLogout={async () => { await logout(); setShowProfile(false) }}/>
      )}
    </div>
  )
}
