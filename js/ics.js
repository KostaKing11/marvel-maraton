/* ============================================================
   ics.js  -  izvoz plana u .ics (iCalendar)
   ------------------------------------------------------------
   Svaki dan plana = JEDAN celodnevni event.
   Naslov: "🎬 Loki · S2 ep 3–4 + Thunderbolts* (2h 40m)"
   Opis:   lista sa trajanjem + tvoji linkovi.
   VALARM: 19:00 istog dana; Doomsday ima podsetnik 7 dana ranije.

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

  function dateOf(isoStr) { return isoStr.replace(/-/g, ''); }
  function nextDay(isoStr) { return MM.Plan.addDays(isoStr, 1); }

  /**
   * Jedan celodnevni dogadjaj po danu plana: sta je na redu, koliko traje,
   * tvoji linkovi. Podsetnik u 19h istog dana. UID je vezan za datum, pa
   * ponovni uvoz menja postojece dogadjaje umesto da pravi duplikate.
   */
  function build(plan, state) {
    var Cat = MM.Cat, P = MM.Plan, UI = MM.UI;
    var now = new Date();
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Marvel Maraton//Doomsday//SR', 'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH', 'X-WR-CALNAME:Marvel Maraton'];

    plan.days.slice(0, 180).forEach(function (d) {
      if (!d.units.length) return;
      var groups = P.group(d.units);
      var titles = groups.map(function (g) { return Cat.cleanTitle(g.item) + (g.epLabel ? ' ' + g.epLabel : ''); });
      var desc = ['Ukupno: ' + UI.hm(d.minutes), ''];
      groups.forEach(function (g) {
        var line = '• ' + Cat.cleanTitle(g.item) + (g.epLabel ? ' ' + g.epLabel : '') + ' (' + UI.hm(g.min) + ')';
        var link = state.links && state.links[g.id];
        if (link) line += ' → ' + link;
        desc.push(line);
      });
      desc.push('', 'Marvel Maraton · do Doomsdaya ' + Math.max(0, P.daysBetween(d.iso, P.DOOMSDAY_ISO)) + ' dana');
      L.push('BEGIN:VEVENT');
      L.push('UID:mm-dan-' + dateOf(d.iso) + '@marvel-maraton');
      L.push('DTSTAMP:' + stampUTC(now));
      L.push('DTSTART;VALUE=DATE:' + dateOf(d.iso));
      L.push('DTEND;VALUE=DATE:' + dateOf(nextDay(d.iso)));
      L.push(fold('SUMMARY:' + esc('🎬 ' + titles.join(' + ') + ' (' + UI.hm(d.minutes) + ')')));
      L.push(fold('DESCRIPTION:' + esc(desc.join('\n'))));
      L.push('TRANSP:TRANSPARENT');
      L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER;RELATED=START:PT19H');
      L.push(fold('DESCRIPTION:' + esc('Večeras: ' + titles.join(' + '))));
      L.push('END:VALARM', 'END:VEVENT');
    });

    L.push('BEGIN:VEVENT', 'UID:mcu-doomsday@marvel-maraton', 'DTSTAMP:' + stampUTC(now),
      'DTSTART;VALUE=DATE:' + dateOf(P.DOOMSDAY_ISO), 'DTEND;VALUE=DATE:' + dateOf(nextDay(P.DOOMSDAY_ISO)),
      fold('SUMMARY:' + esc('🎬 AVENGERS: DOOMSDAY — bioskop')),
      fold('DESCRIPTION:' + esc('Cilj maratona. Kupi karte na vreme.')),
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER;RELATED=START:-P7D',
      fold('DESCRIPTION:' + esc('Doomsday za nedelju dana — kupi karte.')), 'END:VALARM', 'END:VEVENT');

    L.push('END:VCALENDAR');
    return L.join('\r\n') + '\r\n';
  }

  function download(plan, state) {
    var blob = new Blob([build(plan, state)], { type: 'text/calendar;charset=utf-8' });
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
