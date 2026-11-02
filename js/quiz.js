/* ============================================================
   quiz.js  -  kviz posle filma / sezone
   ------------------------------------------------------------
   Kad odgledas naslov koji ima pitanja (quizbank.js), nudi se
   kviz: do 5 pitanja, 15 s po pitanju. Jednom po naslovu.
   Nagrade idu u Marvel Runner: novcici + poeni za Pass po tacnom
   odgovoru, a sve tacno (bar 3 pitanja) = misteriozna kutija.
   Rezultat: state.quiz[id] = { c: tacno, n: pitanja, at }.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI, esc = UI.esc;
  var SECS = 15, MAX = 5;
  var COIN = 40, PTS = 50;

  function bank(id) { return (MM.QUIZ && MM.QUIZ[id]) || null; }
  function has(id) { var b = bank(id); return !!(b && b.length >= 2); }
  function result(id) { var q = MM.Store.get().quiz; return (q && q[id]) || null; }
  function done(id) { return !!result(id); }
  function sfx(n) { if (MM.Sfx) MM.Sfx.play(n); }

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  var S = null;   // stanje otvorenog kviza

  function rewardOf(c, n) {
    return { coins: c * COIN, pts: c * PTS, box: c === n && n >= 3 ? 1 : 0 };
  }

  /* ---------------- crtanje ---------------- */

  function ui(n) { return '<img class="qz-ic" src="img/ui/' + n + '.webp" alt="">'; }
  function coinIc() { return '<img class="qz-ic" src="img/run/coin.webp" alt="">'; }

  function render() {
    if (!S) return '';
    var it = S.item, out = '<div class="qz no-drag qz-' + S.phase + '">' +
      '<div class="qz-bg">' + UI.poster(it, 'bg') + '</div>' +
      '<button type="button" class="qz-x" data-qz="close" aria-label="Zatvori">✕</button>';

    if (S.phase === 'intro') {
      var n = S.qs.length, rw = rewardOf(n, n);
      out += '<div class="qz-intro">' +
        '<div class="qz-poster">' + UI.poster(it, 'qz-art') + '<span class="qz-stamp">KVIZ</span></div>' +
        '<div class="qz-k">ODGLEDANO · PROVERA ZNANJA</div>' +
        '<h2 class="qz-title">' + esc(MM.Cat.cleanTitle(it)) + '</h2>' +
        '<p class="qz-sub">' + n + ' pitanja · ' + SECS + ' sekundi po pitanju · samo jednom</p>' +
        '<div class="qz-prizes">' +
          '<div>' + coinIc() + '<b>' + rw.coins + '</b><span>novčića</span></div>' +
          '<div>' + ui('ticket') + '<b>' + rw.pts + '</b><span>poena za Pass</span></div>' +
          (rw.box ? '<div class="gold">' + ui('chest') + '<b>+1</b><span>kutija za sve tačno</span></div>' : '') +
        '</div>' +
        '<button type="button" class="qz-go" data-qz="start">Kreni</button>' +
        '<button type="button" class="qz-later" data-qz="close">Kasnije</button>' +
      '</div>';
    } else if (S.phase === 'q') {
      var q = S.qs[S.k];
      out += '<div class="qz-top"><div class="qz-steps">' + S.qs.map(function (_, i) {
          var st = S.res[i]; return '<i class="' + (st === 1 ? 'ok' : st === 0 ? 'bad' : i === S.k ? 'cur' : '') + '"></i>';
        }).join('') + '</div>' +
        '<div class="qz-meta"><span>PITANJE ' + (S.k + 1) + ' / ' + S.qs.length + '</span><b class="qz-sec">' + Math.ceil(S.left) + '</b></div>' +
        '<div class="qz-time"><i style="width:' + (S.left / SECS * 100).toFixed(1) + '%"></i></div></div>' +
        '<div class="qz-card" data-k="qc' + S.k + '"><p class="qz-q">' + esc(q.q) + '</p>' +
        '<div class="qz-opts">' + q.o.map(function (t, i) {
          var cls = '';
          if (S.picked != null) {
            if (i === q.a) cls = ' good';
            else if (i === S.picked) cls = ' bad';
            else cls = ' dim';
          }
          return '<button type="button" class="qz-o' + cls + '" data-qz="pick" data-i="' + i + '"' + (S.picked != null ? ' disabled' : '') + '>' +
            '<span class="qz-l">' + 'ABCD'[i] + '</span><span class="qz-t">' + esc(t) + '</span></button>';
        }).join('') + '</div>' +
        (S.picked === -1 ? '<p class="qz-late">Isteklo vreme!</p>' : '') +
        '</div>';
    } else {
      var c = S.c, tot = S.qs.length, r = rewardOf(c, tot);
      var line = c === tot ? (tot >= 3 ? 'Savršeno. Pravi fan!' : 'Sve tačno!') : c >= tot - 1 ? 'Skoro savršeno!' : c >= Math.ceil(tot / 2) ? 'Solidno.' : c ? 'Gledao si i telefon, a?' : 'Doom se smeje.';
      out += '<div class="qz-end">' +
        '<div class="qz-ring" style="--p:' + (c / tot * 100).toFixed(0) + '"><b>' + c + '<small>/' + tot + '</small></b></div>' +
        '<div class="qz-k">' + esc(MM.Cat.cleanTitle(it)).toUpperCase() + '</div>' +
        '<h2 class="qz-title">' + line + '</h2>' +
        '<div class="qz-got">' +
          (r.coins ? '<div>' + coinIc() + '<b>+' + r.coins + '</b><span>novčića</span></div>' : '') +
          (r.pts ? '<div>' + ui('ticket') + '<b>+' + r.pts + '</b><span>Pass poena</span></div>' : '') +
          (r.box ? '<div class="gold">' + ui('chest') + '<b>+1</b><span>misteriozna kutija</span></div>' : '') +
          (!c ? '<div class="none"><span>Ovaj put bez nagrade.</span></div>' : '') +
        '</div>' +
        (c && !MM.Store.get().gamesOff ? '<p class="qz-sub">Nagrade su u Marvel Runneru.</p>' : '') +
        '<button type="button" class="qz-go" data-qz="close">' + (c ? 'Super' : 'U redu') + '</button>' +
      '</div>';
    }
    return out + '</div>';
  }

  function redraw() { UI.refreshSheets(); }

  /* ---------------- tok ---------------- */

  function open(id, opts) {
    var it = MM.Cat.get(id), b = bank(id);
    if (!it || !b || done(id) || S) { if (opts && opts.onClose) opts.onClose(); return false; }
    var qs = shuffle(b).slice(0, MAX).map(function (row) {
      var o = shuffle(row.slice(1));
      return { q: row[0], o: o, a: o.indexOf(row[1]) };
    });
    S = { id: id, item: it, qs: qs, k: 0, c: 0, res: [], phase: 'intro', left: SECS, picked: null, timer: null, paid: false, onClose: opts && opts.onClose };
    UI.openSheet({
      id: 'quiz', full: true, cls: 'qz-sheet',
      render: render,
      onOpen: function (el) {
        el.addEventListener('click', function (e) {
          var b = e.target.closest('[data-qz]');
          if (!b || !S) return;
          var a = b.getAttribute('data-qz');
          if (a === 'close') { UI.closeTop(); return; }
          if (a === 'start') { begin(); return; }
          if (a === 'pick') pick(+b.getAttribute('data-i'));
        });
      },
      onClose: function () {
        var cb = S && S.onClose;
        if (S && S.phase !== 'intro') finish(true);
        stop(); S = null;
        if (cb) setTimeout(cb, 250);
      }
    });
    return true;
  }

  function stop() { if (S && S.timer) { clearInterval(S.timer); S.timer = null; } }

  function begin() {
    // od ovog trenutka kviz se racuna (zatvaranje = kraj)
    MM.Store.mutate(function (s) { s.quiz = s.quiz || {}; s.quiz[S.id] = { c: 0, n: S.qs.length, at: Date.now() }; });
    sfx('go');
    S.phase = 'q'; ask();
  }

  function ask() {
    S.left = SECS; S.picked = null; redraw();
    stop();
    var last = Date.now(), lastSec = SECS;
    S.timer = setInterval(function () {
      if (!S || S.phase !== 'q' || S.picked != null) return;
      var now = Date.now(); S.left = Math.max(0, S.left - (now - last) / 1000); last = now;
      var root = document.querySelector('.qz-sheet');
      if (root) {
        var bar = root.querySelector('.qz-time i'), sec = root.querySelector('.qz-sec');
        if (bar) bar.style.width = (S.left / SECS * 100).toFixed(1) + '%';
        if (sec) sec.textContent = Math.ceil(S.left);
        root.classList.toggle('qz-hurry', S.left <= 5);
      }
      if (Math.ceil(S.left) !== lastSec) { lastSec = Math.ceil(S.left); if (lastSec <= 5 && lastSec > 0) sfx('tick'); }
      if (S.left <= 0) pick(-1);
    }, 100);
  }

  function pick(i) {
    if (!S || S.phase !== 'q' || S.picked != null) return;
    stop();
    var q = S.qs[S.k], ok = i === q.a;
    S.picked = i; S.res[S.k] = ok ? 1 : 0;
    if (ok) S.c++;
    MM.Store.mutate(function (s) { s.quiz = s.quiz || {}; s.quiz[S.id] = { c: S.c, n: S.qs.length, at: Date.now() }; });
    sfx(ok ? 'ok' : 'bad'); UI.buzz(ok ? 12 : [20, 40, 20]);
    redraw();
    setTimeout(function () {
      if (!S || S.phase !== 'q') return;
      S.k++;
      if (S.k >= S.qs.length) { finish(false); S.phase = 'end'; sfx(S.c === S.qs.length ? 'win' : S.c ? 'reward' : 'lose'); redraw(); }
      else ask();
    }, ok ? 850 : 1500);
  }

  /** Upisi rezultat i daj nagradu (jednom). */
  function finish(early) {
    if (!S || S.paid) return;
    S.paid = true; stop();
    var r = rewardOf(S.c, S.qs.length);
    MM.Store.mutate(function (s) { s.quiz = s.quiz || {}; s.quiz[S.id] = { c: S.c, n: S.qs.length, at: Date.now() }; });
    if (MM.Runner && MM.Runner.grant) {
      if (r.coins) MM.Runner.grant({ t: 'coins', n: r.coins });
      if (r.pts) MM.Runner.grant({ t: 'pts', n: r.pts });
      if (r.box) MM.Runner.grant({ t: 'box', n: 1 });
    }
    if (early && S.c) UI.toast('Kviz: ' + S.c + '/' + S.qs.length + ' · +' + r.coins + ' novčića');
  }

  /** Statistika za ostatak aplikacije. */
  function stats(s) {
    var q = (s || MM.Store.get()).quiz || {}, n = 0, c = 0, tot = 0, perfect = 0;
    Object.keys(q).forEach(function (k) { var x = q[k]; n++; c += x.c | 0; tot += x.n | 0; if (x.n >= 3 && x.c === x.n) perfect++; });
    return { taken: n, correct: c, asked: tot, perfect: perfect, pct: tot ? Math.round(c / tot * 100) : 0 };
  }

  MM.Quiz = { has: has, done: done, result: result, open: open, stats: stats, isOpen: function () { return !!S; } };
})();
