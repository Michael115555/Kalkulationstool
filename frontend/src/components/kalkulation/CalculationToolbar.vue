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
  druckermarken: {
    type: Array,
    required: true
  },
  druckermarke: {
    type: String,
    required: true
  },
  druckermodelle: {
  type: Array,
  required: true
},
  druckermodell: {
    type: String,
    required: true
  },
  canSaveProject: {
    type: Boolean,
    required: true
  },
  canEditConfigurationSelection: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits([
  'select-kunde',
  'select-druckermarke',
  'select-druckermodell',
  'save-project'
])
</script>

<template>
  <div class="calculation-config-section">
    <div class="calculation-toolbar">
      <div class="toolbar-field toolbar-field-customer">
        <label for="calculation-kunde" class="toolbar-label">
          Kunde:
        </label>

        <select
          id="calculation-kunde"
          :value="kundeId ?? ''"
          class="form-select control-field toolbar-select"
          :disabled="false"
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

      <div class="toolbar-field toolbar-field-brand">
        <label for="calculation-druckermarke" class="toolbar-label">
          Druckermarke:
        </label>

        <select
          id="calculation-druckermarke"
          :value="druckermarke"
          class="form-select control-field toolbar-select"
          :disabled="!druckermarken.length"
          @change="emit('select-druckermarke', $event.target.value)"
        >
          <option value="">Druckermarke wählen</option>
          <option
            v-for="marke in druckermarken"
            :key="marke"
            :value="marke"
          >
            {{ marke }}
          </option>
        </select>
      </div>

      <div class="toolbar-field toolbar-field-model">
        <label for="calculation-druckermodell" class="toolbar-label">
          Druckermodell:
        </label>

        <select
          id="calculation-druckermodell"
          :value="druckermodell"
          class="form-select control-field toolbar-select"
          :disabled="!canEditConfigurationSelection || !druckermarke || !druckermodelle.length"
          @change="emit('select-druckermodell', $event.target.value)"
        >
          <option value="">Druckermodell wählen</option>
          <option
            v-for="modell in druckermodelle"
            :key="modell"
            :value="modell"
          >
            {{ modell }}
          </option>
        </select>
      </div>

      <div class="toolbar-field toolbar-field-save">
       <button
          type="button"
          class="btn btn-primary toolbar-save-button"
          :disabled="!canSaveProject"
          :title="canSaveProject ? 'Offerte speichern' : 'Bitte zuerst Kunde, Druckermarke, Druckermodell und Druckerposition wählen'"
          @click="emit('save-project')"
        >
          Offerte speichern
        </button>
      </div>
    </div>
  </div>
</template>