/* MMO Arts Fest — Entries module
   - Programs: edit + "max participants per team"
   - Candidates: edit name + number of programs
   - Entries tab: tick which programs each candidate takes part in (limits enforced)
   Data added: program.max (number, blank = default)  |  candidate.entries (array of program keys) */

var entriesDirty = false;

function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function enc(s) { return encodeURIComponent(s); }
function progKey(p) { return String(p.category) + '|' + String(p.name).trim().toLowerCase(); }
function progMax(p) {
  if (p.max !== undefined && p.max !== null && p.max !== '') return Number(p.max) || 0;
  return p.type === 'Individual' ? 3 : 0;      // 0 = no limit
}
function maxText(p) { var m = progMax(p); return m > 0 ? String(m) : '∞'; }
function findProgByKey(k) { return festPrograms.filter(function (p) { return progKey(p) === k; })[0]; }
function teamCount(team, key) {
  return festCandidates.filter(function (c) { return c.team === team && (c.entries || []).indexOf(key) >= 0; }).length;
}
function totalEntered(key) {
  return festCandidates.filter(function (c) { return (c.entries || []).indexOf(key) >= 0; }).length;
}
function candProgCount(c) {
  var keys = (c.entries || []).filter(function (k) { return !!findProgByKey(k); });
  return keys;
}

/* ---------- small popup ---------- */
function miniModal(title, body, onSave) {
  var m = document.getElementById('miniModal');
  if (!m) { m = document.createElement('div'); m.id = 'miniModal'; m.className = 'mini-modal'; document.body.appendChild(m); }
  m.innerHTML = '<div class="mini-card"><h3 style="margin-bottom:12px;">' + title + '</h3>' + body +
    '<div style="display:flex;gap:10px;margin-top:6px;"><button class="btn" id="mmCancel" style="background:#e2e8f0;color:#0f172a;">Cancel</button>' +
    '<button class="btn btn-success" id="mmSave">Save</button></div></div>';
  m.style.display = 'flex';
  m.querySelector('#mmCancel').onclick = function () { m.style.display = 'none'; };
  m.querySelector('#mmSave').onclick = function () { if (onSave() !== false) m.style.display = 'none'; };
}

/* ---------- wrappers around existing functions ---------- */
var _refreshAll = refreshAll;
refreshAll = function () { _refreshAll.apply(this, arguments); renderEntriesTab(); };

var _fetchCloud = fetchCloudData;
fetchCloudData = function () { if (entriesDirty) return; _fetchCloud.apply(this, arguments); };

var _syncCloud = syncToCloud;
syncToCloud = function () { entriesDirty = false; return _syncCloud.apply(this, arguments); };

var _openSub = openOfficialSubTab;
openOfficialSubTab = function (id) { _openSub.apply(this, arguments); if (id === 'tabEntries') renderEntriesTab(); };

/* ---------- PROGRAMS ---------- */
function savePrograms() {
  var type = document.getElementById('progType').value;
  var cat = (type === 'General') ? 'GENERAL' : document.getElementById('progCategory').value;
  var maxRaw = document.getElementById('progMax').value.trim();
  var inputs = document.querySelectorAll('.prog-name-input');
  var added = 0, dup = [];
  inputs.forEach(function (input) {
    var name = input.value.trim();
    if (!name) return;
    var p = { id: Date.now() + Math.random(), name: name, category: cat, type: type };
    if (maxRaw !== '') p.max = Math.max(0, Number(maxRaw) || 0);
    if (findProgByKey(progKey(p))) { dup.push(name); return; }
    festPrograms.push(p); added++;
  });
  if (added > 0) {
    saveAllData();
    document.getElementById('programRowsContainer').innerHTML = '<div class="program-input-row" style="display:flex; gap:8px; margin-bottom:8px;"><input type="text" class="prog-name-input" placeholder="Enter Program Name (e.g. Qira\'at, Quiz, Madih, Duff)"></div>';
    document.getElementById('progMax').value = '';
    alert(added + ' Program(s) added successfully!' + (dup.length ? '\nSkipped (already exists): ' + dup.join(', ') : ''));
  } else {
    alert(dup.length ? 'Already exists: ' + dup.join(', ') : 'Please type at least one program name.');
  }
}

