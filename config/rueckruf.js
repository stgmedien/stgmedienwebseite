// Regeln für die Rückruf-Termine auf der Website.
// Nach einer Änderung committen und pushen, dann gelten sie nach dem nächsten Deployment.
export default {
  zeitzone: 'Europe/Berlin',

  // Länge eines Rückrufs und Abstand zu anderen Terminen im Kalender
  dauerMinuten: 15,
  pufferMinuten: 15,

  // Termine starten im Raster von … Minuten (z. B. 09:00, 09:30, 10:00)
  rasterMinuten: 30,

  // Frühester Termin: jetzt plus … Stunden
  vorlaufStunden: 2,

  // So viele Tage im Voraus sind buchbar
  tageImVoraus: 10,

  // Höchstens so viele Rückrufe pro Tag
  maxProTag: 6,

  // Buchbare Zeitfenster je Wochentag, leere Liste = kein Termin an diesem Tag
  zeiten: {
    mo: [['09:00', '12:00'], ['13:00', '18:00']],
    di: [['09:00', '12:00'], ['13:00', '18:00']],
    mi: [['09:00', '12:00'], ['13:00', '18:00']],
    do: [['09:00', '12:00'], ['13:00', '18:00']],
    fr: [['09:00', '12:00'], ['13:00', '16:00']],
    sa: [],
    so: [],
  },

  // Einzelne Tage ohne Rückrufe, Format JJJJ-MM-TT
  gesperrteTage: ['2026-12-24', '2026-12-25', '2026-12-26', '2026-12-31', '2027-01-01'],

  // Diese Kalender blockieren Zeiten (belegt = nicht buchbar). "primary" ist der Hauptkalender.
  blockierendeKalender: ['primary'],

  // Titel des Kalendereintrags. Platzhalter: {name}, {rolle}
  titel: 'Rückruf: {name} ({rolle})',

  // Erinnerung vor dem Anruf in Minuten
  erinnerungMinuten: 10,
};
