/* ============================================================
   tiers.js  -  moj tier list (S A B C D F)
   ------------------------------------------------------------
   Posle svakog filma / cele sezone biras gde ide u tvom tier
   listu. Ceo tier list je u "Ja" (i na stranici naslova).
   Stanje: state.tiers = { id: { t: 'S', at } }
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI, esc = UI.esc;
  var TIERS = [
    { t: 'S', c: '#ff5f6d', d: 'remek-delo' },
    { t: 'A', c: '#ff9f43', d: 'odlično' },
    { t: 'B', c: '#ffd54a', d: 'dobro' },
    { t: 'C', c: '#7bd88f', d: 'okej' },
    { t: 'D', c: '#5aa9ff', d: 'slabo' },
    { t: 'F', c: '#a77bff', d: 'katastrofa' }
  ];
  function tierOf(t) { return TIERS.filter(function (x) { return x.t === t; })[0]; }
  function sfx(n) { if (MM.Sfx) MM.Sfx.play(n); }
  function all() { return MM.Store.get().tiers || {}; }
  function get(id) { var x = all()[id]; return x ? x.t : ''; }
  function set(id, t) {
    MM.Store.mutate(function (s) {
      s.tiers = s.tiers || {};
      if (t) s.tiers[id] = { t: t, at: Date.now() }; else delete s.tiers[id];
    });
  }
  /** Odgledani naslovi bez mesta u tier listu (najnovije odgledano prvo). */
  function unrated() {
    var s = MM.Store.get(), tt = s.tiers || {}, log = s.log || {}, last = {};
    Object.keys(log).forEach(function (k) { var id = k.split('#')[0], t = (log[k] && log[k].t) || 0; if (!last[id] || t > last[id]) last[id] = t || 1; });
    return MM.Cat.all().filter(function (it) { return !tt[it.id] && MM.Plan.isDone(it, s); })
      .sort(function (a, b) { return (last[b.id] || 0) - (last[a.id] || 0) || b.order - a.order; });
  }
  function rows() {
    var tt = all(), by = {};
    TIERS.forEach(function (x) { by[x.t] = []; });
    Object.keys(tt).forEach(function (id) { var it = MM.Cat.get(id); if (it && by[tt[id].t]) by[tt[id].t].push({ it: it, at: tt[id].at || 0 }); });
    TIERS.forEach(function (x) { by[x.t].sort(function (a, b) { return a.at - b.at; }); });
    return by;
  }

  /* ---------------- izbor posle gledanja ---------------- */
  // opts: { onStars(n), stars: bool (ponudi i ocenu za ekipu), queue: [ids] (rangiranje redom), onClose }
  var P = null;
  function pick(id, opts) {
    opts = opts || {};
    var it = MM.Cat.get(id); if (!it) return;
    P = { id: id, it: it, chosen: get(id), done: false, opts: opts };
    UI.openSheet({
      id: 'tier', cls: 'tier-sheet', render: renderPick,
      onOpen: function (el) {
        el.addEventListener('click', function (e) {
          var b = e.target.closest('[data-tp]'); if (!b || !P) return;
          var a = b.getAttribute('data-tp');
          if (a === 'tier') choose(b.getAttribute('data-v'));
          else if (a === 'star') { var n = +b.getAttribute('data-n'), cb = P.opts.onStars; UI.closeTop(); if (cb) setTimeout(function () { cb(n); }, 280); }
          else if (a === 'skip') next(true);
          else if (a === 'remove') { set(P.id, ''); UI.closeTop(); }
          else if (a === 'list') { UI.closeTop(); setTimeout(open, 280); }
          else if (a === 'next') next(false);
          else if (a === 'close') UI.closeTop();
        });
      },
      onClose: function () { var cb = P && P.opts.onClose; P = null; if (cb) cb(); }
    });
  }
  function choose(t) {
    set(P.id, t); P.chosen = t; P.done = true;
    sfx(t === 'S' ? 'win' : t === 'F' ? 'bad' : 'ok'); UI.buzz(t === 'S' ? [15, 40, 25] : 10);
    if (P.opts.queue && P.opts.queue.length) { setTimeout(function () { if (P && P.done) next(false); }, 650); }
    else if (P.opts.move) { setTimeout(function () { if (P && P.done) UI.closeTop(); }, 450); }
    UI.refreshSheets();
  }
  function next(skipped) {
    var q = P.opts.queue || [];
    if (!q.length) { UI.closeTop(); return; }
    var id = q.shift();
    P.id = id; P.it = MM.Cat.get(id); P.chosen = get(id); P.done = false; P.n = (P.n || 0) + 1;
    UI.refreshSheets();
  }
  function renderPick() {
    if (!P) return '';
    var it = P.it, q = P.opts.queue, ch = P.chosen, by = ch ? rows()[ch] : null;
    var out = '<div class="tp no-drag">' +
      (q ? '<div class="tp-q">Rangiranje · još ' + (q.length + 1) + '</div>' : '') +
      '<div class="tp-head" data-k="tp-' + esc(it.id) + '">' + UI.poster(it, 'tp-art') + '<div><em>' + (P.opts.move ? 'PREMESTI' : 'GDE IDE U TVOM TIER LISTU?') + '</em><b>' + esc(MM.Cat.cleanTitle(it)) + '</b>' +
      '<span>' + esc([it.year, MM.Cat.col(it.col).name].join(' · ')) + '</span></div></div>' +
      '<div class="tp-row">' + TIERS.map(function (x) {
        return '<button type="button" class="tp-t' + (ch === x.t ? ' on' : '') + (ch && ch !== x.t ? ' dim' : '') + '" data-tp="tier" data-v="' + x.t + '" style="--c:' + x.c + '"><b>' + x.t + '</b><i>' + x.d + '</i></button>';
      }).join('') + '</div>';
    if (P.done && by && !q) {
      out += '<div class="tp-got" style="--c:' + tierOf(ch).c + '"><span class="tp-l">' + ch + '</span><div class="tp-strip">' +
        by.slice(-6).map(function (x) { return UI.poster(x.it, 'thumb' + (x.it.id === it.id ? ' new' : '')); }).join('') + '</div></div>';
      if (P.opts.stars) out += '<div class="tp-stars"><span>Oceni i za ekipu</span><div>' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-tp="star" data-n="' + n + '">★</button>'; }).join('') + '</div></div>';
      out += '<div class="tp-acts"><button type="button" class="btn ghost" data-tp="list">Ceo tier list</button><button type="button" class="btn primary" data-tp="close">Gotovo</button></div>';
    } else if (q) {
      out += '<div class="tp-acts"><button type="button" class="btn ghost" data-tp="skip">Preskoči</button><button type="button" class="btn ghost" data-tp="close">Dosta za sad</button></div>';
    } else {
      out += '<div class="tp-acts">' + (P.opts.move && ch ? '<button type="button" class="btn ghost" data-tp="remove">Izbaci iz liste</button>' : '') +
        '<button type="button" class="btn ghost" data-tp="close">' + (P.opts.move ? 'Zatvori' : 'Kasnije') + '</button></div>';
    }
    return out + '</div>';
  }

  /* ---------------- ceo tier list ---------------- */
  function renderList() {
    var by = rows(), un = unrated(), n = Object.keys(all()).length;
    var out = '<div class="tl no-drag"><div class="tl-top"><button type="button" class="ib close" data-a="sheet-close" aria-label="Zatvori">✕</button>' +
      '<div><em>MARVEL MARATON</em><h2>Moj tier list</h2><span>' + n + ' ' + (n === 1 ? 'naslov' : 'naslova') + ' rangirano</span></div></div>' +
      '<div class="tl-board">' + TIERS.map(function (x) {
        return '<div class="tl-row" style="--c:' + x.c + '"><div class="tl-l"><b>' + x.t + '</b><i>' + x.d + '</i></div><div class="tl-items">' +
          (by[x.t].length ? by[x.t].map(function (r) { return '<button type="button" class="tl-it" data-tl="move" data-id="' + esc(r.it.id) + '">' + UI.poster(r.it, 'thumb') + '</button>'; }).join('') : '<span class="tl-empty">—</span>') +
          '</div></div>';
      }).join('') + '</div>';
    if (un.length) {
      out += '<div class="tl-un"><div class="tl-unh"><b>Neocenjeno · ' + un.length + '</b><button type="button" class="btn primary sm" data-tl="rank">Rangiraj redom</button></div><div class="tl-items">' +
        un.slice(0, 40).map(function (it) { return '<button type="button" class="tl-it" data-tl="move" data-id="' + esc(it.id) + '">' + UI.poster(it, 'thumb') + '</button>'; }).join('') + '</div></div>';
    }
    if (n) out += '<button type="button" class="btn ghost wide tl-share" data-tl="share">Sačuvaj kao sliku</button>';
    return out + '</div>';
  }
  function open() {
    UI.openSheet({
      id: 'tierlist', full: true, cls: 'tl-sheet', render: renderList,
      onOpen: function (el) {
        el.addEventListener('click', function (e) {
          var b = e.target.closest('[data-tl]'); if (!b) return;
          var a = b.getAttribute('data-tl');
          if (a === 'move') pick(b.getAttribute('data-id'), { move: !!get(b.getAttribute('data-id')) });
          else if (a === 'rank') { var q = unrated().map(function (it) { return it.id; }); if (q.length) pick(q.shift(), { queue: q }); }
          else if (a === 'share') share(false);
        });
      }
    });
  }

  /* ---------------- slika ---------------- */
  function loadImg(src) {
    return new Promise(function (res) {
      if (!src) return res(null);
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = src;
    });
  }
  async function share(np) {
    UI.toast('Pravim sliku…');
    var by = rows(), s = MM.Store.get(), W = 1080, PW = 96, PH = 144, GAP = 8, LW = 150, PAD = 30;
    var per = Math.floor((W - PAD * 2 - LW - 16 + GAP) / (PW + GAP));
    var hs = TIERS.map(function (x) { return Math.max(1, Math.ceil(by[x.t].length / per)) * (PH + GAP) + GAP; });
    var H = 200 + hs.reduce(function (a, b) { return a + b + 10; }, 0) + 80;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d'), F = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    c.fillStyle = '#0b0b10'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#e62429'; c.font = '900 30px ' + F; c.fillText('MARVEL MARATON', PAD, 70);
    c.fillStyle = '#fff'; c.font = '900 64px ' + F; c.fillText('Tier list' + (s.displayName ? ' · ' + s.displayName.split(' ')[0] : ''), PAD, 145);
    var y = 190, tainted = false;
    for (var i = 0; i < TIERS.length; i++) {
      var x = TIERS[i], h = hs[i];
      c.fillStyle = '#16161d'; c.fillRect(PAD, y, W - PAD * 2, h);
      c.fillStyle = x.c; c.fillRect(PAD, y, LW, h);
      c.fillStyle = '#111'; c.font = '900 72px ' + F; c.textAlign = 'center'; c.fillText(x.t, PAD + LW / 2, y + h / 2 + 24); c.textAlign = 'left';
      for (var k = 0; k < by[x.t].length; k++) {
        var it = by[x.t][k].it, px = PAD + LW + 16 + (k % per) * (PW + GAP), py = y + GAP + Math.floor(k / per) * (PH + GAP);
        var im = np ? null : await loadImg(MM.Posters.urlFor(it, s));
        if (im) { try { c.drawImage(im, px, py, PW, PH); c.getImageData(px, py, 1, 1); } catch (e) { tainted = true; im = null; } }
        if (!im) {
          c.fillStyle = '#2a2a35'; c.fillRect(px, py, PW, PH);
          c.fillStyle = '#fff'; c.font = '700 15px ' + F;
          wrap(c, MM.Cat.cleanTitle(it), px + 6, py + 22, PW - 12, 18);
        }
      }
      y += h + 10;
    }
    if (tainted) return share(true);   // poster je zakljucao platno: ponovo, samo nazivi
    c.fillStyle = '#6d6d7a'; c.font = '700 24px ' + F; c.fillText('DOOMSDAY · 18. 12. 2026', PAD, H - 34);
    done(cv);
  }
  function wrap(c, text, x, y, w, lh) {
    var words = String(text).split(' '), line = '', n = 0;
    words.forEach(function (wd) {
      var t = line ? line + ' ' + wd : wd;
      if (c.measureText(t).width > w && line) { if (n < 6) c.fillText(line, x, y + n * lh); n++; line = wd; } else line = t;
    });
    if (line && n < 6) c.fillText(line, x, y + n * lh);
  }
  function done(cv) {
    cv.toBlob(function (blob) {
      if (!blob) { UI.toast('Slika nije napravljena.'); return; }
      var file = new File([blob], 'moj-tier-list.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: 'Moj Marvel tier list' }).catch(function () {});
      else { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
    }, 'image/png');
  }

  /** Kartica za "Ja". */
  function card() {
    var by = rows(), n = Object.keys(all()).length, un = unrated().length;
    if (!n && !un) return '';
    var top = TIERS.map(function (x) { return by[x.t].map(function (r) { return { it: r.it, t: x }; }); }).reduce(function (a, b) { return a.concat(b); }, []).slice(0, 6);
    return '<button type="button" class="card tl-card" data-k="tlcard" data-a="tierlist"><div class="tlc-h"><div><em>MOJ TIER LIST</em><b>' + (n ? n + ' rangirano' : 'Rangiraj šta si gledao') + '</b>' +
      (un ? '<span>' + un + ' čeka na mesto</span>' : '') + '</div><span class="tlc-go">›</span></div>' +
      (top.length ? '<div class="tlc-strip">' + top.map(function (x) { return '<span class="tlc-p" style="--c:' + x.t.c + '">' + UI.poster(x.it, 'thumb') + '<i>' + x.t.t + '</i></span>'; }).join('') + '</div>'
        : '<div class="tlc-tiers">' + TIERS.map(function (x) { return '<i style="--c:' + x.c + '">' + x.t + '</i>'; }).join('') + '</div>') +
      '</button>';
  }
  /** Red na stranici naslova. */
  function line(id) {
    var t = get(id), x = t && tierOf(t);
    return '<button type="button" class="tl-line" data-a="tier-pick" data-id="' + esc(id) + '">' +
      (x ? '<span class="tl-badge" style="--c:' + x.c + '">' + t + '</span><span><b>Tier ' + t + '</b><i>' + x.d + ' · promeni</i></span>'
        : '<span class="tl-badge none">?</span><span><b>Tier list</b><i>gde ide u tvom tier listu?</i></span>') + '<em>›</em></button>';
  }

  MM.Tiers = { TIERS: TIERS, get: get, set: set, pick: pick, open: open, card: card, line: line, unrated: unrated };
})();
