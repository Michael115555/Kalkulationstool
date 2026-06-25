import { formatAmount, formatInteger, normalizeNumber } from './numberFormat'

const dateFormatter = new Intl.DateTimeFormat('de-CH')

const isFilled = (value) => String(value ?? '').trim().length > 0

const formatCurrency = (value) => `CHF ${formatAmount(value)}`

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

  return (
    calculation.variante ||
    getDisplayFieldValue(displaySnapshot, 'project', 'variante') ||
    calculation.druckermodell ||
    getDisplayFieldValue(displaySnapshot, 'project', 'druckermodell') ||
    projekt?.name ||
    'Offerte'
  )
}

const getProjectFieldRows = ({ projekt, kunde, verkaeuferName, displaySnapshot }) => {
  const calculation = projekt?.calculation ?? {}
  const firma = isFilled(kunde?.firmenname)
    ? kunde.firmenname
    : getDisplayFieldValue(displaySnapshot, 'project', 'kunde', calculation.kundeName)
  const verkaeufer = isFilled(verkaeuferName)
    ? verkaeuferName
    : getDisplayFieldValue(displaySnapshot, 'project', 'verkaeufer')

  return [
    {
      label: 'Kunde',
      value: firma
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

export const createOfferteDocumentData = ({
  projekt,
  kunde = null,
  verkaeuferName = '',
  generatedAt = new Date(),
  includeServiceConditions = true
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
  const serviceRows = includeServiceConditions ? getServiceRows(displaySnapshot) : []
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
