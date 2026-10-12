import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined'
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, Divider, FormControlLabel, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { collection, onSnapshot } from 'firebase/firestore'
import { FormEvent, useEffect, useState } from 'react'
import { useFeedback } from '../components/FeedbackProvider'
import { useAuth } from '../features/auth/AuthContext'
import { requireDb } from '../firebase/client'
import type { TeamMember } from '../models/inventory'
import { addTeamMember, removeTeamMember, setTeamMemberAdmin } from '../services/teamService'
import { friendlyError } from '../utils/errors'

export function TeamPage() {
  const { isAdmin, email: myEmail } = useAuth(); const { notify } = useFeedback()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [admin, setAdmin] = useState(false)
  const [error, setError] = useState(''); const [saving, setSaving] = useState(false)

  useEffect(() => onSnapshot(collection(requireDb(), 'allowedUsers'), (snapshot) => setMembers(snapshot.docs.map((snap) => ({ id: snap.id, ...snap.data() }) as TeamMember).sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, 'pt')))), [])

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    try { await addTeamMember(email, name, admin, myEmail); notify('Pessoa adicionada.'); setEmail(''); setName(''); setAdmin(false) } catch (nextError) { setError(friendlyError(nextError)) } finally { setSaving(false) }
  }
  async function run(action: Promise<void>, message: string) { try { await action; notify(message) } catch (nextError) { notify(friendlyError(nextError), 'error') } }

  return <Stack spacing={3} className="page-enter">
    <Box><Typography variant="h1">Equipa</Typography><Typography color="text.secondary">{members.length} pessoas com acesso</Typography></Box>
    {isAdmin && <Card><CardContent><Stack component="form" onSubmit={submit} spacing={2}>
      <Typography variant="h3">Dar acesso</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField fullWidth label="Email da conta Google" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField fullWidth label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <FormControlLabel control={<Checkbox checked={admin} onChange={(e) => setAdmin(e.target.checked)} />} label="Administrador (pode gerir a equipa)" />
        <Button type="submit" variant="contained" startIcon={<PersonAddOutlined />} disabled={saving}>Adicionar</Button>
      </Stack>
    </Stack></CardContent></Card>}
    <Card><CardContent>{members.map((member, index) => <Box key={member.id}>
      <Stack direction="row" alignItems="center" gap={1} py={1.5}>
        <Box flex={1} minWidth={0}><Stack direction="row" gap={1} alignItems="center"><Typography fontWeight={750} noWrap>{member.name || member.id}</Typography>{member.admin && <Chip size="small" color="primary" label="Admin" />}</Stack><Typography variant="body2" color="text.secondary" noWrap>{member.id}</Typography></Box>
        {isAdmin && member.id !== myEmail && <>
          <Tooltip title={member.admin ? 'Retirar administrador' : 'Tornar administrador'}><IconButton color={member.admin ? 'primary' : 'default'} onClick={() => void run(setTeamMemberAdmin(member.id, !member.admin), 'Permissões atualizadas.')}><AdminPanelSettingsOutlined /></IconButton></Tooltip>
          <Tooltip title="Remover acesso"><IconButton color="error" onClick={() => { if (window.confirm(`Remover o acesso de ${member.name || member.id}?`)) void run(removeTeamMember(member.id), 'Acesso removido.') }}><DeleteOutline /></IconButton></Tooltip>
        </>}
      </Stack>{index < members.length - 1 && <Divider />}
    </Box>)}</CardContent></Card>
  </Stack>
}
