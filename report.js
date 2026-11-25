var REP_CATS = ['SENIOR', 'JUNIOR', 'SUB-JUNIOR', 'GENERAL'];
var REP_TEAMS = ['Qahira', 'Qudsiya', 'Qurthuba'];
function reportShell(title, body) {
  var w = window.open('', '_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title><style>@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box;font-family:"Segoe UI",sans-serif}body{margin:0;color:#0f172a;font-size:10pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}.hdr{text-align:center;border-bottom:2px solid #33A852;padding-bottom:6px;margin-bottom:10px}.t3{font-size:11pt;font-weight:700;margin-top:4px}.d{font-size:8pt;color:#64748b}h3{background:#E8F4EC;border-left:4px solid #217346;padding:4px 10px;margin:12px 0 5px;font-size:11pt}table{width:100%;border-collapse:collapse;margin:3px 0 8px}th,td{border:1px solid #94a3b8;padding:4px 6px;font-size:9pt;text-align:left}th{background:#09090b;color:#fde68a;font-size:8.5pt}.pb{page-break-before:always}.c{text-align:center}</style></head><body><div class="hdr">' + festTitleHtml(20, 9) + '<div class="t3">' + title + '</div><div class="d">Printed: ' + new Date().toLocaleString() + '</div></div>' + body + '<script>window.onload=function(){setTimeout(function(){window.print()},500)}<\/script></body></html>');
  w.document.close();
}
function repF(f) { return typeof f === 'string' ? { cat: f } : (f || {}); }
function okProg(p, F) { return (!F.cat || p.category === F.cat) && (!F.type || p.type === F.type); }
function programsHtml(f) {
  var F = repF(f), out = '';
  REP_CATS.forEach(function (cat) {
    var list = festPrograms.filter(function (p) { return p.category === cat && okProg(p, F); });
    if (!list.length) return;
    out += '<h3>' + (cat === 'GENERAL' ? 'GENERAL / ALL TEAM ITEMS' : cat) + '</h3><table><thead><tr><th class="c" style="width:8%">#</th><th>Program</th><th style="width:20%">Type</th><th class="c" style="width:18%">Max / Team</th></tr></thead><tbody>' +
      list.map(function (p, i) { return '<tr><td class="c">' + (i + 1) + '</td><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.type) + '</td><td class="c">' + maxText(p) + '</td></tr>'; }).join('') + '</tbody></table>';
  });
  return out || '<p class="muted-text" style="padding:12px;">No programs registered yet.</p>';
}
function candidatesHtml(f) {
  var F = repF(f), out = '';
  var teams = F.team ? [F.team] : REP_TEAMS, cats = F.cat ? [F.cat] : ['SENIOR', 'JUNIOR', 'SUB-JUNIOR'];
  teams.forEach(function (team, ti) {
    out += '<h3 class="' + (ti ? 'pb' : '') + '">TEAM ' + team.toUpperCase() + '</h3>';
    cats.forEach(function (cat) {
      var list = festCandidates.filter(function (c) { return c.team === team && c.category === cat; });
      out += '<h4>' + cat + '</h4><table><thead><tr><th>#</th><th>Reg No</th><th>Name</th><th>Items</th></tr></thead><tbody>' +
        (list.length ? list.map(function (c, i) { var keys = candProgCount(c); return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(c.regNo) + '</b></td><td>' + esc(c.name) + '</td><td>' + keys.map(function (k) { return esc(findProgByKey(k).name); }).join(', ') + '</td></tr>'; }).join('') : '<tr><td colspan="4">No candidates</td></tr>') + '</tbody></table>';
    });
  });
  return out;
}
function participantsHtml(f) {
  var F = repF(f), out = '';
  festPrograms.filter(function (p) { return okProg(p, F); }).forEach(function (p) {
    var k = progKey(p);
    var list = festCandidates.filter(function (c) { return (c.entries || []).indexOf(k) >= 0 && (!F.team || c.team === F.team); });
    out += '<h3>' + esc(p.name) + ' (' + esc(p.category) + ' • ' + list.length + ' entered)</h3><table><thead><tr><th>#</th><th>Reg No</th><th>Name</th><th>Team</th>' + (F.sign ? '<th>Sign</th>' : '') + '</tr></thead><tbody>' +
      (list.length ? list.map(function (c, i) { return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(c.regNo) + '</b></td><td>' + esc(c.name) + '</td><td>' + esc(c.team) + '</td>' + (F.sign ? '<td></td>' : '') + '</tr>'; }).join('') : '<tr><td colspan="5">No entries yet</td></tr>') + '</tbody></table>';
  });
  return out || '<p>No matching programs.</p>';
}
function resultsHtml(f) {
  var F = repF(f), out = '';
  REP_CATS.forEach(function (cat) {
    if (F.cat && F.cat !== cat) return;
    var list = festResults.filter(function (r) { return r.category === cat && r.regNo !== '-' && (!F.team || r.team === F.team); });
    if (!list.length) return;
    out += '<h3>' + cat + '</h3><table><thead><tr><th>Item</th><th>Participant</th><th>Team</th><th>Rank</th><th>Grade</th><th>Mark</th></tr></thead><tbody>' +
      list.map(function (r) { return '<tr><td>' + esc(r.program) + '</td><td>' + esc(r.name) + '</td><td>' + esc(r.team) + '</td><td><b>' + (r.place && r.place !== '-' ? r.place : '') + '</b></td><td>' + esc(r.grade || '') + '</td><td>' + r.mark + '</td></tr>'; }).join('') + '</tbody></table>';
  });
  return out || '<p>No results yet.</p>';
}
function pointsHtml() {
  var rows = REP_TEAMS.map(function (t) {
    var per = REP_CATS.map(function (c) { return rotTotal(t, c); });
    return { t: t, per: per, tot: per.reduce(function (a, b) { return a + b; }, 0) };
  }).sort(function (a, b) { return b.tot - a.tot; });
  return '<h3>TEAM POINTS</h3><table><thead><tr><th>Rank</th><th>Team</th>' + REP_CATS.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '<th>TOTAL</th></tr></thead><tbody>' +
    rows.map(function (r, i) { return '<tr><td><b>#' + (i + 1) + '</b></td><td><b>' + r.t + '</b></td>' + r.per.map(function (v) { return '<td>' + v + '</td>'; }).join('') + '<td><b>' + r.tot + '</b></td></tr>'; }).join('') + '</tbody></table>';
}
function printReport(list, f) {
  var F = repF(f);
  var map = { programs: ['Program List', programsHtml], candidates: ['Registered Candidates', candidatesHtml], participants: ['Participants by Program', participantsHtml], schedule: ['Program Schedule', function (x) { return scheduleHtml(x.cat || ''); }], results: ['Results', resultsHtml], points: ['Point Table', pointsHtml] };
  var body = list.map(function (k) { return map[k][1](F); }).join('<div class="pb"></div>');
  reportShell(list.length > 1 ? 'Export Report' : map[list[0]][0], body);
}
function openPrintCenter(preset) {
  preset = preset || {};
  var sel = function (id, label, opts, cur) {
    return '<label>' + label + '</label><select id="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (cur === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>';
  };
  miniModal('Export & Print Centre',
    sel('pcReport', 'Report Type', [['participants', 'Participants by Program'], ['programs', 'Program List'], ['candidates', 'Registered Candidates'], ['results', 'Results'], ['schedule', 'Schedule'], ['points', 'Point Table'], ['all', 'Complete Fest Export']], preset.report || 'participants') +
    sel('pcTeam', 'Team Filter', [['', 'All Teams'], ['Qahira', 'Qahira'], ['Qudsiya', 'Qudsiya'], ['Qurthuba', 'Qurthuba']], preset.team || '') +
    sel('pcCat', 'Category Filter', [['', 'All Categories'], ['SENIOR', 'Senior'], ['JUNIOR', 'Junior'], ['SUB-JUNIOR', 'Sub-Junior'], ['GENERAL', 'General']], preset.cat || '') +
    '<label class="checkbox-inline"><input type="checkbox" id="pcSign"> Include signature column</label>',
    function () {
      var F = { team: document.getElementById('pcTeam').value, cat: document.getElementById('pcCat').value, sign: document.getElementById('pcSign').checked };
      var r = document.getElementById('pcReport').value;
      if (r === 'all') printReport(['programs', 'schedule', 'participants', 'candidates', 'results', 'points'], F); else printReport([r], F);
    }, 'Generate & Print');
}
function renderProgramListView() {
  var box = document.getElementById('programListBox'); if (!box) return;
  var f = document.getElementById('plFilter') ? document.getElementById('plFilter').value : '';
  box.innerHTML = programsHtml(f);
}
function printProgramList() {
  var f = document.getElementById('plFilter') ? document.getElementById('plFilter').value : '';
  reportShell('Program List' + (f ? ' — ' + f : ''), programsHtml(f));
}
