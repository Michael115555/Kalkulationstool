<template>
  <section class="stammdaten-view">
    <div class="col-12">
      <div class="card shadow-sm border-0">
        <div class="card-body customer-page-card-body">
          <div class="customer-toolbar">
            <h4 class="customers-heading mb-0">Kunden</h4>
          </div>

          <div v-if="isLoadingCustomers && !hasLoadedCustomers" class="alert alert-info mb-3">
            Kunden werden aus der Datenbank geladen...
          </div>
          <div v-if="customerError" class="alert alert-danger mb-3">
            {{ customerError }}
          </div>

          <div v-if="hasLoadedCustomers || customers.length" class="table-responsive customers-table-responsive">
            <table class="table align-middle mb-0 table-bordered customers-table">
              <thead>
                <tr>
                  <th scope="col">Kundenname</th>
                  <th scope="col">Ansprechperson</th>
                  <th scope="col">E-Mail</th>
                  <th scope="col">Telefon</th>
                  <th scope="col">Verkäufer</th>
                  <th scope="col">Kontaktart</th>
                  <th scope="col">Versandart</th>
                  <th scope="col" class="text-center action-header">Aktion</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="customer in customers"
                  :key="customer.id"
                  :class="{ 'customer-active-row': isActiveCustomer(customer) }"
                  @click="rememberCustomerForCalculation(customer)"
                  @focusin="rememberCustomerForCalculation(customer)"
                >
                  <td>
                    <input
                      v-model="customer.name"
                      class="form-control control-field"
                      placeholder="Kundenname"
                      aria-label="Kundenname"
                      @input="scheduleCustomerAutoSave(customer)"
                    />
                  </td>
                  <td>
                    <input
                      v-model="customer.contactPerson"
                      class="form-control control-field"
                      placeholder="Ansprechperson"
                      aria-label="Ansprechperson"
                      @input="scheduleCustomerAutoSave(customer)"
                    />
                  </td>
                  <td>
                    <input
                      v-model="customer.email"
                      class="form-control control-field"
                      placeholder="E-Mail"
                      type="text"
                      aria-label="E-Mail"
                      @input="scheduleCustomerAutoSave(customer)"
                    />
                  </td>
                  <td>
                    <input
                      v-model="customer.phone"
                      class="form-control control-field"
                      placeholder="Telefon"
                      aria-label="Telefon"
                      @input="scheduleCustomerAutoSave(customer)"
                    />
                  </td>
                  <td>
                    <select
                      v-model="customer.salespersonId"
                      class="form-select control-field"
                      aria-label="Verkäufer"
                      @change="scheduleCustomerAutoSave(customer)"
                    >
                      <option value="">Verkäufer wählen</option>
                      <option
                        v-for="salesperson in salespeople"
                        :key="salesperson.id"
                        :value="salesperson.id"
                      >
                        {{ salesperson.name }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <select
                      v-model="customer.contactType"
                      class="form-select control-field"
                      aria-label="Kontaktart"
                      @change="scheduleCustomerAutoSave(customer)"
                    >
                      <option value="">Kontaktart wählen</option>
                      <option
                        v-for="contactType in contactTypes"
                        :key="contactType"
                        :value="contactType"
                      >
                        {{ contactType }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <select
                      v-model="customer.deliveryType"
                      class="form-select control-field"
                      aria-label="Versandart"
                      @change="scheduleCustomerAutoSave(customer)"
                    >
                      <option value="">Versandart wählen</option>
                      <option
                        v-for="deliveryType in deliveryTypes"
                        :key="deliveryType"
                        :value="deliveryType"
                      >
                        {{ deliveryType }}
                      </option>
                    </select>
                  </td>
                  <td class="text-center align-middle">
                    <div class="customer-action-buttons">
                      <span
                        v-if="!customer.isSaving && !canSaveCustomer(customer)"
                        class="customer-save-state is-saved"
                        :title="getCustomerSaveButtonTitle(customer)"
                        aria-label="Kunde gespeichert"
                      >
                        <i class="pi pi-check" aria-hidden="true"></i>
                      </span>

                      <button
                        v-else
                        type="button"
                        :class="['customer-row-button', 'customer-save-button', getCustomerSaveButtonClass(customer)]"
                        :aria-label="getCustomerSaveButtonTitle(customer)"
                        :title="getCustomerSaveButtonTitle(customer)"
                        :disabled="customer.isSaving || !canSaveCustomer(customer)"
                        @click.stop="saveCustomerNow(customer)"
                      >
                        <i :class="getCustomerSaveIconClass(customer)" aria-hidden="true"></i>
                      </button>

                      <button
                        type="button"
                        class="customer-row-button customer-delete-button"
                        aria-label="Kunde löschen"
                        :disabled="customer.isDeleting || (customers.length === 1 && customer.isNew)"
                        @click.stop="askDeleteCustomer(customer)"
                      >
                        <i class="pi pi-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr class="customer-add-table-row">
                  <td colspan="8">
                    <div class="customer-add-content">
                      <button
                        type="button"
                        class="customer-add-button"
                        aria-label="Kunde hinzufügen"
                        @click="addCustomer"
                      >
                        <i class="pi pi-plus" aria-hidden="true"></i>
                        <span>Kunde hinzufügen</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="customerToDelete"
      class="confirm-delete-backdrop"
      @click.self="cancelDeleteCustomer"
    >
      <div
        class="confirm-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Kunde löschen?"
      >
        <div class="confirm-delete-content">
          <h5 class="confirm-delete-title">
            Kunde löschen?
          </h5>

          <p class="confirm-delete-text">
            Möchtest du „{{ customerToDelete.name || 'Ohne Kundennamen' }}“ wirklich löschen?
          </p>
        </div>

        <div class="confirm-delete-actions">
          <button
            type="button"
            class="confirm-delete-button confirm-delete-button-secondary"
            :disabled="isDeletingCustomer"
            @click="cancelDeleteCustomer"
          >
            Abbrechen
          </button>

          <button
            type="button"
            class="confirm-delete-button confirm-delete-button-danger"
            :disabled="isDeletingCustomer"
            @click="confirmDeleteCustomer"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createKalkulationApi } from '../services/kalkulationApi'
import {
  forgetSelectedCustomerId,
  getRememberedSelectedCustomerId,
  rememberSelectedCustomerId
} from '../utils/selectedCustomer'

const api = createKalkulationApi()
const LOADING_INDICATOR_DELAY = 140

const contactTypes = [
  'Telefon',
  'Besuch',
  'Showroom',
  'E-Mail'
]

const deliveryTypes = [
  'Post',
  'per Mail',
  'persönlich überbracht',
  'per Mail zurück an Verkäufer'
]

const customers = ref([])
const salespeople = ref([])
const isLoadingCustomers = ref(false)
const hasLoadedCustomers = ref(false)
const customerError = ref('')
const customerToDelete = ref(null)
const isDeletingCustomer = ref(false)
const activeCustomerId = ref(getRememberedSelectedCustomerId())
let loadingIndicatorTimer = null
const autoSaveTimers = new Map()
const AUTO_SAVE_DELAY = 550
let isCustomerViewMounted = false

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createDraftCustomer() {
  return {
    id: createId(),
    persistedId: null,
    isNew: true,
    isSaving: false,
    hasPendingSave: false,
    isDeleting: false,
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    salespersonId: '',
    contactType: '',
    deliveryType: '',
    original: null
  }
}

function mapApiCustomer(customer) {
  const mappedCustomer = {
    id: customer.id,
    persistedId: customer.id,
    isNew: false,
    isSaving: false,
    hasPendingSave: false,
    isDeleting: false,
    name: customer.firmenname ?? '',
    contactPerson: customer.kontaktname ?? '',
    email: customer.email ?? '',
    phone: customer.telefon ?? '',
    salespersonId: customer.verkaeuferId ?? '',
    contactType: customer.kontaktart ?? '',
    deliveryType: customer.versandart ?? ''
  }

  mappedCustomer.original = createCustomerSnapshot(mappedCustomer)

  return mappedCustomer
}

function createCustomerSnapshot(customer) {
  return {
    name: customer.name.trim(),
    contactPerson: customer.contactPerson.trim(),
    email: customer.email.trim(),
    phone: customer.phone.trim(),
    salespersonId: customer.salespersonId || '',
    contactType: customer.contactType || '',
    deliveryType: customer.deliveryType || ''
  }
}

function createCustomerInputSnapshot(customer) {
  return {
    name: customer.name,
    contactPerson: customer.contactPerson,
    email: customer.email,
    phone: customer.phone,
    salespersonId: customer.salespersonId || '',
    contactType: customer.contactType || '',
    deliveryType: customer.deliveryType || ''
  }
}

function createCustomerPayload(customer) {
  return {
    firmenname: customer.name.trim(),
    kontaktname: customer.contactPerson.trim() || null,
    email: customer.email.trim() || null,
    telefon: customer.phone.trim() || null,
    kontaktart: customer.contactType || null,
    versandart: customer.deliveryType || null,
    verkaeuferId: customer.salespersonId || null
  }
}

function isCustomerDirty(customer) {
  if (customer.isNew) {
    return true
  }

  return JSON.stringify(createCustomerSnapshot(customer)) !== JSON.stringify(customer.original)
}

function canSaveCustomer(customer) {
  return Boolean(customer.name.trim() && isCustomerDirty(customer))
}

function addCustomer() {
  customers.value.push(createDraftCustomer())
}

function rememberCustomerForCalculation(customer) {
  if (customer.persistedId) {
    rememberSelectedCustomerId(customer.persistedId)
    activeCustomerId.value = Number(customer.persistedId)
  }
}

function isActiveCustomer(customer) {
  return Boolean(
    customer.persistedId &&
      activeCustomerId.value &&
      Number(customer.persistedId) === Number(activeCustomerId.value)
  )
}

function getCustomerSaveButtonTitle(customer) {
  if (customer.isSaving) {
    return 'Kunde wird gespeichert'
  }

  if (customer.isNew && !customer.name.trim()) {
    return 'Kundenname eingeben, um zu speichern'
  }

  if (customer.hasPendingSave || isCustomerDirty(customer)) {
    return 'Kunde speichern'
  }

  return 'Kunde gespeichert'
}

function getCustomerSaveButtonClass(customer) {
  if (customer.isSaving) {
    return 'is-saving'
  }

  if (customer.hasPendingSave || (isCustomerDirty(customer) && customer.name.trim())) {
    return 'is-dirty'
  }

  return 'is-saved'
}

function getCustomerSaveIconClass(customer) {
  if (customer.isSaving) {
    return ['pi', 'pi-spinner', 'pi-spin']
  }

  if (customer.hasPendingSave || (isCustomerDirty(customer) && customer.name.trim())) {
    return ['pi', 'pi-save']
  }

  return ['pi', 'pi-check']
}

function clearCustomerAutoSave(customer) {
  window.clearTimeout(autoSaveTimers.get(customer.id))
  autoSaveTimers.delete(customer.id)
}

function scheduleCustomerAutoSave(customer) {
  clearCustomerAutoSave(customer)

  if (!isCustomerViewMounted || !customer.name.trim()) {
    return
  }

  autoSaveTimers.set(
    customer.id,
    window.setTimeout(() => {
      autoSaveTimers.delete(customer.id)
      saveCustomer(customer)
    }, AUTO_SAVE_DELAY)
  )
}

function queueFollowUpCustomerSave(customer) {
  if (!customer.hasPendingSave && !isCustomerDirty(customer)) {
    return
  }

  if (isCustomerViewMounted) {
    scheduleCustomerAutoSave(customer)
    return
  }

  if (customer.hasPendingSave) {
    customer.hasPendingSave = false
    saveCustomer(customer)
  }
}

function saveCustomerNow(customer) {
  clearCustomerAutoSave(customer)
  saveCustomer(customer)
}

function createCustomerSnapshotFromApi(customer) {
  return {
    name: (customer.firmenname ?? '').trim(),
    contactPerson: (customer.kontaktname ?? '').trim(),
    email: (customer.email ?? '').trim(),
    phone: (customer.telefon ?? '').trim(),
    salespersonId: customer.verkaeuferId || '',
    contactType: customer.kontaktart || '',
    deliveryType: customer.versandart || ''
  }
}

function createCustomerInputSnapshotFromApi(customer) {
  return {
    name: customer.firmenname ?? '',
    contactPerson: customer.kontaktname ?? '',
    email: customer.email ?? '',
    phone: customer.telefon ?? '',
    salespersonId: customer.verkaeuferId ?? '',
    contactType: customer.kontaktart ?? '',
    deliveryType: customer.versandart ?? ''
  }
}

function applySavedCustomer(customer, savedCustomer, savedInputSnapshot) {
  const hasLocalInputChanges =
    JSON.stringify(createCustomerInputSnapshot(customer)) !== JSON.stringify(savedInputSnapshot)
  const savedApiInputSnapshot = createCustomerInputSnapshotFromApi(savedCustomer)
  const serverNormalizedInput =
    JSON.stringify(savedApiInputSnapshot) !== JSON.stringify(savedInputSnapshot)

  customer.persistedId = savedCustomer.id
  customer.isNew = false
  customer.original = createCustomerSnapshotFromApi(savedCustomer)

  if (hasLocalInputChanges || serverNormalizedInput) {
    return
  }

  customer.name = savedCustomer.firmenname ?? ''
  customer.contactPerson = savedCustomer.kontaktname ?? ''
  customer.email = savedCustomer.email ?? ''
  customer.phone = savedCustomer.telefon ?? ''
  customer.salespersonId = savedCustomer.verkaeuferId ?? ''
  customer.contactType = savedCustomer.kontaktart ?? ''
  customer.deliveryType = savedCustomer.versandart ?? ''
}

async function saveCustomer(customer) {
  if (!canSaveCustomer(customer)) {
    return
  }

  if (customer.isSaving) {
    customer.hasPendingSave = true
    return
  }

  customer.isSaving = true
  customer.hasPendingSave = false
  customerError.value = ''

  try {
    const savedInputSnapshot = createCustomerInputSnapshot(customer)
    const savedCustomer = customer.isNew
      ? await api.createKunde(createCustomerPayload(customer))
      : await api.updateKunde(customer.persistedId, createCustomerPayload(customer))

    applySavedCustomer(customer, savedCustomer, savedInputSnapshot)
    rememberSelectedCustomerId(savedCustomer.id)
    activeCustomerId.value = Number(savedCustomer.id)
  } catch (error) {
    customerError.value = `Kunde konnte nicht gespeichert werden: ${error.message}`
  } finally {
    customer.isSaving = false
    queueFollowUpCustomerSave(customer)
  }
}

function askDeleteCustomer(customer) {
  clearCustomerAutoSave(customer)
  customerToDelete.value = customer
}

function cancelDeleteCustomer() {
  if (isDeletingCustomer.value) {
    return
  }

  customerToDelete.value = null
}

async function confirmDeleteCustomer() {
  if (!customerToDelete.value || isDeletingCustomer.value) {
    return
  }

  const customer = customerToDelete.value

  if (customer.isNew) {
    removeDraftCustomer(customer)
    customerToDelete.value = null
    return
  }

  customer.isDeleting = true
  isDeletingCustomer.value = true
  customerError.value = ''

  try {
    await api.deleteKunde(customer.persistedId)
    forgetSelectedCustomerId(customer.persistedId)
    if (Number(activeCustomerId.value) === Number(customer.persistedId)) {
      activeCustomerId.value = null
    }
    customers.value = customers.value.filter((entry) => entry.id !== customer.id)

    if (!customers.value.length) {
      customers.value.push(createDraftCustomer())
    }

    customerToDelete.value = null
  } catch (error) {
    customerError.value = `Kunde konnte nicht gelöscht werden: ${error.message}`
  } finally {
    customer.isDeleting = false
    isDeletingCustomer.value = false
  }
}

function removeDraftCustomer(customer) {
  customers.value = customers.value.filter((entry) => entry.id !== customer.id)

  if (!customers.value.length) {
    customers.value.push(createDraftCustomer())
  }
}

async function loadCustomers() {
  window.clearTimeout(loadingIndicatorTimer)
  loadingIndicatorTimer = window.setTimeout(() => {
    if (!hasLoadedCustomers.value) {
      isLoadingCustomers.value = true
    }
  }, LOADING_INDICATOR_DELAY)
  customerError.value = ''

  try {
    const [loadedCustomers, loadedSalespeople] = await Promise.all([
      api.getKunden(),
      api.getVerkaeufer()
    ])

    customers.value = loadedCustomers.map(mapApiCustomer)
    salespeople.value = loadedSalespeople
    hasLoadedCustomers.value = true

    if (!customers.value.length) {
      customers.value.push(createDraftCustomer())
    }
  } catch (error) {
    customerError.value = `Kunden konnten nicht geladen werden: ${error.message}`
    customers.value = [createDraftCustomer()]
    hasLoadedCustomers.value = true
  } finally {
    window.clearTimeout(loadingIndicatorTimer)
    isLoadingCustomers.value = false
  }
}

function hydrateCustomersFromCache() {
  const cachedData = api.getCachedRouteData('stammdaten')

  if (!cachedData) {
    return false
  }

  customers.value = cachedData.kunden.map(mapApiCustomer)
  salespeople.value = cachedData.verkaeufer
  hasLoadedCustomers.value = true
  isLoadingCustomers.value = false
  customerError.value = ''

  if (!customers.value.length) {
    customers.value.push(createDraftCustomer())
  }

  return true
}

const hasHydratedCustomers = hydrateCustomersFromCache()

onMounted(() => {
  isCustomerViewMounted = true

  if (!hasHydratedCustomers) {
    loadCustomers()
  }
})

onBeforeUnmount(() => {
  isCustomerViewMounted = false

  window.clearTimeout(loadingIndicatorTimer)
  autoSaveTimers.forEach((timer) => window.clearTimeout(timer))
  autoSaveTimers.clear()

  customers.value
    .filter((customer) => canSaveCustomer(customer))
    .forEach((customer) => {
      saveCustomer(customer)
    })
})
</script>

<style scoped>
.customer-page-card-body {
  padding: 0 1rem 1.5rem;
}

.customer-toolbar {
  min-height: 2.5rem;
  margin: 1.25rem 0 0.75rem;
}

.customers-heading {
  display: flex;
  align-items: center;
  min-height: 2.35rem;
  margin: 0;
  color: var(--kt-color-text-primary);
  font-size: var(--kt-font-size-lg);
  font-weight: 600;
  letter-spacing: 0;
  line-height: 2.35rem;
}

.customers-table-responsive {
  border: 1px solid #e4e7ec;
  border-radius: var(--kt-border-radius-sm);
  overflow-x: auto;
}

.customers-table {
  width: 100%;
  min-width: 0;
  margin-bottom: 0;
  border-style: hidden;
  table-layout: fixed;
}

.customers-table thead th {
  background-color: #fbfcfe;
  border-bottom: 1px solid #e9edf3;
  color: var(--kt-color-text-primary);
  font-size: var(--kt-font-size-sm);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
  vertical-align: middle;
  white-space: nowrap;
}

.customers-table tbody td {
  background-color: #ffffff;
  border-color: #e7ebf0;
}

.customers-table.table-bordered > :not(caption) > * > * {
  border-color: #e7ebf0;
}

.customers-table tbody tr.customer-active-row td {
  background-color: #fbfdff;
}

.customers-table th,
.customers-table td {
  min-width: 0;
  padding: 0.32rem;
  vertical-align: middle;
}

.customers-table th:nth-child(1),
.customers-table td:nth-child(1) {
  width: 13.5%;
}

.customers-table th:nth-child(2),
.customers-table td:nth-child(2) {
  width: 13.5%;
}

.customers-table th:nth-child(3),
.customers-table td:nth-child(3) {
  width: 17%;
}

.customers-table th:nth-child(4),
.customers-table td:nth-child(4) {
  width: 12%;
}

.customers-table th:nth-child(5),
.customers-table td:nth-child(5) {
  width: 12%;
}

.customers-table th:nth-child(6),
.customers-table td:nth-child(6) {
  width: 12%;
}

.customers-table th:nth-child(7),
.customers-table td:nth-child(7) {
  width: 12%;
}

.customers-table th:nth-child(8),
.customers-table td:nth-child(8) {
  width: 7%;
  min-width: 5rem;
  max-width: 5.4rem;
  text-align: center;
}

.customers-table input,
.customers-table select {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.control-field {
  min-height: 2.35rem;
  min-width: 0;
  padding-top: 0.36rem;
  padding-right: 0.7rem;
  padding-bottom: 0.36rem;
  padding-left: 0.7rem;
  font-size: var(--kt-font-size-md);
  line-height: 1.2;
}

.customers-table .form-select.control-field {
  overflow: hidden;
  padding-right: 2rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-action-buttons {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.customer-row-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  background: transparent;
  transition: color 0.15s ease;
}

.customer-delete-button {
  color: #c9a0a0;
}

.customer-save-button {
  color: #667085;
}

.customer-save-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: #98a2b3;
  font-size: 1rem;
}

.customer-save-button.is-dirty,
.customer-save-button.is-saving {
  color: #2563eb;
}

.customer-save-button:disabled {
  opacity: 1;
}

.customer-save-button:hover:not(:disabled),
.customer-save-button:focus-visible:not(:disabled) {
  color: #1d4ed8;
}

.customer-delete-button:hover:not(:disabled),
.customer-delete-button:focus-visible:not(:disabled) {
  color: #dc2626;
}

.customer-row-button:focus-visible {
  border-radius: 0.2rem;
  outline-offset: 0.2rem;
}

.customer-delete-button:focus-visible {
  outline: 2px solid #fecaca;
}

.customer-row-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.customer-row-button .pi {
  font-size: 1rem;
}

.customer-add-table-row td {
  padding: 0.68rem 1.45rem;
  border-top: 1px solid #eef1f6;
  background: #fbfcfe;
}

.customer-add-content {
  display: flex;
  align-items: center;
  gap: 1.35rem;
  width: 100%;
}

.customer-add-content::before,
.customer-add-content::after {
  content: '';
  flex: 1 1 0;
  max-width: 38rem;
  border-top: 1px solid #dbe5ff;
  opacity: 0.85;
}

.customer-add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2.25rem;
  padding: 0 0.55rem;
  border: 0;
  border-radius: 0.25rem;
  background: transparent;
  color: var(--kt-color-primary);
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
  white-space: nowrap;
}

.customer-add-button .pi {
  font-size: 1rem;
}

.customer-add-button:hover,
.customer-add-button:focus-visible {
  background: var(--kt-color-bg-very-light);
  color: var(--kt-color-primary-dark);
}

.customer-add-button:focus-visible {
  border-radius: 0.2rem;
  outline: 2px solid #bfdbfe;
  outline-offset: 0.2rem;
}

.confirm-delete-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(16, 24, 40, 0.46);
  backdrop-filter: blur(0.15rem);
}

