UPDATE "Kunde"
SET "plz" = NULL
WHERE "plz" IS NOT NULL AND "plz" GLOB '*[^0-9]*';

UPDATE "Kunde"
SET "verkaeuferId" = (
    SELECT "id"
    FROM "Benutzer"
    WHERE "email" = 'demo.verkaeufer@local'
);
