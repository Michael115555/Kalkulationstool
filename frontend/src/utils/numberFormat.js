export const normalizeNumber = (value) => {
  const parsedValue = Number(String(value ?? '').replace(/['’\s]/g, '').replace(',', '.'))
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export const formatDecimal = (value) => normalizeNumber(value).toFixed(2)

const swissAmountFormatter = new Intl.NumberFormat('de-CH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export const formatAmount = (value) =>
  swissAmountFormatter.format(normalizeNumber(value))
