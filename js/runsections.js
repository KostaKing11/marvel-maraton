/* ============================================================
   runsections.js  -  deonice staze za Marvel Runner
   ------------------------------------------------------------
   Staza se ne pravi nasumicno, nego se slazu rucno napravljene
   deonice (kao u Subway Surfersu). Pravila su u docs/runner-deonice.md.

   Zapis deonice:
     { id, ime, nivo (0-3), duz (m), redovi: [[d, 'LEVA SREDINA DESNA'], ...] }
   d = metri od pocetka deonice. Tri oznake razdvojene razmakom:
     .      nista
     c      red novcica (6), cN = N novcica
     C      luk novcica (za skok preko barijere)
     T24    voz koji stoji, duzine 24 m
     R24    rampa (7 m) pa voz od 24 m - penjes se na krov
     M20    voz koji ide ka tebi (stigne do reda d kad i ti)
     L      niska barijera - skoci
     H      visoka kapija - provuci se (klizanje)
     X      zid - mora druga traka
     p      moc (magnet, let, x2, skok, stit)
     k      board token (15 = hoverboard)

   validate(deonica) proverava da iz SVAKE trake na pocetku postoji
   prolaz do kraja (pomeranje za traku traje 5 m, na krov se ide
   samo rampom, sa krova mozes na susedni krov ili dole).
   ============================================================ */
