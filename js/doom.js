/* ============================================================
   doom.js  -  "Put do Doomsdaya" (mapa u stilu trophy road-a)
   ------------------------------------------------------------
   Duga vodoravna mapa od pet slikanih zona (img/map/z1..z5.jpg,
   napravljene u Figmi): Latverija -> Suma senki -> Pali grad ->
   Inkurzija -> Doomsday. Preko slika ide staza sa stanicom za svaku
   nedelju (SVG), Doom (img/map/doom.webp) i ciode ekipe.

   Doom stoji tamo gde je DANAS (vreme). Ti i ekipa stojite tamo
   dokle ste stigli u svom planu (odgledano). Dole je traka sa
   dugmicima za skok do Dooma, do sebe, do svakog iz ekipe i do cilja.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI;

  var H = 640;                         // visina sveta (viewBox)
  var IMG = 'img/map/';
  var PW = Math.round(H * 1376 / 768); // sirina jedne zone (slike su 1376x768)
  var OV = 160;                        // preklop zona (meki prelaz)
  var N = 5;
  var XS = 0.37 * PW;                  // start: odmah desno od zamka
  var XE = (N - 1) * (PW - OV) + 0.6 * PW;   // cilj: pred citadelom

  var ZONES = [
    { name: 'LATVERIJA', sub: 'odavde Doom kreće', c1: '#9dffbc', c2: '#1f8f4a', bx: 0.43 },
    { name: 'ŠUMA SENKI', sub: 'nešto gleda iz mraka', c1: '#a7f0e0', c2: '#1d6a63', bx: 0.2 },
    { name: 'PALI GRAD', sub: 'ovde je već bilo kasno', c1: '#ffd27a', c2: '#c46a12', bx: 0.2 },
    { name: 'INKURZIJA', sub: 'dva sveta, jedan opstaje', c1: '#f0b8ff', c2: '#8a2bd0', bx: 0.2 },
    { name: 'DOOMSDAY', sub: 'nema nazad', c1: '#ffc0a8', c2: '#e0160f', bx: 0.16 }
  ];

  function days() { return MM.Plan.daysBetween(MM.Plan.START_ISO, MM.Plan.DOOMSDAY_ISO); }
  function panelX(i) { return i * (PW - OV); }
  function worldW() { return panelX(N - 1) + PW; }
  function xOf(r) { return XS + Math.max(0, Math.min(1, r)) * (XE - XS); }
  function roadY(x) { return 548 + 9 * Math.sin(x / 230) + 5 * Math.sin(x / 83); }
  function f1(n) { return Math.round(n * 10) / 10; }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  /** Doomova glava (isecak iz ilustracije) za trake, kalendar i dugmice. */
  function head(size) {
    size = size || 22;
    return '<img class="dm-head" src="' + IMG + 'doomhead.jpg" width="' + size + '" height="' + size + '" alt="" draggable="false">';
  }


  /* ============================================================
     svet
     ============================================================ */

  function panels() {
    var out = '';
    for (var i = 0; i < N; i++) {
      var x = panelX(i);
      if (i > 0) {
        out += '<mask id="mpM' + i + '" maskUnits="userSpaceOnUse" x="' + x + '" y="0" width="' + PW + '" height="' + H + '">' +
          '<rect x="' + x + '" y="0" width="' + PW + '" height="' + H + '" fill="url(#mpFade)"/></mask>';
      }
      out += '<image href="' + IMG + 'z' + (i + 1) + '.jpg" x="' + x + '" y="0" width="' + PW + '" height="' + H + '" preserveAspectRatio="none"' +
        (i > 0 ? ' mask="url(#mpM' + i + ')"' : '') + '/>';
    }
    // tamna senka pri dnu i vrhu da se UI cita
    out += '<rect width="' + worldW() + '" height="' + H + '" fill="url(#mpVig)"/>';
    return out;
  }

  function banners() {
    return ZONES.map(function (z, i) {
      var x = panelX(i) + z.bx * PW, y = 92;
      return '<g class="mp-banner" transform="translate(' + f1(x) + ' ' + y + ') rotate(-3)">' +
        '<linearGradient id="mpZ' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + z.c1 + '"/><stop offset="1" stop-color="' + z.c2 + '"/></linearGradient>' +
        '<text x="0" y="0" font-size="52" font-weight="900" letter-spacing="1" fill="url(#mpZ' + i + ')" stroke="#07070a" stroke-width="10" paint-order="stroke" stroke-linejoin="round">' + z.name + '</text>' +
        '<text x="4" y="30" font-size="17" font-weight="800" fill="#fff" stroke="#07070a" stroke-width="6" paint-order="stroke" stroke-linejoin="round">' + z.sub + '</text>' +
        '</g>';
    }).join('');
  }

  function roadPath() {
    var pts = [];
    for (var x = XS - 40; x <= XE + 2; x += 16) pts.push(f1(x) + ' ' + f1(roadY(x)));
    return 'M' + pts.join('L');
  }

  /** Kameni put (tekstura iz Figme) + zeleni trag magije do Dooma. */
  function track(xDoom) {
    var d = roadPath();
    return '<path d="' + d + '" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="54" stroke-linecap="round" transform="translate(0 5)"/>' +
      '<path d="' + d + '" fill="none" stroke="#16100c" stroke-width="50" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="url(#mpRoad)" stroke-width="42" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="3" stroke-linecap="round" transform="translate(0 -18)"/>' +
      '<path d="' + d + '" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="7" stroke-linecap="round" transform="translate(0 17)"/>' +
      '<clipPath id="mpPassed"><rect id="mpPassedR" x="0" y="0" width="' + f1(xDoom) + '" height="' + H + '"/></clipPath>' +
      '<g clip-path="url(#mpPassed)">' +
        '<path d="' + d + '" fill="none" stroke="#2bff6a" stroke-opacity=".28" stroke-width="42" stroke-linecap="round"/>' +
        '<path d="' + d + '" fill="none" stroke="#5dff8f" stroke-opacity=".55" stroke-width="16" stroke-linecap="round" filter="url(#dmSoft)"/>' +
        '<path class="mp-trail" d="' + d + '" fill="none" stroke="#d9ffe4" stroke-width="4" stroke-linecap="round" stroke-dasharray="14 18"/>' +
      '</g>';
  }

  /** Stanica za svaku nedelju: kameni medaljon, posle Dooma smaragdni. */
  function nodes(time) {
    var P = MM.Plan, out = '', n = days();
    for (var dd = 0, w = 1; dd <= n; dd += 7, w++) {
      if (n - dd < 3) break;              // poslednju nedelju pokriva cilj
      var iso = P.addDays(P.START_ISO, dd), dt = P.parse(iso);
      var r = dd / n, x = xOf(r), y = roadY(x), past = r <= time + 1e-6;
      var lbl = dt.getDate() + '. ' + UI.MON3[dt.getMonth()];
      var lw = lbl.length * 8.2 + 20;
      out += '<g class="mp-node' + (past ? ' past' : '') + '" transform="translate(' + f1(x) + ' ' + f1(y) + ')">' +
        '<ellipse cx="0" cy="8" rx="27" ry="12" fill="#000" opacity=".5"/>' +
        '<circle r="27" fill="' + (past ? '#0b3a1c' : '#120d0a') + '"/>' +
        '<circle r="23" fill="' + (past ? '#1c8a45' : '#5b5048') + '"/>' +
        '<circle r="23" fill="url(#mpRoad)" opacity="' + (past ? '.35' : '.8') + '"/>' +
        '<circle r="23" fill="' + (past ? 'url(#mpGem)' : 'url(#mpStone)') + '"/>' +
        '<circle r="23" fill="none" stroke="' + (past ? '#b9ffd0' : '#d8cdbf') + '" stroke-width="3"/>' +
        '<path d="M-15 -12A19 19 0 0 1 12 -16" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>' +
        (past ? '<path d="M-9 1l6 6.5 12-13" fill="none" stroke="#04210f" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>'
          : '<text y="6.5" text-anchor="middle" font-size="18" font-weight="900" fill="#fff" stroke="#120d0a" stroke-width="4" paint-order="stroke">' + w + '</text>') +
        '<rect x="' + f1(-lw / 2) + '" y="33" width="' + f1(lw) + '" height="24" rx="8" fill="#120d0a" fill-opacity=".88" stroke="' + (past ? '#5dff8f' : '#6b6259') + '" stroke-width="1.5"/>' +
        '<text y="50" text-anchor="middle" font-size="14" font-weight="900" fill="' + (past ? '#b8ffcf' : '#efe6dc') + '">' + lbl + '</text>' +
        '</g>';
    }
    return out;
  }

  /** Cilj: bioskopski znak (Figma) tacno na dan premijere + karta na putu. */
  function goal() {
    var x = XE, y = roadY(x);
    var sw = 430, sh = Math.round(sw * 513 / 640), k = sw / 640;
    var sx = x - sw / 2, sy = y - sh + 8;
    var pcx = sx + 315 * k, pcy = sy + 232 * k;     // sredina crvenog panela
    return '<g class="mp-goal">' +
      '<ellipse cx="' + x + '" cy="' + (y + 4) + '" rx="190" ry="20" fill="#000" opacity=".45"/>' +
      '<image href="' + IMG + 'sign.webp" x="' + f1(sx) + '" y="' + f1(sy) + '" width="' + sw + '" height="' + sh + '"/>' +
      '<rect x="' + f1(sx + 80 * k) + '" y="' + f1(sy + 150 * k) + '" width="' + f1(470 * k) + '" height="' + f1(164 * k) + '" fill="#ff5a3c" opacity=".1" class="mp-panel"/>' +
      '<text x="' + f1(pcx) + '" y="' + f1(pcy - 22) + '" text-anchor="middle" font-size="18" font-weight="900" letter-spacing="5" fill="#ffd36b">AVENGERS</text>' +
      '<text x="' + f1(pcx) + '" y="' + f1(pcy + 16) + '" text-anchor="middle" font-size="40" font-weight="900" letter-spacing="1" fill="url(#mpTitle)" stroke="#3a0508" stroke-width="3" paint-order="stroke">DOOMSDAY</text>' +
      '<text x="' + f1(pcx) + '" y="' + f1(pcy + 42) + '" text-anchor="middle" font-size="14" font-weight="900" letter-spacing="2.5" fill="#ffd9cf">18. DECEMBAR · BIOSKOP</text>' +
      '</g>';
  }

  function ticket() {
    var x = XE, y = roadY(x);
    return '<circle cx="' + x + '" cy="' + (y - 6) + '" r="52" fill="#ffd36b" opacity=".4" filter="url(#dmSoft)" class="mp-pulse"/>' +
      '<image class="mp-ticket" href="' + IMG + 'goal.webp" x="' + (x - 48) + '" y="' + (y - 58) + '" width="96" height="92"/>';
  }

  function embers() {
    var r = rnd(71), out = '', x0 = panelX(3) + 0.3 * PW, x1 = worldW();
    for (var i = 0; i < 46; i++) {
      var x = x0 + r() * (x1 - x0), y = 420 + r() * 220;
      out += '<circle class="mp-ember" style="animation-delay:' + f1(r() * 5) + 's;animation-duration:' + f1(3 + r() * 4) + 's" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(1.2 + r() * 2.2) + '" fill="#ffb070"/>';
    }
    return out;
  }

  /** Doom: prava ilustracija + aura + senka. Hod = ljuljanje kao figura u igri. */
  function doomFigure() {
    var h = 236, w = Math.round(h * 432 / 620);
    return '<g class="dm2">' +
      '<ellipse class="dm2-aura" cx="0" cy="-118" rx="115" ry="150" fill="url(#dmAura)"/>' +
      '<ellipse cx="0" cy="2" rx="70" ry="13" fill="#000" opacity=".55"/>' +
      '<g class="dm2-body"><image href="' + IMG + 'doom.webp" x="' + (-w / 2 - 6) + '" y="' + (-h + 6) + '" width="' + w + '" height="' + h + '"/></g>' +
      '<circle class="dm2-magic" cx="' + (-w / 2 + 22) + '" cy="' + (-h + 76) + '" r="34" fill="url(#dmMagic)"/>' +
      '<g class="mp-tag" transform="translate(0 ' + (-h - 22) + ')"><rect x="-40" y="-15" width="80" height="28" rx="14" fill="#0f3d20" stroke="#7dffa4" stroke-width="2"/>' +
        '<text y="5" text-anchor="middle" font-size="15" font-weight="900" fill="#b8ffcf" letter-spacing="1.5">DOOM</text></g>' +
      '</g>';
  }

  /** Otisci: za svaki dan kad si gledao, trag na putu tamo gde si bio na kraju dana. */
  function trail(list) {
    return (list || []).map(function (t, i) {
      var x = xOf(t.r), y = roadY(x);
      return '<g class="mp-fp" data-i="' + i + '" transform="translate(' + f1(x) + ' ' + f1(y) + ')">' +
        '<circle r="20" fill="transparent"/>' +
        '<ellipse cx="-5" cy="-3" rx="4.2" ry="7" transform="rotate(-14 -5 -3)" fill="#ffd36b" stroke="#2a1a05" stroke-width="1.6"/>' +
        '<ellipse cx="5" cy="5" rx="4.2" ry="7" transform="rotate(14 5 5)" fill="#ffd36b" stroke="#2a1a05" stroke-width="1.6"/>' +
        '</g>';
    }).join('');
  }

  /** Cioda za svakog iz ekipe: slika ili slovo, ime iznad. Ti si crven. */
  function pin(p, i) {
    var col = p.me ? '#e62429' : '#3d8bff';
    var clip = 'mpClip' + i, label = p.label;
    var lw = label.length * 8.6 + 22;
    return '<g class="mp-pin' + (p.me ? ' me' : '') + '" id="mpPin' + i + '" data-i="' + i + '">' +
      (p.me ? '<circle cx="0" cy="0" r="40" fill="' + col + '" opacity=".35" filter="url(#dmSoft)"/>' : '') +
      '<path d="M0 46L-12 26H12Z" fill="' + col + '"/>' +
      '<circle r="29" fill="' + col + '"/><circle r="25" fill="#1d1d24"/>' +
      (p.photo ? '<clipPath id="' + clip + '"><circle r="25"/></clipPath><image href="' + UI.esc(p.photo) + '" x="-25" y="-25" width="50" height="50" clip-path="url(#' + clip + ')" preserveAspectRatio="xMidYMid slice"/>'
        : '<text y="9" text-anchor="middle" font-size="26" font-weight="900" fill="#fff">' + UI.esc((p.name || '?').slice(0, 1).toUpperCase()) + '</text>') +
      '<g transform="translate(0 -44)"><rect x="' + f1(-lw / 2) + '" y="-13" width="' + f1(lw) + '" height="24" rx="12" fill="' + col + '" stroke="#07070a" stroke-width="2"/>' +
      '<text y="5" text-anchor="middle" font-size="14" font-weight="900" fill="#fff">' + UI.esc(label) + '</text></g>' +
      '<text y="76" text-anchor="middle" font-size="13" font-weight="900" fill="#fff" stroke="#07070a" stroke-width="4" paint-order="stroke">' + Math.round(p.ratio * 100) + '%</text>' +
      '</g>';
  }

  /** Raspored cioda: ko je blizu drugog, podigne se iznad. */
  function layout(people) {
    var list = people.map(function (p, i) { return { i: i, x: xOf(p.ratio) }; }).sort(function (a, b) { return a.x - b.x; });
    var placed = [];
    list.forEach(function (o) {
      var lvl = 0;
      while (placed.some(function (q) { return q.lvl === lvl && Math.abs(q.x - o.x) < 74; })) lvl++;
      o.lvl = lvl;
      placed.push(o);
    });
    var out = {};
    placed.forEach(function (o) { out[o.i] = o; });
    return out;
  }


  function svgWorld(ctx) {
    var W = worldW(), xd = xOf(ctx.from != null ? ctx.from : ctx.time);
    var defs = '<defs>' +
      '<linearGradient id="mpFade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset="' + (OV / PW).toFixed(3) + '" stop-color="#fff"/></linearGradient>' +
      '<linearGradient id="mpVig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".22" stop-color="#000" stop-opacity="0"/>' +
        '<stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>' +
      '<pattern id="mpRoad" patternUnits="userSpaceOnUse" width="110" height="110"><image href="' + IMG + 'road.jpg" width="110" height="110"/></pattern>' +
      '<radialGradient id="mpStone" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="#fff2e0" stop-opacity=".3"/><stop offset=".6" stop-color="#2a221c" stop-opacity=".15"/><stop offset="1" stop-color="#0d0a08" stop-opacity=".6"/></radialGradient>' +
      '<radialGradient id="mpGem" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="#d4ffe0" stop-opacity=".95"/><stop offset=".45" stop-color="#3be27a" stop-opacity=".85"/><stop offset="1" stop-color="#0a5a28" stop-opacity=".95"/></radialGradient>' +
      '<linearGradient id="mpTitle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb199"/><stop offset=".55" stop-color="#ff3b30"/><stop offset="1" stop-color="#b30d0d"/></linearGradient>' +
      '<radialGradient id="dmMagic"><stop offset="0" stop-color="#f2fff5"/><stop offset=".3" stop-color="#7dffa4"/><stop offset="1" stop-color="#2bff6a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dmAura"><stop offset="0" stop-color="#3dff7f" stop-opacity=".38"/><stop offset=".55" stop-color="#1bd65a" stop-opacity=".12"/><stop offset="1" stop-color="#0a7a30" stop-opacity="0"/></radialGradient>' +
      '<filter id="dmSoft" x="-.6" y="-.6" width="2.2" height="2.2"><feGaussianBlur stdDeviation="7"/></filter>' +
      '</defs>';
    return '<svg class="mp-svg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + defs +
      panels() + banners() + goal() + track(xd) + nodes(ctx.time) + ticket() + embers() +
      '<g id="mpDoom">' + doomFigure() + '</g>' +
      trail(ctx.trail) +
      (ctx.people || []).map(pin).join('') +
      '<g id="mpSay" class="mp-say" opacity="0"><rect x="-90" y="-30" width="180" height="32" rx="16" fill="#f4fff6"/>' +
        '<path d="M-8 2l8 10 8-10z" fill="#f4fff6"/><text y="-9" text-anchor="middle" font-size="15" font-weight="900" fill="#0c2414"></text></g>' +
      '</svg>';
  }

  /* ============================================================
     pokretanje i kamera
     ============================================================ */

  var LINES = ['Doom ne čeka.', 'Kleknite pred Doomom!', 'Vreme ističe, smrtniče.', 'Latverija pamti.',
    'Gledaj brže.', 'Doom vidi sve epizode.', 'Ti me nećeš stići.', 'Victor von Doom nikad ne kasni.',
    'Doom ne preskače uvod.', 'Spojleri su za slabe.', 'Moja mapa, moja pravila.', 'Još jedna epizoda. Naređujem.',
    'Ni Richards nije ovako spor.', 'Multiverzum je moj.', 'Kokice su za smrtnike.', 'Doom ne pauzira.',
    'Svaki film je korak bliže meni.', 'Bioskop. 18.12. Ne kasni.', 'Tvoj streak me ne plaši.', 'Doom je odgledao sve. Dvaput.',
    'Ovo nije sugestija. Ovo je plan.', 'Skip? Doom ne prašta.', 'Neka gori, neka se gleda.', 'Slabost je gledati na 1.5x.',
    'Doom zna gde staješ sa epizodom.', 'Latverija ima bolji WiFi.', 'Tišina. Film počinje.', 'Ko kasni, gleda spojlere.'];
  var BEHIND = ['Zaostaješ, smrtniče.', 'Vidim tvoju senku… daleko iza.', 'Požuri. Doom se dosađuje.', 'Toliko sati, a ti na pauzi?',
    'Izgubićeš ovu trku.', 'Doom te čeka… ne dugo.'];
  var AHEAD = ['Hm. Brz si… za sada.', 'Impresivno. Za smrtnika.', 'Ne raduj se prerano.', 'Doom ceni posvećenost.',
    'Ispred si mene? Zanimljivo.'];

  /** Recenica za van mape (slavlje posle gledanja): zna da li kasnis. */
  function quip(you, time) {
    if (time >= 1) return ['Doomsday je stigao.', 'Vidimo se u bioskopu, smrtniče.', 'Ovo je bio tvoj put. Sad je moj film.'][Math.floor(Math.random() * 3)];
    var pool = Math.random() < 0.55 ? (you >= time ? AHEAD : BEHIND) : LINES;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function line() {
    var me = cur && cur.ctx.people && cur.ctx.people[0];
    var pool = LINES;
    if (me && Math.random() < 0.4) pool = me.ratio >= cur.ctx.time ? AHEAD : BEHIND;
    var l = pool[Math.floor(Math.random() * pool.length)];
    if (cur && l === cur.last) return line();
    if (cur) cur.last = l;
    return l;
  }

  var cur = null;   // { el, svg, scale, ctx, lay, anim, doomX }

  function doomAt(x) {
    var y = roadY(x) + 2;
    cur.svg.querySelector('#mpDoom').setAttribute('transform', 'translate(' + f1(x) + ' ' + f1(y) + ')');
    cur.svg.querySelector('#mpPassedR').setAttribute('width', f1(x));
    cur.svg.querySelector('#mpSay').setAttribute('transform', 'translate(' + f1(x) + ' ' + f1(y - 300) + ')');
    cur.doomX = x;
  }

  function placePins() {
    (cur.ctx.people || []).forEach(function (p, i) {
      var o = cur.lay[i], el = cur.svg.querySelector('#mpPin' + i);
      if (!o || !el) return;
      var y = roadY(o.x) - 52 - o.lvl * 104;
      el.setAttribute('transform', 'translate(' + f1(o.x) + ' ' + f1(y) + ')');
    });
  }

  function say(text) {
    var g = cur.svg.querySelector('#mpSay');
    g.querySelector('text').textContent = text;
    var w = Math.max(110, text.length * 8.6 + 34);
    var r = g.querySelector('rect');
    r.setAttribute('x', -w / 2); r.setAttribute('width', w);
    g.style.transition = 'none'; g.setAttribute('opacity', '1');
    cur.said = Date.now();
    clearTimeout(g._t);
    g._t = setTimeout(function () { g.style.transition = 'opacity .5s'; g.setAttribute('opacity', '0'); }, 2600);
  }

  function look(x, smooth) {
    var sc = cur.el.querySelector('.mp-scroll');
    var left = x * cur.scale - sc.clientWidth / 2;
    if (smooth) sc.scrollTo({ left: left, behavior: 'smooth' }); else sc.scrollLeft = left;
  }

  function walk(x0, x1, done) {
    var d = cur.svg.querySelector('.dm2');
    var dist = Math.abs(x1 - x0);
    var dur = Math.min(4500, Math.max(900, dist * 5));
    var t0 = performance.now();
    if (dist > 2) d.classList.add('walk');
    function step(now) {
      if (!cur) return;
      var f = Math.min(1, (now - t0) / dur);
      var e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      var x = x0 + (x1 - x0) * e;
      doomAt(x);
      look(x, false);
      if (f < 1) { cur.anim = requestAnimationFrame(step); return; }
      cur.anim = null;
      d.classList.remove('walk');
      if (done) done();
    }
    cur.anim = requestAnimationFrame(step);
  }

  /** ctx: { time, from, people: [{name, photo, ratio, me, label}] }; el sadrzi .mp-scroll */
  function mount(el, ctx) {
    stop();
    var sc = el.querySelector('.mp-scroll');
    sc.innerHTML = svgWorld(ctx);
    var svg = sc.querySelector('svg');
    var h = sc.clientHeight || 520;
    var scale = h / H;
    svg.setAttribute('width', Math.round(worldW() * scale));
    svg.setAttribute('height', Math.round(h));
    cur = { el: el, svg: svg, scale: scale, ctx: ctx, lay: layout(ctx.people || []), anim: null };
    placePins();

    var x1 = xOf(ctx.time);
    var x0 = ctx.from != null ? xOf(ctx.from) : Math.max(xOf(0), x1 - 260);
    doomAt(x0);
    look(x0, false);
    var arrived = ctx.time >= 1;
    setTimeout(function () {
      if (!cur) return;
      walk(x0, x1, function () {
        if (arrived) { svg.classList.add('arrived'); say('DOOMSDAY JE STIGAO.'); }
        else say(line());
      });
    }, 450);

    cur.chat = setInterval(function () {
      if (cur && !cur.anim && Date.now() - (cur.said || 0) > 7000) say(line());
    }, 9000);

    svg.querySelector('#mpDoom').addEventListener('click', function (e) {
      e.stopPropagation();
      var d = svg.querySelector('.dm2');
      d.classList.remove('cast'); void d.getBoundingClientRect(); d.classList.add('cast');
      UI.buzz([12, 40, 24]);
      say(line());
      setTimeout(function () { d.classList.remove('cast'); }, 1200);
    });
    svg.addEventListener('click', function (e) {
      var fp = e.target.closest('.mp-fp');
      if (fp) {
        var t = (cur.ctx.trail || [])[+fp.getAttribute('data-i')];
        if (t) { UI.buzz(6); UI.toast(UI.dateLabel(t.d, { plain: true }) + ': ' + t.titles.join(', ')); }
        return;
      }
      var p = e.target.closest('.mp-pin');
      if (!p) return;
      var person = (cur.ctx.people || [])[+p.getAttribute('data-i')];
      if (person) UI.toast((person.me ? 'Ti' : person.name) + ' · ' + Math.round(person.ratio * 100) + '% plana');
    });
  }

  function jump(what) {
    if (!cur) return;
    if (what === 'doom') {
      var d = cur.svg.querySelector('.dm2');
      setTimeout(function () { if (cur) say(line()); }, 700);
      if (d) { d.classList.remove('cast'); void d.getBoundingClientRect(); d.classList.add('cast'); setTimeout(function () { d.classList.remove('cast'); }, 1200); }
    }
    if (what === 'doom') return look(cur.doomX, true);
    if (what === 'goal') return look(XE, true);
    if (what === 'start') return look(PW * 0.3, true);
    var o = cur.lay[+what];
    if (o) look(o.x, true);
  }

  function stop() {
    if (cur && cur.anim) cancelAnimationFrame(cur.anim);
    if (cur && cur.chat) clearInterval(cur.chat);
    cur = null;
  }

  MM.Doom = { mount: mount, jump: jump, stop: stop, head: head, line: quip };
})();
