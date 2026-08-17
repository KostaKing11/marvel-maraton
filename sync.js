/* ============================================================
   sync.js  -  stanje korisnika + offline-first sinhronizacija
   ------------------------------------------------------------
   Model:
     - Sve se PRVO pise u localStorage, pa (ako ima neta i koda)
       u Firestore: kolekcija "users", doc id = syncCode.
     - Na startu citamo oba i uzimamo ono sa vecim updatedAt
       (last-write-wins).
     - onSnapshot listener: promena sa laptopa stize na telefon
       bez refresha.
     - Bez Firebase-a sve radi normalno, samo lokalno.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var LS_STATE = 'mm-state-v1';
  var LS_CODE  = 'mm-sync-code';

  function defaultState() {
    return {
      watched: {},          // "iron-man": true  |  "loki-s1": [1,2,3]
      links: {},            // "iron-man": "https://..."
      platforms: {},        // "iron-man": "netflix"
      capacity: {},         // "12": 4  (sati za tu nedelju)
      defaultCapacity: 10,  // sati/nedeljno
      plans: ['must', 'good', 'skip', 'bonus'],
      log: {},              // "iron-man" | "loki-s1#3"  ->  {w: nedelja, d: "2026-08-17"}
      skipDays: {},         // "2026-08-17": true  ("nemam vremena danas")
      updatedAt: 0
    };
  }

  var state = defaultState();
  var listeners = [];
  var statusListeners = [];

  // Firebase runtime (lazy)
  var fb = null;            // {app, db, doc, setDoc, getDoc, onSnapshot}
  var docRef = null;
  var unsubscribe = null;
  var pushTimer = null;
  var lastPushedAt = 0;
  var status = 'local';     // local | connecting | online | offline | error
  var statusNote = '';

  /* ---------------- localStorage ---------------- */

  function loadLocal() {
    try {
      var raw = localStorage.getItem(LS_STATE);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      return normalize(obj);
    } catch (e) {
      console.warn('[sync] localStorage nije citljiv:', e);
      return null;
    }
  }

  function saveLocal() {
    try {
      localStorage.setItem(LS_STATE, JSON.stringify(state));
    } catch (e) {
      console.warn('[sync] localStorage nije upisiv:', e);
    }
  }

  // Popuni polja koja fale (npr. stanje snimljeno starijom verzijom app-a)
  function normalize(obj) {
    var d = defaultState();
    if (!obj || typeof obj !== 'object') return d;
    Object.keys(d).forEach(function (k) {
      if (obj[k] === undefined || obj[k] === null) obj[k] = d[k];
    });
    if (!Array.isArray(obj.plans) || !obj.plans.length) obj.plans = d.plans;
    if (typeof obj.defaultCapacity !== 'number') obj.defaultCapacity = d.defaultCapacity;
    if (typeof obj.updatedAt !== 'number') obj.updatedAt = 0;
    return obj;
  }

  /* ---------------- obavestavanje UI-a ---------------- */

  function notify() { listeners.forEach(function (f) { try { f(state); } catch (e) { console.error(e); } }); }
  function setStatus(s, note) {
    status = s; statusNote = note || '';
    statusListeners.forEach(function (f) { try { f(status, statusNote); } catch (e) { console.error(e); } });
  }

  /* ---------------- Firestore ---------------- */

  function configLooksReal() {
    var c = window.FIREBASE_CONFIG;
    if (!c || !c.projectId) return false;
    return String(c.projectId).indexOf('REPLACE_ME') === -1 &&
           String(c.apiKey || '').indexOf('REPLACE_ME') === -1;
  }

  async function loadFirebase() {
    if (fb) return fb;
    var appMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    var fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    var app = appMod.initializeApp(window.FIREBASE_CONFIG);
    var db = fsMod.getFirestore(app);
    fb = { app: app, db: db, doc: fsMod.doc, setDoc: fsMod.setDoc, getDoc: fsMod.getDoc, onSnapshot: fsMod.onSnapshot };
    return fb;
  }

  /**
   * Firestore SDK ne baca gresku ako baza NIJE napravljena u projektu -
   * samo tiho pokusava iznova i zahtev visi. Bez ovoga app zauvek stoji
   * na "povezujem...". Zato svaki poziv dobija rok.
   */
  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () {
          var e = new Error('timeout');
          e.code = 'mm/timeout';
          reject(e);
        }, ms);
      })
    ]);
  }

  async function connect(code) {
    code = (code || '').trim().toLowerCase();
    if (!code) return;
    localStorage.setItem(LS_CODE, code);

    if (!configLooksReal()) {
      setStatus('local', 'Firebase config nije popunjen - radi se samo lokalno.');
      return;
    }
    if (!navigator.onLine) {
      setStatus('offline', 'offline - sinhronizovace se');
      return;
    }

    setStatus('connecting');
    try {
      var f = await loadFirebase();
      if (unsubscribe) { unsubscribe(); unsubscribe = null; }
      docRef = f.doc(f.db, 'users', code);

      // 1) Prvo citanje: uzmi ono sto ima veci updatedAt.
      var snap = await withTimeout(f.getDoc(docRef), 12000);
      if (snap.exists()) {
        var remote = normalize(snap.data());
        if ((remote.updatedAt || 0) > (state.updatedAt || 0)) {
          state = remote;
          saveLocal();
          notify();
        } else if ((state.updatedAt || 0) > (remote.updatedAt || 0)) {
          await push();
        }
      } else {
        await push(); // prvi put na ovom kodu
      }

      // 2) Realtime listener
      unsubscribe = f.onSnapshot(docRef, function (s) {
        if (!s.exists()) return;
        var r = normalize(s.data());
        if ((r.updatedAt || 0) > (state.updatedAt || 0) && (r.updatedAt || 0) !== lastPushedAt) {
          state = r;
          saveLocal();
          notify();
        }
      }, function (err) {
        console.warn('[sync] listener greska:', err);
        setStatus('error', explain(err));
      });

      setStatus('online');
    } catch (e) {
      console.warn('[sync] connect pao:', e);
      setStatus('error', explain(e));
    }
  }

  /** Prevodi Firestore greske u nesto sto se moze procitati i popraviti. */
  function explain(e) {
    var code = (e && e.code) || '';
    if (code === 'mm/timeout') return 'Firestore ne odgovara — da li si napravio Firestore bazu u projektu?';
    if (code === 'permission-denied') return 'Firestore odbija upis — nalepi pravila iz README-a (Rules → Publish).';
    if (code === 'unavailable') return 'Firestore nedostupan — proveri internet.';
    if (code === 'not-found') return 'Baza ne postoji u projektu — Build → Firestore Database → Create database.';
    return (e && e.message) ? e.message : 'greska';
  }

  async function push() {
    if (!docRef || !fb) return;
    if (!navigator.onLine) { setStatus('offline', 'offline - sinhronizovace se'); return; }
    try {
      lastPushedAt = state.updatedAt;
      await withTimeout(fb.setDoc(docRef, JSON.parse(JSON.stringify(state))), 12000);
      setStatus('online');
    } catch (e) {
      console.warn('[sync] push pao:', e);
      setStatus('error', explain(e));
    }
  }

  function schedulePush() {
    if (!docRef) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 800); // debounce - ne pisi na svaki klik
  }

  /* ---------------- javni API ---------------- */

  var Store = {
    get: function () { return state; },

    /** Jedina dozvoljena izmena stanja. fn(state) menja objekat na licu mesta. */
    mutate: function (fn) {
      fn(state);
      state.updatedAt = Date.now();
      saveLocal();
      notify();
      schedulePush();
    },

    replace: function (next) {
      state = normalize(next);
      state.updatedAt = Date.now();
      saveLocal();
      notify();
      schedulePush();
    },

    onChange: function (fn) { listeners.push(fn); },
    onStatus: function (fn) { statusListeners.push(fn); fn(status, statusNote); },
    status: function () { return status; },
    statusNote: function () { return statusNote; },

    code: function () { return localStorage.getItem(LS_CODE) || ''; },
    hasSeenOnboarding: function () { return localStorage.getItem('mm-onboarded') === '1'; },
    markOnboarded: function () { localStorage.setItem('mm-onboarded', '1'); },

    connect: connect,
    syncNow: function () {
      var c = Store.code();
      if (!c) return Promise.resolve();
      if (!docRef) return connect(c);
      return push();
    },
    disconnect: function () {
      if (unsubscribe) { unsubscribe(); unsubscribe = null; }
      docRef = null;
      localStorage.removeItem(LS_CODE);
      setStatus('local', '');
    },

    exportJSON: function () { return JSON.stringify(state, null, 2); },
    importJSON: function (text) {
      var obj = JSON.parse(text);
      Store.replace(obj);
    },

    reset: function () {
      state = defaultState();
      state.updatedAt = Date.now();
      saveLocal();
      notify();
      schedulePush();
    },

    /** Pozvati jednom, na startu. */
    init: function () {
      var local = loadLocal();
      if (local) state = local;
      var code = Store.code();
      if (code) connect(code);
      else setStatus('local', '');

      window.addEventListener('online', function () {
        if (Store.code()) { setStatus('connecting'); connect(Store.code()); }
      });
      window.addEventListener('offline', function () {
        if (Store.code()) setStatus('offline', 'offline - sinhronizovace se');
      });
    }
  };

  MM.Store = Store;
})();
