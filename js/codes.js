/* ============================================================
   codes.js  -  kodovi za nagrade (redeem)
   ------------------------------------------------------------
   Kodove pravi samo Kosta (ADMIN nalog), svi ostali ih unose u
   profilu (Ja -> Kod za nagradu). Kodovi su u Firestore kolekciji
   "codes", id dokumenta = kod (npr. MM-K7Q2-XP4D):
     { r: nagrada, max: koliko ljudi (0 = neograniceno), used: broj,
       usedBy: { uid: vreme }, by: uid, at: vreme, note }
   Nagrade (r): { t: 'stanlee' | 'strip' | 'coins' | 'keys' | 'htok' | 'btok' | 'box' | 'pack', n }
   Pravila za Firestore: docs/firestore-kodovi.md
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var ADMIN = 'kostabogdanic@gmail.com';
  var TYPES = [
    { t: 'stanlee', name: 'Stan Lee (tajni junak)', n: false },
    { t: 'strip', name: 'Strip (tajni board)', n: false },
    { t: 'pack', name: 'Excelsior paket: Stan Lee + Strip + 3 kutije', n: false },
    { t: 'box', name: 'Misteriozne kutije', n: 3 },
    { t: 'coins', name: 'Novčići', n: 1000 },
    { t: 'keys', name: 'Ključevi', n: 3 },
    { t: 'htok', name: 'Tokeni junaka', n: 20 },
    { t: 'btok', name: 'Board tokeni', n: 20 }
  ];

  function isAdmin() { var u = MM.Store.user(); return !!(u && u.email && u.email.toLowerCase() === ADMIN); }
  function clean(code) { return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function pretty(c) { c = clean(c); return c.length === 10 && c.indexOf('MM') === 0 ? 'MM-' + c.slice(2, 6) + '-' + c.slice(6) : c; }
  function label(r) {
    var ty = TYPES.filter(function (x) { return x.t === r.t; })[0];
    return (r.n ? r.n + ' × ' : '') + (ty ? ty.name : r.t);
  }

  function newCode() {
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = 'MM';    // bez 0/O i 1/I, da se ne mesaju
    var rnd = new Uint32Array(8); (window.crypto || window.msCrypto).getRandomValues(rnd);
    for (var i = 0; i < 8; i++) out += A[rnd[i] % A.length];
    return out;
  }

  /** Kosta pravi kod. reward = { t, n }, max = broj ljudi (0 = svi). */
  async function generate(reward, max, note) {
    if (!isAdmin()) throw new Error('Samo admin pravi kodove.');
    var f = await MM.Store.firestore(); if (!f) throw new Error('Nema veze sa bazom.');
    var code = newCode();
    await f.setDoc(f.doc(f.db, 'codes', code), {
      r: reward, max: max | 0, used: 0, usedBy: {}, by: MM.Store.uid(), at: Date.now(), note: String(note || '').slice(0, 60)
    });
    return pretty(code);
  }

  /** Kodovi koje je Kosta napravio (najnoviji prvi). */
  async function list() {
    var f = await MM.Store.firestore(); if (!f || !isAdmin()) return [];
    var snap = await f.getDocs(f.query(f.collection(f.db, 'codes'), f.where('by', '==', MM.Store.uid())));
    var out = [];
    snap.forEach(function (d) { var x = d.data(); x.code = pretty(d.id); out.push(x); });
    out.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    return out;
  }

  async function remove(code) {
    var f = await MM.Store.firestore(); if (!f || !isAdmin()) return;
    await f.deleteDoc(f.doc(f.db, 'codes', clean(code)));
  }

  /** Iskoristi kod. Vraca { ok, msg, reward }. Nagradu dodaje MM.Runner.grant(). */
  async function redeem(input) {
    var code = clean(input);
    if (code.length < 6) return { ok: false, msg: 'Unesi kod.' };
    if (!MM.Store.uid()) return { ok: false, msg: 'Prijavi se Google nalogom da bi iskoristio kod.' };
    var f = await MM.Store.firestore(); if (!f) return { ok: false, msg: 'Nema veze sa bazom.' };
    var ref = f.doc(f.db, 'codes', code), snap;
    try { snap = await f.getDoc(ref); } catch (e) { return { ok: false, msg: 'Ne mogu da proverim kod (internet ili pravila baze).' }; }
    if (!snap.exists()) return { ok: false, msg: 'Taj kod ne postoji.' };
    var d = snap.data(), uid = MM.Store.uid();
    if (d.usedBy && d.usedBy[uid]) return { ok: false, msg: 'Već si iskoristio ovaj kod.' };
    if (d.max && (d.used | 0) >= d.max) return { ok: false, msg: 'Kod je potrošen.' };
    var upd = { used: f.increment(1) }; upd['usedBy.' + uid] = Date.now();
    try { await f.updateDoc(ref, upd); } catch (e) { return { ok: false, msg: 'Kod nije prihvaćen (možda je upravo potrošen).' }; }
    var got = MM.Runner.grant(d.r);
    MM.Store.mutate(function (s) { s.codes = s.codes || {}; s.codes[code] = Date.now(); });
    return { ok: true, msg: got, reward: d.r };
  }

  MM.Codes = { isAdmin: isAdmin, generate: generate, list: list, remove: remove, redeem: redeem, TYPES: TYPES, label: label, pretty: pretty };
})();
