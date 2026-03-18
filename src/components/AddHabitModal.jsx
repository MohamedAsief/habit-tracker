import { useState, useRef, useEffect } from 'react'
import Modal from './Modal.jsx'

const EMOJIS = ['⭐','🔥','💪','📚','🧘','🏃','💧','🎯','🌱','🎨','🎵','💤','🥗','🧠','✍️','🚴']
const COLORS = ['#7c6aff','#b8ff6a','#ff6b4a','#54a0ff','#ff9ff3','#ffa502','#00d2d3','#5f27cd','#ff6b81','#26de81']

export default function AddHabitModal({ onAdd, onClose, editHabit = null }) {
  const [name, setName] = useState(editHabit?.name || '')
  const [emoji, setEmoji] = useState(editHabit?.emoji || '⭐')
  const [color, setColor] = useState(editHabit?.color || '#7c6aff')
  const inputRef = useRef()
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])

  const handle = () => {
    if (!name.trim()) return
    onAdd({ name: name.trim(), emoji, color })
    onClose()
  }

  return (
    <Modal title={editHabit ? 'Edit Habit' : 'New Habit'} onClose={onClose}>
      <input ref={inputRef} value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handle()}
        maxLength={40} placeholder="Habit name..."
        className="w-full input-field mb-4" aria-label="Habit name" />

      <p className="text-xs text-muted mb-2 font-mono uppercase tracking-widest">Emoji</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {EMOJIS.map(e => (
          <button key={e} onClick={() => setEmoji(e)}
            className={`w-9 h-9 rounded-xl text-lg transition-all ${emoji === e ? 'ring-2 ring-accent scale-110 bg-accent/20' : 'bg-surface border border-theme'}`}
            aria-label={`Select emoji ${e}`}>{e}</button>
        ))}
      </div>

      <p className="text-xs text-muted mb-2 font-mono uppercase tracking-widest">Color</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
            style={{ background: c }} aria-label={`Select color ${c}`} />
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
        <button onClick={handle} disabled={!name.trim()} className="flex-1 btn-primary">
          {editHabit ? 'Save' : 'Add Habit'}
        </button>
      </div>
    </Modal>
  )
}