(function (root) {
  'use strict';

  var S = [
    /* ---------- nivo 0: zagrevanje ---------- */
    { id: 'novcici', ime: 'Novčići', nivo: 0, duz: 50, redovi: [[8, '. c .'], [30, 'c . c']] },
    { id: 'barijera', ime: 'Barijera', nivo: 0, duz: 40, redovi: [[12, '. L .'], [12, '. C .'], [12, 'c . c']] },
    { id: 'kapije', ime: 'Kapije', nivo: 0, duz: 45, redovi: [[12, 'H . H'], [12, '. c .'], [30, '. H .']] },
    { id: 'voz-levo', ime: 'Voz levo', nivo: 0, duz: 45, redovi: [[10, 'T24 c .']] },
    { id: 'dva-voza', ime: 'Dva voza', nivo: 0, duz: 50, redovi: [[12, 'T28 c T28']] },
    { id: 'rampa', ime: 'Rampa', nivo: 0, duz: 50, redovi: [[12, '. R24 .'], [12, 'c . c']] },
    { id: 'skok-klizanje', ime: 'Skok i klizanje', nivo: 0, duz: 45, redovi: [[12, 'L L .'], [12, 'C C c'], [30, '. H H']] },
    /* ---------- nivo 1 ---------- */
    { id: 'cik-cak', ime: 'Cik-cak', nivo: 1, duz: 62, redovi: [[12, 'X . X'], [12, '. c .'], [32, '. X .'], [32, 'c . c'], [52, 'X . X']] },
    { id: 'zid-vozova', ime: 'Zid od vozova', nivo: 1, duz: 56, redovi: [[16, 'T28 R28 T28']] },
    { id: 'u-susret', ime: 'Voz u susret', nivo: 1, duz: 50, redovi: [[14, 'M20 c .'], [30, '. . L']] },
    { id: 'tunel', ime: 'Tunel', nivo: 1, duz: 56, redovi: [[12, 'T36 . T36'], [22, '. L .'], [22, '. C .'], [36, '. H .']] },
    { id: 'kapija-voz', ime: 'Kapija i voz', nivo: 1, duz: 62, redovi: [[12, 'T24 H .'], [36, '. L T20'], [36, '. C .']] },
    { id: 'krovovi', ime: 'Po krovovima', nivo: 1, duz: 72, redovi: [[12, 'R24 T32 .'], [46, '. . T20'], [46, 'c . .']] },
    /* ---------- nivo 2 ---------- */
    { id: 'pokretni-par', ime: 'Pokretni par', nivo: 2, duz: 56, redovi: [[16, 'M24 c M24']] },
    { id: 'stepenice', ime: 'Stepenice', nivo: 2, duz: 76, redovi: [[12, 'R24 X T24'], [46, 'T20 . X'], [46, '. c .']] },
    { id: 'haos', ime: 'Haos', nivo: 2, duz: 76, redovi: [[12, 'T28 M20 .'], [42, 'X . T24'], [62, '. H .'], [62, 'c . .']] },
    { id: 'dupli-tunel', ime: 'Dugi tunel', nivo: 2, duz: 70, redovi: [[10, 'T40 . T40'], [20, '. L .'], [32, '. H .'], [44, '. L .'], [44, '. C .']] },
    /* ---------- nivo 3 ---------- */
    { id: 'ludnica', ime: 'Ludnica', nivo: 3, duz: 72, redovi: [[16, 'M24 R28 M24']] },
    { id: 'slalom', ime: 'Slalom', nivo: 3, duz: 82, redovi: [[10, 'X . X'], [26, '. X .'], [42, 'X . X'], [58, '. X .'], [74, 'X . X']] },
    { id: 'zamka', ime: 'Zamka', nivo: 3, duz: 70, redovi: [[12, 'T32 L T32'], [26, '. H .'], [46, 'X . M20']] }
  ];

  /* Tutorijal: prva trka. tip = sta treba da uradis (igra stane dok to ne uradis). */
  var TUT = { id: 'tutorijal', ime: 'Tutorijal', nivo: 0, duz: 230, redovi: [
    [26, '. X .'], [44, 'L L L'], [64, 'H H H'], [92, 'R28 R28 R28'],
    [160, 'k k k'], [171, 'k k k'], [182, 'k k k'], [193, 'k k k'], [204, 'k k k']
  ], tips: [
    { d: 26, need: 'side', t: 'Prevuci levo ili desno' },
    { d: 44, need: 'up', t: 'Prevuci gore — skok' },
    { d: 64, need: 'down', t: 'Prevuci dole — klizanje' },
    { d: 92, need: 'none', t: 'Rampa vodi na krov voza!' },
    { d: 152, need: 'none', t: 'Skupi 15 plavih tokena za hoverboard' }
  ] };

  /** Tokene pretvara u objekte: [{ lane, d, t: 'T'|'R'|'M'|'L'|'H'|'X'|'c'|'C'|'p'|'k', len, n }] */
  function parse(sec) {
    var out = [];
    sec.redovi.forEach(function (r) {
      r[1].split(/\s+/).forEach(function (tok, lane) {
        if (!tok || tok === '.') return;
        var t = tok[0], num = parseInt(tok.slice(1), 10);
        out.push({ lane: lane, d: r[0], t: t, len: t === 'T' || t === 'R' || t === 'M' ? num : 0, n: t === 'c' ? (num || 6) : 0 });
      });
    });
    return out;
  }
  /** Ogledalo: leva i desna traka zamene mesta. */
  function mirror(sec) {
    return Object.assign({}, sec, { redovi: sec.redovi.map(function (r) { return [r[0], r[1].split(/\s+/).reverse().join(' ')]; }) });
  }

  /** Provera prolaza. Vraca { ok, bad: [traka sa koje nema prolaza] }. */
  function validate(sec, SW) {
    SW = SW || 5;
    var objs = parse(sec), L = sec.duz + 2;
    var ground = [[], [], []], roof = [[], [], []];
    for (var l = 0; l < 3; l++) for (var m = 0; m <= L; m++) { ground[l][m] = true; roof[l][m] = false; }
    objs.forEach(function (o) {
      var a, b, m;
      if (o.t === 'T' || o.t === 'M') { a = o.d; b = o.d + o.len; for (m = a; m <= b && m <= L; m++) ground[o.lane][m] = false; for (m = a; m <= b && m <= L; m++) roof[o.lane][m] = 'hop'; }
      if (o.t === 'R') { a = o.d + 7; b = a + o.len; for (m = a; m <= b && m <= L; m++) { ground[o.lane][m] = 'ramp'; roof[o.lane][m] = true; } }
      if (o.t === 'X') { for (m = Math.max(0, o.d - 1); m <= o.d + 1; m++) ground[o.lane][m] = false; }
    });
    // stanje: [traka][0 zemlja, 1 krov]; prolaz po metrima
    function okAt(l, lv, m) { return lv ? !!roof[l][m] : ground[l][m] !== false; }
    var bad = [];
    for (var s0 = 0; s0 < 3; s0++) {
      var reach = [];                       // reach[m] = [[z,k],[z,k],[z,k]]
      for (var i = 0; i <= L; i++) reach[i] = [[0, 0], [0, 0], [0, 0]];
      reach[0][s0][0] = 1;
      for (var m2 = 0; m2 < L; m2++) {
        for (var l2 = 0; l2 < 3; l2++) for (var lv = 0; lv < 2; lv++) {
          if (!reach[m2][l2][lv]) continue;
          // pravo: rampa te digne na krov, kad krov prestane padnes dole
          var nlv = lv;
          if (!lv && ground[l2][m2 + 1] === 'ramp') nlv = 1;
          if (lv && !roof[l2][m2 + 1]) nlv = 0;
          if (okAt(l2, nlv, m2 + 1)) reach[m2 + 1][l2][nlv] = 1;
          // u susednu traku: traje SW metara, obe trake moraju biti slobodne
          for (var dl = -1; dl <= 1; dl += 2) {
            var t = l2 + dl; if (t < 0 || t > 2 || m2 + SW > L) continue;
            for (var tl = 0; tl < 2; tl++) {
              if (tl && !lv) continue;               // sa zemlje nema skoka na krov
              var ok = true;
              for (var q = m2; q <= m2 + SW && ok; q++) {
                if (!okAt(t, tl, q)) ok = false;
                var here = lv && roof[l2][q] ? 1 : 0;
                if (!okAt(l2, here, q)) ok = false;
              }
              if (ok) reach[m2 + SW][t][tl] = 1;
            }
          }
        }
      }
      if (!reach[L].some(function (r) { return r[0] || r[1]; })) bad.push(s0);
    }
    return { ok: !bad.length, bad: bad };
  }

  var api = { SECTIONS: S, TUT: TUT, parse: parse, mirror: mirror, validate: validate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.MM = root.MM || {}; root.MM.RunSections = api; }
})(this);
