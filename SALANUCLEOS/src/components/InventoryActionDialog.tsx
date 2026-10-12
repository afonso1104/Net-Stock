import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { FormEvent, useMemo, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { useInventory } from '../features/inventory/InventoryContext'
import type { Checkout } from '../models/inventory'
import { addStock, checkoutStock, correctStock, returnCheckout, transferStock, writeOffCheckout, writeOffStock } from '../services/inventoryService'
import { friendlyError } from '../utils/errors'
import { useFeedback } from './FeedbackProvider'

export type InventoryAction = 'add' | 'checkout' | 'transfer' | 'writeoff' | 'correct' | 'return' | 'writeoffCheckout'

const config: Record<InventoryAction, { title: string; submit: string; success: string; destructive?: boolean }> = {
  add: { title: 'Adicionar stock', submit: 'Adicionar', success: 'Stock adicionado com sucesso.' },
  checkout: { title: 'Retirar material', submit: 'Retirar', success: 'Material retirado com sucesso.' },
  transfer: { title: 'Transferir material', submit: 'Transferir', success: 'Material transferido com sucesso.' },
  writeoff: { title: 'Dar baixa em armazém', submit: 'Dar baixa', success: 'Unidades dadas como baixa.', destructive: true },
  correct: { title: 'Corrigir quantidade', submit: 'Corrigir', success: 'Quantidade corrigida com sucesso.' },
  return: { title: 'Devolver material', submit: 'Devolver', success: 'Material devolvido com sucesso.' },
  writeoffCheckout: { title: 'Dar baixa em uso', submit: 'Dar baixa', success: 'Unidades pendentes dadas como baixa.', destructive: true },
}

interface Props {
  open: boolean
  action: InventoryAction
  materialId: string
  sourceBoxId?: string
  destinationBoxId?: string
  checkout?: Checkout
  onClose: () => void
}

export function InventoryActionDialog({ open, action, materialId, sourceBoxId = '', destinationBoxId = '', checkout, onClose }: Props) {
  const { materials, boxes, stockFor } = useInventory()
  const { notify } = useFeedback()
  const { displayName, email } = useAuth()
  const [materialChoice, setMaterialChoice] = useState(checkout?.materialId || materialId)
  const [quantity, setQuantity] = useState('1')
  const [newQuantity, setNewQuantity] = useState(() => String(sourceBoxId ? stockFor(materialChoice, sourceBoxId) : ''))
  const [source, setSource] = useState(sourceBoxId)
  const [destination, setDestination] = useState(() => destinationBoxId || (checkout && boxes.some((box) => box.id === checkout.sourceBoxId && box.active) ? checkout.sourceBoxId : ''))
  const [person, setPerson] = useState(displayName)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const details = config[action]
  const material = materials.find((item) => item.id === materialChoice)
  const availableBoxes = useMemo(() => boxes.filter((box) => box.active).sort((a, b) => a.name.localeCompare(b.name, 'pt')), [boxes])
  const activeMaterials = useMemo(() => materials.filter((item) => item.active).sort((a, b) => a.name.localeCompare(b.name, 'pt')), [materials])

  const needsSource = ['checkout', 'transfer', 'writeoff', 'correct'].includes(action)
  const needsDestination = ['add', 'transfer', 'return'].includes(action)
  const needsReason = ['checkout', 'writeoff', 'writeoffCheckout', 'correct'].includes(action)
  // Para retirar, transferir ou dar baixa só faz sentido escolher caixas que tenham este material.
  const sourceBoxes = action === 'correct' ? availableBoxes : availableBoxes.filter((box) => box.id === source || stockFor(materialChoice, box.id) > 0)

  function chooseSource(boxId: string) {
    setSource(boxId)
    if (action === 'correct') setNewQuantity(String(stockFor(materialChoice, boxId)))
  }

  function chooseMaterial(id: string) {
    setMaterialChoice(id)
    if (!sourceBoxId) setSource('')
    else if (action === 'correct') setNewQuantity(String(stockFor(id, sourceBoxId)))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!confirming) { setConfirming(true); return }
    setSaving(true); setError('')
    const input = {
      materialId: materialChoice,
      quantity: Number(quantity), sourceBoxId: source || undefined, destinationBoxId: destination || undefined,
      checkoutId: checkout?.id, person: action === 'checkout' ? person : displayName, userEmail: email, reason, note, newQuantity: Number(newQuantity),
    }
    try {
      if (action === 'add') await addStock(input)
      if (action === 'checkout') await checkoutStock(input)
      if (action === 'transfer') await transferStock(input)
      if (action === 'writeoff') await writeOffStock(input)
      if (action === 'correct') await correctStock(input)
      if (action === 'return') await returnCheckout(input)
      if (action === 'writeoffCheckout') await writeOffCheckout(input)
      notify(details.success); onClose()
      setQuantity('1'); setReason(''); setNote(''); setConfirming(false)
    } catch (nextError) { setError(friendlyError(nextError)); setConfirming(false) } finally { setSaving(false) }
  }

  const displayQuantity = action === 'correct' ? newQuantity : quantity
  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
    <form onSubmit={submit}>
      <DialogTitle>{details.title}</DialogTitle>
      <DialogContent><Stack spacing={2.2} sx={{ pt: 1 }}>
        {(materialId || checkout) && <Typography color="text.secondary">{material?.name || checkout?.materialNameSnapshot}</Typography>}
        {checkout && <Alert severity="info">{checkout.pendingQuantity} de {checkout.initialQuantity} unidades ainda pendentes.</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {confirming && <Alert severity={details.destructive ? 'warning' : 'info'}>Confirmar: {details.submit.toLowerCase()} <strong>{displayQuantity}</strong> {material?.unit || 'unidades'}{source ? ` da ${boxes.find((box) => box.id === source)?.name}` : ''}{destination ? ` para ${boxes.find((box) => box.id === destination)?.name}` : ''}?</Alert>}
        {!confirming && <>
          {!materialId && !checkout && <TextField select label="Material" value={materialChoice} onChange={(event) => chooseMaterial(event.target.value)} required>{activeMaterials.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>}
          {action === 'correct' ? <TextField label="Nova quantidade real" type="number" value={newQuantity} onChange={(event) => setNewQuantity(event.target.value)} slotProps={{ htmlInput: { min: 0, step: 1 } }} required /> : <TextField label="Quantidade" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} slotProps={{ htmlInput: { min: 1, step: 1, max: checkout?.pendingQuantity } }} required />}
          {needsSource && <TextField select label="Caixa de origem" value={source} onChange={(event) => chooseSource(event.target.value)} required disabled={Boolean(sourceBoxId)} helperText={!sourceBoxes.length && materialChoice ? 'Não há stock deste material em nenhuma caixa.' : undefined}>{sourceBoxes.map((box) => <MenuItem key={box.id} value={box.id}>{box.name} · {stockFor(materialChoice, box.id)}</MenuItem>)}</TextField>}
          {needsDestination && <TextField select label="Caixa de destino" value={destination} onChange={(event) => setDestination(event.target.value)} required disabled={Boolean(destinationBoxId)}>{availableBoxes.filter((box) => box.id !== source).map((box) => <MenuItem key={box.id} value={box.id}>{box.name}</MenuItem>)}</TextField>}
          {action === 'checkout' && <TextField label="Quem fica com o material?" value={person} onChange={(event) => setPerson(event.target.value)} required />}
          {needsReason && <TextField label={action === 'checkout' ? 'Motivo / evento' : 'Motivo'} value={reason} onChange={(event) => setReason(event.target.value)} required />}
          <TextField label="Nota (opcional)" value={note} onChange={(event) => setNote(event.target.value)} multiline minRows={2} />
        </>}
      </Stack></DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={confirming ? () => setConfirming(false) : onClose} disabled={saving}>{confirming ? 'Voltar' : 'Cancelar'}</Button>
        <Button type="submit" variant="contained" color={details.destructive ? 'error' : 'primary'} disabled={saving}>{saving ? 'A guardar…' : confirming ? `Confirmar ${details.submit.toLowerCase()}` : details.submit}</Button>
      </DialogActions>
    </form>
  </Dialog>
}
