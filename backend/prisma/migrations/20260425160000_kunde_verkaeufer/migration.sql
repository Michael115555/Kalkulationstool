-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Kunde" (
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

INSERT INTO "new_Kunde" ("aktualisiertAm", "email", "erstelltAm", "firmenname", "id", "kontaktname", "ort", "telefon")
SELECT "aktualisiertAm", "email", "erstelltAm", "firmenname", "id", "kontaktname", "ort", "telefon" FROM "Kunde";

DROP TABLE "Kunde";
ALTER TABLE "new_Kunde" RENAME TO "Kunde";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
