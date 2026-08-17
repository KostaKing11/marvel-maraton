/* ============================================================
   posters.js  -  automatsko povlacenje postera sa interneta
   ------------------------------------------------------------
   Isti pristup kao u Kostaflix-Manageru, samo iz browsera:
     - SERIJE : TVMaze  (api.tvmaze.com) - velike slike, bez kljuca
     - FILMOVI: Wikipedia pageimages sa `pilicense=any`
                (bez tog parametra Wikipedia vraca SAMO slobodne
                 slike, a filmski posteri su non-free -> null)
   Oba servisa salju CORS zaglavlja, pa rade direktno sa GitHub Pages.

   Rezultat se pamti u state.posters (localStorage + Firestore), pa se
   svaki naslov trazi jednom - telefon posle samo procita URL.
   Prazan string = "trazio sam i nisam nasao", da ne pokusavamo stalno.
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var running = false;

  /** Naslov ociscen za pretragu: "Loki (Sezona 2)" -> "Loki". */
  function searchTitle(item) {
    return item.title
      .replace(/\s*\(Sezona\s*\d+\)/i, '')
      .replace(/\*/g, '')
      .trim();
  }

  /** TVMaze - najbolji izvor za serije (slike su ~1000x1500). */
  async function fromTVMaze(title) {
    var r = await fetch('https://api.tvmaze.com/singlesearch/shows?q=' + encodeURIComponent(title));
    if (!r.ok) return null;                       // 404 = nema takve serije
    var s = await r.json();
    return (s && s.image && (s.image.original || s.image.medium)) || null;
  }

  /**
   * Wikipedia - `pilicense=any` je kljucni parametar, bez njega nema postera.
   * `origin=*` je obavezan da bi CORS prosao iz browsera.
   */
  async function fromWikipedia(term) {
    var u = 'https://en.wikipedia.org/w/api.php?action=query&generator=search' +
      '&gsrsearch=' + encodeURIComponent(term) +
      '&gsrlimit=1&prop=pageimages&pithumbsize=800&pilicense=any&format=json&origin=*';
    var r = await fetch(u);
    if (!r.ok) return null;
    var j = await r.json();
    var pages = j && j.query && j.query.pages;
    if (!pages) return null;
    var p = Object.keys(pages).map(function (k) { return pages[k]; })[0];
    var src = p && p.thumbnail && p.thumbnail.source;
    if (!src) return null;
    // Skini utm_* parametre koje Wikipedia lepi na URL - slika radi i bez njih.
    return src.split('?')[0];
  }

  /** Nadji poster za jedan naslov. Vraca URL ili '' ako nije nasao. */
  async function findOne(item) {
    var t = searchTitle(item);
    try {
      if (item.type === 'serija') {
        var tv = await fromTVMaze(t);
        if (tv) return tv;
        return (await fromWikipedia(t + ' TV series')) || '';
      }
      var kind = item.type === 'special' ? ' TV special' : ' film';
      var w = await fromWikipedia(t + ' ' + item.year + kind);
      if (w) return w;
      // Drugi pokusaj bez godine - pomaze za naslove koje Wikipedia vodi drugacije.
      return (await fromWikipedia(t + kind)) || '';
    } catch (e) {
      console.warn('[posters] ' + item.id + ':', e);
      return null;                                 // null = greska, probaj opet kasnije
    }
  }

  /**
   * Poster koji app treba da prikaze, po prioritetu:
   *   1. korisnikov rucno unet URL (state.myPosters)
   *   2. poster iz data.json (ako ga neko popuni)
   *   3. automatski nadjen (state.posters)
   */
  function urlFor(item, state) {
    var mine = state.myPosters && state.myPosters[item.id];
    if (mine) return mine;
    if (item.poster) return item.poster;
    var auto = state.posters && state.posters[item.id];
    return auto || '';
  }

  /** Koliko naslova jos nema poster (i nije vec bezuspesno trazeno). */
  function missing(items, state, includeFailed) {
    return items.filter(function (i) {
      if ((state.myPosters && state.myPosters[i.id]) || i.poster) return false;
      var a = state.posters ? state.posters[i.id] : undefined;
      if (a) return false;                          // vec nadjen
      if (a === '' && !includeFailed) return false; // trazeno, nije nadjeno
      return true;
    });
  }

  /**
   * Trazi postere za sve kojima fale. Upisuje u stanje u serijama
   * (po 6 komada) da ne bombardujemo Firestore jednim upisom po posteru.
   * @param {function} onProgress (gotovo, ukupno)
   */
  async function fetchMissing(items, state, Store, onProgress, includeFailed) {
    if (running) return;
    running = true;
    var todo = missing(items, state, includeFailed);
    var total = todo.length, done = 0, batch = {};

    function commit() {
      if (!Object.keys(batch).length) return;
      var b = batch; batch = {};
      Store.mutate(function (s) {
        s.posters = s.posters || {};
        Object.keys(b).forEach(function (k) { s.posters[k] = b[k]; });
      });
    }

    try {
      for (var i = 0; i < todo.length; i++) {
        var res = await findOne(todo[i]);
        if (res !== null) batch[todo[i].id] = res;
        done++;
        if (onProgress) onProgress(done, total);
        if (Object.keys(batch).length >= 6) commit();
        await new Promise(function (r) { setTimeout(r, 120); }); // budi pristojan prema API-ju
      }
    } finally {
      commit();
      running = false;
      if (onProgress) onProgress(done, total, true);
    }
  }

  MM.Posters = {
    urlFor: urlFor,
    missing: missing,
    findOne: findOne,
    fetchMissing: fetchMissing,
    isRunning: function () { return running; }
  };
})();
