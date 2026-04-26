# 📖 Integrations-Anleitung für neue Composables

## Übersicht

Phase 2 hat die monolithe `useKalkulation.js` (1223 Zeilen) in 4 spezialisierte Composables aufgesplittet:

- ✅ `useCatalog.js` - Katalog-Management
- ✅ `usePositions.js` - Position-Management
- ✅ `useConfigurations.js` - Konfigurationen
- ✅ `useCustomers.js` - Kunden-Management

---

## 1️⃣ useCatalog - Katalog-Management

### Zweck
Lädt und cached Katalog-Daten (Druckermodelle, Zubehör, Lieferoptionen, etc.)

### API

```javascript
import { useCatalog } from '@/composables/useCatalog'

const {
  // State
  isCatalogLoading,      // boolean - Laden im Progress
  catalogError,          // string - Fehlermeldung
  katalog,               // object - Komplette Katalog-Daten

  // Computed
  druckermodelle,        // string[] - Liste aller Modellnamen
  lieferungOptionen,     // object[] - Lieferoptionen
  mietansaetze,          // object - Miet-Tarife
  mietoptionen,          // number[] - Miet-Optionen (Monate)

  // Methods
  loadCatalog,           // async () -> Katalog laden
  getDruckermodellByName,    // (name) -> object
  getDruckermodellById,      // (id) -> object
  getVarianteByName,         // (modellName, variantenName) -> object
  getDefaultVarianteName     // (modellName) -> string
} = useCatalog()

// Verwendung
await loadCatalog()
const modell = getDruckermodellByName('HP LaserJet Pro')
const variante = getVarianteByName('HP LaserJet Pro', 'M404n')
```

### Features
- **Automatisches Caching** - 5 Minuten Cache-Dauer
- **Error Handling** - Aussagekräftige Fehlermeldungen
- **Lazy Loading** - Katalog wird bei Bedarf geladen

---

## 2️⃣ usePositions - Position-Management

### Zweck
Managed Positionen in Kalkulationen (Geräte, Zubehör, Services, etc.)

### API

```javascript
import { usePositions } from '@/composables/usePositions'

const {
  // State
  positions,               // object[] - Array von Positionen

  // Methods
  addPosition,             // () -> Neue Position hinzufügen
  removePosition,          // (id) -> Position löschen
  updatePositionZubehoer,  // (id, kategorie) -> Kategorie setzen
  updatePositionProdukt,   // (id, zubehoer) -> Produkt setzen
  
  // Utilities
  isEmptyPosition,         // (position) -> boolean
  getProdukteByZubehoer,   // (kategorieName) -> object[]
  normalizeQuantity,       // (value) -> number
  normalizePrice,          // (value) -> string
  getEinkaufspreis,        // (position) -> number
  getGesamtpreis           // (position) -> number
} = usePositions(katalog)

// Verwendung
addPosition()
removePosition(1)
updatePositionProdukt(1, { id: 5, bezeichnung: 'HP Toner', vp: 45.50 })
const gesamt = getGesamtpreis(position)
```

### Position Object Structure

```javascript
{
  id: number,
  kategorie: string,              // z.B. "Toner", "Papier"
  zubehoer: number | null,        // Zubehör ID
  titel: string,                  // Bezeichnung
  menge: number,                  // Mindestens 1
  verkaufsPreis: string,          // Als String für Float-Precision
  einkaufsPreis: string | null    // Optional
}
```

### Features
- **Automatische Validierung** - Quantity & Price werden normalisiert
- **Intelligente Updates** - updatePositionProdukt setzt automatisch Titel & Preise
- **Berechnung** - Gesamtpreis & Einkaufspreis automatisch berechnet

---

## 3️⃣ useConfigurations - Konfigurationen-Management

### Zweck
Speichert und managed Druck-Konfigurationen (Snapshots)

### API

