import '@fontsource-variable/hanken-grotesk';
import 'lenis/dist/lenis.css';
import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Weiches Scrollen */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 1.4 });
    else el.scrollIntoView();
  });
});

/* Navigation blendet sich beim Runterscrollen aus */
const nav = $('#nav');
let lastY = 0;
function onScroll(y) {
  const d = y - lastY;
  if (Math.abs(d) > 3) { nav.classList.toggle('is-hidden', d > 0 && y > 240); lastY = y; }
  nav.classList.toggle('is-solid', y > innerHeight * 0.9);
}
if (lenis) lenis.on('scroll', (l) => onScroll(l.scroll));
else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

/* Showreel: startet stumm, Ton auf Wunsch */
const vid = $('#hero-video');
vid.src = matchMedia('(max-width: 760px)').matches ? vid.dataset.srcMobile : vid.dataset.src;
const sound = $('#sound');
const ready = () => document.body.classList.add('has-reel');
if (vid.readyState >= 2) ready(); else vid.addEventListener('loadeddata', ready, { once: true });
vid.play().catch(() => {});
sound.addEventListener('click', () => {
  vid.muted = !vid.muted;
  if (!vid.muted) vid.play().catch(() => {});
  sound.textContent = vid.muted ? 'Ton an' : 'Ton aus';
  sound.setAttribute('aria-pressed', String(!vid.muted));
});

/* Hero: das Showreel läuft durch die Bildmarke (180er Quadrate, Radius 14, Versatz wie im Logo) */
const hero = $('#hero');
const svg = $('#mask-svg');
const holes = $$('.hole');
const geo = { k: 8 };
function layoutMask() {
  const W = hero.clientWidth, H = hero.clientHeight;
  let u, x0, y0;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  [$('#holes'), $('#mask-bg'), $('#mask-cover')].forEach((r) => {
    r.setAttribute('x', 0); r.setAttribute('y', 0); r.setAttribute('width', W); r.setAttribute('height', H);
  });
  if (W < 760) {
    const cw = Math.min(W * 0.62, H * 0.4 * 388 / 446);
    u = cw / 388; x0 = (W - cw) / 2; y0 = Math.max(76, H * 0.09);
  } else {
    const ch = Math.min(H * 0.74, W * 0.44 * 446 / 388);
    u = ch / 446; x0 = W - 388 * u - W * 0.07; y0 = (H - 446 * u) / 2 + H * 0.03;
  }
  const S = 180 * u;
  [[0, 0], [208, 104], [104, 266]].forEach(([dx, dy], i) => {
    const h = holes[i];
    h.setAttribute('x', x0 + dx * u); h.setAttribute('y', y0 + dy * u);
    h.setAttribute('width', S); h.setAttribute('height', S); h.setAttribute('rx', 14 * u);
  });
  const cx = x0 + 104 * u + S / 2, cy = y0 + 266 * u + S / 2;
  geo.k = Math.max(cx, W - cx, cy, H - cy) / (S / 2) * 1.3;
  gsap.set(svg, { transformOrigin: `${cx}px ${cy}px` });
}
layoutMask();

if (!reduce) {
  ScrollTrigger.addEventListener('refreshInit', layoutMask);
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=150%', scrub: 0.8, pin: true, anticipatePin: 1, invalidateOnRefresh: true } })
    .to('.hero-copy', { y: -80, autoAlpha: 0, ease: 'power1.in', duration: 0.22 }, 0)
    .to('.scroll-hint', { autoAlpha: 0, duration: 0.08 }, 0)
    .to(svg, { scale: () => geo.k, ease: 'power2.in', duration: 0.58 }, 0.06)
    .to('.hero-dim', { opacity: 1, duration: 0.18 }, 0.52)
    .fromTo('.hs-1', { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.14 }, 0.64)
    .fromTo('.hs-2', { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.14 }, 0.76)
    .to({}, { duration: 0.12 });
} else {
  addEventListener('resize', layoutMask);
}

/* Video pausiert, sobald der Hero verlassen ist (außer der Ton läuft) */
ScrollTrigger.create({
  trigger: '#eco',
  start: 'top 60%',
  onEnter: () => { if (vid.muted) vid.pause(); },
  onLeaveBack: () => { vid.play().catch(() => {}); },
});

/* Ökosystem: vertikales Scrollen bewegt den Filmstreifen */
const track = $('#eco-track');
const frames = $$('.frame', track);
const clock = $('#eco-clock');
const prog = $('#eco-prog');
function ecoUpdate(p) {
  const i = Math.min(frames.length - 1, Math.floor(p * frames.length));
  clock.textContent = frames[i].dataset.time;
  prog.style.transform = `scaleX(${p.toFixed(4)})`;
}
gsap.matchMedia().add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
  const dist = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
  const tw = gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: { trigger: '#eco', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, onUpdate: (s) => ecoUpdate(s.progress) },
  });
  frames.filter((f) => !f.classList.contains('staging')).forEach((f) => {
    gsap.fromTo($('.frame-media', f), { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: f, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
  });
  return () => ecoUpdate(0);
});

