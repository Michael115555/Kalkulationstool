import { describe, expect, test } from 'vitest'
import { formatAmount, normalizeNumber } from './numberFormat'
import {
  calculateCombinedScanFee,
  calculateLineTotal,
  calculateNetPrice,
  calculateServiceFeePerMonth,
  calculateSalesTotal
} from './kalkulationMath'

describe('kalkulationMath', () => {
  test('berechnet Positions Total', () => {
    const position = {
      menge: 2,
      vp: "1’250.00"
    }

    expect(calculateLineTotal(position, normalizeNumber)).toBe(2500)
  })

  test('berechnet Verkaufspreis über mehrere Positionen', () => {
    const positions = [
      { menge: 1, vp: "1’000.00" },
      { menge: 2, vp: '250.00' },
      { menge: 3, vp: '100.00' }
    ]

    expect(calculateSalesTotal(positions, normalizeNumber)).toBe(1800)
  })

  test('berechnet Nettopreis mit Rabatt, Lieferung und Restwert', () => {
    const result = calculateNetPrice({
      verkaufspreis: 10000,
      eintauschRabattProzent: 10,
      lieferungBetrag: 250,
      restwertMonate: 12,
      restwertBetrag: 100,
      normalizeNumber
    })

    expect(result).toBe(10450)
  })

  test('Nettopreis wird nie negativ', () => {
    const result = calculateNetPrice({
      verkaufspreis: 1000,
      eintauschRabattProzent: 100,
      lieferungBetrag: 0,
      restwertMonate: 0,
      restwertBetrag: 0,
      normalizeNumber
    })

    expect(result).toBe(0)
  })

  test('berechnet Servicepauschale pro Monat aus Kopien und Rappenpreisen', () => {
    const result = calculateServiceFeePerMonth({
      inklusiveKopienSW: "2’000",
      inklusiveKopienColor: "4’000",
      preisZusatzPrintSW: '5.00',
      preisZusatzPrintColor: '4.00',
      normalizeNumber
    })

    expect(result).toBe(260)
  })

  test('berechnet kombinierte Scanpauschale als gewichteten Mischwert', () => {
    const result = calculateCombinedScanFee({
      monatsmiete: 215,
      inklusiveKopienSW: 1000,
      inklusiveKopienColor: 1000,
      preisZusatzPrintSW: '5.00',
      preisZusatzPrintColor: '4.00',
      normalizeNumber
    })

    expect(result).toBe(0.1525)
  })

  test('berechnet keine Scanpauschale ohne inkludierte Kopien', () => {
    const result = calculateCombinedScanFee({
      monatsmiete: 215,
      inklusiveKopienSW: 0,
      inklusiveKopienColor: 0,
      preisZusatzPrintSW: '5.00',
      preisZusatzPrintColor: '4.00',
      normalizeNumber
    })

    expect(result).toBe(0)
  })
})

describe('numberFormat', () => {
  test('normalisiert und formatiert Schweizer Beträge', () => {
    expect(normalizeNumber("1’250.50")).toBe(1250.5)
    expect(formatAmount(1250.5)).toBe("1’250.50")
  })
})
