/* MMO Arts Fest — Poster Studio v2 (1080 x 1350)
   - 5 redesigned built-in models
   - upload your own PNG poster, upload candidate photo, drag to position */
var posterPhoto = null, posterBg = null;
var P_TEAM = { Qahira: '#0284c7', Qusdiya: '#059669', Qurthuba: '#ef4444' };
var P_THEMES = {
  1: { bg: ['#071a3d', '#1e3a8a', '#050f26'], acc: '#f5c451', glow: '#3b82f6' },
  2: { bg: ['#022c22', '#0b6b4f', '#03261d'], acc: '#fcd34d', glow: '#10b981' },
  3: { bg: ['#3b0a14', '#8a1c33', '#1f050a'], acc: '#f7c873', glow: '#f43f5e' },
  4: { bg: ['#050816', '#0b3a6b', '#041225'], acc: '#38bdf8', glow: '#0ea5e9' },
  5: { bg: ['#1a1203', '#5c3b07', '#0e0802'], acc: '#ffd76a', glow: '#f59e0b' }
};

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

function drawPhoto(ctx, w, h, th, name) {
  var cx = w * pv('pmPhotoX', 50) / 100, cy = h * pv('pmPhotoY', 40) / 100, r = Number(pv('pmPhotoSize', 190));
  var shape = pv('pmShape', 'circle'), acc = th ? th.acc : '#f5c451';
  var path = function (g) {
    g.beginPath();
    if (shape === 'circle') g.arc(cx, cy, g === ctx ? r : r, 0, Math.PI * 2);
    else g.roundRect(cx - r, cy - r, r * 2, r * 2, shape === 'rounded' ? r * 0.28 : 6);
  };
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
  path(ctx); ctx.fillStyle = '#0b1220'; ctx.fill();
  ctx.restore();
  ctx.save();
  path(ctx); ctx.clip();
  if (posterPhoto) {
    var s = Math.max(2 * r / posterPhoto.width, 2 * r / posterPhoto.height);
    var iw = posterPhoto.width * s, ih = posterPhoto.height * s;
    ctx.drawImage(posterPhoto, cx - iw / 2, cy - ih / 2, iw, ih);
  } else {
    var g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,.05)');
    ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    var ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase() || '★';
    ctx.fillStyle = acc; ctx.textAlign = 'center'; ctx.font = '700 ' + Math.round(r * 0.8) + "px 'Cinzel', serif";
    ctx.fillText(ini, cx, cy + r * 0.28);
  }
  ctx.restore();
  ctx.save();
  path(ctx); ctx.lineWidth = 12; ctx.strokeStyle = acc; ctx.stroke();
  ctx.restore();
  if (shape === 'circle') {
    ctx.beginPath(); ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke();
  }
}

function drawRibbon(ctx, w, y, text, acc) {
  var bw = 700, bh = 82, x0 = (w - bw) / 2, x1 = x0 + bw, n = 34;
  var g = ctx.createLinearGradient(0, y, 0, y + bh);
  g.addColorStop(0, '#fff2b8'); g.addColorStop(0.5, acc); g.addColorStop(1, '#b8860b');
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1 - n, y + bh / 2); ctx.lineTo(x1, y + bh);
  ctx.lineTo(x0, y + bh); ctx.lineTo(x0 + n, y + bh / 2); ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#2a1a00'; ctx.textAlign = 'center';
  spaced(ctx, 3);
  var t = '★  ' + text.toUpperCase() + '  ★';
  fitFont(ctx, t, bw - 120, 38, '800', "'Poppins', sans-serif", 22);
  ctx.fillText(t, w / 2, y + bh / 2 + 13);
  spaced(ctx, 0);
}

function drawHeader(ctx, w, sub, greet, acc, light) {
  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16;
  ctx.fillStyle = light ? '#fff6dc' : acc;
  spaced(ctx, 6);
  fitFont(ctx, 'MMO ARTS FEST', 860, 80, '700', "'Cinzel', serif", 40);
  ctx.fillText('MMO ARTS FEST', w / 2, 168);
  ctx.restore();
  spaced(ctx, 5);
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = "600 23px 'Poppins', sans-serif";
  ctx.fillText(sub.toUpperCase(), w / 2, 214);
  spaced(ctx, 0);
  ctx.strokeStyle = acc; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w / 2 - 300, 246); ctx.lineTo(w / 2 - 24, 246); ctx.moveTo(w / 2 + 24, 246); ctx.lineTo(w / 2 + 300, 246); ctx.stroke();
  ctx.save(); ctx.translate(w / 2, 246); ctx.rotate(Math.PI / 4); ctx.fillStyle = acc; ctx.fillRect(-8, -8, 16, 16); ctx.restore();
  spaced(ctx, 3);
  ctx.fillStyle = '#fff'; ctx.font = "700 27px 'Poppins', sans-serif";
  fitFont(ctx, greet, 880, 27, '700', "'Poppins', sans-serif", 16);
  ctx.fillText(greet, w / 2, 300);
  spaced(ctx, 0);
}

