/*
  Warnings:

  - You are about to drop the column `basispreisCents` on the `Druckermodell` table. All the data in the column will be lost.
  - You are about to drop the column `waehrung` on the `Druckermodell` table. All the data in the column will be lost.
  - You are about to drop the column `erstelltAm` on the `Offerte` table. All the data in the column will be lost.
  - You are about to drop the column `totalCents` on the `Offerte` table. All the data in the column will be lost.
  - You are about to drop the column `einzelpreisCents` on the `OffertePosition` table. All the data in the column will be lost.
  - You are about to drop the column `zeilentotalCents` on the `OffertePosition` table. All the data in the column will be lost.
  - You are about to drop the column `artikelnummer` on the `Zubehoer` table. All the data in the column will be lost.
  - You are about to drop the column `herstellernummer` on the `Zubehoer` table. All the data in the column will be lost.
  - You are about to drop the column `kategorie` on the `Zubehoer` table. All the data in the column will be lost.
  - You are about to drop the column `preisCents` on the `Zubehoer` table. All the data in the column will be lost.
  - Added the required column `benutzerId` to the `Offerte` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kundeId` to the `Offerte` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Offerte` table without a default value. This is not possible if the table is not empty.
  - Added the required column `einzelpreis` to the `OffertePosition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zeilentotal` to the `OffertePosition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kategorieId` to the `Zubehoer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preis` to the `Zubehoer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Benutzer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vorname" TEXT NOT NULL,
    "nachname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rolle" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Kunde" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firmenname" TEXT NOT NULL,
    "kontaktname" TEXT,
    "email" TEXT,
    "telefon" TEXT,
    "ort" TEXT
);

-- CreateTable
CREATE TABLE "ZubehoerKategorie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Druckermodell" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "artikelnummer" TEXT,
    "herstellerId" INTEGER NOT NULL,
    CONSTRAINT "Druckermodell_herstellerId_fkey" FOREIGN KEY ("herstellerId") REFERENCES "Hersteller" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Druckermodell" ("artikelnummer", "herstellerId", "id", "name") SELECT "artikelnummer", "herstellerId", "id", "name" FROM "Druckermodell";
DROP TABLE "Druckermodell";
ALTER TABLE "new_Druckermodell" RENAME TO "Druckermodell";
CREATE TABLE "new_Offerte" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offertennummer" TEXT NOT NULL,
    "waehrung" TEXT NOT NULL DEFAULT 'CHF',
    "total" INTEGER NOT NULL,
    "kundeId" INTEGER NOT NULL,
    "benutzerId" INTEGER NOT NULL,
    CONSTRAINT "Offerte_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offerte_benutzerId_fkey" FOREIGN KEY ("benutzerId") REFERENCES "Benutzer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Offerte" ("id", "offertennummer") SELECT "id", "offertennummer" FROM "Offerte";
DROP TABLE "Offerte";
ALTER TABLE "new_Offerte" RENAME TO "Offerte";
CREATE UNIQUE INDEX "Offerte_offertennummer_key" ON "Offerte"("offertennummer");
CREATE TABLE "new_OffertePosition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titel" TEXT NOT NULL,
    "menge" INTEGER NOT NULL,
    "einzelpreis" INTEGER NOT NULL,
    "zeilentotal" INTEGER NOT NULL,
    "offerteId" INTEGER NOT NULL,
    CONSTRAINT "OffertePosition_offerteId_fkey" FOREIGN KEY ("offerteId") REFERENCES "Offerte" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OffertePosition" ("id", "menge", "offerteId", "titel") SELECT "id", "menge", "offerteId", "titel" FROM "OffertePosition";
DROP TABLE "OffertePosition";
ALTER TABLE "new_OffertePosition" RENAME TO "OffertePosition";
CREATE TABLE "new_Zubehoer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "preis" INTEGER NOT NULL,
    "kategorieId" INTEGER NOT NULL,
    CONSTRAINT "Zubehoer_kategorieId_fkey" FOREIGN KEY ("kategorieId") REFERENCES "ZubehoerKategorie" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Zubehoer" ("id", "name") SELECT "id", "name" FROM "Zubehoer";
DROP TABLE "Zubehoer";
ALTER TABLE "new_Zubehoer" RENAME TO "Zubehoer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Benutzer_email_key" ON "Benutzer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ZubehoerKategorie_name_key" ON "ZubehoerKategorie"("name");
