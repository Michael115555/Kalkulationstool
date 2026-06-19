const normalizeText = (value) => {
  const text = String(value ?? '').trim()

  return text || null
}

const configuredCompanyName = normalizeText(import.meta.env.VITE_COMPANY_NAME)

export const appConfig = {
  displayName: configuredCompanyName ?? 'Kalkulationstool',
  offerSenderLines: [
    configuredCompanyName ?? 'Demofirma AG',
    normalizeText(import.meta.env.VITE_COMPANY_ADDRESS) ?? 'Musterstrasse 1',
    normalizeText(import.meta.env.VITE_COMPANY_LOCATION) ?? '8000 Zürich',
    normalizeText(import.meta.env.VITE_COMPANY_CONTACT)
  ].filter(Boolean)
}
