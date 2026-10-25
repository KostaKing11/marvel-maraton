/* ============================================================
   planner.js  -  dnevni raspored do Doomsdaya
   ------------------------------------------------------------
   Plan se NIKAD ne cuva - racuna se od nule iz stanja na svaku
   promenu. Zato nema "zaostatka": sve sto nije odgledano samo se
   ponovo rasporedi od danas nadalje.

     1. jedinice = filmovi + pojedinacne epizode iz tvog plana,
        u izabranom redosledu, bez odgledanog
     2. dnevna norma:
          auto   -> (preostalo + danas odgledano) / slobodnih dana do 17.12.
          fiksno -> koliko si sam zadao (plan moze da ode i posle Doomsdaya)
     3. dani se pune redom; epizoda koja jos nije izasla (VisionQuest)
        ceka svoj datum, a ostalo ide dalje
     4. slobodni dani (dani u nedelji + "nemam vremena danas") se preskacu
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var Cat = MM.Cat;
  var START_ISO = '2026-08-17';       // prvi dan maratona
  var DOOMSDAY_ISO = '2026-12-18';    // bioskop
  var TOL = 20;                       // koliko sme da se prebaci norma da se ne cepa bez veze (min)

  /* ---------------- datumi (sve u lokalnom vremenu, kao ISO "YYYY-MM-DD") ---------------- */

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function todayIso() { return iso(new Date()); }
  /** 0 = ponedeljak ... 6 = nedelja */
  function weekday(s) { return (parse(s).getDay() + 6) % 7; }
  function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }

  /* ---------------- odgledano ---------------- */

  function watchedEps(item, s) {
    var w = s.watched && s.watched[item.id];
    var n = item.episodes || 0;
    if (w === true) { var all = []; for (var i = 1; i <= n; i++) all.push(i); return all; }
    if (!Array.isArray(w)) return [];
    var seen = {}, out = [];
    w.forEach(function (e) { e = +e; if (e >= 1 && e <= n && !seen[e]) { seen[e] = 1; out.push(e); } });
    return out.sort(function (a, b) { return a - b; });
  }

  function isDone(item, s) {
    if (Cat.isSeries(item)) return watchedEps(item, s).length >= item.episodes;
    return !!(s.watched && s.watched[item.id] === true);
  }

  function watchedMinutes(item, s) {
    if (Cat.isSeries(item)) return Math.min(item.runtime, watchedEps(item, s).length * Cat.epMinutes(item));
    return isDone(item, s) ? item.runtime : 0;
  }

  function unitKey(id, ep) { return ep ? id + '#' + ep : id; }

  function unitFromKey(key) {
    var p = String(key).split('#');
    var item = Cat.get(p[0]);
    if (!item) return null;
    var ep = p[1] ? parseInt(p[1], 10) : null;
    return { key: key, id: item.id, item: item, ep: ep, min: ep ? Cat.epMinutes(item) : item.runtime };
  }

  /* ---------------- jedinice ---------------- */

  /**
   * Sve jedinice tvog plana u redosledu, sa oznakom da li su odgledane.
   * "Obavezno prvo" (s.mustFirst): obavezni naslovi idu napred (u svom
   * redosledu), ostalo posle - za Full Marvel koji ne staje do Doomsdaya.
   */
  function units(s) {
    var out = [];
    var list = Cat.sorted(s);
    if (s.mustFirst) {
      list = list.filter(function (i) { return i.doom === 'must'; })
        .concat(list.filter(function (i) { return i.doom !== 'must'; }));
    }
    list.forEach(function (item) {
      if (!Cat.inPlan(item, s)) return;
      if (Cat.isSeries(item)) {
        var per = Cat.epMinutes(item);
        var seen = watchedEps(item, s);
        for (var e = 1; e <= item.episodes; e++) {
          out.push({
            key: unitKey(item.id, e), id: item.id, item: item, ep: e, min: per,
            avail: Cat.availFrom(item, e), watched: seen.indexOf(e) !== -1
          });
        }
      } else {
        out.push({
          key: item.id, id: item.id, item: item, ep: null, min: item.runtime,
          avail: item.date, watched: isDone(item, s)
        });
      }
    });
    return out;
  }

  function paceOf(s) {
    var p = s.pace || {};
    var min = (typeof p.min === 'number' && p.min >= 15) ? Math.min(720, p.min) : 120;
    return { mode: p.mode === 'fixed' ? 'fixed' : 'auto', min: min };
  }

  function isOffDay(s, d) {
    if (s.skipDays && s.skipDays[d]) return true;
    return (s.offDays || []).indexOf(weekday(d)) !== -1;
  }

  /* ---------------- log: sta je odgledano kog dana ---------------- */

  function logByDay(s) {
    var map = {};
    Object.keys(s.log || {}).forEach(function (k) {
      var rec = s.log[k];
      var d = rec && rec.d;
      if (!d) return;
      var u = unitFromKey(k);
      if (!u) return;
      u.t = (rec && rec.t) || 0;
      (map[d] = map[d] || []).push(u);
    });
    Object.keys(map).forEach(function (d) {
      map[d].sort(function (a, b) { return (a.t - b.t) || (a.item.order - b.item.order) || ((a.ep || 0) - (b.ep || 0)); });
    });
    return map;
  }

  /* ---------------- glavni raspored ---------------- */

  var memo = { key: '', obj: null, plan: null };

  function build(s, today) {
    today = today || todayIso();
    var key = today + '|' + (s.updatedAt || 0) + '|' + Cat.all().length;
    if (memo.key === key && memo.obj === s && memo.plan) return memo.plan;

    var pace = paceOf(s);
    var deadline = addDays(DOOMSDAY_ISO, -1);
    var all = units(s);
    var queue = all.filter(function (u) { return !u.watched; });
    var remaining = queue.reduce(function (a, u) { return a + u.min; }, 0);

    var byDay = logByDay(s);
    var doneUnits = byDay[today] || [];
    var doneToday = doneUnits.reduce(function (a, u) { return a + u.min; }, 0);

    var mode = pace.mode;
    if (mode === 'auto' && today > deadline) mode = 'fixed';   // posle Doomsdaya nema roka

    var freeDays = 0, lastFree = null;
    if (mode === 'auto') {
      for (var d0 = today; d0 <= deadline; d0 = addDays(d0, 1)) if (!isOffDay(s, d0)) { freeDays++; lastFree = d0; }
      if (!freeDays) freeDays = 1;
    }
    var target = mode === 'auto' ? (remaining + doneToday) / freeDays : pace.min;

    // Kumulativno: posle k slobodnih dana treba da je rasporedjeno k * norma.
    // Dan koji ostane ispod norme (film nije stao) prenosi manjak na sledeci,
    // pa se plan ne "razvuce" preko roka.
    var used = new Array(queue.length);
    var head = 0, left = queue.length;
    var days = [];
    var d = today, guard = 0, k = 0;
    var sched = doneToday;
    var mustLeft = queue.some(function (u) { return u.item.doom === 'must'; });
    var mustFinish = null;

    while (left > 0 && guard < 1500) {
      var day = { iso: d, units: [], minutes: 0, off: isOffDay(s, d), isToday: d === today };
      if (!day.off) {
        k++;
        var budget = target * k - sched;
        var takeAll = mode === 'auto' && d === lastFree;   // poslednji dan pred Doomsday: sve sto je ostalo
        while (head < queue.length && used[head]) head++;
        for (var i = head; i < queue.length; i++) {
          if (used[i]) continue;
          var u = queue[i];
          if (u.avail > d) continue;                         // jos nije izaslo - ceka
          // Uzmi ako te pribliZava normi (bar pola jedinice staje u budzet).
          // Ne preskacemo redosled zbog krace stvari - prvi koji ne staje zavrsava dan.
          // Danas, ako jos nista nisi gledao, uvek dobijes bar nesto - i kad je
          // norma manja od filma (npr. 45 min dnevno). Ostali dani se posle uravnoteze.
          var firstToday = d === today && !day.units.length && doneToday === 0;
          if (!takeAll && !firstToday) {
            if (day.units.length && day.minutes + u.min > target * 1.6 + TOL) break;   // bez maratona od 6h
            if (day.minutes + u.min / 2 > budget + TOL) break;
          }
          used[i] = true; left--;
          day.units.push(u); day.minutes += u.min;
          if (u.item.doom === 'must') mustFinish = d;
        }
        sched += day.minutes;
      }
      days.push(day);
      d = addDays(d, 1);
      guard++;
    }

    var byIso = {};
    days.forEach(function (x) { byIso[x.iso] = x; });
    var last = null;
    for (var j = days.length - 1; j >= 0; j--) if (days[j].units.length) { last = days[j].iso; break; }

    var titles = {};
    queue.forEach(function (u) { titles[u.id] = 1; });

    var plan = {
      today: today,
      mode: mode,
      pace: pace,
      target: target,
      doneToday: doneToday,
      doneTodayUnits: doneUnits,
      remaining: remaining,
      titlesLeft: Object.keys(titles).length,
      unitsLeft: queue.length,
      all: all,
      queue: queue,
      days: days,
      byIso: byIso,
      finishIso: last,
      deadline: deadline,
      freeDays: freeDays,
      mustFinishIso: mustLeft ? mustFinish : null,
      late: today <= deadline && !!(last && last > deadline),
      mustLate: today <= deadline && !!(mustLeft && mustFinish && mustFinish > deadline),
      heavy: mode === 'auto' && target > 240,
      todayDay: byIso[today] || { iso: today, units: [], minutes: 0, off: isOffDay(s, today), isToday: true },
      next: firstOpen(days, queue)
    };
    memo = { key: key, obj: s, plan: plan };
    return plan;
  }

  /** Sledeca jedinica: prva iz danasnjeg plana, inace prva dostupna u redu. */
  function firstOpen(days, queue) {
    for (var i = 0; i < days.length; i++) if (days[i].units.length) return days[i].units[0];
    return queue[0] || null;
  }

  /* ---------------- napredak, niz ---------------- */

  /** Napredak u TVOM planu (za profil, procente i Doom setnju). */
  function progress(s) {
    var total = 0, watched = 0, totalMin = 0, watchedMin = 0;
    Cat.all().forEach(function (i) {
      if (!Cat.inPlan(i, s)) return;
      total++;
      totalMin += i.runtime;
      watchedMin += watchedMinutes(i, s);
      if (isDone(i, s)) watched++;
    });
    return {
      watched: watched, total: total,
      watchedMin: watchedMin, totalMin: totalMin,
      percent: totalMin ? Math.round(watchedMin / totalMin * 100) : 0,
      ratio: totalMin ? watchedMin / totalMin : 0
    };
  }

  /**
   * Niz uzastopnih dana sa bar jednim odgledanim. Ako danas jos nisi
   * gledao, a juce jesi - niz je ziv, samo "na cekanju".
   */
  function streak(s, today) {
    today = today || todayIso();
    var days = {};
    Object.keys(s.log || {}).forEach(function (k) {
      var d = s.log[k] && s.log[k].d;
      if (d) days[d] = 1;
    });
    var y = addDays(today, -1);
    var start = days[today] ? today : (days[y] ? y : null);
    if (!start) return { n: 0, today: false, best: bestStreak(days) };
    var n = 0, cur = start;
    while (days[cur]) { n++; cur = addDays(cur, -1); }
    return { n: n, today: !!days[today], best: Math.max(n, bestStreak(days)) };
  }

  function bestStreak(days) {
    var list = Object.keys(days).sort();
    var best = 0, run = 0, prev = null;
    list.forEach(function (d) {
      run = (prev && addDays(prev, 1) === d) ? run + 1 : 1;
      if (run > best) best = run;
      prev = d;
    });
    return best;
  }

  /** Koliko je vremena proslo od starta maratona do Doomsdaya (0..1). */
  function timeRatio(now) {
    now = now || Date.now();
    var a = parse(START_ISO).getTime(), b = parse(DOOMSDAY_ISO).getTime();
    return Math.max(0, Math.min(1, (now - a) / (b - a)));
  }

  /* ---------------- grupisanje za prikaz ---------------- */

  /** Uzastopne epizode iste serije u jedan red: "Loki · S2  ep 3–5". */
  function group(list) {
    var out = [];
    list.forEach(function (u) {
      var last = out[out.length - 1];
      if (last && last.id === u.id && u.ep) {
        last.eps.push(u.ep); last.keys.push(u.key); last.min += u.min;
        if (u.watched === false) last.allWatched = false;
      } else {
        out.push({ id: u.id, item: u.item, eps: u.ep ? [u.ep] : [], keys: [u.key], min: u.min,
          allWatched: u.watched !== false });
      }
    });
    out.forEach(function (g) { g.epLabel = epLabel(g.eps); });
    return out;
  }

  function epLabel(eps) {
    if (!eps.length) return '';
    if (eps.length === 1) return 'ep ' + eps[0];
    var a = eps[0], b = eps[eps.length - 1];
    return (b - a + 1 === eps.length) ? 'ep ' + a + '–' + b : 'ep ' + eps.join(', ');
  }

  MM.Plan = {
    START_ISO: START_ISO, DOOMSDAY_ISO: DOOMSDAY_ISO,
    iso: iso, parse: parse, addDays: addDays, today: todayIso, weekday: weekday, daysBetween: daysBetween,
    watchedEps: watchedEps, isDone: isDone, watchedMinutes: watchedMinutes,
    unitKey: unitKey, unitFromKey: unitFromKey,
    units: units, build: build, paceOf: paceOf, isOffDay: isOffDay,
    logByDay: logByDay, progress: progress, streak: streak, timeRatio: timeRatio,
    group: group, epLabel: epLabel
  };
})();
