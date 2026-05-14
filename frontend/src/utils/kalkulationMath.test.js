import { describe, expect, test } from 'vitest'
import { formatAmount, formatInteger, normalizeNumber } from './numberFormat'
import {
  calculateCombinedScanFee,
  calculateLineTotal,
  calculateNetPrice,
  calculateNpkClosingFee,
  calculateServiceFeePerMonth,
  calculateSalesTotal,
  calculateVrgFee
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

  test('berechnet VRG Gebühr nach Preisstaffel', () => {
    expect(calculateVrgFee(99.95, normalizeNumber)).toBe(1.86)
    expect(calculateVrgFee(100, normalizeNumber)).toBe(3.71)
    expect(calculateVrgFee(24999.95, normalizeNumber)).toBe(111.42)
    expect(calculateVrgFee(25000, normalizeNumber)).toBe(185.7)
    expect(calculateVrgFee(300000, normalizeNumber)).toBe(742.8)
  })

  test('berechnet NPK Abschlussgebühr sobald eine Mietoption aktiv ist', () => {
    expect(calculateNpkClosingFee(0, 0, normalizeNumber)).toBe(0)
    expect(calculateNpkClosingFee(775, 0, normalizeNumber)).toBe(150)
    expect(calculateNpkClosingFee(0, 651, normalizeNumber)).toBe(150)
  })
})

describe('numberFormat', () => {
  test('normalisiert und formatiert Schweizer Beträge', () => {
    expect(normalizeNumber("1’250.50")).toBe(1250.5)
    expect(formatAmount(1250.5)).toBe("1’250.50")
  })

  test('rundet Beträge kaufmännisch auf zwei Dezimalstellen', () => {
    expect(formatAmount(0.545)).toBe('0.55')
  })

  test('formatiert ganze Zahlen mit Schweizer Tausendertrennzeichen', () => {
    expect(formatInteger(20000)).toBe("20’000")
    expect(normalizeNumber("20’000")).toBe(20000)
  })
})
