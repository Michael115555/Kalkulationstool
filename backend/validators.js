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

  if (!payload.calculation || typeof payload.calculation !== 'object') {
    throw new ApiError('Calculation Daten sind erforderlich', 400)
  }

  return {
    name,
    kundeId,
    druckermodellId,
    druckerVarianteId,
    total,
    calculation: payload.calculation
  }
}

module.exports = {
  validateInteger,
  validateString,
  validateEmail,
  normalizeSwissPhone,
  validateSwissPhone,
  validateOptionalInteger,
  validateOptionalString,
  validateKundePayload,
  validateKonfigurationPayload,
  ApiError
}
