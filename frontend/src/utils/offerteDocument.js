import { formatAmount, formatInteger, normalizeNumber } from './numberFormat'

const dateFormatter = new Intl.DateTimeFormat('de-CH')

const isFilled = (value) => String(value ?? '').trim().length > 0

const formatCurrency = (value) => `CHF ${formatAmount(value)}`

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const getDisplaySnapshot = (projekt) => projekt?.calculation?.displaySnapshot ?? null

const getSectionFields = (displaySnapshot, sectionKey) => {
  const fields = displaySnapshot?.[sectionKey]?.fields

  return Array.isArray(fields) ? fields : []
}

const getDisplayField = (displaySnapshot, sectionKey, fieldKey) =>
  getSectionFields(displaySnapshot, sectionKey).find((field) => field.key === fieldKey)

const getDisplayFieldValue = (displaySnapshot, sectionKey, fieldKey, fallback = '') => {
  const value = getDisplayField(displaySnapshot, sectionKey, fieldKey)?.value

  return isFilled(value) ? value : fallback
}

const formatCustomerLocation = (kunde) => {
  const locationParts = [kunde?.plz, kunde?.ort].filter(isFilled)

  return locationParts.length > 0 ? locationParts.join(' ') : ''
}

const getDisplayFieldRawValue = (displaySnapshot, sectionKey, fieldKey, fallback = 0) => {
  const value = getDisplayField(displaySnapshot, sectionKey, fieldKey)?.rawValue

  return value === undefined || value === null ? fallback : value
}

const getProjectTitle = (projekt, displaySnapshot) => {
  const calculation = projekt?.calculation ?? {}
  const fallbackTitle = [
    calculation.druckermodell,
    calculation.variante
  ].filter(isFilled).join(' ')

  return (
    getDisplayFieldValue(displaySnapshot, 'project', 'projektname') ||
    projekt?.name ||
    fallbackTitle ||
    'Offerte'
  )
}

const getProjectFieldRows = ({ projekt, kunde, verkaeuferName, displaySnapshot }) => {
  const calculation = projekt?.calculation ?? {}
  const kundenname = isFilled(kunde?.firmenname)
    ? kunde.firmenname
    : getDisplayFieldValue(displaySnapshot, 'project', 'kunde', calculation.kundeName)
  const verkaeufer = isFilled(verkaeuferName)
    ? verkaeuferName
    : getDisplayFieldValue(displaySnapshot, 'project', 'verkaeufer')

  return [
    {
      label: 'Kunde',
      value: kundenname
    },
    {
      label: 'Kontakt',
      value: kunde?.kontaktname ?? ''
    },
    {
      label: 'Strasse',
      value: kunde?.strasse ?? ''
    },
    {
      label: 'PLZ / Ort',
      value: formatCustomerLocation(kunde)
    },
    {
      label: 'Verkäufer',
      value: verkaeufer
    },
    {
      label: 'Modell',
      value: [
        getDisplayFieldValue(displaySnapshot, 'project', 'druckermodell', calculation.druckermodell),
        getDisplayFieldValue(displaySnapshot, 'project', 'variante', calculation.variante)
      ].filter(isFilled).join(' ')
    }
  ].filter((row) => isFilled(row.value))
}

const normalizeDisplayPositionRows = (displaySnapshot) => {
  const rows = displaySnapshot?.positions?.rows

  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map((row) => ({
      kategorie: row.values?.kategorie ?? '',
      bezeichnung: row.values?.bezeichnung ?? '',
      menge: row.values?.menge ?? '',
      einzelpreis: row.values?.vp ?? '',
      total: row.values?.total ?? ''
    }))
    .filter((row) => isFilled(row.kategorie) || isFilled(row.bezeichnung))
}

const normalizeFallbackPositionRows = (projekt) => {
  const positions = projekt?.calculation?.positions

  if (!Array.isArray(positions)) {
    return []
  }

  return positions
    .map((position) => {
      const menge = normalizeNumber(position.menge)
      const einzelpreis = normalizeNumber(position.vp)

      return {
        kategorie: position.zubehoer ?? '',
        bezeichnung: position.bezeichnung ?? '',
        menge: formatInteger(menge),
        einzelpreis: formatCurrency(einzelpreis),
        total: formatCurrency(menge * einzelpreis)
      }
    })
    .filter((row) => isFilled(row.kategorie) || isFilled(row.bezeichnung))
}

