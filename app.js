const CLOUD_API_URL = "https://script.google.com/macros/s/AKfycbxlzA-KafoIAqSPCr-bONTTBt4l2bo7ZKNIxvf-8e7KPogsRtGFAe-9U79-pbaITSAl7w/exec";

var festPrograms = JSON.parse(localStorage.getItem('MEELAD_PROGRAMS')) || [];
var festCandidates = JSON.parse(localStorage.getItem('MEELAD_CANDIDATES')) || [];
var festResults = JSON.parse(localStorage.getItem('MEELAD_RESULTS')) || [];
var festSchedule = JSON.parse(localStorage.getItem('MEELAD_SCHEDULE')) || [];
var festNotices = JSON.parse(localStorage.getItem('MEELAD_NOTICES')) || [];
var adminLogs = JSON.parse(localStorage.getItem('MEELAD_ADMIN_LOGS')) || [];
var cloudLoaded = false, cloudHasNotices = false;

function logAdminAction(action) {
  adminLogs.unshift({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: action });
  if (adminLogs.length > 25) adminLogs = adminLogs.slice(0, 25);
  localStorage.setItem('MEELAD_ADMIN_LOGS', JSON.stringify(adminLogs));
}

function migrateTeams() {
  var fix = function (t) {
    var k = String(t == null ? '' : t).trim().toLowerCase();
    return (k === 'qusdiya' || k === 'qudsiya' || k === 'qusdiyya' || k === 'qudsiyya') ? 'Qudsiya' : t;
  };
  [festCandidates, festResults].forEach(function (arr) {
    arr.forEach(function (x) {
      x.team = fix(x.team);
      if (typeof x.name === 'string') x.name = x.name.replace(/Qusdiya/g, 'Qudsiya');
    });
  });
}
migrateTeams();

var carouselSlides = [], currentSlideIndex = 0, countdown = 30, timerInterval = null;
var liveAnnouncedResults = [], resultIndex = 0, quoteIndex = 0, selectedPosterModel = 1;

const customTemplateImages = {
  1: "assets/template1.png", 2: "assets/template2.png", 3: "assets/template3.png",
  4: "assets/template4.png", 5: "assets/template5.png"
};

var prophetQuotes = [
  { text: "The best among you are those who have the best manners and character.", translation: "നിങ്ങളിൽ ഏറ്റവും ഉത്തമർ അത്യുത്തമമായ സ്വഭാവഗുണമുള്ളവരാണ്." },
  { text: "None of you truly believes until he wishes for his brother what he wishes for himself.", translation: "തനിക്ക് ഇഷ്ടപ്പെടുന്നത് തന്റെ സഹോദരനും ഇഷ്ടപ്പെടുന്നതുവരെ നിങ്ങളിലൊരാളും പൂർണ്ണവിശ്വാസിയാവുകയില്ല." },
  { text: "A good word is a charity.", translation: "നല്ല വാക്ക് പറയുന്നതും ഒരു ധർമ്മമാണ് (സദഖ്)." }
];

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => alert(err.message));
    document.getElementById('fsIcon').className = "fa-solid fa-compress";
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
    document.getElementById('fsIcon').className = "fa-solid fa-expand";
  }
}

function openNav() { document.getElementById("sideNav").style.width = "260px"; document.getElementById("drawerOverlay").style.display = "block"; }
function closeNav() { document.getElementById("sideNav").style.width = "0"; document.getElementById("drawerOverlay").style.display = "none"; }