/* Home Staging: Regler folgt der Maus, auf dem Handy läuft er von selbst */
const staging = $('.frame.staging');
if (staging) {
  const setSplit = (v) => staging.style.setProperty('--split', `${Math.max(0, Math.min(100, v)).toFixed(2)}%`);
  if (fine) {
    staging.addEventListener('pointermove', (e) => {
      const r = staging.getBoundingClientRect();
      setSplit(((e.clientX - r.left) / r.width) * 100);
    });
  } else if (!reduce) {
    const o = { v: 30 };
    gsap.to(o, { v: 70, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true, onUpdate: () => setSplit(o.v) });
  }
}

/* Große Worte laufen gegeneinander, Überschriften fahren ein */
if (!reduce) {
  $$('.mq').forEach((row, i) => {
    const right = i % 2 === 1;
    gsap.fromTo(row, { xPercent: right ? -28 : 0 }, { xPercent: right ? 0 : -28, ease: 'none', scrollTrigger: { trigger: row.parentNode, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  });
  $$('.eco-head h2, .projects h2, .p-row, .f-quote, .book h2, .ticket').forEach((el) => {
    gsap.from(el, { y: 56, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
}

/* Cursor und Projekt-Vorschau */
const cur = $('#cursor');
const pv = $('#p-preview');
const plist = $('#p-list');
if (fine && !reduce) {
  gsap.set(cur, { xPercent: -50, yPercent: -50, opacity: 0 });
  const cX = gsap.quickTo(cur, 'x', { duration: 0.28, ease: 'power3' });
  const cY = gsap.quickTo(cur, 'y', { duration: 0.28, ease: 'power3' });
  let shown = false;
  addEventListener('pointermove', (e) => {
    if (!shown) { shown = true; gsap.to(cur, { opacity: 1, duration: 0.3 }); }
    cX(e.clientX); cY(e.clientY);
  });
  $$('[data-cursor]').forEach((el) => {
    el.addEventListener('pointerenter', () => { cur.classList.add('is-big'); $('span', cur).textContent = el.dataset.cursor; });
    el.addEventListener('pointerleave', () => cur.classList.remove('is-big'));
  });
  if (getComputedStyle(pv).display !== 'none') {
    gsap.set(pv, { xPercent: -50, yPercent: -50, scale: 0.6 });
    const pX = gsap.quickTo(pv, 'x', { duration: 0.55, ease: 'power3' });
    const pY = gsap.quickTo(pv, 'y', { duration: 0.55, ease: 'power3' });
    plist.addEventListener('pointermove', (e) => { pX(e.clientX); pY(e.clientY); });
    $$('.p-row', plist).forEach((r) => {
      r.addEventListener('pointerenter', () => {
        pv.style.backgroundImage = `url(${r.dataset.img})`;
        pv.classList.add('has-still');
        gsap.to(pv, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' });
      });
    });
    plist.addEventListener('pointerleave', () => gsap.to(pv, { opacity: 0, scale: 0.6, duration: 0.3 }));
  }
} else {
  cur.hidden = true;
}

/* Rückruf-Termin: freie Zeiten kommen aus dem Google-Kalender, die Buchung trägt den Termin direkt ein */
const form = $('#b-form');
const grid = $('.b-grid');
const daysEl = $('#b-days');
const timesEl = $('#b-times');
const submit = $('#b-submit');
const nameIn = $('#b-name');
const phoneIn = $('#b-phone');
const mailIn = $('#b-email');
const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const statusEl = $('#b-status');
const ticket = $('#ticket');
const after = $('#t-after');
const KONTAKT = 'Rufen Sie mich gern direkt an: <a href="tel:+4915906828151">0159 06828151</a>, oder schreiben Sie an <a href="mailto:jonathan@stg-medien.com">jonathan@stg-medien.com</a>.';
const fShort = new Intl.DateTimeFormat('de-DE', { weekday: 'short' });
const fMon = new Intl.DateTimeFormat('de-DE', { month: 'short' });
const fLong = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const alsDatum = (s) => new Date(`${s}T12:00:00`);
const strip = (s) => s.replace('.', '');
const sel = { day: 0, time: null, role: 'Makler', topics: ['Fotos', 'Drohne'] };
let tage = [];
let sendet = false;

function offline(text) {
  form.classList.add('is-offline');
  grid.classList.add('is-offline');
  statusEl.innerHTML = `${text} ${KONTAKT}`;
}
function markDays() {
  $$('.b-day', daysEl).forEach((b, i) => b.setAttribute('aria-pressed', String(i === sel.day)));
}
function renderDays() {
  daysEl.innerHTML = '';
  tage.forEach((t, i) => {
    const dt = alsDatum(t.datum);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'b-day'; b.id = `b-day-${i}`;
    b.setAttribute('aria-label', fLong.format(dt));
    b.innerHTML = '<span class="d1"></span><span class="d2"></span><span class="d3"></span>';
    b.children[0].textContent = strip(fShort.format(dt));
    b.children[1].textContent = `${dt.getDate()}.`;
    b.children[2].textContent = strip(fMon.format(dt));
    b.addEventListener('click', () => {
      sel.day = i;
      if (!tage[i].zeiten.includes(sel.time)) sel.time = tage[i].zeiten[0];
      markDays(); renderTimes(); update();
    });
    daysEl.appendChild(b);
  });
  markDays();
}
function renderTimes() {
  timesEl.innerHTML = '';
  tage[sel.day].zeiten.forEach((t, j) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'b-time'; b.id = `b-time-${j}`; b.textContent = t;
    b.setAttribute('aria-label', `${t} Uhr`);
    b.setAttribute('aria-pressed', String(sel.time === t));
    b.addEventListener('click', () => {
      sel.time = t;
      $$('.b-time', timesEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      update();
    });
    timesEl.appendChild(b);
  });
}
async function ladeTermine(auswahlBehalten = false) {
  statusEl.textContent = 'Freie Zeiten werden geladen …';
  try {
    const res = await fetch('/api/slots', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.grund || String(res.status));
    tage = data.tage.slice(0, 6);
    if (!tage.length) { offline('In den nächsten Tagen ist leider kein Rückruf-Termin frei.'); return; }
    form.classList.remove('is-offline');
    grid.classList.remove('is-offline');
    statusEl.textContent = '';
    if (!auswahlBehalten || sel.day >= tage.length) sel.day = 0;
    if (!tage[sel.day].zeiten.includes(sel.time)) sel.time = tage[sel.day].zeiten[0];
    renderDays(); renderTimes(); update();
  } catch {
    offline('Die Online-Buchung ist gerade nicht erreichbar.');
  }
}
$$('#b-role .b-pill').forEach((b) => {
  b.addEventListener('click', () => {
    sel.role = b.textContent;
    $$('#b-role .b-pill').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    update();
  });
});
$$('#b-topics .b-pill').forEach((b) => {
  b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
    sel.topics = $$('#b-topics .b-pill').filter((x) => x.getAttribute('aria-pressed') === 'true').map((x) => x.textContent);
    update();
  });
});
[nameIn, phoneIn, mailIn].forEach((el) => el.addEventListener('input', update));
const valid = () => !!sel.time && nameIn.value.trim().length > 1 && phoneIn.value.replace(/\D/g, '').length >= 6 && MAIL.test(mailIn.value.trim());
function update() {
  const t = tage[sel.day];
  if (t) $('#t-date').textContent = fLong.format(alsDatum(t.datum));
  $('#t-time').textContent = sel.time || '––:––';
  const n = nameIn.value.trim(), ph = phoneIn.value.trim();
  $('#t-name').textContent = n || 'Sie';
  $('#t-phone').textContent = ph ? ` unter ${ph}` : '';
  $('#t-topics').textContent = `${sel.topics.length ? `Thema: ${sel.topics.join(', ')}` : 'Thema: noch offen'} · ${sel.role}`;
  if (!ticket.classList.contains('is-booked') && !sendet) submit.disabled = !valid();
}
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!valid() || sendet) return;
  sendet = true;
  submit.disabled = true;
  submit.textContent = 'Wird eingetragen …';
  try {
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        datum: tage[sel.day].datum, zeit: sel.time, name: nameIn.value.trim(), telefon: phoneIn.value.trim(), email: mailIn.value.trim(),
        rolle: sel.role, themen: sel.topics, website: $('#b-website').value,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409) {
      submit.textContent = 'Rückruf festmachen';
      sendet = false;
      await ladeTermine(true);
      statusEl.textContent = 'Diese Zeit wurde gerade vergeben. Bitte wählen Sie eine andere.';
      return;
    }
    if (!res.ok || !data.ok) throw new Error(data.grund || String(res.status));
    ticket.classList.add('is-booked');
    after.classList.add('is-on');
    submit.textContent = 'Bestätigt';
    statusEl.textContent = '';
    if (!reduce) gsap.fromTo(ticket, { y: 24, rotation: -1.5 }, { y: 0, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.6)' });
  } catch {
    statusEl.innerHTML = `Das hat leider nicht geklappt. ${KONTAKT}`;
    submit.textContent = 'Rückruf festmachen';
    submit.disabled = !valid();
  } finally {
    sendet = false;
  }
});
$('#t-reset').addEventListener('click', () => {
  ticket.classList.remove('is-booked');
  after.classList.remove('is-on');
  submit.textContent = 'Rückruf festmachen';
  ladeTermine();
});
ladeTermine();

document.fonts?.ready.then(() => ScrollTrigger.refresh());
