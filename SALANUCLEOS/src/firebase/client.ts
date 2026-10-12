import { initializeApp, type FirebaseApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore'

// trim(): valores colados nas variáveis do GitHub podem trazer uma quebra de linha no fim.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

let auth: Auth | null = null
let db: Firestore | null = null

if (isFirebaseConfigured) {
  const app: FirebaseApp = initializeApp(firebaseConfig)
  auth = getAuth(app)
  void setPersistence(auth, browserLocalPersistence)
  // Cache local: a app abre mais depressa e os dados já vistos ficam disponíveis sem Internet.
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
}

export function requireAuth() {
  if (!auth) throw new Error('APP:O Firebase ainda não está configurado.')
  return auth
}

export function requireDb() {
  if (!db) throw new Error('APP:O Firebase ainda não está configurado.')
  return db
}
