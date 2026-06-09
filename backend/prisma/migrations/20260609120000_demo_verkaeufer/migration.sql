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
