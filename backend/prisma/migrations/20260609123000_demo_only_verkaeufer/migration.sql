INSERT OR IGNORE INTO "Benutzer" (
    "vorname",
    "nachname",
    "email",
    "rolle",
    "aktiv",
    "aktualisiertAm"
) VALUES (
    'Demo',
    'Verkäufer',
    'demo.verkaeufer@local',
    'VERKAUF',
    true,
    CURRENT_TIMESTAMP
);

UPDATE "Benutzer"
SET
    "vorname" = 'Demo',
    "nachname" = 'Verkäufer',
    "rolle" = 'VERKAUF',
    "aktiv" = true,
    "aktualisiertAm" = CURRENT_TIMESTAMP
WHERE "email" = 'demo.verkaeufer@local';

UPDATE "Benutzer"
SET
    "aktiv" = false,
    "aktualisiertAm" = CURRENT_TIMESTAMP
WHERE
    "rolle" = 'VERKAUF'
    AND "email" <> 'demo.verkaeufer@local';

UPDATE "Kunde"
SET "verkaeuferId" = (
    SELECT "id"
    FROM "Benutzer"
    WHERE "email" = 'demo.verkaeufer@local'
)
WHERE "verkaeuferId" IS NOT NULL;