const getPositionRows = (projekt, displaySnapshot) => {
  const displayRows = normalizeDisplayPositionRows(displaySnapshot)

  return displayRows.length > 0 ? displayRows : normalizeFallbackPositionRows(projekt)
}

const getPriceRows = (projekt, displaySnapshot) => {
  const calculation = projekt?.calculation ?? {}
  const verkaufspreis = normalizeNumber(
    getDisplayFieldRawValue(displaySnapshot, 'calculation', 'verkaufspreis')
  )
  const eintauschRabatt = normalizeNumber(
    getDisplayFieldRawValue(displaySnapshot, 'calculation', 'eintauschRabattBetrag')
  )
  const lieferung = normalizeNumber(
    getDisplayFieldRawValue(displaySnapshot, 'calculation', 'lieferungBetrag')
  )
  const restwertMonate = normalizeNumber(calculation.restwertMonate)
  const restwertBetrag = normalizeNumber(calculation.restwertBetrag)
  const restwertTotal = restwertMonate * restwertBetrag
  const nettopreis = normalizeNumber(
    getDisplayFieldRawValue(displaySnapshot, 'calculation', 'nettopreis', projekt?.total)
  )

  return [
    {
      label: 'Geräte- und Zubehörpaket',
      value: formatCurrency(verkaufspreis),
      show: verkaufspreis > 0
    },
    {
      label: 'Eintauschrabatt',
      value: `- ${formatCurrency(eintauschRabatt)}`,
      show: eintauschRabatt > 0
    },
    {
      label: 'Lieferung / Bereitstellung',
      value: formatCurrency(lieferung),
      show: lieferung > 0
    },
    {
      label: 'Restwertübernahme',
      value: formatCurrency(restwertTotal),
      show: restwertTotal > 0
    },
    {
      label: 'Nettopreis',
      value: formatCurrency(nettopreis),
      isTotal: true,
      show: true
    }
  ].filter((row) => row.show)
}

const getRentRows = (displaySnapshot) => {
  const rows = displaySnapshot?.rentOptions?.rows

  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map((row) => ({
      label: row.label ?? '',
      value: row.value ?? ''
    }))
    .filter((row) => isFilled(row.label) && isFilled(row.value))
}

const getServiceRows = (displaySnapshot) => {
  const keys = [
    'servicePauschaleMonat',
    'inklusiveKopienSW',
    'inklusiveKopienColor',
    'preisZusatzPrintSW',
    'preisZusatzPrintColor',
    'scanpauschaleAuswahl'
  ]

  return keys
    .map((key) => getDisplayField(displaySnapshot, 'serviceConditions', key))
    .filter(Boolean)
    .map((field) => ({
      label: field.label,
      value: field.value
    }))
    .filter((row) => isFilled(row.value))
}

const getConditionRows = (displaySnapshot) => {
  const rows = displaySnapshot?.offerConditions?.rows

  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .filter((row) => row.ausgewaehlt && row.auswahlLabel !== 'keine')
    .map((row) => ({
      label: [row.label, row.einheit].filter(isFilled).join(' - '),
      value: row.auswahlLabel
    }))
    .filter((row) => isFilled(row.label) && isFilled(row.value))
}

const renderDefinitionRows = (rows) =>
  rows
    .map(
      (row) => `
        <div class="definition-row">
          <dt>${escapeHtml(row.label)}</dt>
          <dd>${escapeHtml(row.value)}</dd>
        </div>
      `
    )
    .join('')

const renderPriceRows = (rows) =>
  rows
    .map(
      (row) => `
        <div class="price-row${row.isTotal ? ' price-row-total' : ''}">
          <span>${escapeHtml(row.label)}</span>
          <strong>${escapeHtml(row.value)}</strong>
        </div>
      `
    )
    .join('')

