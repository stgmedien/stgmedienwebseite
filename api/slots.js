import { anfrage, freieTermine, istKonfiguriert, json, verbundenesKonto } from './_lib/kalender.js';
import regeln from '../config/rueckruf.js';

// GET /api/slots – freie Rückruf-Termine der nächsten Tage
export async function GET(request) {
  anfrage(request);
  if (!istKonfiguriert()) return json({ ok: false, grund: 'nicht-konfiguriert' }, 503);
  try {
    return json({ ok: true, dauerMinuten: regeln.dauerMinuten, tage: await freieTermine() });
  } catch (e) {
    console.error('Rückruf-Termine:', e.message, '| verbundenes Konto:', await verbundenesKonto());
    return json({ ok: false, grund: 'kalender' }, 502);
  }
}
