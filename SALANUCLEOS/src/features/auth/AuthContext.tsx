import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { isFirebaseConfigured, requireAuth, requireDb } from '../../firebase/client'

type Access = 'checking' | 'allowed' | 'denied'

interface AuthContextValue {
  user: User | null
  loading: boolean
  access: Access
  isAdmin: boolean
  email: string
  displayName: string
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const emailOf = (user: User | null) => (user?.email || '').toLowerCase()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [access, setAccess] = useState<Access>('checking')
  const [isAdmin, setIsAdmin] = useState(false)
  const [teamName, setTeamName] = useState('')

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return onAuthStateChanged(requireAuth(), async (nextUser) => {
      setLoading(true)
      setUser(nextUser)
      if (!nextUser) { setAccess('checking'); setIsAdmin(false); setLoading(false); return }
      // A lista de acesso vive em allowedUsers/{email}; cada pessoa só pode ler o seu próprio documento.
      try {
        const snap = await getDoc(doc(requireDb(), 'allowedUsers', emailOf(nextUser)))
        setAccess(snap.exists() ? 'allowed' : 'denied')
        setIsAdmin(snap.exists() && snap.data().admin === true)
        setTeamName(snap.exists() ? String(snap.data().name || '') : '')
      } catch {
        setAccess('denied'); setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    access,
    isAdmin,
    email: emailOf(user),
    displayName: teamName || user?.displayName || emailOf(user),
    login: async () => {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(requireAuth(), provider)
    },
    logout: async () => {
      await signOut(requireAuth())
    },
  }), [access, isAdmin, loading, teamName, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth tem de ser usado dentro de AuthProvider')
  return value
}
