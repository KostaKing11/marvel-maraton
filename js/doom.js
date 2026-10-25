/* ============================================================
   doom.js  -  "Put do Doomsdaya" (mapa u stilu trophy road-a)
   ------------------------------------------------------------
   Duga vodoravna mapa koja se skroluje prstom. Ide od Latverije
   (17.8.) do bioskopa (18.12.) kroz pet zona koje su sve vise
   "doomed": Latverija -> Suma senki -> Pali grad -> Inkurzija ->
   Doomsday. Na putu su stanice za svaku nedelju.

   Doom stoji tamo gde je DANAS (vreme). Ti i ekipa stojite tamo
   dokle ste stigli u svom planu (odgledano). Dole je traka sa
   dugmicima za skok do Dooma, do sebe, do svakog iz ekipe i do cilja.

   Sve je SVG (bez slika), pa radi i offline.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI;

  var H = 640;           // visina sveta (viewBox)
  var PXD = 30;          // jedinica po danu (nedelja = 210 - vide se 2-3 stanice odjednom)
  var X0 = 460;          // prostor pre starta (zamak)
  var X1 = 700;          // prostor posle cilja (bioskop)

  var ZONES = [
    { r0: 0, r1: 0.2, name: 'LATVERIJA', sub: 'odavde Doom kreće', c1: '#7dffa4', c2: '#1f8f4a' },
    { r0: 0.2, r1: 0.42, name: 'ŠUMA SENKI', sub: 'nešto gleda iz mraka', c1: '#8fe3d0', c2: '#1d6a63' },
    { r0: 0.42, r1: 0.64, name: 'PALI GRAD', sub: 'ovde je već bilo kasno', c1: '#ffd27a', c2: '#c46a12' },
    { r0: 0.64, r1: 0.86, name: 'INKURZIJA', sub: 'dva sveta, jedan opstaje', c1: '#e3a3ff', c2: '#7a2bc0' },
    { r0: 0.86, r1: 1.0, name: 'DOOMSDAY', sub: 'nema nazad', c1: '#ffb199', c2: '#d1160f' }
  ];

  function days() { return MM.Plan.daysBetween(MM.Plan.START_ISO, MM.Plan.DOOMSDAY_ISO); }
  function worldW() { return X0 + days() * PXD + X1; }
  function xOf(r) { return X0 + Math.max(0, Math.min(1, r)) * days() * PXD; }
  function roadY(x) { return 486 + 18 * Math.sin(x / 260) + 8 * Math.sin(x / 97); }

  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function f1(n) { return Math.round(n * 10) / 10; }

  /* ============================================================
     Doom (nov, opasniji)
     ============================================================ */

  var DEFS =
    '<linearGradient id="dmMetal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5f676f"/><stop offset=".45" stop-color="#e3e8ec"/><stop offset=".7" stop-color="#a7b0b8"/><stop offset="1" stop-color="#555d65"/></linearGradient>' +
    '<linearGradient id="dmMask" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f7f9"/><stop offset=".5" stop-color="#b2bac1"/><stop offset="1" stop-color="#5d656c"/></linearGradient>' +
    '<linearGradient id="dmCape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8c4b"/><stop offset=".55" stop-color="#14552a"/><stop offset="1" stop-color="#062311"/></linearGradient>' +
    '<linearGradient id="dmCapeIn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#041a0c"/><stop offset=".5" stop-color="#0b3a1d"/><stop offset="1" stop-color="#041a0c"/></linearGradient>' +
    '<linearGradient id="dmTunic" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#43b062"/><stop offset="1" stop-color="#176a32"/></linearGradient>' +
    '<radialGradient id="dmMagic"><stop offset="0" stop-color="#f2fff5"/><stop offset=".3" stop-color="#7dffa4"/><stop offset="1" stop-color="#2bff6a" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="dmAura"><stop offset="0" stop-color="#3dff7f" stop-opacity=".32"/><stop offset=".55" stop-color="#1bd65a" stop-opacity=".1"/><stop offset="1" stop-color="#0a7a30" stop-opacity="0"/></radialGradient>' +
    '<filter id="dmGlow" x="-2" y="-2" width="5" height="5"><feGaussianBlur stdDeviation="2.4"/></filter>' +
    '<filter id="dmSoft" x="-.6" y="-.6" width="2.2" height="2.2"><feGaussianBlur stdDeviation="7"/></filter>';

  /** Doom spreda, stopala u (0,0), visok ~280. Klase pokrecu hod i magiju (CSS). */
  function figure() {
    var legs =
      '<g class="dm-leg l"><path d="M-32-96h26l-2 82h-22z" fill="url(#dmMetal)"/>' +
        '<rect x="-34" y="-62" width="30" height="15" rx="6" fill="#9aa3ab" stroke="#5d656c"/>' +
        '<path d="M-40-18h36v15q0 5-5 5h-26q-5 0-5-5z" fill="#202429"/><path d="M-40-6h36" stroke="#3a4047" stroke-width="2"/></g>' +
      '<g class="dm-leg r"><path d="M6-96h26l-2 82H8z" fill="url(#dmMetal)"/>' +
        '<rect x="4" y="-62" width="30" height="15" rx="6" fill="#9aa3ab" stroke="#5d656c"/>' +
        '<path d="M4-18h36v15q0 5-5 5H9q-5 0-5-5z" fill="#202429"/><path d="M4-6h36" stroke="#3a4047" stroke-width="2"/></g>';
    var armL =
      '<g class="dm-arm l"><path d="M-46-186q-26 6-30 34l-11 64q-1 8 7 8h16q8 0 9-8l10-62z" fill="url(#dmMetal)"/>' +
        '<path d="M-74-156h24M-78-134h24M-81-112h24" stroke="#59616a" stroke-width="2.4"/>' +
        '<path d="M-96-96h44l-5 12h-34z" fill="#c3cad0"/>' +
        '<path d="M-92-86h34l2 24q0 9-9 9h-20q-9 0-9-9z" fill="#8b949c" stroke="#5d656c"/></g>';
    var armR =
      '<g class="dm-arm r"><path d="M46-186q26 6 30 34l11 64q1 8-7 8h-16q-8 0-9-8l-10-62z" fill="url(#dmMetal)"/>' +
        '<path d="M50-156h24M54-134h24M57-112h24" stroke="#59616a" stroke-width="2.4"/>' +
        '<path d="M52-96h44l-5 12H57z" fill="#c3cad0"/>' +
        '<path d="M58-86h34l2 24q0 9-9 9H65q-9 0-9-9z" fill="#8b949c" stroke="#5d656c"/>' +
        '<circle class="dm-orb" cx="76" cy="-58" r="13" fill="url(#dmMagic)"/>' +
        '<circle class="dm-magic" cx="76" cy="-62" r="30" fill="url(#dmMagic)"/></g>';
    var head =
      '<path d="M-62-176Q-54-206-36-220Q-42-270 0-286Q42-270 36-220Q54-206 62-176Q32-164 0-162Q-32-164-62-176Z" fill="url(#dmCape)"/>' +
      '<path d="M-28-212Q-32-258 0-270Q32-258 28-212Q15-200 0-200Q-15-200-28-212Z" fill="#031008"/>' +
      '<path d="M-21-252Q0-261 21-252L22-218L15-203Q0-196-15-203L-22-218Z" fill="url(#dmMask)" stroke="#3a4046" stroke-width="1.4"/>' +
      '<path d="M-20-241L-5-236M20-241L5-236" stroke="#23272c" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M-17-235L-5-232.5V-229L-17-231.5Z" fill="#040506"/><path d="M17-235L5-232.5V-229L17-231.5Z" fill="#040506"/>' +
      '<g class="dm-eyes"><ellipse cx="-11" cy="-232" rx="5" ry="2.4" fill="#86ffab" filter="url(#dmGlow)"/>' +
        '<ellipse cx="11" cy="-232" rx="5" ry="2.4" fill="#86ffab" filter="url(#dmGlow)"/>' +
        '<ellipse cx="-11" cy="-232" rx="3" ry="1.2" fill="#eafff0"/><ellipse cx="11" cy="-232" rx="3" ry="1.2" fill="#eafff0"/></g>' +
      '<path d="M0-246V-220" stroke="#59606a" stroke-width="1.8"/>' +
      '<path d="M-21-222L-10-214M21-222L10-214" stroke="#59606a" stroke-width="1.3"/>' +
      '<rect x="-11" y="-213" width="22" height="7" rx="1.5" fill="#15181b"/>' +
      '<path d="M-6-213v7M-1.5-213v7M3-213v7M7.5-213v7" stroke="#59606a" stroke-width="1.2"/>' +
      '<circle cx="-18" cy="-225" r="1.4" fill="#59606a"/><circle cx="18" cy="-225" r="1.4" fill="#59606a"/>';
    return '<g class="dm">' +
      '<ellipse class="dm-aura" cx="0" cy="-130" rx="120" ry="170" fill="url(#dmAura)"/>' +
      '<ellipse class="dm-shadow" cx="0" cy="2" rx="74" ry="12"/>' +
      '<g class="dm-body">' +
        '<path class="dm-cape" d="M-48-198C-92-152-112-72-122 4Q-62 16 0 9Q62 16 122 4C112-72 92-152 48-198Z" fill="url(#dmCape)"/>' +
        '<path d="M-36-190C-62-150-76-80-82 6Q0 14 82 6C76-80 62-150 36-190Z" fill="url(#dmCapeIn)" opacity=".9"/>' +
        '<path d="M-70-140C-86-96-96-48-102 2M70-140C86-96 96-48 102 2" stroke="#06200f" stroke-width="3" fill="none" opacity=".7"/>' +
        legs +
        '<path d="M-46-182H46L60-72Q34-58 5-68L0-60L-5-68Q-34-58-60-72Z" fill="url(#dmTunic)"/>' +
        '<path d="M-46-182H46L60-72Q34-58 5-68L0-60L-5-68Q-34-58-60-72Z" fill="none" stroke="#0e3a1c" stroke-width="2"/>' +
        '<path d="M-18-182L0-150L18-182" fill="none" stroke="#0e3a1c" stroke-width="4"/>' +
        '<path d="M0-126V-64" stroke="#0e3a1c" stroke-width="3"/>' +
        '<rect x="-52" y="-124" width="104" height="16" rx="3" fill="#43290f"/>' +
        '<path d="M-52-120h104" stroke="#6b4519" stroke-width="2"/>' +
        '<rect x="-14" y="-128" width="28" height="24" rx="4" fill="#d9b04f" stroke="#7a5a1f" stroke-width="2.4"/>' +
        '<circle cx="0" cy="-116" r="5" fill="#7a5a1f"/>' +
        armL + armR + head +
      '</g>' +
    '</g>';
  }

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

  function zoneX(z) { return [xOf(z.r0), xOf(z.r1)]; }

  function sky(W) {
    var r = rnd(11), out = '';
    out += '<rect width="' + W + '" height="' + H + '" fill="url(#mpSky)"/>';
    // zvezde - samo u mirnom delu
    for (var i = 0; i < 170; i++) {
      var x = r() * xOf(0.5), y = r() * 300, s = r() * 1.3 + .3;
      out += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(s) + '" fill="#fff" opacity="' + f1(.2 + r() * .7) + '"' +
        (i % 7 === 0 ? ' class="mp-tw" style="animation-delay:' + f1(r() * 3) + 's"' : '') + '/>';
    }
    // mesec nad Latverijom
    out += '<circle cx="250" cy="96" r="58" fill="#c9ffd9" opacity=".08" filter="url(#dmSoft)"/>' +
      '<circle cx="250" cy="96" r="30" fill="#eaf7ec"/><circle cx="262" cy="88" r="27" fill="#0a1424" opacity=".28"/>';
    return out;
  }

  function mountains(W) {
    var r = rnd(5);
    function ridge(base, amp, step, jag) {
      var d = 'M0 ' + H + ' L0 ' + base;
      for (var x = 0; x <= W + step; x += step) {
        var t = x / W;
        var a = amp * (0.6 + jag * t);
        var y = base - r() * a - (t > 0.6 ? r() * a * 0.6 : 0);
        d += ' L' + f1(x) + ' ' + f1(y);
      }
      return d + ' L' + W + ' ' + H + 'Z';
    }
    return '<path d="' + ridge(310, 90, 120, 1.4) + '" fill="url(#mpFar)"/>' +
      '<path d="' + ridge(360, 70, 90, 1.8) + '" fill="url(#mpNear)"/>';
  }

  function castle() {
    var g = '#0a120d', w = '#7dffa4';
    return '<g class="mp-castle">' +
      '<path d="M40 430V300h26v-18h14v18h20v-60l20-26 20 26v60h20v-18h14v18h26v130z" fill="' + g + '"/>' +
      '<path d="M200 430V250l28-40 28 40v180z" fill="' + g + '"/>' +
      '<path d="M268 430V320h18v-14h12v14h18v110z" fill="' + g + '"/>' +
      '<path d="M138 214v-28l16 6-16 6" fill="#2f8c4b"/><path d="M228 210v-34l20 7-20 7" fill="#2f8c4b"/>' +
      '<rect x="130" y="260" width="6" height="10" fill="' + w + '" class="mp-win"/><rect x="150" y="300" width="6" height="10" fill="' + w + '"/>' +
      '<rect x="222" y="270" width="6" height="12" fill="' + w + '"/><rect x="236" y="320" width="6" height="12" fill="' + w + '" class="mp-win"/>' +
      '<rect x="70" y="330" width="6" height="10" fill="' + w + '"/><rect x="286" y="350" width="5" height="9" fill="' + w + '"/>' +
      '<path d="M118 430v-40q22-22 44 0v40z" fill="#020503"/>' +
      '<text x="140" y="450" text-anchor="middle" font-size="11" font-weight="900" letter-spacing="2" fill="#4fbf74" opacity=".8">DOOMSTADT</text>' +
      '</g>';
  }

  function forest() {
    var z = zoneX(ZONES[1]), r = rnd(21), out = '';
    function pine(x, y, s, c) {
      return '<path d="M' + f1(x) + ' ' + f1(y - 90 * s) + 'L' + f1(x + 26 * s) + ' ' + f1(y - 40 * s) + 'H' + f1(x + 14 * s) + 'L' + f1(x + 34 * s) + ' ' + f1(y) +
        'H' + f1(x - 34 * s) + 'L' + f1(x - 14 * s) + ' ' + f1(y - 40 * s) + 'H' + f1(x - 26 * s) + 'Z" fill="' + c + '"/>' +
        '<rect x="' + f1(x - 4 * s) + '" y="' + f1(y) + '" width="' + f1(8 * s) + '" height="' + f1(12 * s) + '" fill="#081008"/>';
    }
    for (var i = 0; i < 46; i++) {
      var x = z[0] - 60 + r() * (z[1] - z[0] + 120);
      out += pine(x, 430 - r() * 30, 0.8 + r() * 0.9, i % 3 ? '#0b2215' : '#0e2a1a');
    }
    // oci u mraku
    for (var k = 0; k < 7; k++) {
      var ex = z[0] + r() * (z[1] - z[0]), ey = 360 + r() * 50;
      out += '<g class="mp-eyes" style="animation-delay:' + f1(r() * 4) + 's"><circle cx="' + f1(ex) + '" cy="' + f1(ey) + '" r="2.2" fill="#ffe36b"/>' +
        '<circle cx="' + f1(ex + 9) + '" cy="' + f1(ey) + '" r="2.2" fill="#ffe36b"/></g>';
    }
    return out;
  }

  function forestFront() {
    var z = zoneX(ZONES[1]), r = rnd(23), out = '';
    for (var i = 0; i < 18; i++) {
      var x = z[0] + r() * (z[1] - z[0]), y = 644, s = 0.5 + r() * 0.45;   // nisko - ne sme da pokrije put
      out += '<path d="M' + f1(x) + ' ' + f1(y - 110 * s) + 'L' + f1(x + 40 * s) + ' ' + f1(y) + 'H' + f1(x - 40 * s) + 'Z" fill="#06120a"/>';
    }
    return out;
  }

  function city() {
    var z = zoneX(ZONES[2]), r = rnd(31), out = '';
    for (var i = 0; i < 34; i++) {
      var x = z[0] - 40 + r() * (z[1] - z[0] + 80), w = 34 + r() * 50, h = 90 + r() * 190, y = 440 - h;
      var top = 'L' + f1(x + w * 0.7) + ' ' + f1(y + r() * 30) + 'L' + f1(x + w * 0.45) + ' ' + f1(y + 20 + r() * 40) + 'L' + f1(x + w * 0.25) + ' ' + f1(y + r() * 20);
      out += '<path d="M' + f1(x) + ' 440V' + f1(y + 10) + 'L' + f1(x + w) + ' ' + f1(y) + top + 'L' + f1(x) + ' ' + f1(y + 10) + 'Z" fill="' + (i % 2 ? '#14141c' : '#1b1a22') + '"/>';
      for (var k = 0; k < 4; k++) {
        if (r() < 0.55) continue;
        out += '<rect x="' + f1(x + 6 + r() * (w - 14)) + '" y="' + f1(y + 40 + r() * (h - 60)) + '" width="5" height="7" fill="#ff9a3c" opacity="' + f1(.4 + r() * .6) + '"/>';
      }
    }
    for (var s = 0; s < 8; s++) {
      var sx = z[0] + r() * (z[1] - z[0]);
      out += '<ellipse class="mp-smoke" style="animation-delay:' + f1(r() * 6) + 's" cx="' + f1(sx) + '" cy="' + f1(230 + r() * 80) + '" rx="' + f1(40 + r() * 40) + '" ry="' + f1(16 + r() * 12) + '" fill="#6b6060" opacity=".08"/>';
    }
    return out;
  }

  function incursion() {
    var z = zoneX(ZONES[3]), r = rnd(41), cx = (z[0] + z[1]) / 2, out = '';
    // druga Zemlja se priblizava
    out += '<circle cx="' + f1(cx + 120) + '" cy="40" r="210" fill="url(#mpPlanet)"/>' +
      '<circle cx="' + f1(cx + 120) + '" cy="40" r="214" fill="none" stroke="#c77dff" stroke-opacity=".35" stroke-width="6"/>';
    // portali
    for (var i = 0; i < 4; i++) {
      var px = z[0] + 140 + i * (z[1] - z[0] - 280) / 3, py = 300 + (i % 2) * 50;
      out += '<g class="mp-portal" style="animation-delay:' + (i * 0.7) + 's;transform-origin:' + f1(px) + 'px ' + py + 'px">' +
        '<ellipse cx="' + f1(px) + '" cy="' + py + '" rx="30" ry="46" fill="none" stroke="#ff8a3c" stroke-width="5" stroke-dasharray="14 8"/>' +
        '<ellipse cx="' + f1(px) + '" cy="' + py + '" rx="22" ry="36" fill="#2a0a3a" opacity=".85"/></g>';
    }
    // lebdece stene
    for (var k = 0; k < 9; k++) {
      var rx = z[0] + r() * (z[1] - z[0]), ry = 180 + r() * 150, s = 0.6 + r() * 0.8;
      out += '<path class="mp-float" style="animation-delay:' + f1(r() * 3) + 's" d="M' + f1(rx - 30 * s) + ' ' + f1(ry) + 'H' + f1(rx + 30 * s) + 'L' + f1(rx + 8 * s) + ' ' + f1(ry + 34 * s) + 'L' + f1(rx - 6 * s) + ' ' + f1(ry + 22 * s) + 'Z" fill="#2a1d33"/>';
    }
    return out;
  }

  function doomsday(W) {
    var z = zoneX(ZONES[4]), r = rnd(51), out = '';
    // ogromna Doomova maska u oblacima
    out += '<g opacity=".2" transform="translate(' + f1(z[0] + 380) + ' 470) scale(5.2)">' +
      '<path d="M-27-150Q-33-200 0-209Q33-200 27-150Q14-140 0-140Q-14-140-27-150Z" fill="#300"/>' +
      '<path d="M-16-189Q0-195 16-189V-162Q14-151 0-147Q-14-151-16-162Z" fill="#a33"/>' +
      '<rect x="-12" y="-180" width="9" height="3.6" fill="#ff5a3c"/><rect x="3" y="-180" width="9" height="3.6" fill="#ff5a3c"/></g>';
    // munje
    for (var i = 0; i < 6; i++) {
      var lx = z[0] + r() * (W - z[0] - 200), y = 0, d = 'M' + f1(lx) + ' 0';
      while (y < 330) { y += 30 + r() * 40; lx += (r() - 0.5) * 70; d += 'L' + f1(lx) + ' ' + f1(y); }
      out += '<path class="mp-bolt" style="animation-delay:' + f1(r() * 4) + 's" d="' + d + '" fill="none" stroke="#ffd0c4" stroke-width="3"/>';
    }
    return out;
  }

  function cracks() {
    var z = [xOf(0.7), xOf(1) + 400], r = rnd(61), out = '';
    for (var i = 0; i < 26; i++) {
      var x = z[0] + r() * (z[1] - z[0]), y = 520 + r() * 110, d = 'M' + f1(x) + ' ' + f1(y);
      for (var k = 0; k < 4; k++) { x += 20 + r() * 40; y += (r() - 0.5) * 20; d += 'L' + f1(x) + ' ' + f1(y); }
      out += '<path d="' + d + '" fill="none" stroke="#ff5a1f" stroke-width="' + f1(1.5 + r() * 2) + '" class="mp-lava"/>';
    }
    // vatre
    for (var j = 0; j < 12; j++) {
      var fx = xOf(0.8) + r() * (xOf(1) - xOf(0.8) + 420), fy = 440 + r() * 10, s = 0.7 + r() * 0.8;
      out += '<path class="mp-fire" style="animation-delay:' + f1(r()) + 's;transform-origin:' + f1(fx) + 'px ' + f1(fy) + 'px" d="M' + f1(fx) + ' ' + f1(fy) +
        'q' + f1(-18 * s) + ' ' + f1(-20 * s) + ' ' + f1(-4 * s) + ' ' + f1(-52 * s) + 'q' + f1(6 * s) + ' ' + f1(20 * s) + ' ' + f1(14 * s) + ' ' + f1(14 * s) +
        'q' + f1(2 * s) + ' ' + f1(-22 * s) + ' ' + f1(14 * s) + ' ' + f1(-30 * s) + 'q' + f1(-4 * s) + ' ' + f1(30 * s) + ' ' + f1(-24 * s) + ' ' + f1(68 * s) + 'z" fill="url(#mpFire)"/>';
    }
    return out;
  }

  /** Sitnice na tlu ispod puta: trava u Latveriji, kamenje dalje, kosti pred kraj. */
  function groundBits(W) {
    var r = rnd(81), out = '';
    for (var i = 0; i < 160; i++) {
      var x = r() * W, t = x / W, y = 545 + r() * 90;
      if (t < 0.42) {
        out += '<path d="M' + f1(x) + ' ' + f1(y) + 'l-4-12M' + f1(x) + ' ' + f1(y) + 'l1-15M' + f1(x) + ' ' + f1(y) + 'l5-11" stroke="' + (t < 0.2 ? '#2c6a3e' : '#1f4a30') + '" stroke-width="2" stroke-linecap="round"/>';
      } else {
        var s = 3 + r() * 8;
        out += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(s * 1.4) + '" ry="' + f1(s * 0.7) + '" fill="' + (t > 0.86 ? '#2a0f0b' : '#26232a') + '"/>';
      }
    }
    return out;
  }

  function embers(W) {
    var r = rnd(71), out = '';
    for (var i = 0; i < 70; i++) {
      var x = xOf(0.6) + r() * (W - xOf(0.6)), y = 380 + r() * 240;
      out += '<circle class="mp-ember" style="animation-delay:' + f1(r() * 5) + 's;animation-duration:' + f1(3 + r() * 4) + 's" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(1 + r() * 2) + '" fill="#ff9a5a"/>';
    }
    return out;
  }

  function banners() {
    return ZONES.map(function (z, i) {
      var x = xOf(z.r0) + (i === 0 ? 40 : 60), y = 172;
      return '<g class="mp-banner" transform="translate(' + f1(x) + ' ' + y + ') rotate(-4)">' +
        '<linearGradient id="mpZ' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + z.c1 + '"/><stop offset="1" stop-color="' + z.c2 + '"/></linearGradient>' +
        '<text x="0" y="0" font-size="50" font-weight="900" letter-spacing="1" fill="url(#mpZ' + i + ')" stroke="#07070a" stroke-width="9" paint-order="stroke" stroke-linejoin="round">' + z.name + '</text>' +
        '<text x="4" y="30" font-size="16" font-weight="800" fill="#fff" fill-opacity=".75" stroke="#07070a" stroke-width="5" paint-order="stroke">' + z.sub + '</text>' +
        '</g>';
    }).join('');
  }

  function road(W, xDoom) {
    var pts = [];
    for (var x = 0; x <= W; x += 24) pts.push(f1(x) + ' ' + f1(roadY(x)));
    var d = 'M' + pts.join('L');
    return '<path d="' + d + '" fill="none" stroke="#08090b" stroke-width="66" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="url(#mpRoad)" stroke-width="54" stroke-linecap="round"/>' +
      '<clipPath id="mpPassed"><rect id="mpPassedR" x="0" y="0" width="' + f1(xDoom) + '" height="' + H + '"/></clipPath>' +
      '<path d="' + d + '" fill="none" stroke="url(#mpDone)" stroke-width="54" clip-path="url(#mpPassed)"/>' +
      '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3" stroke-dasharray="16 18"/>';
  }

  function nodes(time) {
    var P = MM.Plan, out = '', n = days();
    for (var dd = 0, w = 1; dd <= n; dd += 7, w++) {
      var iso = P.addDays(P.START_ISO, dd), dt = P.parse(iso);
      var r = dd / n, x = xOf(r), y = roadY(x), past = r <= time + 1e-6;
      var month = dt.getDate() <= 7;
      out += '<g class="mp-node' + (past ? ' past' : '') + '">' +
        '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="21" fill="' + (past ? '#2bc964' : '#1c1f25') + '" stroke="' + (past ? '#b8ffcf' : '#4b525c') + '" stroke-width="3"/>' +
        (past ? '<path d="M' + f1(x - 8) + ' ' + f1(y) + 'l6 6 11-12" fill="none" stroke="#04210f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>'
          : '<text x="' + f1(x) + '" y="' + f1(y + 5) + '" text-anchor="middle" font-size="14" font-weight="900" fill="#cfd3da">' + w + '</text>') +
        '<text x="' + f1(x) + '" y="' + f1(y + 50) + '" text-anchor="middle" font-size="' + (month ? 16 : 14) + '" font-weight="900" fill="' + (past ? '#7dffa4' : '#d9dce2') + '" stroke="#07070a" stroke-width="4" paint-order="stroke">' +
          dt.getDate() + '. ' + UI.MON3[dt.getMonth()] + '</text>' +
        '</g>';
    }
    return out;
  }

  function goal(W) {
    var x = xOf(1), y = roadY(x), bulbs = '';
    for (var i = 0; i < 16; i++) {
      var bx = x - 150 + i * 20;
      bulbs += '<circle class="mp-bulb" style="animation-delay:' + (i % 2 ? '.5s' : '0s') + '" cx="' + bx + '" cy="' + (y - 252) + '" r="4" fill="#ffd36b"/>' +
        '<circle class="mp-bulb" style="animation-delay:' + (i % 2 ? '0s' : '.5s') + '" cx="' + bx + '" cy="' + (y - 160) + '" r="4" fill="#ffd36b"/>';
    }
    return '<g class="mp-goal">' +
      '<rect x="' + (x - 170) + '" y="' + (y - 270) + '" width="340" height="128" rx="14" fill="#e62429" opacity=".35" filter="url(#dmSoft)"/>' +
      '<rect x="' + (x - 166) + '" y="' + (y - 266) + '" width="332" height="120" rx="12" fill="#14080a" stroke="#e62429" stroke-width="5"/>' +
      bulbs +
      '<text x="' + x + '" y="' + (y - 218) + '" text-anchor="middle" font-size="22" font-weight="900" letter-spacing="3" fill="#ffd36b">AVENGERS</text>' +
      '<text x="' + x + '" y="' + (y - 186) + '" text-anchor="middle" font-size="34" font-weight="900" letter-spacing="2" fill="#ff4b45">DOOMSDAY</text>' +
      '<rect x="' + (x - 150) + '" y="' + (y - 146) + '" width="10" height="150" fill="#2b2f36"/><rect x="' + (x + 140) + '" y="' + (y - 146) + '" width="10" height="150" fill="#2b2f36"/>' +
      '<text x="' + x + '" y="' + (y - 120) + '" text-anchor="middle" font-size="15" font-weight="900" letter-spacing="3" fill="#ffb3b0" stroke="#07070a" stroke-width="4" paint-order="stroke">18.12. · BIOSKOP</text>' +
      '<circle cx="' + x + '" cy="' + y + '" r="30" fill="#e62429" stroke="#ffd36b" stroke-width="4"/>' +
      '<text x="' + x + '" y="' + (y + 7) + '" text-anchor="middle" font-size="20" font-weight="900" fill="#fff">🎬</text>' +
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
    var defs = '<defs>' + DEFS +
      '<linearGradient id="mpSky" x1="0" y1="0" x2="' + W + '" y2="0" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="#0a1426"/><stop offset=".2" stop-color="#0b1f1a"/><stop offset=".42" stop-color="#121a24"/>' +
        '<stop offset=".64" stop-color="#2a1036"/><stop offset=".86" stop-color="#4a0d12"/><stop offset="1" stop-color="#6e1306"/></linearGradient>' +
      '<linearGradient id="mpFar" x1="0" y1="0" x2="' + W + '" y2="0" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="#0f2018"/><stop offset=".42" stop-color="#151722"/><stop offset=".7" stop-color="#26112c"/><stop offset="1" stop-color="#3a0b0b"/></linearGradient>' +
      '<linearGradient id="mpNear" x1="0" y1="0" x2="' + W + '" y2="0" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="#132a1d"/><stop offset=".3" stop-color="#0f2216"/><stop offset=".5" stop-color="#1b1b20"/><stop offset=".75" stop-color="#2a1422"/><stop offset="1" stop-color="#2e0907"/></linearGradient>' +
      '<linearGradient id="mpGround" x1="0" y1="0" x2="' + W + '" y2="0" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="#16301f"/><stop offset=".3" stop-color="#10241a"/><stop offset=".5" stop-color="#1f1d22"/><stop offset=".75" stop-color="#2a1424"/><stop offset="1" stop-color="#3a0c08"/></linearGradient>' +
      '<linearGradient id="mpRoad" x1="0" y1="0" x2="' + W + '" y2="0" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="#3a3f48"/><stop offset=".6" stop-color="#34303a"/><stop offset="1" stop-color="#3d2422"/></linearGradient>' +
      '<linearGradient id="mpDone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5dffa0"/><stop offset="1" stop-color="#18a14a"/></linearGradient>' +
      '<radialGradient id="mpPlanet" cx=".4" cy=".35"><stop offset="0" stop-color="#7fb2ff"/><stop offset=".55" stop-color="#3b2a8a"/><stop offset="1" stop-color="#1a0c2a"/></radialGradient>' +
      '<linearGradient id="mpFire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff3a12"/><stop offset=".6" stop-color="#ff9a2a"/><stop offset="1" stop-color="#ffe27a"/></linearGradient>' +
      '</defs>';
    var people = ctx.people || [];
    return '<svg class="mp-svg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + defs +
      sky(W) + doomsday(W) + incursion() + mountains(W) + castle() + forest() + city() +
      '<rect y="430" width="' + W + '" height="' + (H - 430) + '" fill="url(#mpGround)"/>' +
      groundBits(W) + cracks() + road(W, xd) + nodes(ctx.time) + banners() + goal(W) + forestFront() + embers(W) +
      '<g id="mpDoom">' + figure() + '<g class="mp-tag" transform="translate(0 -318)"><rect x="-38" y="-14" width="76" height="26" rx="13" fill="#0f3d20" stroke="#7dffa4" stroke-width="2"/>' +
        '<text y="5" text-anchor="middle" font-size="14" font-weight="900" fill="#b8ffcf" letter-spacing="1">DOOM</text></g></g>' +
      people.map(pin).join('') +
      '<g id="mpSay" class="mp-say" opacity="0"><rect x="-90" y="-30" width="180" height="32" rx="16" fill="#f4fff6"/>' +
        '<path d="M-8 2l8 10 8-10z" fill="#f4fff6"/><text y="-9" text-anchor="middle" font-size="15" font-weight="900" fill="#0c2414"></text></g>' +
      '</svg>';
  }

  /* ============================================================
     pokretanje i kamera
     ============================================================ */

  var LINES = ['Doom ne čeka.', 'Kleknite pred Doomom!', 'Vreme ističe, smrtniče.', 'Latverija pamti.',
    'Gledaj brže.', 'Doom vidi sve epizode.', 'Ti me nećeš stići.', 'Victor von Doom nikad ne kasni.'];

  var cur = null;   // { el, svg, scale, ctx, lay, anim }

  function doomAt(x) {
    var g = cur.svg.querySelector('#mpDoom');
    var y = roadY(x) + 4;
    g.setAttribute('transform', 'translate(' + f1(x) + ' ' + f1(y) + ') scale(.64)');
    cur.svg.querySelector('#mpPassedR').setAttribute('width', f1(x));
    var say = cur.svg.querySelector('#mpSay');
    say.setAttribute('transform', 'translate(' + f1(x) + ' ' + f1(y - 232) + ')');
    cur.doomX = x;
  }

  function placePins() {
    var people = cur.ctx.people || [];
    people.forEach(function (p, i) {
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

  /** Pomeri kameru tako da je x na sredini ekrana. */
  function look(x, smooth) {
    var sc = cur.el.querySelector('.mp-scroll');
    var left = x * cur.scale - sc.clientWidth / 2;
    if (smooth) sc.scrollTo({ left: left, behavior: 'smooth' }); else sc.scrollLeft = left;
  }

  function walk(x0, x1, done) {
    var d = cur.svg.querySelector('.dm');
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

  /**
   * ctx: { time, from, people: [{name, photo, ratio, me, label}] }
   * el mora da sadrzi .mp-scroll (u njega ide SVG).
   */
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
    var x0 = ctx.from != null ? xOf(ctx.from) : Math.max(xOf(0), x1 - 240);
    doomAt(x0);
    look(x0, false);
    var arrived = ctx.time >= 1;
    setTimeout(function () {
      if (!cur) return;
      walk(x0, x1, function () {
        if (arrived) { svg.classList.add('arrived'); say('DOOMSDAY JE STIGAO.'); }
        else say(LINES[Math.floor(Math.random() * LINES.length)]);
      });
    }, 400);

    svg.querySelector('#mpDoom').addEventListener('click', function (e) {
      e.stopPropagation();
      var d = svg.querySelector('.dm');
      d.classList.remove('cast'); void d.getBoundingClientRect(); d.classList.add('cast');
      UI.buzz([12, 40, 24]);
      say(LINES[Math.floor(Math.random() * LINES.length)]);
      setTimeout(function () { d.classList.remove('cast'); }, 1400);
    });
    svg.addEventListener('click', function (e) {
      var p = e.target.closest('.mp-pin');
      if (!p) return;
      var person = (cur.ctx.people || [])[+p.getAttribute('data-i')];
      if (person) UI.toast((person.me ? 'Ti' : person.name) + ' · ' + Math.round(person.ratio * 100) + '% plana');
    });
  }

  /** Skok kamere: 'doom', 'goal', 'start' ili indeks osobe. */
  function jump(what) {
    if (!cur) return;
    if (what === 'doom') return look(cur.doomX, true);
    if (what === 'goal') return look(xOf(1), true);
    if (what === 'start') return look(xOf(0) - 120, true);
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
      '<div class="rm-lbl"><span>Latverija 17.8.</span><span>' + (ahead ? 'ispred si Dooma' : 'Doom je ispred tebe') + ' · mapa ›</span><span>18.12.</span></div>' +
      '</div>';
  }

  MM.Doom = { mount: mount, jump: jump, stop: stop, mini: mini, head: head, figure: figure };
})();
