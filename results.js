/* MMO Arts Fest — Result entry: choose rank (1st/2nd/3rd) and grade (A/B/C) for every eligible participant.
   Mark = rank points + grade points (editable in "Points settings"). Defaults: ranks 5/3/1, grades A=5, B=3, C=1 */
var rbRows = [];

function rbPoints() {
  var d = { r1: 5, r2: 3, r3: 1, A: 5, B: 3, C: 1 }, s = {};
  try { s = JSON.parse(localStorage.getItem('MEELAD_POINTS') || '{}'); } catch (e) { }
  for (var k in d) if (s[k] !== undefined && s[k] !== '') d[k] = Number(s[k]);
  return d;
}
function rbLoadPointInputs() {
  var p = rbPoints();
  [['rbR1', 'r1'], ['rbR2', 'r2'], ['rbR3', 'r3'], ['rbGA', 'A'], ['rbGB', 'B'], ['rbGC', 'C']].forEach(function (x) {
    var el = document.getElementById(x[0]); if (el) el.value = p[x[1]];
  });
}
function rbSavePointInputs() {
  var o = {};
  [['rbR1', 'r1'], ['rbR2', 'r2'], ['rbR3', 'r3'], ['rbGA', 'A'], ['rbGB', 'B'], ['rbGC', 'C']].forEach(function (x) {
    o[x[1]] = Number(document.getElementById(x[0]).value) || 0;
  });
  localStorage.setItem('MEELAD_POINTS', JSON.stringify(o));
  rbRecalcAll();
}
function rbMark(rank, grade) {
  var p = rbPoints(), m = 0;
  if (rank === '1st') m += p.r1; else if (rank === '2nd') m += p.r2; else if (rank === '3rd') m += p.r3;
  if (grade === 'A' || grade === 'B' || grade === 'C') m += p[grade];
  return m;
}

