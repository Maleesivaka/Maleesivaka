/* MMO Arts Fest — printable reports (A4) + public Program List view */
var REP_CATS = ['SENIOR', 'JUNIOR', 'SUB-JUNIOR', 'GENERAL'];
var REP_TEAMS = ['Qahira', 'Qudsiya', 'Qurthuba'];

function reportShell(title, body) {
  var w = window.open('', '_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + ' - MMO Arts Fest 2k26</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">' +
    '<style>@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box;font-family:Poppins,"Segoe UI",sans-serif}' +
    'body{margin:0;color:#0f172a;font-size:10pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.hdr{text-align:center;border-bottom:2px solid #c9a24b;padding-bottom:6px;margin-bottom:10px}' +
    '.t1{font-family:Cinzel,serif;font-size:22pt;letter-spacing:3px;color:#062a24;text-transform:uppercase}' +
    '.t2{font-size:9pt;letter-spacing:3px;color:#0b5d4b;font-weight:600}.t3{font-size:11pt;font-weight:700;margin-top:4px}' +
    '.d{font-size:8pt;color:#64748b}h3{background:#e3f3ec;border-left:4px solid #0b5d4b;padding:4px 10px;margin:12px 0 5px;font-size:11pt;color:#062a24}' +
    'table{width:100%;border-collapse:collapse;margin:3px 0 8px}th,td{border:1px solid #94a3b8;padding:3px 6px;font-size:9pt;text-align:left}' +
    'th{background:#062a24;color:#f4e8c8;font-size:8.5pt}tr{page-break-inside:avoid}.pb{page-break-before:always}.c{text-align:center}</style></head><body>' +
    '<div class="hdr"><div class="t1">MMO Arts Fest</div><div class="t2">CAMPUS ARTS FESTIVAL 2K26</div><div class="t3">' + title + '</div>' +
    '<div class="d">Printed: ' + new Date().toLocaleString() + '</div></div>' + body +
    '<script>window.onload=function(){setTimeout(function(){window.print()},600)}<\/script></body></html>');
  w.document.close();
}

