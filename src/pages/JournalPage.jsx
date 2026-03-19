import { useState, useRef, useCallback } from 'react'
import { toDateStr } from '../utils/dates.js'
import { BUILTIN_CATEGORIES, getAllSubCats, getCatColor, getCatName, getCatType } from '../utils/schema.js'
import Modal from '../components/Modal.jsx'

function pad(n) { return String(n).padStart(2,'0') }

function formatHour(h) {
  if (h === 0)  return '12 AM'
  if (h < 12)   return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

// HourBlock — default 1hr, expandable to 30min or 15min
function HourBlock({ hour, entries, onSelect, onMultiSelect, multiMode, selectedSlots, allCats }) {
  const [expanded, setExpanded] = useState(null) // null | 30 | 15

  const slots = expanded
    ? Array.from({ length: 60 / expanded }, (_, i) => {
        const m = i * expanded
        return `${pad(hour)}:${pad(m)}`
      })
    : [`${pad(hour)}:00`]

  const slotDuration = expanded ? expanded / 60 : 1 // hours

  const mainEntry = entries[`${pad(hour)}:00`]
  const mainColor = mainEntry ? getCatColor(mainEntry.category, allCats) : null
  const mainName  = mainEntry ? getCatName(mainEntry.category, allCats) : null

  return (
    <div className="mb-1">
      {/* Hour label + expand controls */}
      <div className="flex items-center gap-2 mb-0.5 px-1">
        <span className="text-[10px] text-muted font-mono w-12 shrink-0">{formatHour(hour)}</span>
        <div className="flex gap-1 ml-auto">
          {[null, 30, 15].map(g => (
            <button key={g} onClick={() => setExpanded(g === expanded ? null : g)}
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-all
                ${expanded === g ? 'bg-accent text-white' : 'border border-theme text-muted'}`}>
              {g ? `${g}m` : '1h'}
            </button>
          ))}
        </div>
      </div>

      {/* Slots */}
      <div className={`grid gap-1 ${slots.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {slots.map(slot => {
          const entry    = entries[slot]
          const color    = entry ? getCatColor(entry.category, allCats) : null
          const name     = entry ? getCatName(entry.category, allCats) : null
          const isSel    = selectedSlots.has(slot)
          const [,mm]    = slot.split(':')
          const subLabel = expanded ? `${mm}m` : ''

          return (
            <button key={slot}
              onClick={() => multiMode ? onMultiSelect(slot) : onSelect(slot, entry)}
              className={`flex items-center gap-2 px-3 rounded-xl border text-left transition-all active:scale-95
                ${isSel ? 'slot-selected' : ''}
                ${slots.length > 1 ? 'py-2' : 'py-3'}`}
              style={entry
                ? { background:`${color}22`, borderColor:`${color}55` }
                : { background:'var(--surface)', borderColor:'var(--border)' }}>
              {expanded && <span className="font-mono text-[9px] text-muted shrink-0">{slot.split(':')[1]}</span>}
              <div className="flex-1 min-w-0">
                {entry
                  ? <p className="text-xs font-bold truncate" style={{color}}>{name}</p>
                  : <p className="text-[10px] text-muted opacity-30">—</p>}
              </div>
              {isSel && <span className="text-xs font-bold" style={{color:'#7c6aff'}}>✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function JournalPage({ store }) {
  const { state, setJournalSlot, setJournalSlots, clearJournalSlot, addCustomCategory } = store
  const { journal, customCategories=[] } = state
  const allSubCats = getAllSubCats(customCategories)

  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [editSlot, setEditSlot]         = useState(null)
  const [editEntry, setEditEntry]       = useState(null)
  const [slotCat, setSlotCat]           = useState('')
  const [slotNote, setSlotNote]         = useState('')
  const [newCatModal, setNewCatModal]   = useState(false)
  const [newCatName, setNewCatName]     = useState('')
  const [newCatParent, setNewCatParent] = useState('productive')
  const [multiMode, setMultiMode]       = useState(false)
  const [selected, setSelected]         = useState(new Set())
  const [half, setHalf]                 = useState('am') // 'am' | 'pm'

  const dayJournal = journal[selectedDate] || {}

  const amHours = Array.from({length:12}, (_,i) => i)      // 0–11
  const pmHours = Array.from({length:12}, (_,i) => i + 12) // 12–23
  const displayHours = half === 'am' ? amHours : pmHours

  // Stats
  let productiveH = 0, rechargeH = 0, distractedH = 0, totalH = 0
  for (const [slot, data] of Object.entries(dayJournal)) {
    const [,mm] = slot.split(':').map(Number)
    const dur = mm === 0 ? 1 : mm === 30 ? 0.5 : 0.25
    const type = getCatType(data.category, customCategories)
    if (type === 'productive') productiveH += dur
    else if (type === 'recharge') rechargeH += dur
    else distractedH += dur
    totalH += dur
  }

  const handleSelect = (slot, entry) => {
    setEditSlot(slot)
    setEditEntry(entry)
    setSlotCat(entry?.category || '')
    setSlotNote(entry?.note || '')
  }

  const handleMultiSelect = (slot) => {
    setSelected(prev => { const n = new Set(prev); n.has(slot) ? n.delete(slot) : n.add(slot); return n })
  }

  // Long press to start multi
  const longTimer = useRef(null)
  const handleLongPress = (slot) => {
    longTimer.current = setTimeout(() => { setMultiMode(true); setSelected(new Set([slot])) }, 600)
  }
  const cancelLong = () => clearTimeout(longTimer.current)

  const saveSlot = () => {
    if (slotCat) setJournalSlot(selectedDate, editSlot, { category: slotCat, note: slotNote })
    else clearJournalSlot(selectedDate, editSlot)
    setEditSlot(null)
  }

  const applyMulti = (catId) => {
    setJournalSlots(selectedDate, [...selected], { category: catId, note: '' })
    setMultiMode(false); setSelected(new Set())
  }

  const exportCSV = () => {
    const rows=[['Date','Slot','Category','Type','Note']]
    for (const [slot,data] of Object.entries(dayJournal)) {
      const name = getCatName(data.category, customCategories)
      const type = getCatType(data.category, customCategories)
      rows.push([selectedDate,slot,name,type,(data.note||'').replace(/,/g,';')])
    }
    const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'})
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`journal-${selectedDate}.csv`;a.click()
  }

  return (
    <div className="flex flex-col min-h-screen bg-base">
      {/* Sticky top */}
      <div className="sticky top-0 z-20 glass border-b border-theme px-4 pt-safe">
        <div className="flex items-center justify-between py-3 pr-12">
          <h1 className="font-display text-2xl font-black text-main">Journal</h1>
          <div className="flex items-center gap-2">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="text-xs bg-surface border border-theme rounded-lg px-2 py-1.5 text-main" />
            <button onClick={exportCSV} className="p-2 text-muted hover:text-accent transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats — 3 types + total hours */}
        <div className="flex gap-2 pb-3">
          <div className="flex-1 rounded-xl px-2 py-2 text-center" style={{background:'#26de8115',border:'1px solid #26de8133'}}>
            <p className="text-[9px] font-mono uppercase" style={{color:'#26de81'}}>⚡ Productive</p>
            <p className="text-base font-black" style={{color:'#26de81'}}>{productiveH.toFixed(1)}h</p>
          </div>
          <div className="flex-1 rounded-xl px-2 py-2 text-center" style={{background:'#54a0ff15',border:'1px solid #54a0ff33'}}>
            <p className="text-[9px] font-mono uppercase" style={{color:'#54a0ff'}}>🔋 Recharge</p>
            <p className="text-base font-black" style={{color:'#54a0ff'}}>{rechargeH.toFixed(1)}h</p>
          </div>
          <div className="flex-1 rounded-xl px-2 py-2 text-center" style={{background:'#ff6b4a15',border:'1px solid #ff6b4a33'}}>
            <p className="text-[9px] font-mono uppercase" style={{color:'#ff6b4a'}}>📵 Distracted</p>
            <p className="text-base font-black" style={{color:'#ff6b4a'}}>{distractedH.toFixed(1)}h</p>
          </div>
          <div className="flex-1 rounded-xl px-2 py-2 text-center card-bg">
            <p className="text-[9px] text-muted font-mono uppercase">Logged</p>
            <p className="text-base font-black text-accent">{totalH.toFixed(1)}h</p>
          </div>
        </div>

        {/* AM / PM toggle */}
        <div className="flex gap-1 pb-3">
          {['am','pm'].map(h => (
            <button key={h} onClick={() => setHalf(h)}
              className={`flex-1 py-1.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all
                ${half === h ? 'bg-accent text-white' : 'border border-theme text-muted'}`}>
              {h === 'am' ? '🌙 12 AM' : '☀️ 12 PM'}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-select toolbar */}
      {multiMode && (
        <div className="sticky z-30 px-4 py-2.5 flex items-center gap-2 border-b border-theme"
          style={{background:'#7c6aff',top:0}}>
          <span className="text-white text-sm font-semibold flex-1">{selected.size} slot{selected.size!==1?'s':''} selected</span>
          <button onClick={() => { for(const s of selected) clearJournalSlot(selectedDate,s); setMultiMode(false); setSelected(new Set()) }}
            className="text-white/70 text-xs px-2 py-1 rounded-lg border border-white/30">Clear</button>
          <button onClick={() => { setMultiMode(false); setSelected(new Set()) }}
            className="text-white text-xs px-2 py-1 rounded-lg bg-white/20">Cancel</button>
        </div>
      )}

      {/* Multi category picker */}
      {multiMode && selected.size > 0 && (
        <div className="px-4 py-3 border-b border-theme" style={{background:'var(--surface)'}}>
          {BUILTIN_CATEGORIES.map(cat => (
            <div key={cat.id} className="mb-2">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{color:cat.color}}>
                {cat.emoji} {cat.name}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cat.subs.map(sub => (
                  <button key={sub.id} onClick={() => applyMulti(sub.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white active:scale-95"
                    style={{background:cat.color}}>
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hour blocks */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24">
        <p className="text-[10px] text-muted opacity-40 mb-3 font-mono text-center">
          Long press to multi-select · Tap 30m/15m to expand hour
        </p>
        {displayHours.map(hour => (
          <HourBlock key={hour} hour={hour} entries={dayJournal}
            onSelect={handleSelect}
            onMultiSelect={handleMultiSelect}
            multiMode={multiMode}
            selectedSlots={selected}
            allCats={customCategories} />
        ))}
      </div>

      {/* Edit slot modal */}
      {editSlot && (
        <Modal title={`${formatHour(parseInt(editSlot.split(':')[0]))} · ${editSlot}`} onClose={() => setEditSlot(null)}>
          {BUILTIN_CATEGORIES.map(cat => (
            <div key={cat.id} className="mb-4">
              <p className="text-xs font-mono uppercase tracking-widest mb-2 font-bold" style={{color:cat.color}}>
                {cat.emoji} {cat.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {cat.subs.map(sub => (
                  <button key={sub.id} onClick={() => setSlotCat(slotCat===sub.id?'':sub.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${slotCat===sub.id?'text-white':'text-muted border border-theme'}`}
                    style={slotCat===sub.id?{background:cat.color}:{}}>
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Custom categories */}
          {customCategories.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-mono uppercase tracking-widest mb-2 text-muted">Custom</p>
              <div className="flex flex-wrap gap-2">
                {customCategories.map(c => (
                  <button key={c.id} onClick={() => setSlotCat(slotCat===c.id?'':c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${slotCat===c.id?'text-white':'text-muted border border-theme'}`}
                    style={slotCat===c.id?{background:c.color}:{}}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setNewCatModal(true)}
            className="text-xs text-muted border border-dashed border-theme px-3 py-1.5 rounded-xl hover:border-accent hover:text-accent transition-all mb-4">
            + Custom category
          </button>

          <textarea value={slotNote} onChange={e => setSlotNote(e.target.value)}
            placeholder="Note (optional)..." rows={2} className="input-field w-full resize-none mb-4" />

          <div className="flex gap-3">
            <button onClick={() => { clearJournalSlot(selectedDate, editSlot); setEditSlot(null) }}
              className="btn-secondary text-ember text-sm px-3">Clear</button>
            <button onClick={saveSlot} className="flex-1 btn-primary">Save</button>
          </div>
        </Modal>
      )}

      {/* New custom category */}
      {newCatModal && (
        <Modal title="New Category" onClose={() => setNewCatModal(false)} size="sm">
          <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
            placeholder="Category name..." className="input-field w-full mb-4" autoFocus />
          <p className="text-xs text-muted mb-2 font-mono uppercase tracking-widest">Type</p>
          <div className="flex gap-2 mb-5">
            {BUILTIN_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setNewCatParent(cat.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${newCatParent===cat.id?'text-white':'border border-theme text-muted'}`}
                style={newCatParent===cat.id?{background:cat.color}:{}}>
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setNewCatModal(false)} className="flex-1 btn-secondary">Cancel</button>
            <button onClick={() => {
              const parent = BUILTIN_CATEGORIES.find(c => c.id === newCatParent)
              addCustomCategory(newCatName.trim(), parent?.type === 'productive', parent?.type === 'recharge', newCatParent, parent?.color)
              setNewCatModal(false); setNewCatName('')
            }} disabled={!newCatName.trim()} className="flex-1 btn-primary">Add</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
