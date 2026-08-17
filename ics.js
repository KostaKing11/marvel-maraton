/* ============================================================
   ics.js  -  izvoz plana u .ics (iCalendar)
   ------------------------------------------------------------
   Svaka nedelja = JEDAN celodnevni event koji traje 7 dana.
   Naslov: "MCU N7: Moon Knight ep 1-6, Multiverse of Madness"
   Opis:   puna lista + linkovi (moji linkovi ako postoje).
   VALARM: nedelja uvece 19:00 (dan pre pocetka nedelje) i
           sreda 18:00 (sredina nedelje).

   Ovo je glavni mehanizam za PRAVE notifikacije na telefonu:
   fajl se uveze u Google Kalendar (Import), pa Google salje
   podsetnike - bez servera i bez push infrastrukture.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  function pad(n) { return String(n).padStart(2, '0'); }

  function dateValue(d) { // DTSTART;VALUE=DATE:20260817
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
  }

  function stampUTC(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
           pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  }

  // iCalendar escaping: \ ; , i prelom reda
  function esc(s) {
    return String(s)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  // RFC 5545: linija max 75 OKTETA (ne karaktera), nastavak pocinje razmakom.
  // Nasi naslovi imaju c/s/z/ć/š/ž pa moramo da brojimo bajtove, a ne slova.
  function byteLen(s) {
    var n = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.codePointAt(i);
      if (c > 0xFFFF) { n += 4; i++; }
      else if (c > 0x7FF) n += 3;
      else if (c > 0x7F) n += 2;
      else n += 1;
    }
    return n;
  }

  function fold(line) {
    if (byteLen(line) <= 75) return line;
    var out = [], cur = '', bytes = 0, limit = 74; // 74 + razmak nastavka <= 75
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      // ne cepaj surrogate par
      if (/[\uD800-\uDBFF]/.test(ch) && i + 1 < line.length) { ch += line[i + 1]; i++; }
      var b = byteLen(ch);
      if (bytes + b > limit) { out.push(cur); cur = ' '; bytes = 1; limit = 74; }
      cur += ch; bytes += b;
    }
    if (cur) out.push(cur);
    return out.join('\r\n');
  }

  /**
   * @param {Array}  items  svi naslovi iz data.json
   * @param {Object} state  korisnicko stanje (za linkove)
   * @param {Object} plan   rezultat MM.Planner.buildPlan
   * @returns {string} sadrzaj .ics fajla
   */
  function build(items, state, plan) {
    var P = MM.Planner;
    var now = new Date();
    var L = [];

    L.push('BEGIN:VCALENDAR');
    L.push('VERSION:2.0');
    L.push('PRODID:-//Marvel Maraton//MCU do Doomsday//SR');
    L.push('CALSCALE:GREGORIAN');
    L.push('METHOD:PUBLISH');
    L.push('X-WR-CALNAME:Marvel Maraton');

    plan.weeks.forEach(function (w) {
      var entries = w.planned.slice();
      var pinnedTitles = w.pinned.map(function (i) { return i.title; });
      if (!entries.length && !pinnedTitles.length) return;   // prazna nedelja - preskoci
      if (w.past) return;                                     // proslost se ne izvozi

      var titles = entries.map(function (e) { return e.label; }).concat(pinnedTitles);
      var summary = 'MCU N' + w.n + ': ' + titles.join(', ');

      // Opis: lista sa trajanjima + linkovi
      var desc = [];
      desc.push('Nedelja ' + w.n + ' (' + P.fmtRange(w.start, w.end) + ')');
      desc.push('Ukupno: ' + (Math.round(w.plannedMinutes / 60 * 10) / 10) + 'h · kapacitet ' + w.capacity + 'h');
      desc.push('');
      entries.forEach(function (e) {
        var line = '• ' + e.label + ' (' + e.minutes + ' min)';
        var link = state.links && state.links[e.id];
        if (link) line += ' → ' + link;
        desc.push(line);
      });
      w.pinned.forEach(function (i) {
        desc.push('★ ' + i.title + ' (' + i.runtime + ' min) — ' + (i.note || ''));
      });
      desc.push('');
      desc.push('Marvel Maraton');

      L.push('BEGIN:VEVENT');
      L.push('UID:mcu-maraton-w' + w.n + '-' + dateValue(w.start) + '@marvel-maraton');
      L.push('DTSTAMP:' + stampUTC(now));
      L.push('DTSTART;VALUE=DATE:' + dateValue(w.start));
      // DTEND je EKSKLUZIVAN -> dan posle poslednjeg dana = 7 dana ukupno
      L.push('DTEND;VALUE=DATE:' + dateValue(P.addDays(w.end, 1)));
      L.push(fold('SUMMARY:' + esc(summary)));
      L.push(fold('DESCRIPTION:' + esc(desc.join('\n'))));
      L.push('TRANSP:TRANSPARENT');
      L.push('CATEGORIES:MCU');

      // Podsetnik 1: nedelja uvece u 19:00 (nedelja pocinje u ponedeljak 00:00,
      // pa je to -29h u odnosu na pocetak).
      L.push('BEGIN:VALARM');
      L.push('ACTION:DISPLAY');
      L.push('TRIGGER;RELATED=START:-PT29H');
      L.push(fold('DESCRIPTION:' + esc('Sutra kreće MCU nedelja ' + w.n + ': ' + titles.join(', '))));
      L.push('END:VALARM');

      // Podsetnik 2: sreda u 18:00 (ponedeljak 00:00 + 2 dana i 18h).
      L.push('BEGIN:VALARM');
      L.push('ACTION:DISPLAY');
      L.push('TRIGGER;RELATED=START:P2DT18H');
      L.push(fold('DESCRIPTION:' + esc('Sredina nedelje ' + w.n + ' — kako stojiš?')));
      L.push('END:VALARM');

      L.push('END:VEVENT');
    });

    // Sam Doomsday kao poseban dan.
    L.push('BEGIN:VEVENT');
    L.push('UID:mcu-doomsday@marvel-maraton');
    L.push('DTSTAMP:' + stampUTC(now));
    L.push('DTSTART;VALUE=DATE:' + dateValue(P.DOOMSDAY));
    L.push('DTEND;VALUE=DATE:' + dateValue(P.addDays(P.DOOMSDAY, 1)));
    L.push('SUMMARY:🎬 AVENGERS: DOOMSDAY — bioskop');
    L.push('DESCRIPTION:' + esc('Cilj maratona. Karte na vreme.'));
    L.push('BEGIN:VALARM');
    L.push('ACTION:DISPLAY');
    L.push('TRIGGER;RELATED=START:-P7D');
    L.push('DESCRIPTION:' + esc('Doomsday za nedelju dana — kupi karte.'));
    L.push('END:VALARM');
    L.push('END:VEVENT');

    L.push('END:VCALENDAR');
    return L.join('\r\n') + '\r\n';
  }

  function download(items, state, plan) {
    var text = build(items, state, plan);
    var blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'marvel-maraton.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  MM.ICS = { build: build, download: download };
})();
