import { useState, useRef, useEffect, useCallback } from 'react'
import { getWeekDays, toDateStr, formatMonthYear } from '../utils/dates.js'
import WeekRow from '../components/WeekRow.jsx'
import HabitRow from '../components/HabitRow.jsx'
import AddHabitModal from '../components/AddHabitModal.jsx'
import Modal from '../components/Modal.jsx'
import { toast } from '../components/Toast.jsx'

function ListTab({ list, active, onClick, onRename, onDelete, onDuplicate }) {
  const [menu, setMenu] = useState(false)
  const ref = useRef()
  useEffect(() => {
    if (!menu) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false) }
    document.addEventListener('mousedown', h)
    document.addEventListener('touchstart', h)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h) }
  }, [menu])

  return (
    <div className="relative flex items-center shrink-0" ref={ref}>
      <button onClick={onClick}
        className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${active ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-main'}`}>
        {list.name}
      </button>
      <button onClick={() => setMenu(v => !v)} className="p-1 text-muted hover:text-main rounded transition-all">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
      </button>
      {menu && (
        <div className="absolute left-0 top-10 z-30 card-bg border border-theme rounded-xl shadow-xl py-1 min-w-[130px]">
          <button className="menu-item" onClick={() => { onRename(); setMenu(false) }}>✏️ Rename</button>
          <button className="menu-item" onClick={() => { onDuplicate(); setMenu(false) }}>📋 Duplicate</button>
          <button className="menu-item text-ember" onClick={() => { onDelete(); setMenu(false) }}>🗑️ Delete</button>
        </div>
      )}
    </div>
  )
}

