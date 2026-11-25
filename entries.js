var entriesDirty = false;

function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function enc(s) { return encodeURIComponent(s); }
function progKey(p) { return String(p.category) + '|' + String(p.name).trim().toLowerCase(); }
function progMax(p) {
  if (p.max !== undefined && p.max !== null && p.max !== '') return Number(p.max) || 0;
  return p.type === 'Individual' ? 3 : 0;
}
function maxText(p) { var m = progMax(p); return m > 0 ? String(m) : '∞'; }
function findProgByKey(k) { return festPrograms.filter(function (p) { return progKey(p) === k; })[0]; }
function teamCount(team, key) { return festCandidates.filter(function (c) { return c.team === team && (c.entries || []).indexOf(key) >= 0; }).length; }
function totalEntered(key) { return festCandidates.filter(function (c) { return (c.entries || []).indexOf(key) >= 0; }).length; }
function candProgCount(c) { return (c.entries || []).filter(function (k) { return !!findProgByKey(k); }); }

function miniModal(title, body, onSave, saveLabel) {
  var m = document.getElementById('miniModal');
  if (!m) { m = document.createElement('div'); m.id = 'miniModal'; m.className = 'mini-modal'; document.body.appendChild(m); }
  m.innerHTML = '<div class="mini-card"><h3 style="margin-bottom:12px;">' + title + '</h3>' + body +
    '<div style="display:flex;gap:10px;margin-top:10px;"><button class="btn-outline-sm" id="mmCancel" style="flex:1;justify-content:center;padding:9px;">Cancel</button>' +
    '<button class="btn-coral" id="mmSave" style="flex:1;">' + (saveLabel || 'Save') + '</button></div></div>';
  m.style.display = 'flex';
  m.querySelector('#mmCancel').onclick = function () { m.style.display = 'none'; };
  m.querySelector('#mmSave').onclick = function () { if (onSave() !== false) m.style.display = 'none'; };
}

var _refreshAll = refreshAll;
refreshAll = function () { _refreshAll.apply(this, arguments); renderEntriesTab(); };

var _fetchCloud = fetchCloudData;
fetchCloudData = function () { if (entriesDirty) return; _fetchCloud.apply(this, arguments); };

var _syncCloud = syncToCloud;
syncToCloud = function () { entriesDirty = false; return _syncCloud.apply(this, arguments); };

function savePrograms() {
  var type = document.getElementById('progType').value, cat = (type === 'General') ? 'GENERAL' : document.getElementById('progCategory').value, maxRaw = document.getElementById('progMax').value.trim();
  var inputs = document.querySelectorAll('.prog-name-input'), added = 0, dup = [];
  inputs.forEach(function (input) {
    var name = input.value.trim(); if (!name) return;
    var p = { id: Date.now() + Math.random(), name: name, category: cat, type: type };
    if (maxRaw !== '') p.max = Math.max(0, Number(maxRaw) || 0);
    if (findProgByKey(progKey(p))) { dup.push(name); return; }
    festPrograms.push(p); added++;
  });
  if (added > 0) {
    logAdminAction('Added ' + added + ' program(s) in ' + cat);
    addNotice('program', 'New program added', added + ' item(s) added in ' + cat);
    saveAllData();
    document.getElementById('programRowsContainer').innerHTML = '<div class="program-input-row" style="display:flex;gap:8px;margin-bottom:8px;"><input type="text" class="prog-name-input" placeholder="Program name"></div>';
    document.getElementById('progMax').value = '';
    alert('Saved ' + added + ' program(s)!' + (dup.length ? ' (Skipped duplicate: ' + dup.join(', ') + ')' : ''));
  } else {
    alert(dup.length ? 'Already exists: ' + dup.join(', ') : 'Please enter a program name.');
  }
}

