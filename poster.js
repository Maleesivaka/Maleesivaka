/* KADHARVA — Poster Studio v2 (1080 x 1350)
   - 5 redesigned built-in models
   - upload your own PNG poster, upload candidate photo, drag to position */
var posterPhoto = null, posterBg = null;
var posterLogo = { name: null, sub: null };
(function loadPosterLogos() {
  [['name', FEST_NAME_IMG], ['sub', FEST_SUB_IMG]].forEach(function (p) {
    kdTrim(p[1], function (u) {
      if (!u) return;
      var i = new Image();
      i.onload = function () { posterLogo[p[0]] = i; if (typeof drawPosterPreview === 'function') drawPosterPreview(); };
      i.src = u;
    });
  });
})();
var P_TEAM = { Qahira: '#0284c7', Qudsiya: '#059669', Qurthuba: '#ef4444' };


function pv(id, def) { var e = document.getElementById(id); return (e && e.value !== '') ? e.value : def; }

function readImg(file, cb) {
  var r = new FileReader();
  r.onload = function () { var i = new Image(); i.onload = function () { cb(i); }; i.src = r.result; };
  r.readAsDataURL(file);
}

(function setupPosterStudio() {
  var bg = document.getElementById('pmBgFile'), ph = document.getElementById('pmPhotoFile');
  if (bg) bg.onchange = function () {
    if (this.files[0]) readImg(this.files[0], function (i) {
      posterBg = i; document.getElementById('pmShowHeader').checked = false; drawPosterPreview();
    });
  };
  if (ph) ph.onchange = function () {
    if (this.files[0]) readImg(this.files[0], function (i) { posterPhoto = i; drawPosterPreview(); });
  };
  var clr = document.getElementById('pmClearBg');
  if (clr) clr.onclick = function () { posterBg = null; document.getElementById('pmBgFile').value = ''; drawPosterPreview(); };

  var nm = document.getElementById('pmCandidateName');
  if (nm) nm.addEventListener('change', function () {
    var c = festCandidates.filter(function (x) { return x.name.toLowerCase() === nm.value.trim().toLowerCase(); })[0];
    if (c) {
      document.getElementById('pmTeam').value = c.team;
      document.getElementById('pmCategory').value = c.category;
      drawPosterPreview();
    }
  });

  var cv = document.getElementById('posterCanvas'), drag = false;
  if (cv) {
    cv.style.touchAction = 'none'; cv.style.cursor = 'move';
    var mv = function (e) {
      if (!drag) return;
      var r = cv.getBoundingClientRect();
      document.getElementById('pmPhotoX').value = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100));
      document.getElementById('pmPhotoY').value = Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100));
      drawPosterPreview();
    };
    cv.addEventListener('pointerdown', function (e) { drag = true; mv(e); });
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', function () { drag = false; });
  }
})();

var _openPoster = openPosterStudioWithData;
openPosterStudioWithData = function () {
  posterPhoto = null;
  var f = document.getElementById('pmPhotoFile'); if (f) f.value = '';
  var rk = document.getElementById('pmRankText'); if (rk) rk.value = '';
  var nl = document.getElementById('pmNameList'), pl = document.getElementById('pmProgList');
  if (nl) nl.innerHTML = festCandidates.map(function (c) { return '<option value="' + c.name + '">'; }).join('');
  if (pl) {
    var names = []; festPrograms.forEach(function (p) { if (names.indexOf(p.name) < 0) names.push(p.name); });
    pl.innerHTML = names.map(function (n) { return '<option value="' + n + '">'; }).join('');
  }
  _openPoster.apply(this, arguments);
};

