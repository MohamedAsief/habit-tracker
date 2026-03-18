import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'
import { toast } from '../components/Toast.jsx'

function genCode(uid) {
  return uid.slice(0, 8).toUpperCase()
}

export default function FriendsPage({ user, store }) {
  const { state } = store
  const [myCode] = useState(genCode(user.uid))
  const [friendCode, setFriendCode] = useState('')
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Load friends from Firebase
  useEffect(() => {
    if (!user) return
    const loadFriends = async () => {
      const ref = doc(db, 'users', user.uid, 'profile', 'info')
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = snap.data()
        setFriends(data.friends || [])
      }
    }
    loadFriends()
  }, [user])

  const copyCode = () => {
    navigator.clipboard.writeText(myCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Code copied! Share with your friend 📋')
  }

  const addFriend = async () => {
    if (!friendCode.trim() || friendCode.trim().toUpperCase() === myCode) return
    setLoading(true)
    try {
      // Find user by code (first 8 chars of uid)
      const usersRef = collection(db, 'users')
      const allUsers = await getDocs(usersRef)
      let foundFriend = null

      for (const userDoc of allUsers.docs) {
        if (userDoc.id.slice(0, 8).toUpperCase() === friendCode.trim().toUpperCase()) {
          const profileSnap = await getDoc(doc(db, 'users', userDoc.id, 'profile', 'info'))
          if (profileSnap.exists()) {
            const mainSnap = await getDoc(doc(db, 'users', userDoc.id, 'data', 'main'))
            foundFriend = {
              uid: userDoc.id,
              name: profileSnap.data().name || 'Friend',
              email: profileSnap.data().email || '',
              streak: mainSnap.exists() ? getStreak(mainSnap.data()) : 0,
              code: friendCode.trim().toUpperCase(),
            }
          }
          break
        }
      }

      if (!foundFriend) {
        toast('Friend not found! Check the code 🤔')
        setLoading(false)
        return
      }

      if (friends.find(f => f.uid === foundFriend.uid)) {
        toast('Already your friend! 😄')
        setLoading(false)
        return
      }

      const newFriends = [...friends, foundFriend]
      setFriends(newFriends)

      // Save to Firebase
      const ref = doc(db, 'users', user.uid, 'profile', 'info')
      await setDoc(ref, { friends: newFriends }, { merge: true })

      setFriendCode('')
      toast(`${foundFriend.name} added! 🎉`)
    } catch (e) {
      toast('Error adding friend. Try again!')
    }
    setLoading(false)
  }

  const removeFriend = async (uid) => {
    const newFriends = friends.filter(f => f.uid !== uid)
    setFriends(newFriends)
    const ref = doc(db, 'users', user.uid, 'profile', 'info')
    await setDoc(ref, { friends: newFriends }, { merge: true })
    toast('Friend removed')
  }

  function getStreak(data) {
    if (!data?.logs) return 0
    const today = new Date()
    let streak = 0
    const cursor = new Date(today)
    const allListLogs = Object.values(data.logs || {})
    while (true) {
      const ds = cursor.toISOString().split('T')[0]
      const hasDone = allListLogs.some(ll => Object.values(ll[ds] || {}).some(v => v === 'done'))
      if (hasDone) { streak++; cursor.setDate(cursor.getDate() - 1) } else break
    }
    return streak
  }

  // Sort by streak
  const sorted = [...friends].sort((a, b) => (b.streak || 0) - (a.streak || 0))
  const myStreak = getStreak(state)

  return (
    <div className="flex flex-col min-h-screen bg-base">
      <div className="sticky top-0 z-20 glass border-b border-theme px-4 pt-safe py-3">
        <h1 className="font-display text-xl font-black text-main">Friends</h1>
        <p className="text-xs text-muted">Private leaderboard with invited friends</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* My code */}
        <div className="card-bg rounded-2xl p-5 mb-4">
          <p className="text-xs text-muted font-mono uppercase tracking-widest mb-3">Your Invite Code</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 font-mono text-3xl font-black text-accent tracking-widest text-center py-3 rounded-xl"
              style={{ background: '#7c6aff15', border: '2px dashed #7c6aff44' }}>
              {myCode}
            </div>
            <button onClick={copyCode}
              className="px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{ background: copied ? '#b8ff6a' : '#7c6aff', color: '#fff' }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-muted text-center mt-2">Share this code with friends to connect</p>
        </div>

        {/* Add friend */}
        <div className="card-bg rounded-2xl p-4 mb-4">
          <p className="text-xs text-muted font-mono uppercase tracking-widest mb-3">Add Friend</p>
          <div className="flex gap-2">
            <input value={friendCode} onChange={e => setFriendCode(e.target.value.toUpperCase())}
              placeholder="Enter friend's code" maxLength={8}
              className="input-field flex-1 font-mono uppercase tracking-widest"
              onKeyDown={e => e.key === 'Enter' && addFriend()}
              aria-label="Friend code" />
            <button onClick={addFriend} disabled={!friendCode.trim() || loading}
              className="btn-primary px-4 shrink-0">
              {loading ? '...' : 'Add'}
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-2">
          <p className="text-xs text-muted font-mono uppercase tracking-widest mb-3">🏆 Streak Leaderboard</p>

          {/* Me */}
          <div className="rounded-2xl px-4 py-3 mb-2 flex items-center gap-3"
            style={{ background: '#7c6aff22', border: '2px solid #7c6aff55' }}>
            <span className="font-bold text-lg w-6 text-center text-accent">
              {[...sorted, { uid: user.uid, streak: myStreak }]
                .sort((a,b) => (b.streak||0)-(a.streak||0))
                .findIndex(f => f.uid === user.uid) + 1}
            </span>
            {user.photoURL
              ? <img src={user.photoURL} className="w-9 h-9 rounded-xl" alt="you"/>
              : <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-sm">
                  {(state.profile?.name || 'Y')[0]}
                </div>
            }
            <div className="flex-1">
              <p className="font-semibold text-sm text-main">You</p>
              <p className="text-xs text-muted">{user.email?.split('@')[0]}</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-black text-xl text-lime">{myStreak}</p>
              <p className="text-[10px] text-muted">day streak</p>
            </div>
          </div>

          {sorted.map((f, i) => (
            <div key={f.uid} className="card-bg rounded-xl px-4 py-3 mb-2 flex items-center gap-3">
              <span className="font-bold text-base w-6 text-center text-muted">{i + 1}</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: '#7c6aff' }}>
                {f.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-main truncate">{f.name}</p>
                <p className="text-[10px] text-muted font-mono">{f.code}</p>
              </div>
              <div className="text-right mr-2">
                <p className="font-mono font-black text-lg text-accent">{f.streak || 0}</p>
                <p className="text-[10px] text-muted">streak</p>
              </div>
              <button onClick={() => removeFriend(f.uid)}
                className="text-muted hover:text-ember transition-colors p-1" aria-label="Remove friend">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ))}

          {friends.length === 0 && (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">👥</div>
              <p className="font-display text-lg font-bold text-main">No friends yet</p>
              <p className="text-sm text-muted mt-1">Share your code to connect!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
