import { freieTermine, istKonfiguriert, json } from './_lib/kalender.js';
import regeln from '../config/rueckruf.js';

// GET /api/slots – freie Rückruf-Termine der nächsten Tage
export async function GET() {
  if (!istKonfiguriert()) return json({ ok: false, grund: 'nicht-konfiguriert' }, 503);
  try {
    return json({ ok: true, dauerMinuten: regeln.dauerMinuten, tage: await freieTermine() });
  } catch (e) {
    console.error(e);
    return json({ ok: false, grund: 'kalender' }, 502);
  }
}
