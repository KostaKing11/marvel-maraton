/* ============================================================
   heroes3d.js  -  3D junaci za Marvel Runner
   ------------------------------------------------------------
   Telo i animacije: Quaternius "Universal Animation Library"
   (CC0, models/hero.glb, licenca u models/). Jedan model, a
   svaki junak dobija svoj kostim:
     - boje po kostima skeleta (glava, trup, ruke, saka, noge, cizme)
     - dodaci zakaceni za kosti (kosa, kaciga, plast, stit, mace...)
     - malo veca glava, da lici na crtani stil
   Animacije: Sprint_Loop, Jump_Start/Loop/Land, Roll, Hit_Chest,
   Death01, Idle_Loop, Dance_Loop, Jog_Fwd_Loop.

   MM.Heroes.load() -> Promise
   MM.Heroes.make(id) -> { root, play(name, opts), update(dt), anim }
   MM.Heroes.preview(host, id) -> { set(id), dance(), stop() }  (meni)
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  /* Kostimi. Delovi tela:
     head, hair, torso, waist, armU, armL, hand, legU, legL, foot, joint
     acc: dodaci  (hair | tail | helmet | hood | ears | horns | cape | shield | swords | pack | eyes | lenses | visor) */
  var PAL = {
    agent: { head: '#e0ac86', torso: '#1c2029', waist: '#121418', armU: '#1c2029', armL: '#1c2029', hand: '#e0ac86', legU: '#1c2029', legL: '#1c2029', foot: '#0d0e10', joint: '#2a2f38',
      acc: { hair: '#3a2416', eyes: 1, tie: '#c8202b' } },
    iron: { head: '#b3141b', torso: '#b3141b', waist: '#d9a21f', armU: '#b3141b', armL: '#d9a21f', hand: '#b3141b', legU: '#b3141b', legL: '#d9a21f', foot: '#b3141b', joint: '#5a0c10',
      acc: { visor: '#d9a21f', pack: '#d9a21f', reactor: 1 } },
    cap: { head: '#1f3a8a', torso: '#1f3a8a', waist: '#c8202b', armU: '#1f3a8a', armL: '#1f3a8a', hand: '#6b2a1a', legU: '#1f3a8a', legL: '#1f3a8a', foot: '#6b2a1a', joint: '#e9eef5',
      acc: { helmet: '#1f3a8a', shield: 1, eyes: 1 } },
    thor: { head: '#e0ac86', torso: '#2a2f3a', waist: '#3a3f48', armU: '#2a2f3a', armL: '#e0ac86', hand: '#e0ac86', legU: '#2a2f3a', legL: '#2a2f3a', foot: '#1a1d22', joint: '#9aa7b8',
      acc: { hair: '#e7c35a', tail: '#e7c35a', cape: '#b3141b', eyes: 1, discs: '#c9d0d8' } },
    hulk: { head: '#4f9a3a', torso: '#4f9a3a', waist: '#5b3a8a', armU: '#4f9a3a', armL: '#4f9a3a', hand: '#4f9a3a', legU: '#5b3a8a', legL: '#4f9a3a', foot: '#3f7f2e', joint: '#3f7f2e',
      acc: { hair: '#15170f', shortHair: 1, eyes: 1 }, big: 1.18 },
    widow: { head: '#f0c4a2', torso: '#15171c', waist: '#3a3f48', armU: '#15171c', armL: '#15171c', hand: '#15171c', legU: '#15171c', legL: '#15171c', foot: '#0d0e10', joint: '#3a3f48',
      acc: { hair: '#b3311b', tail: '#b3311b', eyes: 1 } },
    spidey: { head: '#c8202b', torso: '#c8202b', waist: '#1f4fa8', armU: '#1f4fa8', armL: '#c8202b', hand: '#c8202b', legU: '#1f4fa8', legL: '#c8202b', foot: '#c8202b', joint: '#1f4fa8',
      acc: { lenses: '#ffffff' } },
    panther: { head: '#17181f', torso: '#17181f', waist: '#7a5cd6', armU: '#17181f', armL: '#17181f', hand: '#17181f', legU: '#17181f', legL: '#17181f', foot: '#17181f', joint: '#7a5cd6',
      acc: { ears: '#17181f', lenses: '#c9d0ff', necklace: '#c9d0d8' } },
    strange: { head: '#e0ac86', torso: '#1f3a6b', waist: '#c9a24a', armU: '#1f3a6b', armL: '#c9a24a', hand: '#e0ac86', legU: '#1f3a6b', legL: '#1f3a6b', foot: '#3a2a20', joint: '#c9a24a',
      acc: { hair: '#2a2420', cape: '#b3141b', eyes: 1 } },
    ant: { head: '#9aa7b8', torso: '#b3141b', waist: '#1a1a1a', armU: '#1a1a1a', armL: '#b3141b', hand: '#1a1a1a', legU: '#b3141b', legL: '#1a1a1a', foot: '#1a1a1a', joint: '#1a1a1a',
      acc: { helmet: '#9aa7b8', antenna: '#1a1a1a', lenses: '#ff4a4a' } },
    marvel: { head: '#f0c4a2', torso: '#1f3a8a', waist: '#c8202b', armU: '#c8202b', armL: '#1f3a8a', hand: '#1f3a8a', legU: '#1f3a8a', legL: '#c8202b', foot: '#c8202b', joint: '#e9b82a',
      acc: { hair: '#e7c35a', tail: '#e7c35a', eyes: 1 } },
    deadpool: { head: '#a8141b', torso: '#a8141b', waist: '#1a1a1a', armU: '#a8141b', armL: '#1a1a1a', hand: '#1a1a1a', legU: '#a8141b', legL: '#a8141b', foot: '#1a1a1a', joint: '#1a1a1a',
      acc: { swords: 1, lenses: '#ffffff', patches: '#1a1a1a' } },
    stanlee: { head: '#e8b896', torso: '#22305a', waist: '#3a2e24', armU: '#22305a', armL: '#22305a', hand: '#e8b896', legU: '#9c875c', legL: '#9c875c', foot: '#5a3420', joint: '#22305a',
      acc: { hair: '#e6e6e6', backHair: 1, shades: '#3a2a1a', stache: '#eeeeee', pocket: '#c8202b', eyes: 1 } },
    doom: { head: '#9aa3ad', torso: '#5c636e', waist: '#2e5a2e', armU: '#5c636e', armL: '#5c636e', hand: '#5c636e', legU: '#5c636e', legL: '#5c636e', foot: '#3a3f48', joint: '#2e5a2e',
      acc: { hood: '#2e5a2e', cape: '#2e5a2e', doomeyes: 1 }, big: 1.05 }
  };

  function part(bone) {
    if (/^Head/.test(bone)) return 'head';
    if (/neck/.test(bone)) return 'torso';
    if (/pelvis|spine_01/.test(bone)) return 'waist';
    if (/spine|clavicle/.test(bone)) return 'torso';
    if (/upperarm/.test(bone)) return 'armU';
    if (/lowerarm/.test(bone)) return 'armL';
    if (/hand|index|thumb|pinky|middle|ring/.test(bone)) return 'hand';
    if (/thigh/.test(bone)) return 'legU';
    if (/calf/.test(bone)) return 'legL';
    if (/foot|ball/.test(bone)) return 'foot';
    return 'torso';
  }

  var gltf = null, loadP = null, TOON = null, info = null;
  function load() {
    // tacne boje (sRGB -> linear), inace su sve boje bledunjave
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    if (gltf) return Promise.resolve(gltf);
    if (loadP) return loadP;
    loadP = new Promise(function (ok, no) {
      new THREE.GLTFLoader().load('models/hero.glb?v=2', function (g) { gltf = g; ok(g); }, null, function (e) { loadP = null; no(e); });
    });
    return loadP;
  }
  function toon() {
    if (TOON) return TOON;
    var d = new Uint8Array([110, 110, 110, 255, 190, 190, 190, 255, 255, 255, 255, 255]);
    TOON = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); TOON.minFilter = TOON.magFilter = THREE.NearestFilter; TOON.needsUpdate = true;
    return TOON;
  }
  var OUTLINE = null;
  function outlineMat() {
    if (OUTLINE) return OUTLINE;
    OUTLINE = new THREE.MeshBasicMaterial({ color: 0x15121a, side: THREE.BackSide });
    OUTLINE.onBeforeCompile = function (sh) {
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed += normalize(objectNormal) * 0.018;');
    };
    return OUTLINE;
  }
  function col(hex) { return new THREE.Color(hex); }
  function mat(hex, extra) { return new THREE.MeshToonMaterial(Object.assign({ color: hex, gradientMap: toon() }, extra || {})); }

  /** Dominantna kost po temenu i okvir glave u pozi mirovanja (jednom). */
  function analyze(mesh) {
    var g = mesh.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = si.count;
    var bones = mesh.skeleton.bones, parts = new Array(n), v = new THREE.Vector3(), box = new THREE.Box3();
    for (var i = 0; i < n; i++) {
      var best = 0, bw = -1;
      var ws = [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)], is = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)];
      for (var k = 0; k < 4; k++) { if (ws[k] > bw) { bw = ws[k]; best = is[k]; } }
      parts[i] = part(bones[best].name);
      if (parts[i] === 'head') { v.fromBufferAttribute(g.attributes.position, i); mesh.boneTransform(i, v); mesh.localToWorld(v); box.expandByPoint(v); }
    }
    return { parts: parts, head: box };
  }

  function make(id) {
    var pal = PAL[id] || PAL.agent, A = pal.acc || {};
    var model = THREE.SkeletonUtils.clone(gltf.scene);
    // model je Z-gore i gleda ka +Y; okreni ga: Y-gore, gleda ka -Z
    var fix = new THREE.Group(); fix.rotation.x = -Math.PI / 2; fix.add(model);
    var face = new THREE.Group(); face.rotation.y = Math.PI; face.add(fix);
    var root = new THREE.Group(); root.add(face);
    var mesh = null; model.traverse(function (o) { if (o.isSkinnedMesh) mesh = o; o.frustumCulled = false; });
    root.updateMatrixWorld(true);
    var an = analyze(mesh);
    if (!info) info = an;
    // boje kostima
    var geo = mesh.geometry.clone(), n = geo.attributes.position.count, c = new Float32Array(n * 3), cache = {};
    var jointFlag = geo.attributes.color;
    for (var i = 0; i < n; i++) {
      var p = jointFlag && jointFlag.getX(i) > .5 ? 'joint' : an.parts[i];
      var cc = cache[p] || (cache[p] = col(pal[p] || pal.torso));
      c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
    mesh.geometry = geo;
    mesh.material = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon() });
    // crtani obris: isto telo, malo naduvano po normali, crtano samo iznutra (crno)
    var ol = new THREE.SkinnedMesh(geo, outlineMat());
    ol.bind(mesh.skeleton, mesh.bindMatrix); ol.frustumCulled = false;
    mesh.parent.add(ol);
    mesh.castShadow = false;

    // dodaci: pravim ih u svetskim koordinatama (poza mirovanja), pa ih kacim za kost
    var bone = {}; model.traverse(function (o) { if (o.isBone) bone[o.name] = o; });
    var hb = an.head, hc = hb.getCenter(new THREE.Vector3()), hs = hb.getSize(new THREE.Vector3());
    var R = Math.max(hs.x, hs.z) / 2, top = hb.max.y, front = hb.min.z;     // napred = -z
    function put(obj, boneName) { root.add(obj); obj.updateMatrixWorld(true); bone[boneName].attach(obj); return obj; }
    function sph(hex, sx, sy, sz, x, y, z, boneName, m) {
      var o = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), m || mat(hex)); o.scale.set(sx, sy, sz); o.position.set(x, y, z); return put(o, boneName || 'Head');
    }
    var chest = bone.spine_03.getWorldPosition(new THREE.Vector3());
    if (A.hair) { if (A.backHair) sph(A.hair, R * 1.02, hs.y * .34, R * .95, hc.x, hc.y + hs.y * .16, hc.z + R * .3); else if (A.shortHair) sph(A.hair, R * .98, hs.y * .26, R * 1.0, hc.x, hc.y + hs.y * .26, hc.z + R * .08); else sph(A.hair, R * 1.08, hs.y * .42, R * 1.08, hc.x, hc.y + hs.y * .14, hc.z + R * .12); }
    if (A.tail) { var t = sph(A.tail, R * .42, hs.y * .62, R * .42, hc.x, hc.y - hs.y * .15, hc.z + R * 1.05); t.rotation.x = .25; }
    if (A.helmet) sph(A.helmet, R * 1.07, hs.y * .4, R * 1.07, hc.x, hc.y + hs.y * .2, hc.z + R * .12);
    if (A.hood) sph(A.hood, R * 1.22, hs.y * .62, R * 1.2, hc.x, hc.y + hs.y * .06, hc.z + R * .2);
    if (A.ears) [-1, 1].forEach(function (s) { var e = sph(A.ears, R * .2, hs.y * .22, R * .12, hc.x + s * R * .55, top + hs.y * .02, hc.z); e.rotation.z = -s * .3; });
    if (A.antenna) [-1, 1].forEach(function (s) { var e = sph(A.antenna, R * .06, hs.y * .4, R * .06, hc.x + s * R * .45, top + hs.y * .15, hc.z); e.rotation.z = -s * .45; });
    // lice (vidi se u meniju)
    if (A.eyes) [-1, 1].forEach(function (s) { sph('#1a1410', R * .09, R * .12, R * .05, hc.x + s * R * .36, hc.y + hs.y * .05, front + R * .1); });
    if (A.lenses) [-1, 1].forEach(function (s) { var e = sph(A.lenses, R * .26, R * .2, R * .08, hc.x + s * R * .38, hc.y + hs.y * .06, front + R * .14, 'Head', mat(A.lenses, { emissive: A.lenses, emissiveIntensity: .15 })); e.rotation.z = s * .35; });
    if (A.visor) { sph(A.visor, R * .78, hs.y * .38, R * .3, hc.x, hc.y - hs.y * .02, front + R * .12); [-1, 1].forEach(function (s) { sph('#9ff3ff', R * .2, R * .07, R * .05, hc.x + s * R * .3, hc.y + hs.y * .08, front + R * .02, 'Head', new THREE.MeshBasicMaterial({ color: '#9ff3ff' })); }); }
    if (A.doomeyes) { sph('#7a838e', R * .8, hs.y * .4, R * .3, hc.x, hc.y - hs.y * .02, front + R * .12); [-1, 1].forEach(function (s) { sph('#39d97a', R * .14, R * .06, R * .05, hc.x + s * R * .3, hc.y + hs.y * .06, front + R * .02, 'Head', new THREE.MeshBasicMaterial({ color: '#39d97a' })); }); }
    // ledja (vidi se dok trci)
    var back = chest.z + R * .95;
    if (A.cape) {
      var cg = new THREE.PlaneGeometry(R * 2.5, hs.y * 3.3, 2, 6); cg.translate(0, -hs.y * 1.65, 0);
      var cape = new THREE.Mesh(cg, mat(A.cape, { side: THREE.DoubleSide })), piv = new THREE.Group();
      piv.position.set(chest.x, chest.y + hs.y * .45, back); piv.add(cape); put(piv, 'spine_03'); root.userData.cape = cape;
    }
    if (A.shield) {
      var sd = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.55, R * 1.55, R * .18, 32), [mat('#9aa1ab'), new THREE.MeshToonMaterial({ map: shieldTex(), gradientMap: toon() }), mat('#9aa1ab')]);
      sd.rotation.x = Math.PI / 2; sd.position.set(chest.x, chest.y - hs.y * .25, back + R * .45); put(sd, 'spine_03');
    }
    if (A.swords) [-1, 1].forEach(function (s) { var k = new THREE.Mesh(new THREE.BoxGeometry(R * .14, hs.y * 3.6, R * .14), mat('#2a2d33')); k.position.set(chest.x, chest.y + hs.y * .3, back + R * .05); k.rotation.z = s * .6; put(k, 'spine_03'); });
    if (A.pack) [-1, 1].forEach(function (s) { var j = new THREE.Mesh(new THREE.CylinderGeometry(R * .3, R * .25, hs.y * 1.1, 12), mat(A.pack)); j.position.set(chest.x + s * R * .55, chest.y - hs.y * .2, back - R * .15); put(j, 'spine_03'); });
    if (A.reactor) { var rc = new THREE.Mesh(new THREE.CircleGeometry(R * .32, 18), new THREE.MeshBasicMaterial({ color: '#9ff3ff' })); rc.position.set(chest.x, chest.y - hs.y * .15, chest.z - R * 1.05); rc.rotation.y = Math.PI; put(rc, 'spine_03'); }
    if (A.necklace) { var nk = new THREE.Mesh(new THREE.TorusGeometry(R * .75, R * .07, 6, 20), mat(A.necklace)); nk.rotation.x = Math.PI / 2 + .3; nk.position.set(chest.x, chest.y + hs.y * .32, chest.z - R * .1); put(nk, 'spine_03'); }
    if (A.discs) [-1, 1].forEach(function (s) { var d = new THREE.Mesh(new THREE.CylinderGeometry(R * .28, R * .28, R * .08, 14), mat(A.discs)); d.rotation.x = Math.PI / 2; d.position.set(chest.x + s * R * .55, chest.y, chest.z - R * 1.02); put(d, 'spine_03'); });
    if (A.tie) { var tie = new THREE.Mesh(new THREE.BoxGeometry(R * .22, hs.y * 1.1, R * .06), mat(A.tie)); tie.position.set(chest.x, chest.y - hs.y * .25, chest.z - R * 1.0); put(tie, 'spine_03'); }
    if (A.shades) {
      // naocare sa zatamnjenim staklima (Stan Lee)
      [-1, 1].forEach(function (s2) { sph(A.shades, R * .3, R * .24, R * .07, hc.x + s2 * R * .36, hc.y + hs.y * .07, front + R * .06, 'Head', new THREE.MeshPhongMaterial({ color: '#4a3020', transparent: true, opacity: .85, shininess: 90 })); });
      var br = new THREE.Mesh(new THREE.BoxGeometry(R * 1.5, R * .06, R * .06), mat('#c9a24a')); br.position.set(hc.x, hc.y + hs.y * .14, front + R * .05); put(br, 'Head');
    }
    if (A.stache) sph(A.stache, R * .42, R * .12, R * .1, hc.x, hc.y - hs.y * .12, front + R * .12);
    if (A.pocket) { var pk = new THREE.Mesh(new THREE.BoxGeometry(R * .32, R * .2, R * .05), mat(A.pocket)); pk.position.set(chest.x + R * .45, chest.y + hs.y * .1, chest.z - R * 1.02); put(pk, 'spine_03'); }
    if (A.patches) [-1, 1].forEach(function (s) { sph(A.patches, R * .32, R * .34, R * .1, hc.x + s * R * .38, hc.y + hs.y * .06, front + R * .1); });

    // crtani stil: veca glava; krupniji Hulk
    bone.Head.scale.setScalar(1.34);
    ['hand_l', 'hand_r'].forEach(function (b) { if (bone[b]) bone[b].scale.setScalar(1.25); });
    var big = pal.big || 1;
    if (big !== 1) ['spine_03', 'upperarm_l', 'upperarm_r', 'thigh_l', 'thigh_r'].forEach(function (b) { if (bone[b]) bone[b].scale.setScalar(big); });

    // animacije
    var mixer = new THREE.AnimationMixer(model), acts = {}, cur = null, curName = '';
    gltf.animations.forEach(function (cl) { acts[cl.name] = mixer.clipAction(cl); });
    function play(name, o) {
      o = o || {};
      var a = acts[name]; if (!a) return;
      if (curName === name && !o.restart) { if (o.ts) a.timeScale = o.ts; return; }
      a.reset(); a.enabled = true;
      a.setLoop(o.once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = !!o.once;
      a.timeScale = o.ts || 1; a.setEffectiveWeight(1);
      if (o.at) a.time = o.at;
      a.play();
      if (cur && cur !== a) cur.crossFadeTo(a, o.fade == null ? .12 : o.fade, false);
      cur = a; curName = name;
    }
    function update(dt) {
      mixer.update(dt);
      if (root.userData.cape) root.userData.cape.rotation.x = .25 + Math.sin(performance.now() / 90) * .06 + (root.userData.wind || 0);
    }
    root.scale.setScalar(.86);
    return { root: root, play: play, update: update, current: function () { return curName; }, actions: acts };
  }

  function shieldTex() {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
    [['#c8202b', 62], ['#eef1f5', 50], ['#c8202b', 38], ['#1f4fa8', 26]].forEach(function (r) { g.fillStyle = r[0]; g.beginPath(); g.arc(64, 64, r[1], 0, 7); g.fill(); });
    g.fillStyle = '#fff'; g.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 9 : 22; g.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); }
    g.closePath(); g.fill();
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }

  /** Hoverboard: zaobljena daska sa crtezom, svetla, plamen i trag iza. bc = { c1, c2 } */
  var BTEX = {};
  function deckTex(bc) {
    var k = bc.c1 + bc.c2 + (bc.comic ? 'c' : ''); if (BTEX[k]) return BTEX[k];
    var c = document.createElement('canvas'); c.width = 128; c.height = 320; var g = c.getContext('2d');
    if (bc.comic) { comicDeck(g); var tc = new THREE.CanvasTexture(c); tc.encoding = THREE.sRGBEncoding; BTEX[k] = tc; return tc; }
    var gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, bc.c1); gr.addColorStop(1, shade(bc.c1, -40));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 320);
    g.fillStyle = bc.c2;
    for (var i = -2; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 50); g.lineTo(128, i * 50 - 40); g.lineTo(128, i * 50 - 25); g.lineTo(0, i * 50 + 15); g.closePath(); g.globalAlpha = .55; g.fill(); }
    g.globalAlpha = 1;
    // zvezda u sredini
    g.fillStyle = '#fff'; g.beginPath();
    for (var j = 0; j < 10; j++) { var a2 = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? 13 : 30; g.lineTo(64 + Math.cos(a2) * rr, 160 + Math.sin(a2) * rr); }
    g.closePath(); g.fill(); g.strokeStyle = shade(bc.c1, -60); g.lineWidth = 4; g.stroke();
    // svetla na krajevima
    [40, 280].forEach(function (y) { g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(64, y, 14, 0, 7); g.fill(); g.strokeStyle = '#555'; g.lineWidth = 4; g.stroke(); });
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; BTEX[k] = t; return t;
  }
  /** Strip board: zuta pozadina, rasterske tackice, crveni prasak i POW! */
  function comicDeck(g) {
    g.fillStyle = '#ffd23f'; g.fillRect(0, 0, 128, 320);
    g.fillStyle = 'rgba(230,36,41,.35)';
    for (var y = 0; y < 320; y += 9) for (var x = (y / 9) % 2 ? 4 : 0; x < 128; x += 9) { g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); }
    function burst(cx, cy, r1, r2, n, col) {
      g.beginPath(); for (var i = 0; i < n * 2; i++) { var a = i * Math.PI / n, rr = i % 2 ? r2 : r1; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 4; g.strokeStyle = '#1b1410'; g.stroke();
    }
    burst(64, 110, 58, 34, 12, '#e62429');
    g.save(); g.translate(64, 120); g.rotate(-.18); g.font = 'bold 34px Bangers, Impact, sans-serif'; g.textAlign = 'center';
    g.lineWidth = 6; g.strokeStyle = '#1b1410'; g.strokeText('POW!', 0, 0); g.fillStyle = '#fff'; g.fillText('POW!', 0, 0); g.restore();
    burst(64, 238, 44, 26, 10, '#2b6fd6');
    g.save(); g.translate(64, 246); g.rotate(.15); g.font = 'bold 26px Bangers, Impact, sans-serif'; g.textAlign = 'center';
    g.lineWidth = 5; g.strokeStyle = '#1b1410'; g.strokeText('BAM!', 0, 0); g.fillStyle = '#ffd23f'; g.fillText('BAM!', 0, 0); g.restore();
    g.lineWidth = 6; g.strokeStyle = '#1b1410'; g.strokeRect(3, 3, 122, 314);
  }
  function shade(hex, d) {
    var n = parseInt(hex.slice(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + d)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + d)), b = Math.max(0, Math.min(255, (n & 255) + d));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function boardMesh(bc) {
    var g = new THREE.Group(), sh = new THREE.Shape(), w = .3, l = .82;
    sh.moveTo(-w, -l + w); sh.absarc(0, -l + w, w, Math.PI, 0, false); sh.lineTo(w, l - w); sh.absarc(0, l - w, w, 0, Math.PI, false); sh.closePath();
    var geo = new THREE.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: true, bevelThickness: .025, bevelSize: .03, bevelSegments: 2 });
    // UV: oblik je od -w..w i -l..l -> 0..1
    var uv = geo.attributes.uv, pos = geo.attributes.position;
    for (var i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w) / (2 * w), (pos.getY(i) + l) / (2 * l));
    geo.rotateX(-Math.PI / 2);
    var top = new THREE.MeshToonMaterial({ map: deckTex(bc), gradientMap: toon() }), edge = new THREE.MeshToonMaterial({ color: shade(bc.c1, -70), gradientMap: toon() });
    g.add(new THREE.Mesh(geo, [top, edge]));
    var ol = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x15121a, side: THREE.BackSide })); ol.scale.set(1.06, 1.4, 1.03); g.add(ol);
    var fl = new THREE.MeshBasicMaterial({ color: bc.c2, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false });
    g.userData.jets = [];
    [-.5, .5].forEach(function (z) { var j = new THREE.Mesh(new THREE.ConeGeometry(.1, .36, 10), fl); j.rotation.x = Math.PI; j.position.set(0, -.16, z); g.add(j); g.userData.jets.push(j); });
    // trag iza boarda
    var tc = document.createElement('canvas'); tc.width = 16; tc.height = 128; var tg = tc.getContext('2d');
    var tgr = tg.createLinearGradient(0, 0, 0, 128); tgr.addColorStop(0, 'rgba(255,255,255,.9)'); tgr.addColorStop(1, 'rgba(255,255,255,0)'); tg.fillStyle = tgr; tg.fillRect(0, 0, 16, 128);
    var trail = new THREE.Mesh(new THREE.PlaneGeometry(.45, 2.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tc), color: bc.c2, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    trail.rotation.x = -Math.PI / 2; trail.position.set(0, -.12, .82 + 1.3); g.add(trail); g.userData.trail = trail;
    return g;
  }

  /** Slicica junaka spreda (dataURL) za kartice u kolekciji. */
  var thumbR = null;
  function thumb(id) {
    if (!thumbR) {
      thumbR = { r: new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }), sc: new THREE.Scene(), cam: new THREE.PerspectiveCamera(26, 256 / 300, .1, 50) };
      thumbR.r.setSize(256, 300); thumbR.r.outputEncoding = THREE.sRGBEncoding; thumbR.r.setClearColor(0x000000, 0);
      thumbR.sc.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.1));
      var d = new THREE.DirectionalLight(0xffffff, .9); d.position.set(2, 4, 5); thumbR.sc.add(d);
      thumbR.cam.position.set(0, 1.25, 3.4); thumbR.cam.lookAt(0, 1.08, 0);
    }
    var h = make(id); h.root.rotation.y = Math.PI + .35; thumbR.sc.add(h.root);
    h.play('Idle_Loop'); h.update(.6);
    thumbR.r.render(thumbR.sc, thumbR.cam);
    var url = thumbR.r.domElement.toDataURL('image/png');
    thumbR.sc.remove(h.root);
    return url;
  }

  /** Mala 3D scena za meni: junak (na boardu) ili samo board. Tap = ples.
      opts: { hero, board: {c1,c2}, dark } */
  function preview(host, opts) {
    var W = host.clientWidth || 300, H = host.clientHeight || 360;
    var r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(W, H); r.outputEncoding = THREE.sRGBEncoding;
    r.domElement.className = 'h3-cv'; host.appendChild(r.domElement);
    var sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xffffff, 0x445066, opts.dark ? .15 : 1.05));
    var d = new THREE.DirectionalLight(0xffffff, opts.dark ? .1 : .9); d.position.set(2, 4, 5); sc.add(d);
    var rim = new THREE.DirectionalLight(0xff4d52, 1); rim.position.set(-3, 2, -4); sc.add(rim);
    var cam = new THREE.PerspectiveCamera(28, W / H, .1, 50);
    var floor = new THREE.Mesh(new THREE.CircleGeometry(.9, 40), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .4 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = .01; sc.add(floor);
    var h = null, bd = null, alive = true, last = performance.now(), turn = 0, danceT = 0;
    if (opts.board) { bd = boardMesh(opts.board); bd.userData.trail.visible = false; bd.position.y = .22; sc.add(bd); }
    function set(nid) {
      if (h) sc.remove(h.root);
      h = make(nid); h.root.rotation.y = Math.PI; h.root.position.y = bd ? .32 : 0; sc.add(h.root); h.play('Idle_Loop');
    }
    if (opts.hero) { set(opts.hero); cam.position.set(0, 1.3, 5.4); cam.lookAt(0, 1.0, 0); }
    else { bd.scale.setScalar(1.15); bd.position.y = .6; cam.position.set(0, 1.5, 4.6); cam.lookAt(0, .55, 0); }
    function loop(now) {
      if (!alive) return;
      var dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now;
      turn += dt * .4;
      if (h) { h.root.rotation.y = Math.PI + Math.sin(turn) * .45; if (danceT > 0) { danceT -= dt; if (danceT <= 0) h.play('Idle_Loop', { fade: .3 }); } h.update(dt); }
      if (bd) {
        if (h) bd.rotation.y = h.root.rotation.y; else { bd.rotation.y += dt * .8; bd.rotation.z = Math.sin(turn * 2) * .15; bd.position.y = .6 + Math.sin(turn * 3) * .05; }
        bd.userData.jets.forEach(function (j) { j.scale.y = .8 + Math.random() * .5; });
      }
      r.render(sc, cam);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return {
      set: set,
      dance: function () { if (!h) return; h.play('Dance_Loop', { fade: .2 }); danceT = 3.2; },
      stop: function () { alive = false; r.dispose(); if (r.forceContextLoss) r.forceContextLoss(); if (r.domElement.parentNode) r.domElement.parentNode.removeChild(r.domElement); }
    };
  }

  MM.Heroes = { load: load, make: make, preview: preview, thumb: thumb, boardMesh: boardMesh, PAL: PAL };
})();
