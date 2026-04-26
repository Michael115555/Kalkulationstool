/**
 * Composable für Positions-Management (Positionen in Kalkulationen)
 */
import { computed, ref } from 'vue'
import { formatAmount, normalizeNumber } from '../utils/numberFormat'

export const usePositions = (katalog) => {
  const positions = ref([])
  let nextPositionId = 3

  const addPosition = () => {
    positions.value.push({
      id: nextPositionId++,
      kategorie: '',
      zubehoer: null,
      titel: '',
      menge: 1,
      verkaufsPreis: formatAmount(0),
      einkaufsPreis: null
    })
  }

  const removePosition = (id) => {
    positions.value = positions.value.filter((position) => position.id !== id)
  }

  const isEmptyPosition = (position) => {
    return !position.kategorie && !position.zubehoer && !position.titel
  }

  const updatePositionZubehoer = (id, kategorie) => {
    const position = positions.value.find((p) => p.id === id)
    if (position) {
      position.kategorie = kategorie
      position.zubehoer = null
    }
  }

  const updatePositionProdukt = (id, zubehoer) => {
    const position = positions.value.find((p) => p.id === id)
    if (position && zubehoer) {
      position.zubehoer = zubehoer.id
      position.titel = zubehoer.bezeichnung
      position.verkaufsPreis = formatAmount(zubehoer.vp)
      position.einkaufsPreis = zubehoer.einkaufsPreis ? formatAmount(zubehoer.einkaufsPreis) : null
    }
  }

  const getProdukteByZubehoer = (kategorieName) => {
    const modell = katalog.value.druckermodelle.length > 0 ? katalog.value.druckermodelle[0] : null
    if (!modell) return []

    return modell.zubehoer
      .filter((produkt) => produkt.zubehoer === kategorieName)
      .sort((a, b) => a.bezeichnung.localeCompare(b.bezeichnung))
  }

  const normalizeQuantity = (value) => {
    const num = normalizeNumber(value)
    return Math.max(1, Math.floor(num))
  }

  const normalizePrice = (value) => {
    const num = normalizeNumber(value)
    return formatAmount(Math.max(0, num))
  }

  const getEinkaufspreis = (position) => {
    if (position.einkaufsPreis !== null && position.einkaufsPreis !== undefined) {
      return normalizeNumber(position.einkaufsPreis) * position.menge
    }
    return 0
  }

  const getGesamtpreis = (position) => {
    return normalizeNumber(position.verkaufsPreis) * position.menge
  }

  return {
    positions,
    addPosition,
    removePosition,
    isEmptyPosition,
    updatePositionZubehoer,
    updatePositionProdukt,
    getProdukteByZubehoer,
    normalizeQuantity,
    normalizePrice,
    getEinkaufspreis,
    getGesamtpreis
  }
}
