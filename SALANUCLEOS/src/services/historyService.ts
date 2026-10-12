import { collection, getDocs, limit, orderBy, query, startAfter, type Timestamp } from 'firebase/firestore'
import { requireDb } from '../firebase/client'
import type { Movement } from '../models/inventory'

export const HISTORY_PAGE_SIZE = 200

export async function fetchMovementsBefore(cursor: Timestamp) {
  const snapshot = await getDocs(query(collection(requireDb(), 'movements'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(HISTORY_PAGE_SIZE)))
  return snapshot.docs.map((snap) => ({ id: snap.id, ...snap.data() }) as Movement)
}

export async function fetchAllMovements() {
  const snapshot = await getDocs(query(collection(requireDb(), 'movements'), orderBy('createdAt', 'desc')))
  return snapshot.docs.map((snap) => ({ id: snap.id, ...snap.data() }) as Movement)
}
