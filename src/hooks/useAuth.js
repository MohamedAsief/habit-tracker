import { useState, useEffect } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, provider, db } from '../firebase.js'

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const ref = doc(db, 'users', u.uid, 'profile', 'info')
        const snap = await getDoc(ref)
        setProfile(snap.exists() ? snap.data() : null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = () => signInWithPopup(auth, provider)
  const logout = () => signOut(auth)

  const saveProfile = async (data) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'profile', 'info')
    await setDoc(ref, { ...data, uid: user.uid, email: user.email, updatedAt: new Date().toISOString() })
    setProfile(data)
  }

  return { user, profile, loading, login, logout, saveProfile }
}
