/**
 * Validierungs und Error Handling Utilities für die API
 */

/**
 * Custom Error Klasse für API Fehler
 */
class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.name = 'ApiError'
  }
}

const MAX_CALCULATION_POSITIONS = 150
const MAX_CALCULATION_KONDITIONEN = 50
const MAX_DISPLAY_SNAPSHOT_BYTES = 200_000

const isPlainObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value)

const parseNumber = (value) => {
  if (typeof value === 'string') {
    return Number(value.trim().replace(/['’\s]/g, '').replace(',', '.'))
  }

  return Number(value)
}

/**
 * Validiert, dass ein Wert ein gültiger Integer ist
 */
const validateInteger = (value, fieldName) => {
  const num = parseNumber(value)

  if (!Number.isInteger(num) || num <= 0) {
    throw new ApiError(`${fieldName} muss eine positive Ganzzahl sein`, 400)
  }

  return num
}

const validateOptionalNonNegativeInteger = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const num = parseNumber(value)

  if (!Number.isInteger(num) || num < 0) {
    throw new ApiError(`${fieldName} muss eine nicht negative Ganzzahl sein`, 400)
  }

  return num
}

/**
 * Validiert, dass ein String nicht leer ist
 */
const validateString = (value, fieldName, minLength = 1, maxLength = 500) => {
  const str = String(value ?? '').trim()

  if (!str || str.length < minLength) {
    throw new ApiError(`${fieldName} darf nicht leer sein (Mindestens ${minLength} Zeichen)`, 400)
  }

  if (str.length > maxLength) {
    throw new ApiError(`${fieldName} ist zu lang (Maximum ${maxLength} Zeichen)`, 400)
  }

  return str
}

/**
 * Validiert, dass ein Wert optional ist oder ein gültiger Integer
 */
const validateOptionalInteger = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return validateInteger(value, fieldName)
}

/**
 * Validiert, dass ein Wert optional ist oder ein gültiger String
 */
const validateOptionalString = (value, fieldName, maxLength = 500) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const str = String(value).trim()

  if (str.length > maxLength) {
    throw new ApiError(`${fieldName} ist zu lang (Maximum ${maxLength} Zeichen)`, 400)
  }

  return str || null
}

const validateOptionalDigits = (value, fieldName, maxLength = 32) => {
  const str = validateOptionalString(value, fieldName, maxLength)

  if (str === null) {
    return null
  }

  if (!/^\d+$/.test(str)) {
    throw new ApiError(`${fieldName} darf nur Zahlen enthalten`, 400)
  }

  return str
}

const validateSnapshotString = (value, fieldName, maxLength = 255) => {
  const str = validateOptionalString(value, fieldName, maxLength)
  return str ?? ''
}

const validateSnapshotAmount = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return value ?? null
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new ApiError(`${fieldName} muss eine gültige Zahl sein`, 400)
    }

    return value
  }

  if (typeof value === 'string') {
    return validateOptionalString(value, fieldName, 32) ?? ''
  }

  throw new ApiError(`${fieldName} muss eine gültige Zahl sein`, 400)
}

const validateDisplaySnapshot = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (!isPlainObject(value)) {
    throw new ApiError('Display Snapshot muss ein Objekt sein', 400)
  }

  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > MAX_DISPLAY_SNAPSHOT_BYTES) {
    throw new ApiError('Display Snapshot ist zu gross', 400)
  }

  return value
}

const validateCalculationPosition = (position, index) => {
  if (!isPlainObject(position)) {
    throw new ApiError(`Position ${index + 1} muss ein Objekt sein`, 400)
  }

  const zubehoerId = position.zubehoerId === null || position.zubehoerId === undefined
    ? null
    : validateInteger(position.zubehoerId, `Zubehör ID Position ${index + 1}`)

  return {
    id: validateOptionalInteger(position.id, `ID Position ${index + 1}`) ?? index + 1,
    zubehoerId,
    druckermodellId: validateOptionalInteger(
      position.druckermodellId,
      `Druckermodell ID Position ${index + 1}`
    ),
    druckerVarianteId: validateOptionalInteger(
      position.druckerVarianteId,
      `Drucker Variante ID Position ${index + 1}`
    ),
    istDrucker: Boolean(position.istDrucker),
    zubehoer: validateSnapshotString(position.zubehoer, `Kategorie Position ${index + 1}`, 100),
    bezeichnung: validateSnapshotString(
      position.bezeichnung,
      `Bezeichnung Position ${index + 1}`,
      255
    ),
    menge: position.menge === null || position.menge === undefined || position.menge === ''
      ? 1
      : validateInteger(position.menge, `Menge Position ${index + 1}`),
    vp: validateSnapshotAmount(position.vp, `Verkaufspreis Position ${index + 1}`),
    einkaufsPreis: validateSnapshotAmount(
      position.einkaufsPreis,
      `Einkaufspreis Position ${index + 1}`
    ),
    epKategorie: validateSnapshotString(
      position.epKategorie,
      `EP Kategorie Position ${index + 1}`,
      100
    )
  }
}

