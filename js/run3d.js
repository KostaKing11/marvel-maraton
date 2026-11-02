/* ============================================================
   run3d.js  -  Marvel Runner, 3D motor (Three.js r149, js/vendor)
   ------------------------------------------------------------
   Igrac stoji na z = 0 i gleda ka -z; svet putuje ka kameri (+z).
   Tri trake. Staza se slaze od rucno napravljenih deonica
   (runsections.js, pravila u docs/runner-deonice.md).

   Junak je pravi 3D model sa animacijama (heroes3d.js).
   Tutorijal (prva trka): igra stane ispred prepreke dok ne
   prevuces kako treba.
   Board tokeni: 3 pokupljena = hoverboard spreman (dugme).

   create(host, opts) -> { act, useBoard, pause, resume, revive, stop, result }
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var LX = [-2.6, 0, 2.6];                 // x traka
  var JET_Y = 6.5;
  var TRAIN_H = 3.3, TRAIN_W = 2.3, BODY_TOP = 2.9;
  var SPAWN_Z = -170;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------------- teksture iz canvasa ---------------- */
  function canvasTex(w, h, draw, repeat) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  /* Zone staze: posle svakih 1.000 m menja se izgled (grad -> noc -> Doomsday -> ...) */
  var ZONES = [
    { name: 'Grad', ico: 'mask', sky: ['#2f6fe0', '#6fb2f5', '#bfe0ff', '#f3e7d4'], fog: '#e9e6df', hemi: 1, sun: 1, cloud: '#ffffff',
      fac: ['#d9825a', '#e6c08f', '#82a9bb', '#c25a50', '#ecc970', '#9a78b3', '#7fb48c'], lit: .2 },
    { name: 'Noćni grad', ico: 'badge', sky: ['#060a24', '#141c4a', '#2c2f6a', '#5a4a7a'], fog: '#2a2d55', hemi: .55, sun: .3, cloud: '#3a3f6a',
      fac: ['#3a3550', '#2c3a52', '#4a3a3a', '#2f4048', '#463c5a'], lit: .55 },
    { name: 'Doomsday', ico: 'bolt', sky: ['#1a0806', '#5a1a0e', '#b5401a', '#f09a4a'], fog: '#8a4a30', hemi: .8, sun: .85, cloud: '#c0704a',
      fac: ['#5a524c', '#6a5e52', '#4a4642', '#76685a'], lit: .08, ruin: true }
  ];
  var skyCv = null;
  function skyTex() {
    skyCv = document.createElement('canvas'); skyCv.width = 16; skyCv.height = 512;
    var t = new THREE.CanvasTexture(skyCv); t.encoding = THREE.sRGBEncoding; drawSky(ZONES[0].sky); return t;
  }
  function drawSky(cols) {
    var g = skyCv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, cols[0]); gr.addColorStop(.45, cols[1]); gr.addColorStop(.75, cols[2]); gr.addColorStop(1, cols[3]);
    g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
  }
  function mixHex(a, b, t) {
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    var r = Math.round((x >> 16) + ((y >> 16) - (x >> 16)) * t), gg = Math.round(((x >> 8) & 255) + (((y >> 8) & 255) - ((x >> 8) & 255)) * t), bb = Math.round((x & 255) + ((y & 255) - (x & 255)) * t);
    return '#' + ((1 << 24) + (r << 16) + (gg << 8) + bb).toString(16).slice(1);
  }
  function ballastTex() {
    return canvasTex(256, 256, function (g, w, h) {
      // zemlja izmedju sina: glatka smedja, sa mrljama (kao crtani film)
      g.fillStyle = '#8f5638'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 70; i++) {
        g.fillStyle = Math.random() < .5 ? 'rgba(70,35,20,.12)' : 'rgba(255,200,160,.08)';
        g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, rnd(8, 30), rnd(4, 14), rnd(0, 3), 0, 7); g.fill();
      }
    }, [3, 24]);
  }
  function sleeperTex() {
    return canvasTex(64, 16, function (g, w, h) {
      g.fillStyle = '#c0663f'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,220,180,.25)'; g.fillRect(0, 0, w, 3);
      g.fillStyle = 'rgba(0,0,0,.18)'; for (var i = 0; i < 4; i++) g.fillRect(0, rnd(4, h), w, 1);
      g.fillStyle = '#8d96a3'; g.fillRect(12, 3, 7, 10); g.fillRect(w - 19, 3, 7, 10);
    });
  }
  function stripeTex(c1, c2, n) {
    return canvasTex(128, 32, function (g, w, h) {
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      g.fillStyle = c2;
      for (var i = -1; i < n + 1; i++) { var x = i * w / n; g.beginPath(); g.moveTo(x, h); g.lineTo(x + w / n / 2, h); g.lineTo(x + w / n, 0); g.lineTo(x + w / n / 2, 0); g.closePath(); g.fill(); }
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
    });
  }
  function rampTex() {
    return canvasTex(64, 128, function (g, w, h) {
      g.fillStyle = '#b8bfc8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#8a929c'; for (var y = 0; y < h; y += 16) g.fillRect(0, y, w, 4);
      g.fillStyle = '#ffcc1a'; g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h);
    }, [1, 3]);
  }
  // bocna strana voza: prozori, traka u boji, vrata
  function trainSideTex(col) {
    return canvasTex(512, 128, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#eef1f5'); gr.addColorStop(1, '#b8bec8');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = col; g.fillRect(0, h * .66, w, h * .14);
      for (var i = 0; i < 4; i++) {
        g.fillStyle = '#26303d'; g.fillRect(18 + i * 128, h * .14, 74, h * .4);
        g.fillStyle = 'rgba(160,210,255,.45)'; g.fillRect(22 + i * 128, h * .17, 26, h * .1);
        g.fillStyle = '#9aa1ab'; g.fillRect(100 + i * 128, h * .12, 20, h * .76);
      }
      g.fillStyle = '#4a515b'; g.fillRect(0, h - 8, w, 8);
    });
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  // lice voza: krovna kriva, staklo, farovi, broj
  function trainFrontTex(col, moving) {
    return canvasTex(256, 280, function (g, w, h) {
      var top = 38;
      g.beginPath(); g.moveTo(0, h); g.lineTo(0, top); g.quadraticCurveTo(0, 0, w / 2, 0); g.quadraticCurveTo(w, 0, w, top); g.lineTo(w, h); g.closePath();
      var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f2f4f7'); gr.addColorStop(1, '#c4cad3');
      g.fillStyle = gr; g.fill();
      g.fillStyle = col; g.fillRect(0, h * .62, w, h * .2);
      g.fillStyle = '#1d2733'; roundRect(g, 26, 46, w - 52, 92, 16); g.fill();
      g.fillStyle = 'rgba(170,215,255,.35)'; g.beginPath(); g.moveTo(40, 130); g.lineTo(90, 52); g.lineTo(120, 52); g.lineTo(70, 130); g.closePath(); g.fill();
      [[52, h * .72], [w - 52, h * .72]].forEach(function (p) {
        if (moving) { var rg = g.createRadialGradient(p[0], p[1], 2, p[0], p[1], 30); rg.addColorStop(0, 'rgba(255,250,200,1)'); rg.addColorStop(1, 'rgba(255,240,150,0)'); g.fillStyle = rg; g.fillRect(p[0] - 30, p[1] - 30, 60, 60); }
        g.fillStyle = moving ? '#fffbe0' : '#d8d2b8'; g.beginPath(); g.arc(p[0], p[1], 14, 0, 7); g.fill();
      });
      g.fillStyle = '#20262e'; roundRect(g, w / 2 - 34, h * .66, 68, 30, 6); g.fill();
      g.fillStyle = '#ffd23f'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText(String(Math.floor(rnd(10, 99))), w / 2, h * .66 + 23);
      g.fillStyle = '#3a4048'; g.fillRect(0, h - 16, w, 16);
    });
  }
  function facadeTex(base, lit, ruin) {
    return canvasTex(128, 256, function (g, w, h) {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,.1)'; for (var y = 0; y < h; y += 8) g.fillRect(0, y, w, 1);
      for (var r = 0; r < 7; r++) for (var c = 0; c < 3; c++) {
        if (ruin && r < 2 && Math.random() < .6) continue;
        g.fillStyle = Math.random() < (lit == null ? .2 : lit) ? '#ffe2a0' : (ruin ? '#2a2420' : '#33415a'); g.fillRect(14 + c * 38, 16 + r * 34, 24, 22);
        g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(14 + c * 38, 16 + r * 34, 24, 3);
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(12 + c * 38, 38 + r * 34, 28, 3);
      }
    }, [2, 2]);
  }
  // zid uz prugu sa grafitima
  function wallTex() {
    var words = ['AVENGERS', 'DOOM', 'MCU', 'WAKANDA', 'EXCELSIOR', 'S.H.I.E.L.D.', 'ASSEMBLE', 'I AM GROOT', 'MULTIVERSE', 'SNAP!'];
    return canvasTex(1024, 96, function (g, w, h) {
      g.fillStyle = '#b9b2a6'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,.08)'; for (var x = 0; x < w; x += 64) g.fillRect(x, 0, 2, h);
      for (var i = 0; i < 5; i++) {
        var cx = 60 + i * 200 + rnd(-20, 20), col = pick(['#e62429', '#2b6fd6', '#39d97a', '#ffcc1a', '#a855f7', '#ff8a00']);
        g.save(); g.translate(cx, h * .62); g.rotate(rnd(-.08, .08));
        g.font = 'bold ' + Math.floor(rnd(30, 40)) + 'px Bangers, Impact, sans-serif';
        g.lineWidth = 7; g.strokeStyle = '#1b1410'; g.fillStyle = col;
        var t = pick(words); g.strokeText(t, 0, 0); g.fillText(t, 0, 0);
        g.restore();
      }
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, h - 10, w, 10);
    }, [12, 1]);
  }
  function shadowTex() {
    return canvasTex(64, 64, function (g, w, h) {
      var gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
      gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
  }
  function wallStopTex() {
    return canvasTex(128, 160, function (g, w, h) {
      for (var i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#e62429'; g.beginPath(); g.moveTo(i * 32 - 80, h); g.lineTo(i * 32 - 40, h); g.lineTo(i * 32 + 40, 0); g.lineTo(i * 32, 0); g.closePath(); g.fill(); }
      g.fillStyle = '#e62429'; g.beginPath(); for (var k = 0; k < 8; k++) { var a = Math.PI / 8 + k * Math.PI / 4; g.lineTo(64 + Math.cos(a) * 34, 74 + Math.sin(a) * 34); } g.closePath(); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke();
      g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center'; g.fillText('STOP', 64, 81);
      g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    });
  }
  function shieldTex() {
    return canvasTex(128, 128, function (g) {
      [['#c8202b', 62], ['#eef1f5', 50], ['#c8202b', 38], ['#1f4fa8', 26]].forEach(function (r) { g.fillStyle = r[0]; g.beginPath(); g.arc(64, 64, r[1], 0, 7); g.fill(); });
      g.fillStyle = '#fff'; g.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 9 : 22; g.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); }
      g.closePath(); g.fill();
    });
  }

  var loader = null;
  function imgTex(src) { var t = loader.load(src); t.encoding = THREE.sRGBEncoding; return t; }

  /* ============================================================ */
  function create(host, opts) {
    loader = loader || new THREE.TextureLoader();
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    var SEC = MM.RunSections;
    // staza iz semena: u borbi svi dobiju iste deonice i iste moci
    var rr = Math.random;
    if (opts.seed) { var sd = opts.seed >>> 0; rr = function () { sd = (sd + 0x6D2B79F5) >>> 0; var t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    function rpick(a) { return a[Math.floor(rr() * a.length)]; }
    var W = host.clientWidth || 360, H = host.clientHeight || 640;
    var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    renderer.setSize(W, H);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.domElement.className = 'r3-cv';
    host.insertBefore(renderer.domElement, host.firstChild);

    var scene = new THREE.Scene();
    scene.background = skyTex();
    scene.fog = new THREE.Fog(0xe9e6df, 80, 190);
    var cam = new THREE.PerspectiveCamera(60, W / H, .1, 290);
    cam.position.set(0, 4.0, 6.7);

    var hemi = new THREE.HemisphereLight(0xfff4e6, 0x6a5a4a, 1.0); scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xffffff, 1.0); sun.position.set(-7, 15, 6); scene.add(sun);

    /* ---------- materijali i geometrije ---------- */
    var L = function (o) { return new THREE.MeshLambertMaterial(o); };
    var M = {
      ground: L({ map: ballastTex() }),
      side: L({ color: 0xb79b7f }),
      walk: L({ color: 0xe2cfb3 }),
      curb: L({ color: 0xb8a68d }),
      leaf: new THREE.MeshToonMaterial({ color: 0x4cae4f }),
      leaf2: new THREE.MeshToonMaterial({ color: 0x3d9441 }),
      trunk: L({ color: 0x7a5236 }),
      prop: L({ color: 0x2f6fd6 }),
      hydrant: L({ color: 0xe0352b }),
      cloud: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .92, fog: false }),
      rail: new THREE.MeshPhongMaterial({ color: 0xc8d0d8, shininess: 90, specular: 0xffffff }),
      sleeper: L({ map: sleeperTex() }),
      roof: L({ color: 0x8a929d }),
      under: L({ color: 0x2a2d33 }),
      ramp: L({ map: rampTex() }),
      rampSide: L({ color: 0x6b737e }),
      low: L({ map: stripeTex('#ffffff', '#e62429', 5) }),
      high: L({ map: stripeTex('#ffcc1a', '#1b1410', 6) }),
      wall: L({ map: wallStopTex() }),
      post: L({ color: 0x5a616b }),
      coin: new THREE.MeshPhongMaterial({ color: 0xe0a21a, emissive: 0x5a3a00, shininess: 90, specular: 0xffffff }),
      lamp: L({ color: 0x3a3f48 }),
      bulb: new THREE.MeshBasicMaterial({ color: 0xfff1b0 }),
      graf: L({ map: wallTex() }),
      graf2: L({ map: wallTex() }),
      shadow: new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }),
      fx: new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    };
    var G3 = {
      box: new THREE.BoxGeometry(1, 1, 1),
      coin: new THREE.CylinderGeometry(.42, .42, .1, 22),
      plane: new THREE.PlaneGeometry(1, 1),
      roof: new THREE.CylinderGeometry(1, 1, 1, 18, 1, true, -Math.PI / 2, Math.PI),
      ring: new THREE.RingGeometry(.3, .45, 20),
      bulb: new THREE.SphereGeometry(.16, 8, 8)
    };
    G3.coin.rotateX(Math.PI / 2);
    G3.roof.rotateX(-Math.PI / 2);
    function box(mat, w, h, d) { var m = new THREE.Mesh(G3.box, mat); m.scale.set(w, h, d); return m; }

    // vozovi: materijali po boji i duzini (bez kloniranja tekstura po vozu)
    var TCOL = ['#d6232b', '#2b6fd6', '#e9a21a', '#2f9a5a'], TMAT = {};
    function trainMats(ci, len, moving) {
      var k = ci + '-' + len + (moving ? 'm' : '');
      if (!TMAT[k]) {
        var side = trainSideTex(TCOL[ci]); side.wrapS = THREE.RepeatWrapping; side.repeat.set(len / 8, 1);
        TMAT[k] = { side: L({ map: side }), front: L({ map: trainFrontTex(TCOL[ci], moving), transparent: true, alphaTest: .5, emissive: moving ? 0x333322 : 0 }) };
      }
      return TMAT[k];
    }

    /* ---------- staza ---------- */
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(9, 400), M.ground);
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -150); scene.add(ground);
    [-1, 1].forEach(function (s) {
      var sd = new THREE.Mesh(new THREE.PlaneGeometry(60, 400), M.side); sd.rotation.x = -Math.PI / 2; sd.position.set(s * 34, -.02, -150); scene.add(sd);
      var wk = box(M.walk, 2.6, .35, 400); wk.position.set(s * 5.8, .17, -150); scene.add(wk);
      var wl = new THREE.Mesh(new THREE.PlaneGeometry(400, 2.2), s < 0 ? M.graf : M.graf2);
      wl.rotation.y = s < 0 ? Math.PI / 2 : -Math.PI / 2; wl.position.set(s * 7.1, 1.1, -150); scene.add(wl);
      var cap = box(M.post, .3, .2, 400); cap.position.set(s * 7.15, 2.25, -150); scene.add(cap);
    });
    LX.forEach(function (x) {
      [-.62, .62].forEach(function (o) { var r = box(M.rail, .13, .18, 400); r.position.set(x + o, .24, -150); scene.add(r); });
    });
    var SLEEP_N = 72, SLEEP_D = 2.3;
    var sleepers = new THREE.InstancedMesh(G3.box, M.sleeper, SLEEP_N * 3);
    scene.add(sleepers);
    var dummy = new THREE.Object3D(), sleepOff = 0;
    function placeSleepers() {
      var k = 0, off = sleepOff % SLEEP_D;
      for (var l = 0; l < 3; l++) for (var i = 0; i < SLEEP_N; i++) {
        dummy.position.set(LX[l], .08, 12 - i * SLEEP_D + off); dummy.scale.set(2.0, .18, .5); dummy.updateMatrix();
        sleepers.setMatrixAt(k++, dummy.matrix);
      }
      sleepers.instanceMatrix.needsUpdate = true;
    }
    placeSleepers();

    /* ---------- dekor (reciklira se) ---------- */
    var FAC = ZONES.map(function (zn) { return zn.fac.map(function (c) { return L({ map: facadeTex(c, zn.lit, zn.ruin) }); }); });
    var facades = FAC[0], zoneI = 0, zoneT = 1, zoneFrom = 0;
    var roofMat = L({ color: 0x5a4a44 }), tankGeo = new THREE.CylinderGeometry(.9, .9, 1.8, 10);
    var decor = [];
    function addBuilding(side, z) {
      var h = rnd(8, 20), w = rnd(6, 10), d = rnd(9, 14), g = new THREE.Group();
      var b = box(pick(facades), w, h, d); b.position.y = h / 2; g.add(b);
      var rf = box(roofMat, w + .4, .5, d + .4); rf.position.y = h + .25; g.add(rf);
      if (ZONES[zoneI].ruin) { rf.rotation.z = rnd(-.25, .25); rf.position.y = h + .1; var ch = box(pick(facades), w * .5, rnd(2, 5), d * .6); ch.position.set(rnd(-w / 4, w / 4), h + 1, 0); ch.rotation.z = rnd(-.3, .3); g.add(ch); }
      if (Math.random() < .4) { var tank = new THREE.Mesh(tankGeo, roofMat); tank.position.set(rnd(-w / 4, w / 4), h + 1.4, 0); g.add(tank); }
      g.position.set(side * (8.5 + w / 2 + rnd(0, 2.5)), 0, z - d / 2);
      scene.add(g); decor.push({ m: g, len: d / 2 + 2 });
    }
    function addPylon(z) {
      var g = new THREE.Group();
      [-1, 1].forEach(function (s) { var p = box(M.lamp, .22, 7.9, .22); p.position.set(s * 4.4, 3.95, 0); g.add(p); });
      var bar = box(M.lamp, 9, .18, .18); bar.position.set(0, 7.8, 0); g.add(bar);
      g.position.z = z; scene.add(g); decor.push({ m: g, len: 0 });
    }
    function addLamp(side, z) {
      var g = new THREE.Group();
      var p = box(M.lamp, .16, 4.2, .16); p.position.set(0, 2.1, 0); g.add(p);
      var a = box(M.lamp, .9, .12, .12); a.position.set(-side * .4, 4.15, 0); g.add(a);
      var b = new THREE.Mesh(G3.bulb, M.bulb); b.position.set(-side * .85, 4.05, 0); g.add(b);
      g.position.set(side * 5.6, .35, z); scene.add(g); decor.push({ m: g, len: 0 });
    }
    var SPH = new THREE.SphereGeometry(1, 12, 10), CYL = new THREE.CylinderGeometry(1, 1, 1, 10);
    function addProp(side, z) {
      var g = new THREE.Group(), r = Math.random(), x = side * rnd(5.3, 6.4);
      if (r < .5) {
        var tr = new THREE.Mesh(CYL, M.trunk); tr.scale.set(.18, 1.6, .18); tr.position.y = .8 + .35; g.add(tr);
        [[0, 2.5, 0, 1.1], [-.5, 2.1, .2, .8], [.5, 2.2, -.1, .85], [0, 3.1, 0, .75]].forEach(function (q, i) {
          var l = new THREE.Mesh(SPH, i % 2 ? M.leaf2 : M.leaf); l.scale.setScalar(q[3]); l.position.set(q[0], q[1] + .35, q[2]); g.add(l);
        });
      } else if (r < .75) {
        var hy = new THREE.Mesh(CYL, M.hydrant); hy.scale.set(.2, .7, .2); hy.position.y = .7; g.add(hy);
        var cp = new THREE.Mesh(SPH, M.hydrant); cp.scale.setScalar(.22); cp.position.y = 1.05; g.add(cp);
      } else {
        var mb = box(M.prop, .6, .9, .5); mb.position.y = .8; g.add(mb);
        var tp = new THREE.Mesh(CYL, M.prop); tp.scale.set(.3, .6, .3); tp.rotation.z = Math.PI / 2; tp.position.y = 1.25; g.add(tp);
      }
      g.position.set(x, 0, z); scene.add(g); decor.push({ m: g, len: 1 });
    }
    // oblaci (daleko, ne pomeraju se sa stazom)
    for (var ci = 0; ci < 7; ci++) {
      var cl = new THREE.Group(), cx = rnd(-90, 90), cy = rnd(38, 60), cz = rnd(-240, -200);
      for (var cj = 0; cj < 4; cj++) { var puff = new THREE.Mesh(SPH, M.cloud); puff.scale.set(rnd(6, 10), rnd(3, 5), 3); puff.position.set(cj * 6 - 9, Math.sin(cj) * 2, 0); cl.add(puff); }
      cl.position.set(cx, cy, cz); scene.add(cl);
    }
    var nextB = { '-1': 10, '1': 4 }, nextPylon = -10, nextLamp = -4, nextProp = -6;
    function fillDecor() {
      while (nextProp > SPAWN_Z) { addProp(Math.random() < .5 ? -1 : 1, nextProp); nextProp -= rnd(7, 13); }
      [-1, 1].forEach(function (s) { while (nextB[s] > SPAWN_Z - 30) { addBuilding(s, nextB[s]); nextB[s] -= rnd(10, 16); } });
      while (nextPylon > SPAWN_Z) { addPylon(nextPylon); nextPylon -= 36; }
      while (nextLamp > SPAWN_Z) { addLamp(Math.random() < .5 ? -1 : 1, nextLamp); nextLamp -= rnd(12, 20); }
    }

    /* ---------- junak, hoverboard, Doom ---------- */
    var hero = MM.Heroes.make(opts.hero || 'agent');
    scene.add(hero.root); hero.play('Sprint_Loop');
    var shadow = new THREE.Mesh(G3.plane, M.shadow); shadow.rotation.x = -Math.PI / 2; shadow.scale.set(1.3, 1.1, 1); scene.add(shadow);
    var bubble = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 16), new THREE.MeshPhongMaterial({ color: 0x5fd3ff, transparent: true, opacity: .2, shininess: 100, depthWrite: false }));
    bubble.position.y = .95; bubble.visible = false; scene.add(bubble);
    var board = MM.Heroes.boardMesh(opts.board || { c1: '#e62429', c2: '#ffd36b' }); board.visible = false; scene.add(board);
    var chaser = MM.Heroes.make('doom'); chaser.root.scale.multiplyScalar(1.15); chaser.root.position.set(0, 0, 14); scene.add(chaser.root); chaser.play('Sprint_Loop');

    /* ---------- ikonice za moci i tokene (Figma) ---------- */
    var ICON = {}, GLOW = null;
    function iconMat(name) {
      if (!ICON[name]) ICON[name] = new THREE.SpriteMaterial({ map: imgTex('img/ui/' + name + '.webp'), transparent: true, depthWrite: false });
      return ICON[name];
    }
    function glowMat() {
      if (!GLOW) {
        var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d');
        var gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        GLOW = new THREE.CanvasTexture(c);
      }
      return GLOW;
    }

    /* ---------- efekti ---------- */
    var fx = [];
    function pop(x, y, z, col) {
      var mm = M.fx.clone(); mm.color.set(col || 0xffe27a);
      var r = new THREE.Mesh(G3.ring, mm); r.position.set(x, y, z); scene.add(r); fx.push({ m: r, t: 0 });
    }

    /* ---------- stanje ---------- */
    var S = {
      t: 0, speed: 12, dist: 0, coins: 0, coinAcc: 0, score: 0, lane: 1, x: 0, y: 0, vy: 0, roll: 0, ground: 0,
      shield: 0, invuln: 0, stumbleAt: -99, stumbleT: 0, bump: 0, bumpT: 0, doomT: 3, over: false, paused: false, why: '',
      pw: { magnet: 0, jet: 0, x2: 0, jump: 0 }, board: 0, meter: 0, smash: !!opts.smash, anim: 'run', animT: 0,
      stats: { jumps: 0, rolls: 0, trains: 0, barriers: 0, powerups: 0, coins: 0, btok: 0, sections: 0 },
      objs: [], secEnd: -30, lastSec: [], tips: [], freeze: null, tut: !!opts.tutorial, landT: 0
    };
    var up = opts.up || {}, perk = opts.perk || {};
    var BP = opts.boardPerk || '';           // mala moc boarda
    var BASE = { magnet: 10, jet: 7, x2: 12, jump: 10, board: BP === 'time' ? 35 : BP === 'strip' ? 40 : 30 }, METER = BP === 'meter' ? 11 : 15;
    if (BP === 'start' || BP === 'strip') S.meter = METER;
    if (opts.startShield) S.shield = 1;
    function dur(k) { return BASE[k] * (1 + .2 * (up[k] || 0)) * (perk[k] || 1); }

    /* ---------- objekti ---------- */
    function add(o) { scene.add(o.m); S.objs.push(o); return o; }
    function mkTrain(lane, z, len, moving) {
      var mt = trainMats(Math.floor(Math.random() * TCOL.length), len, moving), g = new THREE.Group();
      var body = new THREE.Mesh(G3.box, [mt.side, mt.side, M.roof, M.under, M.roof, M.roof]);
      body.scale.set(TRAIN_W, BODY_TOP - .38, len); body.position.set(0, .38 + (BODY_TOP - .38) / 2, -len / 2); g.add(body);
      var rf = new THREE.Mesh(G3.roof, M.roof); rf.scale.set(TRAIN_W / 2, TRAIN_H - BODY_TOP, len); rf.position.set(0, BODY_TOP, -len / 2); g.add(rf);
      var wh = box(M.under, TRAIN_W - .35, .4, len - .5); wh.position.set(0, .22, -len / 2); g.add(wh);
      var fr = new THREE.Mesh(G3.plane, mt.front); fr.scale.set(TRAIN_W, TRAIN_H - .38, 1); fr.position.set(0, .38 + (TRAIN_H - .38) / 2, .015); g.add(fr);
      var bump = box(M.under, TRAIN_W + .05, .3, .3); bump.position.set(0, .32, -.05); g.add(bump);
      g.position.set(LX[lane], 0, z);
      return add({ t: 'train', lane: lane, m: g, len: len, v: 0, top: TRAIN_H });
    }
    var RAMP = null, RL = 7;
    function mkRamp(lane, z) {
      var w = TRAIN_W / 2, h = TRAIN_H;
      if (!RAMP) {
        var top = new THREE.BufferGeometry();
        top.setAttribute('position', new THREE.Float32BufferAttribute([-w, 0, 0, w, 0, 0, w, h, -RL, -w, h, -RL], 3));
        top.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
        top.setIndex([0, 1, 2, 0, 2, 3]); top.computeVertexNormals();
        var sides = new THREE.BufferGeometry();
        sides.setAttribute('position', new THREE.Float32BufferAttribute([w, 0, 0, w, 0, -RL, w, h, -RL, -w, 0, 0, -w, h, -RL, -w, 0, -RL], 3));
        sides.computeVertexNormals();
        RAMP = { top: top, sides: sides };
      }
      var g = new THREE.Group();
      g.add(new THREE.Mesh(RAMP.top, M.ramp));
      g.add(new THREE.Mesh(RAMP.sides, M.rampSide));
      g.position.set(LX[lane], 0, z);
      return add({ t: 'ramp', lane: lane, m: g, len: RL });
    }
    var redLamp = null;
    function mkBarrier(lane, z, kind) {
      var g = new THREE.Group();
      if (kind === 'X') {
        // zid: ne moze ni skok ni klizanje
        [-1, 1].forEach(function (s) { var p = box(M.post, .2, 3.1, .2); p.position.set(s * 1.08, 1.55, 0); g.add(p); });
        var pan = box(M.wall, 2.2, 2.7, .25); pan.position.set(0, 1.45, 0); g.add(pan);
        redLamp = redLamp || new THREE.MeshBasicMaterial({ color: 0xff3b30 });
        [-.7, 0, .7].forEach(function (x) { var lp = new THREE.Mesh(G3.bulb, redLamp); lp.position.set(x, 2.95, 0); g.add(lp); });
      } else {
        var high = kind === 'H', y0 = high ? 1.55 : .4, hh = high ? .75 : .65;
        [-1, 1].forEach(function (s) { var p = box(M.post, .14, y0 + hh, .14); p.position.set(s * 1.05, (y0 + hh) / 2, 0); g.add(p); });
        var b = box(high ? M.high : M.low, 2.2, hh, .16); b.position.set(0, y0 + hh / 2, 0); g.add(b);
        if (!high) { var b3 = box(M.low, 2.2, .14, .16); b3.position.set(0, .2, 0); g.add(b3); }
        else {
          redLamp = redLamp || new THREE.MeshBasicMaterial({ color: 0xff3b30 });
          [-.8, .8].forEach(function (x) { var lp = new THREE.Mesh(G3.bulb, redLamp); lp.position.set(x, y0 + hh + .14, 0); g.add(lp); });
        }
      }
      g.position.set(LX[lane], 0, z);
      return add({ t: kind === 'X' ? 'wall' : kind === 'H' ? 'high' : 'low', lane: lane, m: g, len: .2 });
    }
    /** Doombot: Doom stoji na sinama i gleda ka tebi. Samo druga traka. */
    function mkBot(lane, z) {
      var h = MM.Heroes.make('doom'); h.play('Idle_Loop'); h.update(Math.random() * 2);
      h.root.rotation.y = Math.PI; h.root.scale.multiplyScalar(1.05);
      var g = new THREE.Group(); g.add(h.root);
      var ring = new THREE.Mesh(new THREE.RingGeometry(.5, .8, 24), new THREE.MeshBasicMaterial({ color: 0x39d97a, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = .2; g.add(ring);
      g.position.set(LX[lane], 0, z);
      return add({ t: 'wall', bot: true, lane: lane, m: g, len: .4 });
    }
    var LASER = null;
    /** Laser: nizak (skoci) ili visok (provuci se). */
    function mkLaser(lane, z, high) {
      if (!LASER) LASER = { beam: new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }),
        glow: new THREE.MeshBasicMaterial({ color: 0xff5a5a, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false }),
        geo: new THREE.CylinderGeometry(.06, .06, 2.1, 8), geo2: new THREE.CylinderGeometry(.2, .2, 2.1, 10) };
      var g = new THREE.Group(), y = high ? 1.95 : .55;
      [-1, 1].forEach(function (s2) { var p = box(M.post, .18, y + .5, .18); p.position.set(s2 * 1.08, (y + .5) / 2, 0); g.add(p);
        var em = new THREE.Mesh(G3.bulb, LASER.beam); em.position.set(s2 * 1.08, y, 0); g.add(em); });
      var b = new THREE.Mesh(LASER.geo, LASER.beam); b.rotation.z = Math.PI / 2; b.position.y = y; g.add(b);
      var gl = new THREE.Mesh(LASER.geo2, LASER.glow); gl.rotation.z = Math.PI / 2; gl.position.y = y; g.add(gl);
      if (high) { var b2 = new THREE.Mesh(LASER.geo, LASER.beam); b2.rotation.z = Math.PI / 2; b2.position.y = y + .35; g.add(b2); }
      g.position.set(LX[lane], 0, z);
      return add({ t: high ? 'high' : 'low', laser: true, lane: lane, m: g, len: .2 });
    }
    var coinFace = null;
    function mkCoin(lane, z, y) {
      if (opts.battle) return { fake: true, m: { position: {} } };      // u borbi nema novcica
      if (!coinFace) coinFace = new THREE.MeshPhongMaterial({ map: imgTex('img/run/coin.webp'), emissive: 0x3a2600, shininess: 60, transparent: true, alphaTest: .3 });
      var m = new THREE.Group(), a = new THREE.Mesh(G3.coin, [M.coin, coinFace, coinFace]), b = new THREE.Mesh(G3.coin, [M.coin, coinFace, coinFace]);
      m.add(a); m.add(b); m.userData.dbl = b; m.userData.one = a;
      setDouble(m, S.pw.x2 > 0);
      m.position.set(LX[lane], y || 1, z);
      return add({ t: 'coin', lane: lane, m: m, y: y || 1, len: 0 });
    }
    function setDouble(m, on) {
      m.userData.dbl.visible = on;
      m.userData.one.position.x = on ? -.26 : 0; m.userData.dbl.position.x = .26;
      m.userData.one.scale.setScalar(on ? .85 : 1); m.userData.dbl.scale.setScalar(.85);
    }
    var PW_ICON = { magnet: 'magnet', jet: 'hammer', x2: 'x2', jump: 'web', shield: 'shield', btok: 'btoken' };
    var PW_COL = { magnet: 0xff3b30, shield: 0x5fd3ff, jet: 0xffd23f, x2: 0x39d97a, jump: 0xc46bff, btok: 0x3b8bff };
    var btokMat = null;
    function mkPickup(lane, z, kind) {
      if (kind === 'btok') {
        if (!btokMat) btokMat = [new THREE.MeshPhongMaterial({ color: 0x2f7fe8, emissive: 0x0a2a5a, shininess: 90 }),
          new THREE.MeshPhongMaterial({ map: imgTex('img/ui/btoken.webp'), emissive: 0x0a2040, shininess: 60, transparent: true, alphaTest: .3 })];
        var tk = new THREE.Mesh(G3.coin, [btokMat[0], btokMat[1], btokMat[1]]); tk.scale.setScalar(.8); tk.position.set(LX[lane], 1, z);
        return add({ t: 'btok', kind: 'btok', lane: lane, m: tk, y: 1, len: 0 });
      }
      var g = new THREE.Group();
      var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMat(), color: PW_COL[kind], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      gl.scale.set(2.2, 2.2, 1); g.add(gl);
      var ic = new THREE.Sprite(iconMat(PW_ICON[kind])); ic.scale.set(1.25, 1.25, 1); g.add(ic);
      g.position.set(LX[lane], 1.3, z);
      return add({ t: kind === 'btok' ? 'btok' : 'pw', kind: kind, lane: lane, m: g, y: 1.3, len: 0 });
    }

    /* ---------- deonice ----------
       Staza = rucno napravljene deonice (runsections.js) jedna za drugom,
       sa praznim razmakom izmedju (novcici, moc ili board token).
       Razmaci u deonici rastu sa brzinom (k), duzine vozova ne. */
    function tierNow() { return S.dist < 400 ? 0 : S.dist < 1200 ? 1 : S.dist < 2400 ? 2 : 3; }
    function chooseSection() {
      var tier = tierNow(), pool = [];
      SEC.SECTIONS.forEach(function (s) {
        if (s.nivo > tier || S.lastSec.indexOf(s.id) >= 0) return;
        var w = s.nivo === tier ? 3 : 1; for (var i = 0; i < w; i++) pool.push(s);
      });
      var s = rpick(pool);
      S.lastSec.push(s.id); if (S.lastSec.length > 3) S.lastSec.shift();
      return rr() < .5 ? SEC.mirror(s) : s;
    }
    function spawnSection() {
      var sec, k = Math.max(1, Math.min(1.45, S.speed / 17));
      if (S.tut && !S.tutDone) { sec = SEC.TUT; S.tutDone = true; k = 1; }
      else sec = chooseSection();
      // razmak pre deonice: novcici, a ponekad moc ili board token
      var gap = 10 * k, z0 = S.secEnd - gap;
      if (S.stats.sections > 0 || !S.tut) {
        var bl = Math.floor(rr() * 3), r = rr(), mid = S.secEnd - gap / 2;
        S.gaps = (S.gaps || 0) + 1;
        if (S.gaps % 3 === 2) for (var bt = 0; bt < 8; bt++) mkPickup(bl, S.secEnd - 1 - bt * 1.9 * k, 'btok');
        else if (r < .28 * (opts.pwRate || 1)) mkPickup(bl, mid, rpick(opts.battle ? ['magnet', 'shield', 'jet', 'jump', 'shield'] : ['magnet', 'shield', 'jet', 'x2', 'jump', 'magnet', 'x2']));
        else for (var c = 0; c < 4; c++) mkCoin(bl, S.secEnd - 1 - c * 2.4, 1);
      }
      SEC.parse(sec).forEach(function (o) {
        var z = z0 - o.d * k;
        if (o.t === 'T') mkTrain(o.lane, z, o.len, false);
        else if (o.t === 'R') {
          mkRamp(o.lane, z); var rt = mkTrain(o.lane, z - RL, o.len, false); rt.roofCoins = [];
          for (var i = 0; i < Math.floor(o.len / 2.6); i++) rt.roofCoins.push(mkCoin(o.lane, z - RL - 1.5 - i * 2.6, TRAIN_H + 1));
        }
        else if (o.t === 'M') {
          // krece dalje i brze: stigne do reda kad i ti
          var v = 7 + rr() * 3, tr = mkTrain(o.lane, z * (S.speed + v) / S.speed, o.len, true); tr.v = v;
        }
        else if (o.t === 'L' || o.t === 'H' || o.t === 'X') mkBarrier(o.lane, z, o.t);
        else if (o.t === 'G') mkBot(o.lane, z);
        else if (o.t === 'E' || o.t === 'U') mkLaser(o.lane, z, o.t === 'U');
        else if (o.t === 'c') for (var j = 0; j < o.n; j++) mkCoin(o.lane, z - j * 2.6, 1);
        else if (o.t === 'C') for (var q = 0; q < 7; q++) mkCoin(o.lane, z + 6 - q * 2, 1 + Math.sin(q / 6 * Math.PI) * 1.9);
        else if (o.t === 'p') mkPickup(o.lane, z, rpick(['magnet', 'jet', 'x2', 'jump', 'shield']));
        else if (o.t === 'k') { var tk = mkPickup(o.lane, z, 'btok'); if (sec === SEC.TUT) tk.val = 3; }
      });
      if (sec.tips) sec.tips.forEach(function (tp) { S.tips.push({ z: z0 - tp.d * k, need: tp.need, t: tp.t, done: false }); });
      S.secEnd = z0 - sec.duz * k;
      S.stats.sections++;
    }

    /** Da li voz u traci l stoji pored igraca (z oko 0), a igrac je ispod krova. */
    function trainBeside(l) {
      for (var i = 0; i < S.objs.length; i++) {
        var o = S.objs[i]; if (o.t !== 'train' || o.lane !== l) continue;
        var f = o.m.position.z, b = f - o.len;
        if (f > .6 && b < -.2 && S.y < o.top - .3) return true;
      }
      return false;
    }

    /* ---------- kontrole ---------- */
    function ev(n, x) { if (opts.onEvent) opts.onEvent(n, x); }
    function snd(n, o) { if (MM.Sfx && !S.paused) MM.Sfx.play(n, o); }
    function act(dir) {
      if (S.over || S.paused) return;
      var fz = S.freeze;
      if (fz) {
        // tutorijal: igra stoji dok ne uradis trazeno
        var okk = fz.need === 'side' ? (dir === 'left' || dir === 'right') : fz.need === dir;
        if (!okk) return;
        fz.done = true; S.freeze = null; ev('tipdone');
      }
      if (dir === 'left' || dir === 'right') {
        var nl = Math.max(0, Math.min(2, S.lane + (dir === 'left' ? -1 : 1)));
        if (nl !== S.lane) {
          if (trainBeside(nl)) { S.bump = dir === 'left' ? -1 : 1; S.bumpT = .25; stumble(); }
          else { S.lane = nl; snd('lane'); }
        }
      }
      var onG = S.y <= S.ground + .06;
      if (dir === 'up' && onG && S.pw.jet <= 0) {
        S.vy = S.pw.jump > 0 || (BP === 'jump' && S.board > 0) ? 20 : 14.2; S.roll = 0; S.stats.jumps++;
        hero.play('Jump_Start', { once: true, ts: 2.4, fade: .06, restart: true }); S.anim = 'jump'; S.animT = .3; snd('jump');
      }
      if (dir === 'down' && S.pw.jet <= 0) {
        S.roll = .72; S.stats.rolls++; if (!onG) S.vy = -28;
        hero.play('Roll', { once: true, ts: 1.75, fade: .04, restart: true, at: .08 }); S.anim = 'roll'; snd('roll');
      }
      ev('move');
    }
    function useBoard() {
      if (S.over || S.paused || S.board > 0 || S.meter < METER) return;
      S.meter = 0; S.board = dur('board'); S.boardHits = BP === 'hits' ? 2 : 1; board.visible = true; ev('board'); snd('board');
    }
    var sx = 0, sy = 0, swiped = false;
    function onDown(e) { sx = e.clientX; sy = e.clientY; swiped = false; }
    function onUp() { if (!swiped && S.meter >= METER && S.board <= 0) useBoard(); }
    function onMove(e) {
      if (swiped) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
      swiped = true;
      act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }
    function onKey(e) {
      if (e.key === 'Enter' || e.key === 'b') { useBoard(); return; }
      var k = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', ' ': 'up' }[e.key];
      if (k) { e.preventDefault(); act(k); }
    }
    var cv = renderer.domElement;
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    document.addEventListener('keydown', onKey);

    /* ---------- udarci ---------- */
    function stumble() {
      if (S.invuln > 0) return;
      S.stumbleT = .45;
      hero.play('Hit_Chest', { once: true, ts: 1.8, fade: .05, restart: true }); S.anim = 'hit'; S.animT = .4;
      if (S.t - S.stumbleAt < 8 && S.doomT > 0) { crash('Doom te je uhvatio!'); return; }
      S.stumbleAt = S.t; S.doomT = 5; S.invuln = .5; ev('stumble'); snd('land', { vol: 2.5, rate: .8 });
    }
    function clearNear() {
      // skloni prepreke ispred; novcici sa krova sklonjenog voza idu sa njim (inace lebde)
      S.objs.forEach(function (o) {
        if (o.t === 'coin' || o.t === 'pw' || o.t === 'btok') return;
        var f = o.m.position.z;
        if (f > -28 && f - o.len < 3) { o.gone = true; if (o.roofCoins) o.roofCoins.forEach(function (c) { c.gone = true; }); }
      });
      S.objs = S.objs.filter(function (o) { if (o.gone) { scene.remove(o.m); return false; } return true; });
    }
    var endTimer = 0, shake = 0;
    /** Udarac spreda: stit, board ili Hulk ga upiju, inace pad. */
    function crash(why, obj) {
      if (S.over) return;
      if (S.shield) { S.shield = 0; S.invuln = 1.4; bubble.visible = false; clearNear(); ev('shield'); snd('crash', { vol: .5, rate: 1.3 }); return; }
      if (S.board > 0) { S.boardHits = (S.boardHits || 1) - 1; if (S.boardHits <= 0) { S.board = 0; board.visible = false; } S.invuln = 1.4; clearNear(); ev('boardbreak'); snd('crash', { vol: .5, rate: 1.3 }); return; }
      if (S.smash && obj && (obj.t === 'low' || obj.t === 'high')) { S.smash = false; scene.remove(obj.m); obj.gone = true; ev('smash'); snd('crash', { vol: .6, rate: .8 }); S.invuln = 0; stumble(); return; }
      S.over = true; S.why = why || 'Udario si!'; S.doomT = 3; ev('crash'); snd('crash');
      hero.play('Death01', { once: true, ts: 1.4, fade: .08, restart: true }); S.anim = 'dead';
      shake = .45;
      clearTimeout(endTimer);
      endTimer = setTimeout(function () { if (S.over && opts.onEnd) opts.onEnd(result()); }, 1300);
    }
    function result() {
      return { score: Math.round(S.score), coins: S.coins, dist: Math.round(S.dist), stats: S.stats, why: S.why };
    }
    function take(kind, val) {
      if (kind === 'btok') {
        S.stats.btok++;
        if (S.board > 0) { S.board = Math.min(dur('board'), S.board + 2); ev('btokplus'); snd('token'); return; }
        if (S.meter < METER) { S.meter = Math.min(METER, S.meter + (val || 1)); ev(S.meter === METER ? 'boardready' : 'btok'); snd(S.meter === METER ? 'power' : 'token'); }
        return;
      }
      S.stats.powerups++;
      if (kind === 'shield') { S.shield = 1; bubble.visible = true; }
      else S.pw[kind] = dur(kind);
      if (kind === 'jet') { S.vy = 0; S.jetLane = S.lane; S.jetAcc = 0; S.jetN = 0; }
      ev('pw:' + kind); snd('power');
    }

    /* ---------- korak fizike ---------- */
    function step(dt) {
      S.t += dt;
      if (S.stumbleT > 0) S.stumbleT -= dt;
      if (S.bumpT > 0) S.bumpT -= dt;
      if (S.over || S.freeze) return;
      // tutorijal: stani ispred prepreke dok ne uradis potez
      for (var ti = 0; ti < S.tips.length; ti++) {
        var tp = S.tips[ti];
        if (!tp.done && tp.z > -({ side: 10, up: 4.6, down: 4.2 }[tp.need] || 12)) {
          if (tp.need === 'none') { tp.done = true; ev('tip', tp); }
          else { S.freeze = tp; ev('tip', tp); return; }
        }
      }
      S.speed = Math.min(33, 13 + S.t * .14 * (opts.accel || 1));
      var dz = S.speed * dt, x2 = S.pw.x2 > 0;
      if (x2 !== S.x2vis) { S.x2vis = x2; S.objs.forEach(function (o) { if (o.t === 'coin') setDouble(o.m, x2); }); }
      var mul = (opts.mul || 1) * (x2 ? 2 : 1);
      S.dist += dz;
      S.score += dz * mul;
      sleepOff += dz;
      M.ground.map.offset.y += dz / (400 / 30);
      M.graf.map.offset.x += dz / (400 / 12); M.graf2.map.offset.x -= dz / (400 / 12);
      S.tips.forEach(function (t2) { t2.z += dz; });

      Object.keys(S.pw).forEach(function (k) {
        if (S.pw[k] > 0) {
          S.pw[k] = Math.max(0, S.pw[k] - dt);
          if (k === 'jet' && S.pw[k] === 0) S.invuln = Math.max(S.invuln, 1.4);
        }
      });
      if (S.board > 0) { S.board = Math.max(0, S.board - dt); if (!S.board) board.visible = false; }
      if (S.invuln > 0) S.invuln -= dt;
      if (S.doomT > 0) S.doomT -= dt;

      S.secEnd += dz;
      while (S.secEnd > SPAWN_Z) spawnSection();
      var zi = Math.floor(S.dist / 1000) % ZONES.length;
      if (zi !== zoneI) { zoneFrom = zoneI; zoneI = zi; zoneT = 0; facades = FAC[zi]; ev('zone', ZONES[zi].name); }
      if (zoneT < 1) {
        zoneT = Math.min(1, zoneT + dt / 3);
        var A = ZONES[zoneFrom], B = ZONES[zoneI];
        drawSky(A.sky.map(function (c, i) { return mixHex(c, B.sky[i], zoneT); })); scene.background.needsUpdate = true;
        scene.fog.color.set(mixHex(A.fog, B.fog, zoneT));
        hemi.intensity = A.hemi + (B.hemi - A.hemi) * zoneT; sun.intensity = A.sun + (B.sun - A.sun) * zoneT;
        M.cloud.color.set(mixHex(A.cloud, B.cloud, zoneT));
      }
      if (S.pw.jet > 0) {
        S.jetAcc = (S.jetAcc || 0) + dz;
        var ahead = 22, lead = ahead / S.speed;          // koliko treba novcicu da stigne do tebe
        while (S.jetAcc >= 2.6) {
          S.jetAcc -= 2.6;
          if (S.pw.jet - lead < .4) continue;            // ne stize pre kraja leta: ne pravi ga
          // novcici dolaze u traci u kojoj letis (promenis traku = staza ide za tobom)
          var cc = mkCoin(S.lane, -ahead + S.jetAcc, JET_Y + 1); cc.air = true; S.jetN++;
        }
      }
      for (var i = 0; i < decor.length; i++) decor[i].m.position.z += dz;
      decor = decor.filter(function (o) { if (o.m.position.z - o.len > 22) { scene.remove(o.m); return false; } return true; });
      nextB['-1'] += dz; nextB['1'] += dz; nextPylon += dz; nextLamp += dz; nextProp += dz;
      fillDecor();

      S.x += (LX[S.lane] - S.x) * Math.min(1, dt * 14);

      // podloga ispod igraca: krov voza ili rampa
      var support = 0;
      for (var j = 0; j < S.objs.length; j++) {
        var o = S.objs[j];
        if (o.t !== 'train' && o.t !== 'ramp') continue;
        if (Math.abs(LX[o.lane] - S.x) > 1.2) continue;
        // gde ce biti posle ovog kadra (inace visina rampe kasni jedan kadar)
        var f = o.m.position.z + dz + (o.v ? o.v * dt : 0), b = f - o.len;
        if (f < -.3 || b > .3) continue;
        support = Math.max(support, o.t === 'train' ? o.top : Math.min(TRAIN_H, Math.max(0, f) / o.len * TRAIN_H));
      }
      var wasAir = S.y > S.ground + .06;
      if (S.pw.jet > 0) { S.y += (JET_Y - S.y) * Math.min(1, dt * 3); S.vy = 0; }
      else {
        S.vy -= 40 * dt; S.y += S.vy * dt;
        if (S.y <= support + .001 && support - S.y < 1.1) { S.y = support; if (S.vy < 0) S.vy = 0; if (wasAir) { S.landT = .14; if (S.pw.jet <= 0) snd('land'); } }
      }
      if (S.y < 0) { S.y = 0; S.vy = Math.max(0, S.vy); }
      S.ground = support;
      if (S.roll > 0) S.roll -= dt;
      if (S.landT > 0) S.landT -= dt;

      // let NIJE magnet: novcici u vazduhu stoje, ti proletis kroz njih
      var magnetOn = S.pw.magnet > 0 || ((BP === 'magnet' || BP === 'strip') && S.board > 0);
      S.objs = S.objs.filter(function (o) {
        if (o.gone) return false;
        o.m.position.z += dz + (o.v ? o.v * dt : 0);
        var z = o.m.position.z;
        if (o.t === 'coin' || o.t === 'pw' || o.t === 'btok') {
          if (o.t === 'coin') o.m.rotation.y = S.x2vis ? Math.sin(S.t * 3) * .5 : o.m.rotation.y + dt * 4;
          else if (o.t === 'btok') o.m.rotation.y += dt * 4;
          else o.m.position.y = o.y + Math.sin(S.t * 3 + z) * .15;
          if (o.air && (S.pw.jet <= 0 || z > 1.5)) { scene.remove(o.m); return false; }
          // u letu novcici idu u tvoju traku, pa ih uvek pokupis
          if (o.air) o.m.position.x += (S.x - o.m.position.x) * Math.min(1, dt * 5);
          if (o.t === 'coin' && (o.pulled || (magnetOn && z > -16 && z < .5 && (S.pw.jet > 0 ? o.air : !o.air)))) {
            o.pulled = true;
            var kk = Math.min(1, dt * 10);
            o.m.position.x += (S.x - o.m.position.x) * kk; o.m.position.y += (S.y + 1 - o.m.position.y) * kk; o.m.position.z += (0 - z) * Math.min(1, dt * 12);
          }
          var p = o.m.position;
          var near = o.pulled ? (p.z > -1.5 || Math.hypot(p.x - S.x, p.y - S.y - 1, p.z) < 1.6)
            : o.air ? (Math.abs(p.z) < 1.1 && Math.abs(p.x - S.x) < 1.4 && Math.abs(p.y - (S.y + 1)) < 2.2)
            : (Math.abs(p.z) < .9 && Math.abs(p.x - S.x) < 1 && Math.abs(p.y - (S.y + 1)) < 1.4);
          if (near) {
            scene.remove(o.m);
            if (o.t === 'coin') {
              S.coinAcc += (x2 ? 2 : 1) * ((BP === 'coins' || BP === 'strip') && S.board > 0 ? 2 : 1) * (opts.coinMul || 1); var whole = Math.floor(S.coinAcc); S.coins += whole; S.coinAcc -= whole;
              S.stats.coins++; S.score += 5 * mul; pop(p.x, p.y, p.z); snd('coin');
            } else { take(o.kind, o.val); pop(p.x, p.y, p.z, PW_COL[o.kind]); }
            return false;
          }
        } else if (!o.hit && !S.over) {
          var front = z, back = z - o.len;
          if (Math.abs(LX[o.lane] - S.x) < 1.05 && front > -.35 && back < .35) {
            var feet = S.y, flying = S.pw.jet > 0;
            if (o.t === 'train') {
              if (feet < o.top - .4) { o.hit = true; if (S.invuln <= 0) crash(o.v ? 'Voz ti je došao u susret!' : 'Udario si u voz!', o); }
              else if (!o.counted) { o.counted = true; S.stats.trains++; }
            } else if (o.t === 'low') {
              if (feet < .9 && !flying) { o.hit = true; if (S.invuln <= 0) crash(o.laser ? 'Laser!' : 'Barijera!', o); }
              else if (!o.counted) { o.counted = true; S.stats.barriers++; }
            } else if (o.t === 'high') {
              if (S.roll <= 0 && feet < 2.3 && !flying) { o.hit = true; if (S.invuln <= 0) crash('Glavom u kapiju!', o); }
              else if (!o.counted) { o.counted = true; S.stats.barriers++; }
            } else if (o.t === 'wall') {
              if (feet < 2.8 && !flying) { o.hit = true; if (S.invuln <= 0) crash(o.bot ? 'Doombot te je zaustavio!' : 'Udario si u zid!', o); }
            }
          }
        }
        if (z - (o.len || 0) > 14) { scene.remove(o.m); return false; }
        return true;
      });
    }

    /* ---------- animacija junaka ---------- */
    function animate(dt) {
      var onG = S.y <= S.ground + .06 && S.pw.jet <= 0, fly = S.pw.jet > 0;
      if (S.animT > 0) S.animT -= dt;
      if (S.anim === 'dead') { hero.update(dt); return; }
      if (fly) { if (S.anim !== 'fly') { hero.play('Swim_Fwd_Loop', { ts: 1.1, fade: .25 }); S.anim = 'fly'; } }
      else if (S.anim === 'roll') { if (S.roll <= .12) { hero.play(S.board > 0 ? 'Crouch_Idle_Loop' : 'Sprint_Loop', { fade: .14 }); S.anim = S.board > 0 ? 'ride' : 'run'; } }
      else if (S.anim === 'hit') { if (S.animT <= 0) { hero.play('Sprint_Loop', { fade: .15 }); S.anim = 'run'; } }
      else if (!onG) {
        if (S.anim === 'jump' && S.animT <= 0) { hero.play('Jump_Loop', { fade: .1 }); S.anim = 'air'; }
        else if (S.anim === 'run' || S.anim === 'fly') { hero.play('Jump_Loop', { fade: .15 }); S.anim = 'air'; }
      } else if (S.anim === 'air' || S.anim === 'jump' || S.anim === 'fly') {
        hero.play('Jump_Land', { once: true, ts: 2.6, fade: .05, at: .35 }); S.anim = 'land'; S.animT = .16;
      } else if (S.anim === 'land' && S.animT <= 0) { S.anim = 'run'; }
      // na boardu: surferski cucanj; inace sprint
      if (S.anim === 'run' || S.anim === 'ride') {
        if (S.board > 0) { if (S.anim !== 'ride' || hero.current() !== 'Crouch_Idle_Loop') hero.play('Crouch_Idle_Loop', { fade: .15 }); S.anim = 'ride'; }
        else { hero.play('Sprint_Loop', { ts: .8 + S.speed / 45, fade: .12 }); S.anim = 'run'; }
      }
      hero.update(S.freeze ? dt * .15 : dt);
    }

    /* ---------- crtanje ---------- */
    function draw(dt) {
      placeSleepers();
      var bx = S.bumpT > 0 ? S.bump * Math.sin(S.bumpT / .25 * Math.PI) * .5 : 0, onBoard = S.board > 0;
      var lean = (LX[S.lane] - S.x), riding = onBoard && S.anim === 'ride';
      hero.root.position.set(S.x + bx, S.y + (onBoard ? .26 : 0), 0);
      hero.root.rotation.x = S.pw.jet > 0 ? -.15 : 0;
      hero.root.rotation.z = lean * (riding ? .22 : .08);
      hero.root.rotation.y = riding ? -.35 + lean * -.15 + Math.sin(S.t * 2) * .06 : lean * -.18;
      animate(dt);
      hero.root.visible = !(S.invuln > 0 && !S.over && Math.floor(S.t * 16) % 2);
      bubble.visible = !!S.shield; bubble.position.set(S.x + bx, S.y + .95, 0); bubble.rotation.y += dt;
      board.position.set(S.x + bx, S.y + .2 + Math.sin(S.t * 7) * .03, -.05);
      board.rotation.z = lean * .3; board.rotation.y = lean * -.12; board.rotation.x = -.04 + Math.sin(S.t * 4) * .03;
      if (board.userData.trail) board.userData.trail.material.opacity = .55 + Math.sin(S.t * 20) * .1;
      if (board.userData.jets) board.userData.jets.forEach(function (j, i) { j.scale.y = .8 + Math.random() * .5; });
      shadow.position.set(S.x, S.ground + .19, .1);
      var hgt = Math.max(0, S.y - S.ground); shadow.scale.set(1.3 / (1 + hgt * .25), 1.1 / (1 + hgt * .25), 1);

      // Doom iza tebe
      var tz = S.doomT > 0 ? (S.over ? 1.8 : 2.6) : 15;
      chaser.root.position.x += (S.x + (S.over ? 0 : (S.x > 1 ? -1.3 : 1.3)) - chaser.root.position.x) * Math.min(1, dt * 5);
      chaser.root.position.z += (tz - chaser.root.position.z) * Math.min(1, dt * 2.5);
      chaser.root.position.y += (S.ground - chaser.root.position.y) * Math.min(1, dt * 8);
      chaser.root.visible = chaser.root.position.z < 12;
      if (chaser.root.visible) { chaser.play(S.over ? 'Idle_Loop' : 'Sprint_Loop', { fade: .3 }); chaser.update(dt); }

      fx = fx.filter(function (f) {
        f.t += dt; f.m.scale.setScalar(1 + f.t * 6); f.m.material.opacity = Math.max(0, 1 - f.t / .3);
        f.m.lookAt(cam.position);
        if (f.t > .3) { scene.remove(f.m); f.m.material.dispose(); return false; }
        return true;
      });

      // kamera prati
      var fly = S.pw.jet > 0, cy = fly ? S.y + 3.4 : 4.0 + S.y * .7, cz = 6.7 + (fly ? 1.5 : 0);
      cam.position.x += (S.x * .55 - cam.position.x) * Math.min(1, dt * 6);
      cam.position.y += (cy - cam.position.y) * Math.min(1, dt * 4);
      cam.position.z += (cz - cam.position.z) * Math.min(1, dt * 3);
      var fov = 60 + (S.speed - 12) * .35;
      if (Math.abs(cam.fov - fov) > .05) { cam.fov = fov; cam.updateProjectionMatrix(); }
      if (shake > 0) { shake -= dt; cam.position.x += (Math.random() - .5) * shake; cam.position.y += (Math.random() - .5) * shake; }
      cam.lookAt(S.x * .45, fly ? S.y : 1.5 + S.y * .6, -12);
      renderer.render(scene, cam);
    }

    var raf = 0, last = performance.now(), hudT = 0, alive = true;
    function loop(now) {
      if (!alive) return;
      var dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now;
      if (!S.paused) { step(dt); draw(dt); }
      hudT -= dt;
      if (hudT <= 0 && opts.onHud) { hudT = .1; opts.onHud(hudState()); }
      raf = requestAnimationFrame(loop);
    }
    function hudState() {
      return { score: Math.round(S.score), coins: S.coins, mul: (opts.mul || 1) * (S.pw.x2 > 0 ? 2 : 1), x2: S.pw.x2 > 0, pw: S.pw, shield: S.shield,
        dist: Math.round(S.dist), board: S.board, meter: S.meter, meterMax: METER, freeze: S.freeze,
        max: { magnet: dur('magnet'), jet: dur('jet'), x2: dur('x2'), jump: dur('jump'), board: dur('board') } };
    }
    fillDecor();
    while (S.secEnd > SPAWN_Z) spawnSection();
    raf = requestAnimationFrame(loop);

    function onResize() {
      var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);
    function onVis() { if (document.hidden && !S.over && !S.paused && opts.onHidden) opts.onHidden(); }
    document.addEventListener('visibilitychange', onVis);

    return {
      act: act, useBoard: useBoard, result: result,
      pause: function () { S.paused = true; },
      resume: function () { S.paused = false; last = performance.now(); },
      paused: function () { return S.paused; },
      revive: function () {
        clearTimeout(endTimer);
        S.over = false; S.invuln = 2.5; S.doomT = 0; S.why = ''; S.vy = 0; S.roll = 0;
        hero.play('Sprint_Loop', { fade: .2, restart: true }); S.anim = 'run';
        clearNear();
        last = performance.now();
      },
      stop: function () {
        alive = false; clearTimeout(endTimer);
        cancelAnimationFrame(raf);
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
      _take: function (k) { take(k); },
      _clearNear: function () { clearNear(); },
      _state: function () { return S; }
    };
  }

  MM.Run3D = { create: create };
})();
