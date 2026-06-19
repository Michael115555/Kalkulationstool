import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { createKalkulationApi } from '../services/kalkulationApi'
import {
  calculateCombinedScanFee,
  calculateLineTotal,
  calculateNetPrice,
  calculateNpkClosingFee,
  calculateServiceFeePerMonth,
  calculateSalesTotal,
  calculateVrgFee
} from '../utils/kalkulationMath'
import {
  formatAmount,
  formatDecimal,
  formatInteger,
  normalizeNumber
} from '../utils/numberFormat'

const EXOTIC_MODEL_OPTION = 'Exotisches Modell'
const MANUAL_CALCULATION_MODEL = 'Manuelle Kalkulation'
const MANUAL_POSITION_CATEGORY = 'Diverses'
const KONDITIONEN_A3_MFP_SELECTION_VERSION = 5
const INCLUDED_DELIVERY_OPTION = 'inkl'
const INCLUDED_DELIVERY_CONDITION_KEYS = new Set([
  'bereitstellung_vorkonfiguration_justagen',
  'lieferung_standort_kurzinstruktion'
])
const CUSTOM_CONDITION_OPTIONS = {
  fleetmanager_printfacts_erstinstallation: [
    { value: 'betrag', label: 'Fr. 190.00' },
    { value: 'preis_120', label: 'Fr. 120.00' },
    { value: 'keine', label: 'keine' },
    { value: 'inkl', label: 'inkl.' }
  ],
  fleetmanager_printfacts_monat_geraet: [
    { value: 'preis_4', label: 'Fr. 4.00' },
    { value: 'betrag', label: 'Fr. 2.00' },
    { value: 'preis_1', label: 'Fr. 1.00' },
    { value: 'inkl', label: 'inkl.' }
  ]
}
const KONDITIONEN_A3_MFP = [
  {
    key: 'bereitstellung_vorkonfiguration_justagen',
    label: 'Bereitstellung, Vorkonfiguration und Justagen',
    einheit: 'pauschal',
    betragText: '390.00'
  },
  {
    key: 'lieferung_standort_kurzinstruktion',
    label: 'Lieferung zum Standort inkl. Kurzinstruktion',
    einheit: 'pauschal',
    betragText: '400.00'
  },
  {
    key: 'lieferung_treppenlift',
    label: 'Lieferung zusätzlich mit Treppenlift',
    einheit: 'pauschal',
    betragText: '150.00'
  },
  {
    key: 'vorabklaerung_netzwerkinstallation',
    label: 'Vorabklärung Netzwerkinstallation',
    einheit: 'pauschal',
    betragText: '150.00'
  },
  {
    key: 'netzwerkintegration_max_2_stunden',
    label: 'Netzwerkintegration max. 2 Stunden',
    einheit: 'pauschal',
    betragText: '350.00'
  },
  {
    key: 'zusaetzliche_dienstleistungen',
    label: 'Zusätzliche Dienstleistungen',
    einheit: 'Stundenansatz',
    betragText: '190.00'
  },
  {
    key: 'ruecknahme_demontage',
    label: 'Rücknahme / Demontage',
    einheit: 'pauschal',
    betragText: '350.00'
  },
  {
    key: 'datensicherheit_datenloeschung',
    label: 'Datensicherheit/ Datenlöschung',
    einheit: 'pauschal',
    betragText: '190.00-490.00'
  },
  {
    key: 'fleetmanager_printfacts_erstinstallation',
    label: 'Fleetmanager Printfacts',
    einheit: 'Erstinstallation',
    betragText: '190.00'
  },
  {
    key: 'fleetmanager_printfacts_monat_geraet',
    label: 'Fleetmanager Printfacts',
    einheit: 'pro Monat und Gerät',
    betragText: '2.00'
  },
  {
    key: 'vorgezogene_recyclinggebuehr_swico',
    label: 'Vorgezogene Recyclinggebühr (Swico)',
    einheit: '',
    betragText: '185.70'
  },
  {
    key: 'npk_abschlussgebuehr',
    label: 'NPK Abschlussgebühr',
    einheit: '',
    betragText: '-'
  }
]

