/**
 * Tests for localStorage migration v2 → v3
 * Run: npm test
 */

// Mock localStorage
const store = {}
global.localStorage = {
  getItem: k => store[k] ?? null,
  setItem: (k, v) => { store[k] = v },
  removeItem: k => { delete store[k] },
}
global.console = { ...console, log: () => {} }

// Dynamic import after mocking
let runMigration, STORAGE_KEY, LEGACY_KEY

beforeAll(async () => {
  const schema = await import('../utils/schema.js')
  const migrate = await import('../utils/migrate.js')
  STORAGE_KEY = schema.STORAGE_KEY
  LEGACY_KEY  = schema.LEGACY_KEY
  runMigration = migrate.runMigration
})

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k])
})

test('no-op if v3 data already exists', () => {
  store[STORAGE_KEY] = '{"lists":[]}'
  const result = runMigration()
  expect(result).toBeNull()
})

test('no-op if no legacy data exists', () => {
  const result = runMigration()
  expect(result).toBeNull()
})

test('migrates v2 habits to first list', () => {
  store[LEGACY_KEY] = JSON.stringify({
    habits: [{ id: 'h1', name: 'Exercise', emoji: '💪', color: '#7c6aff', createdAt: '2024-01-01T00:00:00Z' }],
    logs: { '2024-01-01': { h1: 'done' } },
  })
  const backupKey = runMigration()
  expect(backupKey).toMatch(/^habit_backup_\d+$/)
  const v3 = JSON.parse(store[STORAGE_KEY])
  expect(v3.lists).toHaveLength(1)
  expect(v3.lists[0].habits).toHaveLength(1)
  expect(v3.lists[0].habits[0].name).toBe('Exercise')
})

test('migrated logs are nested under listId', () => {
  store[LEGACY_KEY] = JSON.stringify({
    habits: [{ id: 'h1', name: 'Read' }],
    logs: { '2024-03-01': { h1: 'done' } },
  })
  runMigration()
  const v3 = JSON.parse(store[STORAGE_KEY])
  const listId = v3.lists[0].id
  expect(v3.logs[listId]['2024-03-01']['h1']).toBe('done')
})

test('creates backup of old data', () => {
  store[LEGACY_KEY] = JSON.stringify({ habits: [], logs: {} })
  const backupKey = runMigration()
  expect(store[backupKey]).toBeDefined()
  const backup = JSON.parse(store[backupKey])
  expect(backup.habits).toEqual([])
})

test('migrates moods from v2', () => {
  store[LEGACY_KEY] = JSON.stringify({
    habits: [],
    logs: {},
    moods: { '2024-01-01': '😊' },
  })
  runMigration()
  const v3 = JSON.parse(store[STORAGE_KEY])
  expect(v3.moods['2024-01-01']).toBe('😊')
})

test('handles malformed legacy JSON gracefully', () => {
  store[LEGACY_KEY] = 'NOT_VALID_JSON'
  expect(() => runMigration()).not.toThrow()
})
