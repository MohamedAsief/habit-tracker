# Habit Tracker v2.0

A polished PWA for habit tracking, journaling, spaced repetition revision, and focus timing.

## Stack
- React 18 + functional hooks
- Tailwind CSS v3
- Vite 5 + vite-plugin-pwa
- localStorage (no backend needed)

---

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Dev server → http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm test           # Run unit tests (SR algorithm + migration)
```

---

## Features

### Home
- Multiple habit lists (tabs) — create, rename, duplicate, delete via 3-dot menu
- Weekly grid — tap cell to cycle: empty → ✓ done → ✕ missed → empty
- Drag rows to reorder habits
- Per-habit streak counter + emoji/color
- Month navigation via ← → arrows in header

### Journal
- Half-hour slot planner (00:00 → 23:30)
- Assign categories: Study, Workout, Selfcare, Meeting, Work, Focus, Eating, Wasted, Idle, Other
- Add custom categories (mark as useful or wasted)
- Useful vs Wasted hours computed automatically
- Export CSV per day

### Revision (Spaced Repetition)
- SM-2 algorithm (Wozniak, 1987 — based on Ebbinghaus forgetting curve)
- Add cards with title, note, difficulty
- Rate recalls 1–5; next review date auto-scheduled
- Today's due list + upcoming 7-day view
- Flip-card review UI

### Daily Timer
- Start / Pause / Stop
- Lap recording with labels
- Sessions logged per day
- History in Report screen

### Report
- Segmented: List / Timer / Journal
- Weekly / Monthly toggle
- Streak hero, progress rings, habit leaderboard
- Day-bar chart for timer
- Useful vs wasted pie bar for journal
- CSV export per view

### Theme
- Dark / Light / System (auto follows OS preference)
- Toggle via 🌙/☀️/⚙️ button top-right

---

## Migration from v1

If you have data in `habit_tracker_v2` (old format), it migrates automatically on first load.

**Manual migration via browser console:**
1. Open your deployed app
2. Open DevTools → Console
3. Paste contents of `migrate_localstorage.js` and press Enter

**Rollback:**
```js
// In browser console:
const ts = '<timestamp from backup key>'
const backup = localStorage.getItem(`habit_backup_${ts}`)
localStorage.setItem('habit_tracker_v2', backup)
localStorage.removeItem('habit_tracker_v3')
location.reload()
```

---

## Vercel Deployment Checklist

- [ ] Push to GitHub
- [ ] Import repo on vercel.com (auto-detects Vite)
- [ ] No environment variables required
- [ ] `vercel.json` handles SPA routing + service worker headers
- [ ] PWA icons in `public/` folder (`pwa-192x192.png`, `pwa-512x512.png`, `favicon.svg`)
- [ ] After deploy, test: open app on mobile → "Add to Home Screen"

---

## Testing

```bash
npm test
```

Tests cover:
- SM-2 algorithm correctness (8 cases)
- Migration v2→v3 (6 cases): habits, logs, moods, backup, malformed JSON
