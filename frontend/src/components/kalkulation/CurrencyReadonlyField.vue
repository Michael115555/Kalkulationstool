<script setup>
import { computed } from 'vue'

const props = defineProps({
  amount: {
    type: [String, Number],
    required: true
  },
  formatAmount: {
    type: Function,
    required: true
  },
  ariaLabel: {
    type: String,
    required: true
  },
  inputClass: {
    type: [String, Array, Object],
    default: ''
  }
})

const formattedAmount = computed(() => props.formatAmount(props.amount))
</script>

<template>
  <div class="input-group currency-group">
    <span class="input-group-text">CHF</span>
    <input
      :value="formattedAmount"
      type="text"
      :class="['form-control amount-input readonly-price', inputClass]"
      readonly
      tabindex="-1"
      :aria-label="ariaLabel"
    />
  </div>
</template>
