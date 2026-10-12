export function friendlyError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) return 'O início de sessão foi cancelado.'
  if (code.includes('popup-blocked')) return 'O browser bloqueou a janela de início de sessão. Permite pop-ups para este site e tenta novamente.'
  if (code.includes('unauthorized-domain')) return 'Este endereço não está autorizado no Firebase (Authentication → Settings → Authorized domains).'
  if (code.includes('too-many-requests')) return 'Demasiadas tentativas falhadas. Espera uns minutos e tenta novamente.'
  if (code.includes('network-request-failed') || !navigator.onLine) return 'Sem ligação à Internet. Verifica a ligação e tenta novamente.'
  if (code.includes('permission-denied')) return 'Não foi possível guardar a alteração. Confirma as permissões do projeto.'
  if (error instanceof Error && error.message.startsWith('APP:')) return error.message.slice(4)
  console.error(error)
  return `Não foi possível concluir a operação. Tenta novamente.${code ? ` (código: ${code})` : ''}`
}