```javascript
import { useConfigurations } from '@/composables/useConfigurations'

const {
  // State
  activeConfigurationVariantId,       // number | null
  configurationVariants,              // object[] - Alle Configs
  isRenameConfigurationPanelVisible,  // boolean
  editingConfigurationVariantName,    // string
  isDeleteConfigurationConfirmationVisible, // boolean

  // Computed
  hasActiveConfigurationVariant,      // boolean
  filteredConfigurationVariants,      // object[] - Sortiert
  activeConfigurationVariant,         // object | null
  activeConfigurationName,            // string
  deleteConfigurationConfirmationText, // string
  isEditingConfigurationNameDuplicate, // boolean
  canSaveConfigurationVariantName,    // boolean

  // Methods
  loadConfigurations,                 // async () -> Laden
  saveConfigurationVariant,           // async (variant) -> Speichern
  selectConfigurationVariant,         // (id) -> Select
  startNewConfiguration,              // (template?) -> Neue erstellen
  renameConfigurationVariant,         // () -> Rename-Panel öffnen
  commitConfigurationVariantRename,   // async () -> Speichern
  cancelConfigurationVariantRename,   // () -> Abbrechen
  deleteConfigurationVariant,         // async () -> Löschen
  duplicateConfigurationVariant,      // () -> Kopieren
  
  // UI Methods
  cancelDeleteConfigurationVariant,   // () -> Dialog schließen
  confirmDeleteConfigurationVariant,  // () -> Dialog öffnen
  
  // Utilities
  getConfigurationMeta                // (variant) -> { druckermodell, variante, kundeId }
} = useConfigurations()

// Verwendung
await loadConfigurations()
startNewConfiguration()
selectConfigurationVariant(5)
await saveConfigurationVariant(activeConfigurationVariant.value)
```

### Configuration Object Structure

```javascript
{
  id: number,                    // -1 für neue, -2 für Kopien
  name: string,                  // Konfigurationsname
  kundeId: number | null,        // Kunde (optional)
  druckermodellId: number,       // Pflicht
  druckerVarianteId: number | null,
  total: number,                 // Gesamtpreis
  calculation: object,           // Snapshot der Berechnung
  aktualisiertAm: string,        // ISO DateTime
  isHidden: boolean             // Intern
}
```

### Features
- **Auto-Save** - Speichert mit 2s Verzögerung
- **Duplikate-Check** - Warnt vor doppelten Namen
- **Optimistische Updates** - UI updated sofort
- **ID-Management** - Neue Configs (id=-1) werden beim Speichern neu-nummeriert

---

## 4️⃣ useCustomers - Kunden-Management

### Zweck
Centralisiertes Kunden-Management mit CRUD-Operationen

### API

```javascript
import { useCustomers } from '@/composables/useCustomers'

const {
  // State
  kunden,                  // object[] - Alle Kunden
  verkaeufer,              // object[] - Alle Verkäufer

  // Computed
  selectedKunde,           // object | null - Ausgewählter Kunde

  // Methods
  loadCustomers,           // async () -> Laden
  setSelectedKundeId,      // (id) -> Select
  getSelectedKundeId,      // () -> number | null
  addCustomer,             // async (data) -> Erstellen
  updateCustomer,          // async (id, data) -> Aktualisieren
  deleteCustomer           // async (id) -> Löschen
} = useCustomers()

// Verwendung
await loadCustomers()
setSelectedKundeId(5)
const kunde = selectedKunde.value

const newKunde = await addCustomer({
  firmenname: 'Neue AG',
  email: 'contact@neue.ch',
  verkaeuferId: 1
})

await updateCustomer(5, { firmenname: 'Updated AG' })
await deleteCustomer(5)
```

### Kunde Object Structure

```javascript
{
  id: number,
  firmenname: string,         // Pflicht
  kontaktname: string | null,
  email: string | null,       // Validiert
  telefon: string | null,
  ort: string | null,
  kontaktart: string | null,  // z.B. "Telefon", "E-Mail"
  versandart: string | null,  // z.B. "Post", "per Mail"
  verkaeuferId: number | null,
  verkaeufer: object | null,  // { id, vorname, nachname, email }
  erstelltAm: string,
  aktualisiertAm: string
}
```

