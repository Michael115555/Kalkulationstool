export function calculateLineTotal(position, normalizeNumber) {
  return normalizeNumber(position.menge) * normalizeNumber(position.vp)
}

export function calculateSalesTotal(positions, normalizeNumber) {
  return positions.reduce(
    (sum, position) => sum + calculateLineTotal(position, normalizeNumber),
    0
  )
}

export function calculateNetPrice({
  verkaufspreis,
  eintauschRabattProzent,
  lieferungBetrag,
  restwertMonate,
  restwertBetrag,
  normalizeNumber
}) {
  const rabatt =
    normalizeNumber(verkaufspreis) *
    (normalizeNumber(eintauschRabattProzent) / 100)

  const restwert =
    normalizeNumber(restwertMonate) * normalizeNumber(restwertBetrag)

  return Math.max(
    0,
    normalizeNumber(verkaufspreis) -
      rabatt +
      normalizeNumber(lieferungBetrag) +
      restwert
  )
}