export const useKalkulation = (options = {}) => {
  const api = createKalkulationApi()

  const getOptionValue = (value) => {
    if (typeof value === 'function') {
      return value()
    }

    return unref(value)
  }

  const getProjectIdFromOptions = () => {
    const projectId = Number(getOptionValue(options.projektId))

    return Number.isInteger(projectId) && projectId > 0 ? projectId : null
  }

  const naechsteId = ref(1)
  const druckermarke = ref('')
  const druckermodell = ref('')
  const variante = ref('')
  const isCatalogLoading = ref(true)
  const catalogError = ref('')
  const kunden = ref([])
  const kundeId = ref(null)
  const projectName = ref('')

  const katalog = ref({
    druckermodelle: [],
    zubehoerKategorien: [],
    lieferungOptionen: [],
    mietansaetze: {},
    epFaktoren: {}
  })

  const activeConfigurationVariantId = ref(null)
  const editingProjectId = ref(null)
  const editingProjectSavedFingerprint = ref('')
  const isNewConfigurationDraft = ref(false)
  const configurationVariants = ref([])

  let isLoadingConfigurationVariant = false
  let isInitialDataLoaded = false
  let saveTimer = null
  let saveSequence = 0

  const eintauschRabattProzent = ref('0.00')
  const lieferungOption = ref('')
  const lieferungBetrag = ref(formatAmount(0))
  const restwertMonate = ref(0)
  const restwertBetrag = ref(formatAmount(0))
  const inklusiveKopienSW = ref(0)
  const inklusiveKopienColor = ref(0)
  const preisZusatzPrintSW = ref('0.00')
  const preisZusatzPrintColor = ref('0.00')
  const flatratePauschalBetrag = ref(formatAmount(0))
  const scanpauschaleMietMonate = ref('')
  const scanpauschaleAuswahl = ref('inkl')
  const kundenkontakt = ref('')
  const versand = ref('')
  const interneBemerkung = ref('')
  const positions = ref([])
  const konditionenA3Mfp = ref([])

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
    druckermodelleDerMarke.value.find((modell) => modell.name === druckermodell.value) ??
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

  const isEditingProject = computed(() =>
    Boolean(editingProjectId.value)
  )

  const hasUnsavedEditedProjectChanges = computed(
    () =>
      isEditingProject.value &&
      Boolean(editingProjectSavedFingerprint.value) &&
      getEditedProjectFingerprint() !== editingProjectSavedFingerprint.value
  )

  const saveProjectButtonLabel = computed(() =>
    isEditingProject.value ? 'Änderungen speichern' : 'Projekt speichern'
  )

  const canEditConfigurationSelection = computed(() =>
    !isCatalogLoading.value && !isEditingProject.value
  )

  const canEditPositions = computed(() =>
    Boolean(
      (kundeId.value || isExotischesModell.value) &&
        druckermarke.value &&
        (druckermodell.value || isExotischesModell.value)
    )
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
        MANUAL_POSITION_CATEGORY,
        ...katalog.value.zubehoerKategorien.map((kategorie) => kategorie.name)
      ])

      return kategorien.sort((a, b) => {
        if (a === 'Drucker') return -1
        if (b === 'Drucker') return 1
        if (a === MANUAL_POSITION_CATEGORY) return 1
        if (b === MANUAL_POSITION_CATEGORY) return -1

        return a.localeCompare(b, 'de-CH')
      })
    }

    return getUniqueKategorieNamen([
      'Drucker',
      ...zubehoerKategorien.value,
      MANUAL_POSITION_CATEGORY
    ])
  })

  const lieferungOptionen = computed(() => katalog.value.lieferungOptionen)
  const mietansaetze = computed(() => katalog.value.mietansaetze)

  const mietoptionen = computed(() =>
    Object.keys(mietansaetze.value)
      .map(Number)
      .sort((a, b) => a - b)
  )

  const getDefaultScanpauschaleMietMonate = () => mietoptionen.value[0] ?? ''

  const getDruckermodellByName = (name, herstellerName = druckermarke.value) => {
    const modelle = katalog.value.druckermodelle.filter((modell) => modell.name === name)

    if (!modelle.length) {
      return undefined
    }

    return modelle.find((modell) => getHerstellerName(modell) === herstellerName) ?? modelle[0]
  }

  const getDruckermodellById = (id) =>
    katalog.value.druckermodelle.find((modell) => modell.id === Number(id))

  const getVarianteByName = (modellName, variantenName, herstellerName = druckermarke.value) =>
    getDruckermodellByName(modellName, herstellerName)?.varianten.find(
      (eintrag) => eintrag.bezeichnung === variantenName
    )

  const getDruckerVarianteId = (modellName, variantenName, herstellerName = druckermarke.value) =>
    getVarianteByName(modellName, variantenName, herstellerName)?.id ?? null

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
    variantenName = variante.value,
    herstellerName = druckermarke.value
  ) => {
    const druckerVariante = getVarianteByName(modell, variantenName, herstellerName)

    return {
      id: 1,
      istDrucker: true,
      druckermodellId: getDruckermodellByName(modell, herstellerName)?.id ?? null,
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

  const isManualPosition = (position) =>
    position?.zubehoer === MANUAL_POSITION_CATEGORY

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

  const createDefaultKonditionenA3Mfp = () =>
    KONDITIONEN_A3_MFP.map((kondition) => ({
      ...kondition,
      auswahl: kondition.betragText !== '-' ? 'betrag' : 'keine',
      checked: false,
      manuell: false
    }))

  const getKonditionAuswahl = (kondition) => {
    if (kondition?.auswahl) {
      return kondition.auswahl
    }

    return kondition?.checked ? 'betrag' : 'keine'
  }

  const normalizeKonditionenA3Mfp = (konditionen = [], shouldPreserveSelections = false) => {
    const existingByKey = new Map(
      (Array.isArray(konditionen) ? konditionen : [])
        .filter((kondition) => kondition?.key)
        .map((kondition) => [kondition.key, kondition])
    )
    const selectionByKey = new Map(
      (shouldPreserveSelections && Array.isArray(konditionen) ? konditionen : [])
        .filter((kondition) => kondition?.key && kondition.manuell === true)
        .map((kondition) => [
          kondition.key,
          {
            auswahl: getKonditionAuswahl(kondition),
            checked: Boolean(kondition.checked)
          }
        ])
    )

    return KONDITIONEN_A3_MFP.map((kondition) => {
      const defaultValue = kondition.betragText !== '-' ? 'betrag' : 'keine'
      const auswahl = selectionByKey.get(kondition.key)?.auswahl ?? defaultValue

      return {
        ...kondition,
        betragText: existingByKey.get(kondition.key)?.betragText ?? kondition.betragText,
        auswahl,
        checked:
          Boolean(selectionByKey.get(kondition.key)?.checked) && auswahl !== 'keine',
        manuell: selectionByKey.has(kondition.key)
      }
    })
  }

  const cloneKonditionenA3Mfp = (konditionen) =>
    normalizeKonditionenA3Mfp(konditionen, true).map((kondition) => ({ ...kondition }))

  const syncIncludedDeliveryConditions = (isIncluded = lieferungOption.value === INCLUDED_DELIVERY_OPTION) => {
    konditionenA3Mfp.value.forEach((kondition) => {
      if (INCLUDED_DELIVERY_CONDITION_KEYS.has(kondition.key)) {
        if (isIncluded) {
          kondition.auswahl = 'inkl'
          kondition.checked = true
          kondition.manuell = true
          return
        }

        if (kondition.auswahl === 'inkl') {
          kondition.auswahl = kondition.checked ? 'betrag' : 'keine'
        }
      }
    })
  }

  const cloneCalculationSnapshot = (snapshot) => ({
    ...snapshot,
    positions: clonePositions(snapshot.positions ?? []),
    konditionenA3Mfp: cloneKonditionenA3Mfp(snapshot.konditionenA3Mfp ?? []),
    konditionenA3MfpVersion: KONDITIONEN_A3_MFP_SELECTION_VERSION,
    displaySnapshot: snapshot.displaySnapshot ?? null
  })

  const getProdukteByZubehoer = (zubehoer) => {
    if (isExotischesModell.value || zubehoer === MANUAL_POSITION_CATEGORY) {
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

  const normalizePositionSnapshot = (position, modellName, variantenName, herstellerName) => {
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
      const druckerPosition = createDruckerPosition(modellName, variantenName, herstellerName)

      return {
        ...druckerPosition,
        ...position,
        id: position.id ?? 1,
        istDrucker: true,
        zubehoer: 'Drucker',
        druckermodellId: position?.druckermodellId ?? druckerPosition.druckermodellId,
        druckerVarianteId:
          position?.druckerVarianteId ?? druckerPosition.druckerVarianteId,
        epKategorie: 'body'
      }
    }

    if (isManualPosition(position)) {
      return {
        ...createManualPosition(position?.id ?? naechsteId.value, MANUAL_POSITION_CATEGORY),
        ...position,
        id: position?.id ?? naechsteId.value,
        zubehoer: MANUAL_POSITION_CATEGORY,
        zubehoerId: null,
        druckermodellId: null,
        druckerVarianteId: null,
        istDrucker: false,
        einkaufsPreis: position?.einkaufsPreis ?? formatAmount(0),
        epKategorie: position?.epKategorie ?? 'optionen'
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

  const createCalculationSnapshot = (displayProjectName = projectName.value.trim()) => {
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
      inklusiveKopienSW: inklusiveKopienSW.value,
      inklusiveKopienColor: inklusiveKopienColor.value,
      preisZusatzPrintSW: preisZusatzPrintSW.value,
      preisZusatzPrintColor: preisZusatzPrintColor.value,
      flatratePauschalBetrag: flatratePauschalBetrag.value,
      scanpauschaleMietMonate: scanpauschaleMietMonate.value,
      scanpauschaleAuswahl: scanpauschaleAuswahl.value,
      kundenkontakt: kundenkontakt.value,
      versand: versand.value,
      interneBemerkung: interneBemerkung.value,
      positions: clonePositions(positions.value),
      konditionenA3Mfp: cloneKonditionenA3Mfp(konditionenA3Mfp.value),
      konditionenA3MfpVersion: KONDITIONEN_A3_MFP_SELECTION_VERSION,
      naechsteId: naechsteId.value,
      displaySnapshot: createDisplaySnapshot(displayProjectName)
    }
  }

  const normalizeComparableAmount = (value) => normalizeNumber(value)

  const normalizeComparableId = (value) => {
    const id = Number(value)

    return Number.isFinite(id) ? id : null
  }

  const createComparableCalculationSnapshot = () => {
    const snapshot = createCalculationSnapshot(projectName.value.trim())

    return {
      kundeId: normalizeComparableId(snapshot.kundeId),
      druckermarke: snapshot.druckermarke,
      druckermodellId: normalizeComparableId(snapshot.druckermodellId),
      druckerVarianteId: normalizeComparableId(snapshot.druckerVarianteId),
      druckermodell: snapshot.druckermodell,
      variante: snapshot.variante,
      eintauschRabattProzent: normalizeComparableAmount(snapshot.eintauschRabattProzent),
      lieferungOption: snapshot.lieferungOption,
      lieferungBetrag: normalizeComparableAmount(snapshot.lieferungBetrag),
      restwertMonate: normalizeComparableAmount(snapshot.restwertMonate),
      restwertBetrag: normalizeComparableAmount(snapshot.restwertBetrag),
      inklusiveKopienSW: normalizeComparableAmount(snapshot.inklusiveKopienSW),
      inklusiveKopienColor: normalizeComparableAmount(snapshot.inklusiveKopienColor),
      preisZusatzPrintSW: normalizeComparableAmount(snapshot.preisZusatzPrintSW),
      preisZusatzPrintColor: normalizeComparableAmount(snapshot.preisZusatzPrintColor),
      flatratePauschalBetrag: normalizeComparableAmount(snapshot.flatratePauschalBetrag),
      scanpauschaleMietMonate: normalizeComparableAmount(snapshot.scanpauschaleMietMonate),
      scanpauschaleAuswahl: snapshot.scanpauschaleAuswahl,
      kundenkontakt: snapshot.kundenkontakt ?? '',
      versand: snapshot.versand ?? '',
      interneBemerkung: snapshot.interneBemerkung ?? '',
      positions: snapshot.positions.map((position) => ({
        id: normalizeComparableId(position.id),
        zubehoerId: normalizeComparableId(position.zubehoerId),
        druckermodellId: normalizeComparableId(position.druckermodellId),
        druckerVarianteId: normalizeComparableId(position.druckerVarianteId),
        istDrucker: Boolean(position.istDrucker),
        zubehoer: position.zubehoer ?? '',
        bezeichnung: position.bezeichnung ?? '',
        menge: normalizeComparableAmount(position.menge),
        vp: normalizeComparableAmount(position.vp),
        einkaufsPreis:
          position.einkaufsPreis === null || position.einkaufsPreis === undefined
            ? null
            : normalizeComparableAmount(position.einkaufsPreis),
        epKategorie: position.epKategorie ?? ''
      })),
      konditionenA3Mfp: snapshot.konditionenA3Mfp.map((kondition) => ({
        key: kondition.key,
        checked: Boolean(kondition.checked),
        auswahl: kondition.auswahl ?? ''
      }))
    }
  }

  const getEditedProjectFingerprint = () => {
    const calculation = createComparableCalculationSnapshot()

    return JSON.stringify({
      name: projectName.value.trim(),
      kundeId: calculation.kundeId,
      druckermodellId: calculation.druckermodellId,
      druckerVarianteId: calculation.druckerVarianteId,
      total: normalizeComparableAmount(nettopreis.value),
      calculation
    })
  }

  const markEditedProjectAsSaved = () => {
    editingProjectSavedFingerprint.value = getEditedProjectFingerprint()
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
      inklusiveKopienSW: 0,
      inklusiveKopienColor: 0,
      preisZusatzPrintSW: '0.00',
      preisZusatzPrintColor: '0.00',
      flatratePauschalBetrag: formatAmount(0),
      scanpauschaleMietMonate: getDefaultScanpauschaleMietMonate(),
      scanpauschaleAuswahl: 'inkl',
      kundenkontakt: '',
      versand: '',
      interneBemerkung: '',
      positions: createDefaultPositions(),
      konditionenA3Mfp: createDefaultKonditionenA3Mfp(),
      konditionenA3MfpVersion: KONDITIONEN_A3_MFP_SELECTION_VERSION,
      naechsteId: 2,
      displaySnapshot: null
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
    inklusiveKopienSW.value = 0
    inklusiveKopienColor.value = 0
    preisZusatzPrintSW.value = '0.00'
    preisZusatzPrintColor.value = '0.00'
    flatratePauschalBetrag.value = formatAmount(0)
    scanpauschaleMietMonate.value = getDefaultScanpauschaleMietMonate()
    scanpauschaleAuswahl.value = 'inkl'
    kundenkontakt.value = ''
    versand.value = ''
    interneBemerkung.value = ''
    positions.value = []
    konditionenA3Mfp.value = createDefaultKonditionenA3Mfp()
    naechsteId.value = 1
    isLoadingConfigurationVariant = false
  }

  const normalizeCalculationSnapshot = (snapshot) => {
    const fallbackModell = katalog.value.druckermodelle[0]
    const modell =
      getDruckermodellById(snapshot?.druckermodellId) ??
      getDruckermodellByName(snapshot?.druckermodell, snapshot?.druckermarke) ??
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
          normalizePositionSnapshot(
            position,
            modellName,
            variantenName,
            snapshot?.druckermarke
          )
        )
      : createDefaultPositions()
    const nextPositionId = Math.max(
      Number(snapshot?.naechsteId) || 0,
      2,
      ...normalizedPositions.map((position) => Number(position.id) + 1)
    )

    return {
      kundeId: snapshot?.kundeId ?? null,
      druckermarke:
        snapshot?.druckermarke ??
        getHerstellerName(modell),
      druckermodellId: modell?.id ?? null,
      druckerVarianteId: getDruckerVarianteId(
        modellName,
        variantenName,
        snapshot?.druckermarke
      ),
      druckermodell: modellName,
      variante: variantenName,
      eintauschRabattProzent: snapshot?.eintauschRabattProzent ?? '0.00',
      lieferungOption: option,
      lieferungBetrag: formatAmount(getLieferungBetrag(option)),
      restwertMonate: snapshot?.restwertMonate ?? 0,
      restwertBetrag: snapshot?.restwertBetrag ?? formatAmount(0),
      inklusiveKopienSW: snapshot?.inklusiveKopienSW ?? 0,
      inklusiveKopienColor: snapshot?.inklusiveKopienColor ?? 0,
      preisZusatzPrintSW: snapshot?.preisZusatzPrintSW ?? '0.00',
      preisZusatzPrintColor: snapshot?.preisZusatzPrintColor ?? '0.00',
      flatratePauschalBetrag: snapshot?.flatratePauschalBetrag ?? formatAmount(0),
      scanpauschaleMietMonate:
        snapshot?.scanpauschaleMietMonate ?? getDefaultScanpauschaleMietMonate(),
      scanpauschaleAuswahl: snapshot?.scanpauschaleAuswahl ?? 'inkl',
      kundenkontakt: snapshot?.kundenkontakt ?? '',
      versand: snapshot?.versand ?? '',
      interneBemerkung: snapshot?.interneBemerkung ?? '',
      positions: normalizedPositions,
      konditionenA3Mfp: normalizeKonditionenA3Mfp(
        snapshot?.konditionenA3Mfp,
        snapshot?.konditionenA3MfpVersion >= KONDITIONEN_A3_MFP_SELECTION_VERSION
      ),
      konditionenA3MfpVersion: KONDITIONEN_A3_MFP_SELECTION_VERSION,
      naechsteId: nextPositionId,
      displaySnapshot: snapshot?.displaySnapshot ?? null
    }
  }

  const getSnapshotGesamtpreis = (snapshot) =>
    calculateSalesTotal(snapshot.positions, normalizeNumber)

  const getSnapshotNettopreis = (snapshot) => {
    const verkaufspreisSnapshot = getSnapshotGesamtpreis(snapshot)

    return calculateNetPrice({
      verkaufspreis: verkaufspreisSnapshot,
      eintauschRabattProzent: snapshot.eintauschRabattProzent,
      lieferungBetrag: snapshot.lieferungBetrag,
      restwertMonate: snapshot.restwertMonate,
      restwertBetrag: snapshot.restwertBetrag,
      normalizeNumber
    })
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

    activeConfigurationVariant.calculation = createCalculationSnapshot(
      activeConfigurationVariant.name
    )
    activeConfigurationVariant.kundeId = currentConfigurationKundeId.value
    activeConfigurationVariant.druckermodellId = activeConfigurationVariant.calculation.druckermodellId
    activeConfigurationVariant.druckerVarianteId = activeConfigurationVariant.calculation.druckerVarianteId
    activeConfigurationVariant.druckermodell = druckermodell.value
    activeConfigurationVariant.total = nettopreis.value

    if (shouldPersist && !isEditingProject.value) {
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
    inklusiveKopienSW.value = snapshot.inklusiveKopienSW
    inklusiveKopienColor.value = snapshot.inklusiveKopienColor
    preisZusatzPrintSW.value = snapshot.preisZusatzPrintSW
    preisZusatzPrintColor.value = snapshot.preisZusatzPrintColor
    flatratePauschalBetrag.value = snapshot.flatratePauschalBetrag
    scanpauschaleMietMonate.value = snapshot.scanpauschaleMietMonate
    scanpauschaleAuswahl.value = snapshot.scanpauschaleAuswahl
    kundenkontakt.value = snapshot.kundenkontakt
    versand.value = snapshot.versand
    interneBemerkung.value = snapshot.interneBemerkung
    positions.value = clonePositions(snapshot.positions)
    konditionenA3Mfp.value = cloneKonditionenA3Mfp(snapshot.konditionenA3Mfp)
    syncIncludedDeliveryConditions(snapshot.lieferungOption === INCLUDED_DELIVERY_OPTION)
    naechsteId.value = snapshot.naechsteId
    isLoadingConfigurationVariant = false
  }

  const createConfigurationVariantInDatabase = async (
    calculation = createDefaultCalculationSnapshot(),
    name = getNextConfigurationVariantName()
  ) => {
    const calculationWithKunde = {
      ...calculation,
      kundeId: currentConfigurationKundeId.value,
      displaySnapshot: createDisplaySnapshot(name)
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

  const getGesamtpreis = (position) => calculateLineTotal(position, normalizeNumber)

  const updatePositionZubehoer = (position) => {
    const isDrucker = position.zubehoer === 'Drucker'
    const isManual = position.zubehoer === MANUAL_POSITION_CATEGORY

    position.bezeichnung = ''
    position.zubehoerId = null
    position.druckermodellId = null
    position.druckerVarianteId = null
    position.istDrucker = isDrucker
    position.vp = formatAmount(0)
    position.einkaufsPreis =
      isExotischesModell.value || isManual ? formatAmount(0) : null
    position.epKategorie = isDrucker
      ? 'body'
      : getZubehoerKategorieByName(position.zubehoer)?.epKategorie ?? 'optionen'
  }

  const updatePositionProdukt = (position) => {
    if (isExotischesModell.value || isManualPosition(position)) {
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
    syncIncludedDeliveryConditions(optionValue === INCLUDED_DELIVERY_OPTION)
  }

  const normalizeRestwertBetrag = () => {
    restwertBetrag.value = formatAmount(Math.max(0, normalizeNumber(restwertBetrag.value)))
  }

  const normalizeRestwertMonate = () => {
    const monate = Math.trunc(normalizeNumber(restwertMonate.value))
    restwertMonate.value = Math.max(0, monate)
  }

  const normalizeInklusiveKopienSW = () => {
    const kopien = Math.trunc(normalizeNumber(inklusiveKopienSW.value))
    inklusiveKopienSW.value = formatInteger(Math.max(0, kopien))
  }

  const normalizeInklusiveKopienColor = () => {
    const kopien = Math.trunc(normalizeNumber(inklusiveKopienColor.value))
    inklusiveKopienColor.value = formatInteger(Math.max(0, kopien))
  }

  const normalizePreisZusatzPrintSW = () => {
    preisZusatzPrintSW.value = formatDecimal(
      Math.max(0, normalizeNumber(preisZusatzPrintSW.value))
    )
  }

  const normalizePreisZusatzPrintColor = () => {
    preisZusatzPrintColor.value = formatDecimal(
      Math.max(0, normalizeNumber(preisZusatzPrintColor.value))
    )
  }

  const normalizeFlatratePauschalBetrag = () => {
    flatratePauschalBetrag.value = formatAmount(
      Math.max(0, normalizeNumber(flatratePauschalBetrag.value))
    )
  }

  const normalizeScanpauschaleMietMonate = () => {
    const monate = Math.trunc(normalizeNumber(scanpauschaleMietMonate.value))
    scanpauschaleMietMonate.value = mietoptionen.value.includes(monate)
      ? monate
      : getDefaultScanpauschaleMietMonate()
  }

  const normalizeScanpauschaleAuswahl = () => {
    scanpauschaleAuswahl.value =
      scanpauschaleAuswahl.value === '15' ? '15' : 'inkl'
  }

  const isEmptyPosition = (position) =>
    !position.zubehoer &&
    !position.bezeichnung &&
    normalizeNumber(position.vp) === 0 &&
    getEinkaufspreis(position) === 0

  const verkaufspreis = computed(() =>
    calculateSalesTotal(positions.value, normalizeNumber)
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

  const nettopreis = computed(() =>
    calculateNetPrice({
      verkaufspreis: verkaufspreis.value,
      eintauschRabattProzent: eintauschRabattProzent.value,
      lieferungBetrag: lieferungBetrag.value,
      restwertMonate: restwertMonate.value,
      restwertBetrag: restwertBetrag.value,
      normalizeNumber
    })
  )

  const servicePauschaleMonat = computed(() =>
    calculateServiceFeePerMonth({
      inklusiveKopienSW: inklusiveKopienSW.value,
      inklusiveKopienColor: inklusiveKopienColor.value,
      preisZusatzPrintSW: preisZusatzPrintSW.value,
      preisZusatzPrintColor: preisZusatzPrintColor.value,
      normalizeNumber
    })
  )

  const mietbasis = computed(() => Math.max(0, nettopreis.value))

  const getMietbetrag = (monate) => {
    const mietansatz = mietansaetze.value[monate]

    if (!mietansatz || mietansatz <= 0) {
      return 0
    }

    return Math.round(mietbasis.value / mietansatz)
  }

  const scanpauschaleMonatsmiete = computed(() =>
    scanpauschaleMietMonate.value ? getMietbetrag(scanpauschaleMietMonate.value) : 0
  )

  const scanpauschaleBerechnet = computed(() =>
    calculateCombinedScanFee({
      monatsmiete: scanpauschaleMonatsmiete.value,
      inklusiveKopienSW: inklusiveKopienSW.value,
      inklusiveKopienColor: inklusiveKopienColor.value,
      preisZusatzPrintSW: preisZusatzPrintSW.value,
      preisZusatzPrintColor: preisZusatzPrintColor.value,
      normalizeNumber
    })
  )

  const recyclingGebuehrSwico = computed(() =>
    calculateVrgFee(verkaufspreis.value, normalizeNumber)
  )

  const npkAbschlussgebuehr = computed(() =>
    calculateNpkClosingFee(getMietbetrag(48), getMietbetrag(60), normalizeNumber)
  )

  const syncCalculatedConditionAmounts = () => {
    konditionenA3Mfp.value.forEach((kondition) => {
      if (kondition.key === 'vorgezogene_recyclinggebuehr_swico') {
        const nextBetragText = formatAmount(recyclingGebuehrSwico.value)

        if (kondition.betragText !== nextBetragText) {
          kondition.betragText = nextBetragText
        }

        if (kondition.checked && kondition.auswahl === 'keine') {
          kondition.auswahl = 'betrag'
        }
      }

      if (kondition.key === 'npk_abschlussgebuehr') {
        const nextBetragText = formatAmount(npkAbschlussgebuehr.value)

        if (kondition.betragText !== nextBetragText) {
          kondition.betragText = nextBetragText
        }

        if (kondition.checked && kondition.auswahl === 'keine') {
          kondition.auswahl = 'betrag'
        }
      }
    })
  }

  const createDisplayField = (key, label, value, rawValue = value) => ({
    key,
    label,
    value: String(value ?? ''),
    rawValue
  })

  const formatCurrencyValue = (value) => `CHF ${formatAmount(value)}`

  const getVerkaeuferName = () => {
    const verkaeufer = selectedKunde.value?.verkaeufer

    if (!verkaeufer) {
      return ''
    }

    return [verkaeufer.vorname, verkaeufer.nachname].filter(Boolean).join(' ')
  }

  const getLieferungOptionLabel = () =>
    lieferungOptionen.value.find((option) => option.value === lieferungOption.value)?.label ??
    lieferungOption.value

  const getKonditionBetragLabel = (kondition) =>
    kondition.betragText && kondition.betragText !== '-'
      ? `Fr. ${kondition.betragText}`
      : '-'

  const getKonditionOptionsForDisplay = (kondition) =>
    CUSTOM_CONDITION_OPTIONS[kondition.key] ?? [
      { value: 'betrag', label: getKonditionBetragLabel(kondition) },
      { value: 'keine', label: 'keine' },
      { value: 'inkl', label: 'inkl.' }
    ]

  const getKonditionAuswahlLabel = (kondition) => {
    if (
      lieferungOption.value === INCLUDED_DELIVERY_OPTION &&
      INCLUDED_DELIVERY_CONDITION_KEYS.has(kondition.key)
    ) {
      return 'inkl.'
    }

    const auswahl = getKonditionAuswahl(kondition)

    return (
      getKonditionOptionsForDisplay(kondition).find((option) => option.value === auswahl)
        ?.label ??
      auswahl ??
      ''
    )
  }

  const createDisplaySnapshot = (displayProjectName = projectName.value.trim()) => {
    const varianteText = selectedDruckerPosition.value?.bezeichnung ?? variante.value
    const fallbackProjectName = [druckermodell.value, varianteText].filter(Boolean).join(' ')
    const projectDisplayName = displayProjectName || fallbackProjectName || 'Projekt'

    return {
      version: 1,
      createdAt: new Date().toISOString(),
      locale: 'de-CH',
      currency: 'CHF',
      project: {
        title: 'Projekt',
        fields: [
          createDisplayField('projektname', 'Projektname', projectDisplayName),
          createDisplayField('kunde', 'Kunde', selectedKunde.value?.firmenname ?? ''),
          createDisplayField('verkaeufer', 'Verkäufer', getVerkaeuferName()),
          createDisplayField('druckermarke', 'Druckermarke', druckermarke.value),
          createDisplayField('druckermodell', 'Druckermodell', druckermodell.value),
          createDisplayField('variante', 'Variante', varianteText)
        ]
      },
      positions: {
        title: 'Positionen',
        columns: [
          { key: 'kategorie', label: 'Kategorie' },
          { key: 'bezeichnung', label: 'Bezeichnung' },
          { key: 'menge', label: 'Menge' },
          { key: 'vp', label: 'VP (CHF)' },
          { key: 'ep', label: 'EP (CHF)' },
          { key: 'total', label: 'Gesamtsumme (CHF)' }
        ],
        rows: positions.value.map((position, index) => ({
          index: index + 1,
          values: {
            kategorie: position.zubehoer ?? '',
            bezeichnung: position.bezeichnung ?? '',
            menge: String(position.menge ?? ''),
            vp: formatAmount(position.vp),
            ep: formatAmount(getEinkaufspreis(position)),
            total: formatAmount(getGesamtpreis(position))
          },
          rawValues: {
            id: position.id,
            zubehoerId: position.zubehoerId,
            druckermodellId: position.druckermodellId,
            druckerVarianteId: position.druckerVarianteId,
            istDrucker: Boolean(position.istDrucker),
            menge: normalizeNumber(position.menge),
            vp: normalizeNumber(position.vp),
            ep: getEinkaufspreis(position),
            total: getGesamtpreis(position),
            epKategorie: position.epKategorie ?? ''
          }
        }))
      },
      calculation: {
        title: 'Kalkulation',
        fields: [
          createDisplayField(
            'einkaufspreis',
            'Einkaufspreis',
            formatCurrencyValue(einkaufspreis.value),
            einkaufspreis.value
          ),
          createDisplayField(
            'verkaufspreis',
            'Verkaufspreis',
            formatCurrencyValue(verkaufspreis.value),
            verkaufspreis.value
          ),
          createDisplayField(
            'eintauschRabattProzent',
            'Eintauschrabatt',
            `${formatDecimal(eintauschRabattProzent.value)} %`,
            normalizeNumber(eintauschRabattProzent.value)
          ),
          createDisplayField(
            'eintauschRabattBetrag',
            'Eintauschrabatt CHF',
            formatCurrencyValue(eintauschRabattBetrag.value),
            eintauschRabattBetrag.value
          ),
          createDisplayField('lieferungOption', 'Lieferung gemäss Konditionen', getLieferungOptionLabel(), lieferungOption.value),
          createDisplayField(
            'lieferungBetrag',
            'Lieferbetrag',
            formatCurrencyValue(lieferungBetrag.value),
            normalizeNumber(lieferungBetrag.value)
          ),
          createDisplayField('restwertMonate', 'Restwert Monate', `${restwertMonate.value} Mt.`, normalizeNumber(restwertMonate.value)),
          createDisplayField(
            'restwertBetrag',
            'Restwert',
            formatCurrencyValue(restwertBetrag.value),
            normalizeNumber(restwertBetrag.value)
          ),
          createDisplayField(
            'nettopreis',
            'Nettopreis',
            formatCurrencyValue(nettopreis.value),
            nettopreis.value
          )
        ]
      },
      rentOptions: {
        title: 'Mietoptionen',
        rows: mietoptionen.value.map((monate) => ({
          monate,
          label: `Miete ${monate} Monate`,
          value: `${formatCurrencyValue(getMietbetrag(monate))} / Monat`,
          basis: formatCurrencyValue(mietbasis.value),
          rawValue: getMietbetrag(monate),
          rawBasis: mietbasis.value
        }))
      },
      serviceConditions: {
        title: 'Servicekonditionen',
        fields: [
          createDisplayField(
            'servicePauschaleMonat',
            'Servicepauschale/Mt.',
            formatCurrencyValue(servicePauschaleMonat.value),
            servicePauschaleMonat.value
          ),
          createDisplayField('inklusiveKopienSW', 'inkl. Kopien s/w', formatInteger(inklusiveKopienSW.value), normalizeNumber(inklusiveKopienSW.value)),
          createDisplayField('inklusiveKopienColor', 'inkl. Kopien color', formatInteger(inklusiveKopienColor.value), normalizeNumber(inklusiveKopienColor.value)),
          createDisplayField('preisZusatzPrintSW', 'jeder weitere Print s/w', `Rp. ${formatDecimal(preisZusatzPrintSW.value)}`, normalizeNumber(preisZusatzPrintSW.value)),
          createDisplayField('preisZusatzPrintColor', 'jeder weitere Print color', `Rp. ${formatDecimal(preisZusatzPrintColor.value)}`, normalizeNumber(preisZusatzPrintColor.value)),
          createDisplayField('flatratePauschalBetrag', 'Flatrate Vertrag über den gesamten Gerätepark', formatCurrencyValue(flatratePauschalBetrag.value), normalizeNumber(flatratePauschalBetrag.value)),
          createDisplayField('scanpauschaleMietMonate', 'Scanpauschale Monatsmiete', `Miete ${scanpauschaleMietMonate.value} Mt. / ${formatCurrencyValue(scanpauschaleMonatsmiete.value)}`, normalizeNumber(scanpauschaleMietMonate.value)),
          createDisplayField('scanpauschaleBerechnet', 'Scanpauschale berechnet', formatCurrencyValue(scanpauschaleBerechnet.value), scanpauschaleBerechnet.value),
          createDisplayField('scanpauschaleAuswahl', 'Scanpauschale Betrag', scanpauschaleAuswahl.value === '15' ? 'Fr. 15.00' : 'inkl.', scanpauschaleAuswahl.value)
        ]
      },
      offerConditions: {
        title: 'Konditionen A3 MFP',
        rows: konditionenA3Mfp.value.map((kondition) => ({
          key: kondition.key,
          label: kondition.label,
          einheit: kondition.einheit,
          ausgewaehlt: Boolean(kondition.checked),
          auswahl: kondition.auswahl,
          auswahlLabel: getKonditionAuswahlLabel(kondition),
          betrag: kondition.betragText,
          betragLabel: getKonditionBetragLabel(kondition),
          manuell: Boolean(kondition.manuell)
        }))
      },
      calculatedValues: {
        verkaufspreis: formatCurrencyValue(verkaufspreis.value),
        einkaufspreis: formatCurrencyValue(einkaufspreis.value),
        nettopreis: formatCurrencyValue(nettopreis.value),
        servicePauschaleMonat: formatCurrencyValue(servicePauschaleMonat.value),
        scanpauschaleBerechnet: formatCurrencyValue(scanpauschaleBerechnet.value),
        recyclingGebuehrSwico: formatCurrencyValue(recyclingGebuehrSwico.value),
        npkAbschlussgebuehr: formatCurrencyValue(npkAbschlussgebuehr.value)
      }
    }
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

      if (isExotischesModell.value || isManualPosition(position)) {
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

  const saveProjectButtonTitle = computed(() => saveProjectButtonLabel.value)

  const getUniqueConfigurationName = (baseName) => {
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

  const getNextConfigurationVariantName = () => {
    const alternativesCount = configurationVariants.value.filter(
      (configurationVariant) =>
        isConfigurationComplete(configurationVariant) &&
        configurationVariant.name.startsWith('Alternative')
    ).length

    return getUniqueConfigurationName(`Alternative ${alternativesCount + 1}`)
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

  const selectDruckermarke = (marke) => {
    if (
      marke === druckermarke.value ||
      !canEditConfigurationSelection.value ||
      (!kundeId.value && marke && marke !== EXOTIC_MODEL_OPTION)
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

  const selectKunde = (id) => {
    const nextKundeId = id ? Number(id) : null

    if (nextKundeId === kundeId.value || !canEditConfigurationSelection.value) {
      return
    }

    saveActiveConfigurationVariant()
    kundeId.value = nextKundeId
    catalogError.value = ''

    if (!nextKundeId && !isExotischesModell.value) {
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
      activeConfigurationVariant.calculation = createCalculationSnapshot(
        activeConfigurationVariant.name
      )
      activeConfigurationVariant.calculation.kundeId = nextKundeId
      if (!isEditingProject.value) {
        queueSaveConfigurationVariant(activeConfigurationVariant)
      }
    }
  }

  const addConfigurationVariant = async () => {
    if (!canSaveProject.value) {
      catalogError.value =
        'Bitte Kunde, Druckermarke, Druckermodell und eine Druckerposition erfassen.'
      return null
    }

    try {
      const name = getUniqueConfigurationName(getProjectConfigurationBaseName())
      const calculation = createCalculationSnapshot(name)

      const configurationVariant = await createConfigurationVariantInDatabase(
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

  const resetToNewCalculation = () => {
    activeConfigurationVariantId.value = null
    editingProjectId.value = null
    editingProjectSavedFingerprint.value = ''
    isNewConfigurationDraft.value = false
    projectName.value = ''
    kundeId.value = null
    druckermarke.value = ''
    clearCalculationSelection()
  }

  const saveEditedProject = async () => {
    if (!canSaveProject.value) {
      catalogError.value =
        'Bitte Kunde, Druckermarke, Druckermodell und eine Druckerposition erfassen.'
      return null
    }

    const activeConfigurationVariant = getActiveConfigurationVariant()

    if (!activeConfigurationVariant || !editingProjectId.value) {
      catalogError.value = 'Projekt konnte nicht zum Bearbeiten geladen werden.'
      return null
    }

    try {
      window.clearTimeout(saveTimer)
      saveActiveConfigurationVariant(false)

      const savedConfigurationVariant = await api.updateKonfiguration(
        activeConfigurationVariant.id,
        createConfigurationPayload(activeConfigurationVariant)
      )
      const mappedConfigurationVariant = mapConfigurationFromApi(savedConfigurationVariant)
      const configurationIndex = configurationVariants.value.findIndex(
        (configurationVariant) => configurationVariant.id === mappedConfigurationVariant.id
      )

      if (configurationIndex >= 0) {
        configurationVariants.value.splice(configurationIndex, 1, mappedConfigurationVariant)
      } else {
        configurationVariants.value.push(mappedConfigurationVariant)
      }

      markEditedProjectAsSaved()
      catalogError.value = ''

      return mappedConfigurationVariant
    } catch (error) {
      catalogError.value = `Projekt konnte nicht gespeichert werden: ${error.message}`
      return null
    }
  }

  const saveProject = async () => {
    if (isEditingProject.value) {
      const savedProject = await saveEditedProject()

      if (!savedProject) {
        return
      }

      resetToNewCalculation()

      return savedProject
    }

    const savedProject = await addConfigurationVariant()

    if (!savedProject) {
      return
    }

    resetToNewCalculation()
    return savedProject
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

  const applyInitialData = (loadedKatalog, loadedKunden, savedConfigurations) => {
    katalog.value = loadedKatalog
    kunden.value = loadedKunden

    if (!katalog.value.druckermodelle.length) {
      throw new Error('Keine Druckermodelle in der Datenbank gefunden')
    }

    configurationVariants.value = savedConfigurations
      .map(mapConfigurationFromApi)
      .filter(isConfigurationComplete)

    resetToNewCalculation()

    const projectId = getProjectIdFromOptions()
    const projectToEdit = projectId
      ? configurationVariants.value.find(
          (configurationVariant) => configurationVariant.id === projectId
        )
      : null

    if (projectToEdit) {
      activeConfigurationVariantId.value = projectToEdit.id
      editingProjectId.value = projectToEdit.id
      loadConfigurationVariant(projectToEdit)
      markEditedProjectAsSaved()
    }

    isInitialDataLoaded = true
  }

  const hydrateInitialDataFromCache = () => {
    const cachedData = api.getCachedRouteData('projektEditor')

    if (!cachedData) {
      return false
    }

    try {
      applyInitialData(cachedData.katalog, cachedData.kunden, cachedData.konfigurationen)
      catalogError.value = ''
    } catch (error) {
      catalogError.value = `Datenbank konnte nicht geladen werden: ${error.message}`
    } finally {
      isCatalogLoading.value = false
    }

    return true
  }

  const loadInitialData = async () => {
    isCatalogLoading.value = true
    catalogError.value = ''

    try {
      const [loadedKatalog, loadedKunden, savedConfigurations] = await Promise.all([
        api.getKatalog(),
        api.getKunden(),
        api.getKonfigurationen()
      ])

      applyInitialData(loadedKatalog, loadedKunden, savedConfigurations)
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

      syncIncludedDeliveryConditions(optionValue === INCLUDED_DELIVERY_OPTION)
    },
    { deep: true }
  )

  watch(
    [recyclingGebuehrSwico, npkAbschlussgebuehr, konditionenA3Mfp],
    () => {
      syncCalculatedConditionAmounts()
    },
    { deep: true, immediate: true }
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
      inklusiveKopienSW,
      inklusiveKopienColor,
      preisZusatzPrintSW,
      preisZusatzPrintColor,
      flatratePauschalBetrag,
      scanpauschaleMietMonate,
      scanpauschaleAuswahl,
      kundenkontakt,
      versand,
      interneBemerkung,
      positions,
      konditionenA3Mfp,
      nettopreis
    ],
    () => {
      saveActiveConfigurationVariant()
    },
    { deep: true }
  )

  const hasHydratedInitialData = hydrateInitialDataFromCache()

  onMounted(() => {
    if (!hasHydratedInitialData) {
      loadInitialData()
    }
  })

  onBeforeUnmount(() => {
    window.clearTimeout(saveTimer)
    saveActiveConfigurationVariant()

    const activeConfigurationVariant = getActiveConfigurationVariant()

    if (
      activeConfigurationVariant &&
      !isExotischesModell.value &&
      !isEditingProject.value
    ) {
      persistConfigurationVariant(activeConfigurationVariant).catch(() => {})
    }
  })

  return {
    isCatalogLoading,
    catalogError,
    kunden,
    kundeId,
    selectKunde,

    druckermarke,
    druckermarken,
    selectDruckermarke,
    isExotischesModell,
    canSaveProject,
    saveProject,
    hasUnsavedEditedProjectChanges,
    saveProjectButtonLabel,
    saveProjectButtonTitle,

    druckermodell,
    selectDruckermodell,
    druckermodelleDerMarkeNamen,

    canEditConfigurationSelection,
    canEditPositions,

    positions,
    konditionenA3Mfp,
    isEmptyPosition,
    updatePositionZubehoer,
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
    inklusiveKopienSW,
    normalizeInklusiveKopienSW,
    inklusiveKopienColor,
    normalizeInklusiveKopienColor,
    preisZusatzPrintSW,
    normalizePreisZusatzPrintSW,
    preisZusatzPrintColor,
    normalizePreisZusatzPrintColor,
    flatratePauschalBetrag,
    normalizeFlatratePauschalBetrag,
    servicePauschaleMonat,
    scanpauschaleMietMonate,
    normalizeScanpauschaleMietMonate,
    scanpauschaleAuswahl,
    normalizeScanpauschaleAuswahl,
    kundenkontakt,
    versand,
    interneBemerkung,
    scanpauschaleBerechnet,
    recyclingGebuehrSwico,
    npkAbschlussgebuehr,
    nettopreis,
    mietoptionen,
    getMietbetrag,
    mietbasis
  }
}
