import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth.js'
import { useStore } from './hooks/useStore.js'
import { useTheme } from './hooks/useTheme.js'
import BottomNav from './components/BottomNav.jsx'
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

  return (
    <div className="max-w-lg mx-auto min-h-screen relative overflow-x-hidden"
      style={{background:'var(--bg)'}}>

      {/* Dot grid bg */}
      <div className="fixed inset-0 pointer-events-none"
        style={{backgroundImage:'radial-gradient(circle at 1px 1px,var(--border) 1px,transparent 0)',
          backgroundSize:'28px 28px',opacity:0.35}}/>

      <ToastContainer/>

      {/* Page — bottom padding for both navbars */}
      <div style={{paddingBottom:'112px'}}>
        {pages[tab] || pages.home}
      </div>

      {/* Theme + Avatar — inside page flow at top RIGHT, small and unobtrusive */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5">
        <button
          onClick={() => setTheme(theme==='dark'?'light':theme==='light'?'system':'dark')}
          className="w-8 h-8 rounded-lg glass border border-theme flex items-center justify-center text-sm transition-all active:scale-95"
          aria-label="Theme">
          {theme==='dark'?'🌙':theme==='light'?'☀️':'⚙️'}
        </button>
        <button
          onClick={() => setShowProfile(true)}
          className="w-8 h-8 rounded-lg glass border border-theme overflow-hidden flex items-center justify-center"
          aria-label="Profile">
          {user.photoURL
            ? <img src={user.photoURL} className="w-full h-full object-cover" alt="avatar"/>
            : <span className="text-xs font-bold text-main">{(profile?.name||'?')[0].toUpperCase()}</span>
          }
        </button>
      </div>

      <BottomNav active={tab} onChange={setActiveTab}/>

      {showProfile && (
        <ProfilePage
          user={user} profile={profile}
          onClose={() => setShowProfile(false)}
          onLogout={async () => { await logout(); setShowProfile(false) }}/>
      )}
    </div>
  )
}
