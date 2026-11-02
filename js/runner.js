/* ============================================================
   runner.js  -  Marvel Runner (kao Subway Surfers)
   ------------------------------------------------------------
   Tri trake, beskonacno trcanje ka Doomsdayu. Prevuci levo/desno
   (traka), gore (skok), dole (klizanje). Strelice rade na tastaturi.
   Prepreke: niska barijera (skoci), greda (klizni), voz (promeni
   traku). Novcici = poeni.

   Likovi se otkljucavaju odgledanim filmovima i svaki ima moc.
   Svaki odgledan naslov daje +1% poena (do x2).
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI, esc = UI.esc;

  /* ---------------- likovi ---------------- */
  // film: naslov koji ga otkljucava; icon: predmet iz tog filma (slicica)
  var CHARS = [
    { id: 'agent', name: 'Agent S.H.I.E.L.D.-a', film: null, icon: 'agents-of-shield-s1', perk: 'Bez moći. Čist talenat.' },
    { id: 'iron', name: 'Iron Man', film: 'iron-man', icon: 'iron-man', perk: 'Magnet: kupi novčiće iz susednih traka.' },
    { id: 'cap', name: 'Captain America', film: 'captain-america-first-avenger', icon: 'captain-america-first-avenger', perk: 'Štit: preživi 1 udarac.' },
    { id: 'thor', name: 'Thor', film: 'thor', icon: 'thor', perk: 'Bifrost: kreće sa 300 m prednosti.' },
    { id: 'hulk', name: 'Hulk', film: 'incredible-hulk', icon: 'incredible-hulk', perk: 'Smash: razbija niske barijere.' },
    { id: 'widow', name: 'Black Widow', film: 'black-widow', icon: 'black-widow', perk: 'Akrobata: duži skok i klizanje.' },
    { id: 'spidey', name: 'Spider-Man', film: 'spider-man-homecoming', icon: 'spider-man-homecoming', perk: 'Mreža: skok preskače i vozove.' },
    { id: 'panther', name: 'Black Panther', film: 'black-panther', icon: 'black-panther', perk: 'Vibranijum: 2 štita.' },
    { id: 'strange', name: 'Doctor Strange', film: 'doctor-strange', icon: 'doctor-strange', perk: 'Vreme: brzina raste sporije.' },
    { id: 'ant', name: 'Ant-Man', film: 'ant-man', icon: 'ant-man', perk: 'Mali: prolazi ispod greda bez klizanja.' },
    { id: 'marvel', name: 'Captain Marvel', film: 'captain-marvel', icon: 'captain-marvel', perk: 'Dupli novčići.' },
    { id: 'deadpool', name: 'Deadpool', film: 'deadpool', icon: 'deadpool', perk: 'Regeneracija: štit se vrati posle 20 s.' },
    { id: 'doom', name: 'Doctor Doom', film: 'avengers-doomsday', icon: 'avengers-doomsday', perk: 'Sve: štit, magnet i ×1.5 poeni.' }
  ];

  function unlocked(c, s) { return !c.film || MM.Plan.isDone(MM.Cat.get(c.film), s); }
  function charOf(s) {
    var c = CHARS.filter(function (x) { return x.id === s.runnerChar; })[0];
    return c && unlocked(c, s) ? c : CHARS[0];
  }
  /** Bonus od filmova: +1% po odgledanom naslovu, najvise x2. */
  function filmBonus(s) {
    var n = Object.keys(MM.Badges.doneMap(s)).length;
    return { n: n, mul: Math.min(2, 1 + n / 100) };
  }

  /* ---------------- stanje igre ---------------- */
  var host = null, cv = null, cx = null, raf = 0, last = 0, onEnd = null;
  var G = null;          // trenutna partija
  var imgs = {};

  function img(src) {
    if (!imgs[src]) { var im = new Image(); im.src = src; imgs[src] = im; }
    return imgs[src];
  }

  var LANE_W = 2.2, FAR = 70, CAM = 5.5;   // svet: x u trakama, z ispred igraca

  function newGame(s) {
    var c = charOf(s), b = filmBonus(s);
    G = {
      c: c, mul: b.mul * (c.id === 'doom' ? 1.5 : 1),
      lane: 0, x: 0, y: 0, vy: 0, slide: 0,
      speed: 16, accel: c.id === 'strange' ? .22 : .38,
      dist: c.id === 'thor' ? 300 : 0, coins: 0,
      shields: c.id === 'panther' ? 2 : (c.id === 'cap' || c.id === 'doom') ? 1 : 0,
      regenAt: 0, invuln: 0, objs: [], nextSpawn: 30, over: false, t: 0,
      jumpV: c.id === 'widow' || c.id === 'spidey' ? 15 : 13, slideDur: c.id === 'widow' ? .95 : .7
    };
  }

  /* ---------------- prepreke ---------------- */
  // low: niska barijera (skoci) | high: greda (klizni) | train: voz (promeni traku)
  function spawn() {
    var z = G.nextSpawn, lanes = [-1, 0, 1], free = lanes[Math.floor(Math.random() * 3)];
    var hard = Math.min(1, G.dist / 3000);
    lanes.forEach(function (l) {
      if (l === free && Math.random() > .25) {           // slobodna traka: cesto novcici
        for (var k = 0; k < 5; k++) G.objs.push({ t: 'coin', lane: l, z: z + k * 2.2 });
        return;
      }
      var r = Math.random();
      if (l === free) return;
      if (r < .3 + .2 * hard) G.objs.push({ t: 'train', lane: l, z: z, len: 9 + Math.random() * 8 });
      else if (r < .55 + .1 * hard) G.objs.push({ t: 'low', lane: l, z: z });
      else if (r < .8) G.objs.push({ t: 'high', lane: l, z: z });
      else for (var k2 = 0; k2 < 4; k2++) G.objs.push({ t: 'coin', lane: l, z: z + k2 * 2.2, air: r > .9 });
    });
    G.nextSpawn += Math.max(13, 22 - hard * 8) + Math.random() * 6;
  }

  /* ---------------- fizika ---------------- */
  function step(dt) {
    if (G.over) return;
    G.t += dt;
    G.speed = Math.min(42, 16 + G.t * G.accel);
    var dz = G.speed * dt;
    G.dist += dz;
    G.x += (G.lane - G.x) * Math.min(1, dt * 14);
    // skok / klizanje
    if (G.y > 0 || G.vy > 0) { G.vy -= 38 * dt; G.y = Math.max(0, G.y + G.vy * dt); if (G.y === 0) G.vy = 0; }
    if (G.slide > 0) G.slide = Math.max(0, G.slide - dt);
    if (G.invuln > 0) G.invuln -= dt;
    if (G.c.id === 'deadpool' && !G.shields && G.regenAt && G.t > G.regenAt) { G.shields = 1; G.regenAt = 0; }

    G.nextSpawn -= dz;
    G.objs.forEach(function (o) { o.z -= dz; });
    while (G.nextSpawn < FAR) spawn();

    var magnet = G.c.id === 'iron' || G.c.id === 'doom';
    G.objs = G.objs.filter(function (o) {
      var end = o.t === 'train' ? o.z + o.len : o.z;
      if (end < -3) return false;
      var same = Math.abs(o.lane - G.x) < .45;
      if (o.t === 'coin') {
        if (o.z < 1.2 && o.z > -1 && (same || (magnet && Math.abs(o.lane - G.x) < 1.6)) && (!o.air || G.y > 1.2 || magnet)) {
          G.coins += G.c.id === 'marvel' ? 2 : 1; UI.buzz(3); return false;
        }
        return true;
      }
      if (!same || o.hit) return true;
      var near = o.t === 'train' ? (o.z < .8 && o.z + o.len > -.5) : (o.z < .8 && o.z > -.8);
      if (!near) return true;
      var safe = (o.t === 'low' && (G.y > .9 || G.c.id === 'hulk')) ||
        (o.t === 'high' && (G.slide > 0 || G.c.id === 'ant')) ||
        (o.t === 'train' && G.c.id === 'spidey' && G.y > 2.2);
      if (safe) { if (o.t === 'low' && G.c.id === 'hulk' && G.y <= .9) { o.hit = true; UI.buzz(10); } return true; }
      hit(o);
      return true;
    });
  }

  function hit(o) {
    if (G.invuln > 0) return;
    o.hit = true;
    if (G.shields > 0) {
      G.shields--; G.invuln = 1.2; UI.buzz([20, 40, 20]);
      if (G.c.id === 'deadpool') G.regenAt = G.t + 20;
      return;
    }
    G.over = true; UI.buzz([40, 60, 80]);
    setTimeout(gameOver, 450);
  }

  function score() { return Math.round((G.dist + G.coins * 10) * G.mul); }

  /* ---------------- crtanje (pseudo 3D) ---------------- */
  function proj(lane, z, h) {
    var W = cv.width, H = cv.height, hor = H * .3, ground = H * .93;
    var sc = CAM / (z + CAM);
    return { x: W / 2 + lane * LANE_W * sc * W * .16, y: hor + (ground - hor) * sc - (h || 0) * sc * H * .055, s: sc };
  }

  function draw() {
    var W = cv.width, H = cv.height, hor = H * .3;
    // nebo: Doomsday
    var sky = cx.createLinearGradient(0, 0, 0, hor);
    sky.addColorStop(0, '#1a0306'); sky.addColorStop(1, '#5a1010');
    cx.fillStyle = sky; cx.fillRect(0, 0, W, hor + 2);
    cx.fillStyle = 'rgba(57,217,122,.18)';
    cx.beginPath(); cx.arc(W / 2, hor, H * .12, Math.PI, 0); cx.fill();
    // zemlja
    cx.fillStyle = '#120d0c'; cx.fillRect(0, hor, W, H - hor);
    // put (trapez)
    var L = proj(-1.5, FAR), R = proj(1.5, FAR), Ln = proj(-1.5, -CAM * .7), Rn = proj(1.5, -CAM * .7);
    cx.fillStyle = '#2a2320';
    cx.beginPath(); cx.moveTo(L.x, L.y); cx.lineTo(R.x, R.y); cx.lineTo(Rn.x, H); cx.lineTo(Ln.x, H); cx.closePath(); cx.fill();
    // pragovi koji jure
    var off = (G.dist % 4);
    cx.fillStyle = 'rgba(255,255,255,.06)';
    for (var z = 4 - off; z < FAR; z += 4) {
      var a = proj(-1.5, z), b = proj(1.5, z), t = Math.max(1, 6 * a.s);
      cx.fillRect(a.x, a.y - t / 2, b.x - a.x, t);
    }
    // linije traka
    cx.strokeStyle = 'rgba(255,211,107,.35)'; cx.lineWidth = Math.max(1, W * .004);
    [-.5, .5].forEach(function (l) { var f = proj(l, FAR), n = proj(l, -CAM * .7); cx.beginPath(); cx.moveTo(f.x, f.y); cx.lineTo(n.x, H); cx.stroke(); });

    // objekti, od dalekih ka bliskima
    var list = G.objs.slice().sort(function (p, q) { return q.z - p.z; });
    list.forEach(function (o) {
      if (o.z > FAR) return;
      if (o.t === 'train') return drawTrain(o);
      var p = proj(o.lane, Math.max(-1, o.z), o.t === 'coin' ? (o.air ? 3 : 1) : 0), w = W * .16 * LANE_W * p.s * .8;
      if (o.t === 'coin') {
        cx.fillStyle = '#ffd36b'; cx.strokeStyle = '#8a5a00'; cx.lineWidth = Math.max(1, 3 * p.s);
        cx.beginPath(); cx.ellipse(p.x, p.y, w * .14 * Math.abs(Math.sin(G.t * 4 + o.z)) + 1, w * .16, 0, 0, Math.PI * 2); cx.fill(); cx.stroke();
      } else if (o.t === 'low') {
        if (o.hit && G.c.id === 'hulk') return;
        var h = w * .32;
        for (var i = 0; i < 6; i++) { cx.fillStyle = i % 2 ? '#f4f4f7' : '#e62429'; cx.fillRect(p.x - w / 2 + i * w / 6, p.y - h, w / 6 + 1, h * .55); }
        cx.fillStyle = '#555'; cx.fillRect(p.x - w / 2, p.y - h * .45, w * .06, h * .45); cx.fillRect(p.x + w / 2 - w * .06, p.y - h * .45, w * .06, h * .45);
      } else if (o.t === 'high') {
        var top = p.y - w * .95;
        cx.fillStyle = '#3a3d46'; cx.fillRect(p.x - w / 2, top, w * .07, w * .95); cx.fillRect(p.x + w / 2 - w * .07, top, w * .07, w * .95);
        cx.fillStyle = '#f2b705'; cx.fillRect(p.x - w / 2, top, w, w * .2);
        cx.fillStyle = '#1b1410'; for (var j = 0; j < 5; j++) cx.fillRect(p.x - w / 2 + j * w / 5 + w * .05, top, w * .08, w * .2);
      }
    });

    // igrac
    var me = proj(G.x, 0, G.y * 1.4), size = W * .19;
    cx.fillStyle = 'rgba(0,0,0,.45)';
    var sh = proj(G.x, 0, 0); cx.beginPath(); cx.ellipse(sh.x, sh.y, size * .38, size * .1, 0, 0, Math.PI * 2); cx.fill();
    var sq = G.slide > 0 ? .55 : 1, bob = G.y > 0 || G.slide > 0 ? 0 : Math.sin(G.t * 16) * size * .03;
    if (!(G.invuln > 0 && Math.floor(G.t * 12) % 2)) {
      var ic = img(MM.Badges.dataUrl(MM.Cat.get(G.c.icon)));
      cx.save(); cx.translate(me.x, me.y - size * .5 * sq + bob); cx.scale(1, sq);
      cx.fillStyle = 'rgba(15,15,20,.85)'; cx.beginPath(); cx.arc(0, 0, size * .52, 0, Math.PI * 2); cx.fill();
      cx.lineWidth = size * .06; cx.strokeStyle = G.shields ? '#5fd3ff' : '#e62429'; cx.stroke();
      if (ic.complete && ic.naturalWidth) cx.drawImage(ic, -size * .4, -size * .4, size * .8, size * .8);
      cx.restore();
    }
    hud();
  }

  function drawTrain(o) {
    var W = cv.width, z0 = Math.max(-1, o.z), z1 = Math.min(FAR, o.z + o.len);
    if (z1 < -1) return;
    var a = proj(o.lane, z0), b = proj(o.lane, z1), wa = W * .16 * LANE_W * a.s * .86, wb = W * .16 * LANE_W * b.s * .86;
    var ha = wa * 1.25, hb = wb * 1.25;
    // krov i bok (perspektiva)
    cx.fillStyle = '#5a1a1c';
    cx.beginPath(); cx.moveTo(a.x - wa / 2, a.y - ha); cx.lineTo(b.x - wb / 2, b.y - hb); cx.lineTo(b.x + wb / 2, b.y - hb); cx.lineTo(a.x + wa / 2, a.y - ha); cx.closePath(); cx.fill();
    cx.fillStyle = '#7a2226';
    cx.beginPath(); cx.moveTo(a.x - wa / 2, a.y); cx.lineTo(b.x - wb / 2, b.y); cx.lineTo(b.x - wb / 2, b.y - hb); cx.lineTo(a.x - wa / 2, a.y - ha); cx.closePath(); cx.fill();
    cx.beginPath(); cx.moveTo(a.x + wa / 2, a.y); cx.lineTo(b.x + wb / 2, b.y); cx.lineTo(b.x + wb / 2, b.y - hb); cx.lineTo(a.x + wa / 2, a.y - ha); cx.closePath(); cx.fill();
    // celo voza
    cx.fillStyle = '#b8282d'; cx.fillRect(a.x - wa / 2, a.y - ha, wa, ha);
    cx.fillStyle = '#ffd36b'; cx.fillRect(a.x - wa * .35, a.y - ha * .82, wa * .7, ha * .28);
    cx.fillStyle = '#1b1410'; cx.fillRect(a.x - wa * .5, a.y - ha * .12, wa, ha * .12);
    cx.fillStyle = '#39d97a'; cx.beginPath(); cx.arc(a.x - wa * .3, a.y - ha * .3, wa * .06, 0, 7); cx.arc(a.x + wa * .3, a.y - ha * .3, wa * .06, 0, 7); cx.fill();
  }

  function hud() {
    var W = cv.width, f = Math.round(W * .045);
    cx.font = '900 ' + f + 'px system-ui, sans-serif'; cx.textBaseline = 'top';
    cx.fillStyle = '#fff'; cx.textAlign = 'left';
    cx.fillText(score().toLocaleString('sr-RS'), W * .04, W * .04);
    cx.fillStyle = '#ffd36b'; cx.textAlign = 'right';
    cx.fillText('● ' + G.coins, W * .96, W * .04);
    if (G.shields) { cx.fillStyle = '#5fd3ff'; cx.fillText(Array(G.shields + 1).join('🛡'), W * .96, W * .04 + f * 1.3); }
  }

  function loop(now) {
    if (!cv) return;
    var dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    step(dt); draw();
    raf = requestAnimationFrame(loop);
  }

  /* ---------------- kontrole ---------------- */
  function act(dir) {
    if (!G || G.over) return;
    if (dir === 'left') G.lane = Math.max(-1, G.lane - 1);
    if (dir === 'right') G.lane = Math.min(1, G.lane + 1);
    if (dir === 'up' && G.y === 0) { G.vy = G.jumpV; G.slide = 0; }
    if (dir === 'down') { G.slide = G.slideDur; if (G.y > 0) G.vy = -20; }
    UI.buzz(4);
  }
  var sx = 0, sy = 0, swiped = false;
  function onDown(e) { sx = e.clientX; sy = e.clientY; swiped = false; }
  function onMove(e) {
    if (swiped) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
    swiped = true;
    act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }
  function onKey(e) {
    var k = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' }[e.key];
    if (k) { e.preventDefault(); act(k); }
  }

  /* ---------------- ekrani ---------------- */
  function startScreen() {
    stopLoop();
    var s = MM.Store.get(), c = charOf(s), b = filmBonus(s), best = ((s.games || {}).best || {}).runner || 0;
    host.innerHTML = '<div class="rn-start">' +
      '<div class="rn-hero"><img src="' + MM.Badges.dataUrl(MM.Cat.get(c.icon)) + '" alt=""><div><em>MARVEL RUNNER</em><h2>' + esc(c.name) + '</h2><span>' + esc(c.perk) + '</span></div></div>' +
      '<div class="rn-stats"><div><b>×' + b.mul.toFixed(2) + '</b><i>bonus od ' + b.n + ' filmova</i></div><div><b>' + best.toLocaleString('sr-RS') + '</b><i>rekord</i></div></div>' +
      '<button type="button" class="btn primary wide" id="rnGo">▶ Trči</button>' +
      '<p class="muted small center">Prevuci levo/desno = traka · gore = skok · dole = klizanje</p>' +
      '<h3>Likovi · ' + CHARS.filter(function (x) { return unlocked(x, s); }).length + ' / ' + CHARS.length + '</h3><div class="rn-chars">' +
      CHARS.map(function (x) {
        var on = unlocked(x, s), f = x.film && MM.Cat.get(x.film);
        return '<button type="button" class="rn-c' + (on ? '' : ' locked') + (x.id === c.id ? ' sel' : '') + '" data-c="' + x.id + '">' +
          '<img src="' + MM.Badges.dataUrl(MM.Cat.get(x.icon)) + '" alt=""><b>' + esc(x.name) + '</b>' +
          '<i>' + esc(on ? x.perk : 'Odgledaj „' + MM.Cat.cleanTitle(f) + '“') + '</i></button>';
      }).join('') + '</div></div>';
    host.querySelector('#rnGo').onclick = run;
    Array.prototype.forEach.call(host.querySelectorAll('.rn-c'), function (b2) {
      b2.onclick = function () {
        var x = CHARS.filter(function (y) { return y.id === b2.getAttribute('data-c'); })[0];
        if (!unlocked(x, MM.Store.get())) { UI.buzz([20, 40, 20]); UI.toast('🔒 Otključava se kad odgledaš „' + MM.Cat.cleanTitle(MM.Cat.get(x.film)) + '“.'); return; }
        MM.Store.mutate(function (st) { st.runnerChar = x.id; });
        UI.buzz(6); startScreen();
      };
    });
  }

  function run() {
    newGame(MM.Store.get());
    host.innerHTML = '<div class="rn-wrap"><canvas class="rn-cv" id="rnCv"></canvas></div>';
    cv = host.querySelector('#rnCv');
    var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    cx = cv.getContext('2d');
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    document.addEventListener('keydown', onKey);
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function stopLoop() {
    cancelAnimationFrame(raf); raf = 0;
    document.removeEventListener('keydown', onKey);
    cv = null; cx = null;
  }

  function gameOver() {
    if (!host || !G) return;
    var sc = score();
    stopLoop();
    var res = onEnd ? onEnd({ score: sc, coins: G.coins, dist: Math.round(G.dist) }) : null;
    host.innerHTML = '<div class="gm-end"><div class="gm-emo">💥</div><h2>' + sc.toLocaleString('sr-RS') + '</h2>' +
      '<p class="muted">' + Math.round(G.dist) + ' m · ' + G.coins + ' novčića · ×' + G.mul.toFixed(2) + '</p>' +
      (res && res.rec ? '<p class="gm-up"><b>NOVI REKORD!</b></p>' : '') +
      (res && res.xp ? '<p><b class="gm-xp">+' + res.xp + ' XP</b>' + (res.up ? '<br><b class="gm-up">NOVI NIVO: ' + res.lvl + ' · ' + esc(res.title) + '</b>' : '') + '</p>' : '') +
      '<button type="button" class="btn primary wide" id="rnAgain">Ponovo</button><button type="button" class="btn ghost wide" id="rnMenu">Likovi</button></div>';
    host.querySelector('#rnAgain').onclick = run;
    host.querySelector('#rnMenu').onclick = startScreen;
  }

  /** cb({score, coins, dist}) -> { xp, rec, up, lvl, title } */
  function open(cb) {
    onEnd = cb;
    UI.openSheet({
      id: 'games', full: true, cls: 'gm-sheet rn-sheet',
      render: function () {
        return '<div class="gm-top"><button type="button" class="ib close" data-a="sheet-close" aria-label="Zatvori">✕</button></div>' +
          '<div class="gm rn no-drag" id="rnBox" data-keep></div>';
      },
      onOpen: function (el) { host = el.querySelector('#rnBox'); startScreen(); },
      onClose: function () { stopLoop(); host = null; G = null; }
    });
  }

  MM.Runner = { open: open, CHARS: CHARS, unlocked: unlocked, filmBonus: filmBonus, charOf: charOf };
})();
