/* KADHARVA Campus Arts Fest 2K26 — Comic Welcome Intro Sequencer
   - Plays automatically once per session (replay anytime with ?intro=1, skip with ?intro=0)
   - Uses original fest-name.png and campus-arts-fest.png assets untouched
   - Completely isolated from Firebase/Cloud sync, auth, routes, and festival data */
(function () {
  'use strict';

  var SEEN_KEY = 'KD_INTRO_SEEN';
  var root = document.documentElement;

  function removeLegacyWall() {
    var old = document.getElementById('welcome');
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  function uncover() {
    root.classList.remove('kd-will-play');
  }

  var qs = '', seen = false;
  try { qs = new URLSearchParams(location.search).get('intro'); } catch (e) {}
  try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) {}

  if (qs === '0' || (seen && qs !== '1')) {
    removeLegacyWall();
    uncover();
    return;
  }

  try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
  removeLegacyWall();

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nameSrc = (typeof FEST_NAME_IMG !== 'undefined' && FEST_NAME_IMG) || 'fest-name.png';
  var subSrc = (typeof FEST_SUB_IMG !== 'undefined' && FEST_SUB_IMG) || 'campus-arts-fest.png';

  var el, stage, fx, fxb, timers = [], finished = false, prevOverflow = '';

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function limbs() {
    return '<i class="kd-arm arm-out"><i class="glove"></i></i><i class="kd-arm arm-in"><i class="glove"></i></i>';
  }

  function legs() {
    return '<div class="kd-legs"><i class="leg l"><i class="shoe"></i></i><i class="leg r"><i class="shoe"></i></i></div>';
  }

  function character(cls, src, altText) {
    return '<div class="kd-char ' + cls + '"><div class="kd-mv"><div class="kd-bounce">' +
      '<div class="kd-body"><img class="kd-logo" alt="' + altText + '" draggable="false" src="' + src + '">' + limbs() + '</div>' + legs() +
      '</div></div></div>';
  }

  function build() {
    el = document.createElement('div');
    el.id = 'kdIntro';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Welcome to KADHARVA Campus Arts Fest 2K26');
    el.innerHTML =
      '<div class="kd-bg"></div><div class="kd-rays"></div><div class="kd-floor"></div>' +
      '<div class="kd-fx kd-fxb"></div>' +
      '<div class="kd-stage">' +
        character('kd-a', nameSrc, 'KADHARVA') +
        character('kd-b', subSrc, 'Campus Arts Fest 2K26') +
      '</div>' +
      '<div class="kd-fx"></div>' +
      '<div class="kd-title">' +
        '<h1 class="kd-h">WELCOME TO KADHARVA!</h1>' +
        '<div class="kd-sub">CAMPUS ARTS FEST 2K26</div>' +
      '</div>' +
      '<button type="button" class="kd-skip" aria-label="Skip welcome animation">Skip ▸</button>';

    Array.prototype.forEach.call(el.querySelectorAll('.kd-logo'), function (img, i) {
      img.onerror = function () {
        var d = document.createElement('div');
        d.className = 'kd-fb';
        d.textContent = i ? 'CAMPUS ARTS FEST 2K26' : 'KADHARVA';
        if (img.parentNode) img.parentNode.replaceChild(d, img);
      };
    });

    stage = el.querySelector('.kd-stage');
    fx = el.querySelector('.kd-fx:not(.kd-fxb)');
    fxb = el.querySelector('.kd-fxb');
    document.body.appendChild(el);
  }

  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    document.removeEventListener('keydown', onKey);
    el.classList.add('kd-out');
    document.body.style.overflow = prevOverflow || '';
    setTimeout(function () {
      if (el && el.parentNode) el.parentNode.removeChild(el);
      try { document.dispatchEvent(new CustomEvent('kd-intro-done')); } catch (e) {}
    }, 800);
  }

  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      finish();
    }
  }

  function jaggedClip(spikes, inner) {
    var pts = [], n = spikes * 2;
    for (var i = 0; i < n; i++) {
      var a = Math.PI * 2 * i / n + rnd(-0.05, 0.05);
      var r = i % 2 ? inner + rnd(-6, 6) : 50 - rnd(0, 4);
      pts.push((50 + Math.cos(a) * r).toFixed(1) + '% ' + (50 + Math.sin(a) * r).toFixed(1) + '%');
    }
    return 'polygon(' + pts.join(',') + ')';
  }

  function put(cls, x, y, style, text, layer) {
    var d = document.createElement('i');
    d.className = cls;
    d.style.left = x + 'px';
    d.style.top = y + 'px';
    if (style) d.style.cssText += ';' + style;
    if (text) d.textContent = text;
    (layer || fx).appendChild(d);
    return d;
  }

  function burst(kind, x, y, delay) {
    var clip = jaggedClip(rnd(11, 14) | 0, rnd(30, 38));
    var st = 'clip-path:' + clip + ';-webkit-clip-path:' + clip + ';animation-delay:' + delay + 'ms';
    put('kd-burst ' + (kind === 'mix' ? 'mix ' : '') + 'o', x, y, st, '', fxb);
    put('kd-burst ' + kind, x, y, st, '', fxb);
  }

  function explode() {
    var fs = parseFloat(getComputedStyle(el).fontSize) || 16;
    var er = el.getBoundingClientRect();
    var a = el.querySelector('.kd-a .kd-body').getBoundingClientRect();
    var b = el.querySelector('.kd-b .kd-body').getBoundingClientRect();
    var ay = a.top - er.top + a.height * 0.5;
    var by = b.top - er.top + b.height * 0.5;
    var ax = a.left - er.left + a.width / 2;
    var bx = b.left - er.left + b.width / 2;
    var cx = (a.right + b.left) / 2 - er.left;
    var cy = (ay + by) / 2;

    put('kd-flash', 0, 0, 'left:0;top:0');
    burst('gold', ax, ay, 0);     // KADHARVA Gold/Yellow burst
    burst('orange', bx, by, 60);  // Campus Arts Fest Orange burst
    burst('mix', cx, cy, 320);    // Combined centre burst

    [['#FDB827', 0], ['#FF7A00', 150], ['#33A852', 300]].forEach(function (r) {
      put('kd-ring', cx, cy, 'border-color:' + r[0] + ';animation-delay:' + r[1] + 'ms');
    });

    for (var i = 0; i < 16; i++) {
      put('kd-line', cx, cy, '--a:' + (i * 22.5 + rnd(-6, 6)).toFixed(1) + 'deg;margin-top:-0.2em;animation-delay:' + rnd(60, 210).toFixed(0) + 'ms');
    }

    var pal = ['#FDB827', '#FF7A00', '#FFE08A', '#FF9A33', '#217346', '#33A852'];
    var marks = ['✦', '★', '✶', '✧'];
    for (var p = 0; p < 60; p++) {
      var t = p % 4;
      var col = pal[(Math.random() * pal.length) | 0];
      var st = '--dx:' + (rnd(-1, 1) * fs * 28).toFixed(0) + 'px;--dy:' + (-rnd(2, 19) * fs).toFixed(0) + 'px;--r:' + rnd(-540, 540).toFixed(0) + 'deg;' +
        'animation-delay:' + rnd(80, 400).toFixed(0) + 'ms;animation-duration:' + rnd(1.5, 2.0).toFixed(2) + 's;';
      if (t === 3) put('kd-p s', cx, cy, st + 'color:' + col, marks[(Math.random() * marks.length) | 0]);
      else put('kd-p' + (t === 2 ? ' c' : ''), cx, cy, st + 'background:' + col);
    }

    stage.classList.add('kd-shake');
    later(function () { stage.classList.remove('kd-shake'); }, 440);
    later(function () {
      [fx, fxb].forEach(function (l) { while (l.firstChild) l.removeChild(l.firstChild); });
    }, 3000);
  }

  function play() {
    // Scene 1: Entrance & walking (0s - 2.2s)
    el.classList.add('kd-in', 'kd-walk');

    // Scene 2: Meeting upright in the centre (2.2s - 2.9s)
    later(function () {
      el.classList.remove('kd-walk');
      el.classList.add('kd-meet');
    }, 2200);

    // Scene 3: Friendly cartoon hug (2.9s - 3.7s)
    later(function () {
      el.classList.add('kd-hug', 'kd-squeeze');
    }, 2900);

    // Scene 4: Colour explosion (3.7s - 4.45s)
    later(function () {
      el.classList.remove('kd-squeeze');
      el.classList.add('kd-boom');
      explode();
    }, 3700);

    // Scene 5: Welcome title & reveal homepage (4.45s - 6.3s)
    later(function () {
      el.classList.add('kd-show', 'kd-joy');
    }, 4450);

    later(finish, 6300);
  }

  function start() {
    try {
      build();
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      el.querySelector('.kd-skip').addEventListener('click', function (e) {
        e.stopPropagation();
        finish();
      });
      document.addEventListener('keydown', onKey);
      el.querySelector('.kd-skip').focus({ preventScroll: true });
      uncover();

      if (reduce) {
        el.classList.add('kd-static', 'kd-show');
        later(finish, 2600);
      } else {
        play();
      }
    } catch (err) {
      if (window.console) console.error('Welcome intro error:', err);
      if (el && el.parentNode) el.parentNode.removeChild(el);
      document.body.style.overflow = prevOverflow || '';
      uncover();
    }
  }

  var pending = 2, started = false;
  function go() { if (started) return; started = true; start(); }
  function done() { if (--pending <= 0) go(); }

  [nameSrc, subSrc].forEach(function (s) {
    var i = new Image();
    i.onload = i.onerror = done;
    i.src = s;
  });

  setTimeout(go, 2500);
  setTimeout(uncover, 3500);
})();