function renderProgramsTable() {
  var box = document.getElementById('programsListTable'); if (!box) return;
  if (!festPrograms.length) { box.innerHTML = "<p class='muted-text' style='padding:12px;'>No programs added yet.</p>"; return; }
  var h = '<table><thead><tr><th>Type</th><th>Category</th><th>Program</th><th>Max / Team</th><th>Entered</th><th>Action</th></tr></thead><tbody>';
  festPrograms.forEach(function (p) {
    var k = progKey(p);
    h += '<tr><td><b>' + esc(p.type) + '</b></td><td><span class="badge" style="background:#F3F4F6;color:#202124;">' + esc(p.category) + '</span></td>' +
      '<td><b>' + esc(p.name) + '</b></td><td style="font-weight:700;color:#217346;">' + maxText(p) + '</td><td>' + totalEntered(k) + '</td>' +
      '<td style="white-space:nowrap;"><button onclick="editProgram('' + enc(k) + '')" class="btn-outline-sm" style="margin-right:4px;"><i class="fa-solid fa-pen"></i> Edit</button>' +
      '<button onclick="deleteProgramByKey('' + enc(k) + '')" class="btn-danger-sm"><i class="fa-solid fa-trash"></i></button></td></tr>';
  });
  box.innerHTML = h + '</tbody></table>';
}

function deleteProgramByKey(k) {
  k = decodeURIComponent(k); var p = findProgByKey(k);
  if (!p || !confirm('Delete "' + p.name + '"?')) return;
  festPrograms = festPrograms.filter(function (x) { return progKey(x) !== k; });
  festCandidates.forEach(function (c) { c.entries = (c.entries || []).filter(function (e) { return e !== k; }); });
  logAdminAction('Deleted program ' + p.name);
  saveAllData();
}

function editProgram(k) {
  k = decodeURIComponent(k); var p = findProgByKey(k); if (!p) return;
  var opt = function (v, t, sel) { return '<option value="' + v + '"' + (sel === v ? ' selected' : '') + '>' + t + '</option>'; };
  miniModal('Edit Program',
    '<label>Program Name</label><input type="text" id="emName" value="' + esc(p.name) + '">' +
    '<label>Type</label><select id="emType">' + opt('Individual', 'Individual', p.type) + opt('Group', 'Group', p.type) + opt('Non-Stage', 'Non-Stage', p.type) + opt('General', 'General', p.type) + '</select>' +
    '<label>Category</label><select id="emCat">' + opt('SENIOR', 'Senior', p.category) + opt('JUNIOR', 'Junior', p.category) + opt('SUB-JUNIOR', 'Sub-Junior', p.category) + '</select>' +
    '<label>Max / Team (blank = default, 0 = unlimited)</label><input type="number" id="emMax" min="0" value="' + (p.max === undefined || p.max === null ? '' : p.max) + '">',
    function () {
      var name = document.getElementById('emName').value.trim(), type = document.getElementById('emType').value, cat = type === 'General' ? 'GENERAL' : document.getElementById('emCat').value, mx = document.getElementById('emMax').value.trim();
      if (!name) return false;
      p.name = name; p.type = type; p.category = cat;
      if (mx !== '') p.max = Math.max(0, Number(mx) || 0); else delete p.max;
      logAdminAction('Updated program ' + name);
      saveAllData();
    });
}

function renderCandidatesTable() {
  var box = document.getElementById('candidatesListTable'); if (!box) return;
  if (!festCandidates.length) { box.innerHTML = "<p class='muted-text' style='padding:12px;'>No candidates registered yet.</p>"; return; }
  var h = '<table><thead><tr><th>Reg No</th><th>Candidate Name</th><th>Category</th><th>Team</th><th>Entries</th><th>Action</th></tr></thead><tbody>';
  festCandidates.forEach(function (c) {
    var keys = candProgCount(c);
    h += '<tr><td><b style="color:#217346;">' + esc(c.regNo) + '</b></td><td>' + esc(c.name) + '</td><td>' + esc(c.category) + '</td>' +
      '<td><span class="badge team-badge-' + String(c.team).toLowerCase() + '">' + esc(c.team) + '</span></td>' +
      '<td><span class="badge" style="background:#F3F4F6;color:#202124;">' + keys.length + ' item(s)</span></td>' +
      '<td style="white-space:nowrap;"><button onclick="editCandidate('' + enc(c.regNo) + '')" class="btn-outline-sm" style="margin-right:4px;"><i class="fa-solid fa-pen"></i> Edit</button>' +
      '<button onclick="deleteCandidate(' + c.id + ')" class="btn-danger-sm"><i class="fa-solid fa-trash"></i></button></td></tr>';
  });
  box.innerHTML = h + '</tbody></table>';
}

