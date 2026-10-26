/* ============================================================
   badges.js  -  predmeti iz filmova, kamenje beskonacnosti,
                 dostignuca i animacija kad nesto odgledas
   ------------------------------------------------------------
   Svaki naslov kad ga zavrsis daje svoj predmet (Mjolnir, stit,
   kaseta...). Predmeti se NE cuvaju posebno - izvode se iz onoga
   sto je odgledano, pa uvek prate stanje (i na drugom uredjaju).

   Gauntlet: prazna rukavica iz Age of Ultron, kamenje iz filmova
   u kojima se pojavljuje, a Endgame dopuni sve sto fali i pucne.

   Dostignuca (niz, broj naslova, nocna ptica...) se pamte u
   s.ach = { id: vreme } kad se prvi put otkljucaju.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI;
  var esc = UI.esc;

  /* ============================================================
     sličice predmeta (SVG 64x64, boje iz --a --b --c)
     ============================================================ */

  var A = 'var(--a)', B = 'var(--b)', C = 'var(--c)';
  var IMG = 'img/map/';
  var HL = ' fill="#fff" fill-opacity=".4" stroke="none"';

  function f(c) { return ' fill="' + c + '"'; }
  function line(d, c, w) {   // linija sa tamnim obodom (lanci, luk, prstenje)
    return '<path d="' + d + '" fill="none" stroke="#15121b" stroke-width="' + (w + 4) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function star(cx, cy, R, r, n) {
    var p = [];
    for (var i = 0; i < n * 2; i++) {
      var a = Math.PI / n * i - Math.PI / 2, rr = i % 2 ? r : R;
      p.push((cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1));
    }
    return 'M' + p.join('L') + 'Z';
  }
  function mirror(svg) { return '<g transform="translate(64 0) scale(-1 1)">' + svg + '</g>'; }

  var KATANA = '<path d="M47 7l7 3-31 36-5-4z"' + f(A) + '/><path d="M49 10l2 1-26 30-1-1z"' + HL + '/>' +
    '<ellipse cx="20" cy="44" rx="8" ry="3.2" transform="rotate(-45 20 44)"' + f(B) + '/>' +
    '<path d="M18 47L8 57l4 4 10-10z"' + f(C) + '/>';
  var SPIDER_HEAD = '<path d="M32 6c13 0 22 10 22 24 0 16-10 28-22 28S10 46 10 30C10 16 19 6 32 6z"' + f(A) + '/>';

  var ICONS = {
    hammer: '<rect x="11" y="8" width="42" height="23" rx="5"' + f(A) + '/><rect x="15" y="11" width="16" height="4" rx="2"' + HL + '/>' +
      '<path d="M11 24h42" fill="none" stroke-opacity=".5"/>' +
      '<rect x="28" y="31" width="8" height="21" rx="2"' + f(B) + '/><path d="M28 37h8M28 42h8M28 47h8" fill="none"/>' +
      '<circle cx="32" cy="56.5" r="4" fill="none"/>',
    shield: '<circle cx="32" cy="32" r="27"' + f(A) + '/><circle cx="32" cy="32" r="20"' + f(B) + '/><circle cx="32" cy="32" r="13.5"' + f(A) + '/>' +
      '<circle cx="32" cy="32" r="9"' + f(C) + '/><path d="' + star(32, 32, 8, 3.2, 5) + '"' + f(B) + ' stroke-width="1.2"/>' +
      '<path d="M13 23a21 21 0 0 1 13-11" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>',
    arc: '<circle cx="32" cy="32" r="27" fill="#232a36"/><circle cx="32" cy="32" r="21"' + f(B) + '/>' +
      '<circle cx="32" cy="32" r="18" fill="none" stroke="#2b3240" stroke-width="5" stroke-dasharray="6 3.4"/>' +
      '<circle cx="32" cy="32" r="13"' + f(A) + '/><circle cx="32" cy="32" r="6.5" fill="#f2ffff" stroke="none"/>' +
      '<circle cx="32" cy="32" r="16" fill="' + A + '" opacity=".25" stroke="none"/>',
    arcTri: '<circle cx="32" cy="32" r="27" fill="#232a36"/><circle cx="32" cy="32" r="21"' + f(B) + '/>' +
      '<circle cx="32" cy="32" r="15"' + f(C) + '/><path d="M32 19l12 21H20z"' + f(A) + '/><path d="M32 26l5 9h-10z" fill="#f2ffff" stroke="none"/>',
    helmet: '<path d="M14 26C14 12 22 6 32 6s18 6 18 20v16c0 10-8 16-18 16s-18-6-18-16z"' + f(A) + '/>' +
      '<path d="M20 22c0-7 6-10 12-10s12 3 12 10v18c0 7-6 12-12 12s-12-5-12-12z"' + f(B) + '/>' +
      '<path d="M22 27h8l-2 4.5h-6zM42 27h-8l2 4.5h6z" fill="#eaffff"/><path d="M26 44h12" fill="none"/>' +
      '<path d="M19 12c3-3 7-4 10-4"' + HL + ' fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>',
    fist: '<path d="M13 30c0-5 4-8 8-8h23c5 0 8 3 8 8v13c0 9-6 15-15 15H26c-7 0-13-6-13-13z"' + f(A) + '/>' +
      '<path d="M22 22v11M31 22v11M40 22v11M13 37c7-2 15-1 19 3" fill="none"/>' +
      '<rect x="22" y="56" width="20" height="6" rx="2"' + f(B) + '/><path d="M17 26c2-2 5-2 7-1"' + HL + ' fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.5"/>',
    skull: '<path d="M32 5C19 5 11 14 11 27c0 7 3 11 7 14v9c0 4 2 7 6 7h16c4 0 6-3 6-7v-9c4-3 7-7 7-14C53 14 45 5 32 5z"' + f(A) + '/>' +
      '<path d="M18 26c4-4 10-3 12 3l-3 6c-5 1-9-3-9-9zM46 26c-4-4-10-3-12 3l3 6c5 1 9-3 9-9z"' + f(C) + '/>' +
      '<path d="M32 35l-3 6h6z"' + f(C) + '/><path d="M24 47v10M28 47v10M32 47v10M36 47v10M40 47v10" fill="none"/>' +
      '<path d="M17 18c3-5 8-8 13-9" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>',
    katana: KATANA,
    katanas: KATANA + mirror(KATANA),
    cane: '<g transform="rotate(35 32 32)"><rect x="28" y="2" width="8" height="60" rx="4"' + f(A) + '/>' +
      '<path d="M28 22h8M28 42h8" fill="none"/><rect x="30" y="5" width="2.5" height="14" rx="1"' + HL + '/></g>',
    sai: '<path d="M32 3l3.5 33h-7z"' + f(A) + '/><path d="M19 18c0 10 5 16 13 16s13-6 13-16" fill="none" stroke="#15121b" stroke-width="7"/>' +
      '<path d="M19 18c0 10 5 16 13 16s13-6 13-16" fill="none" stroke="' + A + '" stroke-width="3.5"/>' +
      '<rect x="29" y="35" width="6" height="20" rx="2"' + f(B) + '/><circle cx="32" cy="58" r="3.5"' + f(A) + '/>',
    leaf: '<path d="M10 54C10 27 27 9 55 9c0 28-17 45-45 45z"' + f(A) + '/><path d="M10 54L46 18M22 42h12M30 34V22" fill="none"/>' +
      '<path d="M18 40c4-12 14-20 26-24" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>',
    four: '<circle cx="32" cy="32" r="27"' + f(A) + '/><circle cx="32" cy="32" r="21"' + f(B) + '/>' +
      '<path d="M35 14h7v21h5v7h-5v8h-7v-8H17v-6zM35 35V24l-9 11z"' + f(A) + ' fill-rule="evenodd"/>',
    chain: line('M10 30a8 8 0 0 1 8-8h6a8 8 0 0 1 0 16h-6a8 8 0 0 1-8-8z', A, 4) +
      line('M26 30a8 8 0 0 1 8-8h0a8 8 0 0 1 0 16h0', B, 4) + line('M38 30a8 8 0 0 1 8-8h0a8 8 0 0 1 0 16h-6', A, 4) +
      '<path d="M8 44c8 6 40 6 48 0" fill="none" stroke="' + C + '" stroke-width="3" stroke-dasharray="2 5"/>',
    surfboard: '<ellipse cx="32" cy="32" rx="12" ry="29" transform="rotate(40 32 32)"' + f(A) + '/>' +
      '<path d="M18 48L46 16" fill="none" stroke="' + B + '" stroke-width="3"/>' +
      '<ellipse cx="27" cy="27" rx="3" ry="12" transform="rotate(40 27 27)"' + HL + '/>',
    aLogo: '<circle cx="32" cy="32" r="27"' + f(C) + '/><circle cx="32" cy="32" r="22" fill="none" stroke="' + A + '" stroke-width="4"/>' +
      '<path d="M32 11l14 39h-7l-3-9h-9l-3 9h-7zM29 35h6l-3-10z"' + f(A) + ' fill-rule="evenodd"/><path d="M18 40h30" fill="none" stroke="' + A + '" stroke-width="4"/>',
    starPlate: '<path d="M9 20c8-11 38-11 46 0v18c0 13-10 21-23 21S9 51 9 38z"' + f(A) + '/>' +
      '<path d="M9 28h46M10 44h44" fill="none"/><path d="' + star(32, 36, 10, 4, 5) + '"' + f(B) + '/>' +
      '<path d="M15 15c6-3 14-4 22-3" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>',
    cassette: '<rect x="5" y="13" width="54" height="38" rx="4"' + f(A) + '/><rect x="11" y="18" width="42" height="13" rx="2"' + f(B) + '/>' +
      '<path d="M15 23h20M15 27h12" fill="none" stroke-width="1.6"/><rect x="18" y="33" width="28" height="11" rx="5.5"' + f(C) + '/>' +
      '<circle cx="24.5" cy="38.5" r="3.5"' + f(B) + '/><circle cx="39.5" cy="38.5" r="3.5"' + f(B) + '/><path d="M16 51l4-5h24l4 5" fill="none"/>',
    player: '<rect x="17" y="5" width="30" height="54" rx="7"' + f(A) + '/><rect x="21" y="10" width="22" height="23" rx="2"' + f(C) + '/>' +
      '<circle cx="32" cy="46" r="8"' + f(B) + '/><circle cx="32" cy="46" r="3"' + f(A) + '/><rect x="23" y="12" width="6" height="12" rx="2"' + HL + '/>',
    robot: '<path d="M16 20c0-9 7-14 16-14s16 5 16 14v14c0 12-7 20-16 23-9-3-16-11-16-23z"' + f(A) + '/>' +
      '<path d="M19 26l11 3-1 3.5-10-2.5zM45 26l-11 3 1 3.5 10-2.5z"' + f(B) + '/>' +
      '<path d="M24 42c4 3 12 3 16 0l-2 6c-4 2-8 2-12 0z"' + f(C) + '/><path d="M32 6v10M16 34l6 4M48 34l-6 4" fill="none"/>' +
      '<path d="M21 12c3-3 6-4 9-4" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>',
    ant: '<path d="M24 14l-6-10M40 14l6-10" fill="none"/><circle cx="32" cy="32" r="21"' + f(A) + '/>' +
      '<path d="M17 28h30v9c0 7-7 11-15 11s-15-4-15-11z"' + f(C) + '/><circle cx="25" cy="36" r="5.5"' + f(B) + '/><circle cx="39" cy="36" r="5.5"' + f(B) + '/>' +
      '<rect x="8" y="27" width="6" height="14" rx="3"' + f(B) + '/><rect x="50" y="27" width="6" height="14" rx="3"' + f(B) + '/>' +
      '<path d="M18 20c3-4 7-6 12-7" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>',
    atom: line('M8 32a24 9 0 1 0 48 0a24 9 0 1 0-48 0', A, 3.2) +
      '<g transform="rotate(60 32 32)">' + line('M8 32a24 9 0 1 0 48 0a24 9 0 1 0-48 0', B, 3.2) + '</g>' +
      '<g transform="rotate(120 32 32)">' + line('M8 32a24 9 0 1 0 48 0a24 9 0 1 0-48 0', A, 3.2) + '</g>' +
      '<circle cx="32" cy="32" r="6"' + f(C) + '/>',
    eye: '<path d="M5 32c8-12 18-19 27-19s19 7 27 19c-8 12-18 19-27 19S13 44 5 32z"' + f(B) + '/>' +
      '<path d="M13 32c6-8 12-11 19-11s13 3 19 11c-6 8-12 11-19 11s-13-3-19-11z"' + f(C) + '/>' +
      '<circle cx="32" cy="32" r="7.5"' + f(A) + '/><circle cx="32" cy="32" r="3" fill="#eafff0" stroke="none"/>' +
      '<path d="M32 8v5M32 51v5M10 18l4 4M54 18l-4 4" fill="none"/>',
    eye2: '<path d="M4 32c9-13 18-20 28-20s19 7 28 20c-9 13-18 20-28 20S13 45 4 32z"' + f(B) + '/>' +
      '<circle cx="32" cy="32" r="13"' + f(A) + '/><circle cx="32" cy="32" r="6"' + f(C) + '/><circle cx="28" cy="27" r="3" fill="#fff" stroke="none"/>',
    groot: '<path d="M32 38c-7-4-9-13-7-21 3 2 5 6 6 10 1-6 4-12 9-14 1 8-2 17-8 25z"' + f(A) + '/>' +
      '<path d="M25 17c-5-2-9 0-11 3 4 2 8 1 11-3zM40 13c3-4 8-5 11-3-3 4-7 5-11 3z"' + f(C) + '/>' +
      '<circle cx="29.5" cy="29" r="1.6" fill="#15121b" stroke="none"/><circle cx="35" cy="28" r="1.6" fill="#15121b" stroke="none"/>' +
      '<rect x="15" y="38" width="34" height="6" rx="2"' + f(B) + '/><path d="M18 44h28l-4 15H22z"' + f(B) + '/>',
    spider: SPIDER_HEAD +
      '<path d="M32 6v52M12 21c12 6 28 6 40 0M10 33c14 5 30 5 44 0M14 46c10 4 26 4 36 0" fill="none" stroke-opacity=".35" stroke-width="1.4"/>' +
      '<path d="M14 25c6-2 13 0 15 7-3 5-11 5-15-1-1-2-1-4 0-6zM50 25c-6-2-13 0-15 7 3 5 11 5 15-1 1-2 1-4 0-6z"' + f(B) + '/>' +
      '<path d="M19 11c3-3 7-4 10-4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>',
    symbiote: SPIDER_HEAD +
      '<path d="M13 21c7 0 13 5 15 13-7 2-13 0-16-6zM51 21c-7 0-13 5-15 13 7 2 13 0 16-6z"' + f(B) + '/>' +
      '<path d="M18 43c8 6 20 6 28 0-2 9-8 13-14 13s-12-4-14-13z"' + f(C) + '/>' +
      '<path d="M20 44l3 4 3-3 3 4 3-4 3 4 3-4 3 3 3-4" fill="none" stroke="#fff" stroke-width="1.6"/>',
    bolt: '<path d="M38 3L13 36h14l-6 25 29-35H35z"' + f(A) + '/><path d="M35 9L20 31h6"' + HL + ' fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.5"/>',
    panther: '<path d="M32 58c-10-4-18-12-18-26 0-8 2-14 6-21l6 7h12l6-7c4 7 6 13 6 21 0 14-8 22-18 26z"' + f(A) + '/>' +
      '<path d="M32 18v20M22 22l6 12M42 22l-6 12M24 45c4 4 12 4 16 0" fill="none" stroke="' + B + '" stroke-width="2"/>' +
      '<path d="M19 31l9 2-1 3.5-7-1.5zM45 31l-9 2 1 3.5 7-1.5z" fill="#fff"/>',
    axe: line('M13 58L41 18', B, 5) +
      '<path d="M35 5c11 2 19 10 21 21l-11 4-6-6-6 4z"' + f(A) + '/><path d="M30 21l-8-8 6-3 6 6z"' + f(A) + '/>' +
      '<path d="M48 30l6 6-4 2 4 6" fill="none" stroke="' + C + '" stroke-width="2.2"/><path d="M39 9c6 2 10 6 12 11"' + HL + ' fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.5"/>',
    pager: '<rect x="11" y="13" width="42" height="38" rx="7"' + f(A) + '/><rect x="17" y="19" width="30" height="15" rx="2"' + f(B) + '/>' +
      '<path d="' + star(32, 26.5, 6, 2.4, 8) + '"' + f(C) + ' stroke-width="1"/><circle cx="22" cy="43" r="3"' + f(C) + '/><circle cx="32" cy="43" r="3"' + f(C) + '/><circle cx="42" cy="43" r="3"' + f(C) + '/>',
    glasses: '<path d="M3 24h58v5c-2 0-3 2-4 6-2 9-8 12-14 12s-10-4-11-10h-0c-1 6-5 10-11 10S9 44 7 35c-1-4-2-6-4-6z"' + f(A) + '/>' +
      '<path d="M12 29h12M40 29h12" fill="none" stroke="' + B + '" stroke-width="2.5"/><path d="M28 28c2-2 6-2 8 0" fill="none"/>',
    tv: '<path d="M22 14L14 4M42 14l8-10" fill="none"/><rect x="6" y="14" width="52" height="40" rx="9"' + f(A) + '/>' +
      '<rect x="12" y="20" width="32" height="28" rx="7"' + f(C) + '/><rect x="15" y="23" width="14" height="10" rx="4"' + f(B) + ' stroke="none" opacity=".45"/>' +
      '<circle cx="51" cy="26" r="3.5"' + f(B) + '/><circle cx="51" cy="37" r="3.5"' + f(B) + '/>',
    wings: '<path d="M30 34C22 20 10 13 3 13c2 11 8 23 19 29zM34 34c8-14 20-21 27-21-2 11-8 23-19 29z"' + f(A) + '/>' +
      '<path d="M8 19c6 4 12 9 17 16M56 19c-6 4-12 9-17 16M6 27c6 3 10 7 14 12M58 27c-6 3-10 7-14 12" fill="none" stroke-width="1.6"/>' +
      '<path d="M27 30h10l-5 16z"' + f(B) + '/>',
    horns: '<path d="M18 23C10 19 6 9 8 2c6 6 12 10 17 12zM46 23c8-4 12-14 10-21-6 6-12 10-17 12z"' + f(A) + '/>' +
      '<path d="M15 31c0-11 7-17 17-17s17 6 17 17v12H15z"' + f(A) + '/><path d="M22 30h20v13l-4 7H26l-4-7z"' + f(C) + '/>' +
      '<path d="M19 22c3-3 7-5 11-5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>',
    tree: '<rect x="28" y="36" width="8" height="22" rx="2"' + f(B) + '/><path d="M24 58h16" fill="none"/>' +
      '<circle cx="32" cy="22" r="15"' + f(A) + '/><circle cx="19" cy="31" r="10"' + f(A) + '/><circle cx="45" cy="31" r="10"' + f(A) + '/>' +
      '<path d="M32 36v-12M32 30l-7-6M32 28l7-7" fill="none" stroke="' + C + '" stroke-width="2"/><circle cx="26" cy="15" r="4"' + HL + '/>',
    hourglass: '<circle cx="32" cy="32" r="26"' + f(C) + '/><path d="M21 15h22L32 32l11 17H21l11-17z"' + f(A) + '/>',
    rings: line('M16 20a16 6 0 1 0 32 0a16 6 0 1 0-32 0', A, 4) + line('M14 32a18 6.5 0 1 0 36 0a18 6.5 0 1 0-36 0', B, 4) +
      line('M16 44a16 6 0 1 0 32 0a16 6 0 1 0-32 0', A, 4),
    triangle: '<path d="M32 5l27 50H5z"' + f(A) + '/><path d="M32 20l14 26H18z"' + f(B) + '/><path d="M32 5v15M5 55l13-9M59 55l-13-9" fill="none"/>' +
      '<circle cx="32" cy="36" r="4"' + f(C) + '/>',
    arrow: line('M15 7c22 8 30 30 22 51', A, 4) + '<path d="M15 7l22 51" fill="none" stroke="#ddd" stroke-width="1.4"/>' +
      line('M7 51L52 13', B, 2.6) + '<path d="M53 12l-10 2 8 8z"' + f(B) + '/><path d="M7 51l2-8 4 4zM7 51l8-2-4-4z"' + f(A) + '/>',
    eagle: '<circle cx="32" cy="32" r="27"' + f(C) + '/><circle cx="32" cy="32" r="22" fill="none" stroke="' + B + '" stroke-width="3"/>' +
      '<path d="M32 17c-3 5-7 7-15 7 3 5 8 7 12 7l-5 10 8-4 8 4-5-10c4 0 9-2 12-7-8 0-12-2-15-7z"' + f(B) + '/>',
    hat: '<path d="M5 41c9 5 45 5 54 0-4 7-50 7-54 0z"' + f(A) + '/><path d="M17 42c0-13 5-23 15-23s15 10 15 23z"' + f(A) + '/>' +
      '<path d="M25 23c5 3 9 3 14 0" fill="none"/><path d="M17 35h30v6H17z"' + f(B) + '/>',
    mind: '<path d="M32 12c-6-6-18-2-18 6-6 2-8 10-4 14-2 6 2 12 8 12 2 6 10 8 14 4 4 4 12 2 14-4 6 0 10-6 8-12 4-4 2-12-4-14 0-8-12-12-18-6z"' + f(A) + '/>' +
      '<path d="M32 12v36M20 22c4 0 6 3 6 6M44 22c-4 0-6 3-6 6M18 36c4-2 8 0 9 3M46 36c-4-2-8 0-9 3" fill="none" stroke-width="1.8"/>',
    fork: '<path d="M23 5v25c0 7 4 11 9 11s9-4 9-11V5h-5.5v25c0 3-1.5 5-3.5 5s-3.5-2-3.5-5V5z"' + f(A) + '/>' +
      '<rect x="29.5" y="40" width="5" height="19" rx="2"' + f(A) + '/><rect x="25" y="8" width="2" height="18" rx="1"' + HL + '/>',
    xLogo: '<circle cx="32" cy="32" r="27"' + f(B) + '/><circle cx="32" cy="32" r="21"' + f(C) + '/>' +
      '<path d="M19 15h8.5l4.5 9 4.5-9H45l-8.5 17L45 49h-8.5L32 40l-4.5 9H19l8.5-17z"' + f(B) + '/>',
    dagger: '<path d="M32 3l6.5 31h-13z"' + f(A) + '/><path d="M32 7v24" fill="none" stroke-width="1.4"/>' +
      '<rect x="19" y="34" width="26" height="5" rx="2.5"' + f(B) + '/><rect x="29" y="39" width="6" height="15" rx="1"' + f(C) + '/><circle cx="32" cy="57" r="3.5"' + f(B) + '/>',
    wand: line('M14 58L42 22', B, 4) + '<path d="' + star(46, 17, 13, 5, 8) + '"' + f(A) + '/><circle cx="46" cy="17" r="4" fill="#fff" stroke="none"/>',
    witchHat: '<path d="M32 3c4 9 7 20 11 34H18c5-11 8-22 14-34z"' + f(A) + '/><path d="M32 3c-6 2-10 6-12 11" fill="none"/>' +
      '<ellipse cx="32" cy="44" rx="27" ry="8"' + f(A) + '/><path d="M19 37h26v5H19z"' + f(B) + '/><path d="' + star(32, 26, 4, 1.6, 4) + '"' + f(C) + '/>',
    trident: line('M32 10v50', B, 3.5) + line('M17 8v12c0 6 6 10 15 10s15-4 15-10V8', A, 3.5) +
      '<path d="M17 4l-3 6h6zM32 4l-3 6h6zM47 4l-3 6h6z"' + f(A) + '/>',
    banana: '<path d="M11 15c4 23 18 37 41 37 2 0 4-2 2-4-18-2-30-14-34-34-2-2-6-1-9 1z"' + f(A) + '/>' +
      '<path d="M11 15l-3-4 5-2 2 4z"' + f(B) + '/><path d="M18 20c4 12 12 21 24 25" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.5"/>',
    spray: '<rect x="20" y="18" width="24" height="41" rx="6"' + f(A) + '/><rect x="26" y="8" width="12" height="10" rx="2"' + f(B) + '/>' +
      '<path d="M38 11h8" fill="none"/><path d="M20 30h24v12H20z"' + f(C) + '/><circle cx="52" cy="8" r="2.5"' + f(C) + ' stroke="none"/><circle cx="57" cy="13" r="2"' + f(B) + ' stroke="none"/>' +
      '<rect x="23" y="21" width="5" height="34" rx="2.5"' + HL + '/>',
    bat: '<path d="M32 24c-3-6-8-8-14-8 2 4 2 8 0 10-4-2-10-2-14 2 6 2 10 8 12 14 2-4 6-6 10-4 0-4 3-8 6-8s6 4 6 8c4-2 8 0 10 4 2-6 6-12 12-14-4-4-10-4-14-2-2-2-2-6 0-10-6 0-11 2-14 8z"' + f(A) + '/>' +
      '<circle cx="29" cy="30" r="1.6"' + f(B) + ' stroke="none"/><circle cx="35" cy="30" r="1.6"' + f(B) + ' stroke="none"/>',
    web: '<circle cx="32" cy="32" r="27"' + f(C) + '/><g fill="none" stroke="' + B + '" stroke-width="1.6">' +
      '<path d="M32 6v52M6 32h52M14 14l36 36M50 14L14 50"/><path d="' + star(32, 32, 20, 18, 8) + '"/><path d="' + star(32, 32, 12, 10.5, 8) + '"/></g>' +
      '<circle cx="32" cy="32" r="4"' + f(A) + '/>',
    fang: line('M9 13c6 15 14 21 23 21s17-6 23-21', B, 2.5) +
      '<path d="M26 30c0 14 4 25 6 29 2-4 6-15 6-29z"' + f(A) + '/><circle cx="17" cy="25" r="3"' + f(C) + '/><circle cx="47" cy="25" r="3"' + f(C) + '/>',
    moon: '<path d="M40 5a27 27 0 1 0 15 42A22 22 0 1 1 40 5z"' + f(A) + '/><path d="M24 14c-5 4-8 10-8 16" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>' +
      '<path d="' + star(44, 30, 5, 2, 4) + '"' + f(B) + '/>',
    book: '<rect x="12" y="7" width="41" height="50" rx="4"' + f(A) + '/><rect x="12" y="7" width="8" height="50"' + f(C) + '/>' +
      '<circle cx="37" cy="30" r="10" fill="none" stroke="' + B + '" stroke-width="2.5"/><path d="' + star(37, 30, 7, 2.5, 6) + '"' + f(B) + ' stroke-width="1"/>' +
      '<path d="M24 50h24" fill="none" stroke="' + B + '" stroke-width="2"/>',
    bangle: line('M12 32a20 20 0 1 0 40 0a20 20 0 1 0-40 0', A, 7) +
      '<circle cx="32" cy="12" r="4.5"' + f(B) + '/><circle cx="14" cy="40" r="3.5"' + f(B) + '/><circle cx="50" cy="40" r="3.5"' + f(B) + '/>' +
      '<path d="M18 20c3-4 7-6 11-7" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>',
    gavel: '<g transform="rotate(-35 34 22)"><rect x="18" y="12" width="32" height="16" rx="4"' + f(A) + '/><rect x="14" y="14" width="6" height="12" rx="2"' + f(B) + '/>' +
      '<rect x="48" y="14" width="6" height="12" rx="2"' + f(B) + '/></g>' + line('M30 32L14 56', A, 4) + '<rect x="30" y="50" width="28" height="8" rx="2"' + f(B) + '/>',
    gem: '<path d="M18 11h28l11 15-25 31L7 26z"' + f(A) + '/><path d="M7 26h50M18 11l6 15 8 31 8-31 6-15" fill="none" stroke-width="1.6"/>' +
      '<path d="M19 14l-6 9h9z"' + HL + '/>',
    crystal: '<path d="M30 58L22 22l10-16 10 16-8 36z"' + f(A) + '/><path d="M24 58L10 32l4-12 10 8z"' + f(B) + '/><path d="M40 58l14-24-2-12-10 8z"' + f(B) + '/>' +
      '<path d="M32 6v52" fill="none" stroke-width="1.4"/><path d="M27 16l-3 6"' + HL + ' fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5"/>',
    gift: '<rect x="12" y="27" width="40" height="30" rx="3"' + f(A) + '/><rect x="8" y="18" width="48" height="11" rx="2"' + f(A) + '/>' +
      '<rect x="28" y="18" width="8" height="39"' + f(B) + '/><path d="M32 18c-4-10-14-12-14-6s8 6 14 6c6 0 14 0 14-6s-10-4-14 6z"' + f(B) + '/>',
    hand: '<path d="M22 58c-6-4-10-12-10-20V24c0-3 4-3 4 0v10h2V12c0-3 4-3 4 0v20h2V8c0-3 4-3 4 0v24h2V12c0-3 4-3 4 0v22h2V20c0-3 4-3 4 0v20c0 10-6 18-14 18z"' + f(A) + '/>',
    claws: '<path d="M18 52L23 5l5 47zM29 52L34 3l5 49zM40 52L47 7l2 45z"' + f(A) + '/><rect x="13" y="48" width="40" height="11" rx="5"' + f(B) + '/>' +
      '<path d="M24 12l-2 30"' + HL + ' fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.6"/>',
    coin: '<circle cx="32" cy="32" r="25"' + f(A) + '/><circle cx="32" cy="32" r="19" fill="none" stroke="' + B + '" stroke-width="2" stroke-dasharray="3 3"/>' +
      '<path d="M32 20c-4 4-10 5-14 4 2 4 6 6 10 6l-3 8 7-3 7 3-3-8c4 0 8-2 10-6-4 1-10 0-14-4z"' + f(B) + '/><path d="M18 18c3-4 8-6 13-7" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5"/>',
    cerebro: '<path d="M9 42c0-17 10-29 23-29s23 12 23 29z"' + f(A) + '/><path d="M9 42h46M15 28h34M32 13v29M20 18l6 24M44 18l-6 24" fill="none" stroke-width="1.6"/>' +
      '<circle cx="18" cy="35" r="2.5"' + f(B) + '/><circle cx="46" cy="35" r="2.5"' + f(B) + '/><circle cx="32" cy="22" r="2.5"' + f(B) + '/>' +
      '<path d="M16 42l-4 15M26 42l-2 15M38 42l2 15M48 42l4 15" fill="none" stroke="' + C + '" stroke-width="2.4"/>',
    syringe: '<g transform="rotate(45 32 32)"><rect x="26" y="12" width="12" height="34" rx="2"' + f(B) + '/><rect x="27.5" y="26" width="9" height="18"' + f(A) + ' stroke="none"/>' +
      '<rect x="22" y="9" width="20" height="4" rx="2"' + f(C) + '/><rect x="30" y="2" width="4" height="8"' + f(C) + '/><path d="M32 46v14" fill="none" stroke-width="1.6"/></g>',
    dpMask: '<path d="M32 6c14 0 22 10 22 24 0 16-10 28-22 28S10 46 10 30C10 16 18 6 32 6z"' + f(A) + '/>' +
      '<path d="M12 23c7-5 15-4 19 4l-2 11c-8 3-15-2-17-15zM52 23c-7-5-15-4-19 4l2 11c8 3 15-2 17-15z"' + f(C) + '/>' +
      '<path d="M18 29c3-1 6 0 8 3-3 1-6 0-8-3zM46 29c-3-1-6 0-8 3 3 1 6 0 8-3z"' + f(B) + '/>' +
      '<path d="M18 11c3-3 7-4 10-4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>',
    phoenix: '<path d="M32 56c-5-7-5-15-1-22-9 2-19-2-26-13 11 2 19 0 26 6 0-9 4-15 10-19-2 6-2 12 0 16 4-4 10-6 16-6-6 4-10 10-13 16 6 0 10 4 12 8-8-2-14 0-20 6 0 4 0 9-4 8z"' + f(A) + '/>' +
      '<path d="M32 40c4-6 9-10 15-12M30 34c-6-1-12-4-17-9" fill="none" stroke="' + B + '" stroke-width="2"/>',
    asterisk: '<g' + f(A) + '><rect x="26" y="5" width="12" height="54" rx="6"/><rect x="26" y="5" width="12" height="54" rx="6" transform="rotate(60 32 32)"/>' +
      '<rect x="26" y="5" width="12" height="54" rx="6" transform="rotate(-60 32 32)"/></g><circle cx="32" cy="32" r="6"' + f(B) + '/>',
    starH: '<rect x="5" y="5" width="54" height="54" rx="8"' + f(C) + '/><path d="' + star(32, 31, 21, 9, 5) + '"' + f(A) + '/>' +
      '<path d="' + star(32, 31, 21, 9, 5) + '" fill="none" stroke="' + B + '" stroke-width="2"/>',
    star8: '<circle cx="32" cy="32" r="27"' + f(A) + '/><path d="' + star(32, 32, 22, 9, 8) + '"' + f(B) + '/><circle cx="32" cy="32" r="6"' + f(C) + '/>',
    duck: '<circle cx="29" cy="28" r="19"' + f(A) + '/><path d="M40 33c8 0 17 2 19 7-4 5-15 4-21 0z"' + f(B) + '/>' +
      '<circle cx="34" cy="23" r="3.5" fill="#15121b" stroke="none"/><path d="M14 52c2-6 8-8 15-8s13 2 15 8" fill="' + C + '"/>' +
      '<path d="M50 40l9 5" fill="none" stroke="#7a4a22" stroke-width="3"/>',
    swirl: line('M32 8c14 0 24 10 22 22-2 10-12 14-20 10-6-3-6-11 0-12 4 0 4 6 0 5', A, 5) +
      '<circle cx="14" cy="22" r="3"' + f(A) + '/><circle cx="18" cy="46" r="2.5"' + f(B) + '/><circle cx="46" cy="54" r="2"' + f(A) + '/>',
    ddMask: '<path d="M18 17l-5-13 11 8zM46 17l5-13-11 8z"' + f(A) + '/>' +
      '<path d="M14 31C14 18 22 10 32 10s18 8 18 21v10c0 10-8 18-18 18s-18-8-18-18z"' + f(A) + '/>' +
      '<path d="M18 26h28v9c-6 4-22 4-28 0z"' + f(C) + '/><path d="M20 42c4 6 20 6 24 0v8c-4 5-20 5-24 0z"' + f(B) + '/><path d="M27 48h10" fill="none"/>',
    camera: '<rect x="6" y="18" width="52" height="36" rx="6"' + f(A) + '/><rect x="22" y="12" width="20" height="8" rx="2"' + f(A) + '/>' +
      '<circle cx="32" cy="36" r="12"' + f(C) + '/><circle cx="32" cy="36" r="6"' + f(B) + '/><rect x="46" y="23" width="7" height="5" rx="1"' + f(B) + '/>',
    spear: line('M10 58L46 16', B, 3.5) + '<path d="M42 20l14-15-4 19z"' + f(A) + '/><path d="M20 46l6 4M24 41l6 4" fill="none" stroke="' + C + '" stroke-width="3"/>',
    flame: '<path d="M32 5c4 10 15 15 15 29 0 11-7 19-15 19s-15-8-15-19c0-7 4-11 7-13 0 4 2 8 4 8 0-10 2-18 4-24z"' + f(A) + '/>' +
      '<path d="M32 30c3 5 7 7 7 13 0 5-3 8-7 8s-7-3-7-8c0-4 4-7 7-13z"' + f(B) + '/>',
    trophy: '<path d="M18 8h28v14c0 10-6 17-14 17s-14-7-14-17z"' + f(A) + '/><path d="M18 12H9c0 8 4 13 10 14M46 12h9c0 8-4 13-10 14" fill="none" stroke-width="3"/>' +
      '<rect x="28" y="38" width="8" height="10"' + f(A) + '/><rect x="18" y="48" width="28" height="9" rx="2"' + f(B) + '/><path d="M23 12v10"' + HL + ' fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>',
    gauntlet: ''   // posebno (vidi gauntletSvg)
  };

  // podrazumevane boje za svaku slicicu [a, b, c]
  var DEF = {
    hammer: ['#c9d0da', '#8a5a33', '#6b7480'], shield: ['#d8262f', '#eef1f5', '#2453b8'], arc: ['#5fe6ff', '#9aa6b8', '#2b3240'],
    arcTri: ['#5fe6ff', '#9aa6b8', '#2b3240'], helmet: ['#c8202b', '#f2c14e', '#111'], fist: ['#3fae4a', '#7a3fa0', '#111'],
    skull: ['#f2f2f2', '#111', '#15121b'], katana: ['#dfe5ec', '#c9a24a', '#2a2a33'], katanas: ['#dfe5ec', '#c9a24a', '#2a2a33'],
    cane: ['#c8202b', '#111', '#111'], sai: ['#dfe5ec', '#b0152a', '#111'], leaf: ['#4f8f3a', '#2e5a22', '#111'],
    four: ['#2b6fd6', '#f4f6fa', '#111'], chain: ['#b9c1cc', '#8a929e', '#ff7a1a'], surfboard: ['#dfe7f2', '#7fb0ff', '#111'],
    aLogo: ['#e8ecf2', '#111', '#1f2a44'], starPlate: ['#b9c2cc', '#d6202b', '#111'], cassette: ['#f08a2a', '#f6e7c8', '#2a2430'],
    player: ['#8a5a3a', '#e9d9c4', '#1c1a22'], robot: ['#b9c2cc', '#ff2a2a', '#2a2a33'], ant: ['#d0202b', '#b9c2cc', '#1c1d24'],
    atom: ['#7fd8ff', '#c46bff', '#ffd23f'], eye: ['#2fe07a', '#e2b33b', '#1b2a20'], eye2: ['#8a5bff', '#efeaff', '#120c2a'],
    groot: ['#8a5a33', '#c56a3a', '#4fae4a'], spider: ['#d6202b', '#f4f6fa', '#111'], symbiote: ['#16161c', '#f4f6fa', '#c8202b'],
    bolt: ['#ffd23f', '#fff', '#111'], panther: ['#1a1a22', '#b9c2cc', '#111'], axe: ['#c9d0da', '#8a5a33', '#7fd8ff'],
    pager: ['#3a3d46', '#5fd3c8', '#ffb02e'], glasses: ['#15151a', '#7fd8ff', '#111'], tv: ['#8a5a33', '#b9e6ff', '#2a2f3a'],
    wings: ['#b9c2cc', '#d6202b', '#111'], horns: ['#e2b33b', '#2e8a4a', '#1d3a26'], tree: ['#3fae5a', '#8a5a33', '#ffd23f'],
    hourglass: ['#e0162b', '#111', '#15151a'], rings: ['#3a8bff', '#7fd8ff', '#111'], triangle: ['#e2b33b', '#2a2a33', '#ff7a1a'],
    arrow: ['#6b3fd6', '#c9d0da', '#111'], eagle: ['#1f2a44', '#c9d0da', '#1f2a44'], hat: ['#2a2a33', '#c8202b', '#111'],
    mind: ['#ff8fb0', '#fff', '#111'], fork: ['#c9d0da', '#fff', '#111'], xLogo: ['#ffd23f', '#ffd23f', '#15151a'],
    dagger: ['#f4f6fa', '#c9d0da', '#2a2a33'], wand: ['#ffd23f', '#8a5a33', '#111'], witchHat: ['#5a2a8a', '#3fae5a', '#ffd23f'],
    trident: ['#e0162b', '#2a2a33', '#111'], banana: ['#ffd23f', '#5a3a1a', '#111'], spray: ['#e0162b', '#c9d0da', '#2fe0c8'],
    bat: ['#2a2430', '#ff2a2a', '#111'], web: ['#d6202b', '#f4f6fa', '#1a1a22'], fang: ['#f2ead8', '#8a5a33', '#e2b33b'],
    moon: ['#f4f6fa', '#c9d0da', '#111'], book: ['#2a1a22', '#e0162b', '#140d12'], bangle: ['#e2b33b', '#7fd8ff', '#111'],
    gavel: ['#8a5a33', '#5a3a1a', '#111'], gem: ['#e0162b', '#fff', '#111'], crystal: ['#8a5bff', '#5a3ad6', '#111'],
    gift: ['#3fae5a', '#e0162b', '#111'], hand: ['#c8202b', '#111', '#111'], claws: ['#dfe5ec', '#e8c39a', '#111'],
    coin: ['#c9d0da', '#8a929e', '#111'], cerebro: ['#c9d0da', '#5fe6ff', '#3a8bff'], syringe: ['#5fe6ff', '#e8f4ff', '#3a3d46'],
    dpMask: ['#c8202b', '#f4f6fa', '#15151a'], phoenix: ['#ff7a1a', '#ffd23f', '#111'], asterisk: ['#e8ecf2', '#15151a', '#111'],
    starH: ['#ff8fb0', '#e2b33b', '#2a2a33'], star8: ['#d6202b', '#ffd23f', '#2453b8'], duck: ['#f4f6fa', '#ff9a2e', '#3a6bd6'],
    swirl: ['#e0162b', '#ff7a7a', '#111'], ddMask: ['#a8121c', '#e8c39a', '#3a0a0e'], camera: ['#3a3d46', '#9fd3ff', '#15151a'],
    spear: ['#c9d0da', '#5a3a1a', '#7a3fd6'], flame: ['#ff6b1a', '#ffd23f', '#111'], trophy: ['#e2b33b', '#8a5a33', '#111']
  };

  /*  naslov -> [slicica, ime predmeta, boje (opciono: a, b, c)]  */
  var ITEMS = {
    'howard-the-duck': ['duck', 'Hauardova cigara'],
    'punisher-1989': ['skull', 'Lobanja (1989)', '#d8d8d8'],
    'captain-america-1990': ['shield', 'Stari štit', '#a8323a', '#d9d2c3', '#36507a'],
    'blade': ['katana', 'Bladeov mač'],
    'blade-2': ['glasses', 'Bladeove naočare', '#15151a', '#c8202b'],
    'daredevil-2003': ['cane', 'Štap (2003)'],
    'hulk-2003': ['fist', 'Hulkova pesnica', '#5a9a3a', '#5a5a8a'],
    'punisher-2004': ['skull', 'Lobanja (2004)'],
    'blade-trinity': ['katanas', 'Dva sečiva', '#dfe5ec', '#8a929e', '#2a2a33'],
    'elektra': ['sai', 'Elektrin sai'],
    'man-thing': ['leaf', 'Močvarni list'],
    'fantastic-four-2005': ['four', 'Znak četvorke (2005)'],
    'ghost-rider': ['skull', 'Plamena lobanja', '#ffb02e', '#111', '#c8202b'],
    'rise-of-the-silver-surfer': ['surfboard', 'Daska Srebrnog surfera'],
    'iron-man': ['arc', 'Ark reaktor'],
    'incredible-hulk': ['fist', 'Zelena pesnica', '#2f9a3a', '#5a3a8a'],
    'punisher-war-zone': ['skull', 'Lobanja ratne zone', '#e8e8e8', '#111', '#5a0a0e'],
    'iron-man-2': ['arcTri', 'Novi element'],
    'thor': ['hammer', 'Mjolnir'],
    'captain-america-first-avenger': ['shield', 'Štit Kapetana Amerike'],
    'ghost-rider-2': ['chain', 'Plameni lanac'],
    'avengers': ['aLogo', 'Avengers znak'],
    'iron-man-3': ['helmet', 'Mark 42 kaciga'],
    'agents-of-shield-s1': ['eagle', 'S.H.I.E.L.D. značka I'],
    'thor-dark-world': ['swirl', 'Eter'],
    'winter-soldier': ['starPlate', 'Bucky ruka'],
    'guardians': ['cassette', 'Awesome Mix Vol. 1'],
    'agents-of-shield-s2': ['eagle', 'S.H.I.E.L.D. značka II', '#2a1f3a', '#c9d0da', '#2a1f3a'],
    'agent-carter-s1': ['hat', 'Pegin šešir', '#2453b8', '#c8202b'],
    'age-of-ultron': ['robot', 'Ultronova glava'],
    'ant-man': ['ant', 'Ant-Man kaciga'],
    'fantastic-four-2015': ['four', 'Znak četvorke (2015)', '#3a3d46', '#9fd3ff'],
    'agents-of-shield-s3': ['eagle', 'S.H.I.E.L.D. značka III', '#3a1f1f', '#e2b33b', '#3a1f1f'],
    'agent-carter-s2': ['hat', 'Pegin šešir II', '#8a1a2a', '#111'],
    'civil-war': ['shield', 'Napukli štit', '#a8323a', '#c9ccd2', '#2a3f78'],
    'agents-of-shield-s4': ['eagle', 'S.H.I.E.L.D. značka IV', '#1a2a1f', '#c9d0da', '#1a2a1f'],
    'doctor-strange': ['eye', 'Agamotovo oko'],
    'legion-s1': ['mind', 'Legionov um'],
    'guardians-2': ['groot', 'Baby Groot'],
    'spider-man-homecoming': ['spider', 'Spidey maska (Homecoming)'],
    'inhumans': ['fork', 'Black Boltova viljuška'],
    'gifted-s1': ['xLogo', 'Mutantska značka', '#c9d0da', '#c9d0da', '#1a2a44'],
    'thor-ragnarok': ['bolt', 'Bog groma'],
    'runaways-s1': ['wand', 'Štap jednog'],
    'agents-of-shield-s5': ['eagle', 'S.H.I.E.L.D. značka V', '#1a1a2a', '#7fd8ff', '#1a1a2a'],
    'black-panther': ['panther', 'Maska Crnog Pantera'],
    'legion-s2': ['mind', 'Legionov um II', '#c46bff'],
    'infinity-war': ['axe', 'Stormbreaker'],
    'cloak-dagger-s1': ['dagger', 'Svetlosni bodež'],
    'ant-man-wasp': ['ant', 'Wasp kaciga', '#e2b33b', '#c9d0da'],
    'gifted-s2': ['xLogo', 'Mutantska značka II', '#ff7a1a', '#ff7a1a', '#1a1a22'],
    'runaways-s2': ['wand', 'Štap jednog II', '#c46bff'],
    'captain-marvel': ['pager', 'Fjurijev pejdžer'],
    'cloak-dagger-s2': ['dagger', 'Svetlosni bodež II', '#e8f4ff', '#7fd8ff'],
    'endgame': ['gauntlet', 'Nano Gauntlet'],
    'agents-of-shield-s6': ['eagle', 'S.H.I.E.L.D. značka VI', '#2a2a1a', '#e2b33b', '#2a2a1a'],
    'legion-s3': ['mind', 'Legionov um III', '#ffd23f'],
    'far-from-home': ['glasses', 'E.D.I.T.H.'],
    'runaways-s3': ['wand', 'Štap jednog III', '#7fd8ff'],
    'agents-of-shield-s7': ['eagle', 'S.H.I.E.L.D. značka VII', '#15151a', '#ffd23f', '#15151a'],
    'helstrom': ['trident', 'Helstromov trozubac'],
    'wandavision': ['tv', 'Vandin televizor'],
    'falcon-winter-soldier': ['wings', 'Falkonova krila'],
    'modok': ['robot', 'M.O.D.O.K. glava', '#e8c39a', '#ffd23f', '#3a2a5a'],
    'loki-s1': ['horns', 'Lokijeva kruna'],
    'black-widow': ['hourglass', 'Znak Crne Udovice'],
    'what-if-s1': ['eye2', 'Posmatračevo oko'],
    'shang-chi': ['rings', 'Deset prstenova'],
    'eternals': ['triangle', 'Nebeski znak'],
    'hit-monkey-s1': ['banana', 'Majmunova banana'],
    'daredevil-s1': ['ddMask', 'Daredevil kaciga'],
    'jessica-jones-s1': ['camera', 'Džesikin aparat'],
    'daredevil-s2': ['ddMask', 'Daredevil kaciga II', '#8a0f18'],
    'luke-cage-s1': ['fist', 'Neprobojna pesnica', '#3a2a1f', '#ffd23f'],
    'iron-fist-s1': ['fist', 'Gvozdena pesnica', '#ffd23f', '#3fae5a'],
    'defenders': ['cane', 'Defenders palica', '#5a2a8a'],
    'punisher-s1': ['skull', 'Frenkova lobanja'],
    'jessica-jones-s2': ['camera', 'Džesikin aparat II', '#5a2a3a'],
    'luke-cage-s2': ['fist', 'Neprobojna pesnica II', '#3a2a1f', '#ffb02e'],
    'iron-fist-s2': ['fist', 'Gvozdena pesnica II', '#ffd23f', '#2a6fd6'],
    'daredevil-s3': ['ddMask', 'Daredevil kaciga III', '#5a0a0e'],
    'punisher-s2': ['skull', 'Frenkova lobanja II', '#d8d8d8', '#111', '#3a0a0e'],
    'jessica-jones-s3': ['camera', 'Džesikin aparat III', '#2a3a5a'],
    'hawkeye': ['arrow', 'Hokajev luk'],
    'spider-man-2002': ['spider', 'Spidey maska (2002)'],
    'spider-man-2': ['spider', 'Spidey maska (2004)', '#c0182a'],
    'spider-man-3': ['symbiote', 'Crno odelo'],
    'amazing-spider-man': ['spider', 'Amazing maska', '#c8202b', '#ffd23f'],
    'amazing-spider-man-2': ['spider', 'Amazing maska II', '#d6202b', '#e8f4ff'],
    'venom': ['symbiote', 'Venom'],
    'into-the-spider-verse': ['spray', 'Majlsov sprej'],
    'venom-carnage': ['symbiote', 'Carnage', '#c8202b', '#f4f6fa', '#15151a'],
    'no-way-home': ['spider', 'Doktorova kocka', '#d6202b', '#ffd23f'],
    'morbius': ['bat', 'Morbijusov slepi miš'],
    'across-the-spider-verse': ['web', 'Spider-Verse mreža', '#2453b8', '#ff8fb0', '#15151a'],
    'madame-web': ['web', 'Madam Veb mreža'],
    'venom-last-dance': ['symbiote', 'Poslednji ples', '#16161c', '#ffd23f', '#c8202b'],
    'kraven': ['fang', 'Kravenov očnjak'],
    'moon-knight': ['moon', 'Mesečev polumesec'],
    'multiverse-of-madness': ['book', 'Darkhold'],
    'ms-marvel': ['bangle', 'Narukvica'],
    'love-and-thunder': ['bolt', 'Grom i ljubav', '#c46bff'],
    'i-am-groot-s1': ['groot', 'Mali Groot', '#7a4a2a', '#d07a3a'],
    'she-hulk': ['gavel', 'Advokatski čekić'],
    'werewolf-by-night': ['gem', 'Krvavi kamen'],
    'wakanda-forever': ['crystal', 'Vibranijum'],
    'gotg-holiday-special': ['gift', 'Novogodišnji poklon'],
    'quantumania': ['atom', 'Kvantni atom'],
    'guardians-3': ['player', 'Zune'],
    'secret-invasion': ['crystal', 'Skrul kristal', '#3fae5a', '#2a6a3a'],
    'i-am-groot-s2': ['groot', 'Mali Groot II', '#6a4a2a', '#c58a3a'],
    'loki-s2': ['tree', 'Drvo vremena'],
    'the-marvels': ['star8', 'Znak Marvelsa', '#2453b8', '#ffd23f', '#d6202b'],
    'what-if-s2': ['eye2', 'Posmatračevo oko II', '#3a8bff'],
    'echo': ['hand', 'Ehov otisak'],
    'x-men-tas': ['xLogo', 'X-Men značka (1992)'],
    'x-men-97-s1': ['xLogo', 'X-Men \'97 značka', '#ffd23f', '#ffd23f', '#2453b8'],
    'hit-monkey-s2': ['banana', 'Majmunova banana II', '#ffe36b'],
    'x-men-2000': ['xLogo', 'X-Men značka'],
    'x2': ['cerebro', 'Cerebro'],
    'x-men-last-stand': ['syringe', 'Lek'],
    'x-men-origins-wolverine': ['claws', 'Kandže'],
    'x-men-first-class': ['coin', 'Magnetov novčić'],
    'the-wolverine': ['katana', 'Japanski mač', '#dfe5ec', '#c8202b', '#15151a'],
    'days-of-future-past': ['cerebro', 'Cerebro iz budućnosti', '#8a929e', '#c46bff', '#6b3fd6'],
    'deadpool': ['dpMask', 'Dedpulova maska'],
    'x-men-apocalypse': ['triangle', 'Apokalipsova piramida', '#3a8bff', '#15151a', '#7fd8ff'],
    'logan': ['claws', 'Loganove kandže', '#c9ccd2', '#c8a07a'],
    'deadpool-2': ['dpMask', 'Dedpulova maska II', '#a8121c'],
    'dark-phoenix': ['phoenix', 'Feniks'],
    'new-mutants': ['xLogo', 'Novi mutanti', '#c46bff', '#c46bff', '#15151a'],
    'deadpool-wolverine': ['katanas', 'Dedpul & Vulverin', '#e8ecf2', '#ffd23f', '#c8202b'],
    'agatha-all-along': ['witchHat', 'Agatin šešir'],
    'what-if-s3': ['eye2', 'Posmatračevo oko III', '#ffd23f'],
    'friendly-spider-man-s1': ['spider', 'Komšijina maska', '#d6202b', '#ffe9a8'],
    'brave-new-world': ['shield', 'Samov štit', '#2453b8', '#eef1f5', '#d6202b'],
    'daredevil-born-again-s1': ['ddMask', 'Born Again kaciga'],
    'thunderbolts': ['asterisk', 'Zvezdica*'],
    'ironheart': ['arc', 'Ironheart reaktor', '#ff4b45', '#c9a24a'],
    'fantastic-four-first-steps': ['four', 'Znak četvorke', '#2b8bd6', '#f4f6fa'],
    'eyes-of-wakanda': ['spear', 'Vakandsko koplje'],
    'marvel-zombies': ['skull', 'Zombi lobanja', '#9adf6a', '#111', '#2a3a1a'],
    'wonder-man': ['starH', 'Holivudska zvezda'],
    'daredevil-born-again-s2': ['ddMask', 'Born Again kaciga II', '#7a0a12'],
    'punisher-one-last-kill': ['skull', 'Poslednja lobanja', '#c9ccd2', '#111', '#3a0a0e'],
    'spider-noir': ['hat', 'Noir šešir', '#15151a', '#3a3d46'],
    'x-men-97-s2': ['xLogo', 'X-Men \'97 značka II', '#ffd23f', '#ffd23f', '#c8202b'],
    'spider-man-brand-new-day': ['spider', 'Brand New Day maska', '#c8202b', '#f4f6fa'],
    'visionquest': ['gem', 'Vizijin dragulj', '#ffd23f'],
    'avengers-doomsday': ['doom', 'Doomova maska']
  };

  var LEGEND = { 'endgame': 1, 'avengers-doomsday': 1, 'infinity-war': 1, 'no-way-home': 1, 'deadpool-wolverine': 1, 'avengers': 1 };
  var RARITY = {
    legend: { name: 'Legendarno', c: '#ffb300' },
    epic: { name: 'Epsko', c: '#a855f7' },
    rare: { name: 'Retko', c: '#3b82f6' },
    common: { name: 'Obično', c: '#7b8494' }
  };
  function rarityOf(item) {
    if (LEGEND[item.id]) return 'legend';
    return item.doom === 'must' ? 'epic' : item.doom === 'good' ? 'rare' : 'common';
  }

  /* ---------------- kamenje i rukavica ---------------- */

  var STONES = [
    { id: 'space', short: 'Prostor', name: 'Kamen prostora', film: 'captain-america-first-avenger', c: '#3b8bff' },
    { id: 'mind', short: 'Um', name: 'Kamen uma', film: 'avengers', c: '#ffd23f' },
    { id: 'reality', short: 'Stvarnost', name: 'Kamen stvarnosti', film: 'thor-dark-world', c: '#ff2a3d' },
    { id: 'power', short: 'Moć', name: 'Kamen moći', film: 'guardians', c: '#b04bff' },
    { id: 'time', short: 'Vreme', name: 'Kamen vremena', film: 'doctor-strange', c: '#2fe07a' },
    { id: 'soul', short: 'Duša', name: 'Kamen duše', film: 'infinity-war', c: '#ff8c1a' }
  ];
  var FULL_FILM = 'endgame';   // rukavica stize tek sa Endgameom

  function doneMap(s) {
    var out = {};
    MM.Cat.all().forEach(function (i) { if (MM.Plan.isDone(i, s)) out[i.id] = true; });
    return out;
  }

  function gauntletState(done) {
    var full = !!done[FULL_FILM];
    var stones = {};
    STONES.forEach(function (st) { stones[st.id] = full || !!done[st.film]; });
    return { glove: full, full: full, stones: stones,
      n: STONES.filter(function (st) { return stones[st.id]; }).length };
  }

  // utori na oslikanoj rukavici (img/map/gauntlet.webp, viewBox 160x200) i sirina kamena u utoru
  var SOCKETS = { space: [55.9, 76.6], reality: [78.7, 72.1], power: [104.1, 75.2], mind: [125.5, 84.4], time: [87.9, 107.8], soul: [27.7, 111.7] };
  var SIZE = { space: 13, reality: 13, power: 13, mind: 12, time: 21, soul: 9 };
  // bez rukavice kamenje lebdi u krugu (pocinje gore, ide u krug)
  var FLOAT = {};
  ['space', 'mind', 'reality', 'power', 'time', 'soul'].forEach(function (id, i) {
    var a = -Math.PI / 2 + i * Math.PI / 3;
    FLOAT[id] = [Math.round(80 + Math.cos(a) * 54), Math.round(96 + Math.sin(a) * 54)];
  });

  /**
   * Rukavica (oslikana u Figmi) + kamenje. float = kamenje lebdi u krugu
   * (pre Endgamea rukavice nema, posle animacija skida float i kamenje uleti).
   */
  function gauntletSvg(gs, cls, float) {
    if (float == null) float = !gs.full;
    var out = '<svg class="gt ' + (cls || '') + (gs.full ? ' full' : '') + (float ? ' float' : '') + '" viewBox="0 0 160 200" aria-hidden="true">' +
      '<image class="gt-glove" href="' + IMG + 'gauntlet.webp" x="0" y="0" width="160" height="200"/>';
    // kamenje koje jos fali: bledi krugovi u praznom
    if (float) STONES.forEach(function (st) {
      if (gs.stones[st.id]) return;
      var f = FLOAT[st.id];
      out += '<circle class="gt-ghost" cx="' + f[0] + '" cy="' + f[1] + '" r="9" fill="none" stroke="' + st.c + '" stroke-opacity=".4" stroke-width="1.6" stroke-dasharray="2.5 3"/>';
    });
    STONES.forEach(function (st, i) {
      if (!gs.stones[st.id]) return;
      var p = SOCKETS[st.id], f = FLOAT[st.id], w = SIZE[st.id], h = w * 96 / 77, k = (18 / w).toFixed(2);
      out += '<g class="gt-st on" data-stone="' + st.id + '" style="--ft:translate(' + (f[0] - p[0]).toFixed(1) + 'px,' + (f[1] - p[1]).toFixed(1) + 'px) scale(' + k + ');transition-delay:' + (i * 0.18).toFixed(2) + 's">' +
        '<g class="gt-bob" style="animation-delay:-' + (i * 0.45).toFixed(2) + 's">' +
        '<circle class="gt-glow" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (w * 1.1).toFixed(1) + '" fill="' + st.c + '" opacity=".4"/>' +
        '<image href="' + IMG + 'stone-' + st.id + '.webp" x="' + (p[0] - w / 2).toFixed(1) + '" y="' + (p[1] - h / 2).toFixed(1) + '" width="' + w + '" height="' + h.toFixed(1) + '"/>' +
        '</g></g>';
    });
    return out + '</svg>';
  }

  function stoneSvg(st, size) {
    size = size || 40;
    return '<img class="stone" src="' + IMG + 'stone-' + st.id + '.webp" width="' + Math.round(size * 77 / 96) + '" height="' + size + '" alt="" draggable="false">';
  }

  /* ---------------- crtanje predmeta ---------------- */

  function spec(item) {
    var x = ITEMS[item.id] || ['star8', item.title];
    var d = DEF[x[0]] || ['#ccc', '#888', '#111'];
    return { icon: x[0], name: x[1], a: x[2] || d[0], b: x[3] || d[1], c: x[4] || d[2] };
  }

  function art(sp, size) {
    if (sp.icon === 'doom') return '<img class="bd-doom" src="img/map/doomhead.jpg" alt="" draggable="false">';
    if (sp.icon === 'gauntlet') return gauntletSvg({ glove: true, full: true, stones: { space: 1, mind: 1, reality: 1, power: 1, time: 1, soul: 1 } }, 'bd-gt');
    return '<svg class="bd-svg" viewBox="0 0 64 64" style="--a:' + sp.a + ';--b:' + sp.b + ';--c:' + sp.c + '" aria-hidden="true">' +
      '<g stroke="#15121b" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">' + ICONS[sp.icon] + '</g></svg>';
  }

  /** Plocica predmeta. opts: { locked, size: 'sm'|'md'|'lg', id } */
  function tile(item, opts) {
    opts = opts || {};
    var sp = spec(item), r = rarityOf(item);
    return '<span class="bd r-' + r + (opts.locked ? ' locked' : '') + ' bd-' + (opts.size || 'md') + '" data-icon="' + sp.icon + '">' +
      '<i class="bd-bg"></i>' + art(sp) + (opts.locked ? '<b class="bd-q">?</b>' : '') + '</span>';
  }

  /* ============================================================
     dostignuca
     ============================================================ */

  function filmsOf(fn) { return MM.Cat.all().filter(fn); }

  var ACH = [
    { id: 'first', name: 'Prvi korak', desc: 'Odgledaj prvi naslov', icon: 'star8', test: function (x) { return x.n >= 1; } },
    { id: 'n10', name: 'Maratonac', desc: '10 odgledanih naslova', icon: 'bolt', test: function (x) { return x.n >= 10; } },
    { id: 'n25', name: 'Ozbiljan maratonac', desc: '25 naslova', icon: 'bolt', col: ['#7fd8ff'], test: function (x) { return x.n >= 25; } },
    { id: 'n50', name: 'Neumoran', desc: '50 naslova', icon: 'bolt', col: ['#c46bff'], test: function (x) { return x.n >= 50; } },
    { id: 'n100', name: 'Živi u MCU', desc: '100 naslova', icon: 'trophy', test: function (x) { return x.n >= 100; } },
    { id: 'st3', name: 'Zagrejan', desc: '3 dana zaredom', icon: 'flame', test: function (x) { return x.best >= 3; } },
    { id: 'st7', name: 'Nedelja vatre', desc: '7 dana zaredom', icon: 'flame', col: ['#4cc3ff', '#e8f6ff'], test: function (x) { return x.best >= 7; } },
    { id: 'st14', name: 'Dve nedelje', desc: '14 dana zaredom', icon: 'flame', col: ['#9b6bff', '#f0e6ff'], test: function (x) { return x.best >= 14; } },
    { id: 'st30', name: 'Mesec bez pauze', desc: '30 dana zaredom', icon: 'flame', col: ['#ffd75a', '#fff'], test: function (x) { return x.best >= 30; } },
    { id: 'owl', name: 'Noćna ptica', desc: 'Gledao posle ponoći', icon: 'moon', test: function (x) { return x.owl; } },
    { id: 'bigday', name: 'Maraton dan', desc: '5+ sati u jednom danu', icon: 'tv', test: function (x) { return x.bigDay; } },
    { id: 'ahead', name: 'Ispred Dooma', desc: 'Stigni Dooma na putu', icon: 'doom', test: function (x) { return x.ahead; } },
    { id: 'saga', name: 'Infinity Saga', desc: 'Svi MCU filmovi do Endgamea', icon: 'gauntlet', test: function (x) { return x.saga; } },
    { id: 'xmen', name: 'Svi X-Meni', desc: 'Svi Fox X-Men filmovi', icon: 'xLogo', test: function (x) { return x.xmen; } },
    { id: 'netflix', name: 'Defenders', desc: 'Sve Netflix Marvel serije', icon: 'cane', test: function (x) { return x.netflix; } },
    { id: 'spidey', name: 'Svaki Spider-Man', desc: 'Svi Spider-Man filmovi', icon: 'spider', test: function (x) { return x.spidey; } },
    { id: 'critic', name: 'Kritičar', desc: 'Oceni 10 naslova', icon: 'gavel', test: function (x) { return x.reviews >= 10; } },
    { id: 'doomsday', name: 'Doomsday', desc: 'Odgledaj Avengers: Doomsday', icon: 'doom', test: function (x) { return x.done['avengers-doomsday']; } }
  ];

  function facts(s, prog, streak) {
    var done = doneMap(s);
    var all = function (list) { return list.length > 0 && list.every(function (i) { return done[i.id]; }); };
    var owl = false, perDay = {};
    Object.keys(s.log || {}).forEach(function (k) {
      var r = s.log[k];
      if (r && r.t) { var h = new Date(r.t).getHours(); if (h < 5) owl = true; }
      var u = MM.Plan.unitFromKey(k);
      if (r && r.d && u) perDay[r.d] = (perDay[r.d] || 0) + (u.min || 0);
    });
    var me = MM.Store.uid && MM.Store.uid();
    return {
      done: done, n: Object.keys(done).length, best: Math.max(streak.best || 0, streak.n || 0), owl: owl,
      bigDay: Object.keys(perDay).some(function (d) { return perDay[d] >= 300; }),
      ahead: Object.keys(done).length >= 3 && prog.ratio >= MM.Plan.timeRatio(),
      saga: all(filmsOf(function (i) { return i.col === 'mcu' && i.type === 'film' && i.date <= '2019-04-26'; })),
      xmen: all(filmsOf(function (i) { return i.col === 'xmen' && i.type === 'film'; })),
      netflix: all(filmsOf(function (i) { return i.col === 'netflix'; })),
      spidey: all(filmsOf(function (i) { return i.type === 'film' && /spider-man|spider-verse|homecoming|far-from-home|no-way-home/.test(i.id + ' ' + i.title.toLowerCase()); })),
      reviews: me ? MM.Reviews.cached().filter(function (r) { return r.uid === me; }).length : 0
    };
  }

  /** Proveri dostignuca. Vraca nova (i upise ih u s.ach). silent = bez slavlja (prvo pokretanje). */
  function checkAch(s, prog, streak) {
    var x = facts(s, prog, streak);
    var have = s.ach || {};
    var fresh = ACH.filter(function (a) { return !have[a.id] && a.test(x); });
    if (fresh.length || !s.ach) {
      var now = Date.now();
      MM.Store.mutate(function (st) {
        st.ach = st.ach || {};
        fresh.forEach(function (a) { st.ach[a.id] = now; });
      });
    }
    return s.ach ? fresh : [];
  }

  function achTile(a, on) {
    var sp = a.icon === 'gauntlet' || a.icon === 'doom' ? { icon: a.icon } :
      { icon: a.icon, a: (a.col && a.col[0]) || DEF[a.icon][0], b: (a.col && a.col[1]) || DEF[a.icon][1], c: DEF[a.icon][2] };
    return '<span class="bd ach r-' + (on ? 'legend' : 'common') + (on ? '' : ' locked') + ' bd-sm" data-icon="' + a.icon + '"><i class="bd-bg"></i>' + art(sp) + '</span>';
  }

  /* ============================================================
     kolekcija (list) i detalj predmeta
     ============================================================ */

  function collectionSheet(ctx) {
    var s = ctx.s, done = doneMap(s), gs = gauntletState(done);
    var all = MM.Cat.all();
    var have = all.filter(function (i) { return done[i.id]; }).length;
    var out = '<div class="pad-sheet col-sheet">' +
      '<div class="col-h"><h2>Kolekcija</h2><span class="muted"><b>' + have + '</b> / ' + all.length + ' predmeta</span></div>';

    // rukavica
    out += '<section class="gt-card" data-a="bd-gauntlet">' + gauntletSvg(gs, 'gt-big') +
      '<div class="gt-info"><em>' + (gs.full ? 'INFINITY GAUNTLET' : 'KAMENJE BESKONAČNOSTI') + '</em>' +
      '<b>' + (gs.full ? 'Kompletna' : gs.n + ' / 6 kamenja') + '</b>' +
      '<span>' + (gs.full ? 'Infinity Saga je gotova. Tapni i pucni prstima.'
        : gs.n === 6 ? 'Sve kamenje je tu. Endgame donosi rukavicu.'
        : 'Kamenje stiže iz filmova i lebdi dok ne odgledaš Endgame. Tad dobijaš rukavicu.') + '</span>' +
      '<div class="gt-stones">' + STONES.map(function (st) {
        return '<span class="gt-s' + (gs.stones[st.id] ? ' on' : '') + '">' + stoneSvg(st, 26) + '<i>' + esc(st.short) + '</i></span>';
      }).join('') + '</div></div></section>';

    // dostignuca
    var got = s.ach || {};
    out += '<h3>Dostignuća · ' + ACH.filter(function (a) { return got[a.id]; }).length + ' / ' + ACH.length + '</h3><div class="ach-row no-drag">' +
      ACH.map(function (a) {
        return '<button type="button" class="ach-b' + (got[a.id] ? ' on' : '') + '" data-a="bd-ach" data-id="' + a.id + '">' + achTile(a, !!got[a.id]) +
          '<b>' + esc(a.name) + '</b><i>' + esc(a.desc) + '</i></button>';
      }).join('') + '</div>';

    // predmeti po kolekcijama
    MM.Cat.COLS.forEach(function (c) {
      var list = MM.Cat.sorted(s, all.filter(function (i) { return i.col === c.id; }));
      if (!list.length) return;
      var n = list.filter(function (i) { return done[i.id]; }).length;
      out += '<h3>' + esc(c.full || c.name) + ' · ' + n + ' / ' + list.length + '</h3><div class="bd-grid">';
      list.forEach(function (i) {
        var on = !!done[i.id];
        out += '<button type="button" class="bd-cell" data-a="bd-open" data-id="' + esc(i.id) + '">' + tile(i, { locked: !on }) +
          '<i>' + esc(on ? spec(i).name : MM.Cat.cleanTitle(i)) + '</i></button>';
      });
      out += '</div>';
    });
    return out + '</div>';
  }

  function itemSheet(id, ctx) {
    var it = MM.Cat.get(id);
    if (!it) return '';
    var s = ctx.s, on = MM.Plan.isDone(it, s), sp = spec(it), r = rarityOf(it);
    var st = STONES.filter(function (x) { return x.film === id; })[0];
    var when = '';
    if (on) {
      var d = '';
      Object.keys(s.log || {}).forEach(function (k) { if (k.split('#')[0] === id && s.log[k].d > d) d = s.log[k].d; });
      if (d) when = 'Dobijeno ' + UI.dateLabel(d, { plain: true });
    }
    return '<div class="bdm" data-id="' + esc(id) + '">' +
      '<div class="bdm-rays r-' + r + '"></div>' +
      '<button type="button" class="bdm-art" data-a="bd-poke">' + tile(it, { locked: !on, size: 'xl' }) + '</button>' +
      '<div class="bdm-r r-' + r + '">' + RARITY[r].name.toUpperCase() + '</div>' +
      '<h2>' + esc(on ? sp.name : '???') + '</h2>' +
      '<p class="muted">' + esc(MM.Cat.cleanTitle(it)) + ' · ' + it.year + '</p>' +
      (on ? (when ? '<p class="muted small">' + esc(when) + '</p>' : '') + '<p class="bdm-hint">tapni predmet</p>'
        : '<p class="muted small">Odgledaj ' + esc(MM.Cat.cleanTitle(it)) + ' i predmet je tvoj.</p>') +
      (st ? '<div class="bdm-stone' + (on ? ' on' : '') + '">' + stoneSvg(st, 30) + '<span>' + (on ? 'Doneo ti je i ' : 'Donosi i ') + '<b>' + esc(st.name) + '</b></span></div>' : '') +
      (id === FULL_FILM ? '<div class="bdm-stone' + (on ? ' on' : '') + '"><span>' + (on ? 'Doneo ti je ' : 'Donosi ') + '<b>Infinity Gauntlet</b></span></div>' : '') +
      '</div>';
  }

  /** Tap na predmet: svaki radi nesto svoje. */
  var POKE = { hammer: 'zap', bolt: 'zap', axe: 'zap', shield: 'spin', four: 'spin', star8: 'spin', rings: 'spin', asterisk: 'spin', coin: 'spin',
    arc: 'pulse', arcTri: 'pulse', eye: 'pulse', eye2: 'pulse', gem: 'pulse', crystal: 'pulse', mind: 'pulse', cerebro: 'pulse',
    gauntlet: 'snap', doom: 'zap', skull: 'shake', cassette: 'bounce', player: 'bounce', groot: 'bounce', tv: 'bounce', spider: 'bounce' };

  function poke(el) {
    var b = el.querySelector('.bd') || el.querySelector('.gt') || el;
    var kind;
    if (b.classList.contains('gt')) kind = b.classList.contains('full') ? 'snap' : 'shake';
    else kind = b.classList.contains('locked') ? 'shake' : POKE[b.getAttribute('data-icon')] || 'shake';
    b.classList.remove('p-zap', 'p-spin', 'p-pulse', 'p-snap', 'p-shake', 'p-bounce');
    void b.getBoundingClientRect();
    b.classList.add('p-' + kind);
    UI.buzz(kind === 'snap' ? [20, 60, 40] : kind === 'zap' ? [12, 30, 12] : 10);
    if (kind === 'snap') snapFx();
  }

  /** Pucanj prstima: bljesak + prasina. */
  function snapFx() {
    var fx = document.createElement('div');
    fx.className = 'snap-fx';
    var dust = '';
    for (var i = 0; i < 26; i++) {
      dust += '<i style="left:' + (20 + Math.random() * 60).toFixed(1) + '%;top:' + (30 + Math.random() * 40).toFixed(1) + '%;' +
        'animation-delay:' + (0.2 + Math.random() * 0.6).toFixed(2) + 's;--dx:' + (40 + Math.random() * 120).toFixed(0) + 'px;--dy:' + (-60 - Math.random() * 100).toFixed(0) + 'px"></i>';
    }
    fx.innerHTML = '<b></b>' + dust;
    document.body.appendChild(fx);
    setTimeout(function () { fx.remove(); }, 2400);
  }

  /* ============================================================
     slavlje posle "Odgledano"
     ============================================================ */

  var queue = null;   // { items, ach, stones, full, from, to, time, phase }

  /** before/after: mape zavrsenih naslova. */
  function gains(before, after) {
    return MM.Cat.all().filter(function (i) { return after[i.id] && !before[i.id]; });
  }

  function celebrateSheet(ctx) {
    var q = queue;
    if (!q) return '';
    var time = q.time, me = q.me;
    function pos(r) { return (Math.max(0, Math.min(1, r)) * 100).toFixed(1) + '%'; }
    var main = q.items[0];
    var r = main ? rarityOf(main) : 'common';
    var out = '<div class="cel r-' + r + (q.phase === 'snap' ? ' snapped' : '') + '">';

    // put: pomeras se
    out += '<div class="cel-road"><div class="rm-track"><i class="rm-done" style="width:' + pos(time) + '"></i>' +
      '<span class="rm-doom" style="left:' + pos(time) + '">' + MM.Doom.head(30) + '</span>' +
      '<span class="rm-p me cel-me' + (q.to >= time ? ' ahead' : '') + '" style="left:' + pos(q.from) + '" data-to="' + pos(q.to) + '">' +
        (me.photo ? '<img class="av rm-av" src="' + esc(me.photo) + '" alt="">' : '<span class="av rm-av">' + esc((me.name || '?').slice(0, 1).toUpperCase()) + '</span>') + '</span>' +
      '</div><div class="cel-say"><b>' + MM.Doom.head(22) + '</b><span>' + esc(q.line) + '</span></div></div>';

    // glavni predmet
    var achMain = !q.items.length && !q.full && q.ach.length ? q.ach.shift() : null;
    if (achMain) {
      out += '<div class="cel-main"><div class="cel-rays r-legend"></div><div class="cel-k">NOVO DOSTIGNUĆE</div>' +
        '<button type="button" class="cel-art" data-a="bd-poke">' + achTile(achMain, true).replace('bd-sm', 'bd-xl') + '</button>' +
        '<h2>' + esc(achMain.name) + '</h2><p class="muted">' + esc(achMain.desc) + '</p></div>';
    } else if (q.items.length === 1 || q.full) {
      var big = q.full ? MM.Cat.get(FULL_FILM) : main;
      out += '<div class="cel-main' + (q.full ? ' is-full' : '') + '"><div class="cel-rays r-' + rarityOf(big) + '"></div>' +
        '<div class="cel-k">' + (q.full ? 'INFINITY GAUNTLET' : 'NOVI PREDMET') + '</div>' +
        '<button type="button" class="cel-art" data-a="bd-poke">' + (q.full ? gauntletSvg(gauntletState({ endgame: 1 }), 'gt-cel', q.phase === 'float') : tile(big, { size: 'xl' })) + '</button>' +
        '<div class="bdm-r r-' + rarityOf(big) + '">' + RARITY[rarityOf(big)].name.toUpperCase() + '</div>' +
        '<h2 class="cel-h">' + esc(q.full ? (q.phase === 'snap' ? 'Infinity Saga je gotova.' : 'Kamenje ide u rukavicu…') : spec(big).name) + '</h2>' +
        '<p class="muted">' + esc(MM.Cat.cleanTitle(big)) + '</p></div>';
    } else {
      out += '<div class="cel-main"><div class="cel-rays r-epic"></div><div class="cel-k">+' + q.items.length + ' PREDMETA</div><div class="cel-grid">' +
        q.items.slice(0, 8).map(function (i) { return tile(i, { size: 'md' }); }).join('') + '</div>' +
        (q.items.length > 8 ? '<p class="muted">i još ' + (q.items.length - 8) + '</p>' : '') + '</div>';
    }

    // dodatno: kamenje, rukavica, dostignuca
    var extra = '';
    q.stones.forEach(function (st) {
      if (q.full) return;
      extra += '<div class="cel-x st">' + stoneSvg(st, 36) + '<span><b>' + esc(st.name) + '</b><i>ide u rukavicu</i></span></div>';
    });
    q.ach.forEach(function (a) {
      extra += '<div class="cel-x ac">' + achTile(a, true) + '<span><b>' + esc(a.name) + '</b><i>' + esc(a.desc) + '</i></span></div>';
    });
    if (extra) out += '<div class="cel-extra">' + extra + '</div>';

    out += '<button type="button" class="btn primary wide cel-ok" data-a="sheet-close">Idemo dalje</button></div>';
    return out;
  }

  /**
   * Pokreni slavlje. info: { before, after (mape zavrsenih), from, to (odnos plana), time, me, onClose }
   * Vraca true ako je bilo sta za slavlje.
   */
  function celebrate(info) {
    var items = gains(info.before, info.after);
    var ach = info.ach || [];
    if (!items.length && !ach.length) return false;
    var g0 = gauntletState(info.before), g1 = gauntletState(info.after);
    var stones = STONES.filter(function (st) { return g1.stones[st.id] && !g0.stones[st.id]; });
    var me = info.me || {};
    queue = { items: items, ach: ach, stones: stones, full: g1.full && !g0.full, after: info.after,
      from: info.from, to: info.to, time: info.time, me: me, phase: 'float',
      line: MM.Doom.line ? MM.Doom.line(info.to, info.time) : 'Doom te vidi.' };
    UI.openSheet({
      id: 'celebrate', full: true, cls: 'cel-sheet',
      render: function () { return celebrateSheet(); },
      onOpen: function (el) {
        var p = el.querySelector('.cel-me');
        if (p) setTimeout(function () { p.style.left = p.getAttribute('data-to'); }, 350);
        UI.buzz([16, 50, 24]);
        if (queue && queue.full) {
          // kamenje uleti u utore, pa pucanj prstima i sve se raspadne u prah
          var mine = queue;
          setTimeout(function () { if (queue !== mine) return; mine.phase = 'in'; UI.refreshSheets(); UI.buzz(10); }, 1500);
          setTimeout(function () {
            if (queue !== mine) return;
            mine.phase = 'snap'; UI.refreshSheets();
            var a = el.querySelector('.cel-art'); if (a) poke(a);
          }, 3300);
        }
      },
      onClose: function () { queue = null; if (info.onClose) info.onClose(); }
    });
    return true;
  }

  MM.Badges = {
    ITEMS: ITEMS, STONES: STONES, ACH: ACH, RARITY: RARITY,
    spec: spec, tile: tile, rarityOf: rarityOf, doneMap: doneMap, gauntletState: gauntletState, gauntletSvg: gauntletSvg, stoneSvg: stoneSvg,
    checkAch: checkAch, collectionSheet: collectionSheet, itemSheet: itemSheet, poke: poke, celebrate: celebrate,
    busy: function () { return !!queue; }
  };
})();
