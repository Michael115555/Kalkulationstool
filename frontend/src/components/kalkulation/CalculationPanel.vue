<script setup>
import { computed } from 'vue'

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
</script>

<template>
  <div class="calculation-panel">
    <div class="calculation-layout">
      <div class="calculation-card calculation-card-main">
        <h4 class="positions-heading calculation-card-heading">Kalkulation</h4>

        <div class="calculation-form">
          <div class="calculation-form-row price-comparison-row">
            <div class="calculation-form-label">Einkaufspreis / Verkaufspreis</div>

            <div class="input-group currency-group">
              <span class="input-group-text">CHF</span>
              <input
                :value="formatAmount(einkaufspreis)"
                type="text"
                class="form-control amount-input readonly-price calculated-price-input"
                readonly
                tabindex="-1"
              />
            </div>

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
              @change="updateLieferungOption($event.target.value)"
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
                :value="formatAmount(selectedLieferungBetrag)"
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
  </div>
</template>
