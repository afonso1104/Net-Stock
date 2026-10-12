import Google from '@mui/icons-material/Google'
import LockOutlined from '@mui/icons-material/LockOutlined'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { friendlyError } from '../utils/errors'

export function LoginPage() {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const { login } = useAuth()
  const destination = sessionStorage.getItem('authDestination') || '/'

  // O redirecionamento para o destino é feito pela rota /login assim que o utilizador fica autenticado.
  async function submit() {
    setError(''); setSaving(true)
    try { await login() } catch (nextError) { setError(friendlyError(nextError)) } finally { setSaving(false) }
  }

  return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, background: 'radial-gradient(circle at 10% 10%, #dcebe5, transparent 40%), #f5f4ef' }}>
    <Card sx={{ width: '100%', maxWidth: 430 }}><CardContent sx={{ p: { xs: 3, sm: 5 } }}>
      <Stack spacing={3}>
        <Box sx={{ width: 52, height: 52, bgcolor: 'primary.main', color: 'white', borderRadius: 3, display: 'grid', placeItems: 'center' }}><LockOutlined /></Box>
        <Box><Typography variant="h2">Entrar no inventário</Typography><Typography color="text.secondary" mt={1}>Entra com a tua conta Google. Só contas autorizadas pela equipa têm acesso.</Typography></Box>
        {destination.startsWith('/box/') && <Alert severity="info">Depois de entrar, abriremos diretamente a caixa pedida.</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Button size="large" variant="contained" startIcon={saving ? undefined : <Google />} onClick={() => void submit()} disabled={saving}>{saving ? <CircularProgress size={24} color="inherit" /> : 'Entrar com Google'}</Button>
      </Stack>
    </CardContent></Card>
  </Box>
}
