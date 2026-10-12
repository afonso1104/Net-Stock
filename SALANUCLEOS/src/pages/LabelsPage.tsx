import Print from '@mui/icons-material/Print'
import { Box, Button, Card, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material'
import { QRCodeSVG } from 'qrcode.react'
import { useMemo, useState } from 'react'
import { useInventory } from '../features/inventory/InventoryContext'
import { boxUrl } from '../utils/boxUrl'

export function LabelsPage() {
  const { boxes } = useInventory()
  const active = useMemo(() => boxes.filter((box) => box.active).sort((a, b) => a.code.localeCompare(b.code, 'pt', { numeric: true })), [boxes])
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const selected = active.filter((box) => !excluded.has(box.id))
  const toggle = (id: string) => setExcluded((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })

  return <Stack spacing={3} className="page-enter">
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} className="no-print">
      <Box><Typography variant="h1">Etiquetas</Typography><Typography color="text.secondary">{selected.length} de {active.length} caixas selecionadas · 3 por linha em A4</Typography></Box>
      <Stack direction="row" gap={1} alignItems="center">
        <Button onClick={() => setExcluded(excluded.size ? new Set() : new Set(active.map((box) => box.id)))}>{excluded.size ? 'Selecionar todas' : 'Limpar seleção'}</Button>
        <Button variant="contained" startIcon={<Print />} onClick={() => window.print()} disabled={!selected.length}>Imprimir</Button>
      </Stack>
    </Stack>
    <Card className="no-print" sx={{ p: 2 }}><Stack direction="row" flexWrap="wrap" columnGap={2}>
      {active.map((box) => <FormControlLabel key={box.id} control={<Checkbox checked={!excluded.has(box.id)} onChange={() => toggle(box.id)} />} label={`${box.code} · ${box.name}`} />)}
      {!active.length && <Typography color="text.secondary">Não existem caixas ativas.</Typography>}
    </Stack></Card>
    <Box className="labels-sheet" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
      {selected.map((box) => <Card key={box.id} className="label" sx={{ p: 2, textAlign: 'center' }}>
        <Typography fontWeight={800} fontSize="1.1rem" noWrap>{box.name}</Typography>
        <Typography color="text.secondary" fontWeight={700}>{box.code}</Typography>
        <Box sx={{ my: 1, display: 'flex', justifyContent: 'center' }}><QRCodeSVG value={boxUrl(box.id)} size={150} level="M" marginSize={1} /></Box>
        <Typography variant="caption" color="text.secondary">{box.roomLocation || 'Gestão de Armazém'}</Typography>
      </Card>)}
    </Box>
  </Stack>
}
