/* ============================================================
   main.js  -  pokretanje, akcije, gestovi
   ------------------------------------------------------------
   Tok: Store (stanje) -> Plan.build -> Views (HTML) -> UI.morph.
   Svaka promena stanja ide kroz Store.mutate, a crtanje je
   zakazano za sledeci frejm - vise promena = jedno crtanje.
   ============================================================ */
window.MM = window.MM || {};
MM.VERSION = '2.3.0';

(function () {
  'use strict';

  var UI = MM.UI, Cat = MM.Cat, P = MM.Plan, Store = MM.Store, V = MM.Views;
  var $ = UI.$, esc = UI.esc;
  var NEWS_ID = '2.0-rebuild';
  var TABS = ['danas', 'plan', 'ekipa', 'katalog', 'ja'];

  var UIS = {
    tab: 'danas',
    lib: { q: '', col: 'all', tier: 'all', status: 'all', sort: 'order', sel: {}, selecting: false },
    rev: { who: 'all', sort: 'new' },
    prevTab: 'danas',
    cal: { view: 'mesec', month: P.today().slice(0, 7), sel: P.today() },
    rate: { id: null, stars: 0, text: '' },
    custom: null,
    itemSrc: 'plan',
    posterJob: '',
    reviewsLoading: false
  };
  var syncStatus = 'local', syncNote = '';
  var started = false;

  function state() { return Store.get(); }

  function syncText() {
    return ({ local: 'samo na ovom uređaju', connecting: 'povezujem…', online: 'sinhronizovano', offline: 'offline — sinhronizovaće se',
      error: 'greška: ' + syncNote })[syncStatus] || syncStatus;
  }

  function ctx() {
    var s = state();
    return {
      s: s, plan: P.build(s), prog: P.progress(s), streak: P.streak(s), logByDay: P.logByDay(s),
      ui: UIS, user: Store.user(), syncStatus: syncStatus, syncText: syncText()
    };
  }

  /* ============================================================
     crtanje
     ============================================================ */

  var raf = 0;
  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; render(); });
  }

  var VIEW = { danas: 'danas', plan: 'plan', ekipa: 'ekipa', katalog: 'katalog', ja: 'ja' };

  function render() {
    if (!started) return;
    var c = ctx();
    var pane = $('#p-' + UIS.tab);
    try {
      UI.morph(pane, MM.Views[VIEW[UIS.tab]](c));
    } catch (e) {
      console.error(e);
      pane.innerHTML = '<section class="card"><h2>Ups</h2><p class="muted">Nešto je puklo pri crtanju. Probaj ponovo.</p>' +
        '<pre class="err">' + esc(e && e.stack || e) + '</pre></section>';
    }
    UI.refreshSheets();
    pill();
    document.body.classList.toggle('selecting', UIS.tab === 'katalog' && UIS.lib.selecting);
  }

  /** Gore desno: tvoja slika (ili prvo slovo). Tap = profil i podesavanja. */
  var pillKey = '';
  function pill() {
    var s = state(), u = Store.user();
    var el = $('#me-av');
    var warn = u && (syncStatus === 'error' || syncStatus === 'offline');
    el.className = 'me-av' + (UIS.tab === 'ja' ? ' on' : '') + (warn ? ' warn' : '');
    var key = (s.avatar || '') + '|' + (s.displayName || '') + '|' + !!u;
    if (key === pillKey) return;
    pillKey = key;
    el.innerHTML = s.avatar
      ? '<img src="' + esc(s.avatar) + '" alt="" referrerpolicy="no-referrer" draggable="false" onerror="this.remove()">'
      : (s.displayName ? '<b>' + esc(s.displayName.slice(0, 1).toUpperCase()) + '</b>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 5.5V21h18v-1.5c0-3-4-5.5-9-5.5z"/></svg>');
  }

  // Android "nazad": sa bilo kog taba vraca na Danas, sa Danas izlazi.
  // Zato u istoriji postoji najvise JEDAN unos za tabove.
  var tabPushed = false, popIgnore = 0;

  function setTab(t, scrollTo, fromPop) {
    if (TABS.indexOf(t) === -1) t = 'danas';
    var same = UIS.tab === t;
    if (t === 'ja' && UIS.tab !== 'ja') UIS.prevTab = UIS.tab;
    UIS.tab = t;
    document.body.classList.toggle('on-ja', t === 'ja');
    if (!fromPop) {
      if (t !== 'danas' && !tabPushed) { history.pushState({ mm: 'tab' }, ''); tabPushed = true; }
      else if (t === 'danas' && tabPushed) { tabPushed = false; popIgnore++; history.back(); }
    }
    UI.$all('.pane').forEach(function (p) { p.hidden = p.getAttribute('data-tab') !== t; });
    UI.$all('#tabs .tab').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === t); });
    render();
    var pane = $('#p-' + t);
    if (scrollTo) {
      var el = document.getElementById(scrollTo);
      if (el) setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
    } else if (same) {
      pane.scrollTo({ top: 0, behavior: 'smooth' });   // drugi tap na tab = na vrh
    }
    if (t === 'ekipa') loadReviews(false);
  }

  /* ============================================================
     oznacavanje
     ============================================================ */

  function legacyWeek(today) {
    return Math.max(1, Math.min(18, Math.floor(P.daysBetween(P.START_ISO, today) / 7) + 1));
  }

  /**
   * Oznaci/skini jedinice ("id" ili "id#3"). countToday = upisi u dnevnik
   * za danas (broji se u danasnju normu i niz). Iz kataloga se NE upisuje:
   * kad oznacis 20 filmova koje si davno gledao, to nije "danas".
   * Vraca funkciju koja sve vraca kako je bilo (za "Poništi").
   */
  function mark(keys, on, countToday) {
    var s = state();
    var snap = { watched: {}, log: {}, skipped: {} };
    keys.forEach(function (k) {
      var id = k.split('#')[0];
      if (!(id in snap.watched)) snap.watched[id] = s.watched[id] === undefined ? undefined : JSON.parse(JSON.stringify(s.watched[id]));
      snap.log[k] = s.log[k];
    });
    var today = P.today();
    var now = Date.now();
    Store.mutate(function (st) {
      keys.forEach(function (k) {
        var u = P.unitFromKey(k);
        if (!u) return;
        var id = u.id;
        if (u.ep) {
          var cur = st.watched[id];
          var arr = Array.isArray(cur) ? cur.slice() : (cur === true ? allEps(u.item) : []);
          var i = arr.indexOf(u.ep);
          if (on && i === -1) arr.push(u.ep);
          if (!on && i !== -1) arr.splice(i, 1);
          arr.sort(function (a, b) { return a - b; });
          if (arr.length) st.watched[id] = arr; else delete st.watched[id];
        } else {
          if (on) st.watched[id] = true; else delete st.watched[id];
        }
        if (on && countToday) st.log[k] = { w: legacyWeek(today), d: today, t: now };
        else delete st.log[k];
      });
      if (on) { st.lastWatchAt = now; if (!st.firstWatchAt) st.firstWatchAt = now; }
    });
    return function undo() {
      Store.mutate(function (st) {
        Object.keys(snap.watched).forEach(function (id) {
          if (snap.watched[id] === undefined) delete st.watched[id]; else st.watched[id] = snap.watched[id];
        });
        Object.keys(snap.log).forEach(function (k) {
          if (snap.log[k] === undefined) delete st.log[k]; else st.log[k] = snap.log[k];
        });
      });
    };
  }

  function allEps(item) { var a = []; for (var i = 1; i <= (item.episodes || 0); i++) a.push(i); return a; }
  function itemKeys(item) { return Cat.isSeries(item) ? allEps(item).map(function (e) { return item.id + '#' + e; }) : [item.id]; }

  function afterWatched(keys) {
    // ocena kad se zavrsi film ili cela sezona
    var ids = {};
    keys.forEach(function (k) { ids[k.split('#')[0]] = 1; });
    var s = state();
    var id = Object.keys(ids).filter(function (x) { return P.isDone(Cat.get(x), s); })[0];
    if (id && Store.uid() && !MM.Reviews.mine(id)) setTimeout(function () { rateBar(id); }, 500);
  }

  function labelOf(keys) {
    var u = P.unitFromKey(keys[0]);
    if (!u) return '';
    var t = Cat.cleanTitle(u.item);
    if (keys.length > 1 && u.ep) return t + ' ' + P.epLabel(keys.map(function (k) { return +k.split('#')[1]; }));
    return t + (u.ep ? ' ep ' + u.ep : '');
  }

  /* ============================================================
     traka za ocenu
     ============================================================ */

  var rbTimer = null;
  function rateBar(id) {
    var it = Cat.get(id);
    if (!it) return;
    var el = $('#ratebar');
    if (!el) { el = document.createElement('div'); el.id = 'ratebar'; document.body.appendChild(el); }
    el.innerHTML = '<div class="rb">' + UI.poster(it, 'thumb') +
      '<div class="rb-t"><b>Oceni</b><span>' + esc(Cat.cleanTitle(it)) + '</span></div><div class="rb-s">' +
      [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-n="' + n + '">★</button>'; }).join('') +
      '</div><button type="button" class="rb-x" aria-label="Zatvori">✕</button></div>';
    el.className = 'in';
    el.querySelector('.rb-x').onclick = hideRateBar;
    UI.$all('.rb-s button', el).forEach(function (b) {
      b.onclick = function () { hideRateBar(); openRate(id, +b.getAttribute('data-n')); };
    });
    clearTimeout(rbTimer);
    rbTimer = setTimeout(hideRateBar, 8000);
  }
  function hideRateBar() {
    clearTimeout(rbTimer);
    var el = $('#ratebar');
    if (el) el.className = '';
  }

  function openRate(id, n) {
    var mine = MM.Reviews.mine(id);
    UIS.rate = { id: id, stars: n || (mine ? mine.stars : 0), text: mine ? mine.text : '' };
    UI.openSheet({ cls: 'small', render: function () { return V.rateSheet(ctx()); } });
  }

  /* ============================================================
     listovi
     ============================================================ */

  function openItem(id, src) {
    UIS.itemSrc = src || 'plan';
    var top = UI.topSheet();
    if (top && top.id === 'item-' + id) return;
    UI.openSheet({ id: 'item-' + id, cls: 'item-sheet', render: function () { return V.itemSheet(id, ctx()); } });
  }

  function openDoom() {
    var c = ctx();
    var s = c.s;
    UIS.mapPeople = crewOnMap(c);
    UI.openSheet({
      id: 'doom', full: true, cls: 'doom-sheet',
      render: function () { return V.doomSheet(ctx()); },
      onOpen: function (el) {
        var box = el.querySelector('.doom-wrap');
        var time = P.timeRatio();
        var from = s.doomSeenP && s.doomSeenP < time ? s.doomSeenP : null;
        MM.Doom.mount(box, { time: time, from: from, people: UIS.mapPeople });
        if (Math.abs((s.doomSeenP || 0) - time) > 0.002) {
          setTimeout(function () { Store.mutate(function (st) { st.doomSeenP = Math.round(time * 1000) / 1000; }); }, 4500);
        }
      },
      onClose: function () { MM.Doom.stop(); }
    });
  }

  /** Svi na mapi: ti (uzivo) + ekipa iz profila. */
  function crewOnMap(c) {
    var me = Store.uid();
    var out = [{ me: true, name: c.s.displayName || 'Ti', photo: c.s.avatar, ratio: c.prog.ratio, label: 'TI' }];
    MM.Reviews.people().forEach(function (p) {
      if (me && p.uid === me) return;
      var n = (p.name || '?').split(' ')[0].slice(0, 10);
      out.push({ me: false, name: p.name, photo: p.photo, ratio: Math.min(1, (p.percent || 0) / 100), label: n });
    });
    return out;
  }

  function openChoose() {
    UI.openSheet({ id: 'choose', render: function () { return V.chooseSheet(ctx()); } });
  }

  function openNews() {
    UI.openSheet({ id: 'news', render: function () { return V.newsSheet(ctx()); }, onClose: function () { setTimeout(checkNotice, 400); } });
  }

  /* ============================================================
     akcije
     ============================================================ */

  function currentTodayKeys() {
    var plan = P.build(state());
    var keys = {};
    plan.todayDay.units.forEach(function (u) { keys[u.key] = 1; });
    if (plan.next) keys[plan.next.key] = 1;
    return keys;
  }

  var A = {
    'tab': function (el) {
      var t = el.getAttribute('data-tab'), sc = el.getAttribute('data-scroll');
      if (t === 'ja' && UIS.tab === 'ja' && el.id === 'me-av') t = UIS.prevTab || 'danas';
      if (UI.topSheet()) { UI.closeAll(); setTimeout(function () { setTab(t, sc); }, 300); return; }
      setTab(t, sc);
    },
    'item': function (el) { openItem(el.getAttribute('data-id'), UIS.tab === 'katalog' || UIS.tab === 'ekipa' ? 'lib' : 'plan'); },
    'sheet-close': function () { UI.closeTop(); },
    'doom': function () { openDoom(); },
    'streak': function () { UI.openSheet({ cls: 'small', render: function () { return V.streakSheet(ctx()); } }); },

    'toggle': function (el) {
      var keys = el.getAttribute('data-keys').split(',');
      var s = state();
      var allOn = keys.every(function (k) {
        var u = P.unitFromKey(k);
        if (!u) return false;
        return u.ep ? P.watchedEps(u.item, s).indexOf(u.ep) !== -1 : s.watched[u.id] === true;
      });
      var on = !allOn;
      UI.buzz(on ? 14 : 6);
      var undo = mark(keys, on, true);
      if (on) {
        UI.toast('✓ ' + labelOf(keys), { action: 'Poništi', onAction: undo });
        afterWatched(keys);
      }
    },

    'deck-yes': function (el) { deckDo('yes', el.getAttribute('data-key')); },
    'deck-back': function () { deckDo('back'); },
    'deck-skip': function (el) { deckDo('skip', null, el.getAttribute('data-id')); },

    'skip-day': function (el) {
      var iso = el.getAttribute('data-iso');
      var on = !(state().skipDays && state().skipDays[iso]);
      Store.mutate(function (s) { s.skipDays = s.skipDays || {}; if (on) s.skipDays[iso] = true; else delete s.skipDays[iso]; });
      UI.toast(on ? 'Taj dan je slobodan — plan je pomeren.' : 'Vraćeno u plan.');
    },

    /* --- plan / kalendar --- */
    'cal-view': function (el) { UIS.cal.view = el.getAttribute('data-v'); render(); },
    'cal-month': function (el) {
      var d = +el.getAttribute('data-d');
      var p = UIS.cal.month.split('-');
      var dt = new Date(+p[0], +p[1] - 1 + d, 1);
      UIS.cal.month = P.iso(dt).slice(0, 7);
      render();
    },
    'cal-day': function (el) {
      UIS.cal.sel = el.getAttribute('data-iso');
      render();
      var det = document.querySelector('#p-plan .card.day');
      if (det) setTimeout(function () { det.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 20);
    },
    'offday': function (el) {
      var d = +el.getAttribute('data-d');
      Store.mutate(function (s) {
        var a = (s.offDays || []).slice();
        var i = a.indexOf(d);
        if (i === -1) a.push(d); else a.splice(i, 1);
        if (a.length >= 7) { UI.toast('Bar jedan dan mora da ostane za gledanje.'); return; }
        s.offDays = a.sort();
      });
    },
    'ics': function () {
      var c = ctx();
      MM.ICS.download(c.plan, c.s);
      UI.toast('Skinut marvel-maraton.ics — uvezi ga u Google kalendar.');
    },

    /* --- sta gledam --- */
    'preset': function (el) {
      var id = el.getAttribute('data-id');
      var sc = Cat.presetScope(id);
      Store.mutate(function (s) { s.scope = sc; });
      UI.buzz(10);
      var p = Cat.PRESETS.filter(function (x) { return x.id === id; })[0];
      UI.toast('Plan: ' + p.name);
      if (el.getAttribute('data-close')) UI.closeTop();
    },
    'custom-open': function () {
      var sc = Cat.scopeOf(state());
      UIS.custom = { tiers: sc.tiers.slice(), cols: sc.cols.slice(), must: sc.must };
      UI.openSheet({ id: 'custom', render: function () { return V.customSheet(ctx()); } });
    },
    'cu-col': function (el) { flip(UIS.custom.cols, el.getAttribute('data-v')); UI.refreshSheets(); },
    'cu-tier': function (el) { flip(UIS.custom.tiers, el.getAttribute('data-v')); UI.refreshSheets(); },
    'cu-must': function () { UIS.custom.must = !UIS.custom.must; UI.refreshSheets(); },
    'cu-save': function () {
      var sc = UIS.custom;
      var id = Cat.presetIdOf(sc);
      Store.mutate(function (s) { s.scope = { preset: id, tiers: sc.tiers.slice(), cols: sc.cols.slice(), must: sc.must }; });
      UI.closeTop();
      UI.toast('Plan sačuvan.');
    },
    'choose': function () { UI.closeTop(); setTimeout(openChoose, 280); },
    'pace-mode': function (el) {
      var m = el.getAttribute('data-v');
      Store.mutate(function (s) {
        var p = P.paceOf(s);
        if (m === 'fixed' && p.mode !== 'fixed') p.min = Math.max(30, Math.min(360, Math.round(P.build(s).target / 15) * 15 || 120));
        s.pace = { mode: m, min: p.min };
      });
    },
    'must-first': function () {
      var on = !state().mustFirst;
      Store.mutate(function (s) { s.mustFirst = on; });
      UI.toast(on ? 'Obavezno ide prvo.' : 'Redosled je opet normalan.');
    },
    'order': function (el) {
      var v = el.getAttribute('data-v');
      Store.mutate(function (s) { s.order = v; });
      UI.toast('Redosled: ' + Cat.ORDERS.filter(function (o) { return o.id === v; })[0].name);
    },

    /* --- katalog --- */
    'lib-col': function (el) {
      UIS.lib.col = el.getAttribute('data-v'); render();
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    },
    'lib-tier': function (el) { UIS.lib.tier = el.getAttribute('data-v'); render(); },
    'lib-status-set': function (el) { UIS.lib.status = el.getAttribute('data-v'); render(); },
    'lib-status-clear': function () { UIS.lib.status = 'all'; render(); },
    'lib-sort': function (el) { UIS.lib.sort = el.getAttribute('data-v'); render(); },
    'lib-reset': function () {
      Object.assign(UIS.lib, { q: '', col: 'all', tier: 'all', status: 'all', sort: 'order' });
      UI.closeTop(); render();
    },
    'map-jump': function (el) { MM.Doom.jump(el.getAttribute('data-v')); UI.buzz(6); },
    'rev-who': function (el) { UIS.rev.who = el.getAttribute('data-v'); render(); },
    'rev-sort': function (el) { UIS.rev.sort = el.getAttribute('data-v'); render(); },
    'lib-filters': function () { UI.openSheet({ id: 'filters', render: function () { return V.filterSheet(ctx()); } }); },
    'lib-clear': function () { UIS.lib.q = ''; render(); },
    'lib-status-go': function (el) {
      UIS.lib = Object.assign(UIS.lib, { status: el.getAttribute('data-v'), col: 'all', tier: 'all', q: '' });
      setTab('katalog');
    },
    'card': function (el) {
      var id = el.getAttribute('data-id');
      if (UIS.lib.selecting) {
        if (UIS.lib.sel[id]) delete UIS.lib.sel[id]; else UIS.lib.sel[id] = 1;
        if (!Object.keys(UIS.lib.sel).length) UIS.lib.selecting = false;
        UI.buzz(6);
        render();
        return;
      }
      openItem(id, 'lib');
    },
    'sel-cancel': function () { UIS.lib.selecting = false; UIS.lib.sel = {}; render(); },
    'bulk': function (el) {
      var op = el.getAttribute('data-op');
      var ids = Object.keys(UIS.lib.sel);
      if (!ids.length) return;
      var undo;
      if (op === 'done' || op === 'undone') {
        var keys = [];
        ids.forEach(function (id) { keys = keys.concat(itemKeys(Cat.get(id))); });
        undo = mark(keys, op === 'done', false);
      } else {
        var prev = JSON.parse(JSON.stringify({ skipped: state().skipped || {}, extra: state().extra || {} }));
        Store.mutate(function (s) {
          s.skipped = s.skipped || {}; s.extra = s.extra || {};
          ids.forEach(function (id) {
            if (op === 'skip') { s.skipped[id] = true; delete s.extra[id]; }
            if (op === 'add') { delete s.skipped[id]; s.extra[id] = true; }
          });
        });
        undo = function () { Store.mutate(function (s) { s.skipped = prev.skipped; s.extra = prev.extra; }); };
      }
      UIS.lib.selecting = false; UIS.lib.sel = {};
      UI.toast(({ done: 'Označeno kao odgledano', undone: 'Skinuta oznaka', skip: 'Preskočeno', add: 'Dodato u plan' })[op] + ' (' + ids.length + ')',
        { action: 'Poništi', onAction: undo });
      render();
    },

    /* --- detalji naslova --- */
    'ep': function (el) {
      if (suppressClick) { suppressClick = false; return; }
      var id = el.getAttribute('data-id'), ep = +el.getAttribute('data-ep');
      var it = Cat.get(id);
      var on = P.watchedEps(it, state()).indexOf(ep) === -1;
      UI.buzz(on ? 12 : 6);
      mark([id + '#' + ep], on, UIS.itemSrc === 'plan');
      if (on) afterWatched([id + '#' + ep]);
    },
    'item-toggle': function (el) {
      var it = Cat.get(el.getAttribute('data-id'));
      var on = !P.isDone(it, state());
      var keys = itemKeys(it);
      if (on) keys = keys.filter(function (k) { var u = P.unitFromKey(k); return !(u.ep && P.watchedEps(it, state()).indexOf(u.ep) !== -1); });
      var undo = mark(keys, on, UIS.itemSrc === 'plan' && keys.length <= 3);
      UI.buzz(on ? 14 : 6);
      UI.toast(on ? '✓ ' + Cat.cleanTitle(it) : 'Skinuta oznaka', { action: 'Poništi', onAction: undo });
      if (on) afterWatched(keys);
    },
    'unskip': function (el) { var id = el.getAttribute('data-id'); Store.mutate(function (s) { delete s.skipped[id]; }); UI.toast('Vraćeno u plan.'); },
    'skip': function (el) {
      var id = el.getAttribute('data-id');
      Store.mutate(function (s) { s.skipped = s.skipped || {}; s.skipped[id] = true; if (s.extra) delete s.extra[id]; });
      UI.toast('Preskočeno.', { action: 'Poništi', onAction: function () { Store.mutate(function (s) { delete s.skipped[id]; }); } });
    },
    'extra': function (el) {
      var id = el.getAttribute('data-id');
      Store.mutate(function (s) { s.extra = s.extra || {}; s.extra[id] = true; if (s.skipped) delete s.skipped[id]; });
      UI.toast('Dodato u plan.');
    },
    'unextra': function (el) { var id = el.getAttribute('data-id'); Store.mutate(function (s) { if (s.extra) delete s.extra[id]; }); },
    'platform': function (el) {
      var id = el.getAttribute('data-id'), v = el.getAttribute('data-v');
      Store.mutate(function (s) { s.platforms = s.platforms || {}; s.platforms[id] = v; });
    },
    'poster-find': function (el) {
      var it = Cat.get(el.getAttribute('data-id'));
      UI.toast('Tražim poster…');
      MM.Posters.findOne(it).then(function (url) {
        if (url) { Store.mutate(function (s) { s.posters = s.posters || {}; s.posters[it.id] = url; }); UI.toast('Našao.'); }
        else UI.toast('Nema postera — nalepi URL ručno.');
      });
    },

    /* --- ocene / ekipa --- */
    'rate': function (el) { openRate(el.getAttribute('data-id'), 0); },
    'rate-star': function (el) { UIS.rate.stars = +el.getAttribute('data-n'); UI.buzz(8); UI.refreshSheets(); },
    'rate-save': function (el) {
      var r = UIS.rate;
      var t = $('#rateText');
      if (t) r.text = t.value;
      el.disabled = true;
      MM.Reviews.save(r.id, r.stars, r.text).then(function () {
        UI.closeTop(); UI.toast('Objavljeno ★' + r.stars); schedule();
      }).catch(function (e) { el.disabled = false; console.warn(e); UI.toast('Nije uspelo — proveri internet.'); });
    },
    'rate-del': function () {
      var id = UIS.rate.id;
      MM.Reviews.remove(id).then(function () { UI.closeTop(); UI.toast('Ocena obrisana.'); schedule(); })
        .catch(function () { UI.toast('Nije uspelo.'); });
    },
    'send-notice': function (el) {
      var inp = $('#noticeText');
      var t = (inp && inp.value || '').trim();
      if (t.length < 2) { UI.toast('Napiši poruku.'); return; }
      el.disabled = true;
      MM.Reviews.postNotice(t).then(function (rec) {
        Store.mutate(function (s) { s.lastNoticeAt = rec.at; });
        inp.value = ''; el.disabled = false;
        UI.toast('Poslato ekipi.');
      }).catch(function () { el.disabled = false; UI.toast('Nije uspelo.'); });
    },
    'notice-ok': function (el) {
      var at = +el.getAttribute('data-at') || Date.now();
      Store.mutate(function (s) { s.lastNoticeAt = at; });
      UI.closeTop();
    },

    /* --- nalog i podaci --- */
    'login': function (el) {
      el.disabled = true;
      Store.markOnboarded();
      Store.signInGoogle().then(function () {
        if (UI.topSheet() && UI.topSheet().id === 'welcome') UI.closeTop();
        // nov nalog (ili stari bez izbora) - pitaj kako gleda
        setTimeout(function () { if (!state().scope && !UI.topSheet()) openChoose(); }, 2500);
      }).catch(function (e) {
        el.disabled = false;
        console.warn(e);
        UI.toast(String(e && e.code) === 'auth/unauthorized-domain' ? 'Domen nije dozvoljen u Firebase podešavanjima.' : 'Prijava nije uspela.');
      });
    },
    'welcome-local': function () {
      Store.markOnboarded();
      UI.closeTop();
      setTimeout(openChoose, 300);
    },
    'logout': function () {
      UI.confirm({ title: 'Odjava', text: 'Lista ostaje na ovom uređaju, ali se više ne sinhronizuje dok se ponovo ne prijaviš.', yes: 'Odjavi me',
        onYes: function () { Store.signOutGoogle().then(schedule); } });
    },
    'profile': function () {
      UIS.prof = { name: state().displayName || '', avatar: state().avatar || '' };
      UI.openSheet({ cls: 'small', render: function () { return V.profileSheet(ctx()); } });
    },
    'pick-photo': function () {
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = function () {
        var f = inp.files && inp.files[0];
        if (!f) return;
        var nm = $('#profName'); if (nm) UIS.prof.name = nm.value;
        squarePhoto(f).then(function (url) { UIS.prof.avatar = url; UI.refreshSheets(); })
          .catch(function () { UI.toast('Ta slika ne može da se učita.'); });
      };
      inp.click();
    },
    'drop-photo': function () {
      var nm = $('#profName'); if (nm) UIS.prof.name = nm.value;
      UIS.prof.avatar = ''; UI.refreshSheets();
    },
    'profile-save': function () {
      var n = ($('#profName').value || '').trim().slice(0, 40);
      var a = UIS.prof.avatar || '';
      Store.mutate(function (s) { s.displayName = n; s.avatar = a; });
      UI.closeTop(); UI.toast('Sačuvano.');
    },
    'sync-now': function () { Store.syncNow().then(function () { UI.toast('Sinhronizovano.'); }); },
    'export': function () {
      var blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'marvel-maraton-' + P.today() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    },
    'import': function () {
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'application/json,.json';
      inp.onchange = function () {
        var f = inp.files && inp.files[0];
        if (!f) return;
        f.text().then(function (txt) {
          var obj = JSON.parse(txt);
          if (!obj || typeof obj !== 'object' || !obj.watched) throw new Error('nije kopija');
          UI.confirm({ title: 'Učitaj kopiju?', text: 'Ovo zamenjuje tvoj trenutni napredak onim iz fajla.', yes: 'Učitaj',
            onYes: function () { Store.importJSON(txt); UI.toast('Učitano.'); } });
        }).catch(function () { UI.toast('To nije ispravna kopija.'); });
      };
      inp.click();
    },
    'reset': function () {
      UI.confirm({ title: 'Obriši sav napredak?', text: 'Sve oznake odgledanog nestaju — i na drugim uređajima. Ne može da se vrati.', yes: 'Obriši', danger: true,
        onYes: function () { Store.reset(); UI.toast('Obrisano.'); } });
    },
    'notif': function () {
      if (!('Notification' in window)) return;
      Notification.requestPermission().then(function (p) {
        if (p === 'granted') { UI.toast('Uključeno.'); registerPeriodic(); }
        schedule();
      });
    },
    'posters': function () { startPosters(true); },
    'news': function () { openNews(); }
  };

  /**
   * Slika iz galerije -> kvadrat 160x160 JPEG kao data URL (~6-10 KB).
   * Toliko mala da staje u profil u Firestore-u bez Storage-a.
   */
  function squarePhoto(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var S = 160, w = img.naturalWidth, h = img.naturalHeight, m = Math.min(w, h);
        var c = document.createElement('canvas');
        c.width = S; c.height = S;
        var g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        g.drawImage(img, (w - m) / 2, (h - m) / 2, m, m, 0, 0, S, S);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('slika')); };
      img.src = url;
    });
  }

  /**
   * Posteri sezona: ranije je svaka sezona dobijala poster serije. Jednom
   * prodji kroz sve "(Sezona N)" naslove i uzmi poster bas te sezone.
   * Stari poster ostaje dok novi ne stigne, pa nista ne treperi.
   */
  function refreshSeasonPosters() {
    var s = state();
    if (s.posterSeasons >= 1 || !navigator.onLine) return;
    var list = Cat.all().filter(function (i) {
      return /\(Sezona\s*\d+\)/i.test(i.title) && !(s.myPosters && s.myPosters[i.id]);
    });
    var found = {}, i = 0;
    (function next() {
      if (i >= list.length) {
        Store.mutate(function (st) {
          st.posters = st.posters || {};
          Object.keys(found).forEach(function (k) { st.posters[k] = found[k]; });
          st.posterSeasons = 1;
        });
        return;
      }
      var it = list[i++];
      MM.Posters.findOne(it).then(function (u) {
        if (u) found[it.id] = u;
        setTimeout(next, 150);
      }).catch(function () { setTimeout(next, 150); });
    })();
  }

  function flip(arr, v) { var i = arr.indexOf(v); if (i === -1) arr.push(v); else arr.splice(i, 1); }

  /* ============================================================
     kartica "na redu" (samo dugmad - bez prevlacenja)
     ============================================================ */

  function deckDo(dir, key, id) {
    var plan = P.build(state());
    var u = plan.next;
    if (dir === 'yes') {
      key = key || (u && u.key);
      if (!key) return;
      var undo = mark([key], true, true);
      UI.buzz(18);
      UI.toast('✓ ' + labelOf([key]), { action: 'Poništi', onAction: undo });
      afterWatched([key]);
    } else if (dir === 'skip') {
      id = id || (u && u.id);
      if (!id) return;
      var it = Cat.get(id);
      Store.mutate(function (s) { s.skipped = s.skipped || {}; s.skipped[id] = true; if (s.extra) delete s.extra[id]; });
      UI.buzz(8);
      UI.toast('„' + it.title + '" preskočeno', { action: 'Poništi', onAction: function () { Store.mutate(function (s) { delete s.skipped[id]; }); } });
    } else {
      // nazad: skini poslednje odgledano (po vremenu oznake, inace po redosledu)
      var s = state();
      var best = null;
      Object.keys(s.log || {}).forEach(function (k) {
        var r = s.log[k];
        if (!P.unitFromKey(k)) return;
        if (!best || (r.t || 0) > (s.log[best].t || 0) || ((r.t || 0) === (s.log[best].t || 0) && r.d > s.log[best].d)) best = k;
      });
      if (!best) {
        var all = plan.all.filter(function (x) { return x.watched; });
        best = all.length ? all[all.length - 1].key : null;
      }
      if (!best) { UI.toast('Nema šta da se vrati.'); return; }
      mark([best], false, false);
      UI.buzz(8);
      UI.toast('↶ Vraćeno: ' + labelOf([best]));
    }
    var card = $('#dcard');
    if (card) {
      card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
    }
  }

  /* ============================================================
     dugi pritisak (katalog: visestruki izbor, epizode: "do ove")
     ============================================================ */

  var lp = null, suppressClick = false;
  function bindLongPress() {
    document.addEventListener('pointerdown', function (e) {
      var card = e.target.closest('.pc');
      var ep = e.target.closest('.ep');
      if (!card && !ep) return;
      var x = e.clientX, y = e.clientY;
      lp = { x: x, y: y, t: setTimeout(function () {
        lp = null;
        suppressClick = true;
        setTimeout(function () { suppressClick = false; }, 700);
        UI.buzz(25);
        if (card) {
          UIS.lib.selecting = true;
          UIS.lib.sel[card.getAttribute('data-id')] = 1;
          render();
        } else {
          var id = ep.getAttribute('data-id'), n = +ep.getAttribute('data-ep');
          var it = Cat.get(id);
          var seen = P.watchedEps(it, state());
          var keys = [];
          for (var i = 1; i <= n; i++) if (seen.indexOf(i) === -1) keys.push(id + '#' + i);
          if (!keys.length) { UI.toast('Sve do ' + n + '. epizode je već označeno.'); return; }
          var undo = mark(keys, true, UIS.itemSrc === 'plan' && keys.length <= 3);
          UI.toast('✓ Epizode do ' + n + '.', { action: 'Poništi', onAction: undo });
          afterWatched(keys);
        }
      }, 480) };
    }, true);
    function cancel(e) {
      if (!lp) return;
      if (e.type === 'pointermove' && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) < 10) return;
      clearTimeout(lp.t); lp = null;
    }
    document.addEventListener('pointermove', cancel, true);
    document.addEventListener('pointerup', cancel, true);
    document.addEventListener('pointercancel', cancel, true);
    document.addEventListener('scroll', function () { if (lp) { clearTimeout(lp.t); lp = null; } }, true);
  }

  /* ============================================================
     dogadjaji
     ============================================================ */

  function bindEvents() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-a]');
      if (!el || el.disabled) return;
      var a = el.getAttribute('data-a');
      if (suppressClick && (a === 'card' || a === 'ep')) { suppressClick = false; e.preventDefault(); return; }
      if (A[a]) { e.preventDefault(); A[a](el, e); }
    });

    document.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'libQ') { UIS.lib.q = t.value; render(); }
      if (t.id === 'rateText') UIS.rate.text = t.value;
      if (t.id === 'paceRange') { var v = $('#paceVal'); if (v) v.textContent = UI.hm(+t.value); }
    });
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (t.id === 'paceRange') { var v = +t.value; Store.mutate(function (s) { s.pace = { mode: 'fixed', min: v }; }); }
      if (t.id === 'linkIn') {
        var id = t.getAttribute('data-id'), url = t.value.trim();
        Store.mutate(function (s) { s.links = s.links || {}; if (url) s.links[id] = url; else delete s.links[id]; });
        UI.toast(url ? 'Link sačuvan.' : 'Link obrisan.');
      }
      if (t.id === 'posterIn') {
        var pid = t.getAttribute('data-id'), purl = t.value.trim();
        Store.mutate(function (s) { s.myPosters = s.myPosters || {}; if (purl) s.myPosters[pid] = purl; else delete s.myPosters[pid]; });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.id === 'libQ') e.target.blur();
    });

    // App, ne sajt: bez menija na dugi pritisak (osim u poljima za unos).
    document.addEventListener('contextmenu', function (e) {
      if (!e.target.closest('input, textarea, a[href]')) e.preventDefault();
    });
    // Bez zumiranja dvoprstim pokretom (iOS ignorise user-scalable).
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

    window.addEventListener('popstate', function () {
      if (popIgnore > 0) { popIgnore--; return; }
      if (UI.onPop()) return;
      if (UIS.lib.selecting) {
        UIS.lib.selecting = false; UIS.lib.sel = {}; render();
        history.pushState({ mm: 'tab' }, ''); tabPushed = true;
        return;
      }
      if (UIS.tab === 'ja' && UIS.prevTab && UIS.prevTab !== 'danas') {
        // iz profila nazad na tab sa kog si dosao
        setTab(UIS.prevTab, null, true);
        history.pushState({ mm: 'tab' }, ''); tabPushed = true;
        return;
      }
      if (UIS.tab !== 'danas') { tabPushed = false; setTab('danas', null, true); }
      // na "Danas" bez otvorenog lista - "nazad" izlazi iz aplikacije
    });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { render(); if (UIS.tab === 'ekipa') loadReviews(false); }
    });

    setInterval(function () {
      var c = $('#clock');
      if (c) c.textContent = V.clock();
    }, 1000);
    var lastDay = P.today();
    setInterval(function () {
      if (P.today() !== lastDay) { lastDay = P.today(); render(); }
    }, 30000);

    bindLongPress();
  }

  /* ============================================================
     ekipa, ocene, poruke
     ============================================================ */

  function loadReviews(force) {
    if (UIS.reviewsLoading || !Store.uid()) return;
    if (!force && !MM.Reviews.isStale()) return;
    UIS.reviewsLoading = true;
    Promise.all([MM.Reviews.load(), MM.Reviews.loadPeople()])
      .then(function () { UIS.reviewsLoading = false; schedule(); })
      .catch(function (e) { UIS.reviewsLoading = false; console.warn('[ekipa]', e); schedule(); });
  }

  function checkNotice() {
    if (!Store.uid() || UI.topSheet()) return;
    MM.Reviews.latestNotice().then(function (n) {
      if (!n || !n.text) return;
      if ((state().lastNoticeAt || 0) >= n.at) return;
      if (n.uid === Store.uid()) { Store.mutate(function (s) { s.lastNoticeAt = n.at; }); return; }
      if (UI.topSheet()) return;
      UI.openSheet({ cls: 'small', render: function () {
        return '<div class="pad-sheet center notice"><div class="news-k">PORUKA OD ' + esc((n.from || 'ekipe').toUpperCase()) + '</div>' +
          '<p class="notice-t">' + esc(n.text) + '</p>' +
          '<button type="button" class="btn primary wide" data-a="notice-ok" data-at="' + n.at + '">U redu</button></div>';
      } });
    }).catch(function (e) { console.warn('[poruka]', e); });
  }

  var profTimer = null;
  function publishProgress() {
    if (!Store.uid()) return;
    clearTimeout(profTimer);
    profTimer = setTimeout(function () {
      var s = state(), p = P.progress(s);
      Store.publishProfile({ watched: p.watched, total: p.total, minutes: p.watchedMin, percent: p.percent, streak: P.streak(s).n });
    }, 2500);
  }

  /* ============================================================
     posteri
     ============================================================ */

  function startPosters(manual) {
    if (MM.Posters.isRunning()) { if (manual) UI.toast('Već tražim…'); return; }
    if (!navigator.onLine) { if (manual) UI.toast('Nema interneta.'); return; }
    var miss = MM.Posters.missing(Cat.all(), state(), manual);
    if (!miss.length) { if (manual) UI.toast('Svi posteri su tu.'); return; }
    MM.Posters.fetchMissing(Cat.all(), state(), Store, function (done, total, fin) {
      UIS.posterJob = fin ? '' : (done + '/' + total);
      if (UIS.tab === 'ja') schedule();
      if (fin && manual) UI.toast('Gotovo.');
    }, manual);
  }

  /* ============================================================
     notifikacije
     ============================================================ */

  function notify(title, opts) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    opts = Object.assign({ icon: 'icons/icon-192.png', badge: 'icons/badge-96.png' }, opts);
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(function (reg) { reg.showNotification(title, opts); })
        .catch(function () { try { new Notification(title, opts); } catch (e) { /* */ } });
    }
  }

  function dailyNotification() {
    var today = P.today();
    if (localStorage.getItem('mm-last-notif') === today) return;
    var plan = P.build(state());
    var g = P.group(plan.todayDay.units);
    if (!g.length) return;
    localStorage.setItem('mm-last-notif', today);
    notify('Danas: ' + g.map(function (x) { return Cat.cleanTitle(x.item) + (x.epLabel ? ' ' + x.epLabel : ''); }).join(' + '),
      { body: UI.hm(plan.todayDay.minutes) + ' · Doom je za ' + V.countdownParts().d + ' dana.', tag: 'mm-daily' });
  }

  function idleWarning() {
    var s = state();
    var t = s.lastWatchAt || 0;
    if (!t) return;
    var h = Math.floor((Date.now() - t) / 3600000);
    if (h < 24 || s.lastWarnDay === P.today()) return;
    var plan = P.build(s);
    if (!plan.next) return;
    Store.mutate(function (st) { st.lastWarnDay = P.today(); });
    var d = Math.floor(h / 24);
    notify(d >= 2 ? '🚨 ' + d + ' DANA BEZ MARVELA' : '🚨 24 SATA BEZ MARVELA', {
      body: 'Na redu: ' + Cat.cleanTitle(plan.next.item) + (plan.next.ep ? ' ep ' + plan.next.ep : '') + '. Doom ne čeka.',
      tag: 'mm-warn', renotify: true, vibrate: [200, 80, 200]
    });
  }

  /** Podatak za service worker (on ne vidi localStorage). */
  function writeMeta() {
    if (!window.caches) return;
    var s = state(), plan = P.build(s);
    var meta = {
      lastWatchAt: s.lastWatchAt || s.firstWatchAt || 0,
      title: plan.next ? Cat.cleanTitle(plan.next.item) + (plan.next.ep ? ' ep ' + plan.next.ep : '') : '',
      num: plan.next ? plan.next.item.order : 0,
      poster: plan.next ? MM.Posters.urlFor(plan.next.item, s) : '',
      left: plan.titlesLeft
    };
    caches.open('mm-meta').then(function (c) {
      return c.put('/mm-meta.json', new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } }));
    }).catch(function () { /* */ });
  }

  function registerPeriodic() {
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.ready.then(function (reg) {
      if (!reg.periodicSync || !navigator.permissions) return;
      navigator.permissions.query({ name: 'periodic-background-sync' }).then(function (st) {
        if (st.state === 'granted') reg.periodicSync.register('mm-warn', { minInterval: 12 * 3600 * 1000 }).catch(function () { /* */ });
      }).catch(function () { /* */ });
    }).catch(function () { /* */ });
  }

  /* ============================================================
     service worker + visina ekrana
     ============================================================ */

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    var had = !!navigator.serviceWorker.controller, reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!had || reloaded) return;
      reloaded = true;
      location.reload();
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then(function (reg) { reg.update(); })
      .catch(function (e) { console.warn('SW:', e); });
  }

  /**
   * Visina iz stvarne vidljive visine. Na nekim telefonima 100dvh obuhvata
   * i traku ispod (izmereno 838 umesto 782px) pa tab bar ispadne van ekrana.
   */
  var shellH = 0;
  function fitShell() {
    var h = Math.round(window.visualViewport ? window.visualViewport.height : window.innerHeight);
    // tastatura smanjuje visualViewport - tada ne diramo ljusku
    if (!h || (shellH && h < shellH * 0.75) || Math.abs(h - shellH) < 8) return;
    shellH = h;
    document.documentElement.style.setProperty('--appH', h + 'px');
  }

  /* ============================================================
     start
     ============================================================ */

  function boot() {
    var fresh = !localStorage.getItem('mm-state-v1');
    fitShell();
    window.addEventListener('resize', fitShell, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fitShell, { passive: true });

    Cat.load().then(function () {
      Store.init();
      started = true;
      history.replaceState({ mm: 'base' }, '');

      Store.onChange(function () { schedule(); publishProgress(); });
      Store.onStatus(function (st, note) { syncStatus = st; syncNote = note || ''; schedule(); });
      var firstAuth = true;
      Store.onAuth(function (u) {
        if (u) {
          loadReviews(true);
          if (!state().displayName) setTimeout(function () { if (!UI.topSheet()) A.profile(); }, 1200);
          publishProgress();
          if (!firstAuth) setTimeout(maybeNews, 1500);
        }
        firstAuth = false;
        schedule();
      });
      bindEvents();
      render();
      document.body.classList.add('ready');
      var b = $('#boot');
      if (b) setTimeout(function () { b.remove(); }, 400);

      if (fresh && !Store.hasSeenOnboarding()) {
        setTimeout(function () {
          UI.openSheet({ id: 'welcome', render: function () { return V.welcomeSheet(ctx()); },
            onClose: function () { Store.markOnboarded(); } });
        }, 350);
        Store.mutate(function (s) { s.seenNews = NEWS_ID; });
      } else {
        setTimeout(maybeNews, 900);
      }

      setTimeout(function () { startPosters(false); }, 1500);
      setTimeout(refreshSeasonPosters, 6000);
      setTimeout(function () { dailyNotification(); idleWarning(); writeMeta(); registerPeriodic(); }, 2500);
      setTimeout(function () { if (!UI.topSheet()) checkNotice(); }, 3500);
    }).catch(function (e) {
      console.error(e);
      var b = $('#boot');
      if (b) b.innerHTML = '<div class="boot-err"><b>Ne mogu da učitam listu.</b><span>Proveri internet i otvori ponovo.</span>' +
        '<button type="button" onclick="location.reload()">Pokušaj ponovo</button></div>';
    });

    registerSW();
  }

  function maybeNews() {
    var s = state();
    if (s.seenNews === NEWS_ID || UI.topSheet()) return;
    Store.mutate(function (st) { st.seenNews = NEWS_ID; });
    openNews();
  }

  MM.App = { render: schedule, setTab: setTab, ui: UIS, openItem: openItem };
  boot();
})();
