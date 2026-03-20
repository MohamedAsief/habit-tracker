import { useState, useRef, useCallback } from 'react'
import { toDateStr } from '../utils/dates.js'
import { BUILTIN_CATEGORIES } from '../utils/schema.js'
import Modal from '../components/Modal.jsx'

function pad(n) { return String(n).padStart(2,'0') }

function formatHour12(h) {
  if (h === 0)  return '12 AM'
  if (h < 12)   return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function formatRange(h, granularity) {
  const start = formatHour12(h)
  if (granularity === 60) {
    const end = formatHour12(h + 1)
    return `${start} – ${end}`
  }
  return `${start}`
}

function getParentCat(catId, customCategories) {
  for (const cat of BUILTIN_CATEGORIES)
    if (cat.subs.find(s => s.id === catId)) return cat
  const custom = customCategories.find(c => c.id === catId)
  if (custom) return BUILTIN_CATEGORIES.find(c => c.id === custom.parentId) || BUILTIN_CATEGORIES[2]
  return BUILTIN_CATEGORIES[2]
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
  return getParentCat(catId, customCategories)?.id || 'distracted'
}

function slotDuration(slot) {
  const [,m] = slot.split(':').map(Number)
  if (m === 0) return 1
  if (m === 30) return 0.5
  return 0.25
}

function HourBlock({ hour, dayJournal, onSelect, multiMode, selectedSlots, customCategories }) {
  const [granularity, setGranularity] = useState(60)
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
              onClick={() => multiMode
                ? (selectedSlots.has(slot)
                    ? (selectedSlots.delete(slot))
                    : selectedSlots.add(slot))
                : onSelect(slot, entry, granularity)}
              className={`flex items-center gap-2 px-3 rounded-xl border text-left transition-all active:scale-95
                ${slots.length>1?'py-2':'py-3.5'}
                ${isSel?'ring-2 ring-accent':''}`}
              style={entry
                ? {background:`${color}22`,borderColor:`${color}55`}
                : {background:'var(--surface)',borderColor:'var(--border)'}}>
              {slots.length>1 && <span className="font-mono text-[9px] text-muted shrink-0 w-6">{slot.split(':')[1]}</span>}
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

// Category button with long press to edit/delete
function CatButton({ cat, selected, onSelect, onEdit, onDelete, isCustom }) {
  const timer = useRef(null)
  const [showMenu, setShowMenu] = useState(false)

  const handlePressStart = () => {
    timer.current = setTimeout(() => setShowMenu(true), 600)
  }
  const handlePressEnd = () => clearTimeout(timer.current)

  return (
    <div className="relative">
      <button
        onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
        onClick={() => !showMenu && onSelect(cat.id === selected ? '' : cat.id)}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border
          ${selected === cat.id ? 'text-white border-transparent' : 'border-theme text-muted'}`}
        style={selected === cat.id ? {background:cat.color} : {}}>
        {cat.name}
      </button>
      {showMenu && (
        <div className="absolute top-8 left-0 z-50 card-bg border border-theme rounded-xl shadow-xl py-1 min-w-[100px]">
          {isCustom && (
            <>
              <button className="menu-item text-xs" onClick={() => { onEdit(cat); setShowMenu(false) }}>✏️ Edit</button>
              <button className="menu-item text-xs text-ember" onClick={() => { onDelete(cat.id); setShowMenu(false) }}>🗑️ Delete</button>
            </>
          )}
          <button className="menu-item text-xs" onClick={() => setShowMenu(false)}>✕ Close</button>
        </div>
      )}
    </div>
  )
}

export default function JournalPage({ store }) {
  const { state, setJournalSlot, setJournalSlots, clearJournalSlot, addCustomCategory, deleteCustomCategory } = store
  const { journal, customCategories=[] } = state

  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [editSlot, setEditSlot]         = useState(null)
  const [editGranularity, setEditGranularity] = useState(60)
  const [slotCat, setSlotCat]           = useState('')
  const [slotNote, setSlotNote]         = useState('')
  const [multiMode, setMultiMode]       = useState(false)
  const [selected, setSelected]         = useState(new Set())
  const [half, setHalf]                 = useState('am')

  // Add/edit custom category state
  const [addCatModal, setAddCatModal]   = useState(null) // parentId
  const [editCatItem, setEditCatItem]   = useState(null) // { id, name, parentId }
  const [newCatName, setNewCatName]     = useState('')

  const dayJournal = journal[selectedDate] || {}
  const amHours = Array.from({length:12},(_,i)=>i)
  const pmHours = Array.from({length:12},(_,i)=>i+12)
  const displayHours = half==='am' ? amHours : pmHours

  // Swipe AM/PM
  const touchStartX = useRef(null)
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) setHalf(dx < 0 ? 'pm' : 'am')
    touchStartX.current = null
  }

  // Multi select long press
  const longTimer = useRef(null)

  const handleSelect = useCallback((slot, entry, gran = 60) => {
    if (multiMode) {
      setSelected(prev => { const n=new Set(prev); n.has(slot)?n.delete(slot):n.add(slot); return n })
      return
    }
    setEditSlot(slot)
    setEditGranularity(gran)
    setSlotCat(entry?.category||'')
    setSlotNote(entry?.note||'')
  }, [multiMode])

  const saveSlot = () => {
    if (slotCat) setJournalSlot(selectedDate, editSlot, { category: slotCat, note: slotNote })
    else clearJournalSlot(selectedDate, editSlot)
    setEditSlot(null)
  }

  const applyMulti = (catId) => {
    setJournalSlots(selectedDate, [...selected], { category: catId, note: '' })
    setMultiMode(false); setSelected(new Set())
  }

  // Stats — actual hours only
  let prodH=0, rechH=0, distH=0
  for (const [slot, data] of Object.entries(dayJournal)) {
    const dur = slotDuration(slot)
    const type = getCatType(data.category, customCategories)
    if (type==='productive') prodH+=dur
    else if (type==='recharge') rechH+=dur
    else distH+=dur
  }
  const totalH = prodH+rechH+distH

  const exportCSV = () => {
    const rows=[['Date','Slot','Category','Type','Note']]
    for (const [slot,data] of Object.entries(dayJournal))
      rows.push([selectedDate,slot,getCatName(data.category,customCategories),getCatType(data.category,customCategories),(data.note||'').replace(/,/g,';')])
    const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'})
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`journal-${selectedDate}.csv`;a.click()
  }

  // Modal title: "2 AM – 3 AM"
  const getModalTitle = () => {
    if (!editSlot) return ''
    const [hStr, mStr] = editSlot.split(':')
    const h = parseInt(hStr), m = parseInt(mStr)
    const startLabel = m===0 ? formatHour12(h) : `${formatHour12(h)} +${m}m`
    if (editGranularity === 60 && m === 0) return `${formatHour12(h)} – ${formatHour12(h+1)}`
    if (editGranularity === 30) {
      const endM = m + 30
      if (endM === 60) return `${formatHour12(h)}:${pad(m)} – ${formatHour12(h+1)}`
      return `${formatHour12(h)}:${pad(m)} – ${formatHour12(h)}:${pad(endM)}`
    }
    return `${formatHour12(h)}:${pad(m)} – ${formatHour12(h)}:${pad(m+15)}`
  }

  const handleSaveCustomCat = () => {
    if (!newCatName.trim()) return
    if (editCatItem) {
      // Edit existing
      store.state.customCategories.find(c => c.id === editCatItem.id)
      deleteCustomCategory(editCatItem.id)
      addCustomCategory(newCatName.trim(), editCatItem.parentId)
    } else {
      addCustomCategory(newCatName.trim(), addCatModal)
    }
    setNewCatName(''); setAddCatModal(null); setEditCatItem(null)
  }

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

        {/* Stats — actual hours */}
        <div className="flex gap-1.5 pb-3">
          {[
            ['⚡', prodH, '#26de81', '#26de8115', '#26de8133'],
            ['🔋', rechH, '#54a0ff', '#54a0ff15', '#54a0ff33'],
            ['📵', distH, '#ff6b4a', '#ff6b4a15', '#ff6b4a33'],
            ['Total', totalH, '#7c6aff', 'var(--card)', 'var(--border)'],
          ].map(([label, h, color, bg, border]) => (
            <div key={label} className="flex-1 rounded-xl px-2 py-2 text-center"
              style={{background:bg, border:`1px solid ${border}`}}>
              <p className="text-[10px] font-bold" style={{color}}>{label}</p>
              <p className="text-sm font-black" style={{color}}>{h.toFixed(1)}h</p>
            </div>
          ))}
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
          <span className="text-white text-sm font-semibold flex-1">{selected.size} slots selected</span>
          <button onClick={() => { for(const s of selected) clearJournalSlot(selectedDate,s); setMultiMode(false); setSelected(new Set()) }}
            className="text-white/70 text-xs px-2 py-1 rounded-lg border border-white/30">Clear</button>
          <button onClick={() => { setMultiMode(false); setSelected(new Set()) }}
            className="text-white text-xs px-2 py-1 rounded-lg bg-white/20">Cancel</button>
        </div>
      )}

      {/* Multi cat picker */}
      {multiMode && selected.size > 0 && (
        <div className="px-4 py-2 border-b border-theme" style={{background:'var(--surface)'}}>
          {BUILTIN_CATEGORIES.map(cat => (
            <div key={cat.id} className="mb-2">
              <p className="text-[10px] font-bold mb-1" style={{color:cat.color}}>{cat.emoji} {cat.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {[...cat.subs, ...customCategories.filter(c=>c.parentId===cat.id)].map(sub => (
                  <button key={sub.id} onClick={() => applyMulti(sub.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
                    style={{background:cat.color}}>{sub.name}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hour blocks */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24">
        <p className="text-[10px] text-muted opacity-40 mb-3 font-mono text-center">
          Long press slot → multi-select · Swipe ← → AM/PM
        </p>
        {displayHours.map(hour => (
          <HourBlock key={hour} hour={hour} dayJournal={dayJournal}
            onSelect={handleSelect} multiMode={multiMode}
            selectedSlots={selected} customCategories={customCategories} />
        ))}
      </div>

      {/* Edit slot modal */}
      {editSlot && (
        <Modal title={getModalTitle()} onClose={() => setEditSlot(null)}>
          {BUILTIN_CATEGORIES.map(cat => (
            <div key={cat.id} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold" style={{color:cat.color}}>{cat.emoji} {cat.name}</p>
                <button onClick={() => { setAddCatModal(cat.id); setNewCatName('') }}
                  className="text-[10px] text-muted hover:text-accent border border-dashed border-theme px-2 py-0.5 rounded-lg transition-all">
                  + Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.subs.map(sub => (
                  <button key={sub.id}
                    onClick={() => setSlotCat(slotCat===sub.id?'':sub.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border
                      ${slotCat===sub.id?'text-white border-transparent':'border-theme text-muted'}`}
                    style={slotCat===sub.id?{background:cat.color}:{}}>
                    {sub.name}
                  </button>
                ))}
                {customCategories.filter(c=>c.parentId===cat.id).map(c => (
                  <CatButton key={c.id} cat={{...c,color:cat.color}} selected={slotCat}
                    onSelect={setSlotCat}
                    onEdit={(cat) => { setEditCatItem({...cat,parentId:cat.parentId||cat.id}); setNewCatName(cat.name); setAddCatModal('edit') }}
                    onDelete={deleteCustomCategory}
                    isCustom={true} />
                ))}
              </div>
            </div>
          ))}

          <textarea value={slotNote} onChange={e => setSlotNote(e.target.value)}
            placeholder="Note (optional)..." rows={2} className="input-field w-full resize-none mb-4" />
          <div className="flex gap-3">
            <button onClick={() => { clearJournalSlot(selectedDate,editSlot); setEditSlot(null) }}
              className="btn-secondary text-ember text-sm px-3">Clear</button>
            <button onClick={saveSlot} className="flex-1 btn-primary">Save</button>
          </div>
        </Modal>
      )}

      {/* Add/Edit custom category modal */}
      {(addCatModal || editCatItem) && (
        <Modal title={editCatItem ? 'Edit Category' : `Add to ${BUILTIN_CATEGORIES.find(c=>c.id===addCatModal)?.name||''}`}
          onClose={() => { setAddCatModal(null); setEditCatItem(null); setNewCatName('') }} size="sm">
          <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
            placeholder="Category name..." className="input-field w-full mb-4" autoFocus
            onKeyDown={e => e.key==='Enter' && handleSaveCustomCat()} />
          <div className="flex gap-3">
            <button onClick={() => { setAddCatModal(null); setEditCatItem(null); setNewCatName('') }}
              className="flex-1 btn-secondary">Cancel</button>
            <button onClick={handleSaveCustomCat} disabled={!newCatName.trim()}
              className="flex-1 btn-primary">Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
