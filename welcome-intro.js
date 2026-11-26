/* KADHARVA welcome intro (independent component).
   Scene 1 walk in · Scene 2 meet · Scene 3 hug · Scene 4 colour explosion · Scene 5 welcome.
   Uses the two original PNG files exactly as supplied (only empty transparent margins are trimmed in memory).
   Plays once per browser session, can be skipped, and respects "reduce motion". Call kdIntroPlay(true) to replay. */
(function () {
  'use strict';
  var KEY = 'kdIntroSeen';
  var NAME_IMG = window.FEST_NAME_IMG || 'fest-name.png';
  var SUB_IMG = window.FEST_SUB_IMG || 'campus-arts-fest.png';
  var root = null, timers = [], running = false;

  function T(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function seen() { try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function mark() { try { sessionStorage.setItem(KEY, '1'); } catch (e) { } }
  function trim(f, cb) { if (typeof window.kdTrim === 'function') window.kdTrim(f, cb); else cb(f); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function starPoly(n, r1, r2) {
    var pts = [];
    for (var i = 0; i < n * 2; i++) {
      var a = Math.PI / n * i - Math.PI / 2, r = i % 2 ? r2 : r1;
      pts.push((50 + Math.cos(a) * r).toFixed(1) + '% ' + (50 + Math.sin(a) * r).toFixed(1) + '%');
    }
    return 'polygon(' + pts.join(',') + ')';
  }

  function charHtml(cls, url, fbText) {
    var img = url ? '<img class="kd-logo" alt="' + fbText + '" src="' + url + '" draggable="false">' : '<div class="kd-fb">' + fbText + '</div>';
    return '<div class="kd-char ' + cls + '"><div class="kd-mv"><div class="kd-bounce">' +
      '<div class="kd-body"><i class="kd-arm arm-out"><i class="glove"><i class="th"></i></i></i>' + img + '<i class="kd-arm arm-in"><i class="glove"><i class="th"></i></i></i></div>' +
      '<div class="kd-legs"><i class="leg l"><i class="shoe"></i></i><i class="leg r"><i class="shoe"></i></i></div>' +
      '</div></div><i class="kd-sp s1"></i><i class="kd-sp s2"></i><i class="kd-sp s3"></i></div>';
  }

  function build(aUrl, bUrl) {
    var el = document.createElement('div');
    el.id = 'kdIntro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Welcome to KADHARVA');
    el.innerHTML = '<div class="kd-bg"></div><div class="kd-rays"></div><div class="kd-floor"></div>' +
      '<div class="kd-stage" id="kdStage">' + charHtml('kd-a', aUrl, 'KADHARVA') + charHtml('kd-b', bUrl, 'CAMPUS ARTS FEST 2K26') + '<div class="kd-fx" id="kdFx"></div>' +
      '<div class="kd-title"><h1 class="kd-h">WELCOME TO KADHARVA!</h1><div class="kd-sub">CAMPUS ARTS FEST 2K26</div></div></div>' +
      '<button class="kd-skip" type="button">Skip &#9656;</button>';
    return el;
  }

  /* ---------- Scene 4: colour explosion ---------- */
  function boom() {
    var fx = document.getElementById('kdFx'), stage = document.getElementById('kdStage');
    if (!fx || !root) return;
    var rr = root.getBoundingClientRect(), fs = parseFloat(getComputedStyle(root).fontSize) || 16;
    function center(sel) { var r = root.querySelector(sel + ' .kd-body').getBoundingClientRect(); return { x: r.left + r.width / 2 - rr.left, y: r.top + r.height / 2 - rr.top }; }
    var A = center('.kd-a'), B = center('.kd-b'), M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
    var star = starPoly(11, 50, 33), star2 = starPoly(14, 50, 30);
    function add(html) { fx.insertAdjacentHTML('beforeend', html); }
    function burst(cls, p, delay, poly) {
      add('<div class="kd-burst o ' + (cls === 'mix' ? 'mix' : '') + '" style="left:' + p.x + 'px;top:' + p.y + 'px;clip-path:' + poly + ';animation-delay:' + delay + 'ms"></div>' +
          '<div class="kd-burst ' + cls + '" style="left:' + p.x + 'px;top:' + p.y + 'px;clip-path:' + poly + ';animation-delay:' + delay + 'ms"></div>');
    }
    add('<div class="kd-flash"></div>');
    burst('gold', { x: A.x - fs * 3, y: A.y }, 0, star);            /* KADHARVA: gold / yellow */
    burst('orange', { x: B.x + fs * 3, y: B.y }, 60, star2);        /* Campus Arts Fest: orange */
    burst('mix', M, 420, starPoly(9, 50, 36));                       /* both combine in the centre */
    ['#FDB827', '#FF7A00'].forEach(function (c, i) { add('<div class="kd-ring" style="left:' + M.x + 'px;top:' + M.y + 'px;border-color:' + c + ';animation-delay:' + (i * 140) + 'ms"></div>'); });
    for (var i = 0; i < 16; i++) add('<div class="kd-line" style="left:' + M.x + 'px;top:' + M.y + 'px;--a:' + (i * 22.5) + 'deg;animation-delay:' + (i % 2 ? 80 : 0) + 'ms"></div>');

    var goldC = ['#FDB827', '#FFD54A', '#FFF3B0', '#ffffff', '#F59E0B'], orgC = ['#FF7A00', '#FF9A33', '#FFD2A1', '#ffffff', '#E8590C'], mixC = ['#FDB827', '#FF7A00', '#2B7CD3', '#185ABD', '#ffffff', '#FFE08A'];
    function particles(origin, colors, n, spread) {
      for (var k = 0; k < n; k++) {
        var ang = rand(0, Math.PI * 2), dist = rand(6, spread), kind = Math.random();
        var col = colors[Math.floor(Math.random() * colors.length)];
        var cls = kind < .55 ? '' : kind < .8 ? ' c' : ' s';
        add('<i class="kd-p' + cls + '" style="left:' + origin.x + 'px;top:' + origin.y + 'px;background:' + col + ';color:' + col + ';--dx:' + (Math.cos(ang) * dist).toFixed(1) + 'em;--dy:' + (Math.sin(ang) * dist - 3).toFixed(1) + 'em;--r:' + rand(-540, 540).toFixed(0) + 'deg;animation-delay:' + rand(0, 260).toFixed(0) + 'ms">' + (cls === ' s' ? (Math.random() < .5 ? '&#10022;' : '&#9733;') : '') + '</i>');
      }
    }
    particles({ x: A.x - fs * 2, y: A.y }, goldC, 36, 22);
    particles({ x: B.x + fs * 2, y: B.y }, orgC, 36, 22);
    particles(M, mixC, 46, 30);
    stage.classList.add('kd-shake'); root.classList.add('kd-boom');
  }

  /* ---------- timeline ---------- */
  function run() {
    var stage = document.getElementById('kdStage');
    stage.classList.add('kd-in', 'kd-walk');                                                      // Scene 1: walk in along the bottom
    T(function () { stage.classList.remove('kd-walk'); stage.classList.add('kd-open'); }, 2200);   // Scene 2: stop, feet together, arms spread wide
    T(function () { stage.classList.add('kd-near', 'kd-walk'); }, 2800);                           // step closer (small walking steps)
    T(function () { stage.classList.remove('kd-walk'); }, 3400);
    T(function () { stage.classList.remove('kd-open'); stage.classList.add('kd-hug'); }, 3500);    // Scene 3: arms sweep around, hug
    T(function () { stage.classList.add('kd-squeeze'); }, 3900);
    T(function () { boom(); }, 4200);                                                              // Scene 4: colour explosion
    T(function () { stage.classList.remove('kd-hug', 'kd-squeeze'); stage.classList.add('kd-thumbs', 'kd-joy', 'kd-show'); }, 5000);   // Scene 5: thumbs up + welcome message
    T(function () { close(); }, 7300);
  }

  function close() {
    if (!root) return;
    timers.forEach(clearTimeout); timers = [];
    var r = root; root = null; running = false;
    mark(); document.documentElement.style.overflow = ''; document.body.style.overflow = '';
    r.classList.add('kd-out');
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 900);
  }

  function play(force) {
    if (running) return;
    if (!force && (seen() || /[?&]intro=0/.test(location.search))) return;
    running = true;
    var pending = 2, a = null, b = null;
    function ready() {
      if (--pending) return;
      root = build(a, b);
      document.body.appendChild(root);
      document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden';
      root.querySelector('.kd-skip').addEventListener('click', close);
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { root.querySelector('#kdStage').classList.add('kd-static', 'kd-near', 'kd-thumbs', 'kd-show'); T(close, 2800); }
      else requestAnimationFrame(function () { requestAnimationFrame(run); });
    }
    trim(NAME_IMG, function (u) { a = u; ready(); });
    trim(SUB_IMG, function (u) { b = u; ready(); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root) close(); });
  window.kdIntroPlay = play;
  window.kdIntroClose = close;
  play(false);
})();
