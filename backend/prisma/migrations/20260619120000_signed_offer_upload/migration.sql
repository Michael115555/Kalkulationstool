ALTER TABLE "Konfiguration" ADD COLUMN "unterschriebeneOfferteStatus" TEXT NOT NULL DEFAULT 'OFFEN';
ALTER TABLE "Konfiguration" ADD COLUMN "unterschriebeneOfferteDateiname" TEXT;
ALTER TABLE "Konfiguration" ADD COLUMN "unterschriebeneOfferteMimeType" TEXT;
ALTER TABLE "Konfiguration" ADD COLUMN "unterschriebeneOfferteDaten" BLOB;
ALTER TABLE "Konfiguration" ADD COLUMN "unterschriebeneOfferteGroesse" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Konfiguration" ADD COLUMN "unterschriebeneOfferteHochgeladenAm" DATETIME;
ALTER TABLE "Konfiguration" ADD COLUMN "unterschriebeneOfferteGeprueftAm" DATETIME;

CREATE INDEX "Konfiguration_unterschriebeneOfferteStatus_idx" ON "Konfiguration"("unterschriebeneOfferteStatus");
