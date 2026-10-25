/* ============================================================
   ui.js  -  zajednicki UI alati
   ------------------------------------------------------------
   - morph(): menja samo ono sto se promenilo u DOM-u. Slike se ne
     ucitavaju ponovo, skrol i fokus ostaju - nema treptanja.
   - sheets: donji listovi koji se zatvaraju na "nazad" (Android),
     povlacenjem nadole ili tapom van njih.
   - toast sa dugmetom "Poništi".
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- format ---------------- */

  function hm(min) {
    min = Math.max(0, Math.round(min || 0));
    var h = Math.floor(min / 60), m = min % 60;
    if (!h) return m + 'm';
    if (!m) return h + 'h';
    return h + 'h ' + m + 'm';
  }
  function hours(min) {
    var h = (min || 0) / 60;
    return (h >= 100 ? Math.round(h) : Math.round(h * 10) / 10).toString().replace('.', ',') + 'h';
  }

  var MONTHS = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
  var MON3 = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  var DOW = ['pon', 'uto', 'sre', 'čet', 'pet', 'sub', 'ned'];
  var DOW_LONG = ['ponedeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota', 'nedelja'];

  function dateLabel(isoStr, opts) {
    var P = MM.Plan;
    var d = P.parse(isoStr);
    var diff = P.daysBetween(P.today(), isoStr);
    if (!(opts && opts.plain)) {
      if (diff === 0) return 'danas';
      if (diff === 1) return 'sutra';
      if (diff === -1) return 'juče';
    }
    return d.getDate() + '. ' + MON3[d.getMonth()];
  }
  function dayName(isoStr) { return DOW_LONG[MM.Plan.weekday(isoStr)]; }

  /* ---------------- morph ---------------- */

  function keyOf(n) { return n.nodeType === 1 ? n.getAttribute('data-k') : null; }

  function same(a, b) {
    if (a.nodeType !== b.nodeType) return false;
    if (a.nodeType !== 1) return true;
    if (a.tagName !== b.tagName) return false;
    return keyOf(a) === keyOf(b);
  }

  function patchAttrs(a, b) {
    var i, at;
    for (i = a.attributes.length - 1; i >= 0; i--) {
      at = a.attributes[i].name;
      if (!b.hasAttribute(at)) a.removeAttribute(at);
    }
    for (i = 0; i < b.attributes.length; i++) {
      at = b.attributes[i];
      if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    }
    if (a.tagName === 'INPUT') {
      if (a.type === 'checkbox' || a.type === 'radio') a.checked = b.hasAttribute('checked');
      else if (document.activeElement !== a && b.hasAttribute('value') && a.value !== b.getAttribute('value')) {
        a.value = b.getAttribute('value');
      }
    }
  }

  function patch(a, b) {
    if (a.nodeType === 3 || a.nodeType === 8) {
      if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue;
      return;
    }
    patchAttrs(a, b);
    if (a.hasAttribute('data-keep')) return;           // npr. Doom scena koju crta JS
    if (a.tagName === 'TEXTAREA') {
      if (document.activeElement !== a && a.value !== b.value) a.value = b.value;
      return;
    }
    patchChildren(a, b);
  }

  function patchChildren(a, b) {
    var ac = a.firstChild, bc = b.firstChild, next;
    while (bc) {
      next = bc.nextSibling;
      if (!ac) {
        a.appendChild(bc);
      } else if (same(ac, bc)) {
        patch(ac, bc);
        ac = ac.nextSibling;
      } else {
        var k = keyOf(bc), found = null;
        if (k) {
          for (var n = ac.nextSibling; n; n = n.nextSibling) { if (keyOf(n) === k) { found = n; break; } }
        }
        if (found && found.tagName === bc.tagName) {
          a.insertBefore(found, ac);
          patch(found, bc);
        } else {
          a.insertBefore(bc, ac);
        }
      }
      bc = next;
    }
    while (ac) { next = ac.nextSibling; a.removeChild(ac); ac = next; }
  }

  function morph(el, html) {
    var t = document.createElement('template');
    t.innerHTML = html;
    patchChildren(el, t.content);
  }

  /* ---------------- haptika ---------------- */

  function buzz(p) {
    try { if (navigator.vibrate) navigator.vibrate(p || 10); } catch (e) { /* nema */ }
  }

  /* ---------------- toast ---------------- */

  var toastTimer = null;
  function toast(msg, opts) {
    opts = opts || {};
    var box = $('#toasts');
    box.innerHTML = '<div class="toast">' +
      '<span class="toast-msg">' + esc(msg) + '</span>' +
      (opts.action ? '<button class="toast-act" type="button">' + esc(opts.action) + '</button>' : '') +
      '</div>';
    var el = box.firstChild;
    requestAnimationFrame(function () { el.classList.add('in'); });
    if (opts.action) {
      el.querySelector('.toast-act').addEventListener('click', function () {
        hide();
        if (opts.onAction) opts.onAction();
      });
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hide, opts.ms || (opts.action ? 4500 : 2400));
    function hide() {
      clearTimeout(toastTimer);
      el.classList.remove('in');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
    }
  }

  /* ---------------- sheets (donji listovi) ---------------- */

  var stack = [];            // [{id, el, render, onClose}]
  var ignorePop = 0;

  /**
   * Otvara donji list. `render()` vraca HTML i poziva se ponovo na
   * svaku promenu stanja (MM.UI.refreshSheets), pa je list uvek svez.
   */
  function openSheet(opts) {
    var el = document.createElement('div');
    el.className = 'sheet-wrap' + (opts.full ? ' full' : '') + (opts.center ? ' center' : '') + (opts.cls ? ' ' + opts.cls : '');
    el.innerHTML = '<div class="scrim"></div><div class="sheet" role="dialog" aria-modal="true">' +
      '<div class="grab"><i></i></div><div class="sheet-in"></div></div>';
    $('#sheets').appendChild(el);
    var entry = { id: opts.id || ('s' + Date.now()), el: el, render: opts.render, onClose: opts.onClose, onOpen: opts.onOpen };
    stack.push(entry);
    renderSheet(entry);
    document.body.classList.add('has-sheet');
    history.pushState({ mm: 'sheet', n: stack.length }, '');
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
    el.querySelector('.scrim').addEventListener('click', function () { closeTop(); });
    if (!opts.center) bindDrag(el, entry);
    if (opts.onOpen) setTimeout(function () { opts.onOpen(el); }, 30);
    return entry;
  }

  function renderSheet(entry) {
    var inner = entry.el.querySelector('.sheet-in');
    morph(inner, entry.render());
  }

  function refreshSheets() { stack.forEach(renderSheet); }

  function removeEntry(entry) {
    var i = stack.indexOf(entry);
    if (i !== -1) stack.splice(i, 1);
    entry.el.classList.remove('in');
    entry.el.classList.add('out');
    setTimeout(function () { if (entry.el.parentNode) entry.el.parentNode.removeChild(entry.el); }, 260);
    if (!stack.length) document.body.classList.remove('has-sheet');
    if (entry.onClose) { try { entry.onClose(); } catch (e) { console.error(e); } }
  }

  /** Zatvori gornji list. Ide kroz history.back() da Android "nazad" ostane uskladjen. */
  function closeTop() {
    if (!stack.length) return;
    ignorePop++;
    removeEntry(stack[stack.length - 1]);
    history.back();
  }

  function closeAll() {
    var n = stack.length;
    while (stack.length) removeEntry(stack[stack.length - 1]);
    if (n) { ignorePop++; history.go(-n); }
  }

  function topSheet() { return stack[stack.length - 1] || null; }

  /** popstate: ako je list otvoren, zatvori ga. Vraca true ako je obradjeno. */
  function onPop() {
    if (ignorePop > 0) { ignorePop--; return true; }
    if (stack.length) { removeEntry(stack[stack.length - 1]); return true; }
    return false;
  }

  /** Povlacenje lista nadole ga zatvara (samo kad je sadrzaj skrolovan na vrh). */
  function bindDrag(wrap, entry) {
    var sheet = wrap.querySelector('.sheet');
    var y0 = 0, dy = 0, drag = false, started = false, t0 = 0;
    sheet.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      var inner = sheet.querySelector('.sheet-in');
      var onGrab = !!e.target.closest('.grab');
      if (!onGrab && inner.scrollTop > 0) return;
      if (e.target.closest('input, textarea, select, .no-drag')) return;
      drag = true; started = false; dy = 0; y0 = e.touches[0].clientY; t0 = Date.now();
    }, { passive: true });
    sheet.addEventListener('touchmove', function (e) {
      if (!drag) return;
      dy = e.touches[0].clientY - y0;
      if (!started) {
        if (dy < 6) { if (dy < -4) drag = false; return; }
        started = true;
        sheet.style.transition = 'none';
      }
      sheet.style.transform = 'translateY(' + Math.max(0, dy) + 'px)';
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    function end() {
      if (!drag) return;
      drag = false;
      sheet.style.transition = '';
      if (!started) return;
      var fast = dy > 60 && (Date.now() - t0) < 250;
      if (dy > 120 || fast) {
        sheet.style.transform = '';
        if (stack[stack.length - 1] === entry) closeTop();
      } else {
        sheet.style.transform = '';
      }
    }
    sheet.addEventListener('touchend', end);
    sheet.addEventListener('touchcancel', end);
  }

  /* ---------------- dijalog za potvrdu ---------------- */

  function confirm(opts) {
    var entry = openSheet({
      cls: 'small',
      render: function () {
        return '<div class="confirm">' +
          '<h2>' + esc(opts.title) + '</h2>' +
          (opts.text ? '<p class="muted">' + esc(opts.text) + '</p>' : '') +
          '<div class="btn-row">' +
            '<button class="btn ghost" type="button" data-a="sheet-close">' + esc(opts.no || 'Odustani') + '</button>' +
            '<button class="btn ' + (opts.danger ? 'danger' : 'primary') + '" type="button" data-confirm-yes>' + esc(opts.yes || 'U redu') + '</button>' +
          '</div></div>';
      }
    });
    entry.el.querySelector('[data-confirm-yes]').addEventListener('click', function () {
      closeTop();
      if (opts.onYes) setTimeout(opts.onYes, 30);
    });
  }

  /* ---------------- slike ---------------- */

  function hue(id) {
    var x = 0;
    for (var i = 0; i < id.length; i++) x = (x * 31 + id.charCodeAt(i)) % 360;
    return x;
  }

  // URL-ovi koji nisu hteli da se ucitaju - da ih ne trazimo na svakom crtanju.
  var badImg = {};
  function imgFailed(el) {
    badImg[el.getAttribute('src')] = 1;
    el.style.visibility = 'hidden';
  }

  /** Poster ili lep gradijent sa naslovom ako postera nema. */
  function poster(item, cls) {
    var src = MM.Posters.urlFor(item, MM.Store.get());
    if (src && badImg[src]) src = '';
    var h = hue(item.id);
    var fb = '<span class="ph" style="background:linear-gradient(155deg,hsl(' + h + ' 45% 26%),hsl(' + ((h + 50) % 360) +
      ' 55% 10%))"><b>' + esc(item.title) + '</b></span>';
    return '<span class="art ' + (cls || '') + '" data-k="art-' + esc(item.id) + '">' + fb +
      (src ? '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async" draggable="false" ' +
        'onerror="MM.UI.imgFailed(this)">' : '') +
      '</span>';
  }

  MM.UI = {
    $: $, $all: $all, esc: esc, hm: hm, hours: hours,
    MONTHS: MONTHS, MON3: MON3, DOW: DOW, DOW_LONG: DOW_LONG,
    dateLabel: dateLabel, dayName: dayName,
    morph: morph, buzz: buzz, toast: toast,
    openSheet: openSheet, closeTop: closeTop, closeAll: closeAll, refreshSheets: refreshSheets,
    topSheet: topSheet, onPop: onPop, confirm: confirm,
    poster: poster, hue: hue, imgFailed: imgFailed
  };
})();
