-- CreateTable
CREATE TABLE "DruckerVariante" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "geschwindigkeit" INTEGER NOT NULL,
    "basispreis" INTEGER NOT NULL,
    "druckermodellId" INTEGER NOT NULL,
    CONSTRAINT "DruckerVariante_druckermodellId_fkey" FOREIGN KEY ("druckermodellId") REFERENCES "Druckermodell" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Offerte" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offertennummer" TEXT NOT NULL,
    "datum" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waehrung" TEXT NOT NULL DEFAULT 'CHF',
    "kundeId" INTEGER NOT NULL,
    "benutzerId" INTEGER NOT NULL,
    "druckermodellId" INTEGER,
    "druckerVarianteId" INTEGER,
    "total" INTEGER NOT NULL,
    CONSTRAINT "Offerte_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offerte_benutzerId_fkey" FOREIGN KEY ("benutzerId") REFERENCES "Benutzer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offerte_druckermodellId_fkey" FOREIGN KEY ("druckermodellId") REFERENCES "Druckermodell" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Offerte_druckerVarianteId_fkey" FOREIGN KEY ("druckerVarianteId") REFERENCES "DruckerVariante" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Offerte" ("benutzerId", "id", "kundeId", "offertennummer", "total", "waehrung") SELECT "benutzerId", "id", "kundeId", "offertennummer", "total", "waehrung" FROM "Offerte";
DROP TABLE "Offerte";
ALTER TABLE "new_Offerte" RENAME TO "Offerte";
CREATE TABLE "new_OffertePosition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titel" TEXT NOT NULL,
    "menge" INTEGER NOT NULL,
    "einzelpreis" INTEGER NOT NULL,
    "zeilentotal" INTEGER NOT NULL,
    "offerteId" INTEGER NOT NULL,
    "zubehoerId" INTEGER,
    CONSTRAINT "OffertePosition_offerteId_fkey" FOREIGN KEY ("offerteId") REFERENCES "Offerte" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OffertePosition_zubehoerId_fkey" FOREIGN KEY ("zubehoerId") REFERENCES "Zubehoer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OffertePosition" ("einzelpreis", "id", "menge", "offerteId", "titel", "zeilentotal") SELECT "einzelpreis", "id", "menge", "offerteId", "titel", "zeilentotal" FROM "OffertePosition";
DROP TABLE "OffertePosition";
ALTER TABLE "new_OffertePosition" RENAME TO "OffertePosition";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
