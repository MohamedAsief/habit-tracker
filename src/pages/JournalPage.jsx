import { useState, useRef, useCallback } from 'react'
import { toDateStr, getHalfHourSlots } from '../utils/dates.js'
import { BUILTIN_CATEGORIES } from '../utils/schema.js'
import Modal from '../components/Modal.jsx'

function pad(n) { return String(n).padStart(2,'0') }
function slotLabel(slot) {
  const [h,m] = slot.split(':').map(Number)
  return `${slot}–${pad(m===30?h+1:h)}:${m===30?'00':'30'}`
}

export default function JournalPage({ store }) {
  const { state, setJournalSlot, setJournalSlots, clearJournalSlot, addCustomCategory } = store
  const { journal, customCategories=[] } = state

  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [editSlot, setEditSlot]         = useState(null)
  const [slotCat, setSlotCat]           = useState('')
  const [slotNote, setSlotNote]         = useState('')
  const [newCatModal, setNewCatModal]   = useState(false)
  const [newCatName, setNewCatName]     = useState('')
  const [newCatUseful, setNewCatUseful] = useState(true)
  const [multiMode, setMultiMode]       = useState(false)
  const [selected, setSelected]         = useState(new Set())

  const longPressTimer = useRef(null)
  const isDragging     = useRef(false)

  // Only BUILTIN_CATEGORIES (8 fixed) + custom
  const allCats  = [...BUILTIN_CATEGORIES, ...customCategories]
  const slots    = getHalfHourSlots()
  const dayJournal = journal[selectedDate] || {}

  const getCatColor = (id) => allCats.find(c=>c.id===id)?.color || '#8b8b9e'
  const getCatName  = (id) => allCats.find(c=>c.id===id)?.name || id

  const handlePressStart = useCallback((slot) => {
    isDragging.current = false
    longPressTimer.current = setTimeout(() => {
      if (!isDragging.current) {
        setMultiMode(true)
        setSelected(new Set([slot]))
      }
    }, 600)
  }, [])

  const handlePressMove = useCallback(() => {
    isDragging.current = true
    clearTimeout(longPressTimer.current)
  }, [])

  const handlePressEnd = useCallback(() => {
    clearTimeout(longPressTimer.current)
  }, [])

  const handleSlotClick = useCallback((slot) => {
    if (isDragging.current) return
    if (multiMode) {
      setSelected(prev => {
        const n = new Set(prev)
        n.has(slot) ? n.delete(slot) : n.add(slot)
        return n
      })
      return
    }
    const existing = dayJournal[slot]
    setSlotCat(existing?.category || '')
    setSlotNote(existing?.note || '')
    setEditSlot(slot)
  }, [multiMode, dayJournal])

  const applyMulti = (catId) => {
    setJournalSlots(selectedDate, [...selected], { category: catId, note: '' })
    setMultiMode(false); setSelected(new Set())
  }

  const clearMulti = () => {
    for (const slot of selected) clearJournalSlot(selectedDate, slot)
    setMultiMode(false); setSelected(new Set())
  }

  const saveSlot = () => {
    if (slotCat) setJournalSlot(selectedDate, editSlot, { category: slotCat, note: slotNote })
    else clearJournalSlot(selectedDate, editSlot)
    setEditSlot(null)
  }

  let usefulSlots=0, wastedSlots=0
  for (const {category} of Object.values(dayJournal)) {
    const cat = allCats.find(c=>c.id===category)
    if (cat) cat.useful ? usefulSlots++ : wastedSlots++
  }

  const exportCSV = () => {
    const rows=[['Date','Slot','Category','Useful','Note']]
    for (const [slot,data] of Object.entries(dayJournal)) {
      const cat=allCats.find(c=>c.id===data.category)
      rows.push([selectedDate,slot,cat?.name||'',cat?.useful?'yes':'no',(data.note||'').replace(/,/g,';')])
    }
    const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'})
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`journal-${selectedDate}.csv`;a.click()
  }

  return (
    <div className="flex flex-col min-h-screen bg-base">
      {/* Sticky top */}
      <div className="sticky top-0 z-20 glass border-b border-theme px-4 pt-safe">
        <div className="flex items-center justify-between py-3">
          <h1 className="font-display text-2xl font-black text-main">Journal</h1>
          <div className="flex items-center gap-2">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="text-xs bg-surface border border-theme rounded-lg px-2 py-1.5 text-main" />
            <button onClick={exportCSV} className="p-2 text-muted hover:text-accent transition-colors" aria-label="Export">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 pb-3">
          <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background:'#b8ff6a15', border:'1px solid #b8ff6a33' }}>
            <p className="text-[10px] text-muted font-mono uppercase">Useful</p>
            <p className="text-lg font-black text-lime">{(usefulSlots*0.5).toFixed(1)}h</p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background:'#ff6b4a15', border:'1px solid #ff6b4a33' }}>
            <p className="text-[10px] text-muted font-mono uppercase">Wasted</p>
            <p className="text-lg font-black text-ember">{(wastedSlots*0.5).toFixed(1)}h</p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2 text-center card-bg">
            <p className="text-[10px] text-muted font-mono uppercase">Logged</p>
            <p className="text-lg font-black text-accent">{Object.keys(dayJournal).length}</p>
          </div>
        </div>
      </div>

      {/* Multi-select toolbar */}
      {multiMode && (
        <div className="sticky z-30 px-4 py-2.5 flex items-center gap-2 border-b border-theme animate-slide-up"
          style={{ background:'#7c6aff', top:0 }}>
          <span className="text-white text-sm font-semibold flex-1">{selected.size} slot{selected.size!==1?'s':''} selected</span>
          <button onClick={clearMulti} className="text-white/70 text-xs px-2 py-1 rounded-lg border border-white/30 active:scale-95">Clear</button>
          <button onClick={() => { setMultiMode(false); setSelected(new Set()) }} className="text-white text-xs px-2 py-1 rounded-lg bg-white/20 active:scale-95">Cancel</button>
        </div>
      )}

      {/* Multi category picker */}
      {multiMode && selected.size > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-theme" style={{ background:'var(--surface)' }}>
          {allCats.map(cat => (
            <button key={cat.id} onClick={() => applyMulti(cat.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
              style={{ background: cat.color }}>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Slots */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24">
        <p className="text-xs text-muted opacity-40 mb-3 font-mono text-center">Long press to select multiple slots</p>
        <div className="grid grid-cols-2 gap-1.5">
          {slots.map(slot => {
            const entry    = dayJournal[slot]
            const catColor = entry ? getCatColor(entry.category) : null
            const isSel    = selected.has(slot)

            return (
              <button key={slot}
                onMouseDown={() => handlePressStart(slot)}
                onMouseMove={handlePressMove}
                onMouseUp={() => { handlePressEnd(); if (!isDragging.current) handleSlotClick(slot) }}
                onMouseLeave={handlePressEnd}
                onTouchStart={() => handlePressStart(slot)}
                onTouchMove={handlePressMove}
                onTouchEnd={() => { handlePressEnd(); if (!isDragging.current) handleSlotClick(slot) }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-95 ${isSel ? 'slot-selected' : ''}`}
                style={entry
                  ? { background:`${catColor}22`, borderColor:`${catColor}55` }
                  : { background:'var(--surface)', borderColor:'var(--border)' }}>
                <span className="font-mono text-[9px] text-muted shrink-0 w-8">{slot}</span>
                <div className="flex-1 min-w-0">
                  {entry ? (
                    <>
                      <p className="text-xs font-bold truncate" style={{ color:catColor }}>{getCatName(entry.category)}</p>
                      {entry.note && <p className="text-[10px] text-muted truncate">{entry.note}</p>}
                    </>
                  ) : <p className="text-[10px] text-muted opacity-30">—</p>}
                </div>
                {isSel && <span style={{ color:'#7c6aff' }} className="text-sm shrink-0 font-bold">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Edit slot modal */}
      {editSlot && (
        <Modal title={slotLabel(editSlot)} onClose={() => setEditSlot(null)} size="sm">
          <p className="text-xs text-muted mb-2 font-mono uppercase tracking-widest">Category</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {allCats.map(cat => (
              <button key={cat.id} onClick={() => setSlotCat(slotCat===cat.id ? '' : cat.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${slotCat===cat.id ? 'text-white' : 'text-muted border border-theme'}`}
                style={slotCat===cat.id ? { background:cat.color } : {}}>
                {cat.name}
              </button>
            ))}
            <button onClick={() => setNewCatModal(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs text-muted border border-dashed border-theme hover:border-accent hover:text-accent transition-all">
              + Custom
            </button>
          </div>
          <textarea value={slotNote} onChange={e => setSlotNote(e.target.value)}
            placeholder="Note..." rows={2} className="input-field w-full resize-none mb-4" />
          <div className="flex gap-3">
            <button onClick={() => { clearJournalSlot(selectedDate, editSlot); setEditSlot(null) }}
              className="btn-secondary text-ember text-sm px-3">Clear</button>
            <button onClick={saveSlot} className="flex-1 btn-primary">Save</button>
          </div>
        </Modal>
      )}

      {newCatModal && (
        <Modal title="New Category" onClose={() => setNewCatModal(false)} size="sm">
          <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
            placeholder="Category name..." className="input-field w-full mb-4" autoFocus />
          <label className="flex items-center gap-3 mb-5 cursor-pointer">
            <input type="checkbox" checked={newCatUseful} onChange={e => setNewCatUseful(e.target.checked)} className="w-4 h-4 accent-accent" />
            <span className="text-sm text-main">Count as useful time</span>
          </label>
          <div className="flex gap-3">
            <button onClick={() => setNewCatModal(false)} className="flex-1 btn-secondary">Cancel</button>
            <button onClick={() => { addCustomCategory(newCatName.trim(), newCatUseful); setNewCatModal(false); setNewCatName('') }}
              disabled={!newCatName.trim()} className="flex-1 btn-primary">Add</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
