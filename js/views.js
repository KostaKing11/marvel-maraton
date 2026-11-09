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
    clap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v9.5A1.5 1.5 0 0118.5 21h-13A1.5 1.5 0 014 19.5zm-.3-1.6L3 5.6a1.5 1.5 0 011.1-1.8l13-3.1a1.5 1.5 0 011.8 1.1l.6 2.6zM6.4 3.9l2.2 3 2.3-.5-2.2-3zm5 -1.2l2.2 3 2.3-.5-2.2-3z"/></svg>',
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
  /**
   * Podijum: top 3 (drugi levo, prvi u sredini, treci desno) + ostali ispod.
   * rows: [{ k, name, photo, poster(item), mine, v (glavni broj), sub, a (data-a), id }]
   */
  function podium(rows, opts) {
    opts = opts || {};
    if (!rows.length) return '<p class="muted pad">' + (opts.empty || 'Još nema nikog.') + '</p>';
    var top = rows.slice(0, 3), rest = rows.slice(3, opts.max || 50);
    function face(r, big) {
      if (r.item) return '<span class="pd-post">' + UI.poster(r.item, 'thumb') + '</span>';
      return avatar(r.name, r.photo, big ? 'pd-av xl' : 'pd-av');
    }
    function act(r) { return r.a ? ' data-a="' + r.a + '" data-id="' + esc(r.id) + '"' : ''; }
    var order = [1, 0, 2], out = '<div class="pd' + (opts.posters ? ' posters' : '') + (top.length < 3 ? ' n' + top.length : '') + '">';
    order.forEach(function (i) {
      var r = top[i]; if (!r) { out += '<div class="pd-c ghost p' + (i + 1) + '"></div>'; return; }
      out += '<' + (r.a ? 'button type="button"' : 'div') + ' class="pd-c p' + (i + 1) + (r.mine ? ' me' : '') + '"' + act(r) + ' style="--d:' + (i === 0 ? 0 : i === 1 ? .12 : .24) + 's">' +
        (i === 0 ? '<span class="pd-crown">👑</span>' : '') + face(r, i === 0) +
        '<b class="pd-n">' + esc(r.name || 'Bez imena') + '</b>' +
        '<span class="pd-v">' + r.v + '</span>' + (r.sub ? '<i class="pd-s">' + r.sub + '</i>' : '') +
        '<span class="pd-step"><em>' + (i + 1) + '</em></span></' + (r.a ? 'button' : 'div') + '>';
    });
    out += '</div>';
    if (rest.length) {
      out += '<div class="pd-rest">' + rest.map(function (r, k) {
        return '<' + (r.a ? 'button type="button"' : 'div') + ' class="pd-r' + (r.mine ? ' me' : '') + '"' + act(r) + '><span class="pd-rk">' + (k + 4) + '</span>' + face(r) +
          '<span class="pd-rt"><b>' + esc(r.name || 'Bez imena') + (r.mine ? ' <em>· ti</em>' : '') + '</b>' + (r.sub ? '<i>' + r.sub + '</i>' : '') + (r.bar != null ? '<u><q style="width:' + r.bar + '%"></q></u>' : '') + '</span>' +
          '<strong>' + r.v + '</strong></' + (r.a ? 'button' : 'div') + '>';
      }).join('') + '</div>';
    }
    return out;
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

  /* ---------------- ocene epizoda ---------------- */

  /** Prosek ocena epizoda jedne sezone: { avg, n } ili null. */
  function epAvg(s, id) {
    var m = (s.epStars || {})[id] || {}, ks = Object.keys(m).filter(function (k) { return m[k] >= 1; });
    if (!ks.length) return null;
    return { avg: ks.reduce(function (a, k) { return a + m[k]; }, 0) / ks.length, n: ks.length };
  }
  function avgStr(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  /** Zvezdice uz ocenu: serija pokazuje prosek epizoda. */
  function revStars(r) {
    return stars(Math.round(r.avg || r.stars)) + (r.avg ? '<em class="rv-avg">' + avgStr(r.avg) + ' · prosek ' + (r.eps || '') + ' ep</em>' : '');
  }

  /* ---------------- scene posle spice ---------------- */

  function scenes(n) { return n + ' ' + plural(n, 'scena', 'scene', 'scena'); }
  /** it.pc = [usred spice, na samom kraju]. null = nema podatka (serije). */
  function pcInfo(it) {
    if (!it.pc) return null;
    var m = it.pc[0], e = it.pc[1];
    if (!m && !e) return { none: true, t: 'Nema scene posle špice — slobodno ugasi kad krenu imena.', s: 'bez scene posle špice' };
    var parts = [];
    if (m) parts.push(scenes(m) + ' usred špice');
    if (e) parts.push(scenes(e) + ' na samom kraju');
    return { t: (e ? 'Ostani do kraja špice: ' : 'Ostani do pola špice: ') + parts.join(' + ') + '.' + (e ? '' : ' Na kraju nema ništa.'),
      s: e ? 'posle špice: ostani do kraja' : 'posle špice: ostani do pola' };
  }

  /* ---------------- recenzije: bez spojlera + reakcije ---------------- */

  function revText(r, it, ctx) {
    if (!r.text) return '';
    var me = ctx.user && ctx.user.uid;
    var rid = r.itemId + '__' + r.uid;
    var hide = r.uid !== me && !P.isDone(it, ctx.s) && !(ctx.ui.spoil && ctx.ui.spoil[rid]);
    if (!hide) return '<p>' + esc(r.text) + '</p>';
    return '<button type="button" class="spoil" data-a="spoil" data-rid="' + esc(rid) + '"><span>' + esc(r.text.replace(/\S/g, '•').slice(0, 60)) + '</span>' +
      '<b>Nisi još gledao · tapni da vidiš</b></button>';
  }

  function reactRow(r, ctx) {
    if (!ctx.user) return '';
    var rid = r.itemId + '__' + r.uid, x = MM.Reviews.reactionsFor(rid);
    return '<div class="reacts">' + MM.Reviews.EMOJI.map(function (e) {
      var n = x.counts[e] || 0;
      return '<button type="button" class="rx' + (x.mine === e ? ' on' : '') + (n ? ' has' : '') + '" data-a="react" data-rid="' + esc(rid) + '" data-e="' + e + '">' +
        e + (n ? '<b>' + n + '</b>' : '') + '</button>';
    }).join('') + '</div>';
  }

  /* ---------------- nedeljni pregled ---------------- */

  function mondayOf(iso) { return P.addDays(iso, -P.weekday(iso)); }

  function recapData(ctx, mon) {
    var days = ctx.logByDay, s = ctx.s, B = MM.Badges;
    var out = { mon: mon, min: 0, units: 0, days: [], titles: [], earned: [] };
    var seen = {};
    for (var i = 0; i < 7; i++) {
      var d = P.addDays(mon, i), us = days[d] || [], m = 0;
      us.forEach(function (u) {
        m += u.min; out.units++;
        if (!seen[u.id]) { seen[u.id] = 1; out.titles.push(u.item); }
      });
      out.min += m;
      out.days.push({ d: d, m: m, n: us.length });
    }
    // predmeti: naslovi zavrseni ove nedelje (poslednji upis pao u ovu nedelju)
    out.titles.forEach(function (it) {
      if (!P.isDone(it, s)) return;
      var last = '';
      Object.keys(s.log || {}).forEach(function (k) { if (k.split('#')[0] === it.id && s.log[k].d > last) last = s.log[k].d; });
      if (last >= mon && last <= P.addDays(mon, 6)) out.earned.push(it);
    });
    out.active = out.days.filter(function (x) { return x.n; }).length;
    out.best = out.days.slice().sort(function (a, b) { return b.m - a.m; })[0];
    out.youPct = ctx.prog.totalMin ? out.min / ctx.prog.totalMin * 100 : 0;
    out.doomPct = 7 / P.daysBetween(P.START_ISO, P.DOOMSDAY_ISO) * 100;
    return out;
  }

  function weekLabel(mon) {
    var a = P.parse(mon), b = P.parse(P.addDays(mon, 6));
    return a.getMonth() === b.getMonth() ? a.getDate() + '–' + b.getDate() + '. ' + UI.MON3[b.getMonth()]
      : a.getDate() + '. ' + UI.MON3[a.getMonth()] + ' – ' + b.getDate() + '. ' + UI.MON3[b.getMonth()];
  }

  function recapSheet(ctx, mon) {
    var x = recapData(ctx, mon), today = ctx.plan.today, thisMon = mondayOf(today);
    var maxM = Math.max(60, Math.max.apply(null, x.days.map(function (d) { return d.m; })));
    var title = mon === thisMon ? 'Ova nedelja' : mon === P.addDays(thisMon, -7) ? 'Prošla nedelja' : 'Nedelja';
    var out = '<div class="pad-sheet recap">' +
      '<div class="rc-nav"><button type="button" class="ib" data-a="recap-week" data-v="' + P.addDays(mon, -7) + '" aria-label="Prethodna">‹</button>' +
        '<div><div class="news-k">NEDELJNI PREGLED</div><h2>' + esc(title) + '</h2><span class="muted">' + esc(weekLabel(mon)) + '</span></div>' +
        '<button type="button" class="ib" data-a="recap-week" data-v="' + P.addDays(mon, 7) + '" aria-label="Sledeća"' + (mon >= thisMon ? ' disabled' : '') + '>›</button></div>';
    if (!x.units) {
      return out + '<p class="muted center pad">Ove nedelje nije bilo gledanja.' + (mon === thisMon ? ' Još ima vremena.' : '') + '</p></div>';
    }
    out += '<div class="rc-stats"><div><b>' + hm(x.min) + '</b><i>gledanja</i></div><div><b>' + x.titles.length + '</b><i>' + plural(x.titles.length, 'naslov', 'naslova', 'naslova') + '</i></div>' +
      '<div><b>' + x.active + '/7</b><i>dana</i></div></div>';
    out += '<div class="rc-bars">' + x.days.map(function (d, i) {
      var h = d.m ? Math.max(8, Math.round(d.m / maxM * 100)) : 0;
      return '<div class="rc-bar' + (d.d === today ? ' today' : '') + (d.d > today ? ' fut' : '') + '"><span><i style="height:' + h + '%"></i></span><em>' + UI.DOW[i].slice(0, 2) + '</em></div>';
    }).join('') + '</div>';
    var faster = x.youPct >= x.doomPct;
    out += '<div class="rc-doom' + (faster ? ' ok' : '') + '">' + MM.Doom.head(30) + '<span>Ti <b>+' + x.youPct.toFixed(1) + '%</b> plana · Doom <b>+' + x.doomPct.toFixed(1) + '%</b> puta.<br>' +
      (faster ? 'Bio si brži od Dooma.' : 'Doom je bio brži ove nedelje.') + '</span></div>';
    out += '<h3>Gledao si</h3><div class="rc-posters no-drag">' + x.titles.map(function (it) {
      return '<button type="button" class="rc-p" data-a="item" data-id="' + esc(it.id) + '">' + UI.poster(it, 'thumb') + '<i>' + esc(Cat.cleanTitle(it)) + '</i></button>';
    }).join('') + '</div>';
    if (x.earned.length) {
      out += '<h3>Predmeti ove nedelje</h3><div class="rc-bd no-drag">' + x.earned.map(function (it) {
        return '<button type="button" class="bd-cell" data-a="bd-open" data-id="' + esc(it.id) + '">' + MM.Badges.tile(it, { size: 'sm' }) + '<i>' + esc(MM.Badges.spec(it).name) + '</i></button>';
      }).join('') + '</div>';
    }
    if (x.best && x.best.m) out += '<p class="muted small center">Najjači dan: <b>' + esc(UI.dayName(x.best.d)) + '</b>, ' + hm(x.best.m) + '.</p>';
    return out + '</div>';
  }

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

  /** Traka puta na pocetnom ekranu: Doom (vreme), ti i ekipa. Tap = cela mapa. */
  function roadMini(ctx, time) {
    var ppl = crew(ctx), me = ppl[0];
    function pos(r) { return (Math.max(0, Math.min(1, r)) * 100).toFixed(1) + '%'; }
    var out = '<div class="rm" data-a="doom" role="button" aria-label="Otvori mapu puta do Doomsdaya">' +
      '<div class="rm-track"><i class="rm-done" style="width:' + pos(time) + '"></i>';
    ppl.slice(1).forEach(function (p, i) {
      out += '<span class="rm-p" data-k="rmp' + i + '" style="left:' + pos(p.ratio) + '">' + avatar(p.name, p.photo, 'rm-av') + '</span>';
    });
    out += '<span class="rm-doom" style="left:' + pos(time) + '">' + MM.Doom.head(30) + '</span>' +
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

  /** 18.12: ceo vrh ekrana je posvecen premijeri. */
  function premiereHero(ctx) {
    var ppl = crew(ctx);
    var watched = P.isDone(Cat.get(Cat.GOAL_ID), ctx.s);
    return '<section class="hero premiere" data-k="hero">' +
      '<div class="pm-glow"></div>' +
      '<div class="pm-head">' + MM.Doom.head(76) + '</div>' +
      '<div class="pm-k">18. DECEMBAR</div>' +
      '<h1 class="pm-t">DOOMSDAY<br>JE DANAS</h1>' +
      '<p class="pm-s">' + (watched ? 'Odgledano. Doom je pao… ili nije? Bez spojlera ekipi.' : 'Vidimo se u bioskopu. Kokice, karte, telefon na tiho.') + '</p>' +
      '<div class="pm-crew">' + ppl.map(function (p) {
        return '<span class="pm-p">' + avatar(p.name, p.photo, 'pm-av') + '<b>' + Math.round(p.ratio * 100) + '%</b><i>' + esc(p.me ? 'Ti' : p.label) + '</i></span>';
      }).join('') + '</div>' +
      (watched ? '' : '<button type="button" class="btn primary wide pm-go" data-a="goal-done">Odgledao sam Avengers: Doomsday</button>') +
      '</section>';
  }

  /** Minimalni izgled: samo koliko dana i poster sledeceg naslova (prevlaci se). */
  function danasMini(ctx) {
    var plan = ctx.plan, u = plan.next, c = countdownParts();
    var today = P.today();
    var out = '<section class="mini-home" data-k="mini">' +
      '<button type="button" class="mn-cd" data-a="countdown">' +
        (today === P.DOOMSDAY_ISO ? '<b class="mn-big">DANAS</b><i>Doomsday je u bioskopu</i>'
          : today > P.DOOMSDAY_ISO ? '<b class="mn-big">✓</b><i>Doomsday je stigao</i>'
          : '<b>' + c.d + '</b><i>' + plural(c.d, 'dan', 'dana', 'dana') + ' do Doomsdaya</i>') +
      '</button>';
    if (!u) {
      return out + '<div class="mn-done"><b>Sve je odgledano.</b><span>Vidimo se u bioskopu.</span></div></section>';
    }
    var it = u.item, sub = [it.year, TYPE[it.type] || ''];
    if (u.ep) sub.push('ep ' + u.ep + ' / ' + it.episodes);
    sub.push(hm(u.min));
    out += '<div class="mn-card" id="mncard" data-id="' + esc(it.id) + '" data-key="' + esc(u.key) + '" role="button">' +
        UI.poster(it, 'mn-art') +
        '<span class="mn-stamp yes">ODGLEDANO</span><span class="mn-stamp back">NAZAD</span>' +
      '</div>' +
      '<div class="mn-t"><h1>' + esc(Cat.cleanTitle(it)) + '</h1><span>' + esc(sub.join(' · ')) + '</span></div>' +
      '<p class="mn-hint"><span>‹ nazad</span><span>odgledano ›</span></p>' +
      '</section>';
    return out;
  }

  /* ============================================================
     OG izgled: pocetni ekran kao u prvoj verziji aplikacije
     ============================================================ */

  function ogCountdown() {
    var c = countdownParts();
    function unit(v, lbl) { return '<span class="og-cu"><b>' + v + '</b><i>' + lbl + '</i></span>'; }
    return unit(c.d, 'dana') + '<span class="og-csep">:</span>' + unit(pad(c.h), 'sati') + '<span class="og-csep">:</span>' +
      unit(pad(c.m), 'min') + '<span class="og-csep">:</span>' + unit(pad(c.s), 'sek');
  }

  function ogStreak(st) {
    if (!st.n) return '<div class="og-streak dead"><span class="og-st-in"><b>0</b></span></div>';
    var tier = st.n >= 30 ? 'legend' : st.n >= 14 ? 'violet' : st.n >= 7 ? 'blue' : st.n >= 3 ? 'fire' : 'ember';
    return '<button type="button" class="og-streak s-' + tier + (st.today ? '' : ' pending') + '" data-a="streak">' +
      '<span class="og-st-ring"></span><span class="og-st-ring two"></span>' +
      '<span class="og-st-in"><b>' + st.n + '</b></span><span class="og-st-flame">🔥</span></button>';
  }

  function hShort(min) { return (Math.round(min / 6) / 10).toFixed(1) + 'h'; }

  function danasOG(ctx) {
    var s = ctx.s, plan = ctx.plan, u = plan.next;
    var out = '<section class="og-deck" data-k="og">' +
      '<div class="og-top"><div class="og-cdown" id="ogcd">' + ogCountdown() + '</div>' + ogStreak(ctx.streak) + '</div>';

    var idle = idleDays(s);
    if (idle >= 1 && u) {
      out += '<div class="og-alarm' + (idle >= 3 ? ' hard' : '') + '"><span class="og-alarm-dot"></span>' +
        '<span class="og-alarm-txt"><b>' + (idle === 1 ? '24 sata' : nDan(idle)) + '</b> bez Marvela</span>' +
        '<span class="og-alarm-cta">prevuci desno →</span></div>';
    }

    if (u) {
      // dnevna norma + ova nedelja (odgledano / plan)
      var tone = plan.target <= 90 ? 'ok' : plan.target <= 180 ? 'warn' : 'hot';
      var mon = mondayOf(plan.today), sun = P.addDays(mon, 6), done = 0, need = 0;
      for (var i = 0; i < 7; i++) (ctx.logByDay[P.addDays(mon, i)] || []).forEach(function (x) { done += x.min; });
      plan.days.forEach(function (d) { if (d.iso >= plan.today && d.iso <= sun) need += d.minutes; });
      var total = done + need, pct = total ? Math.min(100, Math.round(done / total * 100)) : 0;
      var daysLeft = Math.max(1, P.daysBetween(plan.today, P.DOOMSDAY_ISO));
      out += '<div class="og-hstrip hs-' + tone + '">' +
        '<div class="og-hs-cell"><span class="og-hs-lbl">Dnevno</span><span class="og-hs-num">' + hm(plan.target) + '</span>' +
          '<span class="og-hs-fine">' + plan.titlesLeft + ' naslova · ' + daysLeft + ' dana</span></div>' +
        '<div class="og-hs-cell right"><span class="og-hs-lbl">Ove nedelje</span>' +
          '<span class="og-hs-num sm"><b>' + hShort(done) + '</b> / ' + hShort(total) + '</span>' +
          '<div class="og-bar"><i style="width:' + pct + '%"></i></div></div>' +
        '</div>';

      var it = u.item, nxt = plan.queue[1];
      var sub = u.ep ? 'Epizoda ' + u.ep + ' od ' + it.episodes : (TYPE[it.type] || it.type).toUpperCase();
      out += '<div class="og-swipe">' +
        (nxt ? '<div class="og-dcard peek">' + UI.poster(nxt.item, 'og-art') + '<div class="og-dscrim"></div></div>' : '') +
        '<div class="og-dcard cur" id="ogcard" data-key="' + esc(u.key) + '" data-id="' + esc(it.id) + '">' +
          UI.poster(it, 'og-art') + '<div class="og-dscrim"></div>' +
          '<div class="og-dstamp yes">ODGLEDANO</div><div class="og-dstamp back">NAZAD</div><div class="og-dstamp skip">PRESKAČEM</div>' +
          '<div class="og-dinfo"><div class="og-dnum">#' + it.order + '</div>' +
            '<h1 class="og-dtitle">' + esc(Cat.cleanTitle(it)) + (u.ep ? '' : '') + '</h1>' +
            '<div class="og-dmeta">' + it.year + ' · ' + esc(sub) + ' · ' + u.min + ' min</div>' +
            (it.note ? '<p class="og-ddesc">' + esc(it.note) + '</p>' : '') +
          '</div></div></div>';
    } else {
      out += '<div class="og-dcard done"><div class="og-dinfo center"><div class="og-dnum">✓</div>' +
        '<h1 class="og-dtitle">Nema više ničega</h1><p class="og-ddesc">Sve iz plana je odgledano. Ostaje ti samo bioskop 18.12.</p></div></div>';
    }
    return out + '</section>';
  }

  function danas(ctx) {
    if (ctx.s.skin === 'og') return danasOG(ctx);
    if (ctx.s.look === 'mini') return danasMini(ctx);
    var s = ctx.s, plan = ctx.plan, prog = ctx.prog;
    var c = countdownParts();
    var time = P.timeRatio();
    var out = '';

    /* --- dan premijere --- */
    var arrived = P.today() >= P.DOOMSDAY_ISO;
    if (P.today() === P.DOOMSDAY_ISO) out += premiereHero(ctx);
    else out += '<section class="hero" data-k="hero">' +
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

    if (MM.Finale) out += MM.Finale.card('danas');

    /* --- nedeljni pregled (pon-sre, za proslu nedelju) --- */
    var lastMon = P.addDays(mondayOf(plan.today), -7);
    if (P.weekday(plan.today) <= 2 && s.recapSeen !== lastMon) {
      var rc = recapData(ctx, lastMon);
      if (rc.units) {
        out += '<div class="recap-card" data-k="recap" data-a="recap" data-v="' + lastMon + '" role="button">' +
          '<span class="rc-ic">' + MM.Badges.tile(rc.earned[0] || rc.titles[0], { size: 'sm' }) + '</span>' +
          '<span class="rc-t"><em>PROŠLA NEDELJA</em><b>' + hm(rc.min) + ' · ' + nNaslov(rc.titles.length) + '</b>' +
          '<span>' + (rc.earned.length ? '+' + rc.earned.length + ' ' + plural(rc.earned.length, 'predmet', 'predmeta', 'predmeta') + ' · ' : '') + rc.active + '/7 dana</span></span>' +
          '<button type="button" class="ib sm rc-x" data-a="recap-hide" data-v="' + lastMon + '" aria-label="Sakrij">' + ICON.close + '</button></div>';
      }
    }

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
            (pcInfo(it) && !u.ep ? '<p class="dcard-pc' + (pcInfo(it).none ? ' none' : '') + '">' + ICON.clap + esc(pcInfo(it).s) + '</p>' : '') +
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

    out += '<section class="card" data-k="lb"><div class="card-h"><h2>Dokle su stigli</h2><span class="muted">Doom je na ' + Math.round(time * 100) + '%</span></div>' +
      podium(ppl.map(function (p) {
        var ahead = (p.percent || 0) / 100 >= time;
        return { name: p.name, photo: p.photo, mine: p.uid === me, v: (p.percent || 0) + '%',
          sub: (p.watched || 0) + '/' + (p.total || 0) + (p.streak ? ' · 🔥' + p.streak : '') + (ahead ? ' · ispred Dooma' : ''), bar: Math.min(100, p.percent || 0) };
      })) + '</section>';

    /* najbolje ocenjeno (prosek ekipe) */
    var agg = {};
    MM.Reviews.cached().forEach(function (r) {
      if (!Cat.get(r.itemId)) return;
      var a = agg[r.itemId] = agg[r.itemId] || { n: 0, sum: 0 };
      a.n++; a.sum += r.avg || r.stars || 0;
    });
    var films = Object.keys(agg).map(function (id) { return { id: id, it: Cat.get(id), n: agg[id].n, avg: agg[id].sum / agg[id].n }; })
      .filter(function (f) { return f.n >= (ctx.ui.topAll ? 1 : Math.min(2, Object.keys(who0()).length)); });
    function who0() { var w = {}; MM.Reviews.cached().forEach(function (r) { w[r.uid] = 1; }); return w; }
    var worst = ctx.ui.topSort === 'worst';
    films.sort(function (a, b) { return worst ? a.avg - b.avg || b.n - a.n : b.avg - a.avg || b.n - a.n; });
    if (films.length) {
      out += '<section class="card" data-k="topf"><div class="card-h"><h2>' + (worst ? 'Najslabije ocenjeno' : 'Najbolje ocenjeno') + '</h2>' +
        '<div class="tseg mini"><button type="button" class="' + (worst ? '' : 'on') + '" data-a="top-sort" data-v="best">Top</button><button type="button" class="' + (worst ? 'on' : '') + '" data-a="top-sort" data-v="worst">Dno</button></div></div>' +
        podium(films.slice(0, 10).map(function (f) {
          return { item: f.it, name: Cat.cleanTitle(f.it), v: '★ ' + f.avg.toFixed(1), sub: f.n + ' ' + (f.n === 1 ? 'ocena' : f.n < 5 ? 'ocene' : 'ocena'), a: 'item', id: f.id };
        }), { posters: true }) + '</section>';
    }

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
          '<div class="rev-b"><div class="rev-top">' + revStars(r) + '<span>' + esc(r.name || 'Bez imena') + (mine ? ' · ti' : '') + '</span></div>' +
            '<div class="rev-t">#' + it.order + ' ' + esc(Cat.cleanTitle(it)) + '</div>' +
            revText(r, it, ctx) + reactRow(r, ctx) + '</div>' +
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
     IGRE: mini igre, nivo igraca i rang lista ekipe
     ============================================================ */

  /** Stanje igara (stari gameBest g0..g3 se prevodi u nove id-jeve).
      XP skala v3: nova kriva nivoa je tacno upola stara, pa stari XP / 2
      = isti nivo i isti procenat do sledeceg. Niko ne gubi nivo.
      (v2 je bio XP / 5 - to se vraca: x 2.5.) */
  function xpScale(x, v) { return v === 3 ? x : v === 2 ? Math.round(x * 2.5) : Math.round(x / 2); }
  function gamesOf(s) {
    var g = s.games && typeof s.games === 'object' ? s.games : { xp: 0, wins: 0, best: {}, xpv: 3 };
    var xp = xpScale(g.xp | 0, g.xpv);
    g = { xp: xp, xpv: 3, wins: g.wins | 0, runs: g.runs | 0, best: Object.assign({}, g.best || {}) };
    var old = s.gameBest || {}, map = { g0: 'classic', g1: 'doom', g2: 'stones', g3: 'quiz' };
    Object.keys(map).forEach(function (k) { if ((old[k] || 0) > (g.best[map[k]] || 0)) g.best[map[k]] = old[k]; });
    return g;
  }
  /** XP drugara, prebacen na istu skalu (gbest._v kaze koja je). */
  function peerXp(p) { return xpScale(p.gxp || 0, p.gbest && p.gbest._v); }
  /** Ekipa sa mojim svezim brojevima, sortirana po XP. */
  function gamePeople(ctx) {
    var s = ctx.s, g = gamesOf(s), me = ctx.user && ctx.user.uid;
    var ppl = MM.Reviews.people().map(function (p) {
      return p.uid === me ? Object.assign({}, p, { xp: g.xp, gbest: g.best, name: s.displayName || p.name, photo: s.avatar || p.photo, mine: true }) : Object.assign({}, p, { xp: peerXp(p) });
    });
    if (!ppl.some(function (p) { return p.mine; })) ppl.push({ uid: me || 'me', name: s.displayName || 'Ti', photo: s.avatar, xp: g.xp, gbest: g.best, mine: true });
    ppl.sort(function (a, b) { return (b.xp || 0) - (a.xp || 0); });
    return ppl;
  }
  /** Najbolji u ekipi za igru id: { n, v } */
  function teamBest(ppl, id) {
    var top = null;
    ppl.forEach(function (p) { var v = (p.gbest || {})[id] || 0; if (v && (!top || v > top.v)) top = { n: p.name || '?', v: v }; });
    return top;
  }

  function igre(ctx) {
    var s = ctx.s, G = MM.Games, g = gamesOf(s), lv = G.lvlOf(g.xp), ppl = gamePeople(ctx);
    var out = '<section class="card gx-me" data-k="gxme">' +
      '<div class="gx-badge"><b>' + lv.n + '</b><i>NIVO</i></div>' +
      '<div class="gx-t"><em>' + esc(lv.title.toUpperCase()) + '</em>' +
        '<div class="gx-bar"><i style="width:' + lv.pct + '%"></i></div>' +
        '<span><b>' + (g.xp - lv.from) + '</b> / ' + (lv.to - lv.from) + ' XP do nivoa ' + (lv.n + 1) + (G.TITLES[lv.n] && G.TITLES[lv.n] !== lv.title ? ' · ' + esc(G.TITLES[lv.n]) : '') + '</span></div></section>';

    // Marvel Runner: glavna igra
    var R = MM.Runner, rc = R.charOf(s), sm = R.summary(s), nUn = R.CHARS.filter(function (c) { return R.unlocked(c, s); }).length;
    out += '<button type="button" class="rn-big" data-k="rn" data-a="runner">' +
      '<span class="rnb-bg"></span><img class="rnb-hero" src="' + R.sprite(rc) + '" alt="">' +
      '<span class="rnb-t"><em>GLAVNA IGRA</em><b>MARVEL RUNNER</b><span>Trči do Doomsdaya · ' + nUn + '/' + R.CHARS.filter(function (c) { return !c.secret || R.unlocked(c, s); }).length + ' likova</span>' +
        '<span class="rnb-pass"><i>' + sm.tier + '</i><s><u style="width:' + sm.pct + '%"></u></s>PASS' + (sm.claim ? '<em class="rnb-dot">' + sm.claim + '</em>' : '') + '</span>' +
        (g.best.runner ? '<span class="rnb-rec">🏆 ' + g.best.runner.toLocaleString('sr-RS') + '</span>' : '') +
      '</span><span class="rnb-go">TRČI ▶</span></button>';

    // mini igre: svaka ima svoj meni
    var ids = Object.keys(G.REG);
    out += '<section class="card" data-k="gxlist"><div class="card-h"><h2>Mini igre</h2><span class="muted">20 nivoa + beskonačno</span></div><div class="mg-grid">';
    ids.forEach(function (id) {
      var r = G.REG[id], best = g.best[id] || 0;
      out += '<button type="button" class="mg-c" style="--gc:' + r.col + '" data-a="play-game" data-g="' + id + '"><span class="mg-emo">' + r.emo + '</span><b>' + esc(r.name) + '</b>' +
        '<i>' + esc(r.desc) + '</i><span class="mg-prog"><u><q style="width:' + (best / 20 * 100) + '%"></q></u>' + best + '/20' + (g.best[id + '_e'] ? ' · ♾️ ' + g.best[id + '_e'] : '') + '</span></button>';
    });
    var lqw = s.lqWins | 0;
    out += '<button type="button" class="mg-c" style="--gc:#f5b83d" data-a="livequiz"><span class="mg-emo">⚡</span><b>Kviz uživo</b>' +
      '<i>sa ekipom, u isto vreme</i><span class="mg-prog">' + (lqw ? '🏆 ' + lqw + (lqw === 1 ? ' pobeda' : lqw < 5 ? ' pobede' : ' pobeda') : 'do 10 pitanja · uživo') + '</span></button>';
    out += '<button type="button" class="mg-c wide" style="--gc:#ffb400" data-a="play-game" data-g="classic"><span class="mg-emo">🏆</span><b>Klasika: tri zaredom</b>' +
      '<i>Dooma, Kamenje i Kviz bez pada · trostruki XP</i><span class="mg-prog"><u><q style="width:' + ((g.best.classic || 0) / 20 * 100) + '%"></q></u>' + (g.best.classic || 0) + '/20' + (g.best.classic_e ? ' · ♾️ ' + g.best.classic_e : '') + '</span></button>';
    out += '</div></section>';

    // rang lista ekipe
    var gt = ctx.ui.gxTab || 'lvl', rows;
    if (gt === 'run') {
      rows = ppl.filter(function (p) { return (p.gbest || {}).runner; }).sort(function (a, b) { return (b.gbest.runner || 0) - (a.gbest.runner || 0); })
        .map(function (p) { return { name: p.name, photo: p.photo, mine: p.mine, v: (p.gbest.runner || 0).toLocaleString('sr-RS'), sub: 'poena' }; });
    } else if (gt === 'inf') {
      var eSum = function (p) { var b = p.gbest || {}, t = 0; Object.keys(b).forEach(function (k) { if (/_e$/.test(k)) t += b[k] | 0; }); return t; };
      rows = ppl.filter(function (p) { return eSum(p); }).sort(function (a, b) { return eSum(b) - eSum(a); })
        .map(function (p) { var b = p.gbest || {}; return { name: p.name, photo: p.photo, mine: p.mine, v: eSum(p), sub: ['stones', 'quiz', 'doom'].map(function (k) { return b[k + '_e'] ? G.REG[k].emo + b[k + '_e'] : ''; }).filter(Boolean).join(' ') || 'beskonačno' }; });
    } else {
      rows = ppl.map(function (p) { var l = G.lvlOf(p.xp || 0); return { name: p.name, photo: p.photo, mine: p.mine, v: 'Nv ' + l.n, sub: esc(l.title), bar: l.pct }; });
    }
    out += '<section class="card" data-k="gxrank"><div class="card-h"><h2>Rang lista</h2></div>' +
      '<div class="tseg three gx-tabs"><button type="button" class="' + (gt === 'lvl' ? 'on' : '') + '" data-a="gx-tab" data-v="lvl">Nivo</button>' +
      '<button type="button" class="' + (gt === 'run' ? 'on' : '') + '" data-a="gx-tab" data-v="run">Runner</button>' +
      '<button type="button" class="' + (gt === 'inf' ? 'on' : '') + '" data-a="gx-tab" data-v="inf">♾️ Beskonačno</button></div>' +
      podium(rows, { empty: gt === 'run' ? 'Niko još nije trčao.' : 'Niko još nije igrao beskonačno.' });
    var recs = ['runner', 'classic'].concat(ids).map(function (id) {
      var top = teamBest(ppl, id);
      var r = id === 'classic' ? { emo: '🏆', name: 'Klasika' } : id === 'runner' ? { emo: '🏃', name: 'Marvel Runner' } : G.REG[id];
      return '<div class="gx-rec' + (id === 'runner' ? ' wide' : '') + '"><span>' + r.emo + '</span><b>' + esc(r.name) + '</b><i>' +
        (top ? esc(top.n) + ' · ' + (id === 'runner' ? top.v.toLocaleString('sr-RS') + ' poena' : 'nivo ' + top.v) : '—') + '</i></div>';
    });
    out += '<h3>Rekordi</h3><div class="gx-recs">' + recs.join('') + '</div>' +
      (ctx.user ? '' : '<p class="muted small">Prijavi se da te ekipa vidi na rang listi.</p>') + '</section>';
    return out;
  }

  /* ============================================================
     JA
     ============================================================ */

  function ja(ctx) {
    var s = ctx.s, user = ctx.user;
    var out = '';

    if (MM.Finale) out += MM.Finale.card('ja');
    if (MM.Tiers) out += MM.Tiers.card();

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

    /* kod za nagradu (svi) + pravljenje kodova (samo Kosta) */
    out += '<section class="card code-card" data-k="codes"><div class="card-h"><h2>Kod za nagradu</h2></div>' +
      '<div class="code-row"><input id="codeIn" type="text" placeholder="MM-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="16">' +
      '<button type="button" class="btn primary" data-a="code-redeem">Iskoristi</button></div>' +
      '<p class="muted small">Kodove deli Kosta — daju nagrade u Marvel Runneru.</p>' +
      (MM.Codes && MM.Codes.isAdmin() ? '<button type="button" class="btn ghost wide" data-a="code-admin">Napravi kodove (admin)</button>' : '') +
      '</section>';

    /* tab Igre */
    out += '<section class="card snd-card" data-k="sndtog"><button type="button" class="tgl' + (s.sound !== false ? ' on' : '') + '" data-a="sound-toggle">' +
      '<span class="sw"></span><span class="tg-t"><b>Zvukovi</b><em>Klikovi, kviz, nagrade i zvuci u igrama.</em></span></button>' +
      '<button type="button" class="tgl' + (s.music !== false ? ' on' : '') + '" data-a="music-toggle">' +
      '<span class="sw"></span><span class="tg-t"><b>Muzika</b><em>U Marvel Runneru, borbi i mini igrama.</em></span></button></section>';
    out += '<section class="card" data-k="gtog"><button type="button" class="tgl' + (s.gamesOff ? '' : ' on') + '" data-a="games-toggle">' +
      '<span class="sw"></span><span class="tg-t"><b>Tab Igre</b><em>' + (s.gamesOff ? 'Sakriven — aplikacija je samo za gledanje.' : 'Mini igre, Marvel Runner i rang lista. Isključi i tab nestaje.') + '</em></span></button></section>';

    /* izgled */
    var look = s.look === 'mini' ? 'mini' : 'full';
    var skin = s.skin === 'retro' || s.skin === 'og' ? s.skin : 'dark';
    var TH = MM.Themes, thCur = TH.current(s), thOpen = TH.unlocked(s), thPick = ctx.ui.thPick || thCur.id, thSel = TH.byId(thPick);
    out += '<section class="card look-card" data-k="look" id="ja-look"><div class="card-h"><h2>Izgled</h2></div>' +
      '<div class="set-row"><span>Početni ekran</span><div class="tseg seg2">' +
        '<button type="button" class="' + (look === 'full' ? 'on' : '') + '" data-a="look" data-v="full">Puno</button>' +
        '<button type="button" class="' + (look === 'mini' ? 'on' : '') + '" data-a="look" data-v="mini">Minimalno</button></div></div>' +
      '<div class="set-row"><span>Stil</span><div class="tseg seg3">' +
        '<button type="button" class="' + (skin === 'dark' ? 'on' : '') + '" data-a="skin" data-v="dark">Tamno</button>' +
        '<button type="button" class="' + (skin === 'retro' ? 'on' : '') + '" data-a="skin" data-v="retro">Strip</button>' +
        '<button type="button" class="' + (skin === 'og' ? 'on' : '') + '" data-a="skin" data-v="og">OG</button></div></div>' +
      (skin === 'og' ? '<p class="muted small">OG ima svoj početni ekran: odbrojavanje do sekunde i poster koji prevlačiš.</p>' : '') +
      (skin === 'retro' ? '<p class="muted small">Strip: papir, crni obrisi, POW! kad nešto odgledaš.</p>' : '') +
      '<div class="th-h"><b>Teme</b><em>' + thOpen.length + ' / ' + TH.LIST.length + ' otključano</em></div>' +
      '<div class="th-row no-drag">' + TH.LIST.map(function (t) {
        var open = thOpen.indexOf(t.id) >= 0;
        return '<button type="button" class="th-sw' + (t.id === thCur.id && skin === 'dark' ? ' on' : '') + (open ? '' : ' lock') + (t.id === thPick ? ' pick' : '') + '" data-a="theme" data-v="' + t.id + '" style="--a:' + t.c1 + ';--b:' + t.c2 + '">' +
          '<span class="th-dot">' + (open ? '' : '<i>🔒</i>') + '</span><b>' + esc(t.name) + '</b></button>';
      }).join('') + '</div>' +
      '<p class="th-note">' + (thOpen.indexOf(thSel.id) >= 0
        ? (skin === 'dark' ? '<b>' + esc(thSel.name) + '</b> — tema je uključena.' : 'Teme idu uz stil <b>Tamno</b>.')
        : '🔒 <b>' + esc(thSel.name) + '</b>: ' + esc(thSel.req.how) + ' · <b>' + Math.min(thSel.req.need, thSel.req.have(s)) + ' / ' + thSel.req.need + '</b>') + '</p>' +
      '</section>';

    /* novo u aplikaciji - dok ne procitas */
    if (s.seenNews !== NEWS[0].id) {
      out += '<button type="button" class="card news-card" data-k="newscard" data-a="news">' +
        '<span class="nc-dot"></span><span class="nc-t"><em>NOVO · v' + esc(MM.VERSION) + '</em><b>' + esc(NEWS[0].title) + '</b>' +
        '<span>' + esc(NEWS[0].items[0].replace(/<[^>]+>/g, '').split(' — ')[0]) + ' i još ' + (NEWS[0].items.length - 1) + ' novosti</span></span>' +
        '<span class="nc-go">›</span></button>';
    }

    /* kolekcija */
    var B = MM.Badges, dm = B.doneMap(s), gs = B.gauntletState(dm);
    var recent = Object.keys(s.log || {}).sort(function (a, b) { return (s.log[b].t || 0) - (s.log[a].t || 0); })
      .map(function (k) { return k.split('#')[0]; }).filter(function (id, i, arr) { return dm[id] && arr.indexOf(id) === i; }).slice(0, 5);
    out += '<section class="card col-card" data-k="colc" data-a="collection" role="button">' +
      '<div class="cc-gt">' + B.gauntletSvg(gs, 'gt-mini') + '</div>' +
      '<div class="cc-t"><em>KOLEKCIJA</em><b>' + Object.keys(dm).length + ' / ' + Cat.all().length + ' predmeta</b>' +
        '<span>' + gs.n + '/6 kamenja · ' + Object.keys(s.ach || {}).length + '/' + B.ACH.length + ' dostignuća</span>' +
        '<div class="cc-recent">' + recent.map(function (id) { return B.tile(Cat.get(id), { size: 'xs' }); }).join('') + '</div></div>' +
      '<span class="nc-go">›</span></section>';
    var wk = recapData(ctx, mondayOf(ctx.plan.today));
    out += '<button type="button" class="card wk-card" data-k="wkc" data-a="recap" data-v="' + mondayOf(ctx.plan.today) + '">' +
      '<span class="wk-t"><em>OVA NEDELJA</em><b>' + (wk.units ? hm(wk.min) + ' · ' + nNaslov(wk.titles.length) : 'Još ništa') + '</b></span>' +
      '<span class="wk-dots">' + wk.days.map(function (d) { return '<i class="' + (d.n ? 'on' : '') + (d.d === ctx.plan.today ? ' t' : '') + '"></i>'; }).join('') + '</span>' +
      '<span class="nc-go">›</span></button>';

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
    var pc = pcInfo(it);
    if (pc) out += '<p class="pc-line' + (pc.none ? ' none' : '') + '">' + ICON.clap + '<span>' + esc(pc.t) + '</span></p>';
    var bsp = MM.Badges.spec(it), brr = MM.Badges.rarityOf(it);
    out += '<button type="button" class="item-bd" data-a="bd-open" data-id="' + esc(id) + '">' + MM.Badges.tile(it, { locked: !done, size: 'sm' }) +
      '<span><em class="r-' + brr + '">PREDMET · ' + MM.Badges.RARITY[brr].name.toUpperCase() + '</em><b>' + esc(done ? bsp.name : 'Zaključan predmet') + '</b>' +
      '<i>' + (done ? 'tvoj je' : 'dobiješ ga kad odgledaš') + '</i></span></button>';

    if (isGoal && P.today() >= P.DOOMSDAY_ISO) {
      out += done ? '<button type="button" class="btn ghost wide" data-a="item-toggle" data-id="' + esc(id) + '">✓ Odgledano u bioskopu — poništi</button>'
        : '<button type="button" class="btn primary wide" data-a="goal-done">' + ICON.check + ' Odgledao sam u bioskopu</button>';
    }
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
        out += '</div><p class="muted small">Drži prst na epizodi = označi sve do nje.</p>';
        if (seen.length) {
          var ea = epAvg(s, id), em = (s.epStars || {})[id] || {};
          out += '<div class="ep-rates"><div class="eps-h"><h3>Ocene epizoda</h3>' +
            (ea ? '<span class="ep-avg">★ <b>' + avgStr(ea.avg) + '</b> prosek · ' + ea.n + '/' + it.episodes + '</span>' : '<span class="muted small">oceni svaku epizodu</span>') + '</div>';
          seen.forEach(function (e) {
            out += '<div class="ep-rate"><span class="ep-n">ep ' + e + '</span><span class="ep-st">';
            for (var n = 1; n <= 5; n++) out += '<button type="button" class="' + (n <= (em[e] || 0) ? 'on' : '') + '" data-a="ep-star" data-id="' + esc(id) + '" data-ep="' + e + '" data-n="' + n + '">★</button>';
            out += '</span></div>';
          });
          out += '</div>';
        }
        out += '' +
          '<div class="btn-row">' +
          (done ? '<button type="button" class="btn ghost" data-a="item-toggle" data-id="' + esc(id) + '">Poništi sve</button>'
                : '<button type="button" class="btn primary" data-a="item-toggle" data-id="' + esc(id) + '">' + ICON.check + ' Cela sezona odgledana</button>') +
          '</div>';
      } else {
        out += '<button type="button" class="btn ' + (done ? 'ghost' : 'primary') + ' wide" data-a="item-toggle" data-id="' + esc(id) + '">' +
          (done ? '✓ Odgledano — poništi' : ICON.check + ' Označi kao odgledano') + '</button>';
      }
    }

    /* tier list */
    if (done && MM.Tiers) out += MM.Tiers.line(id);

    /* kviz o naslovu */
    if (!isGoal && done && MM.Quiz && MM.Quiz.has(id)) {
      var qr = MM.Quiz.result(id);
      out += qr ? '<div class="qz-line done"><img src="img/ui/target.webp" alt=""><span><b>Kviz: ' + qr.c + ' / ' + qr.n + '</b><i>' + (qr.c === qr.n ? 'sve tačno' : 'urađen') + '</i></span></div>'
        : '<button type="button" class="qz-line" data-a="quiz" data-id="' + esc(id) + '"><img src="img/ui/target.webp" alt=""><span><b>Kviz o ' + (Cat.isSeries(it) ? 'sezoni' : 'filmu') + '</b><i>do ' + (Math.min(5, MM.QUIZ[id].length) * 40) + ' novčića i kutija za sve tačno</i></span><em>Kreni</em></button>';
    }

    /* ocene */
    if (!isGoal) {
      out += '<div class="sec"><div class="eps-h"><h3>Ocene ekipe</h3>' + (avg ? '<span>' + stars(Math.round(avg)) + ' <b>' + avg.toFixed(1) + '</b> (' + revs.length + ')</span>' : '<span class="muted">još nema</span>') + '</div>';
      revs.slice(0, 6).forEach(function (r) {
        out += '<div class="rev-mini">' + revStars(r) + '<b>' + esc(r.name || 'Bez imena') + '</b>' + revText(r, it, ctx) + '</div>';
      });
      if (ctx.user) {
        if (Cat.isSeries(it) && !done) out += '<p class="muted small">Recenziju pišeš kad odgledaš celu sezonu — ocena je prosek tvojih ocena epizoda.</p>';
        else out += '<button type="button" class="btn ghost sm" data-a="rate" data-id="' + esc(id) + '">' + (mine ? 'Izmeni svoju ocenu' : (Cat.isSeries(it) ? '★ Napiši recenziju sezone' : '★ Oceni')) + '</button>';
      }
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
    var ea = Cat.isSeries(it) ? epAvg(ctx.s, r.id) : null;
    var out = '<div class="pad-sheet rate"><div class="rate-h">' + UI.poster(it, 'thumb') +
      '<div><h2>' + (ea ? 'Kakva je bila sezona?' : 'Kako ti je bio?') + '</h2><span class="muted">#' + it.order + ' ' + esc(it.title) + '</span></div></div>';
    if (ea) {
      out += '<div class="rate-avg"><div class="star-pick fixed">';
      for (var k = 1; k <= 5; k++) out += '<span class="sp' + (k <= Math.round(ea.avg) ? ' on' : '') + '">★</span>';
      out += '</div><p><b>' + avgStr(ea.avg) + '</b> — prosek tvojih ocena za ' + ea.n + ' ' + plural(ea.n, 'epizodu', 'epizode', 'epizoda') + '</p></div>';
    } else {
      out += '<div class="star-pick">';
      for (var n = 1; n <= 5; n++) out += '<button type="button" class="sp' + (n <= r.stars ? ' on' : '') + '" data-a="rate-star" data-n="' + n + '">★</button>';
      out += '</div>';
    }
    out += '<label class="field"><span>' + (ea ? 'Recenzija cele sezone (opciono)' : 'Kratak utisak (opciono)') + '</span>' +
      '<textarea id="rateText" maxlength="500" rows="3" placeholder="U jednoj rečenici…">' + esc(r.text || '') + '</textarea></label>' +
      '<div class="btn-row">' +
      (mine ? '<button type="button" class="btn danger" data-a="rate-del">Obriši</button>' : '<button type="button" class="btn ghost" data-a="sheet-close">Preskoči</button>') +
      '<button type="button" class="btn primary" data-a="rate-save"' + (r.stars || ea ? '' : ' disabled') + '>Objavi</button></div></div>';
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
    { id: '2.26', title: 'Tvoj tier list', big: true, items: [
      '<b>Tier list</b> — kad odgledaš film ili celu sezonu (posle kviza), biraš gde ide: <b>S, A, B, C, D ili F</b>. Odmah vidiš u kom je društvu.',
      'Ceo tier list je u <b>Ja → Moj tier list</b>: svi posteri po redovima. Tapni poster da ga premestiš.',
      'Već si gledao gomilu filmova? <b>Rangiraj redom</b> — ide jedan po jedan, samo tapkaš S–F.',
      '<b>Sačuvaj kao sliku</b> i pošalji ekipi, pa svađa može da počne.',
      'Na stranici svakog odgledanog naslova vidiš njegov tier i možeš da ga promeniš.'
    ], cta: { a: 'tierlist', label: 'Otvori tier list' } },
    { id: '2.25.3', title: 'Sitne popravke', big: false, items: [
      'Sitne popravke u igrama.'
    ] },
    { id: '2.25.2', title: 'Runner: mirnija kamera', big: false, items: [
      'Kamera se više ne naginje kad skrećeš, pa se ekran ne trese.'
    ] },
    { id: '2.25.1', title: 'Kviz uživo među igrama', big: false, items: [
      '<b>Kviz uživo</b> je sada obična kartica u Mini igrama, pored ostalih. Na kartici piše koliko si puta pobedio.'
    ] },
    { id: '2.25', title: 'Kviz uživo, teme i novi junaci', big: true, items: [
      '<b>Kviz uživo</b> — Igre → Kviz uživo. Napravi kviz, ekipa uđe, ti klikneš KRENI. Svi dobijaju ista pitanja u isto vreme, <b>brži tačan odgovor = više poena</b>. Posle svakog pitanja poredak, na kraju podijum. Pobednik dobija kutiju.',
      '<b>Podijumi</b> — rang liste su sada pravi podijumi (1, 2, 3), ostali ispod. Ekipa, igre (Nivo · Runner · Beskonačno) i nova lista <b>Najbolje ocenjeno</b> sa posterima.',
      '<b>Beskonačno, kako treba</b> — Kamenje: jedan kamen, pa dva, pa tri… niz raste za po jedan. Kviz: pitanja do prve greške. Uhvati Dooma: svaki pogodak dodaje vreme, preživi što duže.',
      '<b>Teme</b> — 8 tema boja (Wakanda, Asgard, Kosmos, Talokan, Gama, Multiverzum, Doomsday…). Otključavaju se gledanjem i igrom. Ja → Izgled, sada i manji i lepši.',
      '<b>Runner</b> — 5 novih junaka: Loki, Scarlet Witch, Wolverine, Star-Lord i Shang-Chi (otključaš ih gledanjem njihovih filmova). Novi boardovi <b>Bifrost</b> i <b>Kvant</b> u kutijama.',
      '<b>Nove moći</b> — Kamen vremena (sve se uspori) i Kamen moći (ruši sve prepreke, i vozove). Bolje animacije: salto sa Spider skokom, doskok, prašina, linije brzine i usporen snimak kad padneš.'
    ], cta: { a: 'livequiz', label: 'Kviz uživo' } },
    { id: '2.24', title: 'Kviz posle filma + zvuk', big: true, items: [
      '<b>Kviz posle filma</b> — kad odgledaš film ili celu sezonu, dobiješ do 5 pitanja o njemu (15 sekundi po pitanju). Ima ih za preko 120 naslova.',
      'Svaki tačan odgovor = <b>40 novčića + 50 Pass poena</b> u Marvel Runneru. Sve tačno = <b>misteriozna kutija</b>. Kviz se radi jednom, a možeš i kasnije iz stranice filma.',
      '<b>Zvukovi</b> — dugmići, „Odgledano“, nagrade, kutije, kviz i ceo Runner (skok, novčići, udarci, power-upovi).',
      '<b>Muzika</b> — svoja muzika za meni Runnera, trku, borbu sa ekipom i mini igre. Sve smo sami napravili.',
      'Zvuk i muziku isključuješ posebno u <b>Ja</b>.'
    ] },
    { id: '2.23', title: 'Borba sa ekipom', big: true, items: [
      '<b>Borba sa ekipom</b> — u Runneru klikni „Borba sa ekipom“, napravi borbu i javi ekipi. Ko uđe, čeka; ti klikneš KRENI. Svi trče <b>istu stazu</b>, a pobeđuje ko <b>poslednji padne</b>.',
      'U borbi nema novčića, moći likova ni nastavka — fer za sve. Uživo vidiš ko je još živ i ko je dokle stigao.',
      '<b>Nove prepreke</b> — Doombotovi stoje na šinama (samo druga traka) i crveni laseri (skoči ili se provuci). 10 novih deonica.',
      '<b>Zone</b> — posle svakih 1.000 m staza se menja: dnevni grad, noćni grad, pa Doomsday ruševine pod crvenim nebom.'
    ], cta: { a: 'runner', label: 'Igraj' } },
    { id: '2.22', title: 'Boardovi iz kutija', big: false, items: [
      '<b>Doom board</b> je sada samo finale Passa (nivo 40).',
      '<b>Ostali boardovi</b> (Mjolnir, Gama, Vibranijum, Kosmik, Stark) ispadaju iz misterioznih kutija. Na mestima u Passu gde su bili sada su kutije.',
      'Boardovi koje već imaš ostaju tvoji. Ako već imaš Doom board kad stigneš do nivoa 40, umesto njega dobijaš 3 kutije.'
    ] },
    { id: '2.21.2', title: 'Popravke u Runneru', big: false, items: [
      '<b>Novčići više ne lebde</b> — kad te štit ili board spase od voza, novčići sa njegovog krova nestanu zajedno sa njim.',
      '<b>Hoverboard</b> — tokeni dok voziš dodaju 2 s, ali vreme nikad ne ide preko maksimuma boarda.',
      '<b>Mjolnir let, iz početka</b> — novčići u vazduhu dolaze pravo do tebe i uvek ih pokupiš, u kojoj god traci da letiš. Kad let prestane, nestanu. Ništa više ne lebdi.',
      '<b>Magnet</b> — vuče samo novčiće ispred tebe i pokupi ih čim stignu (nema više novčića koji lete iza tebe).'
    ] },
    { id: '2.21', title: 'Kodovi i kutije', big: true, items: [
      '<b>Kod za nagradu</b> — u profilu (Ja) unesi kod koji ti pošalje Kosta i dobijaš nagradu u Marvel Runneru.',
      '<b>Misteriozne kutije</b> — nasumične nagrade (obično, retko, epsko, legendarno). Kupuješ ih u Moćima, dobijaš ih za sve tri misije i u Maraton passu.'
    ], cta: { a: 'runner', label: 'Igraj' } },
    { id: '2.20.2', title: 'Board i tutorijal popravljeni', big: false, items: [
      '<b>Board</b> — treba 15 plavih tokena (dolaze u grupi od 8), svaki token dok voziš dodaje 2 s. Aktiviraš ga <b>jednim tapom bilo gde</b> na ekranu.',
      '<b>Tokeni</b> su sad mali plavi novčići, ne velike svetleće ikonice.',
      '<b>Jedan brojač</b> za board (samo dugme dole desno).',
      '<b>Popravljeno</b>: novčići više ne lebde u vazduhu posle Mjolnira i magneta, poruke tutorijala nestaju kad treba, i rampa više ne „udari“ u voz na sporijim telefonima.'
    ] },
    { id: '2.20.1', title: 'Boardovi imaju moći', big: false, items: [
      '<b>Svaki board ima malu moć</b> — Klasik traje duže, Mjolnir super skok, Gama magnet, Vibranijum 2 udarca, Kosmik dupli novčići, Stark se brže puni, Doom kreće pun.',
      '<b>Popravljeno</b> — aplikacija se više ne osvežava sama posle update-a, pa „Šta je novo“ ne nestane dok ga čitaš.'
    ] },
    { id: '2.20', title: 'Runner: board, let i teža staza', big: true, items: [
      '<b>Hoverboard kao u SSC</b> — novi board sa crtežom i tragom, junak čuči i surfuje. Tokeni dolaze u grupi od 5; treba ti 8, a svaki token dok si na boardu dodaje 3 s.',
      '<b>Mjolnir let</b> — junak leti kao Supermen, kamera ide gore, novčići u vazduhu vijugaju po trakama i nestanu kad let prestane.',
      '<b>×2 se vidi</b> — dok traje, svaki novčić je dupli (dva jedan pored drugog).',
      '<b>Teže</b> — brže ubrzava, deonice su zbijenije, teže deonice dolaze ranije, vozovi u susret su brži.',
      '<b>Sporiji napredak</b> — manje XP-a, manje novčića za daljinu, pass traži više. Tvoj nivo passa je preračunat, ništa ne gubiš.',
      '<b>Pass sa dve trake</b> — levo besplatno, desno Maraton: nivo n traži n odgledanih naslova. Gledaj, pa uzimaj.',
      '<b>Lepša staza</b> — nebo sa oblacima, drveće, hidranti, debeli pragovi, crtani obris oko junaka. Nema više stajanja posle koluta.',
      '<b>Mini igre</b> — 20 nivoa umesto 10 i novi beskonačni mod sa svojim rekordom.'
    ], cta: { a: 'runner', label: 'Igraj' } },
    { id: '2.19', title: 'Runner: pravi 3D junaci', big: true, items: [
      '<b>Pravi 3D junaci</b> — profesionalne animacije (sprint, skok, kolut, ples, pad), kostim za svakog: Kepov štit, Torov plašt, Iron Manova kaciga, Spajdijeve oči…',
      '<b>Kolekcija kao u Subway Surfers City</b> — junaci i boardovi imaju nivo i množilac poena (×). Diže se za novčiće + tokene; svaki nivo daje i bonus kolekcije.',
      '<b>Board tokeni</b> — skupi 3 plava tokena u trci i tapni dugme dole desno za hoverboard.',
      '<b>Staza od ručno pravljenih deonica</b> — nema više nasumičnih prepreka; svaka deonica je proverena da ima prolaz iz svake trake.',
      '<b>Tutorijal</b> — prva trka staje ispred prepreke i pokaže šta da prevučeš.',
      '<b>Izgleda kao ostatak aplikacije</b> — isti font i boje, nove ikonice iz Figme umesto emojija, „nazad“ na telefonu radi svuda.',
      'Sav napredak je sačuvan: novčići, ključevi, pass i moći ostaju, a stari boardovi su postali board tokeni.'
    ], cta: { a: 'runner', label: 'Igraj' } },
    { id: '2.18.1', title: 'Niko ne gubi napredak', big: false, items: [
      '<b>Nivo ostaje isti</b> — XP je prebačen na novu skalu tako da svako ima tačno isti nivo i procenat kao pre. Rang lista računa sve isto.',
      '<b>Poklon za stare rekorde</b> — svaki pređen nivo u mini igrama (i u igrama koje su izbačene) i stari rekord u Runneru pretvoreni su u novčiće i ključeve. Čeka te kad otvoriš Runner.',
      'Runner daje više XP-a nego u 2.18 (1 XP na 50 m, do 60 po trci).'
    ], cta: { a: 'runner', label: 'Uzmi poklon' } },
    { id: '2.18', title: 'Marvel Runner 3D', big: true, items: [
      '<b>Prava 3D igra</b> — kamera iza tebe kao u Subway Surfersu, grad, grafiti, šine i vozovi u 3D.',
      '<b>Penji se na vozove</b> — rampe vode na krov, trčiš po vagonima. Neki vozovi idu ka tebi (upaljeni farovi).',
      '<b>Pravi pokreti</b> — likovi trče, skaču, prave kolut i naginju se. Doom juri kad se sapleteš.',
      '<b>Moći u trci</b> — magnet, Mjolnir let, ×2, Spider skok i štit. Dupli tap = hoverboard.',
      '<b>Marvel Pass</b> — 40 nivoa nagrada (novčići, ključevi, boardovi, izgledi). Što dalje trčiš, više dobiješ.',
      '<b>Dnevne misije</b>, nadogradnje moći za novčiće i nastavak posle pada za ključ.',
      '<b>Manje, a bolje mini igre</b> — 5 najboljih, svaka sa svojim menijem i stazom od 10 nivoa.',
      '<b>Tvoj nivo ostaje isti</b> — XP je prebačen na novu skalu, a stari rekordi iz igara postaju poklon u Runneru (novčići i ključevi).'
    ], cta: { a: 'runner', label: 'Igraj' } },
    { id: '2.17', title: 'Novi Marvel Runner', big: false, items: [
      '<b>Pravi likovi</b> — svih 13 junaka i Doom oslikani u Figmi, vide se s leđa dok trče.',
      '<b>Pošteno</b> — uvek postoji slobodna traka do koje stižeš; nema više zida od vozova.',
      '<b>Lepše</b> — šine, pragovi, pozadina iz mape, oslikani vozovi, barijere, novčići, iskre i plavi štit koji skupljaš za dodatni život.',
      'Počinje sporije, a ubrzava postepeno.'
    ] },
    { id: '2.16.1', title: 'Kviz: 250+ pitanja', big: false, items: [
      '<b>Marvel kviz sad ima preko 250 pitanja</b> — glumci, reditelji, negativci, kamenje, X-Meni, Netflix serije, Spider-Verse, Fantastic Four, Thunderbolts* i Doomsday.'
    ] },
    { id: '2.16', title: 'Marvel Runner', big: true, items: [
      '<b>Marvel Runner</b> — trči ka Doomsdayu kao u Subway Surfersu: prevuci levo/desno, gore za skok, dole za klizanje. Preskači barijere, provlači se ispod greda, izbegavaj vozove, kupi novčiće.',
      '<b>Likovi se otključavaju filmovima</b> — Iron Man, Cap, Thor, Hulk, Spider-Man, Black Panther, Doctor Strange, Deadpool… svaki ima svoju moć. Doom stiže sa Doomsdayem.',
      '<b>Filmovi pomažu</b> — svaki odgledan naslov je +1% poena (do ×2).',
      'Ne igraš? Profil → <b>Tab Igre</b> → isključi, i tab nestaje.'
    ], cta: { a: 'runner', label: 'Trči' } },
    { id: '2.15', title: '10 igara', big: false, items: [
      '<b>Tri nove igre</b> — Čiji je predmet? (predmet → film), Hulk razbija (brzi prsti) i Portali (pazi na Dormammua).',
      '<b>Bolje stare igre</b> — odbrojavanje 3-2-1 pre početka, „+1“ kad pogodiš Dooma, kviz i kamenje pokažu tačan odgovor kad pogrešiš, konfete kad pređeš nivo.',
      'Kviz ima 50 pitanja.'
    ] },
    { id: '2.14', title: 'Igre: novi tab, nivoi i rang lista', big: true, items: [
      '<b>Novi tab Igre</b> — 7 igara: Uhvati Dooma, Kamenje, Marvel kviz, Memorija, Hronologija, Mjolnir i Pucanj prstima.',
      '<b>Nivoi i XP</b> — svaki pređen nivo daje XP; tvoj nivo raste od Rekruta do Doomovog rivala. Klasika (tri zaredom) daje trostruko.',
      '<b>Rang lista ekipe</b> — ko ima najviše XP i ko drži rekord u kojoj igri.'
    ], cta: { a: 'tab', label: 'Igraj', tab: 'igre' } },
    { id: '2.13', title: 'Mini igre', big: false, items: [
      '<b>Mini igre u profilu</b> — Uhvati Dooma, Kamenje beskonačnosti i Marvel kviz. Igraš svaku posebno ili sve tri zaredom.',
      'Biraš nivo (1–10); pamti se tvoj rekord za svaku igru.'
    ] },
    { id: '2.10', title: 'Ocene epizoda', big: false, items: [
      '<b>Oceni svaku epizodu</b> — posle svake epizode iskoči traka sa zvezdicama. Sve ocene su i u detaljima sezone.',
      '<b>Ocena sezone = prosek</b> tvojih ocena epizoda. Recenziju (tekst) pišeš tek kad odgledaš celu sezonu.'
    ] },
    { id: '2.9', title: 'OG izgled', big: false, items: [
      '<b>OG</b> — aplikacija izgleda kao prva verzija: crveno odbrojavanje do sekunde, plamen niza, „Dnevno / Ove nedelje“ i veliki poster koji prevlačiš (desno odgledano, levo nazad, gore preskoči).',
      'Pet tabova kao nekad: Danas, Kalendar, Ekipa, Biblioteka, Ja. Sve novo (150 naslova, plan, predmeti) je i dalje tu.',
      'Menja se u Profil → Izgled → Stil.'
    ], cta: { a: 'skin-og', label: 'Uključi OG' } },
    { id: '2.8', title: 'Retro strip', big: false, items: [
      '<b>Novi stil: Retro strip</b> — žuti papir sa tačkicama, crni obrisi, slova kao u starim stripovima i „POW!“ kad odgledaš.',
      'Ide uz oba rasporeda: Puno ili Minimalno. Menja se u Profil → Izgled.'
    ], cta: { a: 'skin-retro', label: 'Probaj Retro' } },
    { id: '2.7', title: 'Minimalni izgled', big: true, items: [
      '<b>Previše svega na početnom?</b> Uključi <b>Minimalno</b>: samo koliko dana je ostalo i veliki poster onoga što je na redu.',
      'Poster <b>prevučeš desno</b> kad odgledaš, <b>levo</b> da vratiš prethodno. Tap na poster otvara detalje.',
      'Sve ostalo (mapa, predmeti, ekipa) je i dalje tu, samo se ne gura na početnom. Menja se u Profil → Izgled.'
    ], cta: { a: 'look-mini', label: 'Probaj Minimalno' } },
    { id: '2.6', title: 'Predmeti, Gauntlet i nedeljni pregled', big: true, items: [
      '<b>Predmet za svaki naslov</b> — odgledaš Thora, dobiješ Mjolnir. Guardians? Awesome Mix kaseta. Svih 150, od običnih do legendarnih. Tapni predmet i nešto uradi.',
      '<b>Infinity Gauntlet</b> — kamenje skupljaš iz filmova u kojima se pojavljuje i ono lebdi. Na Endgame dobiješ rukavicu, kamenje uleti u nju — i pucanj prstima.',
      '<b>Slavlje posle „Odgledano“</b> — pomeriš se na putu, Doom nešto dobaci i dobiješ predmet.',
      '<b>Dostignuća</b> — niz dana, broj naslova, noćna ptica, Infinity Saga, svi X-Meni…',
      '<b>Scene posle špice</b> — piše da li da čekaš do kraja ili slobodno gasiš.',
      '<b>Recenzije bez spojlera</b> — dok ne odgledaš, vidiš samo zvezdice. Plus reakcije 🔥😂💀👎.',
      '<b>Nedeljni pregled</b> — šta si gledao, koliko, i da li si bio brži od Dooma.',
      '<b>Otisci na mapi</b> — za svaki dan kad si gledao ostaje trag na putu.',
      'Početni ekran je opet čist: jedna traka, ti, Doom i ekipa.'
    ], cta: { a: 'collection-news', label: 'Otvori kolekciju' } },
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
    if (n.cta) out += '<button type="button" class="btn primary wide" data-a="' + n.cta.a + '"' + (n.cta.tab ? ' data-tab="' + n.cta.tab + '"' : '') + '>' + esc(n.cta.label) + '</button>';
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
    danas: danas, plan: planView, igre: igre, gamesOf: gamesOf, podium: podium, gamePeople: gamePeople, teamBest: teamBest, ekipa: ekipa, katalog: katalog, ja: ja,
    itemSheet: itemSheet, customSheet: customSheet, filterSheet: filterSheet, rateSheet: rateSheet, profileSheet: profileSheet,
    welcomeSheet: welcomeSheet, chooseSheet: chooseSheet, newsSheet: newsSheet, countdownSheet: countdownSheet, epAvg: epAvg, ogCountdown: ogCountdown, crew: crew, NEWS: NEWS, recapSheet: recapSheet, mondayOf: mondayOf, streakSheet: streakSheet, doomSheet: doomSheet,
    clock: clock, countdownParts: countdownParts, ICON: ICON, scopeName: scopeName
  };
})();
