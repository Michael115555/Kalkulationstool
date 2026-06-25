-- Preserve existing uploaded offer files while replacing the former review workflow.
CREATE TABLE "OfferteVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "konfigurationId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "pdfBytes" BLOB NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "erstelltVonId" INTEGER,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfferteVersion_konfigurationId_fkey" FOREIGN KEY ("konfigurationId") REFERENCES "Konfiguration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferteVersion_erstelltVonId_fkey" FOREIGN KEY ("erstelltVonId") REFERENCES "Benutzer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "OfferteStatusAenderung" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "konfigurationId" INTEGER NOT NULL,
    "unterschrieben" BOOLEAN NOT NULL,
    "offerteVersionId" INTEGER,
    "benutzerId" INTEGER,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfferteStatusAenderung_konfigurationId_fkey" FOREIGN KEY ("konfigurationId") REFERENCES "Konfiguration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferteStatusAenderung_offerteVersionId_fkey" FOREIGN KEY ("offerteVersionId") REFERENCES "OfferteVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OfferteStatusAenderung_benutzerId_fkey" FOREIGN KEY ("benutzerId") REFERENCES "Benutzer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "OfferteVersion" (
    "konfigurationId",
    "version",
    "pdfBytes",
    "snapshotJson",
    "erstelltAm"
)
SELECT
    "id",
    1,
    "unterschriebeneOfferteDaten",
    "snapshotJson",
    COALESCE("unterschriebeneOfferteGeprueftAm", "unterschriebeneOfferteHochgeladenAm", CURRENT_TIMESTAMP)
FROM "Konfiguration"
WHERE "unterschriebeneOfferteDaten" IS NOT NULL;

INSERT INTO "OfferteStatusAenderung" (
    "konfigurationId",
    "unterschrieben",
    "offerteVersionId",
    "erstelltAm"
)
SELECT
    konfiguration."id",
    true,
    version."id",
    COALESCE(konfiguration."unterschriebeneOfferteGeprueftAm", CURRENT_TIMESTAMP)
FROM "Konfiguration" AS konfiguration
LEFT JOIN "OfferteVersion" AS version
    ON version."konfigurationId" = konfiguration."id" AND version."version" = 1
WHERE konfiguration."unterschriebeneOfferteStatus" = 'GEPRUEFT';

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Konfiguration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "kundeId" INTEGER,
    "druckermodellId" INTEGER NOT NULL,
    "druckerVarianteId" INTEGER,
    "snapshotJson" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "offerteUnterschrieben" BOOLEAN NOT NULL DEFAULT false,
    "offerteUnterschriebenAm" DATETIME,
    "offerteUnterschriebenVonId" INTEGER,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL,
    CONSTRAINT "Konfiguration_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Konfiguration_druckermodellId_fkey" FOREIGN KEY ("druckermodellId") REFERENCES "Druckermodell" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Konfiguration_druckerVarianteId_fkey" FOREIGN KEY ("druckerVarianteId") REFERENCES "DruckerVariante" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Konfiguration_offerteUnterschriebenVonId_fkey" FOREIGN KEY ("offerteUnterschriebenVonId") REFERENCES "Benutzer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Konfiguration" (
    "id",
    "name",
    "kundeId",
    "druckermodellId",
    "druckerVarianteId",
    "snapshotJson",
    "total",
    "offerteUnterschrieben",
    "offerteUnterschriebenAm",
    "erstelltAm",
    "aktualisiertAm"
)
SELECT
    "id",
    "name",
    "kundeId",
    "druckermodellId",
    "druckerVarianteId",
    "snapshotJson",
    "total",
    CASE WHEN "unterschriebeneOfferteStatus" = 'GEPRUEFT' THEN true ELSE false END,
    CASE WHEN "unterschriebeneOfferteStatus" = 'GEPRUEFT' THEN "unterschriebeneOfferteGeprueftAm" ELSE NULL END,
    "erstelltAm",
    "aktualisiertAm"
FROM "Konfiguration";

DROP TABLE "Konfiguration";
ALTER TABLE "new_Konfiguration" RENAME TO "Konfiguration";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

CREATE INDEX "Konfiguration_druckermodellId_idx" ON "Konfiguration"("druckermodellId");
CREATE INDEX "Konfiguration_offerteUnterschrieben_idx" ON "Konfiguration"("offerteUnterschrieben");
CREATE INDEX "Konfiguration_offerteUnterschriebenVonId_idx" ON "Konfiguration"("offerteUnterschriebenVonId");
CREATE UNIQUE INDEX "Konfiguration_kundeId_name_key" ON "Konfiguration"("kundeId", "name");

CREATE INDEX "OfferteVersion_konfigurationId_erstelltAm_idx" ON "OfferteVersion"("konfigurationId", "erstelltAm");
CREATE INDEX "OfferteVersion_erstelltVonId_idx" ON "OfferteVersion"("erstelltVonId");
CREATE UNIQUE INDEX "OfferteVersion_konfigurationId_version_key" ON "OfferteVersion"("konfigurationId", "version");

CREATE INDEX "OfferteStatusAenderung_konfigurationId_erstelltAm_idx" ON "OfferteStatusAenderung"("konfigurationId", "erstelltAm");
CREATE INDEX "OfferteStatusAenderung_offerteVersionId_idx" ON "OfferteStatusAenderung"("offerteVersionId");
CREATE INDEX "OfferteStatusAenderung_benutzerId_idx" ON "OfferteStatusAenderung"("benutzerId");
