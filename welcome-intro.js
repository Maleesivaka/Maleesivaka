/* KADHARVA Campus Arts Fest 2K26 — comic welcome intro (sequencer).
   Independent component: builds its own overlay, plays once per browser session, then removes itself.
   It never touches the site's data, cloud calls, localStorage keys or navigation.
   Needs: welcome-intro.css, and the two logo PNGs (FEST_NAME_IMG / FEST_SUB_IMG are defined in index.html).
   URL helpers:  ?intro=1  replay now   |   ?intro=0  skip   */
(function () {
  'use strict';
  var SEEN_KEY = 'KD_INTRO_SEEN';
  var root = document.documentElement;

  /* the old "Welcome wall" is replaced by this intro (if this file fails to load, the old wall still works) */
  function removeOldWall() { var o = document.getElementById('welcome'); if (o && o.parentNode) o.parentNode.removeChild(o); }
  function uncover() { root.classList.remove('kd-will-play'); }

  var qs = '', seen = false;
  try { qs = new URLSearchParams(location.search).get('intro'); } catch (e) { }
  try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) { }
  if (qs === '0' || (seen && qs !== '1')) { removeOldWall(); uncover(); return; }

  try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) { }
  removeOldWall();

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nameSrc = (typeof FEST_NAME_IMG !== 'undefined' && FEST_NAME_IMG) || 'fest-name.png';
  var subSrc = (typeof FEST_SUB_IMG !== 'undefined' && FEST_SUB_IMG) || 'campus-arts-fest.png';

  var el, stage, fx, fxb, timers = [], finished = false, prevOverflow = '';
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ---------- markup ---------- */
  function limbs() {
    return '<i class="kd-arm arm-out"><i class="glove"></i></i><i class="kd-arm arm-in"><i class="glove"></i></i>';
  }
  function legs() {
    return '<div class="kd-legs"><i class="leg l"><i class="shoe"></i></i><i class="leg r"><i class="shoe"></i></i></div>';
  }
  function character(cls, src, fallback) {
    return '<div class="kd-char ' + cls + '"><div class="kd-mv"><div class="kd-bounce">' +
      '<div class="kd-body"><img class="kd-logo" alt="" draggable="false" src="' + src + '">' + limbs() + '</div>' + legs() +
      '</div></div></div>';
  }
  function build() {
    el = document.createElement('div');
    el.id = 'kdIntro';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Welcome to KADHARVA Campus Arts Fest 2K26');
    el.innerHTML =
      '<div class="kd-bg"></div><div class="kd-rays"></div><div class="kd-floor"></div>' +
      '<div class="kd-fx kd-fxb"></div><div class="kd-stage">' + character('kd-a', nameSrc) + character('kd-b', subSrc) + '</div>' +
      '<div class="kd-fx"></div>' +
      '<div class="kd-title"><h1 class="kd-h">WELCOME TO KADHARVA!</h1><div class="kd-sub">CAMPUS ARTS FEST 2K26</div></div>' +
      '<button type="button" class="kd-skip" aria-label="Skip the welcome animation">Skip ▸</button>';
    /* if a logo file is missing, show plain text instead of a broken image (same idea as the rest of the site) */
    Array.prototype.forEach.call(el.querySelectorAll('.kd-logo'), function (img, i) {
      img.onerror = function () {
        var d = document.createElement('div'); d.className = 'kd-fb'; d.textContent = i ? 'CAMPUS ARTS FEST' : 'KADHARVA';
        if (img.parentNode) img.parentNode.replaceChild(d, img);
      };
    });
    stage = el.querySelector('.kd-stage'); fx = el.querySelector('.kd-fx:not(.kd-fxb)'); fxb = el.querySelector('.kd-fxb');
    document.body.appendChild(el);
  }

  /* ---------- finish / skip ---------- */
  function finish() {
    if (finished) return; finished = true;
    timers.forEach(clearTimeout);
    document.removeEventListener('keydown', onKey);
    el.classList.add('kd-out');
    document.body.style.overflow = prevOverflow;
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      try { document.dispatchEvent(new CustomEvent('kd-intro-done')); } catch (e) { }
    }, 850);
  }
  function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); } }

  /* ---------- explosion pieces ---------- */
  function jaggedClip(spikes, inner) {
    var pts = [], n = spikes * 2;
    for (var i = 0; i < n; i++) {
      var a = Math.PI * 2 * i / n + rnd(-.05, .05), r = i % 2 ? inner + rnd(-6, 6) : 50 - rnd(0, 4);
      pts.push((50 + Math.cos(a) * r).toFixed(1) + '% ' + (50 + Math.sin(a) * r).toFixed(1) + '%');
    }
    return 'polygon(' + pts.join(',') + ')';
  }
  function put(cls, x, y, style, text, layer) {
    var d = document.createElement('i'); d.className = cls;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    if (style) d.style.cssText += ';' + style;
    if (text) d.textContent = text;
    (layer || fx).appendChild(d); return d;
  }
  /* comic starburst = dark outline shape + coloured shape on top */
  function burst(kind, x, y, delay) {
    var clip = jaggedClip(rnd(11, 14) | 0, rnd(30, 38));
    var st = 'clip-path:' + clip + ';-webkit-clip-path:' + clip + ';animation-delay:' + delay + 'ms';
    put('kd-burst ' + (kind === 'mix' ? 'mix ' : '') + 'o', x, y, st, '', fxb);
    put('kd-burst ' + kind, x, y, st, '', fxb);
  }
  function explode() {
    var fs = parseFloat(getComputedStyle(el).fontSize) || 16, er = el.getBoundingClientRect();
    var a = el.querySelector('.kd-a .kd-body').getBoundingClientRect(), b = el.querySelector('.kd-b .kd-body').getBoundingClientRect();
    var ay = a.top - er.top + a.height * .5, by = b.top - er.top + b.height * .5;
    var ax = a.left - er.left + a.width / 2, bx = b.left - er.left + b.width / 2;
    var cx = (a.right + b.left) / 2 - er.left, cy = (ay + by) / 2;

    put('kd-flash', 0, 0, 'left:0;top:0');
    burst('gold', ax, ay, 0);          /* KADHARVA: gold / yellow */
    burst('orange', bx, by, 60);       /* Campus Arts Fest: orange */
    burst('mix', cx, cy, 330);         /* both combine in the centre */

    [['#FDB827', 0], ['#FF7A00', 160], ['#FFE08A', 320]].forEach(function (r) {
      put('kd-ring', cx, cy, 'border-color:' + r[0] + ';animation-delay:' + r[1] + 'ms');
    });
    for (var i = 0; i < 16; i++) put('kd-line', cx, cy, '--a:' + (i * 22.5 + rnd(-6, 6)).toFixed(1) + 'deg;margin-top:-.21em;animation-delay:' + rnd(60, 220).toFixed(0) + 'ms');

    var pal = ['#FDB827', '#FF7A00', '#FFE08A', '#FF9A33', '#217346', '#33A852', '#ffffff'], marks = ['✦', '★', '✶', '✧'];
    for (var p = 0; p < 64; p++) {
      var t = p % 4, col = pal[(Math.random() * pal.length) | 0];
      var st = '--dx:' + (rnd(-1, 1) * fs * 30).toFixed(0) + 'px;--dy:' + (-rnd(2, 20) * fs).toFixed(0) + 'px;--r:' + rnd(-540, 540).toFixed(0) + 'deg;' +
        'animation-delay:' + rnd(80, 420).toFixed(0) + 'ms;animation-duration:' + rnd(1.5, 2.1).toFixed(2) + 's;';
      if (t === 3) put('kd-p s', cx, cy, st + 'color:' + col, marks[(Math.random() * marks.length) | 0]);
      else put('kd-p' + (t === 2 ? ' c' : ''), cx, cy, st + 'background:' + col);
    }
    stage.classList.add('kd-shake');
    later(function () { stage.classList.remove('kd-shake'); }, 480);
    later(function () { [fx, fxb].forEach(function (l) { while (l.firstChild) l.removeChild(l.firstChild); }); }, 3200);
  }

  /* ---------- storyboard ---------- */
  function play() {
    el.classList.add('kd-in', 'kd-walk');                              /* 1. entrance: walk in from both sides  (0 – 2.3s) */
    later(function () { el.classList.remove('kd-walk'); el.classList.add('kd-meet'); }, 2250);    /* 2. meet, face each other, arms reach out */
    later(function () { el.classList.add('kd-hug', 'kd-squeeze'); }, 2950);                        /* 3. hug and hold */
    later(function () {                                                                           /* 4. colour explosion */
      el.classList.remove('kd-squeeze'); el.classList.add('kd-boom');
      explode();
    }, 3750);
    later(function () { el.classList.add('kd-show', 'kd-joy'); }, 4500);                          /* 5. welcome title, logos stay on stage */
    later(finish, 6400);                                                                           /*    then reveal the homepage */
  }

  function start() {
    try {
      build();
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      el.querySelector('.kd-skip').addEventListener('click', function (e) { e.stopPropagation(); finish(); });
      document.addEventListener('keydown', onKey);
      el.querySelector('.kd-skip').focus({ preventScroll: true });
      uncover();                                                    /* the intro itself now covers the page */
      if (reduce) {                                                 /* reduced motion: final picture only, no movement */
        el.classList.add('kd-static', 'kd-show');
        later(finish, 3000);
      } else play();
    } catch (err) {
      if (window.console) console.error('Welcome intro failed:', err);
      if (el && el.parentNode) el.parentNode.removeChild(el);
      document.body.style.overflow = prevOverflow; uncover();
    }
  }

  /* wait (max 2.5s) for both logo files so the entrance never starts with empty characters */
  var pending = 2, started = false;
  function go() { if (started) return; started = true; start(); }
  function done() { if (--pending <= 0) go(); }
  [nameSrc, subSrc].forEach(function (s) { var i = new Image(); i.onload = i.onerror = done; i.src = s; });
  setTimeout(go, 2500);
  /* safety: never leave the white cover on the page */
  setTimeout(uncover, 3500);
})();
