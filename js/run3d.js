/* ============================================================
   run3d.js  -  Marvel Runner, 3D motor (Three.js r149, js/vendor)
   ------------------------------------------------------------
   Igrac stoji na z = 0 i gleda ka -z; svet putuje ka kameri (+z).
   Tri trake. Vozovi (stoje ili idu ka tebi), rampe za penjanje na
   krov, barijere (skoci), kapije (provuci se), novcici, moci.

   Udarac spreda = pad. Ako probas da predjes u traku gde je voz
   pored tebe = saplices se i Doom krene za tobom; drugo saplitanje
   dok je on iza tebe = uhvatio te.

   Fer staza: uvek postoji slobodna traka do koje stizes (spawnRow).
   Pokretni vozovi se racunaju po mestu gde ce te sresti.

   Likovi su 3D lutke (glava, trup, ruke, noge sa zglobovima), pa
   imaju pravo trcanje, skok, kolut i naginjanje. Boje po liku: PAL.

   create(host, opts) -> { act, useBoard, pause, resume, revive, stop, result }
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var LX = [-2.6, 0, 2.6];                 // x traka
  var TRAIN_H = 2.9, TRAIN_W = 2.3, BODY_TOP = 2.5;
  var SPAWN_Z = -160;

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
  function skyTex() {
    return canvasTex(16, 512, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#3b6fd6'); gr.addColorStop(.5, '#7fb4f0'); gr.addColorStop(.8, '#ffd9b0'); gr.addColorStop(1, '#ffe6c4');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
  }
  function ballastTex() {
    return canvasTex(256, 256, function (g, w, h) {
      g.fillStyle = '#9a7356'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 1800; i++) {
        g.fillStyle = Math.random() < .5 ? 'rgba(60,40,25,.16)' : 'rgba(255,225,190,.12)';
        g.beginPath(); g.arc(Math.random() * w, Math.random() * h, rnd(.8, 2.6), 0, 7); g.fill();
      }
    }, [5, 30]);
  }
  function sleeperTex() {
    return canvasTex(64, 16, function (g, w, h) {
      g.fillStyle = '#7a5038'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,.2)'; for (var i = 0; i < 6; i++) g.fillRect(0, rnd(0, h), w, 1);
      g.fillStyle = '#5c6470'; g.fillRect(9, 3, 6, 10); g.fillRect(w - 15, 3, 6, 10);
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
  function facadeTex(base) {
    return canvasTex(128, 256, function (g, w, h) {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,.1)'; for (var y = 0; y < h; y += 8) g.fillRect(0, y, w, 1);
      for (var r = 0; r < 7; r++) for (var c = 0; c < 3; c++) {
        g.fillStyle = Math.random() < .2 ? '#ffe2a0' : '#33415a'; g.fillRect(14 + c * 38, 16 + r * 34, 24, 22);
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
  function shieldTex() {
    return canvasTex(128, 128, function (g) {
      [['#c8202b', 62], ['#eef1f5', 50], ['#c8202b', 38], ['#1f4fa8', 26]].forEach(function (r) { g.fillStyle = r[0]; g.beginPath(); g.arc(64, 64, r[1], 0, 7); g.fill(); });
      g.fillStyle = '#fff'; g.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 9 : 22; g.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); }
      g.closePath(); g.fill();
    });
  }

  /* ---------------- likovi: boje ---------------- */
  // suit/suit2 = odelo i detalji, head = glava (kaciga ili koza), hair, cape, big = krupniji
  var PAL = {
    agent: { suit: '#1f242d', suit2: '#38414e', skin: '#e2b58f', head: '#e2b58f', hair: '#3a2a1e', boots: '#121418', glove: '#e2b58f' },
    iron: { suit: '#b3141b', suit2: '#f2b928', skin: '#b3141b', head: '#b3141b', boots: '#b3141b', glove: '#f2b928', pads: '#f2b928', arm2: '#f2b928', pack: true },
    cap: { suit: '#1f3a8a', suit2: '#c8202b', skin: '#e2b58f', head: '#1f3a8a', boots: '#7a2a1c', glove: '#7a2a1c', shield: true },
    thor: { suit: '#262b35', suit2: '#9aa7b8', skin: '#e2b58f', head: '#e2b58f', hair: '#e7c35a', boots: '#262b35', glove: '#262b35', cape: '#b3141b', tail: true, pads: '#9aa7b8', arm2: '#e2b58f' },
    hulk: { suit: '#4f9a3a', suit2: '#5b3a8a', skin: '#4f9a3a', head: '#4f9a3a', hair: '#1b1d18', boots: '#4f9a3a', glove: '#4f9a3a', big: 1.25, shorts: true },
    widow: { suit: '#15171c', suit2: '#3a3f48', skin: '#f0c8a8', head: '#f0c8a8', hair: '#b3311b', boots: '#15171c', glove: '#15171c', tail: true },
    spidey: { suit: '#c8202b', suit2: '#1f4fa8', skin: '#c8202b', head: '#c8202b', boots: '#c8202b', glove: '#c8202b', limbs2: true },
    panther: { suit: '#17181f', suit2: '#7a5cd6', skin: '#17181f', head: '#17181f', boots: '#17181f', glove: '#17181f', pads: '#3a3550', ears: true },
    strange: { suit: '#1f3a6b', suit2: '#c9a24a', skin: '#e2b58f', head: '#e2b58f', hair: '#2a2420', boots: '#3a2a20', glove: '#e2b58f', cape: '#b3141b' },
    ant: { suit: '#b3141b', suit2: '#1a1a1a', skin: '#9aa7b8', head: '#9aa7b8', boots: '#1a1a1a', glove: '#1a1a1a', limbs2: true, ears: true },
    marvel: { suit: '#1f3a8a', suit2: '#c8202b', skin: '#f0c8a8', head: '#f0c8a8', hair: '#e7c35a', boots: '#c8202b', glove: '#c8202b', tail: true },
    deadpool: { suit: '#a8141b', suit2: '#1a1a1a', skin: '#a8141b', head: '#a8141b', boots: '#1a1a1a', glove: '#1a1a1a', swords: true },
    doom: { suit: '#5c636e', suit2: '#2e5a2e', skin: '#9aa3ad', head: '#9aa3ad', hair: '#2e5a2e', boots: '#5c636e', glove: '#5c636e', cape: '#2e5a2e', hood: true, big: 1.08 }
  };

  var loader = null;

  /* ============================================================ */
  function create(host, opts) {
    loader = loader || new THREE.TextureLoader();
    var W = host.clientWidth || 360, H = host.clientHeight || 640;
    var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    renderer.setSize(W, H);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.domElement.className = 'r3-cv';
    host.insertBefore(renderer.domElement, host.firstChild);

    var scene = new THREE.Scene();
    scene.background = skyTex();
    scene.fog = new THREE.Fog(0xffe0c0, 70, 175);
    var cam = new THREE.PerspectiveCamera(60, W / H, .1, 280);
    cam.position.set(0, 4.1, 6.9);

    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x7a5a42, .75));
    var sun = new THREE.DirectionalLight(0xffffff, .8); sun.position.set(-7, 15, 6); scene.add(sun);

    /* ---------- materijali i geometrije ---------- */
    var L = function (o) { return new THREE.MeshLambertMaterial(o); };
    var M = {
      ground: L({ map: ballastTex() }),
      side: L({ color: 0x9c8a74 }),
      walk: L({ color: 0xd6c9b4 }),
      rail: new THREE.MeshPhongMaterial({ color: 0xc8d0d8, shininess: 90, specular: 0xffffff }),
      sleeper: L({ map: sleeperTex() }),
      roof: L({ color: 0x8a929d }),
      under: L({ color: 0x2a2d33 }),
      ramp: L({ map: rampTex() }),
      rampSide: L({ color: 0x6b737e }),
      low: L({ map: stripeTex('#ffffff', '#e62429', 5) }),
      high: L({ map: stripeTex('#ffcc1a', '#1b1410', 6) }),
      post: L({ color: 0x5a616b }),
      coin: new THREE.MeshPhongMaterial({ color: 0xe0a21a, emissive: 0x5a3a00, shininess: 90, specular: 0xffffff }),
      lamp: L({ color: 0x3a3f48 }),
      bulb: new THREE.MeshBasicMaterial({ color: 0xfff1b0 }),
      wall: L({ map: wallTex() }),
      wall2: L({ map: wallTex() }),
      shadow: new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }),
      fx: new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    };
    var G3 = {
      box: new THREE.BoxGeometry(1, 1, 1),
      coin: new THREE.CylinderGeometry(.42, .42, .1, 20),
      plane: new THREE.PlaneGeometry(1, 1),
      roof: new THREE.CylinderGeometry(1, 1, 1, 18, 1, true, -Math.PI / 2, Math.PI),
      ring: new THREE.RingGeometry(.3, .45, 20)
    };
    G3.coin.rotateX(Math.PI / 2); G3.coin.rotateY(0);
    G3.roof.rotateX(-Math.PI / 2);
    function box(mat, w, h, d) { var m = new THREE.Mesh(G3.box, mat); m.scale.set(w, h, d); return m; }

    // vozovi: materijali po boji i duzini (bez kloniranja tekstura po vozu)
    var TCOL = ['#d6232b', '#2b6fd6', '#e9a21a', '#2f9a5a'], TLEN = [16, 20, 24, 28];
    var TMAT = {};
    function trainMats(ci, li, moving) {
      var k = ci + '-' + li + (moving ? 'm' : '');
      if (!TMAT[k]) {
        var side = trainSideTex(TCOL[ci]); side.wrapS = THREE.RepeatWrapping; side.repeat.set(TLEN[li] / 8, 1);
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
      var wl = new THREE.Mesh(new THREE.PlaneGeometry(400, 2.2), s < 0 ? M.wall : M.wall2);
      wl.rotation.y = s < 0 ? Math.PI / 2 : -Math.PI / 2; wl.position.set(s * 7.1, 1.1, -150); scene.add(wl);
      var cap = box(M.post, .3, .2, 400); cap.position.set(s * 7.15, 2.25, -150); scene.add(cap);
    });
    LX.forEach(function (x) {
      [-.62, .62].forEach(function (o) { var r = box(M.rail, .1, .14, 400); r.position.set(x + o, .17, -150); scene.add(r); });
    });
    var SLEEP_N = 72, SLEEP_D = 2.3;
    var sleepers = new THREE.InstancedMesh(G3.box, M.sleeper, SLEEP_N * 3);
    scene.add(sleepers);
    var dummy = new THREE.Object3D(), sleepOff = 0;
    function placeSleepers() {
      var k = 0, off = sleepOff % SLEEP_D;
      for (var l = 0; l < 3; l++) for (var i = 0; i < SLEEP_N; i++) {
        dummy.position.set(LX[l], .08, 12 - i * SLEEP_D + off); dummy.scale.set(1.8, .12, .42); dummy.updateMatrix();
        sleepers.setMatrixAt(k++, dummy.matrix);
      }
      sleepers.instanceMatrix.needsUpdate = true;
    }
    placeSleepers();

    /* ---------- dekor (reciklira se) ---------- */
    var facades = ['#d9825a', '#e6c08f', '#82a9bb', '#c25a50', '#ecc970', '#9a78b3', '#7fb48c'].map(function (c) { return L({ map: facadeTex(c) }); });
    var roofMat = L({ color: 0x5a4a44 }), tankGeo = new THREE.CylinderGeometry(.9, .9, 1.8, 10), bulbGeo = new THREE.SphereGeometry(.18, 8, 8);
    var decor = [];
    function addBuilding(side, z) {
      var h = rnd(8, 20), w = rnd(6, 10), d = rnd(9, 14), g = new THREE.Group();
      var b = box(pick(facades), w, h, d); b.position.y = h / 2; g.add(b);
      var rf = box(roofMat, w + .4, .5, d + .4); rf.position.y = h + .25; g.add(rf);
      if (Math.random() < .4) { var tank = new THREE.Mesh(tankGeo, roofMat); tank.position.set(rnd(-w / 4, w / 4), h + 1.4, 0); g.add(tank); }
      g.position.set(side * (8.5 + w / 2 + rnd(0, 2.5)), 0, z - d / 2);
      scene.add(g); decor.push({ m: g, len: d / 2 + 2 });
    }
    function addPylon(z) {
      var g = new THREE.Group();
      [-1, 1].forEach(function (s) { var p = box(M.lamp, .22, 7.7, .22); p.position.set(s * 4.4, 3.85, 0); g.add(p); });
      var bar = box(M.lamp, 9, .18, .18); bar.position.set(0, 7.6, 0); g.add(bar);
      g.position.z = z; scene.add(g); decor.push({ m: g, len: 0 });
    }
    function addLamp(side, z) {
      var g = new THREE.Group();
      var p = box(M.lamp, .16, 4.2, .16); p.position.set(0, 2.1, 0); g.add(p);
      var a = box(M.lamp, .9, .12, .12); a.position.set(-side * .4, 4.15, 0); g.add(a);
      var b = new THREE.Mesh(bulbGeo, M.bulb); b.position.set(-side * .85, 4.05, 0); g.add(b);
      g.position.set(side * 5.6, .35, z); scene.add(g); decor.push({ m: g, len: 0 });
    }
    var nextB = { '-1': 10, '1': 4 }, nextPylon = -10, nextLamp = -4;
    function fillDecor() {
      [-1, 1].forEach(function (s) { while (nextB[s] > SPAWN_Z - 30) { addBuilding(s, nextB[s]); nextB[s] -= rnd(10, 16); } });
      while (nextPylon > SPAWN_Z) { addPylon(nextPylon); nextPylon -= 36; }
      while (nextLamp > SPAWN_Z) { addLamp(Math.random() < .5 ? -1 : 1, nextLamp); nextLamp -= rnd(12, 20); }
    }

    /* ---------- lutka lika ---------- */
    var CAPS = {};
    function capsule(r, len) { var k = r + ':' + len; return CAPS[k] || (CAPS[k] = new THREE.CapsuleGeometry(r, len, 4, 12)); }
    var SPH = new THREE.SphereGeometry(1, 20, 14);
    // cel-shading: 3 nivoa svetla, kao crtani
    var TOON = (function () {
      var d = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
      var t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
    })();
    /** Chibi lutka: velika glava, kratke noge (kao slike u meniju). Napred = -z. */
    function mkHero(pal) {
      var mats = {};
      function m(c) { return mats[c] || (mats[c] = new THREE.MeshToonMaterial({ color: c, gradientMap: TOON })); }
      var root = new THREE.Group(), spin = new THREE.Group(), rig = new THREE.Group();
      spin.position.y = .55; rig.position.y = -.55; root.add(spin); spin.add(rig);
      var big = pal.big || 1;
      var hips = new THREE.Group(); hips.position.y = .62; rig.add(hips);
      var torso = new THREE.Group(); hips.add(torso);
      var chest = new THREE.Mesh(capsule(.22, .18), m(pal.suit)); chest.position.y = .25; chest.scale.set(1.15 * big, 1, .85 * big); torso.add(chest);
      var belt = new THREE.Mesh(capsule(.2, .02), m(pal.suit2)); belt.position.y = .07; belt.scale.set(1.2 * big, .55, .9 * big); torso.add(belt);
      if (pal.shorts) { var sh = new THREE.Mesh(capsule(.21, .06), m(pal.suit2)); sh.position.y = .02; sh.scale.set(1.25 * big, .9, .95 * big); torso.add(sh); }
      // stvari na ledjima (vidis ih jer trci od tebe)
      if (pal.pack) [-1, 1].forEach(function (s2) { var j = new THREE.Mesh(capsule(.06, .12), m(pal.suit2)); j.position.set(s2 * .1, .27, .2); torso.add(j); });
      if (pal.swords) [-1, 1].forEach(function (s2) { var k = box(m('#2a2d33'), .04, .7, .04); k.position.set(0, .35, .22); k.rotation.z = s2 * .55; torso.add(k); });
      [-1, 1].forEach(function (s2) { var pad = new THREE.Mesh(SPH, m(pal.pads || pal.suit)); pad.scale.set(.11 * big, .09, .11); pad.position.set(s2 * .27 * big, .4, 0); torso.add(pad); });
      var head = new THREE.Group(); head.position.y = .5; torso.add(head);
      var hd = new THREE.Mesh(SPH, m(pal.head)); hd.scale.set(.27, .28, .27); hd.position.y = .14; head.add(hd);
      if (pal.hair) { var hr = new THREE.Mesh(SPH, m(pal.hair)); hr.scale.set(.29, pal.hood ? .31 : .25, .29); hr.position.set(0, pal.hood ? .15 : .2, .035); head.add(hr); }
      if (pal.tail) { var tl = new THREE.Mesh(capsule(.08, .22), m(pal.hair)); tl.position.set(0, -.02, .24); tl.rotation.x = .3; head.add(tl); }
      if (pal.ears) [-1, 1].forEach(function (s2) { var e = new THREE.Mesh(capsule(.02, .2), m(pal.suit2)); e.position.set(s2 * .12, .44, 0); e.rotation.z = -s2 * .4; head.add(e); });
      if (pal.horns) [-1, 1].forEach(function (s2) { var e = new THREE.Mesh(capsule(.035, .12), m(pal.suit2)); e.position.set(s2 * .16, .34, 0); e.rotation.z = -s2 * .6; head.add(e); });
      var legs = [], arms = [];
      [-1, 1].forEach(function (s) {
        var th = new THREE.Group(); th.position.set(s * .11 * big, 0, 0); hips.add(th);
        var tm = new THREE.Mesh(capsule(.1 * big, .13), m(pal.shorts ? pal.skin : pal.suit)); tm.position.y = -.14; th.add(tm);
        var kn = new THREE.Group(); kn.position.y = -.29; th.add(kn);
        var sm = new THREE.Mesh(capsule(.09 * big, .11), m(pal.shorts ? pal.skin : pal.limbs2 ? pal.suit2 : pal.suit)); sm.position.y = -.11; kn.add(sm);
        var bt = new THREE.Mesh(capsule(.085 * big, .14), m(pal.boots)); bt.rotation.x = Math.PI / 2; bt.position.set(0, -.26, -.05); kn.add(bt);
        legs.push({ th: th, kn: kn });
        var sh2 = new THREE.Group(); sh2.position.set(s * .29 * big, .38, 0); torso.add(sh2);
        var ua = new THREE.Mesh(capsule(.075 * big, .1), m(pal.limbs2 ? pal.suit2 : pal.suit)); ua.position.y = -.1; sh2.add(ua);
        var el = new THREE.Group(); el.position.y = -.2; sh2.add(el);
        var fa = new THREE.Mesh(capsule(.07 * big, .08), m(pal.arm2 || pal.suit)); fa.position.y = -.08; el.add(fa);
        var hn = new THREE.Mesh(SPH, m(pal.glove)); hn.scale.setScalar(.09 * big); hn.position.y = -.2; el.add(hn);
        arms.push({ sh: sh2, el: el });
      });
      var cape = null;
      if (pal.cape) {
        var cg = new THREE.PlaneGeometry(.52 * big, .7, 1, 4); cg.translate(0, -.35, 0);
        cape = new THREE.Mesh(cg, new THREE.MeshToonMaterial({ color: pal.cape, gradientMap: TOON, side: THREE.DoubleSide }));
        cape.position.set(0, .42, .19 * big); torso.add(cape);
      }
      if (pal.shield) {
        var sd = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .05, 28), [m('#9aa1ab'), new THREE.MeshToonMaterial({ map: shieldTex(), gradientMap: TOON }), m('#9aa1ab')]);
        sd.rotation.x = Math.PI / 2; sd.position.set(0, .26, .24); torso.add(sd);
      }
      root.scale.setScalar(1.15 * big);
      return { root: root, spin: spin, rig: rig, hips: hips, torso: torso, head: head, legs: legs, arms: arms, cape: cape };
    }
    /** Poza lutke. st: { ph, t, roll (0..1), air, vy, fly, stumble } */
    function pose(h, st) {
      var ph = st.ph, L0 = h.legs[0], L1 = h.legs[1], A0 = h.arms[0], A1 = h.arms[1];
      h.spin.rotation.x = 0; h.rig.position.y = -.55; h.torso.rotation.set(0, 0, 0); h.head.rotation.x = 0;
      if (st.roll > 0) {
        h.spin.rotation.x = -st.roll * Math.PI * 2;
        h.rig.position.y = -.72;
        L0.th.rotation.x = L1.th.rotation.x = 1.9; L0.kn.rotation.x = L1.kn.rotation.x = -2.3;
        A0.sh.rotation.set(1.3, 0, -.3); A1.sh.rotation.set(1.3, 0, .3); A0.el.rotation.x = A1.el.rotation.x = 1.2;
        h.torso.rotation.x = -.7; h.head.rotation.x = -.4;
      } else if (st.fly) {
        L0.th.rotation.x = L1.th.rotation.x = -.35; L0.kn.rotation.x = L1.kn.rotation.x = -.3;
        A0.sh.rotation.set(-2.9, 0, -.15); A1.sh.rotation.set(.3, 0, .25); A0.el.rotation.x = 0; A1.el.rotation.x = .5;
        h.torso.rotation.x = -.6; h.head.rotation.x = .3;
      } else if (st.air) {
        var up = Math.max(0, Math.min(1, st.vy / 10));
        L0.th.rotation.x = .9; L0.kn.rotation.x = -1.4; L1.th.rotation.x = -.25; L1.kn.rotation.x = -.9;
        A0.sh.rotation.set(-2.2 * up - .4, 0, -.5); A1.sh.rotation.set(-2.2 * up - .4, 0, .5);
        A0.el.rotation.x = A1.el.rotation.x = .4;
        h.torso.rotation.x = -.15;
      } else {
        var sn = Math.sin(ph), cs = Math.cos(ph);
        L0.th.rotation.x = sn * .95; L1.th.rotation.x = -sn * .95;
        L0.kn.rotation.x = -.2 - 1.25 * Math.max(0, -Math.sin(ph - .5)); L1.kn.rotation.x = -.2 - 1.25 * Math.max(0, Math.sin(ph - .5));
        A0.sh.rotation.set(-sn * .85, 0, -.12); A1.sh.rotation.set(sn * .85, 0, .12);
        A0.el.rotation.x = A1.el.rotation.x = 1.15;
        h.torso.rotation.x = -.2; h.torso.rotation.y = sn * .12; h.head.rotation.x = .12;
        h.rig.position.y = -.55 + Math.abs(cs) * .08;
        if (st.stumble > 0) { A0.sh.rotation.set(-2.6, 0, -.9 + Math.sin(st.t * 30) * .4); A1.sh.rotation.set(-2.4, 0, .9); h.torso.rotation.x = .25; }
      }
      if (h.cape) h.cape.rotation.x = .35 + (st.air || st.fly ? .6 : .25) + Math.sin(st.t * 14) * .08;
    }

    /* ---------- igrac, board i Doom ---------- */
    var hero = mkHero(PAL[opts.hero] || PAL.agent);
    scene.add(hero.root);
    var shadow = new THREE.Mesh(G3.plane, M.shadow); shadow.rotation.x = -Math.PI / 2; shadow.scale.set(1.3, 1.1, 1); scene.add(shadow);
    var bubble = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 16), new THREE.MeshPhongMaterial({ color: 0x5fd3ff, transparent: true, opacity: .22, shininess: 100, depthWrite: false }));
    bubble.position.y = .95; bubble.visible = false; hero.root.add(bubble);
    var bc = opts.board || { c1: '#e62429', c2: '#ffd36b' };
    var board = new THREE.Group();
    var deck = new THREE.Mesh(new THREE.CapsuleGeometry(.36, .75, 4, 12), L({ color: bc.c1, emissive: bc.c1, emissiveIntensity: .25 })); deck.rotation.x = Math.PI / 2; deck.scale.set(1, 1, .22); board.add(deck);
    var bstripe = box(L({ color: bc.c2, emissive: bc.c2, emissiveIntensity: .4 }), .16, .08, .95); bstripe.position.y = .05; board.add(bstripe);
    var jetGlow = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), new THREE.MeshBasicMaterial({ color: bc.c2, transparent: true, opacity: .75 })); jetGlow.position.set(0, -.05, .72); jetGlow.scale.set(1, .5, 1.5); board.add(jetGlow);
    board.visible = false; scene.add(board);

    var chaser = mkHero(PAL.doom); chaser.root.scale.setScalar(1.25); chaser.root.position.set(0, 0, 14); scene.add(chaser.root);

    /* ---------- efekti: prsten kad pokupis ---------- */
    var fx = [];
    function pop(x, y, z, col) {
      var mm = M.fx.clone(); mm.color.set(col || 0xffe27a);
      var r = new THREE.Mesh(G3.ring, mm); r.position.set(x, y, z); scene.add(r); fx.push({ m: r, t: 0 });
    }

    /* ---------- stanje ---------- */
    var S = {
      t: 0, speed: 12, dist: 0, coins: 0, coinAcc: 0, score: 0, lane: 1, x: 0, y: 0, vy: 0, roll: 0, ground: 0,
      shield: 0, invuln: 0, stumbleAt: -99, stumbleT: 0, bump: 0, bumpT: 0, doomT: 3, over: false, paused: false, why: '',
      pw: { magnet: 0, jet: 0, x2: 0, jump: 0 }, board: 0, boardsLeft: opts.boards | 0, smash: !!opts.smash,
      stats: { jumps: 0, rolls: 0, trains: 0, barriers: 0, powerups: 0, coins: 0 },
      busy: [-999, -999, -999], free: 1, nextRow: -46, rowAbs: 0, objs: [], landT: 0
    };
    var up = opts.up || {}, perk = opts.perk || {};
    var BASE = { magnet: 10, jet: 7, x2: 12, jump: 10, board: 30 };
    function dur(k) { return BASE[k] * (1 + .2 * (up[k] || 0)) * (perk[k] || 1); }

    /* ---------- objekti ---------- */
    function add(o) { scene.add(o.m); S.objs.push(o); return o; }
    function mkTrain(lane, z, li, moving) {
      var len = TLEN[li], mt = trainMats(Math.floor(Math.random() * TCOL.length), li, moving), g = new THREE.Group();
      var body = new THREE.Mesh(G3.box, [mt.side, mt.side, M.roof, M.under, M.roof, M.roof]);
      body.scale.set(TRAIN_W, BODY_TOP - .38, len); body.position.set(0, .38 + (BODY_TOP - .38) / 2, -len / 2); g.add(body);
      var rf = new THREE.Mesh(G3.roof, M.roof); rf.scale.set(TRAIN_W / 2, TRAIN_H - BODY_TOP, len); rf.position.set(0, BODY_TOP, -len / 2); g.add(rf);
      var wh = box(M.under, TRAIN_W - .35, .4, len - .5); wh.position.set(0, .22, -len / 2); g.add(wh);
      var fr = new THREE.Mesh(G3.plane, mt.front); fr.scale.set(TRAIN_W, TRAIN_H - .38, 1); fr.position.set(0, .38 + (TRAIN_H - .38) / 2, .015); g.add(fr);
      var bump = box(M.under, TRAIN_W + .05, .3, .3); bump.position.set(0, .32, -.05); g.add(bump);
      g.position.set(LX[lane], 0, z);
      return add({ t: 'train', lane: lane, m: g, len: len, v: 0, top: TRAIN_H });
    }
    var RAMP = null;
    function mkRamp(lane, z) {
      var RL = 7, w = TRAIN_W / 2, h = TRAIN_H;
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
    function mkBarrier(lane, z, high) {
      var g = new THREE.Group(), y0 = high ? 1.55 : .4, hh = high ? .75 : .65;
      [-1, 1].forEach(function (s) { var p = box(M.post, .14, y0 + hh, .14); p.position.set(s * 1.05, (y0 + hh) / 2, 0); g.add(p); });
      var b = box(high ? M.high : M.low, 2.2, hh, .16); b.position.set(0, y0 + hh / 2, 0); g.add(b);
      if (!high) { var b2 = box(M.low, 2.2, .14, .16); b2.position.set(0, .2, 0); g.add(b2); }
      else {
        redLamp = redLamp || new THREE.MeshBasicMaterial({ color: 0xff3b30 });
        [-.8, .8].forEach(function (x) { var lp = new THREE.Mesh(bulbGeo, redLamp); lp.position.set(x, y0 + hh + .14, 0); g.add(lp); });
      }
      g.position.set(LX[lane], 0, z);
      return add({ t: high ? 'high' : 'low', lane: lane, m: g, len: .2 });
    }
    var coinFace = null;
    function mkCoin(lane, z, y) {
      if (!coinFace) { var ct = loader.load('img/run/coin.webp'); ct.encoding = THREE.sRGBEncoding; coinFace = new THREE.MeshPhongMaterial({ map: ct, emissive: 0x3a2600, shininess: 60, transparent: true, alphaTest: .3 }); }
      var m = new THREE.Mesh(G3.coin, [M.coin, coinFace, coinFace]); m.position.set(LX[lane], y || 1, z);
      return add({ t: 'coin', lane: lane, m: m, y: y || 1, len: 0 });
    }
    var PW_COL = { magnet: 0xff3b30, shield: 0x5fd3ff, jet: 0xffd23f, x2: 0x39d97a, jump: 0xc46bff };
    var PW_GEO = null, PW_MAT = {};
    function mkPower(lane, z, kind) {
      if (!PW_GEO) PW_GEO = { core: new THREE.OctahedronGeometry(.42), halo: new THREE.SphereGeometry(.7, 16, 12) };
      if (!PW_MAT[kind]) PW_MAT[kind] = [new THREE.MeshPhongMaterial({ color: PW_COL[kind], emissive: PW_COL[kind], emissiveIntensity: .5, shininess: 90 }),
        new THREE.MeshBasicMaterial({ color: PW_COL[kind], transparent: true, opacity: .22, depthWrite: false })];
      var g = new THREE.Group();
      g.add(new THREE.Mesh(PW_GEO.core, PW_MAT[kind][0]));
      g.add(new THREE.Mesh(PW_GEO.halo, PW_MAT[kind][1]));
      g.position.set(LX[lane], 1.3, z);
      return add({ t: 'pw', kind: kind, lane: lane, m: g, y: 1.3, len: 0 });
    }

    /* ---------- generisanje: fer redovi ----------
       Slobodna traka F: do nje se stize za najvise jednu traku i bila je
       prazna bar 18 m pre reda. Najvise 2 voza u istom delu puta.
       F i prethodna slobodna traka nemaju vozove. */
    function spawnRow() {
      var d = S.rowAbs, hard = Math.min(1, S.dist / 6000), z = S.nextRow;
      var occ = function (l) { return S.busy[l] > d - 1; };
      var P0 = S.free;
      var cand = [P0 - 1, P0, P0 + 1].filter(function (l) { return l >= 0 && l <= 2 && (l === P0 ? !occ(l) : S.busy[l] < d - 18); });
      var F = cand.length ? pick(cand) : P0;
      S.free = F;
      var trains = [0, 1, 2].filter(occ).length;
      for (var l = 0; l < 3; l++) {
        if (occ(l)) continue;
        if (l === F || l === P0) {
          if (l !== F) continue;
          var r0 = Math.random(), bp = .1 + .12 * hard, pp = .045 * (opts.pwRate || 1);
          if (r0 < bp) mkBarrier(l, z, Math.random() < .5);
          else if (r0 < bp + pp) mkPower(l, z - 5, pick(['magnet', 'shield', 'jet', 'x2', 'jump', 'magnet', 'x2']));
          if (Math.random() < .7) for (var k = 0; k < 6; k++) mkCoin(l, z - 2.5 - k * 2.6, 1);
          continue;
        }
        var r = Math.random();
        if (r < .42 + .15 * hard && trains < 2) {
          var li = Math.floor(Math.random() * TLEN.length), len = TLEN[li];
          var moving = S.dist > 400 && Math.random() < .14 + .2 * hard, ramp = !moving && Math.random() < .45;
          if (moving) {
            // krece dalje, da stigne do reda kad i ostalo
            var v = rnd(6, 9), tr = mkTrain(l, z * (S.speed + v) / S.speed, li, true); tr.v = v;
            S.busy[l] = d + len * S.speed / (S.speed + v) + 3;
          } else {
            if (ramp) mkRamp(l, z);
            var tz = ramp ? z - 7 : z;
            mkTrain(l, tz, li, false);
            if (ramp) for (var k2 = 0; k2 < Math.floor(len / 2.6); k2++) mkCoin(l, tz - 1.5 - k2 * 2.6, TRAIN_H + 1);
            S.busy[l] = d + (ramp ? 7 : 0) + len + 1;
          }
          trains++;
        } else if (r < .72) mkBarrier(l, z, Math.random() < .5);
        else if (r < .84) for (var k3 = 0; k3 < 4; k3++) mkCoin(l, z - k3 * 2.6, 1);
      }
      var gap = Math.max(22, S.speed * 1.3) + rnd(0, 9);
      S.nextRow -= gap; S.rowAbs += gap;
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
    function ev(n) { if (opts.onEvent) opts.onEvent(n); }
    function act(dir) {
      if (S.over || S.paused) return;
      if (dir === 'left' || dir === 'right') {
        var nl = Math.max(0, Math.min(2, S.lane + (dir === 'left' ? -1 : 1)));
        if (nl !== S.lane) {
          if (trainBeside(nl)) { S.bump = dir === 'left' ? -1 : 1; S.bumpT = .25; stumble(); }
          else S.lane = nl;
        }
      }
      var onG = S.y <= S.ground + .06;
      if (dir === 'up' && onG && S.pw.jet <= 0) { S.vy = S.pw.jump > 0 ? 20 : 14.2; S.roll = 0; S.stats.jumps++; }
      if (dir === 'down' && S.pw.jet <= 0) { S.roll = .7; S.stats.rolls++; if (!onG) S.vy = -28; }
      ev('move');
    }
    function useBoard() {
      if (S.over || S.paused || S.board > 0 || S.boardsLeft <= 0) return;
      S.boardsLeft--; S.board = dur('board'); board.visible = true; ev('board');
    }
    var sx = 0, sy = 0, swiped = false, lastTap = 0;
    function onDown(e) { sx = e.clientX; sy = e.clientY; swiped = false; }
    function onMove(e) {
      if (swiped) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
      swiped = true; lastTap = 0;
      act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }
    function onUp() {
      if (swiped) return;
      var now = performance.now();
      if (now - lastTap < 320) { lastTap = 0; useBoard(); } else lastTap = now;
    }
    function onKey(e) {
      if (e.key === 'Enter') { useBoard(); return; }
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
      if (S.t - S.stumbleAt < 8 && S.doomT > 0) { crash('Doom te je uhvatio!'); return; }
      S.stumbleAt = S.t; S.doomT = 5; S.invuln = .5; ev('stumble');
    }
    function clearNear() {
      S.objs = S.objs.filter(function (o) {
        if (o.t === 'coin' || o.t === 'pw') return true;
        var f = o.m.position.z;
        if (f > -26 && f - o.len < 3) { scene.remove(o.m); return false; }
        return true;
      });
    }
    var endTimer = 0, shake = 0;
    /** Udarac spreda: stit, board ili Hulk ga upiju, inace pad. */
    function crash(why, obj) {
      if (S.over) return;
      if (S.shield) { S.shield = 0; S.invuln = 1.4; bubble.visible = false; clearNear(); ev('shield'); return; }
      if (S.board > 0) { S.board = 0; board.visible = false; S.invuln = 1.4; clearNear(); ev('boardbreak'); return; }
      if (S.smash && obj && (obj.t === 'low' || obj.t === 'high')) { S.smash = false; scene.remove(obj.m); obj.gone = true; ev('smash'); S.invuln = 0; stumble(); return; }
      S.over = true; S.why = why || 'Udario si!'; S.doomT = 3; ev('crash');
      shake = .45;
      clearTimeout(endTimer);
      endTimer = setTimeout(function () { if (S.over && opts.onEnd) opts.onEnd(result()); }, 1000);
    }
    function result() {
      return { score: Math.round(S.score), coins: S.coins, dist: Math.round(S.dist), stats: S.stats, why: S.why };
    }
    function take(kind) {
      S.stats.powerups++;
      if (kind === 'shield') { S.shield = 1; bubble.visible = true; }
      else S.pw[kind] = dur(kind);
      if (kind === 'jet') { S.vy = 0; for (var k = 0; k < 26; k++) mkCoin(S.lane, -14 - k * 2.4, 8.2); }
      ev('pw:' + kind);
    }

    /* ---------- korak fizike ---------- */
    function step(dt) {
      S.t += dt;
      if (S.stumbleT > 0) S.stumbleT -= dt;
      if (S.bumpT > 0) S.bumpT -= dt;
      if (S.over) return;
      S.speed = Math.min(29, 12 + S.t * .1 * (opts.accel || 1));
      var dz = S.speed * dt, x2 = S.pw.x2 > 0;
      var mul = (opts.mul || 1) * (x2 ? 2 : 1);
      S.dist += dz;
      S.score += dz * mul;
      sleepOff += dz;
      M.ground.map.offset.y += dz / (400 / 30);
      M.wall.map.offset.x += dz / (400 / 12); M.wall2.map.offset.x -= dz / (400 / 12);

      Object.keys(S.pw).forEach(function (k) {
        if (S.pw[k] > 0) { S.pw[k] = Math.max(0, S.pw[k] - dt); if (k === 'jet' && S.pw[k] === 0) S.invuln = Math.max(S.invuln, 1.2); }
      });
      if (S.board > 0) { S.board = Math.max(0, S.board - dt); if (!S.board) board.visible = false; }
      if (S.invuln > 0) S.invuln -= dt;
      if (S.doomT > 0) S.doomT -= dt;

      S.nextRow += dz;
      while (S.nextRow > SPAWN_Z) spawnRow();
      for (var i = 0; i < decor.length; i++) decor[i].m.position.z += dz;
      decor = decor.filter(function (o) { if (o.m.position.z - o.len > 22) { scene.remove(o.m); return false; } return true; });
      nextB['-1'] += dz; nextB['1'] += dz; nextPylon += dz; nextLamp += dz;
      fillDecor();

      S.x += (LX[S.lane] - S.x) * Math.min(1, dt * 14);

      // podloga ispod igraca: krov voza ili rampa
      var support = 0;
      for (var j = 0; j < S.objs.length; j++) {
        var o = S.objs[j];
        if (o.t !== 'train' && o.t !== 'ramp') continue;
        if (Math.abs(LX[o.lane] - S.x) > 1.2) continue;
        var f = o.m.position.z, b = f - o.len;
        if (f < -.3 || b > .3) continue;
        support = Math.max(support, o.t === 'train' ? o.top : Math.min(TRAIN_H, Math.max(0, f) / o.len * TRAIN_H));
      }
      var wasAir = S.y > S.ground + .06;
      if (S.pw.jet > 0) { S.y += (7.2 - S.y) * Math.min(1, dt * 3); S.vy = 0; }
      else {
        S.vy -= 40 * dt; S.y += S.vy * dt;
        if (S.y <= support + .001 && support - S.y < 1) { S.y = support; if (S.vy < 0) S.vy = 0; if (wasAir) S.landT = .12; }
      }
      if (S.y < 0) { S.y = 0; S.vy = Math.max(0, S.vy); }
      S.ground = support;
      if (S.roll > 0) S.roll -= dt;
      if (S.landT > 0) S.landT -= dt;

      var magnetOn = S.pw.magnet > 0 || S.pw.jet > 0;
      S.objs = S.objs.filter(function (o) {
        if (o.gone) return false;
        o.m.position.z += dz + (o.v ? o.v * dt : 0);
        var z = o.m.position.z;
        if (o.t === 'coin' || o.t === 'pw') {
          o.m.rotation.y += dt * 4;
          if (o.t === 'pw') o.m.position.y = o.y + Math.sin(S.t * 3 + z) * .15;
          if (o.t === 'coin' && magnetOn && z > -16 && z < 2) {
            var k = Math.min(1, dt * 9);
            o.m.position.x += (S.x - o.m.position.x) * k; o.m.position.y += (S.y + 1 - o.m.position.y) * k; o.m.position.z += (0 - z) * k * .7;
          }
          var p = o.m.position;
          if (Math.abs(p.z) < .9 && Math.abs(p.x - S.x) < 1 && Math.abs(p.y - (S.y + 1)) < 1.4) {
            scene.remove(o.m);
            if (o.t === 'coin') {
              S.coinAcc += (x2 ? 2 : 1) * (opts.coinMul || 1); var whole = Math.floor(S.coinAcc); S.coins += whole; S.coinAcc -= whole;
              S.stats.coins++; S.score += 5 * mul; pop(p.x, p.y, p.z);
            } else { take(o.kind); pop(p.x, p.y, p.z, PW_COL[o.kind]); }
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
              if (feet < .9 && !flying) { o.hit = true; if (S.invuln <= 0) crash('Barijera!', o); }
              else if (!o.counted) { o.counted = true; S.stats.barriers++; }
            } else if (o.t === 'high') {
              if (S.roll <= 0 && feet < 2.3 && !flying) { o.hit = true; if (S.invuln <= 0) crash('Glavom u kapiju!', o); }
              else if (!o.counted) { o.counted = true; S.stats.barriers++; }
            }
          }
        }
        if (z - (o.len || 0) > 14) { scene.remove(o.m); return false; }
        return true;
      });
    }

    /* ---------- crtanje ---------- */
    function draw(dt) {
      placeSleepers();
      var onG = S.y <= S.ground + .06 && S.pw.jet <= 0, fly = S.pw.jet > 0;
      var ph = S.t * (8 + S.speed * .35);
      var bx = S.bumpT > 0 ? S.bump * Math.sin(S.bumpT / .25 * Math.PI) * .5 : 0;
      hero.root.position.set(S.x + bx, S.y + (S.board > 0 ? .3 : 0), 0);
      hero.root.rotation.z = (LX[S.lane] - S.x) * .1;
      hero.root.rotation.y = (LX[S.lane] - S.x) * -.12;
      pose(hero, { ph: ph, t: S.t, roll: S.roll > 0 ? 1 - S.roll / .7 : 0, air: !onG && !fly, vy: S.vy, fly: fly, stumble: S.stumbleT });
      if (S.landT > 0) hero.rig.position.y -= S.landT * .8;
      hero.root.visible = !(S.invuln > 0 && !S.over && Math.floor(S.t * 16) % 2);
      board.position.set(S.x + bx, S.y + .16, -.1);
      board.rotation.z = hero.root.rotation.z; board.rotation.x = Math.sin(S.t * 6) * .04;
      shadow.position.set(S.x, S.ground + .19, .1);
      var hgt = Math.max(0, S.y - S.ground); shadow.scale.set(1.3 / (1 + hgt * .25), 1.1 / (1 + hgt * .25), 1);
      bubble.rotation.y += dt;

      // Doom iza tebe
      var tz = S.doomT > 0 ? (S.over ? 1.6 : 2.3) : 14;
      chaser.root.position.x += (S.x + (S.over ? 0 : (S.x > 1 ? -1.3 : 1.3)) - chaser.root.position.x) * Math.min(1, dt * 5);
      chaser.root.position.z += (tz - chaser.root.position.z) * Math.min(1, dt * 2.5);
      chaser.root.position.y += (S.ground - chaser.root.position.y) * Math.min(1, dt * 8);
      chaser.root.visible = chaser.root.position.z < 12;
      if (chaser.root.visible) pose(chaser, { ph: S.t * 13 + 1, t: S.t, roll: 0, air: false, fly: false, stumble: 0 });

      fx = fx.filter(function (f) {
        f.t += dt; f.m.scale.setScalar(1 + f.t * 6); f.m.material.opacity = Math.max(0, 1 - f.t / .3);
        f.m.lookAt(cam.position);
        if (f.t > .3) { scene.remove(f.m); f.m.material.dispose(); return false; }
        return true;
      });

      // kamera prati (malo sa strane, kao SSC)
      var cy = 4.1 + S.y * .7, cz = 6.9 + (fly ? 2 : 0);
      cam.position.x += (S.x * .55 - cam.position.x) * Math.min(1, dt * 6);
      cam.position.y += (cy - cam.position.y) * Math.min(1, dt * 4);
      cam.position.z += (cz - cam.position.z) * Math.min(1, dt * 3);
      var fov = 60 + (S.speed - 12) * .35;
      if (Math.abs(cam.fov - fov) > .05) { cam.fov = fov; cam.updateProjectionMatrix(); }
      if (shake > 0) { shake -= dt; cam.position.x += (Math.random() - .5) * shake; cam.position.y += (Math.random() - .5) * shake; }
      cam.lookAt(S.x * .45, 1.5 + S.y * .6, -12);
      renderer.render(scene, cam);
    }

    var raf = 0, last = performance.now(), hudT = 0, alive = true;
    function loop(now) {
      if (!alive) return;
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!S.paused) { step(dt); draw(dt); }
      hudT -= dt;
      if (hudT <= 0 && opts.onHud) { hudT = .1; opts.onHud(hudState()); }
      raf = requestAnimationFrame(loop);
    }
    function hudState() {
      return { score: Math.round(S.score), coins: S.coins, mul: (opts.mul || 1) * (S.pw.x2 > 0 ? 2 : 1), x2: S.pw.x2 > 0, pw: S.pw, shield: S.shield,
        dist: Math.round(S.dist), board: S.board, boardsLeft: S.boardsLeft,
        max: { magnet: dur('magnet'), jet: dur('jet'), x2: dur('x2'), jump: dur('jump'), board: dur('board') } };
    }
    fillDecor();
    while (S.nextRow > SPAWN_Z) spawnRow();
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
      revive: function () {
        clearTimeout(endTimer);
        S.over = false; S.invuln = 2.5; S.doomT = 0; S.why = ''; S.vy = 0; S.roll = 0;
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
      _state: function () { return S; }
    };
  }

  MM.Run3D = { create: create, PAL: PAL };
})();
