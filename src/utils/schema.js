export const STORAGE_KEY = 'habit_tracker_v3'
export const LEGACY_KEY  = 'habit_tracker_v2'
export const REVISION_INTERVALS = [1, 3, 6, 9, 14]

// 3 parent categories with sub-items
export const BUILTIN_CATEGORIES = [
  {
    id: 'productive', name: 'Productive', emoji: '⚡',
    color: '#26de81', type: 'productive',
    subs: [
      { id: 'work',     name: 'Work' },
      { id: 'study',    name: 'Study' },
      { id: 'exercise', name: 'Exercise' },
    ]
  },
  {
    id: 'recharge', name: 'Recharge', emoji: '🔋',
    color: '#54a0ff', type: 'recharge',
    subs: [
      { id: 'sleep',    name: 'Sleep' },
      { id: 'hygiene',  name: 'Hygiene' },
      { id: 'eating',   name: 'Eating' },
      { id: 'selfcare', name: 'Selfcare' },
      { id: 'travel',   name: 'Travel' },
      { id: 'playing',  name: 'Playing' },
    ]
  },
  {
    id: 'distracted', name: 'Distracted', emoji: '📵',
    color: '#ff6b4a', type: 'distracted',
    subs: [
      { id: 'scrolling', name: 'Scrolling' },
      { id: 'idle',      name: 'Idle' },
      { id: 'nothing',   name: 'Nothing' },
    ]
  },
]

// Flat lookup helper
export function getAllSubCats(customCategories = []) {
  const all = []
  for (const cat of BUILTIN_CATEGORIES) {
    for (const sub of cat.subs) {
      all.push({ ...sub, parentId: cat.id, color: cat.color, type: cat.type })
    }
  }
  for (const c of customCategories) all.push(c)
  return all
}

export function getCatColor(catId, customCategories = []) {
  const all = getAllSubCats(customCategories)
  return all.find(c => c.id === catId)?.color || '#8b8b9e'
}

export function getCatName(catId, customCategories = []) {
  const all = getAllSubCats(customCategories)
  return all.find(c => c.id === catId)?.name || catId
}

export function getCatType(catId, customCategories = []) {
  const all = getAllSubCats(customCategories)
  return all.find(c => c.id === catId)?.type || 'distracted'
}

export function makeDefaultState() {
  const listId = 'list_default'
  return {
    lists: [{ id: listId, name: 'Default', order: 0, habits: [] }],
    logs: { [listId]: {} },
    journal: {},
    repetition: [],
    timerSessions: [],
    moods: {},
    customCategories: [],
    friends: [],
    challenges: [],
    settings: { activeListId: listId, activeTab: 'home', theme: 'system' },
    profile: null,
  }
}
