export const STORAGE_KEY = 'habit_tracker_v3'
export const LEGACY_KEY  = 'habit_tracker_v2'
export const REVISION_INTERVALS = [1, 3, 6, 9, 14]

// 9 categories — added Neutral
export const BUILTIN_CATEGORIES = [
  { id: 'sleep',     name: 'Sleep',     useful: true,  neutral: false, color: '#54a0ff' },
  { id: 'study',     name: 'Study',     useful: true,  neutral: false, color: '#7c6aff' },
  { id: 'work',      name: 'Work',      useful: true,  neutral: false, color: '#5f27cd' },
  { id: 'workout',   name: 'Workout',   useful: true,  neutral: false, color: '#b8ff6a' },
  { id: 'eating',    name: 'Eating',    useful: false, neutral: true,  color: '#ffa502' },
  { id: 'scrolling', name: 'Scrolling', useful: false, neutral: false, color: '#ff6b4a' },
  { id: 'playing',   name: 'Playing',   useful: false, neutral: true,  color: '#a29bfe' },
  { id: 'idle',      name: 'Idle',      useful: false, neutral: false, color: '#636e72' },
  { id: 'neutral',   name: 'Neutral',   useful: false, neutral: true,  color: '#00b894' },
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
    friends: [],
    challenges: [],
    settings: { activeListId: listId, activeTab: 'home', theme: 'system' },
    profile: null,
  }
}