.confirm-delete-dialog {
  display: grid;
  gap: 1rem;
  width: min(31rem, 100%);
  padding: 1.25rem;
  border: 1px solid #e4e7ec;
  border-radius: 0.42rem;
  background: #ffffff;
  box-shadow: 0 1.5rem 4rem rgba(16, 24, 40, 0.24);
}

.confirm-delete-content {
  min-width: 0;
}

.confirm-delete-title {
  margin: 0 0 0.3rem;
  color: var(--kt-color-text-primary);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
}

.confirm-delete-text {
  margin: 0;
  color: #667085;
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: 1.4;
}

.confirm-delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 0.3rem;
}

.confirm-delete-button {
  min-height: 2.55rem;
  padding: 0.45rem 1rem;
  border-radius: 0.42rem;
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: 1.2;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.confirm-delete-button-secondary {
  border: 1px solid #d0d5dd;
  background: #ffffff;
  color: #344054;
}

.confirm-delete-button-secondary:hover:not(:disabled),
.confirm-delete-button-secondary:focus-visible:not(:disabled) {
  background: #f8fafc;
  border-color: #98a2b3;
}

.confirm-delete-button-danger {
  border: 1px solid #dc2626;
  background: #dc2626;
  color: #ffffff;
}

.confirm-delete-button-danger:hover:not(:disabled),
.confirm-delete-button-danger:focus-visible:not(:disabled) {
  border-color: #b91c1c;
  background: #b91c1c;
}

.confirm-delete-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 1199.98px) {
  .customer-page-card-body {
    padding-right: 1rem;
    padding-left: 1rem;
  }
}
</style>