/* replaces the old candidate dropdown: builds the table of participants */
updateResultCandidateDropdown = function () {
  var box = document.getElementById('resBatchTable');
  if (!box) return;
  var cat = document.getElementById('resCategory').value;
  var item = document.getElementById('resItemSelect').value;
  rbLoadPointInputs();
  rbRows = [];
  if (!item) { box.innerHTML = "<p style='padding:14px;color:var(--text-muted);'>Choose a category and a competition item.</p>"; return; }

  var note = '';
  if (cat === 'GENERAL') {
    ['Qahira', 'Qudsiya', 'Qurthuba'].forEach(function (t) { rbRows.push({ regNo: 'TEAM', name: t, team: t }); });
  } else {
    var cands = festCandidates.filter(function (c) { return c.category === cat; });
    var prog = festPrograms.filter(function (p) { return p.name === item && p.category === cat; })[0];
    var entered = prog ? cands.filter(function (c) { return (c.entries || []).indexOf(progKey(prog)) >= 0; }) : [];
    if (entered.length > 0) cands = entered; else note = 'No entries are ticked for this item, so all ' + cat + ' candidates are shown.';
    cands.forEach(function (c) { rbRows.push({ regNo: c.regNo, name: c.name, team: c.team }); });
  }
  if (rbRows.length === 0) { box.innerHTML = "<p style='padding:14px;color:var(--text-muted);'>No participants found for this item.</p>"; return; }

  var opts = function (list, cur) { return list.map(function (v) { return '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + (v === '-' ? '—' : v) + '</option>'; }).join(''); };
  var h = (note ? '<p style="font-size:12px;color:#b45309;padding:8px 4px;">' + note + '</p>' : '') +
    '<table><thead><tr><th>#</th><th>Reg No</th><th>Participant</th><th>Team</th><th>Rank</th><th>Grade</th><th>Mark</th></tr></thead><tbody>';
  rbRows.forEach(function (r, i) {
    var ex = festResults.filter(function (x) {
      return x.program === item && x.category === cat && (cat === 'GENERAL' ? x.team === r.team : String(x.regNo) === String(r.regNo));
    })[0] || {};
    var rank = (ex.place && ex.place !== '-') ? ex.place : '-', grade = (ex.grade && ex.grade !== '-') ? ex.grade : '-';
    h += '<tr><td>' + (i + 1) + '</td><td><b style="color:var(--navy-main);">' + (r.regNo === 'TEAM' ? '–' : esc(r.regNo)) + '</b></td><td>' + esc(r.name) + '</td>' +
      '<td><span class="badge team-badge-' + r.team.toLowerCase() + '">' + r.team + '</span></td>' +
      '<td><select id="rbRank' + i + '" onchange="rbRecalc(' + i + ')" style="margin:0;padding:6px 8px;">' + opts(['-', '1st', '2nd', '3rd'], rank) + '</select></td>' +
      '<td><select id="rbGrade' + i + '" onchange="rbRecalc(' + i + ')" style="margin:0;padding:6px 8px;">' + opts(['-', 'A', 'B', 'C'], grade) + '</select></td>' +
      '<td id="rbMark' + i + '" style="font-weight:800;color:var(--emerald-main);font-size:16px;">' + rbMark(rank, grade) + '</td></tr>';
  });
  box.innerHTML = h + '</tbody></table>';
};

function rbRecalc(i) {
  var el = document.getElementById('rbMark' + i);
  if (el) el.textContent = rbMark(document.getElementById('rbRank' + i).value, document.getElementById('rbGrade' + i).value);
}
function rbRecalcAll() { rbRows.forEach(function (r, i) { rbRecalc(i); }); }

function rbFillGrades() {
  var g = document.getElementById('rbFillSel').value;
  rbRows.forEach(function (r, i) {
    var s = document.getElementById('rbGrade' + i);
    if (s && s.value === '-') { s.value = g; rbRecalc(i); }
  });
}

function saveResultBatch() {
  var cat = document.getElementById('resCategory').value;
  var item = document.getElementById('resItemSelect').value;
  var pub = document.getElementById('resPublished').value;
  if (!item || rbRows.length === 0) { alert('Choose a category and item first.'); return; }

  var count = { '1st': 0, '2nd': 0, '3rd': 0 };
  var out = [];
  rbRows.forEach(function (r, i) {
    var rank = document.getElementById('rbRank' + i).value, grade = document.getElementById('rbGrade' + i).value;
    if (count[rank] !== undefined) count[rank]++;
    if (rank !== '-' || grade !== '-') out.push({ r: r, rank: rank, grade: grade });
  });
  var dup = ['1st', '2nd', '3rd'].filter(function (k) { return count[k] > 1; });
  if (dup.length && !confirm('More than one participant has the same rank (' + dup.join(', ') + '). Save as a tie?')) return;

  var isRow = function (x) {
    return rbRows.some(function (r) { return cat === 'GENERAL' ? x.team === r.team : String(x.regNo) === String(r.regNo); });
  };
  festResults = festResults.filter(function (x) { return !(x.program === item && x.category === cat && isRow(x)); });
  var batchId = Date.now(), nowIso = new Date().toISOString();
  out.forEach(function (o, n) {
    festResults.push({
      id: Date.now() + n, regNo: o.r.regNo, name: cat === 'GENERAL' ? o.r.name + ' (Team)' : o.r.name, team: o.r.team,
      category: cat, program: item, mark: rbMark(o.rank, o.grade),
      grade: o.grade === '-' ? '' : o.grade, place: o.rank, published: pub,
      batch: pub === 'YES' ? batchId : '', pubAt: pub === 'YES' ? nowIso : ''
    });
  });
  if (pub === 'YES' && out.length) {
    var med = { '1st': '🥇', '2nd': '🥈', '3rd': '🥉' };
    var win = out.filter(function (o) { return med[o.rank]; }).sort(function (x, y) { return x.rank.localeCompare(y.rank); })
      .map(function (o) { return med[o.rank] + ' ' + o.r.name + ' (' + o.r.team + ')'; }).join('  ');
    addNotice('result', 'Result announced', item + ' (' + cat + ')' + (win ? ' — ' + win : ''));
    markResultsKnown();
  }
  saveAllData();
  alert('Result saved for "' + item + '" (' + out.length + ' participant' + (out.length === 1 ? '' : 's') + ').');
}

rbLoadPointInputs();
