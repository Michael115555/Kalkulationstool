<script setup>
import { computed, ref } from 'vue'

const naechsteId = ref(20)
const druckermodell = ref('Konica Minolta bizhub C251i')
const variante = ref('Standard')

const druckermodelle = ['Konica Minolta bizhub C251i']
const varianten = ['Standard']
const zubehoerKategorien = [
  'Deckel',
  'Kassetten & Unterschränke',
  'Finishing / Locher / Fax'
]
const eintauschRabattProzent = ref('0.00')
const lieferungOption = ref('exkl')
const lieferungBetrag = ref('0.00')
const restwertMonate = ref(0)
const restwertBetrag = ref('0.00')
const formatDecimal = (value) => Number(value).toFixed(2)

const lieferungOptionen = [
  {
    value: 'exkl',
    label: 'Lieferung exkl.',
    betrag: 0
  },
  {
    value: 'inkl',
    label: 'Lieferung inkl.',
    betrag: 790
  }
]

const mietansaetze = {
  48: 42,
  60: 50
}

const epFaktoren = {
  'Canon alt': {
    body: 0.4054
  },
  'Konica Minolta': {
    body: 0.7308
  },
  Kyocera: {
    body: 0.45,
    optionen: 0.65,
    software: 0.8
  },
  OKI: {
    body: 0.4682,
    optionen: 0.7837,
    tonerCx3133: 0.05156
  },
  'Canon Mono': {
    body: 0.67,
    optionen: 0.665,
    software: 0.335,
    production: 0.6295,
    tonerCx3133: 0.53,
    dsPpToner: 0.505
  },
  'Old Canon Gold': {
    body: 0.685,
    optionen: 0.655,
    software: 0.3,
    production: 0.595,
    tonerCx3133: 0.501
  }
}

const druckermodellFaktorGruppe = {
  'Konica Minolta bizhub C251i': 'Konica Minolta'
}

const epKategorieByZubehoer = {
  Drucker: 'body',
  Deckel: 'optionen',
  'Kassetten & Unterschränke': 'optionen',
  'Finishing / Locher / Fax': 'optionen',
  Software: 'software',
  'Production Printing': 'production',
  'Toner CX 31-33': 'tonerCx3133',
  'DS PP Toner': 'dsPpToner'
}

