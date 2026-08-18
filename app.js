/* ============================================================
   app.js  -  UI, ekrani, interakcija
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var P = MM.Planner;
  var Store = MM.Store;

  var ITEMS = [], BY_ID = {}, PLAN = null;
  var tab = 'danas';
  var flashKey = null;          // za bounce animaciju posle cekiranja
  var modalItemId = null;       // koji naslov je trenutno otvoren u modalu
  var modalSource = 'library';  // odakle je modal otvoren ('plan' | 'library')
  var posterJob = null;         // {done,total} dok se povlace posteri
  var VERSION = '0.21.1';       // pise se u "Ja"; podize se uz svaki deploy
  var ORD = {};                 // id -> redni broj u redosledu gledanja (#1, #2…)
  var countdownTimer = null;
  var PACE_AFTER_MS = 7 * 24 * 3600 * 1000;   // provera tempa jednom nedeljno

  var lib = {
    type: 'sve',                // sve | film | serija
    status: 'sve',              // sve | odgledano | neodgledano
    q: ''
  };
  var selectMode = false;
  var selected = {};

  /* ---------------- sitni helperi ---------------- */

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function h(m) { return Math.round(m / 60 * 10) / 10; }
  function hStr(m) { return h(m).toFixed(1) + 'h'; }
  function todayISO() { return P.iso(new Date()); }
  function state() { return Store.get(); }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._tm);
    t._tm = setTimeout(function () { t.classList.add('hidden'); }, 2600);
  }

  function hue(id) {
    var x = 0;
    for (var i = 0; i < id.length; i++) x = (x * 31 + id.charCodeAt(i)) % 360;
    return x;
  }

  var TYPE_LABEL = { film: 'FILM', serija: 'SERIJA', special: 'SPECIAL' };
  var TIER_LABEL = { must: 'MUST', good: 'GOOD', skip: 'SKIP', bonus: 'BONUS' };
  var PLATFORM_LABEL = {
    disney: 'Disney+ (pretpostavka)', check: 'proveri', bioskop: 'bioskop',
    netflix: 'Netflix', hbo: 'HBO Max', other: 'Ostalo', link: 'Imam link'
  };
  var PLATFORM_SHORT = {
    disney: 'DISNEY?', check: 'PROVERI', bioskop: 'BIOSKOP',
    netflix: 'NETFLIX', hbo: 'HBO', other: 'OSTALO', link: 'LINK'
  };

  function platformOf(item) {
    var s = state();
    return (s.platforms && s.platforms[item.id]) || item.platform || 'check';
  }

  function posterUrl(item) { return MM.Posters.urlFor(item, state()); }

  /** Poster ili gradijent sa naslovom kad postera nema. */
  function artHTML(item, cls) {
    var src = posterUrl(item);
    if (src) {
      return '<img class="' + (cls || '') + '" src="' + esc(src) + '" alt="" loading="lazy" decoding="async" ' +
        'onerror="this.closest(\'.art\')&&this.closest(\'.art\').classList.add(\'art-failed\')">';
    }
    return '<div class="fallback ' + (cls || '') + '" style="background:linear-gradient(150deg,hsl(' + hue(item.id) +
      ' 42% 24%),hsl(' + ((hue(item.id) + 45) % 360) + ' 52% 11%))"><span>' + esc(item.title) + '</span></div>';
  }

  /** Mala uspravna sličica za redove plana. */
  function thumbHTML(item) {
    return '<div class="art thumb" data-act="open" data-id="' + esc(item.id) + '">' + artHTML(item) + '</div>';
  }

  /* ---------------- izmene stanja ---------------- */

  function allEps(item) {
    var a = []; for (var i = 1; i <= (item.episodes || 1); i++) a.push(i); return a;
  }

  /**
   * Oznaci/skini listu jedinica ("id" ili "id#3").
   *
   * `source` odlucuje da li se to racuna u OVU nedelju:
   *   'plan'    - kvacica u nedeljnom planu (Danas / Kalendar) -> upisuje se u
   *               log, broji se u "3.2h / 9.8h" i trosi kapacitet nedelje
   *   'library' - Biblioteka, modal otvoren iz Biblioteke, masovno oznacavanje
   *               -> samo izbacuje naslov iz spiska, nedeljni plan ostaje netaknut
   *
   * Bez ove podele je bilo ovako: oznacis 20 filmova koje si davno gledao i
   * njihovih 40h se upise kao "odgledano ove nedelje", pojede kapacitet i
   * ova nedelja ostane prazna.
   */
  function markUnits(keys, on, source) {
    var week = PLAN ? PLAN.currentWeek : P.currentWeek(new Date());
    var day = todayISO();
    var countToWeek = (source === 'plan');
    Store.mutate(function (s) {
      keys.forEach(function (k) {
        var parts = k.split('#');
        var id = parts[0];
        var ep = parts[1] ? parseInt(parts[1], 10) : null;
        var item = BY_ID[id];
        if (!item) return;

        if (ep) {
          var cur = s.watched[id];
          var arr = Array.isArray(cur) ? cur.slice() : (cur === true ? allEps(item) : []);
          var i = arr.indexOf(ep);
          if (on && i === -1) arr.push(ep);
          if (!on && i !== -1) arr.splice(i, 1);
          arr.sort(function (a, b) { return a - b; });
          s.watched[id] = arr;
        } else {
          if (on) s.watched[id] = true; else delete s.watched[id];
        }

        if (on && countToWeek) s.log[k] = { w: week, d: day };
        else delete s.log[k];
        if (on) { s.lastWatchAt = Date.now(); if (!s.firstWatchAt) s.firstWatchAt = Date.now(); }
      });
    });
  }

  function toggleItem(id, source) {
    var item = BY_ID[id];
    if (!item) return;
    var full = P.isFullyWatched(item, state());
    var keys = (item.type === 'serija' && item.episodes)
      ? allEps(item).map(function (e) { return id + '#' + e; })
      : [id];
    markUnits(keys, !full, source);
    flashKey = id;
  }

  function toggleEpisode(id, ep, source) {
    var seen = P.watchedEpisodes(BY_ID[id], state());
    markUnits([id + '#' + ep], seen.indexOf(ep) === -1, source);
    flashKey = id + '#' + ep;
  }

  function toggleEntry(keysCsv) {
    var keys = keysCsv.split(',');
    var s = state();
    var allOn = keys.every(function (k) {
      var p = k.split('#');
      if (p[1]) return P.watchedEpisodes(BY_ID[p[0]], s).indexOf(parseInt(p[1], 10)) !== -1;
      return s.watched[p[0]] === true;
    });
    markUnits(keys, !allOn, 'plan');   // kvacica u planu -> broji se u ovu nedelju
    flashKey = keys[0];
  }

  /* ---------------- render kostur ---------------- */

  function refresh() {
    PLAN = P.buildPlan(ITEMS, state(), new Date());
    render();
    publishProgress();
    writeWarnMeta();
  }

  function render() {
    if (!PLAN) return;          // podaci jos nisu ucitani
    var y = window.scrollY;
    var view = $('#view');
    view.innerHTML = ({
      danas: viewDanas, ocene: viewOcene, biblioteka: viewBiblioteka, ja: viewJa
    })[tab]();
    view.dataset.tab = tab;

    window.scrollTo(0, y);

    if (tab === 'danas') { bindDeck(); if ($('#cdown')) startCountdown(); }

    if (flashKey) {
      $$('[data-flash="' + CSS.escape(flashKey) + '"]').forEach(function (n) {
        n.classList.add('bounce');
      });
      flashKey = null;
    }
    $$('#tabbar .tab').forEach(function (b) { b.classList.toggle('is-active', b.dataset.tab === tab); });
  }

  /* ---------------- komponente ---------------- */

  function chk(on, act, attrs, key) {
    return '<button type="button" class="chk' + (on ? ' on' : '') + '" data-act="' + act + '" ' +
      (attrs || '') + (key ? ' data-flash="' + esc(key) + '"' : '') + ' aria-pressed="' + (on ? 'true' : 'false') + '">' +
      '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></button>';
  }

  function rowEntry(e, done) {
    var meta = TYPE_LABEL[e.type] + ' · ' + e.minutes + ' min';
    return '<div class="row' + (done ? ' is-done' : '') + '">' +
      thumbHTML(e.item) +
      '<div class="row-main" data-act="open" data-id="' + esc(e.id) + '">' +
        '<div class="row-title">' + esc(e.label) + '</div>' +
        '<div class="row-meta">' + meta + '</div>' +
      '</div>' +
      chk(done, 'entry', 'data-keys="' + esc(e.keys.join(',')) + '"', e.keys[0]) +
      '</div>';
  }

  /** Jedna stavka u horizontalnoj traci (Kalendar). */
  function railEntry(e, done) {
    var i = e.item;
    var sub = e.eps.length
      ? (e.eps.length === 1 ? 'ep ' + e.eps[0] : 'ep ' + e.eps[0] + '-' + e.eps[e.eps.length - 1])
      : e.minutes + ' min';
    return '<div class="ritem' + (done ? ' is-done' : '') + '" data-flash="' + esc(e.keys[0]) + '">' +
      '<div class="rart art" data-act="open" data-id="' + esc(i.id) + '">' +
        artHTML(i) +
        '<span class="rnum">#' + (ORD[i.id] || 0) + '</span>' +
        chk(done, 'entry', 'data-keys="' + esc(e.keys.join(',')) + '"', e.keys[0]) +
      '</div>' +
      '<div class="rtitle">' + esc(i.title) + '</div>' +
      '<div class="rmeta">' + sub + '</div>' +
      '</div>';
  }

  /** Fiksno finale u 18. nedelji. */
  function railPinned(i, done) {
    return '<div class="ritem' + (done ? ' is-done' : '') + '" data-flash="' + esc(i.id) + '">' +
      '<div class="rart art" data-act="open" data-id="' + esc(i.id) + '">' +
        artHTML(i) +
        '<span class="rnum">#' + (ORD[i.id] || 0) + '</span>' +
        chk(done, 'item', 'data-id="' + esc(i.id) + '"', i.id) +
      '</div>' +
      '<div class="rtitle">★ ' + esc(i.title) + '</div>' +
      '<div class="rmeta">fiksno</div>' +
      '</div>';
  }

  function progressBar(done, total, cls) {
    var pct = total ? Math.min(100, Math.round(done / total * 100)) : 0;
    return '<div class="bar ' + (cls || '') + '"><i style="width:' + pct + '%"></i></div>';
  }

  /* ============================================================
     EKRAN 1: DANAS
     ============================================================ */

  function viewDanas() {
    var s = state();
    var week = PLAN.weeks[PLAN.currentWeek - 1];
    var st = P.stats(ITEMS, s, PLAN, new Date());
    var dd = P.daysToDoomsday(new Date());
    var deck = P.deck(ITEMS, s);

    var watchedTitles = st.watchedTitles;
    var out = '<section class="deck">';

    out += '<div class="deck-top">' +
      '<div class="cdown" id="cdown">' + countdownHTML() + '</div>' +
      '<span class="dcount">' + watchedTitles + '<i>/' + ITEMS.length + '</i></span>' +
      '</div>';

    var idle = idleHours();
    if (idle >= 24 && deck.length) out += alarmHTML(idle);

    if (!deck.length) {
      out += deckDoneHTML();
    } else if (paceDue(s)) {
      // Jednom nedeljno, i to tek kad ima sta da se meri.
      out += paceCardHTML(st, s);
    } else {
      out += deckCardHTML(deck, s);
    }

    out += '</section>';

    return out;
  }

  /* ---- upozorenje da si stao ---- */

  /** Crvena traka na vrhu kad si stao. Ozbiljna, ali ne ruzna. */
  function alarmHTML(hours) {
    var days = Math.floor(hours / 24);
    var big = days >= 2 ? (days + ' DANA') : '24 SATA';
    return '<div class="alarm' + (days >= 3 ? ' hard' : '') + '">' +
      '<div class="alarm-glow"></div>' +
      '<div class="alarm-in">' +
        '<div class="alarm-top">⚠ BEZ MARVELA</div>' +
        '<div class="alarm-big">' + big + '</div>' +
        '<div class="alarm-sub">Doomsday je za ' + P.daysToDoomsday(new Date()) + ' dana. Prevuci levo i nastavi.</div>' +
      '</div></div>';
  }



  /** Koliko je punih sati proslo od poslednjeg oznacenog naslova. */
  function idleHours() {
    var t = state().lastWatchAt || state().firstWatchAt || 0;
    if (!t) return 0;
    return Math.floor((Date.now() - t) / 3600000);
  }

  /**
   * Podatak koji i aplikacija i service worker citaju. SW ne moze do
   * localStorage-a, pa mu ostavljamo malu JSON datoteku u kesu - tako
   * upozorenje moze da stigne i kad je app zatvoren.
   */
  function writeWarnMeta() {
    if (!window.caches || !PLAN) return;
    var deck = P.deck(ITEMS, state());
    var u = deck[0];
    // "left" mora da broji NASLOVE, ne epizode - inace notifikacija
    // kaze "jos 202 naslova" za 69 naslova.
    var ids = {};
    deck.forEach(function (x) { ids[x.id] = 1; });
    var meta = {
      lastWatchAt: state().lastWatchAt || state().firstWatchAt || 0,
      title: u ? unitTitle(u) : '',
      num: u ? (ORD[u.id] || 0) : 0,
      poster: u ? posterUrl(u.item) : '',
      left: Object.keys(ids).length
    };
    caches.open('mm-meta').then(function (c) {
      c.put('/mm-meta.json', new Response(JSON.stringify(meta), {
        headers: { 'Content-Type': 'application/json' }
      }));
    }).catch(function () {});
  }

  /** Lepa, ali opasna notifikacija - sa posterom kao velikom slikom. */
  function fireWarning(hours) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    var today = todayISO();
    if (state().lastWarnDay === today) return;      // najvise jednom dnevno
    Store.mutate(function (s) { s.lastWarnDay = today; });

    var deck = P.deck(ITEMS, state());
    var u = deck[0];
    var days = Math.floor(hours / 24);
    var title = days >= 2 ? ('🚨 ' + days + ' DANA BEZ MARVELA') : '🚨 24 SATA BEZ MARVELA';
    var ids = {}; deck.forEach(function (x) { ids[x.id] = 1; });
    var body = (u ? 'Na redu je #' + (ORD[u.id] || 0) + ' ' + unitTitle(u) + '.' + String.fromCharCode(10) : '') +
      'Još ' + Object.keys(ids).length + ' naslova, a Doomsday je za ' +
      P.daysToDoomsday(new Date()) + ' dana.';

    var opts = {
      body: body,
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      image: u ? posterUrl(u.item) : '',
      vibrate: [220, 90, 220, 90, 420],
      tag: 'mm-warn',
      renotify: true,
      requireInteraction: true,
      actions: [{ action: 'open', title: 'Gledam sad' }, { action: 'later', title: 'Sutra' }]
    };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(function (reg) { reg.showNotification(title, opts); })
        .catch(function () {});
    }
  }

  /** Registruj periodicnu proveru - Chrome je budi i kad je app zatvoren. */
  function registerPeriodicCheck() {
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.ready.then(function (reg) {
      if (!reg.periodicSync) return;              // nema podrske - nema veze
      navigator.permissions.query({ name: 'periodic-background-sync' })
        .then(function (st) {
          if (st.state !== 'granted') return;
          reg.periodicSync.register('mm-warn', { minInterval: 12 * 3600 * 1000 })
            .catch(function (e) { console.warn('[periodicSync]', e); });
        })
        .catch(function () {});
    }).catch(function () {});
  }

  /* ---- odbrojavanje ---- */

  /** Dani : sati : minuti : sekunde do 18.12.2026. */
  function countdownParts() {
    var diff = Math.max(0, P.DOOMSDAY.getTime() - Date.now());
    var sec = Math.floor(diff / 1000);
    return {
      d: Math.floor(sec / 86400),
      h: Math.floor(sec / 3600) % 24,
      m: Math.floor(sec / 60) % 60,
      s: sec % 60
    };
  }

  function countdownHTML() {
    var c = countdownParts();
    function unit(v, lbl, pad) {
      return '<span class="cu"><b>' + (pad ? String(v).padStart(2, '0') : v) + '</b><i>' + lbl + '</i></span>';
    }
    return unit(c.d, 'dana', false) + '<span class="csep">:</span>' +
      unit(c.h, 'sati', true) + '<span class="csep">:</span>' +
      unit(c.m, 'min', true) + '<span class="csep">:</span>' +
      unit(c.s, 'sek', true);
  }

  /**
   * Kuca svake sekunde, ali menja samo taj jedan element - ceo ekran
   * se ne prekrtava, pa prevlacenje kartice ostaje glatko.
   */
  function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
      var el = document.getElementById('cdown');
      if (!el) { clearInterval(countdownTimer); countdownTimer = null; return; }
      el.innerHTML = countdownHTML();
    }, 1000);
  }

  /* ---- kartica sa filmom ---- */

  function unitTitle(u) {
    return u.item.title.replace(/\s*\(Sezona\s*(\d+)\)/i, ' · S$1');
  }

  function deckCardHTML(deck, s) {
    var u = deck[0], nxt = deck[1];
    var i = u.item;
    var ord = ORD[i.id] || 0;

    var sub = u.ep
      ? 'Epizoda ' + u.ep + ' od ' + i.episodes
      : TYPE_LABEL[i.type];

    var html = '<div class="swipe-area">';

    // Kartica iza - da se vidi da spil ima nastavak.
    if (nxt) {
      html += '<div class="dcard peek art">' + artHTML(nxt.item) + '<div class="dscrim"></div></div>';
    }

    html += '<div class="dcard cur art" id="deckCard" data-key="' + esc(u.key) + '" data-id="' + esc(i.id) + '">' +
      artHTML(i) +
      '<div class="dscrim"></div>' +
      '<div class="dstamp yes">ODGLEDANO</div>' +
      '<div class="dstamp back">NAZAD</div>' +
      '<div class="dinfo">' +
        '<div class="dnum">#' + ord + '</div>' +
        '<h1 class="dtitle">' + esc(unitTitle(u)) + '</h1>' +
        '<div class="dmeta">' + i.year + ' · ' + sub + ' · ' + u.minutes + ' min</div>' +
        (i.note ? '<p class="ddesc">' + esc(i.note) + '</p>' : '') +
      '</div>' +
      '</div></div>';

    return html;
  }

  function deckDoneHTML() {
    return '<div class="dcard done-card">' +
      '<div class="dinfo center">' +
        '<div class="dnum">✓</div>' +
        '<h1 class="dtitle">Nema više ničega</h1>' +
        '<p class="ddesc">Sve iz tvojih tierova je odgledano. Ostaje ti samo bioskop 18.12.</p>' +
      '</div></div>';
  }

  /* ---- swipe ---- */

  /**
   * Prevlacenje kartice:
   *   LEVO  = odgledano, ide na sledeci
   *   DESNO = nazad (skida oznaku sa prethodnog i vraca ga)
   * Tap na karticu otvara detalje.
   *
   * Vertikalni pokret se prepusta stranici da skrol i dalje radi
   * (zato i `touch-action:pan-y` na kartici).
   */
  function bindDeck() {
    var card = $('#deckCard');
    if (!card) return;

    var x0 = 0, y0 = 0, dx = 0, drag = false, locked = null, gone = false, moved = false;
    var THRESHOLD = 110;   // odluka se donosi tek kad pustis prst

    card.addEventListener('pointerdown', function (e) {
      if (gone || e.target.closest('button')) return;
      drag = true; locked = null; dx = 0; moved = false;
      x0 = e.clientX; y0 = e.clientY;
      card.style.transition = 'none';
      try { card.setPointerCapture(e.pointerId); } catch (err) {}
    });

    card.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var mx = e.clientX - x0, my = e.clientY - y0;
      if (locked === null) {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      }
      if (locked === 'y') return;      // korisnik skroluje, ne prevlaci
      dx = mx;
      moved = Math.abs(mx) > 8;
      card.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 24) + 'deg)';
      card.classList.toggle('to-yes', dx < -40);
      card.classList.toggle('to-back', dx > 40);
      // Namerno bez odluke u toku prevlacenja: dokle god drzis prst,
      // mozes da vratis karticu nazad i nista se nije desilo.
    });

    function release() {
      if (!drag) return;
      drag = false;
      card.style.transition = '';
      if (locked === 'x' && dx < -THRESHOLD) return flyOut('watched');
      if (locked === 'x' && dx > THRESHOLD) return flyOut('back');
      card.style.transform = '';
      card.classList.remove('to-yes', 'to-back');
    }
    card.addEventListener('pointerup', release);
    card.addEventListener('pointercancel', release);

    // Tap = detalji. Oslanjamo se na pravi `click` (pouzdaniji od
    // pogadjanja iz pointer dogadjaja), a `moved` odbacuje prevlacenja.
    card.addEventListener('click', function () {
      if (gone || moved) return;
      openItem(card.dataset.id, 'plan');
    });

    function flyOut(dir) {
      if (gone) return;
      gone = true;
      var to = dir === 'watched' ? -(window.innerWidth + 200) : (window.innerWidth + 200);
      card.classList.add('flying');
      card.style.transform = 'translateX(' + to + 'px) rotate(' + (to / 24) + 'deg)';
      card.classList.toggle('to-yes', dir === 'watched');
      card.classList.toggle('to-back', dir === 'back');
      if (navigator.vibrate) navigator.vibrate(dir === 'watched' ? 18 : 8);
      setTimeout(function () {
        if (dir === 'watched') deckWatched(card.dataset.key);
        else deckBack(card.dataset.key);
      }, 200);
    }

    card._flyOut = flyOut;
  }

  /** Levo: oznaci kao odgledano i pomeri spil. */
  function deckWatched(key) {
    markUnits([key], true, 'plan');            // kvacica u planu -> broji se u nedelju
    Store.mutate(function (s) {
      s.deckSince = (s.deckSince || 0) + 1;
      s.lastWatchAt = Date.now();
      if (!s.firstWatchAt) s.firstWatchAt = Date.now();
    });
    askRating(key);
  }

  /**
   * Desno: vrati se korak nazad. Nadje poslednju odgledanu jedinicu PRE
   * tekuce i skine joj oznaku - pa se ona opet pojavi kao tekuca kartica.
   * Nista se ne pamti posebno; sve se cita iz redosleda gledanja.
   */
  function deckBack(currentKey) {
    var all = P.allUnits(ITEMS, state());
    var idx = all.findIndex(function (u) { return u.key === currentKey; });
    if (idx === -1) idx = all.length;
    for (var i = idx - 1; i >= 0; i--) {
      if (all[i].watched) {
        markUnits([all[i].key], false, 'plan');
        Store.mutate(function (s) { s.deckSince = Math.max(0, (s.deckSince || 0) - 1); });
        return;
      }
    }
    toast('Nema šta da se vrati — ovo je početak.');
    render();
  }

  /* ---- provera tempa ---- */

  /**
   * Provera tempa se javlja posle nedelju dana gledanja, ne na svakih N
   * naslova. Meri se od prvog oznacenog naslova (ili od poslednje provere),
   * i trazi bar jedan odgledan naslov u medjuvremenu - nema smisla javljati
   * se nekom ko jos nije ni poceo.
   */
  function paceDue(s) {
    if (!(s.deckSince > 0)) return false;
    var since = s.lastPaceAt || s.firstWatchAt || 0;
    if (!since) return false;
    return (Date.now() - since) >= PACE_AFTER_MS;
  }


  function paceCardHTML(st, s) {
    var verdict, tone;
    if (st.tempo === 'ok') {
      verdict = 'Stižeš komotno. Nastavi ovim tempom i gotov si pre Doomsdaya.';
      tone = 'ok';
    } else if (st.tempo === 'warn') {
      verdict = 'Stižeš, ali bez mnogo pauza. Drži se plana.';
      tone = 'warn';
    } else {
      verdict = 'Ovako ne stižeš. Ili dižeš tempo, ili nešto izbacuješ.';
      tone = 'hot';
    }

    var skipH = h(P.tierMinutes(ITEMS, s, 'skip'));
    var need = PLAN.warning ? PLAN.warning.neededPerWeek : Math.ceil(st.perWeekHours);

    var html = '<div class="dcard pace pace-' + tone + '">' +
      '<div class="dinfo center">' +
        '<div class="pace-kicker">PROVERA TEMPA</div>' +
        '<div class="pace-num">' + st.perWeekHours.toFixed(1) + '<span>h/ned</span></div>' +
        '<p class="ddesc">' + esc(verdict) + '</p>' +
        '<div class="pace-facts">' +
          '<div><b>' + hStr(PLAN.totalRemainingMinutes) + '</b><span>ostalo</span></div>' +
          '<div><b>' + st.weeksLeft + '</b><span>nedelja</span></div>' +
          '<div><b>' + st.percent + '%</b><span>gotovo</span></div>' +
        '</div>' +
      '</div></div>';

    html += '<div class="pace-btns">';
    if (st.tempo !== 'ok' && s.plans.indexOf('skip') !== -1 && skipH > 0) {
      html += '<button class="btn ghost" data-act="drop-skip">Izbaci „skip" naslove (−' + skipH.toFixed(1) + 'h)</button>';
    }
    if (st.tempo !== 'ok' && need > s.defaultCapacity) {
      html += '<button class="btn ghost" data-act="raise-tempo" data-val="' + need + '">Digni tempo na ' + need + 'h nedeljno</button>';
    }
    html += '<button class="btn" data-act="pace-ok">Nastavi</button></div>';
    return html;
  }

  /* ============================================================
     EKRAN 2: BIBLIOTEKA
     ============================================================ */

  function libraryItems() {
    var s = state();
    var arr = ITEMS.slice();

    if (lib.type !== 'sve') {
      arr = arr.filter(function (i) {
        return lib.type === 'film' ? (i.type === 'film' || i.type === 'special') : i.type === 'serija';
      });
    }
    if (lib.status !== 'sve') {
      arr = arr.filter(function (i) {
        var f = P.isFullyWatched(i, s);
        return lib.status === 'odgledano' ? f : !f;
      });
    }
    if (lib.q) {
      var q = lib.q.toLowerCase();
      arr = arr.filter(function (i) { return i.title.toLowerCase().indexOf(q) !== -1; });
    }

    // Jedan jedini redosled: preporuceni redosled gledanja. Isti kljuc
    // koji koristi planer, pa Fox filmovi stoje tamo gde im je mesto
    // (pre "Deadpool & Wolverine"), a ne na kraju spiska.
    arr.sort(function (a, b) { return (ORD[a.id] || 0) - (ORD[b.id] || 0); });
    return arr;
  }

  function chip(label, act, val, on) {
    return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-act="' + act + '" data-val="' + esc(val) + '">' + esc(label) + '</button>';
  }

  function viewBiblioteka() {
    var s = state();
    var arr = libraryItems();
    var out = '';

    out += '<section class="filters">' +
      '<input id="q" class="search" type="search" placeholder="Pretraga po naslovu…" value="' + esc(lib.q) + '">' +
      '<div class="chips scroll">' +
        chip('Sve', 'f-type', 'sve', lib.type === 'sve') +
        chip('Filmovi', 'f-type', 'film', lib.type === 'film') +
        chip('Serije', 'f-type', 'serija', lib.type === 'serija') +
        '<span class="chip-sep"></span>' +
        chip('Neodgledano', 'f-status', 'neodgledano', lib.status === 'neodgledano') +
        chip('Odgledano', 'f-status', 'odgledano', lib.status === 'odgledano') +
      '</div>' +
      '<div class="count">' + arr.length + ' naslova · preporučenim redosledom</div>' +
    '</section>';

    if (selectMode) {
      var n = Object.keys(selected).filter(function (k) { return selected[k]; }).length;
      out += '<div class="selbar">' +
        '<span>' + n + ' izabrano <em>· ne utiče na nedeljni plan</em></span>' +
        '<button class="btn small" data-act="sel-watched">Označi odgledano</button>' +
        '<button class="btn small ghost" data-act="sel-unwatched">Skini oznaku</button>' +
        '<button class="btn small ghost" data-act="sel-cancel">Otkaži</button>' +
      '</div>';
    }

    out += '<div class="grid">';
    arr.forEach(function (i) { out += cardHTML(i, s); });
    out += '</div>';
    if (!arr.length) out += '<p class="empty pad">Ništa ne odgovara filterima.</p>';

    return out;
  }

  /** Ikona u gornjem desnom uglu kartice: film / serija / specijal. */
  function typeIcon(type) {
    var paths = {
      film: '<path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm2 2v2h2V5H6zm10 0v2h2V5h-2zM6 9v6h12V9H6zm0 8v2h2v-2H6zm10 0v2h2v-2h-2z"/>',
      serija: '<path d="M3 5h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm5 15h8v2H8v-2z"/>',
      special: '<path d="M12 2l2.6 6.3L21 9l-4.9 4.3L17.5 20 12 16.6 6.5 20l1.4-6.7L3 9l6.4-.7L12 2z"/>'
    };
    return '<span class="tico t-' + type + '" title="' + TYPE_LABEL[type] + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + (paths[type] || paths.film) + '</svg></span>';
  }

  function cardHTML(i, s) {
    var full = P.isFullyWatched(i, s);
    var seen = i.type === 'serija' ? P.watchedEpisodes(i, s).length : 0;
    var part = i.type === 'serija' && seen > 0 && !full;
    var pct = i.type === 'serija' && i.episodes ? Math.round(seen / i.episodes * 100) : (full ? 100 : 0);

    return '<article class="mcard' + (full ? ' is-done' : '') + (selectMode && selected[i.id] ? ' is-sel' : '') +
      '" data-id="' + esc(i.id) + '" data-flash="' + esc(i.id) + '">' +
      '<div class="art poster" data-act="card" data-id="' + esc(i.id) + '">' +
        artHTML(i) +
        '<div class="scrim"></div>' +
        '<div class="badges">' +
          '<span class="b num">#' + (ORD[i.id] || 0) + '</span>' +
        '</div>' +
        typeIcon(i.type) +
        '<div class="over">' +
          '<div class="over-title">' + esc(i.title) + '</div>' +
          '<div class="over-meta">' + i.year + ' · ' +
            (i.type === 'serija' ? seen + '/' + i.episodes + ' ep' : i.runtime + ' min') +
          '</div>' +
        '</div>' +
        (pct > 0 ? '<div class="cardbar' + (full ? ' full' : '') + '"><i style="width:' + pct + '%"></i></div>' : '') +
        (selectMode ? '<div class="selmark' + (selected[i.id] ? ' on' : '') + '">' + (selected[i.id] ? '✓' : '') + '</div>' : '') +
      '</div></article>';
  }

  /* ============================================================
     EKRAN: OCENE (zajednicko)
     ============================================================ */

  var reviewsLoading = false;

  function stars(n, cls) {
    var out = '<span class="stars ' + (cls || '') + '">';
    for (var i = 1; i <= 5; i++) out += '<i class="' + (i <= n ? 'on' : '') + '">★</i>';
    return out + '</span>';
  }

  function viewOcene() {
    var list = MM.Reviews.cached();
    var ppl = MM.Reviews.people();
    var me = Store.uid();
    var out = '';

    if (!me) {
      out += '<section class="card"><h2>Ekipa</h2>' +
        '<p class="note">Prijavi se Google nalogom da vidiš dokle su drugi stigli i šta kažu o filmovima.</p>' +
        '<button class="btn" data-act="go-login">Prijavi se</button></section>';
      return out;
    }

    /* --- ko dokle je stigao --- */
    out += '<section class="card"><h2>Dokle su stigli</h2>';
    if (!ppl.length) {
      out += '<p class="empty">' + (reviewsLoading ? 'Učitavam…' : 'Još niko osim tebe nije ovde.') + '</p>';
    } else {
      out += '<div class="people">';
      ppl.forEach(function (pr, idx) {
        var mine = pr.uid === me;
        out += '<div class="person' + (mine ? ' me' : '') + '">' +
          '<span class="rank">' + (idx + 1) + '</span>' +
          (pr.photo
            ? '<img class="pav" src="' + esc(pr.photo) + '" alt="" referrerpolicy="no-referrer">'
            : '<span class="pav txt">' + esc((pr.name || '?').slice(0, 1).toUpperCase()) + '</span>') +
          '<div class="pmain">' +
            '<div class="pname">' + esc(pr.name || 'Bez imena') + (mine ? ' <em>· ti</em>' : '') + '</div>' +
            '<div class="pbar"><i style="width:' + Math.min(100, pr.percent || 0) + '%"></i></div>' +
          '</div>' +
          '<div class="pnum"><b>' + (pr.watched || 0) + '</b><span>/' + (pr.total || 0) + '</span></div>' +
          '</div>';
      });
      out += '</div>';
    }
    out += '</section>';

    /* --- utisci --- */
    out += '<section class="card"><h2>Šta kažu</h2>';
    if (!list.length) {
      out += '<p class="empty">' + (reviewsLoading ? 'Učitavam…' : 'Još nema nijedne ocene. Označi nešto kao odgledano pa te pita.') + '</p></section>';
      return out;
    }
    out += '</section><div class="rev-list">';
    list.forEach(function (r) {
      var it = BY_ID[r.itemId];
      if (!it) return;
      var mine = r.uid === me;
      out += '<article class="rev' + (mine ? ' mine' : '') + '">' +
        '<div class="rart art" data-act="open" data-id="' + esc(it.id) + '">' + artHTML(it) + '</div>' +
        '<div class="rev-main">' +
          '<div class="rev-top">' + stars(r.stars) +
            '<span class="rev-who">' + esc(r.name || 'Bez imena') + (mine ? ' · ti' : '') + '</span>' +
          '</div>' +
          '<div class="rev-title">#' + (ORD[it.id] || 0) + ' ' + esc(it.title) + '</div>' +
          (r.text ? '<p class="rev-text">' + esc(r.text) + '</p>' : '') +
        '</div></article>';
    });
    out += '</div>';
    return out;
  }

  /** Ucitaj ocene sa servera pa prerenderuj. */
  function loadReviews(force) {
    if (reviewsLoading) return;
    if (!force && !MM.Reviews.isStale()) return;
    if (!Store.uid()) return;
    reviewsLoading = true;
    Promise.all([MM.Reviews.load(), MM.Reviews.loadPeople()])
      .then(function () { reviewsLoading = false; render(); })
      .catch(function (e) {
        reviewsLoading = false;
        console.warn('[ekipa]', e);
        render();
      });
  }

  /**
   * Objavi svoj napredak da ga ekipa vidi. Debounce, jer se stanje
   * menja na svako cekiranje a profil ne mora da prati svaki klik.
   */
  var profileTimer = null;
  function publishProgress() {
    if (!Store.uid() || !PLAN) return;
    clearTimeout(profileTimer);
    profileTimer = setTimeout(function () {
      var st = P.stats(ITEMS, state(), PLAN, new Date());
      Store.publishProfile({
        watched: st.watchedTitles, total: st.titles,
        minutes: st.watchedMinutes, percent: st.percent
      });
    }, 3000);
  }

  /** Prvo prijavljivanje: postavi ime pod kojim te ekipa vidi. */
  function askName() {
    if (state().displayName) return;
    showModal('<div class="sheet"><div class="sheet-body rate-sheet">' +
      '<button class="close" data-act="close" aria-label="Zatvori">✕</button>' +
      '<h2>Kako da te zovemo?</h2>' +
      '<p class="note small">Ovo ime ekipa vidi uz tvoje ocene i napredak. Nema veze sa Google nalogom i možeš ga promeniti u Ja → Nalog.</p>' +
      '<label class="field"><span>Ime</span>' +
      '<input id="nameFirst" type="text" maxlength="40" placeholder="npr. Kosta"></label>' +
      '<button class="btn" data-act="name-save">Sačuvaj</button>' +
      '</div></div>');
  }

  /* ---- ocenjivanje posle gledanja ---- */

  var ratingFor = null;

  function askRating(key) {
    var id = String(key).split('#')[0];
    var it = BY_ID[id];
    if (!it || !Store.code()) return;
    // Serije se ocenjuju tek kad se zavrse, ne posle svake epizode.
    if (it.type === 'serija' && !P.isFullyWatched(it, state())) return;
    ratingFor = id;
    openRating(id, 0, '');
  }

  function openRating(id, preset, text) {
    var it = BY_ID[id];
    var mine = MM.Reviews.mine(id);
    var val = preset || (mine ? mine.stars : 0);
    var txt = text || (mine ? mine.text : '');
    showModal('<div class="sheet"><div class="sheet-body rate-sheet">' +
      '<button class="close" data-act="close" aria-label="Zatvori">✕</button>' +
      '<h2>Kako ti je bio?</h2>' +
      '<div class="sub">#' + (ORD[id] || 0) + ' ' + esc(it.title) + '</div>' +
      '<div class="star-pick" id="starPick">' +
        [1, 2, 3, 4, 5].map(function (n) {
          return '<button type="button" class="sp' + (n <= val ? ' on' : '') + '" data-act="star" data-n="' + n + '">★</button>';
        }).join('') +
      '</div>' +
      '<label class="field"><span>Kratak utisak (opciono)</span>' +
      '<textarea id="revText" maxlength="500" rows="3" placeholder="U jednoj rečenici…">' + esc(txt) + '</textarea></label>' +
      '<div class="btn-row">' +
        '<button class="btn" data-act="rate-save" data-id="' + esc(id) + '">Objavi</button>' +
        (mine ? '<button class="btn danger" data-act="rate-del" data-id="' + esc(id) + '">Obriši</button>'
              : '<button class="btn ghost" data-act="close">Preskoči</button>') +
      '</div></div></div>');
    $('#modal').dataset.stars = val;
  }

  /* ============================================================
     EKRAN 3: JA
     ============================================================ */

  var PHASE_NAME = { 0: 'Fox / Bonus', 1: 'Faza 1', 2: 'Faza 2', 3: 'Faza 3', 4: 'Faza 4', 5: 'Faza 5', 6: 'Faza 6' };

  function viewJa() {
    var s = state();
    var out = '';

    /* --- sta gledam --- */
    out += '<section class="card"><h2>Šta gledam</h2>' +
      '<p class="note small">Ovo odlučuje šta ulazi u tvoj spisak i redosled.</p><div class="checks">';
    [['must', 'Obavezno', 'kičma priče, bez ovoga ne razumeš Doomsday'],
     ['good', 'Vredi', 'nije obavezno, ali je dobro'],
     ['skip', 'Može da se preskoči', 'slabiji naslovi, priča ne zavisi od njih'],
     ['bonus', 'Fox bonus', 'X-Men, Logan, Deadpool — pre „Deadpool & Wolverine"']].forEach(function (t) {
      var on = s.plans.indexOf(t[0]) !== -1;
      var mins = P.tierMinutes(ITEMS, s, t[0]);
      out += '<label class="check' + (on ? ' on' : '') + '">' +
        '<input type="checkbox" data-act="plan" data-val="' + t[0] + '"' + (on ? ' checked' : '') + '>' +
        '<span><b>' + esc(t[1]) + '</b><em>' + esc(t[2]) + '</em></span>' +
        '<i>' + hStr(mins) + '</i></label>';
    });
    out += '</div></section>';

    /* --- posteri --- */
    var miss = MM.Posters.missing(ITEMS, s, false).length;
    var have = ITEMS.filter(function (i) { return !!MM.Posters.urlFor(i, s); }).length;
    out += '<section class="card"><h2>Posteri</h2>' +
      '<div class="stat-big"><b>' + have + '</b> / ' + ITEMS.length + ' <span>ima poster</span></div>' +
      progressBar(have, ITEMS.length, 'red') +
      '<button class="btn ghost" data-act="fetch-posters">' +
        (MM.Posters.isRunning() ? 'Radi… <span id="posterProgress"></span>' : 'Povuci postere' + (miss ? ' (' + miss + ' fali)' : ' ponovo')) +
      '</button></section>';

    /* --- notifikacije --- */
    var perm = ('Notification' in window) ? Notification.permission : 'unsupported';
    out += '<section class="card"><h2>Notifikacije</h2>' +
      '<p class="note">Zakazane notifikacije kad je app zatvoren traže server (push), pa ih zamenjuje kalendar — uvezi .ics jednom i Google/Samsung te podseća.</p>' +
      '<button class="btn ghost" data-act="export-ics">Izvezi .ics za kalendar</button>' +
      (perm === 'granted'
        ? '<div class="ok-line">✓ notifikacije u aplikaciji dozvoljene</div>'
        : (perm === 'unsupported'
          ? '<div class="note small">Ovaj browser ne podržava notifikacije.</div>'
          : '<button class="btn ghost" data-act="ask-notif">Dozvoli notifikacije u aplikaciji</button>')) +
      '</section>';

    /* --- nalog --- */
    var u = Store.user();
    var av = s.avatar || '';
    var nm = s.displayName || '';
    out += '<section class="card"><h2>Nalog</h2>';
    if (u) {
      out += '<div class="acct">' +
        (av ? '<img class="acct-av" src="' + esc(av) + '" alt="" referrerpolicy="no-referrer">'
            : '<span class="acct-av">' + esc((nm || '?').slice(0, 1).toUpperCase()) + '</span>') +
        '<div><b>' + esc(nm || 'Postavi ime') + '</b>' +
        '<em>' + esc(u.email || '') + '</em>' +
        '<em id="syncStatusTxt">' + esc(statusText()) + '</em></div></div>' +
        '<label class="field"><span>Ime koje ekipa vidi</span>' +
        '<input id="profName" type="text" maxlength="40" placeholder="npr. Kosta" value="' + esc(nm) + '"></label>' +
        '<label class="field"><span>Slika profila (URL, prazno = slovo)</span>' +
        '<input id="profAvatar" type="url" maxlength="400" placeholder="https://…/slika.jpg" value="' + esc(av) + '"></label>' +
        '<p class="note small">Ime i slika su tvoji — ne uzimaju se sa Google naloga.</p>' +
        '<div class="btn-row">' +
          '<button class="btn ghost" data-act="sync-now">Sinhronizuj</button>' +
          '<button class="btn ghost" data-act="sign-out">Odjavi se</button>' +
        '</div>';
    } else {
      out += '<p class="note">Nisi prijavljen — lista postoji samo na ovom uređaju, i ne vidiš ekipu.</p>' +
        '<button class="btn" data-act="go-login">Prijavi se Google nalogom</button>';
    }
    out += '<div class="btn-row">' +
        '<button class="btn ghost" data-act="export-json">Export JSON</button>' +
        '<button class="btn ghost" data-act="import-json">Import JSON</button>' +
      '</div></section>';

    /* --- reset --- */
    out += '<section class="card"><h2>Opasna zona</h2>' +
      '<button class="btn danger" data-act="reset">Resetuj napredak</button></section>';

    out += '<p class="verline">Marvel Maraton <b>v' + VERSION + '</b></p>';

    return out;
  }

  function statusText() {
    var s = Store.status();
    return ({ local: 'lokalno (bez sinhronizacije)', connecting: 'povezujem…', online: 'sinhronizovano', offline: 'offline — sinhronizovaće se', error: 'greška: ' + Store.statusNote() })[s] || s;
  }

  /* ============================================================
     MODAL: detalji naslova
     ============================================================ */

  function openItem(id, source) {
    var i = BY_ID[id]; if (!i) return;
    var s = state();
    var full = P.isFullyWatched(i, s);
    var seen = P.watchedEpisodes(i, s);
    var av = MM.Reviews.avg(id);
    var revs = MM.Reviews.forItem(id);

    var html = '<div class="sheet">' +
      '<div class="sheet-hero art">' +
        '<div class="sheet-bg">' + artHTML(i) + '</div>' +
        '<div class="sheet-fade"></div>' +
        '<button class="close" data-act="close" aria-label="Zatvori">✕</button>' +
        '<div class="sheet-head">' +
          '<div class="sheet-num">#' + (ORD[i.id] || 0) + '</div>' +
          '<h2>' + esc(i.title) + '</h2>' +
          '<div class="sheet-meta">' + i.year + ' · ' + TYPE_LABEL[i.type] + ' · ' + i.runtime + ' min' +
            (i.episodes ? ' · ' + i.episodes + ' ep' : '') +
            (av ? ' · <b class="av">★ ' + av.toFixed(1) + '</b>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="sheet-body">';

    // 1) oznaci kao odgledano
    html += '<button class="btn' + (full ? ' ghost' : '') + '" data-act="item" data-id="' + esc(id) + '">' +
      (full ? '✓ Odgledano — skini oznaku' : 'Označi kao odgledano') + '</button>';

    // 2) ocene
    html += '<div class="rev-block"><div class="rev-head"><h3>Ocene</h3>' +
      (av ? stars(Math.round(av)) + '<b>' + av.toFixed(1) + '</b><span>(' + revs.length + ')</span>'
          : '<span class="note small">još nema</span>') + '</div>' +
      '<button class="btn small ghost" data-act="rate-open" data-id="' + esc(id) + '">' +
      (MM.Reviews.mine(id) ? 'Izmeni svoju ocenu' : 'Oceni') + '</button>';
    revs.slice(0, 5).forEach(function (r) {
      html += '<div class="rev-mini">' + stars(r.stars) +
        '<span class="rev-who">' + esc(r.name || 'Anonimno') + '</span>' +
        (r.text ? '<p class="rev-text">' + esc(r.text) + '</p>' : '') + '</div>';
    });
    html += '</div>';

    // 3) opis
    if (i.note) html += '<p class="sheet-desc">' + esc(i.note) + '</p>';

    // Epizode - jedino sto serijama treba pored ovoga.
    if (i.type === 'serija' && i.episodes) {
      html += '<div class="ep-head"><h3>Epizode</h3></div><div class="eps">';
      for (var e = 1; e <= i.episodes; e++) {
        var on = seen.indexOf(e) !== -1;
        html += '<button type="button" class="ep' + (on ? ' on' : '') + '" data-act="ep" data-id="' +
          esc(id) + '" data-ep="' + e + '">' + e + '</button>';
      }
      html += '</div>';
    }

    html += '</div></div>';
    showModal(html);
    modalItemId = id;
    modalSource = source || 'library';
  }

  // Android "nazad" ne sme da izbaci iz aplikacije dok je nesto otvoreno.
  // Otvaranje modala gura stanje u istoriju, popstate ga zatvara.
  var modalPushed = false;

  function showModal(html) {
    var m = $('#modal');
    m.innerHTML = html;
    m.classList.remove('hidden');
    document.body.classList.add('locked');
    if (!modalPushed) {
      history.pushState({ mm: 'modal' }, '');
      modalPushed = true;
    }
  }
  function closeModal(fromBack) {
    var m = $('#modal');
    if (m.classList.contains('hidden')) return;
    m.classList.add('hidden');
    m.innerHTML = '';
    modalItemId = null;
    ratingFor = null;
    document.body.classList.remove('locked');
    if (modalPushed && !fromBack) { modalPushed = false; history.back(); }
    else if (fromBack) { modalPushed = false; }
  }

  /** Osvezava kvacice u otvorenom modalu bez ponovnog crtanja (link ostaje). */
  function syncModal() {
    if (!modalItemId) return;
    var i = BY_ID[modalItemId]; if (!i) return;
    var s = state();
    var seen = P.watchedEpisodes(i, s);
    var full = P.isFullyWatched(i, s);
    $$('#modal .ep').forEach(function (b) {
      b.classList.toggle('on', seen.indexOf(parseInt(b.dataset.ep, 10)) !== -1);
    });
    var btn = $('#modal [data-act="item"]');
    if (btn) {
      btn.textContent = (i.type === 'serija' && i.episodes)
        ? (full ? 'Skini sve' : 'Označi sve')
        : (full ? 'Skini oznaku „odgledano"' : 'Označi kao odgledano');
      if (i.type !== 'serija') btn.classList.toggle('ghost', full);
    }
  }

  /* --- dijalog: kapacitet nedelje --- */
  function openCapacity(n) {
    var s = state();
    var w = PLAN.weeks[n - 1];
    var cur = P.capacityFor(s, n);
    showModal('<div class="sheet small-sheet">' +
      '<button class="close" data-act="close">✕</button>' +
      '<h2>Nedelja ' + n + '</h2><div class="sub">' + P.fmtRange(w.start, w.end) + '</div>' +
      '<p class="note">Koliko sati imaš baš ove nedelje? (npr. kontrolni iz matematike → 3h)</p>' +
      '<div class="cap-val"><b id="capNum">' + cur + '</b>h</div>' +
      '<input id="capRange" type="range" min="0" max="25" step="1" value="' + cur + '">' +
      '<div class="btn-row">' +
        '<button class="btn" data-act="cap-save" data-week="' + n + '">Sačuvaj</button>' +
        '<button class="btn ghost" data-act="cap-clear" data-week="' + n + '">Vrati na podrazumevano (' + s.defaultCapacity + 'h)</button>' +
      '</div></div>');
    var r = $('#capRange');
    r.addEventListener('input', function () { $('#capNum').textContent = r.value; });
  }

  function confirmDialog(title, text, actYes, label) {
    showModal('<div class="sheet small-sheet">' +
      '<button class="close" data-act="close">✕</button>' +
      '<h2>' + esc(title) + '</h2><p class="note">' + esc(text) + '</p>' +
      '<div class="btn-row"><button class="btn danger" data-act="' + actYes + '">' + esc(label) + '</button>' +
      '<button class="btn ghost" data-act="close">Odustani</button></div></div>');
  }

  /* ============================================================
     ONBOARDING
     ============================================================ */

  function showOnboarding() {
    var o = $('#onboarding');
    o.innerHTML = '<div class="sheet login">' +
      '<div class="login-logo"><span class="mlogo">MARVEL</span><span class="brand-sub">MARATON</span></div>' +
      '<h2>Prijavi se</h2>' +
      '<p class="note small">Google nalogom. Lista ti se sama prenosi na sve uređaje, a ekipa vidi dokle si stigao.</p>' +
      '<button class="btn gbtn" data-act="google-login">' +
        '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<path fill="#4285F4" d="M45 24c0-1.6-.1-2.7-.4-3.9H24v7.1h12c-.2 1.8-1.5 4.6-4.4 6.4l6.7 5.2c4-3.7 6.7-9.1 6.7-14.8z"/>' +
        '<path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.500-9.1l-7.1 5.5C7.9 41 15.4 46 24 46z"/>' +
        '<path fill="#FBBC05" d="M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z"/>' +
        '<path fill="#EA4335" d="M24 10.6c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4.4 29.9 2 24 2 15.4 2 7.9 7 4.3 14l7.1 5.5c1.8-5.3 6.7-8.9 12.6-8.9z"/>' +
        '</svg>Nastavi sa Google nalogom</button>' +
      '<button class="btn ghost" data-act="ob-skip">Samo na ovom uređaju</button>' +
      '<p class="note small">Bez prijave app radi normalno, ali nema sinhronizacije ni ocena.</p>' +
      '</div>';
    o.classList.remove('hidden');
    document.body.classList.add('locked');
  }

  function hideOnboarding() {
    $('#onboarding').classList.add('hidden');
    document.body.classList.remove('locked');
    Store.markOnboarded();
  }

  /* ============================================================
     AKCIJE (delegirani klikovi)
     ============================================================ */

  var ACTIONS = {
    'entry': function (n) { toggleEntry(n.dataset.keys); syncModal(); },
    'item': function (n) { toggleItem(n.dataset.id, sourceOf(n)); syncModal(); },
    'ep': function (n) {
      toggleEpisode(n.dataset.id, parseInt(n.dataset.ep, 10), sourceOf(n));
      // Modal se ne re-renderuje (da se ne izgubi otkucani link), pa
      // dugme epizode osvezavamo na licu mesta.
      n.classList.toggle('on');
      syncModal();
    },
    'open': function (n) { openItem(n.dataset.id, sourceOf(n)); },
    'close': function () { closeModal(); },

    'card': function (n) {
      if (selectMode) {
        selected[n.dataset.id] = !selected[n.dataset.id];
        render();
      } else openItem(n.dataset.id);
    },

    'skip-today': function () {
      Store.mutate(function (s) { s.skipDays[todayISO()] = true; });
      toast('Danas je slobodan — prebačeno na ostatak nedelje.');
    },
    'unskip-today': function () {
      Store.mutate(function (s) { delete s.skipDays[todayISO()]; });
    },

    'drop-skip': function () {
      Store.mutate(function (s) {
        s.plans = s.plans.filter(function (p) { return p !== 'skip'; });
        s.deckSince = 0; s.lastPaceAt = Date.now();
      });
      toast('Skip tier izbačen iz plana.');
    },
    'raise-tempo': function (n) {
      var v = Math.min(25, parseInt(n.dataset.val, 10));
      Store.mutate(function (s) { s.defaultCapacity = v; s.deckSince = 0; s.lastPaceAt = Date.now(); });
      toast('Tempo: ' + v + 'h nedeljno.');
    },

    'cap-save': function (n) {
      var v = parseInt($('#capRange').value, 10);
      var wk = n.dataset.week;
      Store.mutate(function (s) { s.capacity[String(wk)] = v; });
      closeModal(); toast('Nedelja ' + wk + ': ' + v + 'h. Plan preračunat.');
    },
    'cap-clear': function (n) {
      var wk = n.dataset.week;
      Store.mutate(function (s) { delete s.capacity[String(wk)]; });
      closeModal();
    },

    'export-ics': function () {
      MM.ICS.download(ITEMS, state(), PLAN);
      toast('Fajl skinut. Uvezi ga u Google Kalendar.');
    },

    'f-type': function (n) { lib.type = n.dataset.val; render(); },
    'f-status': function (n) { lib.status = (lib.status === n.dataset.val) ? 'sve' : n.dataset.val; render(); },

    'sel-watched': function () { bulkSelected(true); },
    'sel-unwatched': function () { bulkSelected(false); },
    'sel-cancel': function () { selectMode = false; selected = {}; render(); },


    'ask-notif': function () {
      if (!('Notification' in window)) return;
      Notification.requestPermission().then(function () { render(); maybeDailyNotification(); });
    },

    'sign-out': function () {
      confirmDialog('Odjava', 'Lista ostaje na ovom uređaju, ali se više ne sinhronizuje dok se ponovo ne prijaviš.', 'sign-out-yes', 'Odjavi me');
    },
    'sign-out-yes': function () {
      Store.signOutGoogle().then(function () { closeModal(); render(); toast('Odjavljen.'); });
    },
    'go-login': function () { showOnboarding(); },

    'sync-now': function () { Store.syncNow().then(function () { render(); toast('Sinhronizovano.'); }); },
    'export-json': function () {
      var blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'marvel-maraton-stanje.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    },
    'import-json': function () {
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'application/json,.json';
      inp.onchange = function () {
        var f = inp.files[0]; if (!f) return;
        var fr = new FileReader();
        fr.onload = function () {
          try { Store.importJSON(fr.result); toast('Uvezeno.'); }
          catch (e) { toast('Neispravan JSON.'); }
        };
        fr.readAsText(f);
      };
      inp.click();
    },

    'reset': function () {
      confirmDialog('Resetuj napredak', 'Briše sve odgledano, linkove, platforme i kapacitete. Ovo se ne može vratiti.', 'reset-yes', 'Da, obriši sve');
    },
    'reset-yes': function () { Store.reset(); closeModal(); toast('Obrisano.'); },

    'go-sync': function () { tab = 'ja'; render(); window.scrollTo(0, document.body.scrollHeight); },

    'star': function (n) {
      var v = parseInt(n.dataset.n, 10);
      $('#modal').dataset.stars = v;
      $$('#starPick .sp').forEach(function (b, i) { b.classList.toggle('on', i < v); });
    },
    'rate-save': function (n) {
      var v = parseInt($('#modal').dataset.stars || '0', 10);
      if (!v) { toast('Izaberi bar jednu zvezdicu.'); return; }
      var txt = ($('#revText') && $('#revText').value || '').trim();
      var id = n.dataset.id;
      n.textContent = 'Šaljem…';
      MM.Reviews.save(id, v, txt)
        .then(function () { closeModal(); toast('Objavljeno.'); render(); })
        .catch(function (e) {
          n.textContent = 'Objavi';
          toast(String(e && e.message) === 'offline' ? 'Nema veze sa serverom.' : 'Nije uspelo — proveri Firestore pravila.');
        });
    },
    'name-save': function () {
      var v = ($('#nameFirst') && $('#nameFirst').value || '').trim().slice(0, 40);
      if (v.length < 2) { toast('Bar dva znaka.'); return; }
      Store.mutate(function (st) { st.displayName = v; });
      closeModal(); toast('Zdravo, ' + v + '.');
    },
    'rate-open': function (n) { openRating(n.dataset.id, 0, ''); },
    'rate-del': function (n) {
      var id = n.dataset.id;
      MM.Reviews.remove(id)
        .then(function () { closeModal(); toast('Ocena obrisana.'); render(); })
        .catch(function (e) { console.warn(e); toast('Brisanje nije uspelo.'); });
    },

    'pace-ok': function () {
      Store.mutate(function (s) { s.deckSince = 0; s.lastPaceAt = Date.now(); });
    },

    'fetch-posters': function () {
      if (MM.Posters.isRunning()) { toast('Već radi…'); return; }
      startPosterFetch(true);
    },

    'google-login': function (n) {
      n.disabled = true;
      n.textContent = 'Otvaram Google…';
      Store.signInGoogle()
        .then(function () { hideOnboarding(); })
        .catch(function (e) {
          n.disabled = false;
          n.textContent = 'Nastavi sa Google nalogom';
          console.warn(e);
          toast(String(e && e.code) === 'auth/unauthorized-domain'
            ? 'Dodaj domen u Firebase → Authentication → Settings.'
            : 'Prijava nije uspela — je li Google provajder uključen?');
        });
    },
    'ob-skip': function () { hideOnboarding(); }
  };

  /**
   * Povlacenje postera u pozadini. Radi tiho na startu (samo za one kojima
   * poster fali), a preko dugmeta u "Ja" i za one koji ranije nisu nadjeni.
   */
  function startPosterFetch(includeFailed) {
    if (MM.Posters.isRunning()) return;
    if (!navigator.onLine) return;
    if (!MM.Posters.missing(ITEMS, state(), includeFailed).length) {
      if (includeFailed) toast('Svi posteri su već tu.');
      return;
    }
    MM.Posters.fetchMissing(ITEMS, state(), Store, function (done, total, finished) {
      posterJob = finished ? null : { done: done, total: total };
      var el = $('#posterProgress');
      if (el) el.textContent = finished ? 'gotovo' : (done + ' / ' + total);
      if (finished) { render(); toast('Posteri povučeni.'); }
    }, includeFailed);
  }

  function bulkIds(ids, on) {
    var keys = [];
    ids.forEach(function (id) {
      var i = BY_ID[id]; if (!i) return;
      if (i.type === 'serija' && i.episodes) allEps(i).forEach(function (e) { keys.push(id + '#' + e); });
      else keys.push(id);
    });
    markUnits(keys, on, 'library');   // masovno oznacavanje ne dira nedeljni plan
  }

  function bulkSelected(on) {
    var ids = Object.keys(selected).filter(function (k) { return selected[k]; });
    if (!ids.length) { toast('Nisi izabrao ništa.'); return; }
    bulkIds(ids, on);
    selectMode = false; selected = {};
    toast(ids.length + (on ? ' označeno.' : ' skinuto.'));
  }

  /* ============================================================
     DOGADJAJI
     ============================================================ */

  function bindEvents() {
    document.addEventListener('click', function (ev) {
      var n = ev.target.closest('[data-act]');
      if (n && ACTIONS[n.dataset.act]) {
        ev.preventDefault();
        ACTIONS[n.dataset.act](n);
        return;
      }
      // klik van sheet-a zatvara modal
      var ov = ev.target.closest('.overlay');
      if (ov && ev.target === ov && ov.id === 'modal') closeModal();
    });

    $('#tabbar').addEventListener('click', function (ev) {
      var b = ev.target.closest('.tab');
      if (!b) return;
      if (tab !== b.dataset.tab) {
        if (tab === 'danas') history.pushState({ mm: 'tab' }, '');
        tab = b.dataset.tab;
        if (tab === 'ocene') loadReviews(false);
        window.scrollTo(0, 0);
        render();
      }
    });

    // pretraga (bez re-rendera koji gubi fokus)
    document.addEventListener('input', function (ev) {
      if (ev.target.id === 'q') {
        lib.q = ev.target.value;
        var pos = ev.target.selectionStart;
        render();
        var q = $('#q');
        if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (e) {} }
      }
    });
    document.addEventListener('change', function (ev) {
      if (ev.target.id === 'profName' || ev.target.id === 'profAvatar') {
        var isName = ev.target.id === 'profName';
        var v = ev.target.value.trim().slice(0, isName ? 40 : 400);
        Store.mutate(function (st) { if (isName) st.displayName = v; else st.avatar = v; });
        toast('Sačuvano.');
      }
      if (ev.target.dataset && ev.target.dataset.act === 'plan') {
        var t = ev.target.dataset.val, on = ev.target.checked;
        Store.mutate(function (s) {
          if (on && s.plans.indexOf(t) === -1) s.plans.push(t);
          if (!on) s.plans = s.plans.filter(function (p) { return p !== t; });
        });
      }
    });
    // dugi pritisak -> visestruki izbor u Biblioteci
    var lpTimer = null;
    document.addEventListener('pointerdown', function (ev) {
      var card = ev.target.closest('.mcard');
      if (!card || tab !== 'biblioteka') return;
      lpTimer = setTimeout(function () {
        selectMode = true;
        selected[card.dataset.id] = true;
        if (navigator.vibrate) navigator.vibrate(15);
        render();
      }, 500);
    });
    ['pointerup', 'pointercancel', 'pointermove', 'scroll'].forEach(function (e) {
      document.addEventListener(e, function () { clearTimeout(lpTimer); }, true);
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeModal();
    });

    window.addEventListener('popstate', function () {
      var m = $('#modal');
      if (m && !m.classList.contains('hidden')) { closeModal(true); return; }
      // Nije modal - ako nisi na pocetnom tabu, "nazad" te vraca tamo.
      if (tab !== 'danas') {
        tab = 'danas';
        history.pushState({ mm: 'tab' }, '');
        window.scrollTo(0, 0);
        render();
      }
    });

    // Topbar je providan preko heroja, a postaje pun cim se skroluje.
    // IntersectionObserver umesto scroll listenera: ne okida na svaki piksel
    // i ne zavisi od toga koji element je scroll kontejner.
    var bar = $('#topbar');
    var sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none';
    document.body.appendChild(sentinel);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        bar.classList.toggle('scrolled', !entries[0].isIntersecting);
      }, { threshold: 0 }).observe(sentinel);
    } else {
      window.addEventListener('scroll', function () {
        bar.classList.toggle('scrolled', window.scrollY > 24);
      }, { passive: true });
    }
  }

  /* ---------------- sync indikator ---------------- */

  function bindStatus() {
    Store.onStatus(function (s) {
      var pill = $('#syncPill');
      pill.className = 'sync-pill s-' + s;
      pill.querySelector('.sync-label').textContent = ({
        local: 'lokalno', connecting: 'povezujem…', online: 'sync', offline: 'offline', error: 'greška'
      })[s] || s;
      var t = $('#syncStatusTxt');
      if (t) t.textContent = statusText();
      var u = $('#syncPill .sync-label');
      if (u && Store.username()) u.textContent = Store.username();
    });
  }

  /* ---------------- dnevna notifikacija ---------------- */

  function maybeDailyNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    var today = todayISO();
    if (localStorage.getItem('mm-last-notif') === today) return;

    var week = PLAN.weeks[PLAN.currentWeek - 1];
    var days = P.splitWeekIntoDays(week, state(), new Date());
    var d = days.filter(function (x) { return x.isToday; })[0];
    if (!d || !d.entries || !d.entries.length) return;

    var body = d.entries.map(function (e) { return e.label; }).join(' + ');
    localStorage.setItem('mm-last-notif', today);

    var opts = { body: hStr(d.minutes) + ' danas', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'mm-daily' };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(function (reg) {
        reg.showNotification('Danas: ' + body, opts);
      }).catch(function () { try { new Notification('Danas: ' + body, opts); } catch (e) {} });
    } else {
      try { new Notification('Danas: ' + body, opts); } catch (e) {}
    }
  }

  /**
   * Service worker + automatsko preuzimanje nove verzije.
   *
   * GitHub Pages salje `Cache-Control: max-age=600` i za sam sw.js, pa
   * browser do 10 minuta servira STARI service worker iz HTTP kesa i
   * novi deploy jednostavno ne stigne. `updateViaCache:'none'` tera
   * browser da sw.js uvek povuce sa mreze.
   *
   * Kad novi SW preuzme kontrolu, stranica se osvezi jednom - tako se
   * nova verzija vidi pri sledecem otvaranju app-a, bez rucnog brisanja.
   */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    var hadController = !!navigator.serviceWorker.controller;
    var reloaded = false;

    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController) return;   // prva instalacija - nema sta da se osvezava
      if (reloaded) return;
      reloaded = true;
      location.reload();
    });

    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then(function (reg) { reg.update(); })
      .catch(function (e) { console.warn('SW:', e); });
  }

  /* ============================================================
     START
     ============================================================ */

  function start() {
    fetch('data.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .catch(function (e) {
        // Samo ovde je data.json stvarno kriv. Ranije je isti catch
        // hvatao i greske iz pokretanja, pa je poruka umela da laze.
        $('#view').innerHTML = '<section class="card warn"><h2>Ne mogu da učitam listu</h2>' +
          '<p class="note">Proveri vezu i osveži. Ako radiš lokalno, pokreni preko servera ' +
          '(<code>python -m http.server</code>), ne duplim klikom na fajl.</p></section>';
        console.error('[data.json]', e);
        throw e;
      })
      .then(function (data) {
        ITEMS = data;
        ITEMS.forEach(function (i) { BY_ID[i.id] = i; });
        ORD = P.ordinals(ITEMS);

        Store.init();
        Store.onChange(function () { refresh(); });
        Store.onAuth(function (u) {
          if (u) {
            hideOnboarding();
            loadReviews(true);
            // Ime biras ti - ne preuzima se sa Google naloga, pa ga
            // trazimo jednom, odmah posle prve prijave.
            if (!state().displayName) setTimeout(askName, 700);
          }
          render();
        });
        bindStatus();
        bindEvents();
        refresh();

        if (!Store.hasSeenOnboarding() && !Store.uid()) showOnboarding();
        maybeDailyNotification();

        // Posteri se povlace tiho u pozadini, malo posle starta da ne
        // uspore prvo crtanje.
        setTimeout(function () { startPosterFetch(false); }, 1200);
        setTimeout(function () { loadReviews(true); }, 2000);
        setTimeout(function () {
          var h = idleHours();
          if (h >= 24) fireWarning(h);
          writeWarnMeta();
          registerPeriodicCheck();
        }, 2500);

        registerSW();
      })
      .catch(function (e) {
        // Greska u pokretanju posle ucitavanja - prijavi je, ali ne brisi
        // ekran, jer je app najcesce upotrebljiv.
        console.error('[start]', e);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  MM.App = { refresh: refresh };
})();