function editCandidate(reg) {
  reg = decodeURIComponent(reg); var c = festCandidates.filter(function (x) { return x.regNo === reg; })[0]; if (!c) return;
  miniModal('Edit Candidate — ' + esc(c.regNo), '<label>Candidate Name</label><input type="text" id="ecName" value="' + esc(c.name) + '">', function () {
    var n = document.getElementById('ecName').value.trim(); if (!n) return false;
    c.name = n; festResults.forEach(function (r) { if (r.regNo === c.regNo) r.name = n; });
    logAdminAction('Edited candidate ' + c.regNo); saveAllData();
  });
}

function programsForCategory(cat) {
  var order = { 'Individual': 1, 'Group': 2, 'Non-Stage': 3, 'General': 4 };
  return festPrograms.filter(function (p) { return p.category === cat || p.category === 'GENERAL' || p.type === 'General'; })
    .sort(function (a, b) { return (order[a.type] || 9) - (order[b.type] || 9); });
}

function renderEntriesTab() {
  var box = document.getElementById('entriesTable'); if (!box) return;
  var team = document.getElementById('entTeam').value, cat = document.getElementById('entCat').value;
  var cands = festCandidates.filter(function (c) { return c.team === team && c.category === cat; });
  var progs = programsForCategory(cat);
  var st = document.getElementById('entStatus');
  if (st) st.innerHTML = entriesDirty ? '<span style="color:#217346;font-weight:700;">● Unsaved changes</span>' : '<span style="color:#047857;font-size:12px;">All entries saved</span>';

  if (!cands.length) { box.innerHTML = "<p class='muted-text' style='padding:14px;text-align:center;'>No candidates in " + team + " (" + cat + ").</p>"; return; }
  if (!progs.length) { box.innerHTML = "<p class='muted-text' style='padding:14px;text-align:center;'>No programs in " + cat + ".</p>"; return; }

  var h = '<table class="matrix-table"><thead><tr><th>#</th><th class="sticky-col">Candidate</th><th>Reg No</th>';
  progs.forEach(function (p) {
    var k = progKey(p), m = progMax(p), n = teamCount(team, k), full = m > 0 && n >= m;
    h += '<th style="min-width:94px;white-space:normal;font-size:11px;">' + esc(p.name) + '<br><span style="font-weight:500;">' + esc(p.type) + '</span><br>' +
      '<span class="badge" style="background:' + (full ? '#fee2e2;color:#b91c1c' : '#E8F4EC;color:#217346') + ';">' + n + ' / ' + maxText(p) + '</span></th>';
  });
  h += '<th>Total</th></tr></thead><tbody>';
  cands.forEach(function (c, i) {
    h += '<tr><td>' + (i + 1) + '</td><td class="sticky-col"><b>' + esc(c.name) + '</b></td><td><code style="color:#217346;">' + esc(c.regNo) + '</code></td>';
    progs.forEach(function (p) {
      var k = progKey(p), on = (c.entries || []).indexOf(k) >= 0, m = progMax(p), blocked = !on && m > 0 && teamCount(team, k) >= m;
      h += '<td><input type="checkbox" class="ent-cb" ' + (on ? 'checked ' : '') + (blocked ? 'disabled ' : '') + 'onchange="toggleEntry('' + enc(c.regNo) + '','' + enc(k) + '',this)"></td>';
    });
    h += '<td style="font-weight:800;color:#217346;">' + candProgCount(c).length + '</td></tr>';
  });
  box.innerHTML = h + '</tbody></table>';
}

function toggleEntry(reg, key, cb) {
  reg = decodeURIComponent(reg); key = decodeURIComponent(key);
  var c = festCandidates.filter(function (x) { return x.regNo === reg; })[0], p = findProgByKey(key);
  if (!c || !p) return;
  if (!Array.isArray(c.entries)) c.entries = [];
  if (cb.checked) {
    var m = progMax(p);
    if (m > 0 && teamCount(c.team, key) >= m) { alert('Max ' + m + ' allowed for ' + c.team + ' in "' + p.name + '".'); cb.checked = false; return; }
    if (c.entries.indexOf(key) < 0) c.entries.push(key);
  } else {
    c.entries = c.entries.filter(function (e) { return e !== key; });
  }
  entriesDirty = true;
  localStorage.setItem('MEELAD_CANDIDATES', JSON.stringify(festCandidates));
  renderEntriesTab(); renderCandidatesTable();
}

function saveEntries() { logAdminAction('Saved program entries'); syncToCloud(); renderEntriesTab(); }

renderProgramsTable(); renderCandidatesTable(); renderEntriesTab();
