<script setup>
import { computed, ref } from 'vue'

const naechsteId = ref(4)
const druckermodell = ref('Canon 6155')
const variante = ref('45 Seiten/Min.')

const druckermodelle = ['Canon 6155', 'Canon 6160', 'Canon 7170']
const varianten = ['45 Seiten/Min.', '55 Seiten/Min.', '65 Seiten/Min.']
const rabattProzent = ref(0)
const margeProzent = ref(23.2)

const positions = ref([
  { id: 1, bezeichnung: 'Planung', menge: 8, einheit: 'Std.', einzelpreis: 95 },
  { id: 2, bezeichnung: 'Entwicklung', menge: 24, einheit: 'Std.', einzelpreis: 110 },
  { id: 3, bezeichnung: 'Abnahme', menge: 4, einheit: 'Std.', einzelpreis: 90 }
])

const formatCurrency = (value) =>
  new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF'
  }).format(value)

const normalizeNumber = (value) => {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

const getGesamtpreis = (position) =>
  normalizeNumber(position.menge) * normalizeNumber(position.einzelpreis)

const isEmptyPosition = (position) =>
  !position.bezeichnung &&
  !position.einheit &&
  normalizeNumber(position.menge) === 0 &&
  normalizeNumber(position.einzelpreis) === 0

const gesamtsumme = computed(() =>
  positions.value.reduce(
    (summe, position) => summe + getGesamtpreis(position),
    0
  )
)

const rabattBetrag = computed(() =>
  gesamtsumme.value * (normalizeNumber(rabattProzent.value) / 100)
)

const gesamtpreis = computed(() => gesamtsumme.value - rabattBetrag.value)

const margeBetrag = computed(() =>
  gesamtpreis.value * (normalizeNumber(margeProzent.value) / 100)
)

const addPosition = () => {
  positions.value.push({
    id: naechsteId.value,
    bezeichnung: '',
    menge: 0,
    einheit: '',
    einzelpreis: 0
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
            <button type="button" class="btn btn-primary action-button" @click="addPosition">
              Position hinzufügen
            </button>
          </div>

          <div class="table-responsive">
            <table class="table align-middle mb-0 table-bordered">
              <thead>
                <tr>
                  <th scope="col">Bezeichnung</th>
                  <th scope="col" class="text-end">Menge</th>
                  <th scope="col">Einheit</th>
                  <th scope="col" class="text-end">Einzelpreis</th>
                  <th scope="col" class="text-end">Gesamtpreis</th>
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
                      v-model="position.bezeichnung"
                      type="text"
                      class="form-control control-field"
                      placeholder="Bezeichnung"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="position.menge"
                      type="number"
                      min="0"
                      step="0.01"
                      class="form-control control-field text-end"
                      placeholder="0"
                    />
                  </td>
                  <td>
                    <input
                      v-model="position.einheit"
                      type="text"
                      class="form-control control-field"
                      placeholder="Einheit"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="position.einzelpreis"
                      type="number"
                      min="0"
                      step="0.01"
                      class="form-control control-field text-end"
                      placeholder="0.00"
                    />
                  </td>
                  <td class="text-end fw-semibold">
                    {{ formatCurrency(getGesamtpreis(position)) }}
                  </td>
                  <td class="text-center align-middle">
                    <i
                      class="pi pi-trash delete-icon"
                      role="button"
                      tabindex="0"
                      aria-label="Position loeschen"
                      @click="removePosition(position.id)"
                    ></i>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="summary-strip" aria-label="Kalkulationsuebersicht">
            <div class="summary-item">
              <div class="summary-icon summary-icon-blue">
                <i class="pi pi-calculator" aria-hidden="true"></i>
              </div>
              <div>
                <div class="summary-label">Zwischensumme</div>
                <div class="summary-value">{{ formatCurrency(gesamtsumme) }}</div>
                <div class="summary-note">(exkl. MWST)</div>
              </div>
            </div>

            <div class="summary-item">
              <div class="summary-icon summary-icon-green">
                <i class="pi pi-percentage" aria-hidden="true"></i>
              </div>
              <div>
                <div class="summary-label">Rabatt</div>
                <div class="summary-value">{{ rabattProzent.toFixed(2) }} %</div>
                <div class="summary-note">{{ formatCurrency(rabattBetrag) }}</div>
              </div>
            </div>

            <div class="summary-item summary-item-primary">
              <div class="summary-icon summary-icon-primary">
                <i class="pi pi-tag" aria-hidden="true"></i>
              </div>
              <div>
                <div class="summary-label">Gesamtpreis</div>
                <div class="summary-value summary-value-primary">
                  {{ formatCurrency(gesamtpreis) }}
                </div>
                <div class="summary-note summary-note-primary">(exkl. MWST)</div>
              </div>
            </div>

            <div class="summary-item">
              <div class="summary-icon summary-icon-purple">
                <i class="pi pi-chart-line" aria-hidden="true"></i>
              </div>
              <div>
                <div class="summary-label">Marge</div>
                <div class="summary-value">{{ margeProzent.toFixed(1) }} %</div>
                <div class="summary-note">{{ formatCurrency(margeBetrag) }}</div>
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
  color: #667085;
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
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

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  height: 2.35rem;
  padding: 0.38rem 0.8rem;
  border-radius: 0.42rem;
  line-height: 1.2;
  margin: 0;
}

.table .control-field {
  min-height: 2.35rem;
  padding-top: 0.36rem;
  padding-bottom: 0.36rem;
}

.table thead th {
  background-color: #fdfefe;
  color: #667085;
  font-weight: 500;
  border-bottom: 1px solid #e7ebf0;
  vertical-align: middle;
  font-size: var(--kt-font-size-sm);
  line-height: var(--kt-line-height-tight);
}

.table tbody td {
  background-color: #ffffff;
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

.empty-position-row .form-control {
  border-color: #e4e7ec;
  color: #667085;
}

.empty-position-row .form-control::placeholder {
  color: #a7b0bf;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 1rem;
  overflow: hidden;
  border: 1px solid #e1e6ef;
  border-radius: 0.45rem;
  background: #ffffff;
}

.summary-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.85rem;
  min-height: 5.75rem;
  padding: 1rem 1.25rem;
}

.summary-item + .summary-item {
  border-left: 1px solid #e7ebf0;
}

.summary-item-primary {
  background: #f5f8ff;
}

.summary-item-primary + .summary-item {
  border-left: 1px solid #e7ebf0;
}

.summary-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 0.36rem;
  font-size: 0.88rem;
}

.summary-icon-blue {
  background: #f4f7ff;
  color: #5f8cf2;
}

.summary-icon-green {
  background: #f1faf4;
  color: #57a86b;
}

.summary-icon-primary {
  background: #e8f0ff;
  color: #2563eb;
}

.summary-icon-purple {
  background: #f8f1ff;
  color: #a78bfa;
}

.summary-label {
  margin-bottom: 0.3rem;
  color: #111827;
  font-size: 0.96rem;
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
}

.summary-value {
  color: #111827;
  font-size: 1.14rem;
  font-weight: 600;
  line-height: var(--kt-line-height-tight);
}

.summary-note {
  margin-top: 0.3rem;
  color: #667085;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
}

.summary-item-primary .summary-label,
.summary-value-primary,
.summary-note-primary {
  color: #155eef;
}

.summary-value-primary {
  font-size: 1.24rem;
  font-weight: 700;
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

  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-item:nth-child(3) {
    border-left: 0;
    border-top: 1px solid #e7ebf0;
  }

  .summary-item:nth-child(4) {
    border-top: 1px solid #e7ebf0;
  }
}

@media (max-width: 575.98px) {
  .position-toolbar {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .action-button {
    width: 100%;
  }

  .toolbar-field {
    align-items: stretch;
    flex-direction: column;
    gap: 0.6rem;
  }

  .configuration-button {
    width: 100%;
    min-width: 0;
  }

  .summary-strip {
    grid-template-columns: 1fr;
  }

  .summary-item,
  .summary-item:nth-child(3),
  .summary-item:nth-child(4) {
    border-left: 0;
    border-top: 1px solid #e7ebf0;
  }

  .summary-item:first-child {
    border-top: 0;
  }
}
</style>