function renderProgramsTable() {
  var box = document.getElementById('programsListTable');
  if (!box) return;
  if (festPrograms.length === 0) { box.innerHTML = "<p style='font-size:13px; padding:12px; color:var(--text-muted);'>No competition programs registered yet.</p>"; return; }
  var h = '<table><thead><tr><th>Type</th><th>Category</th><th>Program Name</th><th>Max / Team</th><th>Entered</th><th>Action</th></tr></thead><tbody>';
  festPrograms.forEach(function (p) {
    var k = progKey(p);
    h += '<tr><td><b>' + esc(p.type) + '</b></td>' +
      '<td><span class="badge" style="background:#e0f2fe; color:var(--navy-dark);">' + esc(p.category) + '</span></td>' +
      '<td style="color:var(--navy-main); font-weight:600;">' + esc(p.name) + '</td>' +
      '<td style="font-weight:800;">' + maxText(p) + '</td>' +
      '<td>' + totalEntered(k) + '</td>' +
      '<td style="white-space:nowrap;"><button onclick="editProgram(\'' + enc(k) + '\')" style="padding:4px 10px; background:#0284c7; color:#fff; border:none; border-radius:4px; cursor:pointer; margin-right:4px;"><i class="fa-solid fa-pen"></i> Edit</button>' +
      '<button onclick="deleteProgramByKey(\'' + enc(k) + '\')" style="padding:4px 8px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td></tr>';
  });
  box.innerHTML = h + '</tbody></table>';
}

function deleteProgramByKey(k) {
  k = decodeURIComponent(k);
  var p = findProgByKey(k);
  if (!p || !confirm('Delete "' + p.name + '"? Candidate entries for it will also be removed.')) return;
  festPrograms = festPrograms.filter(function (x) { return progKey(x) !== k; });
  festCandidates.forEach(function (c) { c.entries = (c.entries || []).filter(function (e) { return e !== k; }); });
  saveAllData();
}

function editProgram(k) {
  k = decodeURIComponent(k);
  var p = findProgByKey(k);
  if (!p) return;
  var opt = function (v, t, sel) { return '<option value="' + v + '"' + (sel === v ? ' selected' : '') + '>' + t + '</option>'; };
  miniModal('Edit Program',
    '<label style="font-size:12px;">Program name</label><input type="text" id="emName" value="' + esc(p.name) + '">' +
    '<label style="font-size:12px;">Type</label><select id="emType">' + opt('Individual', 'Individual', p.type) + opt('Group', 'Group', p.type) + opt('Non-Stage', 'Non-Stage', p.type) + opt('General', 'General (all team)', p.type) + '</select>' +
    '<label style="font-size:12px;">Category</label><select id="emCat">' + opt('SENIOR', 'Senior', p.category) + opt('JUNIOR', 'Junior', p.category) + opt('SUB-JUNIOR', 'Sub-Junior', p.category) + '</select>' +
    '<label style="font-size:12px;">Max participants per team (blank = default, 0 = no limit)</label><input type="number" id="emMax" min="0" value="' + (p.max === undefined || p.max === null ? '' : p.max) + '" placeholder="Default: ' + (p.type === 'Individual' ? '3' : 'no limit') + '">',
    function () {
      var name = document.getElementById('emName').value.trim();
      var type = document.getElementById('emType').value;
      var cat = type === 'General' ? 'GENERAL' : document.getElementById('emCat').value;
      var mx = document.getElementById('emMax').value.trim();
      if (!name) { alert('Program name cannot be empty.'); return false; }
      var np = { name: name, type: type, category: cat };
      if (mx !== '') np.max = Math.max(0, Number(mx) || 0);
      var nk = progKey(np);
      if (nk !== k && findProgByKey(nk)) { alert('Another program with this name already exists in this category.'); return false; }
      var limit = progMax(np.max === undefined ? { type: type } : { type: type, max: np.max });
      if (limit > 0) {
        var over = ['Qahira', 'Qusdiya', 'Qurthuba'].filter(function (t) { return teamCount(t, k) > limit; });
        if (over.length && !confirm('Team(s) ' + over.join(', ') + ' already have more than ' + limit + ' entered. Continue? (Untick extra candidates in the Entries tab.)')) return false;
      }
      var oldName = p.name, oldCat = p.category;
      p.name = name; p.type = type; p.category = cat;
      if (mx !== '') p.max = np.max; else delete p.max;
      if (nk !== k) {
        festCandidates.forEach(function (c) { c.entries = (c.entries || []).map(function (e) { return e === k ? nk : e; }); });
        festResults.forEach(function (r) { if (r.program === oldName && r.category === oldCat) { r.program = name; r.category = cat; } });
      }
      saveAllData();
    });
}

