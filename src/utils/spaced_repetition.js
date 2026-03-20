/**
 * ASIDO Spaced Repetition
 * Day 0 = today (topic added)
 * First revision = Day 1 (tomorrow)
 * Schedule: Day 1, 3, 6, 9, 14
 * After 5 revisions → mastered!
 */

export const REVISION_INTERVALS = [1, 3, 6, 9, 14]

export function getNextDueDate(addedDate, revisionCount) {
  if (revisionCount >= REVISION_INTERVALS.length) return null
  const base = new Date(addedDate)
  base.setHours(0, 0, 0, 0)
  base.setDate(base.getDate() + REVISION_INTERVALS[revisionCount])
  return base.toISOString().split('T')[0]
}

export function getDueCards(cards, today = new Date()) {
  const todayStr = today.toISOString().split('T')[0]
  return cards.filter(c =>
    c.nextReview &&
    c.nextReview <= todayStr &&
    (c.revisionCount || 0) < REVISION_INTERVALS.length
  )
}

export function markReviewed(card) {
  const newCount = (card.revisionCount || 0) + 1
  const completed = newCount >= REVISION_INTERVALS.length
  const nextReview = completed ? null : getNextDueDate(card.addedDate, newCount)
  return {
    ...card,
    revisionCount: newCount,
    lastReview: new Date().toISOString().split('T')[0],
    nextReview,
    completed,
    history: [...(card.history || []), {
      date: new Date().toISOString().split('T')[0],
      revision: newCount
    }]
  }
}

export function createCard(title, note = '') {
  const addedDate = new Date().toISOString().split('T')[0]
  // First review is TOMORROW (Day 1), not today
  const nextReview = getNextDueDate(addedDate, 0)
  return {
    id: `sr_${Date.now()}`,
    title,
    note,
    addedDate,
    revisionCount: 0,
    nextReview,
    lastReview: null,
    completed: false,
    history: []
  }
}
