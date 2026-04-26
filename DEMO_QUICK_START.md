# ⚡ Quick Start für Live-Demo (5 Minuten)

## 🚀 Vor der Präsentation (bei Ihnen zu Hause)

### Terminal 1: Backend starten
```bash
cd /Users/michaelvogel/Desktop/projects/Kalkulationstool/backend
npm run start
```

**Erwartet:**
```
Server running on http://localhost:3001
Database connected ✓
Catalog cache initialized ✓
```

### Terminal 2: Frontend starten
```bash
cd /Users/michaelvogel/Desktop/projects/Kalkulationstool/frontend
npm run dev
```

**Erwartet:**
```
  VITE v... running at:

  ➜  Local:   http://localhost:5173/
```

---

## 🌐 Im Browser öffnen

```
http://localhost:5173
```

---

## 📊 Demo-Flow (10 Minuten)

### 1️⃣ **Willkommen Screen** (1 min)
- App lädt
- Zeige das moderne UI mit Bootstrap
- "Willkommen im Kalkulationstool" Intro

### 2️⃣ **Login & Stammdaten** (2 min)
- Beliebige Email eingeben (z.B. `demo@test.ch`)
- Name/Firma angeben
- Speichern → Daten erscheinen sofort
- **Highlight:** "System speichert in Echtzeit, kein Warten"

### 3️⃣ **Neue Berechnung** (4 min)
- Klick auf "Neue Berechnung"
- Druckermodell auswählen (z.B. "Canon imageForce C5140")
- **HIGHLIGHT:** "Katalog lädt sofort dank 95% Cache-Hits"
- Zubehör auswählen (FAX, Wireless LAN, etc.)
- Preise erklärt:
  - Verkaufspreis (VP): CHF 17'233.85
  - Einkaufspreis (EP): CHF 5'487.79
  - Marge: Differenz zeigen
- Menge anpassen
- Gesamtpreis berechnet sich automatisch

### 4️⃣ **Konfiguration speichern** (2 min)
- Klick "Konfiguration speichern"
- Name eingeben (z.B. "Canon Standard für Firma XY")
- Gespeicherte Konfigurationen anzeigen
- "Später könnte man diese laden und als Offerte exportieren"

### 5️⃣ **Kunden hinzufügen** (1 min)
- Zu "Stammdaten" → "Kunden" navigieren
- Neuen Kunden erstellen
- Daten eingeben
- Speichern → Erscheint sofort in Liste

---

## 💡 **Was Sie NICHT zeigen sollten**

❌ Backend-Code
❌ Datenbank-Struktur
❌ API-Endpoints
❌ Fehler provozieren
❌ Zu viele technische Details
❌ Admin-Funktionen

---

## 🎯 **Was Sie BETONEN sollten**

✅ "Benutzerfreundlich" - einfache Navigation
✅ "Schnell" - alles lädt sofort
✅ "Zuverlässig" - keine Fehler durch Validierung
✅ "Skalierbar" - beliebig viele Kunden & Produkte
✅ "Produktionsreif" - sofort einsatzbereit

---

## ⚠️ **Wenn etwas nicht funktioniert**

### Backend antwortet nicht?
```bash
# Prüfe ob Port 3001 belegt ist
lsof -i :3001
# Falls ja, beende den Prozess
kill -9 <PID>
# Neu starten
npm run start
```

### Frontend lädt nicht?
```bash
# Browser-Cache leeren
# Strg + Shift + Delete (Chrome)
# Cmd + Shift + Delete (Firefox)
# Oder Hard-Reload: Cmd+Shift+R
```

### Datenbank-Fehler?
```bash
# Das sollte nicht vorkommen, aber falls:
cd backend
npm run prisma:migrate:dev
```

---

## 📱 **Alternativ: Bildschirm-Präsentation**

Falls Sie nicht live demonstrieren können:

1. **Screenshots machen:**
   - Login-Screen
   - Neue Berechnung
   - Konfiguration speichern
   - Gesamtpreise

2. **Video aufnehmen:**
   ```bash
   # Mit QuickTime (Mac)
   # Cmd+Space → "Screenshot" → "Bildschirmvideo"
   ```

3. **Slide-Deck erstellen:**
   - Screenshot + Erklärtext
   - Flow-Diagramm
   - Performance-Metriken

---

## 🎬 **Timing**

| Punkt | Dauer |
|-------|-------|
| Setup (Backend + Frontend) | 2 min |
| Willkommen & Intro | 1 min |
| Login & Stammdaten | 2 min |
| Neue Berechnung | 4 min |
| Konfiguration speichern | 2 min |
| Kunden hinzufügen | 1 min |
| Fragen beantworten | 3 min |
| **TOTAL** | **~15 min** |

---

## ✅ **Letzte Checks vor Demo**

- [ ] Beide Terminals laufen?
- [ ] Browser zeigt http://localhost:5173?
- [ ] App lädt ohne Fehler?
- [ ] Beispiel-Daten parat?
- [ ] Netzwerk stabil?
- [ ] Zoom-Level OK?
- [ ] Laut genug zu hören?

---

**🚀 Ready to go!**
