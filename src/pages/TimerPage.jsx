import { useState, useEffect, useRef } from 'react'
import { toDateStr } from '../utils/dates.js'
import { toast } from '../components/Toast.jsx'

function fmt(ms) {
  const t = Math.floor(ms / 1000)
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export default function TimerPage({ store }) {
  const { state, addTimerSession } = store
  const sessions = state.timerSessions || []

  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [laps, setLaps] = useState([])
  const [label, setLabel] = useState('')
  const intervalRef = useRef(null)
  const startRef = useRef(null)
  const baseRef = useRef(0)

  useEffect(() => {
    if (running) {
      startRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        setElapsed(baseRef.current + Date.now() - startRef.current)
      }, 100)
    } else {
      clearInterval(intervalRef.current)
      if (startRef.current) baseRef.current = elapsed
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const handleStart = () => setRunning(true)
  const handlePause = () => setRunning(false)

  const handleLap = () => {
    setLaps(prev => [...prev, { time: elapsed, label: label || `Lap ${prev.length + 1}`, at: new Date().toISOString() }])
    setLabel('')
    toast(`Lap ${laps.length + 1} recorded: ${fmt(elapsed)}`)
  }

  const handleStop = () => {
    setRunning(false)
    if (elapsed > 0) {
      addTimerSession({
        duration: elapsed,
        laps: laps,
        label: label || 'Session',
        date: toDateStr(new Date()),
      })
      toast(`Session saved: ${fmt(elapsed)}`)
    }
    setElapsed(0); baseRef.current = 0; setLaps([]); setLabel('')
  }

  // Today's sessions
  const todayStr = toDateStr(new Date())
  const todaySessions = sessions.filter(s => s.date === todayStr)
  const todayTotal = todaySessions.reduce((a, s) => a + s.duration, 0)

  // Recent sessions
  const recent = [...sessions].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10)

  const progress = Math.min((elapsed / (25 * 60 * 1000)) * 100, 100)
  const r = 70, circ = 2 * Math.PI * r
  const dash = (progress / 100) * circ

  return (
    <div className="flex flex-col min-h-screen bg-base">
      <div className="sticky top-0 z-20 glass border-b border-theme px-4 pt-safe py-3">
        <h1 className="font-display text-lg font-bold text-main">Daily Timer</h1>
        <p className="text-xs text-muted">Today: {fmt(todayTotal)} tracked</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        {/* Ring timer */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r={r} fill="none" stroke="var(--border)" strokeWidth="8"/>
              <circle cx="90" cy="90" r={r} fill="none" stroke="#7c6aff" strokeWidth="8"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 90 90)"
                style={{ transition: 'stroke-dasharray 0.1s linear' }}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-bold text-main">{fmt(elapsed)}</span>
              <span className="text-xs text-muted mt-1">{running ? 'Running' : elapsed > 0 ? 'Paused' : 'Ready'}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {!running ? (
            <button onClick={handleStart} className="w-16 h-16 rounded-full bg-accent glow-btn flex items-center justify-center" aria-label="Start timer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
          ) : (
            <button onClick={handlePause} className="w-16 h-16 rounded-full bg-accent glow-btn flex items-center justify-center" aria-label="Pause timer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>
          )}
          {elapsed > 0 && (
            <>
              <button onClick={handleLap} className="w-12 h-12 rounded-full border-2 border-accent text-accent flex items-center justify-center text-xs font-bold" aria-label="Record lap">LAP</button>
              <button onClick={handleStop} className="w-12 h-12 rounded-full border-2 border-ember text-ember flex items-center justify-center" aria-label="Stop timer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
              </button>
            </>
          )}
        </div>

        {/* Lap label */}
        {running && (
          <div className="flex gap-2 mb-4">
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Lap label..."
              className="input-field flex-1 text-sm" aria-label="Lap label" />
            <button onClick={handleLap} className="btn-secondary text-sm px-3" aria-label="Record lap">+ Lap</button>
          </div>
        )}

        {/* Current laps */}
        {laps.length > 0 && (
          <div className="card-bg rounded-2xl p-4 mb-4">
            <p className="text-xs text-muted font-mono uppercase tracking-widest mb-3">Current Laps</p>
            <div className="flex flex-col gap-1.5">
              {laps.map((lap, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-muted">{lap.label}</span>
                  <span className="font-mono text-main">{fmt(lap.time)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent sessions */}
        {recent.length > 0 && (
          <div>
            <p className="text-xs text-muted font-mono uppercase tracking-widest mb-3">Recent Sessions</p>
            <div className="flex flex-col gap-2">
              {recent.map(s => (
                <div key={s.id} className="card-bg rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-main">{s.label || 'Session'}</p>
                    <p className="text-[10px] text-muted font-mono">{s.date} · {s.laps?.length || 0} laps</p>
                  </div>
                  <span className="font-mono text-sm text-accent">{fmt(s.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
