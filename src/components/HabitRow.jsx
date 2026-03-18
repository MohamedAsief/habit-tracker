import { useState, useEffect, useRef } from 'react'
import { toDateStr, computeHabitStreak } from '../utils/dates.js'

function Cell({ state, isToday, isFuture, onClick, color }) {
  const [pop, setPop] = useState(false)
  const handle = () => {
    if (isFuture) return
    setPop(true); setTimeout(() => setPop(false), 220)
    onClick()
  }
  const bg = state === 'done'
    ? `linear-gradient(135deg,${color}44,${color}66)`
    : state === 'missed' ? 'linear-gradient(135deg,#ff6b4a22,#ff6b4a44)' : 'transparent'
  const border = state === 'done' ? `${color}99` : state === 'missed' ? '#ff6b4a77' : 'var(--border)'

  return (
    <button onClick={handle} disabled={isFuture}
      className={`flex-1 rounded-xl border-2 flex items-center justify-center transition-all duration-150 select-none
        ${isToday ? 'ring-2 ring-accent ring-offset-1 ring-offset-transparent' : ''}
        ${isFuture ? 'opacity-20 cursor-default' : 'cursor-pointer active:scale-75'}
        ${pop ? 'scale-75' : 'scale-100'}`}
      style={{ background: bg, borderColor: border, height: '42px' }}>
      {state === 'done'   && <span style={{ color, fontSize: 18, fontWeight: 'bold' }}>✓</span>}
      {state === 'missed' && <span style={{ color: '#ff6b4a', fontSize: 15, fontWeight: 'bold' }}>✕</span>}
    </button>
  )
}

export default function HabitRow({ habit, weekDays, today, listId, listLogs, getCellState, toggleCell, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef()
  const todayStr = toDateStr(today)
  const streak = computeHabitStreak(habit.id, listLogs || {}, today)
  const weekDone = weekDays.filter(d => getCellState(listId, habit.id, toDateStr(d)) === 'done').length

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler) }
  }, [menuOpen])

  return (
    <div className="flex items-center px-3 py-2 gap-2 group">
      {/* Name + meta */}
      <div style={{ width: '30%', minWidth: 95, flexShrink: 0 }} className="flex items-center gap-1 min-w-0">
        <span className="text-xl shrink-0">{habit.emoji}</span>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold text-main truncate leading-tight">{habit.name}</span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] text-muted">{weekDone}/7</span>
            {streak > 0 && (
              <span className="font-mono text-[10px] px-1 rounded-md" style={{ background: `${habit.color}22`, color: habit.color }}>
                🔥{streak}
              </span>
            )}
          </div>
        </div>

        {/* 3-dot menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button onClick={() => setMenuOpen(v => !v)}
            className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-surface transition-all"
            aria-label="Options" aria-haspopup="true" aria-expanded={menuOpen}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-8 z-30 card-bg rounded-xl shadow-xl py-1 min-w-[120px] border border-theme">
              <button className="menu-item" onClick={() => { onEdit(); setMenuOpen(false) }}>✏️ Edit</button>
              <button className="menu-item text-ember" onClick={() => { onDelete(); setMenuOpen(false) }}>🗑️ Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Day cells */}
      <div className="flex flex-1 gap-1.5">
        {weekDays.map(day => {
          const str = toDateStr(day)
          return (
            <Cell key={str}
              state={getCellState(listId, habit.id, str)}
              isToday={str === todayStr}
              isFuture={day > today}
              color={habit.color}
              onClick={() => toggleCell(listId, habit.id, str)} />
          )
        })}
      </div>
    </div>
  )
}
