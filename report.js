/* KADHARVA — printable reports (A4) with filters + Print Center + public Program List view */
var REP_CATS = ['SENIOR', 'JUNIOR', 'SUB-JUNIOR', 'GENERAL'];
var REP_TEAMS = ['Qahira', 'Qudsiya', 'Qurthuba'];

function reportShell(title, body) {
  var w = window.open('', '_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + ' - KADHARVA Campus Arts Fest 2K26</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">' +
    '<style>@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box;font-family:Poppins,"Segoe UI",sans-serif}' +
    'body{margin:0;color:#0f172a;font-size:10pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.hdr{text-align:center;border-bottom:2px solid #2B7CD3;padding-bottom:6px;margin-bottom:10px}' +
    '.t1{font-family:Cinzel,serif;font-size:22pt;letter-spacing:3px;color:#103F91;text-transform:uppercase}' +
    '.t2{font-size:9pt;letter-spacing:3px;color:#185ABD;font-weight:600}.t3{font-size:11pt;font-weight:700;margin-top:4px}' +
    '.d{font-size:8pt;color:#64748b}h3{background:#EAF2FF;border-left:4px solid #185ABD;padding:4px 10px;margin:12px 0 5px;font-size:11pt;color:#103F91}h3 small{font-weight:400;color:#475569;font-size:8.5pt}' +
    'table{width:100%;border-collapse:collapse;margin:3px 0 8px}th,td{border:1px solid #94a3b8;padding:3px 6px;font-size:9pt;text-align:left}' +
    'th{background:#103F91;color:#EAF2FF;font-size:8.5pt}tr{page-break-inside:avoid}.pb{page-break-before:always}.c{text-align:center}.blk{page-break-inside:avoid}</style></head><body>' +
    '<div class="hdr">' + festTitleHtml(22, 10) + '<div class="t3">' + title + '</div>' +
    '<div class="d">Printed: ' + new Date().toLocaleString() + '</div></div>' + body +
    '<script>window.onload=function(){setTimeout(function(){window.print()},600)}<\/script></body></html>');
  w.document.close();
}

function repF(f) { return typeof f === 'string' ? { cat: f } : (f || {}); }
function filterText(F) {
  var p = [];
  if (F.team) p.push('Team ' + F.team);
  if (F.cat) p.push(F.cat === 'GENERAL' ? 'General' : F.cat);
  if (F.type) p.push(F.type + ' items');
  return p.join(' • ');
}
function okProg(p, F) { return (!F.cat || p.category === F.cat) && (!F.type || p.type === F.type); }

