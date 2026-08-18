/* ============================================================
   reviews.js  -  zajednicke ocene i kratki utisci
   ------------------------------------------------------------
   Model: kolekcija "reviews", doc id = "<itemId>__<syncCode>".
   Jedan korisnik = jedna ocena po naslovu (ponovno slanje je menja).
   Svi koji imaju app citaju sve ocene - to je i poenta taba "Ocene".

   Iskreno o zastiti: nema naloga, pa je "autor" samo tvoj sync kod.
   Ko zna tudji kod moze da pise u njegovo ime. Za ocene filmova to
   je prihvatljivo; ne stavljaj nista licno u tekst.

   Bez Firebase-a ovaj deo je jednostavno prazan - app radi normalno.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var fb = null;
  var cache = [];          // poslednje ucitane ocene
  var loadedAt = 0;

  async function load() {
    var f = await MM.Store.firestore();
    if (!f) return [];
    fb = f;
    var q = f.query(
      f.collection(f.db, 'reviews'),
      f.orderBy('at', 'desc'),
      f.limit(80)
    );
    var snap = await f.getDocs(q);
    cache = [];
    snap.forEach(function (d) { cache.push(d.data()); });
    loadedAt = Date.now();
    return cache;
  }

  async function save(itemId, stars, text) {
    var f = await MM.Store.firestore();
    if (!f) throw new Error('offline');
    var code = MM.Store.code();
    if (!code) throw new Error('nema koda');
    var rec = {
      itemId: String(itemId),
      code: code,
      name: (MM.Store.get().displayName || 'Anonimno').slice(0, 24),
      stars: Math.max(1, Math.min(5, parseInt(stars, 10) || 0)),
      text: String(text || '').slice(0, 500),
      at: Date.now()
    };
    await f.setDoc(f.doc(f.db, 'reviews', rec.itemId + '__' + rec.code), rec);
    // ubaci lokalno da se odmah vidi, bez ponovnog citanja
    cache = cache.filter(function (r) { return !(r.itemId === rec.itemId && r.code === rec.code); });
    cache.unshift(rec);
    return rec;
  }

  function cached() { return cache; }
  function forItem(id) { return cache.filter(function (r) { return r.itemId === id; }); }
  function mine(id) {
    var code = MM.Store.code();
    return cache.filter(function (r) { return r.itemId === id && r.code === code; })[0] || null;
  }
  function avg(id) {
    var rs = forItem(id);
    if (!rs.length) return null;
    var sum = rs.reduce(function (a, r) { return a + (r.stars || 0); }, 0);
    return Math.round(sum / rs.length * 10) / 10;
  }
  function isStale() { return Date.now() - loadedAt > 60000; }

  MM.Reviews = {
    load: load, save: save, cached: cached,
    forItem: forItem, mine: mine, avg: avg, isStale: isStale
  };
})();
