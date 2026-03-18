import { useState } from 'react'
import { toDateStr } from '../utils/dates.js'
import Modal from '../components/Modal.jsx'
import { toast } from '../components/Toast.jsx'

export default function ChallengesPage({ store }) {
  const { state, addHabit } = store
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [days, setDays] = useState(7)
  const [challenges, setChallenges] = useState(() => {
    try { return JSON.parse(localStorage.getItem('asido_challenges') || '[]') } catch { return [] }
  })

  const saveChallenge = (c) => {
    const updated = [...challenges, c]
    setChallenges(updated)
    localStorage.setItem('asido_challenges', JSON.stringify(updated))
  }

  const deleteChallenge = (id) => {
    const updated = challenges.filter(c => c.id !== id)
    setChallenges(updated)
    localStorage.setItem('asido_challenges', JSON.stringify(updated))
    toast('Challenge removed')
  }

  const handleAdd = () => {
    if (!title.trim()) return
    const now = new Date()
    const end = new Date(now); end.setDate(now.getDate() + days)
    const c = {
      id: `ch_${Date.now()}`,
      title: title.trim(),
      days,
      startDate: toDateStr(now),
      endDate: toDateStr(end),
      createdAt: now.toISOString(),
    }
    saveChallenge(c)
    // Optionally add as a habit
    addHabit(state.settings.activeListId, title.trim(), '🏆', '#7c6aff')
    setTitle(''); setShowAdd(false)
    toast(`🏆 Challenge started! ${days} days to go!`)
  }

  const getProgress = (c) => {
    const start = new Date(c.startDate)
    const today = new Date()
    const elapsed = Math.floor((today - start) / (1000 * 60 * 60 * 24))
    return Math.min(Math.max(elapsed, 0), c.days)
  }

  const isComplete = (c) => getProgress(c) >= c.days
  const daysLeft = (c) => Math.max(c.days - getProgress(c), 0)

  return (
    <div className="flex flex-col min-h-screen bg-base">
      <div className="sticky top-0 z-20 glass border-b border-theme px-4 pt-safe">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="font-display text-xl font-black text-main">Challenges</h1>
            <p className="text-xs text-muted">{challenges.filter(c => !isComplete(c)).length} active</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary px-4 py-2 text-sm">
            + New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* Active challenges */}
        {challenges.filter(c => !isComplete(c)).length > 0 && (
          <section className="mb-5">
            <p className="text-xs text-muted font-mono uppercase tracking-widest mb-3">🔥 Active</p>
            {challenges.filter(c => !isComplete(c)).map(c => {
              const prog = getProgress(c)
              const pct  = (prog / c.days) * 100
              return (
                <div key={c.id} className="card-bg rounded-2xl p-4 mb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-base text-main">{c.title}</p>
                      <p className="text-xs text-muted font-mono mt-0.5">{c.days}-day challenge · {daysLeft(c)}d left</p>
                    </div>
                    <button onClick={() => deleteChallenge(c.id)} className="text-muted hover:text-ember p-1 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 progress-bar" style={{ width: `${pct}%` }}/>
                    </div>
                    <span className="font-mono text-xs text-accent font-bold shrink-0">{prog}/{c.days}</span>
                  </div>
                  {/* Day dots */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {Array.from({ length: c.days }).map((_, i) => (
                      <div key={i} className="w-3 h-3 rounded-full transition-all"
                        style={{ background: i < prog ? '#7c6aff' : 'var(--border)' }}/>
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* Completed */}
        {challenges.filter(isComplete).length > 0 && (
          <section className="mb-5">
            <p className="text-xs text-muted font-mono uppercase tracking-widest mb-3">✅ Completed</p>
            {challenges.filter(isComplete).map(c => (
              <div key={c.id} className="card-bg rounded-xl px-4 py-3 mb-2 flex items-center gap-3 opacity-70">
                <span className="text-2xl">🏆</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-main">{c.title}</p>
                  <p className="text-xs text-muted font-mono">{c.days}-day challenge completed!</p>
                </div>
                <button onClick={() => deleteChallenge(c.id)} className="text-muted hover:text-ember p-1 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ))}
          </section>
        )}

        {challenges.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏆</div>
            <p className="font-display text-xl font-black text-main mb-2">Start a Challenge</p>
            <p className="text-sm text-muted">7-day or 30-day goals to push yourself!</p>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="New Challenge" onClose={() => setShowAdd(false)} size="sm">
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Challenge name..." className="input-field w-full mb-4" autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <p className="text-xs text-muted mb-2 font-mono uppercase tracking-widest">Duration</p>
          <div className="flex gap-2 mb-5">
            {[7, 14, 21, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${days === d ? 'bg-accent text-white' : 'border border-theme text-muted'}`}>
                {d}d
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 btn-secondary">Cancel</button>
            <button onClick={handleAdd} disabled={!title.trim()} className="flex-1 btn-primary">Start! 🔥</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
