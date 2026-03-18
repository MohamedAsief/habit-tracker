import { useState } from 'react'
import { toDateStr, computeHabitStreak } from '../utils/dates.js'
import { BUILTIN_CATEGORIES } from '../utils/schema.js'

function HeatmapCell({ count }) {
  const intensity = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : 3
  const colors = ['var(--border)', '#7c6aff44', '#7c6aff88', '#7c6aff']
  return (
    <div className="w-3 h-3 rounded-sm transition-all"
      style={{ background: colors[intensity] }}
      title={`${count} completions`} />
  )
}

export default function AnalyticsPage({ store }) {
  const { state } = store
  const { lists, logs, journal, customCategories = [] } = state
  const [selList, setSelList] = useState(state.settings.activeListId)
  const allCats = [...BUILTIN_CATEGORIES, ...customCategories]

  const today = new Date()
  const selListObj = lists.find(l => l.id === selList) || lists[0]
  const listLogs = logs[selList] || {}

  // Heatmap — last 52 weeks (364 days)
  const heatmapDays = []
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const ds = toDateStr(d)
    const count = Object.values(listLogs[ds] || {}).filter(v => v === 'done').length
    heatmapDays.push({ date: ds, count, day: d.getDay() })
  }

  // Pad start
  const startPad = heatmapDays[0]?.day || 0
  const padded = [...Array(startPad).fill(null), ...heatmapDays]

  // Streak history — last 30 days
  const streakHistory = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const ds = toDateStr(d)
    const done = Object.values(listLogs[ds] || {}).filter(v => v === 'done').length
    const total = selListObj?.habits.length || 0
    streakHistory.push({ ds, done, total, pct: total > 0 ? (done / total) * 100 : 0 })
  }
  const maxDone = Math.max(...streakHistory.map(d => d.done), 1)

  // Journal pie — last 7 days
  const catTotals = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const ds = toDateStr(d)
    for (const { category } of Object.values(journal[ds] || {})) {
      catTotals[category] = (catTotals[category] || 0) + 0.5
    }
  }
  const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const totalJHrs = Object.values(catTotals).reduce((a, b) => a + b, 0)

  // Per-habit streaks
  const habitStreaks = (selListObj?.habits || []).map(h => ({
    ...h,
    streak: computeHabitStreak(h.id, listLogs, today)
  })).sort((a, b) => b.streak - a.streak)

  return (
    <div className="flex flex-col min-h-screen bg-base">
      <div className="sticky top-0 z-20 glass border-b border-theme px-4 pt-safe py-3">
        <h1 className="font-display text-xl font-black text-main">Analytics</h1>
        <p className="text-xs text-muted">Deep dive into your progress</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* List selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {lists.map(l => (
            <button key={l.id} onClick={() => setSelList(l.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold shrink-0 transition-all ${l.id === selList ? 'bg-accent text-white' : 'border border-theme text-muted'}`}>
              {l.name}
            </button>
          ))}
        </div>

        {/* Heatmap */}
        <div className="card-bg rounded-2xl p-4 mb-4">
          <p className="text-xs text-muted font-mono uppercase tracking-widest mb-3">📊 Activity Heatmap (1 year)</p>
          <div className="overflow-x-auto">
            <div className="grid gap-0.5" style={{ gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', width: 'max-content' }}>
              {padded.map((d, i) =>
                d ? <HeatmapCell key={i} count={d.count} /> : <div key={i} className="w-3 h-3" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 justify-end">
            <span className="text-[10px] text-muted">Less</span>
            {['var(--border)', '#7c6aff44', '#7c6aff88', '#7c6aff'].map((c, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
            ))}
            <span className="text-[10px] text-muted">More</span>
          </div>
        </div>

        {/* Streak history bar chart */}
        <div className="card-bg rounded-2xl p-4 mb-4">
          <p className="text-xs text-muted font-mono uppercase tracking-widest mb-4">📈 30-Day Completion</p>
          <div className="flex items-end gap-0.5 h-20">
            {streakHistory.map((d, i) => {
              const isToday = d.ds === toDateStr(today)
              const h = d.done > 0 ? Math.max((d.done / maxDone) * 100, 8) : 0
              return (
                <div key={i} className="flex-1 flex items-end justify-center" style={{ height: '80px' }}>
                  <div className="w-full rounded-t transition-all duration-500"
                    style={{ height: `${h}%`, background: isToday ? '#7c6aff' : '#7c6aff66', minHeight: h > 0 ? '3px' : '0' }} />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-muted font-mono">30d ago</span>
            <span className="text-[9px] text-muted font-mono">Today</span>
          </div>
        </div>

        {/* Per-habit streaks */}
        {habitStreaks.length > 0 && (
          <div className="card-bg rounded-2xl p-4 mb-4">
            <p className="text-xs text-muted font-mono uppercase tracking-widest mb-3">🔥 Habit Streaks</p>
            {habitStreaks.map(h => (
              <div key={h.id} className="flex items-center gap-3 mb-2.5">
                <span className="text-lg">{h.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-main truncate">{h.name}</span>
                    <span className="font-mono text-xs ml-2 shrink-0" style={{ color: h.color }}>🔥{h.streak}</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min((h.streak / 30) * 100, 100)}%`, background: h.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Journal pie */}
        {topCats.length > 0 && (
          <div className="card-bg rounded-2xl p-4 mb-4">
            <p className="text-xs text-muted font-mono uppercase tracking-widest mb-4">⏰ Journal — Last 7 Days</p>
            {topCats.map(([id, hrs]) => {
              const cat = allCats.find(c => c.id === id)
              const pct = totalJHrs > 0 ? (hrs / totalJHrs) * 100 : 0
              return cat ? (
                <div key={id} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                      <span className="text-main">{cat.name}</span>
                    </div>
                    <span className="font-mono text-muted">{hrs}h ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                </div>
              ) : null
            })}
          </div>
        )}
      </div>
    </div>
  )
}
