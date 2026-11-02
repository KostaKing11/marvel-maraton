/* ============================================================
   runner.js  -  Marvel Runner: meniji, kolekcija, pass, misije
   ------------------------------------------------------------
   Igra (3D) je u run3d.js, junaci u heroes3d.js, deonice u
   runsections.js. Three.js + model se ucitavaju tek kad otvoris
   Runner (js/vendor, models/hero.glb).

   Kao u Subway Surfers City:
     - junaci i boardovi imaju nivo (1-10) i mnozilac poena (×)
     - nivo se dize za novcice + tokene (crveni = junaci, plavi = boardovi)
     - svaki podignut nivo daje i bonus kolekcije (+2% poena)
     - u trci skupljas plave board tokene: 3 = hoverboard (dugme)
     - Marvel Pass (40 nivoa), 3 dnevne misije, moci za novcice
   Junaci se i dalje otkljucavaju gledanjem filmova.

   Stanje: s.runner (vidi R()). Stari napredak se cuva (mig3).
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI, esc = UI.esc;
  function fmt(n) { return Math.round(n || 0).toLocaleString('sr-RS'); }
  function ico(name, cls) { return '<img class="ri ' + (cls || '') + '" src="' + (name === 'coin' ? 'img/run/coin.webp' : 'img/ui/' + name + '.webp') + '" alt="">'; }
  var SVG = {
    back: '<svg viewBox="0 0 24 24"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 4h4v16H7zM13 4h4v16h-4z"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M8.6 19.4 16 12 8.6 4.6 10 3.2l8.8 8.8L10 20.8z"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M12 3 3 12h6v9h6v-9h6z"/></svg>'
  };

  /* ---------------- junaci ---------------- */
  var CHARS = [
    { id: 'agent', name: 'Agent S.H.I.E.L.D.-a', film: null, perk: 'Bez moći. Čist talenat.', p: {} },
    { id: 'iron', name: 'Iron Man', film: 'iron-man', perk: 'Magnet traje 25% duže.', p: { magnet: 1.25 } },
    { id: 'cap', name: 'Captain America', film: 'captain-america-first-avenger', perk: 'Hoverboard traje 40 s umesto 30.', p: { board: 1.33 } },
    { id: 'thor', name: 'Thor', film: 'thor', perk: 'Mjolnir let traje 25% duže.', p: { jet: 1.25 } },
    { id: 'hulk', name: 'Hulk', film: 'incredible-hulk', perk: 'Jednom po trci probije barijeru (samo se saplete).', p: { smash: 1 } },
    { id: 'widow', name: 'Black Widow', film: 'black-widow', perk: '×2 poeni traju 25% duže.', p: { x2: 1.25 } },
    { id: 'spidey', name: 'Spider-Man', film: 'spider-man-homecoming', perk: 'Spider skok traje 25% duže.', p: { jump: 1.25 } },
    { id: 'panther', name: 'Black Panther', film: 'black-panther', perk: '+10% novčića (vibranijum).', p: { coin: 1.1 } },
    { id: 'strange', name: 'Doctor Strange', film: 'doctor-strange', perk: 'Brzina raste 10% sporije.', p: { accel: .9 } },
    { id: 'ant', name: 'Ant-Man', film: 'ant-man', perk: '+10% poena.', p: { score: 1.1 } },
    { id: 'marvel', name: 'Captain Marvel', film: 'captain-marvel', perk: 'Moći se pojavljuju 30% češće.', p: { pwRate: 1.3 } },
    { id: 'deadpool', name: 'Deadpool', film: 'deadpool', perk: 'Prvi nastavak u trci je besplatan.', p: { freeRevive: 1 } },
    { id: 'doom', name: 'Doctor Doom', film: 'avengers-doomsday', perk: '+10% poena i +10% novčića.', p: { score: 1.1, coin: 1.1 } },
    // tajni: samo iz Kostinog koda (codes.js)
    { id: 'stanlee', name: 'Stan Lee', secret: true, perk: 'Excelsior! Kreće sa štitom, sve moći traju 50% duže, češće se pojavljuju i +25% poena.',
      p: { magnet: 1.5, jet: 1.5, x2: 1.5, jump: 1.5, board: 1.5, pwRate: 1.5, score: 1.25, startShield: 1 } }
  ];
  function sprite(c) { return 'img/run/' + c.id + '.webp'; }
  function unlocked(c, s) { if (c.secret) return R(s).secret.indexOf(c.id) >= 0; return !c.film || MM.Plan.isDone(MM.Cat.get(c.film), s); }
  function charById(id) { return CHARS.filter(function (x) { return x.id === id; })[0]; }
  function charOf(s) { var c = charById(s.runnerChar); return c && unlocked(c, s) ? c : CHARS[0]; }
  /** Bonus od filmova: +0.5% poena po odgledanom naslovu, najvise ×1.5. */
  function filmBonus(s) {
    var n = Object.keys(MM.Badges.doneMap(s)).length;
    return { n: n, mul: Math.min(1.5, 1 + n / 200) };
  }

  /* ---------------- boardovi ---------------- */
  var BOARDS = [
    // pp: mala moc boarda (run3d.js); perk: opis
    { id: 'klasik', name: 'Klasik', c1: '#e62429', c2: '#ffd36b', pp: 'time', perk: 'Traje 5 s duže.' },
    { id: 'mjolnir', name: 'Mjolnir', c1: '#8f9cb0', c2: '#5fd3ff', pp: 'jump', perk: 'Super skok dok voziš — pravo na krov voza.' },
    { id: 'gama', name: 'Gama', c1: '#2f8f3a', c2: '#9dff6b', pp: 'magnet', perk: 'Magnet dok voziš.' },
    { id: 'vibra', name: 'Vibranijum', c1: '#2a1d4a', c2: '#c46bff', pp: 'hits', perk: 'Izdrži 2 udarca umesto jednog.' },
    { id: 'kosmik', name: 'Kosmik', c1: '#1b3a8f', c2: '#ffd23f', pp: 'coins', perk: 'Dupli novčići dok voziš.' },
    { id: 'stark', name: 'Stark', c1: '#b3141b', c2: '#ffcf3f', pp: 'meter', perk: 'Puni se sa 11 tokena umesto 15.' },
    { id: 'doom', name: 'Doom', c1: '#2e4a2e', c2: '#9dffbc', pp: 'start', perk: 'Kreneš sa punim boardom.' },
    { id: 'strip', name: 'Strip', secret: true, comic: true, c1: '#ffd23f', c2: '#e62429', pp: 'strip', perk: 'Tajni board: magnet i dupli novčići dok voziš, traje 40 s, kreće pun.' }
  ];
  function boardById(id) { return BOARDS.filter(function (b) { return b.id === id; })[0] || BOARDS[0]; }

  /* ---------------- nivoi (1-10) ---------------- */
  var MAXL = 10;
  var H_TOK = [10, 20, 35, 55, 80, 110, 150, 200, 260], H_COIN = [200, 400, 700, 1100, 1600, 2300, 3200, 4400, 6000];
  var B_TOK = [5, 10, 18, 28, 40, 55, 75, 100, 130], B_COIN = [150, 300, 550, 850, 1250, 1800, 2500, 3400, 4600];
  function hMul(l) { return 1 + .25 * ((l || 1) - 1); }
  function bMul(l) { return 1 + .1 * ((l || 1) - 1); }
  /** Bonus kolekcije: +2% za svaki podignut nivo (junaci + boardovi). */
  function collBonus(r) {
    var n = 0;
    Object.keys(r.hlv).forEach(function (k) { n += (r.hlv[k] || 1) - 1; });
    Object.keys(r.blv).forEach(function (k) { n += (r.blv[k] || 1) - 1; });
    return n * 2;
  }

  /* ---------------- moci (trajanje se kupuje novcicima) ---------------- */
  var UPS = [
    { id: 'magnet', name: 'Magnet', ic: 'magnet', desc: 'Privlači novčiće iz svih traka.', base: 10 },
    { id: 'jet', name: 'Mjolnir let', ic: 'hammer', desc: 'Letiš iznad svega i kupiš novčiće u vazduhu.', base: 7 },
    { id: 'x2', name: '×2 poeni', ic: 'x2', desc: 'Dupli poeni i novčići.', base: 12 },
    { id: 'jump', name: 'Spider skok', ic: 'web', desc: 'Skačeš duplo više, pravo na vozove.', base: 10 }
  ];
  var UP_COST = [300, 700, 1500, 3000, 6000];
  function upDur(u, lvl) { return Math.round(u.base * (1 + .2 * (lvl || 0))); }

  /* ---------------- Marvel Pass ---------------- */
  var TIER = 250, TIERS = 40;
  // c = novcici, k = kljucevi, h = tokeni junaka, t = board tokeni, s = novi board
  var PASS = (function () {
    var r = [], boards = { 3: 'mjolnir', 8: 'gama', 14: 'vibra', 20: 'kosmik', 28: 'stark', 40: 'doom' };
    for (var i = 1; i <= TIERS; i++) {
      if (boards[i]) r.push({ s: boards[i] });
      else if (i % 5 === 0) r.push({ k: i >= 20 ? 2 : 1 });
      else if (i % 4 === 0) r.push({ c: 150 + Math.floor(i / 4) * 50 });
      else if (i % 2 === 0) r.push({ h: 6 + Math.floor(i / 5) * 2 });
      else r.push({ t: 4 + Math.floor(i / 6) * 2 });
    }
    return r;
  })();
  // druga traka: jace nagrade, ali nivo n trazi n odgledanih naslova
  var MPASS = (function () {
    var r = [];
    for (var i = 1; i <= TIERS; i++) {
      if (i % 10 === 0) r.push({ k: 3 });
      else if (i % 5 === 0) r.push({ x: 1 });
      else if (i % 4 === 0) r.push({ c: 400 + i * 20 });
      else if (i % 2 === 0) r.push({ h: 10 + Math.floor(i / 5) * 2 });
      else r.push({ t: 8 + Math.floor(i / 6) * 2 });
    }
    return r;
  })();
  function watchedN(s) { return Object.keys(MM.Badges.doneMap(s)).length; }
  function rew(w) {
    if (w.c) return { ic: 'coin', t: fmt(w.c), sub: 'novčića' };
    if (w.k) return { ic: 'key', t: '×' + w.k, sub: w.k > 1 ? 'ključa' : 'ključ' };
    if (w.h) return { ic: 'htoken', t: '×' + w.h, sub: 'tokena junaka' };
    if (w.t) return { ic: 'btoken', t: '×' + w.t, sub: 'board tokena' };
    if (w.x) return { ic: 'chest', t: '×' + w.x, sub: 'misteriozna kutija' };
    var b = boardById(w.s);
    return { ic: 'board', t: b.name, sub: 'novi board', board: b };
  }

  /* ---------------- dnevne misije ---------------- */
  var MISS = [
    { id: 'coins', t: 'Skupi {n} novčića', n: [150, 220, 300] },
    { id: 'dist1', t: 'Pretrči {n} m u jednoj trci', n: [800, 1300, 2000] },
    { id: 'jumps', t: 'Skoči {n} puta', n: [25, 40, 60] },
    { id: 'rolls', t: 'Klizni {n} puta', n: [15, 25, 40] },
    { id: 'trains', t: 'Pretrči preko {n} vozova', n: [3, 6, 10] },
    { id: 'powerups', t: 'Uzmi {n} moći', n: [3, 5, 8] },
    { id: 'btok', t: 'Skupi {n} board tokena', n: [6, 10, 15] },
    { id: 'runs', t: 'Odigraj {n} trke', n: [3, 4, 5] },
    { id: 'score1', t: 'Napravi {n} poena u jednoj trci', n: [8000, 15000, 25000] }
  ];
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function hash(str) { var h = 7; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
  function dayMissions() {
    var d = today(), h = hash(d), pool = MISS.slice(), out = [];
    for (var i = 0; i < 3; i++) {
      var k = (h >>> (i * 5)) % pool.length, m = pool.splice(k, 1)[0];
      out.push({ id: m.id, n: m.n[(h >>> (i * 3 + 16)) % 3], p: 0, got: 0 });
    }
    return { day: d, list: out, all: 0 };
  }
  function missText(m) { var d = MISS.filter(function (x) { return x.id === m.id; })[0]; return d ? d.t.replace('{n}', fmt(m.n)) : m.id; }

  /* ---------------- stanje ---------------- */
  function R(s) {
    var r = s.runner && typeof s.runner === 'object' ? s.runner : {};
    var o = {
      wallet: r.wallet | 0, keys: r.keys == null ? 2 : r.keys | 0,
      htok: r.htok | 0, btok: r.btok | 0, boxes: r.boxes | 0, secret: (r.secret || []).slice(),
      up: Object.assign({ magnet: 0, jet: 0, x2: 0, jump: 0 }, r.up || {}),
      pass: { pts: (r.pass && r.pass.pts) | 0, got: Object.assign({}, r.pass && r.pass.got) },
      miss: r.miss && r.miss.day === today() ? JSON.parse(JSON.stringify(r.miss)) : dayMissions(),
      board: r.board || r.skin || 'klasik', owned: (r.owned || r.skins || ['klasik']).slice(),
      hlv: Object.assign({}, r.hlv), blv: Object.assign({}, r.blv),
      runs: r.runs | 0, distAll: r.distAll | 0, gift: r.gift | 0, tut: r.tut | 0, mig3: r.mig3 | 0, mig4: r.mig4 | 0
    };
    // v2.20: nivo passa trazi 250 umesto 150 poena - poeni se preracunaju da nivo ostane isti
    if (!o.mig4) { o.pass.pts = Math.round(o.pass.pts * 250 / 150); o.mig4 = 1; }
    if (!o.mig3) {
      // v2.18 -> v3: stari "boardovi" (komadi) postaju board tokeni; ko je vec igrao preskace tutorijal
      o.btok += (r.boards == null ? 0 : r.boards | 0) * 5;
      if (o.runs > 0) o.tut = 1;
      o.mig3 = 1;
    }
    if (o.owned.indexOf('klasik') < 0) o.owned.unshift('klasik');
    return o;
  }
  function save(fn) { MM.Store.mutate(function (s) { var r = R(s); fn(r, s); s.runner = r; }); }
  function tierOf(pts) { return Math.min(TIERS, Math.floor(pts / TIER)); }
  function claimable(r, s) {
    var t = tierOf(r.pass.pts), n = 0, w = s ? watchedN(s) : 0;
    for (var i = 1; i <= t; i++) { if (!r.pass.got[i]) n++; if (s && i <= w && !r.pass.got['m' + i]) n++; }
    return n;
  }
  function missReady(r) { return r.miss.list.filter(function (m) { return m.p >= m.n && !m.got; }).length; }
  function canUpH(r, id) { var l = r.hlv[id] || 1; return l < MAXL && r.htok >= H_TOK[l - 1] && r.wallet >= H_COIN[l - 1]; }
  function canUpB(r, id) { var l = r.blv[id] || 1; return l < MAXL && r.btok >= B_TOK[l - 1] && r.wallet >= B_COIN[l - 1]; }
  function upgradable(r, s) {
    return CHARS.filter(function (c) { return unlocked(c, s) && canUpH(r, c.id); }).length + r.owned.filter(function (b) { return canUpB(r, b); }).length;
  }
  /** Ukupni mnozilac poena za trku. */
  function runMul(s, r, c) {
    return filmBonus(s).mul * hMul(r.hlv[c.id]) * bMul(r.blv[r.board]) * (1 + collBonus(r) / 100) * (c.p.score || 1);
  }

  /* ---------------- ucitavanje 3D ---------------- */
  var loadP = null;
  function script(src) {
    return new Promise(function (ok, no) {
      var sc = document.createElement('script'); sc.src = src; sc.onload = function () { ok(); }; sc.onerror = function () { no(new Error(src)); };
      document.head.appendChild(sc);
    });
  }
  function load3d() {
    if (loadP) return loadP;
    loadP = (window.THREE ? Promise.resolve() : script('js/vendor/three.min.js?v=149'))
      .then(function () { return THREE.GLTFLoader ? null : script('js/vendor/three-addons.js?v=149'); })
      .then(function () { return MM.Heroes.load(); })
      .catch(function (e) { loadP = null; throw e; });
    return loadP;
  }

  /* ---------------- ekrani ---------------- */
  var host = null, onEnd = null, game = null, run = null, view = 'home', colTab = 'h';

  function top(title, backTo) {
    var r = R(MM.Store.get());
    return '<header class="r3-top">' +
      '<button type="button" class="r3-back" data-back="' + (backTo || '') + '" aria-label="Nazad">' + SVG.back + '</button>' +
      '<b class="r3-title">' + esc(title) + '</b>' +
      '<span class="r3-cur">' + ico('coin') + fmt(r.wallet) + '</span>' +
      '<span class="r3-cur">' + ico('key') + r.keys + '</span></header>';
  }
  function nav(cur) {
    var s = MM.Store.get(), r = R(s);
    var it = [['miss', 'missions', 'Misije', missReady(r)], ['col', 'mask', 'Kolekcija', upgradable(r, s)], ['home', 'play', 'Igraj', 0], ['pass', 'ticket', 'Pass', claimable(r, s)], ['shop', 'bolt', 'Moći', 0]];
    return '<nav class="r3-nav">' + it.map(function (x) {
      return '<button type="button" class="' + (cur === x[0] ? 'on' : '') + '" data-v="' + x[0] + '">' + ico(x[1]) + '<span>' + x[2] + '</span>' + (x[3] ? '<u>' + x[3] + '</u>' : '') + '</button>';
    }).join('') + '</nav>';
  }
  function frame(cur, title, body, backTo) {
    stopPreview();
    view = cur;
    host.innerHTML = '<div class="r3-screen">' + top(title, backTo) + '<div class="r3-body">' + body + '</div>' + (backTo ? '' : nav(cur)) + '</div>';
    wire();
  }
  function wire() {
    each('[data-v]', function (b) { b.onclick = function () { UI.buzz(5); go(b.getAttribute('data-v')); }; });
    each('[data-back]', function (b) { b.onclick = function () { if (!back()) UI.closeTop(); }; });
  }
  function each(sel, fn) { Array.prototype.forEach.call(host.querySelectorAll(sel), fn); }
  function go(v) { ({ home: home, col: collection, pass: passView, miss: missView, shop: shopView })[v](); }
  /** "Nazad" (dugme u aplikaciji i na telefonu). Vraca true kad je obradjeno ovde. */
  function back() {
    if (!host) return false;
    if (game) { if (!host.querySelector('.r3-over')) pause(); return true; }
    if (view === 'detail') { collection(); return true; }
    if (view !== 'home') { home(); return true; }
    return false;
  }

  /* --- 3D pregled u meniju --- */
  var pv = null;
  function stopPreview() { if (pv) { pv.stop(); pv = null; } }
  function startPreview(el, opts) {
    load3d().then(function () {
      if (!host || !el.isConnected) return;
      var sp = el.querySelector('.r3-sprite'); if (sp) sp.remove();
      var dk = el.querySelector('.r3-deck'); if (dk) dk.remove();
      stopPreview();
      pv = MM.Heroes.preview(el, opts);
      el.onclick = function () { if (pv && pv.dance) { pv.dance(); UI.buzz(6); } };
    }).catch(function () {});
  }

  /* --- pocetna --- */
  function home() {
    var s = MM.Store.get(), r = R(s), c = charOf(s), b = boardById(r.board), best = ((s.games || {}).best || {}).runner || 0;
    var g = MM.Views.gamesOf(s), lv = MM.Games.lvlOf(g.xp), un = CHARS.filter(function (x) { return unlocked(x, s); });
    var mul = runMul(s, r, c);
    frame('home', 'Marvel Runner',
      '<div class="r3-home">' +
        '<div class="r3-stats">' +
          '<span class="r3-lvl">' + ico('badge') + '<b>' + lv.n + '</b><i><s style="width:' + lv.pct + '%"></s></i><em>' + (g.xp - lv.from) + '/' + (lv.to - lv.from) + '</em></span>' +
          '<span class="r3-bonus">+' + collBonus(r) + '%</span>' +
          '<span class="r3-cur sm">' + ico('htoken') + fmt(r.htok) + '</span><span class="r3-cur sm">' + ico('btoken') + fmt(r.btok) + '</span>' +
        '</div>' +
        '<div class="r3-stage" id="r3Stage"><img class="r3-sprite" src="' + sprite(c) + '" alt=""></div>' +
        '<div class="r3-who">' +
          '<div><b>' + esc(c.name) + '</b><span>Nivo ' + (r.hlv[c.id] || 1) + ' · board ' + esc(b.name) + '</span></div>' +
        '</div>' +
        '<div class="r3-chips"><span>' + ico('trophy') + '<b>' + fmt(best) + '</b></span><span><b>×' + mul.toFixed(2) + '</b> poeni</span></div>' +
        '<button type="button" class="r3-go" id="r3Go">' + (r.tut ? 'IGRAJ' : 'IGRAJ · TUTORIJAL') + '</button>' +
        (r.tut ? '<button type="button" class="r3-link" id="r3Tut">Ponovi tutorijal</button>' : '') +
      '</div>');
    host.querySelector('#r3Go').onclick = function () { start(!r.tut); };
    var tb = host.querySelector('#r3Tut'); if (tb) tb.onclick = function () { start(true); };
    startPreview(host.querySelector('#r3Stage'), { hero: c.id, board: b });
  }

  /* --- kolekcija: junaci i boardovi --- */
  function collection() {
    var s = MM.Store.get(), r = R(s), cur = charOf(s);
    var body = '<div class="r3-seg"><button type="button" class="' + (colTab === 'h' ? 'on' : '') + '" data-ct="h">' + ico('mask') + 'Junaci</button>' +
      '<button type="button" class="' + (colTab === 'b' ? 'on' : '') + '" data-ct="b">' + ico('board') + 'Boardovi</button></div>' +
      '<div class="r3-cbar"><span>Bonus kolekcije <b>+' + collBonus(r) + '%</b></span><span class="r3-cur sm">' + ico(colTab === 'h' ? 'htoken' : 'btoken') + fmt(colTab === 'h' ? r.htok : r.btok) + '</span></div><div class="r3-grid">';
    if (colTab === 'h') {
      CHARS.forEach(function (c) {
        var on = unlocked(c, s), l = r.hlv[c.id] || 1, need = H_TOK[l - 1];
        if (c.secret && !on) return;
        body += '<button type="button" class="r3-card' + (on ? '' : ' locked') + (c.id === cur.id ? ' sel' : '') + '" data-h="' + c.id + '">' +
          '<span class="r3-ci"><img src="' + (thumbs[c.id] || sprite(c)) + '" data-th="' + c.id + '" alt="" loading="lazy"></span>' +
          (on ? '<em class="r3-x">×' + +hMul(l).toFixed(2) + '</em>' : ico('lock', 'r3-lk')) +
          (on && canUpH(r, c.id) ? '<i class="r3-upa">' + SVG.up + '</i>' : '') +
          '<b>' + esc(c.name) + '</b>' +
          (on ? '<span class="r3-lb"><i>Nv. ' + l + '</i>' + (l < MAXL ? '<s>' + ico('htoken') + '<u><q style="width:' + Math.min(100, r.htok / need * 100) + '%"></q></u>' + need + '</s>' : '<s>MAX</s>') + '</span>'
            : '<span class="r3-lb"><s>„' + esc(MM.Cat.cleanTitle(MM.Cat.get(c.film))) + '“</s></span>') + '</button>';
      });
    } else {
      BOARDS.forEach(function (b) {
        var own = r.owned.indexOf(b.id) >= 0, l = r.blv[b.id] || 1, need = B_TOK[l - 1];
        if (b.secret && !own) return;
        var tier = PASS.map(function (w, i) { return w.s === b.id ? i + 1 : 0; }).filter(Boolean)[0];
        body += '<button type="button" class="r3-card' + (own ? '' : ' locked') + (r.board === b.id ? ' sel' : '') + '" data-b="' + b.id + '" style="--b1:' + b.c1 + ';--b2:' + b.c2 + '">' +
          '<span class="r3-ci"><span class="r3-deck' + (b.comic ? ' comic' : '') + '"></span></span>' +
          (own ? '<em class="r3-x">×' + bMul(l).toFixed(1) + '</em>' : ico('lock', 'r3-lk')) +
          (own && canUpB(r, b.id) ? '<i class="r3-upa">' + SVG.up + '</i>' : '') +
          '<b>' + esc(b.name) + '</b><span class="r3-bp">' + esc(b.perk) + '</span>' +
          (own ? '<span class="r3-lb"><i>Nv. ' + l + '</i>' + (l < MAXL ? '<s>' + ico('btoken') + '<u><q style="width:' + Math.min(100, r.btok / need * 100) + '%"></q></u>' + need + '</s>' : '<s>MAX</s>') + '</span>'
            : '<span class="r3-lb"><s>Pass nivo ' + tier + '</s></span>') + '</button>';
      });
    }
    body += '</div>';
    frame('col', 'Kolekcija', body);
    each('[data-ct]', function (b) { b.onclick = function () { colTab = b.getAttribute('data-ct'); UI.buzz(5); collection(); }; });
    each('[data-h]', function (b) { b.onclick = function () { heroDetail(b.getAttribute('data-h')); }; });
    each('[data-b]', function (b) { b.onclick = function () { boardDetail(b.getAttribute('data-b')); }; });
    if (colTab === 'h') makeThumbs();
  }

  // slicice junaka iz 3D modela (jednom, posle ucitavanja)
  var thumbs = {};
  function makeThumbs() {
    load3d().then(function () {
      CHARS.forEach(function (c) {
        if (!thumbs[c.id]) thumbs[c.id] = MM.Heroes.thumb(c.id);
        var im = host && host.querySelector('img[data-th="' + c.id + '"]'); if (im) im.src = thumbs[c.id];
      });
    }).catch(function () {});
  }

  function heroDetail(id) {
    var s = MM.Store.get(), r = R(s), c = charById(id), on = unlocked(c, s), l = r.hlv[id] || 1, sel = charOf(s).id === id;
    var cost = l < MAXL ? '<button type="button" class="r3-upg" id="r3Up"' + (canUpH(r, id) ? '' : ' disabled') + '><b>Nadogradi · nivo ' + (l + 1) + '</b>' +
      '<span>' + ico('coin') + fmt(H_COIN[l - 1]) + ico('htoken') + fmt(r.htok) + '/' + H_TOK[l - 1] + '</span></button>' : '<p class="r3-max">Najviši nivo</p>';
    frame('detail', c.name,
      '<div class="r3-det"><div class="r3-stage big" id="r3Stage"><img class="r3-sprite" src="' + sprite(c) + '" alt=""></div>' +
      '<div class="r3-dl"><span class="r3-hex">×' + +hMul(l).toFixed(2) + '</span><div><em>NIVO ' + l + '</em><b>' + esc(c.name) + '</b><span>' + esc(c.perk) + '</span></div></div>' +
      (on ? '<div class="r3-btns"><button type="button" class="r3-sel' + (sel ? ' on' : '') + '" id="r3Sel">' + (sel ? 'Izabran' : 'Izaberi') + '</button>' + cost + '</div>'
        : '<p class="r3-note center">' + ico('lock') + ' Otključava se kad odgledaš „' + esc(MM.Cat.cleanTitle(MM.Cat.get(c.film))) + '“.</p>') +
      '<p class="r3-note center">Tapni junaka da zaigra.</p></div>', 'col');
    var sb = host.querySelector('#r3Sel'); if (sb) sb.onclick = function () { MM.Store.mutate(function (st) { st.runnerChar = id; }); UI.buzz(8); heroDetail(id); };
    var ub = host.querySelector('#r3Up'); if (ub) ub.onclick = function () {
      var ok = false;
      save(function (r2) { var lv = r2.hlv[id] || 1; if (lv < MAXL && r2.htok >= H_TOK[lv - 1] && r2.wallet >= H_COIN[lv - 1]) { r2.htok -= H_TOK[lv - 1]; r2.wallet -= H_COIN[lv - 1]; r2.hlv[id] = lv + 1; ok = true; } });
      if (ok) { reward({ ic: 'badge', t: 'Nivo ' + (l + 1), sub: c.name + ' · ×' + +hMul(l + 1).toFixed(2) + ' poena' }); heroDetail(id); }
    };
    startPreview(host.querySelector('#r3Stage'), { hero: id, board: boardById(r.board), dark: !on });
  }

  function boardDetail(id) {
    var r = R(MM.Store.get()), b = boardById(id), own = r.owned.indexOf(id) >= 0, l = r.blv[id] || 1, sel = r.board === id;
    var tier = PASS.map(function (w, i) { return w.s === id ? i + 1 : 0; }).filter(Boolean)[0];
    var cost = l < MAXL ? '<button type="button" class="r3-upg" id="r3Up"' + (canUpB(r, id) ? '' : ' disabled') + '><b>Nadogradi · nivo ' + (l + 1) + '</b>' +
      '<span>' + ico('coin') + fmt(B_COIN[l - 1]) + ico('btoken') + fmt(r.btok) + '/' + B_TOK[l - 1] + '</span></button>' : '<p class="r3-max">Najviši nivo</p>';
    frame('detail', b.name,
      '<div class="r3-det"><div class="r3-stage big" id="r3Stage" style="--b1:' + b.c1 + ';--b2:' + b.c2 + '"><span class="r3-deck big' + (b.comic ? ' comic' : '') + '"></span></div>' +
      '<div class="r3-dl"><span class="r3-hex">×' + bMul(l).toFixed(1) + '</span><div><em>NIVO ' + l + '</em><b>' + esc(b.name) + '</b><span><b class="r3-bpk">' + esc(b.perk) + '</b> Skupi 15 plavih tokena u trci i tapni bilo gde: 30 s te jedan udarac ne obara, a svaki token na boardu dodaje 2 s. Nivo boarda diže poene.</span></div></div>' +
      (own ? '<div class="r3-btns"><button type="button" class="r3-sel' + (sel ? ' on' : '') + '" id="r3Sel">' + (sel ? 'Izabran' : 'Izaberi') + '</button>' + cost + '</div>'
        : '<p class="r3-note center">' + ico('lock') + ' Dobija se na Pass nivou ' + tier + '.</p>') + '</div>', 'col');
    var sb = host.querySelector('#r3Sel'); if (sb) sb.onclick = function () { save(function (r2) { r2.board = id; }); UI.buzz(8); boardDetail(id); };
    var ub = host.querySelector('#r3Up'); if (ub) ub.onclick = function () {
      var ok = false;
      save(function (r2) { var lv = r2.blv[id] || 1; if (lv < MAXL && r2.btok >= B_TOK[lv - 1] && r2.wallet >= B_COIN[lv - 1]) { r2.btok -= B_TOK[lv - 1]; r2.wallet -= B_COIN[lv - 1]; r2.blv[id] = lv + 1; ok = true; } });
      if (ok) { reward({ ic: 'board', t: 'Nivo ' + (l + 1), sub: b.name + ' · ×' + bMul(l + 1).toFixed(1) + ' poena' }); boardDetail(id); }
    };
    startPreview(host.querySelector('#r3Stage'), { board: b });
  }

  /* --- moci --- */
  function shopView() {
    var r = R(MM.Store.get());
    var body = '<p class="r3-note">Moći kupiš u trci. Svaki nivo = +20% trajanja.</p><div class="r3-list">' +
      UPS.map(function (u) {
        var l = r.up[u.id] || 0, cost = UP_COST[l];
        return '<div class="r3-row">' + ico(u.ic, 'big') + '<div class="r3-rt"><b>' + esc(u.name) + '</b><span>' + esc(u.desc) + '</span>' +
          '<div class="r3-pips">' + [0, 1, 2, 3, 4].map(function (k) { return '<s class="' + (k < l ? 'on' : '') + '"></s>'; }).join('') + '<em>' + upDur(u, l) + ' s</em></div></div>' +
          (l >= 5 ? '<span class="r3-maxs">MAX</span>' : '<button type="button" class="r3-buy" data-u="' + u.id + '"' + (r.wallet < cost ? ' disabled' : '') + '>' + ico('coin') + fmt(cost) + '</button>') + '</div>';
      }).join('') +
      '<div class="r3-row">' + ico('key', 'big') + '<div class="r3-rt"><b>Ključ</b><span>Nastavak posle pada. Imaš ' + r.keys + '.</span></div>' +
        '<button type="button" class="r3-buy" data-u="key"' + (r.wallet < 1000 ? ' disabled' : '') + '>' + ico('coin') + '1.000</button></div>' +
      '<div class="r3-row box">' + ico('chest', 'big') + '<div class="r3-rt"><b>Misteriozna kutija</b><span>Nasumična nagrada: novčići, tokeni, ključevi, a možda i board. Imaš ' + r.boxes + '.</span></div>' +
        '<div class="r3-bx">' + (r.boxes ? '<button type="button" class="r3-buy open" data-u="open">Otvori</button>' : '') +
        '<button type="button" class="r3-buy" data-u="box"' + (r.wallet < 600 ? ' disabled' : '') + '>' + ico('coin') + '600</button></div></div>' +
      '<div class="r3-row">' + ico('htoken', 'big') + '<div class="r3-rt"><b>5 tokena junaka</b><span>Za nivo junaka. Imaš ' + fmt(r.htok) + '.</span></div>' +
        '<button type="button" class="r3-buy" data-u="htok"' + (r.wallet < 800 ? ' disabled' : '') + '>' + ico('coin') + '800</button></div></div>';
    frame('shop', 'Moći', body);
    each('.r3-buy', function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-u'), ok = false;
        save(function (r2) {
          if (id === 'key') { if (r2.wallet >= 1000) { r2.wallet -= 1000; r2.keys++; ok = true; } }
          else if (id === 'htok') { if (r2.wallet >= 800) { r2.wallet -= 800; r2.htok += 5; ok = true; } }
          else if (id === 'box') { if (r2.wallet >= 600) { r2.wallet -= 600; r2.boxes++; ok = true; } }
          else if (id === 'open') { /* ispod */ }
          else { var l = r2.up[id] || 0; if (l < 5 && r2.wallet >= UP_COST[l]) { r2.wallet -= UP_COST[l]; r2.up[id] = l + 1; ok = true; } }
        });
        if (id === 'open') { openBox(shopView); return; }
        if (ok) { UI.buzz([10, 30, 10]); shopView(); }
      };
    });
  }

  /* --- misteriozna kutija: nasumicna nagrada sa retkoscu --- */
  function rollBox(r) {
    var x = Math.random(), notOwned = PASS.filter(function (w) { return w.s && r.owned.indexOf(w.s) < 0; });
    if (x < .03 && notOwned.length) return { s: notOwned[0].s, rar: 'Legendarno' };
    if (x < .07) return { pack: 1, c: 2000, h: 20, t: 20, rar: 'Legendarno' };
    if (x < .15) return { k: 2, rar: 'Epsko' };
    if (x < .33) return { t: 10 + Math.floor(Math.random() * 9), rar: 'Retko' };
    if (x < .53) return { h: 6 + Math.floor(Math.random() * 7), rar: 'Retko' };
    return { c: 200 + Math.floor(Math.random() * 6) * 50, rar: 'Obično' };
  }
  function openBox(after) {
    var got = null;
    save(function (r2) {
      if (r2.boxes <= 0) return;
      r2.boxes--; got = rollBox(r2);
      if (got.c) r2.wallet += got.c;
      if (got.h) r2.htok += got.h;
      if (got.t) r2.btok += got.t;
      if (got.k) r2.keys += got.k;
      if (got.s && r2.owned.indexOf(got.s) < 0) r2.owned.push(got.s);
    });
    if (!got) return;
    var x = got.pack ? { ic: 'gift', t: 'JACKPOT', sub: '2.000 novčića · 20 + 20 tokena' } : rew(got);
    var el = document.createElement('div'); el.className = 'r3-box-open';
    el.innerHTML = '<div class="bo-chest">' + ico('chest', 'huge') + '</div>';
    (host.closest('.sheet') || document.body).appendChild(el);
    UI.buzz([10, 40, 10, 40, 10]);
    setTimeout(function () {
      el.classList.add('pop');
      el.innerHTML = '<div class="bo-card ' + got.rar.toLowerCase() + '"><em>' + got.rar + '</em>' + (x.board ? '<span class="r3-deck" style="--b1:' + x.board.c1 + ';--b2:' + x.board.c2 + '"></span>' : ico(x.ic, 'huge')) +
        '<b>' + esc(x.t) + '</b><span>' + esc(x.sub) + '</span><button type="button" class="r3-go">Super</button></div>';
      UI.buzz(got.rar === 'Legendarno' ? [30, 60, 30, 60, 80] : [20, 40, 20]);
      el.querySelector('button').onclick = function () { el.remove(); if (after) after(); };
    }, 1100);
  }

  /** Nagrada iz koda (codes.js). Vraca tekst za poruku. */
  function grant(rw) {
    var t = rw && rw.t, n = Math.max(1, rw && rw.n | 0), msg = '';
    save(function (r2) {
      if (t === 'stanlee' || t === 'pack') { if (r2.secret.indexOf('stanlee') < 0) r2.secret.push('stanlee'); }
      if (t === 'strip' || t === 'pack') { if (r2.owned.indexOf('strip') < 0) r2.owned.push('strip'); }
      if (t === 'pack') r2.boxes += 3;
      if (t === 'box') r2.boxes += n;
      if (t === 'coins') r2.wallet += n;
      if (t === 'keys') r2.keys += n;
      if (t === 'htok') r2.htok += n;
      if (t === 'btok') r2.btok += n;
    });
    msg = { stanlee: 'Otključan tajni junak: Stan Lee!', strip: 'Otključan tajni board: Strip!', pack: 'Excelsior! Stan Lee, Strip board i 3 kutije!',
      box: n + ' misteriozne kutije (Runner → Moći)', coins: n + ' novčića', keys: n + ' ključeva', htok: n + ' tokena junaka', btok: n + ' board tokena' }[t] || 'Nagrada je tvoja.';
    return msg;
  }

  /* --- pass: dve trake (Besplatno + Maraton), na sredini nivoi --- */
  function passView() {
    var s = MM.Store.get(), r = R(s), t = tierOf(r.pass.pts), into = r.pass.pts - t * TIER, pct = t >= TIERS ? 100 : Math.round(into / TIER * 100), wn = watchedN(s);
    function cell(w, key, n, lockedWhy) {
      var x = rew(w), got = r.pass.got[key], open = n <= t && !lockedWhy, ready = open && !got;
      return '<div class="r3-pc' + (got ? ' got' : ready ? ' ready' : '') + (key[0] === 'm' ? ' mar' : '') + '"' + (x.board ? ' style="--b1:' + x.board.c1 + ';--b2:' + x.board.c2 + '"' : '') + '>' +
        (x.board ? '<span class="r3-deck sm"></span>' : ico(x.ic, 'big')) + '<b>' + esc(x.t) + '</b>' +
        (got ? '<i class="r3-ck">✓</i>' : ready ? '<button type="button" class="r3-buy" data-t="' + key + '">Uzmi</button>' : n <= t && lockedWhy ? '<em>' + lockedWhy + '</em>' : ico('lock', 'r3-plk')) + '</div>';
    }
    var body = '<div class="r3-phead">' + ico('ticket', 'big') + '<div><b>Marvel Pass · nivo ' + t + ' / ' + TIERS + '</b>' +
      '<div class="r3-bar"><i style="width:' + pct + '%"></i></div>' +
      '<span>' + (t >= TIERS ? 'Sve otključano.' : 'još ' + (TIER - into) + ' poena do nivoa ' + (t + 1)) + ' · 12 m = 1 poen · misija = 60</span></div></div>' +
      '<div class="r3-pcols"><span>Besplatno</span><span></span><span class="mar">Maraton · ' + wn + ' odgledano</span></div>' +
      '<div class="r3-ptrack">' + PASS.map(function (w, i) {
        var n = i + 1;
        return '<div class="r3-prow' + (n <= t ? ' on' : n === t + 1 ? ' next' : '') + '">' + cell(w, String(n), n) +
          '<span class="r3-dia"><b>' + n + '</b></span>' + cell(MPASS[i], 'm' + n, n, n > wn ? 'odgledaj još ' + (n - wn) : '') + '</div>';
      }).join('') + '</div>' +
      '<p class="r3-note center">Desna traka se otključava gledanjem: nivo ' + (wn + 1) + ' traži ' + (wn + 1) + ' odgledanih naslova.</p>';
    frame('pass', 'Pass', body);
    var nx = host.querySelector('.r3-pc.ready') || host.querySelector('.r3-prow.next');
    if (nx && nx.scrollIntoView) nx.scrollIntoView({ block: 'center' });
    each('[data-t]', function (b) {
      b.onclick = function () {
        var key = b.getAttribute('data-t'), m = key[0] === 'm', n = +(m ? key.slice(1) : key), w = (m ? MPASS : PASS)[n - 1];
        save(function (r2, s2) {
          if (r2.pass.got[key] || tierOf(r2.pass.pts) < n || (m && watchedN(s2) < n)) return;
          r2.pass.got[key] = 1;
          if (w.c) r2.wallet += w.c;
          if (w.k) r2.keys += w.k;
          if (w.h) r2.htok += w.h;
          if (w.t) r2.btok += w.t;
          if (w.x) r2.boxes += w.x;
          if (w.s && r2.owned.indexOf(w.s) < 0) r2.owned.push(w.s);
        });
        reward(rew(w)); passView();
      };
    });
  }

  /* --- misije --- */
  function missView() {
    var r = R(MM.Store.get());
    var body = '<p class="r3-note">Nove misije svaki dan. Svaka daje 50 novčića, 3 tokena junaka i 60 poena passa. Sve tri: +1 ključ i misteriozna kutija.</p><div class="r3-list">' +
      r.miss.list.map(function (m, i) {
        var done = m.p >= m.n, pct = Math.min(100, Math.round(m.p / m.n * 100));
        return '<div class="r3-row' + (m.got ? ' got' : done ? ' ready' : '') + '">' + ico('target', 'big') + '<div class="r3-rt"><b>' + esc(missText(m)) + '</b>' +
          '<div class="r3-bar"><i style="width:' + pct + '%"></i></div><span>' + fmt(Math.min(m.p, m.n)) + ' / ' + fmt(m.n) + '</span></div>' +
          (m.got ? '<em class="r3-ok">✓</em>' : done ? '<button type="button" class="r3-buy" data-m="' + i + '">Uzmi</button>' : '') + '</div>';
      }).join('') + '</div>';
    frame('miss', 'Misije', body);
    each('[data-m]', function (b) {
      b.onclick = function () {
        var i = +b.getAttribute('data-m'), key = false;
        save(function (r2) {
          var m = r2.miss.list[i]; if (!m || m.got || m.p < m.n) return;
          m.got = 1; r2.pass.pts += 60; r2.wallet += 50; r2.htok += 3;
          if (!r2.miss.all && r2.miss.list.every(function (x) { return x.got; })) { r2.miss.all = 1; r2.keys++; r2.boxes++; key = true; }
        });
        reward({ ic: 'target', t: 'Misija!', sub: '+50 novčića · +3 tokena' + (key ? ' · +1 ključ i kutija za sve tri' : '') }); missView();
      };
    });
  }

  /** Nagrada preko ekrana. */
  function reward(x, ms) {
    ms = ms || 1400;
    UI.buzz([15, 40, 25]);
    var el = document.createElement('div'); el.className = 'r3-rew';
    el.innerHTML = '<div>' + (x.board ? '<span class="r3-deck" style="--b1:' + x.board.c1 + ';--b2:' + x.board.c2 + '"></span>' : ico(x.ic, 'huge')) + '<b>' + esc(x.t) + '</b><span>' + esc(x.sub) + '</span></div>';
    (host && host.closest('.sheet') || document.body).appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, ms);
    setTimeout(function () { el.remove(); }, ms + 400);
  }

  /** Jednokratni poklon za stari napredak (mini igre i stari rekord). */
  function oldGift(s) {
    var best = (s.games && s.games.best) || {}, lv = 0;
    Object.keys(best).forEach(function (k) { if (k !== 'runner' && k !== '_v') lv += best[k] | 0; });
    var old = s.gameBest || {}; Object.keys(old).forEach(function (k) { if (!best[{ g0: 'classic', g1: 'doom', g2: 'stones', g3: 'quiz' }[k]]) lv += old[k] | 0; });
    return { coins: Math.min(5000, lv * 50 + Math.floor((best.runner | 0) / 20)), keys: lv ? 1 + Math.floor(lv / 10) : 0, htok: Math.min(60, lv * 2), lv: lv };
  }

  /* ---------------- trka ---------------- */
  function start(tutorial) {
    stopPreview();
    var s = MM.Store.get(), r = R(s), c = charOf(s), b = boardById(r.board);
    view = 'game';
    host.innerHTML = '<div class="r3-load"><img src="' + sprite(c) + '" alt=""><b>Učitavam…</b></div>';
    load3d().then(function () {
      if (!host) return;
      run = { c: c, revives: 0, ms: 0, msCoins: 0, tut: tutorial };
      var mul = runMul(s, r, c);
      host.innerHTML = '<div class="r3-game" id="r3G">' +
        '<div class="r3-hud"><div class="r3-sc"><b id="r3S">0</b><i id="r3M">×' + mul.toFixed(1) + '</i></div>' +
          '<span class="r3-cur">' + ico('coin') + '<b id="r3C">0</b></span>' +
          '<button type="button" class="r3-pause" id="r3P" aria-label="Pauza">' + SVG.pause + '</button></div>' +
        '<div class="r3-pws" id="r3W"></div>' +
        '<button type="button" class="r3-bd" id="r3B" aria-label="Hoverboard"><span class="r3-fill" id="r3BF"></span>' + ico('board') + '<em id="r3BT"></em></button>' +
        '<div class="r3-toast" id="r3T"></div>' +
        '<div class="r3-tip" id="r3Tip" hidden></div></div>';
      game = MM.Run3D.create(host.querySelector('#r3G'), {
        hero: c.id, mul: mul, coinMul: c.p.coin || 1, accel: c.p.accel || 1, pwRate: c.p.pwRate || 1, smash: !!c.p.smash,
        up: r.up, perk: c.p, board: { c1: b.c1, c2: b.c2, comic: b.comic }, boardPerk: b.pp, startShield: !!c.p.startShield, tutorial: tutorial,
        onHud: hud, onEvent: onEvent, onEnd: crashed, onHidden: pause
      });
      host.querySelector('#r3P').onclick = pause;
      host.querySelector('#r3B').onclick = function () { if (game) game.useBoard(); };
    }).catch(function () {
      if (!host) return;
      host.innerHTML = '<div class="r3-load"><b>Igra nije učitana</b><p class="muted">Prvi put treba internet.</p><button type="button" class="btn primary" id="r3Re">Probaj opet</button></div>';
      host.querySelector('#r3Re').onclick = home;
    });
  }

  // nagrade za daljinu u jednoj trci
  var MILES = [[500, 10], [1000, 25], [2000, 50], [3000, 80], [5000, 120], [7500, 200], [10000, 300], [15000, 500]];
  var PW_IC = { magnet: 'magnet', jet: 'hammer', x2: 'x2', jump: 'web' };
  function hud(h) {
    if (!host || !run) return;
    var q = function (id) { return host.querySelector(id); };
    var sc = q('#r3S'); if (!sc) return;
    sc.textContent = fmt(h.score); q('#r3C').textContent = fmt(h.coins);
    q('#r3M').textContent = '×' + h.mul.toFixed(1); q('#r3M').classList.toggle('hot', h.x2);
    var w = '';
    Object.keys(PW_IC).forEach(function (k) {
      var t = h.pw[k]; if (!(t > 0)) return;
      w += '<div>' + ico(PW_IC[k]) + '<i><s style="width:' + Math.round(t / h.max[k] * 100) + '%"></s></i></div>';
    });
    if (h.shield) w += '<div>' + ico('shield') + '<i><s style="width:100%"></s></i></div>';
    q('#r3W').innerHTML = w;
    var bd = q('#r3B');
    bd.classList.toggle('ready', h.meter >= 3 && !(h.board > 0)); bd.classList.toggle('active', h.board > 0);
    var fp = h.board > 0 ? h.board / h.max.board : h.meter / h.meterMax;
    q('#r3BF').style.height = Math.round(fp * 100) + '%';
    q('#r3BT').textContent = h.board > 0 ? Math.ceil(h.board) + ' s' : h.meter >= h.meterMax ? 'TAPNI' : h.meter + '/' + h.meterMax;
    while (run.ms < MILES.length && h.dist >= MILES[run.ms][0]) {
      run.msCoins += MILES[run.ms][1];
      flash(fmt(MILES[run.ms][0]) + ' m · +' + MILES[run.ms][1], 'coin');
      run.ms++;
    }
  }
  function flash(t, ic) {
    var el = host && host.querySelector('#r3T'); if (!el) return;
    el.innerHTML = (ic ? ico(ic) : '') + '<span>' + esc(t) + '</span>'; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
  var PW_TXT = { magnet: ['magnet', 'Magnet'], jet: ['hammer', 'Mjolnir let'], x2: ['x2', '×2 poeni'], jump: ['web', 'Spider skok'], shield: ['shield', 'Štit'] };
  var ARROW = { side: SVG.left + SVG.right, up: SVG.up, down: '<svg viewBox="0 0 24 24" style="transform:rotate(180deg)"><path d="M12 3 3 12h6v9h6v-9h6z"/></svg>' };
  function onEvent(n, x) {
    var tip = host && host.querySelector('#r3Tip');
    if (n === 'move') return;
    if (n === 'tip') {
      if (!tip) return;
      tip.hidden = false; tip.className = 'r3-tip ' + x.need;
      tip.innerHTML = (ARROW[x.need] ? '<span class="r3-arw">' + ARROW[x.need] + '</span>' : '') + '<b>' + esc(x.t) + '</b>';
      if (x.need === 'none') setTimeout(function () { if (tip) tip.hidden = true; }, 2600);
      return;
    }
    if (n === 'tipdone') { if (tip) tip.hidden = true; UI.buzz(8); return; }
    if (n.indexOf('pw:') === 0) { var p = PW_TXT[n.slice(3)]; if (p) flash(p[1], p[0]); UI.buzz(10); }
    else if (n === 'btok') { /* tiho: puni se dugme */ }
    else if (n === 'btokplus') { /* +2 s, vidi se na dugmetu */ }
    else if (n === 'boardready') {
      flash('Board spreman — tapni', 'board'); UI.buzz([10, 30, 10]);
      if (run.tut && tip) { tip.hidden = false; tip.className = 'r3-tip board'; tip.innerHTML = '<b>Tapni bilo gde na ekranu — hoverboard!</b>'; setTimeout(function () { if (tip) tip.hidden = true; }, 4000); }
    }
    else if (n === 'stumble') { flash('Doom je iza tebe!', 'mask'); UI.buzz([20, 30, 20]); }
    else if (n === 'shield') { flash('Štit te spasao!', 'shield'); UI.buzz(30); }
    else if (n === 'boardbreak') { flash('Board te spasao!', 'board'); UI.buzz(30); }
    else if (n === 'board') { if (tip) tip.hidden = true; flash('Hoverboard!', 'board'); UI.buzz(10); }
    else if (n === 'smash') { flash('Hulk smash!', 'bolt'); UI.buzz(30); }
    else if (n === 'crash') UI.buzz([40, 30, 80]);
  }
  function pause() {
    if (!game || !host || host.querySelector('.r3-over')) return;
    game.pause();
    var g = host.querySelector('#r3G'), o = document.createElement('div');
    o.className = 'r3-over'; o.innerHTML = '<div class="r3-box"><h2>Pauza</h2><button type="button" class="r3-go" id="r3Res">NASTAVI</button><button type="button" class="r3-ghost" id="r3Quit">Završi trku</button></div>';
    g.appendChild(o);
    o.querySelector('#r3Res').onclick = function () { o.remove(); game.resume(); };
    o.querySelector('#r3Quit').onclick = function () { o.remove(); var res = game.result(); res.why = 'Završio si trku'; game.stop(); game = null; finish(res); };
  }

  /** Pad: ponudi nastavak za kljuc (1, pa 2, pa 4), inace kraj. */
  function crashed(res) {
    if (!host || !game) return;
    var r = R(MM.Store.get()), free = (run.c.p.freeRevive && run.revives === 0) || run.tut;
    var cost = free ? 0 : Math.pow(2, run.revives);
    if (run.revives >= 3 || (!free && r.keys < cost)) { game.stop(); game = null; finish(res); return; }
    var g = host.querySelector('#r3G'), o = document.createElement('div');
    o.className = 'r3-over'; o.innerHTML = '<div class="r3-box"><h2>' + esc(res.why) + '</h2><p class="muted">' + fmt(res.score) + ' poena · ' + fmt(res.dist) + ' m</p>' +
      '<button type="button" class="r3-go" id="r3Rev">NASTAVI<span>' + (free ? (run.tut ? 'besplatno u tutorijalu' : 'besplatno (Deadpool)') : ico('key') + cost + ' · imaš ' + r.keys) + '</span></button>' +
      '<div class="r3-ring"><i></i></div><button type="button" class="r3-ghost" id="r3No">Ne, završi</button></div>';
    g.appendChild(o);
    var tm = setTimeout(no, 6000);
    function no() { clearTimeout(tm); o.remove(); if (game) { game.stop(); game = null; finish(res); } }
    o.querySelector('#r3No').onclick = no;
    o.querySelector('#r3Rev').onclick = function () {
      clearTimeout(tm);
      if (!free) save(function (r2) { r2.keys = Math.max(0, r2.keys - cost); });
      run.revives++; o.remove(); game.revive(); UI.buzz(20);
    };
  }

  function finish(res) {
    if (!host) return;
    view = 'end';
    var coinsWon = res.coins + run.msCoins, pts = Math.floor(res.dist / 12), before = 0, after = 0, done = [], st = res.stats;
    save(function (r) {
      before = tierOf(r.pass.pts);
      r.wallet += coinsWon; r.pass.pts += pts; r.runs++; r.distAll += res.dist; r.btok += st.btok || 0;
      if (run.tut && res.dist > 200) r.tut = 1;
      r.miss.list.forEach(function (m) {
        if (m.got || m.p >= m.n) return;
        if (m.id === 'dist1') m.p = Math.max(m.p, res.dist);
        else if (m.id === 'score1') m.p = Math.max(m.p, res.score);
        else m.p += ({ coins: res.coins, jumps: st.jumps, rolls: st.rolls, trains: st.trains, powerups: st.powerups, btok: st.btok, runs: 1 }[m.id]) || 0;
        if (m.p >= m.n) done.push(missText(m));
      });
      after = tierOf(r.pass.pts);
    });
    var gx = (onEnd ? onEnd({ score: res.score, coins: coinsWon, dist: res.dist }) : null) || {};
    var r2 = R(MM.Store.get()), t = tierOf(r2.pass.pts), into = r2.pass.pts - t * TIER;
    host.innerHTML = '<div class="r3-screen">' + top('Kraj trke') + '<div class="r3-body r3-end">' +
      '<span class="r3-why">' + esc(res.why || 'Kraj trke') + '</span>' +
      (gx.rec ? '<span class="r3-rec">' + ico('trophy') + 'NOVI REKORD</span>' : '') +
      '<h2 class="r3-big">' + fmt(res.score) + '</h2>' +
      '<div class="r3-sum"><div><b>' + fmt(res.dist) + ' m</b><span>pretrčano</span></div>' +
        '<div><b>' + ico('coin') + fmt(coinsWon) + '</b><span>novčića</span></div>' +
        '<div><b>' + ico('btoken') + fmt(st.btok || 0) + '</b><span>tokena</span></div>' +
        '<div><b>+' + (gx.xp || 0) + '</b><span>XP</span></div></div>' +
      '<div class="r3-phead">' + ico('ticket', 'big') + '<div><b>Marvel Pass +' + pts + ' · nivo ' + t + '</b>' +
        '<div class="r3-bar"><i style="width:' + (t >= TIERS ? 100 : Math.round(into / TIER * 100)) + '%"></i></div>' +
        '<span>' + (after > before ? (after - before > 1 ? (after - before) + ' nova nivoa' : 'Novi nivo') + ' — uzmi nagradu u Passu' : 'još ' + (TIER - into) + ' do nivoa ' + (t + 1)) + '</span></div></div>' +
      (done.length ? '<div class="r3-done">' + done.map(function (d) { return '<span>' + ico('target') + esc(d) + ' ✓</span>'; }).join('') + '</div>' : '') +
      '<button type="button" class="r3-go" id="r3Again">PONOVO</button>' +
      '<div class="r3-endnav"><button type="button" class="r3-ghost" data-v="home">Meni</button>' + (after > before ? '<button type="button" class="r3-ghost" data-v="pass">Pass</button>' : done.length ? '<button type="button" class="r3-ghost" data-v="miss">Misije</button>' : '') + '</div>' +
      '</div></div>';
    host.querySelector('#r3Again').onclick = function () { start(false); };
    wire();
    if (gx.up && MM.Games.levelUp) setTimeout(function () { MM.Games.levelUp(gx.lvl, gx.title); }, 500);
  }

  /** cb({score, coins, dist}) -> { xp, rec, up, lvl, title } */
  function open(cb) {
    onEnd = cb;
    UI.openSheet({
      id: 'games', full: true, cls: 'gm-sheet r3-sheet',
      render: function () { return '<div class="r3 no-drag" id="r3Box" data-keep></div>'; },
      onOpen: function (el) {
        host = el.querySelector('#r3Box');
        var s0 = MM.Store.get(), r0 = R(s0);
        if (!r0.gift) {
          var gf = oldGift(s0);
          save(function (r2) { r2.gift = 1; r2.wallet += gf.coins; r2.keys += gf.keys; r2.htok += gf.htok; });
          if (gf.coins || gf.keys) setTimeout(function () { reward({ ic: 'gift', t: '+' + fmt(gf.coins), sub: 'poklon za stari napredak · ' + gf.keys + ' ključ(a) · ' + gf.htok + ' tokena' }, 3200); }, 400);
        } else save(function () {});
        home();
      },
      onBack: function () { return back(); },
      onClose: function () { stopPreview(); if (game) game.stop(); game = null; host = null; }
    });
  }

  /** Za karticu u tabu Igre. */
  function summary(s) {
    var r = R(s), t = tierOf(r.pass.pts);
    return { tier: t, tiers: TIERS, pct: t >= TIERS ? 100 : Math.round((r.pass.pts - t * TIER) / TIER * 100), claim: claimable(r, s) + missReady(r), wallet: r.wallet };
  }

  MM.Runner = { _game: function () { return game; }, open: open, grant: grant, openBox: openBox, CHARS: CHARS, BOARDS: BOARDS, unlocked: unlocked, filmBonus: filmBonus, charOf: charOf, sprite: sprite, summary: summary, PASS: PASS, _R: R, load3d: load3d };
})();
