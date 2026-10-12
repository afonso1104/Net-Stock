import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { requireDb } from '../firebase/client'

const fail = (message: string): never => { throw new Error(`APP:${message}`) }

export async function addTeamMember(email: string, name: string, admin: boolean, addedBy: string) {
  const id = email.trim().toLowerCase()
  if (!/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(id)) fail('Indica um email válido.')
  return setDoc(doc(requireDb(), 'allowedUsers', id), { name: name.trim(), admin, addedBy, createdAt: serverTimestamp() })
}

export async function setTeamMemberAdmin(email: string, admin: boolean) {
  return updateDoc(doc(requireDb(), 'allowedUsers', email), { admin })
}

export async function removeTeamMember(email: string) {
  return deleteDoc(doc(requireDb(), 'allowedUsers', email))
}
