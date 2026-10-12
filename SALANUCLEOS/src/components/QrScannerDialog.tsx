import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import QrScanner from 'qr-scanner'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventory } from '../features/inventory/InventoryContext'
import { boxIdFromQr } from '../utils/boxUrl'

export default function QrScannerDialog({ onClose }: { onClose: () => void }) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [error, setError] = useState('')
  const { boxes } = useInventory()
  const navigate = useNavigate()

  // Guarda a versão mais recente do handler para não reiniciar a câmara a cada render.
  const handleRef = useRef<(text: string) => boolean>(() => false)
  handleRef.current = (text) => {
    const id = boxIdFromQr(text) ?? boxes.find((box) => box.code === text.trim().toUpperCase())?.id
    if (!id || !boxes.some((box) => box.id === id)) { setError('Este QR não corresponde a nenhuma caixa do inventário.'); return false }
    navigate(`/box/${id}`); onClose(); return true
  }

  useEffect(() => {
    if (!video) return
    let done = false
    const scanner = new QrScanner(video, (result) => { if (!done) done = handleRef.current(result.data) }, { preferredCamera: 'environment', highlightScanRegion: true, highlightCodeOutline: true, returnDetailedScanResult: true })
    scanner.start().catch(() => setError('Não foi possível aceder à câmara. Dá permissão à câmara nas definições do browser.'))
    return () => { scanner.stop(); scanner.destroy() }
  }, [video])

  return <Dialog open onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Ler QR de uma caixa</DialogTitle>
    <DialogContent>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: '#000', aspectRatio: '1 / 1' }}>
        <video ref={setVideo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
      </Box>
      <Typography variant="body2" color="text.secondary" mt={1.5}>Aponta a câmara para a etiqueta da caixa.</Typography>
    </DialogContent>
    <DialogActions sx={{ p: 3, pt: 0 }}><Button onClick={onClose}>Fechar</Button></DialogActions>
  </Dialog>
}