/* ----- section builders (return HTML) ----- */
function programsHtml(f) {
  var F = repF(f), out = '';
  REP_CATS.forEach(function (cat) {
    var list = festPrograms.filter(function (p) { return p.category === cat && okProg(p, F); });
    if (!list.length) return;
    out += '<h3>' + (cat === 'GENERAL' ? 'GENERAL / ALL TEAM ITEMS' : cat) + '</h3><table><thead><tr><th class="c" style="width:8%">#</th><th>Program</th><th style="width:20%">Type</th><th class="c" style="width:18%">Max / Team</th></tr></thead><tbody>' +
      list.map(function (p, i) { return '<tr><td class="c">' + (i + 1) + '</td><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.type) + '</td><td class="c">' + maxText(p) + '</td></tr>'; }).join('') + '</tbody></table>';
  });
  return out || '<p>No programs match these filters.</p>';
}

function candidatesHtml(f) {
  var F = repF(f), out = '';
  if (F.cat === 'GENERAL') return '<p>General items have no individual candidates. Choose Senior, Junior or Sub-Junior.</p>';
  var teams = F.team ? [F.team] : REP_TEAMS, cats = F.cat ? [F.cat] : ['SENIOR', 'JUNIOR', 'SUB-JUNIOR'];
  teams.forEach(function (team, ti) {
    out += '<h3 class="' + (ti ? 'pb' : '') + '" style="font-size:13pt;">TEAM ' + team.toUpperCase() + '</h3>';
    cats.forEach(function (cat) {
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

/* participants of every program (from the Entries ticks) */
function participantsHtml(f) {
  var F = repF(f), out = '', order = { 'Individual': 1, 'Group': 2, 'Non-Stage': 3, 'General': 4 };
  var progs = festPrograms.filter(function (p) { return okProg(p, F); })
    .sort(function (a, b) { return REP_CATS.indexOf(a.category) - REP_CATS.indexOf(b.category) || (order[a.type] || 9) - (order[b.type] || 9); });
  progs.forEach(function (p) {
    var k = progKey(p);
    var list = festCandidates.filter(function (c) { return (c.entries || []).indexOf(k) >= 0 && (!F.team || c.team === F.team); })
      .sort(function (a, b) { return String(a.team).localeCompare(String(b.team)) || String(a.regNo).localeCompare(String(b.regNo)); });
    out += '<div class="blk"><h3>' + esc(p.name) + ' <small>' + esc(p.type) + ' • ' + (p.category === 'GENERAL' ? 'General' : esc(p.category)) + ' • max ' + maxText(p) + ' per team • ' + list.length + ' entered</small></h3>' +
      '<table><thead><tr><th class="c" style="width:6%">#</th><th style="width:16%">Reg No</th><th>Name</th><th style="width:15%">Team</th><th style="width:14%">Category</th>' + (F.sign ? '<th style="width:20%">Attendance / Sign</th>' : '') + '</tr></thead><tbody>' +
      (list.length ? list.map(function (c, i) {
        return '<tr><td class="c">' + (i + 1) + '</td><td><b>' + esc(c.regNo) + '</b></td><td>' + esc(c.name) + '</td><td>' + esc(c.team) + '</td><td>' + esc(c.category) + '</td>' + (F.sign ? '<td></td>' : '') + '</tr>';
      }).join('') : '<tr><td colspan="' + (F.sign ? 6 : 5) + '" class="c" style="color:#94a3b8;">No entries yet</td></tr>') + '</tbody></table></div>';
  });
  return out || '<p>No programs match these filters.</p>';
}

function resultsHtml(f) {
  var F = repF(f), rk = { '1st': 1, '2nd': 2, '3rd': 3 }, out = '';
  REP_CATS.forEach(function (cat) {
    if (F.cat && F.cat !== cat) return;
    var list = festResults.filter(function (r) {
      if (r.category !== cat || r.regNo === '-' || (F.team && r.team !== F.team)) return false;
      if (F.type) { var p = festPrograms.filter(function (x) { return x.name === r.program && x.category === cat; })[0]; if (!p || p.type !== F.type) return false; }
      return true;
    }).sort(function (a, b) { return String(a.program).localeCompare(String(b.program)) || (rk[a.place] || 9) - (rk[b.place] || 9); });
    if (!list.length) return;
    out += '<h3>' + cat + '</h3><table><thead><tr><th>Item</th><th>Participant</th><th>Team</th><th class="c">Rank</th><th class="c">Grade</th><th class="c">Mark</th></tr></thead><tbody>' +
      list.map(function (r) { return '<tr><td>' + esc(r.program) + '</td><td>' + esc(r.name) + ' <small>' + (r.regNo !== 'TEAM' ? esc(r.regNo) : '') + '</small></td><td>' + esc(r.team) + '</td><td class="c"><b>' + (r.place && r.place !== '-' ? r.place : '') + '</b></td><td class="c">' + esc(r.grade || '') + '</td><td class="c">' + r.mark + '</td></tr>'; }).join('') + '</tbody></table>';
  });
  return out || '<p>No results match these filters.</p>';
}

function pointsHtml(f) {
  var F = repF(f);
  var rows = REP_TEAMS.filter(function (t) { return !F.team || t === F.team; }).map(function (t) {
    var per = REP_CATS.map(function (c) { return rotTotal(t, c); });
    return { t: t, per: per, tot: per.reduce(function (a, b) { return a + b; }, 0) };
  }).sort(function (a, b) { return b.tot - a.tot; });
  return '<h3>TEAM POINTS</h3><table><thead><tr><th class="c">Rank</th><th>Team</th>' + REP_CATS.map(function (c) { return '<th class="c">' + c + '</th>'; }).join('') + '<th class="c">TOTAL</th></tr></thead><tbody>' +
    rows.map(function (r, i) { return '<tr><td class="c"><b>#' + (i + 1) + '</b></td><td><b>' + r.t + '</b></td>' + r.per.map(function (v) { return '<td class="c">' + v + '</td>'; }).join('') + '<td class="c"><b>' + r.tot + '</b></td></tr>'; }).join('') + '</tbody></table>';
}

function printReport(list, f) {
  var F = repF(f);
  var map = {
    programs: ['Program List', programsHtml], candidates: ['Registered Candidates', candidatesHtml], participants: ['Participants by Program', participantsHtml],
    schedule: ['Program Schedule', function (x) { return scheduleHtml(x.cat === 'GENERAL' || !x.cat ? '' : x.cat); }], results: ['Results', resultsHtml], points: ['Point Table', pointsHtml]
  };
  var body = '', titles = [];
  list.forEach(function (k, i) {
    var m = map[k]; titles.push(m[0]);
    body += (i ? '<div class="pb"></div>' : '') + (list.length > 1 ? '<div class="t3" style="text-align:center;margin:6px 0;">— ' + m[0].toUpperCase() + ' —</div>' : '') + m[1](F);
  });
  var ft = filterText(F);
  reportShell((list.length > 1 ? 'Complete Fest Data' : titles[0]) + (ft ? ' — ' + ft : ''), body);
}
function printAllData() { printReport(['programs', 'schedule', 'candidates', 'results', 'points']); }

/* ----- Print Center: choose report + filters ----- */
function openPrintCenter(preset) {
  preset = preset || {};
  var sel = function (id, label, opts, cur) {
    return '<label style="font-size:12px;font-weight:600;">' + label + '</label><select id="' + id + '">' +
      opts.map(function (o) { return '<option value="' + o[0] + '"' + (cur === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>';
  };
  miniModal('🖨️ Print Center',
    sel('pcReport', 'What do you want to print?', [['participants', 'Participants of each program'], ['programs', 'Program list'], ['candidates', 'Registered candidates'], ['results', 'Results'], ['schedule', 'Schedule'], ['points', 'Point table'], ['all', 'Everything (full report)']], preset.report || 'participants') +
    sel('pcTeam', 'Team', [['', 'All teams'], ['Qahira', 'Qahira'], ['Qudsiya', 'Qudsiya'], ['Qurthuba', 'Qurthuba']], preset.team || '') +
    sel('pcCat', 'Category', [['', 'All categories'], ['SENIOR', 'Senior'], ['JUNIOR', 'Junior'], ['SUB-JUNIOR', 'Sub-Junior'], ['GENERAL', 'General (all-team items)']], preset.cat || '') +
    sel('pcType', 'Program type', [['', 'All types'], ['Individual', 'Individual only'], ['Group', 'Group only'], ['Non-Stage', 'Non-Stage only'], ['General', 'General only']], preset.type || '') +
    '<label style="font-size:12.5px;display:flex;gap:8px;align-items:center;margin:4px 0 10px;"><input type="checkbox" id="pcSign" style="width:auto;margin:0;"> Add attendance / signature column (participants list)</label>' +
    '<p style="font-size:11.5px;color:var(--text-muted);margin-bottom:8px;">Filters that do not apply to a report are ignored.</p>',
    function () {
      var F = { team: document.getElementById('pcTeam').value, cat: document.getElementById('pcCat').value, type: document.getElementById('pcType').value, sign: document.getElementById('pcSign').checked };
      var r = document.getElementById('pcReport').value;
      if (r === 'all') printAllFiltered(F); else printReport([r], F);
    }, 'Print');
}
function printAllFiltered(F) { printReport(['programs', 'schedule', 'participants', 'candidates', 'results', 'points'], F); }

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
