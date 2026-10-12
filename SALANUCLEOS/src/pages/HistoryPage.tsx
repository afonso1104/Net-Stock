import Download from '@mui/icons-material/Download'
import Search from '@mui/icons-material/Search'
import { Box, Button, Card, CardContent, CircularProgress, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFeedback } from '../components/FeedbackProvider'
import { MovementList } from '../components/MovementList'
import { LIVE_MOVEMENTS, useInventory } from '../features/inventory/InventoryContext'
import { movementLabels, type Movement, type MovementType } from '../models/inventory'
import { fetchAllMovements, fetchMovementsBefore, HISTORY_PAGE_SIZE } from '../services/historyService'
import { downloadCsv } from '../utils/csv'
import { formatDate } from '../utils/dates'
import { friendlyError } from '../utils/errors'
import { normalizeText } from '../utils/text'

const startOfDay = (value: string) => value ? new Date(`${value}T00:00:00`).getTime() : -Infinity
const endOfDay = (value: string) => value ? new Date(`${value}T23:59:59.999`).getTime() : Infinity

export function HistoryPage() {
  const { movements: live, boxes } = useInventory(); const { notify } = useFeedback()
  const [search, setSearch] = useState(''); const [type, setType] = useState('all'); const [box, setBox] = useState('all')
  const [from, setFrom] = useState(''); const [to, setTo] = useState('')
  const [older, setOlder] = useState<Movement[]>([])
  const [exhausted, setExhausted] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Os movimentos recentes chegam em tempo real; os mais antigos são carregados a pedido.
  const all = useMemo(() => { const ids = new Set(live.map((movement) => movement.id)); return [...live, ...older.filter((movement) => !ids.has(movement.id))] }, [live, older])
  const noMore = exhausted || live.length < LIVE_MOVEMENTS
  const oldest = [...all].reverse().find((movement) => movement.createdAt)?.createdAt ?? null

  const matches = useCallback((movement: Movement) => {
    const text = normalizeText(`${movement.materialNameSnapshot} ${movement.person} ${movement.reason} ${movement.note}`)
    const time = movement.createdAt?.toMillis() ?? Date.now()
    return text.includes(normalizeText(search)) && (type === 'all' || movement.type === type) && (box === 'all' || movement.sourceBoxId === box || movement.destinationBoxId === box)
      && time >= startOfDay(from) && time <= endOfDay(to)
  }, [box, from, search, to, type])
  const visible = useMemo(() => all.filter(matches), [all, matches])

  const loadMore = useCallback(async () => {
    if (!oldest) return
    setLoadingMore(true)
    try { const page = await fetchMovementsBefore(oldest); setOlder((current) => [...current, ...page]); if (page.length < HISTORY_PAGE_SIZE) setExhausted(true) } catch (error) { notify(friendlyError(error), 'error') } finally { setLoadingMore(false) }
  }, [notify, oldest])

  // Com uma data «Desde», continua a carregar até chegar a essa data.
  useEffect(() => {
    if (from && !noMore && !loadingMore && oldest && oldest.toMillis() > startOfDay(from)) void loadMore()
  }, [from, loadMore, loadingMore, noMore, oldest])

  async function exportCsv() {
    setExporting(true)
    try {
      const rows = (await fetchAllMovements()).filter(matches)
      downloadCsv(`historico-${new Date().toISOString().slice(0, 10)}.csv`, [
        ['Data', 'Tipo', 'Material', 'Quantidade', 'Variação', 'Origem', 'Destino', 'Pessoa', 'Registado por', 'Motivo', 'Nota'],
        ...rows.map((m) => [formatDate(m.createdAt), movementLabels[m.type], m.materialNameSnapshot, m.quantity, m.delta, m.sourceBoxNameSnapshot, m.destinationBoxNameSnapshot, m.person, m.userEmail, m.reason, m.note]),
      ])
    } catch (error) { notify(friendlyError(error), 'error') } finally { setExporting(false) }
  }

  return <Stack spacing={3} className="page-enter">
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
      <Box><Typography variant="h1">Histórico</Typography><Typography color="text.secondary">{visible.length} de {all.length} movimentos carregados{noMore ? ' (todos)' : ''}</Typography></Box>
      <Button startIcon={exporting ? <CircularProgress size={18} /> : <Download />} onClick={() => void exportCsv()} disabled={exporting}>Exportar para Excel</Button>
    </Stack>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
      <TextField fullWidth placeholder="Pesquisar material, pessoa ou motivo…" value={search} onChange={(e) => setSearch(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }} />
      <TextField select label="Tipo" value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="all">Todos</MenuItem>{(Object.keys(movementLabels) as MovementType[]).map((key) => <MenuItem key={key} value={key}>{movementLabels[key]}</MenuItem>)}</TextField>
      <TextField select label="Caixa" value={box} onChange={(e) => setBox(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="all">Todas</MenuItem>{boxes.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>
    </Stack>
    <Stack direction="row" spacing={1.5}>
      <TextField fullWidth label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField fullWidth label="Até" type="date" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
    </Stack>
    <Card><CardContent><MovementList movements={visible} empty="Nenhum movimento corresponde aos filtros." /></CardContent></Card>
    {!noMore && <Button onClick={() => void loadMore()} disabled={loadingMore} startIcon={loadingMore ? <CircularProgress size={18} /> : undefined}>Carregar movimentos mais antigos</Button>}
  </Stack>
}
