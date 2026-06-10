import { describe, expect, test } from 'vitest'
import { buildOffertePdfBytes, buildOffertePdfFilename } from './offertePdf'

const toPdfHex = (value) => Buffer.from(value, 'latin1').toString('hex')

const getPdfStreams = (bytes) =>
  [...new TextDecoder().decode(bytes).matchAll(/stream\n([\s\S]*?)\nendstream/g)].map(
    (match) => match[1]
  )

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

  test('weist ein fixes Gültigkeitsdatum und klares Preisänderungs-Wording aus', () => {
    const bytes = buildOffertePdfBytes({
      generatedAt: '2026-06-08T10:00:00.000Z',
      kunde: {
        firmenname: 'Demo Kunden AG',
        strasse: 'Kundenstrasse 8',
        plz: '5000',
        ort: 'Aarau'
      },
      projekt: createProjektFixture()
    })
    const pdfText = new TextDecoder().decode(bytes)

    expect(pdfText).toContain(toPdfHex('8. Juli 2026'))
    expect(pdfText).toContain(toPdfHex('inkl. MWST'))
    expect(pdfText).toContain(
      toPdfHex('Preisänderungen nach Ablauf der Angebotsfrist vorbehalten.')
    )
  })

  test('platziert Mietoptionen als eigenen Block vor den Bedingungen', () => {
    const bytes = buildOffertePdfBytes({
      generatedAt: '2026-06-08T10:00:00.000Z',
      kunde: {
        firmenname: 'Demo Kunden AG',
        strasse: 'Kundenstrasse 8',
        plz: '5000',
        ort: 'Aarau'
      },
      projekt: createProjektFixture()
    })
    const pdfText = new TextDecoder().decode(bytes)
    const rentSectionIndex = pdfText.indexOf(toPdfHex('Mietoptionen'))
    const conditionsIndex = pdfText.indexOf(toPdfHex('Bedingungen'))

    expect(rentSectionIndex).toBeGreaterThan(-1)
    expect(conditionsIndex).toBeGreaterThan(-1)
    expect(rentSectionIndex).toBeLessThan(conditionsIndex)
    expect(pdfText).toContain(toPdfHex('Miete 48 Monate'))
  })

  test('zeichnet keinen leeren Abstand vor einem Block am Anfang einer neuen Seite', () => {
    const createBreakFixture = (positionCount) => {
      const projekt = createProjektFixture()

      projekt.calculation.displaySnapshot.positions.rows = Array.from(
        { length: positionCount },
        (_, index) => ({
          values: {
            kategorie: 'Zubehör',
            bezeichnung: `Demo Position ${index + 1}`,
            menge: '1',
            vp: '100.00',
            total: '100.00'
          }
        })
      )
      projekt.calculation.displaySnapshot.serviceConditions.fields = [
        { key: 'servicePauschaleMonat', label: 'Servicepauschale/Mt.', value: 'CHF 500.00' },
        { key: 'inklusiveKopienSW', label: 'inkl. Kopien s/w', value: "5'000" },
        { key: 'inklusiveKopienColor', label: 'inkl. Kopien color', value: "5'000" },
        { key: 'preisZusatzPrintSW', label: 'jeder weitere Print s/w', value: 'Rp. 5.00' },
        { key: 'preisZusatzPrintColor', label: 'jeder weitere Print color', value: 'Rp. 5.00' },
        { key: 'scanpauschaleAuswahl', label: 'Scanpauschale Betrag', value: 'Fr. 15.00' }
      ]

      return projekt
    }

    let acceptanceStream = ''

    for (let positionCount = 1; positionCount <= 40; positionCount += 1) {
      const bytes = buildOffertePdfBytes({
        generatedAt: '2026-06-08T10:00:00.000Z',
        kunde: {
          firmenname: 'Demo Kunden AG',
          strasse: 'Kundenstrasse 8',
          plz: '5000',
          ort: 'Aarau'
        },
        projekt: createBreakFixture(positionCount)
      })
      const streams = getPdfStreams(bytes)
      const acceptancePageIndex = streams.findIndex((stream) =>
        stream.includes(toPdfHex('Annahme der Offerte'))
      )

      if (acceptancePageIndex > 0) {
        acceptanceStream = streams[acceptancePageIndex]
        break
      }
    }

    expect(acceptanceStream).not.toBe('')
    expect(acceptanceStream).not.toContain('54.00 793.00 487.28 19.00 re S')
  })
})
