import BlockOutlined from '@mui/icons-material/BlockOutlined'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { useAuth } from '../features/auth/AuthContext'

export function AccessDeniedPage() {
  const { email, logout } = useAuth()
  return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
    <Card sx={{ width: '100%', maxWidth: 460 }}><CardContent sx={{ p: { xs: 3, sm: 5 } }}><Stack spacing={2.5}>
      <Box sx={{ width: 52, height: 52, bgcolor: 'error.main', color: 'white', borderRadius: 3, display: 'grid', placeItems: 'center' }}><BlockOutlined /></Box>
      <Typography variant="h2">Sem acesso</Typography>
      <Typography color="text.secondary">A conta <strong>{email}</strong> ainda não está autorizada. Pede a um administrador da equipa para a adicionar na página Equipa.</Typography>
      <Button variant="contained" onClick={() => void logout()}>Entrar com outra conta</Button>
    </Stack></CardContent></Card>
  </Box>
}
