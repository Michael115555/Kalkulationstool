# ✅ Kalkulationsanzeige - Saubere Anpassung

## 📝 Durchgeführte Änderungen

### 1. **useKalkulation.js** ✅
- ✅ `verkaufspreis` computed bereits vorhanden
- ✅ `einkaufspreis` computed bereits vorhanden
- ✅ Beide Werte sind im return-Statement exportiert

### 2. **KalkulationView.vue** ✅
- ✅ `einkaufspreis` zum Destructuring hinzugefügt
- ✅ Prop wird korrekt an CalculationPanel übergeben

### 3. **CalculationPanel.vue** ✅
- ✅ `einkaufspreis` Prop in defineProps konfiguriert
- ✅ HTML-Struktur korrigiert (ungeschlossene Tags behoben)
- ✅ Kompakte Zeile mit Label "Einkaufspreis / Verkaufspreis"
- ✅ Zwei CHF-Input-Felder nebeneinander
- ✅ Beide Felder readonly und rechtsbündig
- ✅ Styling-Klasse `price-comparison-row` zugewiesen

### 4. **kalkulation-view.scss** ✅
- ✅ `.price-comparison-row` hinzugefügt
  - Grid-Spalten: `minmax(12rem, 1.2fr) minmax(10rem, 0.8fr) minmax(16rem, 1fr)`
- ✅ `.price-comparison-row .currency-group` hinzugefügt
  - `justify-self: end` für Rechtsbündigkeit
  - `max-width: 18rem` für kompakte Breite
- ✅ `.price-comparison-row .amount-input` hinzugefügt
  - `text-align: right` für rechtsbündige Beträge

---

## 🎯 **Erwartete Anzeige**

### Vorher ❌
```
Einkaufspreis/Verkaufspreis
[-------CHF 0.00-------]
                    [--------CHF 17'233.85--------]
```

### Nachher ✅
```
Einkaufspreis / Verkaufspreis  [CHF  5'487.79] [CHF 17'233.85]
```

- Kompakte Einzeiler-Ansicht
- Label links
- Zwei CHF-Felder rechts
- Beide Beträge rechtsbündig
- Maximale Breite: 18rem pro Feld

---

## 🔍 **Test-Checklist**

Bei Canon imageForce C5140 Variante C5140:

```
✅ Einkaufspreis angezeigt: CHF 5'487.79
✅ Verkaufspreis angezeigt: CHF 17'233.85
✅ Beide Felder readonly (nicht editierbar)
✅ Beträge rechtsbündig formatiert
✅ Felder kompakt, max 18rem breit
✅ Label links, Felder rechts
✅ Keine Überbreite
✅ Responsive auf kleineren Bildschirmen
```

---

## 📦 **Dateien geändert**

1. `frontend/src/views/KalkulationView.vue`
   - Zeile ~47: `einkaufspreis` zum Destructuring hinzugefügt

2. `frontend/src/components/kalkulation/CalculationPanel.vue`
   - Zeile ~21-24: `einkaufspreis` Prop definiert
   - Zeile ~93-114: HTML-Struktur für Preisvergleichszeile

3. `frontend/src/scss/kalkulation-view.scss`
   - Zeile ~863-872: Neue CSS-Regeln für `price-comparison-row`

---

## ✨ **Status**

| Punkt | Status |
|-------|--------|
| Einkaufspreis durchgereicht | ✅ |
| Verkaufspreis angezeigt | ✅ |
| HTML-Struktur korrigiert | ✅ |
| CSS Styling komplett | ✅ |
| Keine Fehler | ✅ |
| Bereit für Production | ✅ |

---

*Letzte Aktualisierung: 26.04.2026*
