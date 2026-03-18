/**
 * Tests for SM-2 Spaced Repetition Algorithm
 * Run: npm test
 */
import { sm2, getDueCards, getUpcomingCards } from '../utils/spaced_repetition.js'

const base = { easeFactor: 2.5, interval: 0, repetitions: 0 }

test('first perfect review → interval 1, rep 1', () => {
  const r = sm2(base, 5)
  expect(r.interval).toBe(1)
  expect(r.repetitions).toBe(1)
  expect(r.easeFactor).toBeGreaterThanOrEqual(2.5)
})

test('second perfect review → interval 3', () => {
  const r = sm2(sm2(base, 5), 5)
  expect(r.interval).toBe(3)
  expect(r.repetitions).toBe(2)
})

test('third review interval = round(3 * easeFactor)', () => {
  const a = sm2(base, 5), b = sm2(a, 5), c = sm2(b, 5)
  expect(c.interval).toBe(Math.round(3 * b.easeFactor))
})

test('quality < 3 resets repetitions and interval to 1', () => {
  const deep = sm2(sm2(sm2(base, 5), 5), 5)
  const r = sm2(deep, 1)
  expect(r.repetitions).toBe(0)
  expect(r.interval).toBe(1)
})

test('easeFactor never drops below 1.3', () => {
  let c = base
  for (let i = 0; i < 20; i++) c = sm2(c, 0)
  expect(c.easeFactor).toBeGreaterThanOrEqual(1.3)
})

test('nextReview is a valid future YYYY-MM-DD string', () => {
  const r = sm2(base, 5)
  expect(r.nextReview).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  const reviewDate = new Date(r.nextReview)
  const today = new Date(); today.setHours(0,0,0,0)
  expect(reviewDate >= today).toBe(true)
})

test('getDueCards returns cards with nextReview <= today or null', () => {
  const today = new Date()
  const yest = new Date(today); yest.setDate(today.getDate() - 1)
  const tom  = new Date(today); tom.setDate(today.getDate() + 1)
  const cards = [
    { id: '1', nextReview: yest.toISOString().split('T')[0] },
    { id: '2', nextReview: today.toISOString().split('T')[0] },
    { id: '3', nextReview: tom.toISOString().split('T')[0] },
    { id: '4', nextReview: null },
  ]
  const due = getDueCards(cards, today)
  expect(due.map(c => c.id).sort()).toEqual(['1', '2', '4'])
})

test('getUpcomingCards returns cards due within N days, excluding today', () => {
  const today = new Date()
  const in3  = new Date(today); in3.setDate(today.getDate() + 3)
  const in10 = new Date(today); in10.setDate(today.getDate() + 10)
  const cards = [
    { id: 'a', nextReview: in3.toISOString().split('T')[0] },
    { id: 'b', nextReview: in10.toISOString().split('T')[0] },
  ]
  const upcoming = getUpcomingCards(cards, 7, today)
  expect(upcoming.map(c => c.id)).toEqual(['a'])
})