### Features
- **Automatische Synchronisation** - Lokale Liste wird aktualisiert
- **Fehlerbehandlung** - Sprechende Fehlermeldungen
- **Verkäufer-Verknüpfung** - Automatisches Laden der Verkäufer

---

## 📝 Migration von useKalkulation

Wenn Sie noch alte Code-Stellen mit der großen `useKalkulation` haben:

### Vorher (Alt)
```javascript
import { useKalkulation } from '@/composables/useKalkulation'

const {
  katalog,
  positions,
  configurationVariants,
  kunden,
  // ... 20+ weitere Props
} = useKalkulation()
```

### Nachher (Neu)
```javascript
import { useCatalog } from '@/composables/useCatalog'
import { usePositions } from '@/composables/usePositions'
import { useConfigurations } from '@/composables/useConfigurations'
import { useCustomers } from '@/composables/useCustomers'

const { katalog, loadCatalog } = useCatalog()
const { positions, addPosition, removePosition } = usePositions(katalog)
const { configurationVariants, selectConfigurationVariant } = useConfigurations()
const { kunden, loadCustomers } = useCustomers()

// Beim Mount laden:
onMounted(async () => {
  await loadCatalog()
  await loadCustomers()
  await loadConfigurations()
})
```

---

## 🎯 Best Practices

### 1. Caching respektieren
```javascript
// ✅ GUT: Katalog wird gecacht
const { katalog, loadCatalog } = useCatalog()
await loadCatalog() // Zweites Mal schneller

// ❌ FALSCH: API wird direkt abgefragt
const data = await api.getKatalog()
```

### 2. Fehlerbehandlung
```javascript
// ✅ GUT: Error ist im State
try {
  await loadCustomers()
  if (catalogError.value) {
    console.error('Fehler:', catalogError.value)
  }
} catch (error) {
  // Handle error
}
```

### 3. Auto-Save nutzen
```javascript
// ✅ GUT: Speichert automatisch nach 2s
activeConfigurationVariant.value.name = 'Neue Beschreibung'
// Kein saveConfigurationVariant() nötig - speichert automatisch

// ❌ FALSCH: Manuell speichern nach jedem Input
@input="(e) => { updateField(e); saveConfiguration() }"
```

### 4. Computed Properties verwenden
```javascript
// ✅ GUT: Automatisch reaktiv
const { activeConfigurationVariant } = useConfigurations()
return activeConfigurationVariant.value?.name

// ❌ FALSCH: State nicht reaktiv
const name = activeConfigurationVariant.name
return name // Updates nicht automatisch
```

---

## 🔄 Lifecycle Best Practices

```javascript
import { onMounted } from 'vue'

export default {
  setup() {
    const { katalog, loadCatalog } = useCatalog()
    const { configurationVariants, loadConfigurations } = useConfigurations()
    const { kunden, loadCustomers } = useCustomers()

    onMounted(async () => {
      // Paralleles Laden für Performance
      await Promise.all([
        loadCatalog(),
        loadCustomers(),
        loadConfigurations()
      ])
    })

    return { katalog, configurationVariants, kunden }
  }
}
```

---

## 🧪 Testing

```javascript
// Composables sind einfach zu testen:
import { useCatalog } from '@/composables/useCatalog'

describe('useCatalog', () => {
  it('should load catalog', async () => {
    const { katalog, loadCatalog } = useCatalog()
    await loadCatalog()
    expect(katalog.value.druckermodelle.length).toBeGreaterThan(0)
  })

  it('should cache catalog', async () => {
    const { loadCatalog, isCatalogLoading } = useCatalog()
    await loadCatalog()
    const loading1 = isCatalogLoading.value

    await loadCatalog() // Second load
    expect(isCatalogLoading.value).toBe(false) // From cache
  })
})
```

---

## 📊 Performance Monitoring

```javascript
// Monitore Cache-Hits
const { getCatalogCache } = require('./catalogCache.js')

const cache = getCatalogCache()
if (cache) {
  console.log('✅ Cache HIT')
} else {
  console.log('❌ Cache MISS - Loading from DB')
}
```

---

**Fragen? Siehe `OPTIMIERUNGEN.md` für weitere Details! 🚀**
