# STG Medien – Website

Startseite von STG Medien: Das Showreel läuft durch die Bildmarke, das Ökosystem zieht als Filmstreifen vorbei, und am Ende steht ein Rückruf-Termin als Kinokarte.

## Lokal starten

```bash
npm install
npm run dev
```

Die Seite läuft dann unter http://localhost:5173. Änderungen an `index.html`, `src/style.css` und `src/main.js` erscheinen sofort im Browser.

## Showreel austauschen

```bash
npm run media -- "/Volumes/Extreme SSD/Showreel STG Medien/06_EXPORT/02_Master/STG Medien Showreel.mp4"
```

Das Skript erzeugt `public/media/showreel-1080.mp4`, `public/media/showreel-720.mp4` und die Standbilder in `public/media/stills`. Nach einem neuen Schnitt passt du die Zeitpunkte der Standbilder in `scripts/media.sh` an. Dafür wird `ffmpeg` gebraucht.

## Aufbau

- `index.html` – Inhalt und Logo als SVG-Symbol aus dem Designsystem
- `src/style.css` – Gestaltung im dunklen Theme des STG-Designsystems
- `src/main.js` – Bewegung mit GSAP ScrollTrigger und Lenis, Buchungsmaske
- `public/media` – Showreel und Standbilder

## Offen

- Echte Projektnamen und Orte
- Porträt, Kontaktdaten, Impressum und Datenschutz
- Echte Lieferzeiten statt „die ersten Fotos am nächsten Werktag“
- Buchung an den Kalender anbinden