const validateCalculationKondition = (kondition, index) => {
  if (!isPlainObject(kondition)) {
    throw new ApiError(`Kondition ${index + 1} muss ein Objekt sein`, 400)
  }

  const auswahl = validateSnapshotString(kondition.auswahl, `Auswahl Kondition ${index + 1}`, 32)
  const normalizedAuswahl = auswahl || 'keine'

  return {
    key: validateSnapshotString(kondition.key, `Schlüssel Kondition ${index + 1}`, 100),
    label: validateSnapshotString(kondition.label, `Bezeichnung Kondition ${index + 1}`, 255),
    einheit: validateSnapshotString(kondition.einheit, `Einheit Kondition ${index + 1}`, 100),
    betragText: validateSnapshotString(kondition.betragText, `Betrag Kondition ${index + 1}`, 32),
    auswahl: normalizedAuswahl,
    checked: Boolean(kondition.checked),
    manuell: Boolean(kondition.manuell)
  }
}

const validateCalculationSnapshot = (calculation) => {
  if (!isPlainObject(calculation)) {
    throw new ApiError('Calculation Daten müssen ein Objekt sein', 400)
  }

  if (
    calculation.positions !== undefined &&
    calculation.positions !== null &&
    !Array.isArray(calculation.positions)
  ) {
    throw new ApiError('Positionen müssen eine Liste sein', 400)
  }

  if (
    calculation.konditionenA3Mfp !== undefined &&
    calculation.konditionenA3Mfp !== null &&
    !Array.isArray(calculation.konditionenA3Mfp)
  ) {
    throw new ApiError('Konditionen A3 MFP müssen eine Liste sein', 400)
  }

  const positions = Array.isArray(calculation.positions) ? calculation.positions : []
  const konditionenA3Mfp = Array.isArray(calculation.konditionenA3Mfp)
    ? calculation.konditionenA3Mfp
    : []

  if (positions.length > MAX_CALCULATION_POSITIONS) {
    throw new ApiError(
      `Es sind maximal ${MAX_CALCULATION_POSITIONS} Positionen pro Kalkulation erlaubt`,
      400
    )
  }

  if (konditionenA3Mfp.length > MAX_CALCULATION_KONDITIONEN) {
    throw new ApiError(
      `Es sind maximal ${MAX_CALCULATION_KONDITIONEN} Konditionen pro Kalkulation erlaubt`,
      400
    )
  }

  return {
    kundeId: validateOptionalInteger(calculation.kundeId, 'Kunde ID'),
    druckermarke: validateSnapshotString(calculation.druckermarke, 'Druckermarke', 255),
    druckermodellId: validateOptionalInteger(calculation.druckermodellId, 'Druckermodell ID'),
    druckerVarianteId: validateOptionalInteger(
      calculation.druckerVarianteId,
      'Drucker Variante ID'
    ),
    druckermodell: validateSnapshotString(calculation.druckermodell, 'Druckermodell', 255),
    variante: validateSnapshotString(calculation.variante, 'Variante', 255),
    eintauschRabattProzent: validateSnapshotAmount(
      calculation.eintauschRabattProzent,
      'Eintauschrabatt'
    ),
    lieferungOption: validateSnapshotString(calculation.lieferungOption, 'Lieferoption', 100),
    lieferungBetrag: validateSnapshotAmount(calculation.lieferungBetrag, 'Lieferbetrag'),
    restwertMonate:
      validateOptionalNonNegativeInteger(calculation.restwertMonate, 'Restwert Monate') ?? 0,
    restwertBetrag: validateSnapshotAmount(calculation.restwertBetrag, 'Restwert Betrag'),
    inklusiveKopienSW:
      validateOptionalNonNegativeInteger(calculation.inklusiveKopienSW, 'Inklusive Kopien s/w') ?? 0,
    inklusiveKopienColor:
      validateOptionalNonNegativeInteger(calculation.inklusiveKopienColor, 'Inklusive Kopien color') ?? 0,
    preisZusatzPrintSW: validateSnapshotAmount(
      calculation.preisZusatzPrintSW,
      'Preis Zusatzprint s/w'
    ),
    preisZusatzPrintColor: validateSnapshotAmount(
      calculation.preisZusatzPrintColor,
      'Preis Zusatzprint color'
    ),
    flatratePauschalBetrag: validateSnapshotAmount(
      calculation.flatratePauschalBetrag,
      'Flatrate Pauschalbetrag'
    ),
    scanpauschaleMietMonate:
      validateOptionalNonNegativeInteger(
        calculation.scanpauschaleMietMonate,
        'Scanpauschale Mietmonate'
      ) ?? 0,
    scanpauschaleAuswahl: validateSnapshotString(
      calculation.scanpauschaleAuswahl,
      'Scanpauschale Auswahl',
      32
    ),
    kundenkontakt: validateSnapshotString(calculation.kundenkontakt, 'Kundenkontakt', 100),
    versand: validateSnapshotString(calculation.versand, 'Versand', 100),
    interneBemerkung: validateSnapshotString(
      calculation.interneBemerkung,
      'Bemerkung',
      1000
    ),
    positions: positions.map(validateCalculationPosition),
    konditionenA3Mfp: konditionenA3Mfp.map(validateCalculationKondition),
    konditionenA3MfpVersion:
      validateOptionalNonNegativeInteger(
        calculation.konditionenA3MfpVersion,
        'Konditionen A3 MFP Version'
      ) ?? 0,
    naechsteId: validateOptionalInteger(calculation.naechsteId, 'Nächste Position ID')
      ?? Math.max(2, positions.length + 1),
    displaySnapshot: validateDisplaySnapshot(calculation.displaySnapshot)
  }
}

