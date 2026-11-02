/* ============================================================
   runner.js  -  Marvel Runner: meni, likovi, moci, pass, misije
   ------------------------------------------------------------
   Sama igra (3D) je u run3d.js; Three.js se ucitava tek kad
   pritisnes "Trci" (js/vendor/three.min.js), pa app ostaje lagan.

   Progresija (s.runner):
     wallet   novcici za kupovinu (skupljas u trci)
     keys     kljucevi = nastavak posle pada
     boards   hoverboardovi (dupli tap u trci = 30 s zastite)
     up       nivoi moci (magnet, jet, x2, jump) 0..5
     pass     { pts, got: {tier: 1} }  -  Marvel Pass, 40 nivoa
     miss     { day, list: [{ id, n, p, got }] }  -  3 dnevne misije
     skin     izgled boarda; skins: otkljucani

   Likovi se otkljucavaju filmovima. Moci likova su male (+25% i
   slicno), da ne kvare igru.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI, esc = UI.esc;
  function fmt(n) { return (n || 0).toLocaleString('sr-RS'); }

  /* ---------------- likovi ---------------- */
  // p: mnozioci trajanja moci ili posebna sitnica; sve umereno
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
    { id: 'doom', name: 'Doctor Doom', film: 'avengers-doomsday', perk: '+10% poena i +10% novčića.', p: { score: 1.1, coin: 1.1 } }
  ];
  function sprite(c) { return 'img/run/' + c.id + '.webp'; }
  function unlocked(c, s) { return !c.film || MM.Plan.isDone(MM.Cat.get(c.film), s); }
  function charOf(s) {
    var c = CHARS.filter(function (x) { return x.id === s.runnerChar; })[0];
    return c && unlocked(c, s) ? c : CHARS[0];
  }
  /** Bonus od filmova: +0.5% poena po odgledanom naslovu, najvise ×1.5. */
  function filmBonus(s) {
    var n = Object.keys(MM.Badges.doneMap(s)).length;
    return { n: n, mul: Math.min(1.5, 1 + n / 200) };
  }

  /* ---------------- moci (kupuju se novcicima) ---------------- */
  var UPS = [
    { id: 'magnet', name: 'Magnet', ico: '🧲', col: '#ff3b30', desc: 'Privlači novčiće iz svih traka.', base: 10 },
    { id: 'jet', name: 'Mjolnir let', ico: '🔨', col: '#ffd23f', desc: 'Letiš iznad svega i kupiš novčiće u vazduhu.', base: 7 },
    { id: 'x2', name: '×2 poeni', ico: '✖️', col: '#39d97a', desc: 'Dupli poeni i novčići.', base: 12 },
    { id: 'jump', name: 'Spider skok', ico: '🕸️', col: '#c46bff', desc: 'Skačeš duplo više, pravo na vozove.', base: 10 }
  ];
  var UP_COST = [300, 700, 1500, 3000, 6000];
  function upDur(u, lvl) { return Math.round(u.base * (1 + .2 * (lvl || 0))); }

  /* ---------------- boardovi (izgled) ---------------- */
  var SKINS = [
    { id: 'klasik', name: 'Klasik', col: '#e62429', col2: '#ffd36b' },
    { id: 'mjolnir', name: 'Mjolnir', col: '#9aa7b8', col2: '#5fd3ff' },
    { id: 'vibra', name: 'Vibranijum', col: '#2a1d4a', col2: '#c46bff' },
    { id: 'gama', name: 'Gama', col: '#2f8f3a', col2: '#9dff6b' },
    { id: 'kosmik', name: 'Kosmik', col: '#1b3a8f', col2: '#ffd23f' },
    { id: 'stark', name: 'Stark', col: '#b3141b', col2: '#ffcf3f' },
    { id: 'doom', name: 'Doom', col: '#2e4a2e', col2: '#9dffbc' }
  ];

  /* ---------------- Marvel Pass ---------------- */
  var TIER = 150, TIERS = 40;
  // nagrada po nivou passa: c = novcici, k = kljucevi, b = boardovi, s = izgled boarda
  var PASS = (function () {
    var r = [], skins = { 3: 'mjolnir', 8: 'gama', 14: 'vibra', 20: 'kosmik', 28: 'stark', 40: 'doom' };
    for (var i = 1; i <= TIERS; i++) {
      if (skins[i]) r.push({ s: skins[i] });
      else if (i % 5 === 0) r.push({ k: i >= 20 ? 2 : 1 });
      else if (i % 3 === 0) r.push({ b: i >= 20 ? 2 : 1 });
      else r.push({ c: 100 + Math.floor(i / 5) * 50 });
    }
    return r;
  })();
  function rewTxt(w) {
    if (w.c) return { ico: '🪙', t: fmt(w.c), sub: 'novčića' };
    if (w.k) return { ico: '🔑', t: '×' + w.k, sub: w.k > 1 ? 'ključa' : 'ključ' };
    if (w.b) return { ico: '🛹', t: '×' + w.b, sub: 'board' };
    var sk = SKINS.filter(function (x) { return x.id === w.s; })[0];
    return { ico: '✨', t: sk.name, sub: 'izgled boarda', skin: sk };
  }

  /* ---------------- dnevne misije ---------------- */
  var MISS = [
    { id: 'coins', t: 'Skupi {n} novčića', n: [150, 220, 300] },
    { id: 'dist1', t: 'Pretrči {n} m u jednoj trci', n: [800, 1300, 2000] },
    { id: 'jumps', t: 'Skoči {n} puta', n: [25, 40, 60] },
    { id: 'rolls', t: 'Klizni {n} puta', n: [15, 25, 40] },
    { id: 'trains', t: 'Pretrči preko {n} vozova', n: [3, 6, 10] },
    { id: 'powerups', t: 'Uzmi {n} moći', n: [3, 5, 8] },
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
  function missText(m) { var d = MISS.filter(function (x) { return x.id === m.id; })[0]; return d.t.replace('{n}', fmt(m.n)); }

  /* ---------------- stanje progresije ---------------- */
  function R(s) {
    var r = s.runner && typeof s.runner === 'object' ? s.runner : {};
    return {
      wallet: r.wallet | 0, keys: r.keys == null ? 2 : r.keys | 0, boards: r.boards == null ? 3 : r.boards | 0,
      up: Object.assign({ magnet: 0, jet: 0, x2: 0, jump: 0 }, r.up || {}),
      pass: { pts: (r.pass && r.pass.pts) | 0, got: Object.assign({}, r.pass && r.pass.got) },
      miss: r.miss && r.miss.day === today() ? JSON.parse(JSON.stringify(r.miss)) : dayMissions(),
      skin: r.skin || 'klasik', skins: (r.skins || ['klasik']).slice(),
      runs: r.runs | 0, distAll: r.distAll | 0, gift: r.gift | 0
    };
  }
  function save(fn) { MM.Store.mutate(function (s) { var r = R(s); fn(r, s); s.runner = r; }); }
  function tierOf(pts) { return Math.min(TIERS, Math.floor(pts / TIER)); }
  function canClaim(r) {
    var t = tierOf(r.pass.pts), n = 0;
    for (var i = 1; i <= t; i++) if (!r.pass.got[i]) n++;
    r.miss.list.forEach(function (m) { if (m.p >= m.n && !m.got) n++; });
    return n;
  }

  /* ---------------- Three.js (lenjo) ---------------- */
  var threeP = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve();
    if (threeP) return threeP;
    threeP = new Promise(function (ok, no) {
      var sc = document.createElement('script');
      sc.src = 'js/vendor/three.min.js?v=149'; sc.onload = function () { ok(); }; sc.onerror = function () { threeP = null; no(new Error('three')); };
      document.head.appendChild(sc);
    });
    return threeP;
  }

  /* ---------------- ekrani ---------------- */
  var host = null, onEnd = null, game = null, run = null;
  function each(sel, fn) { Array.prototype.forEach.call(host.querySelectorAll(sel), fn); }

  function topBar(r) {
    var t = tierOf(r.pass.pts), into = r.pass.pts - t * TIER;
    return '<div class="r3-top">' +
      '<button type="button" class="r3-tier" data-v="pass"><b>' + t + '</b><span><i style="width:' + (t >= TIERS ? 100 : Math.round(into / TIER * 100)) + '%"></i></span><em>PASS</em></button>' +
      '<span class="r3-cur"><img src="img/run/coin.webp" alt="">' + fmt(r.wallet) + '</span>' +
      '<span class="r3-cur">🔑 ' + r.keys + '</span>' +
      '<button type="button" class="r3-x" data-a="sheet-close" aria-label="Zatvori">✕</button></div>';
  }

  /** Jednokratni poklon za stari napredak: svaki predjen nivo mini igara
      (i izbacenih) = 50 novcica, stari rekord u Runneru / 20, kljuc na 10 nivoa. */
  function oldGift(s) {
    var best = (s.games && s.games.best) || {}, lv = 0;
    Object.keys(best).forEach(function (k) { if (k !== 'runner' && k !== '_v') lv += best[k] | 0; });
    var old = s.gameBest || {}; Object.keys(old).forEach(function (k) { if (!best[{ g0: 'classic', g1: 'doom', g2: 'stones', g3: 'quiz' }[k]]) lv += old[k] | 0; });
    return { coins: Math.min(5000, lv * 50 + Math.floor((best.runner | 0) / 20)), keys: lv ? 1 + Math.floor(lv / 10) : 0, lv: lv };
  }
  function home() {
    var s0 = MM.Store.get();
    if (!R(s0).gift) {
      var gf = oldGift(s0);
      save(function (r2) { r2.gift = 1; r2.wallet += gf.coins; r2.keys += gf.keys; });
      if (gf.coins || gf.keys) setTimeout(function () { reward({ ico: '🎁', t: '+' + fmt(gf.coins) + ' · 🔑 ' + gf.keys, sub: 'poklon za stari napredak (' + gf.lv + ' pređenih nivoa)' }, 3200); }, 350);
    }
    var s = MM.Store.get(), r = R(s), c = charOf(s), fb = filmBonus(s), best = ((s.games || {}).best || {}).runner || 0;
    var un = CHARS.filter(function (x) { return unlocked(x, s); }), claim = canClaim(r);
    var sk = SKINS.filter(function (x) { return x.id === r.skin; })[0] || SKINS[0];
    host.innerHTML = '<div class="r3-home">' + topBar(r) +
      '<div class="r3-stage">' +
        '<div class="r3-sky"></div><div class="r3-rails"></div>' +
        '<button type="button" class="r3-arr l" data-sw="-1" aria-label="Prethodni lik"' + (un.length < 2 ? ' hidden' : '') + '>‹</button>' +
        '<div class="r3-hero"><img src="' + sprite(c) + '" alt=""><span class="r3-board" style="--b1:' + sk.col + ';--b2:' + sk.col2 + '"></span></div>' +
        '<button type="button" class="r3-arr r" data-sw="1" aria-label="Sledeći lik"' + (un.length < 2 ? ' hidden' : '') + '>›</button>' +
        '<div class="r3-name"><b>' + esc(c.name) + '</b><span>' + esc(c.perk) + '</span></div>' +
      '</div>' +
      '<div class="r3-chips"><span>🏆 <b>' + fmt(best) + '</b></span><span>✖ <b>' + fb.mul.toFixed(2) + '</b> od filmova</span><span>🛹 <b>' + r.boards + '</b></span></div>' +
      '<button type="button" class="r3-play" id="r3Go"><b>TRČI</b><span>do Doomsdaya</span></button>' +
      '<nav class="r3-nav">' +
        '<button type="button" data-v="chars"><i>🦸</i>Likovi<em>' + un.length + '/' + CHARS.length + '</em></button>' +
        '<button type="button" data-v="shop"><i>⚡</i>Moći</button>' +
        '<button type="button" data-v="pass"><i>🎟️</i>Pass' + (claim ? '<u>' + claim + '</u>' : '') + '</button>' +
        '<button type="button" data-v="miss"><i>🎯</i>Misije<em>' + r.miss.list.filter(function (m) { return m.p >= m.n; }).length + '/3</em></button>' +
      '</nav>' +
      '<p class="r3-help">Prevuci ← → traka · ↑ skok · ↓ klizanje · dupli tap = hoverboard</p></div>';
    host.querySelector('#r3Go').onclick = start;
    each('[data-sw]', function (b) {
      b.onclick = function () {
        var i = un.indexOf(c), n = un[(i + +b.getAttribute('data-sw') + un.length) % un.length];
        MM.Store.mutate(function (st) { st.runnerChar = n.id; }); UI.buzz(6); home();
      };
    });
    wireNav();
  }

  function wireNav() {
    each('[data-v]', function (b) {
      b.onclick = function () { UI.buzz(5); ({ pass: passView, chars: charsView, shop: shopView, miss: missView, home: home })[b.getAttribute('data-v')](); };
    });
  }
  function sub(title, body) {
    var r = R(MM.Store.get());
    host.innerHTML = '<div class="r3-sub">' + topBar(r) +
      '<div class="r3-sh"><button type="button" class="r3-back" data-v="home">‹ Nazad</button><h2>' + title + '</h2></div><div class="r3-scroll">' + body + '</div></div>';
    wireNav();
  }

  function charsView() {
    var s = MM.Store.get(), c = charOf(s);
    sub('Likovi', '<p class="r3-note">Likove otključavaš gledanjem filmova. Svaki odgledan naslov daje i +0,5% poena (do ×1,5).</p><div class="r3-chars">' +
      CHARS.map(function (x) {
        var on = unlocked(x, s), f = x.film && MM.Cat.get(x.film);
        return '<button type="button" class="r3-c' + (on ? '' : ' locked') + (x.id === c.id ? ' sel' : '') + '" data-c="' + x.id + '">' +
          '<span class="r3-cimg"><img src="' + sprite(x) + '" alt="" loading="lazy"></span><b>' + esc(x.name) + '</b>' +
          '<i>' + esc(on ? x.perk : '🔒 Odgledaj „' + MM.Cat.cleanTitle(f) + '“') + '</i></button>';
      }).join('') + '</div>');
    each('.r3-c', function (b) {
      b.onclick = function () {
        var x = CHARS.filter(function (y) { return y.id === b.getAttribute('data-c'); })[0];
        if (!unlocked(x, MM.Store.get())) { UI.buzz([20, 40, 20]); UI.toast('🔒 Otključava se kad odgledaš „' + MM.Cat.cleanTitle(MM.Cat.get(x.film)) + '“.'); return; }
        MM.Store.mutate(function (st) { st.runnerChar = x.id; }); UI.buzz(6); charsView();
      };
    });
  }

  function shopView() {
    var r = R(MM.Store.get());
    var body = '<p class="r3-note">Moći pokupiš u trci. Svaki nivo = +20% trajanja.</p><div class="r3-ups">' +
      UPS.map(function (u) {
        var l = r.up[u.id] || 0, cost = UP_COST[l];
        return '<div class="r3-up" style="--c:' + u.col + '"><span class="r3-uico">' + u.ico + '</span><div class="r3-ut"><b>' + esc(u.name) + '</b><i>' + esc(u.desc) + '</i>' +
          '<div class="r3-pips">' + [0, 1, 2, 3, 4].map(function (k) { return '<s class="' + (k < l ? 'on' : '') + '"></s>'; }).join('') + '<em>' + upDur(u, l) + ' s</em></div></div>' +
          (l >= 5 ? '<span class="r3-max">MAX</span>' : '<button type="button" class="r3-buy" data-u="' + u.id + '"' + (r.wallet < cost ? ' disabled' : '') + '><img src="img/run/coin.webp" alt="">' + fmt(cost) + '</button>') + '</div>';
      }).join('') +
      '<div class="r3-up" style="--c:#5fd3ff"><span class="r3-uico">🛹</span><div class="r3-ut"><b>Hoverboard</b><i>Dupli tap u trci: 30 s te jedan udarac ne obara. Imaš ' + r.boards + '.</i></div>' +
        '<button type="button" class="r3-buy" data-u="board"' + (r.wallet < 400 ? ' disabled' : '') + '><img src="img/run/coin.webp" alt="">400</button></div>' +
      '<div class="r3-up" style="--c:#ffd36b"><span class="r3-uico">🔑</span><div class="r3-ut"><b>Ključ</b><i>Nastavak posle pada. Imaš ' + r.keys + '.</i></div>' +
        '<button type="button" class="r3-buy" data-u="key"' + (r.wallet < 1000 ? ' disabled' : '') + '><img src="img/run/coin.webp" alt="">1.000</button></div></div>' +
      '<h3 class="r3-h3">Izgled boarda</h3><div class="r3-skins">' + SKINS.map(function (k) {
        var own = r.skins.indexOf(k.id) >= 0, tier = PASS.map(function (w, i) { return w.s === k.id ? i + 1 : 0; }).filter(Boolean)[0];
        return '<button type="button" class="r3-skin' + (own ? '' : ' locked') + (r.skin === k.id ? ' sel' : '') + '" data-sk="' + k.id + '" style="--b1:' + k.col + ';--b2:' + k.col2 + '"><span></span><b>' + esc(k.name) + '</b><i>' + (own ? (r.skin === k.id ? 'izabran' : 'izaberi') : 'Pass nivo ' + tier) + '</i></button>';
      }).join('') + '</div>';
    sub('Moći', body);
    each('.r3-buy', function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-u'), ok = false;
        save(function (r2) {
          if (id === 'board') { if (r2.wallet >= 400) { r2.wallet -= 400; r2.boards++; ok = true; } }
          else if (id === 'key') { if (r2.wallet >= 1000) { r2.wallet -= 1000; r2.keys++; ok = true; } }
          else { var l = r2.up[id] || 0; if (l < 5 && r2.wallet >= UP_COST[l]) { r2.wallet -= UP_COST[l]; r2.up[id] = l + 1; ok = true; } }
        });
        if (ok) { UI.buzz([10, 30, 10]); shopView(); }
      };
    });
    each('.r3-skin', function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-sk');
        if (R(MM.Store.get()).skins.indexOf(id) < 0) { UI.toast('🔒 Otključava se u Passu.'); return; }
        save(function (r2) { r2.skin = id; }); UI.buzz(6); shopView();
      };
    });
  }

  function passView() {
    var r = R(MM.Store.get()), t = tierOf(r.pass.pts), into = r.pass.pts - t * TIER;
    var body = '<div class="r3-ph"><div class="r3-pbig"><b>' + t + '</b><i>/ ' + TIERS + '</i></div><div><b>Marvel Pass</b>' +
      '<span>' + (t >= TIERS ? 'Sve otključano. Legenda.' : 'još ' + (TIER - into) + ' poena do nivoa ' + (t + 1)) + '</span>' +
      '<div class="r3-pbar"><i style="width:' + (t >= TIERS ? 100 : Math.round(into / TIER * 100)) + '%"></i></div>' +
      '<em>8 m trčanja = 1 poen · misija = +100</em></div></div><div class="r3-track">' +
      PASS.map(function (w, i) {
        var n = i + 1, x = rewTxt(w), got = r.pass.got[n], ready = n <= t && !got;
        return '<button type="button" class="r3-tile' + (got ? ' got' : ready ? ' ready' : n === t + 1 ? ' next' : '') + (x.skin ? ' skin' : '') + '" data-t="' + n + '"' +
          (x.skin ? ' style="--b1:' + x.skin.col + ';--b2:' + x.skin.col2 + '"' : '') + '>' +
          '<span class="r3-tn">' + n + '</span><span class="r3-ti">' + (x.skin ? '<s class="r3-mini"></s>' : x.ico) + '</span><b>' + esc(x.t) + '</b><i>' + esc(got ? '✓ uzeto' : ready ? 'UZMI' : x.sub) + '</i></button>';
      }).join('') + '</div>';
    sub('Pass', body);
    var nx = host.querySelector('.r3-tile.ready') || host.querySelector('.r3-tile.next');
    if (nx && nx.scrollIntoView) nx.scrollIntoView({ block: 'center' });
    each('.r3-tile.ready', function (b) {
      b.onclick = function () {
        var n = +b.getAttribute('data-t'), w = PASS[n - 1];
        save(function (r2) {
          if (r2.pass.got[n] || tierOf(r2.pass.pts) < n) return;
          r2.pass.got[n] = 1;
          if (w.c) r2.wallet += w.c;
          if (w.k) r2.keys += w.k;
          if (w.b) r2.boards += w.b;
          if (w.s && r2.skins.indexOf(w.s) < 0) r2.skins.push(w.s);
        });
        reward(rewTxt(w)); passView();
      };
    });
  }

  function missView() {
    var r = R(MM.Store.get());
    var body = '<p class="r3-note">Nove misije svaki dan. Svaka: +100 poena passa i 100 novčića. Sve tri: +1 🔑.</p><div class="r3-miss">' +
      r.miss.list.map(function (m, i) {
        var done = m.p >= m.n, pct = Math.min(100, Math.round(m.p / m.n * 100));
        return '<div class="r3-m' + (m.got ? ' got' : done ? ' ready' : '') + '"><span class="r3-mn">' + (m.got ? '✓' : i + 1) + '</span><div><b>' + esc(missText(m)) + '</b>' +
          '<div class="r3-pbar"><i style="width:' + pct + '%"></i></div><em>' + fmt(Math.min(m.p, m.n)) + ' / ' + fmt(m.n) + '</em></div>' +
          (done && !m.got ? '<button type="button" class="r3-buy" data-m="' + i + '">Uzmi</button>' : '') + '</div>';
      }).join('') + '</div>';
    sub('Misije', body);
    each('[data-m]', function (b) {
      b.onclick = function () {
        var i = +b.getAttribute('data-m'), key = false;
        save(function (r2) {
          var m = r2.miss.list[i]; if (!m || m.got || m.p < m.n) return;
          m.got = 1; r2.pass.pts += 100; r2.wallet += 100;
          if (!r2.miss.all && r2.miss.list.every(function (x) { return x.got; })) { r2.miss.all = 1; r2.keys++; key = true; }
        });
        reward({ ico: '🎯', t: '+100', sub: 'poena passa i 100 novčića' + (key ? ' · +1 🔑 za sve tri!' : '') }); missView();
      };
    });
  }

  /** Mala animacija nagrade preko ekrana. */
  function reward(x, ms) {
    ms = ms || 1300;
    UI.buzz([15, 40, 25]);
    var el = document.createElement('div'); el.className = 'r3-rew';
    el.innerHTML = '<div><span>' + (x.skin ? '<s class="r3-mini" style="--b1:' + x.skin.col + ';--b2:' + x.skin.col2 + '"></s>' : x.ico) + '</span><b>' + esc(x.t) + '</b><i>' + esc(x.sub) + '</i></div>';
    (host && host.closest('.sheet') || document.body).appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, ms);
    setTimeout(function () { el.remove(); }, ms + 400);
  }

  /* ---------------- trka ---------------- */
  function start() {
    var s = MM.Store.get(), r = R(s), c = charOf(s), fb = filmBonus(s);
    var sk = SKINS.filter(function (x) { return x.id === r.skin; })[0] || SKINS[0];
    host.innerHTML = '<div class="r3-load"><img src="' + sprite(c) + '" alt=""><b>Učitavam…</b></div>';
    loadThree().then(function () {
      if (!host) return;
      run = { c: c, usedBoards: 0, revives: 0, ms: 0, msCoins: 0 };
      host.innerHTML = '<div class="r3-game" id="r3G">' +
        '<div class="r3-hud"><div class="r3-sc"><b id="r3S">0</b><i id="r3M">×' + (fb.mul * (c.p.score || 1)).toFixed(1) + '</i></div>' +
          '<span class="r3-coin"><img src="img/run/coin.webp" alt=""><b id="r3C">0</b></span>' +
          '<button type="button" class="r3-pause" id="r3P" aria-label="Pauza">❚❚</button></div>' +
        '<div class="r3-pws" id="r3W"></div>' +
        '<button type="button" class="r3-bd" id="r3B"' + (r.boards ? '' : ' hidden') + '>🛹<b id="r3BN">' + r.boards + '</b></button>' +
        '<div class="r3-toast" id="r3T"></div>' +
        '<div class="r3-tip" id="r3Tip">Prevuci ← → ↑ ↓</div></div>';
      var g = host.querySelector('#r3G');
      game = MM.Run3D.create(g, {
        hero: c.id, mul: fb.mul * (c.p.score || 1), coinMul: c.p.coin || 1, accel: c.p.accel || 1, pwRate: c.p.pwRate || 1, smash: !!c.p.smash,
        up: r.up, perk: c.p, board: { c1: sk.col, c2: sk.col2 }, boards: r.boards,
        onHud: hud, onEvent: onEvent, onEnd: crashed, onHidden: pause
      });
      host.querySelector('#r3P').onclick = pause;
      host.querySelector('#r3B').onclick = function () { if (game) game.useBoard(); };
    }).catch(function () {
      if (!host) return;
      host.innerHTML = '<div class="gm-end"><div class="gm-emo">📡</div><h2>Igra nije učitana</h2><p class="muted">Prvi put treba internet.</p><button type="button" class="btn primary wide" id="r3Re">Probaj opet</button></div>';
      host.querySelector('#r3Re').onclick = home;
    });
  }

  // nagrade za daljinu u jednoj trci
  var MILES = [[500, 25], [1000, 50], [2000, 100], [3000, 150], [5000, 250], [7500, 400], [10000, 600], [15000, 1000]];
  function hud(h) {
    if (!host) return;
    var q = function (id) { return host.querySelector(id); };
    var sc = q('#r3S'); if (!sc) return;
    sc.textContent = fmt(h.score); q('#r3C').textContent = fmt(h.coins);
    q('#r3M').textContent = '×' + h.mul.toFixed(1);
    q('#r3M').classList.toggle('hot', h.x2);
    var w = '';
    UPS.forEach(function (u) {
      var t = h.pw[u.id]; if (!(t > 0)) return;
      w += '<div style="--c:' + u.col + '"><span>' + u.ico + '</span><i><s style="width:' + Math.round(t / h.max[u.id] * 100) + '%"></s></i></div>';
    });
    if (h.board > 0) w += '<div style="--c:#5fd3ff"><span>🛹</span><i><s style="width:' + Math.round(h.board / h.max.board * 100) + '%"></s></i></div>';
    if (h.shield) w += '<div style="--c:#5fd3ff"><span>🛡️</span><i><s style="width:100%"></s></i></div>';
    q('#r3W').innerHTML = w;
    var bd = q('#r3B'); if (bd) { bd.hidden = !(h.boardsLeft > 0) || h.board > 0; q('#r3BN').textContent = h.boardsLeft; }
    while (run && run.ms < MILES.length && h.dist >= MILES[run.ms][0]) {
      run.msCoins += MILES[run.ms][1];
      flash('🎁 ' + fmt(MILES[run.ms][0]) + ' m · +' + MILES[run.ms][1] + ' novčića');
      run.ms++;
    }
  }
  function flash(t) {
    var el = host && host.querySelector('#r3T'); if (!el) return;
    el.textContent = t; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
  var PW_TXT = { magnet: '🧲 MAGNET', jet: '🔨 MJOLNIR LET', x2: '✖ ×2 POENI', jump: '🕸️ SPIDER SKOK', shield: '🛡️ ŠTIT' };
  function onEvent(n) {
    if (n === 'move') { var tip = host && host.querySelector('#r3Tip'); if (tip) tip.remove(); return; }
    if (n.indexOf('pw:') === 0) { flash(PW_TXT[n.slice(3)] || ''); UI.buzz(10); }
    else if (n === 'stumble') { flash('⚠️ Doom je iza tebe!'); UI.buzz([20, 30, 20]); }
    else if (n === 'shield') { flash('🛡️ Štit te spasao!'); UI.buzz(30); }
    else if (n === 'boardbreak') { flash('🛹 Board te spasao!'); UI.buzz(30); }
    else if (n === 'board') { run.usedBoards++; flash('🛹 HOVERBOARD'); UI.buzz(10); }
    else if (n === 'smash') { flash('👊 HULK SMASH!'); UI.buzz(30); }
    else if (n === 'crash') UI.buzz([40, 30, 80]);
  }
  function pause() {
    if (!game || host.querySelector('.r3-over')) return;
    game.pause();
    var g = host.querySelector('#r3G'), o = document.createElement('div');
    o.className = 'r3-over'; o.innerHTML = '<div class="r3-box"><h2>Pauza</h2><button type="button" class="r3-play sm" id="r3Res"><b>NASTAVI</b></button><button type="button" class="btn ghost wide" id="r3Quit">Završi trku</button></div>';
    g.appendChild(o);
    o.querySelector('#r3Res').onclick = function () { o.remove(); game.resume(); };
    o.querySelector('#r3Quit').onclick = function () { o.remove(); var res = game.result(); res.why = 'Završio si trku'; game.stop(); game = null; finish(res); };
  }

  /** Pad: ponudi nastavak za kljuc (1, pa 2, pa 4), inace kraj. */
  function crashed(res) {
    if (!host || !game) return;
    var r = R(MM.Store.get()), free = run.c.p.freeRevive && run.revives === 0;
    var cost = free ? 0 : Math.pow(2, run.revives);
    if (run.revives >= 3 || (!free && r.keys < cost)) { game.stop(); game = null; finish(res); return; }
    var g = host.querySelector('#r3G'), o = document.createElement('div');
    o.className = 'r3-over'; o.innerHTML = '<div class="r3-box"><h2>' + esc(res.why) + '</h2><p class="muted">' + fmt(res.score) + ' poena · ' + fmt(res.dist) + ' m</p>' +
      '<button type="button" class="r3-play sm" id="r3Rev"><b>NASTAVI</b><span>' + (free ? 'besplatno (Deadpool)' : '🔑 ' + cost + ' · imaš ' + r.keys) + '</span></button>' +
      '<div class="r3-ring"><i></i></div><button type="button" class="btn ghost wide" id="r3No">Ne, završi</button></div>';
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
    var coinsWon = res.coins + run.msCoins, pts = Math.floor(res.dist / 8), before = 0, after = 0, done = [];
    save(function (r) {
      before = tierOf(r.pass.pts);
      r.wallet += coinsWon; r.pass.pts += pts; r.runs++; r.distAll += res.dist;
      r.boards = Math.max(0, r.boards - run.usedBoards);
      var st = res.stats;
      r.miss.list.forEach(function (m) {
        if (m.got || m.p >= m.n) return;
        if (m.id === 'dist1') m.p = Math.max(m.p, res.dist);
        else if (m.id === 'score1') m.p = Math.max(m.p, res.score);
        else m.p += ({ coins: res.coins, jumps: st.jumps, rolls: st.rolls, trains: st.trains, powerups: st.powerups, runs: 1 }[m.id]) || 0;
        if (m.p >= m.n) done.push(missText(m));
      });
      after = tierOf(r.pass.pts);
    });
    var gx = (onEnd ? onEnd({ score: res.score, coins: coinsWon, dist: res.dist }) : null) || {};
    var r2 = R(MM.Store.get()), t = tierOf(r2.pass.pts), into = r2.pass.pts - t * TIER;
    host.innerHTML = '<div class="r3-end">' +
      '<em class="r3-why">' + esc(res.why || 'Kraj trke') + '</em>' +
      (gx.rec ? '<div class="r3-rec">NOVI REKORD!</div>' : '') +
      '<h2 class="r3-big">' + fmt(res.score) + '</h2>' +
      '<div class="r3-row"><div><b>' + fmt(res.dist) + ' m</b><i>pretrčano</i></div><div><b><img src="img/run/coin.webp" alt="">' + fmt(coinsWon) + '</b><i>novčića' + (run.msCoins ? ' (+' + run.msCoins + ' bonus)' : '') + '</i></div><div><b>+' + (gx.xp || 0) + '</b><i>XP</i></div></div>' +
      '<div class="r3-pcard"><div class="r3-pbig sm"><b>' + t + '</b></div><div><b>Marvel Pass +' + pts + '</b>' +
        '<div class="r3-pbar"><i style="width:' + (t >= TIERS ? 100 : Math.round(into / TIER * 100)) + '%"></i></div>' +
        '<em>' + (after > before ? '🎉 ' + (after - before > 1 ? (after - before) + ' nova nivoa' : 'Novi nivo') + ' — uzmi nagradu!' : 'još ' + (TIER - into) + ' do nivoa ' + (t + 1)) + '</em></div></div>' +
      (done.length ? '<div class="r3-done">' + done.map(function (d) { return '<span>🎯 ' + esc(d) + ' ✓</span>'; }).join('') + '</div>' : '') +
      '<button type="button" class="r3-play" id="r3Again"><b>PONOVO</b></button>' +
      '<div class="r3-endnav"><button type="button" class="btn ghost" data-v="home">Meni</button>' + (after > before || done.length ? '<button type="button" class="btn ghost" data-v="' + (after > before ? 'pass' : 'miss') + '">Nagrade</button>' : '') + '</div></div>';
    host.querySelector('#r3Again').onclick = start;
    wireNav();
    if (gx.up && MM.Games.levelUp) setTimeout(function () { MM.Games.levelUp(gx.lvl, gx.title); }, 500);
  }

  /** cb({score, coins, dist}) -> { xp, rec, up, lvl, title } */
  function open(cb) {
    onEnd = cb;
    UI.openSheet({
      id: 'games', full: true, cls: 'gm-sheet r3-sheet',
      render: function () { return '<div class="r3 no-drag" id="r3Box" data-keep></div>'; },
      onOpen: function (el) { host = el.querySelector('#r3Box'); home(); },
      onClose: function () { if (game) game.stop(); game = null; host = null; }
    });
  }

  /** Za karticu u tabu Igre. */
  function summary(s) {
    var r = R(s), t = tierOf(r.pass.pts);
    return { tier: t, tiers: TIERS, pct: t >= TIERS ? 100 : Math.round((r.pass.pts - t * TIER) / TIER * 100), claim: canClaim(r), wallet: r.wallet };
  }

  MM.Runner = { _game: function () { return game; }, open: open, CHARS: CHARS, unlocked: unlocked, filmBonus: filmBonus, charOf: charOf, sprite: sprite, summary: summary, PASS: PASS, _R: R, loadThree: loadThree };
})();