const renderPositionRows = (rows) =>
  rows.length > 0
    ? rows
      .map(
        (row) => `
          <tr>
            <td>
              <span class="position-title">${escapeHtml(row.bezeichnung)}</span>
              <span class="position-category">${escapeHtml(row.kategorie)}</span>
            </td>
            <td class="number-cell">${escapeHtml(row.menge)}</td>
            <td class="number-cell">${escapeHtml(row.einzelpreis)}</td>
            <td class="number-cell">${escapeHtml(row.total)}</td>
          </tr>
        `
      )
      .join('')
    : `
      <tr>
        <td colspan="4" class="empty-cell">Keine Positionen gespeichert.</td>
      </tr>
    `

export const createOfferteDocumentData = ({
  projekt,
  kunde = null,
  verkaeuferName = '',
  generatedAt = new Date()
}) => {
  const displaySnapshot = getDisplaySnapshot(projekt)
  const title = getProjectTitle(projekt, displaySnapshot)
  const projectRows = getProjectFieldRows({
    projekt,
    kunde,
    verkaeuferName,
    displaySnapshot
  })
  const positionRows = getPositionRows(projekt, displaySnapshot)
  const priceRows = getPriceRows(projekt, displaySnapshot)
  const rentRows = getRentRows(displaySnapshot)
  const serviceRows = getServiceRows(displaySnapshot)
  const conditionRows = getConditionRows(displaySnapshot)
  const date = dateFormatter.format(new Date(generatedAt))
  const customerName = isFilled(kunde?.firmenname)
    ? kunde.firmenname
    : getDisplayFieldValue(displaySnapshot, 'project', 'kunde')

  return {
    title,
    date,
    projektId: projekt?.id ?? '',
    customer: {
      name: customerName,
      contact: kunde?.kontaktname ?? '',
      address: kunde?.strasse ?? '',
      location: formatCustomerLocation(kunde)
    },
    sellerName: verkaeuferName,
    projectRows,
    positionRows,
    priceRows,
    rentRows,
    serviceRows,
    conditionRows
  }
}

