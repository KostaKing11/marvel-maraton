/* ============================================================
   sfx.js  -  zvukovi i muzika
   ------------------------------------------------------------
   Sve ide kroz Web Audio (bez kasnjenja, zvukovi se preklapaju).
   Fajlovi su u audio/ (napravljeni sintezom, nasi su). Muzika se
   vrti u krug bez pauze: fajl ima komad kraja na pocetku i komad
   pocetka na kraju, a loopStart/loopEnd gadjaju pravu petlju.

   Podesavanja (state): sound (zvukovi), music (muzika). Oba su
   ukljucena dok ih neko ne iskljuci u "Ja".
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var BASE = 'audio/';
  var V = 1;   // podigni kad se zvukovi promene
  var VOL = {
    tap: .22, tab: .2, open: .32, close: .26, toggle: .3, check: .55, win: .62, reward: .5, coin: .2,
    ok: .5, bad: .45, tick: .32, go: .5, lose: .45, levelup: .6, box: .65,
    jump: .3, roll: .32, lane: .2, land: .22, crash: .75, power: .5, board: .5, token: .35,
    count: .45, start: .5, revive: .55, whoosh: .45, boom: .75
  };
  var MUS = {
    menu: { f: 'music/menu.mp3', len: 41.73914, g: .55 },
    run: { f: 'music/run.mp3', len: 60, g: .62 },
    battle: { f: 'music/battle.mp3', len: 54.85714, g: .62 },
    finale: { f: 'music/finale.mp3', len: 76.8, g: .85 }
  };
  var LEAD = 0.5;
  var EAGER = ['tap', 'tab', 'open', 'close', 'toggle', 'check', 'ok', 'bad'];

  var ctx = null, out = null, sfxBus = null, musBus = null;
  var bufs = {}, loading = {}, lastAt = {};
  var cur = null, curName = '', want = '', ducked = false;

  function st() { return (MM.Store && MM.Store.get()) || {}; }
  function soundOn() { return st().sound !== false; }
  function musicOn() { return st().music !== false; }

  function init() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { ctx = new AC(); } catch (e2) { return null; } }
    out = ctx.createDynamicsCompressor();
    out.threshold.value = -10; out.knee.value = 8; out.ratio.value = 4; out.attack.value = .003; out.release.value = .2;
    out.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.connect(out);
    musBus = ctx.createGain(); musBus.gain.value = 0; musBus.connect(out);
    EAGER.forEach(load);
    return ctx;
  }

  /** Prvi dodir otkljucava zvuk (iOS/Chrome to traze). */
  function unlock() {
    if (!init()) return;
    var go = function () { if (want && !cur) music(want); };
    if (ctx.state === 'suspended' && !document.hidden) ctx.resume().then(go).catch(function () {});
    else go();
  }
  ['pointerdown', 'touchend', 'keydown'].forEach(function (ev) { document.addEventListener(ev, unlock, { capture: true, passive: true }); });
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(function () {});
    else ctx.resume().catch(function () {});
  });

  function load(name) {
    if (!ctx || bufs[name] || loading[name]) return loading[name] || Promise.resolve(bufs[name]);
    var url = BASE + (MUS[name] ? MUS[name].f : 'sfx/' + name + '.mp3') + '?a=' + V;
    loading[name] = fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (ab) { return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); }); })
      .then(function (b) { bufs[name] = b; delete loading[name]; return b; })
      .catch(function () { delete loading[name]; return null; });
    return loading[name];
  }
  function preload(list) { if (init()) (list || []).forEach(load); }

  /** Pusti zvuk. opts: { vol, rate } */
  function play(name, opts) {
    if (!soundOn() || !VOL[name]) return;
    if (!init() || ctx.state !== 'running') return;
    var now = ctx.currentTime;
    if (lastAt[name] && now - lastAt[name] < (name === 'coin' ? .045 : .03)) return;
    var b = bufs[name];
    if (!b) { load(name); return; }
    lastAt[name] = now;
    var src = ctx.createBufferSource(); src.buffer = b;
    src.playbackRate.value = (opts && opts.rate) || (name === 'coin' || name === 'lane' || name === 'tap' ? 0.97 + Math.random() * .06 : 1);
    var g = ctx.createGain(); g.gain.value = VOL[name] * ((opts && opts.vol) || 1);
    src.connect(g); g.connect(sfxBus);
    src.start(now);
  }

  function musLevel() { return ducked ? .28 : 1; }

  /** Muzika: ime iz MUS ili null (tisina). Menja se sa pretapanjem. */
  function music(name) {
    want = name || '';
    if (!init()) return;
    if (!name || !musicOn()) { fadeOut(); return; }
    if (curName === name && cur) { setVol(); return; }
    if (ctx.state !== 'running') return;   // krece na prvi dodir (unlock)
    load(name).then(function (b) {
      if (!b || want !== name || (curName === name && cur)) return;
      fadeOut();
      var m = MUS[name], src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = b; src.loop = true;
      src.loopStart = LEAD; src.loopEnd = Math.min(b.duration, LEAD + m.len);
      g.gain.value = 0; src.connect(g); g.connect(musBus);
      var t = ctx.currentTime;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(m.g, t + .8);
      src.start(t, LEAD);
      cur = { src: src, g: g }; curName = name;
      setVol();
    });
  }
  function fadeOut() {
    if (!cur || !ctx) { cur = null; curName = ''; return; }
    var c = cur, t = ctx.currentTime;
    try { c.g.gain.cancelScheduledValues(t); c.g.gain.setValueAtTime(c.g.gain.value, t); c.g.gain.linearRampToValueAtTime(0, t + .6); c.src.stop(t + .7); } catch (e) { /* vec stao */ }
    cur = null; curName = '';
  }
  function setVol() {
    if (!musBus) return;
    var t = ctx.currentTime, v = musicOn() ? musLevel() : 0;
    musBus.gain.cancelScheduledValues(t); musBus.gain.setValueAtTime(musBus.gain.value, t); musBus.gain.linearRampToValueAtTime(v, t + .35);
  }
  function duck(on) { ducked = !!on; if (ctx) setVol(); }

  /** Posle promene podesavanja. */
  function refresh() {
    if (!ctx) return;
    if (!musicOn()) fadeOut(); else if (want && !cur) music(want);
    setVol();
  }

  /* --- zvuk na dodir: dugmici u aplikaciji (ne u samoj trci) --- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button, [data-a], a[href]');
    if (!b || b.disabled || b.hasAttribute('data-nosfx') || b.closest('[data-nosfx], #r3G, .qz-opts')) return;
    if (b.closest('.tabs, .tabbar, nav')) play('tab');
    else if (b.classList.contains('tgl') || b.getAttribute('role') === 'switch') play('toggle');
    else play('tap');
  }, true);

  MM.Sfx = { play: play, music: music, duck: duck, preload: preload, refresh: refresh, unlock: unlock, current: function () { return curName; } };
})();
