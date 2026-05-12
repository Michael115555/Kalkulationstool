<script setup>
import { computed } from 'vue'
import CurrencyReadonlyField from './CurrencyReadonlyField.vue'

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

    <div class="calculation-card service-conditions-card">
      <div class="service-conditions">
        <div class="conditions-grid">
          <section class="conditions-group">
            <h3 class="conditions-group-title">Servicekonditionen</h3>

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
    </div>
  </div>
</template>