export const buildOfferteDocumentHtml = (options) => {
  const {
    title,
    date,
    projektId,
    projectRows,
    positionRows,
    priceRows,
    rentRows,
    serviceRows,
    conditionRows
  } = createOfferteDocumentData(options)

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Offerte - ${escapeHtml(title)}</title>
    <style>
      :root {
        color: #1f2937;
        background: #eef1f4;
        font-family: Inter, "Segoe UI", Arial, sans-serif;
        font-size: 14px;
        line-height: 1.45;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #eef1f4;
      }

      .screen-actions {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        justify-content: flex-end;
        padding: 12px 20px;
        border-bottom: 1px solid #d7dde4;
        background: rgba(255, 255, 255, 0.94);
        backdrop-filter: blur(8px);
      }

      .print-button {
        min-height: 38px;
        padding: 0 14px;
        border: 1px solid #b91c1c;
        border-radius: 6px;
        background: #b91c1c;
        color: #fff;
        font: inherit;
        font-weight: 650;
        cursor: pointer;
      }

      .page {
        width: min(210mm, calc(100vw - 28px));
        min-height: 297mm;
        margin: 18px auto;
        padding: 14mm;
        background: #fff;
        box-shadow: 0 18px 54px rgba(15, 23, 42, 0.18);
      }

      .document-header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 24px;
        align-items: start;
        padding-bottom: 18px;
        border-bottom: 2px solid #b91c1c;
      }

      .eyebrow {
        margin: 0 0 8px;
        color: #b91c1c;
        font-size: 12px;
        font-weight: 760;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        color: #111827;
        font-size: 26px;
        line-height: 1.16;
      }

      .document-meta {
        display: grid;
        gap: 4px;
        min-width: 170px;
        color: #4b5563;
        font-size: 12px;
        text-align: right;
      }

      .section-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
        gap: 18px;
        margin-top: 18px;
      }

      .section {
        break-inside: avoid;
        margin-top: 20px;
      }

      .section-grid .section {
        margin-top: 0;
      }

      h2 {
        margin: 0 0 10px;
        color: #111827;
        font-size: 15px;
        font-weight: 760;
      }

      .definition-list {
        display: grid;
        gap: 7px;
        margin: 0;
      }

      .definition-row,
      .price-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: baseline;
        min-height: 27px;
        padding: 6px 0;
        border-bottom: 1px solid #e5e7eb;
      }

      .definition-row dt,
      .definition-row dd {
        margin: 0;
      }

      .definition-row dt,
      .price-row span {
        color: #6b7280;
        font-size: 12px;
        font-weight: 600;
      }

      .definition-row dd,
      .price-row strong {
        color: #111827;
        font-weight: 680;
        text-align: right;
      }

      .price-card {
        padding: 14px;
        border: 1px solid #d7dde4;
        border-radius: 8px;
        background: #f9fafb;
      }

      .price-row-total {
        margin-top: 8px;
        padding-top: 12px;
        border-top: 2px solid #111827;
        border-bottom: 0;
      }

      .price-row-total span,
      .price-row-total strong {
        color: #111827;
        font-size: 16px;
      }

      .position-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      .position-table th,
      .position-table td {
        padding: 8px 7px;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
      }

      .position-table th {
        background: #050505;
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        text-align: left;
      }

      .position-table th:nth-child(1) {
        width: 52%;
      }

      .position-table th:nth-child(2) {
        width: 11%;
      }

      .position-table th:nth-child(3),
      .position-table th:nth-child(4) {
        width: 18.5%;
      }

      .number-cell {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      .position-title,
      .position-category {
        display: block;
      }

      .position-title {
        color: #111827;
        font-weight: 650;
      }

      .position-category {
        margin-top: 2px;
        color: #6b7280;
        font-size: 12px;
      }

      .empty-cell {
        color: #6b7280;
        text-align: center;
      }

      .footer-note {
        margin-top: 28px;
        padding-top: 12px;
        border-top: 1px solid #d7dde4;
        color: #6b7280;
        font-size: 11px;
      }

      @page {
        size: A4;
        margin: 12mm;
      }

      @media print {
        :root,
        body {
          background: #fff;
        }

        .screen-actions {
          display: none;
        }

        .page {
          width: auto;
          min-height: 0;
          margin: 0;
          padding: 0;
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="screen-actions">
      <button class="print-button" type="button" onclick="window.print()">Drucken / PDF speichern</button>
    </div>

    <main class="page">
      <header class="document-header">
        <div>
          <p class="eyebrow">Offerte</p>
          <h1>${escapeHtml(title)}</h1>
        </div>
        <div class="document-meta">
          <span>Datum: ${escapeHtml(date)}</span>
          <span>Währung: CHF</span>
          <span>Projekt-Nr.: ${escapeHtml(projektId)}</span>
        </div>
      </header>

      <div class="section-grid">
        <section class="section">
          <h2>Kundendaten</h2>
          <dl class="definition-list">
            ${renderDefinitionRows(projectRows)}
          </dl>
        </section>

        <section class="section">
          <h2>Preisübersicht</h2>
          <div class="price-card">
            ${renderPriceRows(priceRows)}
          </div>
        </section>
      </div>

      <section class="section">
        <h2>Angebotene Positionen</h2>
        <table class="position-table">
          <thead>
            <tr>
              <th>Position</th>
              <th class="number-cell">Menge</th>
              <th class="number-cell">Einzelpreis</th>
              <th class="number-cell">Total</th>
            </tr>
          </thead>
          <tbody>
            ${renderPositionRows(positionRows)}
          </tbody>
        </table>
      </section>

      ${rentRows.length > 0 ? `
        <section class="section">
          <h2>Miete und Finanzierung</h2>
          <dl class="definition-list">
            ${renderDefinitionRows(rentRows)}
          </dl>
        </section>
      ` : ''}

      ${serviceRows.length > 0 ? `
        <section class="section">
          <h2>Servicekonditionen</h2>
          <dl class="definition-list">
            ${renderDefinitionRows(serviceRows)}
          </dl>
        </section>
      ` : ''}

      ${conditionRows.length > 0 ? `
        <section class="section">
          <h2>Weitere Vereinbarungen</h2>
          <dl class="definition-list">
            ${renderDefinitionRows(conditionRows)}
          </dl>
        </section>
      ` : ''}

      <p class="footer-note">
        Preise inkl. MwSt., sofern nicht anders vereinbart. Gültigkeit und Detailkonditionen gemäss definitiver Offerte.
      </p>
    </main>
  </body>
</html>`
}
