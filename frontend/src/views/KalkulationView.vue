<script setup>
import { computed, ref } from 'vue'

const naechsteId = ref(4)
const druckermodell = ref('Canon 6155')
const variante = ref('45 Seiten/Min.')

const druckermodelle = ['Canon 6155', 'Canon 6160', 'Canon 7170']
const varianten = ['45 Seiten/Min.', '55 Seiten/Min.', '65 Seiten/Min.']

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

const gesamtsumme = computed(() =>
  positions.value.reduce(
    (summe, position) => summe + getGesamtpreis(position),
    0
  )
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
          <div class="row g-3 align-items-center mb-4 pb-4 border-bottom">
            <div class="col-12 col-xl-6">
              <div class="row g-2 align-items-center">
                <label for="druckermodell" class="col-sm-4 col-form-label text-secondary">
                  Druckermodell:
                </label>
                <div class="col-sm-8">
                  <select
                    id="druckermodell"
                    v-model="druckermodell"
                    class="form-select form-select-lg control-field"
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
              </div>
            </div>

            <div class="col-12 col-xl-6">
              <div class="row g-2 align-items-center">
                <label for="variante" class="col-sm-4 col-form-label text-secondary">
                  Variante:
                </label>
                <div class="col-sm-8">
                  <select
                    id="variante"
                    v-model="variante"
                    class="form-select form-select-lg control-field"
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
              </div>
            </div>
          </div>

          <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
            <div>
              <h4 class="positions-heading mb-1">Positionen</h4>
            </div>
            <button type="button" class="btn btn-primary" @click="addPosition">
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
                <tr v-for="position in positions" :key="position.id">
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
                      class="pi pi-trash text-danger"
                      role="button"
                      tabindex="0"
                      aria-label="Position loeschen"
                      @click="removePosition(position.id)"
                    ></i>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colspan="4" class="text-end">Gesamtsumme</th>
                  <th class="text-end">{{ formatCurrency(gesamtsumme) }}</th>
                  <th></th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.positions-heading {
  color: #101828;
  font-size: var(--kt-font-size-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: var(--kt-line-height-tight);
}

.control-field {
  min-height: 3rem;
  font-size: var(--kt-font-size-md);
}

.table thead th {
  background-color: #f8fafc;
  color: #475467;
  font-weight: 500;
  border-bottom: 1px solid #e4e7ec;
  vertical-align: middle;
  font-size: var(--kt-font-size-sm);
  line-height: var(--kt-line-height-tight);
}
</style>
