<script setup>
defineProps({
  kunden: {
    type: Array,
    required: true
  },
  kundeId: {
    type: [Number, String],
    default: null
  },
  projectName: {
    type: String,
    required: true
  },
  druckermodell: {
    type: String,
    required: true
  },
  druckermodelle: {
    type: Array,
    required: true
  },
  variante: {
    type: String,
    required: true
  },
  varianten: {
    type: Array,
    required: true
  },
  isCatalogLoading: {
    type: Boolean,
    required: true
  },
  canEditConfigurationSelection: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits([
  'update-project-name',
  'normalize-project-name',
  'select-kunde',
  'select-druckermodell',
  'update:variante'
])
</script>

<template>
  <div class="calculation-config-section">
    <div class="calculation-toolbar">

      <div class="toolbar-field toolbar-field-customer">
        <label for="kunde" class="toolbar-label">
          Kunde:
        </label>
        <select
          id="kunde"
          :value="kundeId ?? ''"
          class="form-select control-field toolbar-select"
          :disabled="!canEditConfigurationSelection"
          @change="emit('select-kunde', $event.target.value)"
        >
          <option value="">Kunde wählen</option>
          <option
            v-for="kunde in kunden"
            :key="kunde.id"
            :value="kunde.id"
          >
            {{ kunde.firmenname }}
          </option>
        </select>
      </div>

      <div class="toolbar-field toolbar-field-model">
        <label for="druckermodell" class="toolbar-label">
          Druckermodell:
        </label>
        <select
          id="druckermodell"
          :value="druckermodell"
          class="form-select control-field toolbar-select"
          :disabled="!canEditConfigurationSelection || !druckermodelle.length"
          @change="emit('select-druckermodell', $event.target.value)"
        >
          <option value="" disabled>Druckermodell wählen</option>
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
          Variante:
        </label>
        <select
          id="variante"
          :value="variante"
          class="form-select control-field toolbar-select"
          :disabled="!canEditConfigurationSelection || !varianten.length"
          @change="emit('update:variante', $event.target.value)"
        >
          <option value="" disabled>Variante wählen</option>
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
</template>
