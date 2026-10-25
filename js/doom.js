/* ============================================================
   doom.js  -  Doom seta ka Doomsdayu
   ------------------------------------------------------------
   Doom krece iz Latverije (zamak u daljini) 17.8. i putem ide ka
   tebi - cilj "DOOMSDAY 18.12." je dole, ispred ekrana. Koliko je
   presao zavisi samo od VREMENA. Pored njega na istom putu ides i
   ti - ali tebe pomera ono sto si ODGLEDAO. Ako si nize od njega,
   ispred si Dooma.

   Sve je nacrtano u SVG-u (nema slika), pa radi i offline.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI;
  var W = 360, H = 640;

  // Kontrolne tacke puta: od zamka (daleko, gore) ka gledaocu (dole).
  var ROAD = [[180, 150], [194, 168], [164, 194], [202, 230], [146, 280], [222, 350], [134, 438], [204, 526], [180, 600], [180, 660]];
  var GOAL_U = 0.94;   // deo puta gde je ciljna traka

  /* ---------------- geometrija puta ---------------- */

  function catmull(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return [
      0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
      0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
    ];
  }

  var samples = null;   // [{x, y, len}]
  function road() {
    if (samples) return samples;
    var pts = [ROAD[0]].concat(ROAD, [ROAD[ROAD.length - 1]]);
    var out = [], len = 0, prev = null;
    for (var i = 1; i < pts.length - 2; i++) {
      for (var k = 0; k < 24; k++) {
        var p = catmull(pts[i - 1], pts[i], pts[i + 1], pts[i + 2], k / 24);
        if (prev) len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
        out.push({ x: p[0], y: p[1], len: len });
        prev = p;
      }
    }
    out.forEach(function (s) { s.u = s.len / len; });
    samples = out;
    return out;
  }

  /** Tacka na putu za deo puta u (0 = zamak, 1 = dole). */
  function at(u) {
    var s = road();
    u = Math.max(0, Math.min(1, u));
    for (var i = 1; i < s.length; i++) {
      if (s[i].u >= u) {
        var a = s[i - 1], b = s[i];
        var f = (u - a.u) / ((b.u - a.u) || 1);
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
      }
    }
    return { x: s[s.length - 1].x, y: s[s.length - 1].y };
  }

  function width(u) { return 7 + 168 * Math.pow(u, 1.7); }
  function scale(u) { return 0.14 + 0.86 * Math.pow(u, 1.25); }
  /** Vreme/napredak (0..1) -> deo puta. Daleko se sporije prelazi (perspektiva). */
  function uOf(r) { return GOAL_U * Math.pow(Math.max(0, Math.min(1, r)), 1.45); }

  /* ---------------- figura ---------------- */

  var DEFS =
    '<defs>' +
      '<linearGradient id="dmMetal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d868f"/><stop offset=".45" stop-color="#d9dee2"/><stop offset="1" stop-color="#6c747c"/></linearGradient>' +
      '<linearGradient id="dmMask" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef1f3"/><stop offset=".55" stop-color="#a9b1b8"/><stop offset="1" stop-color="#6f777f"/></linearGradient>' +
      '<linearGradient id="dmCape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c7a41"/><stop offset="1" stop-color="#0a2d16"/></linearGradient>' +
      '<linearGradient id="dmTunic" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c9c55"/><stop offset="1" stop-color="#17602d"/></linearGradient>' +
      '<radialGradient id="dmMagic"><stop offset="0" stop-color="#eaffef"/><stop offset=".35" stop-color="#6dff95"/><stop offset="1" stop-color="#6dff95" stop-opacity="0"/></radialGradient>' +
      '<filter id="dmGlow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="2.2"/></filter>' +
      '<filter id="dmSoft" x="-.5" y="-.5" width="2" height="2"><feGaussianBlur stdDeviation="6"/></filter>' +
    '</defs>';

  /** Doom spreda, stopala u (0,0), visok ~205. Klase pokrecu hod (CSS). */
  function figure() {
    return '<g class="dm">' +
      '<ellipse class="dm-shadow" cx="0" cy="0" rx="40" ry="8"/>' +
      '<g class="dm-body">' +
        '<path class="dm-cape" d="M-30-150C-48-118-58-62-62-2Q0 8 62-2C58-62 48-118 30-150Z" fill="url(#dmCape)"/>' +
        '<g class="dm-leg l"><rect x="-20" y="-68" width="16" height="60" rx="5" fill="url(#dmMetal)"/>' +
          '<path d="M-24-12h22v9q0 4-4 4h-15q-3 0-3-4z" fill="#30353a"/></g>' +
        '<g class="dm-leg r"><rect x="4" y="-68" width="16" height="60" rx="5" fill="url(#dmMetal)"/>' +
          '<path d="M2-12h22v9q0 4-3 4H6q-4 0-4-4z" fill="#30353a"/></g>' +
        '<path d="M-30-150H30L38-50Q0-38-38-50Z" fill="url(#dmTunic)"/>' +
        '<path d="M-6-150L0-128 6-150" fill="none" stroke="#0e3a1c" stroke-width="2"/>' +
        '<rect x="-33" y="-94" width="66" height="9" rx="2" fill="#5a3a1b"/>' +
        '<circle cx="0" cy="-89.5" r="7" fill="#d1aa4f" stroke="#7a5a1f" stroke-width="1.5"/>' +
        '<g class="dm-arm l"><path d="M-30-147q-15 5-17 22l-6 44q0 6 6 6h9q5 0 5-6l4-42z" fill="url(#dmMetal)"/>' +
          '<rect x="-56" y="-82" width="18" height="19" rx="6" fill="#8b949c"/></g>' +
        '<g class="dm-arm r"><path d="M30-147q15 5 17 22l6 44q0 6-6 6h-9q-5 0-5-6l-4-42z" fill="url(#dmMetal)"/>' +
          '<rect x="38" y="-82" width="18" height="19" rx="6" fill="#8b949c"/>' +
          '<circle class="dm-magic" cx="47" cy="-90" r="15" fill="url(#dmMagic)"/></g>' +
        '<path d="M-27-150Q-33-200 0-209Q33-200 27-150Q14-140 0-140Q-14-140-27-150Z" fill="url(#dmCape)"/>' +
        '<path d="M-16-189Q0-195 16-189V-162Q14-151 0-147Q-14-151-16-162Z" fill="url(#dmMask)" stroke="#495057" stroke-width="1"/>' +
        '<rect x="-12" y="-180" width="9" height="3.2" rx="1.6" fill="#0a0c0e"/>' +
        '<rect x="3" y="-180" width="9" height="3.2" rx="1.6" fill="#0a0c0e"/>' +
        '<g class="dm-eyes"><circle cx="-7.5" cy="-178.4" r="2.4" fill="#6dff95" filter="url(#dmGlow)"/>' +
          '<circle cx="7.5" cy="-178.4" r="2.4" fill="#6dff95" filter="url(#dmGlow)"/></g>' +
        '<path d="M0-186V-170" stroke="#5c636a" stroke-width="1.3"/>' +
        '<rect x="-8.5" y="-164" width="17" height="4.5" rx="1" fill="#24282c"/>' +
        '<path d="M-4.5-164v4.5M0-164v4.5M4.5-164v4.5" stroke="#5c636a" stroke-width="1"/>' +
        '<circle cx="-12.5" cy="-167" r="1.1" fill="#5c636a"/><circle cx="12.5" cy="-167" r="1.1" fill="#5c636a"/>' +
      '</g>' +
    '</g>';
  }

  /** Mala Doomova glava (za traku na pocetnom ekranu i ekipu). */
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

  /* ---------------- scena ---------------- */

  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  /**
   * Put = niz kratkih poteza sa okruglim krajevima, svaki svoje sirine.
   * Preklopljeni daju glatku traku promenljive sirine bez lomova na
   * ostrim krivinama (poligon od normala se tu sam sebe sece).
   */
  function roadSvg() {
    var s = road();
    var edge = '', fill = '', dash = [];
    for (var i = 0; i < s.length - 1; i++) {
      var a = s[i], b = s[i + 1], w = width(a.u);
      var seg = '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" stroke-width="';
      edge += seg + (w + 3).toFixed(1) + '"/>';
      fill += seg + w.toFixed(1) + '"/>';
      dash.push(a.x.toFixed(1) + ' ' + a.y.toFixed(1));
    }
    return '<g stroke="#3b4048" stroke-linecap="round">' + edge + '</g>' +
      '<g stroke="#212429" stroke-linecap="round">' + fill + '</g>' +
      '<path class="dm-dash" d="M' + dash.join('L') + '" fill="none" stroke="#e9d27a" stroke-opacity=".55" stroke-width="2" stroke-dasharray="7 9"/>';
  }

  function milestones() {
    var P = MM.Plan, out = '';
    [['2026-09-01', '1. sep'], ['2026-10-01', '1. okt'], ['2026-11-01', '1. nov'], ['2026-12-01', '1. dec']].forEach(function (m, i) {
      var r = P.daysBetween(P.START_ISO, m[0]) / P.daysBetween(P.START_ISO, P.DOOMSDAY_ISO);
      var u = uOf(r), p = at(u), w = width(u), sc = scale(u);
      var side = i % 2 ? -1 : 1;
      var x = p.x + side * (w / 2 + 10 * sc + 4);
      var h = 34 * sc + 8;
      out += '<g class="dm-post">' +
        '<rect x="' + (x - 1.2 * sc - .6).toFixed(1) + '" y="' + (p.y - h).toFixed(1) + '" width="' + (2.4 * sc + 1.2).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="#59606a"/>' +
        '<rect x="' + (x - 22 * sc - 6).toFixed(1) + '" y="' + (p.y - h - 11 * sc - 4).toFixed(1) + '" width="' + (44 * sc + 12).toFixed(1) + '" height="' + (13 * sc + 6).toFixed(1) + '" rx="2" fill="#1e2a22" stroke="#3d7a52" stroke-width=".8"/>' +
        '<text x="' + x.toFixed(1) + '" y="' + (p.y - h - 1.5 * sc - 1.6).toFixed(1) + '" font-size="' + (9 * sc + 4).toFixed(1) + '" text-anchor="middle" fill="#bfe9cb" font-weight="700">' + m[1] + '</text>' +
        '</g>';
    });
    return out;
  }

  function sky() {
    var r = rnd(7), stars = '';
    for (var i = 0; i < 70; i++) {
      var x = r() * W, y = r() * 300, s = r() * 1.2 + .3;
      stars += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + s.toFixed(2) + '" fill="#fff"' +
        (i % 5 === 0 ? ' class="dm-tw" style="animation-delay:' + (r() * 3).toFixed(2) + 's"' : ' opacity="' + (0.25 + r() * 0.6).toFixed(2) + '"') + '/>';
    }
    return '<rect width="' + W + '" height="' + H + '" fill="url(#dmSky)"/>' + stars +
      '<circle cx="74" cy="122" r="32" fill="#bfffd0" opacity=".10" filter="url(#dmSoft)"/>' +
      '<circle cx="74" cy="122" r="14" fill="#e8f5ea"/><circle cx="80" cy="118" r="12" fill="#0b1410" opacity=".22"/>';
  }

  function landscape() {
    return '<path d="M0 214L40 176 78 196 120 150 160 186 196 160 236 192 280 148 322 184 360 160V330H0Z" fill="#0f1a14"/>' +
      // zamak Latverije
      '<g class="dm-castle">' +
        '<path d="M150 158V122h6v-8h5v8h6v-18l7-8 7 8v18h6v-8h5v8h6v36z" fill="#0b120e"/>' +
        '<path d="M142 158v-22l5-6 5 6v22zM208 158v-22l5-6 5 6v22z" fill="#0b120e"/>' +
        '<path d="M174 96V82l8 3-8 3" fill="#2d8a49"/>' +
        '<rect x="170" y="128" width="3" height="5" fill="#6dff95"/><rect x="186" y="128" width="3" height="5" fill="#6dff95"/>' +
        '<rect x="178" y="112" width="3" height="5" fill="#6dff95" class="dm-win"/>' +
        '<path d="M174 158v-10q6-6 12 0v10z" fill="#040705"/>' +
      '</g>' +
      '<path d="M0 230L54 200 100 222 150 196 214 226 262 200 318 224 360 206V360H0Z" fill="#132219"/>' +
      '<rect y="250" width="' + W + '" height="' + (H - 250) + '" fill="url(#dmGround)"/>';
  }

  function goal() {
    var p = at(GOAL_U), w = width(GOAL_U);
    var x1 = p.x - w / 2 - 14, x2 = p.x + w / 2 + 14, top = p.y - 92;
    return '<g class="dm-goal">' +
      '<rect x="' + (x1 - 3) + '" y="' + top + '" width="6" height="92" fill="#3c434c"/>' +
      '<rect x="' + (x2 - 3) + '" y="' + top + '" width="6" height="92" fill="#3c434c"/>' +
      '<rect x="' + (x1 - 8) + '" y="' + (top - 8) + '" width="' + (x2 - x1 + 16) + '" height="34" rx="5" fill="#e62429" opacity=".35" filter="url(#dmSoft)"/>' +
      '<rect x="' + (x1 - 8) + '" y="' + (top - 8) + '" width="' + (x2 - x1 + 16) + '" height="34" rx="5" fill="#140c0d" stroke="#e62429" stroke-width="2"/>' +
      '<text x="' + p.x + '" y="' + (top + 15) + '" text-anchor="middle" font-size="17" font-weight="900" letter-spacing="2" fill="#ff5a5f">DOOMSDAY</text>' +
      '<text x="' + p.x + '" y="' + (top + 24.5) + '" text-anchor="middle" font-size="8" font-weight="800" letter-spacing="3" fill="#ffb3b5">18.12.2026</text>' +
      '</g>';
  }

  function you(ctx) {
    return '<g class="dm-you" id="dmYou">' +
      '<circle r="15" fill="#e62429" opacity=".35" filter="url(#dmSoft)"/>' +
      '<circle r="11" fill="#e62429" stroke="#fff" stroke-width="2"/>' +
      (ctx.photo ? '<clipPath id="dmYouClip"><circle r="9.5"/></clipPath><image href="' + UI.esc(ctx.photo) + '" x="-9.5" y="-9.5" width="19" height="19" clip-path="url(#dmYouClip)" preserveAspectRatio="xMidYMid slice"/>'
        : '<text y="4" text-anchor="middle" font-size="11" font-weight="900" fill="#fff">' + UI.esc((ctx.name || 'Ti').slice(0, 1).toUpperCase()) + '</text>') +
      '<text y="-16" text-anchor="middle" font-size="9" font-weight="900" letter-spacing="1" fill="#fff">TI</text>' +
      '</g>';
  }

  function sceneSvg(ctx) {
    return '<svg class="dm-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      DEFS.replace('</defs>',
        '<linearGradient id="dmSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030406"/><stop offset=".45" stop-color="#0b1712"/><stop offset="1" stop-color="#14251b"/></linearGradient>' +
        '<linearGradient id="dmGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14231a"/><stop offset="1" stop-color="#0a120d"/></linearGradient>' +
        '<linearGradient id="dmRoad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2e33"/><stop offset="1" stop-color="#1a1d21"/></linearGradient>' +
        '</defs>') +
      sky() + landscape() + roadSvg() + milestones() + goal() +
      '<g id="dmStart"><text x="156" y="174" text-anchor="end" font-size="6.5" font-weight="800" letter-spacing="1.2" fill="#86c79a">LATVERIJA · 17.8.</text></g>' +
      you(ctx) +
      '<g id="dmDoom">' + figure() + '</g>' +
      '<g id="dmSay" class="dm-say" opacity="0"><rect x="-70" y="-26" width="140" height="24" rx="12" fill="#f4fff6"/>' +
        '<path d="M-6-3l6 8 6-8z" fill="#f4fff6"/><text y="-9.5" text-anchor="middle" font-size="10.5" font-weight="800" fill="#0c2414"></text></g>' +
      '<rect class="dm-flash" width="' + W + '" height="' + H + '" fill="#b6ffc8" opacity="0"/>' +
      '</svg>';
  }

  /* ---------------- pokretanje ---------------- */

  var LINES = ['Doom ne čeka.', 'Kleknite pred Doomom!', 'Vreme ističe, smrtniče.', 'Latverija pamti.',
    'Gledaj brže.', 'Doom vidi sve epizode.', 'Ti me nećeš stići.', 'Victor von Doom nikad ne kasni.'];

  var anim = null;

  function place(svg, uDoom, uYou) {
    var p = at(uDoom), sc = scale(uDoom);
    var g = svg.querySelector('#dmDoom');
    g.setAttribute('transform', 'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ') scale(' + sc.toFixed(3) + ')');
    var say = svg.querySelector('#dmSay');
    say.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + (p.y - 212 * sc - 4).toFixed(1) + ')');
    if (uYou != null) {
      var q = at(uYou), ys = 0.55 + 0.6 * scale(uYou), w = width(uYou);
      var y = svg.querySelector('#dmYou');
      // Ti ides desnom stranom puta da se ne preklapate.
      y.setAttribute('transform', 'translate(' + (q.x + w * 0.32 + 6 * ys).toFixed(1) + ' ' + (q.y - 11 * ys).toFixed(1) + ') scale(' + ys.toFixed(3) + ')');
    }
  }

  function say(svg, text) {
    var g = svg.querySelector('#dmSay');
    var t = g.querySelector('text');
    t.textContent = text;
    var w = Math.max(80, text.length * 6.4 + 22);
    var r = g.querySelector('rect');
    r.setAttribute('x', -w / 2); r.setAttribute('width', w);
    g.style.transition = 'none'; g.setAttribute('opacity', '1');
    clearTimeout(g._t);
    g._t = setTimeout(function () { g.style.transition = 'opacity .5s'; g.setAttribute('opacity', '0'); }, 2400);
  }

  /** Doom hoda od u0 do u1. Hod je animiran samo dok se krece. */
  function walk(svg, u0, u1, uYou, done) {
    if (anim) cancelAnimationFrame(anim);
    var doom = svg.querySelector('.dm');
    var dist = Math.abs(u1 - u0);
    var dur = Math.min(4200, Math.max(900, dist * 9000));
    var t0 = performance.now();
    if (dist > 0.001) doom.classList.add('walk');
    function step(now) {
      var f = Math.min(1, (now - t0) / dur);
      var e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      place(svg, u0 + (u1 - u0) * e, uYou);
      if (f < 1) { anim = requestAnimationFrame(step); return; }
      anim = null;
      doom.classList.remove('walk');
      if (done) done();
    }
    anim = requestAnimationFrame(step);
  }

  /** Popunjava kontejner scenom i pokrece setnju. ctx: {time, you, name, photo, from} */
  function mount(el, ctx) {
    el.innerHTML = sceneSvg(ctx);
    var svg = el.querySelector('svg');
    var uDoom = uOf(ctx.time), uYou = uOf(ctx.you);
    var from = ctx.from != null ? uOf(ctx.from) : Math.max(0, uDoom - 0.12);
    place(svg, from, uYou);
    var arrived = ctx.time >= 1;
    setTimeout(function () {
      walk(svg, from, uDoom, uYou, function () {
        if (arrived) {
          svg.classList.add('arrived');
          say(svg, 'DOOMSDAY JE STIGAO.');
        } else {
          say(svg, ctx.you >= ctx.time ? 'Hm. Ispred si mene…' : LINES[Math.floor(Math.random() * LINES.length)]);
        }
      });
    }, 350);

    var doomG = svg.querySelector('#dmDoom');
    doomG.style.cursor = 'pointer';
    doomG.addEventListener('click', function (e) {
      e.stopPropagation();
      var d = svg.querySelector('.dm');
      d.classList.remove('cast'); void d.getBoundingClientRect(); d.classList.add('cast');
      UI.buzz([12, 40, 24]);
      say(svg, LINES[Math.floor(Math.random() * LINES.length)]);
      var fl = svg.querySelector('.dm-flash');
      fl.classList.remove('go'); void fl.getBoundingClientRect(); fl.classList.add('go');
      setTimeout(function () { d.classList.remove('cast'); }, 1400);
    });
  }

  function stop() { if (anim) { cancelAnimationFrame(anim); anim = null; } }

  /* ---------------- traka na pocetnom ekranu ---------------- */

  function mini(time, youR) {
    var t = Math.round(time * 1000) / 10, y = Math.round(youR * 1000) / 10;
    var ahead = youR >= time;
    return '<div class="rm" data-a="doom" role="button" aria-label="Doom šetnja">' +
      '<div class="rm-track">' +
        '<i class="rm-time" style="width:' + t + '%"></i>' +
        '<i class="rm-mine' + (ahead ? ' ahead' : '') + '" style="width:' + y + '%"></i>' +
        '<span class="rm-doom" style="left:' + t + '%">' + head(20) + '</span>' +
        '<span class="rm-you' + (ahead ? ' ahead' : '') + '" style="left:' + y + '%">TI</span>' +
      '</div>' +
      '<div class="rm-lbl"><span>Latverija 17.8.</span><span>' + (ahead ? 'ispred si Dooma' : 'Doom je ispred tebe') + '</span><span>18.12.</span></div>' +
      '</div>';
  }

  MM.Doom = { mount: mount, stop: stop, mini: mini, head: head, figure: figure, DEFS: DEFS };
})();