/* ---------- CANDIDATES ---------- */
function renderCandidatesTable() {
  var box = document.getElementById('candidatesListTable');
  if (!box) return;
  if (festCandidates.length === 0) { box.innerHTML = "<p style='font-size:13px; padding:12px; color:var(--text-muted);'>No candidates registered yet.</p>"; return; }
  var h = '<table><thead><tr><th>Reg No</th><th>Candidate Name</th><th>Category</th><th>Team</th><th>Programs</th><th>Action</th></tr></thead><tbody>';
  festCandidates.forEach(function (c) {
    var keys = candProgCount(c);
    var names = keys.map(function (k) { return findProgByKey(k).name; }).join(', ');
    h += '<tr><td><b style="color:var(--navy-main);">' + esc(c.regNo) + '</b></td><td>' + esc(c.name) + '</td>' +
      '<td><span class="badge" style="background:#e0f2fe; color:var(--navy-dark);">' + esc(c.category) + '</span></td>' +
      '<td><span class="badge team-badge-' + String(c.team).toLowerCase() + '">' + esc(c.team) + '</span></td>' +
      '<td title="' + esc(names) + '"><span class="badge" style="background:' + (keys.length ? '#d1fae5;color:#047857' : '#f1f5f9;color:#64748b') + ';">' + keys.length + ' program' + (keys.length === 1 ? '' : 's') + '</span></td>' +
      '<td style="white-space:nowrap;"><button onclick="editCandidate(\'' + enc(c.regNo) + '\')" style="padding:4px 10px; background:#0284c7; color:#fff; border:none; border-radius:4px; cursor:pointer; margin-right:4px;"><i class="fa-solid fa-pen"></i> Edit</button>' +
      '<button onclick="deleteCandidate(' + c.id + ')" style="padding:4px 8px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td></tr>';
  });
  box.innerHTML = h + '</tbody></table>';
}

function editCandidate(reg) {
  reg = decodeURIComponent(reg);
  var c = festCandidates.filter(function (x) { return x.regNo === reg; })[0];
  if (!c) return;
  miniModal('Edit Candidate — ' + esc(c.regNo),
    '<label style="font-size:12px;">Candidate name</label><input type="text" id="ecName" value="' + esc(c.name) + '">' +
    '<p style="font-size:11.5px;color:var(--text-muted);margin-bottom:8px;">Reg No, team and category stay the same. Programs are ticked in the <b>Entries</b> tab.</p>',
    function () {
      var n = document.getElementById('ecName').value.trim();
      if (!n) { alert('Name cannot be empty.'); return false; }
      c.name = n;
      festResults.forEach(function (r) { if (r.regNo === c.regNo) r.name = n; });
      saveAllData();
    });
}

/* ---------- ENTRIES TAB ---------- */
function programsForCategory(cat) {
  var order = { 'Individual': 1, 'Group': 2, 'Non-Stage': 3, 'General': 4 };
  return festPrograms.filter(function (p) { return p.category === cat || p.category === 'GENERAL' || p.type === 'General'; })
    .sort(function (a, b) { return (order[a.type] || 9) - (order[b.type] || 9); });
}

