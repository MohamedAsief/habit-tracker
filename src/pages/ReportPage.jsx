
function getParentType(catId, customCategories) {
  for (const cat of BUILTIN_CATEGORIES)
    if (cat.subs.find(s => s.id === catId)) return cat.id
  return customCategories.find(c => c.id === catId)?.parentId || 'distracted'
}

function getCatColor2(catId, customCategories) {
  for (const cat of BUILTIN_CATEGORIES)
    if (cat.subs.find(s => s.id === catId)) return cat.color
  const custom = customCategories.find(c => c.id === catId)
  return BUILTIN_CATEGORIES.find(b => b.id === custom?.parentId)?.color || '#8b8b9e'
}

function JournalReport({ journal, customCategories=[], daysToCheck }) {
  const COLORS = { productive: '#26de81', recharge: '#54a0ff', distracted: '#ff6b4a' }
  
  // Compute totals
  let prodH=0, rechH=0, distH=0
  const hourData = {} // hour -> { productive, recharge, distracted }
  
  for (const ds of daysToCheck) {
    for (const [slot, data] of Object.entries(journal[ds]||{})) {
      const h = parseInt(slot.split(':')[0])
      const mm = parseInt(slot.split(':')[1])
      const dur = mm===0 ? 1 : mm===30 ? 0.5 : 0.25
      const type = getParentType(data.category, customCategories)
      if (!hourData[h]) hourData[h] = { productive:0, recharge:0, distracted:0 }
      hourData[h][type] = (hourData[h][type]||0) + dur
      if (type==='productive') prodH+=dur
      else if (type==='recharge') rechH+=dur
      else distH+=dur
    }
  }
  
  const totalH = prodH+rechH+distH
  const maxHourH = Math.max(...Object.values(hourData).map(h=>h.productive+h.recharge+h.distracted), 1)
  const hours = Array.from({length:24},(_,i)=>i)
  
  if (totalH === 0) return <p className="text-center text-muted py-12">No journal entries for this period</p>
  
  return (
    <div>
      {/* Total + 3 type cards */}
      <div className="card-bg rounded-2xl p-4 mb-4">
        <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-1">Total Logged</p>
        <p className="font-display text-4xl font-black text-main mb-3">{totalH.toFixed(1)}h</p>
        <div className="flex gap-2">
          {[['productive','⚡',prodH],['recharge','🔋',rechH],['distracted','📵',distH]].map(([type,emoji,h])=>(
            <div key={type} className="flex-1 rounded-xl px-2 py-2 text-center"
              style={{background:`${COLORS[type]}15`,border:`1px solid ${COLORS[type]}33`}}>
              <p className="text-base">{emoji}</p>
              <p className="text-sm font-black" style={{color:COLORS[type]}}>{h.toFixed(1)}h</p>
              <p className="text-[9px] text-muted">{totalH>0?Math.round((h/totalH)*100):0}%</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Stacked bar chart by hour — like Screen Time */}
      <div className="card-bg rounded-2xl p-4 mb-4">
        <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-4">Hourly Breakdown</p>
        <div className="flex items-end gap-px" style={{height:'100px'}}>
          {hours.map(h => {
            const d = hourData[h] || {}
            const total = (d.productive||0)+(d.recharge||0)+(d.distracted||0)
            const pct = (total/maxHourH)*100
            return (
              <div key={h} className="flex-1 flex flex-col justify-end" style={{height:'100px'}}>
                {total > 0 && (
                  <div className="w-full rounded-t-sm overflow-hidden" style={{height:`${Math.max(pct,3)}%`}}>
                    {['distracted','recharge','productive'].map(type => {
                      const h2 = d[type]||0
                      const p = total>0?(h2/total)*100:0
                      return p>0 ? <div key={type} style={{height:`${p}%`,background:COLORS[type]}}/> : null
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {/* X axis labels */}
        <div className="flex mt-1">
          {['12A','6A','12P','6P'].map((l,i)=>(
            <div key={i} className="flex-1 text-center">
              <span className="text-[8px] text-muted font-mono">{l}</span>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-3 mt-3 justify-center">
          {[['productive','⚡ Productive'],['recharge','🔋 Recharge'],['distracted','📵 Distracted']].map(([type,label])=>(
            <div key={type} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{background:COLORS[type]}}/>
              <span className="text-[10px] text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { computeStats, getWeekDays, toDateStr } from '../utils/dates.js'
import { BUILTIN_CATEGORIES } from '../utils/schema.js'
import { BUILTIN_CATEGORIES } from '../utils/schema.js'

function fmt(ms) {
  const h=Math.floor(ms/3600000), m=Math.floor((ms%3600000)/60000)
  return h>0 ? `${h}h ${m}m` : `${m}m`
}

function PieChart({ slices }) {
  const total = slices.reduce((a,s) => a+s.value, 0)
  if (!total) return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-32 h-32 rounded-full border-4 border-dashed border-border flex items-center justify-center">
        <span className="text-xs text-muted">No data</span>
      </div>
    </div>
  )
  let cum = 0
  const paths = slices.filter(s=>s.value>0).map(slice => {
    const pct = slice.value/total
    const s = cum*2*Math.PI - Math.PI/2
    cum += pct
    const e = cum*2*Math.PI - Math.PI/2
    const r=55
    const x1=70+r*Math.cos(s), y1=70+r*Math.sin(s)
    const x2=70+r*Math.cos(e), y2=70+r*Math.sin(e)
    return { d:`M70,70 L${x1},${y1} A${r},${r} 0 ${pct>0.5?1:0},1 ${x2},${y2} Z`, color:slice.color, label:slice.label, pct:Math.round(pct*100) }
  })
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {paths.map((p,i) => <path key={i} d={p.d} fill={p.color} opacity="0.85"/>)}
        <circle cx="70" cy="70" r="28" fill="var(--card)"/>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {paths.map((p,i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:p.color}}/>
            <span className="text-[10px] text-muted">{p.label} {p.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const pct = max>0 ? (value/max)*100 : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted truncate">{label}</span>
        <span className="font-mono text-main ml-2 shrink-0">{value}</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:color}}/>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card-bg rounded-2xl p-4 flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
      <span className="font-display text-3xl font-black leading-none" style={{color:color||'var(--text)'}}>{value}</span>
      {sub && <span className="text-xs text-muted mt-0.5">{sub}</span>}
    </div>
  )
}

export default function ReportPage({ store }) {
  const { state, exportData } = store
  const { lists, logs, journal, timerSessions, customCategories=[] } = state
  const [tab, setTab]     = useState('list')
  const [view, setView]   = useState('weekly')
  const [selList, setSelList] = useState(state.settings.activeListId)

  const today    = new Date()
  const todayStr = toDateStr(today)
  const allCats  = [...BUILTIN_CATEGORIES, ...customCategories]

  const selListObj = lists.find(l=>l.id===selList) || lists[0]
  const listLogs   = logs[selList] || {}

  const stats = useMemo(() =>
    selListObj ? computeStats(selListObj.habits, listLogs, today) : {},
    [selList, listLogs, today]
  )

  // Days to check based on view
  const daysToCheck = useMemo(() => {
    if (view === 'weekly') return getWeekDays(today).map(toDateStr)
    const days=[]
    for (let d=new Date(today.getFullYear(),today.getMonth(),1); d<=today; d.setDate(d.getDate()+1))
      days.push(toDateStr(new Date(d)))
    return days
  }, [view])

  const weekStrs = getWeekDays(today).map(toDateStr)

  // Habit rows
  const habitRows = useMemo(() => (selListObj?.habits||[]).map(h => {
    let count=0, streak=0
    const c=new Date(today)
    while (listLogs[toDateStr(c)]?.[h.id]==='done') { streak++; c.setDate(c.getDate()-1) }
    for (const dl of Object.values(listLogs)) if (dl[h.id]==='done') count++
    return {...h, count, streak}
  }).sort((a,b)=>b.count-a.count), [selList, listLogs])

  // Timer
  const sessions     = timerSessions||[]
  const filtSessions = sessions.filter(s => daysToCheck.includes(s.date))
  const timerTotal   = filtSessions.reduce((a,s)=>a+s.duration,0)
  const dayTotals    = getWeekDays(today).map(d => ({
    label:['S','M','T','W','T','F','S'][d.getDay()],
    ms: sessions.filter(s=>s.date===toDateStr(d)).reduce((a,s)=>a+s.duration,0),
    isToday: toDateStr(d)===todayStr
  }))
  const maxDayMs = Math.max(...dayTotals.map(d=>d.ms),1)

  // Journal stats
  const { usefulSlots, wastedSlots, catCounts } = useMemo(() => {
    let useful=0, wasted=0; const counts={}
    for (const ds of daysToCheck) {
      for (const {category} of Object.values(journal[ds]||{})) {
        const cat=allCats.find(c=>c.id===category)
        if (cat) { cat.useful?useful++:wasted++; counts[category]=(counts[category]||0)+0.5 }
      }
    }
    return { usefulSlots:useful, wastedSlots:wasted, catCounts:counts }
  }, [daysToCheck, journal])

  const topCats = Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).slice(0,6)
  const pieSlices = [
    {value:usefulSlots, color:'#b8ff6a', label:'Useful'},
    {value:wastedSlots, color:'#ff6b4a', label:'Wasted'},
  ]

  // Weekly rate from computeStats
  const weekRate  = stats.weekRate  || 0
  const monthRate = stats.monthRate || 0

  return (
    <div className="flex flex-col min-h-screen bg-base">
      <div className="sticky top-0 z-20 glass border-b border-theme px-4 pt-safe">
        <div className="flex items-center justify-between py-3">
          <h1 className="font-display text-2xl font-black text-main">Report</h1>
          <div className="flex gap-2">
            {/* Weekly/Monthly toggle — fixed */}
            <div className="flex bg-surface border border-theme rounded-xl overflow-hidden">
              <button onClick={() => setView('weekly')}
                className={`px-3 py-1.5 text-xs font-semibold transition-all ${view==='weekly' ? 'bg-accent text-white' : 'text-muted'}`}>
                Weekly
              </button>
              <button onClick={() => setView('monthly')}
                className={`px-3 py-1.5 text-xs font-semibold transition-all ${view==='monthly' ? 'bg-accent text-white' : 'text-muted'}`}>
                Monthly
              </button>
            </div>
            <button onClick={() => exportData('csv', selList)} className="p-2 text-muted hover:text-accent transition-colors" aria-label="Export">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 pb-3">
          {[{id:'list',l:'Lists'},{id:'timer',l:'Timer'},{id:'journal',l:'Journal'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab===t.id ? 'bg-accent text-white' : 'bg-surface text-muted border border-theme'}`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* LIST TAB */}
        {tab==='list' && (
          <div>
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
              {lists.map(l => (
                <button key={l.id} onClick={() => setSelList(l.id)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold shrink-0 transition-all ${l.id===selList ? 'bg-accent text-white' : 'border border-theme text-muted'}`}>
                  {l.name}
                </button>
              ))}
            </div>

            <div className="card-bg rounded-2xl p-5 mb-4 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{background:'radial-gradient(ellipse at center,#b8ff6a,transparent 70%)'}}/>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">Current Streak</p>
              <span className={`font-display text-7xl font-black leading-none block ${stats.streak>0?'text-lime streak-glow':'text-muted opacity-40'}`}>
                {stats.streak??0}
              </span>
              <p className="text-sm text-muted mt-2">{stats.streak===0?'Start today!':`day${stats.streak!==1?'s':''} in a row`}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard label="Total Done" value={stats.total??0} color="#7c6aff" sub="all time"/>
              <StatCard label="Today" value={`${stats.todayDone??0}/${selListObj?.habits.length??0}`} color="#b8ff6a" sub={`${stats.todayRate??0}%`}/>
              <StatCard label={view==='weekly'?'This Week':'This Month'} value={view==='weekly'?(stats.weekCount??0):(stats.monthCount??0)}/>
              <StatCard label="Rate" value={`${view==='weekly'?weekRate:monthRate}%`} color="#7c6aff"/>
            </div>

            {selListObj && selListObj.habits.length>0 && (
              <div className="card-bg rounded-2xl p-5 mb-4 flex flex-col items-center gap-2">
                <p className="text-xs text-muted font-mono uppercase tracking-widest self-start">Completion Rate</p>
                <PieChart slices={[
                  {value:stats.weekCount||0, color:'#7c6aff', label:'Done'},
                  {value:Math.max(0,(selListObj.habits.length*7)-(stats.weekCount||0)), color:'var(--border)', label:'Missed'},
                ]}/>
              </div>
            )}

            {habitRows.length>0 && (
              <div className="card-bg rounded-2xl p-4">
                <p className="text-xs text-muted font-mono uppercase tracking-widest mb-4">📊 Habit Progress</p>
                <div className="flex flex-col gap-3">
                  {habitRows.map((h, i) => {
                    const maxVal = Math.max(...habitRows.map(r=>r.count), 1)
                    const pct = (h.count / maxVal) * 100
                    return (
                      <div key={h.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{h.emoji}</span>
                            <span className="text-sm font-semibold text-main truncate max-w-[140px]">{h.name}</span>
                          </div>
                          <span className="font-mono text-sm font-bold ml-2 shrink-0" style={{color: h.color}}>{h.count}</span>
                        </div>
                        <div className="relative h-7 bg-border rounded-xl overflow-hidden">
                          <div className="h-full rounded-xl transition-all duration-700 flex items-center px-3"
                            style={{width:`${Math.max(pct,4)}%`, background: `linear-gradient(90deg, ${h.color}cc, ${h.color})`}}>
                          </div>
                          {h.streak > 0 && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-white/80">
                              🔥{h.streak}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TIMER TAB */}
        {tab==='timer' && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard label={view==='weekly'?'This Week':'This Month'} value={fmt(timerTotal)} color="#7c6aff"/>
              <StatCard label="Sessions" value={filtSessions.length} sub={view==='weekly'?'this week':'this month'}/>
            </div>
            <div className="card-bg rounded-2xl p-4 mb-4">
              <p className="text-xs text-muted font-mono uppercase tracking-widest mb-4">Daily (This Week)</p>
              <div className="flex items-end gap-2 h-28">
                {dayTotals.map((d,i) => {
                  const pct = d.ms>0 ? Math.max((d.ms/maxDayMs)*100,5) : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center" style={{height:'88px'}}>
                        <div className="w-full rounded-t-lg transition-all duration-700"
                          style={{height:`${pct}%`, background:d.isToday?'#7c6aff':'#7c6aff55', minHeight:pct>0?'4px':'0'}}/>
                      </div>
                      <span className={`text-[10px] font-mono ${d.isToday?'text-accent font-bold':'text-muted opacity-60'}`}>{d.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            {sessions.slice(-5).reverse().map(s => (
              <div key={s.id} className="card-bg rounded-xl px-4 py-3 flex justify-between items-center mb-2">
                <div>
                  <p className="text-sm font-semibold text-main">{s.label||'Session'}</p>
                  <p className="text-[10px] text-muted font-mono">{s.date} · {s.laps?.length||0} laps</p>
                </div>
                <span className="font-mono text-sm text-accent">{fmt(s.duration)}</span>
              </div>
            ))}
            {sessions.length===0 && <p className="text-center text-muted py-12">No timer sessions yet</p>}
          </div>
        )}

        {/* JOURNAL TAB */}
        {tab==='journal' && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard label="Useful" value={`${(usefulSlots*0.5).toFixed(1)}h`} color="#b8ff6a"/>
              <StatCard label="Wasted" value={`${(wastedSlots*0.5).toFixed(1)}h`} color="#ff6b4a"/>
            </div>
            <div className="card-bg rounded-2xl p-5 mb-4 flex flex-col items-center gap-2">
              <p className="text-xs text-muted font-mono uppercase tracking-widest self-start mb-2">Time Split</p>
              <PieChart slices={pieSlices}/>
            </div>
            {topCats.length>0 && (
              <div className="card-bg rounded-2xl p-4">
                <p className="text-xs text-muted font-mono uppercase tracking-widest mb-4">Top Categories</p>
                {topCats.map(([id,hrs]) => {
                  const cat=allCats.find(c=>c.id===id)
                  return cat ? <MiniBar key={id} label={cat.name} value={`${hrs}h`} max={Math.max(...topCats.map(([,h])=>h))} color={cat.color}/> : null
                })}
              </div>
            )}
            {usefulSlots+wastedSlots===0 && <p className="text-center text-muted py-12">No journal entries for this period</p>}
          </div>
        )}
      </div>
    </div>
  )
}
