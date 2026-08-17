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
  var calendarScrolled = false;
  var modalItemId = null;       // koji naslov je trenutno otvoren u modalu
  var modalSource = 'library';  // odakle je modal otvoren ('plan' | 'library')
  var posterJob = null;         // {done,total} dok se povlace posteri
  var ORD = {};                 // id -> redni broj u redosledu gledanja (#1, #2…)
  var PACE_EVERY = 5;           // posle koliko oznacenih ide provera tempa

  var lib = {
    type: 'sve',                // sve | film | serija
    tiers: {},                  // must/good/skip/bonus -> true
    status: 'sve',              // sve | odgledano | neodgledano
    sub: false,                 // "imam pretplatu"
    q: '',
    sort: 'release'             // release | chrono | phase
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
  }

  function render() {
    var y = window.scrollY;
    var view = $('#view');
    view.innerHTML = ({
      danas: viewDanas, kalendar: viewKalendar, biblioteka: viewBiblioteka, ja: viewJa
    })[tab]();
    view.dataset.tab = tab;

    if (tab === 'kalendar' && !calendarScrolled) {
      var cur = $('.cell.today') || $('.month');
      if (cur) cur.scrollIntoView({ block: 'center' });
      calendarScrolled = true;
    } else {
      window.scrollTo(0, y);
    }

    if (tab === 'danas') bindDeck();

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
      '<span class="dpill"><b>' + dd + '</b> dana do Doomsdaya</span>' +
      '<span class="dcount">' + watchedTitles + '<i>/' + ITEMS.length + '</i></span>' +
      '</div>';

    if (!deck.length) {
      out += deckDoneHTML();
    } else if ((s.deckSince || 0) >= PACE_EVERY) {
      // Posle svakih PACE_EVERY oznacenih ubaci provеru tempa u sam spil.
      out += paceCardHTML(st, s);
    } else {
      out += deckCardHTML(deck, s);
    }

    out += '</section>';

    /* --- tanka traka: dokle si ove nedelje --- */
    var doneMin = week.doneMinutes, totalMin = week.doneMinutes + week.plannedMinutes;
    out += '<section class="card weekstrip">' +
      '<div class="card-head">' +
        '<div><h2>Nedelja ' + week.n + '</h2><div class="sub">' + P.fmtRange(week.start, week.end) + '</div></div>' +
        '<div class="hours"><b>' + hStr(doneMin) + '</b> / ' + hStr(totalMin) + '</div>' +
      '</div>' +
      progressBar(doneMin, totalMin, 'green') +
      '<div class="tempo-line tempo-' + st.tempo + '">' +
        '<span class="dot"></span>' + st.perWeekHours.toFixed(1) + 'h nedeljno do finala' +
      '</div>' +
      '</section>';

    return out;
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
    Store.mutate(function (s) { s.deckSince = (s.deckSince || 0) + 1; });
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
     EKRAN 2: KALENDAR
     ============================================================ */

  var MONTH_NAMES = ['januar', 'februar', 'mart', 'april', 'maj', 'jun',
    'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
  var DOW = ['P', 'U', 'S', 'Č', 'P', 'S', 'N'];

  /**
   * Mapa: "2026-08-17" -> {entries, minutes, week}
   * Nedeljni plan se deli na dane, pa se dani spljoste u jednu mapu
   * da bi kalendar mogao da crta mesec po mesec.
   */
  function buildDayMap() {
    var s = state(), map = {};
    PLAN.weeks.forEach(function (w) {
      P.splitWeekIntoDays(w, s, new Date()).forEach(function (d) {
        map[d.iso] = {
          week: w.n, minutes: d.minutes, units: d.units,
          entries: d.entries || [], skipped: d.skipped
        };
      });
    });
    return map;
  }

  function viewKalendar() {
    var s = state();
    var map = buildDayMap();
    var today = P.startOfDay(new Date());
    var out = '';

    out += '<div class="cal-top">' +
      '<button class="btn small" data-act="export-ics">Izvezi .ics</button>' +
      '<span class="cal-note">za podsetnike u Google / Samsung kalendaru</span>' +
      '</div>';

    if (PLAN.warning) {
      out += '<section class="card warn"><p class="note">' + esc(PLAN.warning.text) + '</p></section>';
    }

    // Maraton ide od avgusta do decembra 2026.
    for (var m = 7; m <= 11; m++) out += monthHTML(2026, m, map, today);

    out += '<p class="foot">Tapni dan da vidiš šta pada na njega.</p>';
    return out;
  }

  function monthHTML(year, month, map, today) {
    var first = new Date(year, month, 1);
    var startCol = (first.getDay() + 6) % 7;          // ponedeljak = 0
    var days = new Date(year, month + 1, 0).getDate();

    var out = '<section class="month">' +
      '<h2 class="month-name">' + MONTH_NAMES[month] + ' <i>' + year + '</i></h2>' +
      '<div class="dow">';
    DOW.forEach(function (d) { out += '<span>' + d + '</span>'; });
    out += '</div><div class="mgrid">';

    for (var i = 0; i < startCol; i++) out += '<div class="cell blank"></div>';

    for (var d = 1; d <= days; d++) {
      var date = new Date(year, month, d);
      var iso = P.iso(date);
      var info = map[iso];
      var isToday = P.daysBetween(date, today) === 0;
      var isPast = date < today;
      var isDoom = (month === 11 && d === 18);

      var cls = 'cell';
      if (isToday) cls += ' today';
      if (isPast) cls += ' past';
      if (isDoom) cls += ' doom';
      if (info && info.minutes > 0) cls += ' has';
      if (info && info.skipped) cls += ' skipped';

      out += '<div class="' + cls + '" data-act="day" data-iso="' + iso + '">';

      // Poster prve stavke tog dana kao pozadina celije.
      if (info && info.units.length) {
        var pu = posterUrl(info.units[0].item);
        if (pu) out += '<img class="cell-bg" src="' + esc(pu) + '" alt="" loading="lazy">';
      }
      out += '<span class="cell-d">' + d + '</span>';
      if (isDoom) out += '<span class="cell-doom">🎬</span>';
      else if (info && info.units.length > 1) {
        // Brojka samo kad ima vise od jedne stavke - inace je bedz na
        // skoro svakom danu i mreza deluje bucno.
        out += '<span class="cell-n">' + info.units.length + '</span>';
      }
      out += '</div>';
    }

    out += '</div></section>';
    return out;
  }

  /** Sadržaj jednog dana u modalu. */
  function openDay(iso) {
    var map = buildDayMap();
    var info = map[iso];
    var parts = iso.split('-');
    var date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var naslov = date.getDate() + '. ' + MONTH_NAMES[date.getMonth()];

    var html = '<div class="sheet"><div class="sheet-body day-sheet">' +
      '<button class="close" data-act="close" aria-label="Zatvori">✕</button>' +
      '<h2>' + esc(naslov) + '</h2>' +
      '<div class="sub">' + (info ? 'Nedelja ' + info.week + ' · ' + hStr(info.minutes) : 'van maratona') + '</div>';

    if (!info || !info.entries.length) {
      html += '<p class="empty">Ništa ne pada na ovaj dan.</p>';
    } else {
      html += '<div class="rows">';
      info.entries.forEach(function (e) { html += rowEntry(e, false); });
      html += '</div>';
    }
    if (info) {
      html += '<button class="btn ghost" data-act="cap" data-week="' + info.week + '">' +
        'Koliko imam vremena u nedelji ' + info.week + '?</button>';
    }
    html += '</div></div>';
    showModal(html);
  }

  /* ============================================================
     EKRAN 3: BIBLIOTEKA
     ============================================================ */

  function libraryItems() {
    var s = state();
    var arr = ITEMS.slice();

    if (lib.type !== 'sve') {
      arr = arr.filter(function (i) {
        return lib.type === 'film' ? (i.type === 'film' || i.type === 'special') : i.type === 'serija';
      });
    }
    var tiers = Object.keys(lib.tiers).filter(function (k) { return lib.tiers[k]; });
    if (tiers.length) arr = arr.filter(function (i) { return tiers.indexOf(i.priority) !== -1; });

    if (lib.status !== 'sve') {
      arr = arr.filter(function (i) {
        var f = P.isFullyWatched(i, s);
        return lib.status === 'odgledano' ? f : !f;
      });
    }
    if (lib.sub) {
      arr = arr.filter(function (i) {
        var p = platformOf(i);
        return p === 'netflix' || p === 'hbo';
      });
    }
    if (lib.q) {
      var q = lib.q.toLowerCase();
      arr = arr.filter(function (i) { return i.title.toLowerCase().indexOf(q) !== -1; });
    }

    arr.sort(function (a, b) {
      if (lib.sort === 'chrono') return a.chronoOrder - b.chronoOrder;
      if (lib.sort === 'phase') return (a.phase - b.phase) || (a.releaseOrder - b.releaseOrder);
      return a.releaseOrder - b.releaseOrder;
    });
    return arr;
  }

  function chip(label, act, val, on) {
    return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-act="' + act + '" data-val="' + esc(val) + '">' + esc(label) + '</button>';
  }

  function viewBiblioteka() {
    var s = state();
    var arr = libraryItems();
    var out = '';

    // Cipovi u dve horizontalne trake koje se skroluju - na telefonu su
    // ranije prelamali u 4 reda i pojeli pola ekrana.
    out += '<section class="filters">' +
      '<input id="q" class="search" type="search" placeholder="Pretraga po naslovu…" value="' + esc(lib.q) + '">' +
      '<div class="chips scroll">' +
        chip('Sve', 'f-type', 'sve', lib.type === 'sve') +
        chip('Filmovi', 'f-type', 'film', lib.type === 'film') +
        chip('Serije', 'f-type', 'serija', lib.type === 'serija') +
        '<span class="chip-sep"></span>' +
        chip('Must', 'f-tier', 'must', !!lib.tiers.must) +
        chip('Good', 'f-tier', 'good', !!lib.tiers.good) +
        chip('Skip', 'f-tier', 'skip', !!lib.tiers.skip) +
        chip('Bonus', 'f-tier', 'bonus', !!lib.tiers.bonus) +
      '</div>' +
      '<div class="chips scroll">' +
        chip('Neodgledano', 'f-status', 'neodgledano', lib.status === 'neodgledano') +
        chip('Odgledano', 'f-status', 'odgledano', lib.status === 'odgledano') +
        chip('Imam pretplatu', 'f-sub', '1', lib.sub) +
        '<span class="chip-sep"></span>' +
        chip('Po izlasku', 'f-sort', 'release', lib.sort === 'release') +
        chip('Hronološki', 'f-sort', 'chrono', lib.sort === 'chrono') +
        chip('Po fazama', 'f-sort', 'phase', lib.sort === 'phase') +
      '</div>' +
      '<div class="count">' + arr.length + ' naslova' + (lib.sub ? ' · po tvom izboru platforme' : '') + '</div>' +
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
          '<span class="b tier ' + i.priority + '">' + TIER_LABEL[i.priority] + '</span>' +
          (i.type !== 'film' ? '<span class="b type ' + i.type + '">' + TYPE_LABEL[i.type] + '</span>' : '') +
        '</div>' +
        chk(full, 'item', 'data-id="' + esc(i.id) + '"', i.id) +
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
     EKRAN 4: JA
     ============================================================ */

  var PHASE_NAME = { 0: 'Fox / Bonus', 1: 'Faza 1', 2: 'Faza 2', 3: 'Faza 3', 4: 'Faza 4', 5: 'Faza 5', 6: 'Faza 6' };

  function viewJa() {
    var s = state();
    var st = P.stats(ITEMS, s, PLAN, new Date());
    var out = '';

    /* --- tempo --- */
    out += '<section class="card">' +
      '<h2>Tempo</h2>' +
      '<label class="slider-row"><span>Podrazumevano sati nedeljno</span><b id="capVal">' + s.defaultCapacity + 'h</b></label>' +
      '<input id="capSlider" type="range" min="2" max="25" step="1" value="' + s.defaultCapacity + '">' +
      '<p class="note small">Pojedinačnu nedelju podešavaš olovkom u Kalendaru.</p>' +
      '</section>';

    /* --- tierovi --- */
    out += '<section class="card"><h2>Šta gledam</h2><div class="checks">';
    [['must', 'Must — kičma priče'], ['good', 'Good — vredi'], ['skip', 'Skip — može se preskočiti'], ['bonus', 'Bonus — Fox X-Men/Deadpool']].forEach(function (t) {
      var on = s.plans.indexOf(t[0]) !== -1;
      var mins = P.tierMinutes(ITEMS, s, t[0]);
      out += '<label class="check' + (on ? ' on' : '') + '">' +
        '<input type="checkbox" data-act="plan" data-val="' + t[0] + '"' + (on ? ' checked' : '') + '>' +
        '<span>' + esc(t[1]) + '</span><em>' + hStr(mins) + ' preostalo</em></label>';
    });
    out += '</div></section>';

    /* --- statistika --- */
    out += '<section class="card">' +
      '<h2>Statistika</h2>' +
      '<div class="stat-big"><b>' + hStr(st.watchedMinutes) + '</b> / ' + hStr(st.totalMinutes) + ' <span>· ' + st.percent + '%</span></div>' +
      progressBar(st.watchedMinutes, st.totalMinutes, 'green') +
      '<div class="stat-grid">' +
        '<div><b>' + st.watchedTitles + '/' + st.titles + '</b><span>naslova</span></div>' +
        '<div><b>' + st.films + '</b><span>filmova/specijala</span></div>' +
        '<div><b>' + st.series + '</b><span>serija</span></div>' +
      '</div>' +
      '<h3>Po fazama</h3>';
    st.phases.forEach(function (p) {
      out += '<div class="phase"><div class="phase-head"><span>' + (PHASE_NAME[p.phase] || ('Faza ' + p.phase)) + '</span>' +
        '<em>' + p.done + '/' + p.count + '</em></div>' + progressBar(p.watched, p.total, 'red') + '</div>';
    });
    out += '</section>';

    /* --- posteri --- */
    var miss = MM.Posters.missing(ITEMS, s, false).length;
    var have = ITEMS.filter(function (i) { return !!MM.Posters.urlFor(i, s); }).length;
    out += '<section class="card"><h2>Posteri</h2>' +
      '<div class="stat-big"><b>' + have + '</b> / ' + ITEMS.length + ' <span>naslova ima poster</span></div>' +
      progressBar(have, ITEMS.length, 'red') +
      '<p class="note small">Povlače se automatski: serije sa TVMaze, filmovi sa Wikipedije. Bez ključa i bez naloga. Jednom nađen poster se pamti i sinhronizuje, pa telefon ne traži ponovo.</p>' +
      '<button class="btn ghost" data-act="fetch-posters">' +
        (MM.Posters.isRunning() ? 'Radi… <span id="posterProgress"></span>' : 'Povuci postere' + (miss ? ' (' + miss + ' fali)' : ' — probaj i one koje nije našao')) +
      '</button></section>';

    /* --- brze oznake --- */
    out += '<section class="card"><h2>Brzo označavanje</h2>' +
      '<p class="note small">Ako si dosta toga već video, ovde skratiš posao. U Biblioteci: dugi pritisak na karticu → višestruki izbor. Ovo <b>ne dira nedeljni plan</b> — samo skida naslove sa spiska.</p>' +
      '<div class="btn-row">' +
        '<button class="btn ghost" data-act="bulk-spidey">Svi Spider-Man filmovi</button>' +
        '<button class="btn ghost" data-act="bulk-phase" data-val="1">Cela Faza 1</button>' +
        '<button class="btn ghost" data-act="bulk-phase" data-val="2">Cela Faza 2</button>' +
        '<button class="btn ghost" data-act="bulk-phase" data-val="3">Cela Faza 3</button>' +
      '</div></section>';

    /* --- notifikacije --- */
    var perm = ('Notification' in window) ? Notification.permission : 'unsupported';
    out += '<section class="card"><h2>Notifikacije</h2>' +
      '<p class="note">Zakazane notifikacije kad je app zatvoren traže server (push), pa ih zamenjuje kalendar — uvezi .ics jednom i Google te podseća.</p>' +
      '<p class="note small">U samoj aplikaciji: kad je otvoriš, jednom dnevno ti prikaže „Danas: …". Ništa više od toga ne obećavamo.</p>' +
      (perm === 'granted'
        ? '<div class="ok-line">✓ dozvola data</div>'
        : (perm === 'unsupported'
          ? '<div class="note small">Ovaj browser ne podržava notifikacije.</div>'
          : '<button class="btn ghost" data-act="ask-notif">Dozvoli notifikacije u aplikaciji</button>')) +
      '</section>';

    /* --- sync --- */
    var code = Store.code();
    out += '<section class="card"><h2>Sinhronizacija</h2>' +
      '<label class="field"><span>Kod za sinhronizaciju</span>' +
      '<input id="syncCode" type="text" placeholder="npr. kosta-marvel-7f3a" value="' + esc(code) + '"></label>' +
      '<p class="note small">Isti kod unesi i na telefonu i na laptopu — to je sve. Status: <b id="syncStatusTxt">' + esc(statusText()) + '</b></p>' +
      '<div class="btn-row">' +
        '<button class="btn" data-act="save-code">Sačuvaj kod i poveži</button>' +
        '<button class="btn ghost" data-act="sync-now">Sinhronizuj sada</button>' +
      '</div>' +
      '<div class="btn-row">' +
        '<button class="btn ghost" data-act="export-json">Export JSON</button>' +
        '<button class="btn ghost" data-act="import-json">Import JSON</button>' +
      '</div>' +
      '<p class="note small">Bez Firebase-a sve radi normalno, samo lokalno — Export/Import je ručni prenos.</p>' +
      '</section>';

    /* --- reset --- */
    out += '<section class="card"><h2>Opasna zona</h2>' +
      '<button class="btn danger" data-act="reset">Resetuj napredak</button></section>';

    out += '<p class="foot">Marvel Maraton · bez reklama, bez trackera. Podaci o platformama u data.json su samo pretpostavka — tvoj izbor u modalu je merodavan.</p>';

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
    var pf = platformOf(i);
    var link = (s.links && s.links[id]) || '';
    var myPoster = (s.myPosters && s.myPosters[id]) || '';

    var html = '<div class="sheet">' +
      '<div class="sheet-hero art">' +
        '<div class="sheet-bg">' + artHTML(i) + '</div>' +
        '<div class="sheet-fade"></div>' +
        '<button class="close" data-act="close" aria-label="Zatvori">✕</button>' +
        '<div class="sheet-head">' +
          '<h2>' + esc(i.title) + '</h2>' +
          '<div class="sheet-meta">' +
            '<span class="b num">#' + (ORD[i.id] || 0) + '</span>' +
            '<span class="b tier ' + i.priority + '">' + TIER_LABEL[i.priority] + '</span>' +
            '<span class="b type ' + i.type + '">' + TYPE_LABEL[i.type] + '</span>' +
            '<span>' + i.year + '</span><span>' + (PHASE_NAME[i.phase] || '') + '</span>' +
            '<span>' + i.runtime + ' min' + (i.episodes ? ' · ' + i.episodes + ' ep' : '') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="sheet-body">' +
      (i.note ? '<p class="note">' + esc(i.note) + '</p>' : '');

    if (i.type === 'serija' && i.episodes) {
      html += '<div class="ep-head"><h3>Epizode</h3><button class="btn small ghost" data-act="item" data-id="' + esc(id) + '">' +
        (full ? 'Skini sve' : 'Označi sve') + '</button></div><div class="eps">';
      for (var e = 1; e <= i.episodes; e++) {
        var on = seen.indexOf(e) !== -1;
        html += '<button type="button" class="ep' + (on ? ' on' : '') + '" data-act="ep" data-id="' + esc(id) + '" data-ep="' + e + '">' + e + '</button>';
      }
      html += '</div>';
    } else {
      html += '<button class="btn' + (full ? ' ghost' : '') + '" data-act="item" data-id="' + esc(id) + '">' +
        (full ? 'Skini oznaku „odgledano"' : 'Označi kao odgledano') + '</button>';
    }

    html += '<label class="field"><span>Moj link</span>' +
      '<div class="field-row"><input id="myLink" type="url" placeholder="https://…" value="' + esc(link) + '">' +
      '<button class="btn small" data-act="open-link" data-id="' + esc(id) + '">Otvori</button></div></label>';

    html += '<label class="field"><span>Platforma (tvoj podatak, ne naš)</span><select id="pfSel" data-id="' + esc(id) + '">';
    [['netflix', 'Netflix'], ['hbo', 'HBO Max'], ['disney', 'Disney+'], ['other', 'Ostalo'], ['link', 'Imam link'], ['check', 'Nisam proverio'], ['bioskop', 'Bioskop']].forEach(function (o) {
      html += '<option value="' + o[0] + '"' + (pf === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
    });
    html += '</select></label>';

    html += '<button class="btn ghost" data-act="justwatch" data-id="' + esc(id) + '">Gde gledati u Srbiji?</button>' +
      '<p class="note small">Otvara JustWatch pretragu. Ako ti ta adresa ne radi, <a href="https://www.justwatch.com/rs/search?q=' +
      encodeURIComponent(i.title) + '" target="_blank" rel="noopener">probaj ovu</a>.</p>';

    // Poster: automatski se povlaci sa interneta, ali sme da se pregazi rucno.
    html += '<label class="field"><span>Poster (URL) — prazno = automatski</span>' +
      '<div class="field-row"><input id="myPoster" type="url" placeholder="https://…/poster.jpg" value="' + esc(myPoster) + '">' +
      '<button class="btn small ghost" data-act="reposter" data-id="' + esc(id) + '">Nađi</button></div></label>' +
      '<p class="note small">„Nađi" traži poster na internetu (TVMaze za serije, Wikipedia za filmove).</p>';

    html += '</div></div>';
    showModal(html);
    modalItemId = id;
    modalSource = source || 'library';
  }

  function showModal(html) {
    var m = $('#modal');
    m.innerHTML = html;
    m.classList.remove('hidden');
    document.body.classList.add('locked');
  }
  function closeModal() {
    $('#modal').classList.add('hidden');
    $('#modal').innerHTML = '';
    modalItemId = null;
    document.body.classList.remove('locked');
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
    var suggested = 'maraton-' + Math.random().toString(16).slice(2, 6);
    o.innerHTML = '<div class="sheet">' +
      '<h2>Marvel Maraton</h2>' +
      '<p class="note">Ceo MCU do <b>18.12.2026</b>. Plan se sam preračunava — ništa ne moraš da nameštaš ručno.</p>' +
      '<label class="field"><span>Kod za sinhronizaciju (opciono)</span>' +
      '<input id="obCode" type="text" placeholder="' + suggested + '"></label>' +
      '<p class="note small">Isti kod na telefonu i laptopu = ista lista. Ostavi prazno ako ti treba samo na ovom uređaju — sve radi i bez toga.</p>' +
      '<div class="btn-row"><button class="btn" data-act="ob-save">Kreni</button>' +
      '<button class="btn ghost" data-act="ob-skip">Samo lokalno</button></div></div>';
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
        s.deckSince = 0;
      });
      toast('Skip tier izbačen iz plana.');
    },
    'raise-tempo': function (n) {
      var v = Math.min(25, parseInt(n.dataset.val, 10));
      Store.mutate(function (s) { s.defaultCapacity = v; s.deckSince = 0; });
      toast('Tempo: ' + v + 'h nedeljno.');
    },

    'cap': function (n) { openCapacity(parseInt(n.dataset.week, 10)); },
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
    'f-tier': function (n) { lib.tiers[n.dataset.val] = !lib.tiers[n.dataset.val]; render(); },
    'f-status': function (n) { lib.status = (lib.status === n.dataset.val) ? 'sve' : n.dataset.val; render(); },
    'f-sub': function () { lib.sub = !lib.sub; render(); },
    'f-sort': function (n) { lib.sort = n.dataset.val; render(); },

    'sel-watched': function () { bulkSelected(true); },
    'sel-unwatched': function () { bulkSelected(false); },
    'sel-cancel': function () { selectMode = false; selected = {}; render(); },

    'bulk-spidey': function () {
      var ids = ITEMS.filter(function (i) {
        return i.type === 'film' && /spider-man/i.test(i.title);
      }).map(function (i) { return i.id; });
      bulkIds(ids, true);
      toast(ids.length + ' Spider-Man filmova označeno.');
    },
    'bulk-phase': function (n) {
      var ph = parseInt(n.dataset.val, 10);
      var ids = ITEMS.filter(function (i) { return i.phase === ph; }).map(function (i) { return i.id; });
      bulkIds(ids, true);
      toast('Faza ' + ph + ' označena (' + ids.length + ' naslova).');
    },

    'ask-notif': function () {
      if (!('Notification' in window)) return;
      Notification.requestPermission().then(function () { render(); maybeDailyNotification(); });
    },

    'save-code': function () {
      var v = normalizeCode($('#syncCode').value);
      if (!v) { toast('Kod: 8-64 znaka, mala slova, cifre i crtice.'); return; }
      Store.connect(v).then(function () { render(); });
      toast('Kod sačuvan: ' + v);
    },
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

    'open-link': function (n) {
      var v = ($('#myLink').value || '').trim();
      var id = n.dataset.id;
      Store.mutate(function (s) { if (v) s.links[id] = v; else delete s.links[id]; });
      if (v) window.open(v, '_blank', 'noopener');
      else toast('Nalepi link pa probaj ponovo.');
    },
    'day': function (n) { openDay(n.dataset.iso); },

    'pace-ok': function () {
      Store.mutate(function (s) { s.deckSince = 0; });
    },

    'play': function (n) {
      var v = (state().links || {})[n.dataset.id];
      if (v) window.open(v, '_blank', 'noopener');
    },

    'reposter': function (n) {
      var id = n.dataset.id, item = BY_ID[id];
      n.textContent = '…';
      MM.Posters.findOne(item).then(function (url) {
        n.textContent = 'Nađi';
        if (!url) { toast('Nije nađen poster za „' + item.title + '".'); return; }
        Store.mutate(function (s) { s.posters[id] = url; delete s.myPosters[id]; });
        var inp = $('#myPoster'); if (inp) inp.value = '';
        var bg = $('#modal .sheet-bg'); if (bg) bg.innerHTML = artHTML(item);
        toast('Poster povučen.');
      });
    },

    'fetch-posters': function () {
      if (MM.Posters.isRunning()) { toast('Već radi…'); return; }
      startPosterFetch(true);
    },

    'justwatch': function (n) {
      var i = BY_ID[n.dataset.id];
      window.open('https://www.justwatch.com/rs/pretraga?q=' + encodeURIComponent(i.title), '_blank', 'noopener');
    },

    'ob-save': function () {
      var raw = ($('#obCode').value || '').trim();
      if (raw) {
        var v = normalizeCode(raw);
        if (!v) { toast('Kod: 8-64 znaka, mala slova, cifre i crtice.'); return; }
        Store.connect(v).then(render);
        toast('Kod: ' + v);
      }
      hideOnboarding();
    },
    'ob-skip': function () { hideOnboarding(); }
  };

  /**
   * Kod za sync mora da prezivi Firestore rules iz README-a:
   * mala slova/cifre/crtice, 8-64 znaka, ne pocinje crticom.
   * Vraca ocisceni kod ili '' ako ne valja.
   */
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

  function normalizeCode(raw) {
    var v = String(raw || '').trim().toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+/, '');
    return (v.length >= 8 && v.length <= 64) ? v : '';
  }

  /**
   * Odakle dolazi klik? Kvacica unutar reda nedeljnog plana broji se u nedelju;
   * sve iz Biblioteke (i modala otvorenog iz nje) samo skida naslov sa spiska.
   */
  function sourceOf(node) {
    if (node.closest('.row')) return 'plan';
    if (node.closest('#modal')) return modalSource || 'library';
    return 'library';
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
        tab = b.dataset.tab;
        if (tab === 'kalendar') calendarScrolled = false;
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
      if (ev.target.id === 'capSlider') {
        $('#capVal').textContent = ev.target.value + 'h';
      }
    });
    document.addEventListener('change', function (ev) {
      if (ev.target.id === 'capSlider') {
        var v = parseInt(ev.target.value, 10);
        Store.mutate(function (s) { s.defaultCapacity = v; });
      }
      if (ev.target.dataset && ev.target.dataset.act === 'plan') {
        var t = ev.target.dataset.val, on = ev.target.checked;
        Store.mutate(function (s) {
          if (on && s.plans.indexOf(t) === -1) s.plans.push(t);
          if (!on) s.plans = s.plans.filter(function (p) { return p !== t; });
        });
      }
      if (ev.target.id === 'pfSel') {
        var id = ev.target.dataset.id, val = ev.target.value;
        Store.mutate(function (s) { s.platforms[id] = val; });
        toast('Platforma sačuvana.');
      }
    });
    // rucno unet poster se cuva na blur
    document.addEventListener('blur', function (ev) {
      if (ev.target.id === 'myPoster') {
        var pid = modalItemId, pv = ev.target.value.trim();
        if (!pid) return;
        if (((state().myPosters || {})[pid] || '') === pv) return;
        Store.mutate(function (s) { if (pv) s.myPosters[pid] = pv; else delete s.myPosters[pid]; });
        var bg = $('#modal .sheet-bg'); if (bg) bg.innerHTML = artHTML(BY_ID[pid]);
      }
    }, true);

    // link se cuva i na blur
    document.addEventListener('blur', function (ev) {
      if (ev.target.id === 'myLink') {
        var sheet = ev.target.closest('.sheet');
        var btn = sheet && sheet.querySelector('[data-act="open-link"]');
        if (!btn) return;
        var id = btn.dataset.id, v = ev.target.value.trim();
        if (((state().links || {})[id] || '') === v) return;  // nista se nije promenilo
        Store.mutate(function (s) { if (v) s.links[id] = v; else delete s.links[id]; });
      }
    }, true);

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
      .then(function (data) {
        ITEMS = data;
        ITEMS.forEach(function (i) { BY_ID[i.id] = i; });
        ORD = P.ordinals(ITEMS);

        Store.init();
        Store.onChange(function () { refresh(); });
        bindStatus();
        bindEvents();
        refresh();

        if (!Store.hasSeenOnboarding()) showOnboarding();
        maybeDailyNotification();

        // Posteri se povlace tiho u pozadini, malo posle starta da ne
        // uspore prvo crtanje.
        setTimeout(function () { startPosterFetch(false); }, 1200);

        registerSW();
      })
      .catch(function (e) {
        $('#view').innerHTML = '<section class="card warn"><h2>Ne mogu da učitam data.json</h2>' +
          '<p class="note">Pokreni sajt preko servera (npr. <code>python -m http.server</code>), ne otvaranjem fajla duplim klikom.</p></section>';
        console.error(e);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  MM.App = { refresh: refresh };
})();