export default function HomePage({ store }) {
  const { state, addList, renameList, deleteList, duplicateList, setActiveList,
          addHabit, updateHabit, deleteHabit, reorderHabits, toggleCell, getCellState } = store
  const { lists, logs, settings } = state
  const activeListId = settings.activeListId
  const activeList   = lists.find(l => l.id === activeListId) || lists[0]

  const [showAdd, setShowAdd]           = useState(false)
  const [editHabit, setEditHabit]       = useState(null)
  const [newListModal, setNewListModal] = useState(false)
  const [newListName, setNewListName]   = useState('')
  const [renameListId, setRenameListId] = useState(null)
  const [renameVal, setRenameVal]       = useState('')
  const [deleteListId, setDeleteListId] = useState(null)
  const [weekOffset, setWeekOffset]     = useState(0)
  const [dragIdx, setDragIdx]           = useState(null)

  // Swipe detection
  const touchStartX = useRef(null)
  const containerRef = useRef()

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 60) {
      setWeekOffset(o => dx < 0 ? o + 1 : o - 1)
    }
    touchStartX.current = null
  }, [])

  const today    = new Date()
  const refDate  = new Date(today); refDate.setDate(today.getDate() + weekOffset * 7)
  const weekDays = getWeekDays(refDate)
  const listLogs = logs[activeListId] || {}
  const habits   = activeList?.habits || []
  const todayStr = toDateStr(today)
  const todayDone = habits.filter(h => getCellState(activeListId, h.id, todayStr) === 'done').length

  const handleDragOver = (e, i) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) return
    const newH = [...habits]; const [m] = newH.splice(dragIdx, 1); newH.splice(i, 0, m)
    reorderHabits(activeListId, newH); setDragIdx(i)
  }

  const handleDeleteHabit = (h) => {
    deleteHabit(activeListId, h.id)
    toast(`Deleted "${h.name}"`, { label: 'Undo', fn: () => addHabit(activeListId, h.name, h.emoji, h.color) })
  }

  return (
    <div className="flex flex-col min-h-screen bg-base"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}>

      {/* Sticky header */}
      <div className="sticky top-0 z-20 glass border-b border-theme">
        {/* Month + week nav */}
        <div className="flex items-center justify-between px-4 pt-5 pb-2">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface text-muted hover:text-main transition-all"
            aria-label="Previous week">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="text-center">
            <h1 className="font-display text-2xl font-black text-main leading-tight">
              {formatMonthYear(weekDays[3])}
            </h1>
            <p className="text-xs text-muted font-mono mt-0.5">
              {weekOffset === 0 ? '📅 This week' : weekOffset === -1 ? '⬅ Last week' : weekOffset === 1 ? '➡ Next week' : `${Math.abs(weekOffset)}w ${weekOffset < 0 ? 'ago' : 'ahead'}`}
            </p>
          </div>
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface text-muted hover:text-main transition-all"
            aria-label="Next week">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* List tabs */}
        <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto no-scrollbar">
          {lists.map(l => (
            <ListTab key={l.id} list={l} active={l.id === activeListId}
              onClick={() => setActiveList(l.id)}
              onRename={() => { setRenameListId(l.id); setRenameVal(l.name) }}
              onDelete={() => setDeleteListId(l.id)}
              onDuplicate={() => { duplicateList(l.id); toast(`Duplicated "${l.name}"`) }} />
          ))}
          <button onClick={() => setNewListModal(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs text-muted border border-dashed border-theme ml-1 shrink-0 hover:border-accent hover:text-accent transition-all">
            + List
          </button>
        </div>

        {/* Progress bar */}
        {habits.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-muted font-mono uppercase tracking-widest">Today's progress</span>
              <span className="text-[10px] text-accent font-mono font-bold">{todayDone}/{habits.length}</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="progress-bar h-full" style={{ width: `${habits.length ? (todayDone/habits.length)*100 : 0}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Week row */}
      <div className="pt-3">
        <WeekRow weekDays={weekDays} today={today} />
      </div>

      {/* Habit grid */}
      <div className="flex-1 overflow-y-auto pb-4">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <span className="text-6xl mb-4">◎</span>
            <p className="font-display text-xl font-bold text-main mb-1">No habits yet</p>
            <p className="text-sm text-muted">Tap + to add your first habit</p>
          </div>
        ) : habits.map((h, i) => (
          <div key={h.id} draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={e => handleDragOver(e, i)}
            onDragEnd={() => setDragIdx(null)}
            className={`transition-all duration-150 ${dragIdx === i ? 'opacity-40 scale-95' : ''}`}>
            <HabitRow habit={h} weekDays={weekDays} today={today}
              listId={activeListId} listLogs={listLogs}
              getCellState={getCellState} toggleCell={toggleCell}
              onEdit={() => setEditHabit(h)}
              onDelete={() => handleDeleteHabit(h)} />
          </div>
        ))}
        {habits.length > 0 && <p className="text-center text-[10px] text-muted opacity-30 py-2 font-mono">Drag to reorder · Swipe to change week</p>}
      </div>

      {/* FAB */}
      <button onClick={() => setShowAdd(true)}
        className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 w-14 h-14 rounded-full bg-accent glow-btn flex items-center justify-center"
        aria-label="Add habit">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
      </button>

      {/* Modals */}
      {showAdd && <AddHabitModal onAdd={({ name, emoji, color }) => addHabit(activeListId, name, emoji, color)} onClose={() => setShowAdd(false)} />}
      {editHabit && <AddHabitModal editHabit={editHabit} onAdd={({ name, emoji, color }) => updateHabit(activeListId, editHabit.id, { name, emoji, color })} onClose={() => setEditHabit(null)} />}

      {newListModal && (
        <Modal title="New List" onClose={() => setNewListModal(false)} size="sm">
          <input value={newListName} onChange={e => setNewListName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && newListName.trim() && (addList(newListName.trim()), setNewListModal(false), setNewListName(''))}
            placeholder="List name..." className="input-field mb-4 w-full" autoFocus />
          <div className="flex gap-3">
            <button onClick={() => setNewListModal(false)} className="flex-1 btn-secondary">Cancel</button>
            <button onClick={() => { addList(newListName.trim()); setNewListModal(false); setNewListName('') }}
              disabled={!newListName.trim()} className="flex-1 btn-primary">Create</button>
          </div>
        </Modal>
      )}
      {renameListId && (
        <Modal title="Rename List" onClose={() => setRenameListId(null)} size="sm">
          <input value={renameVal} onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && renameVal.trim() && (renameList(renameListId, renameVal.trim()), setRenameListId(null))}
            className="input-field mb-4 w-full" autoFocus />
          <div className="flex gap-3">
            <button onClick={() => setRenameListId(null)} className="flex-1 btn-secondary">Cancel</button>
            <button onClick={() => { renameList(renameListId, renameVal.trim()); setRenameListId(null) }}
              disabled={!renameVal.trim()} className="flex-1 btn-primary">Rename</button>
          </div>
        </Modal>
      )}
      {deleteListId && (
        <Modal title="Delete List?" onClose={() => setDeleteListId(null)} size="sm">
          <p className="text-sm text-muted mb-5">This will permanently delete the list and all its data.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteListId(null)} className="flex-1 btn-secondary">Cancel</button>
            <button onClick={() => { deleteList(deleteListId); setDeleteListId(null); toast('List deleted') }}
              className="flex-1 btn-danger">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
