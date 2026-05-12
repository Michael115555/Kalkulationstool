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

const isPlainObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value)

/**
 * Validiert, dass ein Wert ein gültiger Integer ist
 */
const validateInteger = (value, fieldName) => {
  const num = Number(value)

  if (!Number.isInteger(num) || num <= 0) {
    throw new ApiError(`${fieldName} muss eine positive Ganzzahl sein`, 400)
  }

  return num
}

const validateOptionalNonNegativeInteger = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const num = Number(value)

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

  const positions = Array.isArray(calculation.positions) ? calculation.positions : []

  if (positions.length > MAX_CALCULATION_POSITIONS) {
    throw new ApiError(
      `Es sind maximal ${MAX_CALCULATION_POSITIONS} Positionen pro Kalkulation erlaubt`,
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
    positions: positions.map(validateCalculationPosition),
    naechsteId: validateOptionalInteger(calculation.naechsteId, 'Nächste Position ID')
      ?? Math.max(2, positions.length + 1)
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
  const firmenname = validateString(payload.firmenname, 'Kundenname', 1, 255)
  const kontaktname = validateOptionalString(payload.kontaktname, 'Kontaktname', 255)
  const email = validateEmail(payload.email, 'E Mail')
  const telefon = validateSwissPhone(payload.telefon, 'Telefon')
  const ort = validateOptionalString(payload.ort, 'Ort', 255)
  const kontaktart = validateOptionalString(payload.kontaktart, 'Kontaktart', 100)
  const versandart = validateOptionalString(payload.versandart, 'Versandart', 100)
  const verkaeuferId = validateOptionalInteger(payload.verkaeuferId, 'Verkäufer ID')

  return {
    firmenname,
    kontaktname,
    email,
    telefon,
    ort,
    kontaktart,
    versandart,
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
  validateString,
  validateEmail,
  normalizeSwissPhone,
  validateSwissPhone,
  validateOptionalInteger,
  validateOptionalNonNegativeInteger,
  validateOptionalString,
  validateCalculationSnapshot,
  validateKundePayload,
  validateKonfigurationPayload,
  ApiError
}
