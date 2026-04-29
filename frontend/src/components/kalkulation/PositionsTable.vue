<script setup>
const props = defineProps({
  positions: {
    type: Array,
    required: true
  },
  zubehoerKategorien: {
    type: Array,
    required: true
  },
  canEditPositions: {
    type: Boolean,
    required: true
  },
  isExotischesModell: {
    type: Boolean,
    default: false
  },
  isEmptyPosition: {
    type: Function,
    required: true
  },
  updatePositionZubehoer: {
    type: Function,
    required: true
  },
  updatePositionProdukt: {
    type: Function,
    required: true
  },
  getProdukteByZubehoer: {
    type: Function,
    required: true
  },
  normalizeQuantity: {
    type: Function,
    required: true
  },
  normalizePrice: {
    type: Function,
    required: true
  },
  formatAmount: {
    type: Function,
    required: true
  },
  getEinkaufspreis: {
    type: Function,
    required: true
  },
  getGesamtpreis: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['add-position', 'remove-position'])

const isDruckerPosition = (position) =>
  position.istDrucker || position.zubehoer === 'Drucker'

const isRequiredDruckerPosition = (position, index) =>
  index === 0 && isDruckerPosition(position)

const getKategoriePlaceholder = () =>
  props.canEditPositions ? 'Kategorie wählen' : 'Bitte zuerst Druckermodell wählen'

const getBezeichnungPlaceholder = (position) => {
  if (!props.canEditPositions) {
    return 'Bitte zuerst Druckermodell wählen'
  }

  if (!position.zubehoer) {
    return 'Bitte zuerst Kategorie wählen'
  }

  if (props.isExotischesModell) {
    return position.zubehoer === 'Drucker'
      ? 'Druckerbezeichnung eingeben'
      : 'Bezeichnung eingeben'
  }

  return 'Bezeichnung wählen'
}

const isBezeichnungLocked = (position) =>
  !props.canEditPositions || !position.zubehoer

const normalizeManualEinkaufspreis = (position) => {
  position.einkaufsPreis = props.formatAmount(position.einkaufsPreis)
}
</script>

<template>
  <div class="position-toolbar">
    <h4 class="positions-heading mb-0">Positionen</h4>
  </div>

  <div class="table-responsive">
    <table class="table align-middle mb-0 table-bordered positions-table">
      <thead>
        <tr>
          <th scope="col">Kategorie</th>
          <th scope="col">Bezeichnung</th>
          <th scope="col" class="text-end">Menge</th>
          <th scope="col" class="text-end price-header">VP (CHF)</th>
          <th scope="col" class="text-end price-header">EP (CHF)</th>
          <th scope="col" class="text-end total-header">Total (CHF)</th>
          <th scope="col" class="text-center">Aktion</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(position, index) in positions"
          :key="position.id"
          :class="{ 'empty-position-row': isEmptyPosition(position) }"
        >
          <td>
            <input
              v-if="isRequiredDruckerPosition(position, index)"
              type="text"
              class="form-control control-field required-position-field"
              value="Drucker"
              readonly
              tabindex="-1"
              aria-label="Drucker Pflichtposition"
            />

            <select
              v-else
              v-model="position.zubehoer"
              class="form-select control-field"
              :class="{ 'pending-selection-field': !canEditPositions }"
              :title="position.zubehoer || getKategoriePlaceholder()"
              :aria-label="`Kategorie Position ${index + 1}`"
              :disabled="!canEditPositions"
              @change="updatePositionZubehoer(position)"
            >
              <option value="">{{ getKategoriePlaceholder() }}</option>
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
              v-if="isExotischesModell"
              v-model="position.bezeichnung"
              type="text"
              class="form-control control-field"
              :placeholder="getBezeichnungPlaceholder(position)"
              :title="position.bezeichnung"
              :disabled="!canEditPositions"
              aria-label="Bezeichnung"
            />

            <select
              v-else
              v-model="position.bezeichnung"
              class="form-select control-field"
              :class="{ 'pending-selection-field': isBezeichnungLocked(position) }"
              :title="position.bezeichnung || getBezeichnungPlaceholder(position)"
              :aria-label="`Bezeichnung Position ${index + 1}`"
              :disabled="isBezeichnungLocked(position)"
              @change="updatePositionProdukt(position)"
            >
              <option value="" disabled>{{ getBezeichnungPlaceholder(position) }}</option>
              <option
                v-for="produkt in getProdukteByZubehoer(position.zubehoer)"
                :key="produkt.id ?? produkt.bezeichnung"
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
              :aria-label="`Menge Position ${index + 1}`"
              :disabled="!canEditPositions"
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
              :aria-label="`Verkaufspreis Position ${index + 1}`"
              :disabled="!canEditPositions"
              @blur="normalizePrice(position)"
            />
          </td>

          <td>
            <input
              v-if="isExotischesModell"
              v-model="position.einkaufsPreis"
              type="text"
              inputmode="decimal"
              class="form-control control-field text-end"
              placeholder="0.00"
              :disabled="!canEditPositions"
              aria-label="Einkaufspreis"
              @blur="normalizeManualEinkaufspreis(position)"
            />

            <input
              v-else
              :value="formatAmount(getEinkaufspreis(position))"
              type="text"
              class="form-control control-field text-end readonly-price"
              readonly
              tabindex="-1"
              aria-label="Einkaufspreis"
            />
          </td>

          <td>
            <input
              :value="formatAmount(getGesamtpreis(position))"
              type="text"
              class="form-control control-field text-end readonly-price"
              readonly
              tabindex="-1"
              aria-label="Positionstotal"
            />
          </td>

          <td class="text-center align-middle">
            <span
              v-if="isRequiredDruckerPosition(position, index)"
              class="position-required-spacer"
              aria-hidden="true"
            ></span>

            <button
              v-else
              type="button"
              class="delete-icon"
              aria-label="Position löschen"
              @click="emit('remove-position', position.id)"
            >
              <i class="pi pi-trash" aria-hidden="true"></i>
            </button>
          </td>
        </tr>

        <tr class="position-add-table-row">
          <td colspan="7">
            <div class="position-add-content">
              <button
                type="button"
                class="position-add-button"
                aria-label="Position hinzufügen"
                :disabled="!canEditPositions"
                @click="emit('add-position')"
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
</template>
