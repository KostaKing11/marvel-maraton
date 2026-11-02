/* ============================================================
   games.js  -  "isključi poruke" za Vićovca
   ------------------------------------------------------------
   Tri igre zaredom; ako padne bilo koju, kreće ispočetka.
     1. Uhvati Dooma: 12 pogodaka za 15 s, Doom skače sve brže
     2. Kamenje: zapamti i ponovi niz od 7 kamenja
     3. Kviz: 6 pitanja, sva tačna
   Igra se crta sama u kontejner sa data-keep (morph je ne dira).
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
    ['Kako se zove brod Guardiansa (prvi film)?', ['Milano', 'Benatar', 'Bowie', 'Eclector'], 0]
  ];
  var STONES = ['space', 'mind', 'reality', 'power', 'time', 'soul'];

  var box = null, onWin = null, timers = [], L = 0;   // L = nivo: svaka pobeda = teze sledeci put

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearAll() { timers.forEach(clearTimeout); timers = []; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function head(step, title, sub) {
    return '<div class="gm-h"><span class="gm-step">NIVO ' + (L + 1) + ' · IGRA ' + step + ' / 3</span><h2>' + esc(title) + '</h2><p class="muted">' + esc(sub) + '</p></div>';
  }

  /* ---------------- 1. Uhvati Dooma ---------------- */
  // Mamci (Ultron, Loki) oduzimaju 2, promasaj 1. Glava je sve manja i brza.
  function game1() {
    clearAll();
    var need = 16 + 3 * L, left = 15, delay = Math.max(380, 640 - 40 * L), minDelay = Math.max(240, 330 - 20 * L);
    var size = Math.max(34, 52 - 4 * L), decoys = Math.min(3, 1 + L), hits = 0, done = false;
    box.innerHTML = head(1, 'Uhvati Dooma', 'Tapni Dooma ' + need + ' puta za 15 s. Mamci −2, promašaj −1. Sve je brži.') +
      '<div class="gm-bar"><b id="g1h">0 / ' + need + '</b><b id="g1t">15 s</b></div><div class="gm-arena" id="g1a">' +
      '<button type="button" class="gm-doom" id="g1d" style="width:' + size + 'px;height:' + size + 'px"><img src="img/map/doomhead.jpg" alt="" draggable="false"></button>' +
      Array.apply(null, Array(decoys)).map(function (x, i) { return '<span class="gm-decoy" data-i="' + i + '" style="width:' + size + 'px;height:' + size + 'px">' + ['🤖', '🐍', '👾'][i] + '</span>'; }).join('') + '</div>';
    var arena = box.querySelector('#g1a'), d = box.querySelector('#g1d'), dec = box.querySelectorAll('.gm-decoy');
    function place(el) {
      el.style.left = Math.round(Math.random() * (arena.clientWidth - size)) + 'px';
      el.style.top = Math.round(Math.random() * (arena.clientHeight - size)) + 'px';
    }
    function show() { box.querySelector('#g1h').textContent = Math.max(0, hits) + ' / ' + need; }
    function move() { place(d); Array.prototype.forEach.call(dec, place); }
    function loop() { if (done) return; move(); later(loop, delay); }
    arena.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (done) return;
      if (e.target.closest('#g1d')) {
        hits++; UI.buzz(8);
        delay = Math.max(minDelay, delay - 30);
        d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit');
        move();
      } else if (e.target.closest('.gm-decoy')) { hits = Math.max(0, hits - 2); UI.buzz([30, 30, 30]); arena.classList.remove('bad'); void arena.offsetWidth; arena.classList.add('bad'); }
      else { hits = Math.max(0, hits - 1); UI.buzz(20); }
      show();
      if (hits >= need) { done = true; clearAll(); later(game2, 500); }
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
    var seq = [], len = Math.min(15, 9 + L), pos = 0, input = false;
    var step = Math.max(320, 520 - 30 * L), lit = Math.max(200, 320 - 20 * L);
    // bez istog kamena dvaput zaredom (tesko je, ali posteno)
    for (var i = 0; i < len; i++) { var n; do { n = Math.floor(Math.random() * 6); } while (n === seq[i - 1]); seq.push(n); }
    box.innerHTML = head(2, 'Kamenje beskonačnosti', 'Zapamti ' + len + ' kamenja, pa ponovi. Prikazuje se jednom' + (L >= 1 ? ', a posle se kamenje izmeša.' : '.')) +
      '<div class="gm-bar"><b id="g2s">Gledaj…</b><b id="g2p">0 / ' + len + '</b></div><div class="gm-stones">' +
      STONES.map(function (s, i) { return '<button type="button" class="gm-st" data-i="' + i + '"><img src="img/map/stone-' + s + '.webp" alt="" draggable="false"></button>'; }).join('') + '</div>';
    var btns = box.querySelectorAll('.gm-st');
    function byStone(i) { return box.querySelector('.gm-st[data-i="' + i + '"]'); }
    function flash(i) { var b = byStone(i); b.classList.add('lit'); later(function () { b.classList.remove('lit'); }, lit); }
    seq.forEach(function (n, k) { later(function () { flash(n); }, 700 + k * step); });
    later(function () {
      // od nivoa 2 kamenje promeni mesta pre unosa (pamtis boju, ne poziciju)
      if (L >= 1) { var wrap = box.querySelector('.gm-stones'); shuffle(Array.prototype.slice.call(btns)).forEach(function (b) { wrap.appendChild(b); }); }
      input = true; box.querySelector('#g2s').textContent = 'Tvoj red';
    }, 700 + len * step);
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        if (!input) return;
        var i = +b.getAttribute('data-i');
        flash(i); UI.buzz(6);
        if (i !== seq[pos]) { input = false; fail('Pogrešan kamen. Thanos se smeje.'); return; }
        pos++;
        box.querySelector('#g2p').textContent = pos + ' / ' + len;
        if (pos === len) { input = false; later(game3, 600); }
      });
    });
  }

  /* ---------------- 3. Kviz ---------------- */
  function game3() {
    clearAll();
    var total = Math.min(14, 8 + L), secs = Math.max(4, 8 - Math.floor(L / 2)), qs = shuffle(QUIZ).slice(0, total), k = 0, answered = false;
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
          if (b.getAttribute('data-ok') !== '1') { b.classList.add('bad'); UI.buzz([20, 40, 20]); later(function () { fail('Netačno. Pravi fan bi znao.'); }, 500); return; }
          b.classList.add('good'); UI.buzz(8);
          k++;
          later(k === total ? win : ask, 450);
        });
      });
      var t = secs, myK = k;
      (function tick() {
        if (answered || k !== myK || !box) return;
        var el = box.querySelector('#g3t'); if (el) el.textContent = t + ' s';
        if (t-- <= 0) { answered = true; fail('Isteklo vreme. Doom ne čeka.'); return; }
        later(tick, 1000);
      })();
    }
    ask();
  }

  function fail(why) {
    clearAll();
    box.innerHTML = '<div class="gm-end"><div class="gm-emo">🥱</div><h2>Pao si.</h2><p class="muted">' + esc(why) + ' Kreće se od prve igre.</p>' +
      '<button type="button" class="btn primary wide" id="gmRe">Ponovo</button><button type="button" class="btn ghost wide" data-a="sheet-close">Odustajem, dosadan sam</button></div>';
    box.querySelector('#gmRe').onclick = game1;
  }

  function win() {
    clearAll();
    box.innerHTML = '<div class="gm-end"><div class="gm-emo">🏆</div><h2>Zaslužio si tišinu.</h2><p class="muted">Poruke su isključene 24 sata. Posle se vraćaju, a sledeći put je nivo ' + (L + 2) + ' — teže.</p>' +
      '<button type="button" class="btn primary wide" data-a="sheet-close">Hvala</button></div>';
    if (onWin) onWin();
  }

  function open(level, cb) {
    L = level || 0;
    onWin = cb;
    UI.openSheet({
      id: 'games', full: true, cls: 'gm-sheet',
      render: function () {
        return '<div class="gm-top"><button type="button" class="ib close" data-a="sheet-close" aria-label="Zatvori">✕</button></div>' +
          '<div class="gm no-drag" id="gmBox" data-keep></div>';
      },
      onOpen: function (el) {
        box = el.querySelector('#gmBox');
        box.innerHTML = '<div class="gm-end"><div class="gm-emo">🎮</div><h2>Isključi poruke</h2>' +
          '<p class="muted">Nivo ' + (L + 1) + '. Tri igre zaredom: uhvati Dooma, ponovi kamenje, Marvel kviz na vreme bez greške. Padneš bilo gde — ispočetka. Tišina traje 24 sata.</p>' +
          '<button type="button" class="btn primary wide" id="gmGo">Kreni</button></div>';
        box.querySelector('#gmGo').onclick = game1;
      },
      onClose: function () { clearAll(); box = null; }
    });
  }

  MM.Games = { open: open };
})();
