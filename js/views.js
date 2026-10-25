/* ============================================================
   views.js  -  svi ekrani i listovi kao HTML (crta ih morph)
   ------------------------------------------------------------
   Svaka funkcija dobija ctx = { s, plan, prog, streak, ui, user }
   i vraca string. Nema stanja ovde - sve sto ekran "pamti" (tab,
   filteri, izabrani dan) je u ctx.ui, a podaci u Store-u.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI, Cat = MM.Cat, P = MM.Plan;
  var esc = UI.esc, hm = UI.hm;

  var TYPE = { film: 'Film', serija: 'Serija', special: 'Specijal' };
  var PLATFORMS = [
    ['disney', 'Disney+'], ['netflix', 'Netflix'], ['prime', 'Prime Video'], ['hbo', 'HBO Max'],
    ['bioskop', 'Bioskop'], ['link', 'Imam link'], ['other', 'Drugo'], ['check', 'Ne znam']
  ];
  var PLATFORM_NAME = {};
  PLATFORMS.forEach(function (p) { PLATFORM_NAME[p[0]] = p[1]; });

  /* ============================================================
     sitni delovi
     ============================================================ */

  var ICON = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 16.6L4.9 12.3l-1.4 1.4 5.7 5.7L20.6 8l-1.4-1.4z"/></svg>',
    undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5 8c-2.6 0-5 1-6.9 2.6L2 7v9h9l-3.6-3.6A8 8 0 0120.1 16l2.3-.8A10.5 10.5 0 0012.5 8z"/></svg>',
    skip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18l8.5-6L5 6v12zm9-12v12h2V6h-2z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.3 6.7l1.4-1.4 6.7 6.7-6.7 6.7-1.4-1.4 5.3-5.3z"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.7l-1.4-1.4L6.6 12l6.7 6.7 1.4-1.4L9.4 12z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3a7 7 0 015.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1110 3zm0 2a5 5 0 100 10 5 5 0 000-10z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v2h6V2h2v2h2.5A1.5 1.5 0 0121 5.5v14a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 19.5v-14A1.5 1.5 0 014.5 4H7V2zm-2 8v9h14v-9H5z"/></svg>',
    star: '★',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>',
    flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 1.7s.8 2.8.8 5.1c0 2.2-1.4 4-3.6 4s-3.8-1.8-3.8-4l.03-.4C4.8 9.1 3.5 12.4 3.5 16a8.5 8.5 0 0017 0c0-5.7-2.7-10.8-7-14.3zM12 20.5c-1.8 0-3.2-1.4-3.2-3.1 0-1.6 1-2.8 2.8-3.1 1.8-.4 3.6-1.2 4.6-2.6.4 1.3.6 2.7.6 4.1 0 2.6-2.1 4.7-4.8 4.7z"/></svg>',
    filter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v2H3zm3 6h12v2H6zm4 6h4v2h-4z"/></svg>',
    pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c-5 0-9.3 3.1-11 7.5C2.7 16.9 7 20 12 20s9.3-3.1 11-7.5C21.3 8.1 17 5 12 5zm0 12.5a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>'
  };

  function tier(item, small) {
    var t = Cat.TIERS[item.doom];
    return '<span class="tier t-' + item.doom + (small ? ' sm' : '') + '">' + t.short + '</span>';
  }
  function d15(item) {
    return item.d15 ? '<span class="d15" title="Na zvaničnoj Disney+ listi">D+ LISTA</span>' : '';
  }
  function colTag(item) {
    var c = Cat.col(item.col);
    return '<span class="coltag c-' + item.col + '">' + esc(c ? c.name : item.col) + '</span>';
  }
  function ck(on, keys, extra) {
    return '<button type="button" class="ck' + (on ? ' on' : '') + '" data-a="toggle" data-keys="' + esc(keys.join(',')) + '"' +
      (extra || '') + ' aria-label="' + (on ? 'Poništi' : 'Odgledano') + '">' + ICON.check + '</button>';
  }
  function bar(pct, cls) {
    pct = Math.max(0, Math.min(100, pct));
    return '<div class="pbar ' + (cls || '') + '"><i style="width:' + pct.toFixed(1) + '%"></i></div>';
  }
  function avatar(name, photo, cls) {
    return photo
      ? '<img class="av ' + (cls || '') + '" src="' + esc(photo) + '" alt="" referrerpolicy="no-referrer" draggable="false">'
      : '<span class="av ' + (cls || '') + '">' + esc((name || '?').slice(0, 1).toUpperCase()) + '</span>';
  }
  function stars(n) {
    var o = '<span class="stars">';
    for (var i = 1; i <= 5; i++) o += '<i class="' + (i <= n ? 'on' : '') + '">★</i>';
    return o + '</span>';
  }

  /** Red sa naslovom (grupa jedinica). */
  function row(g, opts) {
    opts = opts || {};
    var it = g.item;
    var done = opts.done != null ? opts.done : g.allWatched;
    var sub = [];
    if (g.epLabel) sub.push(g.epLabel);
    sub.push(hm(g.min));
    if (opts.when) sub.push(opts.when);
    return '<div class="row' + (done ? ' done' : '') + '" data-k="r-' + esc(g.keys.join('-')) + (opts.kp || '') + '">' +
      '<button type="button" class="row-art" data-a="item" data-id="' + esc(it.id) + '">' + UI.poster(it, 'thumb') + '</button>' +
      '<button type="button" class="row-main" data-a="item" data-id="' + esc(it.id) + '">' +
        '<span class="row-t">' + esc(Cat.cleanTitle(it)) + '</span>' +
        '<span class="row-s">' + (opts.noTier ? '' : tier(it, true)) + '<em>' + esc(sub.join(' · ')) + '</em></span>' +
      '</button>' +
      (opts.noCheck ? '' : ck(done, g.keys, ' data-src="plan"')) +
      '</div>';
  }

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  function nNaslov(n) { return n + ' ' + plural(n, 'naslov', 'naslova', 'naslova'); }
  function nDan(n) { return n + ' ' + plural(n, 'dan', 'dana', 'dana'); }

  /* ============================================================
     DANAS
     ============================================================ */

  function countdownParts() {
    var diff = Math.max(0, P.parse(P.DOOMSDAY_ISO).getTime() - Date.now());
    var sec = Math.floor(diff / 1000);
    return { d: Math.floor(sec / 86400), h: Math.floor(sec / 3600) % 24, m: Math.floor(sec / 60) % 60, s: sec % 60 };
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clock() { var c = countdownParts(); return pad(c.h) + ':' + pad(c.m) + ':' + pad(c.s); }

  function streakChip(st) {
    var lvl = st.n >= 30 ? 'legend' : st.n >= 14 ? 'violet' : st.n >= 7 ? 'blue' : st.n >= 3 ? 'fire' : st.n ? 'ember' : 'dead';
    return '<button type="button" class="streak s-' + lvl + (st.n && !st.today ? ' pending' : '') + '" data-a="streak">' +
      ICON.flame + '<b>' + st.n + '</b></button>';
  }

  /** Svi na putu: ti prvi, pa ekipa iz profila. */
  function crew(ctx) {
    var me = ctx.user && ctx.user.uid;
    var out = [{ me: true, name: ctx.s.displayName || 'Ti', photo: ctx.s.avatar, ratio: ctx.prog.ratio, label: 'TI' }];
    MM.Reviews.people().forEach(function (p) {
      if (me && p.uid === me) return;
      out.push({ me: false, name: p.name, photo: p.photo, ratio: Math.min(1, (p.percent || 0) / 100),
        label: (p.name || '?').split(' ')[0].slice(0, 10) });
    });
    return out;
  }

  /** Mini mapa na pocetnom ekranu: iste slike kao velika mapa, put, Doom, ti i ekipa. */
  function roadMini(ctx, time) {
    var ppl = crew(ctx), me = ppl[0];
    function pos(r) { return (Math.max(0, Math.min(1, r)) * 100).toFixed(1) + '%'; }
    var out = '<div class="rm" data-a="doom" role="button" aria-label="Otvori mapu puta do Doomsdaya">' +
      '<span class="rm-chip">MAPA ›</span>' +
      '<img class="rm-start" src="img/map/start.webp" alt="" draggable="false">' +
      '<img class="rm-goal" src="img/map/goal.webp" alt="" draggable="false">' +
      '<div class="rm-road"><i class="rm-done" style="width:' + pos(time) + '"></i>';
    ppl.slice(1).forEach(function (p, i) {
      out += '<span class="rm-p" data-k="rmp' + i + '" style="left:' + pos(p.ratio) + '">' + avatar(p.name, p.photo, 'rm-av') + '</span>';
    });
    out += '<span class="rm-doom" style="left:' + pos(time) + '">' + MM.Doom.head(34) + '</span>' +
      '<span class="rm-p me' + (me.ratio >= time ? ' ahead' : '') + '" style="left:' + pos(me.ratio) + '">' + avatar(me.name, me.photo, 'rm-av') + '</span>' +
      '</div></div>';
    return out;
  }

  /** Odbrojavanje na sred ekrana (tap na dane). */
  function countdownSheet() {
    var c = countdownParts();
    var arrived = P.today() >= P.DOOMSDAY_ISO;
    function tile(id, v, l) { return '<div class="cdm-t"><b id="' + id + '">' + v + '</b><i>' + l + '</i></div>'; }
    return '<div class="cdm" data-a="sheet-close">' +
      '<div class="cdm-head">' + MM.Doom.head(64) + '</div>' +
      '<div class="cdm-k">' + (arrived ? 'DOOMSDAY JE STIGAO' : 'DO DOOMSDAYA') + '</div>' +
      '<div class="cdm-grid">' + tile('cdD', c.d, plural(c.d, 'dan', 'dana', 'dana')) + tile('cdH', pad(c.h), 'sati') +
        tile('cdM', pad(c.m), 'min') + tile('cdS', pad(c.s), 'sek') + '</div>' +
      '<p class="cdm-date"><b>Avengers: Doomsday</b><span>petak, 18. decembar · bioskop</span></p></div>';
  }

  function danas(ctx) {
    var s = ctx.s, plan = ctx.plan, prog = ctx.prog;
    var c = countdownParts();
    var time = P.timeRatio();
    var out = '';

    /* --- odbrojavanje + Doom traka --- */
    var arrived = P.today() >= P.DOOMSDAY_ISO;
    out += '<section class="hero" data-k="hero">' +
      '<div class="hero-top">' +
        '<button type="button" class="cd" data-a="countdown">' +
          '<span class="cd-k">' + (arrived ? 'DOOMSDAY JE STIGAO' : 'DO DOOMSDAYA') + '</span>' +
          '<span class="cd-d"><b>' + c.d + '</b><i>' + plural(c.d, 'dan', 'dana', 'dana') + '</i></span>' +
          (arrived ? '<span class="cd-c">vidimo se u bioskopu</span>' : '') +
        '</button>' +
        streakChip(ctx.streak) +
      '</div>' +
      roadMini(ctx, time) +
      '</section>';

    var idle = idleDays(s);
    if (idle >= 1 && plan.unitsLeft) {
      out += '<div class="alarm' + (idle >= 3 ? ' hard' : '') + '" data-k="alarm"><span class="alarm-dot"></span>' +
        '<span><b>' + (idle === 1 ? '24 sata' : nDan(idle)) + '</b> bez Marvela. Doom ne čeka.</span></div>';
    }

    /* --- na redu --- */
    if (!plan.unitsLeft) {
      out += doneCard(ctx);
    } else {
      out += deckCard(ctx);
    }

    /* --- danas --- */
    out += todayCard(ctx);

    /* --- sutra --- */
    var tmr = plan.byIso[P.addDays(plan.today, 1)];
    if (tmr && tmr.units.length) {
      out += '<section class="card" data-k="tmr"><div class="card-h"><h2>Sutra</h2><span class="muted">' + hm(tmr.minutes) + '</span></div>' +
        '<div class="rows">' + P.group(tmr.units).map(function (g) { return row(g); }).join('') + '</div></section>';
    }

    /* --- brojke --- */
    out += statsCard(ctx);
    return out;
  }

  function idleDays(s) {
    var t = s.lastWatchAt || 0;
    if (!t) return 0;
    return Math.floor((Date.now() - t) / 86400000);
  }

  function deckCard(ctx) {
    var plan = ctx.plan, u = plan.next;
    if (!u) return '';
    var it = u.item;
    var inToday = plan.todayDay.units.some(function (x) { return x.key === u.key; });
    var when = null;
    for (var i = 0; i < plan.days.length && !when; i++) {
      if (plan.days[i].units.some(function (x) { return x.key === u.key; })) when = plan.days[i].iso;
    }
    var label = inToday ? 'NA REDU'
      : plan.todayDay.off ? 'SLOBODAN DAN · AKO HOĆEŠ'
      : plan.doneToday > 0 ? 'DANAS GOTOVO · SLEDEĆE'
      : 'SLEDEĆE · ' + (when ? UI.dateLabel(when).toUpperCase() : 'USKORO');
    var avail = u.avail > plan.today;
    var sub = [it.year, TYPE[it.type] || ''];
    if (u.ep) sub.push('epizoda ' + u.ep + ' od ' + it.episodes);
    sub.push(hm(u.min));
    var nxt = plan.queue[1];
    return '<section class="deck" data-k="deck">' +
      '<div class="deck-k">' + esc(label) +
        '<span>#' + it.order + '</span></div>' +
      '<div class="dcard" id="dcard" data-a="item" data-id="' + esc(it.id) + '" role="button">' +
        '<div class="dcard-bg">' + UI.poster(it, 'bg') + '</div>' +
        '<div class="dcard-in">' +
          '<div class="dcard-art">' + UI.poster(it, 'big') + '</div>' +
          '<div class="dcard-txt">' +
            '<div class="dcard-badges">' + tier(it) + d15(it) + '</div>' +
            '<h1>' + esc(Cat.cleanTitle(it)) + '</h1>' +
            '<div class="dcard-sub">' + esc(sub.join(' · ')) + '</div>' +
            (it.note ? '<p class="dcard-note">' + esc(it.note) + '</p>' : '') +
            (avail ? '<p class="dcard-warn">Izlazi ' + esc(UI.dateLabel(u.avail)) + '</p>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="deck-act">' +
        '<button type="button" class="dbtn" data-a="deck-back" aria-label="Vrati prethodno">' + ICON.undo + '<span>Nazad</span></button>' +
        '<button type="button" class="dbtn main" data-a="deck-yes" data-key="' + esc(u.key) + '">' + ICON.check + '<span>Odgledano</span></button>' +
        '<button type="button" class="dbtn" data-a="deck-skip" data-id="' + esc(it.id) + '" aria-label="Preskoči naslov">' + ICON.skip + '<span>Preskoči</span></button>' +
      '</div>' +
      '</section>';
  }

  function doneCard(ctx) {
    var prog = ctx.prog;
    return '<section class="card win" data-k="win">' +
      '<div class="win-ic">🏁</div>' +
      '<h2>Sve iz plana je odgledano</h2>' +
      '<p class="muted">' + (prog.total ? 'Odgledao si ' + nNaslov(prog.watched) + '. ' : '') +
      'Ostaje ti bioskop 18.12. Ako hoćeš još — proširi plan.</p>' +
      '<button type="button" class="btn primary" data-a="tab" data-tab="ja" data-scroll="scope">Proširi plan</button>' +
      '</section>';
  }

  function todayCard(ctx) {
    var plan = ctx.plan, s = ctx.s;
    var day = plan.todayDay;
    var doneG = P.group(plan.doneTodayUnits.map(function (u) { return Object.assign({ watched: true }, u); }));
    var todoG = P.group(day.units);
    var goal = plan.mode === 'auto' ? plan.target : plan.pace.min;
    var doneMin = plan.doneToday;
    var pct = goal > 0 ? Math.min(100, doneMin / goal * 100) : 100;
    var out = '<section class="card today" data-k="today">' +
      '<div class="card-h"><h2>Danas</h2>' +
        '<span class="today-sum"><b>' + hm(doneMin) + '</b> / ' + hm(Math.max(goal, doneMin)) + '</span></div>' +
      bar(pct, doneMin >= goal - 1 && goal > 0 ? 'green' : 'red');

    if (day.off) {
      out += '<p class="muted pad">Danas je slobodan dan — plan je raspoređen na ostale dane.</p>' +
        (s.skipDays && s.skipDays[plan.today]
          ? '<button type="button" class="btn ghost sm" data-a="skip-day" data-iso="' + plan.today + '">Ipak gledam danas</button>' : '');
    }
    if (todoG.length || doneG.length) {
      out += '<div class="rows">' +
        todoG.map(function (g) { return row(g, { done: false }); }).join('') +
        doneG.map(function (g) { return row(g, { done: true, kp: '-d' }); }).join('') +
        '</div>';
    } else if (!day.off && plan.unitsLeft) {
      out += '<p class="muted pad">Za danas nema ničeg u planu.</p>';
    }
    if (!day.off && todoG.length) {
      out += '<button type="button" class="btn ghost sm" data-a="skip-day" data-iso="' + plan.today + '">Nemam vremena danas</button>';
    }
    if (!todoG.length && doneG.length) {
      out += '<p class="ok-line">✓ Danas si ispunio normu.</p>';
    }
    return out + '</section>';
  }

  function statsCard(ctx) {
    var plan = ctx.plan, prog = ctx.prog;
    var out = '<section class="card" data-k="stats"><div class="tiles">' +
      '<div class="tile"><b>' + prog.percent + '%</b><span>plana odgledano</span>' + bar(prog.percent, 'green') + '</div>' +
      '<div class="tile"><b>' + UI.hours(plan.remaining) + '</b><span>ostalo · ' + nNaslov(plan.titlesLeft) + '</span></div>' +
      '<div class="tile"><b>' + hm(plan.target) + '</b><span>' + (plan.mode === 'auto' ? 'dnevna norma' : 'tvoj tempo dnevno') + '</span></div>' +
      '<div class="tile"><b>' + (plan.finishIso ? esc(UI.dateLabel(plan.finishIso, { plain: true })) : '—') + '</b><span>završavaš</span></div>' +
      '</div>';
    out += warnings(ctx);
    out += '<button type="button" class="link-row" data-a="tab" data-tab="ja" data-scroll="scope"><span>Plan: <b>' +
      esc(scopeName(ctx.s)) + '</b></span>' + ICON.chev + '</button>';
    return out + '</section>';
  }

  function warnings(ctx) {
    var plan = ctx.plan;
    var out = '';
    if (plan.mustLate) {
      out += '<div class="callout red"><b>Obavezne ne stižeš do Doomsdaya.</b> Uz ovaj tempo poslednji obavezan naslov pada ' +
        esc(UI.dateLabel(plan.mustFinishIso, { plain: true })) + '.' +
        (ctx.s.mustFirst ? ' Pojačaj tempo ili suzi plan.' : '<div class="callout-act"><button type="button" class="btn sm" data-a="must-first">Gledaj obavezno prvo</button></div>') + '</div>';
    } else if (plan.late) {
      out += '<div class="callout amber"><b>Plan ide posle Doomsdaya</b> (do ' + esc(UI.dateLabel(plan.finishIso, { plain: true })) +
        '). Obavezno stižeš, ostalo gledaš posle bioskopa.</div>';
    }
    if (plan.heavy) {
      out += '<div class="callout amber"><b>' + hm(plan.target) + ' dnevno je mnogo.</b> Probaj „Doomsday+" ili fiksni tempo — ' +
        'plan će onda ići i posle 18.12.<div class="callout-act">' +
        '<button type="button" class="btn sm" data-a="preset" data-id="doomsday-plus">Doomsday+</button>' +
        '<button type="button" class="btn ghost sm" data-a="tab" data-tab="ja" data-scroll="pace">Tempo</button></div></div>';
    }
    return out;
  }

  function scopeName(s) {
    var sc = Cat.scopeOf(s);
    var id = Cat.presetIdOf(sc);
    var p = Cat.PRESETS.filter(function (x) { return x.id === id; })[0];
    if (p) return p.name;
    var cols = sc.cols.map(function (c) { return Cat.col(c).name; });
    return 'Prilagođeno: ' + cols.join(', ');
  }

  /* ============================================================
     PLAN (kalendar)
     ============================================================ */

  function planView(ctx) {
    var ui = ctx.ui.cal, plan = ctx.plan;
    var out = '<section class="plan-head" data-k="ph">' +
      '<div class="seg" role="tablist">' +
        '<button type="button" class="' + (ui.view === 'mesec' ? 'on' : '') + '" data-a="cal-view" data-v="mesec">Mesec</button>' +
        '<button type="button" class="' + (ui.view === 'lista' ? 'on' : '') + '" data-a="cal-view" data-v="lista">Dan po dan</button>' +
      '</div>' +
      '<div class="plan-info"><span><b>' + hm(plan.target) + '</b> dnevno</span>' +
        '<span>kraj <b>' + (plan.finishIso ? esc(UI.dateLabel(plan.finishIso, { plain: true })) : '—') + '</b></span>' +
        '<span><b>' + UI.hours(plan.remaining) + '</b> ostalo</span></div>' +
      '</section>';
    out += warnings(ctx);
    out += ui.view === 'lista' ? agenda(ctx) : month(ctx);
    out += planSettings(ctx);
    return out;
  }

  function month(ctx) {
    var ui = ctx.ui.cal, plan = ctx.plan, s = ctx.s;
    var ym = ui.month.split('-'), y = +ym[0], m = +ym[1] - 1;
    var first = new Date(y, m, 1);
    var startCol = (first.getDay() + 6) % 7;
    var dim = new Date(y, m + 1, 0).getDate();
    var log = ctx.logByDay;
    var today = plan.today;

    var out = '<section class="card cal" data-k="cal">' +
      '<div class="cal-nav">' +
        '<button type="button" class="ib" data-a="cal-month" data-d="-1" aria-label="Prethodni mesec">' + ICON.chevL + '</button>' +
        '<h2>' + UI.MONTHS[m] + ' <i>' + y + '</i></h2>' +
        '<button type="button" class="ib" data-a="cal-month" data-d="1" aria-label="Sledeći mesec">' + ICON.chev + '</button>' +
      '</div>' +
      '<div class="dow">' + UI.DOW.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div>' +
      '<div class="grid" id="calGrid">';
    for (var i = 0; i < startCol; i++) out += '<span class="cell blank"></span>';
    for (var d = 1; d <= dim; d++) {
      var iso = P.iso(new Date(y, m, d));
      var info = plan.byIso[iso];
      var did = log[iso] || [];
      var cls = 'cell';
      var inner = '<span class="cn">' + d + '</span>';
      var bgItem = null;
      if (iso === today) cls += ' today';
      if (iso < today) {
        cls += ' past';
        if (did.length) { cls += ' did'; bgItem = did[0].item; inner += '<span class="cbadge ok">' + ICON.check + '</span>'; }
      } else if (info) {
        if (info.off) cls += ' off';
        if (info.units.length) {
          cls += ' has'; bgItem = info.units[0].item;
          inner += '<span class="cmin">' + hm(info.minutes) + '</span>';
        }
        if (iso === today && did.length) inner += '<span class="cbadge ok">' + ICON.check + '</span>';
      } else if (iso > today && P.isOffDay(s, iso)) {
        cls += ' off';
      }
      if (iso === P.DOOMSDAY_ISO) { cls += ' doom'; inner += '<span class="cdoom">' + MM.Doom.head(18) + '</span>'; }
      if (iso === ui.sel) cls += ' sel';
      out += '<button type="button" class="' + cls + '" data-a="cal-day" data-iso="' + iso + '" data-k="c' + iso + '">' +
        (bgItem ? '<span class="cbg">' + UI.poster(bgItem, 'cell') + '</span>' : '') + inner + '</button>';
    }
    out += '</div>' +
      '<div class="legend"><span><i class="lg has"></i>plan</span><span><i class="lg did"></i>odgledano</span><span><i class="lg off"></i>slobodno</span><span><i class="lg doom"></i>Doomsday</span></div>' +
      '</section>';
    out += dayDetail(ctx, ui.sel);
    return out;
  }

  function dayDetail(ctx, iso) {
    if (!iso) return '';
    var plan = ctx.plan, s = ctx.s;
    var info = plan.byIso[iso];
    var did = ctx.logByDay[iso] || [];
    var isPast = iso < plan.today;
    var title = UI.dayName(iso) + ', ' + UI.dateLabel(iso, { plain: true });
    var rel = UI.dateLabel(iso);
    if (rel === 'danas' || rel === 'sutra' || rel === 'juče') title = rel.charAt(0).toUpperCase() + rel.slice(1) + ' · ' + title;
    var out = '<section class="card day" data-k="day-' + iso + '">' +
      '<div class="card-h"><h2>' + esc(title) + '</h2>' +
      (info && info.units.length ? '<span class="muted">' + hm(info.minutes) + '</span>' : '') + '</div>';
    if (iso === P.DOOMSDAY_ISO) {
      out += '<div class="doom-day">' + MM.Doom.head(40) + '<div><b>Avengers: Doomsday</b><span>Bioskop. Ovo je cilj.</span></div></div>';
    }
    var rows = '';
    if (info && info.units.length) rows += P.group(info.units).map(function (g) { return row(g, { done: false }); }).join('');
    if (did.length) {
      rows += P.group(did.map(function (u) { return Object.assign({ watched: true }, u); }))
        .map(function (g) { return row(g, { done: true, kp: '-d' }); }).join('');
    }
    if (rows) out += '<div class="rows">' + rows + '</div>';
    else if (iso !== P.DOOMSDAY_ISO) out += '<p class="muted pad">' + (isPast ? 'Tog dana nisi ništa označio.' : (info && info.off ? 'Slobodan dan.' : 'Ništa nije u planu za taj dan.')) + '</p>';
    if (!isPast && iso < P.DOOMSDAY_ISO) {
      var weekOff = (s.offDays || []).indexOf(P.weekday(iso)) !== -1;
      if (weekOff) {
        out += '<p class="muted small">' + esc(UI.DOW_LONG[P.weekday(iso)]) + ' ti je uvek slobodan (podešavanje ispod).</p>';
      } else {
        var sk = !!(s.skipDays && s.skipDays[iso]);
        out += '<button type="button" class="btn ' + (sk ? 'primary' : 'ghost') + ' sm" data-a="skip-day" data-iso="' + iso + '">' +
          (sk ? 'Ipak gledam taj dan' : 'Taj dan nemam vremena') + '</button>';
      }
    }
    return out + '</section>';
  }

  function agenda(ctx) {
    var plan = ctx.plan;
    var days = plan.days.filter(function (d) { return d.units.length || d.isToday; }).slice(0, 45);
    if (!days.length) return '<section class="card" data-k="ag0"><p class="muted pad">Nema ničeg u planu.</p></section>';
    var out = '<section class="agenda" data-k="agenda">';
    var lastWeek = null;
    days.forEach(function (d) {
      var wk = P.addDays(d.iso, -P.weekday(d.iso));
      if (wk !== lastWeek) {
        lastWeek = wk;
        out += '<div class="ag-week">nedelja ' + esc(UI.dateLabel(wk, { plain: true })) + ' – ' + esc(UI.dateLabel(P.addDays(wk, 6), { plain: true })) + '</div>';
      }
      var lbl = UI.dateLabel(d.iso);
      out += '<div class="ag-day' + (d.isToday ? ' today' : '') + '" data-k="ag-' + d.iso + '">' +
        '<div class="ag-date"><b>' + P.parse(d.iso).getDate() + '</b><span>' + UI.DOW[P.weekday(d.iso)] + '</span></div>' +
        '<div class="ag-body"><div class="ag-h">' + esc(lbl === 'danas' || lbl === 'sutra' ? lbl : UI.dayName(d.iso)) +
          '<span>' + (d.off ? 'slobodno' : hm(d.minutes)) + '</span></div>' +
          (d.units.length ? '<div class="rows">' + P.group(d.units).map(function (g) { return row(g, { done: false }); }).join('') + '</div>'
            : '<p class="muted small">' + (d.off ? 'Slobodan dan.' : (plan.doneToday > 0 ? 'Danas je norma ispunjena.' : 'Danas pauza.')) + '</p>') +
        '</div></div>';
    });
    if (plan.days.length > 45) out += '<p class="muted center small">…i još ' + nDan(plan.days.length - 45) + ' do kraja plana.</p>';
    return out + '</section>';
  }

  function planSettings(ctx) {
    var s = ctx.s;
    var off = s.offDays || [];
    return '<section class="card" data-k="pset"><div class="card-h"><h2>Slobodni dani</h2></div>' +
      '<p class="muted small">Dani u nedelji kad ne gledaš. Norma se raspoređuje na ostale.</p>' +
      '<div class="chips wd">' + UI.DOW.map(function (d, i) {
        return '<button type="button" class="chip' + (off.indexOf(i) !== -1 ? ' on' : '') + '" data-a="offday" data-d="' + i + '">' + d + '</button>';
      }).join('') + '</div>' +
      '<div class="btn-row">' +
        '<button type="button" class="btn ghost sm" data-a="tab" data-tab="ja" data-scroll="pace">Tempo</button>' +
        '<button type="button" class="btn ghost sm" data-a="ics">' + ICON.cal + ' Izvezi u kalendar</button>' +
      '</div></section>';
  }

  /* ============================================================
     EKIPA
     ============================================================ */

  function ekipa(ctx) {
    var user = ctx.user;
    var out = '';
    if (!user) {
      return '<section class="card center" data-k="nologin"><div class="big-ic">👥</div><h2>Ekipa</h2>' +
        '<p class="muted">Prijavi se Google nalogom da vidiš dokle su ostali stigli i šta kažu o filmovima.</p>' +
        '<button type="button" class="btn primary" data-a="login">Prijavi se</button></section>';
    }
    var me = user.uid;
    var mineNow = ctx.prog;
    var time = P.timeRatio();
    var ppl = MM.Reviews.people().map(function (p) {
      return p.uid === me ? Object.assign({}, p, { watched: mineNow.watched, total: mineNow.total, percent: mineNow.percent,
        name: ctx.s.displayName || p.name, photo: ctx.s.avatar || p.photo, streak: ctx.streak.n }) : p;
    });
    if (!ppl.some(function (p) { return p.uid === me; })) {
      ppl.push({ uid: me, name: ctx.s.displayName || 'Ti', photo: ctx.s.avatar, watched: mineNow.watched, total: mineNow.total,
        percent: mineNow.percent, streak: ctx.streak.n });
    }
    ppl.sort(function (a, b) { return (b.percent || 0) - (a.percent || 0); });

    out += '<section class="card" data-k="lb"><div class="card-h"><h2>Dokle su stigli</h2></div><div class="people">';
    ppl.forEach(function (p, i) {
      var mine = p.uid === me;
      var ahead = (p.percent || 0) / 100 >= time;
      out += '<div class="person' + (mine ? ' me' : '') + '" data-k="pp-' + esc(p.uid) + '">' +
        '<span class="rank">' + (i + 1) + '</span>' + avatar(p.name, p.photo) +
        '<div class="pmain"><div class="pname">' + esc(p.name || 'Bez imena') + (mine ? ' <em>· ti</em>' : '') +
          (p.streak ? '<span class="pstreak">' + ICON.flame + p.streak + '</span>' : '') + '</div>' +
          '<div class="pbar2' + (ahead ? ' ahead' : '') + '"><i style="width:' + Math.min(100, p.percent || 0) + '%"></i>' +
            '<span class="ptick" style="left:' + (time * 100).toFixed(1) + '%"></span></div></div>' +
        '<div class="pnum"><b>' + (p.percent || 0) + '%</b><span>' + (p.watched || 0) + '/' + (p.total || 0) + '</span></div>' +
        '</div>';
    });
    out += '</div></section>';

    /* ocene */
    var all = MM.Reviews.cached().filter(function (r) { return Cat.get(r.itemId); });
    var rf = ctx.ui.rev;
    // ko je ocenjivao (ti prvi, ostali po imenu)
    var who = {};
    all.forEach(function (r) { if (!who[r.uid]) who[r.uid] = r.name || 'Bez imena'; });
    var uids = Object.keys(who).sort(function (a, b) { return a === me ? -1 : b === me ? 1 : who[a].localeCompare(who[b]); });
    var list = all.filter(function (r) { return rf.who === 'all' || r.uid === rf.who; });
    if (rf.sort === 'order') list.sort(function (a, b) { return Cat.get(a.itemId).order - Cat.get(b.itemId).order; });
    else if (rf.sort === 'chrono') list.sort(function (a, b) { return Cat.get(a.itemId).chrono - Cat.get(b.itemId).chrono; });
    else list.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    out += '<section class="card" data-k="revs"><div class="card-h"><h2>Šta kažu</h2><span class="muted">' + list.length + '</span></div>';
    if (all.length) {
      out += '<div class="ctabs rev-who-tabs">' + revTab('all', 'Svi', rf.who) +
        uids.map(function (u) { return revTab(u, u === me ? 'Moje' : who[u], rf.who); }).join('') + '</div>' +
        '<div class="tseg three">' +
          '<button type="button" class="' + (rf.sort === 'new' ? 'on' : '') + '" data-a="rev-sort" data-v="new">Najnovije</button>' +
          '<button type="button" class="' + (rf.sort === 'order' ? 'on' : '') + '" data-a="rev-sort" data-v="order">Po izlasku</button>' +
          '<button type="button" class="' + (rf.sort === 'chrono' ? 'on' : '') + '" data-a="rev-sort" data-v="chrono">Hronološki</button>' +
        '</div>';
    }
    if (!list.length) {
      out += '<p class="muted pad">' + (ctx.ui.reviewsLoading ? 'Učitavam…' : all.length ? 'Ovde još nema ocena.' : 'Još nema ocena. Označi nešto kao odgledano pa te pita.') + '</p>';
    } else {
      out += '<div class="revs">';
      list.forEach(function (r) {
        var it = Cat.get(r.itemId);
        if (!it) return;
        var mine = r.uid === me;
        out += '<div class="rev" data-k="rv-' + esc(r.itemId + r.uid) + '">' +
          '<button type="button" class="rev-art" data-a="item" data-id="' + esc(it.id) + '">' + UI.poster(it, 'thumb') + '</button>' +
          '<div class="rev-b"><div class="rev-top">' + stars(r.stars) + '<span>' + esc(r.name || 'Bez imena') + (mine ? ' · ti' : '') + '</span></div>' +
            '<div class="rev-t">#' + it.order + ' ' + esc(Cat.cleanTitle(it)) + '</div>' +
            (r.text ? '<p>' + esc(r.text) + '</p>' : '') + '</div>' +
          (mine ? '<button type="button" class="ib sm pen" data-a="rate" data-id="' + esc(it.id) + '" aria-label="Izmeni">' + ICON.pen + '</button>' : '') +
          '</div>';
      });
      out += '</div>';
    }
    return out + '</section>';
  }

  /* ============================================================
     KATALOG
     ============================================================ */

  function revTab(val, label, cur) {
    return '<button type="button" class="ctab' + (val === cur ? ' on' : '') + '" data-a="rev-who" data-v="' + esc(val) + '">' + esc(label) + '</button>';
  }

  function libFilter(ctx) {
    var f = ctx.ui.lib, s = ctx.s;
    var q = (f.q || '').trim().toLowerCase();
    return Cat.sorted(s).filter(function (it) {
      if (it.id === Cat.GOAL_ID) return false;
      if (f.col !== 'all' && it.col !== f.col) return false;
      if (f.tier !== 'all' && it.doom !== f.tier) return false;
      var done = P.isDone(it, s), started = P.watchedEps(it, s).length > 0;
      var skipped = !!(s.skipped && s.skipped[it.id]);
      if (f.status === 'todo' && (done || skipped)) return false;
      if (f.status === 'done' && !done) return false;
      if (f.status === 'plan' && !Cat.inPlan(it, s)) return false;
      if (f.status === 'skipped' && !skipped) return false;
      if (f.status === 'started' && (!started || done)) return false;
      if (q && (it.title + ' ' + it.year + ' ' + (it.note || '')).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function katalog(ctx) {
    var f = ctx.ui.lib, s = ctx.s;
    var list = libFilter(ctx);
    if (f.sort === 'order') {
      // naslovi iz tvog plana prvi, ostalo posle (oba dela u redosledu plana)
      list = list.filter(function (i) { return Cat.inPlan(i, s); }).concat(list.filter(function (i) { return !Cat.inPlan(i, s); }));
    }
    if (f.sort === 'chrono') list.sort(function (a, b) { return (a.chrono - b.chrono) || (a.order - b.order); });
    if (f.sort === 'release') list.sort(function (a, b) { return (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) || (a.order - b.order); });
    var mins = list.reduce(function (a, i) { return a + i.runtime; }, 0);

    var nf = (f.status !== 'all' ? 1 : 0) + (f.sort !== 'order' ? 1 : 0);
    var out = '<section class="lib-top" data-k="lt">' +
      '<div class="lib-row">' +
        '<label class="search">' + ICON.search + '<input id="libQ" type="search" placeholder="Traži naslov…" value="' + esc(f.q || '') + '" autocomplete="off" enterkeyhint="search">' +
          (f.q ? '<button type="button" class="ib sm" data-a="lib-clear" aria-label="Obriši">' + ICON.close + '</button>' : '') + '</label>' +
        '<button type="button" class="fbtn' + (nf ? ' on' : '') + '" data-a="lib-filters" aria-label="Filteri i redosled">' + ICON.filter +
          (nf ? '<i>' + nf + '</i>' : '') + '</button>' +
      '</div>' +
      '<div class="ctabs" role="tablist">' +
        ctab('all', 'Sve', f.col) +
        Cat.COLS.map(function (c) { return ctab(c.id, c.name, f.col); }).join('') +
      '</div>' +
      '<div class="tseg">' +
        tseg('all', 'Svi nivoi', f.tier) + tseg('must', 'Obavezno', f.tier) + tseg('good', 'Dobro', f.tier) + tseg('skip', 'Skip', f.tier) +
      '</div>' +
      '<div class="lib-sum"><span>' + nNaslov(list.length) + ' · ' + UI.hours(mins) + '</span>' +
        (f.status !== 'all' ? '<button type="button" class="fpill" data-a="lib-status-clear">' + esc(STATUS_NAME[f.status]) + ICON.close + '</button>' : '') +
        '<button type="button" class="fsort" data-a="lib-filters">' + esc(SORT_NAME[f.sort]) + ' ▾</button>' +
      '</div>' +
      '</section>';

    if (!list.length) {
      out += '<p class="muted center pad" data-k="empty">Ništa ne odgovara filterima.</p>';
    } else {
      out += '<section class="grid-p" data-k="grid">';
      list.forEach(function (it) { out += card(it, s, ctx.ui.lib.sel); });
      out += '</section>';
    }
    if (f.selecting) {
      var n = Object.keys(f.sel).length;
      out += '<div class="selbar" data-k="selbar"><div class="sb-h"><span><b>' + n + '</b> izabrano · tapni još postera</span>' +
        '<button type="button" class="ib sm" data-a="sel-cancel" aria-label="Otkaži">' + ICON.close + '</button></div>' +
        '<div class="sb-b">' +
        '<button type="button" class="btn sm primary" data-a="bulk" data-op="done">Odgledano</button>' +
        '<button type="button" class="btn sm ghost" data-a="bulk" data-op="undone">Nije</button>' +
        '<button type="button" class="btn sm ghost" data-a="bulk" data-op="skip">Preskoči</button>' +
        '<button type="button" class="btn sm ghost" data-a="bulk" data-op="add">U plan</button></div></div>';
    } else if (list.length) {
      out += '<p class="muted center small foot" data-k="hint">Drži prst na posteru za višestruki izbor.</p>';
    }
    return out;
  }

  var STATUS_NAME = { all: 'Sve', plan: 'U planu', todo: 'Neodgledano', started: 'Započeto', done: 'Odgledano', skipped: 'Preskočeno' };
  var SORT_NAME = { order: 'Moj plan prvo', chrono: 'Hronološki', release: 'Po izlasku' };

  function ctab(val, label, cur) {
    return '<button type="button" class="ctab' + (val === cur ? ' on' : '') + '" data-a="lib-col" data-v="' + val + '">' + esc(label) + '</button>';
  }
  function tseg(val, label, cur) {
    return '<button type="button" class="' + (val === cur ? 'on ' : '') + 'ts-' + val + '" data-a="lib-tier" data-v="' + val + '">' +
      (val !== 'all' ? '<i></i>' : '') + esc(label) + '</button>';
  }

  /** List sa statusom i redosledom kataloga. */
  function filterSheet(ctx) {
    var f = ctx.ui.lib;
    var out = '<div class="pad-sheet filters"><h2>Filteri</h2><h3>Prikaži</h3><div class="fgrid">';
    Object.keys(STATUS_NAME).forEach(function (k) {
      out += '<button type="button" class="chip' + (f.status === k ? ' on' : '') + '" data-a="lib-status-set" data-v="' + k + '">' + STATUS_NAME[k] + '</button>';
    });
    out += '</div><h3>Poređaj</h3><div class="fgrid">';
    Object.keys(SORT_NAME).forEach(function (k) {
      out += '<button type="button" class="chip' + (f.sort === k ? ' on' : '') + '" data-a="lib-sort" data-v="' + k + '">' + SORT_NAME[k] + '</button>';
    });
    out += '</div><div class="btn-row"><button type="button" class="btn ghost" data-a="lib-reset">Resetuj</button>' +
      '<button type="button" class="btn primary" data-a="sheet-close">Gotovo</button></div></div>';
    return out;
  }

  function chip(act, val, label, on, cls) {
    return '<button type="button" class="chip' + (on ? ' on' : '') + (cls ? ' ' + cls : '') + '" data-a="' + act + '" data-v="' + val + '">' + esc(label) + '</button>';
  }
  function opt(v, label, cur) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + label + '</option>'; }

  function card(it, s, sel) {
    var done = P.isDone(it, s);
    var seen = P.watchedEps(it, s).length;
    var inPlan = Cat.inPlan(it, s);
    var skipped = !!(s.skipped && s.skipped[it.id]);
    var cls = 'pc' + (done ? ' done' : '') + (!inPlan ? ' out' : '') + (sel && sel[it.id] ? ' sel' : '') + (it.doom === 'must' ? ' must' : '');
    return '<button type="button" class="' + cls + '" data-a="card" data-id="' + esc(it.id) + '" data-k="pc-' + esc(it.id) + '">' +
      UI.poster(it, 'pc-art') +
      '<span class="pc-top">' + tier(it, true) + (it.d15 ? '<span class="d15 sm">D+</span>' : '') + '</span>' +
      (done ? '<span class="pc-done">' + ICON.check + '</span>' : '') +
      (skipped ? '<span class="pc-skip">preskočeno</span>' : '') +
      (Cat.isSeries(it) && seen && !done ? '<span class="pc-prog"><i style="width:' + (seen / it.episodes * 100).toFixed(0) + '%"></i></span>' : '') +
      '<span class="pc-num">#' + it.order + '</span>' +
      '<span class="pc-sel">' + ICON.check + '</span>' +
      '</button>';
  }

  /* ============================================================
     JA
     ============================================================ */

  function ja(ctx) {
    var s = ctx.s, user = ctx.user;
    var out = '';

    /* nalog */
    out += '<section class="card acct" data-k="acct">';
    if (user) {
      var bad = ctx.syncStatus === 'error' || ctx.syncStatus === 'offline';
      out += '<div class="acct-row"><button type="button" class="av-edit" data-a="profile" aria-label="Izmeni sliku">' +
          avatar(s.displayName || user.email, s.avatar, 'lg') + '<span class="av-pen">' + ICON.pen + '</span></button>' +
        '<div class="acct-t"><b>' + esc(s.displayName || 'Postavi ime') + '</b><span>' + esc(user.email || '') + '</span>' +
        (bad ? '<span class="sync s-error">' + esc(ctx.syncText) + '</span>' : '') + '</div>' +
        '<button type="button" class="btn ghost sm" data-a="profile">Izmeni</button></div>';
    } else {
      out += '<div class="acct-row">' + avatar('?', '', 'lg') + '<div class="acct-t"><b>Nisi prijavljen</b><span>Lista je samo na ovom uređaju.</span></div></div>' +
        '<button type="button" class="btn primary" data-a="login">Prijavi se Google nalogom</button>';
    }
    out += '</section>';

    /* novo u aplikaciji - dok ne procitas */
    if (s.seenNews !== NEWS[0].id) {
      out += '<button type="button" class="card news-card" data-k="newscard" data-a="news">' +
        '<span class="nc-dot"></span><span class="nc-t"><em>NOVO · v' + esc(MM.VERSION) + '</em><b>' + esc(NEWS[0].title) + '</b>' +
        '<span>' + esc(NEWS[0].items[0].replace(/<[^>]+>/g, '').split(' — ')[0]) + ' i još ' + (NEWS[0].items.length - 1) + ' novosti</span></span>' +
        '<span class="nc-go">›</span></button>';
    }

    /* sta gledam */
    var sc = Cat.scopeOf(s);
    var cur = Cat.presetIdOf(sc);
    out += '<section class="card" id="scope" data-k="scope"><div class="card-h"><h2>Šta gledam</h2></div>' +
      '<p class="muted small">Biraš koliko duboko ideš. Odgledano se nikad ne briše — samo se menja šta je u planu.</p>' +
      '<div class="presets">';
    Cat.PRESETS.forEach(function (p) {
      var st = presetStats(p.id, s);
      out += '<button type="button" class="preset p-' + p.id + (cur === p.id ? ' on' : '') + '" data-a="preset" data-id="' + p.id + '">' +
        '<span class="pr-radio"></span>' +
        '<span class="pr-main"><b>' + esc(p.name) + '</b><em>' + esc(p.sub) + '</em><span>' + esc(p.desc) + '</span></span>' +
        '<span class="pr-num"><b>' + UI.hours(st.min) + '</b><i>' + nNaslov(st.n) + '</i></span></button>';
    });
    out += '<button type="button" class="preset p-custom' + (cur === 'custom' ? ' on' : '') + '" data-a="custom-open">' +
      '<span class="pr-radio"></span><span class="pr-main"><b>Prilagođeno</b><em>' + (cur === 'custom' ? esc(scopeName(s).replace('Prilagođeno: ', '')) : 'biraš kolekcije i nivoe') + '</em>' +
      '<span>Uključi tačno ono što hoćeš — npr. MCU + Netflix.</span></span>' + '<span class="pr-num">' + ICON.chev + '</span></button>';
    out += '</div>';
    var ex = Object.keys(s.extra || {}).filter(function (k) { return s.extra[k] && Cat.get(k); });
    var sk = Object.keys(s.skipped || {}).filter(function (k) { return s.skipped[k] && Cat.get(k); });
    if (ex.length || sk.length) {
      out += '<p class="muted small">' + (ex.length ? 'Ručno dodato: <b>' + ex.length + '</b>. ' : '') +
        (sk.length ? 'Preskočeno: <b>' + sk.length + '</b>. ' : '') +
        '<button type="button" class="linkish" data-a="lib-status-go" data-v="' + (sk.length ? 'skipped' : 'plan') + '">Pogledaj u katalogu</button></p>';
    }
    out += '</section>';

    /* tempo */
    var pace = P.paceOf(s);
    out += '<section class="card" id="pace" data-k="pace"><div class="card-h"><h2>Tempo</h2></div>' +
      '<div class="seg">' +
        '<button type="button" class="' + (pace.mode === 'auto' ? 'on' : '') + '" data-a="pace-mode" data-v="auto">Stigni do Doomsdaya</button>' +
        '<button type="button" class="' + (pace.mode === 'fixed' ? 'on' : '') + '" data-a="pace-mode" data-v="fixed">Moj tempo</button>' +
      '</div>';
    if (pace.mode === 'auto') {
      out += '<p class="muted small">Norma se računa sama: sve iz plana do 17.12. Sad je <b>' + hm(ctx.plan.target) + '</b> dnevno.</p>';
    } else {
      out += '<div class="slider"><input type="range" id="paceRange" min="30" max="360" step="15" value="' + pace.min + '">' +
        '<b id="paceVal">' + hm(pace.min) + '</b></div>' +
        '<p class="muted small">Plan se pravi po ovom tempu i ide i posle Doomsdaya ako treba. Kraj: <b>' +
        (ctx.plan.finishIso ? esc(UI.dateLabel(ctx.plan.finishIso, { plain: true })) : '—') + '</b>.</p>';
    }
    out += '<button type="button" class="tgl' + (s.mustFirst ? ' on' : '') + '" data-a="must-first">' +
      '<span class="sw"></span><span class="tg-t"><b>Obavezno prvo</b><em>Zeleni naslovi idu pre svega ostalog, da sigurno stigneš do 18.12. Ostalo gledaš posle.</em></span></button>';
    out += '</section>';

    /* redosled */
    var ord = Cat.orderOf(s);
    out += '<section class="card" data-k="order" id="ja-order"><div class="card-h"><h2>Redosled</h2></div><div class="radios">';
    Cat.ORDERS.forEach(function (o) {
      out += '<button type="button" class="radio' + (ord === o.id ? ' on' : '') + '" data-a="order" data-v="' + o.id + '">' +
        '<span class="pr-radio"></span><span><b>' + esc(o.name) + '</b><em>' + esc(o.desc) + '</em></span></button>';
    });
    out += '</div></section>';

    /* podsetnici */
    var perm = ('Notification' in window) ? Notification.permission : 'unsupported';
    out += '<section class="card" data-k="notif"><div class="card-h"><h2>Podsetnici</h2></div>' +
      '<p class="muted small">Najpouzdanije: izvezi plan u Google kalendar — svaki dan dobiješ događaj sa onim što je na redu i podsetnik u 19h.</p>' +
      '<div class="btn-row"><button type="button" class="btn ghost sm" data-a="ics">' + ICON.cal + ' Izvezi .ics</button>' +
      (perm === 'granted' ? '<span class="ok-line">✓ notifikacije uključene</span>'
        : perm === 'unsupported' ? '' : '<button type="button" class="btn ghost sm" data-a="notif">Uključi notifikacije</button>') +
      '</div></section>';

    /* posteri */
    var all = Cat.all();
    var have = all.filter(function (i) { return !!MM.Posters.urlFor(i, s); }).length;
    out += '<section class="card" data-k="post"><div class="card-h"><h2>Posteri</h2><span class="muted">' + have + ' / ' + all.length + '</span></div>' +
      bar(have / all.length * 100, 'red') +
      '<button type="button" class="btn ghost sm" data-a="posters">' + (ctx.ui.posterJob ? 'Tražim… ' + ctx.ui.posterJob : 'Povuci postere koji fale') + '</button></section>';

    /* podaci */
    out += '<section class="card" data-k="data"><div class="card-h"><h2>Podaci</h2></div>' +
      '<div class="btn-row">' +
        '<button type="button" class="btn ghost sm" data-a="export">Sačuvaj kopiju (JSON)</button>' +
        '<button type="button" class="btn ghost sm" data-a="import">Učitaj kopiju</button>' +
      '</div>' +
      (user ? '<div class="btn-row"><button type="button" class="btn ghost sm" data-a="sync-now">Sinhronizuj sad</button>' +
        '<button type="button" class="btn ghost sm" data-a="logout">Odjavi se</button></div>' : '') +
      '<div class="btn-row"><button type="button" class="btn danger sm" data-a="reset">Obriši sav napredak</button></div>' +
      '</section>';

    out += '<p class="ver" data-k="ver">Marvel Maraton <b>v' + MM.VERSION + '</b> · <button type="button" class="linkish" data-a="news">Šta je novo</button></p>';
    return out;
  }

  function presetStats(id, s) {
    var sc = Cat.presetScope(id);
    var n = 0, min = 0;
    Cat.all().forEach(function (i) {
      if (!Cat.matches(i, sc) || (s.skipped && s.skipped[i.id])) return;
      n++; min += i.runtime - P.watchedMinutes(i, s);
    });
    return { n: n, min: min };
  }

  /* ============================================================
     LISTOVI
     ============================================================ */

  function itemSheet(id, ctx) {
    var it = Cat.get(id);
    if (!it) return '<p class="pad">Nema naslova.</p>';
    var s = ctx.s, plan = ctx.plan;
    var done = P.isDone(it, s);
    var seen = P.watchedEps(it, s);
    var inPlan = Cat.inPlan(it, s);
    var skipped = !!(s.skipped && s.skipped[it.id]);
    var extra = !!(s.extra && s.extra[it.id]);
    var avg = MM.Reviews.avg(id), revs = MM.Reviews.forItem(id), mine = MM.Reviews.mine(id);
    var isGoal = it.id === Cat.GOAL_ID;

    var meta = [it.year, TYPE[it.type] || it.type, hm(it.runtime)];
    if (it.episodes) meta.push(it.episodes + ' ep');

    var out = '<div class="item">' +
      '<div class="item-hero"><div class="item-bg">' + UI.poster(it, 'bg') + '</div>' +
        '<button type="button" class="ib close" data-a="sheet-close" aria-label="Zatvori">' + ICON.close + '</button>' +
        '<div class="item-head">' + UI.poster(it, 'item-art') +
          '<div class="item-ht"><span class="item-num">#' + it.order + ' · ' + esc(Cat.col(it.col).full) + '</span>' +
            '<h2>' + esc(it.title) + '</h2>' +
            '<div class="item-meta">' + esc(meta.join(' · ')) + (avg ? ' · <b class="avg">★ ' + avg.toFixed(1) + '</b>' : '') + '</div>' +
            '<div class="item-badges">' + tier(it) + d15(it) + '</div></div></div></div>';

    out += '<div class="item-body">';
    if (it.note) out += '<p class="item-note">' + esc(it.note) + '</p>';
    out += '<p class="tier-why t-' + it.doom + '"><b>' + esc(Cat.TIERS[it.doom].name) + '.</b> ' + esc(Cat.TIERS[it.doom].desc) + '</p>';

    if (!isGoal) {
      /* status u planu */
      var when = null;
      if (inPlan && !done) {
        for (var i = 0; i < plan.days.length && !when; i++) {
          if (plan.days[i].units.some(function (u) { return u.id === id; })) when = plan.days[i].iso;
        }
      }
      if (skipped) {
        out += '<div class="status-line"><span>Preskočeno — nije u planu.</span><button type="button" class="btn sm" data-a="unskip" data-id="' + esc(id) + '">Vrati u plan</button></div>';
      } else if (!inPlan) {
        out += '<div class="status-line"><span>Nije u tvom planu.</span><button type="button" class="btn sm" data-a="extra" data-id="' + esc(id) + '">' + ICON.plus + ' Dodaj u plan</button></div>';
      } else if (when) {
        out += '<div class="status-line"><span>' + ICON.cal + ' U planu: <b>' + esc(UI.dateLabel(when)) + '</b>' +
          (UI.dateLabel(when) !== 'danas' && UI.dateLabel(when) !== 'sutra' ? ' (' + esc(UI.dayName(when)) + ')' : '') + '</span>' +
          (extra ? '<button type="button" class="btn ghost sm" data-a="unextra" data-id="' + esc(id) + '">Izbaci</button>' : '') + '</div>';
      }

      /* odgledano */
      if (Cat.isSeries(it)) {
        out += '<div class="eps-h"><h3>Epizode</h3><span class="muted">' + seen.length + ' / ' + it.episodes + '</span></div>' +
          bar(seen.length / it.episodes * 100, 'green') +
          '<div class="eps no-drag">';
        for (var e = 1; e <= it.episodes; e++) {
          var on = seen.indexOf(e) !== -1;
          var av = Cat.availFrom(it, e);
          var future = av > plan.today;
          out += '<button type="button" class="ep' + (on ? ' on' : '') + (future ? ' soon' : '') + '" data-a="ep" data-id="' + esc(id) + '" data-ep="' + e + '"' +
            (future ? ' title="izlazi ' + esc(UI.dateLabel(av)) + '"' : '') + '>' + e + '</button>';
        }
        out += '</div><p class="muted small">Drži prst na epizodi = označi sve do nje.</p>' +
          '<div class="btn-row">' +
          (done ? '<button type="button" class="btn ghost" data-a="item-toggle" data-id="' + esc(id) + '">Poništi sve</button>'
                : '<button type="button" class="btn primary" data-a="item-toggle" data-id="' + esc(id) + '">' + ICON.check + ' Cela sezona odgledana</button>') +
          '</div>';
      } else {
        out += '<button type="button" class="btn ' + (done ? 'ghost' : 'primary') + ' wide" data-a="item-toggle" data-id="' + esc(id) + '">' +
          (done ? '✓ Odgledano — poništi' : ICON.check + ' Označi kao odgledano') + '</button>';
      }
    }

    /* ocene */
    if (!isGoal) {
      out += '<div class="sec"><div class="eps-h"><h3>Ocene ekipe</h3>' + (avg ? '<span>' + stars(Math.round(avg)) + ' <b>' + avg.toFixed(1) + '</b> (' + revs.length + ')</span>' : '<span class="muted">još nema</span>') + '</div>';
      revs.slice(0, 6).forEach(function (r) {
        out += '<div class="rev-mini">' + stars(r.stars) + '<b>' + esc(r.name || 'Bez imena') + '</b>' + (r.text ? '<p>' + esc(r.text) + '</p>' : '') + '</div>';
      });
      if (ctx.user) out += '<button type="button" class="btn ghost sm" data-a="rate" data-id="' + esc(id) + '">' + (mine ? 'Izmeni svoju ocenu' : '★ Oceni') + '</button>';
      out += '</div>';
    }

    /* vise */
    out += '<details class="sec more no-drag"><summary>Još</summary>' +
      '<label class="field"><span>Poster (URL) — prazno = automatski</span><input type="url" id="posterIn" data-id="' + esc(id) + '" placeholder="https://…/poster.jpg" value="' + esc((s.myPosters && s.myPosters[id]) || '') + '"></label>' +
      '<div class="btn-row"><button type="button" class="btn ghost sm" data-a="poster-find" data-id="' + esc(id) + '">Nađi poster ponovo</button>' +
      (!isGoal && !skipped ? '<button type="button" class="btn ghost sm" data-a="skip" data-id="' + esc(id) + '">Preskoči ovaj naslov</button>' : '') +
      '</div></details>';

    return out + '</div></div>';
  }

  function customSheet(ctx) {
    var sc = ctx.ui.custom;
    var n = 0, min = 0;
    Cat.all().forEach(function (i) {
      if (!Cat.matches(i, sc) || (ctx.s.skipped && ctx.s.skipped[i.id])) return;
      n++; min += i.runtime - P.watchedMinutes(i, ctx.s);
    });
    var out = '<div class="pad-sheet"><h2>Prilagodi plan</h2>' +
      '<h3>Kolekcije</h3><div class="toggles">';
    Cat.COLS.forEach(function (c) {
      var on = sc.cols.indexOf(c.id) !== -1;
      var hrs = Cat.all().filter(function (i) { return i.col === c.id && i.id !== Cat.GOAL_ID; }).reduce(function (a, i) { return a + i.runtime; }, 0);
      out += '<button type="button" class="tgl' + (on ? ' on' : '') + '" data-a="cu-col" data-v="' + c.id + '">' +
        '<span class="sw"></span><span class="tg-t"><b>' + esc(c.full) + '</b><em>' + esc(c.desc) + '</em></span><span class="tg-n">' + UI.hours(hrs) + '</span></button>';
    });
    out += '</div><h3>Nivoi</h3><div class="toggles">';
    Cat.TIER_IDS.forEach(function (t) {
      var on = sc.tiers.indexOf(t) !== -1;
      out += '<button type="button" class="tgl' + (on ? ' on' : '') + '" data-a="cu-tier" data-v="' + t + '">' +
        '<span class="sw"></span><span class="tg-t"><b>' + Cat.TIERS[t].name + '</b><em>' + Cat.TIERS[t].desc + '</em></span>' + '<span class="tier t-' + t + ' sm">' + Cat.TIERS[t].short + '</span></button>';
    });
    out += '<button type="button" class="tgl' + (sc.must ? ' on' : '') + '" data-a="cu-must">' +
      '<span class="sw"></span><span class="tg-t"><b>Obavezno uvek ulazi</b><em>X-Men i X2 su obavezni i kad X-Men kolekcija nije uključena.</em></span></button>';
    out += '</div><div class="cu-sum"><b>' + nNaslov(n) + '</b> · ' + UI.hours(min) + ' neodgledano</div>' +
      '<div class="btn-row"><button type="button" class="btn ghost" data-a="sheet-close">Odustani</button>' +
      '<button type="button" class="btn primary" data-a="cu-save"' + (n ? '' : ' disabled') + '>Sačuvaj</button></div></div>';
    return out;
  }

  function rateSheet(ctx) {
    var r = ctx.ui.rate, it = Cat.get(r.id);
    if (!it) return '';
    var mine = MM.Reviews.mine(r.id);
    var out = '<div class="pad-sheet rate"><div class="rate-h">' + UI.poster(it, 'thumb') +
      '<div><h2>Kako ti je bio?</h2><span class="muted">#' + it.order + ' ' + esc(it.title) + '</span></div></div>' +
      '<div class="star-pick">';
    for (var n = 1; n <= 5; n++) out += '<button type="button" class="sp' + (n <= r.stars ? ' on' : '') + '" data-a="rate-star" data-n="' + n + '">★</button>';
    out += '</div><label class="field"><span>Kratak utisak (opciono)</span>' +
      '<textarea id="rateText" maxlength="500" rows="3" placeholder="U jednoj rečenici…">' + esc(r.text || '') + '</textarea></label>' +
      '<div class="btn-row">' +
      (mine ? '<button type="button" class="btn danger" data-a="rate-del">Obriši</button>' : '<button type="button" class="btn ghost" data-a="sheet-close">Preskoči</button>') +
      '<button type="button" class="btn primary" data-a="rate-save"' + (r.stars ? '' : ' disabled') + '>Objavi</button></div></div>';
    return out;
  }

  function profileSheet(ctx) {
    var p = ctx.ui.prof || { name: ctx.s.displayName || '', avatar: ctx.s.avatar || '' };
    return '<div class="pad-sheet"><h2>Profil</h2>' +
      '<p class="muted small">Ovo ekipa vidi uz tvoje ocene i napredak.</p>' +
      '<div class="prof-pic">' + avatar(p.name || '?', p.avatar, 'xl') +
        '<div class="prof-btns"><button type="button" class="btn sm primary" data-a="pick-photo">Izaberi iz galerije</button>' +
        (p.avatar ? '<button type="button" class="btn sm ghost" data-a="drop-photo">Ukloni sliku</button>' : '') + '</div></div>' +
      '<label class="field"><span>Ime</span><input id="profName" type="text" maxlength="40" placeholder="npr. Kosta" value="' + esc(p.name) + '"></label>' +
      '<div class="btn-row"><button type="button" class="btn ghost" data-a="sheet-close">Odustani</button>' +
      '<button type="button" class="btn primary" data-a="profile-save">Sačuvaj</button></div></div>';
  }

  function welcomeSheet(ctx) {
    return '<div class="pad-sheet welcome">' +
      '<div class="wl-logo"><span class="logo">MARVEL</span><span class="logo-sub">MARATON</span></div>' +
      '<div class="wl-doom">' + MM.Doom.head(64) + '</div>' +
      '<h2>Doom stiže 18.12.</h2>' +
      '<p class="muted">Napravi plan do <b>Avengers: Doomsday</b> — samo obavezno ili ceo Marvel. Aplikacija sama raspoređuje šta gledaš svaki dan.</p>' +
      '<button type="button" class="btn primary wide" data-a="login">' +
        '<svg viewBox="0 0 48 48" class="g" aria-hidden="true"><path fill="#4285F4" d="M45 24c0-1.6-.1-2.7-.4-3.9H24v7.1h12c-.2 1.8-1.5 4.6-4.4 6.4l6.7 5.2c4-3.7 6.7-9.1 6.7-14.8z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C7.9 41 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z"/><path fill="#EA4335" d="M24 10.6c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4.4 29.9 2 24 2 15.4 2 7.9 7 4.3 14l7.1 5.5c1.8-5.3 6.7-8.9 12.6-8.9z"/></svg>' +
        'Nastavi sa Google nalogom</button>' +
      '<button type="button" class="btn ghost wide" data-a="welcome-local">Samo na ovom uređaju</button>' +
      '<p class="muted small">Sa nalogom se lista prenosi na sve uređaje, a ekipa vidi dokle si stigao.</p></div>';
  }

  function chooseSheet(ctx) {
    var s = ctx.s;
    var cur = Cat.presetIdOf(Cat.scopeOf(s));
    var out = '<div class="pad-sheet"><h2>Kako gledaš?</h2><p class="muted small">Možeš da promeniš kad god hoćeš u „Ja".</p><div class="presets">';
    Cat.PRESETS.forEach(function (p) {
      var st = presetStats(p.id, s);
      out += '<button type="button" class="preset p-' + p.id + (cur === p.id ? ' on' : '') + '" data-a="preset" data-id="' + p.id + '" data-close="1">' +
        '<span class="pr-radio"></span><span class="pr-main"><b>' + esc(p.name) + '</b><em>' + esc(p.sub) + '</em><span>' + esc(p.desc) + '</span></span>' +
        '<span class="pr-num"><b>' + UI.hours(st.min) + '</b><i>' + nNaslov(st.n) + '</i></span></button>';
    });
    out += '</div>';
    if (cur === 'custom') out += '<button type="button" class="btn ghost wide" data-a="sheet-close">Zadrži moj izbor (' + esc(scopeName(s).replace('Prilagođeno: ', '')) + ')</button>';
    return out + '</div>';
  }

  /**
   * Sta je novo. Najnovije prvo. Samo "big" iskace samo od sebe pri otvaranju;
   * ostalo ceka u profilu (tackica na slici gore desno dok ne procitas).
   */
  var NEWS = [
    { id: '2.5', title: 'Nova mapa i odbrojavanje', big: false, items: [
      '<b>Redosled gledanja</b> — biraš kako ideš: preporučeni maraton, po izlasku ili hronološki (po priči). Profil → Redosled.',
      '<b>Mapa je sređena</b> — kameni put, bioskopski znak tačno na dan premijere, prave ikone, i dugmići dole idu redom kao na putu.',
      '<b>Doom priča više</b> — i sam od sebe, i kad ga tapneš, i zna da li kasniš.',
      '<b>Mini mapa na početnom</b> — ti, Doom i ekipa na istom putu. Tapni je i otvara se cela mapa.',
      '<b>Odbrojavanje</b> — tapni broj dana i dobiješ tačno vreme: dani, sati, minuti, sekunde.',
      '<b>Streak kalendar</b> — poslednje 4 nedelje, kao u Duolingu.',
      '„Šta je novo" sad čeka ovde u profilu i ne iskače više pri otvaranju — osim za velike promene.'
    ], cta: { a: 'news-order', label: 'Promeni redosled' } },
    { id: '2.0-rebuild', title: 'Marvel Maraton 2.0', big: true, items: [
      '<b>Biraš koliko duboko ideš</b> — samo obavezno za Doomsday, Doomsday+, ceo MCU ili Full Marvel (150 naslova).',
      '<b>Zeleno = baš obavezno.</b> Zvanična Disney+ lista od 15 naslova + Brand New Day. Žuto = dobro za Doomsday, sivo = može skip.',
      '<b>Novi kalendar</b> — mesec i dan po dan, slobodni dani u nedelji, „nemam vremena" za bilo koji dan.',
      '<b>Tempo</b> — „stigni do Doomsdaya" ili tvoj tempo (plan može i posle 18.12.).'
    ], cta: { a: 'choose', label: 'Izaberi kako gledaš' } }
  ];

  /** focus: id novosti koja je iskocila sama (velika promena) - ona ide prva. */
  function newsSheet(ctx, focus) {
    var n = NEWS.filter(function (o) { return o.id === focus; })[0] || NEWS[0];
    var out = '<div class="pad-sheet news">' +
      '<div class="news-k">NOVO' + (n === NEWS[0] ? ' · v' + MM.VERSION : '') + '</div>' +
      '<h2>' + esc(n.title) + '</h2>' +
      '<ul class="news-list">' + n.items.map(function (t, i) { return '<li' + (i === 0 && n.cta ? ' class="hot"' : '') + '>' + t + '</li>'; }).join('') + '</ul>';
    if (n.cta) out += '<button type="button" class="btn primary wide" data-a="' + n.cta.a + '">' + esc(n.cta.label) + '</button>';
    NEWS.filter(function (o) { return o !== n; }).forEach(function (o) {
      out += '<h3>Ranije · ' + esc(o.title) + '</h3><ul class="news-list old">' + o.items.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
    });
    return out + '<button type="button" class="btn ghost wide" data-a="sheet-close">' + (focus ? 'Kasnije' : 'Zatvori') + '</button></div>';
  }

  function streakSheet(ctx) {
    var st = ctx.streak;
    var days = ctx.logByDay;
    // mini kalendar kao u Duolingu: 4 nedelje, ponedeljak prvi, dani sa gledanjem gore
    var today = ctx.plan.today;
    var start = P.addDays(today, -P.weekday(today) - 21);
    var cells = UI.DOW.map(function (d) { return '<span class="sk-dow">' + d.slice(0, 2) + '</span>'; }).join('');
    for (var i = 0; i < 28; i++) {
      var d = P.addDays(start, i);
      var n = (days[d] || []).length;
      var cls = 'sk-day' + (n ? ' on' : '') + (d === today ? ' today' : '') + (d > today ? ' fut' : '');
      // spoji uzastopne dane u traku
      if (n && i % 7 && (days[P.addDays(d, -1)] || []).length) cls += ' joinL';
      if (n && (i + 1) % 7 && (days[P.addDays(d, 1)] || []).length && P.addDays(d, 1) <= today) cls += ' joinR';
      cells += '<span class="' + cls + '">' + (n ? ICON.flame : '') + '<b>' + P.parse(d).getDate() + '</b></span>';
    }
    return '<div class="pad-sheet center"><div class="big-flame">' + ICON.flame + '</div>' +
      '<h2>' + nDan(st.n) + ' zaredom</h2>' +
      '<p class="muted">' + (st.n ? (st.today ? 'Danas si već gledao. Svaka čast.' : 'Danas još nisi gledao — odgledaj bilo šta da niz ne pukne.') : 'Odgledaj nešto danas i kreće niz.') + '</p>' +
      '<p class="muted small">Najduži niz: <b>' + nDan(st.best) + '</b></p>' +
      '<div class="sk-cal">' + cells + '</div><p class="muted small">poslednje 4 nedelje</p></div>';
  }

  function doomSheet(ctx) {
    var time = P.timeRatio();
    var you = ctx.prog.ratio;
    var c = countdownParts();
    var arrived = time >= 1;
    var people = ctx.ui.mapPeople || [];
    // dugmici idu redom kao na mapi: start, pa ko je gde na putu (Doom po vremenu), pa cilj
    var marks = [{ doom: true, r: time }].concat(people.map(function (p, i) { return { p: p, i: i, r: p.ratio }; }));
    marks.sort(function (a, b) { return (a.r - b.r) || (a.doom ? -1 : b.doom ? 1 : 0); });
    var jumps = '<button type="button" class="mp-jb" data-a="map-jump" data-v="start"><span class="mp-ic start"><img src="img/map/start.webp" alt=""></span><i>Start</i></button>';
    marks.forEach(function (m) {
      if (m.doom) {
        jumps += '<button type="button" class="mp-jb doom" data-a="map-jump" data-v="doom"><span class="mp-ic">' + MM.Doom.head(40) + '</span><i>Doom</i></button>';
        return;
      }
      jumps += '<button type="button" class="mp-jb' + (m.p.me ? ' me' : '') + '" data-a="map-jump" data-v="' + m.i + '">' +
        avatar(m.p.name, m.p.photo, 'mp-av') + '<i>' + esc(m.p.me ? 'Ti' : m.p.label) + '</i></button>';
    });
    jumps += '<button type="button" class="mp-jb" data-a="map-jump" data-v="goal"><span class="mp-ic goal"><img src="img/map/goal.webp" alt=""></span><i>Cilj</i></button>';
    return '<div class="doom-wrap">' +
      '<div class="mp-top"><button type="button" class="ib close" data-a="sheet-close" aria-label="Zatvori">' + ICON.close + '</button>' +
        '<div class="doom-k">PUT DO DOOMSDAYA</div>' +
        '<div class="doom-d">' + (arrived ? 'DOOMSDAY JE TU' : c.d + ' ' + plural(c.d, 'dan', 'dana', 'dana')) + '</div>' +
        '<div class="doom-sub">Doom <b>' + Math.round(time * 100) + '%</b> puta · ti <b>' + Math.round(you * 100) + '%</b> plana</div></div>' +
      '<div class="mp-scroll no-drag" data-keep></div>' +
      '<div class="mp-bot">' +
        '<div class="mp-jump no-drag">' + jumps + '</div>' +
      '</div>' +
      '</div>';
  }

  MM.Views = {
    danas: danas, plan: planView, ekipa: ekipa, katalog: katalog, ja: ja,
    itemSheet: itemSheet, customSheet: customSheet, filterSheet: filterSheet, rateSheet: rateSheet, profileSheet: profileSheet,
    welcomeSheet: welcomeSheet, chooseSheet: chooseSheet, newsSheet: newsSheet, countdownSheet: countdownSheet, crew: crew, NEWS: NEWS, streakSheet: streakSheet, doomSheet: doomSheet,
    clock: clock, countdownParts: countdownParts, ICON: ICON, scopeName: scopeName
  };
})();
