/* ============================================================
   tiers.js  -  moja rang lista (1, 2, 3, ...)
   ------------------------------------------------------------
   Posle svakog filma / cele sezone ubacis ga na mesto koje hoces:
   na vrh, izmedju dva naslova ili na dno. Posle ga pomeras gore/dole.
   Stanje: state.rank = [id, id, ...]  (prvi = najbolji)
   (Stari tier list iz 2.26.0 se jednom pretvori u redosled S > A > ... > F.)
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI, esc = UI.esc;
  function sfx(n) { if (MM.Sfx) MM.Sfx.play(n); }
  function list() {
    var s = MM.Store.get();
    if (!s.rank && s.tiers && Object.keys(s.tiers).length) {
      var ord = 'SABCDF', t = s.tiers;
      return Object.keys(t).filter(function (id) { return MM.Cat.get(id); })
        .sort(function (a, b) { return ord.indexOf(t[a].t) - ord.indexOf(t[b].t) || (t[a].at || 0) - (t[b].at || 0); });
    }
    return (s.rank || []).filter(function (id) { return MM.Cat.get(id); });
  }
  function save(arr) { MM.Store.mutate(function (s) { s.rank = arr.slice(); }); }
  function pos(id) { return list().indexOf(id) + 1; }        // 0 = nije na listi
  function get(id) { return pos(id) ? '#' + pos(id) : ''; }
  function place(id, at) {                                    // at: 0 = prvo mesto
    var a = list().filter(function (x) { return x !== id; });
    at = Math.max(0, Math.min(a.length, at)); a.splice(at, 0, id); save(a); return at;
  }
  function remove(id) { save(list().filter(function (x) { return x !== id; })); }
  function unrated() {
    var s = MM.Store.get(), r = list(), log = s.log || {}, last = {};
    Object.keys(log).forEach(function (k) { var id = k.split('#')[0], t = (log[k] && log[k].t) || 0; if (!last[id] || t > last[id]) last[id] = t || 1; });
    return MM.Cat.all().filter(function (it) { return r.indexOf(it.id) < 0 && MM.Plan.isDone(it, s); })
      .sort(function (a, b) { return (last[b.id] || 0) - (last[a.id] || 0) || b.order - a.order; });
  }
  function medal(n) { return n === 1 ? '🥇' : n === 2 ? '🥈' : n === 3 ? '🥉' : ''; }
  function title(it) { return esc(MM.Cat.cleanTitle(it)); }

  /* ---------------- ubacivanje na mesto ----------------
     opts: { stars, onStars(n), queue: [ids], move } */
  var P = null;
  function pick(id, opts) {
    opts = opts || {};
    if (!MM.Cat.get(id)) return;
    P = { id: id, placed: opts.move ? pos(id) - 1 : -1, opts: opts };
    if (P.placed < 0 && !list().length) { place(id, 0); P.placed = 0; P.first = true; }   // prvi naslov: odmah #1
    UI.openSheet({
      id: 'rank', full: true, cls: 'rk-sheet', render: renderPick,
      onOpen: function (el) {
        el.addEventListener('click', function (e) {
          var b = e.target.closest('[data-rk]'); if (!b || !P) return;
          var a = b.getAttribute('data-rk');
          if (a === 'slot') { P.placed = place(P.id, +b.getAttribute('data-at')); sfx('ok'); UI.buzz(10); redraw(true); }
          else if (a === 'up' || a === 'down' || a === 'top' || a === 'bottom') {
            var at = a === 'top' ? 0 : a === 'bottom' ? 1e9 : P.placed + (a === 'up' ? -1 : 1);
            P.placed = place(P.id, at); sfx('tap'); redraw(true);
          }
          else if (a === 'star') { var n = +b.getAttribute('data-n'), cb = P.opts.onStars; UI.closeTop(); if (cb) setTimeout(function () { cb(n); }, 280); }
          else if (a === 'skip' || a === 'next') next();
          else if (a === 'remove') { remove(P.id); UI.closeTop(); }
          else if (a === 'list') { UI.closeTop(); setTimeout(open, 280); }
          else if (a === 'close') UI.closeTop();
        });
        scrollToMe(el);
      },
      onClose: function () { P = null; }
    });
  }
  function redraw(scroll) { UI.refreshSheets(); if (scroll) setTimeout(function () { var el = document.querySelector('.rk-sheet'); if (el) scrollToMe(el); }, 30); }
  function scrollToMe(el) { var me = el.querySelector('.rk-row.me') || el.querySelector('.rk-slot.mid'); if (me) me.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  function next() {
    var q = P.opts.queue || [];
    if (!q.length) { UI.closeTop(); return; }
    P.id = q.shift(); P.placed = -1; P.first = false; redraw(false);
    var el = document.querySelector('.rk-sheet .sheet-in'); if (el) el.scrollTop = 0;
  }

  function renderPick() {
    if (!P) return '';
    var it = MM.Cat.get(P.id), r = list(), placed = P.placed >= 0, q = P.opts.queue;
    var out = '<div class="rk no-drag"><div class="rk-top">' +
      '<button type="button" class="ib close" data-rk="close" aria-label="Zatvori">✕</button>' +
      (q ? '<span class="rk-q">Rangiranje · još ' + (q.length + 1) + '</span>' : '<span></span>') + '</div>' +
      '<div class="rk-head" data-k="rkh-' + esc(it.id) + '">' + UI.poster(it, 'rk-art') + '<div><em>' + (placed ? (P.first ? 'PRVI NA TVOJOJ LISTI' : 'NA TVOJOJ LISTI') : 'GDE IDE NA TVOJOJ LISTI?') + '</em><b>' + title(it) + '</b>' +
      (placed ? '<span class="rk-big">#' + (P.placed + 1) + ' <small>od ' + r.length + '</small></span>' : '<span>Tapni mesto: iznad ili ispod nekog naslova.</span>') + '</div></div>';

    if (placed) {
      out += '<div class="rk-ctl"><button type="button" class="btn ghost sm" data-rk="top"' + (P.placed === 0 ? ' disabled' : '') + '>⤒ Na vrh</button>' +
        '<button type="button" class="btn ghost sm" data-rk="up"' + (P.placed === 0 ? ' disabled' : '') + '>▲ Gore</button>' +
        '<button type="button" class="btn ghost sm" data-rk="down"' + (P.placed >= r.length - 1 ? ' disabled' : '') + '>▼ Dole</button></div>';
    }
    // lista: kad nije ubacen, izmedju svaka dva naslova je mesto za ubacivanje
    out += '<div class="rk-list">';
    var mid = Math.floor(r.length / 2);
    if (!placed) out += slot(0, r.length ? 'Na prvo mesto' : 'Ovde', mid === 0);
    r.forEach(function (id, i) {
      var x = MM.Cat.get(id), me = placed && i === P.placed;
      out += '<div class="rk-row' + (me ? ' me' : '') + '" data-k="rr-' + esc(id) + '"><span class="rk-n">' + (medal(i + 1) || (i + 1)) + '</span>' + UI.poster(x, 'thumb') +
        '<span class="rk-t"><b>' + title(x) + '</b><i>' + x.year + ' · ' + esc(MM.Cat.col(x.col).name) + '</i></span>' +
        (me ? '<span class="rk-new">' + (P.opts.move ? 'OVDE' : 'NOVO') + '</span>' : '') + '</div>';
      if (!placed) out += slot(i + 1, i === r.length - 1 ? 'Na poslednje mesto' : '', i + 1 === mid);
    });
    out += '</div>';

    out += '<div class="rk-foot">';
    if (placed && P.opts.stars && !q) out += '<div class="tp-stars"><span>Oceni i za ekipu</span><div>' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-rk="star" data-n="' + n + '">★</button>'; }).join('') + '</div></div>';
    if (q) out += '<div class="tp-acts"><button type="button" class="btn ghost" data-rk="skip">Preskoči</button>' + (placed ? '<button type="button" class="btn primary" data-rk="next">Sledeći</button>' : '<button type="button" class="btn ghost" data-rk="close">Dosta za sad</button>') + '</div>';
    else if (placed) out += '<div class="tp-acts">' + (P.opts.move ? '<button type="button" class="btn ghost" data-rk="remove">Izbaci</button>' : '<button type="button" class="btn ghost" data-rk="list">Cela lista</button>') + '<button type="button" class="btn primary" data-rk="close">Gotovo</button></div>';
    else out += '<div class="tp-acts"><button type="button" class="btn ghost" data-rk="close">Kasnije</button></div>';
    return out + '</div></div>';
  }
  function slot(at, label, mid) {
    return '<button type="button" class="rk-slot' + (mid ? ' mid' : '') + (label ? ' lab' : '') + '" data-rk="slot" data-at="' + at + '"><i>+</i>' + (label ? '<span>' + label + '</span>' : '<span>ovde</span>') + '</button>';
  }

  /* ---------------- cela lista ---------------- */
  function renderList() {
    var r = list(), un = unrated();
    var out = '<div class="rk no-drag"><div class="tl-top"><button type="button" class="ib close" data-a="sheet-close" aria-label="Zatvori">✕</button>' +
      '<div><em>MARVEL MARATON</em><h2>Moja rang lista</h2><span>' + (r.length ? r.length + ' ' + (r.length === 1 ? 'naslov' : 'naslova') + ' · tapni naslov da ga pomeriš' : 'Još ništa — rangiraj šta si gledao') + '</span></div></div>';
    if (r.length) {
      out += '<div class="rk-list full">' + r.map(function (id, i) {
        var x = MM.Cat.get(id);
        return '<button type="button" class="rk-row' + (i < 3 ? ' top' : '') + '" data-rl="move" data-id="' + esc(id) + '"><span class="rk-n">' + (medal(i + 1) || (i + 1)) + '</span>' + UI.poster(x, 'thumb') +
          '<span class="rk-t"><b>' + title(x) + '</b><i>' + x.year + ' · ' + esc(MM.Cat.col(x.col).name) + '</i></span><em class="rk-go">⇅</em></button>';
      }).join('') + '</div>';
    }
    if (un.length) {
      out += '<div class="tl-un"><div class="tl-unh"><b>Nije na listi · ' + un.length + '</b><button type="button" class="btn primary sm" data-rl="rank">Rangiraj redom</button></div><div class="tl-items">' +
        un.slice(0, 40).map(function (it) { return '<button type="button" class="tl-it" data-rl="add" data-id="' + esc(it.id) + '">' + UI.poster(it, 'thumb') + '</button>'; }).join('') + '</div></div>';
    }
    if (r.length) out += '<button type="button" class="btn ghost wide tl-share" data-rl="share">Sačuvaj kao sliku</button>';
    return out + '</div>';
  }
  function open() {
    UI.openSheet({
      id: 'ranklist', full: true, cls: 'tl-sheet', render: renderList,
      onOpen: function (el) {
        el.addEventListener('click', function (e) {
          var b = e.target.closest('[data-rl]'); if (!b) return;
          var a = b.getAttribute('data-rl'), id = b.getAttribute('data-id');
          if (a === 'move') pick(id, { move: true });
          else if (a === 'add') pick(id, {});
          else if (a === 'rank') { var q = unrated().map(function (it) { return it.id; }); if (q.length) pick(q.shift(), { queue: q }); }
          else if (a === 'share') share(false);
        });
      }
    });
  }

  /* ---------------- slika (top 20) ---------------- */
  function loadImg(src) {
    return new Promise(function (res) {
      if (!src) return res(null);
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = src;
    });
  }
  async function share(np) {
    UI.toast('Pravim sliku…');
    var r = list().slice(0, 20), s = MM.Store.get(), W = 1080, PAD = 40, RH = 150, H = 230 + r.length * (RH + 12) + 90;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d'), F = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', tainted = false;
    c.fillStyle = '#0b0b10'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#e62429'; c.font = '900 30px ' + F; c.fillText('MARVEL MARATON', PAD, 80);
    c.fillStyle = '#fff'; c.font = '900 64px ' + F; c.fillText('Moja rang lista' + (s.displayName ? ' · ' + s.displayName.split(' ')[0] : ''), PAD, 160);
    for (var i = 0; i < r.length; i++) {
      var it = MM.Cat.get(r[i]), y = 210 + i * (RH + 12);
      c.fillStyle = i < 3 ? ['#3a2e0c', '#2a2d33', '#33210f'][i] : '#16161d'; c.fillRect(PAD, y, W - PAD * 2, RH);
      c.fillStyle = i < 3 ? ['#f5c542', '#c7d0dc', '#d98b4e'][i] : '#6d6d7a'; c.font = '900 56px ' + F; c.textAlign = 'center'; c.fillText(String(i + 1), PAD + 60, y + RH / 2 + 20); c.textAlign = 'left';
      var im = np ? null : await loadImg(MM.Posters.urlFor(it, s));
      if (im) { try { c.drawImage(im, PAD + 120, y + 8, 89, RH - 16); c.getImageData(PAD + 120, y + 8, 1, 1); } catch (e) { tainted = true; } }
      else { c.fillStyle = '#2a2a35'; c.fillRect(PAD + 120, y + 8, 89, RH - 16); }
      c.fillStyle = '#fff'; c.font = '800 38px ' + F; c.fillText(MM.Cat.cleanTitle(it).slice(0, 34), PAD + 235, y + 70);
      c.fillStyle = '#a0a0ad'; c.font = '600 26px ' + F; c.fillText(it.year + ' · ' + MM.Cat.col(it.col).name, PAD + 235, y + 112);
    }
    if (tainted) return share(true);
    c.fillStyle = '#6d6d7a'; c.font = '700 24px ' + F; c.fillText('DOOMSDAY · 18. 12. 2026', PAD, H - 40);
    cv.toBlob(function (blob) {
      if (!blob) { UI.toast('Slika nije napravljena.'); return; }
      var file = new File([blob], 'moja-rang-lista.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: 'Moja Marvel rang lista' }).catch(function () {});
      else { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
    }, 'image/png');
  }

  /** Kartica za "Ja". */
  function card() {
    var r = list(), un = unrated().length;
    if (!r.length && !un) return '';
    return '<button type="button" class="card tl-card" data-k="tlcard" data-a="tierlist"><div class="tlc-h"><div><em>MOJA RANG LISTA</em><b>' + (r.length ? r.length + ' rangirano' : 'Rangiraj šta si gledao') + '</b>' +
      (un ? '<span>' + un + ' čeka na mesto</span>' : '') + '</div><span class="tlc-go">›</span></div>' +
      (r.length ? '<div class="tlc-strip">' + r.slice(0, 6).map(function (id, i) { return '<span class="tlc-p">' + UI.poster(MM.Cat.get(id), 'thumb') + '<i>' + (i + 1) + '</i></span>'; }).join('') + '</div>' : '') +
      '</button>';
  }
  /** Red na stranici naslova. */
  function line(id) {
    var n = pos(id), tot = list().length;
    return '<button type="button" class="tl-line" data-a="tier-pick" data-id="' + esc(id) + '">' +
      (n ? '<span class="tl-badge rk">' + (medal(n) || '#' + n) + '</span><span><b>#' + n + ' na tvojoj listi</b><i>od ' + tot + ' · pomeri gore/dole</i></span>'
        : '<span class="tl-badge none">#?</span><span><b>Rang lista</b><i>ubaci ga na svoje mesto</i></span>') + '<em>›</em></button>';
  }

  MM.Tiers = { get: get, pos: pos, list: list, place: place, pick: pick, open: open, card: card, line: line, unrated: unrated };
})();
