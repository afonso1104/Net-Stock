import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import GroupOutlined from '@mui/icons-material/GroupOutlined'
import HistoryOutlined from '@mui/icons-material/HistoryOutlined'
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import QrCodeScanner from '@mui/icons-material/QrCodeScanner'
import WidgetsOutlined from '@mui/icons-material/WidgetsOutlined'
import { Alert, AppBar, BottomNavigation, BottomNavigationAction, Box, Button, CircularProgress, Container, IconButton, Toolbar, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material'
import { lazy, Suspense, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { useInventory } from '../features/inventory/InventoryContext'

const QrScannerDialog = lazy(() => import('./QrScannerDialog'))

export interface ShellContext { openScanner: () => void }

const items = [
  { label: 'Início', path: '/', icon: <DashboardOutlined /> },
  { label: 'Materiais', path: '/materials', icon: <Inventory2Outlined /> },
  { label: 'Em uso', path: '/in-use', icon: <ArchiveOutlined /> },
  { label: 'Caixas', path: '/boxes', icon: <WidgetsOutlined /> },
  { label: 'Histórico', path: '/history', icon: <HistoryOutlined /> },
]

export function AppShell() {
  const theme = useTheme()
  const mobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { loading, error } = useInventory()
  const [scanning, setScanning] = useState(false)
  const context: ShellContext = { openScanner: () => setScanning(true) }
  const selected = items.find((item) => item.path !== '/' && location.pathname.startsWith(item.path))?.path ?? '/'

  return <Box sx={{ minHeight: '100vh', pb: mobile ? 10 : 3 }}>
    <AppBar position="sticky" color="inherit" elevation={0} className="no-print" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ gap: { xs: 0.5, md: 2 } }}>
        <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mr: 'auto' }}>
          <Box sx={{ width: 34, height: 34, bgcolor: 'primary.main', color: 'white', borderRadius: 2, display: 'grid', placeItems: 'center', fontWeight: 900 }}>S</Box>
          <Box><Typography fontWeight={800} lineHeight={1}>Sala</Typography><Typography variant="caption" color="text.secondary">Inventário</Typography></Box>
        </Box>
        {!mobile && items.map((item) => <Button key={item.path} component={Link} to={item.path} color={selected === item.path ? 'primary' : 'inherit'} startIcon={item.icon}>{item.label}</Button>)}
        <Tooltip title="Ler QR de uma caixa"><IconButton aria-label="Ler QR de uma caixa" color="primary" onClick={() => setScanning(true)}><QrCodeScanner /></IconButton></Tooltip>
        <Tooltip title="Equipa"><IconButton aria-label="Equipa" component={Link} to="/team"><GroupOutlined /></IconButton></Tooltip>
        <Tooltip title="Terminar sessão"><IconButton aria-label="Terminar sessão" onClick={() => void logout()}><LogoutOutlined /></IconButton></Tooltip>
      </Toolbar>
    </AppBar>
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>{error ? <Alert severity="error">{error}</Alert> : loading ? <Box display="grid" sx={{ placeItems: 'center', py: 10 }}><CircularProgress /></Box> : <Outlet context={context} />}</Container>
    {scanning && <Suspense fallback={null}><QrScannerDialog onClose={() => setScanning(false)} /></Suspense>}
    {mobile && <BottomNavigation className="no-print" showLabels value={selected} onChange={(_, value) => navigate(value)} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10, borderTop: '1px solid', borderColor: 'divider' }}>
      {items.map((item) => <BottomNavigationAction key={item.path} value={item.path} label={item.label} icon={item.icon} />)}
    </BottomNavigation>}
  </Box>
}
