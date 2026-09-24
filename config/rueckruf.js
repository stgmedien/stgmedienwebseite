// Regeln für die Rückruf-Termine auf der Website.
// Nach einer Änderung committen und pushen, dann gelten sie nach dem nächsten Deployment.
export default {
  zeitzone: 'Europe/Berlin',

  // In diesen Kalender werden die Rückrufe eingetragen (GOOGLE_CALENDAR_ID in Vercel überschreibt das)
  kalender: 'jonathan.kreutzheide@gmail.com',

  // Diese Kalender blockieren Zeiten
  blockierendeKalender: ['jonathan.kreutzheide@gmail.com'],

  // true = jeder Eintrag blockiert, auch ganztägige und als „verfügbar“ markierte Termine.
  // Nur abgesagte Einladungen blockieren nicht.
  alleTermineBlockieren: true,

  // Länge eines Rückrufs und Abstand zu anderen Terminen
  dauerMinuten: 15,
  pufferMinuten: 15,

  // Termine starten im Raster von … Minuten (z. B. 08:00, 08:30, 09:00)
  rasterMinuten: 30,

  // Frühester Termin: jetzt plus … Stunden
  vorlaufStunden: 2,

  // So viele Tage im Voraus sind buchbar
  tageImVoraus: 10,

  // Höchstens so viele Rückrufe pro Tag
  maxProTag: 6,

  // Erreichbar je Wochentag, leere Liste = kein Termin an diesem Tag
  zeiten: {
    mo: [['08:00', '16:00']],
    di: [['08:00', '16:00']],
    mi: [['08:00', '16:00']],
    do: [['08:00', '16:00']],
    fr: [['08:00', '16:00']],
    sa: [],
    so: [],
  },

  // Einzelne Tage ohne Rückrufe, Format JJJJ-MM-TT
  gesperrteTage: ['2026-12-24', '2026-12-25', '2026-12-26', '2026-12-31', '2027-01-01'],

  // Titel des Kalendereintrags. Platzhalter: {name}, {rolle}
  titel: 'Rückruf: {name} ({rolle})',

  // Erinnerung vor dem Anruf in Minuten
  erinnerungMinuten: 10,
};
