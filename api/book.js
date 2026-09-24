import { anfrage, istKonfiguriert, termineintragen, json, ROLLEN, THEMEN } from './_lib/kalender.js';

// POST /api/book – Rückruf-Termin im Google-Kalender eintragen
export async function POST(request) {
  anfrage(request);
  if (!istKonfiguriert()) return json({ ok: false, grund: 'nicht-konfiguriert' }, 503);
  let d;
  try { d = await request.json(); } catch { return json({ ok: false, grund: 'eingabe' }, 400); }

  // Unsichtbares Feld: Bots füllen es aus, Menschen nicht
  if (d.website) return json({ ok: true, start: null });

  const name = String(d.name || '').trim().slice(0, 80);
  const telefon = String(d.telefon || '').trim().slice(0, 30);
  const email = String(d.email || '').trim().slice(0, 120);
  const rolle = ROLLEN.includes(d.rolle) ? d.rolle : 'Andere';
  const themen = Array.isArray(d.themen) ? d.themen.filter((t) => THEMEN.includes(t)) : [];
  const datum = String(d.datum || ''), zeit = String(d.zeit || '');
  if (name.length < 2 || telefon.replace(/\D/g, '').length < 6 || !/^[\d\s+()/-]+$/.test(telefon)
      || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
      || !/^\d{4}-\d{2}-\d{2}$/.test(datum) || !/^\d{2}:\d{2}$/.test(zeit)) {
    return json({ ok: false, grund: 'eingabe' }, 400);
  }

  try {
    const r = await termineintragen({ datum, zeit, name, telefon, email, rolle, themen });
    if (r.vergeben) return json({ ok: false, grund: 'vergeben' }, 409);
    return json({ ok: true, start: r.start, ende: r.ende });
  } catch (e) {
    console.error(e);
    return json({ ok: false, grund: 'kalender' }, 502);
  }
}
