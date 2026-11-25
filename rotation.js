var ROT_TEAMS = ["Qahira", "Qudsiya", "Qurthuba"];
var ROT_CATS = ["SENIOR", "JUNIOR", "SUB-JUNIOR", "GENERAL"];
var ROT_COL = { Qahira: "#0284c7", Qudsiya: "#059669", Qurthuba: "#217346" };
var rotIndex = 0, rotSeconds = 15, rotLeft = 15, rotPaused = false, rotTimer = null;

function rotSlides() {
  var a = [];
  ROT_TEAMS.forEach(function (t) { ROT_CATS.forEach(function (c) { a.push({ team: t, cat: c }); }); });
  return a;
}
function rotTotal(team, cat) {
  var t = 0;
  festResults.forEach(function (r) { if (r.team === team && r.category === cat && (r.published === 'YES' || r.published === undefined)) t += Number(r.mark || 0); });
  return t;
}
function rotRank(team, cat) {
  var list = ROT_TEAMS.map(function (t) { return { t: t, s: rotTotal(t, cat) }; }).sort(function (a, b) { return b.s - a.s; });
  for (var i = 0; i < list.length; i++) if (list[i].t === team) return i + 1;
  return 1;
}
function rotBanner(team, cat) {
  var col = ROT_COL[team], nice = cat === 'GENERAL' ? 'GENERAL / GROUP ITEMS' : cat;
  return '<div style="background:#F3F4F6;border:1px solid #E9EAED;border-left:5px solid ' + col + ';color:#202124;border-radius:12px;padding:14px 18px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">' +
    '<div><span style="font-size:10.5px;letter-spacing:1.5px;color:#4B5565;font-weight:700;">TEAM STANDINGS</span>' +
    '<div style="font-size:22px;font-weight:800;color:#202124;">' + team.toUpperCase() + ' <span style="font-size:13px;color:#217346;">• ' + nice + '</span></div></div>' +
    '<div style="display:flex;gap:20px;text-align:center;">' +
    '<div><div style="font-size:10px;color:#4B5565;font-weight:700;">RANK</div><div style="font-size:22px;font-weight:800;color:#202124;">#' + rotRank(team, cat) + '</div></div>' +
    '<div><div style="font-size:10px;color:#4B5565;font-weight:700;">POINTS</div><div style="font-size:22px;font-weight:800;color:#217346;">' + rotTotal(team, cat) + '</div></div></div></div>';
}
function rotBuild(s) {
  var team = s.team, cat = s.cat, out = rotBanner(team, cat);
  var shown = function (r) { return r.published === 'YES' || r.published === undefined; };
  if (cat === 'GENERAL') {
    var rows = festResults.filter(function (r) { return r.team === team && r.category === 'GENERAL' && shown(r); });
    if (!rows.length) return out + '<p class="rot-empty">No general / group results published for this team yet.</p>';
    return out + '<div class="table-responsive rot-wrap"><table><thead><tr><th>Item</th><th>Mark</th><th>Place</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td><b>' + esc(r.program) + '</b></td><td style="font-weight:800;color:#202124;">' + r.mark + '</td><td style="color:#217346;font-weight:700;">' + (r.place && r.place !== '-' ? esc(r.place) : '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  var cands = festCandidates.filter(function (c) { return c.team === team && c.category === cat; });
  var catResults = festResults.filter(function (r) { return r.category === cat && shown(r); });
  var progs = [];
  festPrograms.forEach(function (p) { if (p.category === cat && progs.indexOf(p.name) < 0) progs.push(p.name); });
  catResults.forEach(function (r) { if (r.program && progs.indexOf(r.program) < 0 && r.regNo !== '-') progs.push(r.program); });
  if (!cands.length) return out + '<p class="rot-empty">No candidates registered for ' + team + ' in ' + cat + '.</p>';

  var map = {};
  catResults.forEach(function (r) { if (r.team === team && r.regNo && r.regNo !== '-') map[String(r.regNo).trim().toUpperCase() + '|' + String(r.program).trim().toUpperCase()] = r; });

  var data = cands.map(function (c) {
    var total = 0, cells = progs.map(function (p) {
      var r = map[String(c.regNo).trim().toUpperCase() + '|' + p.trim().toUpperCase()];
      if (!r) return '<td style="color:#94a3b8;">–</td>';
      total += Number(r.mark || 0);
      var pl = (r.place && r.place !== '-') ? '<span class="rot-pl">' + esc(r.place) + '</span>' : '';
      return '<td style="font-weight:700;color:#202124;">' + r.mark + pl + '</td>';
    }).join('');
    return { c: c, cells: cells, total: total };
  }).sort(function (a, b) { return b.total - a.total || a.c.name.localeCompare(b.c.name); });

  var html = '<div class="table-responsive rot-wrap"><table class="matrix-table"><thead><tr><th>#</th><th class="sticky-col">Student</th><th>Reg No</th>' +
    progs.map(function (p) { return '<th style="min-width:90px;font-size:10.5px;">' + esc(p) + '</th>'; }).join('') + '<th style="color:#217346;">Total</th></tr></thead><tbody>';
  data.forEach(function (d, i) {
    html += '<tr><td>' + (i + 1) + '</td><td class="sticky-col"><b>' + esc(d.c.name) + '</b></td><td><code style="color:#217346;font-weight:700;">' + esc(d.c.regNo) + '</code></td>' +
      d.cells + '<td style="font-weight:800;color:#217346;">' + d.total + '</td></tr>';
  });
  return out + html + '</tbody></table></div>';
}
function renderStudentProgramMatrix() {
  var box = document.getElementById('studentProgramMatrixContainer'); if (!box) return;
  var slides = rotSlides();
  box.innerHTML = rotBuild(slides[rotIndex]);
  var cnt = document.getElementById('rotCount'); if (cnt) cnt.textContent = (rotIndex + 1) + ' / ' + slides.length;
  if (!rotTimer) rotTimer = setInterval(rotTick, 1000);
}
function rotTick() { if (rotPaused) return; rotLeft--; var bar = document.getElementById('rotBar'); if (bar) bar.style.width = (100 - (rotLeft / rotSeconds) * 100) + '%'; if (rotLeft <= 0) rotNext(); }
function rotGo(i) { var n = rotSlides().length; rotIndex = (i + n) % n; rotLeft = rotSeconds; var bar = document.getElementById('rotBar'); if (bar) bar.style.width = '0%'; renderStudentProgramMatrix(); }
function rotNext() { rotGo(rotIndex + 1); }
function rotPrev() { rotGo(rotIndex - 1); }
function rotSetSpeed(v) { rotSeconds = Number(v) || 15; rotLeft = rotSeconds; }
function rotTogglePause() { rotPaused = !rotPaused; var b = document.getElementById('rotPauseBtn'); if (b) b.innerHTML = rotPaused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>'; }
renderStudentProgramMatrix();
