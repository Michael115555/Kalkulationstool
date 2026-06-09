import { describe, expect, test } from 'vitest'
import { buildOfferteDocumentHtml, escapeHtml } from './offerteDocument'

describe('offerteDocument', () => {
  test('escaped Kundendaten im Offerten-HTML', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    )
  })

  test('erstellt eine kundenfähige Offerte ohne interne Einkaufspreise', () => {
    const html = buildOfferteDocumentHtml({
      generatedAt: '2026-06-08T10:00:00.000Z',
      kunde: {
        firmenname: 'Demo Kunden AG',
        kontaktname: 'Alex Beispiel',
        strasse: 'Kundenstrasse 8',
        plz: '5000',
        ort: 'Aarau'
      },
      verkaeuferName: 'Demo Verkäufer',
      projekt: {
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
                    vp: 'CHF 25’055.85',
                    ep: 'CHF 5’487.79',
                    total: 'CHF 25’055.85'
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
      }
    })

    expect(html).toContain('Canon imageForce C5140')
    expect(html).toContain('Demo Kunden AG')
    expect(html).toContain('Kundenstrasse 8')
    expect(html).toContain('5000 Aarau')
    expect(html).toContain('CHF 33’340.27')
    expect(html).toContain('Miete 48 Monate')
    expect(html).not.toContain('Einkaufspreis')
    expect(html).not.toContain('CHF 5’487.79')
  })
})
