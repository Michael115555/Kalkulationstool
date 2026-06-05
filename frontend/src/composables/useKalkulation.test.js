import { createApp, h, nextTick } from 'vue'
import { JSDOM } from 'jsdom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useKalkulation } from './useKalkulation'

const DELIVERY_CONDITION_KEYS = [
  'bereitstellung_vorkonfiguration_justagen',
  'lieferung_standort_kurzinstruktion'
]

const mocks = vi.hoisted(() => ({
  api: {
    getKatalog: vi.fn(),
    getKunden: vi.fn(),
    getKonfigurationen: vi.fn(),
    getCachedRouteData: vi.fn(),
    createKonfiguration: vi.fn(),
    updateKonfiguration: vi.fn()
  },
  route: {
    query: { projektId: '1' }
  },
  router: {
    replace: vi.fn()
  }
}))

vi.mock('../services/kalkulationApi', () => ({
  createKalkulationApi: () => mocks.api
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => mocks.router
}))

const createKatalog = () => ({
  druckermodelle: [
    {
      id: 5,
      name: 'bizhub Cxx1i',
      herstellerName: 'Konica Minolta',
      epFaktorGruppe: null,
      varianten: [
        {
          id: 8,
          bezeichnung: 'bizhub C451i',
          verkaufsPreis: 8544,
          einkaufsPreis: 6243.96
        }
      ],
      zubehoer: []
    }
  ],
  zubehoerKategorien: [],
  lieferungOptionen: [
    { value: 'exkl', label: 'Lieferung exkl.', betrag: 0 },
    { value: 'inkl', label: 'Lieferung inkl.', betrag: 790 }
  ],
  mietansaetze: { 48: 0 },
  epFaktoren: {}
})

const createSavedConfiguration = () => ({
  id: 1,
  name: 'bizhub Cxx1i bizhub C451i',
  kundeId: 36,
  druckermodellId: 5,
  druckerVarianteId: 8,
  total: 8544,
  calculation: {
    kundeId: 36,
    druckermarke: 'Konica Minolta',
    druckermodellId: 5,
    druckerVarianteId: 8,
    druckermodell: 'bizhub Cxx1i',
    variante: 'bizhub C451i',
    eintauschRabattProzent: '0.00',
    lieferungOption: 'inkl',
    lieferungBetrag: '0.00',
    restwertMonate: 0,
    restwertBetrag: '0.00',
    inklusiveKopienSW: 0,
    inklusiveKopienColor: 0,
    preisZusatzPrintSW: '0.00',
    preisZusatzPrintColor: '0.00',
    flatratePauschalBetrag: '0.00',
    scanpauschaleMietMonate: 48,
    scanpauschaleAuswahl: 'inkl',
    positions: [
      {
        id: 1,
        zubehoerId: null,
        druckermodellId: null,
        druckerVarianteId: null,
        istDrucker: true,
        zubehoer: 'Drucker',
        bezeichnung: 'bizhub C451i',
        menge: 1,
        vp: "8'544.00",
        einkaufsPreis: "6'243.96",
        epKategorie: 'body'
      }
    ],
    konditionenA3Mfp: [],
    konditionenA3MfpVersion: 5,
    naechsteId: 2,
    displaySnapshot: null
  }
})

const createDeliveryConditions = ({ auswahl, checked }) =>
  DELIVERY_CONDITION_KEYS.map((key) => ({
    key,
    label: key,
    einheit: 'pauschal',
    betragText: key === 'bereitstellung_vorkonfiguration_justagen' ? '390.00' : '400.00',
    auswahl,
    checked,
    manuell: true
  }))

const getDeliveryConditions = (conditions) =>
  conditions.filter((condition) => DELIVERY_CONDITION_KEYS.includes(condition.key))

const flushPromises = async () => {
  await Promise.resolve()
  await nextTick()
  await new Promise((resolve) => window.setTimeout(resolve, 0))
}

