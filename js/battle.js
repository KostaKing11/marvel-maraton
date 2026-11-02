/* ============================================================
   battle.js  -  Borba sa ekipom (Marvel Runner)
   ------------------------------------------------------------
   Neko napravi borbu (soba), ostali iz ekipe udju, onaj ko je
   napravio je pokrece. Svi trce ISTU stazu (isto seme), bez
   novcica i bez moci likova. Pobedjuje ko poslednji ostane ziv.

   Firestore:
     battles/{id}            { host, hostName, state: lobby|run|done|closed, seed, at, startAt }
     battles/{id}/players/{uid} { name, hero, alive, dist, score, at }
   Pravila: firestore.rules (objavljuju se sama na push).
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var STALE = 9000;         // igrac bez javljanja duze od ovoga = ispao
  function fs() { return MM.Store.firestore(); }
  function me() { var s = MM.Store.get(); return { uid: MM.Store.uid(), name: (s.displayName || 'Bez imena').slice(0, 24), hero: s.runnerChar || 'agent' }; }

  /** Otvorene borbe (u cekaonici, ne starije od 30 min). cb(lista). Vraca funkciju za prekid. */
  function watchLobbies(cb) {
    var stop = function () {};
    fs().then(function (f) {
      if (!f) return cb([]);
      stop = f.onSnapshot(f.query(f.collection(f.db, 'battles'), f.where('state', '==', 'lobby')), function (snap) {
        var out = [], now = Date.now();
        snap.forEach(function (d) { var x = d.data(); x.id = d.id; if (now - (x.at || 0) < 30 * 60000) out.push(x); });
        out.sort(function (a, b) { return b.at - a.at; });
        cb(out);
      }, function () { cb([]); });
    });
    return function () { stop(); };
  }

  async function create() {
    var f = await fs(), m = me(); if (!f || !m.uid) throw new Error('login');
    var id = 'B' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await f.setDoc(f.doc(f.db, 'battles', id), { host: m.uid, hostName: m.name, state: 'lobby', seed: Math.floor(Math.random() * 4e9), at: Date.now() });
    await join(id);
    return id;
  }

  async function join(id) {
    var f = await fs(), m = me(); if (!f || !m.uid) throw new Error('login');
    await f.setDoc(f.doc(f.db, 'battles', id, 'players', m.uid), { name: m.name, hero: m.hero, alive: true, dist: 0, score: 0, at: Date.now() });
  }

  /** Prati sobu i igrace. cb({ room, players: [] }). Vraca funkciju za prekid. */
  function watch(id, cb) {
    var room = null, players = [], stops = [];
    function emit() { cb({ room: room, players: players.slice() }); }
    fs().then(function (f) {
      if (!f) return;
      stops.push(f.onSnapshot(f.doc(f.db, 'battles', id), function (d) { room = d.exists() ? Object.assign({ id: d.id }, d.data()) : null; emit(); }));
      stops.push(f.onSnapshot(f.collection(f.db, 'battles', id, 'players'), function (snap) {
        players = []; snap.forEach(function (d) { var x = d.data(); x.uid = d.id; players.push(x); }); emit();
      }));
    });
    return function () { stops.forEach(function (s) { s(); }); };
  }

  async function start(id) {
    var f = await fs(); if (!f) return;
    await f.updateDoc(f.doc(f.db, 'battles', id), { state: 'run', startAt: Date.now() });
  }
  async function report(id, data) {
    var f = await fs(), uid = MM.Store.uid(); if (!f || !uid) return;
    data.at = Date.now();
    try { await f.updateDoc(f.doc(f.db, 'battles', id, 'players', uid), data); } catch (e) { /* mreza */ }
  }
  async function leave(id, isHost) {
    var f = await fs(), uid = MM.Store.uid(); if (!f || !uid) return;
    try { await f.deleteDoc(f.doc(f.db, 'battles', id, 'players', uid)); } catch (e) {}
    if (isHost) { try { await f.updateDoc(f.doc(f.db, 'battles', id), { state: 'closed' }); } catch (e) {} }
  }
  async function finish(id) {
    var f = await fs(); if (!f) return;
    try { await f.updateDoc(f.doc(f.db, 'battles', id), { state: 'done' }); } catch (e) {}
  }

  /** Ziv = javio se skoro i nije pao. */
  function alive(p, now) { return p.alive && (now - (p.at || 0)) < STALE; }
  /** Poredak: zivi prvi (po daljini), pa pali po daljini. */
  function standings(players) {
    var now = Date.now();
    return players.slice().sort(function (a, b) {
      var A = alive(a, now) ? 1 : 0, B = alive(b, now) ? 1 : 0;
      return B - A || (b.dist || 0) - (a.dist || 0);
    }).map(function (p) { return Object.assign({}, p, { live: alive(p, now) }); });
  }

  MM.Battle = { watchLobbies: watchLobbies, create: create, join: join, watch: watch, start: start, report: report, leave: leave, finish: finish, standings: standings };
})();
