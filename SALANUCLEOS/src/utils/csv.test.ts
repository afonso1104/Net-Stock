import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('usa ponto e vírgula, BOM e escapa aspas e separadores', () => {
    expect(toCsv([['Nome', 'Qtd'], ['Fita "larga"; azul', 3]])).toBe('﻿Nome;Qtd\r\n"Fita ""larga""; azul";3')
  })
  it('neutraliza fórmulas em texto mas mantém números negativos', () => {
    expect(toCsv([['=SOMA(A1)', -2]])).toBe("﻿'=SOMA(A1);-2")
  })
})