const mountUseKalkulation = async () => {
  let composable
  const app = createApp({
    setup() {
      composable = useKalkulation()
      return () => h('div')
    }
  })
  const element = document.createElement('div')
  document.body.appendChild(element)

  app.mount(element)
  await flushPromises()

  return { app, composable, element }
}

describe('useKalkulation', () => {
  let dom

  beforeEach(() => {
    dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost/'
    })
    globalThis.window = dom.window
    globalThis.document = dom.window.document
    globalThis.Element = dom.window.Element
    globalThis.SVGElement = dom.window.SVGElement

    mocks.route.query = { projektId: '1' }
    mocks.api.getKatalog.mockResolvedValue(createKatalog())
    mocks.api.getKunden.mockResolvedValue([{ id: 36, firmenname: 'TestFirma' }])
    mocks.api.getKonfigurationen.mockResolvedValue([createSavedConfiguration()])
    mocks.api.getCachedRouteData.mockReturnValue(null)
    mocks.api.createKonfiguration.mockImplementation((payload) =>
      Promise.resolve({ id: 2, ...payload })
    )
    mocks.api.updateKonfiguration.mockImplementation((_id, payload) =>
      Promise.resolve({ id: _id, ...payload })
    )
    mocks.router.replace.mockResolvedValue()
  })

  afterEach(() => {
    vi.clearAllMocks()
    dom.window.close()
    delete globalThis.window
    delete globalThis.document
    delete globalThis.Element
    delete globalThis.SVGElement
  })

  it('speichert ein bearbeitetes Projekt mit normalisierten Drucker-IDs', async () => {
    const { app, composable, element } = await mountUseKalkulation()

    expect(composable.canSaveProject.value).toBe(true)
    expect(composable.isEditingProject.value).toBe(true)
    expect(composable.editingProjectName.value).toBe('bizhub Cxx1i bizhub C451i')
    expect(composable.canEditConfigurationSelection.value).toBe(false)

    composable.selectKunde(99)
    composable.selectDruckermarke('Canon')
    composable.selectDruckermodell('Canon imageForce C51xx')

    expect(composable.kundeId.value).toBe(36)
    expect(composable.druckermarke.value).toBe('Konica Minolta')
    expect(composable.druckermodell.value).toBe('bizhub Cxx1i')

    composable.restwertMonate.value = 12
    await composable.saveProject()

    expect(mocks.api.updateKonfiguration).toHaveBeenCalledTimes(1)

    const [id, payload] = mocks.api.updateKonfiguration.mock.calls[0]
    expect(id).toBe(1)
    expect(payload.druckermodellId).toBe(5)
    expect(payload.druckerVarianteId).toBe(8)
    expect(payload.calculation.restwertMonate).toBe(12)
    expect(payload.calculation.positions[0].druckermodellId).toBe(5)
    expect(payload.calculation.positions[0].druckerVarianteId).toBe(8)
    expect(getDeliveryConditions(payload.calculation.konditionenA3Mfp)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'bereitstellung_vorkonfiguration_justagen',
          auswahl: 'inkl',
          checked: true
        }),
        expect.objectContaining({
          key: 'lieferung_standort_kurzinstruktion',
          auswahl: 'inkl',
          checked: true
        })
      ])
    )
    expect(composable.catalogError.value).toBe('')
    expect(mocks.router.replace).toHaveBeenCalledWith({ name: 'projekte' })
    expect(composable.kundeId.value).toBeNull()
    expect(composable.druckermarke.value).toBe('')
    expect(composable.druckermodell.value).toBe('')
    expect(composable.positions.value).toEqual([])
    expect(composable.isEditingProject.value).toBe(false)

    app.unmount()
    element.remove()
  })

  it('markiert inkludierte Lieferkonditionen automatisch', async () => {
    const { app, composable, element } = await mountUseKalkulation()

    const deliveryConditions = getDeliveryConditions(composable.konditionenA3Mfp.value)

    expect(deliveryConditions).toHaveLength(2)
    expect(deliveryConditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'bereitstellung_vorkonfiguration_justagen',
          auswahl: 'inkl',
          checked: true
        }),
        expect.objectContaining({
          key: 'lieferung_standort_kurzinstruktion',
          auswahl: 'inkl',
          checked: true
        })
      ])
    )

    app.unmount()
    element.remove()
  })

  it('behaelt gespeicherte Lieferkonditionen bei exklusiver Lieferung', async () => {
    const savedConfiguration = createSavedConfiguration()
    savedConfiguration.calculation.lieferungOption = 'exkl'
    savedConfiguration.calculation.lieferungBetrag = '0.00'
    savedConfiguration.calculation.konditionenA3Mfp = createDeliveryConditions({
      auswahl: 'betrag',
      checked: true
    })
    mocks.api.getKonfigurationen.mockResolvedValue([savedConfiguration])

    const { app, composable, element } = await mountUseKalkulation()

    expect(getDeliveryConditions(composable.konditionenA3Mfp.value)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'bereitstellung_vorkonfiguration_justagen',
          auswahl: 'betrag',
          checked: true
        }),
        expect.objectContaining({
          key: 'lieferung_standort_kurzinstruktion',
          auswahl: 'betrag',
          checked: true
        })
      ])
    )

    composable.restwertMonate.value = 12
    await composable.saveProject()

    const [, payload] = mocks.api.updateKonfiguration.mock.calls[0]

    expect(getDeliveryConditions(payload.calculation.konditionenA3Mfp)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'bereitstellung_vorkonfiguration_justagen',
          auswahl: 'betrag',
          checked: true
        }),
        expect.objectContaining({
          key: 'lieferung_standort_kurzinstruktion',
          auswahl: 'betrag',
          checked: true
        })
      ])
    )

    app.unmount()
    element.remove()
  })

  it('wechselt nach dem ersten Projektspeichern zu einer neuen Kalkulation', async () => {
    mocks.route.query = {}
    mocks.api.getKonfigurationen.mockResolvedValue([])

    const { app, composable, element } = await mountUseKalkulation()

    expect(composable.showSaveProjectBar.value).toBe(true)
    expect(composable.canSaveProject.value).toBe(false)

    composable.selectKunde(36)

    expect(composable.showSaveProjectBar.value).toBe(true)
    expect(composable.canSaveProject.value).toBe(false)

    composable.selectDruckermarke('Konica Minolta')
    composable.selectDruckermodell('bizhub Cxx1i')

    const druckerPosition = composable.positions.value[0]
    druckerPosition.bezeichnung = 'bizhub C451i'
    composable.updatePositionProdukt(druckerPosition)

    expect(composable.canSaveProject.value).toBe(true)

    await composable.saveProject()

    expect(mocks.api.createKonfiguration).toHaveBeenCalledTimes(1)
    expect(mocks.router.replace).not.toHaveBeenCalled()
    expect(composable.kundeId.value).toBeNull()
    expect(composable.druckermarke.value).toBe('')
    expect(composable.druckermodell.value).toBe('')
    expect(composable.positions.value).toEqual([])
    expect(composable.canSaveProject.value).toBe(false)
    expect(composable.showSaveProjectBar.value).toBe(true)

    app.unmount()
    element.remove()
  })

  it('blendet bei exotischem Modell die Speicherleiste aus', async () => {
    mocks.route.query = {}
    mocks.api.getKonfigurationen.mockResolvedValue([])

    const { app, composable, element } = await mountUseKalkulation()

    composable.selectKunde(36)

    expect(composable.showSaveProjectBar.value).toBe(true)

    composable.selectDruckermarke('Exotisches Modell')

    expect(composable.isExotischesModell.value).toBe(true)
    expect(composable.positions.value.length).toBeGreaterThan(0)
    expect(composable.canSaveProject.value).toBe(false)
    expect(composable.showSaveProjectBar.value).toBe(false)

    app.unmount()
    element.remove()
  })
})
