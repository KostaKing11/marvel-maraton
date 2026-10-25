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
    var uid = MM.Store.uid();
    if (!uid) throw new Error('nije prijavljen');
    var st = MM.Store.get();
    var rec = {
      itemId: String(itemId),
      uid: uid,
      name: (st.displayName || 'Bez imena').slice(0, 40),
      photo: /^data:/.test(st.avatar || '') ? '' : (st.avatar || '').slice(0, 400),
      stars: Math.max(1, Math.min(5, parseInt(stars, 10) || 0)),
      text: String(text || '').slice(0, 500),
      at: Date.now()
    };
    await f.setDoc(f.doc(f.db, 'reviews', rec.itemId + '__' + uid), rec);
    // ubaci lokalno da se odmah vidi, bez ponovnog citanja
    cache = cache.filter(function (r) { return !(r.itemId === rec.itemId && r.uid === uid); });
    cache.unshift(rec);
    return rec;
  }

  /* ---------------- ekipa ---------------- */

  var people = [];

  /** Svi koji su se prijavili, sortirani po tome dokle su stigli. */
  async function loadPeople() {
    var f = await MM.Store.firestore();
    if (!f || !MM.Store.uid()) return [];
    var snap = await f.getDocs(f.query(
      f.collection(f.db, 'profiles'), f.orderBy('percent', 'desc'), f.limit(50)
    ));
    people = [];
    snap.forEach(function (d) { people.push(d.data()); });
    return people;
  }
  function cachedPeople() { return people; }

  /* ---------------- poruke ekipi ---------------- */

  /**
   * Jedna zajednicka kolekcija "notices". Svako prijavljen moze da
   * objavi poruku, svi je vide pri sledecem otvaranju aplikacije.
   * Ovo NIJE push - stize tek kad covek otvori app, jer bez servera
   * telefon ne moze da primi poruku dok je app zatvoren.
   */
  async function latestNotice() {
    var f = await MM.Store.firestore();
    if (!f || !MM.Store.uid()) return null;
    var snap = await f.getDocs(f.query(
      f.collection(f.db, 'notices'), f.orderBy('at', 'desc'), f.limit(1)
    ));
    var out = null;
    snap.forEach(function (d) { out = d.data(); });
    return out;
  }

  async function postNotice(text) {
    var f = await MM.Store.firestore();
    var uid = MM.Store.uid();
    if (!f || !uid) throw new Error('nije prijavljen');
    var rec = {
      uid: uid,
      from: (MM.Store.get().displayName || 'Bez imena').slice(0, 40),
      text: String(text || '').slice(0, 300),
      at: Date.now()
    };
    await f.setDoc(f.doc(f.db, 'notices', String(rec.at) + '__' + uid), rec);
    return rec;
  }

  /** Obrisi svoju ocenu. Pravila dozvoljavaju brisanje samo svoje. */
  async function remove(itemId) {
    var f = await MM.Store.firestore();
    var uid = MM.Store.uid();
    if (!f || !uid) throw new Error('nije prijavljen');
    await f.deleteDoc(f.doc(f.db, 'reviews', String(itemId) + '__' + uid));
    cache = cache.filter(function (r) { return !(r.itemId === itemId && r.uid === uid); });
  }

  function cached() { return cache; }
  function forItem(id) { return cache.filter(function (r) { return r.itemId === id; }); }
  function mine(id) {
    var uid = MM.Store.uid();
    return cache.filter(function (r) { return r.itemId === id && r.uid === uid; })[0] || null;
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
    forItem: forItem, mine: mine, avg: avg, isStale: isStale,
    loadPeople: loadPeople, people: cachedPeople, remove: remove,
    latestNotice: latestNotice, postNotice: postNotice
  };
})();
