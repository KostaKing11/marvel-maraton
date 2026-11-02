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
    ['Koliko filmova ima Infinity Saga?', ['21', '22', '23', '20'], 2]
  ];
  var STONES = ['space', 'mind', 'reality', 'power', 'time', 'soul'];

  var box = null, onWin = null, timers = [];

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearAll() { timers.forEach(clearTimeout); timers = []; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function head(step, title, sub) {
    return '<div class="gm-h"><span class="gm-step">IGRA ' + step + ' / 3</span><h2>' + esc(title) + '</h2><p class="muted">' + esc(sub) + '</p></div>';
  }

  /* ---------------- 1. Uhvati Dooma ---------------- */
  function game1() {
    clearAll();
    var hits = 0, need = 12, left = 15, delay = 820;
    box.innerHTML = head(1, 'Uhvati Dooma', 'Tapni Dooma 12 puta za 15 sekundi. Svaki put je brži.') +
      '<div class="gm-bar"><b id="g1h">0 / ' + need + '</b><b id="g1t">15 s</b></div><div class="gm-arena" id="g1a">' +
      '<button type="button" class="gm-doom" id="g1d"><img src="img/map/doomhead.jpg" alt="" draggable="false"></button></div>';
    var arena = box.querySelector('#g1a'), d = box.querySelector('#g1d'), done = false;
    function move() {
      var w = arena.clientWidth - 64, h = arena.clientHeight - 64;
      d.style.left = Math.round(Math.random() * w) + 'px';
      d.style.top = Math.round(Math.random() * h) + 'px';
    }
    function loop() { if (done) return; move(); later(loop, delay); }
    d.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (done) return;
      hits++; UI.buzz(8);
      delay = Math.max(430, delay - 35);
      box.querySelector('#g1h').textContent = hits + ' / ' + need;
      d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit');
      move();
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
    var seq = [], len = 7, pos = 0, input = false;
    // bez istog kamena dvaput zaredom (tesko je, ali posteno)
    for (var i = 0; i < len; i++) { var n; do { n = Math.floor(Math.random() * 6); } while (n === seq[i - 1]); seq.push(n); }
    box.innerHTML = head(2, 'Kamenje beskonačnosti', 'Zapamti redosled od 7 kamenja, pa ga ponovi. Prikazuje se samo jednom.') +
      '<div class="gm-bar"><b id="g2s">Gledaj…</b><b id="g2p">0 / ' + len + '</b></div><div class="gm-stones">' +
      STONES.map(function (s, i) { return '<button type="button" class="gm-st" data-i="' + i + '"><img src="img/map/stone-' + s + '.webp" alt="" draggable="false"></button>'; }).join('') + '</div>';
    var btns = box.querySelectorAll('.gm-st');
    function flash(i) { btns[i].classList.add('lit'); later(function () { btns[i].classList.remove('lit'); }, 380); }
    seq.forEach(function (n, k) { later(function () { flash(n); }, 700 + k * 600); });
    later(function () { input = true; box.querySelector('#g2s').textContent = 'Tvoj red'; }, 700 + len * 600);
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
    var qs = shuffle(QUIZ).slice(0, 6), k = 0;
    function ask() {
      var q = qs[k];
      var opts = q[1].map(function (t, i) { return { t: t, ok: i === q[2] }; });
      opts = shuffle(opts);
      box.innerHTML = head(3, 'Marvel kviz', 'Šest pitanja. Sva moraju biti tačna.') +
        '<div class="gm-bar"><b>Pitanje ' + (k + 1) + ' / 6</b><b></b></div><p class="gm-q">' + esc(q[0]) + '</p><div class="gm-opts">' +
        opts.map(function (o, i) { return '<button type="button" class="btn ghost wide gm-o" data-ok="' + (o.ok ? 1 : 0) + '">' + esc(o.t) + '</button>'; }).join('') + '</div>';
      Array.prototype.forEach.call(box.querySelectorAll('.gm-o'), function (b) {
        b.addEventListener('click', function () {
          if (b.getAttribute('data-ok') !== '1') { b.classList.add('bad'); UI.buzz([20, 40, 20]); later(function () { fail('Netačno. Pravi fan bi znao.'); }, 500); return; }
          b.classList.add('good'); UI.buzz(8);
          k++;
          later(k === 6 ? win : ask, 450);
        });
      });
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
    box.innerHTML = '<div class="gm-end"><div class="gm-emo">🏆</div><h2>Zaslužio si tišinu.</h2><p class="muted">Poruke su isključene. I dalje si dosadan, samo više ne piše.</p>' +
      '<button type="button" class="btn primary wide" data-a="sheet-close">Hvala</button></div>';
    if (onWin) onWin();
  }

  function open(cb) {
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
          '<p class="muted">Tri igre zaredom: uhvati Dooma, ponovi kamenje, Marvel kviz bez greške. Padneš bilo gde — ispočetka.</p>' +
          '<button type="button" class="btn primary wide" id="gmGo">Kreni</button></div>';
        box.querySelector('#gmGo').onclick = game1;
      },
      onClose: function () { clearAll(); box = null; }
    });
  }

  MM.Games = { open: open };
})();
