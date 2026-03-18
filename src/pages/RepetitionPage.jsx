import { useState } from 'react'
import { getDueCards, REVISION_INTERVALS } from '../utils/spaced_repetition.js'
import Modal from '../components/Modal.jsx'
import { toast } from '../components/Toast.jsx'

export default function RepetitionPage({ store }) {
  const { state, addRepetitionCard, reviewCard, deleteRepetitionCard } = store
  const cards = state.repetition || []
  const today = new Date()

  const due       = getDueCards(cards, today)
  const upcoming  = cards.filter(c => !c.completed && !due.find(d => d.id === c.id))
  const completed = cards.filter(c => c.completed)

  const [showAdd, setShowAdd]   = useState(false)
  const [title, setTitle]       = useState('')
  const [note, setNote]         = useState('')
  const [justDone, setJustDone] = useState(null) // for congrats animation

  const handleAdd = () => {
    if (!title.trim()) return
    addRepetitionCard(title.trim(), note.trim())
    setTitle(''); setNote('')
    setShowAdd(false)
    toast('📚 Topic added! First review tomorrow.')
  }

  const handleReview = (card) => {
    reviewCard(card.id)
    const newCount = (card.revisionCount || 0) + 1
    if (newCount >= REVISION_INTERVALS.length) {
      setJustDone(card)
      setTimeout(() => {
        deleteRepetitionCard(card.id)
        setJustDone(null)
      }, 3000)
    } else {
      const nextDay = REVISION_INTERVALS[newCount]
      toast(`✅ Done! Next review in ${nextDay} day${nextDay > 1 ? 's' : ''}`)
    }
  }

  const progressLabel = (card) => {
    const count = card.revisionCount || 0
    return `${count}/${REVISION_INTERVALS.length} revisions`
  }

  const nextDayLabel = (card) => {
    const count = card.revisionCount || 0
    if (count >= REVISION_INTERVALS.length) return 'Completed!'
    const day = REVISION_INTERVALS[count]
    return `Due in ${day} day${day > 1 ? 's' : ''}`
  }

  return (
    <div className="flex flex-col min-h-screen bg-base">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 glass border-b border-theme px-4 pt-safe">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="font-display text-2xl font-black text-main">Spaced Revision</h1>
            <p className="text-xs text-muted">
              {due.length > 0 ? `${due.length} due today` : 'All caught up!'} · {cards.length} topics
            </p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary px-4 py-2 text-sm" aria-label="Add topic">
            + Add Topic
          </button>
        </div>

        {/* Schedule legend */}
        <div className="flex gap-1.5 pb-3 overflow-x-auto no-scrollbar">
          {REVISION_INTERVALS.map((d, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
              style={{ background: '#7c6aff15', border: '1px solid #7c6aff33' }}>
              <span className="text-[10px] font-mono text-accent font-bold">Day {d}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
            style={{ background: '#b8ff6a15', border: '1px solid #b8ff6a33' }}>
            <span className="text-[10px] font-mono text-lime font-bold">🎉 Done</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">

        {/* Congrats overlay */}
        {justDone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="text-center px-8 animate-slide-up">
              <div className="text-7xl mb-4">🎉</div>
              <h2 className="font-display text-3xl font-black text-white mb-2">Mastered!</h2>
              <p className="text-lg text-white/80">"{justDone.title}"</p>
              <p className="text-sm text-white/50 mt-2">Completed all 5 revisions!</p>
            </div>
          </div>
        )}

        {/* Due today */}
        {due.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-ember animate-pulse" />
              <h2 className="text-xs text-muted font-mono uppercase tracking-widest font-bold">Due Today ({due.length})</h2>
            </div>
            <div className="flex flex-col gap-2">
              {due.map(card => (
                <div key={card.id} className="card-bg rounded-2xl px-4 py-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-main truncate">{card.title}</p>
                    {card.note && <p className="text-xs text-muted truncate mt-0.5">{card.note}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {/* Progress dots */}
                      <div className="flex gap-1">
                        {REVISION_INTERVALS.map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full transition-all"
                            style={{ background: i < card.revisionCount ? '#7c6aff' : 'var(--border)' }} />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted font-mono">{progressLabel(card)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => handleReview(card)}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                      style={{ background: '#7c6aff', boxShadow: '0 0 12px #7c6aff44' }}
                      aria-label="Mark as revised">
                      ✓ Revised
                    </button>
                    <button onClick={() => deleteRepetitionCard(card.id)}
                      className="px-4 py-1.5 rounded-xl text-xs text-muted border border-theme hover:text-ember transition-all"
                      aria-label="Remove topic">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All caught up */}
        {due.length === 0 && cards.length > 0 && (
          <div className="text-center py-10 mb-6">
            <div className="text-5xl mb-3">✨</div>
            <p className="font-display text-lg font-bold text-main">All caught up!</p>
            <p className="text-sm text-muted mt-1">No reviews due today</p>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs text-muted font-mono uppercase tracking-widest mb-3">📅 Upcoming</h2>
            <div className="flex flex-col gap-2">
              {upcoming.map(card => (
                <div key={card.id} className="card-bg rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-main truncate">{card.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex gap-1">
                        {REVISION_INTERVALS.map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full"
                            style={{ background: i < card.revisionCount ? '#7c6aff' : 'var(--border)' }} />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted font-mono">
                        {card.nextReview} · {nextDayLabel(card)}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteRepetitionCard(card.id)}
                    className="text-muted hover:text-ember transition-colors p-1" aria-label="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty */}
        {cards.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="text-6xl mb-4">🧠</div>
            <p className="font-display text-xl font-black text-main mb-2">Start revising smarter</p>
            <p className="text-sm text-muted mb-1">Add a topic you studied today</p>
            <p className="text-xs text-muted opacity-60 mt-2">
              Reviews: Day 1 → 3 → 6 → 9 → 14 → ✓ Mastered
            </p>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <Modal title="Add Topic" onClose={() => setShowAdd(false)}>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="What did you study? (e.g. JS Closures)" className="input-field w-full mb-3" autoFocus
            onKeyDown={e => e.key === 'Enter' && note === '' && title.trim() && handleAdd()}
            aria-label="Topic title" />
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Notes (optional)..." rows={3} className="input-field w-full resize-none mb-4"
            aria-label="Notes" />
          <div className="card-bg rounded-xl px-3 py-2.5 mb-4">
            <p className="text-xs text-muted mb-2 font-mono">Review schedule after today:</p>
            <div className="flex gap-2">
              {REVISION_INTERVALS.map((d, i) => (
                <div key={i} className="flex-1 text-center py-1.5 rounded-lg"
                  style={{ background: '#7c6aff15', border: '1px solid #7c6aff33' }}>
                  <p className="text-[10px] text-muted">R{i+1}</p>
                  <p className="text-xs font-bold text-accent">+{d}d</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 btn-secondary">Cancel</button>
            <button onClick={handleAdd} disabled={!title.trim()} className="flex-1 btn-primary">Add Topic</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
