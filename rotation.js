/* MMO Arts Fest — rotating Team x Category score view.
   Order: Team 1 (Senior, Junior, Sub-Junior, General) -> Team 2 (...) -> Team 3 (...) -> repeat */
var ROT_TEAMS = ["Qahira", "Qusdiya", "Qurthuba"];
var ROT_CATS = ["SENIOR", "JUNIOR", "SUB-JUNIOR", "GENERAL"];
var ROT_COL = { Qahira: "#0284c7", Qusdiya: "#059669", Qurthuba: "#ef4444" };
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
  return '<div style="background:linear-gradient(135deg,' + col + ',#062a24);color:#fff;border-radius:16px;padding:18px 22px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;box-shadow:0 10px 24px rgba(6,42,36,.2);">' +
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
  var withRes = progs.filter(function (n) { return catResults.some(function (r) { return r.program === n; }); });
  catResults.forEach(function (r) { if (r.program && withRes.indexOf(r.program) < 0 && r.regNo !== '-') withRes.push(r.program); });
  if (withRes.length > 0) progs = withRes;

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
    progs.map(function (p) { return '<th>' + p + '</th>'; }).join('') + '<th style="background:#0b5d4b;">Total</th></tr></thead><tbody>';
  data.forEach(function (d, i) {
    html += '<tr><td>' + (i + 1) + '</td><td class="sticky-col"><b>' + d.c.name + '</b></td><td><code style="font-weight:700;font-size:12px;">' + d.c.regNo + '</code></td>' +
      d.cells + '<td style="font-weight:800;color:var(--emerald-main);background:#f0fdf4;">' + d.total + '</td></tr>';
  });
  if (other) html += '<tr><td></td><td class="sticky-col"><i>Team / manual marks</i></td><td>–</td>' + progs.map(function () { return '<td></td>'; }).join('') + '<td style="font-weight:800;">' + other + '</td></tr>';
  return out + html + '</tbody></table></div>';
}

function renderStudentProgramMatrix() {
  var box = document.getElementById('studentProgramMatrixContainer');
  if (!box) return;
  var slides = rotSlides();
  box.innerHTML = rotBuild(slides[rotIndex]);
  var cnt = document.getElementById('rotCount');
  if (cnt) cnt.textContent = (rotIndex + 1) + ' / ' + slides.length;
  if (!rotTimer) rotTimer = setInterval(rotTick, 1000);
}

function rotTick() {
  if (rotPaused) return;
  rotLeft--;
  var bar = document.getElementById('rotBar');
  if (bar) bar.style.width = (100 - (rotLeft / rotSeconds) * 100) + '%';
  if (rotLeft <= 0) rotNext();
}

function rotGo(i) {
  var n = rotSlides().length;
  rotIndex = (i + n) % n;
  rotLeft = rotSeconds;
  var bar = document.getElementById('rotBar');
  if (bar) bar.style.width = '0%';
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
