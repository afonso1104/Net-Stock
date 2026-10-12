export function boxUrl(boxId: string) {
  const root = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.href.split('#')[0]).replace(/\/?$/, '/')
  return `${root}#/box/${boxId}`
}

/** Extrai o ID da caixa de um QR gerado pela app (ex.: https://…/#/box/ID). */
export function boxIdFromQr(text: string) {
  return /#\/box\/([^/?#\s]+)/.exec(text)?.[1] ?? null
}
