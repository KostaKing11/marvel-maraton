/* ============================================================
   livequiz.js  -  Kviz uzivo (cela ekipa u isto vreme)
   ------------------------------------------------------------
   Neko napravi kviz, ostali udju, domacin pritisne KRENI.
   Svi dobijaju ista pitanja istim redom (seme), u isto vreme
   (startAt). Brzi tacan odgovor nosi vise poena. Posle svakog
   pitanja: tacan odgovor + poredak. Na kraju podijum.

   Koristi iste sobe kao Borba (battles/, battle.js), sa type: 'quiz',
   pa nisu potrebna nova pravila baze.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI, esc = UI.esc;
  var N = 10, QT = 10000, RT = 4500, SLOT = QT + RT, LEAD = 5000;
  var COLORS = ['#e62429', '#3b82f6', '#f5b83d', '#22c55e'];

  var V = null;   // { el, view, id, room, players, stop, qs, ans, score, ok, timer, key }

  function sfx(n) { if (MM.Sfx) MM.Sfx.play(n); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuf(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function questions(seed) {
    var r = rng(seed), pool = shuf(MM.Games.QUIZ, r).slice(0, N);
    return pool.map(function (q) {
      var o = shuf(q[1].map(function (t, i) { return { t: t, ok: i === q[2] }; }), r);
      return { q: q[0], o: o.map(function (x) { return x.t; }), a: o.map(function (x) { return x.ok; }).indexOf(true) };
    });
  }
  function initial(n) { return esc(((n || '?').trim()[0] || '?').toUpperCase()); }
  function av(p) { var h = 0, s = p.uid || p.name || ''; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return '<span class="lq-av" style="--h:' + h + '">' + initial(p.name) + '</span>'; }
  function ranked() { return (V.players || []).slice().sort(function (a, b) { return (b.score || 0) - (a.score || 0); }); }

  /* ---------------- ekrani ---------------- */
  function shell(title, body, back) {
    V.el.innerHTML = '<div class="lq-top">' + (back ? '<button type="button" class="lq-back" data-lq="' + back + '" aria-label="Nazad">‹</button>' : '<span></span>') +
      '<b>' + esc(title) + '</b><button type="button" class="lq-x" data-lq="close" aria-label="Zatvori">✕</button></div><div class="lq-body">' + body + '</div>';
  }

  function listView() {
    stopWatch(); V.view = 'list'; V.id = null;
    shell('Kviz uživo', '<div class="lq-hero"><span class="lq-bolt">⚡</span><h2>Kviz uživo</h2><p>Cela ekipa, ista pitanja, u isto vreme. Što brže tačno odgovoriš — više poena. Na kraju podijum.</p></div>' +
      '<button type="button" class="lq-go" data-lq="new">NAPRAVI KVIZ</button>' +
      '<h3 class="lq-h3">Otvoreni kvizovi</h3><div class="lq-list" id="lqL"><p class="lq-note">Tražim…</p></div>' +
      '<p class="lq-note small">10 pitanja · 10 sekundi · pobednik dobija misterioznu kutiju, svi dobijaju novčiće za tačne odgovore.</p>');
    V.stop = MM.Battle.watchLobbies(function (list) {
      var el = V && V.el.querySelector('#lqL'); if (!el) return;
      list = list.filter(function (b) { return b.type === 'quiz'; });
      el.innerHTML = list.length ? list.map(function (b) {
        return '<div class="lq-row"><span class="lq-bolt sm">⚡</span><span class="lq-rt"><b>Kviz: ' + esc(b.hostName || '?') + '</b><i>čeka igrače</i></span><button type="button" class="lq-join" data-lq="join" data-id="' + b.id + '">Uđi</button></div>';
      }).join('') : '<p class="lq-note">Nema otvorenih kvizova. Napravi jedan i javi ekipi.</p>';
    });
  }

  function stopWatch() { if (V && V.stop) { V.stop(); V.stop = null; } clearInterval(V && V.timer); }

  function lobby(id, isHost) {
    stopWatch(); V.view = 'lobby'; V.id = id; V.host = isHost;
    V.stop = MM.Battle.watch(id, function (x) {
      if (!V || V.id !== id) return;
      V.room = x.room; V.players = x.players;
      if (!V.room || V.room.state === 'closed') { UI.toast('Kviz je zatvoren.'); listView(); return; }
      if (V.room.state === 'run' || V.room.state === 'done') { if (V.view !== 'game') game(); else if (V.view === 'game') V.dirty = true; return; }
      var me = MM.Store.uid(), h = V.room.host === me;
      shell('Čekaonica', '<div class="lq-hero"><span class="lq-bolt">⚡</span><h2>Kviz: ' + esc(V.room.hostName || '') + '</h2><p>' + (h ? 'Javi ekipi da uđe (Igre → Kviz uživo), pa klikni KRENI.' : 'Čeka se da ' + esc(V.room.hostName || 'domaćin') + ' krene.') + '</p></div>' +
        '<h3 class="lq-h3">U kvizu (' + V.players.length + ')</h3><div class="lq-ppl">' + V.players.map(function (p) { return '<div class="lq-p">' + av(p) + '<b>' + esc(p.name) + (p.uid === V.room.host ? ' 👑' : '') + '</b></div>'; }).join('') + '</div>' +
        (h ? '<button type="button" class="lq-go" data-lq="start">KRENI</button>' : '<p class="lq-note">Spremi prste…</p>') +
        '<button type="button" class="lq-ghost" data-lq="leave">Izađi</button>', 'leave');
    });
  }

  /* ---------------- igra ---------------- */
  function game() {
    V.view = 'game'; V.qs = questions(V.room.seed); V.ans = {}; V.score = 0; V.ok = 0; V.key = '';
    sfx('go'); if (MM.Sfx) MM.Sfx.music('battle');
    clearInterval(V.timer);
    V.timer = setInterval(tick, 100); tick();
  }

  function phase() {
    var t = Date.now() - V.room.startAt;
    if (t < 0) return { p: 'cnt', n: Math.ceil(-t / 1000) };
    var i = Math.floor(t / SLOT);
    if (i >= N) return { p: 'end' };
    var l = t - i * SLOT;
    return l < QT ? { p: 'q', i: i, left: (QT - l) / 1000 } : { p: 'r', i: i };
  }

  function tick() {
    if (!V || V.view !== 'game') return;
    var ph = phase(), key = ph.p + (ph.i != null ? ph.i : '') + (ph.p === 'cnt' ? ph.n : '');
    if (ph.p === 'q') {
      var bar = V.el.querySelector('.lq-time i'), sec = V.el.querySelector('.lq-sec');
      if (bar) bar.style.width = (ph.left / (QT / 1000) * 100).toFixed(1) + '%';
      if (sec) sec.textContent = Math.ceil(ph.left);
    }
    if (key === V.key && !V.dirty) return;
    var was = V.key; V.key = key; V.dirty = false;
    if (ph.p === 'cnt') { if (was !== key) sfx('count'); return draw(ph); }
    if (ph.p === 'q' && was.indexOf('q' + ph.i) !== 0) sfx('start');
    if (ph.p === 'r' && was.indexOf('r' + ph.i) !== 0) sfx(V.ans[ph.i] && V.ans[ph.i].ok ? 'ok' : 'bad');
    if (ph.p === 'end' && was !== 'end') finish();
    draw(ph);
  }

  function draw(ph) {
    if (ph.p === 'cnt') {
      V.el.innerHTML = '<div class="lq-cnt"><b>' + ph.n + '</b><span>Kviz počinje · ' + (V.players || []).length + ' igrača</span></div>';
      return;
    }
    if (ph.p === 'end') return endView();
    var q = V.qs[ph.i], a = V.ans[ph.i];
    var top = '<div class="lq-gtop"><span class="lq-qn">' + (ph.i + 1) + ' / ' + N + '</span><span class="lq-score">' + V.score.toLocaleString('sr-RS') + '</span>' +
      '<button type="button" class="lq-x" data-lq="close" aria-label="Zatvori">✕</button></div>';
    if (ph.p === 'q') {
      V.el.innerHTML = top + '<div class="lq-time"><i style="width:100%"></i></div><b class="lq-sec">10</b>' +
        '<p class="lq-q">' + esc(q.q) + '</p><div class="lq-opts">' + q.o.map(function (t, k) {
          return '<button type="button" class="lq-o' + (a ? (a.k === k ? ' picked' : ' dim') : '') + '" data-lq="pick" data-k="' + k + '" style="--c:' + COLORS[k] + '"' + (a ? ' disabled' : '') + '><i>' + 'ABCD'[k] + '</i><span>' + esc(t) + '</span></button>';
        }).join('') + '</div>' + (a ? '<p class="lq-wait">Odgovor je zaključan. Čekamo ostale…</p>' : '');
    } else {
      var r = ranked(), me = MM.Store.uid();
      V.el.innerHTML = top + '<div class="lq-rev"><span class="lq-k">TAČAN ODGOVOR</span><b class="lq-right" style="--c:' + COLORS[q.a] + '">' + esc(q.o[q.a]) + '</b>' +
        (a ? (a.ok ? '<p class="lq-res ok">+' + a.pts + ' poena</p>' : '<p class="lq-res bad">Promašaj</p>') : '<p class="lq-res bad">Nisi stigao</p>') +
        '<div class="lq-lb">' + r.slice(0, 5).map(function (p, k) {
          return '<div class="' + (p.uid === me ? 'me' : '') + '" style="--i:' + k + '"><em>' + (k + 1) + '</em>' + av(p) + '<b>' + esc(p.name) + '</b><strong>' + (p.score || 0).toLocaleString('sr-RS') + '</strong></div>';
        }).join('') + '</div></div>';
    }
  }

  function pick(k) {
    var ph = phase(); if (ph.p !== 'q' || V.ans[ph.i]) return;
    var q = V.qs[ph.i], ok = k === q.a, pts = ok ? Math.round(500 + 500 * ph.left / (QT / 1000)) : 0;
    V.ans[ph.i] = { k: k, ok: ok, pts: pts };
    if (ok) { V.score += pts; V.ok++; }
    sfx('tap'); UI.buzz(8);
    MM.Battle.report(V.id, { score: V.score, q: ph.i + 1, ok: V.ok, alive: true });
    V.dirty = true; tick();
  }

  function finish() {
    if (V.paid) return; V.paid = true;
    MM.Battle.report(V.id, { score: V.score, q: N, ok: V.ok, alive: false, done: 1 });
    if (MM.Sfx) MM.Sfx.music('menu');
    // nagrada: novcici za tacne, pobedniku kutija (racuna se kad svi zavrse)
    if (V.ok && MM.Runner && MM.Runner.grant) MM.Runner.grant({ t: 'coins', n: V.ok * 30 });
    setTimeout(function () {
      if (!V) return;
      var r = ranked(), me = MM.Store.uid();
      if (r[0] && r[0].uid === me && r.length > 1 && (r[0].score || 0) > 0) {
        if (MM.Runner && MM.Runner.grant) MM.Runner.grant({ t: 'box', n: 1 });
        V.won = true; sfx('win'); if (MM.Games.confetti) MM.Games.confetti();
        if (V.room && V.room.host === me) MM.Battle.finish(V.id);
      } else sfx('reward');
      V.dirty = true; tick();
    }, 2500);
  }

  function endView() {
    var r = ranked(), me = MM.Store.uid(), mi = r.map(function (p) { return p.uid; }).indexOf(me);
    V.el.innerHTML = '<div class="lq-top"><span></span><b>Rezultat</b><button type="button" class="lq-x" data-lq="close" aria-label="Zatvori">✕</button></div><div class="lq-body">' +
      '<div class="lq-endh"><span class="lq-k">KVIZ UŽIVO · KRAJ</span><h2>' + (mi === 0 && r.length > 1 ? 'Pobedio si! 🏆' : mi >= 0 ? (mi + 1) + '. mesto' : 'Kraj') + '</h2>' +
        '<p>' + V.ok + ' / ' + N + ' tačnih · ' + V.score.toLocaleString('sr-RS') + ' poena' + (V.ok ? ' · +' + V.ok * 30 + ' novčića' : '') + (V.won ? ' · +1 kutija' : '') + '</p></div>' +
      MM.Views.podium(r.map(function (p) { return { name: p.name, photo: '', mine: p.uid === me, v: (p.score || 0).toLocaleString('sr-RS'), sub: (p.ok || 0) + ' tačnih' + (p.done ? '' : ' · igra…') }; })) +
      '<button type="button" class="lq-go" data-lq="again">NOVI KVIZ</button><button type="button" class="lq-ghost" data-lq="list">Lista kvizova</button></div>';
  }

  /* ---------------- otvaranje ---------------- */
  function open() {
    if (!MM.Store.uid()) { UI.toast('Prijavi se (Ja → Google nalog) da igraš sa ekipom.'); return; }
    V = { el: null, view: '' };
    UI.openSheet({
      id: 'livequiz', full: true, cls: 'lq-sheet',
      render: function () { return '<div class="lq no-drag" id="lqBox" data-keep></div>'; },
      onOpen: function (el) {
        V.el = el.querySelector('#lqBox');
        if (MM.Sfx) MM.Sfx.music('menu');
        V.el.addEventListener('click', function (e) {
          var b = e.target.closest('[data-lq]'); if (!b || !V) return;
          var a = b.getAttribute('data-lq');
          if (a === 'close') UI.closeTop();
          else if (a === 'list') listView();
          else if (a === 'new' || a === 'again') {
            b.disabled = true;
            MM.Battle.create({ type: 'quiz' }).then(function (id) { lobby(id, true); }).catch(function () { UI.toast('Ne mogu da napravim kviz (internet ili prijava).'); listView(); });
          } else if (a === 'join') {
            var id = b.getAttribute('data-id');
            MM.Battle.join(id).then(function () { lobby(id, false); }).catch(function () { UI.toast('Ne mogu da uđem.'); });
          } else if (a === 'start') { b.disabled = true; MM.Battle.start(V.id, Date.now() + LEAD); }
          else if (a === 'leave') { MM.Battle.leave(V.id, V.room && V.room.host === MM.Store.uid() && V.room.state === 'lobby'); listView(); }
          else if (a === 'pick') pick(+b.getAttribute('data-k'));
        });
        listView();
      },
      onBack: function () { if (V && V.view === 'lobby') { MM.Battle.leave(V.id, V.room && V.room.host === MM.Store.uid() && V.room.state === 'lobby'); listView(); return true; } return false; },
      onClose: function () {
        if (!V) return;
        if (V.id && V.view === 'lobby') MM.Battle.leave(V.id, V.room && V.room.host === MM.Store.uid() && V.room.state === 'lobby');
        stopWatch(); clearInterval(V.timer); V = null;
        if (MM.Sfx) MM.Sfx.music(null);
      }
    });
  }

  MM.LiveQuiz = { open: open, _q: questions };
})();
