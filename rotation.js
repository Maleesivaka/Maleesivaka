/* KADHARVA — rotating Team x Category score view.
   Order: Team 1 (Senior, Junior, Sub-Junior, General) -> Team 2 (...) -> Team 3 (...) -> repeat */
var ROT_TEAMS = ["Qahira", "Qudsiya", "Qurthuba"];
var ROT_CATS = ["SENIOR", "JUNIOR", "SUB-JUNIOR", "GENERAL"];
var ROT_COL = { Qahira: "#0284c7", Qudsiya: "#059669", Qurthuba: "#ef4444" };
var rotIndex = 0, rotSeconds = 15, rotLeft = 15, rotPaused = false, rotTimer = null;

function rotSlides() {
  var a = [];
  ROT_TEAMS.forEach(function (t) { ROT_CATS.forEach(function (c) { a.push({ team: t, cat: c }); }); });
  return a;
}

function rotTotal(team, cat) {
  var t = 0;
  festResults.forEach(function (r) { if (r.team === team && r.category === cat) t += Number(r.mark || 0); });
  return t;
}

function rotRank(team, cat) {
  var list = ROT_TEAMS.map(function (t) { return { t: t, s: rotTotal(t, cat) }; }).sort(function (a, b) { return b.s - a.s; });
  for (var i = 0; i < list.length; i++) if (list[i].t === team) return i + 1;
  return 1;
}

function rotBanner(team, cat) {
  var col = ROT_COL[team];
  var nice = cat === 'GENERAL' ? 'GENERAL / GROUP ITEMS' : cat;
  return '<div style="background:linear-gradient(135deg,' + col + ',#103F91);color:#fff;border-radius:16px;padding:18px 22px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;box-shadow:0 10px 24px rgba(16,63,145,.2);">' +
    '<div><div style="font-size:12px;letter-spacing:3px;opacity:.85;">TEAM</div>' +
    '<div style="font-family:Marcellus,serif;font-size:clamp(26px,4vw,40px);letter-spacing:2px;text-transform:uppercase;line-height:1.1;">' + team + '</div>' +
    '<div style="display:inline-block;margin-top:6px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.4);padding:3px 14px;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:1.5px;">' + nice + '</div></div>' +
    '<div style="display:flex;gap:22px;text-align:center;">' +
    '<div><div style="font-size:11px;letter-spacing:2px;opacity:.85;">CATEGORY RANK</div><div style="font-size:clamp(28px,4vw,42px);font-weight:800;">#' + rotRank(team, cat) + '</div></div>' +
    '<div><div style="font-size:11px;letter-spacing:2px;opacity:.85;">POINTS</div><div style="font-size:clamp(28px,4vw,42px);font-weight:800;">' + rotTotal(team, cat) + '</div></div></div></div>';
}

