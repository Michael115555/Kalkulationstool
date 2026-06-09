UPDATE "Kunde"
SET "verkaeuferId" = (
    SELECT "id"
    FROM "Benutzer"
    WHERE "email" = 'demo.verkaeufer@local'
)
WHERE "verkaeuferId" IS NOT NULL;

UPDATE "Offerte"
SET "benutzerId" = (
    SELECT "id"
    FROM "Benutzer"
    WHERE "email" = 'demo.verkaeufer@local'
)
WHERE "benutzerId" IS NOT NULL;

DELETE FROM "Benutzer"
WHERE
    "rolle" = 'VERKAUF'
    AND "email" <> 'demo.verkaeufer@local';
