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

export function calculateServiceFeePerMonth({
  inklusiveKopienSW,
  inklusiveKopienColor,
  preisZusatzPrintSW,
  preisZusatzPrintColor,
  normalizeNumber
}) {
  const swBetrag =
    normalizeNumber(inklusiveKopienSW) * normalizeNumber(preisZusatzPrintSW)
  const colorBetrag =
    normalizeNumber(inklusiveKopienColor) * normalizeNumber(preisZusatzPrintColor)

  return (swBetrag + colorBetrag) / 100
}

export function calculateCombinedScanFee({
  monatsmiete,
  inklusiveKopienSW,
  inklusiveKopienColor,
  preisZusatzPrintSW,
  preisZusatzPrintColor,
  normalizeNumber
}) {
  const kopienSW = normalizeNumber(inklusiveKopienSW)
  const kopienColor = normalizeNumber(inklusiveKopienColor)
  const alleInklusiveKopien = kopienSW + kopienColor

  if (alleInklusiveKopien <= 0) {
    return 0
  }

  const gewichtetePrintkosten =
    (kopienSW * normalizeNumber(preisZusatzPrintSW) +
      kopienColor * normalizeNumber(preisZusatzPrintColor)) /
    alleInklusiveKopien /
    100

  return normalizeNumber(monatsmiete) / alleInklusiveKopien + gewichtetePrintkosten
}
