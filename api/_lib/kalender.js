// Google-Kalender-Anbindung für die Rückruf-Termine.
// Umgebungsvariablen (in Vercel, dieselben Werte wie bei ImmoHero):
//   GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN
//   GOOGLE_CALENDAR_ID (optional, Standard "primary")
// Lokal kann RUECKRUF_DEMO=1 in .env.local gesetzt werden: dann gibt es freie Zeiten ohne Google.
import regeln from '../../config/rueckruf.js';

const API = 'https://www.googleapis.com/calendar/v3';
const TAGE = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa'];

export const ROLLEN = ['Makler', 'Bauträger', 'Andere'];
export const THEMEN = ['Fotos', 'Video', 'Drohne', 'Grundriss', 'Home Staging', 'Exposé'];

const env = (k) => process.env[k];
const demo = () => env('RUECKRUF_DEMO') === '1';
const kalenderId = () => env('GOOGLE_CALENDAR_ID') || 'primary';

export function istKonfiguriert() {
  return demo() || Boolean(env('GOOGLE_CALENDAR_CLIENT_ID') && env('GOOGLE_CALENDAR_CLIENT_SECRET') && env('GOOGLE_CALENDAR_REFRESH_TOKEN'));
}

/* Zugriffstoken aus dem Refresh-Token, zwischengespeichert bis kurz vor Ablauf */
let token = null;
async function zugriff() {
  if (token && token.bis > Date.now() + 60_000) return token.wert;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env('GOOGLE_CALENDAR_CLIENT_ID'),
      client_secret: env('GOOGLE_CALENDAR_CLIENT_SECRET'),
      refresh_token: env('GOOGLE_CALENDAR_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Google-Token: ${res.status} ${await res.text()}`);
  const data = await res.json();
  token = { wert: data.access_token, bis: Date.now() + data.expires_in * 1000 };
  return token.wert;
}

async function google(pfad, init = {}) {
  const res = await fetch(`${API}${pfad}`, {
    ...init,
    headers: { authorization: `Bearer ${await zugriff()}`, 'content-type': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`Google-Kalender: ${res.status} ${await res.text()}`);
  return res.json();
}

/* Zeitzonen-Helfer ohne Bibliothek */
function versatzMs(datum, tz) {
  const teile = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(datum);
  const v = Object.fromEntries(teile.map((t) => [t.type, t.value]));
  return Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour, +v.minute, +v.second) - datum.getTime();
}
function ortszeitZuUtc(datumStr, zeitStr, tz) {
  const [y, m, d] = datumStr.split('-').map(Number);
  const [hh, mm] = zeitStr.split(':').map(Number);
  const schaetzung = Date.UTC(y, m - 1, d, hh, mm);
  let t = schaetzung - versatzMs(new Date(schaetzung), tz);
  const v2 = versatzMs(new Date(t), tz);
  if (schaetzung - v2 !== t) t = schaetzung - v2;
  return new Date(t);
}
function heuteIn(tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function plusTage(datumStr, n) {
  const [y, m, d] = datumStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
const minuten = (z) => { const [h, m] = z.split(':').map(Number); return h * 60 + m; };
const alsZeit = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

/* Alle Tage im Buchungszeitraum mit ihren möglichen Startzeiten (noch ohne Kalenderabgleich) */
function kandidaten() {
  const tz = regeln.zeitzone, heute = heuteIn(tz), tage = [];
  for (let i = 0; i < regeln.tageImVoraus + 1; i++) {
    const datum = plusTage(heute, i);
    if (regeln.gesperrteTage.includes(datum)) continue;
    const wochentag = TAGE[new Date(`${datum}T12:00:00Z`).getUTCDay()];
    const zeiten = [];
    for (const [von, bis] of regeln.zeiten[wochentag] || []) {
      for (let t = minuten(von); t + regeln.dauerMinuten <= minuten(bis); t += regeln.rasterMinuten) zeiten.push(alsZeit(t));
    }
    if (zeiten.length) tage.push({ datum, zeiten });
  }
  return tage;
}

/* Freie Termine: Raster minus Vorlauf, belegte Zeiten (mit Puffer) und volle Tage */
export async function freieTermine() {
  const tz = regeln.zeitzone, tage = kandidaten();
  if (!tage.length) return [];
  const von = ortszeitZuUtc(tage[0].datum, '00:00', tz);
  const bis = ortszeitZuUtc(plusTage(tage[tage.length - 1].datum, 1), '00:00', tz);
  let belegt = [], gebuchtProTag = {};
  if (!demo()) {
    const fb = await google('/freeBusy', {
      method: 'POST',
      body: JSON.stringify({ timeMin: von.toISOString(), timeMax: bis.toISOString(), timeZone: tz, items: regeln.blockierendeKalender.map((id) => ({ id: id === 'primary' ? kalenderId() : id })) }),
    });
    belegt = Object.values(fb.calendars || {}).flatMap((k) => k.busy || []).map((b) => [Date.parse(b.start), Date.parse(b.end)]);
    const ev = await google(`/calendars/${encodeURIComponent(kalenderId())}/events?${new URLSearchParams({ timeMin: von.toISOString(), timeMax: bis.toISOString(), singleEvents: 'true', maxResults: '250', privateExtendedProperty: 'stg=rueckruf' })}`);
    for (const e of ev.items || []) {
      const start = e.start?.dateTime || e.start?.date;
      if (start) { const d = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(start)); gebuchtProTag[d] = (gebuchtProTag[d] || 0) + 1; }
    }
  }
  const frueheste = Date.now() + regeln.vorlaufStunden * 3600_000, puffer = regeln.pufferMinuten * 60_000, dauer = regeln.dauerMinuten * 60_000;
  return tage
    .filter((t) => (gebuchtProTag[t.datum] || 0) < regeln.maxProTag)
    .map((t) => ({
      datum: t.datum,
      zeiten: t.zeiten.filter((z) => {
        const s = ortszeitZuUtc(t.datum, z, tz).getTime();
        if (s < frueheste) return false;
        return !belegt.some(([bs, be]) => s - puffer < be && s + dauer + puffer > bs);
      }),
    }))
    .filter((t) => t.zeiten.length);
}

/* Termin anlegen, nachdem die Zeit noch einmal geprüft wurde */
export async function termineintragen({ datum, zeit, name, telefon, rolle, themen }) {
  const frei = await freieTermine();
  if (!frei.some((t) => t.datum === datum && t.zeiten.includes(zeit))) return { vergeben: true };
  const tz = regeln.zeitzone;
  const start = ortszeitZuUtc(datum, zeit, tz);
  const ende = new Date(start.getTime() + regeln.dauerMinuten * 60_000);
  if (demo()) return { start: start.toISOString(), ende: ende.toISOString(), id: 'demo' };
  const ev = await google(`/calendars/${encodeURIComponent(kalenderId())}/events`, {
    method: 'POST',
    body: JSON.stringify({
      summary: regeln.titel.replace('{name}', name).replace('{rolle}', rolle),
      description: [`Telefon: ${telefon}`, `Rolle: ${rolle}`, `Thema: ${themen.length ? themen.join(', ') : 'noch offen'}`, '', 'Gebucht über stg-medien.com'].join('\n'),
      start: { dateTime: start.toISOString(), timeZone: tz },
      end: { dateTime: ende.toISOString(), timeZone: tz },
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: regeln.erinnerungMinuten }] },
      extendedProperties: { private: { stg: 'rueckruf' } },
    }),
  });
  return { start: start.toISOString(), ende: ende.toISOString(), id: ev.id };
}

export const json = (daten, status = 200) => new Response(JSON.stringify(daten), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
