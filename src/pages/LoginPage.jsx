export default function LoginPage({ onLogin, loading }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}>

      {/* Dot grid bg */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)', backgroundSize: '28px 28px', opacity: 0.5 }} />

      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, #7c6aff18 0%, transparent 65%)' }} />

      <div className="relative z-10 flex flex-col items-center w-full max-w-xs">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 relative"
            style={{ background: 'linear-gradient(135deg, #7c6aff, #b8ff6a)', boxShadow: '0 0 40px #7c6aff55' }}>
            {/* ASIDO logo mark — A shape */}
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path d="M22 6L38 38H6L22 6Z" stroke="white" strokeWidth="3" strokeLinejoin="round" fill="none"/>
              <path d="M13 28h18" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="22" cy="22" r="3" fill="white"/>
            </svg>
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight"
            style={{ background: 'linear-gradient(135deg, #7c6aff, #b8ff6a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ASIDO
          </h1>
          <p className="text-sm text-muted mt-1 text-center">Track habits · Revise smarter · Journal daily</p>
        </div>

        {/* Features */}
        <div className="w-full space-y-2 mb-8">
          {[
            { icon: '✅', text: 'Daily habit tracking' },
            { icon: '🧠', text: 'Spaced revision scheduler' },
            { icon: '📓', text: 'Hourly journal planner' },
            { icon: '☁️', text: 'Syncs across all devices' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl card-bg">
              <span className="text-lg">{f.icon}</span>
              <span className="text-sm text-main">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Sign in button */}
        <button onClick={onLogin} disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-display font-bold text-base transition-all active:scale-95"
          style={{ background: 'white', color: '#1a1a1a', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
          )}
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <p className="text-xs text-muted text-center mt-4 opacity-60">
          Your data is private and synced securely
        </p>
      </div>
    </div>
  )
}
