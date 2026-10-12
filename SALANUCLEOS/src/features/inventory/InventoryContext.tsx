import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { collection, limit, onSnapshot, orderBy, query, type DocumentData, type FirestoreError, type QueryDocumentSnapshot } from 'firebase/firestore'
import { requireDb } from '../../firebase/client'
import type { Box, Checkout, Material, Movement, Stock } from '../../models/inventory'
import { useAuth } from '../auth/AuthContext'

interface InventoryContextValue {
  materials: Material[]
  boxes: Box[]
  stocks: Stock[]
  checkouts: Checkout[]
  movements: Movement[]
  loading: boolean
  error: string
  stockFor: (materialId: string, boxId?: string) => number
  inUseFor: (materialId: string) => number
}

/** Número de movimentos recentes mantidos em tempo real; o histórico carrega os restantes a pedido. */
export const LIVE_MOVEMENTS = 100

const InventoryContext = createContext<InventoryContextValue | null>(null)
const mapDoc = <T,>(snap: QueryDocumentSnapshot<DocumentData>) => ({ id: snap.id, ...snap.data() }) as T

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [checkouts, setCheckouts] = useState<Checkout[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [ready, setReady] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const db = requireDb()
    const onError = (nextError: FirestoreError) => setError(nextError.code === 'permission-denied'
      ? 'Sem permissão para ler os dados. Confirma que o UID da conta partilhada está correto em firestore.rules e que as regras foram publicadas.'
      : 'Não foi possível carregar os dados. Verifica a ligação e recarrega a página.')
    const subscriptions = [
      onSnapshot(collection(db, 'materials'), (snapshot) => { setMaterials(snapshot.docs.map(mapDoc<Material>)); setReady((value) => value | 1) }, onError),
      onSnapshot(collection(db, 'boxes'), (snapshot) => { setBoxes(snapshot.docs.map(mapDoc<Box>)); setReady((value) => value | 2) }, onError),
      onSnapshot(collection(db, 'stocks'), (snapshot) => { setStocks(snapshot.docs.map(mapDoc<Stock>)); setReady((value) => value | 4) }, onError),
      onSnapshot(collection(db, 'checkouts'), (snapshot) => { setCheckouts(snapshot.docs.map(mapDoc<Checkout>)); setReady((value) => value | 8) }, onError),
      onSnapshot(query(collection(db, 'movements'), orderBy('createdAt', 'desc'), limit(LIVE_MOVEMENTS)), (snapshot) => { setMovements(snapshot.docs.map(mapDoc<Movement>)); setReady((value) => value | 16) }, onError),
    ]
    return () => subscriptions.forEach((unsubscribe) => unsubscribe())
  }, [user])

  const value = useMemo<InventoryContextValue>(() => ({
    materials,
    boxes,
    stocks,
    checkouts,
    movements,
    loading: Boolean(user) && ready !== 31,
    error,
    stockFor: (materialId, boxId) => stocks.filter((stock) => stock.materialId === materialId && (!boxId || stock.boxId === boxId)).reduce((sum, stock) => sum + stock.quantity, 0),
    inUseFor: (materialId) => checkouts.filter((checkout) => checkout.materialId === materialId && checkout.status === 'open').reduce((sum, checkout) => sum + checkout.pendingQuantity, 0),
  }), [boxes, checkouts, error, materials, movements, ready, stocks, user])

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory() {
  const value = useContext(InventoryContext)
  if (!value) throw new Error('useInventory tem de ser usado dentro de InventoryProvider')
  return value
}
