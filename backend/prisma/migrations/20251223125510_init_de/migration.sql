-- CreateTable
CREATE TABLE "Hersteller" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Druckermodell" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "herstellerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "artikelnummer" TEXT,
    "basispreisCents" INTEGER NOT NULL,
    "waehrung" TEXT NOT NULL DEFAULT 'CHF',
    CONSTRAINT "Druckermodell_herstellerId_fkey" FOREIGN KEY ("herstellerId") REFERENCES "Hersteller" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Zubehoer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "artikelnummer" TEXT,
    "herstellernummer" TEXT,
    "preisCents" INTEGER NOT NULL,
    "kategorie" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DruckermodellZubehoer" (
    "druckermodellId" INTEGER NOT NULL,
    "zubehoerId" INTEGER NOT NULL,

    PRIMARY KEY ("druckermodellId", "zubehoerId"),
    CONSTRAINT "DruckermodellZubehoer_druckermodellId_fkey" FOREIGN KEY ("druckermodellId") REFERENCES "Druckermodell" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DruckermodellZubehoer_zubehoerId_fkey" FOREIGN KEY ("zubehoerId") REFERENCES "Zubehoer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offerte" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offertennummer" TEXT NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OffertePosition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerteId" INTEGER NOT NULL,
    "titel" TEXT NOT NULL,
    "menge" INTEGER NOT NULL,
    "einzelpreisCents" INTEGER NOT NULL,
    "zeilentotalCents" INTEGER NOT NULL,
    CONSTRAINT "OffertePosition_offerteId_fkey" FOREIGN KEY ("offerteId") REFERENCES "Offerte" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Hersteller_name_key" ON "Hersteller"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Offerte_offertennummer_key" ON "Offerte"("offertennummer");
