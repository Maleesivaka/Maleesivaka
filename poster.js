var posterPhoto = null, posterBg = null, posterLogo = { name: null, sub: null };
(function () {
  [['name', FEST_NAME_IMG], ['sub', FEST_SUB_IMG]].forEach(function (p) {
    var i = new Image(); i.onload = function () { posterLogo[p[0]] = i; if (typeof drawPosterPreview === 'function') drawPosterPreview(); }; i.src = p[1];
  });
})();
var P_TEAM = { Qahira: '#0ea5e9', Qudsiya: '#10b981', Qurthuba: '#ef4444' };
var P_THEMES = {
  1: { bg: ['#09090b', '#18181b', '#050507'], acc: '#33A852', glow: '#F97316' },
  2: { bg: ['#1c0a00', '#7c2d12', '#09090b'], acc: '#fde047', glow: '#F97316' },
  3: { bg: ['#140a24', '#3b0764', '#09090b'], acc: '#33A852', glow: '#a855f7' },
  4: { bg: ['#041524', '#0c4a6e', '#09090b'], acc: '#33A852', glow: '#0ea5e9' },
  5: { bg: ['#0f0d08', '#422006', '#09090b'], acc: '#fde68a', glow: '#33A852' }
};
function pv(id, def) { var e = document.getElementById(id); return (e && e.value !== '') ? e.value : def; }
function readImg(file, cb) { var r = new FileReader(); r.onload = function () { var i = new Image(); i.onload = function () { cb(i); }; i.src = r.result; }; r.readAsDataURL(file); }
(function () {
  var bg = document.getElementById('pmBgFile'), ph = document.getElementById('pmPhotoFile');
  if (bg) bg.onchange = function () { if (this.files[0]) readImg(this.files[0], function (i) { posterBg = i; document.getElementById('pmShowHeader').checked = false; drawPosterPreview(); }); };
  if (ph) ph.onchange = function () { if (this.files[0]) readImg(this.files[0], function (i) { posterPhoto = i; drawPosterPreview(); }); };
  var clr = document.getElementById('pmClearBg'); if (clr) clr.onclick = function () { posterBg = null; document.getElementById('pmBgFile').value = ''; drawPosterPreview(); };
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
function fitFont(ctx, text, maxW, size, weight, family, min) {
  while (size > (min || 20)) { ctx.font = weight + ' ' + size + 'px ' + family; if (ctx.measureText(text).width <= maxW) break; size -= 2; }
  return size;
}
function drawPhoto(ctx, w, h, th, name) {
  var cx = w * pv('pmPhotoX', 50) / 100, cy = h * pv('pmPhotoY', 40) / 100, r = Number(pv('pmPhotoSize', 190));
  var shape = pv('pmShape', 'circle'), acc = th ? th.acc : '#33A852';
  var path = function (g) { g.beginPath(); if (shape === 'circle') g.arc(cx, cy, r, 0, Math.PI * 2); else g.roundRect(cx - r, cy - r, r * 2, r * 2, shape === 'rounded' ? r * 0.28 : 6); };
  ctx.save(); path(ctx); ctx.fillStyle = '#09090b'; ctx.fill(); ctx.restore();
  ctx.save(); path(ctx); ctx.clip();
  if (posterPhoto) {
    var s = Math.max(2 * r / posterPhoto.width, 2 * r / posterPhoto.height);
    ctx.drawImage(posterPhoto, cx - posterPhoto.width * s / 2, cy - posterPhoto.height * s / 2, posterPhoto.width * s, posterPhoto.height * s);
  } else {
    var ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase() || '★';
    ctx.fillStyle = acc; ctx.textAlign = 'center'; ctx.font = '700 ' + Math.round(r * 0.75) + "px 'Cinzel', serif";
    ctx.fillText(ini, cx, cy + r * 0.26);
  }
  ctx.restore();
  ctx.save(); path(ctx); ctx.lineWidth = 10; ctx.strokeStyle = acc; ctx.stroke(); ctx.restore();
}
function drawPosterPreview() {
  var c = document.getElementById('posterCanvas'); if (!c) return;
  var ctx = c.getContext('2d'), w = c.width, h = c.height;
  var th = P_THEMES[selectedPosterModel] || P_THEMES[1], acc = th.acc;
  var d = {
    name: pv('pmCandidateName', 'Candidate Name'), team: pv('pmTeam', 'Qahira'), cat: pv('pmCategory', 'Senior'),
    prog: pv('pmProgram', 'Competition Program'), pos: pv('pmRankText', '') || pv('pmPosition', 'FIRST PLACE'),
    sub: pv('pmSubHeader', 'Campus Arts Festival 2k26 • MMO'), greet: pv('pmGreeting', 'MUBARAK! HEARTY CONGRATULATIONS')
  };
  ctx.clearRect(0, 0, w, h);
  if (posterBg) {
    ctx.drawImage(posterBg, 0, 0, w, h);
  } else {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, th.bg[0]); g.addColorStop(0.5, th.bg[1]); g.addColorStop(1, th.bg[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = acc; ctx.lineWidth = 8; ctx.strokeRect(36, 36, w - 72, h - 72);
  }
  var off = posterBg ? Number(pv('pmTextY', 0)) : 0;
  var light = !posterBg || pv('pmTextColor', 'light') === 'light';
  if (!posterBg || document.getElementById('pmShowHeader').checked) {
    ctx.textAlign = 'center';
    if (posterLogo.name) {
      var k = Math.min(460 / posterLogo.name.width, 120 / posterLogo.name.height);
      ctx.drawImage(posterLogo.name, (w - posterLogo.name.width * k) / 2, 60, posterLogo.name.width * k, posterLogo.name.height * k);
    } else {
      ctx.fillStyle = acc; ctx.font = "800 68px 'Cinzel', serif"; ctx.fillText('MMO ARTS FEST', w / 2, 150);
    }
    ctx.fillStyle = '#F97316'; ctx.font = "700 24px 'Plus Jakarta Sans', sans-serif"; ctx.fillText(d.greet, w / 2, 265);
  }
  drawPhoto(ctx, w, h, th, d.name);
  // Ribbon
  ctx.fillStyle = acc; ctx.beginPath(); ctx.roundRect((w - 640) / 2, 760 + off, 640, 74, 37); ctx.fill();
  ctx.fillStyle = '#09090b'; ctx.textAlign = 'center'; ctx.font = "800 34px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText('★  ' + d.pos.toUpperCase() + '  ★', w / 2, 809 + off);
  // Name
  ctx.fillStyle = light ? '#ffffff' : '#09090b';
  fitFont(ctx, d.name, 900, 74, '800', "'Plus Jakarta Sans', sans-serif", 32);
  ctx.fillText(d.name, w / 2, 915 + off);
  // Team Pill
  ctx.fillStyle = P_TEAM[d.team] || '#F97316';
  ctx.beginPath(); ctx.roundRect((w - 580) / 2, 945 + off, 580, 56, 28); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = "700 26px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText('TEAM ' + d.team.toUpperCase() + ' • ' + d.cat.toUpperCase(), w / 2, 982 + off);
  // Program
  ctx.fillStyle = acc; ctx.font = "700 20px 'Plus Jakarta Sans', sans-serif"; ctx.fillText('COMPETITION ITEM', w / 2, 1065 + off);
  ctx.fillStyle = light ? '#ffffff' : '#09090b';
  fitFont(ctx, d.prog, 860, 46, '800', "'Plus Jakarta Sans', sans-serif", 24);
  ctx.fillText(d.prog, w / 2, 1125 + off);
  ctx.fillStyle = '#94a3b8'; ctx.font = "600 20px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(d.sub, w / 2, 1245);
}
