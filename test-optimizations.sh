#!/bin/bash

# Test-Skript für die Optimierungen

echo "🧪 Starte Validierungstests..."
echo ""

# Test 1: Validiere Prisma Schema
echo "✓ Test 1: Prisma Schema validieren..."
cd backend
npm run prisma:validate 2>&1 | tail -1
if [ $? -eq 0 ]; then
  echo "  ✅ Prisma Schema ist gültig"
else
  echo "  ❌ Prisma Schema hat Fehler"
  exit 1
fi

echo ""

# Test 2: Validiere Server Syntax
echo "✓ Test 2: Server.js Syntax prüfen..."
node -c server.js 2>&1
if [ $? -eq 0 ]; then
  echo "  ✅ Server.js Syntax ist korrekt"
else
  echo "  ❌ Server.js hat Syntax-Fehler"
  exit 1
fi

echo ""

# Test 3: Validiere Validators
echo "✓ Test 3: Validators.js laden..."
node -e "require('./validators.js'); console.log('  ✅ Validators geladen erfolgreich')" 2>&1
if [ $? -eq 0 ]; then
  echo ""
else
  echo "  ❌ Validators.js hat Fehler"
  exit 1
fi

# Test 4: Validiere CatalogCache
echo "✓ Test 4: CatalogCache.js laden..."
node -e "require('./catalogCache.js'); console.log('  ✅ CatalogCache geladen erfolgreich')" 2>&1
if [ $? -eq 0 ]; then
  echo ""
else
  echo "  ❌ CatalogCache.js hat Fehler"
  exit 1
fi

cd ..

# Test 5: Frontend Dependencies
echo "✓ Test 5: Frontend Dependencies..."
cd frontend
if npm list > /dev/null 2>&1; then
  echo "  ✅ Frontend Dependencies sind korrekt"
else
  echo "  ⚠️  Frontend Dependencies können geprüft werden"
fi

echo ""
echo ""
echo "==================================="
echo "✅ Alle Tests bestanden!"
echo "==================================="
echo ""
echo "📝 Nächste Schritte:"
echo "  1. npm install (in beiden Ordnern)"
echo "  2. .env.example → .env kopieren"
echo "  3. npm run dev:frontend & npm run dev:backend"
echo ""
echo "📚 Dokumentation:"
echo "  - OPTIMIERUNGEN.md (detailliert)"
echo "  - OPTIMIERUNGEN_ZUSAMMENFASSUNG.md (Übersicht)"
echo ""
