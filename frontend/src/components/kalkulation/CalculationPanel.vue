<script setup>
import { computed, ref } from 'vue'
import CurrencyReadonlyField from './CurrencyReadonlyField.vue'

const INCLUDED_DELIVERY_OPTION = 'inkl'
const INCLUDED_DELIVERY_CONDITION_KEYS = new Set([
  'bereitstellung_vorkonfiguration_justagen',
  'lieferung_standort_kurzinstruktion'
])
const SELECTABLE_CONDITION_KEYS = new Set([
  'lieferung_treppenlift',
  'vorabklaerung_netzwerkinstallation',
  'netzwerkintegration_max_2_stunden',
  'fleetmanager_printfacts_erstinstallation',
  'fleetmanager_printfacts_monat_geraet'
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

const eintauschRabattProzent = defineModel('eintauschRabattProzent', {
  type: [String, Number],
  required: true
})
const lieferungOption = defineModel('lieferungOption', {
  type: String,
  required: true
})
const restwertMonate = defineModel('restwertMonate', {
  type: [String, Number],
  required: true
})
const restwertBetrag = defineModel('restwertBetrag', {
  type: [String, Number],
  required: true
})
const inklusiveKopienSW = defineModel('inklusiveKopienSW', {
  type: [String, Number],
  required: true
})
const inklusiveKopienColor = defineModel('inklusiveKopienColor', {
  type: [String, Number],
  required: true
})
const preisZusatzPrintSW = defineModel('preisZusatzPrintSW', {
  type: [String, Number],
  required: true
})
const preisZusatzPrintColor = defineModel('preisZusatzPrintColor', {
  type: [String, Number],
  required: true
})
const flatratePauschalBetrag = defineModel('flatratePauschalBetrag', {
  type: [String, Number],
  required: true
})
const scanpauschaleMietMonate = defineModel('scanpauschaleMietMonate', {
  type: [String, Number],
  required: true
})
const scanpauschaleAuswahl = defineModel('scanpauschaleAuswahl', {
  type: String,
  required: true
})

const props = defineProps({
  verkaufspreis: {
    type: Number,
    required: true
  },
  einkaufspreis: {
    type: Number,
    required: true
  },
  eintauschRabattBetrag: {
    type: Number,
    required: true
  },
  lieferungOptionen: {
    type: Array,
    required: true
  },
  lieferungBetrag: {
    type: [String, Number],
    required: true
  },
  nettopreis: {
    type: Number,
    required: true
  },
  servicePauschaleMonat: {
    type: Number,
    required: true
  },
  scanpauschaleBerechnet: {
    type: Number,
    required: true
  },
  mietoptionen: {
    type: Array,
    required: true
  },
  mietbasis: {
    type: Number,
    required: true
  },
  konditionenA3Mfp: {
    type: Array,
    required: true
  },
  recyclingGebuehrSwico: {
    type: Number,
    required: true
  },
  npkAbschlussgebuehr: {
    type: Number,
    required: true
  },
  normalizePercent: {
    type: Function,
    required: true
  },
  updateLieferungOption: {
    type: Function,
    required: true
  },
  normalizeRestwertMonate: {
    type: Function,
    required: true
  },
  normalizeRestwertBetrag: {
    type: Function,
    required: true
  },
  normalizeInklusiveKopienSW: {
    type: Function,
    required: true
  },
  normalizeInklusiveKopienColor: {
    type: Function,
    required: true
  },
  normalizePreisZusatzPrintSW: {
    type: Function,
    required: true
  },
  normalizePreisZusatzPrintColor: {
    type: Function,
    required: true
  },
  normalizeFlatratePauschalBetrag: {
    type: Function,
    required: true
  },
  normalizeScanpauschaleMietMonate: {
    type: Function,
    required: true
  },
  normalizeScanpauschaleAuswahl: {
    type: Function,
    required: true
  },
  getMietbetrag: {
    type: Function,
    required: true
  },
  formatAmount: {
    type: Function,
    required: true
  }
})

const selectedLieferungBetrag = computed(
  () =>
    props.lieferungOptionen.find((option) => option.value === lieferungOption.value)
      ?.betrag ?? props.lieferungBetrag
)

const selectedLieferungOption = computed({
  get: () => lieferungOption.value,
  set: (optionValue) => {
    props.updateLieferungOption(optionValue)
  }
})

const isIncludedDeliveryCondition = (kondition) =>
  lieferungOption.value === INCLUDED_DELIVERY_OPTION &&
  INCLUDED_DELIVERY_CONDITION_KEYS.has(kondition.key)

const hasKonditionBetrag = (kondition) => kondition.betragText && kondition.betragText !== '-'

const getKonditionBetragLabel = (kondition) => `Fr. ${kondition.betragText}`

const isSelectableCondition = (kondition) => SELECTABLE_CONDITION_KEYS.has(kondition.key)

const getKonditionOptions = (kondition) =>
  CUSTOM_CONDITION_OPTIONS[kondition.key] ?? [
    { value: 'betrag', label: getKonditionBetragLabel(kondition) },
    { value: 'keine', label: 'keine' },
    { value: 'inkl', label: 'inkl.' }
  ]

const getDefaultKonditionAuswahl = (kondition) =>
  getKonditionOptions(kondition).find((option) => option.value === 'betrag')?.value ??
  getKonditionOptions(kondition)[0]?.value ??
  'betrag'

const updateKonditionChecked = (kondition) => {
  if (isIncludedDeliveryCondition(kondition)) {
    kondition.auswahl = 'inkl'
    kondition.checked = false
    kondition.manuell = false
    return
  }

  kondition.manuell = true

  if (!isSelectableCondition(kondition)) {
    kondition.auswahl = kondition.checked ? 'betrag' : 'keine'
    return
  }

  kondition.auswahl = kondition.checked
    ? getDefaultKonditionAuswahl(kondition)
    : 'keine'
}

const getStaticKonditionText = (kondition) => {
  if (isIncludedDeliveryCondition(kondition)) {
    return 'inkl.'
  }

  if (kondition.key === 'vorgezogene_recyclinggebuehr_swico') {
    return getKonditionBetragLabel({
      betragText: props.formatAmount(props.recyclingGebuehrSwico)
    })
  }

  if (kondition.key === 'npk_abschlussgebuehr') {
    return getKonditionBetragLabel({
      betragText: props.formatAmount(props.npkAbschlussgebuehr)
    })
  }

  if (!hasKonditionBetrag(kondition)) {
    return '-'
  }

  return getKonditionBetragLabel(kondition)
}

const updateKonditionAuswahl = (kondition) => {
  kondition.manuell = true
  kondition.checked = kondition.auswahl !== 'keine'
}

const openDetailsPanel = ref('')

const toggleDetailsPanel = (panelName) => {
  openDetailsPanel.value = openDetailsPanel.value === panelName ? '' : panelName
}

</script>

<template>
  <div class="calculation-panel">
    <div class="calculation-layout">
      <div class="calculation-card calculation-card-main">
        <h2 class="positions-heading calculation-card-heading">Kalkulation</h2>

        <div class="calculation-form">
          <div class="calculation-form-row price-comparison-row">
            <div class="calculation-form-label">Einkaufspreis / Verkaufspreis</div>

            <CurrencyReadonlyField
              :amount="einkaufspreis"
              :format-amount="formatAmount"
              aria-label="Einkaufspreis"
              input-class="calculated-price-input"
            />

            <CurrencyReadonlyField
              :amount="verkaufspreis"
              :format-amount="formatAmount"
              aria-label="Verkaufspreis"
              input-class="calculated-price-input"
            />
          </div>

          <div class="calculation-form-row">
            <div class="calculation-form-label">Eintauschrabatt</div>
            <div class="input-group percent-group">
              <input
                v-model="eintauschRabattProzent"
                type="text"
                inputmode="decimal"
                class="form-control text-end"
                aria-label="Eintauschrabatt in Prozent"
                @blur="normalizePercent"
              />
              <span class="input-group-text">%</span>
            </div>
            <CurrencyReadonlyField
              :amount="eintauschRabattBetrag"
              :format-amount="formatAmount"
              aria-label="Eintauschrabatt in CHF"
            />
          </div>

          <div class="calculation-form-row">
            <div class="calculation-form-label">Lieferung gemäss Konditionen</div>
            <select
              v-model="selectedLieferungOption"
              class="form-select control-field"
              aria-label="Lieferung gemäss Konditionen"
            >
              <option
                v-for="option in lieferungOptionen"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <CurrencyReadonlyField
              :amount="selectedLieferungBetrag"
              :format-amount="formatAmount"
              aria-label="Lieferbetrag in CHF"
            />
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
                aria-label="Restwert Monate"
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
                aria-label="Restwert in CHF"
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
              aria-label="Nettopreis"
            />
          </div>

        </div>
      </div>

      <div class="calculation-card rent-section">
        <h2 class="positions-heading calculation-card-heading">Mietoptionen</h2>

        <div class="rent-options">
          <div
            v-for="monate in mietoptionen"
            :key="monate"
            class="rent-option"
          >
            <span class="rent-icon">
              <i class="pi pi-calendar" aria-hidden="true"></i>
            </span>
            <span class="rent-label">Miete {{ monate }} Monate</span>
            <span class="rent-value">
              <span class="rent-amount">CHF {{ formatAmount(getMietbetrag(monate)) }}</span>
              <span class="rent-period">&nbsp;/ Monat</span>
            </span>
            <span class="rent-basis">Basis: CHF {{ formatAmount(mietbasis) }}</span>
          </div>
        </div>
      </div>
    </div>

    <details
      class="calculation-card collapsible-card service-conditions-card"
      :open="openDetailsPanel === 'service'"
    >
      <summary
        class="collapsible-card-summary"
        @click.prevent="toggleDetailsPanel('service')"
      >
        <span class="collapsible-card-title">Servicekonditionen</span>
      </summary>

      <div class="service-conditions">
        <div class="conditions-grid">
          <section class="conditions-group">
            <div class="conditions-table">
              <div class="conditions-row conditions-header-row">
                <div></div>
                <div>Servicepauschale/Mt.</div>
                <div>inkl. Kopien s/w</div>
                <div>inkl. Kopien color</div>
              </div>

              <div class="conditions-row">
                <div class="conditions-label">Servicekonditionen</div>
                <CurrencyReadonlyField
                  :amount="servicePauschaleMonat"
                  :format-amount="formatAmount"
                  aria-label="Servicepauschale pro Monat"
                />
                <input
                  v-model.number="inklusiveKopienSW"
                  type="number"
                  min="0"
                  step="1"
                  inputmode="numeric"
                  class="form-control text-end service-number-input"
                  aria-label="Inklusive Kopien schwarz-weiss"
                  @change="normalizeInklusiveKopienSW"
                  @blur="normalizeInklusiveKopienSW"
                />
                <input
                  v-model.number="inklusiveKopienColor"
                  type="number"
                  min="0"
                  step="1"
                  inputmode="numeric"
                  class="form-control text-end service-number-input"
                  aria-label="Inklusive Kopien color"
                  @change="normalizeInklusiveKopienColor"
                  @blur="normalizeInklusiveKopienColor"
                />
              </div>

              <div class="conditions-row">
                <div class="conditions-label">jeder weitere Print</div>
                <div></div>
                <div class="input-group rappen-group">
                  <span class="input-group-text">Rp.</span>
                  <input
                    v-model="preisZusatzPrintSW"
                    type="text"
                    inputmode="decimal"
                    class="form-control text-end"
                    aria-label="Preis pro weiteren Print schwarz-weiss in Rappen"
                    @blur="normalizePreisZusatzPrintSW"
                  />
                </div>
                <div class="input-group rappen-group">
                  <span class="input-group-text">Rp.</span>
                  <input
                    v-model="preisZusatzPrintColor"
                    type="text"
                    inputmode="decimal"
                    class="form-control text-end"
                    aria-label="Preis pro weiteren Print color in Rappen"
                    @blur="normalizePreisZusatzPrintColor"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="conditions-group">
            <h3 class="conditions-group-title">Variante Flatrate</h3>

            <div class="conditions-table">
              <div class="conditions-row conditions-header-row">
                <div></div>
                <div></div>
                <div>Servicepauschale</div>
                <div>Betrag</div>
              </div>

              <div class="conditions-row">
                <div class="conditions-label">
                  Flatrate Vertrag über den gesamten Gerätepark
                </div>
                <div></div>
                <div class="conditions-value-label">pauschal</div>
                <div class="input-group currency-group">
                  <span class="input-group-text">CHF</span>
                  <input
                    v-model="flatratePauschalBetrag"
                    type="text"
                    inputmode="decimal"
                    class="form-control amount-input"
                    aria-label="Pauschalbetrag Flatrate"
                    @blur="normalizeFlatratePauschalBetrag"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="conditions-group">
            <h3 class="conditions-group-title">Scanpauschale</h3>

            <div class="conditions-table">
              <div class="conditions-row conditions-header-row">
                <div></div>
                <div>Monatsmiete</div>
                <div>Berechnet</div>
                <div>Betrag</div>
              </div>

              <div class="conditions-row">
                <div class="conditions-label">
                  Pauschalbetrag für Scanningaufträge
                </div>
                <select
                  v-model.number="scanpauschaleMietMonate"
                  class="form-select control-field"
                  aria-label="Mietlaufzeit für Scanpauschale"
                  @change="normalizeScanpauschaleMietMonate"
                >
                  <option
                    v-for="monate in mietoptionen"
                    :key="monate"
                    :value="monate"
                  >
                    Miete {{ monate }} Mt. / CHF {{ formatAmount(getMietbetrag(monate)) }}
                  </option>
                </select>
                <CurrencyReadonlyField
                  :amount="scanpauschaleBerechnet"
                  :format-amount="formatAmount"
                  aria-label="Berechnete Scanpauschale"
                />
                <select
                  v-model="scanpauschaleAuswahl"
                  class="form-select control-field scan-fee-select"
                  aria-label="Scanpauschale Betrag"
                  @change="normalizeScanpauschaleAuswahl"
                >
                  <option value="15">Fr. 15.00</option>
                  <option value="inkl">inkl.</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </details>

    <details
      class="calculation-card collapsible-card offer-conditions-card"
      :open="openDetailsPanel === 'conditions'"
    >
      <summary
        class="collapsible-card-summary"
        @click.prevent="toggleDetailsPanel('conditions')"
      >
        <span class="collapsible-card-title">Konditionen A3 MFP</span>
      </summary>

      <div class="table-responsive">
        <table class="table align-middle mb-0 offer-conditions-table">
          <thead>
            <tr>
              <th scope="col" class="text-center">✓</th>
              <th scope="col">Kondition</th>
              <th scope="col">Einheit</th>
              <th scope="col">Auswahl</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="kondition in konditionenA3Mfp"
              :key="kondition.key"
              :class="{ 'offer-condition-selected': kondition.checked }"
            >
              <td class="text-center">
                <input
                  v-model="kondition.checked"
                  class="form-check-input offer-condition-checkbox"
                  type="checkbox"
                  :disabled="isIncludedDeliveryCondition(kondition)"
                  :aria-label="`${kondition.label} auswählen`"
                  @change="updateKonditionChecked(kondition)"
                />
              </td>
              <td>{{ kondition.label }}</td>
              <td>{{ kondition.einheit }}</td>
              <td class="offer-condition-value-cell">
                <select
                  v-if="isSelectableCondition(kondition)"
                  v-model="kondition.auswahl"
                  class="form-select control-field offer-condition-select"
                  :aria-label="`${kondition.label} Auswahl`"
                  @change="updateKonditionAuswahl(kondition)"
                >
                  <option
                    v-for="option in getKonditionOptions(kondition)"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <span v-else>{{ getStaticKonditionText(kondition) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </div>
</template>