/* ---------- helpers ---------- */
function fitFont(ctx, text, maxW, size, weight, family, min) {
  while (size > (min || 20)) {
    ctx.font = weight + ' ' + size + 'px ' + family;
    if (ctx.measureText(text).width <= maxW) break;
    size -= 2;
  }
  return size;
}
function star(ctx, cx, cy, r) {
  ctx.beginPath();
  for (var i = 0; i < 16; i++) {
    var a = Math.PI / 8 * i - Math.PI / 2, rr = i % 2 ? r * 0.62 : r;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
}
function spaced(ctx, px) { try { ctx.letterSpacing = px + 'px'; } catch (e) { } }

/* =====================================================================
   Professional poster designs (1080 x 1350)
   header with both logos -> photo with medal -> name -> team / category -> item card -> footer
   ===================================================================== */
var POSTER_THEMES = {
  1: { label: 'Royal Blue',     dark: true,  bg: ['#0D2C69', '#185ABD', '#0A2455'], acc: '#FDB827', text: '#FFFFFF', muted: 'rgba(255,255,255,.74)', card: 'rgba(255,255,255,.12)', line: 'rgba(255,255,255,.24)' },
  2: { label: 'Midnight Gold',  dark: true,  bg: ['#080B13', '#151B2D', '#05070C'], acc: '#D9B45A', text: '#FFFFFF', muted: 'rgba(255,255,255,.7)',  card: 'rgba(255,255,255,.07)', line: 'rgba(217,180,90,.45)' },
  3: { label: 'Sunrise Orange', dark: true,  bg: ['#D9480F', '#F97316', '#FDB827'], acc: '#FFFFFF', text: '#FFFFFF', muted: 'rgba(255,255,255,.86)', card: 'rgba(20,16,10,.22)',    line: 'rgba(255,255,255,.4)' },
  4: { label: 'Clean White',    dark: false, bg: ['#FFFFFF', '#F4F7FC', '#E7EEF9'], acc: '#185ABD', text: '#14213D', muted: '#5B6678',                 card: '#FFFFFF',               line: '#D9E2F0' },
  5: { label: 'Team Colour',    dark: true,  team: true,                           acc: '#FDB827', text: '#FFFFFF', muted: 'rgba(255,255,255,.78)', card: 'rgba(255,255,255,.14)', line: 'rgba(255,255,255,.3)' }
};
function shade(hex, f) {
  var n = parseInt(hex.replace('#', ''), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  var t = f < 0 ? 0 : 255, p = Math.abs(f);
  return 'rgb(' + Math.round((t - r) * p + r) + ',' + Math.round((t - g) * p + g) + ',' + Math.round((t - b) * p + b) + ')';
}
function themeFor(d) {
  var t = POSTER_THEMES[selectedPosterModel] || POSTER_THEMES[1];
  if (t.team) { var c = P_TEAM[d.team] || '#185ABD'; t = Object.assign({}, t, { bg: [shade(c, -0.45), c, shade(c, -0.6)] }); }
  return t;
}
function rankInfo(pos) {
  var s = String(pos || '').toLowerCase();
  if (/(^|\b)1(st)?(\b|$)|first|winner|champion/.test(s)) return { n: '1', suf: 'ST', c1: '#FFE9A0', c2: '#E0A100', edge: '#9A6B00' };
  if (/(^|\b)2(nd)?(\b|$)|second|runner/.test(s)) return { n: '2', suf: 'ND', c1: '#F6F8FA', c2: '#9AA5B1', edge: '#5F6B78' };
  if (/(^|\b)3(rd)?(\b|$)|third/.test(s)) return { n: '3', suf: 'RD', c1: '#F7C79A', c2: '#B8651F', edge: '#7A3E0E' };
  return null;
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function ctext(ctx, str, x, y, font, color, align, sp) { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || 'center'; spaced(ctx, sp || 0); ctx.fillText(str, x, y); spaced(ctx, 0); }

function drawBackdrop(ctx, w, h, th, cy) {
  var g = ctx.createLinearGradient(0, 0, w * 0.35, h);
  g.addColorStop(0, th.bg[0]); g.addColorStop(0.5, th.bg[1]); g.addColorStop(1, th.bg[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  var rg = ctx.createRadialGradient(w / 2, cy, 40, w / 2, cy, 520);
  rg.addColorStop(0, th.dark ? 'rgba(255,255,255,.2)' : 'rgba(24,90,189,.14)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.strokeStyle = th.dark ? 'rgba(255,255,255,.08)' : 'rgba(24,90,189,.09)'; ctx.lineWidth = 2;
  [[w + 40, -30, 360], [w + 40, -30, 270], [-70, h - 150, 320], [-70, h - 150, 230]].forEach(function (c) { ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, Math.PI * 2); ctx.stroke(); });
  ctx.fillStyle = th.dark ? 'rgba(255,255,255,.13)' : 'rgba(24,90,189,.16)';
  for (var i = 0; i < 6; i++) for (var j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(w - 210 + i * 26, 250 + j * 26, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = th.dark ? 'rgba(255,255,255,.05)' : 'rgba(24,90,189,.06)';
  for (var k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(0, h - 90 - k * 46); ctx.lineTo(220 + k * 40, h - 90 - k * 46 - 120); ctx.lineTo(260 + k * 40, h - 90 - k * 46 - 120); ctx.lineTo(0, h - 40 - k * 46); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  if (!th.dark) { ctx.fillStyle = th.acc; ctx.fillRect(0, 0, w, 14); ctx.fillRect(0, h - 14, w, 14); }
  ctx.strokeStyle = th.dark ? 'rgba(255,255,255,.2)' : 'rgba(24,90,189,.2)'; ctx.lineWidth = 2; rr(ctx, 30, 30, w - 60, h - 60, 26); ctx.stroke();
}

function drawLogos(ctx, w, th, greet) {
  var n = posterLogo.name, s = posterLogo.sub, m = 78, top = 70;
  if (n) { var k = Math.min(300 / n.width, 118 / n.height); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 14; ctx.drawImage(n, m, top, n.width * k, n.height * k); ctx.restore(); }
  else ctext(ctx, 'KADHARVA', m, top + 70, "800 52px 'Poppins', sans-serif", th.text, 'left', 3);
  if (s) { var k2 = Math.min(280 / s.width, 100 / s.height), sw = s.width * k2, sh = s.height * k2; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 14; ctx.drawImage(s, w - m - sw, top + 10, sw, sh); ctx.restore(); }
  else ctext(ctx, 'CAMPUS ARTS FEST 2K26', w - m, top + 70, "700 22px 'Poppins', sans-serif", th.acc, 'right', 3);
  ctx.strokeStyle = th.dark ? 'rgba(255,255,255,.28)' : th.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(m, 222); ctx.lineTo(w - m, 222); ctx.stroke();
  ctx.fillStyle = th.acc; ctx.fillRect(m, 219, 110, 6);
  if (greet) { ctx.font = "700 26px 'Poppins', sans-serif"; var fs = fitFont(ctx, greet.toUpperCase(), w - 2 * m, 26, '700', "'Poppins', sans-serif", 16); ctext(ctx, greet.toUpperCase(), w / 2, 280, '700 ' + fs + "px 'Poppins', sans-serif", th.acc, 'center', 6); }
}

function drawPhoto(ctx, w, h, th, name) {
  var cx = w * pv('pmPhotoX', 50) / 100, cy = h * pv('pmPhotoY', 44) / 100, r = Number(pv('pmPhotoSize', 210));
  var shape = pv('pmShape', 'circle'), acc = th ? th.acc : '#FDB827';
  var path = function (rad) { ctx.beginPath(); if (shape === 'circle') ctx.arc(cx, cy, rad, 0, Math.PI * 2); else ctx.roundRect(cx - rad, cy - rad, rad * 2, rad * 2, shape === 'rounded' ? rad * 0.26 : 8); };
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 16; path(r + 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  ctx.save(); path(r); ctx.clip();
  if (posterPhoto) {
    var s = Math.max(2 * r / posterPhoto.width, 2 * r / posterPhoto.height), iw = posterPhoto.width * s, ih = posterPhoto.height * s;
    ctx.drawImage(posterPhoto, cx - iw / 2, cy - ih / 2, iw, ih);
  } else {
    var g = ctx.createLinearGradient(cx, cy - r, cx, cy + r); g.addColorStop(0, '#EAF1FC'); g.addColorStop(1, '#C9DAF3');
    ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    var ini = String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase() || '★';
    ctext(ctx, ini, cx, cy + r * 0.27, '800 ' + Math.round(r * 0.78) + "px 'Poppins', sans-serif", '#185ABD', 'center', 2);
  }
  ctx.restore();
  path(r + 12); ctx.lineWidth = 3; ctx.strokeStyle = acc; ctx.stroke();
  path(r + 30); ctx.lineWidth = 2; ctx.strokeStyle = th && !th.dark ? 'rgba(24,90,189,.3)' : 'rgba(255,255,255,.4)'; ctx.stroke();
  return { cx: cx, cy: cy, r: r };
}

function drawMedal(ctx, ph, info, th) {
  var shape = pv('pmShape', 'circle'), k = shape === 'circle' ? 0.74 : 0.9;
  var x = ph.cx + ph.r * k, y = ph.cy + ph.r * k, R = 76;
  if (info) {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    [[-34, '#C8102E'], [10, '#185ABD']].forEach(function (t, i) {
      ctx.beginPath(); ctx.moveTo(x + t[0] - 8, y + R - 16); ctx.lineTo(x + t[0] + 36, y + R - 16); ctx.lineTo(x + t[0] + 36, y + R + 48); ctx.lineTo(x + t[0] + 14, y + R + 34); ctx.lineTo(x + t[0] - 8, y + R + 48); ctx.closePath(); ctx.fillStyle = t[1]; ctx.fill();
    });
    ctx.restore();
  }
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); var g = ctx.createLinearGradient(x - R, y - R, x + R, y + R);
  if (info) { g.addColorStop(0, info.c1); g.addColorStop(1, info.c2); } else { g.addColorStop(0, '#5C9BEA'); g.addColorStop(1, '#185ABD'); }
  ctx.fillStyle = g; ctx.fill(); ctx.restore();
  ctx.lineWidth = 6; ctx.strokeStyle = info ? info.edge : '#0F3F8F'; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(x, y, R - 12, 0, Math.PI * 2); ctx.stroke();
  if (info) {
    ctext(ctx, info.n, x - 8, y + 20, "800 74px 'Poppins', sans-serif", info.edge, 'center');
    ctext(ctx, info.suf, x + 34, y - 14, "800 24px 'Poppins', sans-serif", info.edge, 'center');
    ctext(ctx, 'PLACE', x, y + 46, "700 14px 'Poppins', sans-serif", info.edge, 'center', 3);
  } else {
    ctext(ctx, '★', x, y + 20, "800 62px 'Poppins', sans-serif", '#FFFFFF', 'center');
  }
}

function drawIdentity(ctx, w, th, d, off, panel) {
  var name = d.name, y = 924 + off;
  ctx.save(); if (th.dark) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3; }
  var fs = fitFont(ctx, name, w - 150, 84, '800', "'Poppins', sans-serif", 36);
  ctext(ctx, name, w / 2, y, '800 ' + fs + "px 'Poppins', sans-serif", th.text, 'center');
  ctx.restore();
  var chips = [['TEAM ' + d.team.toUpperCase(), P_TEAM[d.team] || th.acc, '#FFFFFF'], [String(d.cat).toUpperCase(), th.dark ? 'rgba(255,255,255,.2)' : '#E7EEF9', th.dark ? '#FFFFFF' : '#185ABD']];
  ctx.font = "700 24px 'Poppins', sans-serif"; spaced(ctx, 2);
  var ws = chips.map(function (c) { return ctx.measureText(c[0]).width + 56; }), total = ws[0] + ws[1] + 16, x = (w - total) / 2, cy = y + 40;
  chips.forEach(function (c, i) { rr(ctx, x, cy, ws[i], 54, 27); ctx.fillStyle = c[1]; ctx.fill(); ctext(ctx, c[0], x + ws[i] / 2, cy + 36, "700 24px 'Poppins', sans-serif", c[2], 'center', 2); x += ws[i] + 16; });
  spaced(ctx, 0);

  var cardY = 1046 + off, cardH = 150, cx = 78, cw = w - 156;
  if (panel === false) return;
  ctx.save(); if (!th.dark) { ctx.shadowColor = 'rgba(24,90,189,.16)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 8; }
  rr(ctx, cx, cardY, cw, cardH, 22); ctx.fillStyle = th.card; ctx.fill(); ctx.restore();
  ctx.lineWidth = 2; ctx.strokeStyle = th.line; rr(ctx, cx, cardY, cw, cardH, 22); ctx.stroke();
  ctx.strokeStyle = th.line; ctx.beginPath(); ctx.moveTo(w * 0.62, cardY + 28); ctx.lineTo(w * 0.62, cardY + cardH - 28); ctx.stroke();
  ctext(ctx, 'COMPETITION ITEM', cx + 34, cardY + 46, "700 18px 'Poppins', sans-serif", th.acc, 'left', 4);
  var iw = w * 0.62 - cx - 60, ifs = fitFont(ctx, d.prog, iw, 46, '800', "'Poppins', sans-serif", 22);
  ctext(ctx, d.prog, cx + 34, cardY + 106, '800 ' + ifs + "px 'Poppins', sans-serif", th.text, 'left');
  ctext(ctx, 'RESULT', w * 0.62 + 32, cardY + 46, "700 18px 'Poppins', sans-serif", th.acc, 'left', 4);
  var res = String(d.pos).toUpperCase(), rw = w - 78 - (w * 0.62 + 32) - 30, rfs = fitFont(ctx, res, rw, 36, '800', "'Poppins', sans-serif", 18);
  ctext(ctx, res, w * 0.62 + 32, cardY + 104, '800 ' + rfs + "px 'Poppins', sans-serif", th.text, 'left');
}

function drawFooter(ctx, w, h, th) {
  ctx.strokeStyle = th.dark ? 'rgba(255,255,255,.25)' : th.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(78, 1246); ctx.lineTo(w - 78, 1246); ctx.stroke();
  ctext(ctx, 'KADHARVA  ·  CAMPUS ARTS FEST 2K26', 78, 1290, "700 19px 'Poppins', sans-serif", th.text, 'left', 2);
  ctext(ctx, 'OFFICIAL RESULT PUBLICATION', w - 78, 1290, "600 16px 'Poppins', sans-serif", th.muted, 'right', 3);
}

/* built-in designs */
function drawTheme(ctx, c, d) {
  var w = c.width, h = c.height, th = themeFor(d), cy = h * pv('pmPhotoY', 44) / 100;
  drawBackdrop(ctx, w, h, th, cy);
  drawLogos(ctx, w, th, d.greet);
  var ph = drawPhoto(ctx, w, h, th, d.name);
  drawMedal(ctx, ph, rankInfo(d.pos), th);
  drawIdentity(ctx, w, th, d, 0, true);
  drawFooter(ctx, w, h, th);
}

/* your own uploaded PNG poster: logos / header are optional, the rest is placed on top */
function drawCustom(ctx, c, d) {
  var w = c.width, h = c.height, light = pv('pmTextColor', 'light') === 'light', off = Number(pv('pmTextY', 0));
  var th = { dark: light, text: light ? '#FFFFFF' : '#111827', muted: light ? 'rgba(255,255,255,.8)' : '#334155', acc: '#FDB827', card: light ? 'rgba(10,20,40,.55)' : 'rgba(255,255,255,.78)', line: light ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.15)' };
  ctx.drawImage(posterBg, 0, 0, w, h);
  if (document.getElementById('pmShowHeader').checked) drawLogos(ctx, w, th, d.greet);
  var ph = drawPhoto(ctx, w, h, th, d.name);
  drawMedal(ctx, ph, rankInfo(d.pos), th);
  drawIdentity(ctx, w, th, d, off, true);
}

/* ---------- entry point ---------- */
function drawPosterPreview() {
  var c = document.getElementById('posterCanvas'), ctx = c.getContext('2d');
  var posSel = pv('pmPosition', 'FIRST PLACE'), rank = pv('pmRankText', '');
  var d = {
    name: pv('pmCandidateName', 'Candidate Name'), team: pv('pmTeam', 'Qahira'), cat: pv('pmCategory', 'Senior'),
    prog: pv('pmProgram', 'Competition Program'), pos: rank || posSel,
    sub: pv('pmSubHeader', 'Campus Arts Festival 2k26 • MMO'), greet: pv('pmGreeting', 'MUBARAK! HEARTY CONGRATULATIONS')
  };
  var go = function () {
    ctx.clearRect(0, 0, c.width, c.height);
    if (posterBg) drawCustom(ctx, c, d); else drawTheme(ctx, c, d);
  };
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load("700 40px Cinzel"), document.fonts.load("800 40px Poppins"), document.fonts.load("600 40px Poppins")]).then(go, go);
  } else go();
}