const normalizeNumber = (value) => {
  const parsedValue = Number(String(value ?? '').replace(/['\s]/g, '').replace(',', '.'))
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

const getEpFaktorGruppe = () =>
  druckermodellFaktorGruppe[druckermodell.value] ?? 'Konica Minolta'

const getEpKategorie = (position) =>
  position.epKategorie ?? epKategorieByZubehoer[position.zubehoer] ?? 'optionen'

const getEpFaktor = (position) => {
  const faktoren = epFaktoren[getEpFaktorGruppe()]
  const kategorie = getEpKategorie(position)

  return faktoren?.[kategorie] ?? faktoren?.body ?? 0
}

const getKalkulationsEpFaktor = () =>
  epFaktoren[getEpFaktorGruppe()]?.body ?? 0

const getEinkaufspreis = (position) =>
  normalizeNumber(position.vp) * getEpFaktor(position)

const produktkatalog = [
  {
    zubehoer: 'Deckel',
    bezeichnung: 'OC-511 Originalabdeckung',
    vp: 89
  },
  {
    zubehoer: 'Deckel',
    bezeichnung: 'DF-632 Originaleinzug zu 1-Serie',
    vp: 625
  },
  {
    zubehoer: 'Deckel',
    bezeichnung: 'DF-714 Dual Scan Originaleinzug zu 1i-Serie',
    vp: 1155
  },
  {
    zubehoer: 'Kassetten & Unterschränke',
    bezeichnung: 'PC-116 Universalkassette (1 x 500 Seiten; A5-A3; 80 g/m2)',
    vp: 675
  },
  {
    zubehoer: 'Kassetten & Unterschränke',
    bezeichnung: 'PC-216 Universalkassette (2 x 500 Seiten; A5-A3; 80 g/m2)',
    vp: 975
  },
  {
    zubehoer: 'Kassetten & Unterschränke',
    bezeichnung: "PC-416 Grossraumkassette (2'500 Seiten; A4, 80 g/m2)",
    vp: 975
  },
  {
    zubehoer: 'Kassetten & Unterschränke',
    bezeichnung:
      "PC-417 Grossraumkassette mit 2 parallelen Fächern (1'000 + 1'500 Seiten; A5-A4; 80 g/m2)",
    vp: 1315
  },
  {
    zubehoer: 'Kassetten & Unterschränke',
    bezeichnung: "LU-302 Seitliche Grossraumkassette (3'000 Seiten, A4, 80 g/m2)",
    vp: 1730
  },
  {
    zubehoer: 'Kassetten & Unterschränke',
    bezeichnung: 'DK-516x Unterschrank',
    vp: 145
  },
  {
    zubehoer: 'Finishing / Locher / Fax',
    bezeichnung: 'FS-539 Heftfinisher (50 Seiten)',
    vp: 1260
  },
  {
    zubehoer: 'Finishing / Locher / Fax',
    bezeichnung:
      'FS-539SD Finisher mit Broschüreneinheit (Heften 50 Seiten/Booklet 20 Seiten)',
    vp: 2230
  },
  {
    zubehoer: 'Finishing / Locher / Fax',
    bezeichnung:
      'RU-513 Verbindungseinheit für FS-534/SD, FS-536/SD, FS-537/SD, FS-539(SD), FS-540(SD)',
    vp: 165
  },
  {
    zubehoer: 'Finishing / Locher / Fax',
    bezeichnung: 'PK-524 Locheinheit für FS-539/SD',
    vp: 400
  },
  {
    zubehoer: 'Finishing / Locher / Fax',
    bezeichnung: 'FS-533 Integrierter Finisher V2 (50 Seiten)',
    vp: 840
  },
  {
    zubehoer: 'Finishing / Locher / Fax',
    bezeichnung: 'EH-T592 Externer Hefter (50 Seiten)',
    vp: 270
  },
  {
    zubehoer: 'Finishing / Locher / Fax',
    bezeichnung: 'PK-519 Locheinheit 2/4-fach-Lochung zu FS-533',
    vp: 355
  },
  {
    zubehoer: 'Finishing / Locher / Fax',
    bezeichnung: 'JS-506 Integrierte Job-Trenneinheit',
    vp: 370
  },
  {
    zubehoer: 'Finishing / Locher / Fax',
    bezeichnung: 'FK-514 Fax Karte v2',
    vp: 1025
  }
]

const positions = ref([
  {
    id: 1,
    istDrucker: true,
    zubehoer: 'Drucker',
    bezeichnung: 'Konica Minolta bizhub C251i',
    menge: 1,
    vp: formatDecimal(4401.5),
    epKategorie: 'body'
  },
  ...produktkatalog.map((produkt, index) => ({
    id: index + 2,
    zubehoer: produkt.zubehoer,
    bezeichnung: produkt.bezeichnung,
    menge: 1,
    vp: formatDecimal(produkt.vp),
    epKategorie: epKategorieByZubehoer[produkt.zubehoer] ?? 'optionen'
  }))
])

const formatCurrency = (value) =>
  new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF'
  }).format(value)

const formatAmount = (value) =>
  new Intl.NumberFormat('de-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)

const getGesamtpreis = (position) =>
  normalizeNumber(position.menge) * normalizeNumber(position.vp)

const getProdukteByZubehoer = (zubehoer) =>
  produktkatalog.filter((produkt) => produkt.zubehoer === zubehoer)

const getProdukt = (zubehoer, bezeichnung) =>
  produktkatalog.find(
    (produkt) =>
      produkt.zubehoer === zubehoer &&
      produkt.bezeichnung === bezeichnung
  )

const updatePositionZubehoer = (position) => {
  position.bezeichnung = ''
  position.vp = '0.00'
  position.epKategorie = epKategorieByZubehoer[position.zubehoer] ?? 'optionen'
}

const updatePositionProdukt = (position) => {
  const produkt = getProdukt(position.zubehoer, position.bezeichnung)

  if (!produkt) {
    position.vp = '0.00'
    position.epKategorie = epKategorieByZubehoer[position.zubehoer] ?? 'optionen'
    return
  }

  position.vp = formatDecimal(produkt.vp)
  position.epKategorie = produkt.epKategorie ?? epKategorieByZubehoer[produkt.zubehoer] ?? 'optionen'
}

const normalizeQuantity = (position) => {
  const menge = Math.trunc(normalizeNumber(position.menge))
  position.menge = Math.max(1, menge)
}

const normalizePrice = (position) => {
  position.vp = formatDecimal(normalizeNumber(position.vp))
}

const normalizePercent = () => {
  const rabatt = normalizeNumber(eintauschRabattProzent.value)
  eintauschRabattProzent.value = formatDecimal(Math.max(0, Math.min(100, rabatt)))
}

const updateLieferungOption = () => {
  const option = lieferungOptionen.find(
    (eintrag) => eintrag.value === lieferungOption.value
  )

  lieferungBetrag.value = formatDecimal(option?.betrag ?? 0)
}

const normalizeRestwertBetrag = () => {
  restwertBetrag.value = formatDecimal(Math.max(0, normalizeNumber(restwertBetrag.value)))
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

const einkaufspreis = computed(() =>
  nettopreis.value * getKalkulationsEpFaktor()
)

const mietbasis = computed(() =>
  Math.max(0, einkaufspreis.value)
)

const getMietbetrag = (monate) => {
  const mietansatz = mietansaetze[monate]

  return mietansatz > 0 ? mietbasis.value / mietansatz : 0
}

const addPosition = () => {
  positions.value.push({
    id: naechsteId.value,
    zubehoer: '',
    bezeichnung: '',
    menge: 1,
    vp: '0.00',
    epKategorie: 'optionen'
  })
  naechsteId.value += 1
}

const removePosition = (id) => {
  positions.value = positions.value.filter((position) => position.id !== id)
}
</script>

<template>
  <section class="row g-3">
    <div class="col-12">
      <div class="card shadow-sm border-0">
        <div class="card-body p-4">
          <div class="calculation-toolbar mb-3 pb-2 border-bottom">
            <div class="toolbar-field toolbar-field-model">
              <label for="druckermodell" class="toolbar-label">
                Druckermodell:
              </label>
              <select
                id="druckermodell"
                v-model="druckermodell"
                class="form-select control-field toolbar-select"
              >
                <option
                  v-for="modell in druckermodelle"
                  :key="modell"
                  :value="modell"
                >
                  {{ modell }}
                </option>
              </select>
            </div>

            <div class="toolbar-field toolbar-field-variant">
              <label for="variante" class="toolbar-label">
                Variante (Geschwindigkeit):
              </label>
              <select
                id="variante"
                v-model="variante"
                class="form-select control-field toolbar-select"
              >
                <option
                  v-for="eintrag in varianten"
                  :key="eintrag"
                  :value="eintrag"
                >
                  {{ eintrag }}
                </option>
              </select>
            </div>

            <button
              type="button"
              class="btn configuration-button"
            >
              <i class="pi pi-list" aria-hidden="true"></i>
              Konfigurationen
            </button>
          </div>

          <div class="position-toolbar">
            <h4 class="positions-heading mb-0">Positionen</h4>
          </div>

          <div class="table-responsive">
            <table class="table align-middle mb-0 table-bordered">
              <thead>
                <tr>
                  <th scope="col">Kategorie</th>
                  <th scope="col">Bezeichnung</th>
                  <th scope="col" class="text-end">Menge</th>
                  <th scope="col" class="text-end price-header">VP (CHF)</th>
                  <th scope="col" class="text-end price-header">EP (CHF)</th>
                  <th scope="col" class="text-end total-header">Gesamtpreis (CHF)</th>
                  <th scope="col" class="text-center">Aktion</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="position in positions"
                  :key="position.id"
                  :class="{ 'empty-position-row': isEmptyPosition(position) }"
                >
                  <td>
                    <input
                      v-if="position.istDrucker"
                      :value="position.zubehoer"
                      type="text"
                      class="form-control control-field readonly-price"
                      readonly
                      tabindex="-1"
                    />
                    <select
                      v-else
                      v-model="position.zubehoer"
                      class="form-select control-field"
                      @change="updatePositionZubehoer(position)"
                    >
                      <option value="" disabled>Zubehör wählen</option>
                      <option
                        v-for="zubehoer in zubehoerKategorien"
                        :key="zubehoer"
                        :value="zubehoer"
                      >
                        {{ zubehoer }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <input
                      v-if="position.istDrucker"
                      :value="position.bezeichnung"
                      type="text"
                      class="form-control control-field readonly-price"
                      readonly
                      tabindex="-1"
                    />
                    <select
                      v-else
                      v-model="position.bezeichnung"
                      class="form-select control-field"
                      :disabled="!position.zubehoer"
                      @change="updatePositionProdukt(position)"
                    >
                      <option value="" disabled>Bezeichnung wählen</option>
                      <option
                        v-for="produkt in getProdukteByZubehoer(position.zubehoer)"
                        :key="produkt.bezeichnung"
                        :value="produkt.bezeichnung"
                      >
                        {{ produkt.bezeichnung }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <input
                      v-model.number="position.menge"
                      type="number"
                      min="1"
                      step="1"
                      inputmode="numeric"
                      class="form-control control-field text-end"
                      placeholder="1"
                      @change="normalizeQuantity(position)"
                      @blur="normalizeQuantity(position)"
                    />
                  </td>
                  <td>
                    <input
                      v-model="position.vp"
                      type="text"
                      inputmode="decimal"
                      class="form-control control-field text-end"
                      placeholder="0.00"
                      @blur="normalizePrice(position)"
                    />
                  </td>
                  <td>
                    <input
                      :value="formatAmount(getEinkaufspreis(position))"
                      type="text"
                      class="form-control control-field text-end readonly-price"
                      readonly
                      tabindex="-1"
                      aria-label="Einkaufspreis"
                    />
                  </td>
                  <td class="text-end fw-semibold">
                    {{ formatAmount(getGesamtpreis(position)) }}
                  </td>
                  <td class="text-center align-middle">
                    <i
                      v-if="!position.istDrucker"
                      class="pi pi-trash delete-icon"
                      role="button"
                      tabindex="0"
                      aria-label="Position loeschen"
                      @click="removePosition(position.id)"
                    ></i>
                  </td>
                </tr>
                <tr class="position-add-table-row">
                  <td colspan="7">
                    <div class="position-add-content">
                      <button
                        type="button"
                        class="position-add-button"
                        aria-label="Position hinzufügen"
                        @click="addPosition"
                      >
                        <i class="pi pi-plus" aria-hidden="true"></i>
                        <span>Position hinzufügen</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="calculation-panel">
            <div class="calculation-layout">
              <div class="calculation-card calculation-card-main">
                <h4 class="positions-heading calculation-card-heading">Kalkulation</h4>

                <div class="calculation-form">
                  <div class="calculation-form-row">
                    <div class="calculation-form-label">Verkaufspreis</div>
                    <div class="calculation-empty-cell"></div>
                    <div class="input-group currency-group">
                      <span class="input-group-text">CHF</span>
                      <input
                        :value="formatAmount(verkaufspreis)"
                        type="text"
                        class="form-control amount-input readonly-price calculated-price-input"
                        readonly
                        tabindex="-1"
                      />
                    </div>
                  </div>

                  <div class="calculation-form-row">
                    <div class="calculation-form-label">Eintauschrabatt</div>
                    <div class="input-group percent-group">
                      <input
                        v-model="eintauschRabattProzent"
                        type="text"
                        inputmode="decimal"
                        class="form-control text-end"
                        @blur="normalizePercent"
                      />
                      <span class="input-group-text">%</span>
                    </div>
                    <div class="input-group currency-group">
                      <span class="input-group-text">CHF</span>
                      <input
                        :value="formatAmount(eintauschRabattBetrag)"
                        type="text"
                        class="form-control amount-input readonly-price"
                        readonly
                        tabindex="-1"
                      />
                    </div>
                  </div>

                  <div class="calculation-form-row">
                    <div class="calculation-form-label">Lieferung gemäss Konditionen</div>
                    <select
                      v-model="lieferungOption"
                      class="form-select control-field"
                      @change="updateLieferungOption"
                    >
                      <option
                        v-for="option in lieferungOptionen"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                    <div class="input-group currency-group">
                      <span class="input-group-text">CHF</span>
                      <input
                        :value="formatAmount(lieferungBetrag)"
                        type="text"
                        class="form-control amount-input readonly-price"
                        readonly
                        tabindex="-1"
                      />
                    </div>
                  </div>

                  <div class="calculation-form-row">
                    <div class="calculation-form-label">Restwert</div>
                    <div class="input-group month-group">
                      <input
                        v-model.number="restwertMonate"
                        type="number"
                        min="0"
                        step="1"
                        inputmode="numeric"
                        class="form-control text-end"
                        @change="normalizeRestwertMonate"
                        @blur="normalizeRestwertMonate"
                      />
                      <span class="input-group-text">Mt.</span>
                    </div>
                    <div class="input-group currency-group">
                      <span class="input-group-text">CHF</span>
                      <input
                        v-model="restwertBetrag"
                        type="text"
                        inputmode="decimal"
                        class="form-control amount-input"
                        @blur="normalizeRestwertBetrag"
                      />
                    </div>
                  </div>

                  <div class="calculation-form-row net-row">
                    <div class="calculation-form-label">Nettopreis</div>
                    <div class="calculation-empty-cell"></div>
                    <input
                      :value="`CHF ${formatAmount(nettopreis)}`"
                      type="text"
                      class="form-control amount-input readonly-price net-price-input"
                      readonly
                      tabindex="-1"
                    />
                  </div>
                </div>
              </div>

              <div class="calculation-card rent-section">
                <h4 class="positions-heading calculation-card-heading">Mietoptionen</h4>

                <div class="rent-options">
                  <div class="rent-option">
                    <span class="rent-icon">
                      <i class="pi pi-calendar" aria-hidden="true"></i>
                    </span>
                    <span class="rent-label">Miete 48 Monate</span>
                    <span class="rent-value">
                      <span class="rent-amount">CHF {{ formatAmount(getMietbetrag(48)) }}</span>
                      <span class="rent-period">&nbsp;/ Monat</span>
                    </span>
                    <span class="rent-basis">Basis: CHF {{ formatAmount(mietbasis) }}</span>
                  </div>

                  <div class="rent-option">
                    <span class="rent-icon">
                      <i class="pi pi-calendar" aria-hidden="true"></i>
                    </span>
                    <span class="rent-label">Miete 60 Monate</span>
                    <span class="rent-value">
                      <span class="rent-amount">CHF {{ formatAmount(getMietbetrag(60)) }}</span>
                      <span class="rent-period">&nbsp;/ Monat</span>
                    </span>
                    <span class="rent-basis">Basis: CHF {{ formatAmount(mietbasis) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.calculation-toolbar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.toolbar-field {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.toolbar-field-model {
  flex: 1 1 28rem;
}

.toolbar-field-variant {
  flex: 1 1 31rem;
}

.toolbar-label {
  flex: 0 0 auto;
  margin: 0;
  color: #101828;
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
  white-space: nowrap;
}

.toolbar-select {
  flex: 1 1 auto;
  max-width: 23.5rem;
}

.toolbar-field-variant .toolbar-select {
  max-width: 18.5rem;
}

.configuration-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-width: 10.25rem;
  min-height: 2.35rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid #8bb5ff;
  border-radius: 0.42rem;
  background: #ffffff;
  color: #2563eb;
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
}

.configuration-button:hover,
.configuration-button:focus-visible {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
}

.configuration-button .pi {
  font-size: 1rem;
}

.position-toolbar {
  min-height: 2.5rem;
  margin: 0 0 0.65rem;
}

.positions-heading {
  display: flex;
  align-items: center;
  color: #101828;
  font-size: var(--kt-font-size-lg);
  font-weight: 600;
  letter-spacing: 0;
  line-height: 2.35rem;
  min-height: 2.35rem;
  margin: 0;
}

.control-field {
  min-height: 2.45rem;
  padding-top: 0.42rem;
  padding-bottom: 0.42rem;
  font-size: var(--kt-font-size-md);
  line-height: 1.2;
}

.toolbar-select {
  min-height: 2.55rem;
}

.position-add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
  white-space: nowrap;
}

.position-add-button .pi {
  font-size: 1rem;
}

.position-add-button:hover,
.position-add-button:focus-visible {
  color: #1d4ed8;
}

.position-add-button:focus-visible {
  outline: 2px solid #bfdbfe;
  outline-offset: 0.2rem;
  border-radius: 0.2rem;
}

.table .control-field {
  min-height: 2.35rem;
  padding-top: 0.36rem;
  padding-bottom: 0.36rem;
}

.readonly-price {
  background-color: #f8fafc;
  color: #667085;
  cursor: default;
  opacity: 1;
}

.table thead th {
  background-color: #fdfefe;
  color: #101828;
  font-weight: 500;
  border-bottom: 1px solid #e7ebf0;
  vertical-align: middle;
  font-size: var(--kt-font-size-sm);
  line-height: var(--kt-line-height-tight);
  white-space: nowrap;
}

.table thead th.price-header {
  min-width: 7rem;
}

.table thead th.total-header {
  min-width: 10rem;
}

.table tbody td {
  background-color: #ffffff;
}

.position-add-table-row td {
  padding: 0.78rem 1.45rem;
  border-top: 0;
}

.position-add-content {
  display: flex;
  align-items: center;
  gap: 1.35rem;
  width: 100%;
}

.position-add-content::before,
.position-add-content::after {
  content: '';
  flex: 1 1 0;
  border-top: 1px dashed #a9bef8;
}

.delete-icon {
  color: #c9a0a0;
  font-size: 1rem;
  transition: color 0.15s ease;
}

.delete-icon:hover,
.delete-icon:focus-visible {
  color: #dc2626;
}

.delete-icon:focus-visible {
  outline: 2px solid #fecaca;
  outline-offset: 0.2rem;
  border-radius: 0.2rem;
}

.empty-position-row td {
  background-color: #fbfcff;
}

.empty-position-row .form-control,
.empty-position-row .form-select {
  border-color: #e4e7ec;
  color: #667085;
}

.empty-position-row .form-control::placeholder {
  color: #a7b0bf;
}

.calculation-panel {
  margin-top: 1.85rem;
  padding-top: 1.6rem;
  border-top: 1px solid #d9dee8;
}

.calculation-layout {
  display: grid;
  grid-template-columns: minmax(0, 70fr) minmax(18rem, 30fr);
  align-items: start;
  gap: 1rem;
}

.calculation-card {
  min-width: 0;
  padding: 1.15rem;
  border: 1px solid #e4e7ec;
  border-radius: 0.42rem;
  background: #ffffff;
}

.calculation-card-heading {
  min-height: 2.2rem;
  margin-bottom: 0.65rem;
}

.calculation-form {
  display: grid;
  gap: 0.2rem;
}

.calculation-form-row {
  display: grid;
  grid-template-columns: minmax(12rem, 1.2fr) minmax(10rem, 0.8fr) minmax(16rem, 1fr);
  align-items: center;
  column-gap: 1rem;
}

.calculation-form-row {
  min-height: 3.55rem;
  padding: 0.42rem 0.25rem;
  border-bottom: 1px solid #f0f3f8;
}

.calculation-form-row:last-child {
  border-bottom: 0;
}

.calculation-form-label {
  color: #101828;
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
}

.amount-input {
  min-height: 2.35rem;
  border-radius: 0.42rem;
  text-align: right;
  font-size: var(--kt-font-size-md);
}

.calculation-form-row > .readonly-price {
  color: #101828;
}

.currency-group .input-group-text {
  min-width: 4.25rem;
  justify-content: center;
  color: #475467;
  font-size: var(--kt-font-size-md);
  background: #f8fafc;
}

.percent-group,
.month-group,
.currency-group {
  width: 100%;
}

.percent-group .form-control,
.month-group .form-control,
.currency-group .form-control {
  min-height: 2.35rem;
  font-size: var(--kt-font-size-md);
}

.currency-group .readonly-price {
  color: #101828;
}

.percent-group .input-group-text,
.month-group .input-group-text {
  min-width: 4.5rem;
  justify-content: center;
  color: #475467;
  font-size: var(--kt-font-size-md);
  background: #f8fafc;
}

.net-row {
  min-height: 2.75rem;
  margin-top: 0.55rem;
  padding: 0;
  background-color: #eef4ff;
  border: 1px solid #e4ebff;
  border-radius: 0.42rem;
}

.net-row .calculation-form-label,
.net-row .amount-input {
  color: #155eef;
  font-weight: 700;
}

.net-row .calculation-form-label {
  padding-left: 0.75rem;
  font-size: 1.08rem;
}

.net-price-input {
  min-height: 2.75rem;
  background-color: #eef4ff;
  border-color: transparent;
  box-shadow: none;
}

.calculated-price-input {
  background-color: #eef2f7;
  border-color: #d8dee8;
  font-weight: 600;
}

.rent-section {
  align-self: stretch;
  padding-bottom: 0.9rem;
}

.rent-options {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.55rem;
}

.rent-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: repeat(3, min-content);
  align-items: center;
  align-content: center;
  gap: 0.3rem 0.85rem;
  min-height: 4.05rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid #e4e7ec;
  border-radius: 0.42rem;
  background: #ffffff;
}

.rent-icon {
  display: inline-flex;
  grid-row: span 3;
  align-self: center;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid #e4e7ec;
  border-radius: 0.42rem;
  background: #f8fafc;
  color: #2563eb;
  font-size: 0.9rem;
}

.rent-label,
.rent-value,
.rent-basis {
  color: #101828;
  font-size: 1rem;
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
}

.rent-value {
  min-width: 0;
  color: #101828;
  text-align: left;
  font-weight: 600;
}

.rent-amount {
  color: #155eef;
  font-weight: 600;
}

.rent-period {
  color: #667085;
  font-weight: 500;
}

.rent-basis {
  color: #667085;
  font-size: 0.9rem;
  font-weight: 500;
}

@media (max-width: 1199.98px) {
  .calculation-toolbar {
    flex-wrap: wrap;
    gap: 1rem 1.5rem;
  }

  .toolbar-field-model,
  .toolbar-field-variant {
    flex: 1 1 100%;
  }

  .toolbar-select,
  .toolbar-field-variant .toolbar-select {
    max-width: none;
  }

  .calculation-layout {
    grid-template-columns: 1fr;
  }

  .rent-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 575.98px) {
  .toolbar-field {
    align-items: stretch;
    flex-direction: column;
    gap: 0.6rem;
  }

  .configuration-button {
    width: 100%;
    min-width: 0;
  }

  .calculation-form-row {
    grid-template-columns: 1fr;
    row-gap: 0.55rem;
  }

  .calculation-empty-cell {
    display: none;
  }

  .rent-options {
    grid-template-columns: 1fr;
  }

}
</style>
