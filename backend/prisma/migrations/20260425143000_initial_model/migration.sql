-- CreateTable
CREATE TABLE "Benutzer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vorname" TEXT NOT NULL,
    "nachname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rolle" TEXT NOT NULL DEFAULT 'VERKAUF',
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Kunde" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firmenname" TEXT NOT NULL,
    "kontaktname" TEXT,
    "email" TEXT,
    "telefon" TEXT,
    "ort" TEXT,
    "verkaeuferId" INTEGER,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL,
    CONSTRAINT "Kunde_verkaeuferId_fkey" FOREIGN KEY ("verkaeuferId") REFERENCES "Benutzer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hersteller" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Druckermodell" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "artikelnummer" TEXT,
    "herstellerId" INTEGER NOT NULL,
    "epFaktorGruppeId" INTEGER,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL,
    CONSTRAINT "Druckermodell_herstellerId_fkey" FOREIGN KEY ("herstellerId") REFERENCES "Hersteller" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Druckermodell_epFaktorGruppeId_fkey" FOREIGN KEY ("epFaktorGruppeId") REFERENCES "EpFaktorGruppe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DruckerVariante" (
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

-- CreateTable
CREATE TABLE "ZubehoerKategorie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "epFaktorKategorieId" INTEGER,
    CONSTRAINT "ZubehoerKategorie_epFaktorKategorieId_fkey" FOREIGN KEY ("epFaktorKategorieId") REFERENCES "EpFaktorKategorie" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Zubehoer" (
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

-- CreateTable
CREATE TABLE "DruckermodellZubehoer" (
    "druckermodellId" INTEGER NOT NULL,
    "zubehoerId" INTEGER NOT NULL,

    PRIMARY KEY ("druckermodellId", "zubehoerId"),
    CONSTRAINT "DruckermodellZubehoer_druckermodellId_fkey" FOREIGN KEY ("druckermodellId") REFERENCES "Druckermodell" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DruckermodellZubehoer_zubehoerId_fkey" FOREIGN KEY ("zubehoerId") REFERENCES "Zubehoer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "faktorBasisPunkte" INTEGER NOT NULL,
    CONSTRAINT "EpFaktorWert_gruppeId_fkey" FOREIGN KEY ("gruppeId") REFERENCES "EpFaktorGruppe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EpFaktorWert_kategorieId_fkey" FOREIGN KEY ("kategorieId") REFERENCES "EpFaktorKategorie" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VrgTarif" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vonBetrag" INTEGER NOT NULL,
    "bisBetrag" INTEGER NOT NULL,
    "gebuehr" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "LieferOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "betrag" INTEGER NOT NULL DEFAULT 0,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL
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

-- CreateTable
CREATE TABLE "Offerte" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offertennummer" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "termin" DATETIME,
    "waehrung" TEXT NOT NULL DEFAULT 'CHF',
    "kundeId" INTEGER NOT NULL,
    "benutzerId" INTEGER,
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
    CONSTRAINT "Offerte_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Offerte_benutzerId_fkey" FOREIGN KEY ("benutzerId") REFERENCES "Benutzer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Offerte_druckermodellId_fkey" FOREIGN KEY ("druckermodellId") REFERENCES "Druckermodell" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Offerte_druckerVarianteId_fkey" FOREIGN KEY ("druckerVarianteId") REFERENCES "DruckerVariante" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Konfiguration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "kundeId" INTEGER,
    "druckermodellId" INTEGER NOT NULL,
    "druckerVarianteId" INTEGER,
    "snapshotJson" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL,
    CONSTRAINT "Konfiguration_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Konfiguration_druckermodellId_fkey" FOREIGN KEY ("druckermodellId") REFERENCES "Druckermodell" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Konfiguration_druckerVarianteId_fkey" FOREIGN KEY ("druckerVarianteId") REFERENCES "DruckerVariante" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OffertePosition" (
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

-- CreateIndex
CREATE UNIQUE INDEX "Benutzer_email_key" ON "Benutzer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Hersteller_name_key" ON "Hersteller"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Druckermodell_herstellerId_name_key" ON "Druckermodell"("herstellerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "DruckerVariante_druckermodellId_bezeichnung_key" ON "DruckerVariante"("druckermodellId", "bezeichnung");

-- CreateIndex
CREATE UNIQUE INDEX "ZubehoerKategorie_name_key" ON "ZubehoerKategorie"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Zubehoer_kategorieId_name_key" ON "Zubehoer"("kategorieId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MietLaufzeit_monate_key" ON "MietLaufzeit"("monate");

-- CreateIndex
CREATE UNIQUE INDEX "EpFaktorKategorie_name_key" ON "EpFaktorKategorie"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EpFaktorGruppe_name_key" ON "EpFaktorGruppe"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EpFaktorWert_gruppeId_kategorieId_key" ON "EpFaktorWert"("gruppeId", "kategorieId");

-- CreateIndex
CREATE UNIQUE INDEX "VrgTarif_vonBetrag_bisBetrag_key" ON "VrgTarif"("vonBetrag", "bisBetrag");

-- CreateIndex
CREATE UNIQUE INDEX "LieferOption_value_key" ON "LieferOption"("value");

-- CreateIndex
CREATE UNIQUE INDEX "KonditionDefinition_name_key" ON "KonditionDefinition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "KonditionGruppe_name_key" ON "KonditionGruppe"("name");

-- CreateIndex
CREATE UNIQUE INDEX "KonditionPreis_gruppeId_definitionId_key" ON "KonditionPreis"("gruppeId", "definitionId");

-- CreateIndex
CREATE UNIQUE INDEX "Offerte_offertennummer_key" ON "Offerte"("offertennummer");

-- CreateIndex
CREATE UNIQUE INDEX "Konfiguration_kundeId_name_key" ON "Konfiguration"("kundeId", "name");

-- CreateIndex - Performance Optimierungen
CREATE INDEX "Benutzer_email_idx" ON "Benutzer"("email");
CREATE INDEX "Benutzer_aktiv_idx" ON "Benutzer"("aktiv");
CREATE INDEX "Kunde_firmenname_idx" ON "Kunde"("firmenname");
CREATE INDEX "Kunde_verkaeuferId_idx" ON "Kunde"("verkaeuferId");
CREATE INDEX "Offerte_kundeId_idx" ON "Offerte"("kundeId");
CREATE INDEX "Offerte_benutzerId_idx" ON "Offerte"("benutzerId");
CREATE INDEX "Offerte_offertennummer_idx" ON "Offerte"("offertennummer");
CREATE INDEX "Konfiguration_druckermodellId_idx" ON "Konfiguration"("druckermodellId");

-- SeedData
INSERT INTO "Benutzer" ("vorname", "nachname", "email", "rolle", "aktiv", "aktualisiertAm") VALUES
('Christian', 'Mendelin', 'christian.mendelin@local', 'VERKAUF', true, CURRENT_TIMESTAMP),
('Rolf', 'Schaller', 'rolf.schaller@local', 'VERKAUF', true, CURRENT_TIMESTAMP),
('Tessa', 'Bohny', 'tessa.bohny@local', 'VERKAUF', true, CURRENT_TIMESTAMP),
('René', 'Steigmeier', 'rene.steigmeier@local', 'VERKAUF', true, CURRENT_TIMESTAMP);
