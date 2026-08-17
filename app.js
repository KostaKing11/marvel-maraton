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
      var cur = $('.week.is-current');
      if (cur) cur.scrollIntoView({ block: 'center' });
      calendarScrolled = true;
    } else {
      window.scrollTo(0, y);
    }

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
    var days = P.splitWeekIntoDays(week, s, new Date());
    var today = days.filter(function (d) { return d.isToday; })[0];
    var st = P.stats(ITEMS, s, PLAN, new Date());
    var dd = P.daysToDoomsday(new Date());

    var out = '';

    /* --- HERO: countdown + sledeci naslov na redu --- */
    var next = week.planned[0] || null;
    var nextItem = next ? next.item : BY_ID['avengers-doomsday'];
    var link = next ? ((s.links || {})[next.id] || '') : '';

    out += '<section class="hero art">' +
      '<div class="hero-bg">' + artHTML(nextItem) + '</div>' +
      '<div class="hero-fade"></div>' +
      '<div class="hero-in">' +
        '<div class="cd-label">DOOMSDAY ZA</div>' +
        '<div class="cd">' +
          '<span class="cd-num">' + dd + '</span>' +
          '<span class="cd-unit">dana</span>' +
        '</div>' +
        '<div class="cd-date">18.12.2026. · bioskop</div>';

    if (next) {
      out += '<div class="hero-kicker">Sledeće na redu</div>' +
        '<h1 class="hero-title">' + esc(next.label) + '</h1>' +
        '<div class="hero-meta">' + TYPE_LABEL[next.type] + ' · ' + next.minutes + ' min · Nedelja ' + week.n + '</div>' +
        '<div class="hero-btns">';
      if (link) {
        out += '<button class="btn play" data-act="play" data-id="' + esc(next.id) + '">▶ Pusti</button>' +
          '<button class="btn ghost" data-act="entry" data-keys="' + esc(next.keys.join(',')) + '">Odgledano</button>';
      } else {
        out += '<button class="btn play" data-act="entry" data-keys="' + esc(next.keys.join(',')) + '">✓ Odgledano</button>' +
          '<button class="btn ghost" data-act="open" data-id="' + esc(next.id) + '">Detalji</button>';
      }
      out += '</div>';
    } else {
      out += '<div class="hero-kicker">Ova nedelja je čista</div>' +
        '<h1 class="hero-title">Nemaš šta da gledaš</h1>' +
        '<div class="hero-meta">Sve iz plana je odgledano.</div>';
    }
    out += '</div></section>';

    /* --- ove nedelje --- */
    var doneMin = week.doneMinutes;
    var totalMin = week.doneMinutes + week.plannedMinutes;
    out += '<section class="card">' +
      '<div class="card-head">' +
        '<div><h2>Ove nedelje</h2><div class="sub">Nedelja ' + week.n + ' · ' + P.fmtRange(week.start, week.end) + '</div></div>' +
        '<div class="hours"><b>' + hStr(doneMin) + '</b> / ' + hStr(totalMin) + '</div>' +
      '</div>' +
      progressBar(doneMin, totalMin, 'green');

    if (!week.planned.length && !week.doneEntries.length) {
      out += '<p class="empty">Ove nedelje nema ničega u planu. Ili si sve odgledao, ili je kapacitet 0h.</p>';
    } else {
      out += '<div class="rows">';
      week.planned.forEach(function (e) { out += rowEntry(e, false); });
      week.doneEntries.forEach(function (e) { out += rowEntry(e, true); });
      out += '</div>';
    }
    out += '</section>';

    /* --- danas --- */
    var dName = today ? (P.DAY_NAMES[(today.date.getDay() + 6) % 7] + ' ' + P.fmtDate(today.date)) : '';
    out += '<section class="card">' +
      '<div class="card-head"><div><h2>Danas</h2><div class="sub">' + esc(dName) + '</div></div>' +
      (today ? '<div class="hours"><b>' + hStr(today.minutes) + '</b></div>' : '') + '</div>';

    if (!today) {
      out += '<p class="empty">Maraton još nije počeo — kreće 17.08.2026.</p>';
    } else if (today.skipped) {
      out += '<p class="empty">Danas je slobodan dan. Ono što je palo na danas je prebačeno na ostatak nedelje.</p>' +
        '<button class="btn ghost" data-act="unskip-today">Ipak imam vremena</button>';
    } else if (!today.entries.length) {
      out += '<p class="empty">Danas ti ništa ne pada. Uživaj.</p>';
    } else {
      out += '<div class="rows">';
      today.entries.forEach(function (e) { out += rowEntry(e, false); });
      out += '</div>' +
        '<button class="btn ghost" data-act="skip-today">Nemam vremena danas</button>';
    }

    // sta je danas vec odgledano
    var doneToday = (week.doneUnits || []).filter(function (u) { return u.date === todayISO(); });
    if (doneToday.length) {
      out += '<div class="rows dim">';
      P.groupUnits(doneToday).forEach(function (e) { out += rowEntry(e, true); });
      out += '</div>';
    }
    out += '</section>';

    /* --- tempo --- */
    var tempoTxt = st.perWeekHours.toFixed(1) + 'h';
    out += '<section class="card tempo tempo-' + st.tempo + '">' +
      '<div class="card-head"><div><h2>Tempo</h2>' +
      '<div class="sub">' + hStr(PLAN.totalRemainingMinutes) + ' neodgledano · ' + st.weeksLeft + ' ' +
      (st.weeksLeft === 1 ? 'nedelja' : (st.weeksLeft < 5 ? 'nedelje' : 'nedelja')) + ' do finala</div></div>' +
      '<div class="tempo-num">' + tempoTxt + '<span>/ned</span></div></div>';

    if (st.tempo === 'ok') out += '<p class="note">Komotno. Ovako stižeš bez trke.</p>';
    else if (st.tempo === 'warn') out += '<p class="note">Ide, ali bez mnogo pauza.</p>';
    else out += '<p class="note">Ovo je puno. Vredi skratiti listu.</p>';

    if (st.tempo === 'hot') {
      var skipH = h(P.tierMinutes(ITEMS, s, 'skip'));
      if (s.plans.indexOf('skip') !== -1 && skipH > 0) {
        out += '<button class="btn" data-act="drop-skip">Izbaci „skip" naslove (-' + skipH.toFixed(1) + 'h)</button>';
      }
    }
    out += '</section>';

    /* --- upozorenje o preklapanju --- */
    if (PLAN.warning) {
      out += '<section class="card warn">' +
        '<h2>Ovo ti neće stati</h2>' +
        '<p class="note">' + esc(PLAN.warning.text) + '</p>' +
        '<div class="btn-row">';
      if (s.plans.indexOf('skip') !== -1 && PLAN.warning.skipHours > 0) {
        out += '<button class="btn ghost" data-act="drop-skip">Izbaci skip (-' + PLAN.warning.skipHours.toFixed(1) + 'h)</button>';
      }
      out += '<button class="btn ghost" data-act="raise-tempo" data-val="' + PLAN.warning.neededPerWeek + '">Digni tempo na ' + PLAN.warning.neededPerWeek + 'h</button>' +
        '</div></section>';
    }

    return out;
  }

  /* ============================================================
     EKRAN 2: KALENDAR
     ============================================================ */

  function viewKalendar() {
    var s = state();
    var out = '';

    out += '<section class="card">' +
      '<button class="btn" data-act="export-ics">Izvezi u kalendar (.ics)</button>' +
      '<p class="note small">Skini fajl i uvezi ga u Google Kalendar (Podešavanja → Uvoz) — tek tako dobijaš prave notifikacije na telefonu.</p>' +
      '</section>';

    if (PLAN.warning) {
      out += '<section class="card warn"><p class="note">' + esc(PLAN.warning.text) + '</p></section>';
    }

    PLAN.weeks.forEach(function (w) {
      var tags = [];
      if (w.n <= 2) tags.push('<span class="tag">raspust</span>');
      if (w.n === P.TOTAL_WEEKS) tags.push('<span class="tag finale">FINALE 🎬</span>');
      if (w.current) tags.push('<span class="tag now">sad</span>');

      var totalMin = w.plannedMinutes + w.doneMinutes;
      out += '<section class="card week' + (w.current ? ' is-current' : '') + (w.past ? ' is-past' : '') + '">' +
        '<div class="week-head">' +
          '<div class="week-id"><b>N' + w.n + '</b><span>' + P.fmtRange(w.start, w.end) + '</span></div>' +
          '<div class="week-tags">' + tags.join('') + '</div>' +
          '<div class="week-hours">' + hStr(totalMin) + '</div>' +
          '<button class="icon-btn" data-act="cap" data-week="' + w.n + '" title="Kapacitet ove nedelje">' +
            '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>' +
          '</button>' +
        '</div>';

      if (P.capacityFor(s, w.n) !== s.defaultCapacity) {
        out += '<div class="cap-note">kapacitet: ' + P.capacityFor(s, w.n) + 'h (podešeno ručno)</div>';
      }

      if (w.past && !w.doneEntries.length) {
        out += '<p class="empty">Prošlo. Ništa se ne planira unazad.</p>';
      } else if (!w.planned.length && !w.doneEntries.length && !w.pinned.length) {
        out += '<p class="empty">Slobodna nedelja.</p>';
      } else {
        out += '<div class="rows">';
        w.planned.forEach(function (e) { out += rowEntry(e, false); });
        w.doneEntries.forEach(function (e) { out += rowEntry(e, true); });
        w.pinned.forEach(function (i) {
          var done = P.isFullyWatched(i, s);
          out += '<div class="row pinned' + (done ? ' is-done' : '') + '">' +
            thumbHTML(i) +
            '<div class="row-main" data-act="open" data-id="' + esc(i.id) + '">' +
              '<div class="row-title">★ ' + esc(i.title) + '</div>' +
              '<div class="row-meta">fiksno · ' + i.runtime + ' min</div>' +
            '</div>' +
            chk(done, 'item', 'data-id="' + esc(i.id) + '"', i.id) +
            '</div>';
        });
        out += '</div>';
      }
      out += '</section>';
    });

    return out;
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
      Store.mutate(function (s) { s.plans = s.plans.filter(function (p) { return p !== 'skip'; }); });
      toast('Skip tier izbačen iz plana.');
    },
    'raise-tempo': function (n) {
      var v = parseInt(n.dataset.val, 10);
      Store.mutate(function (s) { s.defaultCapacity = Math.min(25, v); });
      toast('Tempo: ' + Math.min(25, v) + 'h nedeljno.');
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

  /* ============================================================
     START
     ============================================================ */

  function start() {
    fetch('data.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        ITEMS = data;
        ITEMS.forEach(function (i) { BY_ID[i.id] = i; });

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

        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('sw.js').catch(function (e) { console.warn('SW:', e); });
        }
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
