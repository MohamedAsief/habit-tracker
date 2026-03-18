import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { STORAGE_KEY, makeDefaultState } from '../utils/schema.js'
import { runMigration } from '../utils/migrate.js'
import { createCard, markReviewed } from '../utils/spaced_repetition.js'
import { toDateStr } from '../utils/dates.js'

function loadLocal() {
  runMigration()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...makeDefaultState(), ...JSON.parse(raw) }
  } catch {}
  return makeDefaultState()
}

function saveLocal(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function useStore(user) {
  const [state, setState] = useState(loadLocal)
  const [syncing, setSyncing] = useState(false)
  const saveTimer = useRef(null)

  // Load from Firestore when user logs in
  useEffect(() => {
    if (!user) return
    setSyncing(true)
    const ref = doc(db, 'users', user.uid, 'data', 'main')
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        const data = { ...makeDefaultState(), ...snap.data() }
        setState(data)
        saveLocal(data)
      } else {
        // First time — push local data to Firestore
        const local = loadLocal()
        setDoc(ref, local)
      }
      setSyncing(false)
    }).catch(() => setSyncing(false))
  }, [user])

  // Debounced save to Firestore
  const patch = useCallback((fn) => {
    setState(prev => {
      const next = fn(prev)
      saveLocal(next)
      if (user) {
        clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
          const ref = doc(db, 'users', user.uid, 'data', 'main')
          setDoc(ref, next).catch(console.error)
        }, 1500)
      }
      return next
    })
  }, [user])

  // ── Settings ──────────────────────────────────────────────
  const setActiveTab  = useCallback((tab)   => patch(s => ({ ...s, settings: { ...s.settings, activeTab: tab } })), [patch])
  const setActiveList = useCallback((id)    => patch(s => ({ ...s, settings: { ...s.settings, activeListId: id } })), [patch])
  const setTheme      = useCallback((theme) => patch(s => ({ ...s, settings: { ...s.settings, theme } })), [patch])

  // ── Lists ─────────────────────────────────────────────────
  const addList = useCallback((name) => {
    const id = `list_${Date.now()}`
    patch(s => ({
      ...s,
      lists: [...s.lists, { id, name, order: s.lists.length, habits: [] }],
      logs: { ...s.logs, [id]: {} },
      settings: { ...s.settings, activeListId: id }
    }))
  }, [patch])

  const renameList = useCallback((id, name) =>
    patch(s => ({ ...s, lists: s.lists.map(l => l.id === id ? { ...l, name } : l) })), [patch])

  const deleteList = useCallback((id) =>
    patch(s => {
      const lists = s.lists.filter(l => l.id !== id)
      const logs = { ...s.logs }; delete logs[id]
      return { ...s, lists, logs, settings: { ...s.settings, activeListId: lists[0]?.id || null } }
    }), [patch])

  const duplicateList = useCallback((id) =>
    patch(s => {
      const src = s.lists.find(l => l.id === id)
      if (!src) return s
      const newId = `list_${Date.now()}`
      return {
        ...s,
        lists: [...s.lists, { ...src, id: newId, name: `${src.name} (copy)`,
          habits: src.habits.map(h => ({ ...h, id: `h_${Date.now()}_${Math.random()}` })) }],
        logs: { ...s.logs, [newId]: {} }
      }
    }), [patch])

  // ── Habits ────────────────────────────────────────────────
  const addHabit = useCallback((listId, name, emoji = '⭐', color = '#7c6aff') =>
    patch(s => ({
      ...s,
      lists: s.lists.map(l => l.id !== listId ? l : {
        ...l, habits: [...l.habits, {
          id: `h_${Date.now()}`, name, emoji, color,
          order: l.habits.length, createdAt: new Date().toISOString()
        }]
      })
    })), [patch])

  const updateHabit = useCallback((listId, habitId, updates) =>
    patch(s => ({
      ...s,
      lists: s.lists.map(l => l.id !== listId ? l : {
        ...l, habits: l.habits.map(h => h.id !== habitId ? h : { ...h, ...updates })
      })
    })), [patch])

  const deleteHabit = useCallback((listId, habitId) =>
    patch(s => ({
      ...s,
      lists: s.lists.map(l => l.id !== listId ? l : {
        ...l, habits: l.habits.filter(h => h.id !== habitId)
      })
    })), [patch])

  const reorderHabits = useCallback((listId, habits) =>
    patch(s => ({
      ...s, lists: s.lists.map(l => l.id !== listId ? l : { ...l, habits })
    })), [patch])

  // ── Logs ──────────────────────────────────────────────────
  const toggleCell = useCallback((listId, habitId, dateStr) =>
    patch(s => {
      const listLogs = s.logs[listId] || {}
      const dayLogs  = listLogs[dateStr] || {}
      const cur  = dayLogs[habitId]
      const next = cur === undefined || cur === null ? 'done' : cur === 'done' ? 'missed' : null
      return { ...s, logs: { ...s.logs, [listId]: { ...listLogs, [dateStr]: { ...dayLogs, [habitId]: next } } } }
    }), [patch])

  const getCellState = useCallback((listId, habitId, dateStr) =>
    state.logs[listId]?.[dateStr]?.[habitId] ?? null, [state.logs])

  // ── Journal ───────────────────────────────────────────────
  const setJournalSlot = useCallback((dateStr, slot, data) =>
    patch(s => ({
      ...s, journal: { ...s.journal, [dateStr]: { ...(s.journal[dateStr] || {}), [slot]: data } }
    })), [patch])

  const setJournalSlots = useCallback((dateStr, slots, data) =>
    patch(s => {
      const day = { ...(s.journal[dateStr] || {}) }
      slots.forEach(slot => { day[slot] = data })
      return { ...s, journal: { ...s.journal, [dateStr]: day } }
    }), [patch])

  const clearJournalSlot = useCallback((dateStr, slot) =>
    patch(s => {
      const day = { ...(s.journal[dateStr] || {}) }; delete day[slot]
      return { ...s, journal: { ...s.journal, [dateStr]: day } }
    }), [patch])

  const addCustomCategory = useCallback((name, useful = true) =>
    patch(s => ({
      ...s, customCategories: [...(s.customCategories || []),
        { id: `cat_${Date.now()}`, name, useful, color: '#a29bfe' }]
    })), [patch])

  // ── Repetition ────────────────────────────────────────────
  const addRepetitionCard = useCallback((title, note = '') =>
    patch(s => ({ ...s, repetition: [...s.repetition, createCard(title, note)] })), [patch])

  const reviewCard = useCallback((id) =>
    patch(s => {
      const updated = s.repetition.map(c => c.id === id ? markReviewed(c) : c)
      // Remove completed cards after a short delay (handled in UI)
      return { ...s, repetition: updated }
    }), [patch])

  const deleteRepetitionCard = useCallback((id) =>
    patch(s => ({ ...s, repetition: s.repetition.filter(c => c.id !== id) })), [patch])

  // ── Timer ─────────────────────────────────────────────────
  const addTimerSession = useCallback((session) =>
    patch(s => ({
      ...s, timerSessions: [...(s.timerSessions || []), {
        id: `ts_${Date.now()}`, at: new Date().toISOString(),
        date: toDateStr(new Date()), ...session
      }]
    })), [patch])

  // ── Moods ─────────────────────────────────────────────────
  const setMood = useCallback((dateStr, mood) =>
    patch(s => ({ ...s, moods: { ...s.moods, [dateStr]: mood } })), [patch])

  // ── Export ────────────────────────────────────────────────
  const exportData = useCallback((format = 'json', listId = null) => {
    let content, filename, type
    if (format === 'json') {
      content = JSON.stringify(state, null, 2); filename = 'asido-export.json'; type = 'application/json'
    } else {
      const rows = [['Date', 'List', 'Habit', 'Status']]
      for (const list of state.lists) {
        if (listId && list.id !== listId) continue
        for (const [ds, dayLog] of Object.entries(state.logs[list.id] || {})) {
          for (const [hid, status] of Object.entries(dayLog)) {
            const h = list.habits.find(h => h.id === hid)
            if (h && status) rows.push([ds, list.name, h.name, status])
          }
        }
      }
      content = rows.map(r => r.join(',')).join('\n'); filename = 'asido-export.csv'; type = 'text/csv'
    }
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }, [state])

  return {
    state, syncing,
    setActiveTab, setActiveList, setTheme,
    addList, renameList, deleteList, duplicateList,
    addHabit, updateHabit, deleteHabit, reorderHabits,
    toggleCell, getCellState,
    setJournalSlot, setJournalSlots, clearJournalSlot, addCustomCategory,
    addRepetitionCard, reviewCard, deleteRepetitionCard,
    addTimerSession, setMood, exportData,
  }
}
