/* ============================================================
   games.js  -  mini igre (tab Igre)
   ------------------------------------------------------------
   Svaka igra ima 10 nivoa; predjen nivo daje XP. Klasika su
   prve tri zaredom (Dooma, Kamenje, Kviz). Igra se crta sama u
   kontejner sa data-keep (morph je ne dira).
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI, esc = UI.esc;

  var QUIZ = [
    ['Koji MCU film je izašao prvi?', ['The Incredible Hulk', 'Iron Man', 'Thor', 'Captain America: The First Avenger'], 1],
    ['Koji kamen je bio u Lokijevom žezlu?', ['Kamen prostora', 'Kamen moći', 'Kamen uma', 'Kamen duše'], 2],
    ['Kako se zove Thorov drugi čekić (sekira)?', ['Mjolnir', 'Stormbreaker', 'Gungnir', 'Jarnbjorn'], 1],
    ['Šta Tony Stark kaže pre pucnja prstima u Endgameu?', ['I am Iron Man', 'Avengers, assemble', 'I love you 3000', 'We have a Hulk'], 0],
    ['Koliko je kamenja beskonačnosti?', ['5', '6', '7', '4'], 1],
    ['Gde je Thanos dobio kamen duše?', ['Xandar', 'Vormir', 'Titan', 'Knowhere'], 1],
    ['Ko glumi Doctor Dooma u Avengers: Doomsday?', ['Chris Evans', 'Robert Downey Jr.', 'Pedro Pascal', 'Tom Hiddleston'], 1],
    ['Kako se zove Peter Quillova kaseta?', ['Awesome Mix Vol. 1', 'Star-Lord Hits', 'Guardians Mix', 'Terra Tapes'], 0],
    ['Ko je napravio Ultrona?', ['Tony i Bruce', 'Hank Pym', 'Thanos', 'Loki'], 0],
    ['Kako se zove Wakandin metal?', ['Adamantijum', 'Vibranijum', 'Uru', 'Karbonadijum'], 1],
    ['Šta je TVA u Lokiju?', ['Time Variance Authority', 'Time Vault Agency', 'Total Void Army', 'The Variant Alliance'], 0],
    ['Ko je Bucky postao posle Winter Soldiera?', ['White Wolf', 'Falcon', 'U.S. Agent', 'Red Guardian'], 0],
    ['Koji film je odmah posle Infinity War po izlasku?', ['Endgame', 'Ant-Man and the Wasp', 'Captain Marvel', 'Black Panther'], 1],
    ['Kako Dr Strange pobeđuje Dormammua?', ['Vremenskom petljom', 'Kamenom moći', 'Mjolnirom', 'Darkholdom'], 0],
    ['Ko je otac Gamore?', ['Ego', 'Thanos', 'Ronan', 'Yondu'], 1],
    ['Koliko filmova ima Infinity Saga?', ['21', '22', '23', '20'], 2],
    ['Koji je prvi film MCU Faze 4?', ['WandaVision', 'Black Widow', 'Shang-Chi', 'Eternals'], 1],
    ['Kako se zove Kangova varijanta na kraju Loki S1?', ['He Who Remains', 'Immortus', 'Rama-Tut', 'Victor Timely'], 0],
    ['Ko je Yelenin "otac" u Black Widow?', ['Red Guardian', 'Taskmaster', 'Dreykov', 'Winter Soldier'], 0],
    ['Šta znači S.H.I.E.L.D. (prva reč)?', ['Strategic', 'Supreme', 'Special', 'Secret'], 0],
    ['Kako se zove AI koji je zamenio J.A.R.V.I.S.-a?', ['F.R.I.D.A.Y.', 'E.D.I.T.H.', 'K.A.R.E.N.', 'Ultron'], 0],
    ['U kom gradu je bila bitka u The Avengers?', ['Njujork', 'Vašington', 'London', 'Sokovija'], 0],
    ['Koliko godina je Steve Rogers bio zamrznut?', ['~50', '~70', '~90', '~30'], 1],
    ['Ko je ubio Gamoru (Infinity War)?', ['Thanos', 'Nebula', 'Ronan', 'Ebony Maw'], 0],
    ['Kako se zove Thorova sestra?', ['Hela', 'Sif', 'Frigga', 'Valkyrie'], 0],
    ['Koje je pravo ime Black Panthera?', ["T'Challa", "N'Jadaka", "M'Baku", "T'Chaka"], 0],
    ['Ko je glumio Kanga (Quantumania)?', ['Jonathan Majors', 'Josh Brolin', 'Oscar Isaac', 'Mahershala Ali'], 0],
    ['Kako se zove Spider-Manov prijatelj u MCU?', ['Ned', 'Harry', 'Flash', 'Miles'], 0],
    ['Ko je napravio Visionovo telo?', ['Ultron', 'Hank Pym', 'Shuri', 'Wanda'], 0],
    ['Kako se zove TVA agent u Deadpool & Wolverine?', ['Paradox', 'Mobius', 'B-15', 'Casey'], 0],
    ['U kojoj zemlji je Sokovija (u priči)?', ['Istočna Evropa', 'Južna Amerika', 'Afrika', 'Azija'], 0],
    ['Kako se zove Rocketov najbolji drug?', ['Groot', 'Drax', 'Kraglin', 'Yondu'], 0],
    ['Koji je MCU film najkraći?', ['The Incredible Hulk', 'Thor: The Dark World', 'Ant-Man', 'Iron Man'], 1],
    ['Ko kaže "Avengers, assemble" u Endgameu?', ['Captain America', 'Iron Man', 'Thor', 'Nick Fury'], 0],
    ['Kako se zove brod Guardiansa (prvi film)?', ['Milano', 'Benatar', 'Bowie', 'Eclector'], 0],
    ['Šta Groot uvek kaže?', ['I am Groot', 'We are Groot', 'Groot!', 'I am Tree'], 0],
    ['Kako se zove Tonyjeva ćerka?', ['Morgan', 'Pepper', 'Harley', 'Riri'], 0],
    ['Ko je Peter Parkerova tetka?', ['May', 'Martha', 'Mary', 'Maggie'], 0],
    ['Šta je Wanda napravila u Westviewu?', ['TV serijsku stvarnost', 'Vremensku petlju', 'Portal', 'Robota'], 0],
    ['Ko je prvi Captain Marvel u MCU?', ['Carol Danvers', 'Monica Rambeau', 'Kamala Khan', 'Mar-Vell'], 0],
    ['Ko je Thanosova "ćerka" sa plavom kožom?', ['Nebula', 'Gamora', 'Mantis', 'Proxima'], 0],
    ['Kako se zove Hulk kad priča i nosi naočare?', ['Smart Hulk', 'Professor Hulk', 'Grey Hulk', 'Joe Fixit'], 0],
    ['Gde je Black Widow žrtvovala sebe?', ['Vormir', 'Titan', 'Wakanda', 'Asgard'], 0],
    ['Koji stih Thor peva u Love and Thunder (bend)?', ['Guns N\' Roses', 'Queen', 'AC/DC', 'Led Zeppelin'], 0],
    ['Kako se zove Lokijev aligator?', ['Alligator Loki', 'Croki', 'Gator Loki', 'Kid Loki'], 0],
    ['Koje boje je Kamen vremena?', ['Zelen', 'Plav', 'Crven', 'Ljubičast'], 0],
    ['Ko je napravio Iron Man odelo u pećini?', ['Tony uz Yinsena', 'Pepper', 'Obadiah', 'Rhodey'], 0],
    ['Kako se zove Wakandin kralj u Wakanda Forever na kraju?', ['Shuri (kao Black Panther)', "M'Baku", 'Ramonda', 'Okoye'], 0],
    ['Kako Ant-Man ulazi u kvantni svet?', ['Smanji se', 'Kroz portal', 'Teleportom', 'Kamenom'], 0],
    ['Ko je Deadpoolova Wolverine varijanta (glumac)?', ['Hugh Jackman', 'Henry Cavill', 'Chris Evans', 'Ryan Reynolds'], 0]
  ];
  var STONES = ['space', 'mind', 'reality', 'power', 'time', 'soul'];

  var box = null, onWin = null, timers = [], L = 0;
  var only = '';         // vezba: '' = klasika (tri zaredom), inace id jedne igre

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearAll() { timers.forEach(function (t) { if (typeof t === 'object') t.valueOf(); else clearTimeout(t); }); timers = []; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function head(step, title, sub) {
    return '<div class="gm-h"><span class="gm-step">NIVO ' + (L + 1) + (only ? '' : ' · IGRA ' + step + ' / 3') + '</span><h2>' + esc(title) + '</h2><p class="muted">' + esc(sub) + '</p></div>';
  }

  /** Mali "+1" na mestu dodira. */
  function plus(host, e, txt, cls) {
    var r = host.getBoundingClientRect(), el = document.createElement('i');
    el.className = 'gm-plus ' + (cls || ''); el.textContent = txt;
    el.style.left = (e.clientX - r.left) + 'px'; el.style.top = (e.clientY - r.top) + 'px';
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, 700);
  }

  /* ---------------- 1. Uhvati Dooma ---------------- */
  // Mamci (Ultron, Loki) oduzimaju 2, promasaj 1. Glava je sve manja i brza.
  function game1() {
    clearAll();
    var need = Math.min(24, 12 + 2 * L), left = 15, delay = Math.max(480, 760 - 30 * L), minDelay = Math.max(360, 460 - 15 * L);
    var size = Math.max(42, 58 - 3 * L), bait = Math.round(size * .62), decoys = Math.min(3, 1 + Math.floor(L / 2)), hits = 0, done = false;
    box.innerHTML = head(1, 'Uhvati Dooma', 'Tapni Dooma ' + need + ' puta za 15 s. Mamci −2. Sve je brži.') +
      '<div class="gm-bar"><b id="g1h">0 / ' + need + '</b><b id="g1t">15 s</b></div><div class="gm-arena" id="g1a">' +
      '<button type="button" class="gm-doom" id="g1d" style="width:' + size + 'px;height:' + size + 'px"><img src="img/map/doomhead.jpg" alt="" draggable="false"></button>' +
      Array.apply(null, Array(decoys)).map(function (x, i) { return '<span class="gm-decoy" data-i="' + i + '" style="width:' + bait + 'px;height:' + bait + 'px;font-size:' + Math.round(bait * .5) + 'px">' + ['🤖', '🐍', '👾'][i] + '</span>'; }).join('') + '</div>';
    var arena = box.querySelector('#g1a'), d = box.querySelector('#g1d'), dec = box.querySelectorAll('.gm-decoy');
    function place(el, w, avoid) {
      // mamac nikad ne stane preko Dooma (inace Doom ne moze da se tapne)
      var x, y, n = 0;
      do {
        x = Math.round(Math.random() * (arena.clientWidth - w));
        y = Math.round(Math.random() * (arena.clientHeight - w));
      } while (avoid && n++ < 30 && Math.abs(x - avoid[0]) < size + 12 && Math.abs(y - avoid[1]) < size + 12);
      el.style.left = x + 'px'; el.style.top = y + 'px';
      return [x, y];
    }
    function show() { box.querySelector('#g1h').textContent = Math.max(0, hits) + ' / ' + need; }
    function move() { var at = place(d, size); Array.prototype.forEach.call(dec, function (el) { place(el, bait, at); }); }
    function loop() { if (done) return; move(); later(loop, delay); }
    arena.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (done) return;
      if (e.target.closest('#g1d')) {
        hits++; UI.buzz(8);
        plus(arena, e, '+1', 'ok');
        delay = Math.max(minDelay, delay - 30);
        d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit');
        move();
      } else if (e.target.closest('.gm-decoy')) { plus(arena, e, '−2', 'bad'); hits = Math.max(0, hits - 2); UI.buzz([30, 30, 30]); arena.classList.remove('bad'); void arena.offsetWidth; arena.classList.add('bad'); }
      else return;
      show();
      if (hits >= need) { done = true; clearAll(); later(only ? win : game2, 500); }
    });
    loop();
    (function tick() {
      if (done) return;
      box.querySelector('#g1t').textContent = left + ' s';
      if (left-- <= 0) { done = true; fail('Doom je bio brži.'); return; }
      later(tick, 1000);
    })();
  }

  /* ---------------- 2. Kamenje (Simon) ---------------- */
  function game2() {
    clearAll();
    var seq = [], len = Math.min(12, 7 + L), pos = 0, input = false;
    var step = Math.max(400, 620 - 25 * L), lit = Math.max(260, 400 - 15 * L);
    // bez istog kamena dvaput zaredom (tesko je, ali posteno)
    for (var i = 0; i < len; i++) { var n; do { n = Math.floor(Math.random() * 6); } while (n === seq[i - 1]); seq.push(n); }
    box.innerHTML = head(2, 'Kamenje beskonačnosti', 'Zapamti ' + len + ' kamenja, pa ponovi. Prikazuje se jednom' + (L >= 2 ? ', a posle se kamenje izmeša.' : '.')) +
      '<div class="gm-bar"><b id="g2s">Gledaj…</b><b id="g2p">0 / ' + len + '</b></div><div class="gm-stones">' +
      STONES.map(function (s, i) { return '<button type="button" class="gm-st" data-i="' + i + '"><img src="img/map/stone-' + s + '.webp" alt="" draggable="false"></button>'; }).join('') + '</div>';
    var btns = box.querySelectorAll('.gm-st');
    function byStone(i) { return box.querySelector('.gm-st[data-i="' + i + '"]'); }
    function flash(i) { var b = byStone(i); b.classList.add('lit'); later(function () { b.classList.remove('lit'); }, lit); }
    seq.forEach(function (n, k) { later(function () { flash(n); }, 700 + k * step); });
    later(function () {
      // od nivoa 2 kamenje promeni mesta pre unosa (pamtis boju, ne poziciju)
      if (L >= 2) { var wrap = box.querySelector('.gm-stones'); shuffle(Array.prototype.slice.call(btns)).forEach(function (b) { wrap.appendChild(b); }); }
      input = true; box.querySelector('#g2s').textContent = 'Tvoj red';
    }, 700 + len * step);
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        if (!input) return;
        var i = +b.getAttribute('data-i');
        flash(i); UI.buzz(6);
        if (i !== seq[pos]) {
          input = false; b.classList.add('wrong');
          var right = byStone(seq[pos]); right.classList.add('should');
          later(function () { fail('Pogrešan kamen — trebalo je ' + ['plavi', 'žuti', 'crveni', 'ljubičasti', 'zeleni', 'narandžasti'][seq[pos]] + '. Stigao si do ' + pos + ' / ' + len + '.'); }, 900);
          return;
        }
        pos++;
        box.querySelector('#g2p').textContent = pos + ' / ' + len;
        if (pos === len) { input = false; later(only ? win : game3, 600); }
      });
    });
  }

  /* ---------------- 3. Kviz ---------------- */
  function game3() {
    clearAll();
    var total = Math.min(10, 6 + L), secs = Math.max(6, 12 - Math.floor(L / 2)), qs = shuffle(QUIZ).slice(0, total), k = 0, answered = false;
    function ask() {
      answered = false;
      var q = qs[k];
      var opts = q[1].map(function (t, i) { return { t: t, ok: i === q[2] }; });
      opts = shuffle(opts);
      box.innerHTML = head(3, 'Marvel kviz', total + ' pitanja, ' + secs + ' sekundi po pitanju. Sva tačna.') +
        '<div class="gm-bar"><b>Pitanje ' + (k + 1) + ' / ' + total + '</b><b id="g3t">' + secs + ' s</b></div><p class="gm-q">' + esc(q[0]) + '</p><div class="gm-opts">' +
        opts.map(function (o, i) { return '<button type="button" class="btn ghost wide gm-o" data-ok="' + (o.ok ? 1 : 0) + '">' + esc(o.t) + '</button>'; }).join('') + '</div>';
      Array.prototype.forEach.call(box.querySelectorAll('.gm-o'), function (b) {
        b.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          if (b.getAttribute('data-ok') !== '1') {
            b.classList.add('bad'); UI.buzz([20, 40, 20]);
            var g = box.querySelector('.gm-o[data-ok="1"]'); if (g) g.classList.add('good');
            later(function () { fail('Netačno — tačno je „' + q[1][q[2]] + '“.'); }, 1100);
            return;
          }
          b.classList.add('good'); UI.buzz(8);
          k++;
          later(k === total ? win : ask, 450);
        });
      });
      var t = secs, myK = k;
      (function tick() {
        if (answered || k !== myK || !box) return;
        var el = box.querySelector('#g3t'); if (el) el.textContent = t + ' s';
        if (t-- <= 0) { answered = true; var g = box.querySelector('.gm-o[data-ok="1"]'); if (g) g.classList.add('good'); later(function () { fail('Isteklo vreme — tačno je „' + q[1][q[2]] + '“.'); }, 900); return; }
        later(tick, 1000);
      })();
    }
    ask();
  }


  /* ============================================================
     dodatne igre (samo u tabu Igre)
     ============================================================ */

  function solo(title, sub) {
    return '<div class="gm-h"><span class="gm-step">NIVO ' + (L + 1) + '</span><h2>' + esc(title) + '</h2><p class="muted">' + esc(sub) + '</p></div>';
  }
  function countdown(sec, elId, onEnd, isDone) {
    var left = sec;
    (function tick() {
      if (isDone()) return;
      var el = box && box.querySelector(elId); if (el) el.textContent = left + ' s';
      if (left-- <= 0) { onEnd(); return; }
      later(tick, 1000);
    })();
  }

  /* --- Memorija: parovi predmeta iz filmova --- */
  function gMemo() {
    clearAll();
    var pairs = Math.min(10, 6 + Math.floor(L / 2)), secs = Math.max(30, 60 - 3 * L), done = false;
    var pool = shuffle(MM.Cat.all().filter(function (i) { return MM.Badges.ITEMS[i.id] && MM.Badges.spec(i).icon !== 'gauntlet'; }));
    var icons = {}, picks = [];
    pool.forEach(function (i) { var ic = MM.Badges.spec(i).icon; if (!icons[ic] && picks.length < pairs) { icons[ic] = 1; picks.push(i); } });
    var cards = shuffle(picks.concat(picks).map(function (it, k) { return { id: it.id, k: k }; }));
    box.innerHTML = solo('Memorija', 'Nađi ' + pairs + ' parova predmeta za ' + secs + ' sekundi.') +
      '<div class="gm-bar"><b id="mmP">0 / ' + pairs + '</b><b id="mmT">' + secs + ' s</b></div>' +
      '<div class="gm-memo c' + (pairs > 8 ? 5 : 4) + '">' + cards.map(function (c, n) {
        return '<button type="button" class="mm-c" data-n="' + n + '" data-id="' + esc(c.id) + '"><span class="mm-back">?</span><span class="mm-front">' + MM.Badges.tile(MM.Cat.get(c.id), { size: 'sm' }) + '</span></button>';
      }).join('') + '</div>';
    var open1 = null, lock = false, found = 0;
    Array.prototype.forEach.call(box.querySelectorAll('.mm-c'), function (b) {
      b.addEventListener('click', function () {
        if (lock || done || b.classList.contains('up') || b.classList.contains('ok')) return;
        b.classList.add('up'); UI.buzz(5);
        if (!open1) { open1 = b; return; }
        if (open1.getAttribute('data-id') === b.getAttribute('data-id')) {
          open1.classList.add('ok'); b.classList.add('ok'); open1 = null; found++;
          box.querySelector('#mmP').textContent = found + ' / ' + pairs;
          if (found === pairs) { done = true; clearAll(); later(win, 500); }
        } else {
          lock = true; var a = open1; open1 = null;
          later(function () { a.classList.remove('up'); b.classList.remove('up'); lock = false; }, 650);
        }
      });
    });
    countdown(secs, '#mmT', function () { done = true; fail('Isteklo vreme. Pamćenje kao Drax.'); }, function () { return done; });
  }

  /* --- Hronologija: poredaj filmove po izlasku --- */
  function gHrono() {
    clearAll();
    var n = Math.min(8, 4 + Math.floor(L / 2)), secs = Math.max(20, 40 - 2 * L), done = false;
    var films = MM.Cat.all().filter(function (i) { return i.type === 'film' && (i.col === 'mcu' || L >= 3) && i.date <= '2026-08-01'; });
    var pick = [], years = {};
    shuffle(films).forEach(function (f) { if (pick.length < n && !years[f.date]) { years[f.date] = 1; pick.push(f); } });
    var right = pick.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    box.innerHTML = solo('Hronologija', 'Tapni ' + n + ' filmova redom kako su izlazili — od najstarijeg.') +
      '<div class="gm-bar"><b id="hrP">0 / ' + n + '</b><b id="hrT">' + secs + ' s</b></div><div class="gm-hrono">' +
      shuffle(pick).map(function (f) { return '<button type="button" class="hr-b" data-id="' + esc(f.id) + '"><i></i>' + esc(MM.Cat.cleanTitle(f)) + '</button>'; }).join('') + '</div>';
    var pos = 0;
    Array.prototype.forEach.call(box.querySelectorAll('.hr-b'), function (b) {
      b.addEventListener('click', function () {
        if (done || b.classList.contains('ok')) return;
        if (b.getAttribute('data-id') !== right[pos].id) {
          done = true; b.classList.add('bad'); UI.buzz([20, 40, 20]);
          later(function () { fail('Pre njega je bio „' + MM.Cat.cleanTitle(right[pos]) + '“ (' + right[pos].year + ').'); }, 600);
          return;
        }
        pos++; b.classList.add('ok'); b.querySelector('i').textContent = pos + ' · ' + right[pos - 1].year; UI.buzz(8);
        box.querySelector('#hrP').textContent = pos + ' / ' + n;
        if (pos === n) { done = true; clearAll(); later(win, 600); }
      });
    });
    countdown(secs, '#hrT', function () { done = true; fail('Isteklo vreme.'); }, function () { return done; });
  }

  /* --- Mjolnir: zaustavi strelicu u zlatnoj zoni --- */
  function gMjolnir() {
    clearAll();
    var need = Math.min(10, 5 + Math.floor(L / 2)), lives = 3, ok = 0, done = false;
    var zone = Math.max(9, 22 - 1.5 * L), speed = Math.min(2.6, 1.1 + .15 * L);   // % sirine, % po frejmu
    box.innerHTML = solo('Podigni Mjolnir', 'Tapni kad je strelica u zlatnoj zoni. ' + need + ' puta, imaš 3 života.') +
      '<div class="gm-bar"><b id="mjP">0 / ' + need + '</b><b id="mjL">❤️❤️❤️</b></div>' +
      '<button type="button" class="gm-mj" id="mjB"><span class="mj-zone" id="mjZ"></span><span class="mj-arrow" id="mjA"></span><span class="mj-ham">🔨</span></button>';
    var z = box.querySelector('#mjZ'), a = box.querySelector('#mjA'), x = 0, dir = 1, zx = 0;
    function newZone() { zx = 5 + Math.random() * (90 - zone); z.style.left = zx + '%'; z.style.width = zone + '%'; }
    newZone();
    var raf;
    (function step() {
      if (done || !box) return;
      x += dir * speed; if (x >= 100) { x = 100; dir = -1; } if (x <= 0) { x = 0; dir = 1; }
      a.style.left = x + '%';
      raf = requestAnimationFrame(step);
    })();
    timers.push({ valueOf: function () { cancelAnimationFrame(raf); return 0; } });
    box.querySelector('#mjB').addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (done) return;
      if (x >= zx && x <= zx + zone) {
        ok++; UI.buzz(10); box.querySelector('#mjP').textContent = ok + ' / ' + need;
        z.classList.remove('hit'); void z.offsetWidth; z.classList.add('hit');
        speed *= 1.06; newZone();
        if (ok >= need) { done = true; cancelAnimationFrame(raf); later(win, 500); }
      } else {
        lives--; UI.buzz([30, 30, 30]); box.querySelector('#mjL').textContent = '❤️❤️❤️'.slice(0, lives * 2) || '—';
        if (lives <= 0) { done = true; cancelAnimationFrame(raf); fail('Nisi dostojan Mjolnira.'); }
      }
    });
  }

  /* --- Refleks: tapni čim Thanos pucne --- */
  function gSnap() {
    clearAll();
    var rounds = 5, limit = Math.max(330, 650 - 30 * L), r = 0, times = [], state = 'wait', done = false;
    box.innerHTML = solo('Pucanj prstima', 'Tapni čim ekran pozeleni. Ne pre! Imaš ' + limit + ' ms.') +
      '<div class="gm-bar"><b id="snR">1 / ' + rounds + '</b><b id="snT"></b></div><button type="button" class="gm-snap" id="snB"><span>čekaj…</span></button>';
    var b = box.querySelector('#snB'), t0 = 0;
    function arm() {
      state = 'wait'; b.className = 'gm-snap'; b.querySelector('span').textContent = 'čekaj…';
      later(function () { if (done) return; state = 'go'; t0 = performance.now(); b.className = 'gm-snap go'; b.querySelector('span').textContent = '💥 SAD!';
        later(function () { if (state === 'go' && !done) { done = true; fail('Prespor. Pola univerzuma je nestalo.'); } }, limit);
      }, 1100 + Math.random() * 2400);
    }
    b.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (done) return;
      if (state === 'wait') { done = true; clearAll(); fail('Prerano! Thanos nije ni pucnuo.'); return; }
      if (state !== 'go') return;
      var ms = Math.round(performance.now() - t0); times.push(ms); state = 'idle'; clearAll(); UI.buzz(8);
      b.className = 'gm-snap hit'; b.querySelector('span').textContent = ms + ' ms';
      r++; box.querySelector('#snR').textContent = Math.min(r + 1, rounds) + ' / ' + rounds;
      box.querySelector('#snT').textContent = 'najbolje ' + Math.min.apply(null, times) + ' ms';
      if (r >= rounds) { done = true; later(win, 700); } else later(arm, 700);
    });
    arm();
  }


  /* --- Čiji je predmet? --- */
  function gItem() {
    clearAll();
    var total = Math.min(10, 6 + L), secs = Math.max(5, 10 - Math.floor(L / 2)), k = 0, answered = false;
    var pool = shuffle(MM.Cat.all().filter(function (i) { return MM.Badges.ITEMS[i.id] && (i.col === 'mcu' || L >= 2) && i.type !== 'special'; }));
    var qs = [], seenIc = {};
    pool.forEach(function (i) { var ic = MM.Badges.spec(i).icon; if (qs.length < total && !seenIc[ic]) { seenIc[ic] = 1; qs.push(i); } });
    function ask() {
      answered = false;
      var it = qs[k];
      var wrong = shuffle(pool.filter(function (x) { return x.id !== it.id && MM.Badges.spec(x).icon !== MM.Badges.spec(it).icon; })).slice(0, 3);
      var opts = shuffle([it].concat(wrong));
      box.innerHTML = solo('Čiji je predmet?', 'Iz kog naslova je predmet? ' + total + ' pitanja, ' + secs + ' s svako.') +
        '<div class="gm-bar"><b>' + (k + 1) + ' / ' + total + '</b><b id="itT">' + secs + ' s</b></div>' +
        '<div class="gm-item">' + MM.Badges.tile(it, { size: 'lg' }) + '<b>' + esc(MM.Badges.spec(it).name) + '</b></div><div class="gm-opts">' +
        opts.map(function (o) { return '<button type="button" class="btn ghost wide gm-o" data-ok="' + (o.id === it.id ? 1 : 0) + '">' + esc(MM.Cat.cleanTitle(o)) + '</button>'; }).join('') + '</div>';
      Array.prototype.forEach.call(box.querySelectorAll('.gm-o'), function (b) {
        b.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          if (b.getAttribute('data-ok') !== '1') {
            b.classList.add('bad'); box.querySelector('.gm-o[data-ok="1"]').classList.add('good'); UI.buzz([20, 40, 20]);
            later(function () { fail('To je iz „' + MM.Cat.cleanTitle(it) + '“.'); }, 1000); return;
          }
          b.classList.add('good'); UI.buzz(8); k++;
          later(k === total ? win : ask, 420);
        });
      });
      var t = secs, myK = k;
      (function tick() {
        if (answered || k !== myK || !box) return;
        var el = box.querySelector('#itT'); if (el) el.textContent = t + ' s';
        if (t-- <= 0) { answered = true; fail('Isteklo vreme — to je iz „' + MM.Cat.cleanTitle(it) + '“.'); return; }
        later(tick, 1000);
      })();
    }
    ask();
  }

  /* --- Hulk razbija: lupaj sto brze --- */
  function gHulk() {
    clearAll();
    var need = Math.min(90, 40 + 6 * L), secs = 10, hits = 0, done = false, started = false;
    box.innerHTML = solo('Hulk razbija', 'Lupaj po zidu što brže — ' + need + ' udaraca za ' + secs + ' sekundi.') +
      '<div class="gm-bar"><b id="hkP">0 / ' + need + '</b><b id="hkT">' + secs + ' s</b></div>' +
      '<button type="button" class="gm-hulk" id="hkB"><span class="hk-wall" id="hkW"></span><span class="hk-fist">👊</span><i>tapni da počne</i></button>';
    var b = box.querySelector('#hkB'), w = box.querySelector('#hkW');
    b.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (done) return;
      if (!started) { started = true; b.querySelector('i').textContent = 'HULK SMASH!'; countdown(secs, '#hkT', function () { done = true; fail('Zid je izdržao. ' + hits + ' / ' + need + '.'); }, function () { return done; }); }
      hits++; UI.buzz(4);
      box.querySelector('#hkP').textContent = hits + ' / ' + need;
      w.style.setProperty('--crack', Math.min(1, hits / need));
      b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
      if (hits >= need) { done = true; clearAll(); b.classList.add('smash'); later(win, 700); }
    });
  }

  /* --- Portali: zatvori portale, ne diraj Dormammua --- */
  function gPortal() {
    clearAll();
    var need = Math.min(30, 14 + 2 * L), secs = 20, up = Math.max(520, 1050 - 50 * L), evil = Math.min(.35, .12 + .03 * L);
    var hits = 0, lives = 3, done = false;
    box.innerHTML = solo('Portali', 'Tapni zlatne portale (' + need + '). Ljubičasti je Dormammu — ne diraj. 3 života.') +
      '<div class="gm-bar"><b id="ptP">0 / ' + need + '</b><b><span id="ptL">❤️❤️❤️</span> · <span id="ptT">' + secs + ' s</span></b></div>' +
      '<div class="gm-portals">' + Array.apply(null, Array(9)).map(function (x, i) { return '<button type="button" class="pt-h" data-i="' + i + '"><span></span></button>'; }).join('') + '</div>';
    var holes = box.querySelectorAll('.pt-h');
    function spawn() {
      if (done) return;
      var free = Array.prototype.filter.call(holes, function (h) { return !h.classList.contains('on'); });
      if (free.length) {
        var h = free[Math.floor(Math.random() * free.length)], bad = Math.random() < evil;
        h.classList.add('on'); h.classList.toggle('evil', bad);
        later(function () { h.classList.remove('on', 'evil'); }, up);
      }
      later(spawn, Math.max(260, up * .55));
    }
    Array.prototype.forEach.call(holes, function (h) {
      h.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (done || !h.classList.contains('on')) return;
        var bad = h.classList.contains('evil');
        h.classList.remove('on', 'evil');
        if (bad) {
          lives--; UI.buzz([30, 30, 30]); box.querySelector('#ptL').textContent = '❤️❤️❤️'.slice(0, lives * 2) || '—';
          if (lives <= 0) { done = true; fail('Dormammu, došao si da se pogađaš… i izgubio si.'); }
          return;
        }
        hits++; UI.buzz(6); box.querySelector('#ptP').textContent = hits + ' / ' + need;
        if (hits >= need) { done = true; clearAll(); later(win, 500); }
      });
    });
    spawn();
    countdown(secs, '#ptT', function () { done = true; fail('Portali su ostali otvoreni. ' + hits + ' / ' + need + '.'); }, function () { return done; });
  }

  /** Sve igre: id -> { naziv, ikonica, opis, funkcija } */
  var REG = {
    doom: { name: 'Uhvati Dooma', emo: '🎯', desc: 'brzina i preciznost', fn: function () { return game1(); } },
    stones: { name: 'Kamenje', emo: '💎', desc: 'pamćenje niza', fn: function () { return game2(); } },
    quiz: { name: 'Marvel kviz', emo: '❓', desc: 'znanje, na vreme', fn: function () { return game3(); } },
    memo: { name: 'Memorija', emo: '🃏', desc: 'parovi predmeta', fn: gMemo },
    hrono: { name: 'Hronologija', emo: '📅', desc: 'filmovi po izlasku', fn: gHrono },
    mjolnir: { name: 'Mjolnir', emo: '🔨', desc: 'tajming', fn: gMjolnir },
    snap: { name: 'Pucanj prstima', emo: '🫰', desc: 'refleks', fn: gSnap },
    item: { name: 'Čiji je predmet?', emo: '🛡️', desc: 'predmet → film', fn: gItem },
    hulk: { name: 'Hulk razbija', emo: '👊', desc: 'brzi prsti', fn: gHulk },
    portal: { name: 'Portali', emo: '🌀', desc: 'pazi na Dormammua', fn: gPortal }
  };

  /** 3 - 2 - 1 pa igra, da te ne iznenadi. */
  function intro(fn) {
    clearAll();
    var n = 3;
    (function tick() {
      if (!box) return;
      if (n === 0) { fn(); return; }
      box.innerHTML = '<div class="gm-cnt"><b>' + n + '</b><span>' + esc(only ? REG[only].name : 'Klasika: tri zaredom') + '</span></div>';
      UI.buzz(6); n--;
      later(tick, 650);
    })();
  }

  function first() { intro(only ? REG[only].fn : game1); }

  function fail(why) {
    clearAll();
    box.innerHTML = '<div class="gm-end"><div class="gm-emo">😵</div><h2>Pao si.</h2><p class="muted">' + esc(why) +
      (only ? '' : ' Kreće se od prve igre.') + '</p>' +
      '<button type="button" class="btn primary wide" id="gmRe">Ponovo</button><button type="button" class="btn ghost wide" data-a="sheet-close">' +
      'Zatvori</button></div>';
    box.querySelector('#gmRe').onclick = first;
  }

  function confetti() {
    var fx = document.createElement('div'); fx.className = 'gm-conf';
    var c = ['#ffd36b', '#e62429', '#39d97a', '#3b82f6', '#a855f7', '#ff8a00'], h = '';
    for (var i = 0; i < 40; i++) h += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + c[i % 6] + ';animation-delay:' + (Math.random() * .4).toFixed(2) + 's;--x:' + (Math.random() * 120 - 60).toFixed(0) + 'px;--r:' + (Math.random() * 720).toFixed(0) + 'deg"></i>';
    fx.innerHTML = h; document.body.appendChild(fx);
    setTimeout(function () { fx.remove(); }, 2400);
  }

  function win() {
    clearAll();
    confetti(); UI.buzz([15, 40, 25]);
    var r = onWin ? onWin(L + 1) : null;
    box.innerHTML = '<div class="gm-end"><div class="gm-emo">🏆</div><h2>Prešao si nivo ' + (L + 1) + '!</h2>' +
      '<p class="muted">' + (r && r.xp ? '<b class="gm-xp">+' + r.xp + ' XP</b>' + (r.up ? '<br><b class="gm-up">NOVI NIVO: ' + r.lvl + ' · ' + esc(r.title) + '</b>' : '') +
        (r.rec ? '<br>Novi rekord u ovoj igri!' : '') : (only ? 'Probaj teži nivo.' : 'Sve tri igre zaredom. Ozbiljno.')) + '</p>' +
      (L < 9 ? '<button type="button" class="btn primary wide" id="gmNext">Nivo ' + (L + 2) + '</button>' : '<p class="muted">To je bio poslednji nivo. Legenda.</p>') +
      '<button type="button" class="btn ghost wide" data-a="sheet-close">Zatvori</button></div>';
    var nx = box.querySelector('#gmNext');
    if (nx) nx.onclick = function () { L = Math.min(9, L + 1); first(); };
  }

  /** opts: { only } - id jedne igre; bez njega klasika (tri zaredom). */
  function open(level, cb, opts) {
    L = level || 0;
    onWin = cb;
    opts = opts || {};
    only = opts.only || '';
    UI.openSheet({
      id: 'games', full: true, cls: 'gm-sheet',
      render: function () {
        return '<div class="gm-top"><button type="button" class="ib close" data-a="sheet-close" aria-label="Zatvori">✕</button></div>' +
          '<div class="gm no-drag" id="gmBox" data-keep></div>';
      },
      onOpen: function (el) {
        box = el.querySelector('#gmBox');
        first();
      },
      onClose: function () { clearAll(); box = null; }
    });
  }

  /* ---------------- nivo igraca ---------------- */
  var TITLES = ['Rekrut', 'Kadet S.H.I.E.L.D.-a', 'Agent', 'Specijalni agent', 'Defender', 'Guardian', 'Avenger',
    'Revenger', 'Sorcerer Supreme', 'Vrhovni Avenger', 'Asgardijanac', 'Celestial', 'Doomov rival'];
  /** Nivo iz XP: nivo n trazi 100 + 200 + ... + 100*(n-1) XP. */
  function lvlOf(xp) {
    var n = Math.floor((Math.sqrt(1 + 8 * (xp || 0) / 100) - 1) / 2) + 1;
    var from = 100 * (n - 1) * n / 2, to = 100 * n * (n + 1) / 2;
    return { n: n, title: TITLES[Math.min(TITLES.length - 1, n - 1)], from: from, to: to, pct: Math.round(((xp || 0) - from) / (to - from) * 100) };
  }
  /** XP za predjen nivo: klasika (tri zaredom) vredi trostruko. */
  function xpFor(id, level) { return (id === 'classic' ? 60 : 20) * level; }

  MM.Games = { open: open, REG: REG, lvlOf: lvlOf, xpFor: xpFor, TITLES: TITLES };
})();
