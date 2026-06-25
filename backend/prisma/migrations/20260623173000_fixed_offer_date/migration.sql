ALTER TABLE "Konfiguration" ADD COLUMN "offerteErstelltAm" DATETIME;

UPDATE "Konfiguration"
SET "offerteErstelltAm" = (
    SELECT MIN("erstelltAm")
    FROM "OfferteVersion"
    WHERE "OfferteVersion"."konfigurationId" = "Konfiguration"."id"
)
WHERE EXISTS (
    SELECT 1
    FROM "OfferteVersion"
    WHERE "OfferteVersion"."konfigurationId" = "Konfiguration"."id"
);