function renderEntriesTab() {
  var box = document.getElementById('entriesTable');
  if (!box) return;
  var team = document.getElementById('entTeam').value, cat = document.getElementById('entCat').value;
  var prevTop = box.scrollTop, prevLeft = box.scrollLeft;
  var cands = festCandidates.filter(function (c) { return c.team === team && c.category === cat; });
  var progs = programsForCategory(cat);
  var st = document.getElementById('entStatus');
  if (st) st.innerHTML = entriesDirty ? '<span style="color:#b45309;font-weight:700;">● Unsaved changes — click Save</span>' : '<span style="color:#047857;">All changes saved</span>';

  if (cands.length === 0) { box.innerHTML = "<p style='padding:16px;text-align:center;color:var(--text-muted);'>No candidates registered for " + team + " in " + cat + ".</p>"; return; }
  if (progs.length === 0) { box.innerHTML = "<p style='padding:16px;text-align:center;color:var(--text-muted);'>No programs added for " + cat + " yet.</p>"; return; }

  var h = '<table class="matrix-table"><thead><tr><th>#</th><th class="sticky-col">Candidate</th><th>Reg No</th>';
  progs.forEach(function (p) {
    var k = progKey(p), m = progMax(p), n = teamCount(team, k);
    var full = m > 0 && n >= m;
    h += '<th style="min-width:92px;white-space:normal;font-size:11px;">' + esc(p.name) + '<br><span style="font-weight:500;opacity:.85;">' + esc(p.type) + '</span><br>' +
      '<span style="display:inline-block;margin-top:3px;padding:1px 8px;border-radius:10px;background:' + (full ? '#fee2e2;color:#b91c1c' : '#e3f3ec;color:#0b5d4b') + ';">' + n + ' / ' + maxText(p) + '</span></th>';
  });
  h += '<th>Total</th></tr></thead><tbody>';
  cands.forEach(function (c, i) {
    h += '<tr><td>' + (i + 1) + '</td><td class="sticky-col"><b>' + esc(c.name) + '</b></td><td><code style="font-weight:700;font-size:12px;">' + esc(c.regNo) + '</code></td>';
    progs.forEach(function (p) {
      var k = progKey(p), on = (c.entries || []).indexOf(k) >= 0, m = progMax(p);
      var blocked = !on && m > 0 && teamCount(team, k) >= m;
      h += '<td><input type="checkbox" class="ent-cb" ' + (on ? 'checked ' : '') + (blocked ? 'disabled title="Maximum reached" ' : '') +
        'onchange="toggleEntry(\'' + enc(c.regNo) + '\',\'' + enc(k) + '\',this)"></td>';
    });
    h += '<td style="font-weight:800;color:var(--emerald-main);">' + candProgCount(c).length + '</td></tr>';
  });
  box.innerHTML = h + '</tbody></table>';
  box.scrollTop = prevTop; box.scrollLeft = prevLeft;
}

function toggleEntry(reg, key, cb) {
  reg = decodeURIComponent(reg); key = decodeURIComponent(key);
  var c = festCandidates.filter(function (x) { return x.regNo === reg; })[0], p = findProgByKey(key);
  if (!c || !p) return;
  if (!Array.isArray(c.entries)) c.entries = [];
  if (cb.checked) {
    var m = progMax(p);
    if (m > 0 && teamCount(c.team, key) >= m) {
      alert('Maximum ' + m + ' participant(s) allowed from ' + c.team + ' in "' + p.name + '".');
      cb.checked = false; return;
    }
    if (c.entries.indexOf(key) < 0) c.entries.push(key);
  } else {
    c.entries = c.entries.filter(function (e) { return e !== key; });
  }
  entriesDirty = true;
  localStorage.setItem('MEELAD_CANDIDATES', JSON.stringify(festCandidates));
  renderEntriesTab();
  renderCandidatesTable();
}

function saveEntries() { syncToCloud(); renderEntriesTab(); }

/* ---------- Results: only offer candidates who are entered in the chosen item ---------- */
var _updResCand = updateResultCandidateDropdown;
updateResultCandidateDropdown = function () {
  _updResCand.apply(this, arguments);
  var cat = document.getElementById('resCategory').value;
  if (cat === 'GENERAL') return;
  var item = document.getElementById('resItemSelect').value;
  var p = festPrograms.filter(function (x) { return x.name === item && x.category === cat; })[0];
  if (!p) return;
  var k = progKey(p);
  var entered = festCandidates.filter(function (c) { return c.category === cat && (c.entries || []).indexOf(k) >= 0; });
  if (entered.length > 0) {
    document.getElementById('resCandidateSelect').innerHTML = entered.map(function (c) {
      return '<option value="' + esc(c.regNo) + '|' + esc(c.name) + '|' + esc(c.team) + '">#' + esc(c.regNo) + ' - ' + esc(c.name) + ' (' + esc(c.team) + ')</option>';
    }).join('');
  }
};
(function () {
  var it = document.getElementById('resItemSelect');
  if (it) it.addEventListener('change', function () { updateResultCandidateDropdown(); });
})();

renderProgramsTable();
renderCandidatesTable();
renderEntriesTab();
