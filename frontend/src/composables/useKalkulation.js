import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createKalkulationApi } from '../services/kalkulationApi'
import { formatAmount, formatDecimal, normalizeNumber } from '../utils/numberFormat'

const EXOTIC_MODEL_OPTION = 'Exotisches Modell'
const MANUAL_CALCULATION_MODEL = 'Manuelle Kalkulation'

export const useKalkulation = () => {
  const api = createKalkulationApi()

  const naechsteId = ref(1)
  const druckermarke = ref('')
  const druckermodell = ref('')
  const variante = ref('')
  const isCatalogLoading = ref(true)
  const catalogError = ref('')
  const kunden = ref([])
  const kundeId = ref(null)
  const projectName = ref('')
  const neuerKundenname = ref('')
  const isCreatingKunde = ref(false)

  const katalog = ref({
    druckermodelle: [],
    zubehoerKategorien: [],
    lieferungOptionen: [],
    mietansaetze: {},
    epFaktoren: {}
  })

  const activeConfigurationVariantId = ref(null)
  const isNewConfigurationDraft = ref(false)
  const configurationVariants = ref([])
  const isRenameConfigurationPanelVisible = ref(false)
  const editingConfigurationVariantName = ref('')
  const isDeleteConfigurationConfirmationVisible = ref(false)

  let isLoadingConfigurationVariant = false
  let isInitialDataLoaded = false
  let saveTimer = null
  let saveSequence = 0

  const eintauschRabattProzent = ref('0.00')
  const lieferungOption = ref('')
  const lieferungBetrag = ref(formatAmount(0))
  const restwertMonate = ref(0)
  const restwertBetrag = ref(formatAmount(0))
  const positions = ref([])

  const selectedKunde = computed(() =>
    kunden.value.find((kunde) => kunde.id === Number(kundeId.value))
  )

  const currentConfigurationKundeId = computed(() =>
    kundeId.value ? Number(kundeId.value) : null
  )

  const getHerstellerName = (modell) =>
    modell.herstellerName ??
    modell.hersteller?.name ??
    modell.hersteller ??
    ''

  const druckermarken = computed(() => {
    const marken = new Set(
      katalog.value.druckermodelle
        .map(getHerstellerName)
        .filter(Boolean)
    )

    return Array.from(marken).sort((a, b) => a.localeCompare(b, 'de-CH'))
  })

  const druckermodelle = computed(() =>
    katalog.value.druckermodelle.map((modell) => modell.name)
  )

  const druckermodelleDerMarke = computed(() =>
    katalog.value.druckermodelle.filter(
      (modell) => getHerstellerName(modell) === druckermarke.value
    )
  )

  const druckermodelleDerMarkeNamen = computed(() =>
    druckermodelleDerMarke.value.map((modell) => modell.name)
  )

  const druckermodelleFuerAuswahl = computed(() => {
    if (!druckermodell.value || isExotischesModell.value) {
      return []
    }

    return druckermodelleDerMarke.value.filter(
      (modell) => modell.name === druckermodell.value
    )
  })

  const selectedDruckermodell = computed(() =>
    katalog.value.druckermodelle.find((modell) => modell.name === druckermodell.value)
  )

  const isExotischesModell = computed(() =>
    druckermarke.value === EXOTIC_MODEL_OPTION
  )

  const selectedVariante = computed(() =>
    selectedDruckermodell.value?.varianten.find(
      (eintrag) => eintrag.bezeichnung === variante.value
    )
  )

  const selectedDruckerPosition = computed(() =>
    positions.value.find(
      (position) =>
        position.zubehoer === 'Drucker' &&
        position.bezeichnung &&
        position.druckermodellId &&
        position.druckerVarianteId
    )
  )

  const hasCompleteMachineSelection = computed(() =>
    Boolean(
      !isExotischesModell.value &&
        !isCatalogLoading.value &&
        selectedDruckermodell.value?.id &&
        selectedVariante.value?.id
    )
  )

  const hasActiveConfigurationVariant = computed(
    () =>
      activeConfigurationVariantId.value !== null &&
      activeConfigurationVariantId.value !== undefined
  )

  const canEditConfigurationSelection = computed(() => !isCatalogLoading.value)

  const canEditPositions = computed(() =>
    Boolean(
      kundeId.value &&
        druckermarke.value &&
        (druckermodell.value || isExotischesModell.value)
    )
  )

  const varianten = computed(() =>
    selectedDruckermodell.value?.varianten.map((eintrag) => eintrag.bezeichnung) ?? []
  )

  const verfuegbaresZubehoer = computed(() => {
    if (!druckermarke.value || !druckermodell.value || isExotischesModell.value) {
      return []
    }

    return druckermodelleFuerAuswahl.value.flatMap((modell) => modell.zubehoer ?? [])
  })

  const zubehoerKategorien = computed(() => {
    const verfuegbareKategorien = new Set(
      verfuegbaresZubehoer.value.map((produkt) => produkt.zubehoer)
    )

    return katalog.value.zubehoerKategorien
      .map((kategorie) => kategorie.name)
      .filter((name) => verfuegbareKategorien.has(name))
  })

  const normalizeKategorieName = (name) =>
    String(name ?? '')
      .trim()
      .replace(/\s*\+\s*/g, ' & ')
      .replace(/\s*\/\s*/g, ' / ')
      .replace(/\s+/g, ' ')

  const getKategorieKey = (name) =>
    normalizeKategorieName(name)
      .toLowerCase()
      .replace(/\s*&\s*/g, '&')
      .replace(/\s*\/\s*/g, '/')

  const getUniqueKategorieNamen = (kategorien) => {
    const seen = new Set()

    return kategorien
      .map((kategorie) => normalizeKategorieName(kategorie))
      .filter(Boolean)
      .filter((kategorie) => {
        const key = getKategorieKey(kategorie)

        if (seen.has(key)) {
          return false
        }

        seen.add(key)
        return true
      })
  }

  const getZubehoerKategorieByName = (name) => {
    const key = getKategorieKey(name)

    return katalog.value.zubehoerKategorien.find(
      (kategorie) => getKategorieKey(kategorie.name) === key
    )
  }

  const positionsKategorien = computed(() => {
    if (!druckermarke.value || (!druckermodell.value && !isExotischesModell.value)) {
      return []
    }

    if (isExotischesModell.value) {
      const kategorien = getUniqueKategorieNamen([
        'Drucker',
        ...katalog.value.zubehoerKategorien.map((kategorie) => kategorie.name)
      ])

      return kategorien.sort((a, b) => {
        if (a === 'Drucker') return -1
        if (b === 'Drucker') return 1

        return a.localeCompare(b, 'de-CH')
      })
    }

    return getUniqueKategorieNamen(['Drucker', ...zubehoerKategorien.value])
  })

  const lieferungOptionen = computed(() => katalog.value.lieferungOptionen)
  const mietansaetze = computed(() => katalog.value.mietansaetze)

  const mietoptionen = computed(() =>
    Object.keys(mietansaetze.value)
      .map(Number)
      .sort((a, b) => a - b)
  )

  const getDruckermodellByName = (name) =>
    katalog.value.druckermodelle.find((modell) => modell.name === name)

  const getDruckermodellById = (id) =>
    katalog.value.druckermodelle.find((modell) => modell.id === Number(id))

  const getVarianteByName = (modellName, variantenName) =>
    getDruckermodellByName(modellName)?.varianten.find(
      (eintrag) => eintrag.bezeichnung === variantenName
    )

  const getDruckerVarianteId = (modellName, variantenName) =>
    getVarianteByName(modellName, variantenName)?.id ?? null

  const getDefaultLieferungOption = () => lieferungOptionen.value[0]?.value ?? ''

  const getLieferungBetrag = (optionValue) =>
    lieferungOptionen.value.find((option) => option.value === optionValue)?.betrag ?? 0

  const getEpFaktorGruppe = () => selectedDruckermodell.value?.epFaktorGruppe ?? null

  const getEpKategorie = (position) => position.epKategorie ?? 'optionen'

  const getEpFaktor = (position) => {
    if (isExotischesModell.value) {
      return 0
    }

    const faktorGruppe = getEpFaktorGruppe()
    const faktoren = faktorGruppe ? katalog.value.epFaktoren[faktorGruppe] : null
    const kategorie = getEpKategorie(position)

    return faktoren?.[kategorie] ?? faktoren?.body ?? 0
  }

  const isConfigurationComplete = (configurationVariant) =>
    Boolean(
      configurationVariant?.druckermodellId &&
        configurationVariant?.druckerVarianteId &&
        configurationVariant?.calculation?.druckermodell &&
        configurationVariant?.calculation?.variante
    )

  const getEinkaufspreis = (position) => {
    if (position.einkaufsPreis !== null && position.einkaufsPreis !== undefined) {
      return normalizeNumber(position.einkaufsPreis)
    }

    return normalizeNumber(position.vp) * getEpFaktor(position)
  }

  const createDruckerPosition = (
    modell = druckermodell.value,
    variantenName = variante.value
  ) => {
    const druckerVariante = getVarianteByName(modell, variantenName)

    return {
      id: 1,
      istDrucker: true,
      druckermodellId: getDruckermodellByName(modell)?.id ?? null,
      druckerVarianteId: druckerVariante?.id ?? null,
      zubehoer: 'Drucker',
      bezeichnung: druckerVariante?.bezeichnung ?? '',
      menge: 1,
      vp: formatAmount(druckerVariante?.verkaufsPreis ?? 0),
      einkaufsPreis:
        druckerVariante?.einkaufsPreis !== null &&
        druckerVariante?.einkaufsPreis !== undefined
          ? formatAmount(druckerVariante.einkaufsPreis)
          : null,
      epKategorie: 'body'
    }
  }

  const createEmptyPosition = (id = 1) => ({
    id,
    zubehoerId: null,
    druckermodellId: null,
    druckerVarianteId: null,
    istDrucker: false,
    zubehoer: '',
    bezeichnung: '',
    menge: 1,
    vp: formatAmount(0),
    einkaufsPreis: null,
    epKategorie: 'optionen'
  })

  const createManualPosition = (id = 1, zubehoer = '') => ({
    id,
    zubehoerId: null,
    druckermodellId: null,
    druckerVarianteId: null,
    istDrucker: zubehoer === 'Drucker',
    zubehoer,
    bezeichnung: '',
    menge: 1,
    vp: formatAmount(0),
    einkaufsPreis: formatAmount(0),
    epKategorie: zubehoer === 'Drucker' ? 'body' : 'optionen'
  })

  const createManualDruckerPosition = (id = 1) => createManualPosition(id, 'Drucker')

  const createDruckerDraftPosition = (id = 1) => ({
    ...createEmptyPosition(id),
    zubehoer: 'Drucker',
    istDrucker: true,
    epKategorie: 'body'
  })

  const createDefaultPositions = () => [createEmptyPosition(1)]

  const clonePositions = (positionen) =>
    positionen.map((position) => ({ ...position }))

  const cloneCalculationSnapshot = (snapshot) => ({
    ...snapshot,
    positions: clonePositions(snapshot.positions ?? [])
  })

  const getProdukteByZubehoer = (zubehoer) => {
    if (isExotischesModell.value) {
      return []
    }

    if (zubehoer === 'Drucker') {
      return druckermodelleFuerAuswahl.value.flatMap((modell) =>
        (modell.varianten ?? []).map((varianteEintrag) => ({
          id: `drucker-${varianteEintrag.id}`,
          zubehoer: 'Drucker',
          bezeichnung: varianteEintrag.bezeichnung,
          vp: varianteEintrag.verkaufsPreis,
          einkaufsPreis: varianteEintrag.einkaufsPreis,
          epKategorie: 'body',
          istDrucker: true,
          druckermodellId: modell.id,
          druckerVarianteId: varianteEintrag.id,
          druckermodell: modell.name
        }))
      )
    }

    return verfuegbaresZubehoer.value.filter((produkt) => produkt.zubehoer === zubehoer)
  }

  const getProdukt = (zubehoer, bezeichnung) =>
    getProdukteByZubehoer(zubehoer).find(
      (produkt) => produkt.bezeichnung === bezeichnung
    )

  const normalizePositionSnapshot = (position, modellName, variantenName) => {
    if (isExotischesModell.value) {
      const zubehoer = normalizeKategorieName(position?.zubehoer ?? '')
      const isDrucker = zubehoer === 'Drucker'

      return {
        ...createManualPosition(position?.id ?? 1, zubehoer),
        ...position,
        id: position?.id ?? 1,
        zubehoer,
        istDrucker: isDrucker,
        druckermodellId: null,
        druckerVarianteId: null,
        zubehoerId: null,
        einkaufsPreis: position?.einkaufsPreis ?? formatAmount(0),
        epKategorie: isDrucker
          ? 'body'
          : getZubehoerKategorieByName(zubehoer)?.epKategorie ?? position?.epKategorie ?? 'optionen'
      }
    }

    if (position?.istDrucker) {
      return {
        ...createDruckerPosition(modellName, variantenName),
        ...position,
        id: position.id ?? 1,
        istDrucker: true,
        zubehoer: 'Drucker',
        epKategorie: 'body'
      }
    }

    const produkt = getProdukt(position?.zubehoer, position?.bezeichnung)

    return {
      id: position?.id ?? naechsteId.value,
      zubehoerId: produkt?.id ?? position?.zubehoerId ?? null,
      druckermodellId: position?.druckermodellId ?? null,
      druckerVarianteId: position?.druckerVarianteId ?? null,
      istDrucker: false,
      zubehoer: position?.zubehoer ?? '',
      bezeichnung: position?.bezeichnung ?? '',
      menge: position?.menge ?? 1,
      vp: position?.vp ?? formatAmount(produkt?.vp ?? 0),
      einkaufsPreis:
        position?.einkaufsPreis ??
        (produkt?.einkaufsPreis !== null && produkt?.einkaufsPreis !== undefined
          ? formatAmount(produkt.einkaufsPreis)
          : null),
      epKategorie: produkt?.epKategorie ?? position?.epKategorie ?? 'optionen'
    }
  }

  const createCalculationSnapshot = () => {
    const druckerPosition = selectedDruckerPosition.value
    const druckermodellId =
      druckerPosition?.druckermodellId ?? selectedDruckermodell.value?.id ?? null
    const druckerVarianteId =
      druckerPosition?.druckerVarianteId ?? selectedVariante.value?.id ?? null
    const variantenName = druckerPosition?.bezeichnung ?? variante.value

    return {
      kundeId: kundeId.value,
      druckermarke: druckermarke.value,
      druckermodellId: isExotischesModell.value ? null : druckermodellId,
      druckerVarianteId: isExotischesModell.value ? null : druckerVarianteId,
      druckermodell: druckermodell.value,
      variante: isExotischesModell.value ? MANUAL_CALCULATION_MODEL : variantenName,
      eintauschRabattProzent: eintauschRabattProzent.value,
      lieferungOption: lieferungOption.value,
      lieferungBetrag: lieferungBetrag.value,
      restwertMonate: restwertMonate.value,
      restwertBetrag: restwertBetrag.value,
      positions: clonePositions(positions.value),
      naechsteId: naechsteId.value
    }
  }

  const createDefaultCalculationSnapshot = (
    modell = druckermodell.value,
    variantenName = ''
  ) => {
    const option = getDefaultLieferungOption()
    const hasVariante = Boolean(variantenName)

    return {
      kundeId: kundeId.value,
      druckermarke: druckermarke.value,
      druckermodellId: hasVariante ? getDruckermodellByName(modell)?.id ?? null : null,
      druckerVarianteId: hasVariante ? getDruckerVarianteId(modell, variantenName) : null,
      druckermodell: modell,
      variante: variantenName,
      eintauschRabattProzent: '0.00',
      lieferungOption: option,
      lieferungBetrag: formatAmount(getLieferungBetrag(option)),
      restwertMonate: 0,
      restwertBetrag: formatAmount(0),
      positions: createDefaultPositions(),
      naechsteId: 2
    }
  }

  const clearCalculationSelection = () => {
    isLoadingConfigurationVariant = true
    druckermodell.value = ''
    variante.value = ''
    eintauschRabattProzent.value = '0.00'
    lieferungOption.value = getDefaultLieferungOption()
    lieferungBetrag.value = formatAmount(getLieferungBetrag(lieferungOption.value))
    restwertMonate.value = 0
    restwertBetrag.value = formatAmount(0)
    positions.value = []
    naechsteId.value = 1
    isLoadingConfigurationVariant = false
  }

  const normalizeCalculationSnapshot = (snapshot) => {
    const fallbackModell = katalog.value.druckermodelle[0]
    const modell =
      getDruckermodellById(snapshot?.druckermodellId) ??
      getDruckermodellByName(snapshot?.druckermodell) ??
      fallbackModell

    const modellName = modell?.name ?? ''
    const variantenName =
      modell?.varianten.find((eintrag) => eintrag.id === Number(snapshot?.druckerVarianteId))
        ?.bezeichnung ??
      snapshot?.variante ??
      ''

    const option = snapshot?.lieferungOption || getDefaultLieferungOption()
    const normalizedPositions = Array.isArray(snapshot?.positions)
      ? snapshot.positions.map((position) =>
          normalizePositionSnapshot(position, modellName, variantenName)
        )
      : createDefaultPositions()

    return {
      kundeId: snapshot?.kundeId ?? null,
      druckermarke:
        snapshot?.druckermarke ??
        getHerstellerName(modell),
      druckermodellId: modell?.id ?? null,
      druckerVarianteId: getDruckerVarianteId(modellName, variantenName),
      druckermodell: modellName,
      variante: variantenName,
      eintauschRabattProzent: snapshot?.eintauschRabattProzent ?? '0.00',
      lieferungOption: option,
      lieferungBetrag: formatAmount(getLieferungBetrag(option)),
      restwertMonate: snapshot?.restwertMonate ?? 0,
      restwertBetrag: snapshot?.restwertBetrag ?? formatAmount(0),
      positions: normalizedPositions,
      naechsteId:
        snapshot?.naechsteId ??
        Math.max(2, ...normalizedPositions.map((position) => Number(position.id) + 1))
    }
  }

  const getSnapshotGesamtpreis = (snapshot) =>
    snapshot.positions.reduce(
      (summe, position) =>
        summe + normalizeNumber(position.menge) * normalizeNumber(position.vp),
      0
    )

  const getSnapshotNettopreis = (snapshot) => {
    const verkaufspreisSnapshot = getSnapshotGesamtpreis(snapshot)
    const eintauschRabattSnapshot =
      verkaufspreisSnapshot * (normalizeNumber(snapshot.eintauschRabattProzent) / 100)
    const restwertSnapshot =
      normalizeNumber(snapshot.restwertMonate) * normalizeNumber(snapshot.restwertBetrag)

    return Math.max(
      0,
      verkaufspreisSnapshot -
        eintauschRabattSnapshot +
        normalizeNumber(snapshot.lieferungBetrag) +
        restwertSnapshot
    )
  }

  const mapConfigurationFromApi = (configurationVariant) => {
    const kundeIdFromDatabase = configurationVariant.kundeId ?? null
    const calculation = normalizeCalculationSnapshot(configurationVariant.calculation)
    calculation.kundeId = kundeIdFromDatabase

    return {
      id: configurationVariant.id,
      name: configurationVariant.name,
      kundeId: kundeIdFromDatabase,
      druckermodellId: configurationVariant.druckermodellId,
      druckerVarianteId: configurationVariant.druckerVarianteId,
      druckermodell: calculation.druckermodell,
      total: configurationVariant.total ?? getSnapshotNettopreis(calculation),
      calculation
    }
  }

  const createConfigurationPayload = (configurationVariant) => {
    const calculation = cloneCalculationSnapshot(configurationVariant.calculation)

    return {
      name: configurationVariant.name,
      kundeId: configurationVariant.kundeId ?? null,
      druckermodellId: calculation.druckermodellId,
      druckerVarianteId: calculation.druckerVarianteId,
      total: configurationVariant.total,
      calculation
    }
  }

  const persistConfigurationVariant = async (configurationVariant) => {
    if (!configurationVariant?.id || !isConfigurationComplete(configurationVariant)) {
      return
    }

    const sequence = ++saveSequence

    await api.updateKonfiguration(
      configurationVariant.id,
      createConfigurationPayload(configurationVariant)
    )

    if (sequence === saveSequence) {
      catalogError.value = ''
    }
  }

  const queueSaveConfigurationVariant = (configurationVariant) => {
    if (
      isExotischesModell.value ||
      !isInitialDataLoaded ||
      !configurationVariant?.id ||
      !isConfigurationComplete(configurationVariant)
    ) {
      return
    }

    window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(() => {
      persistConfigurationVariant(configurationVariant).catch((error) => {
        catalogError.value = `Projekt konnte nicht gespeichert werden: ${error.message}`
      })
    }, 350)
  }

  const getActiveConfigurationVariant = () =>
    configurationVariants.value.find(
      (configurationVariant) => configurationVariant.id === activeConfigurationVariantId.value
    )

  const saveActiveConfigurationVariant = (shouldPersist = true) => {
    if (
      isExotischesModell.value ||
      isLoadingConfigurationVariant ||
      !hasCompleteMachineSelection.value
    ) {
      return
    }

    const activeConfigurationVariant = getActiveConfigurationVariant()

    if (!activeConfigurationVariant) {
      return
    }

    activeConfigurationVariant.calculation = createCalculationSnapshot()
    activeConfigurationVariant.kundeId = currentConfigurationKundeId.value
    activeConfigurationVariant.druckermodellId = activeConfigurationVariant.calculation.druckermodellId
    activeConfigurationVariant.druckerVarianteId = activeConfigurationVariant.calculation.druckerVarianteId
    activeConfigurationVariant.druckermodell = druckermodell.value
    activeConfigurationVariant.total = nettopreis.value

    if (shouldPersist) {
      queueSaveConfigurationVariant(activeConfigurationVariant)
    }
  }

  const loadConfigurationVariant = (configurationVariant) => {
    if (!configurationVariant) {
      return
    }

    projectName.value = configurationVariant.name ?? ''
    loadCalculationSnapshot(configurationVariant.calculation)
  }

  const loadCalculationSnapshot = (calculation) => {
    const snapshot = normalizeCalculationSnapshot(calculation)

    isLoadingConfigurationVariant = true
    druckermarke.value = snapshot.druckermarke ?? ''
    druckermodell.value = snapshot.druckermodell
    kundeId.value = snapshot.kundeId ?? null
    variante.value = snapshot.variante
    eintauschRabattProzent.value = snapshot.eintauschRabattProzent
    lieferungOption.value = snapshot.lieferungOption
    lieferungBetrag.value = snapshot.lieferungBetrag
    restwertMonate.value = snapshot.restwertMonate
    restwertBetrag.value = snapshot.restwertBetrag
    positions.value = clonePositions(snapshot.positions)
    naechsteId.value = snapshot.naechsteId
    isLoadingConfigurationVariant = false
  }

  const createConfigurationVariantInDatabase = async (
    modell,
    calculation = createDefaultCalculationSnapshot(modell),
    name = getNextConfigurationVariantName(modell)
  ) => {
    const calculationWithKunde = {
      ...calculation,
      kundeId: currentConfigurationKundeId.value
    }

    const payload = {
      name,
      kundeId: calculationWithKunde.kundeId,
      druckermodellId: calculationWithKunde.druckermodellId,
      druckerVarianteId: calculationWithKunde.druckerVarianteId,
      total: getSnapshotNettopreis(calculationWithKunde),
      calculation: calculationWithKunde
    }

    const savedConfigurationVariant = await api.createKonfiguration(payload)

    return mapConfigurationFromApi(savedConfigurationVariant)
  }

  const getGesamtpreis = (position) =>
    normalizeNumber(position.menge) * normalizeNumber(position.vp)

  const updatePositionZubehoer = (position) => {
    const isDrucker = position.zubehoer === 'Drucker'

    position.bezeichnung = ''
    position.zubehoerId = null
    position.druckermodellId = null
    position.druckerVarianteId = null
    position.istDrucker = isDrucker
    position.vp = formatAmount(0)
    position.einkaufsPreis = isExotischesModell.value ? formatAmount(0) : null
    position.epKategorie = isDrucker
      ? 'body'
      : getZubehoerKategorieByName(position.zubehoer)?.epKategorie ?? 'optionen'
  }

  const updatePositionProdukt = (position) => {
    if (isExotischesModell.value) {
      position.istDrucker = position.zubehoer === 'Drucker'
      position.druckermodellId = null
      position.druckerVarianteId = null
      position.zubehoerId = null
      position.epKategorie = position.zubehoer === 'Drucker'
        ? 'body'
        : getZubehoerKategorieByName(position.zubehoer)?.epKategorie ?? 'optionen'
      return
    }

    const produkt = getProdukt(position.zubehoer, position.bezeichnung)

    if (!produkt) {
      position.zubehoerId = null
      position.druckermodellId = null
      position.druckerVarianteId = null
      position.istDrucker = position.zubehoer === 'Drucker'
      position.vp = formatAmount(0)
      position.einkaufsPreis = null
      position.epKategorie = position.zubehoer === 'Drucker'
        ? 'body'
        : getZubehoerKategorieByName(position.zubehoer)?.epKategorie ?? 'optionen'
      return
    }

    if (position.zubehoer === 'Drucker') {
      position.istDrucker = true
      position.zubehoerId = null
      position.druckermodellId = produkt.druckermodellId
      position.druckerVarianteId = produkt.druckerVarianteId
      position.vp = formatAmount(produkt.vp)
      position.einkaufsPreis =
        produkt.einkaufsPreis !== null && produkt.einkaufsPreis !== undefined
          ? formatAmount(produkt.einkaufsPreis)
          : null
      position.epKategorie = 'body'

      druckermodell.value = produkt.druckermodell
      variante.value = produkt.bezeichnung

      return
    }

    position.istDrucker = false
    position.druckermodellId = null
    position.druckerVarianteId = null
    position.zubehoerId = produkt.id
    position.vp = formatAmount(produkt.vp)
    position.einkaufsPreis =
      produkt.einkaufsPreis !== null && produkt.einkaufsPreis !== undefined
        ? formatAmount(produkt.einkaufsPreis)
        : null
    position.epKategorie = produkt.epKategorie ?? 'optionen'
  }

  const normalizeQuantity = (position) => {
    const menge = Math.trunc(normalizeNumber(position.menge))
    position.menge = Math.max(1, menge)
  }

  const normalizePrice = (position) => {
    position.vp = formatAmount(normalizeNumber(position.vp))
  }

  const normalizePercent = () => {
    const rabatt = normalizeNumber(eintauschRabattProzent.value)
    eintauschRabattProzent.value = formatDecimal(Math.max(0, Math.min(100, rabatt)))
  }

  const updateLieferungOption = (optionValue = lieferungOption.value) => {
    lieferungOption.value = optionValue
    lieferungBetrag.value = formatAmount(getLieferungBetrag(optionValue))
  }

  const normalizeRestwertBetrag = () => {
    restwertBetrag.value = formatAmount(Math.max(0, normalizeNumber(restwertBetrag.value)))
  }

  const normalizeRestwertMonate = () => {
    const monate = Math.trunc(normalizeNumber(restwertMonate.value))
    restwertMonate.value = Math.max(0, monate)
  }

  const isEmptyPosition = (position) =>
    !position.zubehoer &&
    !position.bezeichnung &&
    normalizeNumber(position.vp) === 0 &&
    getEinkaufspreis(position) === 0

  const verkaufspreis = computed(() =>
    positions.value.reduce(
      (summe, position) => summe + getGesamtpreis(position),
      0
    )
  )

  const einkaufspreis = computed(() =>
    positions.value.reduce(
      (summe, position) =>
        summe + normalizeNumber(position.menge) * getEinkaufspreis(position),
      0
    )
  )

  const eintauschRabattBetrag = computed(() =>
    verkaufspreis.value * (normalizeNumber(eintauschRabattProzent.value) / 100)
  )

  const restwertGesamt = computed(() =>
    normalizeNumber(restwertMonate.value) * normalizeNumber(restwertBetrag.value)
  )

  const nettopreis = computed(() =>
    Math.max(
      0,
      verkaufspreis.value -
        eintauschRabattBetrag.value +
        normalizeNumber(lieferungBetrag.value) +
        restwertGesamt.value
    )
  )

  const mietbasis = computed(() => Math.max(0, nettopreis.value))

  const getMietbetrag = (monate) => {
    const mietansatz = mietansaetze.value[monate]

    if (!mietansatz || mietansatz <= 0) {
      return 0
    }

    return Math.round(mietbasis.value / mietansatz)
  }

  const hasValidPosition = computed(() =>
    positions.value.some((position) => {
      const hasBaseData =
        position.zubehoer &&
        position.bezeichnung &&
        normalizeNumber(position.menge) > 0

      if (!hasBaseData) {
        return false
      }

      if (isExotischesModell.value) {
        return normalizeNumber(position.vp) > 0 || getEinkaufspreis(position) > 0
      }

      if (position.zubehoer === 'Drucker') {
        return Boolean(position.druckermodellId && position.druckerVarianteId)
      }

      return Boolean(position.zubehoerId)
    })
  )

  const hasValidDruckerPosition = computed(() => {
    if (isExotischesModell.value) {
      return positions.value.some(
        (position) => position.zubehoer === 'Drucker' && position.bezeichnung
      )
    }

    return Boolean(selectedDruckerPosition.value)
  })

  const canSaveProject = computed(() =>
    Boolean(
      !isExotischesModell.value &&
        currentConfigurationKundeId.value &&
        druckermarke.value &&
        druckermodell.value &&
        hasValidPosition.value &&
        hasValidDruckerPosition.value
    )
  )

  const filteredConfigurationVariants = computed(() =>
    configurationVariants.value.filter(
      (configurationVariant) => isConfigurationComplete(configurationVariant)
    )
  )

  const getConfigurationPositionCount = (configurationVariant) =>
    configurationVariant.calculation.positions.filter(
      (position) =>
        position.zubehoer ||
        position.bezeichnung ||
        normalizeNumber(position.vp) > 0
    ).length

  const getConfigurationMeta = (configurationVariant) => {
    const positionCount = getConfigurationPositionCount(configurationVariant)
    const positionLabel = positionCount === 1 ? 'Position' : 'Positionen'
    const kundeName =
      kunden.value.find((kunde) => kunde.id === configurationVariant.kundeId)?.firmenname ??
      'Ohne Kunde'

    return {
      line1: `${kundeName} · ${positionCount} ${positionLabel}`,
      line2: `${configurationVariant.calculation.druckermodell} · ${configurationVariant.calculation.variante}`
    }
  }

  const activeConfigurationName = computed(
    () => getActiveConfigurationVariant()?.name ?? (projectName.value.trim() || 'Kein Projekt')
  )

  const deleteConfigurationConfirmationText = computed(
    () => `„${activeConfigurationName.value}“ wirklich löschen?`
  )

  const isEditingConfigurationNameDuplicate = computed(() => {
    const name = editingConfigurationVariantName.value.trim()
    const editingConfigurationVariant = getActiveConfigurationVariant()

    if (!name || !editingConfigurationVariant) {
      return false
    }

    return configurationVariants.value.some(
      (configurationVariant) =>
        configurationVariant.id !== editingConfigurationVariant.id &&
        configurationVariant.kundeId === editingConfigurationVariant.kundeId &&
        configurationVariant.name === name
    )
  })

  const canSaveConfigurationVariantName = computed(() => {
    const name = editingConfigurationVariantName.value.trim()

    return name.length > 0 && !isEditingConfigurationNameDuplicate.value
  })

  const getUniqueConfigurationName = (modell, baseName) => {
    const existingNames = configurationVariants.value
      .filter(isConfigurationComplete)
      .map((configurationVariant) => configurationVariant.name)

    if (!existingNames.includes(baseName)) {
      return baseName
    }

    let suffix = 2
    let name = `${baseName} ${suffix}`

    while (existingNames.includes(name)) {
      suffix += 1
      name = `${baseName} ${suffix}`
    }

    return name
  }

  const getNextConfigurationVariantName = (modell) => {
    const alternativesCount = configurationVariants.value.filter(
      (configurationVariant) =>
        isConfigurationComplete(configurationVariant) &&
        configurationVariant.name.startsWith('Alternative')
    ).length

    return getUniqueConfigurationName(modell, `Alternative ${alternativesCount + 1}`)
  }

  const getProjectConfigurationBaseName = () => {
    const druckerPosition = selectedDruckerPosition.value
    const druckerName = [druckermodell.value, druckerPosition?.bezeichnung]
      .filter(Boolean)
      .join(' ')
      .trim()

    if (druckerName) {
      return druckerName
    }

    if (projectName.value.trim()) {
      return projectName.value.trim()
    }

    return 'Projekt'
  }

  const updateProjectName = (name) => {
    projectName.value = name

    const activeConfigurationVariant = getActiveConfigurationVariant()
    const cleanName = name.trim()

    if (!activeConfigurationVariant || !cleanName || activeConfigurationVariant.name === cleanName) {
      return
    }

    activeConfigurationVariant.name = cleanName
    queueSaveConfigurationVariant(activeConfigurationVariant)
  }

  const normalizeProjectName = () => {
    const cleanName = projectName.value.trim()
    const activeConfigurationVariant = getActiveConfigurationVariant()

    if (!cleanName) {
      projectName.value = activeConfigurationVariant?.name ?? ''
      return
    }

    updateProjectName(cleanName)
  }

  const generateDuplicateConfigurationName = (modell, configName) => {
    const existingNames = configurationVariants.value
      .filter(isConfigurationComplete)
      .map((configurationVariant) => configurationVariant.name)

    const cleanName = configName
      .replace(/^Kopie von\s+/i, '')
      .replace(/\s+Kopie(\s+\d+)?$/i, '')
      .trim()

    if (cleanName === 'Standard' || cleanName.startsWith('Alternative')) {
      let index = 1
      let candidate = `Alternative ${index}`

      while (existingNames.includes(candidate)) {
        index += 1
        candidate = `Alternative ${index}`
      }

      return candidate
    }

    let index = 1
    let candidate = `${cleanName} Kopie`

    while (existingNames.includes(candidate)) {
      index += 1
      candidate = `${cleanName} Kopie ${index}`
    }

    return candidate
  }

  const selectDruckermarke = (marke) => {
    if (
      marke === druckermarke.value ||
      !canEditConfigurationSelection.value ||
      !kundeId.value
    ) {
      return
    }

    saveActiveConfigurationVariant()

    druckermarke.value = marke
    variante.value = ''
    catalogError.value = ''

    if (marke === EXOTIC_MODEL_OPTION) {
      druckermodell.value = MANUAL_CALCULATION_MODEL
      positions.value = [createManualDruckerPosition(1)]
      naechsteId.value = 2
    } else {
      druckermodell.value = ''
      positions.value = []
      naechsteId.value = 1
    }

    if (!hasActiveConfigurationVariant.value) {
      isNewConfigurationDraft.value = true
    }
  }

  const selectDruckermodell = (modell) => {
    if (
      isExotischesModell.value ||
      modell === druckermodell.value ||
      !canEditConfigurationSelection.value
    ) {
      return
    }

    saveActiveConfigurationVariant()

    druckermodell.value = modell
    variante.value = ''
    positions.value = modell ? [createDruckerDraftPosition(1)] : []
    naechsteId.value = modell ? 2 : 1
    catalogError.value = ''

    if (!hasActiveConfigurationVariant.value) {
      isNewConfigurationDraft.value = true
    }
  }

  const selectVariante = (nextVariante) => {
    if (nextVariante === variante.value || !canEditConfigurationSelection.value) {
      return
    }

    saveActiveConfigurationVariant()

    if (!druckermodell.value || !nextVariante) {
      variante.value = ''
      positions.value = []
      naechsteId.value = 1
      return
    }

    loadCalculationSnapshot(createDefaultCalculationSnapshot(druckermodell.value, nextVariante))
  }

  const selectKunde = (id) => {
    const nextKundeId = id ? Number(id) : null

    if (nextKundeId === kundeId.value || !canEditConfigurationSelection.value) {
      return
    }

    saveActiveConfigurationVariant()
    kundeId.value = nextKundeId
    catalogError.value = ''

    if (!nextKundeId) {
      druckermarke.value = ''
      druckermodell.value = ''
      variante.value = ''
      positions.value = []
      naechsteId.value = 1
      return
    }

    const activeConfigurationVariant = getActiveConfigurationVariant()

    if (
      activeConfigurationVariant &&
      hasCompleteMachineSelection.value &&
      !isExotischesModell.value
    ) {
      activeConfigurationVariant.kundeId = nextKundeId
      activeConfigurationVariant.calculation = createCalculationSnapshot()
      activeConfigurationVariant.calculation.kundeId = nextKundeId
      queueSaveConfigurationVariant(activeConfigurationVariant)
    }
  }

  const createKunde = async () => {
    const firmenname = neuerKundenname.value.trim()

    if (!firmenname || isCreatingKunde.value) {
      return
    }

    isCreatingKunde.value = true

    try {
      const kunde = await api.createKunde({ firmenname })

      kunden.value = [...kunden.value, kunde].sort((a, b) =>
        a.firmenname.localeCompare(b.firmenname, 'de-CH')
      )
      neuerKundenname.value = ''
      catalogError.value = ''
    } catch (error) {
      catalogError.value = `Kunde konnte nicht erstellt werden: ${error.message}`
    } finally {
      isCreatingKunde.value = false
    }
  }

  const selectConfigurationVariant = (id) => {
    if (id === activeConfigurationVariantId.value) {
      return
    }

    isRenameConfigurationPanelVisible.value = false
    isDeleteConfigurationConfirmationVisible.value = false
    saveActiveConfigurationVariant()
    isNewConfigurationDraft.value = false
    activeConfigurationVariantId.value = id
    loadConfigurationVariant(getActiveConfigurationVariant())
  }

  const addConfigurationVariant = async () => {
    if (!canSaveProject.value) {
      catalogError.value =
        'Bitte Kunde, Druckermarke, Druckermodell und eine Druckerposition erfassen.'
      return null
    }

    try {
      const calculation = createCalculationSnapshot()
      const name = getUniqueConfigurationName(
        druckermodell.value,
        getProjectConfigurationBaseName()
      )

      const configurationVariant = await createConfigurationVariantInDatabase(
        druckermodell.value,
        calculation,
        name
      )

      configurationVariants.value.push(configurationVariant)
      activeConfigurationVariantId.value = configurationVariant.id
      isNewConfigurationDraft.value = false
      projectName.value = configurationVariant.name
      catalogError.value = ''

      return configurationVariant
    } catch (error) {
      catalogError.value = `Projekt konnte nicht erstellt werden: ${error.message}`
      return null
    }
  }

  const saveProject = async () => {
    const savedProject = await addConfigurationVariant()

    if (!savedProject) {
      return
    }

    activeConfigurationVariantId.value = null
    isNewConfigurationDraft.value = false
    projectName.value = ''
    kundeId.value = null
    druckermarke.value = ''
    clearCalculationSelection()
  }

  const startNewConfiguration = () => {
    saveActiveConfigurationVariant()
    activeConfigurationVariantId.value = null
    isNewConfigurationDraft.value = true
    kundeId.value = null
    projectName.value = ''
    druckermarke.value = ''
    clearCalculationSelection()
    isRenameConfigurationPanelVisible.value = false
    isDeleteConfigurationConfirmationVisible.value = false
    editingConfigurationVariantName.value = ''
    catalogError.value = ''
  }

  const renameConfigurationVariant = () => {
    const activeConfigurationVariant = getActiveConfigurationVariant()

    if (!activeConfigurationVariant) {
      return
    }

    isDeleteConfigurationConfirmationVisible.value = false
    isRenameConfigurationPanelVisible.value = true
    editingConfigurationVariantName.value = activeConfigurationVariant.name
  }

  const commitConfigurationVariantRename = async () => {
    const configurationVariant = getActiveConfigurationVariant()
    const name = editingConfigurationVariantName.value.trim()

    if (!configurationVariant) {
      cancelConfigurationVariantRename()
      return
    }

    if (!canSaveConfigurationVariantName.value) {
      return
    }

    configurationVariant.name = name
    projectName.value = name
    isRenameConfigurationPanelVisible.value = false
    editingConfigurationVariantName.value = ''

    try {
      await persistConfigurationVariant(configurationVariant)
    } catch (error) {
      catalogError.value = `Name konnte nicht gespeichert werden: ${error.message}`
    }
  }

  const cancelConfigurationVariantRename = () => {
    isRenameConfigurationPanelVisible.value = false
    editingConfigurationVariantName.value = ''
  }

  const duplicateConfigurationVariant = async () => {
    saveActiveConfigurationVariant()

    const activeConfigurationVariant = getActiveConfigurationVariant()

    if (!activeConfigurationVariant) {
      return
    }

    try {
      const name = generateDuplicateConfigurationName(
        activeConfigurationVariant.druckermodell,
        activeConfigurationVariant.name
      )

      const configurationVariant = await createConfigurationVariantInDatabase(
        activeConfigurationVariant.druckermodell,
        cloneCalculationSnapshot(activeConfigurationVariant.calculation),
        name
      )

      configurationVariants.value.push(configurationVariant)
      activeConfigurationVariantId.value = configurationVariant.id
      isNewConfigurationDraft.value = false
      projectName.value = configurationVariant.name
      loadConfigurationVariant(configurationVariant)
    } catch (error) {
      catalogError.value = `Projekt konnte nicht dupliziert werden: ${error.message}`
    }
  }

  const deleteConfigurationVariant = () => {
    if (!getActiveConfigurationVariant()) {
      return
    }

    isDeleteConfigurationConfirmationVisible.value = true
  }

  const cancelDeleteConfigurationVariant = () => {
    isDeleteConfigurationConfirmationVisible.value = false
  }

  const confirmDeleteConfigurationVariant = async () => {
    if (!getActiveConfigurationVariant()) {
      isDeleteConfigurationConfirmationVisible.value = false
      return
    }

    const deletedId = activeConfigurationVariantId.value
    const activeIndex = filteredConfigurationVariants.value.findIndex(
      (configurationVariant) => configurationVariant.id === deletedId
    )
    const nextActiveIndex = Math.max(0, activeIndex - 1)

    try {
      await api.deleteKonfiguration(deletedId)
      configurationVariants.value = configurationVariants.value.filter(
        (configurationVariant) => configurationVariant.id !== deletedId
      )

      const nextConfigurationVariant =
        filteredConfigurationVariants.value[nextActiveIndex] ??
        filteredConfigurationVariants.value[0] ??
        null

      activeConfigurationVariantId.value = nextConfigurationVariant?.id ?? null

      if (nextConfigurationVariant) {
        isNewConfigurationDraft.value = false
        loadConfigurationVariant(nextConfigurationVariant)
      } else {
        isNewConfigurationDraft.value = false
        kundeId.value = null
        projectName.value = ''
        druckermarke.value = ''
        clearCalculationSelection()
      }

      isDeleteConfigurationConfirmationVisible.value = false
    } catch (error) {
      catalogError.value = `Projekt konnte nicht gelöscht werden: ${error.message}`
    }
  }

  const addPosition = () => {
    if (!canEditPositions.value) {
      return
    }

    positions.value.push(
      isExotischesModell.value
        ? createManualPosition(naechsteId.value)
        : createEmptyPosition(naechsteId.value)
    )
    naechsteId.value += 1
  }

  const removePosition = (id) => {
    const positionIndex = positions.value.findIndex((position) => position.id === id)
    const position = positions.value[positionIndex]

    if (!isExotischesModell.value && positionIndex === 0 && position?.zubehoer === 'Drucker') {
      return
    }

    positions.value = positions.value.filter((position) => position.id !== id)
  }

  const loadInitialData = async () => {
    isCatalogLoading.value = true
    catalogError.value = ''

    try {
      const [loadedKatalog, loadedKunden] = await Promise.all([
        api.getKatalog(),
        api.getKunden()
      ])

      katalog.value = loadedKatalog
      kunden.value = loadedKunden

      if (!katalog.value.druckermodelle.length) {
        throw new Error('Keine Druckermodelle in der Datenbank gefunden')
      }

      const savedConfigurations = await api.getKonfigurationen()
      configurationVariants.value = savedConfigurations
        .map(mapConfigurationFromApi)
        .filter(isConfigurationComplete)

      kundeId.value = null
      projectName.value = ''
      activeConfigurationVariantId.value = null
      isNewConfigurationDraft.value = false
      druckermarke.value = ''
      clearCalculationSelection()

      isInitialDataLoaded = true
    } catch (error) {
      catalogError.value = `Datenbank konnte nicht geladen werden: ${error.message}`
    } finally {
      isCatalogLoading.value = false
    }
  }

  watch(
    [lieferungOption, lieferungOptionen],
    ([optionValue]) => {
      if (!optionValue) {
        return
      }

      const nextLieferungBetrag = formatAmount(getLieferungBetrag(optionValue))

      if (lieferungBetrag.value !== nextLieferungBetrag) {
        lieferungBetrag.value = nextLieferungBetrag
      }
    },
    { deep: true }
  )

  watch(
    [
      druckermodell,
      variante,
      eintauschRabattProzent,
      lieferungOption,
      lieferungBetrag,
      restwertMonate,
      restwertBetrag,
      positions,
      nettopreis
    ],
    () => {
      saveActiveConfigurationVariant()
    },
    { deep: true }
  )

  onMounted(loadInitialData)

  onBeforeUnmount(() => {
    window.clearTimeout(saveTimer)
    saveActiveConfigurationVariant()

    const activeConfigurationVariant = getActiveConfigurationVariant()

    if (activeConfigurationVariant && !isExotischesModell.value) {
      persistConfigurationVariant(activeConfigurationVariant).catch(() => {})
    }
  })

  return {
    isCatalogLoading,
    catalogError,
    kunden,
    kundeId,
    projectName,
    updateProjectName,
    normalizeProjectName,
    selectedKunde,
    neuerKundenname,
    isCreatingKunde,
    selectKunde,
    createKunde,

    druckermarke,
    druckermarken,
    selectDruckermarke,
    isExotischesModell,
    canSaveProject,
    saveProject,

    druckermodell,
    selectDruckermodell,
    druckermodelle,
    druckermodelleDerMarkeNamen,
    variante,
    selectVariante,
    varianten,

    canEditConfigurationSelection,
    canEditPositions,
    configurationVariants,
    startNewConfiguration,

    positions,
    isEmptyPosition,
    updatePositionZubehoer,
    zubehoerKategorien,
    positionsKategorien,
    updatePositionProdukt,
    getProdukteByZubehoer,
    normalizeQuantity,
    normalizePrice,
    formatAmount,
    getEinkaufspreis,
    getGesamtpreis,
    removePosition,
    addPosition,

    verkaufspreis,
    einkaufspreis,
    eintauschRabattProzent,
    normalizePercent,
    eintauschRabattBetrag,
    lieferungOption,
    updateLieferungOption,
    lieferungOptionen,
    lieferungBetrag,
    restwertMonate,
    normalizeRestwertMonate,
    restwertBetrag,
    normalizeRestwertBetrag,
    nettopreis,
    mietoptionen,
    getMietbetrag,
    mietbasis,

    filteredConfigurationVariants,
    activeConfigurationVariantId,
    selectConfigurationVariant,
    getConfigurationMeta,
    activeConfigurationName,
    isRenameConfigurationPanelVisible,
    isDeleteConfigurationConfirmationVisible,
    editingConfigurationVariantName,
    commitConfigurationVariantRename,
    cancelConfigurationVariantRename,
    isEditingConfigurationNameDuplicate,
    canSaveConfigurationVariantName,
    deleteConfigurationConfirmationText,
    cancelDeleteConfigurationVariant,
    confirmDeleteConfigurationVariant,
    renameConfigurationVariant,
    duplicateConfigurationVariant,
    deleteConfigurationVariant
  }
}
