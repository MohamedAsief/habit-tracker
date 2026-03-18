/**
 * Migration: v2 → v3
 * Backs up old data to habit_backup_<timestamp> before migrating.
 */
import { STORAGE_KEY, LEGACY_KEY, makeDefaultState } from './schema.js'

export function runMigration() {
  // Already on v3
  if (localStorage.getItem(STORAGE_KEY)) return null

  const legacy = localStorage.getItem(LEGACY_KEY)
  if (!legacy) return null

  let old
  try { old = JSON.parse(legacy) } catch { return null }

  // Backup
  const backupKey = `habit_backup_${Date.now()}`
  localStorage.setItem(backupKey, legacy)

  const state = makeDefaultState()
  const listId = state.lists[0].id

  // Migrate habits
  if (Array.isArray(old.habits)) {
    state.lists[0].habits = old.habits.map((h, i) => ({
      id: h.id || `h_${i}`,
      name: h.name || 'Unnamed',
      emoji: h.emoji || '⭐',
      color: h.color || '#7c6aff',
      order: i,
      createdAt: h.createdAt || new Date().toISOString()
    }))
  }

  // Migrate logs → nested under listId
  if (old.logs && typeof old.logs === 'object') {
    state.logs[listId] = old.logs
  }

  // Migrate moods
  if (old.moods) state.moods = old.moods

  // Migrate notes → journal text
  if (old.notes && typeof old.notes === 'object') {
    for (const [date, text] of Object.entries(old.notes)) {
      state.journal[date] = state.journal[date] || {}
      state.journal[date]['note'] = { category: 'other', note: text }
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  console.log(`[Migration] v2→v3 complete. Backup: ${backupKey}`)
  return backupKey
}
