import { describe, expect, test } from 'vitest'
import { buildOffertePdfBytes, buildOffertePdfFilename } from './offertePdf'

const createProjektFixture = () => ({
  id: 17,
  name: 'Canon Projekt',
  total: 33340.27,
  calculation: {
    restwertMonate: 10,
    restwertBetrag: '1’000.00',
    displaySnapshot: {
      project: {
        fields: [
          { key: 'projektname', value: 'Canon imageForce C5140' },
          { key: 'druckermodell', value: 'Canon imageForce C5140' },
          { key: 'variante', value: 'SpeedLizenz 40er' }
        ]
      },
      positions: {
        rows: [
          {
            values: {
              kategorie: 'Drucker',
              bezeichnung: 'Canon imageForce C5140 inkl. SpeedLizenz 40er',
              menge: '1',
              vp: '25’055.85',
              total: '25’055.85'
            }
          }
        ]
      },
      calculation: {
        fields: [
          { key: 'verkaufspreis', value: 'CHF 25’055.85', rawValue: 25055.85 },
          { key: 'eintauschRabattBetrag', value: 'CHF 2’505.59', rawValue: 2505.59 },
          { key: 'lieferungBetrag', value: 'CHF 790.00', rawValue: 790 },
          { key: 'nettopreis', value: 'CHF 33’340.27', rawValue: 33340.27 }
        ]
      },
      rentOptions: {
        rows: [
          { label: 'Miete 48 Monate', value: 'CHF 794.00 / Monat' },
          { label: 'Miete 60 Monate', value: 'CHF 667.00 / Monat' }
        ]
      },
      serviceConditions: {
        fields: [
          { key: 'servicePauschaleMonat', label: 'Servicepauschale/Mt.', value: 'CHF 320.00' },
          { key: 'inklusiveKopienSW', label: 'inkl. Kopien s/w', value: '2’000' }
        ]
      }
    }
  }
})

describe('offertePdf', () => {
  test('erstellt eine PDF-Datei aus Projektdaten', () => {
    const bytes = buildOffertePdfBytes({
      generatedAt: '2026-06-08T10:00:00.000Z',
      kunde: {
        firmenname: 'Demo Kunden AG',
        kontaktname: 'Alex Beispiel',
        strasse: 'Kundenstrasse 8',
        plz: '5000',
        ort: 'Aarau'
      },
      verkaeuferName: 'Demo Verkäufer',
      projekt: createProjektFixture()
    })
    const pdfText = new TextDecoder().decode(bytes)

    expect(bytes.length).toBeGreaterThan(1000)
    expect(pdfText.startsWith('%PDF-1.4')).toBe(true)
    expect(pdfText).toContain('/Type /Page')
    expect(pdfText).toContain('/Helvetica-Bold')
  })

  test('erstellt einen sprechenden Dateinamen', () => {
    expect(
      buildOffertePdfFilename({
        generatedAt: '2026-06-08T10:00:00.000Z',
        projekt: createProjektFixture()
      })
    ).toBe('Offerte 2026-17 Canon imageForce C5140.pdf')
  })

  test('bricht lange Offerten auf mehrere Seiten um', () => {
    const projekt = createProjektFixture()
    projekt.calculation.displaySnapshot.positions.rows = Array.from({ length: 32 }, (_, index) => ({
      values: {
        kategorie: 'Zubehör',
        bezeichnung: `Demo Position ${index + 1}`,
        menge: '1',
        vp: '100.00',
        total: '100.00'
      }
    }))

    const bytes = buildOffertePdfBytes({
      generatedAt: '2026-06-08T10:00:00.000Z',
      kunde: {
        firmenname: 'Demo Kunden AG',
        strasse: 'Kundenstrasse 8',
        plz: '5000',
        ort: 'Aarau'
      },
      projekt
    })
    const pdfText = new TextDecoder().decode(bytes)
    const pageCount = Number(pdfText.match(/\/Count (\d+)/)?.[1] ?? 0)

    expect(pageCount).toBeGreaterThan(1)
  })
})
