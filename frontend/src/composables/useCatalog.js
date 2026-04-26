/**
 * Composable für Katalog-Management (Druckermodelle, Zubehör, etc.)
 */
import { computed, ref } from 'vue'
import { createKalkulationApi } from '../services/kalkulationApi'

export const useCatalog = () => {
  const api = createKalkulationApi()
  const isCatalogLoading = ref(true)
  const catalogError = ref('')

  const katalog = ref({
    druckermodelle: [],
    zubehoerKategorien: [],
    lieferungOptionen: [],
    mietansaetze: {},
    epFaktoren: {}
  })

  const druckermodelle = computed(() =>
    katalog.value.druckermodelle.map((modell) => modell.name)
  )

  const getDruckermodellByName = (name) =>
    katalog.value.druckermodelle.find((modell) => modell.name === name)

  const getDruckermodellById = (id) =>
    katalog.value.druckermodelle.find((modell) => modell.id === Number(id))

  const getVarianteByName = (modellName, variantenName) =>
    getDruckermodellByName(modellName)?.varianten.find(
      (eintrag) => eintrag.bezeichnung === variantenName
    )

  const getDefaultVarianteName = (modellName) =>
    getDruckermodellByName(modellName)?.varianten[0]?.bezeichnung

  const lieferungOptionen = computed(() => katalog.value.lieferungOptionen)
  const mietansaetze = computed(() => katalog.value.mietansaetze)

  const mietoptionen = computed(() =>
    Object.keys(mietansaetze.value)
      .map(Number)
      .sort((a, b) => a - b)
  )

  const loadCatalog = async () => {
    isCatalogLoading.value = true
    catalogError.value = ''

    try {
      const loadedKatalog = await api.getKatalog()
      katalog.value = loadedKatalog

      if (!katalog.value.druckermodelle.length) {
        throw new Error('Keine Druckermodelle in der Datenbank gefunden')
      }
    } catch (error) {
      catalogError.value = `Katalog konnte nicht geladen werden: ${error.message}`
      throw error
    } finally {
      isCatalogLoading.value = false
    }
  }

  return {
    isCatalogLoading,
    catalogError,
    katalog,
    druckermodelle,
    lieferungOptionen,
    mietansaetze,
    mietoptionen,
    getDruckermodellByName,
    getDruckermodellById,
    getVarianteByName,
    getDefaultVarianteName,
    loadCatalog
  }
}
