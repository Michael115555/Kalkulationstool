/*
  Warnings:

  - You are about to drop the column `basispreis` on the `DruckerVariante` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `DruckerVariante` table. All the data in the column will be lost.
  - You are about to drop the column `datum` on the `Offerte` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Offerte` table. All the data in the column will be lost.
  - You are about to drop the column `einzelpreis` on the `OffertePosition` table. All the data in the column will be lost.
  - You are about to drop the column `zeilentotal` on the `OffertePosition` table. All the data in the column will be lost.
  - You are about to drop the column `preis` on the `Zubehoer` table. All the data in the column will be lost.
  - Added the required column `aktualisiertAm` to the `Benutzer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aktualisiertAm` to the `DruckerVariante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bezeichnung` to the `DruckerVariante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vpPreis` to the `DruckerVariante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aktualisiertAm` to the `Druckermodell` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aktualisiertAm` to the `Hersteller` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aktualisiertAm` to the `Kunde` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aktualisiertAm` to the `Offerte` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titel` to the `Offerte` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typ` to the `OffertePosition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aktualisiertAm` to the `Zubehoer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vpPreis` to the `Zubehoer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "MietLaufzeit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "monate" INTEGER NOT NULL,
    "mietansatz" INTEGER NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EpFaktorKategorie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "EpFaktorGruppe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "EpFaktorWert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gruppeId" INTEGER NOT NULL,
    "kategorieId" INTEGER NOT NULL,
    "faktor" REAL NOT NULL,
    CONSTRAINT "EpFaktorWert_gruppeId_fkey" FOREIGN KEY ("gruppeId") REFERENCES "EpFaktorGruppe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EpFaktorWert_kategorieId_fkey" FOREIGN KEY ("kategorieId") REFERENCES "EpFaktorKategorie" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VrgTarif" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vonPreis" REAL NOT NULL,
    "bisPreis" REAL NOT NULL,
    "gebuehrRappen" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "KonditionDefinition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "einheit" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "KonditionGruppe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "KonditionPreis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gruppeId" INTEGER NOT NULL,
    "definitionId" INTEGER NOT NULL,
    "betrag" INTEGER,
    "text" TEXT,
    CONSTRAINT "KonditionPreis_gruppeId_fkey" FOREIGN KEY ("gruppeId") REFERENCES "KonditionGruppe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "KonditionPreis_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "KonditionDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Benutzer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vorname" TEXT NOT NULL,
    "nachname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rolle" TEXT NOT NULL DEFAULT 'VERKAUF',
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL
);
INSERT INTO "new_Benutzer" ("aktiv", "email", "id", "nachname", "rolle", "vorname") SELECT "aktiv", "email", "id", "nachname", "rolle", "vorname" FROM "Benutzer";
DROP TABLE "Benutzer";
ALTER TABLE "new_Benutzer" RENAME TO "Benutzer";
CREATE UNIQUE INDEX "Benutzer_email_key" ON "Benutzer"("email");
CREATE TABLE "new_DruckerVariante" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "druckermodellId" INTEGER NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "geschwindigkeit" INTEGER NOT NULL,
    "vpPreis" INTEGER NOT NULL,
    "epPreisRappen" INTEGER,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL,
    CONSTRAINT "DruckerVariante_druckermodellId_fkey" FOREIGN KEY ("druckermodellId") REFERENCES "Druckermodell" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DruckerVariante" ("druckermodellId", "geschwindigkeit", "id") SELECT "druckermodellId", "geschwindigkeit", "id" FROM "DruckerVariante";
DROP TABLE "DruckerVariante";
ALTER TABLE "new_DruckerVariante" RENAME TO "DruckerVariante";
CREATE UNIQUE INDEX "DruckerVariante_druckermodellId_bezeichnung_key" ON "DruckerVariante"("druckermodellId", "bezeichnung");
CREATE TABLE "new_Druckermodell" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "artikelnummer" TEXT,
    "herstellerId" INTEGER NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL,
    CONSTRAINT "Druckermodell_herstellerId_fkey" FOREIGN KEY ("herstellerId") REFERENCES "Hersteller" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Druckermodell" ("artikelnummer", "herstellerId", "id", "name") SELECT "artikelnummer", "herstellerId", "id", "name" FROM "Druckermodell";
DROP TABLE "Druckermodell";
ALTER TABLE "new_Druckermodell" RENAME TO "Druckermodell";
CREATE UNIQUE INDEX "Druckermodell_herstellerId_name_key" ON "Druckermodell"("herstellerId", "name");
CREATE TABLE "new_Hersteller" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL
);
INSERT INTO "new_Hersteller" ("id", "name") SELECT "id", "name" FROM "Hersteller";
DROP TABLE "Hersteller";
ALTER TABLE "new_Hersteller" RENAME TO "Hersteller";
CREATE UNIQUE INDEX "Hersteller_name_key" ON "Hersteller"("name");
CREATE TABLE "new_Kunde" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firmenname" TEXT NOT NULL,
    "kontaktname" TEXT,
    "email" TEXT,
    "telefon" TEXT,
    "ort" TEXT,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL
);
INSERT INTO "new_Kunde" ("email", "firmenname", "id", "kontaktname", "ort", "telefon") SELECT "email", "firmenname", "id", "kontaktname", "ort", "telefon" FROM "Kunde";
DROP TABLE "Kunde";
ALTER TABLE "new_Kunde" RENAME TO "Kunde";
CREATE TABLE "new_Offerte" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offertennummer" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "termin" DATETIME,
    "waehrung" TEXT NOT NULL DEFAULT 'CHF',
    "kundeId" INTEGER NOT NULL,
    "benutzerId" INTEGER NOT NULL,
    "druckermodellId" INTEGER,
    "druckerVarianteId" INTEGER,
    "kundenkontakt" TEXT,
    "versand" TEXT,
    "eintauschrabattProzent" INTEGER NOT NULL DEFAULT 0,
    "restwertMonate" INTEGER NOT NULL DEFAULT 0,
    "restwertBetrag" INTEGER NOT NULL DEFAULT 0,
    "mietMonate" INTEGER,
    "miete48Monat" INTEGER,
    "miete60Monat" INTEGER,
    "servicePauschaleMonat" INTEGER,
    "inklusiveKopienSW" INTEGER,
    "preisZusatzPrintSWRappen" INTEGER,
    "scanpauschaleText" TEXT,
    "flatrateText" TEXT,
    "totalVP" INTEGER NOT NULL DEFAULT 0,
    "totalEPRappen" INTEGER DEFAULT 0,
    "nettopreis" INTEGER NOT NULL DEFAULT 0,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL,
    CONSTRAINT "Offerte_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offerte_benutzerId_fkey" FOREIGN KEY ("benutzerId") REFERENCES "Benutzer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offerte_druckermodellId_fkey" FOREIGN KEY ("druckermodellId") REFERENCES "Druckermodell" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Offerte_druckerVarianteId_fkey" FOREIGN KEY ("druckerVarianteId") REFERENCES "DruckerVariante" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Offerte" ("benutzerId", "druckerVarianteId", "druckermodellId", "id", "kundeId", "offertennummer", "waehrung") SELECT "benutzerId", "druckerVarianteId", "druckermodellId", "id", "kundeId", "offertennummer", "waehrung" FROM "Offerte";
DROP TABLE "Offerte";
ALTER TABLE "new_Offerte" RENAME TO "Offerte";
CREATE UNIQUE INDEX "Offerte_offertennummer_key" ON "Offerte"("offertennummer");
CREATE TABLE "new_OffertePosition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerteId" INTEGER NOT NULL,
    "typ" TEXT NOT NULL,
    "kategorie" TEXT,
    "titel" TEXT NOT NULL,
    "menge" INTEGER NOT NULL DEFAULT 1,
    "vp" INTEGER NOT NULL DEFAULT 0,
    "epRappen" INTEGER,
    "zeilentotalVP" INTEGER NOT NULL DEFAULT 0,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    "zubehoerId" INTEGER,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OffertePosition_offerteId_fkey" FOREIGN KEY ("offerteId") REFERENCES "Offerte" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OffertePosition_zubehoerId_fkey" FOREIGN KEY ("zubehoerId") REFERENCES "Zubehoer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OffertePosition" ("id", "menge", "offerteId", "titel", "zubehoerId") SELECT "id", "menge", "offerteId", "titel", "zubehoerId" FROM "OffertePosition";
DROP TABLE "OffertePosition";
ALTER TABLE "new_OffertePosition" RENAME TO "OffertePosition";
CREATE TABLE "new_Zubehoer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "artikelnummer" TEXT,
    "vpPreis" INTEGER NOT NULL,
    "epPreisRappen" INTEGER,
    "kategorieId" INTEGER NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL,
    CONSTRAINT "Zubehoer_kategorieId_fkey" FOREIGN KEY ("kategorieId") REFERENCES "ZubehoerKategorie" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Zubehoer" ("id", "kategorieId", "name") SELECT "id", "kategorieId", "name" FROM "Zubehoer";
DROP TABLE "Zubehoer";
ALTER TABLE "new_Zubehoer" RENAME TO "Zubehoer";
CREATE UNIQUE INDEX "Zubehoer_kategorieId_name_key" ON "Zubehoer"("kategorieId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MietLaufzeit_monate_key" ON "MietLaufzeit"("monate");

-- CreateIndex
CREATE UNIQUE INDEX "EpFaktorKategorie_name_key" ON "EpFaktorKategorie"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EpFaktorGruppe_name_key" ON "EpFaktorGruppe"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EpFaktorWert_gruppeId_kategorieId_key" ON "EpFaktorWert"("gruppeId", "kategorieId");

-- CreateIndex
CREATE UNIQUE INDEX "VrgTarif_vonPreis_bisPreis_key" ON "VrgTarif"("vonPreis", "bisPreis");

-- CreateIndex
CREATE UNIQUE INDEX "KonditionDefinition_name_key" ON "KonditionDefinition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "KonditionGruppe_name_key" ON "KonditionGruppe"("name");

-- CreateIndex
CREATE UNIQUE INDEX "KonditionPreis_gruppeId_definitionId_key" ON "KonditionPreis"("gruppeId", "definitionId");
