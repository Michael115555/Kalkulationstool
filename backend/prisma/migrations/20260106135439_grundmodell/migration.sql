/*
  Warnings:

  - You are about to drop the column `epPreisRappen` on the `DruckerVariante` table. All the data in the column will be lost.
  - You are about to drop the column `vpPreis` on the `DruckerVariante` table. All the data in the column will be lost.
  - You are about to drop the column `faktor` on the `EpFaktorWert` table. All the data in the column will be lost.
  - You are about to drop the column `mietMonate` on the `Offerte` table. All the data in the column will be lost.
  - You are about to drop the column `miete48Monat` on the `Offerte` table. All the data in the column will be lost.
  - You are about to drop the column `miete60Monat` on the `Offerte` table. All the data in the column will be lost.
  - You are about to drop the column `preisZusatzPrintSWRappen` on the `Offerte` table. All the data in the column will be lost.
  - You are about to drop the column `totalEPRappen` on the `Offerte` table. All the data in the column will be lost.
  - You are about to drop the column `totalVP` on the `Offerte` table. All the data in the column will be lost.
  - You are about to drop the column `epRappen` on the `OffertePosition` table. All the data in the column will be lost.
  - You are about to drop the column `vp` on the `OffertePosition` table. All the data in the column will be lost.
  - You are about to drop the column `zeilentotalVP` on the `OffertePosition` table. All the data in the column will be lost.
  - You are about to drop the column `bisPreis` on the `VrgTarif` table. All the data in the column will be lost.
  - You are about to drop the column `gebuehrRappen` on the `VrgTarif` table. All the data in the column will be lost.
  - You are about to drop the column `vonPreis` on the `VrgTarif` table. All the data in the column will be lost.
  - You are about to drop the column `epPreisRappen` on the `Zubehoer` table. All the data in the column will be lost.
  - You are about to drop the column `vpPreis` on the `Zubehoer` table. All the data in the column will be lost.
  - Added the required column `verkaufsPreis` to the `DruckerVariante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `faktorBasisPunkte` to the `EpFaktorWert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bisBetrag` to the `VrgTarif` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gebuehr` to the `VrgTarif` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vonBetrag` to the `VrgTarif` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verkaufsPreis` to the `Zubehoer` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DruckerVariante" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "druckermodellId" INTEGER NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "geschwindigkeit" INTEGER NOT NULL,
    "verkaufsPreis" INTEGER NOT NULL,
    "einkaufsPreis" INTEGER,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL,
    CONSTRAINT "DruckerVariante_druckermodellId_fkey" FOREIGN KEY ("druckermodellId") REFERENCES "Druckermodell" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DruckerVariante" ("aktualisiertAm", "bezeichnung", "druckermodellId", "erstelltAm", "geschwindigkeit", "id") SELECT "aktualisiertAm", "bezeichnung", "druckermodellId", "erstelltAm", "geschwindigkeit", "id" FROM "DruckerVariante";
DROP TABLE "DruckerVariante";
ALTER TABLE "new_DruckerVariante" RENAME TO "DruckerVariante";
CREATE UNIQUE INDEX "DruckerVariante_druckermodellId_bezeichnung_key" ON "DruckerVariante"("druckermodellId", "bezeichnung");
CREATE TABLE "new_EpFaktorWert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gruppeId" INTEGER NOT NULL,
    "kategorieId" INTEGER NOT NULL,
    "faktorBasisPunkte" INTEGER NOT NULL,
    CONSTRAINT "EpFaktorWert_gruppeId_fkey" FOREIGN KEY ("gruppeId") REFERENCES "EpFaktorGruppe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EpFaktorWert_kategorieId_fkey" FOREIGN KEY ("kategorieId") REFERENCES "EpFaktorKategorie" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EpFaktorWert" ("gruppeId", "id", "kategorieId") SELECT "gruppeId", "id", "kategorieId" FROM "EpFaktorWert";
DROP TABLE "EpFaktorWert";
ALTER TABLE "new_EpFaktorWert" RENAME TO "EpFaktorWert";
CREATE UNIQUE INDEX "EpFaktorWert_gruppeId_kategorieId_key" ON "EpFaktorWert"("gruppeId", "kategorieId");
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
    "bemerkung" TEXT,
    "eintauschrabattProzent" INTEGER NOT NULL DEFAULT 0,
    "lieferungKosten" INTEGER NOT NULL DEFAULT 0,
    "restwertMonate" INTEGER NOT NULL DEFAULT 0,
    "restwertBetrag" INTEGER NOT NULL DEFAULT 0,
    "mieteMonate" INTEGER,
    "mieteMonat" INTEGER,
    "servicePauschaleMonat" INTEGER,
    "inklusiveKopienSW" INTEGER,
    "preisZusatzPrintSW" INTEGER,
    "scanpauschaleText" TEXT,
    "flatrateText" TEXT,
    "totalVerkauf" INTEGER NOT NULL DEFAULT 0,
    "totalEinkauf" INTEGER NOT NULL DEFAULT 0,
    "nettopreis" INTEGER NOT NULL DEFAULT 0,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL,
    CONSTRAINT "Offerte_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offerte_benutzerId_fkey" FOREIGN KEY ("benutzerId") REFERENCES "Benutzer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offerte_druckermodellId_fkey" FOREIGN KEY ("druckermodellId") REFERENCES "Druckermodell" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Offerte_druckerVarianteId_fkey" FOREIGN KEY ("druckerVarianteId") REFERENCES "DruckerVariante" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Offerte" ("aktualisiertAm", "benutzerId", "druckerVarianteId", "druckermodellId", "eintauschrabattProzent", "erstelltAm", "flatrateText", "id", "inklusiveKopienSW", "kundeId", "kundenkontakt", "nettopreis", "offertennummer", "restwertBetrag", "restwertMonate", "scanpauschaleText", "servicePauschaleMonat", "termin", "titel", "versand", "waehrung") SELECT "aktualisiertAm", "benutzerId", "druckerVarianteId", "druckermodellId", "eintauschrabattProzent", "erstelltAm", "flatrateText", "id", "inklusiveKopienSW", "kundeId", "kundenkontakt", "nettopreis", "offertennummer", "restwertBetrag", "restwertMonate", "scanpauschaleText", "servicePauschaleMonat", "termin", "titel", "versand", "waehrung" FROM "Offerte";
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
    "verkaufsPreis" INTEGER NOT NULL DEFAULT 0,
    "einkaufsPreis" INTEGER,
    "zeilenTotalVerkauf" INTEGER NOT NULL DEFAULT 0,
    "zeilenTotalEinkauf" INTEGER NOT NULL DEFAULT 0,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    "zubehoerId" INTEGER,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OffertePosition_offerteId_fkey" FOREIGN KEY ("offerteId") REFERENCES "Offerte" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OffertePosition_zubehoerId_fkey" FOREIGN KEY ("zubehoerId") REFERENCES "Zubehoer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OffertePosition" ("erstelltAm", "id", "kategorie", "menge", "offerteId", "sortierung", "titel", "typ", "zubehoerId") SELECT "erstelltAm", "id", "kategorie", "menge", "offerteId", "sortierung", "titel", "typ", "zubehoerId" FROM "OffertePosition";
DROP TABLE "OffertePosition";
ALTER TABLE "new_OffertePosition" RENAME TO "OffertePosition";
CREATE TABLE "new_VrgTarif" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vonBetrag" INTEGER NOT NULL,
    "bisBetrag" INTEGER NOT NULL,
    "gebuehr" INTEGER NOT NULL
);
INSERT INTO "new_VrgTarif" ("id") SELECT "id" FROM "VrgTarif";
DROP TABLE "VrgTarif";
ALTER TABLE "new_VrgTarif" RENAME TO "VrgTarif";
CREATE UNIQUE INDEX "VrgTarif_vonBetrag_bisBetrag_key" ON "VrgTarif"("vonBetrag", "bisBetrag");
CREATE TABLE "new_Zubehoer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "artikelnummer" TEXT,
    "verkaufsPreis" INTEGER NOT NULL,
    "einkaufsPreis" INTEGER,
    "kategorieId" INTEGER NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL,
    CONSTRAINT "Zubehoer_kategorieId_fkey" FOREIGN KEY ("kategorieId") REFERENCES "ZubehoerKategorie" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Zubehoer" ("aktualisiertAm", "artikelnummer", "erstelltAm", "id", "kategorieId", "name") SELECT "aktualisiertAm", "artikelnummer", "erstelltAm", "id", "kategorieId", "name" FROM "Zubehoer";
DROP TABLE "Zubehoer";
ALTER TABLE "new_Zubehoer" RENAME TO "Zubehoer";
CREATE UNIQUE INDEX "Zubehoer_kategorieId_name_key" ON "Zubehoer"("kategorieId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
