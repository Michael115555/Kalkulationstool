export const EMAIL_FORMAT_ERROR = 'E-Mail muss ein gültiges Format haben'
export const SWISS_PHONE_FORMAT = '+41 XX XXX XX XX'
export const SWISS_PHONE_FORMAT_ERROR = `Telefon muss dem Format ${SWISS_PHONE_FORMAT} entsprechen`

export function isEmailFormatValid(value) {
  const email = String(value ?? '').trim()

  if (!email) {
    return true
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

export function isSwissPhoneFormatValid(value) {
  const phone = normalizeSwissPhone(value)

  if (!phone) {
    return true
  }

  return /^\+41 \d{2} \d{3} \d{2} \d{2}$/.test(phone)
}

export function normalizeSwissPhone(value) {
  const phone = String(value ?? '').trim()

  if (!phone) {
    return ''
  }

  const compactPhone = phone.replace(/[\s()./-]/g, '')
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
    return phone
  }

  return `+41 ${nationalNumber.slice(0, 2)} ${nationalNumber.slice(2, 5)} ${nationalNumber.slice(5, 7)} ${nationalNumber.slice(7, 9)}`
}

export function getCustomerValidationError(customer) {
  if (!isEmailFormatValid(customer.email)) {
    return EMAIL_FORMAT_ERROR
  }

  if (!isSwissPhoneFormatValid(customer.phone)) {
    return SWISS_PHONE_FORMAT_ERROR
  }

  return ''
}