/* ----- section builders (return HTML) ----- */
function programsHtml(filterCat) {
  var out = '';
  REP_CATS.forEach(function (cat) {
    if (filterCat && filterCat !== cat) return;
    var list = festPrograms.filter(function (p) { return p.category === cat; });
    if (!list.length) return;
    out += '<h3>' + (cat === 'GENERAL' ? 'GENERAL / ALL TEAM ITEMS' : cat) + '</h3><table><thead><tr><th class="c" style="width:8%">#</th><th>Program</th><th style="width:20%">Type</th><th class="c" style="width:18%">Max / Team</th></tr></thead><tbody>' +
      list.map(function (p, i) { return '<tr><td class="c">' + (i + 1) + '</td><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.type) + '</td><td class="c">' + maxText(p) + '</td></tr>'; }).join('') + '</tbody></table>';
  });
  return out || '<p>No programs added yet.</p>';
}

function candidatesHtml() {
  var out = '';
  REP_TEAMS.forEach(function (team, ti) {
    out += '<h3 class="' + (ti ? 'pb' : '') + '" style="font-size:13pt;">TEAM ' + team.toUpperCase() + '</h3>';
    ['SENIOR', 'JUNIOR', 'SUB-JUNIOR'].forEach(function (cat) {
      var list = festCandidates.filter(function (c) { return c.team === team && c.category === cat; });
      out += '<h3>' + cat + '</h3><table><thead><tr><th class="c" style="width:6%">#</th><th style="width:15%">Reg No</th><th style="width:28%">Name</th><th class="c" style="width:10%">Programs</th><th>Program names</th></tr></thead><tbody>' +
        (list.length ? list.map(function (c, i) {
          var keys = candProgCount(c);
          return '<tr><td class="c">' + (i + 1) + '</td><td><b>' + esc(c.regNo) + '</b></td><td>' + esc(c.name) + '</td><td class="c">' + keys.length + '</td><td style="font-size:8pt;">' + keys.map(function (k) { return esc(findProgByKey(k).name); }).join(', ') + '</td></tr>';
        }).join('') : '<tr><td colspan="5" class="c" style="color:#94a3b8;">No candidates</td></tr>') + '</tbody></table>';
    });
  });
  return out;
}

function resultsHtml() {
  var rk = { '1st': 1, '2nd': 2, '3rd': 3 }, out = '';
  REP_CATS.forEach(function (cat) {
    var list = festResults.filter(function (r) { return r.category === cat && r.regNo !== '-'; })
      .sort(function (a, b) { return String(a.program).localeCompare(String(b.program)) || (rk[a.place] || 9) - (rk[b.place] || 9); });
    if (!list.length) return;
    out += '<h3>' + cat + '</h3><table><thead><tr><th>Item</th><th>Participant</th><th>Team</th><th class="c">Rank</th><th class="c">Grade</th><th class="c">Mark</th></tr></thead><tbody>' +
      list.map(function (r) { return '<tr><td>' + esc(r.program) + '</td><td>' + esc(r.name) + ' <small>' + (r.regNo !== 'TEAM' ? esc(r.regNo) : '') + '</small></td><td>' + esc(r.team) + '</td><td class="c"><b>' + (r.place && r.place !== '-' ? r.place : '') + '</b></td><td class="c">' + esc(r.grade || '') + '</td><td class="c">' + r.mark + '</td></tr>'; }).join('') + '</tbody></table>';
  });
  return out || '<p>No results entered yet.</p>';
}

function pointsHtml() {
  var rows = REP_TEAMS.map(function (t) {
    var per = REP_CATS.map(function (c) { return rotTotal(t, c); });
    return { t: t, per: per, tot: per.reduce(function (a, b) { return a + b; }, 0) };
  }).sort(function (a, b) { return b.tot - a.tot; });
  return '<h3>GRAND TEAM LEADERBOARD</h3><table><thead><tr><th class="c">Rank</th><th>Team</th>' + REP_CATS.map(function (c) { return '<th class="c">' + c + '</th>'; }).join('') + '<th class="c">TOTAL</th></tr></thead><tbody>' +
    rows.map(function (r, i) { return '<tr><td class="c"><b>#' + (i + 1) + '</b></td><td><b>' + r.t + '</b></td>' + r.per.map(function (v) { return '<td class="c">' + v + '</td>'; }).join('') + '<td class="c"><b>' + r.tot + '</b></td></tr>'; }).join('') + '</tbody></table>';
}

function printReport(list) {
  var map = { programs: ['Program List', programsHtml], candidates: ['Registered Candidates', candidatesHtml], schedule: ['Program Schedule', function () { return scheduleHtml(); }], results: ['Results', resultsHtml], points: ['Point Table', pointsHtml] };
  var body = '', titles = [];
  list.forEach(function (k, i) {
    var m = map[k]; titles.push(m[0]);
    body += (i ? '<div class="pb"></div>' : '') + (list.length > 1 ? '<div class="t3" style="text-align:center;margin:6px 0;">— ' + m[0].toUpperCase() + ' —</div>' : '') + m[1]();
  });
  reportShell(list.length > 1 ? 'Complete Fest Data' : titles[0], body);
}
function printAllData() { printReport(['programs', 'schedule', 'candidates', 'results', 'points']); }

/* ----- public Program List view ----- */
function renderProgramListView() {
  var box = document.getElementById('programListBox');
  if (!box) return;
  var f = document.getElementById('plFilter') ? document.getElementById('plFilter').value : '';
  box.innerHTML = programsHtml(f);
}
function printProgramList() {
  var f = document.getElementById('plFilter') ? document.getElementById('plFilter').value : '';
  reportShell('Program List' + (f ? ' — ' + f : ''), programsHtml(f));
}
