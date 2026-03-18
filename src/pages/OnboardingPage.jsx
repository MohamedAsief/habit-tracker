import { useState } from 'react'

const OCCUPATIONS = ['Student', 'Developer', 'Designer', 'Teacher', 'Doctor', 'Engineer', 'Business', 'Other']

export default function OnboardingPage({ user, onComplete }) {
  const [step, setStep] = useState(0)
  const [name, setName]         = useState(user?.displayName?.split(' ')[0] || '')
  const [occupation, setOccupation] = useState('')
  const [goal, setGoal]         = useState('')

  const steps = [
    // Step 0 — Name
    <div key="name" className="flex flex-col gap-4 animate-slide-up">
      <div className="text-center mb-2">
        <div className="text-5xl mb-3">👋</div>
        <h2 className="font-display text-2xl font-black text-main">What's your name?</h2>
        <p className="text-sm text-muted mt-1">We'll personalise your experience</p>
      </div>
      <input value={name} onChange={e => setName(e.target.value)}
        placeholder="Your first name" className="input-field text-center text-lg" autoFocus
        onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(1)} />
      <button onClick={() => setStep(1)} disabled={!name.trim()} className="btn-primary py-4 text-base">
        Continue →
      </button>
    </div>,

    // Step 1 — Occupation
    <div key="occ" className="flex flex-col gap-4 animate-slide-up">
      <div className="text-center mb-2">
        <div className="text-5xl mb-3">🎯</div>
        <h2 className="font-display text-2xl font-black text-main">What do you do?</h2>
        <p className="text-sm text-muted mt-1">Helps us show relevant suggestions</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {OCCUPATIONS.map(o => (
          <button key={o} onClick={() => setOccupation(o)}
            className={`py-3 rounded-xl text-sm font-semibold transition-all ${occupation === o ? 'bg-accent text-white' : 'card-bg text-muted'}`}>
            {o}
          </button>
        ))}
      </div>
      <button onClick={() => setStep(2)} disabled={!occupation} className="btn-primary py-4 text-base mt-2">
        Continue →
      </button>
    </div>,

    // Step 2 — Goal
    <div key="goal" className="flex flex-col gap-4 animate-slide-up">
      <div className="text-center mb-2">
        <div className="text-5xl mb-3">🚀</div>
        <h2 className="font-display text-2xl font-black text-main">Your main goal?</h2>
        <p className="text-sm text-muted mt-1">What do you want to achieve?</p>
      </div>
      <textarea value={goal} onChange={e => setGoal(e.target.value)}
        placeholder="e.g. Study consistently, build good habits, track my time..."
        rows={3} className="input-field resize-none" />
      <button onClick={() => onComplete({ name: name.trim(), occupation, goal, email: user?.email })}
        className="btn-primary py-4 text-base">
        Start using ASIDO 🎉
      </button>
      <button onClick={() => onComplete({ name: name.trim(), occupation, goal: '', email: user?.email })}
        className="text-sm text-muted text-center">Skip for now</button>
    </div>
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)', backgroundSize: '28px 28px', opacity: 0.4 }} />

      <div className="relative z-10 w-full max-w-xs">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0,1,2].map(i => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === step ? '24px' : '8px', background: i <= step ? '#7c6aff' : 'var(--border)' }} />
          ))}
        </div>
        {steps[step]}
      </div>
    </div>
  )
}
