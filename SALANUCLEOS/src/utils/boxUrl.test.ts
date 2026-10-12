import { describe, expect, it } from 'vitest'
import { boxIdFromQr } from './boxUrl'

describe('boxIdFromQr', () => {
  it('extrai o ID de um URL de caixa', () => {
    expect(boxIdFromQr('https://equipa.github.io/Net-Stock/#/box/abc123')).toBe('abc123')
  })
  it('ignora QR que não são de caixas', () => {
    expect(boxIdFromQr('https://exemplo.pt')).toBeNull()
  })
})
