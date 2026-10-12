import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
import { FormEvent, useState } from 'react'
import type { Box, BoxDraft, Material, MaterialDraft } from '../models/inventory'
import { useInventory } from '../features/inventory/InventoryContext'
import { createBox, createMaterial, updateBox, updateMaterial } from '../services/inventoryService'
import { friendlyError } from '../utils/errors'
import { normalizeText } from '../utils/text'
import { useFeedback } from './FeedbackProvider'

type MaterialDialogProps = { open: boolean; material?: Material; onClose: () => void }
type BoxDialogProps = { open: boolean; box?: Box; onClose: () => void }

// Montados só quando abertos, para que o formulário comece sempre com dados atuais.
export function MaterialDialog(props: MaterialDialogProps) { return props.open ? <MaterialForm {...props} /> : null }
export function BoxDialog(props: BoxDialogProps) { return props.open ? <BoxForm {...props} /> : null }

function MaterialForm({ open, material, onClose }: MaterialDialogProps) {
  const { materials } = useInventory()
  const [draft, setDraft] = useState<MaterialDraft>(() => material ? { name: material.name, description: material.description, category: material.category, unit: material.unit, minimumStock: material.minimumStock, notes: material.notes } : { name: '', description: '', category: '', unit: 'unidades', minimumStock: null, notes: '' })
  const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const { notify } = useFeedback()
  async function submit(event: FormEvent) { event.preventDefault(); if (materials.some((item) => item.id !== material?.id && item.normalizedName === normalizeText(draft.name))) { setError('Já existe um material com este nome.'); return } setSaving(true); setError(''); try { if (material) await updateMaterial(material.id, draft); else await createMaterial(draft); notify(material ? 'Material atualizado.' : 'Material criado.'); onClose() } catch (nextError) { setError(friendlyError(nextError)) } finally { setSaving(false) } }
  const update = (field: keyof MaterialDraft, value: string | number | null) => setDraft((current) => ({ ...current, [field]: value }))
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"><form onSubmit={submit}><DialogTitle>{material ? 'Editar material' : 'Novo material'}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
    {error && <Alert severity="error">{error}</Alert>}
    <TextField label="Nome" value={draft.name} onChange={(e) => update('name', e.target.value)} required autoFocus />
    <TextField label="Descrição" value={draft.description} onChange={(e) => update('description', e.target.value)} multiline minRows={2} />
    <TextField label="Categoria" value={draft.category} onChange={(e) => update('category', e.target.value)} />
    <TextField label="Unidade" value={draft.unit} onChange={(e) => update('unit', e.target.value)} required helperText="Ex.: unidades, rolos, caixas" />
    <TextField label="Stock mínimo (opcional)" type="number" value={draft.minimumStock ?? ''} onChange={(e) => update('minimumStock', e.target.value === '' ? null : Number(e.target.value))} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
    <TextField label="Notas" value={draft.notes} onChange={(e) => update('notes', e.target.value)} multiline minRows={2} />
  </Stack></DialogContent><DialogActions sx={{ p: 3 }}><Button onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'A guardar…' : 'Guardar'}</Button></DialogActions></form></Dialog>
}

function BoxForm({ open, box, onClose }: BoxDialogProps) {
  const { boxes } = useInventory()
  const [draft, setDraft] = useState<BoxDraft>(() => box ? { code: box.code, name: box.name, description: box.description, roomLocation: box.roomLocation, notes: box.notes } : { code: '', name: '', description: '', roomLocation: '', notes: '' })
  const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const { notify } = useFeedback()
  async function submit(event: FormEvent) { event.preventDefault(); if (boxes.some((item) => item.id !== box?.id && item.code === draft.code.trim().toUpperCase())) { setError('Já existe uma caixa com este código.'); return } setSaving(true); setError(''); try { if (box) await updateBox(box.id, draft); else await createBox(draft); notify(box ? 'Caixa atualizada.' : 'Caixa criada.'); onClose() } catch (nextError) { setError(friendlyError(nextError)) } finally { setSaving(false) } }
  const update = (field: keyof BoxDraft, value: string) => setDraft((current) => ({ ...current, [field]: value }))
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"><form onSubmit={submit}><DialogTitle>{box ? 'Editar caixa' : 'Nova caixa'}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
    {error && <Alert severity="error">{error}</Alert>}
    <TextField label="Código" value={draft.code} onChange={(e) => update('code', e.target.value)} required helperText="Ex.: CX-04. O QR usa um ID interno independente." />
    <TextField label="Nome" value={draft.name} onChange={(e) => update('name', e.target.value)} required autoFocus />
    <TextField label="Localização na sala" value={draft.roomLocation} onChange={(e) => update('roomLocation', e.target.value)} />
    <TextField label="Descrição" value={draft.description} onChange={(e) => update('description', e.target.value)} multiline minRows={2} />
    <TextField label="Notas" value={draft.notes} onChange={(e) => update('notes', e.target.value)} multiline minRows={2} />
  </Stack></DialogContent><DialogActions sx={{ p: 3 }}><Button onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'A guardar…' : 'Guardar'}</Button></DialogActions></form></Dialog>
}