/**
 * Validiert, dass eine E Mail gültig ist
 */
const validateEmail = (value, fieldName = 'E Mail', maxLength = 255) => {
  const str = String(value ?? '').trim()

  if (!str) {
    return null
  }

  if (str.length > maxLength) {
    throw new ApiError(`${fieldName} ist zu lang (Maximum ${maxLength} Zeichen)`, 400)
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

  if (!emailRegex.test(str)) {
    throw new ApiError(`${fieldName} muss ein gültiges Format haben`, 400)
  }

  return str
}

/**
 * Normalisiert Schweizer Telefonnummern ins Format +41 XX XXX XX XX
 */
const normalizeSwissPhone = (value) => {
  const str = String(value ?? '').trim()

  if (!str) {
    return null
  }

  const compactPhone = str.replace(/[\s()./-]/g, '')
  let nationalNumber = ''

  if (/^\+410\d{9}$/.test(compactPhone)) {
    nationalNumber = compactPhone.slice(4)
  } else if (/^\+41\d{9}$/.test(compactPhone)) {
    nationalNumber = compactPhone.slice(3)
  } else if (/^00410\d{9}$/.test(compactPhone)) {
    nationalNumber = compactPhone.slice(5)
  } else if (/^0041\d{9}$/.test(compactPhone)) {
    nationalNumber = compactPhone.slice(4)
  } else if (/^410\d{9}$/.test(compactPhone)) {
    nationalNumber = compactPhone.slice(3)
  } else if (/^41\d{9}$/.test(compactPhone)) {
    nationalNumber = compactPhone.slice(2)
  } else if (/^0\d{9}$/.test(compactPhone)) {
    nationalNumber = compactPhone.slice(1)
  } else {
    return str
  }

  return `+41 ${nationalNumber.slice(0, 2)} ${nationalNumber.slice(2, 5)} ${nationalNumber.slice(5, 7)} ${nationalNumber.slice(7, 9)}`
}

/**
 * Validiert Schweizer Telefonnummern im Format +41 XX XXX XX XX
 */
const validateSwissPhone = (value, fieldName = 'Telefon') => {
  const normalizedPhone = normalizeSwissPhone(value)

  if (!normalizedPhone) {
    return null
  }

  const phoneRegex = /^\+41 \d{2} \d{3} \d{2} \d{2}$/

  if (!phoneRegex.test(normalizedPhone)) {
    throw new ApiError(`${fieldName} muss dem Format +41 XX XXX XX XX entsprechen`, 400)
  }

  return normalizedPhone
}

/**
 * Validiert Kunde Payload
 */
const validateKundePayload = (payload = {}) => {
  const firmenname = validateString(payload.firmenname, 'Firma', 1, 255)
  const kontaktname = validateOptionalString(payload.kontaktname, 'Kontaktname', 255)
  const email = validateEmail(payload.email, 'E-Mail', 255)
  const telefon = validateSwissPhone(payload.telefon, 'Telefon')
  const strasse = validateOptionalString(payload.strasse, 'Strasse', 255)
  const plz = validateOptionalDigits(payload.plz, 'PLZ', 32)
  const ort = validateOptionalString(payload.ort, 'Ort', 255)
  const verkaeuferId = validateOptionalInteger(payload.verkaeuferId, 'Verkäufer ID')

  return {
    firmenname,
    kontaktname,
    email,
    telefon,
    strasse,
    plz,
    ort,
    verkaeuferId
  }
}

/**
 * Validiert Konfiguration Payload
 */
const validateKonfigurationPayload = (payload = {}) => {
  const name = validateString(payload.name, 'Konfigurationsname', 1, 255)
  const druckermodellId = validateInteger(payload.druckermodellId, 'Druckermodell ID')
  const kundeId = validateOptionalInteger(payload.kundeId, 'Kunde ID')
  const druckerVarianteId = validateOptionalInteger(
    payload.druckerVarianteId,
    'Drucker Variante ID'
  )

  const total = Number(payload.total ?? 0)

  if (!Number.isFinite(total) || total < 0) {
    throw new ApiError('Total muss eine nicht negative Zahl sein', 400)
  }

  const calculation = validateCalculationSnapshot(payload.calculation)

  return {
    name,
    kundeId,
    druckermodellId,
    druckerVarianteId,
    total,
    calculation
  }
}

module.exports = {
  validateInteger,
  validateKundePayload,
  validateKonfigurationPayload,
  ApiError
}
