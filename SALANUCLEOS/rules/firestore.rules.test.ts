import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let env: RulesTestEnvironment
const as = (email: string) => env.authenticatedContext(email, { email, email_verified: true }).firestore()

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-inventario', firestore: { rules: readFileSync('firestore.rules', 'utf8') } })
})
afterAll(async () => { await env.cleanup() })
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'allowedUsers', 'admin@x.pt'), { name: 'Admin', admin: true })
    await setDoc(doc(db, 'allowedUsers', 'ana@x.pt'), { name: 'Ana', admin: false })
    await setDoc(doc(db, 'materials', 'm1'), { name: 'Cabo', active: true })
    await setDoc(doc(db, 'boxes', 'b1'), { name: 'Caixa 1', code: 'CX-1', active: true })
  })
})

function stockIn(db: ReturnType<typeof as>, userEmail: string) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'stocks', 'm1__b1'), { materialId: 'm1', boxId: 'b1', quantity: 5, lastOperationId: 'op1' })
  batch.set(doc(db, 'movements', 'op1'), { type: 'stock_in', materialId: 'm1', quantity: 5, person: 'Ana', userEmail })
  return batch.commit()
}

describe('acesso', () => {
  it('conta não autorizada não lê dados mas pode confirmar que não tem acesso', async () => {
    const db = as('intruso@x.pt')
    await assertFails(getDocs(collection(db, 'materials')))
    await assertSucceeds(getDoc(doc(db, 'allowedUsers', 'intruso@x.pt')))
    await assertFails(getDoc(doc(db, 'allowedUsers', 'ana@x.pt')))
  })
  it('sem sessão não lê nada', async () => {
    await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(), 'materials')))
  })
  it('email não verificado é recusado', async () => {
    const db = env.authenticatedContext('ana', { email: 'ana@x.pt', email_verified: false }).firestore()
    await assertFails(getDocs(collection(db, 'materials')))
  })
  it('membro lê dados e a lista da equipa', async () => {
    await assertSucceeds(getDocs(collection(as('ana@x.pt'), 'materials')))
    await assertSucceeds(getDocs(collection(as('ana@x.pt'), 'allowedUsers')))
  })
})

describe('gestão da equipa', () => {
  it('só administradores adicionam pessoas', async () => {
    await assertFails(setDoc(doc(as('ana@x.pt'), 'allowedUsers', 'novo@x.pt'), { name: 'Novo', admin: false }))
    await assertSucceeds(setDoc(doc(as('admin@x.pt'), 'allowedUsers', 'novo@x.pt'), { name: 'Novo', admin: false }))
  })
  it('emails têm de estar em minúsculas', async () => {
    await assertFails(setDoc(doc(as('admin@x.pt'), 'allowedUsers', 'Novo@x.pt'), { name: 'Novo', admin: false }))
  })
  it('administrador não se remove a si próprio', async () => {
    await assertFails(deleteDoc(doc(as('admin@x.pt'), 'allowedUsers', 'admin@x.pt')))
    await assertSucceeds(deleteDoc(doc(as('admin@x.pt'), 'allowedUsers', 'ana@x.pt')))
  })
})

describe('movimentos', () => {
  it('regista movimento com o email de quem o fez', async () => {
    await assertSucceeds(stockIn(as('ana@x.pt'), 'ana@x.pt'))
  })
  it('recusa movimento em nome de outra conta', async () => {
    await assertFails(stockIn(as('ana@x.pt'), 'admin@x.pt'))
  })
  it('movimentos não podem ser apagados', async () => {
    await stockIn(as('ana@x.pt'), 'ana@x.pt')
    await assertFails(deleteDoc(doc(as('admin@x.pt'), 'movements', 'op1')))
  })
})

describe('levantamentos', () => {
  it('retirar e devolver parcialmente', async () => {
    const db = as('ana@x.pt')
    await stockIn(db, 'ana@x.pt')
    const out = writeBatch(db)
    out.set(doc(db, 'stocks', 'm1__b1'), { materialId: 'm1', boxId: 'b1', quantity: 3, lastOperationId: 'op2' })
    out.set(doc(db, 'checkouts', 'c1'), { materialId: 'm1', initialQuantity: 2, pendingQuantity: 2, status: 'open', person: 'Rui', userEmail: 'ana@x.pt' })
    out.set(doc(db, 'movements', 'op2'), { type: 'checkout', materialId: 'm1', quantity: 2, person: 'Rui', userEmail: 'ana@x.pt', checkoutId: 'c1' })
    await assertSucceeds(out.commit())
    const admin = as('admin@x.pt')
    const back = writeBatch(admin)
    back.set(doc(admin, 'stocks', 'm1__b1'), { materialId: 'm1', boxId: 'b1', quantity: 4, lastOperationId: 'op3' })
    back.update(doc(admin, 'checkouts', 'c1'), { pendingQuantity: 1, status: 'open' })
    back.set(doc(admin, 'movements', 'op3'), { type: 'return', materialId: 'm1', quantity: 1, person: 'Admin', userEmail: 'admin@x.pt', checkoutId: 'c1' })
    await assertSucceeds(back.commit())
  })
})
