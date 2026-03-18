export default function ProfilePage({ user, profile, onClose, onLogout }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-lg glass border-t border-theme rounded-t-3xl px-6 pt-4 pb-10 animate-slide-up z-10">
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5"/>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6">
          {user?.photoURL
            ? <img src={user.photoURL} className="w-16 h-16 rounded-2xl" alt="avatar"/>
            : <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white text-2xl font-bold">
                {(profile?.name || user?.email || '?')[0].toUpperCase()}
              </div>
          }
          <div>
            <h2 className="font-display text-xl font-black text-main">{profile?.name || 'User'}</h2>
            <p className="text-sm text-muted">{user?.email}</p>
            {profile?.occupation && (
              <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{ background: '#7c6aff22', color: '#7c6aff' }}>
                {profile.occupation}
              </span>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="flex flex-col gap-2 mb-6">
          {[
            { label: 'Name', value: profile?.name || '—' },
            { label: 'Email', value: user?.email || '—' },
            { label: 'Occupation', value: profile?.occupation || '—' },
            { label: 'Goal', value: profile?.goal || '—' },
          ].map(item => (
            <div key={item.label} className="card-bg rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-xs text-muted font-mono uppercase tracking-widest">{item.label}</span>
              <span className="text-sm text-main font-medium truncate ml-4 max-w-[60%] text-right">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button onClick={onLogout}
          className="w-full btn-danger py-3.5 text-base font-bold">
          Sign Out
        </button>

        <button onClick={onClose} className="w-full mt-3 btn-secondary py-3">
          Close
        </button>
      </div>
    </div>
  )
}
