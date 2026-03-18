export const STORAGE_KEY = 'habit_tracker_v3'
export const LEGACY_KEY  = 'habit_tracker_v2'
export const REVISION_INTERVALS = [1, 3, 6, 9, 14]

// Exactly 8 categories as requested
export const BUILTIN_CATEGORIES = [
  { id: 'sleep',     name: 'Sleep',     useful: true,  color: '#54a0ff' },
  { id: 'study',     name: 'Study',     useful: true,  color: '#7c6aff' },
  { id: 'work',      name: 'Work',      useful: true,  color: '#5f27cd' },
  { id: 'workout',   name: 'Workout',   useful: true,  color: '#b8ff6a' },
  { id: 'eating',    name: 'Eating',    useful: true,  color: '#ffa502' },
  { id: 'scrolling', name: 'Scrolling', useful: false, color: '#ff6b4a' },
  { id: 'playing',   name: 'Playing',   useful: false, color: '#a29bfe' },
  { id: 'idle',      name: 'Idle',      useful: false, color: '#636e72' },
]

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
    friends: [],        // { uid, name, code }
    challenges: [],     // { id, title, days, startDate, habits, participants }
    settings: { activeListId: listId, activeTab: 'home', theme: 'system' },
    profile: null,
  }
}
