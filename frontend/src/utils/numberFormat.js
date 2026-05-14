export const normalizeNumber = (value) => {
  const parsedValue = Number(String(value ?? '').replace(/['’\s]/g, '').replace(',', '.'))
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export const formatDecimal = (value) => normalizeNumber(value).toFixed(2)

const swissAmountFormatter = new Intl.NumberFormat('de-CH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const swissIntegerFormatter = new Intl.NumberFormat('de-CH', {
  maximumFractionDigits: 0
})

const roundToDecimals = (value, decimals) => {
  const factor = 10 ** decimals

  return Math.round((normalizeNumber(value) + Number.EPSILON) * factor) / factor
}

export const formatAmount = (value) =>
  swissAmountFormatter.format(roundToDecimals(value, 2))

export const formatInteger = (value) =>
  swissIntegerFormatter.format(Math.trunc(normalizeNumber(value)))
