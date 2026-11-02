/* ============================================================
   finale.js  -  pregled maratona (otvara se na dan premijere)
   ------------------------------------------------------------
   Do DAY se nigde ne vidi. Od tog dana: jednom se sam otvori,
   posle je kartica na Danas (do kraja januara) i u "Ja".
   Prica u slajdovima (tap desno = dalje, levo = nazad, drzi = pauza),
   sa muzikom, brojevima koji rastu i slikom za deljenje na kraju.
   Statistika ekipe: profiles (+ polje st), reviews, reactions.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var DAY = '2026-12-18', UNTIL = '2027-01-31';
  var UI = MM.UI, esc = UI.esc, P = MM.Plan, Cat = MM.Cat;
  var IMG = 'img/f/';
  var MON = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
  var DOW = ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota'];

  function available() { return P.today() >= DAY; }
  function featured() { var t = P.today(); return t >= DAY && t <= UNTIL; }
  function sfx(n) { if (MM.Sfx) MM.Sfx.play(n); }
  function fmt(n) { return Math.round(n || 0).toLocaleString('sr-RS'); }
  function dateTxt(iso) { var p = String(iso).split('-'); return (+p[2]) + '. ' + MON[+p[1] - 1]; }
  function hm(min) { var h = Math.floor(min / 60), m = Math.round(min % 60); return h ? h + ' h' + (m ? ' ' + m + ' min' : '') : m + ' min'; }
  function plural(n, a, b, c) { n = Math.abs(n) % 100; var d = n % 10; if (n > 10 && n < 20) return c; if (d === 1) return a; if (d >= 2 && d <= 4) return b; return c; }
  function poster(it, cls) { return UI.poster(it, 'fn-p ' + (cls || '')); }
  function avatar(p, cls) {
    var n = (p.name || '?').trim();
    return '<figure class="fn-av ' + (cls || '') + '">' + (p.photo ? '<img src="' + esc(p.photo) + '" alt="">' : '<b>' + esc(n.slice(0, 1).toUpperCase()) + '</b>') + '</figure>';
  }

  /* ============================================================
     statistika - samo moja (radi i bez interneta)
     ============================================================ */
  function mine(s) {
    s = s || MM.Store.get();
    var all = Cat.all(), done = [], minutes = 0, byCol = {};
    all.forEach(function (it) {
      var m = P.watchedMinutes(it, s);
      if (m > 0) { minutes += m; byCol[it.col] = (byCol[it.col] || 0) + m; }
      if (P.isDone(it, s)) done.push(it);
    });
    // dnevnik: dani, sati, prvi i poslednji naslov
    var days = {}, slot = [0, 0, 0, 0], dow = [0, 0, 0, 0, 0, 0, 0], ents = [];
    Object.keys(s.log || {}).forEach(function (k) {
      var e = s.log[k], u = P.unitFromKey(k);
      if (!e || !e.d || !u) return;
      var d = days[e.d] = days[e.d] || { min: 0, ids: {} };
      d.min += u.min; d.ids[u.id] = 1;
      ents.push({ k: k, id: u.id, d: e.d, t: e.t || 0 });
      if (e.t) {
        var h = new Date(e.t).getHours();
        slot[h >= 5 && h < 12 ? 0 : h >= 12 && h < 18 ? 1 : h >= 18 && h < 22 ? 2 : 3] += u.min;
      }
      dow[P.parse(e.d).getDay()] += u.min;
    });
    ents.sort(function (a, b) { return (a.d < b.d ? -1 : a.d > b.d ? 1 : 0) || a.t - b.t; });
    var bestDay = null;
    Object.keys(days).forEach(function (d) { if (!bestDay || days[d].min > days[bestDay].min) bestDay = d; });
    var slotSum = slot[0] + slot[1] + slot[2] + slot[3];
    var topSlot = slot.indexOf(Math.max.apply(null, slot));
    var topDow = dow.indexOf(Math.max.apply(null, dow));
    var cols = Object.keys(byCol).map(function (c) { return { id: c, min: byCol[c], name: Cat.col(c).name }; }).sort(function (a, b) { return b.min - a.min; });
    var st = P.streak(s);
    var r = s.runner || {}, best = ((s.games || {}).best || {}).runner || 0;
    var q = MM.Quiz ? MM.Quiz.stats(s) : { taken: 0 };
    var night = slotSum ? Math.round(slot[3] / slotSum * 100) : 0;
    return {
      done: done, n: done.length, minutes: minutes, byCol: cols,
      first: ents.length ? Cat.get(ents[0].id) : null, firstDay: ents.length ? ents[0].d : '',
      last: ents.length ? Cat.get(ents[ents.length - 1].id) : null,
      days: Object.keys(days).length, bestDay: bestDay, bestMin: bestDay ? days[bestDay].min : 0,
      bestIds: bestDay ? Object.keys(days[bestDay].ids) : [],
      streak: st.best || 0, slot: slot, slotSum: slotSum, topSlot: topSlot, topDow: topDow, night: night,
      quiz: q, eps: Object.keys(s.epStars || {}).reduce(function (a, k) { return a + Object.keys(s.epStars[k]).length; }, 0),
      runs: r.runs | 0, dist: r.distAll | 0, bwins: r.bwins | 0, best: best,
      items: Object.keys(MM.Badges.doneMap(s)).length
    };
  }

  /** Mali sazetak koji ide u profil (da ekipa moze da se poredi). */
  function brief(s) {
    var m = mine(s);
    return { min: m.minutes, n: m.n, days: m.days, best: m.streak, bd: m.bestMin, night: m.night,
      qc: m.quiz.correct | 0, qn: m.quiz.asked | 0, dist: m.dist, runs: m.runs, bw: m.bwins };
  }

  /* ============================================================
     ekipa
     ============================================================ */
  async function team() {
    var out = { people: [], reviews: [], reacts: [] };
    var f = await MM.Store.firestore();
    if (!f || !MM.Store.uid()) return out;
    try { out.people = await MM.Reviews.loadPeople(); } catch (e) { /* bez mreze */ }
    try {
      var snap = await f.getDocs(f.query(f.collection(f.db, 'reviews'), f.orderBy('at', 'desc'), f.limit(2000)));
      snap.forEach(function (d) { out.reviews.push(d.data()); });
    } catch (e) { /* */ }
    try {
      var s2 = await f.getDocs(f.query(f.collection(f.db, 'reactions'), f.orderBy('at', 'desc'), f.limit(3000)));
      s2.forEach(function (d) { out.reacts.push(d.data()); });
    } catch (e) { /* */ }
    return out;
  }

  function teamStats(T, me) {
    var uid = MM.Store.uid(), s = MM.Store.get();
    var people = T.people.filter(function (p) { return p && p.uid; }).map(function (p) {
      var st = p.st || {};
      return { uid: p.uid, name: p.name || 'Bez imena', photo: p.photo || '', min: st.min || p.minutes || 0, n: st.n || p.watched || 0,
        best: Math.max(st.best || 0, p.streak || 0), qc: st.qc || 0, qn: st.qn || 0, dist: st.dist || 0, bw: st.bw || 0, night: st.night || 0,
        bd: st.bd || 0, runner: (p.gbest && p.gbest.runner) || 0, rv: 0, rsum: 0, rx: 0 };
    });
    // ja uvek sa svezim brojevima
    var meP = people.filter(function (p) { return p.uid === uid; })[0];
    if (!meP) { meP = { uid: uid || 'me', name: s.displayName || 'Ti', photo: s.avatar || '', rv: 0, rsum: 0, rx: 0 }; people.push(meP); }
    Object.assign(meP, { min: me.minutes, n: me.n, best: me.streak, qc: me.quiz.correct | 0, qn: me.quiz.asked | 0, dist: me.dist, bw: me.bwins, night: me.night, bd: me.bestMin, runner: me.best });
    var byUid = {}; people.forEach(function (p) { byUid[p.uid] = p; });
    var myRev = [];
    T.reviews.forEach(function (r) {
      var p = byUid[r.uid]; if (!p) return;
      p.rv++; p.rsum += r.avg || r.stars || 0;
      if (r.uid === uid) myRev.push(r);
    });
    T.reacts.forEach(function (x) { var p = byUid[x.uid]; if (p) p.rx++; });
    people.forEach(function (p) { p.ravg = p.rv ? p.rsum / p.rv : 0; });

    var rank = people.slice().sort(function (a, b) { return b.min - a.min; });
    var myRank = rank.indexOf(meP) + 1;
    function top(key, min, low) {
      var c = people.filter(function (p) { return (p[key] || 0) > 0 && (!min || min(p)); });
      if (!c.length) return null;
      c.sort(function (a, b) { return low ? a[key] - b[key] : b[key] - a[key]; });
      return c[0];
    }
    var awards = [
      { k: 'Najviše sati', p: top('min'), v: function (p) { return hm(p.min); }, c: '#e62429' },
      { k: 'Najduži niz', p: top('best'), v: function (p) { return p.best + ' ' + plural(p.best, 'dan', 'dana', 'dana'); }, c: '#f5b83d' },
      { k: 'Najviše recenzija', p: top('rv'), v: function (p) { return p.rv + ' ' + plural(p.rv, 'ocena', 'ocene', 'ocena'); }, c: '#9b6bff' },
      { k: 'Najstroži kritičar', p: top('ravg', function (p) { return p.rv >= 3; }, true), v: function (p) { return '★ ' + p.ravg.toFixed(1) + ' prosek'; }, c: '#3b82f6' },
      { k: 'Najveći fan', p: top('ravg', function (p) { return p.rv >= 3; }), v: function (p) { return '★ ' + p.ravg.toFixed(1) + ' prosek'; }, c: '#ec4899' },
      { k: 'Kviz mozak', p: top('qc'), v: function (p) { return p.qc + ' tačnih'; }, c: '#22c55e' },
      { k: 'Noćna ptica', p: top('night', function (p) { return p.n >= 5; }), v: function (p) { return p.night + '% posle 22h'; }, c: '#6366f1' },
      { k: 'Runner legenda', p: top('runner'), v: function (p) { return fmt(p.runner) + ' poena'; }, c: '#06b6d4' },
      { k: 'Šampion borbi', p: top('bw'), v: function (p) { return p.bw + ' ' + plural(p.bw, 'pobeda', 'pobede', 'pobeda'); }, c: '#f97316' },
      { k: 'Kralj reakcija', p: top('rx'), v: function (p) { return p.rx + ' reakcija'; }, c: '#14b8a6' }
    ].filter(function (a) { return a.p; });
    var sumMin = 0, sumN = 0; people.forEach(function (p) { sumMin += p.min || 0; sumN += p.n || 0; });
    myRev.sort(function (a, b) { return (b.avg || b.stars) - (a.avg || a.stars) || b.at - a.at; });
    return { people: people, rank: rank, myRank: myRank, me: meP, awards: awards, sumMin: sumMin, sumN: sumN, myRev: myRev,
      revAvg: myRev.length ? myRev.reduce(function (a, r) { return a + (r.avg || r.stars); }, 0) / myRev.length : 0 };
  }

  /* ============================================================
     junak (licnost po tome kako gledas)
     ============================================================ */
  var HEROES = {
    thor: { name: 'Thor', t: 'Bog maratona', d: 'Toliko naslova da bi i Odin pitao kad spavaš.' },
    hulk: { name: 'Hulk', t: 'Binge Hulk', d: 'Kad krene, nema stajanja. Jedan dan, pola sezone.' },
    strange: { name: 'Doctor Strange', t: 'Vrhovni čarobnjak', d: 'Videla ti je glava 14.000.605 budućnosti — i sve kvizove.' },
    cap: { name: 'Captain America', t: 'Mogu ovo ceo dan', d: 'Dan za danom, bez preskakanja. Pravi vojnik maratona.' },
    panther: { name: 'Black Panther', t: 'Kralj ocena', d: 'Svaki film dobije presudu. Wakanda zauvek, kritika zauvek.' },
    widow: { name: 'Black Widow', t: 'Noćne misije', d: 'Kad svi spavaju, ti gledaš. Tiho i opasno.' },
    spidey: { name: 'Spider-Man', t: 'Prijateljski komšija', d: 'Svaki Spider-Man, svaka verzija. Multiverzum te zna.' },
    deadpool: { name: 'Deadpool', t: 'Mutant sa stavom', d: 'X-Men, Fox, sve to. Maksimalan haos, maksimalan ukus.' },
    ant: { name: 'Ant-Man', t: 'Mali ali opasan', d: 'Nije bitno koliko — bitno je da si ovde za Doomsday.' },
    iron: { name: 'Iron Man', t: 'Genije maratona', d: 'Plan, tempo, rezultat. Tony bi bio ponosan.' }
  };
  function heroFor(m, ts) {
    var top = m.byCol[0] ? m.byCol[0].id : 'mcu', rv = ts ? ts.myRev.length : 0;
    if (m.n >= 80) return 'thor';
    if (m.bestMin >= 300) return 'hulk';
    if (m.quiz.taken >= 5 && m.quiz.pct >= 80) return 'strange';
    if (m.streak >= 10) return 'cap';
    if (rv >= 15) return 'panther';
    if (m.night >= 40 && m.n >= 5) return 'widow';
    if (top === 'sony') return 'spidey';
    if (top === 'xmen') return 'deadpool';
    if (m.n < 15) return 'ant';
    return 'iron';
  }

  /* ============================================================
     slajdovi
     ============================================================ */
  var SLOT = ['ujutru', 'popodne', 'uveče', 'noću'];
  var SLOT_T = ['Jutarnji gledalac', 'Popodnevni maratonac', 'Večernji klasik', 'Noćna ptica'];

  function wall(items, n) {
    var list = items.slice(0, n || 24); if (!list.length) return '';
    while (list.length < 18) list = list.concat(list);
    var col = [[], [], []];
    list.slice(0, 27).forEach(function (it, i) { col[i % 3].push(it); });
    return '<div class="fn-wall">' + col.map(function (c, i) {
      var h = c.map(function (it) { return poster(it); }).join('');
      return '<div class="fn-wcol c' + i + '"><div>' + h + h + '</div></div>';
    }).join('') + '</div>';
  }

  function slides(m, ts) {
    var S = [], s = MM.Store.get(), me = ts ? ts.me : { name: s.displayName || 'Ti', photo: s.avatar };
    var name = (s.displayName || '').split(' ')[0];

    S.push({ id: 'intro', bg: IMG + '1.webp', dur: 7000, html:
      '<div class="fn-c fn-intro">' +
        '<span class="fn-k a1">MARVEL MARATON · 2026</span>' +
        '<h1 class="fn-mega a2"><span>Tvoj</span><span>maraton.</span></h1>' +
        '<p class="fn-lead a3">' + (name ? esc(name) + ', ' : '') + 'Doomsday je stigao. Pre bioskopa — pogledaj šta si sve preživeo.</p>' +
        '<span class="fn-tapme a4">tapni da kreneš</span>' +
      '</div>' });

    S.push({ id: 'count', cls: 'red', dur: 7500, boom: true, html:
      wall(m.done.slice().reverse()) +
      '<div class="fn-c fn-center">' +
        '<span class="fn-k a1">OVE GODINE SI ODGLEDAO</span>' +
        '<b class="fn-num a2" data-to="' + m.n + '">0</b>' +
        '<span class="fn-unit a3">' + plural(m.n, 'naslov', 'naslova', 'naslova') + '</span>' +
        '<p class="fn-lead a4">To je <b>' + hm(m.minutes) + '</b> Marvela.' + (m.minutes >= 1440 ? '<br>Ili <b>' + (m.minutes / 1440).toFixed(1).replace('.', ',') + ' dana</b> bez spavanja.' : '') + '</p>' +
      '</div>' });

    if (m.first) S.push({ id: 'first', cls: 'violet', dur: 7000, html:
      '<div class="fn-c">' +
        '<span class="fn-k a1">SVE JE POČELO ' + (m.firstDay ? dateTxt(m.firstDay).toUpperCase() : '') + '</span>' +
        '<div class="fn-hero-p a2">' + poster(m.first, 'xl') + '</div>' +
        '<h2 class="fn-h a3">' + esc(Cat.cleanTitle(m.first)) + '</h2>' +
        (m.last && m.last.id !== m.first.id ? '<p class="fn-lead a4">…a poslednje pre Doomsdaya bilo je <b>' + esc(Cat.cleanTitle(m.last)) + '</b>.</p>' : '') +
      '</div>' });

    if (m.bestDay && m.bestMin >= 60) {
      var bi = m.bestIds.map(function (id) { return Cat.get(id); }).filter(Boolean).slice(0, 4);
      S.push({ id: 'day', cls: 'amber', dur: 7000, html:
        '<div class="fn-c">' +
          '<span class="fn-k a1">TVOJ NAJLUĐI DAN</span>' +
          '<h2 class="fn-date a2">' + dateTxt(m.bestDay) + '</h2>' +
          '<div class="fn-fan a3">' + bi.map(function (it, i) { return '<div style="--i:' + i + ';--n:' + bi.length + '">' + poster(it) + '</div>'; }).join('') + '</div>' +
          '<p class="fn-lead a4"><b class="fn-hl">' + hm(m.bestMin) + '</b> gledanja u jednom danu.' + (m.bestMin >= 300 ? ' Kokice su plakale.' : '') + '</p>' +
        '</div>' });
    }

    if (m.days) {
      var dots = ''; for (var i = 0; i < Math.min(m.streak, 30); i++) dots += '<i style="--i:' + i + '"></i>';
      S.push({ id: 'streak', cls: 'green', dur: 6500, html:
        '<div class="fn-c fn-center">' +
          '<span class="fn-k a1">GLEDAO SI</span>' +
          '<b class="fn-num a2" data-to="' + m.days + '">0</b>' +
          '<span class="fn-unit a3">' + plural(m.days, 'dan', 'dana', 'dana') + '</span>' +
          '<p class="fn-lead a4">Najduži niz bez pauze: <b class="fn-hl">' + m.streak + ' ' + plural(m.streak, 'dan', 'dana', 'dana') + '</b></p>' +
          '<div class="fn-dots a5">' + dots + '</div>' +
        '</div>' });
    }

    if (m.slotSum) {
      var mx = Math.max.apply(null, m.slot) || 1;
      S.push({ id: 'when', cls: 'night', dur: 7000, html:
        '<div class="fn-c">' +
          '<span class="fn-k a1">KAD SI GLEDAO</span>' +
          '<h2 class="fn-h big a2">' + SLOT_T[m.topSlot] + '</h2>' +
          '<div class="fn-bars a3">' + m.slot.map(function (v, i) {
            return '<div class="' + (i === m.topSlot ? 'on' : '') + '"><span>' + SLOT[i] + '</span><i><s style="--w:' + Math.round(v / mx * 100) + '%"></s></i><b>' + Math.round(v / m.slotSum * 100) + '%</b></div>';
          }).join('') + '</div>' +
          '<p class="fn-lead a4">Omiljeni dan: <b>' + DOW[m.topDow] + '</b>.</p>' +
        '</div>' });
    }

    if (m.byCol.length) {
      var cm = m.byCol[0].min || 1;
      S.push({ id: 'taste', cls: 'blue', dur: 7000, html:
        '<div class="fn-c">' +
          '<span class="fn-k a1">TVOJ MARVEL UKUS</span>' +
          '<h2 class="fn-h big a2">' + esc(m.byCol[0].name) + '</h2>' +
          '<div class="fn-cols a3">' + m.byCol.slice(0, 6).map(function (c, i) {
            return '<div style="--i:' + i + '"><span>' + esc(c.name) + '</span><i><s style="--w:' + Math.max(4, Math.round(c.min / cm * 100)) + '%"></s></i><b>' + Math.round(c.min / Math.max(1, m.minutes) * 100) + '%</b></div>';
          }).join('') + '</div>' +
        '</div>' });
    }

    if (ts && ts.myRev.length) {
      var best3 = ts.myRev.slice(0, 3).map(function (r) { return { r: r, it: Cat.get(r.itemId) }; }).filter(function (x) { return x.it; });
      var worst = ts.myRev.length >= 4 ? ts.myRev[ts.myRev.length - 1] : null, wIt = worst && Cat.get(worst.itemId);
      S.push({ id: 'rates', cls: 'pink', dur: 7500, html:
        '<div class="fn-c">' +
          '<span class="fn-k a1">TVOJE OCENE · ' + ts.myRev.length + '</span>' +
          '<div class="fn-podium a2">' + [1, 0, 2].map(function (k) {
            var x = best3[k]; if (!x) return '';
            return '<div class="pd' + k + '">' + poster(x.it) + '<em>' + (k + 1) + '</em></div>';
          }).join('') + '</div>' +
          '<h2 class="fn-h a3">' + (best3[0] ? esc(Cat.cleanTitle(best3[0].it)) : '') + '</h2>' +
          '<p class="fn-lead a4">Prosek tvojih ocena: <b class="fn-hl">★ ' + ts.revAvg.toFixed(1) + '</b>' +
          (wIt && (worst.avg || worst.stars) < (best3[0] ? (best3[0].r.avg || best3[0].r.stars) : 6) ? '<br>Najveće razočaranje: <b>' + esc(Cat.cleanTitle(wIt)) + '</b>' : '') + '</p>' +
        '</div>' });
    }

    if (m.quiz.taken) {
      S.push({ id: 'quiz', cls: 'green', dur: 6500, html:
        '<div class="fn-c fn-center">' +
          '<span class="fn-k a1">KVIZOVI POSLE FILMA</span>' +
          '<div class="fn-ring a2" style="--p:' + m.quiz.pct + '"><b data-to="' + m.quiz.pct + '" data-suf="%">0%</b></div>' +
          '<p class="fn-lead a3"><b>' + m.quiz.correct + '</b> tačnih od ' + m.quiz.asked + ' u ' + m.quiz.taken + ' ' + plural(m.quiz.taken, 'kvizu', 'kviza', 'kvizova') + '.' +
          (m.quiz.perfect ? '<br><b class="fn-hl">' + m.quiz.perfect + '×</b> sve tačno.' : '') + '</p>' +
        '</div>' });
    }

    if (m.runs) {
      S.push({ id: 'run', cls: 'cyan', dur: 6500, html:
        '<div class="fn-c fn-center">' +
          '<span class="fn-k a1">MARVEL RUNNER</span>' +
          '<b class="fn-num a2" data-to="' + Math.round(m.dist / 100) / 10 + '" data-dec="1">0</b>' +
          '<span class="fn-unit a3">km pretrčano</span>' +
          '<div class="fn-mini a4"><div><b>' + fmt(m.runs) + '</b><span>trka</span></div><div><b>' + fmt(m.best) + '</b><span>rekord</span></div>' +
          (m.bwins ? '<div><b>' + m.bwins + '</b><span>pobeda u borbi</span></div>' : '') + '</div>' +
        '</div>' });
    }

    if (ts && ts.people.length > 1) {
      S.push({ id: 'team', bg: IMG + '3.webp', cls: 'team', dur: 6500, html:
        '<div class="fn-c fn-center">' +
          '<span class="fn-k a1">EKIPA ZAJEDNO</span>' +
          '<b class="fn-num a2" data-to="' + Math.round(ts.sumMin / 60) + '">0</b>' +
          '<span class="fn-unit a3">sati Marvela</span>' +
          '<div class="fn-avs a4">' + ts.people.slice(0, 12).map(function (p, i) { return '<span style="--i:' + i + '">' + avatar(p) + '</span>'; }).join('') + '</div>' +
          '<p class="fn-lead a5">' + ts.people.length + ' ' + plural(ts.people.length, 'osoba', 'osobe', 'osoba') + ', ' + fmt(ts.sumN) + ' odgledanih naslova.</p>' +
        '</div>' });
      var r5 = ts.rank.slice(0, 5), mxm = (r5[0] && r5[0].min) || 1, inTop = r5.indexOf(ts.me) >= 0;
      S.push({ id: 'rank', cls: 'red', dur: 8000, html:
        '<div class="fn-c">' +
          '<span class="fn-k a1">KO JE NAJVIŠE GLEDAO</span>' +
          '<div class="fn-lb a2">' + r5.map(function (p, i) {
            return '<div class="' + (p === ts.me ? 'me' : '') + '" style="--i:' + i + '"><em>' + (i + 1) + '</em>' + avatar(p) + '<span><b>' + esc(p.name) + '</b><i><s style="--w:' + Math.max(6, Math.round(p.min / mxm * 100)) + '%"></s></i></span><strong>' + Math.round(p.min / 60) + ' h</strong></div>';
          }).join('') + '</div>' +
          '<p class="fn-lead a3">' + (ts.myRank === 1 ? '<b class="fn-hl">Prvo mesto. Niko nije gledao više od tebe.</b>' : 'Ti si <b class="fn-hl">#' + ts.myRank + '</b> od ' + ts.rank.length + (inTop ? '.' : ' — sledeće godine top 5.')) + '</p>' +
        '</div>' });
      if (ts.awards.length) {
        S.push({ id: 'awards', cls: 'gold', dur: 9000, html:
          '<div class="fn-c">' +
            '<span class="fn-k a1">NAGRADE EKIPE</span>' +
            '<div class="fn-aw a2">' + ts.awards.slice(0, 8).map(function (a, i) {
              return '<div class="' + (a.p === ts.me ? 'me' : '') + '" style="--i:' + i + ';--c:' + a.c + '">' + avatar(a.p) + '<span><em>' + esc(a.k) + '</em><b>' + esc(a.p.name) + '</b><i>' + esc(a.v(a.p)) + '</i></span></div>';
            }).join('') + '</div>' +
          '</div>' });
      }
    }

    var hid = heroFor(m, ts), H = HEROES[hid];
    S.push({ id: 'hero', cls: 'hero', dur: 9000, boom: true, html:
      '<div class="fn-c fn-center">' +
        '<span class="fn-k a1">TVOJ MARVEL JUNAK JE…</span>' +
        '<div class="fn-reveal a2"><div class="fn-rays"></div><img src="img/run/' + hid + '.webp" alt=""></div>' +
        '<h2 class="fn-h big a3">' + esc(H.t) + '</h2>' +
        '<span class="fn-unit a3">' + esc(H.name) + '</span>' +
        '<p class="fn-lead a4">' + esc(H.d) + '</p>' +
      '</div>' });

    S.push({ id: 'end', bg: IMG + '4.webp', cls: 'end', dur: 0, html:
      '<div class="fn-c">' +
        '<div class="fn-card a1" id="fnCard">' +
          '<div class="fc-top">' + avatar(me, 'lg') + '<div><b>' + esc(me.name || 'Ti') + '</b><span>Marvel Maraton 2026</span></div></div>' +
          '<div class="fc-posters">' + m.done.slice(-5).reverse().map(function (it) { return poster(it); }).join('') + '</div>' +
          '<div class="fc-grid">' +
            '<div><b>' + m.n + '</b><span>naslova</span></div><div><b>' + Math.round(m.minutes / 60) + ' h</b><span>gledanja</span></div>' +
            '<div><b>' + m.streak + '</b><span>dana niz</span></div><div><b>' + (ts && ts.people.length > 1 ? '#' + ts.myRank : m.items) + '</b><span>' + (ts && ts.people.length > 1 ? 'u ekipi' : 'predmeta') + '</span></div>' +
          '</div>' +
          '<div class="fc-hero"><img src="img/run/' + hid + '.webp" alt=""><span><em>JUNAK</em><b>' + esc(H.t) + '</b></span></div>' +
          '<div class="fc-foot">DOOMSDAY · 18. 12. 2026</div>' +
        '</div>' +
        '<div class="fn-acts a2"><button type="button" class="fn-btn main" data-fn="share">Sačuvaj sliku</button>' +
        '<button type="button" class="fn-btn" data-fn="again">Ponovo</button><button type="button" class="fn-btn" data-fn="close">Zatvori</button></div>' +
      '</div>' });
    return { list: S, hero: hid, m: m, ts: ts };
  }

  /* ============================================================
     plejer
     ============================================================ */
  var V = null;

  function open() {
    if (!available() || V) return false;
    MM.Store.mutate(function (s) { s.finSeen = 1; });
    var prevMusic = MM.Sfx ? MM.Sfx.current() : '';
    V = { i: 0, t0: 0, paused: false, list: null, raf: 0, el: null, prev: prevMusic };
    UI.openSheet({
      id: 'finale', full: true, cls: 'fn-sheet', silent: true,
      render: function () { return '<div class="fn no-drag" id="fnBox" data-keep><div class="fn-load"><div class="fn-spin"></div><span>Skupljam tvoju godinu…</span></div></div>'; },
      onOpen: function (el) {
        V.el = el.querySelector('#fnBox');
        if (MM.Sfx) { MM.Sfx.preload(['whoosh', 'boom']); MM.Sfx.music('finale'); }
        var m = mine();
        var done = false;
        var go = function (ts) {
          if (done || !V) return; done = true;
          V.data = slides(m, ts); V.list = V.data.list;
          build(); show(0);
        };
        team().then(function (T) { go(teamStats(T, m)); }).catch(function () { go(null); });
        setTimeout(function () { go(null); }, 9000);   // bez mreze: samo moje
      },
      onClose: function () {
        if (!V) return;
        cancelAnimationFrame(V.raf);
        if (MM.Sfx) MM.Sfx.music(V.prev || null);
        V = null;
      }
    });
    return true;
  }

  function build() {
    var el = V.el;
    el.innerHTML = '<div class="fn-bars-top">' + V.list.map(function () { return '<i><s></s></i>'; }).join('') + '</div>' +
      '<button type="button" class="fn-x" data-fn="close" aria-label="Zatvori">✕</button>' +
      '<div class="fn-stage">' + V.list.map(function (sl, i) {
        return '<section class="fn-s ' + (sl.cls || '') + '" data-i="' + i + '">' +
          (sl.bg ? '<div class="fn-bg" style="background-image:url(' + sl.bg + ')"></div>' : '<div class="fn-blob"><i></i><i></i><i></i></div>') +
          '<div class="fn-grain"></div>' + sl.html + '</section>';
      }).join('') + '</div>';
    var down = 0, held = false, x0 = 0;
    el.addEventListener('pointerdown', function (e) {
      if (e.target.closest('[data-fn]')) return;
      down = Date.now(); held = false; x0 = e.clientX;
      setTimeout(function () { if (down && Date.now() - down >= 280) { held = true; V && (V.paused = true); el.classList.add('held'); } }, 300);
    });
    el.addEventListener('pointerup', function (e) {
      if (!V) return;
      var b = e.target.closest('[data-fn]');
      if (b) { act(b.getAttribute('data-fn')); return; }
      var wasHeld = held; down = 0; held = false; el.classList.remove('held');
      if (wasHeld) { V.paused = false; V.t0 = performance.now() - V.elapsed; return; }
      if (V.list[V.i].id === 'end') return;
      var w = el.clientWidth || window.innerWidth;
      if (x0 < w * 0.3) show(V.i - 1); else show(V.i + 1);
    });
    el.addEventListener('pointercancel', function () { down = 0; held = false; if (V) { V.paused = false; el.classList.remove('held'); } });
    tick();
  }

  function act(a) {
    if (a === 'close') UI.closeTop();
    else if (a === 'again') show(0);
    else if (a === 'share') share();
  }

  function show(i) {
    if (!V) return;
    i = Math.max(0, Math.min(V.list.length - 1, i));
    var secs = V.el.querySelectorAll('.fn-s'), bars = V.el.querySelectorAll('.fn-bars-top i');
    Array.prototype.forEach.call(secs, function (s, k) { s.classList.toggle('on', k === i); s.classList.toggle('past', k < i); });
    Array.prototype.forEach.call(bars, function (b, k) { b.className = k < i ? 'done' : k === i ? 'cur' : ''; b.firstChild.style.width = k < i ? '100%' : '0%'; });
    if (i !== V.i || !V.started) sfx(V.list[i].boom ? 'boom' : 'whoosh');
    V.started = true; V.i = i; V.t0 = performance.now(); V.elapsed = 0; V.paused = false;
    count(secs[i]);
  }

  function count(sec) {
    Array.prototype.forEach.call(sec.querySelectorAll('[data-to]'), function (n) {
      var to = parseFloat(n.getAttribute('data-to')) || 0, dec = n.hasAttribute('data-dec'), suf = n.getAttribute('data-suf') || '';
      var t0 = performance.now() + 450, dur = 1400;
      n.textContent = (dec ? '0' : '0') + suf;
      (function step() {
        if (!V || !sec.classList.contains('on')) return;
        var k = Math.max(0, Math.min(1, (performance.now() - t0) / dur)), e = 1 - Math.pow(1 - k, 4);
        var v = to * e;
        n.textContent = (dec ? v.toFixed(1).replace('.', ',') : fmt(v)) + suf;
        if (k < 1) requestAnimationFrame(step);
      })();
    });
  }

  function tick() {
    if (!V) return;
    var sl = V.list[V.i], now = performance.now();
    if (!V.paused) V.elapsed = now - V.t0;
    if (sl.dur) {
      var p = Math.min(1, V.elapsed / sl.dur);
      var bar = V.el.querySelectorAll('.fn-bars-top i')[V.i];
      if (bar) bar.firstChild.style.width = (p * 100).toFixed(2) + '%';
      if (p >= 1 && !V.paused) show(V.i + 1);
    } else {
      var b2 = V.el.querySelectorAll('.fn-bars-top i')[V.i]; if (b2) b2.firstChild.style.width = '100%';
    }
    V.raf = requestAnimationFrame(tick);
  }

  /* ============================================================
     slika za deljenje (1080x1920)
     ============================================================ */
  function loadImg(src, cors) {
    return new Promise(function (res) {
      if (!src) return res(null);
      var im = new Image(); if (cors) im.crossOrigin = 'anonymous';
      im.onload = function () { res(im); }; im.onerror = function () { res(null); };
      im.src = src;
    });
  }
  function cover(ctx, im, x, y, w, h) {
    var r = Math.max(w / im.width, h / im.height), sw = w / r, sh = h / r;
    ctx.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h);
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  async function share() {
    if (!V || !V.data) return;
    UI.toast('Pravim sliku…');
    var d = V.data, m = d.m, ts = d.ts, s = MM.Store.get(), H = HEROES[d.hero];
    var W = 1080, Hh = 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    var c = cv.getContext('2d');
    var bg = await loadImg(IMG + '1.webp');
    c.fillStyle = '#07070b'; c.fillRect(0, 0, W, Hh);
    if (bg) { c.globalAlpha = .9; cover(c, bg, 0, 0, W, Hh); c.globalAlpha = 1; }
    var g = c.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, 'rgba(7,7,11,.15)'); g.addColorStop(.45, 'rgba(7,7,11,.55)'); g.addColorStop(1, 'rgba(7,7,11,.96)');
    c.fillStyle = g; c.fillRect(0, 0, W, Hh);
    var F = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    c.fillStyle = '#f5b83d'; c.font = '800 34px ' + F; c.textAlign = 'left';
    c.fillText('MARVEL MARATON 2026', 80, 150);
    c.fillStyle = '#fff'; c.font = '900 120px ' + F; c.fillText((s.displayName || 'Moj maraton').split(' ')[0], 80, 280);
    // posteri
    var ps = m.done.slice(-5).reverse(), px = 80, pw = 172, ph = 258;
    for (var i = 0; i < ps.length; i++) {
      var im = await loadImg(MM.Posters.urlFor(ps[i], s), true);
      c.save(); rr(c, px + i * (pw + 15), 360, pw, ph, 18); c.clip();
      if (im) { try { cover(c, im, px + i * (pw + 15), 360, pw, ph); } catch (e) { /* */ } } else { c.fillStyle = '#22222b'; c.fill(); }
      c.restore();
    }
    // brojevi
    var stats = [[m.n, 'naslova'], [Math.round(m.minutes / 60) + ' h', 'gledanja'], [m.streak, 'dana zaredom'], [ts && ts.people.length > 1 ? '#' + ts.myRank : m.items, ts && ts.people.length > 1 ? 'u ekipi' : 'predmeta']];
    stats.forEach(function (st, k) {
      var x = 80 + (k % 2) * 470, y = 760 + Math.floor(k / 2) * 230;
      c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, x, y, 450, 200, 34); c.fill();
      c.fillStyle = '#fff'; c.font = '900 96px ' + F; c.fillText(String(st[0]), x + 40, y + 115);
      c.fillStyle = '#a0a0ad'; c.font = '700 34px ' + F; c.fillText(st[1], x + 42, y + 168);
    });
    // junak
    var hi = await loadImg('img/run/' + d.hero + '.webp');
    c.fillStyle = 'rgba(230,36,41,.22)'; rr(c, 80, 1260, 920, 300, 40); c.fill();
    if (hi) { var hr = Math.min(260 / hi.height, 260 / hi.width); c.drawImage(hi, 110, 1280, hi.width * hr, hi.height * hr); }
    c.fillStyle = '#f5b83d'; c.font = '800 30px ' + F; c.fillText('MOJ MARVEL JUNAK', 400, 1360);
    c.fillStyle = '#fff'; c.font = '900 64px ' + F; c.fillText(H.t, 400, 1440);
    c.fillStyle = '#c8c8d2'; c.font = '700 34px ' + F; c.fillText(H.name, 400, 1495);
    c.fillStyle = '#e62429'; c.font = '900 40px ' + F; c.textAlign = 'center';
    c.fillText('DOOMSDAY · 18. 12. 2026', W / 2, 1760);
    cv.toBlob(function (blob) {
      if (!blob) { UI.toast('Slika nije napravljena.'); return; }
      var file = new File([blob], 'marvel-maraton-2026.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Moj Marvel maraton' }).catch(function () {});
      } else {
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name;
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      }
    }, 'image/png');
  }

  /** Kartica za Danas / Ja (samo kad je dostupno). */
  function card(where) {
    if (!available() || (where === 'danas' && !featured())) return '';
    return '<button type="button" class="fn-entry" data-a="finale" data-k="fn-entry"><span class="fe-bg"></span>' +
      '<span class="fe-t"><em>MARVEL MARATON 2026</em><b>Tvoj maraton je spreman</b><i>Godina u pričama — tapni</i></span><span class="fe-go">▶</span></button>';
  }

  /** Jednom, sam od sebe, prvi put kad je dostupno. */
  function auto() {
    var s = MM.Store.get();
    if (!available() || s.finSeen || UI.topSheet()) return;
    open();
  }

  MM.Finale = { available: available, open: open, card: card, auto: auto, brief: brief, _mine: mine };
})();
