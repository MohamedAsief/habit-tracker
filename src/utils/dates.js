export function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getWeekDays(ref = new Date()) {
  const days = []
  const sun = new Date(ref); sun.setDate(ref.getDate() - ref.getDay())
  for (let i = 0; i < 7; i++) { const d = new Date(sun); d.setDate(sun.getDate() + i); days.push(d) }
  return days
}

export function getMonthDays(year, month) {
  const first = new Date(year, month, 1), last = new Date(year, month + 1, 0)
  const days = []
  for (let i = 0; i < first.getDay(); i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

export function formatMonthYear(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_MINI   = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function computeHabitStreak(habitId, listLogs, today = new Date()) {
  let streak = 0
  const cursor = new Date(today)
  while (true) {
    const s = toDateStr(cursor)
    if (listLogs[s]?.[habitId] === 'done') { streak++; cursor.setDate(cursor.getDate() - 1) }
    else break
  }
  return streak
}

export function computeStats(habits, listLogs, today = new Date()) {
  const todayStr = toDateStr(today)
  const weekStrs = getWeekDays(today).map(toDateStr)
  const monthDays = []
  for (let d = new Date(today.getFullYear(), today.getMonth(), 1); d <= today; d.setDate(d.getDate() + 1))
    monthDays.push(toDateStr(new Date(d)))

  let total = 0, weekCount = 0, monthCount = 0
  for (const [ds, dayLog] of Object.entries(listLogs || {})) {
    for (const v of Object.values(dayLog)) {
      if (v === 'done') {
        total++
        if (weekStrs.includes(ds)) weekCount++
        if (monthDays.includes(ds)) monthCount++
      }
    }
  }

  let streak = 0
  const c = new Date(today)
  while (true) {
    const s = toDateStr(c)
    const hasDone = Object.values(listLogs[s] || {}).some(v => v === 'done')
    if (hasDone) { streak++; c.setDate(c.getDate() - 1) } else break
  }

  const todayLog  = listLogs[todayStr] || {}
  const todayDone = Object.values(todayLog).filter(v => v === 'done').length
  const todayRate = habits.length > 0 ? Math.round((todayDone / habits.length) * 100) : 0
  const weekMax   = habits.length * 7
  const monthMax  = habits.length * today.getDate()
  const weekRate  = weekMax  > 0 ? Math.round((weekCount  / weekMax)  * 100) : 0
  const monthRate = monthMax > 0 ? Math.round((monthCount / monthMax) * 100) : 0

  return { total, weekCount, monthCount, streak, todayDone, todayRate, weekRate, monthRate }
}

// 1hr slots for journal (24 slots)
export function getHourSlots() {
  const slots = []
  for (let h = 0; h < 24; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`)
  }
  return slots
}

// Sub-slots for expanded hour
export function getSubSlots(hour, granularity = 30) {
  const slots = []
  const h = String(hour).padStart(2,'0')
  for (let m = 0; m < 60; m += granularity) {
    slots.push(`${h}:${String(m).padStart(2,'0')}`)
  }
  return slots
}

export function getHalfHourSlots() {
  const slots = []
  for (let h = 0; h < 24; h++)
    for (let m = 0; m < 60; m += 30)
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  return slots
}

export function slotToHours(slotKey) {
  // e.g. "08:00" = 1hr, "08:30" = 0.5hr, "08:15" = 0.25hr
  const [, m] = slotKey.split(':').map(Number)
  if (m === 0) return 1
  if (m === 30) return 0.5
  if (m === 15 || m === 45) return 0.25
  return 0.5
}
