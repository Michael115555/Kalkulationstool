<template>
  <section class="stammdaten-view">
    <div class="col-12">
      <div class="card shadow-sm border-0">
        <div class="card-body customer-page-card-body">
          <div class="customer-toolbar">
            <h4 class="customers-heading mb-0">Kunden</h4>
          </div>

          <div v-if="isLoadingCustomers" class="alert alert-info mb-3">
            Kunden werden aus der Datenbank geladen...
          </div>
          <div v-if="customerError" class="alert alert-danger mb-3">
            {{ customerError }}
          </div>

          <div class="table-responsive customers-table-responsive">
            <table class="table align-middle mb-0 table-bordered customers-table">
              <thead>
                <tr>
                  <th scope="col">Kundenname</th>
                  <th scope="col">Ansprechperson</th>
                  <th scope="col">E Mail</th>
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
                  @click="rememberCustomerForCalculation(customer)"
                  @focusin="rememberCustomerForCalculation(customer)"
                >
                  <td>
                    <input
                      v-model="customer.name"
                      class="form-control control-field"
                      placeholder="Kundenname"
                      @input="scheduleCustomerAutoSave(customer)"
                    />
                  </td>
                  <td>
                    <input
                      v-model="customer.contactPerson"
                      class="form-control control-field"
                      placeholder="Ansprechperson"
                      @input="scheduleCustomerAutoSave(customer)"
                    />
                  </td>
                  <td>
                    <input
                      v-model="customer.email"
                      class="form-control control-field"
                      placeholder="E Mail"
                      type="email"
                      @input="scheduleCustomerAutoSave(customer)"
                    />
                  </td>
                  <td>
                    <input
                      v-model="customer.phone"
                      class="form-control control-field"
                      placeholder="Telefon"
                      @input="scheduleCustomerAutoSave(customer)"
                    />
                  </td>
                  <td>
                    <select
                      v-model="customer.salespersonId"
                      class="form-select control-field"
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
                      <button
                        type="button"
                        class="customer-row-button customer-delete-button"
                        aria-label="Kunde löschen"
                        :disabled="customer.isDeleting || (customers.length === 1 && customer.isNew)"
                        @click="deleteCustomer(customer)"
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
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createKalkulationApi } from '../services/kalkulationApi'
import {
  forgetSelectedCustomerId,
  rememberSelectedCustomerId
} from '../utils/selectedCustomer'

const api = createKalkulationApi()

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
const customerError = ref('')
const autoSaveTimers = new Map()
const AUTO_SAVE_DELAY = 550

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
  }
}

function clearCustomerAutoSave(customer) {
  window.clearTimeout(autoSaveTimers.get(customer.id))
  autoSaveTimers.delete(customer.id)
}

