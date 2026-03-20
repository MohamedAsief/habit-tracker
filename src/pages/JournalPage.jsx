import { useState, useRef, useCallback } from 'react'
import { toDateStr } from '../utils/dates.js'
import { BUILTIN_CATEGORIES } from '../utils/schema.js'
import Modal from '../components/Modal.jsx'

function formatHour12(h) {
  if (h === 0)  return '12 AM'
  if (h < 12)   return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function pad(n) { return String(n).padStart(2,'0') }

function getParentCat(catId, customCategories) {
  for (const cat of BUILTIN_CATEGORIES) {
    if (cat.subs.find(s => s.id === catId)) return cat
  }
  const custom = customCategories.find(c => c.id === catId)
  if (custom) return BUILTIN_CATEGORIES.find(c => c.id === custom.parentId) || BUILTIN_CATEGORIES[2]
  return null
}

function getCatColor(catId, customCategories) {
  return getParentCat(catId, customCategories)?.color || '#8b8b9e'
}

function getCatName(catId, customCategories) {
  for (const cat of BUILTIN_CATEGORIES)
    for (const sub of cat.subs)
      if (sub.id === catId) return sub.name
  return customCategories.find(c => c.id === catId)?.name || catId
}

function getCatType(catId, customCategories) {
  const parent = getParentCat(catId, customCategories)
  return parent?.id || 'distracted'
}

function slotDuration(slot) {
  const [,m] = slot.split(':').map(Number)
  if (m === 0) return 1
  if (m === 30) return 0.5
  return 0.25
}

function HourBlock({ hour, dayJournal, onSelect, multiMode, selectedSlots, onMultiSelect, customCategories }) {
  const [granularity, setGranularity] = useState(60) // 60=1hr, 30=30min, 15=15min

  const slots = []
  for (let m = 0; m < 60; m += granularity) slots.push(`${pad(hour)}:${pad(m)}`)

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-1 mb-1">
        <span className="text-xs text-muted font-semibold w-14 shrink-0">{formatHour12(hour)}</span>
        <div className="flex gap-1 ml-auto">
          {[60,30,15].map(g => (
            <button key={g} onClick={() => setGranularity(g)}
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-all
                ${granularity===g ? 'bg-accent text-white' : 'border border-theme text-muted'}`}>
              {g===60?'1h':g===30?'30m':'15m'}
            </button>
          ))}
        </div>
      </div>
      <div className={`grid gap-1 ${slots.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {slots.map(slot => {
          const entry = dayJournal[slot]
          const color = entry ? getCatColor(entry.category, customCategories) : null
          const name  = entry ? getCatName(entry.category, customCategories) : null
          const isSel = selectedSlots.has(slot)
          return (
            <button key={slot}
              onClick={() => multiMode ? onMultiSelect(slot) : onSelect(slot, entry)}
              className={`flex items-center gap-2 px-3 rounded-xl border text-left transition-all active:scale-95
                ${slots.length>1 ? 'py-2' : 'py-3.5'}
                ${isSel ? 'ring-2 ring-accent' : ''}`}
              style={entry
                ? { background:`${color}22`, borderColor:`${color}55` }
                : { background:'var(--surface)', borderColor:'var(--border)' }}>
              {slots.length > 1 && (
                <span className="font-mono text-[9px] text-muted shrink-0 w-6">{slot.split(':')[1]}</span>
              )}
              <div className="flex-1 min-w-0">
                {entry
                  ? <p className="text-sm font-bold truncate" style={{color}}>{name}</p>
                  : <p className="text-xs text-muted opacity-30">—</p>}
              </div>
              {isSel && <span className="text-xs font-bold text-accent">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function JournalPage({ store }) {
  const { state, setJournalSlot, setJournalSlots, clearJournalSlot, addCustomCategory, deleteCustomCategory } = store
  const { journal, customCategories=[] } = state

  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [editSlot, setEditSlot]         = useState(null)
  const [slotCat, setSlotCat]           = useState('')
  const [slotNote, setSlotNote]         = useState('')
  const [multiMode, setMultiMode]       = useState(false)
  const [selected, setSelected]         = useState(new Set())
  const [half, setHalf]                 = useState('am')
  const [newCatModal, setNewCatModal]   = useState(false)
  const [newCatName, setNewCatName]     = useState('')
  const [newCatParent, setNewCatParent] = useState('productive')

  const dayJournal = journal[selectedDate] || {}
  const amHours = Array.from({length:12},(_,i)=>i)
  const pmHours = Array.from({length:12},(_,i)=>i+12)
  const displayHours = half==='am' ? amHours : pmHours

  // Swipe to switch AM/PM
  const touchStartX = useRef(null)
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) setHalf(dx < 0 ? 'pm' : 'am')
    touchStartX.current = null
  }

  // Long press for multi-select
  const longTimer = useRef(null)
  const startLong = (slot) => {
    longTimer.current = setTimeout(() => { setMultiMode(true); setSelected(new Set([slot])) }, 600)
  }
  const cancelLong = () => clearTimeout(longTimer.current)

  const handleSelect = (slot, entry) => {
    if (multiMode) { setSelected(prev => { const n=new Set(prev); n.has(slot)?n.delete(slot):n.add(slot); return n }); return }
    setEditSlot(slot); setSlotCat(entry?.category||''); setSlotNote(entry?.note||'')
  }

  const saveSlot = () => {
    if (slotCat) setJournalSlot(selectedDate, editSlot, { category: slotCat, note: slotNote })
    else clearJournalSlot(selectedDate, editSlot)
    setEditSlot(null)
  }

  const applyMulti = (catId) => {
    setJournalSlots(selectedDate, [...selected], { category: catId, note: '' })
    setMultiMode(false); setSelected(new Set())
  }

  // Stats
  let productiveH=0, rechargeH=0, distractedH=0
  for (const [slot, data] of Object.entries(dayJournal)) {
    const dur = slotDuration(slot)
    const type = getCatType(data.category, customCategories)
    if (type==='productive') productiveH+=dur
    else if (type==='recharge') rechargeH+=dur
    else distractedH+=dur
  }
  const totalH = productiveH+rechargeH+distractedH

  const exportCSV = () => {
    const rows=[['Date','Slot','Category','Type','Note']]
    for (const [slot,data] of Object.entries(dayJournal)) {
      rows.push([selectedDate,slot,getCatName(data.category,customCategories),getCatType(data.category,customCategories),(data.note||'').replace(/,/g,';')])
    }
    const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'})
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`journal-${selectedDate}.csv`;a.click()
  }

  // All sub-cats in order: productive → recharge → distracted → custom
  const allSlotCats = []
  for (const cat of BUILTIN_CATEGORIES)
    for (const sub of cat.subs)
      allSlotCats.push({ ...sub, color: cat.color, parentId: cat.id })
  for (const c of customCategories)
    allSlotCats.push({ ...c, color: BUILTIN_CATEGORIES.find(b=>b.id===c.parentId)?.color || '#a29bfe' })

  return (
    <div className="flex flex-col min-h-screen bg-base"
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

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

        {/* Stats */}
        <div className="flex gap-1.5 pb-3">
          <div className="flex-1 rounded-xl px-2 py-2 text-center" style={{background:'#26de8115',border:'1px solid #26de8133'}}>
            <p className="text-[9px] font-mono font-bold" style={{color:'#26de81'}}>⚡</p>
            <p className="text-sm font-black" style={{color:'#26de81'}}>{productiveH.toFixed(1)}h</p>
          </div>
          <div className="flex-1 rounded-xl px-2 py-2 text-center" style={{background:'#54a0ff15',border:'1px solid #54a0ff33'}}>
            <p className="text-[9px] font-mono font-bold" style={{color:'#54a0ff'}}>🔋</p>
            <p className="text-sm font-black" style={{color:'#54a0ff'}}>{rechargeH.toFixed(1)}h</p>
          </div>
          <div className="flex-1 rounded-xl px-2 py-2 text-center" style={{background:'#ff6b4a15',border:'1px solid #ff6b4a33'}}>
            <p className="text-[9px] font-mono font-bold" style={{color:'#ff6b4a'}}>📵</p>
            <p className="text-sm font-black" style={{color:'#ff6b4a'}}>{distractedH.toFixed(1)}h</p>
          </div>
          <div className="flex-1 rounded-xl px-2 py-2 text-center card-bg">
            <p className="text-[9px] text-muted font-mono">Total</p>
            <p className="text-sm font-black text-accent">{totalH.toFixed(1)}h</p>
          </div>
        </div>

        {/* AM/PM toggle */}
        <div className="flex gap-1.5 pb-3">
          <button onClick={() => setHalf('am')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${half==='am'?'bg-accent text-white':'border border-theme text-muted'}`}>
            🌙 12 AM
          </button>
          <button onClick={() => setHalf('pm')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${half==='pm'?'bg-accent text-white':'border border-theme text-muted'}`}>
            ☀️ 12 PM
          </button>
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

      {/* Multi category picker — just colored buttons, no labels */}
      {multiMode && selected.size > 0 && (
        <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-theme" style={{background:'var(--surface)'}}>
          {allSlotCats.map(cat => (
            <button key={cat.id} onClick={() => applyMulti(cat.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white active:scale-95"
              style={{background:cat.color}}>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Hour blocks */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24">
        <p className="text-[10px] text-muted opacity-40 mb-3 font-mono text-center">
          Long press → multi-select · Swipe ← → to switch AM/PM
        </p>
        {displayHours.map(hour => (
          <HourBlock key={hour} hour={hour} dayJournal={dayJournal}
            onSelect={handleSelect} multiMode={multiMode}
            selectedSlots={selected} onMultiSelect={handleSelect}
            customCategories={customCategories} />
        ))}
      </div>

      {/* Edit slot modal */}
      {editSlot && (
        <Modal title={`${formatHour12(parseInt(editSlot.split(':')[0]))} · ${editSlot.split(':')[1] !== '00' ? editSlot.split(':')[1]+'m' : ''}`}
          onClose={() => setEditSlot(null)}>
          {/* All cats as colored buttons — no section labels, just colors */}
          <div className="flex flex-wrap gap-2 mb-4">
            {allSlotCats.map(cat => (
              <button key={cat.id} onClick={() => setSlotCat(slotCat===cat.id?'':cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all
                  ${slotCat===cat.id ? 'text-white ring-2 ring-white/50' : 'text-white opacity-60 hover:opacity-100'}`}
                style={{background:cat.color}}>
                {cat.name}
              </button>
            ))}
            <button onClick={() => setNewCatModal(true)}
              className="px-3 py-2 rounded-xl text-xs text-muted border border-dashed border-theme hover:border-accent hover:text-accent transition-all">
              + Custom
            </button>
          </div>

          {/* Delete custom categories */}
          {customCategories.length > 0 && (
            <div className="mb-3 p-3 card-bg rounded-xl">
              <p className="text-[10px] text-muted font-mono mb-2">Custom (hold to delete)</p>
              <div className="flex flex-wrap gap-1.5">
                {customCategories.map(c => (
                  <div key={c.id} className="flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{background:`${BUILTIN_CATEGORIES.find(b=>b.id===c.parentId)?.color||'#a29bfe'}22`}}>
                    <span className="text-xs text-main">{c.name}</span>
                    <button onClick={() => deleteCustomCategory(c.id)}
                      className="text-muted hover:text-ember text-xs ml-1">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <textarea value={slotNote} onChange={e => setSlotNote(e.target.value)}
            placeholder="Note (optional)..." rows={2} className="input-field w-full resize-none mb-4" />
          <div className="flex gap-3">
            <button onClick={() => { clearJournalSlot(selectedDate,editSlot); setEditSlot(null) }}
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
          <p className="text-xs text-muted mb-2 font-mono uppercase tracking-widest">Belongs to</p>
          <div className="flex gap-2 mb-5">
            {BUILTIN_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setNewCatParent(cat.id)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-white
                  ${newCatParent===cat.id?'ring-2 ring-white/50':'opacity-50'}`}
                style={{background:cat.color}}>
                {cat.emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setNewCatModal(false)} className="flex-1 btn-secondary">Cancel</button>
            <button onClick={() => { addCustomCategory(newCatName.trim(), newCatParent); setNewCatModal(false); setNewCatName('') }}
              disabled={!newCatName.trim()} className="flex-1 btn-primary">Add</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
