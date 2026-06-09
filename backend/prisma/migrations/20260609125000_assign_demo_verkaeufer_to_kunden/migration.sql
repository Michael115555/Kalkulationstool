UPDATE "Kunde"
SET "verkaeuferId" = (
    SELECT "id"
    FROM "Benutzer"
    WHERE "email" = 'demo.verkaeufer@local'
);
