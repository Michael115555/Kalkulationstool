# 🎨 DESIGN SYSTEM - Kalkulationstool

**Version:** 1.0.0  
**Datum:** 27.04.2026  
**Status:** Etabliert

---

## 📐 ÜBERSICHT

Das Kalkulationstool verwendet ein konsistentes, wartbares Design-System basierend auf CSS-Variablen und Spacing-Skalen. Alle Farben, Abstände, Typografie und Übergänge sind zentral definiert.

---

## 🎯 DESIGN TOKENS

### Inhalt
1. [Farben](#farben)
2. [Abstände (Spacing)](#abstände-spacing)
3. [Typografie](#typografie)
4. [Border Radius](#border-radius)
5. [Schatten](#schatten)
6. [Übergänge](#übergänge)

---

## 🎨 FARBEN

Alle Farben sind als CSS-Variablen in `frontend/src/scss/styles.scss` definiert. Diese werden in SCSS automatisch synchronisiert.

### Primäre Farben

```css
--kt-color-primary: #2563eb;           /* Hauptfarbe (Blau) */
--kt-color-primary-dark: #1d4ed8;      /* Hover/Active State */
--kt-color-primary-light: #3b82f6;     /* Alternative */
```

**Verwendung:**
- Buttons (speichern, hinzufügen)
- Links
- Aktive Elemente
- Focus-States

**Beispiel:**
```scss
.toolbar-save-button {
  background: var(--kt-color-primary);
  
  &:hover {
    background: var(--kt-color-primary-dark);
  }
}
```

---

### Text-Farben

```css
--kt-color-text-primary: #101828;      /* Haupttext (dunkelgrau) */
--kt-color-text-secondary: #475467;    /* Sekundärtext (mittelgrau) */
--kt-color-text-tertiary: #667085;     /* Tertiärtext (hellgrau) */
--kt-color-text-light: #98a2b3;        /* Deaktiviert/Placeholder */
```

**Verwendung:**
- Überschriften: `--kt-color-text-primary`
- Normale Texte: `--kt-color-text-primary` oder `--kt-color-text-secondary`
- Hilftexte/Labels: `--kt-color-text-tertiary`
- Deaktiviert: `--kt-color-text-light`

**Beispiel:**
```scss
.calculation-form-label {
  color: var(--kt-color-text-primary);
  font-weight: 500;
}

.configuration-empty-state-text {
  color: var(--kt-color-text-tertiary);
  font-weight: 500;
}
```

---

### Hintergrund-Farben

```css
--kt-color-bg-white: #ffffff;          /* Weiß (Basis) */
--kt-color-bg-light: #f8fafc;          /* Leicht grau (Alt-Zeilen, Inputs) */
--kt-color-bg-very-light: #eef4ff;     /* Sehr hell Blau (Highlights) */
```

**Verwendung:**
- Weiß: Basis-Hintergrund für Karten, Modal, Inputs
- Leicht grau: Alternating rows, readonly Felder
- Sehr hell Blau: Preisvergleich-Zeile, Highlight-Boxen

**Beispiel:**
```scss
.kalkulation-view .net-row {
  background-color: var(--kt-color-bg-very-light);
  border: 1px solid var(--kt-color-border);
}

.readonly-price {
  background-color: var(--kt-color-bg-light);
}
```

---

### Border/Divider-Farben

```css
--kt-color-border: #e4e7ec;           /* Standard Border */
--kt-color-border-light: #f0f1f3;     /* Leichte Divider */
```

**Verwendung:**
- Standard Borders: Table-Linien, Card-Borders, Divider
- Leichte Borders: Subtile Trennlinien

**Beispiel:**
```scss
.calculation-card {
  border: 1px solid var(--kt-color-border);
}

.configuration-variant-list {
  border-bottom: 1px solid var(--kt-color-border);
}
```

---

### Semantische Farben

```css
--kt-color-success: #10b981;           /* Erfolgreich (Grün) */
--kt-color-warning: #f59e0b;           /* Warnung (Orange) */
--kt-color-error: #ef4444;             /* Fehler (Rot) */
--kt-color-error-bg: #fee2e2;          /* Fehler Hintergrund */
```

**Verwendung:**
- Success: Validierung bestanden, Speichern erfolgreich
- Warning: Wichtige Hinweise
- Error: Validierungsfehler, Bestätigungsdialoge

**Beispiel:**
```scss
.configuration-panel-error {
  color: var(--kt-color-error);
}

.configuration-confirm-button.is-danger {
  background: var(--kt-color-error);
}
```

---

## 📏 ABSTÄNDE (SPACING)

Alle Abstände folgen einer definierten 8px-basierten Skala für Konsistenz und Rhythmus.

### Spacing Scale

```css
--kt-spacing-xs: 0.25rem;    /* 4px - Kleine Gaps */
--kt-spacing-sm: 0.42rem;    /* 6.7px - Button Padding */
--kt-spacing-md: 0.75rem;    /* 12px - Normale Gaps */
--kt-spacing-lg: 1rem;       /* 16px - Standard Padding */
--kt-spacing-xl: 1.25rem;    /* 20px - Große Gaps */
--kt-spacing-2xl: 1.5rem;    /* 24px - Sehr große Gaps */
--kt-spacing-3xl: 1.9rem;    /* 30px - Maximale Gaps */
```

### Verwendungsregeln

**XS (0.25rem):**
- Minimale Lücken zwischen Elementen
- Spacing innerhalb kompakter Komponenten

**SM (0.42rem):**
- Button Padding (oben/unten)
- Form-Control inneres Padding
- Enge Komponenten-Abstände

**MD (0.75rem):**
- Zwischen mehreren Form-Feldern
- Label zu Input Spacing

**LG (1rem):**
- Standard Padding für Cards
- Gap zwischen größeren Komponenten
- Default Padding für Sidebar/Panels

**XL (1.25rem):**
- Große Padding für Sections
- Gap zwischen Modulen

**2XL (1.5rem):**
- Abstände zwischen Hauptsektionen
- Vertikale Abstände für Screenspace

**3XL (1.9rem):**
- Größte Abstände (nur für major Sections)
- Typischerweise vertical

### Beispiele

```scss
// Toolbar Styling
.calculation-toolbar {
  gap: var(--kt-spacing-lg);  // 1rem zwischen Feldern
}

// Form Row
.calculation-form-row {
  padding: var(--kt-spacing-sm) var(--kt-spacing-xs);
  column-gap: var(--kt-spacing-lg);
}

// Config Section
.calculation-config-section {
  padding: var(--kt-spacing-xl) 0 var(--kt-spacing-3xl);
}

// Control Field (Input)
.control-field {
  padding-top: var(--kt-spacing-sm);
  padding-bottom: var(--kt-spacing-sm);
}
```

---

## ✍️ TYPOGRAFIE

Typography verwendet die Variablen aus `--kt-font-*` Definitionen:

```css
--kt-font-sans: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
--kt-font-size-sm: 0.94rem;    /* 15px - Kleine Texte */
--kt-font-size-md: 0.98rem;    /* 16px - Standard */
--kt-font-size-lg: 1.12rem;    /* 18px - Überschriften */
--kt-line-height-tight: 1.2;   /* Für Headings */
--kt-line-height-base: 1.45;   /* Für Body Text */
```

### Textklassen

```scss
// Überschrifts-Stilisierung
.calculation-form-label {
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
}

.configuration-offcanvas-title {
  font-size: var(--kt-font-size-lg);
  font-weight: 600;
  line-height: var(--kt-line-height-tight);
}

// Body Text
body {
  font-family: var(--kt-font-sans);
  font-size: var(--kt-font-size-md);
  line-height: var(--kt-line-height-base);
}
```

---

## 🔲 BORDER RADIUS

```css
--kt-border-radius-sm: 0.42rem;   /* 6.7px - Kleine Ecken */
--kt-border-radius-md: 0.5rem;    /* 8px - Standard */
--kt-border-radius-lg: 0.75rem;   /* 12px - Große Ecken */
```

**Verwendung:**
- `sm`: Buttons, Inputs, kleine Cards
- `md`: Modal, Dialoge (wenn nötig)
- `lg`: Große Container, Panels

**Beispiel:**
```scss
.toolbar-save-button {
  border-radius: var(--kt-border-radius-sm);
}

.calculation-card {
  border-radius: var(--kt-border-radius-sm);
}

.configuration-panel-input {
  border-radius: var(--kt-border-radius-sm);
}
```

---

## 🌫️ SCHATTEN

```css
--kt-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--kt-shadow-base: 0 1px 3px rgba(0, 0, 0, 0.1);
--kt-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
```

**Verwendung:**
- `sm`: Leichte Erhebung (optional)
- `base`: Standard Schatten für Modals
- `md`: Tiefe Schatten (Offcanvas)

**Beispiel:**
```scss
.configuration-offcanvas {
  box-shadow: var(--kt-shadow-md);
}
```

---

## ⏱️ ÜBERGÄNGE

```css
--kt-transition-fast: 0.15s ease;    /* Schnell (Hover) */
--kt-transition-base: 0.2s ease;     /* Standard */
--kt-transition-slow: 0.3s ease;     /* Langsam (Modals) */
```

**Verwendung:**
- `fast`: Buttons Hover, einfache Übergänge
- `base`: Icons, Farb-Übergänge
- `slow`: Modal Animations, größere Bewegungen

**Beispiel:**
```scss
.toolbar-save-button {
  transition:
    background-color var(--kt-transition-fast),
    border-color var(--kt-transition-fast),
    color var(--kt-transition-fast);
    
  &:hover {
    background: var(--kt-color-primary-dark);
  }
}

.position-add-button {
  transition: color var(--kt-transition-fast);
}
```

---

## 🔧 IMPLEMENTIERUNGSRICHTLINIEN

### 1. Verwende IMMER CSS-Variablen

❌ **Falsch:**
```scss
.button {
  color: #2563eb;
  padding: 0.42rem;
  border-radius: 0.42rem;
}
```

✅ **Richtig:**
```scss
.button {
  color: var(--kt-color-primary);
  padding: var(--kt-spacing-sm);
  border-radius: var(--kt-border-radius-sm);
}
```

### 2. Verwende die richtige Farbe für den Kontext

```scss
// Primärer Text
.label { color: var(--kt-color-text-primary); }

// Sekundärer Text
.hint { color: var(--kt-color-text-tertiary); }

// Deaktiviert
.disabled { color: var(--kt-color-text-light); }
```

### 3. Spacing-Konsistenz

```scss
// Äußere Abstände
padding: var(--kt-spacing-lg);

// Innere Abstände
gap: var(--kt-spacing-md);

// Kleine Abstände
margin-bottom: var(--kt-spacing-xs);
```

### 4. State-Übergänge

```scss
.interactive-element {
  transition: 
    background-color var(--kt-transition-fast),
    color var(--kt-transition-fast);
    
  &:hover { background: var(--kt-color-bg-light); }
  &:active { background: var(--kt-color-primary); }
}
```

---

## 🌙 THEME ANPASSUNG

Um das Theme zu ändern (z.B. Darkmode), passen Sie einfach die CSS-Variablen in `frontend/src/scss/styles.scss` an:

```scss
:root {
  /* Darkmode Beispiel */
  --kt-color-text-primary: #f8fafc;
  --kt-color-text-secondary: #cbd5e1;
  --kt-color-bg-white: #1e293b;
  --kt-color-bg-light: #334155;
  --kt-color-border: #475569;
}
```

---

## ✅ QUALITÄTS-CHECKLISTE

Vor jedem Commit überprüfen:

- [ ] Alle Farben nutzen `--kt-color-*` Variablen
- [ ] Alle Abstände nutzen `--kt-spacing-*` Variablen
- [ ] Border Radius nutzt `--kt-border-radius-*` Variablen
- [ ] Übergänge nutzen `--kt-transition-*` Variablen
- [ ] Keine hardcodierten Hex-Werte (#xxx) außer in Kommentaren
- [ ] Konsistente Font-Größen (nur sm, md, lg)
- [ ] Buttons und Links nutzen `--kt-color-primary`
- [ ] Text-Hierarchie ist erkennbar (bold für Headings)

---

## 📚 ZUSAMMENGEHÖRIGE DATEIEN

- `frontend/src/scss/styles.scss` - CSS-Variablen Definitionen
- `frontend/src/scss/kalkulation-view.scss` - Komponenten-Styling
- `frontend/src/components/**/*.vue` - Vue-Komponenten (verwenden SCSS-Klassen)

---

## 🚀 NÄCHSTE SCHRITTE

1. ✅ CSS-Variablen System etabliert
2. ✅ Design System dokumentiert
3. ⏳ TypeScript Migration (Phase 3)
4. ⏳ Component Library (Phase 4)
5. ⏳ Dark Mode Support (Phase 4)

---

**Letzte Aktualisierung:** 27.04.2026  
**Autor:** Kalkulationstool Team
