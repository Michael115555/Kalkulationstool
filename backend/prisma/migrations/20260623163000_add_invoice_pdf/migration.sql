ALTER TABLE "OfferteVersion" ADD COLUMN "rechnungPdfBytes" BLOB;

UPDATE "OfferteVersion"
SET "rechnungPdfBytes" = "pdfBytes"
WHERE "rechnungPdfBytes" IS NULL;

-- SQLite cannot add a NOT NULL constraint to an existing column without rebuilding the table.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_OfferteVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "konfigurationId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "pdfBytes" BLOB NOT NULL,
    "rechnungPdfBytes" BLOB NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "erstelltVonId" INTEGER,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfferteVersion_konfigurationId_fkey" FOREIGN KEY ("konfigurationId") REFERENCES "Konfiguration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferteVersion_erstelltVonId_fkey" FOREIGN KEY ("erstelltVonId") REFERENCES "Benutzer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_OfferteVersion" (
    "id",
    "konfigurationId",
    "version",
    "pdfBytes",
    "rechnungPdfBytes",
    "snapshotJson",
    "erstelltVonId",
    "erstelltAm"
)
SELECT
    "id",
    "konfigurationId",
    "version",
    "pdfBytes",
    "rechnungPdfBytes",
    "snapshotJson",
    "erstelltVonId",
    "erstelltAm"
FROM "OfferteVersion";

DROP TABLE "OfferteVersion";
ALTER TABLE "new_OfferteVersion" RENAME TO "OfferteVersion";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

CREATE INDEX "OfferteVersion_konfigurationId_erstelltAm_idx" ON "OfferteVersion"("konfigurationId", "erstelltAm");
CREATE INDEX "OfferteVersion_erstelltVonId_idx" ON "OfferteVersion"("erstelltVonId");
CREATE UNIQUE INDEX "OfferteVersion_konfigurationId_version_key" ON "OfferteVersion"("konfigurationId", "version");