function scheduleCustomerAutoSave(customer) {
  clearCustomerAutoSave(customer)

  if (!customer.name.trim()) {
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

function applySavedCustomer(customer, savedCustomer, savedSnapshot) {
  const hasLocalChanges =
    JSON.stringify(createCustomerSnapshot(customer)) !== JSON.stringify(savedSnapshot)

  customer.persistedId = savedCustomer.id
  customer.isNew = false

  if (hasLocalChanges) {
    customer.original = createCustomerSnapshotFromApi(savedCustomer)
    return
  }

  customer.name = savedCustomer.firmenname ?? ''
  customer.contactPerson = savedCustomer.kontaktname ?? ''
  customer.email = savedCustomer.email ?? ''
  customer.phone = savedCustomer.telefon ?? ''
  customer.salespersonId = savedCustomer.verkaeuferId ?? ''
  customer.contactType = savedCustomer.kontaktart ?? ''
  customer.deliveryType = savedCustomer.versandart ?? ''
  customer.original = createCustomerSnapshot(customer)
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
    const savedSnapshot = createCustomerSnapshot(customer)
    const savedCustomer = customer.isNew
      ? await api.createKunde(createCustomerPayload(customer))
      : await api.updateKunde(customer.persistedId, createCustomerPayload(customer))
    applySavedCustomer(customer, savedCustomer, savedSnapshot)
    rememberSelectedCustomerId(savedCustomer.id)
  } catch (error) {
    customerError.value = `Kunde konnte nicht gespeichert werden: ${error.message}`
  } finally {
    customer.isSaving = false

    if (customer.hasPendingSave || isCustomerDirty(customer)) {
      scheduleCustomerAutoSave(customer)
    }
  }
}

async function deleteCustomer(customer) {
  clearCustomerAutoSave(customer)

  if (customer.isNew) {
    customers.value = customers.value.filter((entry) => entry.id !== customer.id)

    if (!customers.value.length) {
      customers.value.push(createDraftCustomer())
    }

    return
  }

  customer.isDeleting = true
  customerError.value = ''

  try {
    await api.deleteKunde(customer.persistedId)
    forgetSelectedCustomerId(customer.persistedId)
    customers.value = customers.value.filter((entry) => entry.id !== customer.id)

    if (!customers.value.length) {
      customers.value.push(createDraftCustomer())
    }
  } catch (error) {
    customerError.value = `Kunde konnte nicht gelöscht werden: ${error.message}`
  } finally {
    customer.isDeleting = false
  }
}

async function loadCustomers() {
  isLoadingCustomers.value = true
  customerError.value = ''

  try {
    const [loadedCustomers, loadedSalespeople] = await Promise.all([
      api.getKunden(),
      api.getVerkaeufer()
    ])

    customers.value = loadedCustomers.map(mapApiCustomer)
    salespeople.value = loadedSalespeople

    if (!customers.value.length) {
      customers.value.push(createDraftCustomer())
    }
  } catch (error) {
    customerError.value = `Kunden konnten nicht geladen werden: ${error.message}`
    customers.value = [createDraftCustomer()]
  } finally {
    isLoadingCustomers.value = false
  }
}

onMounted(loadCustomers)

onBeforeUnmount(() => {
  autoSaveTimers.forEach((timer) => window.clearTimeout(timer))
  autoSaveTimers.clear()
})
</script>

<style scoped>
.customer-page-card-body {
  padding: 0 1rem 1.5rem;
}

.customer-toolbar {
  min-height: 2.5rem;
  margin: 1.25rem 0 0.65rem;
}

.customers-heading {
  display: flex;
  align-items: center;
  min-height: 2.35rem;
  margin: 0;
  color: #101828;
  font-size: var(--kt-font-size-lg);
  font-weight: 600;
  letter-spacing: 0;
  line-height: 2.35rem;
}

.customers-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
}

.customers-table thead th {
  background-color: #fdfefe;
  border-bottom: 1px solid #e7ebf0;
  color: #101828;
  font-size: var(--kt-font-size-sm);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
  vertical-align: middle;
  white-space: nowrap;
}

.customers-table tbody td {
  background-color: #ffffff;
}

.customers-table th,
.customers-table td {
  padding: 0.32rem;
}

.customers-table th:nth-child(1) {
  width: 13%;
}

.customers-table th:nth-child(2) {
  width: 13%;
}

.customers-table th:nth-child(3) {
  width: 15%;
}

.customers-table th:nth-child(4) {
  width: 11%;
}

.customers-table th:nth-child(5) {
  width: 15%;
}

.customers-table th:nth-child(6) {
  width: 12%;
}

.customers-table th:nth-child(7) {
  width: 18%;
}

.customers-table .action-header {
  width: 3%;
  font-size: 0;
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
  padding-right: 1.9rem;
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
  padding: 0.78rem 1.45rem;
  border-top: 0;
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
  border-top: 1px dashed #a9bef8;
}

.customer-add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
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
  color: #1d4ed8;
}

.customer-add-button:focus-visible {
  border-radius: 0.2rem;
  outline: 2px solid #bfdbfe;
  outline-offset: 0.2rem;
}

@media (max-width: 1199.98px) {
  .customer-page-card-body {
    padding-right: 1rem;
    padding-left: 1rem;
  }
}
</style>
