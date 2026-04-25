# Kalkulationstool

Sauberer Startzustand fuer die weitere Entwicklung mit getrenntem Frontend und Backend.

## Struktur

- `frontend/`: Vue 3 + Vite + PrimeVue
- `backend/`: Prisma + SQLite

## Frontend starten

```bash
cd frontend
npm install
npm run dev
```

## Backend starten

```bash
cd backend
npm install
npm run start
```

## Backend pruefen

```bash
cd backend
npm run prisma:validate
```

## Hinweise

- Das versehentlich doppelt angelegte Projekt unter `frontend/frontend/` wurde entfernt.
- Das Root-Verzeichnis enthaelt absichtlich keine eigene Node-App mehr.
- Die SQLite-Datenbank bleibt im Backend unter Prisma verankert.
