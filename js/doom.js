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

  /** Mala Doomova glava (traka na pocetnom ekranu, ekipa, dugmici). */
  function head(size) {
    size = size || 22;
    return '<svg class="dm-head" viewBox="-30 -212 60 70" width="' + size + '" height="' + Math.round(size * 70 / 60) + '" aria-hidden="true">' +
      '<path d="M-27-150Q-33-200 0-209Q33-200 27-150Q14-140 0-140Q-14-140-27-150Z" fill="#1f6b37"/>' +
      '<path d="M-16-189Q0-195 16-189V-162Q14-151 0-147Q-14-151-16-162Z" fill="#c7cdd2"/>' +
      '<rect x="-12" y="-180" width="9" height="3.6" rx="1.6" fill="#0a0c0e"/><rect x="3" y="-180" width="9" height="3.6" rx="1.6" fill="#0a0c0e"/>' +
      '<circle cx="-7.5" cy="-178.3" r="1.8" fill="#6dff95"/><circle cx="7.5" cy="-178.3" r="1.8" fill="#6dff95"/>' +
      '<rect x="-8.5" y="-164" width="17" height="4.5" rx="1" fill="#24282c"/>' +
      '</svg>';
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

  function track(xDoom) {
    var pts = [];
    for (var x = XS - 40; x <= XE + 2; x += 16) pts.push(f1(x) + ' ' + f1(roadY(x)));
    var d = 'M' + pts.join('L');
    return '<path d="' + d + '" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="40" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="#3a2f45" stroke-opacity=".92" stroke-width="28" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="28" stroke-dasharray="2 10" stroke-linecap="round"/>' +
      '<clipPath id="mpPassed"><rect id="mpPassedR" x="0" y="0" width="' + f1(xDoom) + '" height="' + H + '"/></clipPath>' +
      '<g clip-path="url(#mpPassed)">' +
        '<path d="' + d + '" fill="none" stroke="#7dffa4" stroke-opacity=".35" stroke-width="40" stroke-linecap="round" filter="url(#dmSoft)"/>' +
        '<path d="' + d + '" fill="none" stroke="url(#mpDone)" stroke-width="28" stroke-linecap="round"/>' +
        '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="5" stroke-linecap="round" transform="translate(0 -7)"/>' +
      '</g>';
  }

  function nodes(time) {
    var P = MM.Plan, out = '', n = days();
    for (var dd = 0, w = 1; dd <= n; dd += 7, w++) {
      var iso = P.addDays(P.START_ISO, dd), dt = P.parse(iso);
      var r = dd / n, x = xOf(r), y = roadY(x), past = r <= time + 1e-6;
      var lbl = dt.getDate() + '. ' + UI.MON3[dt.getMonth()];
      var lw = lbl.length * 8.2 + 18;
      out += '<g class="mp-node' + (past ? ' past' : '') + '">' +
        '<circle cx="' + f1(x) + '" cy="' + f1(y + 3) + '" r="23" fill="#000" opacity=".45"/>' +
        '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="22" fill="' + (past ? 'url(#mpNodeOn)' : 'url(#mpNodeOff)') + '" stroke="' + (past ? '#e9fff0' : '#8a8f9c') + '" stroke-width="3.5"/>' +
        (past ? '<path d="M' + f1(x - 9) + ' ' + f1(y + 1) + 'l6 6.5 12-13" fill="none" stroke="#06371a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
          : '<text x="' + f1(x) + '" y="' + f1(y + 6) + '" text-anchor="middle" font-size="16" font-weight="900" fill="#fff">' + w + '</text>') +
        '<rect x="' + f1(x - lw / 2) + '" y="' + f1(y + 31) + '" width="' + f1(lw) + '" height="24" rx="12" fill="' + (past ? '#0f3d20' : '#14141b') + '" fill-opacity=".9" stroke="' + (past ? '#7dffa4' : '#4b525c') + '" stroke-width="1.5"/>' +
        '<text x="' + f1(x) + '" y="' + f1(y + 48) + '" text-anchor="middle" font-size="14" font-weight="900" fill="' + (past ? '#b8ffcf' : '#e6e8ee') + '">' + lbl + '</text>' +
        '</g>';
    }
    return out;
  }

  function goal() {
    var x = XE, y = roadY(x), bulbs = '';
    var sx = x - 215, sy = 318;
    for (var i = 0; i < 12; i++) {
      var bx = sx - 110 + i * 20;
      bulbs += '<circle class="mp-bulb" style="animation-delay:' + (i % 2 ? '.5s' : '0s') + '" cx="' + bx + '" cy="' + (sy - 56) + '" r="3.5" fill="#ffd36b"/>' +
        '<circle class="mp-bulb" style="animation-delay:' + (i % 2 ? '0s' : '.5s') + '" cx="' + bx + '" cy="' + (sy + 22) + '" r="3.5" fill="#ffd36b"/>';
    }
    return '<g class="mp-goal">' +
      '<rect x="' + (sx - 4) + '" y="' + (sy + 28) + '" width="8" height="' + (y - sy - 30) + '" fill="#1c1f25"/>' +
      '<rect x="' + (sx - 128) + '" y="' + (sy - 72) + '" width="256" height="110" rx="12" fill="#e62429" opacity=".45" filter="url(#dmSoft)"/>' +
      '<rect x="' + (sx - 124) + '" y="' + (sy - 68) + '" width="248" height="102" rx="12" fill="#14080a" stroke="#e62429" stroke-width="4"/>' +
      bulbs +
      '<text x="' + sx + '" y="' + (sy - 26) + '" text-anchor="middle" font-size="17" font-weight="900" letter-spacing="3" fill="#ffd36b">AVENGERS</text>' +
      '<text x="' + sx + '" y="' + (sy + 4) + '" text-anchor="middle" font-size="29" font-weight="900" letter-spacing="1.5" fill="#ff4b45">DOOMSDAY</text>' +
      '<text x="' + sx + '" y="' + (sy + 60) + '" text-anchor="middle" font-size="15" font-weight="900" letter-spacing="2" fill="#ffd0c8" stroke="#07070a" stroke-width="5" paint-order="stroke">18.12. · BIOSKOP</text>' +
      '<circle cx="' + x + '" cy="' + y + '" r="40" fill="#ffd36b" opacity=".35" filter="url(#dmSoft)" class="mp-pulse"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="31" fill="url(#mpGoal)" stroke="#ffd36b" stroke-width="4"/>' +
      '<text x="' + x + '" y="' + (y + 8) + '" text-anchor="middle" font-size="24">🎬</text>' +
      '</g>';
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
      '<linearGradient id="mpDone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9dffbc"/><stop offset="1" stop-color="#1bb253"/></linearGradient>' +
      '<radialGradient id="mpNodeOn" cx=".35" cy=".3"><stop offset="0" stop-color="#b9ffd0"/><stop offset="1" stop-color="#22b85a"/></radialGradient>' +
      '<radialGradient id="mpNodeOff" cx=".35" cy=".3"><stop offset="0" stop-color="#4a4f5c"/><stop offset="1" stop-color="#1f2229"/></radialGradient>' +
      '<radialGradient id="mpGoal" cx=".35" cy=".3"><stop offset="0" stop-color="#ff7a6a"/><stop offset="1" stop-color="#b8100c"/></radialGradient>' +
      '<radialGradient id="dmMagic"><stop offset="0" stop-color="#f2fff5"/><stop offset=".3" stop-color="#7dffa4"/><stop offset="1" stop-color="#2bff6a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dmAura"><stop offset="0" stop-color="#3dff7f" stop-opacity=".38"/><stop offset=".55" stop-color="#1bd65a" stop-opacity=".12"/><stop offset="1" stop-color="#0a7a30" stop-opacity="0"/></radialGradient>' +
      '<filter id="dmSoft" x="-.6" y="-.6" width="2.2" height="2.2"><feGaussianBlur stdDeviation="7"/></filter>' +
      '</defs>';
    return '<svg class="mp-svg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + defs +
      panels() + banners() + track(xd) + nodes(ctx.time) + goal() + embers() +
      '<g id="mpDoom">' + doomFigure() + '</g>' +
      (ctx.people || []).map(pin).join('') +
      '<g id="mpSay" class="mp-say" opacity="0"><rect x="-90" y="-30" width="180" height="32" rx="16" fill="#f4fff6"/>' +
        '<path d="M-8 2l8 10 8-10z" fill="#f4fff6"/><text y="-9" text-anchor="middle" font-size="15" font-weight="900" fill="#0c2414"></text></g>' +
      '</svg>';
  }

  /* ============================================================
     pokretanje i kamera
     ============================================================ */

  var LINES = ['Doom ne čeka.', 'Kleknite pred Doomom!', 'Vreme ističe, smrtniče.', 'Latverija pamti.',
    'Gledaj brže.', 'Doom vidi sve epizode.', 'Ti me nećeš stići.', 'Victor von Doom nikad ne kasni.'];

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
        else say(LINES[Math.floor(Math.random() * LINES.length)]);
      });
    }, 450);

    svg.querySelector('#mpDoom').addEventListener('click', function (e) {
      e.stopPropagation();
      var d = svg.querySelector('.dm2');
      d.classList.remove('cast'); void d.getBoundingClientRect(); d.classList.add('cast');
      UI.buzz([12, 40, 24]);
      say(LINES[Math.floor(Math.random() * LINES.length)]);
      setTimeout(function () { d.classList.remove('cast'); }, 1200);
    });
    svg.addEventListener('click', function (e) {
      var p = e.target.closest('.mp-pin');
      if (!p) return;
      var person = (cur.ctx.people || [])[+p.getAttribute('data-i')];
      if (person) UI.toast((person.me ? 'Ti' : person.name) + ' · ' + Math.round(person.ratio * 100) + '% plana');
    });
  }

  function jump(what) {
    if (!cur) return;
    if (what === 'doom') return look(cur.doomX, true);
    if (what === 'goal') return look(XE - 90, true);
    if (what === 'start') return look(PW * 0.3, true);
    var o = cur.lay[+what];
    if (o) look(o.x, true);
  }

  function stop() {
    if (cur && cur.anim) cancelAnimationFrame(cur.anim);
    cur = null;
  }

  /* ---------------- traka na pocetnom ekranu ---------------- */

  function mini(time, youR) {
    var t = Math.round(time * 1000) / 10, y = Math.round(youR * 1000) / 10;
    var ahead = youR >= time;
    return '<div class="rm" data-a="doom" role="button" aria-label="Put do Doomsdaya">' +
      '<div class="rm-track">' +
        '<i class="rm-time" style="width:' + t + '%"></i>' +
        '<i class="rm-mine' + (ahead ? ' ahead' : '') + '" style="width:' + y + '%"></i>' +
        '<span class="rm-doom" style="left:' + t + '%">' + head(20) + '</span>' +
        '<span class="rm-you' + (ahead ? ' ahead' : '') + '" style="left:' + y + '%">TI</span>' +
      '</div>' +
      '</div>';
  }

  MM.Doom = { mount: mount, jump: jump, stop: stop, mini: mini, head: head };
})();
