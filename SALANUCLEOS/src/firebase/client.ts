import { initializeApp, type FirebaseApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
