/* ============================================================
   planner.js  -  DINAMICAN RASPORED
   ------------------------------------------------------------
   Ovo je najzamrseniji deo app-a, pa je komentarisan detaljno.

   KLJUCNA IDEJA: raspored se NIKAD ne cita fiksno iz data.json
   (polja `week` / `weeks` su samo autorov predlog i mi ih
   ignorisemo). Plan se PRERACUNAVA od nule svaki put kad se
   nesto promeni: cekiranje, kapacitet nedelje, izbacen tier.
   Zbog toga nema "zaostatka" koji raste - sve sto nije
   odgledano jednostavno ponovo udje u pakovanje i samo se
   prelije u naredne nedelje.

   Redosled operacija (isti kao u specifikaciji):
     1. filtriraj po tierovima (user.plans) + izbaci 2 fiksna finala
     2. razlozi serije na epizode
     3. izbaci odgledano
     4. uzmi nedelje od DANAS do 18.
     5. puni greedy po kapacitetu, tolerancija +20 min
     6. ako ne stane do 18. nedelje -> upozorenje, ne greska
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  /* ---------------- Kalendar maratona ---------------- */

  // Nedelja 1 pocinje 17.08.2026 (ponedeljak). Mesec je 0-indeksiran!
  var WEEK1 = new Date(2026, 7, 17);
  var TOTAL_WEEKS = 18;                    // 18. nedelja = 14.-20.12.2026
  var DOOMSDAY = new Date(2026, 11, 18);   // 18.12.2026, bioskop

  // Ova dva naslova NISU deo pakovanja - fiksno stoje u 18. nedelji.
  var PINNED = ['spider-man-brand-new-day', 'avengers-doomsday'];

  // Koliko smemo da "prebijemo" kapacitet nedelje da ne bismo
  // cepali epizodu/film besmisleno (npr. 5 min preko limita).
  var TOLERANCE = 20; // minuta

  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  var DAY_NAMES = ['pon', 'uto', 'sre', 'čet', 'pet', 'sub', 'ned'];

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { var x = startOfDay(d); x.setDate(x.getDate() + n); return x; }
  function daysBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / 86400000); }
  function weekStart(n) { return addDays(WEEK1, (n - 1) * 7); }
  function weekEnd(n) { return addDays(WEEK1, (n - 1) * 7 + 6); }
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fmtDate(d) { return d.getDate() + '. ' + MONTHS[d.getMonth()]; }
  function fmtRange(a, b) { return fmtDate(a) + ' – ' + fmtDate(b); }

  /** Koja je nedelja maratona danas? Pre pocetka -> 1, posle kraja -> 18. */
  function currentWeek(today) {
    var d = daysBetween(WEEK1, today || new Date());
    if (d < 0) return 1;
    return Math.min(TOTAL_WEEKS, Math.floor(d / 7) + 1);
  }

  function daysToDoomsday(today) {
    return Math.max(0, daysBetween(today || new Date(), DOOMSDAY));
  }

  /* ---------------- Redosled gledanja ---------------- */

  /**
   * Kljuc za sortiranje.
   * Bonus (Fox era: X-Men / Deadpool, releaseOrder 101-106) NE ide na kraj,
   * nego neposredno PRE "deadpool-wolverine" (releaseOrder 48) - jer taj film
   * je nastavak Fox price. Zato ih mapiramo u 47.01 ... 47.06, cime upadaju
   * izmedju "echo" (47) i "deadpool-wolverine" (48), a medjusobno zadrzavaju
   * svoj redosled (X-Men, X2, DoFP, Logan, Deadpool, Deadpool 2).
   */
  function sortKey(item) {
    if (item.releaseOrder >= 101) return 47 + (item.releaseOrder - 100) / 100;
    return item.releaseOrder;
  }

  /** Trajanje jedne epizode = ukupan runtime serije / broj epizoda. */
  function episodeMinutes(item) {
    if (item.type !== 'serija' || !item.episodes) return item.runtime;
    return Math.round(item.runtime / item.episodes);
  }

  /** Lista odgledanih epizoda za seriju (tolerantno prema `true` iz starih stanja). */
  function watchedEpisodes(item, state) {
    var w = state.watched[item.id];
    if (w === true) {
      var all = [];
      for (var i = 1; i <= (item.episodes || 1); i++) all.push(i);
      return all;
    }
    return Array.isArray(w) ? w : [];
  }

  function isFullyWatched(item, state) {
    if (item.type === 'serija' && item.episodes) {
      return watchedEpisodes(item, state).length >= item.episodes;
    }
    return state.watched[item.id] === true;
  }

  /** Kljuc jedinice u logu: film -> "id", epizoda -> "id#3". */
  function unitKey(id, ep) { return ep ? id + '#' + ep : id; }

  /* ---------------- 1-3: gradnja liste jedinica ---------------- */

  /**
   * Vraca ravnu listu "jedinica" u redosledu gledanja.
   * Jedinica = jedan film/special ILI jedna epizoda serije.
   * Vec odgledano i dva fiksna finala su izbaceni.
   */
  function buildUnits(items, state) {
    var plans = state.plans || [];
    var pool = items.filter(function (i) {
      return plans.indexOf(i.priority) !== -1 && PINNED.indexOf(i.id) === -1;
    });
    pool.sort(function (a, b) { return sortKey(a) - sortKey(b); });

    var units = [];
    pool.forEach(function (item) {
      if (item.type === 'serija' && item.episodes) {
        var per = episodeMinutes(item);
        var seen = watchedEpisodes(item, state);
        for (var e = 1; e <= item.episodes; e++) {
          if (seen.indexOf(e) !== -1) continue;         // 3. izbaci odgledano
          units.push({ id: item.id, item: item, ep: e, minutes: per, key: unitKey(item.id, e) });
        }
      } else {
        if (state.watched[item.id] === true) return;    // 3. izbaci odgledano
        units.push({ id: item.id, item: item, ep: null, minutes: item.runtime, key: unitKey(item.id, null) });
      }
    });
    return units;
  }

  /**
   * Redni broj svakog naslova u kanonskom redosledu gledanja: Iron Man = #1.
   * Racuna se preko SVIH naslova (i onih van tvojih tierova) da bi broj bio
   * stabilan - da ti "Thor #4" ne postane "#3" cim izbacis skip tier.
   */
  function ordinals(items) {
    var map = {};
    items.slice().sort(function (a, b) { return sortKey(a) - sortKey(b); })
      .forEach(function (i, idx) { map[i.id] = idx + 1; });
    return map;
  }

  /**
   * SVE jedinice u redosledu gledanja - i odgledane i neodgledane.
   * Sluzi za "nazad" u spilu: da se zna sta je bilo pre tekuce kartice.
   */
  function allUnits(items, state) {
    var plans = state.plans || [];
    var pool = items.filter(function (i) {
      return plans.indexOf(i.priority) !== -1 && PINNED.indexOf(i.id) === -1;
    });
    pool.sort(function (a, b) { return sortKey(a) - sortKey(b); });

    var units = [];
    pool.forEach(function (item) {
      if (item.type === 'serija' && item.episodes) {
        var per = episodeMinutes(item);
        var seen = watchedEpisodes(item, state);
        for (var e = 1; e <= item.episodes; e++) {
          units.push({
            id: item.id, item: item, ep: e, minutes: per,
            key: unitKey(item.id, e), watched: seen.indexOf(e) !== -1
          });
        }
      } else {
        units.push({
          id: item.id, item: item, ep: null, minutes: item.runtime,
          key: unitKey(item.id, null), watched: state.watched[item.id] === true
        });
      }
    });
    return units;
  }

  /** Spil za "Danas": neodgledane jedinice u redosledu gledanja. */
  function deck(items, state) {
    return buildUnits(items, state);
  }

  /** Kapacitet nedelje N u SATIMA: override ako postoji, inace default. */
  function capacityFor(state, n) {
    var c = state.capacity ? state.capacity[String(n)] : undefined;
    if (typeof c === 'number' && isFinite(c)) return c;
    return state.defaultCapacity;
  }

  /* ---------------- Grupisanje za prikaz ---------------- */

  /**
   * Uzastopne jedinice istog naslova spaja u jedan red:
   * 6 epizoda WandaVision -> { label: "WandaVision ep 1-5" }.
   * Serija tako moze da se prelije: "ep 1-5" ove nedelje, "ep 6-9" sledece.
   */
  function groupUnits(units) {
    var out = [];
    units.forEach(function (u) {
      var last = out[out.length - 1];
      if (last && last.id === u.id) {
        last.eps.push(u.ep);
        last.minutes += u.minutes;
        last.keys.push(u.key);
      } else {
        out.push({
          id: u.id, item: u.item, title: u.item.title, type: u.item.type,
          eps: u.ep ? [u.ep] : [], minutes: u.minutes, keys: [u.key], done: !!u.done
        });
      }
    });
    out.forEach(function (g) { g.label = entryLabel(g); });
    return out;
  }

  function entryLabel(g) {
    if (!g.eps.length) return g.title;
    if (g.eps.length === 1) return g.title + ' ep ' + g.eps[0];
    var first = g.eps[0], last = g.eps[g.eps.length - 1];
    var contiguous = (last - first + 1) === g.eps.length;
    return g.title + (contiguous ? ' ep ' + first + '-' + last : ' ep ' + g.eps.join(', '));
  }

  /* ---------------- 4-6: pakovanje po nedeljama ---------------- */

  /**
   * Glavna funkcija. Vraca:
   * {
   *   currentWeek, weeks: [ {n, start, end, past, current, capacity,
   *                          plannedUnits, planned[], doneEntries[],
   *                          plannedMinutes, doneMinutes, pinned[] } ],
   *   overflow: [units], overflowMinutes, totalRemainingMinutes, warning
   * }
   */
  function buildPlan(items, state, today) {
    today = today || new Date();
    var cw = currentWeek(today);
    var units = buildUnits(items, state);
    var totalRemaining = units.reduce(function (s, u) { return s + u.minutes; }, 0);

    // Log: sta je vec odcekirano i u kojoj nedelji - da bi "Ove nedelje"
    // moglo posteno da pokaze "3.2h / 9.8h", a proslost u kalendaru
    // da ne bude prazna.
    var log = state.log || {};
    var doneByWeek = {};
    Object.keys(log).forEach(function (k) {
      var rec = log[k];
      var w = (typeof rec === 'number') ? rec : (rec && rec.w);
      if (!w) return;
      var parts = k.split('#');
      var item = items.find(function (i) { return i.id === parts[0]; });
      if (!item) return;
      var ep = parts[1] ? parseInt(parts[1], 10) : null;
      // Prikazi samo ono sto je i dalje odgledano (ako je odcekirano, log se brise,
      // ali budimo otporni).
      (doneByWeek[w] = doneByWeek[w] || []).push({
        id: item.id, item: item, ep: ep, minutes: ep ? episodeMinutes(item) : item.runtime,
        key: k, done: true, date: (rec && rec.d) || null
      });
    });
    Object.keys(doneByWeek).forEach(function (w) {
      doneByWeek[w].sort(function (a, b) {
        return (sortKey(a.item) - sortKey(b.item)) || ((a.ep || 0) - (b.ep || 0));
      });
    });

    var idx = 0;
    var weeks = [];

    for (var n = 1; n <= TOTAL_WEEKS; n++) {
      var cap = capacityFor(state, n);
      var week = {
        n: n,
        start: weekStart(n),
        end: weekEnd(n),
        past: n < cw,
        current: n === cw,
        capacity: cap,
        plannedUnits: [],
        plannedMinutes: 0,
        doneUnits: doneByWeek[n] || [],
        doneMinutes: (doneByWeek[n] || []).reduce(function (s, u) { return s + u.minutes; }, 0),
        pinned: []
      };

      // 4. Planiramo SAMO od tekuce nedelje nadalje. U prosle nedelje
      //    se nista ne gura unazad - one prikazuju samo ono sto je stvarno
      //    odgledano tada.
      if (n >= cw) {
        // Ono sto je vec odgledano U TOJ nedelji trosi njen kapacitet.
        // Zato "Ove nedelje" posteno pise npr. "3.2h / 9.8h" umesto da
        // ukupno naraste iznad kapaciteta cim nesto odcekiras.
        var capMin = Math.max(0, cap * 60 - week.doneMinutes);
        while (idx < units.length) {
          var u = units[idx];
          var after = week.plannedMinutes + u.minutes;
          // 5. Stane ako je ispod kapaciteta, ili ga probija za <= 20 min
          //    (i nedelja jos nije popunjena) - da ne cepamo epizodu bez veze.
          var fits = (after <= capMin) ||
                     ((after - capMin) <= TOLERANCE && week.plannedMinutes < capMin);
          if (!fits) break;
          week.plannedUnits.push(u);
          week.plannedMinutes = after;
          idx++;
        }
      }

      week.planned = groupUnits(week.plannedUnits);
      week.doneEntries = groupUnits(week.doneUnits);
      weeks.push(week);
    }

    // Fiksno finale u 18. nedelji (van pakovanja, van kapaciteta).
    var finale = weeks[TOTAL_WEEKS - 1];
    PINNED.forEach(function (id) {
      var it = items.find(function (i) { return i.id === id; });
      if (it) finale.pinned.push(it);
    });

    // 6. Ako nije sve stalo - NE bacamo gresku, samo upozorenje.
    var overflow = units.slice(idx);
    var overflowMinutes = overflow.reduce(function (s, u) { return s + u.minutes; }, 0);
    var overflowTitles = {};
    overflow.forEach(function (u) { overflowTitles[u.id] = true; });

    var warning = null;
    if (overflow.length) {
      var weeksLeft = Math.max(1, TOTAL_WEEKS - cw + 1);
      var neededPerWeek = Math.ceil(totalRemaining / 60 / weeksLeft);
      warning = {
        titles: Object.keys(overflowTitles).length,
        hours: Math.round(overflowMinutes / 60 * 10) / 10,
        skipHours: Math.round(tierMinutes(items, state, 'skip') / 60 * 10) / 10,
        neededPerWeek: neededPerWeek,
        text: 'Ne stižeš ' + Object.keys(overflowTitles).length + ' naslova (' +
              (Math.round(overflowMinutes / 60 * 10) / 10) + 'h). Predlog: izbaci skip tier (-' +
              (Math.round(tierMinutes(items, state, 'skip') / 60 * 10) / 10) + 'h) ili digni tempo na ' +
              neededPerWeek + 'h/nedeljno.'
      };
    }

    return {
      currentWeek: cw,
      weeks: weeks,
      overflow: overflow,
      overflowMinutes: overflowMinutes,
      totalRemainingMinutes: totalRemaining,
      warning: warning
    };
  }

  /** Koliko NEODGLEDANIH minuta nosi jedan tier (za dugme "izbaci skip"). */
  function tierMinutes(items, state, tier) {
    var m = 0;
    items.forEach(function (i) {
      if (i.priority !== tier) return;
      if (PINNED.indexOf(i.id) !== -1) return;
      if (i.type === 'serija' && i.episodes) {
        m += (i.episodes - watchedEpisodes(i, state).length) * episodeMinutes(i);
      } else if (state.watched[i.id] !== true) {
        m += i.runtime;
      }
    });
    return Math.max(0, m);
  }

  /* ---------------- Podela nedelje na dane ---------------- */

  /**
   * "Danas" ekran: nedeljni plan se deli na dane.
   * Delimo samo na PREOSTALE dane te nedelje (od danas do nedelje),
   * i preskacemo dane koje je korisnik oznacio sa "nemam vremena danas"
   * (state.skipDays). Tako dugme prirodno prebaci danasnje na ostatak
   * nedelje - bez posebne "zaostatak" liste.
   */
  function splitWeekIntoDays(week, state, today) {
    today = startOfDay(today || new Date());
    var days = [];
    for (var i = 0; i < 7; i++) {
      var d = addDays(week.start, i);
      days.push({
        date: d, iso: iso(d), name: DAY_NAMES[i],
        isToday: daysBetween(d, today) === 0,
        isPast: d < today,
        skipped: !!(state.skipDays && state.skipDays[iso(d)]),
        units: [], minutes: 0
      });
    }

    var open = days.filter(function (d) { return !d.isPast && !d.skipped; });
    if (!open.length) open = days.filter(function (d) { return !d.isPast; });
    if (!open.length) return days; // nedelja je prosla

    var total = week.plannedMinutes;
    var target = total / open.length;
    var k = 0;

    week.plannedUnits.forEach(function (u) {
      // Prelazi na sledeci dan kad je tekuci popunjen preko svog dela,
      // osim ako je ovo poslednji otvoren dan (tada sve ostalo ide tu).
      while (k < open.length - 1 && open[k].minutes >= target - TOLERANCE / 2) k++;
      open[k].units.push(u);
      open[k].minutes += u.minutes;
      if (open[k].minutes >= target + TOLERANCE && k < open.length - 1) k++;
    });

    days.forEach(function (d) { d.entries = groupUnits(d.units); });
    return days;
  }

  /* ---------------- Statistika / tempo ---------------- */

  function stats(items, state, plan, today) {
    var totalMin = 0, watchedMin = 0, films = 0, series = 0, watchedTitles = 0;
    var byPhase = {};

    items.forEach(function (i) {
      var full = i.runtime;
      var w = 0;
      if (i.type === 'serija' && i.episodes) {
        w = watchedEpisodes(i, state).length * episodeMinutes(i);
        series++;
      } else {
        w = state.watched[i.id] === true ? full : 0;
        films++;
      }
      totalMin += full; watchedMin += w;
      if (isFullyWatched(i, state)) watchedTitles++;

      var p = i.phase;
      if (!byPhase[p]) byPhase[p] = { phase: p, total: 0, watched: 0, count: 0, done: 0 };
      byPhase[p].total += full; byPhase[p].watched += w; byPhase[p].count++;
      if (isFullyWatched(i, state)) byPhase[p].done++;
    });

    var weeksLeft = Math.max(1, TOTAL_WEEKS - plan.currentWeek + 1);
    var perWeek = plan.totalRemainingMinutes / 60 / weeksLeft;

    return {
      totalMinutes: totalMin,
      watchedMinutes: watchedMin,
      percent: totalMin ? Math.round(watchedMin / totalMin * 100) : 0,
      films: films,
      series: series,
      titles: items.length,
      watchedTitles: watchedTitles,
      weeksLeft: weeksLeft,
      perWeekHours: perWeek,
      tempo: perWeek < 8 ? 'ok' : (perWeek < 12 ? 'warn' : 'hot'),
      phases: Object.keys(byPhase).map(function (k) { return byPhase[k]; })
        .sort(function (a, b) { return a.phase - b.phase; })
    };
  }

  /* ---------------- Export ---------------- */

  MM.Planner = {
    WEEK1: WEEK1,
    TOTAL_WEEKS: TOTAL_WEEKS,
    DOOMSDAY: DOOMSDAY,
    PINNED: PINNED,
    DAY_NAMES: DAY_NAMES,
    buildPlan: buildPlan,
    buildUnits: buildUnits,
    ordinals: ordinals,
    deck: deck,
    allUnits: allUnits,
    splitWeekIntoDays: splitWeekIntoDays,
    stats: stats,
    tierMinutes: tierMinutes,
    capacityFor: capacityFor,
    episodeMinutes: episodeMinutes,
    watchedEpisodes: watchedEpisodes,
    isFullyWatched: isFullyWatched,
    unitKey: unitKey,
    currentWeek: currentWeek,
    daysToDoomsday: daysToDoomsday,
    weekStart: weekStart,
    weekEnd: weekEnd,
    groupUnits: groupUnits,
    iso: iso,
    fmtDate: fmtDate,
    fmtRange: fmtRange,
    addDays: addDays,
    daysBetween: daysBetween,
    startOfDay: startOfDay
  };
})();
