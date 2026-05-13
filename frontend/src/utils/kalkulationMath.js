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

const VRG_TARIFE = [
  { bisExklusiv: 100, gebuehr: 1.86 },
  { bisExklusiv: 2500, gebuehr: 3.71 },
  { bisExklusiv: 5000, gebuehr: 18.57 },
  { bisExklusiv: 7500, gebuehr: 37.14 },
  { bisExklusiv: 10000, gebuehr: 55.71 },
  { bisExklusiv: 15000, gebuehr: 74.28 },
  { bisExklusiv: 25000, gebuehr: 111.42 },
  { bisExklusiv: 50000, gebuehr: 185.7 },
  { bisExklusiv: 100000, gebuehr: 371.4 },
  { bisExklusiv: 300000, gebuehr: 742.8 },
  { bisExklusiv: Infinity, gebuehr: 742.8 }
]

export function calculateVrgFee(amount, normalizeNumber) {
  const normalizedAmount = normalizeNumber(amount)

  return VRG_TARIFE.find((tarif) => normalizedAmount < tarif.bisExklusiv)?.gebuehr ?? 0
}

export function calculateNpkClosingFee(rent48Months, rent60Months, normalizeNumber) {
  return normalizeNumber(rent48Months) !== 0 || normalizeNumber(rent60Months) !== 0
    ? 150
    : 0
}
