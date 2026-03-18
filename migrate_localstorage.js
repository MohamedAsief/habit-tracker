/**
 * migrate_localstorage.js
 * ─────────────────────────────────────────────────────────────
 * Standalone migration script — run in browser console OR
 * inject into a page via bookmarklet.
 *
 * Usage in browser console:
 *   1. Open https://asi-habit-tracker.vercel.app
 *   2. Open DevTools → Console
 *   3. Paste the entire contents of this file and press Enter
 *   4. Check console output for results
 *
 * Rollback:
 *   const backup = JSON.parse(localStorage.getItem('habit_backup_<timestamp>'))
 *   localStorage.setItem('habit_tracker_v2', JSON.stringify(backup))
 *   localStorage.removeItem('habit_tracker_v3')
 *   location.reload()
 */
;(function migrate() {
  const V2_KEY = 'habit_tracker_v2'
  const V3_KEY = 'habit_tracker_v3'

  // Already migrated
  if (localStorage.getItem(V3_KEY)) {
    console.log('[migrate] Already on v3 — nothing to do.')
    return
  }

  const raw = localStorage.getItem(V2_KEY)
  if (!raw) {
    console.log('[migrate] No v2 data found — nothing to migrate.')
    return
  }

  let old
  try { old = JSON.parse(raw) }
  catch (e) { console.error('[migrate] Could not parse v2 data:', e); return }

  // Backup
  const backupKey = `habit_backup_${Date.now()}`
  localStorage.setItem(backupKey, raw)
  console.log(`[migrate] Backup saved to: ${backupKey}`)

  // Build v3 state
  const listId = 'list_default'
  const v3 = {
    lists: [{
      id: listId,
      name: 'Default',
      order: 0,
      habits: (old.habits || []).map((h, i) => ({
        id: h.id || `h_${i}`,
        name: h.name || 'Unnamed',
        emoji: h.emoji || '⭐',
        color: h.color || '#7c6aff',
        order: i,
        createdAt: h.createdAt || new Date().toISOString(),
      }))
    }],
    logs: { [listId]: old.logs || {} },
    journal: {},
    repetition: [],
    timerSessions: [],
    moods: old.moods || {},
    customCategories: [],
    settings: { activeListId: listId, activeTab: 'home', theme: 'system' }
  }

  // Migrate notes → journal
  if (old.notes) {
    for (const [date, text] of Object.entries(old.notes)) {
      v3.journal[date] = v3.journal[date] || {}
      v3.journal[date]['note'] = { category: 'other', note: String(text) }
    }
  }

  localStorage.setItem(V3_KEY, JSON.stringify(v3))
  console.log('[migrate] ✅ Migration v2 → v3 complete!')
  console.log('[migrate] Lists:', v3.lists.length, '| Habits:', v3.lists[0].habits.length)
  console.log('[migrate] Reload the page to see your data.')
  return backupKey
})()