function showView(viewId) {
  closeNav();
  var panels = document.getElementsByClassName('view-panel');
  for (var i = 0; i < panels.length; i++) panels[i].classList.remove('active');
  var target = document.getElementById(viewId);
  if (target) target.classList.add('active');
  Array.prototype.forEach.call(document.querySelectorAll('.rail-btn'), function (b) {
    b.classList.toggle('active', b.getAttribute('data-v') === viewId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function jumpAdminSection(secId) {
  var el = document.getElementById(secId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function runGlobalSearch(q) {
  var box = document.getElementById('globalSearchResults');
  if (!box) return;
  q = String(q || '').trim().toLowerCase();
  if (!q) { box.style.display = 'none'; return; }
  var hits = [];
  festCandidates.forEach(function (c) {
    if (String(c.name).toLowerCase().includes(q) || String(c.regNo).toLowerCase().includes(q)) {
      hits.push({ label: c.name + ' (' + c.regNo + ')', tag: c.team + ' • ' + c.category, view: 'teamView' });
    }
  });
  festPrograms.forEach(function (p) {
    if (String(p.name).toLowerCase().includes(q)) {
      hits.push({ label: p.name, tag: p.type + ' • ' + p.category, view: 'programListView' });
    }
  });
  if (!hits.length) {
    box.innerHTML = '<div class="gs-item"><span class="muted-text">No matches found</span></div>';
  } else {
    box.innerHTML = hits.slice(0, 8).map(function (h) {
      return '<div class="gs-item" onclick="showView('' + h.view + '');document.getElementById('globalSearchResults').style.display='none'"><b>' + esc(h.label) + '</b><span class="badge" style="background:#E8F4EC;color:#217346;">' + esc(h.tag) + '</span></div>';
    }).join('');
  }
  box.style.display = 'block';
}
document.addEventListener('click', function (e) {
  var box = document.getElementById('globalSearchResults');
  if (box && !e.target.closest('.topbar-search-wrap')) box.style.display = 'none';
});

window.onload = function () {
  fetchCloudData();
  initCandidateRows();
  updateJudgeProgramDropdown();
  updateResultProgramDropdown();
  setInterval(fetchCloudData, 20000);
  setInterval(rotateQuote, 8000);
  setInterval(rotateAnnouncedResult, 5000);
};

function fetchCloudData() {
  fetch(CLOUD_API_URL)
    .then(res => res.json())
    .then(data => {
      if (data && data.programs) {
        festPrograms = data.programs || [];
        festCandidates = data.candidates || [];
        festResults = data.results || [];
        if (data.schedule) festSchedule = data.schedule;
        if (data.notices) { festNotices = data.notices; cloudHasNotices = true; }
        cloudLoaded = true;
        migrateTeams();
        localStorage.setItem('MEELAD_PROGRAMS', JSON.stringify(festPrograms));
        localStorage.setItem('MEELAD_CANDIDATES', JSON.stringify(festCandidates));
        localStorage.setItem('MEELAD_RESULTS', JSON.stringify(festResults));
        localStorage.setItem('MEELAD_SCHEDULE', JSON.stringify(festSchedule));
        localStorage.setItem('MEELAD_NOTICES', JSON.stringify(festNotices));
        var nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        var pSync = document.getElementById('pubLastSync'); if (pSync) pSync.textContent = nowStr;
        var aSync = document.getElementById('adminLastSync'); if (aSync) aSync.textContent = nowStr;
      }
      refreshAll();
    })
    .catch(err => { console.error("Cloud fetch error:", err); refreshAll(); });
}

function syncToCloud() {
  localStorage.setItem('MEELAD_PROGRAMS', JSON.stringify(festPrograms));
  localStorage.setItem('MEELAD_CANDIDATES', JSON.stringify(festCandidates));
  localStorage.setItem('MEELAD_RESULTS', JSON.stringify(festResults));
  localStorage.setItem('MEELAD_SCHEDULE', JSON.stringify(festSchedule));
  localStorage.setItem('MEELAD_NOTICES', JSON.stringify(festNotices));
  refreshAll();
  var payload = { programs: festPrograms, candidates: festCandidates, results: festResults, schedule: festSchedule, notices: festNotices };
  fetch(CLOUD_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(res => {
      var nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      var aSync = document.getElementById('adminLastSync'); if (aSync) aSync.textContent = nowStr;
      alert(res.message || "Synchronized across all devices!");
    })
    .catch(() => alert("Saved locally. Background network sync will retry."));
}

function saveAllData() { syncToCloud(); }

function updateDashboardOverviews() {
  var totalEntries = festCandidates.reduce(function (acc, c) { return acc + (Array.isArray(c.entries) ? c.entries.length : 0); }, 0);
  var pubKeys = {};
  festResults.forEach(function (r) {
    if ((r.published === 'YES' || r.published === undefined) && r.regNo !== '-') pubKeys[r.category + '|' + r.program] = 1;
  });
  var pubCount = Object.keys(pubKeys).length;
  var pendingCount = Math.max(0, festPrograms.length - pubCount);

  var setTxt = function (id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt('pubStatPrograms', festPrograms.length);
  setTxt('pubStatCandidates', festCandidates.length);
  setTxt('pubStatPublished', pubCount);

  setTxt('admStatPrograms', festPrograms.length);
  setTxt('admStatCandidates', festCandidates.length);
  setTxt('admStatEntries', totalEntries);
  setTxt('admStatPending', pendingCount);

  var pBox = document.getElementById('adminPendingTasks');
  if (pBox) {
    var drafts = {};
    festResults.forEach(function (r) { if (r.published === 'NO' && r.regNo !== '-') drafts[r.category + '|' + r.program] = 1; });
    pBox.innerHTML =
      '<div style="font-size:12.5px;line-height:1.8;">' +
      '<div>• <b>' + pendingCount + '</b> program(s) awaiting result entry</div>' +
      '<div>• <b>' + Object.keys(drafts).length + '</b> draft result(s) awaiting publish</div>' +
      '<div>• <b>' + festSchedule.length + '</b> schedule slot(s) listed</div>' +
      '</div>';
  }

  var lBox = document.getElementById('adminRecentLogs');
  if (lBox) {
    lBox.innerHTML = adminLogs.length === 0
      ? '<p class="muted-text">No recent admin actions in this session.</p>'
      : adminLogs.slice(0, 5).map(function (l) {
          return '<div style="font-size:12px;padding:4px 0;border-bottom:1px solid var(--border);"><b style="color:#217346;">' + l.time + '</b> — ' + esc(l.text) + '</div>';
        }).join('');
  }
}

function refreshAll() {
  migrateTeams();
  [renderProgramsTable, renderCandidatesTable, renderResultsAdminTable, buildPointTables, filterStudents, refreshCandidateRowsReg, renderStudentProgramMatrix, updateDashboardOverviews].forEach(function (fn) {
    try { fn(); } catch (err) { console.error('Render error in ' + fn.name + ':', err); }
  });
}

function toggleCategorySelect() {
  var type = document.getElementById('progType').value;
  var wrap = document.getElementById('progCatWrapper');
  var isGeneral = (type === 'General');
  wrap.style.opacity = isGeneral ? '0.5' : '1';
  document.getElementById('progCategory').disabled = isGeneral;
}

function addMoreProgramRow() {
  var container = document.getElementById('programRowsContainer');
  var div = document.createElement('div');
  div.className = 'program-input-row';
  div.style.cssText = 'display:flex; gap:8px; margin-bottom:8px;';
  div.innerHTML = '<input type="text" class="prog-name-input" placeholder="Program name"><button type="button" onclick="this.parentElement.remove()" class="btn-danger-sm"><i class="fa-solid fa-trash"></i></button>';
  container.appendChild(div);
}

function getTeamCode(t) { return t === "Qahira" ? "A" : t === "Qudsiya" ? "B" : t === "Qurthuba" ? "C" : "A"; }
function getCategoryCode(c) { return c === "SENIOR" ? "S" : c === "JUNIOR" ? "J" : c === "SUB-JUNIOR" ? "SJ" : "S"; }

function initCandidateRows() {
  var container = document.getElementById('candidateRowsContainer');
  if (!container) return;
  if (container.children.length === 0) {
    for (var i = 0; i < 3; i++) addCandidateRow();
  } else {
    refreshCandidateRowsReg();
  }
}

function addCandidateRow() {
  var container = document.getElementById('candidateRowsContainer');
  if (!container) return;
  var div = document.createElement('div');
  div.className = 'cand-multi-row';
  div.style.cssText = 'display:flex; gap:10px; margin-bottom:8px; align-items:center;';
  div.innerHTML = '<input type="text" class="cand-row-reg" readonly style="width:120px; font-weight:700; color:#217346; background:#F3F4F6; margin:0;" placeholder="Reg No">' +
    '<input type="text" class="cand-row-name" onkeyup="refreshCandidateRowsReg()" style="flex:1; margin:0;" placeholder="Enter Member Name">' +
    '<button type="button" onclick="removeCandidateRow(this)" class="btn-danger-sm"><i class="fa-solid fa-trash"></i></button>';
  container.appendChild(div);
  refreshCandidateRowsReg();
}

function removeCandidateRow(btn) {
  var container = document.getElementById('candidateRowsContainer');
  if (container.children.length > 1) {
    btn.parentElement.remove();
    refreshCandidateRowsReg();
  } else {
    btn.parentElement.querySelector('.cand-row-name').value = "";
  }
}

function refreshCandidateRowsReg() {
  var cat = document.getElementById('candCategory') ? document.getElementById('candCategory').value : "SENIOR";
  var team = document.getElementById('candTeam') ? document.getElementById('candTeam').value : "Qahira";
  var prefix = "MMO" + getCategoryCode(cat) + getTeamCode(team);
  var existingCount = festCandidates.filter(c => c.category === cat && c.team === team).length;
  document.querySelectorAll('.cand-multi-row').forEach((row, idx) => {
    var regInput = row.querySelector('.cand-row-reg');
    if (regInput) regInput.value = prefix + String(existingCount + idx + 1).padStart(2, '0');
  });
}

function saveBatchCandidates() {
  var cat = document.getElementById('candCategory').value;
  var team = document.getElementById('candTeam').value;
  var addedList = [];
  document.querySelectorAll('.cand-multi-row').forEach(row => {
    var reg = row.querySelector('.cand-row-reg').value.trim();
    var name = row.querySelector('.cand-row-name').value.trim();
    if (name) addedList.push({ id: Date.now() + Math.random(), regNo: reg, name: name, category: cat, team: team, entries: [] });
  });
  if (addedList.length === 0) { alert("Please enter at least one participant name."); return; }
  festCandidates = festCandidates.concat(addedList);
  logAdminAction('Registered ' + addedList.length + ' candidate(s) in ' + team + ' (' + cat + ')');
  saveAllData();
  document.getElementById('candidateRowsContainer').innerHTML = "";
  for (var k = 0; k < 3; k++) addCandidateRow();
  alert('Saved ' + addedList.length + ' candidate(s) under ' + team + ' (' + cat + ')!');
}

function deleteCandidate(id) {
  if (confirm("Delete this candidate permanently?")) {
    festCandidates = festCandidates.filter(c => c.id !== id);
    logAdminAction('Deleted candidate');
    saveAllData();
  }
}

function printTeamListPDF() {
  var teams = ["Qahira", "Qudsiya", "Qurthuba"], categories = ["SENIOR", "JUNIOR", "SUB-JUNIOR"], win = window.open('', '_blank'), bodyContent = "";
  teams.forEach(team => {
    bodyContent += '<div style="page-break-after:always; margin-bottom:24px;"><div style="text-align:center;border-bottom:2px solid #217346;padding-bottom:8px;margin-bottom:14px;">' +
      festTitleHtml(18, 8) + '<h3 style="margin:6px 0 0;color:#217346;">TEAM ROSTER: ' + team.toUpperCase() + '</h3></div>';
    categories.forEach(cat => {
      var members = festCandidates.filter(c => c.team === team && c.category === cat);
      bodyContent += '<h4 style="background:#F3F4F6;padding:6px 10px;border-left:4px solid #217346;margin:10px 0 6px;">' + cat + '</h4>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:12px;"><thead><tr style="background:#F3F4F6;">' +
        '<th style="border:1px solid #E9EAED;padding:6px;width:10%;">Sl</th><th style="border:1px solid #E9EAED;padding:6px;width:25%;">Reg No</th><th style="border:1px solid #E9EAED;padding:6px;width:65%;">Candidate Name</th></tr></thead><tbody>' +
        (members.length ? members.map((m, idx) => '<tr><td style="border:1px solid #E9EAED;padding:6px;text-align:center;">' + (idx + 1) + '</td><td style="border:1px solid #E9EAED;padding:6px;font-weight:700;">' + m.regNo + '</td><td style="border:1px solid #E9EAED;padding:6px;">' + m.name + '</td></tr>').join('') : '<tr><td colspan="3" style="border:1px solid #E9EAED;padding:6px;text-align:center;color:#94a3b8;">No candidates</td></tr>') + '</tbody></table>';
    });
    bodyContent += '<div style="display:flex;justify-content:space-between;margin-top:24px;font-size:12px;font-weight:700;"><div>Team Leader Sign: _________________</div><div>Convener Sign: _________________</div></div></div>';
  });
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Team Rosters</title><style>@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box;font-family:"Segoe UI",sans-serif}body{background:#fff;color:#202124;margin:0}</style></head><body>' + bodyContent + '<script>window.print();<\/script></body></html>');
  win.document.close();
}

function updateJudgeProgramDropdown() {
  var cat = document.getElementById('judgeCatSelect').value, select = document.getElementById('judgeItemSelect');
  var progs = (cat === 'GENERAL') ? festPrograms.filter(p => p.type === 'General' || p.category === 'GENERAL') : festPrograms.filter(p => p.category === cat);
  select.innerHTML = progs.length === 0 ? '<option value="">No programs in ' + cat + '</option>' : progs.map(p => '<option value="' + esc(p.name) + '">' + esc(p.name) + ' (' + esc(p.type) + ')</option>').join('');
}

function updateResultProgramDropdown() {
  var cat = document.getElementById('resCategory').value, select = document.getElementById('resItemSelect');
  var progs = (cat === 'GENERAL') ? festPrograms.filter(p => p.type === 'General' || p.category === 'GENERAL') : festPrograms.filter(p => p.category === cat);
  select.innerHTML = progs.map(p => '<option value="' + esc(p.name) + '">' + esc(p.name) + ' (' + esc(p.type) + ')</option>').join('');
  updateResultCandidateDropdown();
}

function updateResultCandidateDropdown() {}

function deleteResult(id) {
  if (confirm("Delete this result entry?")) {
    festResults = festResults.filter(r => r.id !== id);
    logAdminAction('Deleted result entry');
    saveAllData();
  }
}

function renderResultsAdminTable() {
  var container = document.getElementById('resultsAdminTable');
  if (!container) return;
  if (festResults.length === 0) { container.innerHTML = "<p class='muted-text' style='padding:12px;'>No results evaluated yet.</p>"; return; }
  var html = '<table><thead><tr><th>Participant</th><th>Category</th><th>Item</th><th>Mark</th><th>Rank</th><th>Status</th><th>Poster</th><th>Action</th></tr></thead><tbody>';
  html += festResults.map(r => {
    var isPub = (r.published === 'YES' || r.published === undefined);
    var st = isPub ? '<span class="badge" style="background:#d1fae5;color:#047857;">PUBLISHED</span>' : '<span class="badge" style="background:#E8F4EC;color:#217346;">DRAFT</span>';
    return '<tr><td><b>' + esc(r.name) + '</b> <span class="badge team-badge-' + String(r.team).toLowerCase() + '">' + esc(r.team) + '</span></td>' +
      '<td>' + esc(r.category) + '</td><td>' + esc(r.program) + '</td><td style="font-weight:800;">' + r.mark + '</td><td style="font-weight:700;color:#217346;">' + esc(r.place) + '</td>' +
      '<td>' + st + '</td><td><button onclick="openPosterStudioWithData('' + encodeURIComponent(r.name) + '','' + encodeURIComponent(r.team) + '','' + encodeURIComponent(r.category) + '','' + encodeURIComponent(r.program) + '','' + encodeURIComponent(r.place || 'WINNER') + '')" class="btn-outline-sm"><i class="fa-solid fa-wand-magic-sparkles"></i> Poster</button></td>' +
      '<td><button onclick="deleteResult(' + r.id + ')" class="btn-danger-sm"><i class="fa-solid fa-trash"></i></button></td></tr>';
  }).join('');
  container.innerHTML = html + '</tbody></table>';
}

function openPosterStudioWithData(nameEnc, teamEnc, catEnc, progEnc, posEnc) {
  document.getElementById('pmCandidateName').value = decodeURIComponent(nameEnc);
  document.getElementById('pmTeam').value = decodeURIComponent(teamEnc);
  document.getElementById('pmCategory').value = decodeURIComponent(catEnc);
  document.getElementById('pmProgram').value = decodeURIComponent(progEnc);
  var pos = decodeURIComponent(posEnc), sel = document.getElementById('pmPosition');
  if (pos.includes('2')) sel.value = 'SECOND PLACE';
  else if (pos.includes('3')) sel.value = 'THIRD PLACE';
  else sel.value = 'FIRST PLACE';
  document.getElementById('posterStudioModal').style.display = 'flex';
  drawPosterPreview();
}
function closePosterStudio() { document.getElementById('posterStudioModal').style.display = 'none'; }
function setPosterModel(n) { selectedPosterModel = n; document.querySelectorAll('.model-btn').forEach((b, i) => b.classList.toggle('active', (i + 1) === n)); drawPosterPreview(); }
function downloadPosterImage() {
  var canvas = document.getElementById('posterCanvas'), name = document.getElementById('pmCandidateName').value.trim() || 'Winner', prog = document.getElementById('pmProgram').value.trim() || 'Result';
  var link = document.createElement('a');
  link.download = 'MMOArtsFest_' + name.replace(/\s+/g, '_') + '_' + prog.replace(/\s+/g, '_') + '_Poster.png';
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

function addManualCategoryScore() {
  var cat = document.getElementById('ptCategory').value, team = document.getElementById('ptTeam').value, reason = document.getElementById('ptReason').value.trim() || "Manual Adjustment", marks = Number(document.getElementById('ptMarks').value) || 0;
  festResults.push({ id: Date.now(), regNo: '-', name: reason, team: team, category: cat, program: reason, mark: marks, grade: '-', place: '-', published: 'YES' });
  logAdminAction('Manual score ' + marks + ' to ' + team + ' (' + cat + ')');
  saveAllData();
  document.getElementById('ptReason').value = ""; document.getElementById('ptMarks').value = "";
}

function buildPointTables() {
  var teams = ["Qurthuba", "Qudsiya", "Qahira"], teamScores = { "Qurthuba": 0, "Qudsiya": 0, "Qahira": 0 }, categories = ["SENIOR", "JUNIOR", "SUB-JUNIOR", "GENERAL"], catScores = {};
  categories.forEach(c => { catScores[c] = { "Qurthuba": 0, "Qudsiya": 0, "Qahira": 0 }; });

  festResults.filter(r => r.published === 'YES' || r.published === undefined).forEach(r => {
    var m = Number(r.mark || 0);
    if (teamScores[r.team] !== undefined) teamScores[r.team] += m;
    if (catScores[r.category] && catScores[r.category][r.team] !== undefined) catScores[r.category][r.team] += m;
  });

  var sortedTeams = teams.map(t => ({ team: t, score: teamScores[t] })).sort((a, b) => b.score - a.score);
  var leaderEl = document.getElementById('pubStatLeader');
  if (leaderEl) leaderEl.textContent = sortedTeams[0] && sortedTeams[0].score > 0 ? sortedTeams[0].team : '—';

  var overallHtml = '<table><thead><tr><th>Rank</th><th>Team</th><th>Total Score</th></tr></thead><tbody>' +
    sortedTeams.map((s, idx) => '<tr><td><b>#' + (idx + 1) + '</b></td><td><span class="badge team-badge-' + s.team.toLowerCase() + '">' + s.team + '</span></td><td style="font-weight:800;color:#217346;">' + s.score + ' pts</td></tr>').join('') + '</tbody></table>';

  document.getElementById('teamPointsTable').innerHTML = overallHtml;
  document.getElementById('adminPointTablePreview').innerHTML = overallHtml;
  var pubLb = document.getElementById('pubLiveLeaderboard'); if (pubLb) pubLb.innerHTML = overallHtml;
  var admLb = document.getElementById('adminMiniLeaderboard'); if (admLb) admLb.innerHTML = overallHtml;

  document.getElementById('categoryBreakdownTables').innerHTML = categories.map(cat =>
    '<div class="surface-card"><h4>' + cat + ' Standings</h4><table><thead><tr><th>Team</th><th>Score</th></tr></thead><tbody>' +
    teams.map(t => '<tr><td><span class="badge team-badge-' + t.toLowerCase() + '">' + t + '</span></td><td style="font-weight:700;">' + catScores[cat][t] + ' pts</td></tr>').join('') + '</tbody></table></div>').join('');

  buildCarousel(catScores);
  liveAnnouncedResults = festResults.filter(r => r.place && r.place !== '-' && r.published === 'YES').map(r => ({ program: r.program, category: r.category, winner: r.name + ' (' + r.team + ') - ' + r.place, rawObj: r }));
  rotateAnnouncedResult();
}

function buildCarousel(catScores) {
  carouselSlides = [];
  ["SENIOR", "JUNIOR", "SUB-JUNIOR", "GENERAL"].forEach(cat => {
    var html = '<div class="table-responsive"><table><thead><tr><th>Team</th><th>Current Score</th></tr></thead><tbody>' +
      '<tr><td><span class="badge team-badge-qurthuba">Qurthuba</span></td><td><b>' + catScores[cat]["Qurthuba"] + ' pts</b></td></tr>' +
      '<tr><td><span class="badge team-badge-qudsiya">Qudsiya</span></td><td><b>' + catScores[cat]["Qudsiya"] + ' pts</b></td></tr>' +
      '<tr><td><span class="badge team-badge-qahira">Qahira</span></td><td><b>' + catScores[cat]["Qahira"] + ' pts</b></td></tr>' +
      '</tbody></table></div>';
    carouselSlides.push({ title: cat + ' Standings', content: html });
  });
  renderCurrentSlide();
  if (!timerInterval) startCarousel();
}

function startCarousel() {
  if (timerInterval) clearInterval(timerInterval);
  countdown = 30;
  timerInterval = setInterval(function () {
    countdown--;
    var b = document.getElementById('rotatorTimerBadge'); if (b) b.innerHTML = '<span class="coral-dot"></span> ' + countdown + 's';
    if (countdown <= 0) { countdown = 30; currentSlideIndex = (currentSlideIndex + 1) % carouselSlides.length; renderCurrentSlide(); }
  }, 1000);
}

function renderCurrentSlide() {
  if (!carouselSlides[currentSlideIndex]) return;
  document.getElementById('displayHeaderTitle').innerText = carouselSlides[currentSlideIndex].title;
  document.getElementById('carouselCardContainer').innerHTML = carouselSlides[currentSlideIndex].content;
}

function rotateQuote() {
  quoteIndex = (quoteIndex + 1) % prophetQuotes.length;
  var q = prophetQuotes[quoteIndex];
  document.getElementById('quoteDisplay').innerHTML = '<div class="quote-text">"' + q.text + '"</div><div class="quote-translation"><b>തർജ്ജമ:</b> ' + q.translation + '</div>';
}

function rotateAnnouncedResult() {
  var box = document.getElementById('announcedDisplay'); if (!box) return;
  if (!liveAnnouncedResults || liveAnnouncedResults.length === 0) { box.innerHTML = '<div class="muted-text">No results published yet.</div>'; return; }
  if (resultIndex >= liveAnnouncedResults.length) resultIndex = 0;
  var res = liveAnnouncedResults[resultIndex], rObj = res.rawObj || {};
  box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
    '<div><div class="result-program">' + esc(res.program) + '</div><div class="result-cat">' + esc(res.category) + '</div><div class="result-winner"><b>' + esc(res.winner) + '</b></div></div>' +
    '<button onclick="openPosterStudioWithData('' + encodeURIComponent(rObj.name || '') + '','' + encodeURIComponent(rObj.team || '') + '','' + encodeURIComponent(rObj.category || '') + '','' + encodeURIComponent(rObj.program || '') + '','' + encodeURIComponent(rObj.place || '') + '')" class="btn-outline-sm"><i class="fa-solid fa-wand-magic-sparkles"></i> Poster</button></div>';
  resultIndex = (resultIndex + 1) % liveAnnouncedResults.length;
}

function authOfficial() {
  var u = document.getElementById('officialUser').value.trim(), p = document.getElementById('officialPass').value.trim();
  if (u === "ADMIN" && p === "*mmo#1956") {
    document.getElementById('officialLoginErr').innerText = "";
    document.getElementById('officialAuth').style.display = "none";
    document.getElementById('officialContent').style.display = "block";
    logAdminAction('Signed in to Official Portal');
    refreshAll();
  } else {
    document.getElementById('officialLoginErr').innerText = "Access Denied: Invalid Admin Credentials.";
  }
}

function logoutOfficial() {
  document.getElementById('officialAuth').style.display = "block";
  document.getElementById('officialContent').style.display = "none";
  document.getElementById('officialPass').value = "";
}

function lookupResult() {
  var reg = document.getElementById('studentRegNo').value.trim(), box = document.getElementById('studentResultBox');
  if (!reg) return;
  var res = festResults.filter(r => String(r.regNo).toLowerCase() === reg.toLowerCase() && (r.published === 'YES' || r.published === undefined));
  if (res.length) {
    box.innerHTML = res.map(r => '<div class="sub-card" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">' +
      '<div><b>' + esc(r.name) + '</b> <span class="badge team-badge-' + String(r.team || '').toLowerCase() + '">' + esc(r.team) + '</span><br>' +
      '<span class="muted-text">Item: <b>' + esc(r.program) + '</b> (' + esc(r.category) + ') | Mark: <b>' + r.mark + '</b> | Place: <b>' + esc(r.place || '-') + '</b></span></div>' +
      '<button onclick="openPosterStudioWithData('' + encodeURIComponent(r.name) + '','' + encodeURIComponent(r.team) + '','' + encodeURIComponent(r.category) + '','' + encodeURIComponent(r.program) + '','' + encodeURIComponent(r.place || 'WINNER') + '')" class="btn-outline-sm"><i class="fa-solid fa-wand-magic-sparkles"></i> Poster</button></div>').join('');
  } else {
    box.innerHTML = '<p class="error-text">No published scores found for Reg No: ' + esc(reg) + '</p>';
  }
}

function filterStudents() {
  var regQ = (document.getElementById('searchReg') ? document.getElementById('searchReg').value : '').toLowerCase().trim();
  var nameQ = (document.getElementById('searchName') ? document.getElementById('searchName').value : '').toLowerCase().trim();
  var catQ = (document.getElementById('searchCategory') ? document.getElementById('searchCategory').value : '').toUpperCase().trim();
  var teamQ = (document.getElementById('searchTeam') ? document.getElementById('searchTeam').value : '').trim();
  var list = festCandidates.filter(s => (!regQ || String(s.regNo).toLowerCase().includes(regQ)) && (!nameQ || String(s.name).toLowerCase().includes(nameQ)) && (!catQ || String(s.category).toUpperCase() === catQ) && (!teamQ || s.team === teamQ));
  var container = document.getElementById('teamMembersTable'); if (!container) return;
  if (!list.length) { container.innerHTML = "<p class='muted-text' style='padding:12px;'>No matching candidates found.</p>"; return; }
  container.innerHTML = '<table><thead><tr><th>Reg No</th><th>Name</th><th>Category</th><th>Team</th></tr></thead><tbody>' +
    list.map(m => '<tr><td><b style="color:#217346;">' + esc(m.regNo) + '</b></td><td>' + esc(m.name) + '</td><td>' + esc(m.category) + '</td><td><span class="badge team-badge-' + m.team.toLowerCase() + '">' + esc(m.team) + '</span></td></tr>').join('') + '</tbody></table>';
}