/* ---------- built-in themed models ---------- */
function drawTheme(ctx, c, d) {
  var w = c.width, h = c.height, th = P_THEMES[selectedPosterModel] || P_THEMES[1], acc = th.acc;
  var g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, th.bg[0]); g.addColorStop(0.5, th.bg[1]); g.addColorStop(1, th.bg[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.beginPath(); ctx.rect(34, 34, w - 68, h - 68); ctx.clip();
  var cy = h * pv('pmPhotoY', 40) / 100;
  var rg = ctx.createRadialGradient(w / 2, cy, 40, w / 2, cy, 680);
  rg.addColorStop(0, th.glow + '88'); rg.addColorStop(1, 'transparent');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
  ctx.translate(w / 2, cy);
  for (var i = 0; i < 24; i++) {
    ctx.rotate(Math.PI * 2 / 24);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-45, -1000); ctx.lineTo(45, -1000); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath(); ctx.rect(34, 34, w - 68, h - 68); ctx.clip();
  ctx.strokeStyle = acc; ctx.globalAlpha = 0.09; ctx.lineWidth = 1.5;
  for (var y = 0, row = 0; y < h + 120; y += 110, row++)
    for (var x = (row % 2) * 60; x < w + 120; x += 120) { star(ctx, x, y, 36); ctx.stroke(); }
  ctx.restore();

  var fg = ctx.createLinearGradient(0, 0, w, h);
  fg.addColorStop(0, '#fff2b8'); fg.addColorStop(0.5, acc); fg.addColorStop(1, '#b8860b');
  ctx.strokeStyle = fg; ctx.lineWidth = 9; ctx.strokeRect(34, 34, w - 68, h - 68);
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.strokeRect(58, 58, w - 116, h - 116);
  [[58, 58], [w - 58, 58], [58, h - 58], [w - 58, h - 58]].forEach(function (p) {
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(Math.PI / 4); ctx.fillStyle = acc; ctx.fillRect(-13, -13, 26, 26); ctx.restore();
  });

  drawHeader(ctx, w, d.sub, d.greet, acc, false);
  drawPhoto(ctx, w, h, th, d.name);
  drawRibbon(ctx, w, 765, d.pos, acc);

  ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 14;
  fitFont(ctx, d.name, 900, 80, '800', "'Poppins', sans-serif", 34);
  ctx.fillText(d.name, w / 2, 925);
  ctx.restore();

  var chip = 'TEAM ' + d.team.toUpperCase() + '  •  ' + d.cat.toUpperCase();
  spaced(ctx, 2); ctx.font = "700 28px 'Poppins', sans-serif";
  var cw = Math.min(860, ctx.measureText(chip).width + 70);
  ctx.fillStyle = P_TEAM[d.team] || acc;
  ctx.beginPath(); ctx.roundRect((w - cw) / 2, 954, cw, 62, 31); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillText(chip, w / 2, 995); spaced(ctx, 0);

  ctx.fillStyle = 'rgba(255,255,255,.09)'; ctx.strokeStyle = acc; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(110, 1050, w - 220, 128, 18); ctx.fill(); ctx.stroke();
  spaced(ctx, 4); ctx.fillStyle = acc; ctx.font = "600 20px 'Poppins', sans-serif";
  ctx.fillText('COMPETITION ITEM', w / 2, 1088); spaced(ctx, 0);
  ctx.fillStyle = '#fff';
  fitFont(ctx, d.prog, w - 300, 50, '800', "'Poppins', sans-serif", 24);
  ctx.fillText(d.prog, w / 2, 1150);

  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = "500 21px 'Poppins', sans-serif";
  ctx.fillText('MMO Orphanage  •  Fest Organizing Committee', w / 2, 1232);
  ctx.fillStyle = acc; ctx.font = "600 17px 'Poppins', sans-serif"; spaced(ctx, 3);
  ctx.fillText('OFFICIAL RESULT PUBLICATION', w / 2, 1262); spaced(ctx, 0);
}

/* ---------- user-uploaded PNG poster ---------- */
function drawCustom(ctx, c, d) {
  var w = c.width, h = c.height, light = pv('pmTextColor', 'light') === 'light';
  ctx.drawImage(posterBg, 0, 0, w, h);
  var col = light ? '#ffffff' : '#111827', off = Number(pv('pmTextY', 0));
  if (document.getElementById('pmShowHeader').checked) drawHeader(ctx, w, d.sub, d.greet, '#f5c451', light);
  drawPhoto(ctx, w, h, null, d.name);
  drawRibbon(ctx, w, 765 + off, d.pos, '#f5c451');
  ctx.textAlign = 'center';
  ctx.save();
  if (light) { ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 14; }
  ctx.fillStyle = col;
  fitFont(ctx, d.name, 900, 80, '800', "'Poppins', sans-serif", 34);
  ctx.fillText(d.name, w / 2, 925 + off);
  spaced(ctx, 2);
  fitFont(ctx, 'TEAM ' + d.team.toUpperCase() + ' • ' + d.cat.toUpperCase(), 880, 30, '700', "'Poppins', sans-serif", 18);
  ctx.fillText('TEAM ' + d.team.toUpperCase() + ' • ' + d.cat.toUpperCase(), w / 2, 985 + off);
  spaced(ctx, 0);
  fitFont(ctx, d.prog, 900, 48, '800', "'Poppins', sans-serif", 22);
  ctx.fillText(d.prog, w / 2, 1060 + off);
  ctx.restore();
}

/* ---------- entry point (replaces the old one) ---------- */
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