function rotBuild(s) {
  var team = s.team, cat = s.cat, out = rotBanner(team, cat);
  var shown = function (r) { return r.published === 'YES' || r.published === undefined; };

  if (cat === 'GENERAL') {
    var rows = festResults.filter(function (r) { return r.team === team && r.category === 'GENERAL'; });
    if (rows.length === 0) return out + '<p class="rot-empty">No general / group results for this team yet.</p>';
    return out + '<div class="table-responsive rot-wrap"><table><thead><tr><th>Item</th><th>Mark</th><th>Place</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td><b>' + r.program + '</b></td><td style="font-weight:800;color:var(--navy-main);">' + r.mark + '</td><td style="color:var(--emerald-main);font-weight:700;">' + (r.place && r.place !== '-' ? r.place : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  var cands = festCandidates.filter(function (c) { return c.team === team && c.category === cat; });
  var catResults = festResults.filter(function (r) { return r.category === cat && shown(r); });
  var progs = [];
  festPrograms.forEach(function (p) { if (p.category === cat && progs.indexOf(p.name) < 0) progs.push(p.name); });
  catResults.forEach(function (r) { if (r.program && progs.indexOf(r.program) < 0 && r.regNo !== '-') progs.push(r.program); });

  if (cands.length === 0) return out + '<p class="rot-empty">No candidates registered for this team in ' + cat + '.</p>';

  var map = {};
  festResults.forEach(function (r) {
    if (r.team === team && r.category === cat && shown(r) && r.regNo && r.regNo !== '-') {
      map[String(r.regNo).trim().toUpperCase() + '|' + String(r.program).trim().toUpperCase()] = r;
    }
  });

  var data = cands.map(function (c) {
    var total = 0, cells = progs.map(function (p) {
      var r = map[String(c.regNo).trim().toUpperCase() + '|' + p.trim().toUpperCase()];
      if (!r) return '<td style="color:#cbd5e1;">–</td>';
      total += Number(r.mark || 0);
      var pl = (r.place && r.place !== '-') ? '<span class="rot-pl">' + r.place + '</span>' : '';
      return '<td style="font-weight:700;color:var(--navy-main);">' + r.mark + pl + '</td>';
    }).join('');
    return { c: c, cells: cells, total: total };
  }).sort(function (a, b) { return b.total - a.total || a.c.name.localeCompare(b.c.name); });

  var other = 0;
  festResults.forEach(function (r) { if (r.team === team && r.category === cat && (!r.regNo || r.regNo === '-')) other += Number(r.mark || 0); });

  var html = '<div class="table-responsive rot-wrap"><table class="matrix-table"><thead><tr><th>#</th><th class="sticky-col">Student</th><th>Reg No</th>' +
    progs.map(function (p) { return '<th class="vt" style="width:44px;min-width:0;height:150px;padding:8px 4px;vertical-align:bottom;background:#103F91;color:#EAF2FF;"><div style="writing-mode:vertical-rl;transform:rotate(180deg);margin:0 auto;max-height:150px;overflow:hidden;font-size:12px;font-weight:700;white-space:nowrap;text-transform:none;">' + p + '</div></th>'; }).join('') + '<th style="background:#185ABD;">Total</th></tr></thead><tbody>';
  data.forEach(function (d, i) {
    html += '<tr><td>' + (i + 1) + '</td><td class="sticky-col"><b>' + d.c.name + '</b></td><td><code style="font-weight:700;font-size:12px;">' + d.c.regNo + '</code></td>' +
      d.cells + '<td style="font-weight:800;color:var(--emerald-main);background:#f0fdf4;">' + d.total + '</td></tr>';
  });
  if (other) html += '<tr><td></td><td class="sticky-col"><i>Team / manual marks</i></td><td>–</td>' + progs.map(function () { return '<td></td>'; }).join('') + '<td style="font-weight:800;">' + other + '</td></tr>';
  return out + html + '</tbody></table></div>';
}

/* Shrinks row height, font size and column widths so every student fits on one screen (no scrolling). */
function rotFit(box, availH) {
  if (!box) return;
  var wrap = box.querySelector('.rot-wrap'), tbl = wrap && wrap.querySelector('table');
  if (!tbl || !tbl.tBodies[0] || !tbl.tBodies[0].rows.length) return;
  var rows = tbl.tBodies[0].rows.length, vts = tbl.querySelectorAll('th.vt'), longest = 0;
  Array.prototype.forEach.call(vts, function (t) { longest = Math.max(longest, (t.textContent || '').trim().length); });
  var headH = vts.length ? Math.min(128, Math.max(58, longest * 6.8 + 16)) : 34;
  var rh = Math.max(19, Math.min(46, Math.floor((availH - headH - 6) / rows)));
  var fs = Math.max(10, Math.min(15, Math.round(rh * 0.46)));
  wrap.style.maxHeight = 'none';
  /* column widths: small # and reg columns, wider program columns, the rest goes to the student name */
  var n = vts.length, rest = wrap.clientWidth - 36 - 110 - 76, colW = n ? Math.max(40, Math.min(104, Math.floor((rest - 210) / n))) : 0;
  tbl.style.tableLayout = 'fixed'; tbl.style.width = '100%';
  var hc = tbl.tHead.rows[0].cells; hc[0].style.width = '36px'; hc[1].style.width = 'auto'; hc[2].style.width = '110px'; hc[hc.length - 1].style.width = '76px';
  var apply = function (f) {
    tbl.style.fontSize = f + 'px';
    Array.prototype.forEach.call(tbl.tBodies[0].rows, function (tr) {
      tr.style.height = rh + 'px';
      Array.prototype.forEach.call(tr.cells, function (td) { td.style.padding = '0 7px'; td.style.fontSize = f + 'px'; td.style.lineHeight = '1.1'; });
    });
    Array.prototype.forEach.call(vts, function (t) {
      t.style.height = headH + 'px'; t.style.width = colW + 'px'; t.style.padding = '6px 2px';
      var d = t.firstElementChild; if (d) { d.style.maxHeight = (headH - 10) + 'px'; d.style.fontSize = Math.max(10, Math.min(13, f - 1)) + 'px'; d.style.color = '#111'; }
    });
  };
  apply(fs);
  var guard = 0;
  while (wrap.scrollWidth > wrap.clientWidth + 2 && fs > 9 && guard++ < 6) { fs--; apply(fs); }
}
function rotAvail() { return Math.max(260, window.innerHeight - 66 - 185); }

function renderStudentProgramMatrix() {
  var box = document.getElementById('studentProgramMatrixContainer');
  var slides = rotSlides();
  if (box) { box.innerHTML = rotBuild(slides[rotIndex]); rotFit(box, rotAvail()); }
  var cnt = document.getElementById('rotCount');
  if (cnt) cnt.textContent = (rotIndex + 1) + ' / ' + slides.length;
  rotRenderDisplay();
  if (!rotTimer) rotTimer = setInterval(rotTick, 1000);
}
window.addEventListener('resize', function () { var b = document.getElementById('studentProgramMatrixContainer'); if (b) rotFit(b, rotAvail()); rotRenderDisplay(); });

/* ---------- full-screen display mode (for a TV / projector) ---------- */
function rotDisplayOpen() {
  if (document.getElementById('rotDisplay')) return;
  var d = document.createElement('div'); d.id = 'rotDisplay';
  d.innerHTML = '<div class="rd-top"><div class="rd-logos"><img class="js-logo-name" src="' + festImgUrl(FEST_NAME_IMG) + '" alt=""><img class="js-logo-sub" src="' + festImgUrl(FEST_SUB_IMG) + '" alt=""></div>' +
    '<div class="rd-title">LIVE SCORECARD</div><div class="rd-ctl"><button onclick="rotPrev()" title="Previous"><i class="fa-solid fa-backward-step"></i></button><button id="rdPause" onclick="rotTogglePause()" title="Pause / play"><i class="fa-solid fa-pause"></i></button><button onclick="rotNext()" title="Next"><i class="fa-solid fa-forward-step"></i></button><button class="x" onclick="rotDisplayClose()" title="Close (Esc)"><i class="fa-solid fa-xmark"></i></button></div></div>' +
    '<div id="rotDispBody"></div><div class="rd-prog"><i id="rdBar"></i></div>';
  document.body.appendChild(d);
  document.documentElement.style.overflow = 'hidden';
  try { if (d.requestFullscreen) d.requestFullscreen(); } catch (e) { }
  rotRenderDisplay();
}
function rotDisplayClose() {
  var d = document.getElementById('rotDisplay'); if (!d) return;
  d.parentNode.removeChild(d); document.documentElement.style.overflow = '';
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { }
}
function rotRenderDisplay() {
  var d = document.getElementById('rotDisplay'); if (!d) return;
  var body = document.getElementById('rotDispBody');
  body.innerHTML = rotBuild(rotSlides()[rotIndex]);
  var top = d.querySelector('.rd-top').offsetHeight, banner = body.firstElementChild ? body.firstElementChild.offsetHeight + 14 : 0;
  rotFit(body, body.clientHeight - banner - 8);
  var p = document.getElementById('rdPause'); if (p) p.innerHTML = rotPaused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
}
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') rotDisplayClose(); });
document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement) rotDisplayClose(); });

function rotTick() {
  if (rotPaused) return;
  rotLeft--;
  var pct = (100 - (rotLeft / rotSeconds) * 100) + '%';
  var bar = document.getElementById('rotBar'); if (bar) bar.style.width = pct;
  var rb = document.getElementById('rdBar'); if (rb) rb.style.width = pct;
  if (rotLeft <= 0) rotNext();
}

function rotGo(i) {
  var n = rotSlides().length;
  rotIndex = (i + n) % n;
  rotLeft = rotSeconds;
  var bar = document.getElementById('rotBar'); if (bar) bar.style.width = '0%';
  var rb = document.getElementById('rdBar'); if (rb) rb.style.width = '0%';
  renderStudentProgramMatrix();
}
function rotNext() { rotGo(rotIndex + 1); }
function rotPrev() { rotGo(rotIndex - 1); }
function rotSetSpeed(v) { rotSeconds = Number(v) || 15; rotLeft = rotSeconds; }
function rotTogglePause() {
  rotPaused = !rotPaused;
  var b = document.getElementById('rotPauseBtn');
  if (b) b.innerHTML = rotPaused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
}

renderStudentProgramMatrix();
