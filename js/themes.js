/* ============================================================
   themes.js  -  teme boja (idu uz tamni stil)
   ------------------------------------------------------------
   Svaka tema menja pozadinu i glavnu boju (CSS: body[data-th]).
   Otkljucavaju se gledanjem i igrom. Prva je uvek otkljucana.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  function done(s, ids) { return ids.filter(function (id) { var it = MM.Cat.get(id); return it && MM.Plan.isDone(it, s); }).length; }
  function films(ids, what) {
    return { need: ids.length, have: function (s) { return done(s, ids); }, how: 'Odgledaj ' + what };
  }

  var LIST = [
    { id: 'avengers', name: 'Avengers', c1: '#e62429', c2: '#111116', req: null },
    { id: 'wakanda', name: 'Wakanda', c1: '#9b5cff', c2: '#140d1f', req: films(['black-panther', 'wakanda-forever'], 'Black Panther i Wakanda Forever') },
    { id: 'asgard', name: 'Asgard', c1: '#e9b44c', c2: '#0e1424', req: films(['thor', 'thor-dark-world', 'thor-ragnarok', 'love-and-thunder'], 'sva četiri Thor filma') },
    { id: 'kosmos', name: 'Kosmos', c1: '#3b82f6', c2: '#0b1022', req: films(['captain-marvel', 'the-marvels'], 'Captain Marvel i The Marvels') },
    { id: 'okean', name: 'Talokan', c1: '#14c8c2', c2: '#06171a', req: { need: 30, have: function (s) { return Object.keys(MM.Badges.doneMap(s)).length; }, how: 'Odgledaj 30 naslova' } },
    { id: 'gama', name: 'Gama', c1: '#7ed321', c2: '#0b150a', req: { need: 3, have: function (s) { return MM.Quiz ? MM.Quiz.stats(s).perfect : 0; }, how: 'Uradi 3 kviza posle filma bez greške' } },
    { id: 'multi', name: 'Multiverzum', c1: '#ff3d8b', c2: '#160a1a', req: { need: 1, have: function (s) { return Math.max((s.runner && s.runner.bwins) | 0, done(s, ['into-the-spider-verse', 'across-the-spider-verse']) >= 2 ? 1 : 0); }, how: 'Pobedi u Borbi sa ekipom (ili odgledaj oba Spider-Verse filma)' } },
    { id: 'doom', name: 'Doomsday', c1: '#2fd27a', c2: '#06100a', req: films(['avengers-doomsday'], 'Avengers: Doomsday u bioskopu') }
  ];

  function byId(id) { return LIST.filter(function (t) { return t.id === id; })[0] || LIST[0]; }
  function isOpen(t, s) { return !t.req || t.req.have(s) >= t.req.need; }
  function unlocked(s) { return LIST.filter(function (t) { return isOpen(t, s); }).map(function (t) { return t.id; }); }
  /** Aktivna tema (ako je izabrana zakljucana, vraca prvu). */
  function current(s) { var t = byId(s.theme); return isOpen(t, s) ? t : LIST[0]; }

  MM.Themes = { LIST: LIST, byId: byId, isOpen: isOpen, unlocked: unlocked, current: current };
})();
