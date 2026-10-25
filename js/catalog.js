/* ============================================================
   catalog.js  -  svi naslovi + sta je u tvom planu i kojim redom
   ------------------------------------------------------------
   data.json je jedini izvor naslova. Svaki naslov ima:
     col   - kolekciju (MCU, X-Men, Netflix, Sony, Marvel TV, ...)
     doom  - koliko je bitan za Doomsday: must | good | skip
     d15   - nalazi se na zvanicnoj Disney+ listi od 15 naslova
     order - preporuceni redosled maratona (Fox X-Meni pre D&W,
             Netflix pre Hawkeye, Spider-Man filmovi pre No Way Home)
     chrono- MCU hronologija (ostalo je zalepljeno uz MCU)
     date  - premijera (za redosled "po izlasku")
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var GOAL_ID = 'avengers-doomsday';
  var DOOMSDAY_ISO = '2026-12-18';

  var COLS = [
    { id: 'mcu', name: 'MCU', full: 'Marvel Studios (MCU)', desc: 'Svi filmovi i serije MCU-a, od Iron Mana do VisionQuesta.' },
    { id: 'xmen', name: 'X-Men', full: 'X-Men (Fox)', desc: 'Svih 13 Fox filmova, od X-Men (2000) do The New Mutants.' },
    { id: 'netflix', name: 'Netflix', full: 'Netflix Defenders', desc: 'Daredevil, Jessica Jones, Luke Cage, Iron Fist, Defenders, Punisher.' },
    { id: 'sony', name: 'Spider-Man', full: 'Spider-Man i Sony', desc: 'Raimi i Webb filmovi, Venom, Spider-Verse, Spider-Noir.' },
    { id: 'tv', name: 'Marvel TV', full: 'Marvel Television', desc: 'Agents of S.H.I.E.L.D., Agent Carter, Legion, The Gifted, Runaways…' },
    { id: 'anim', name: 'Animacija', full: 'Animacija', desc: 'X-Men: The Animated Series, X-Men \'97, M.O.D.O.K., Hit-Monkey.' },
    { id: 'classic', name: 'Klasici', full: 'Stari Marvel filmovi', desc: 'Blade, Ghost Rider, stari Fantastic Four, Daredevil (2003)…' }
  ];
  var COL_IDS = COLS.map(function (c) { return c.id; });
  var TIER_IDS = ['must', 'good', 'skip'];

  var TIERS = {
    must: { short: 'OBAVEZNO', name: 'Baš obavezno', desc: 'Bez ovoga ne razumeš Doomsday.' },
    good: { short: 'DOBRO', name: 'Dobro za Doomsday', desc: 'Nije obavezno, ali pomaže — likovi i priče koji se vraćaju.' },
    skip: { short: 'MOŽE SKIP', name: 'Može da se preskoči', desc: 'Priča Doomsdaya ne zavisi od ovoga.' }
  };

  var PRESETS = [
    { id: 'doomsday', name: 'Samo obavezno', sub: 'Disney+ lista + Brand New Day',
      desc: 'Najkraći put do Doomsdaya: samo ono što je baš obavezno.',
      scope: { tiers: ['must'], cols: COL_IDS.slice(), must: true } },
    { id: 'doomsday-plus', name: 'Doomsday+', sub: 'obavezno + dobro',
      desc: 'Obavezno plus sve što pomaže da razumeš ko se vraća.',
      scope: { tiers: ['must', 'good'], cols: COL_IDS.slice(), must: true } },
    { id: 'mcu', name: 'Ceo MCU', sub: 'sve iz MCU-a + obavezno',
      desc: 'Svaki MCU film i serija, plus X-Men i X2 sa Disney+ liste.',
      scope: { tiers: TIER_IDS.slice(), cols: ['mcu'], must: true } },
    { id: 'full', name: 'Full Marvel', sub: 'baš sve',
      desc: 'Sve što postoji: Fox, Netflix, Sony, Marvel TV, animacija i klasici.',
      scope: { tiers: TIER_IDS.slice(), cols: COL_IDS.slice(), must: true } }
  ];

  var ORDERS = [
    { id: 'maraton', name: 'Maraton', desc: 'Po izlasku, ali Fox X-Meni idu pre Deadpool & Wolverine, Netflix pre Hawkeye, Spider-Man filmovi pre No Way Home.' },
    { id: 'izlazak', name: 'Po izlasku', desc: 'Strogo po datumu premijere, za sve kolekcije.' },
    { id: 'hrono', name: 'Hronološki', desc: 'Po vremenu radnje u MCU-u (Captain America prvi).' }
  ];

  var items = [];
  var byId = {};

  /* ---------------- scope (sta gledas) ---------------- */

  /**
   * Scope iz stanja. Stari korisnici (v1) nemaju `scope`, pa ga izvodimo iz
   * `plans` - BEZ upisivanja u stanje (ako bi se upisalo, a stari uredjaj
   * posle prepise stanje, migracija bi se izgubila; ovako se uvek ponovi).
   */
  function scopeOf(s) {
    var sc = s && s.scope;
    if (sc && Array.isArray(sc.tiers) && Array.isArray(sc.cols)) {
      return { preset: sc.preset || 'custom', tiers: sc.tiers, cols: sc.cols, must: sc.must !== false };
    }
    var plans = (s && Array.isArray(s.plans)) ? s.plans : ['must', 'good', 'skip', 'bonus'];
    var allMcu = ['must', 'good', 'skip'].every(function (t) { return plans.indexOf(t) !== -1; });
    if (!allMcu) return presetScope('doomsday-plus');
    var cols = ['mcu'];
    if (plans.indexOf('bonus') !== -1) cols.push('xmen');
    if (plans.indexOf('netflix') !== -1) cols.push('netflix');
    return {
      preset: cols.length === 1 ? 'mcu' : 'custom',
      tiers: TIER_IDS.slice(), cols: cols, must: true, migrated: true
    };
  }

  function presetScope(id) {
    var p = PRESETS.filter(function (x) { return x.id === id; })[0] || PRESETS[1];
    return { preset: p.id, tiers: p.scope.tiers.slice(), cols: p.scope.cols.slice(), must: p.scope.must };
  }

  /** Da li bi naslov bio u planu za dati scope (bez gledanja preskocenog). */
  function matches(item, sc) {
    if (item.id === GOAL_ID) return false;
    if (sc.cols.indexOf(item.col) !== -1 && sc.tiers.indexOf(item.doom) !== -1) return true;
    return !!(sc.must && item.doom === 'must');
  }

  /** Da li je naslov u TVOM planu: scope + rucno dodato - preskoceno. */
  function inPlan(item, s) {
    if (item.id === GOAL_ID) return false;
    if (s.skipped && s.skipped[item.id]) return false;
    if (s.extra && s.extra[item.id]) return true;
    return matches(item, scopeOf(s));
  }

  /** Koja preset kartica odgovara scope-u (za oznacavanje u UI-ju). */
  function presetIdOf(sc) {
    for (var i = 0; i < PRESETS.length; i++) {
      var p = PRESETS[i].scope;
      if (sameSet(p.tiers, sc.tiers) && sameSet(p.cols, sc.cols) && p.must === sc.must) return PRESETS[i].id;
    }
    return 'custom';
  }
  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    return a.every(function (x) { return b.indexOf(x) !== -1; });
  }

  /* ---------------- redosled ---------------- */

  function orderOf(s) {
    var o = s && s.order;
    return (o === 'izlazak' || o === 'hrono') ? o : 'maraton';
  }

  function cmp(mode) {
    if (mode === 'izlazak') {
      return function (a, b) { return (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) || (a.order - b.order); };
    }
    if (mode === 'hrono') {
      return function (a, b) { return (a.chrono - b.chrono) || (a.order - b.order); };
    }
    return function (a, b) { return a.order - b.order; };
  }

  /** Svi naslovi u redosledu koji je korisnik izabrao. */
  function sorted(s, list) {
    return (list || items).slice().sort(cmp(orderOf(s)));
  }

  /* ---------------- epizode i dostupnost ---------------- */

  function isSeries(item) { return item.type === 'serija' && item.episodes > 0; }

  function epMinutes(item) {
    if (!isSeries(item)) return item.runtime;
    return Math.max(1, Math.round(item.runtime / item.episodes));
  }

  /** Datum od kog se epizoda (ili film) moze gledati. */
  function availFrom(item, ep) {
    if (ep && item.epDates && item.epDates[ep - 1]) return item.epDates[ep - 1];
    return item.date;
  }

  function cleanTitle(item) {
    return item.title.replace(/\s*\(Sezona\s*(\d+)\)/i, ' · S$1');
  }

  /* ---------------- ucitavanje ---------------- */

  function load() {
    return fetch('data.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        items = data;
        byId = {};
        items.forEach(function (i) { byId[i.id] = i; });
        return items;
      });
  }

  MM.Cat = {
    GOAL_ID: GOAL_ID,
    DOOMSDAY_ISO: DOOMSDAY_ISO,
    COLS: COLS, COL_IDS: COL_IDS, TIERS: TIERS, TIER_IDS: TIER_IDS,
    PRESETS: PRESETS, ORDERS: ORDERS,
    load: load,
    all: function () { return items; },
    get: function (id) { return byId[id]; },
    col: function (id) { return COLS.filter(function (c) { return c.id === id; })[0]; },
    scopeOf: scopeOf, presetScope: presetScope, presetIdOf: presetIdOf,
    matches: matches, inPlan: inPlan,
    orderOf: orderOf, sorted: sorted,
    isSeries: isSeries, epMinutes: epMinutes, availFrom: availFrom,
    cleanTitle: cleanTitle,
    /** Globalni redni broj (#) - stabilan bez obzira na izbor i redosled. */
    num: function (id) { var i = byId[id]; return i ? i.order : 0; }
  };
})();
