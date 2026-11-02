/* ============================================================
   runner.js  -  Marvel Runner (kao Subway Surfers)
   ------------------------------------------------------------
   Tri trake, beskonacno trcanje ka Doomsdayu. Prevuci levo/desno
   (traka), gore (skok), dole (klizanje). Strelice rade na tastaturi.
   Prepreke: niska barijera (skoci), greda (klizni), voz (promeni
   traku). Novcici = poeni, plavi stit = jos jedan zivot.
   Slike likova i rekvizita su iz Figme (img/run/).

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

  function sprite(c) { return 'img/run/' + c.id + '.webp'; }

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

  var LANE_W = 2.2, FAR = 75, CAM = 5.5;   // svet: x u trakama, z ispred igraca
  var BG = ['img/map/z3.jpg', 'img/map/z4.jpg', 'img/map/z5.jpg'];

  function newGame(s) {
    var c = charOf(s), b = filmBonus(s);
    G = {
      c: c, mul: b.mul * (c.id === 'doom' ? 1.5 : 1),
      lane: 0, x: 0, y: 0, vy: 0, slide: 0,
      speed: 14, accel: c.id === 'strange' ? .16 : .26,
      dist: c.id === 'thor' ? 300 : 0, coins: 0,
      shields: c.id === 'panther' ? 2 : (c.id === 'cap' || c.id === 'doom') ? 1 : 0,
      regenAt: 0, invuln: 0, objs: [], nextSpawn: 40, over: false, t: 0,
      jumpV: c.id === 'widow' || c.id === 'spidey' ? 15 : 13.5, slideDur: c.id === 'widow' ? 1 : .75,
      busy: { '-1': -99, '0': -99, '1': -99 }, free: 0, sparks: []
    };
  }

  /* ---------------- prepreke ----------------
     Pravilo: uvek postoji slobodna traka do koje se stize (najvise jednu
     traku pomeranja po redu), i nikad vise od 2 voza u istom delu puta.
     Tako nema "nemogucih" zidova od vozova. */
  function spawn() {
    var z = G.nextSpawn, hard = Math.min(1, G.dist / 4000);
    var occ = function (l) { return G.busy[l] > z - 1; };
    // nova slobodna traka mora biti prazna vec neko vreme, da stignes da predjes u nju
    var clear = function (l) { return G.busy[l] < z - 14; };
    var P0 = G.free;
    var cand = [P0 - 1, P0, P0 + 1].filter(function (l) { return l >= -1 && l <= 1 && (l === P0 ? !occ(l) : clear(l)); });
    var F = cand.length ? cand[Math.floor(Math.random() * cand.length)] : P0;
    G.free = F;
    var trains = [-1, 0, 1].filter(occ).length;
    [-1, 0, 1].forEach(function (l) {
      if (occ(l)) return;
      if (l === F || l === P0) {                // slobodna i prethodna slobodna traka: bez prepreka
        if (l !== F) return;
        if (Math.random() < .55) for (var k = 0; k < 5; k++) G.objs.push({ t: 'coin', lane: l, z: z + k * 2.4 });
        else if (Math.random() < .06) G.objs.push({ t: 'shield', lane: l, z: z + 4 });
        return;
      }
      var r = Math.random();
      if (r < .22 + .18 * hard && trains < 2) {
        var len = 10 + Math.random() * 10;
        G.objs.push({ t: 'train', lane: l, z: z, len: len });
        G.busy[l] = z + len; trains++;
        if (Math.random() < .5) for (var k2 = 0; k2 < 4; k2++) G.objs.push({ t: 'coin', lane: l, z: z + 2 + k2 * 2.4, air: true });
      } else if (r < .5 + .1 * hard) G.objs.push({ t: 'low', lane: l, z: z });
      else if (r < .72 + .08 * hard) G.objs.push({ t: 'high', lane: l, z: z });
      else if (r < .85) for (var k3 = 0; k3 < 3; k3++) G.objs.push({ t: 'coin', lane: l, z: z + k3 * 2.4 });
    });
    // razmak raste sa brzinom: uvek ~1 s da reagujes
    G.nextSpawn += Math.max(16, G.speed * (1.05 - .25 * hard)) + Math.random() * 6;
  }

  /* ---------------- fizika ---------------- */
  function step(dt) {
    if (G.over) return;
    G.t += dt;
    G.speed = Math.min(32, 14 + G.t * G.accel);
    var dz = G.speed * dt;
    G.dist += dz;
    G.x += (G.lane - G.x) * Math.min(1, dt * 16);
    if (G.y > 0 || G.vy > 0) { G.vy -= 40 * dt; G.y = Math.max(0, G.y + G.vy * dt); if (G.y === 0) G.vy = 0; }
    if (G.slide > 0) G.slide = Math.max(0, G.slide - dt);
    if (G.invuln > 0) G.invuln -= dt;
    if (G.c.id === 'deadpool' && !G.shields && G.regenAt && G.t > G.regenAt) { G.shields = 1; G.regenAt = 0; }

    G.nextSpawn -= dz;
    Object.keys(G.busy).forEach(function (l) { G.busy[l] -= dz; });
    G.objs.forEach(function (o) { o.z -= dz; });
    while (G.nextSpawn < FAR) spawn();
    G.sparks = G.sparks.filter(function (p) { p.t -= dt; p.y += p.vy * dt; p.x += p.vx * dt; return p.t > 0; });

    var magnet = G.c.id === 'iron' || G.c.id === 'doom';
    G.objs = G.objs.filter(function (o) {
      var end = o.t === 'train' ? o.z + o.len : o.z;
      if (end < -4) return false;
      var same = Math.abs(o.lane - G.x) < .45;
      if (o.t === 'coin' || o.t === 'shield') {
        var reach = same || (magnet && o.t === 'coin' && Math.abs(o.lane - G.x) < 1.6);
        if (o.z < 1.2 && o.z > -1 && reach && (!o.air || G.y > 1.5 || magnet)) {
          if (o.t === 'shield') { G.shields = Math.min(3, G.shields + 1); UI.buzz(15); }
          else { G.coins += G.c.id === 'marvel' ? 2 : 1; UI.buzz(3); burst(o); }
          return false;
        }
        return true;
      }
      if (!same || o.hit) return true;
      var near = o.t === 'train' ? (o.z < .7 && o.z + o.len > -.4) : (o.z < .7 && o.z > -.7);
      if (!near) return true;
      var safe = (o.t === 'low' && (G.y > .8 || G.c.id === 'hulk')) ||
        (o.t === 'high' && (G.slide > 0 || G.c.id === 'ant')) ||
        (o.t === 'train' && G.c.id === 'spidey' && G.y > 2.3);
      if (safe) { if (o.t === 'low' && G.c.id === 'hulk' && G.y <= .8) { o.hit = true; UI.buzz(12); burst(o, '#ff5a3c'); } return true; }
      hit(o);
      return true;
    });
  }

  function burst(o, col) {
    for (var i = 0; i < 6; i++) G.sparks.push({ lane: o.lane, x: (Math.random() - .5) * .6, y: 1 + Math.random(), vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3, t: .35, c: col || '#ffd36b' });
  }

  function hit(o) {
    if (G.invuln > 0) return;
    o.hit = true;
    if (G.shields > 0) {
      G.shields--; G.invuln = 1.3; UI.buzz([20, 40, 20]);
      if (G.c.id === 'deadpool') G.regenAt = G.t + 20;
      return;
    }
    G.over = true; G.shake = .4; UI.buzz([40, 60, 80]);
    setTimeout(gameOver, 650);
  }

  function score() { return Math.round((G.dist + G.coins * 10) * G.mul); }

  /* ---------------- crtanje (pseudo 3D) ---------------- */
  var VW = 0;       // sirina puta u pikselima na z = 0
  function proj(lane, z, h) {
    var W = cv.width, H = cv.height, hor = H * .34, ground = H * .9;
    var sc = CAM / (z + CAM);
    return { x: W / 2 + lane * VW * sc, y: hor + (ground - hor) * sc - (h || 0) * sc * VW * .5, s: sc };
  }

  function draw() {
    var W = cv.width, H = cv.height, hor = H * .34;
    VW = W * .3;
    cx.save();
    if (G.shake > 0) { G.shake -= .016; cx.translate((Math.random() - .5) * 18 * G.shake, (Math.random() - .5) * 18 * G.shake); }
    // pozadina: slike iz mape (sve mracnije kako odmices)
    var bg = img(BG[Math.min(2, Math.floor(G.dist / 1500))]);
    if (bg.complete && bg.naturalWidth) {
      var bw = W * 1.6, bh = bw * bg.naturalHeight / bg.naturalWidth, ox = -(G.dist * .02 % (bw - W));
      cx.drawImage(bg, ox, hor - bh * .78, bw, bh);
    } else { cx.fillStyle = '#3a0c0e'; cx.fillRect(0, 0, W, hor); }
    var fog = cx.createLinearGradient(0, hor - H * .1, 0, hor + 4);
    fog.addColorStop(0, 'rgba(20,6,8,0)'); fog.addColorStop(1, 'rgba(20,6,8,.85)');
    cx.fillStyle = fog; cx.fillRect(0, hor - H * .1, W, H * .1 + 4);
    // tlo
    var gr = cx.createLinearGradient(0, hor, 0, H);
    gr.addColorStop(0, '#1a1210'); gr.addColorStop(1, '#2c201a');
    cx.fillStyle = gr; cx.fillRect(0, hor, W, H - hor);
    // put
    var L = proj(-1.6, FAR), R = proj(1.6, FAR), Ln = proj(-1.6, -CAM * .75), Rn = proj(1.6, -CAM * .75);
    cx.fillStyle = '#3a2f29';
    cx.beginPath(); cx.moveTo(L.x, L.y); cx.lineTo(R.x, R.y); cx.lineTo(Rn.x, Rn.y); cx.lineTo(Ln.x, Ln.y); cx.closePath(); cx.fill();
    // pragovi
    var off = G.dist % 3;
    for (var z = 3 - off; z < FAR; z += 3) {
      var a = proj(-1.55, z), b = proj(1.55, z), t = Math.max(1, 9 * a.s);
      cx.fillStyle = 'rgba(90,64,44,' + Math.min(.9, .3 + a.s) + ')';
      cx.fillRect(a.x, a.y - t / 2, b.x - a.x, t);
    }
    // sine (2 po traci)
    cx.strokeStyle = '#9aa3ad'; 
    [-1, 0, 1].forEach(function (l) {
      [-.28, .28].forEach(function (o) {
        var f = proj(l + o, FAR), n = proj(l + o, -CAM * .75);
        cx.lineWidth = Math.max(1, W * .006); cx.beginPath(); cx.moveTo(f.x, f.y); cx.lineTo(n.x, n.y); cx.stroke();
      });
    });
    // ivice puta
    cx.fillStyle = 'rgba(0,0,0,.35)';
    cx.beginPath(); cx.moveTo(L.x, L.y); cx.lineTo(Ln.x, Ln.y); cx.lineTo(0, H); cx.lineTo(0, hor); cx.closePath(); cx.fill();
    cx.beginPath(); cx.moveTo(R.x, R.y); cx.lineTo(Rn.x, Rn.y); cx.lineTo(W, H); cx.lineTo(W, hor); cx.closePath(); cx.fill();

    // objekti od dalekih ka bliskim; igrac se crta na svom mestu (z = 0)
    var list = G.objs.filter(function (o) { return o.z < FAR; }).sort(function (p, q) { return q.z - p.z; });
    var drawn = false;
    list.forEach(function (o) {
      if (!drawn && o.z < 0 && o.t !== 'train') { player(); drawn = true; }
      if (o.t === 'train') return drawTrain(o);
      var p = proj(o.lane, Math.max(-CAM * .6, o.z), 0), w = VW * p.s;
      if (o.t === 'coin' || o.t === 'shield') {
        var ci = img('img/run/' + o.t + '.webp'), cs = w * (o.t === 'shield' ? .55 : .42), spin = o.t === 'coin' ? Math.abs(Math.sin(G.t * 5 + o.z)) * .8 + .2 : 1;
        var cy = p.y - w * (o.air ? 1.55 : .5) - Math.sin(G.t * 4 + o.z) * w * .05;
        if (ci.complete) cx.drawImage(ci, p.x - cs * spin / 2, cy - cs / 2, cs * spin, cs);
      } else if (o.t === 'low') {
        if (o.hit && G.c.id === 'hulk') return;
        var li = img('img/run/low.webp'), lw = w * .95, lh = lw * 149 / 256;
        if (li.complete) cx.drawImage(li, p.x - lw / 2, p.y - lh, lw, lh);
      } else if (o.t === 'high') {
        var hi = img('img/run/high.webp'), hw = w * .98, hh = hw * 246 / 256 * 1.15;
        if (hi.complete) cx.drawImage(hi, p.x - hw / 2, p.y - hh, hw, hh);
      }
    });
    if (!drawn) player();
    // iskre
    G.sparks.forEach(function (sp) {
      var q = proj(sp.lane + sp.x, 0, sp.y);
      cx.globalAlpha = sp.t / .35; cx.fillStyle = sp.c; cx.beginPath(); cx.arc(q.x, q.y, VW * .03, 0, 7); cx.fill(); cx.globalAlpha = 1;
    });
    cx.restore();
    hud();
  }

  function player() {
    var me = proj(G.x, 0, G.y), sh = proj(G.x, 0, 0), size = VW * .78;
    cx.fillStyle = 'rgba(0,0,0,.45)';
    cx.beginPath(); cx.ellipse(sh.x, sh.y, size * .32 / (1 + G.y * .15), size * .08, 0, 0, Math.PI * 2); cx.fill();
    if (G.invuln > 0 && Math.floor(G.t * 14) % 2) return;
    var im = img(sprite(G.c));
    if (!im.complete || !im.naturalWidth) return;
    var ar = im.naturalWidth / im.naturalHeight, h = size, w = h * ar;
    var sq = G.slide > 0 ? .5 : 1, run = G.y > 0 || G.slide > 0 ? 0 : Math.sin(G.t * 18);
    cx.save();
    cx.translate(me.x, me.y);
    cx.rotate(G.slide > 0 ? 0 : run * .06 + (G.lane - G.x) * .25);
    cx.scale(1 + (1 - sq) * .25, sq);
    cx.drawImage(im, -w / 2, -h + Math.abs(run) * h * .04, w, h);
    cx.restore();
    if (G.shields) {
      var si = img('img/run/shield.webp'), ss = size * .3;
      for (var i = 0; i < G.shields; i++) if (si.complete) cx.drawImage(si, me.x + size * .25 + i * ss * .6, me.y - size * 1.05, ss, ss);
    }
  }

  function drawTrain(o) {
    var z0 = Math.max(-CAM * .6, o.z), z1 = Math.min(FAR, o.z + o.len);
    if (z1 < -CAM * .6) return;
    var a = proj(o.lane, z0), b = proj(o.lane, z1), wa = VW * a.s * .9, wb = VW * b.s * .9, ha = wa * 1.15, hb = wb * 1.15;
    // bok i krov (perspektiva)
    cx.fillStyle = '#3a1214';
    cx.beginPath(); cx.moveTo(a.x - wa / 2, a.y - ha); cx.lineTo(b.x - wb / 2, b.y - hb); cx.lineTo(b.x + wb / 2, b.y - hb); cx.lineTo(a.x + wa / 2, a.y - ha); cx.closePath(); cx.fill();
    cx.fillStyle = '#5a1a1d';
    cx.beginPath(); cx.moveTo(a.x - wa / 2, a.y); cx.lineTo(b.x - wb / 2, b.y); cx.lineTo(b.x - wb / 2, b.y - hb); cx.lineTo(a.x - wa / 2, a.y - ha); cx.closePath(); cx.fill();
    cx.beginPath(); cx.moveTo(a.x + wa / 2, a.y); cx.lineTo(b.x + wb / 2, b.y); cx.lineTo(b.x + wb / 2, b.y - hb); cx.lineTo(a.x + wa / 2, a.y - ha); cx.closePath(); cx.fill();
    // prozori na boku
    cx.fillStyle = 'rgba(255,211,107,.35)';
    for (var k = 1; k < o.len / 3; k++) {
      var zz = o.z + k * 3; if (zz < z0 || zz > z1) continue;
      var q = proj(o.lane, zz), qw = VW * q.s * .9, qh = qw * 1.15;
      cx.fillRect(q.x - qw / 2 - 1, q.y - qh * .75, 2 + q.s * 3, qh * .3);
      cx.fillRect(q.x + qw / 2 - 1 - q.s * 3, q.y - qh * .75, 2 + q.s * 3, qh * .3);
    }
    // celo voza: slika iz Figme
    var ti = img('img/run/train.webp');
    if (ti.complete && o.z > -CAM * .6) cx.drawImage(ti, a.x - wa * .6, a.y - ha * 1.08, wa * 1.2, ha * 1.12);
  }

  function hud() {
    var W = cv.width, f = Math.round(W * .05), pad = W * .035;
    function pill(x, y, txt, col, right) {
      cx.font = '900 ' + f + 'px system-ui, sans-serif';
      var tw = cx.measureText(txt).width, w = tw + f * 1.1, h = f * 1.6, x0 = right ? x - w : x;
      cx.fillStyle = 'rgba(8,8,12,.6)'; cx.beginPath(); cx.roundRect ? cx.roundRect(x0, y, w, h, h / 2) : cx.rect(x0, y, w, h); cx.fill();
      cx.fillStyle = col; cx.textBaseline = 'middle'; cx.textAlign = 'center'; cx.fillText(txt, x0 + w / 2, y + h / 2);
    }
    pill(pad, pad, score().toLocaleString('sr-RS'), '#fff');
    // novcici: ikonica levo, broj desno
    var ci = img('img/run/coin.webp'), txt = String(G.coins);
    cx.font = '900 ' + f + 'px system-ui, sans-serif';
    var tw = cx.measureText(txt).width, h = f * 1.6, w = tw + f * 2.4, x0 = W - pad - w;
    cx.fillStyle = 'rgba(8,8,12,.6)'; cx.beginPath(); cx.roundRect ? cx.roundRect(x0, pad, w, h, h / 2) : cx.rect(x0, pad, w, h); cx.fill();
    if (ci.complete) cx.drawImage(ci, x0 + f * .3, pad + f * .25, f * 1.1, f * 1.1);
    cx.fillStyle = '#ffd36b'; cx.textAlign = 'left'; cx.textBaseline = 'middle'; cx.fillText(txt, x0 + f * 1.65, pad + h / 2);
    pill(pad, pad + f * 1.9, '×' + G.mul.toFixed(2), '#9dffbc');
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
      '<div class="rn-hero"><img src="' + sprite(c) + '" alt=""><div><em>MARVEL RUNNER</em><h2>' + esc(c.name) + '</h2><span>' + esc(c.perk) + '</span></div></div>' +
      '<div class="rn-stats"><div><b>×' + b.mul.toFixed(2) + '</b><i>bonus od ' + b.n + ' filmova</i></div><div><b>' + best.toLocaleString('sr-RS') + '</b><i>rekord</i></div></div>' +
      '<button type="button" class="btn primary wide" id="rnGo">▶ Trči</button>' +
      '<p class="muted small center">Prevuci levo/desno = traka · gore = skok · dole = klizanje</p>' +
      '<h3>Likovi · ' + CHARS.filter(function (x) { return unlocked(x, s); }).length + ' / ' + CHARS.length + '</h3><div class="rn-chars">' +
      CHARS.map(function (x) {
        var on = unlocked(x, s), f = x.film && MM.Cat.get(x.film);
        return '<button type="button" class="rn-c' + (on ? '' : ' locked') + (x.id === c.id ? ' sel' : '') + '" data-c="' + x.id + '">' +
          '<img src="' + sprite(x) + '" alt=""><b>' + esc(x.name) + '</b>' +
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

  // za testove: brza simulacija bez crtanja
  function simulate(seconds, s) {
    newGame(s || MM.Store.get()); var all = [];
    G.shields = 1e9;
    var seen = new Set();
    for (var t = 0; t < seconds; t += 1 / 60) {
      step(1 / 60);
      G.objs.forEach(function (o) { if (!seen.has(o)) { seen.add(o); all.push({ t: o.t, lane: o.lane, a: G.dist + o.z, b: G.dist + o.z + (o.len || 0) }); } });
    }
    return { objs: all, dist: G.dist };
  }

  MM.Runner = { simulate: simulate, open: open, CHARS: CHARS, unlocked: unlocked, filmBonus: filmBonus, charOf: charOf, sprite: sprite };
})();
