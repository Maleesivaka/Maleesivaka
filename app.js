const CLOUD_API_URL = "https://script.google.com/macros/s/AKfycbxlzA-KafoIAqSPCr-bONTTBt4l2bo7ZKNIxvf-8e7KPogsRtGFAe-9U79-pbaITSAl7w/exec";

var festPrograms = JSON.parse(localStorage.getItem('MEELAD_PROGRAMS')) || [];
var festCandidates = JSON.parse(localStorage.getItem('MEELAD_CANDIDATES')) || [];
var festResults = JSON.parse(localStorage.getItem('MEELAD_RESULTS')) || [];

var carouselSlides = [];
var currentSlideIndex = 0;
var countdown = 30;
var timerInterval = null;
var liveAnnouncedResults = [];
var resultIndex = 0;
var quoteIndex = 0;
var selectedPosterModel = 1;

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

function openNav() { document.getElementById("sideNav").style.width = "270px"; document.getElementById("drawerOverlay").style.display = "block"; }
function closeNav() { document.getElementById("sideNav").style.width = "0"; document.getElementById("drawerOverlay").style.display = "none"; }

function showView(viewId) {
  closeNav();
  var panels = document.getElementsByClassName('view-panel');
  for (var i = 0; i < panels.length; i++) panels[i].classList.remove('active');
  var target = document.getElementById(viewId);
  if (target) target.classList.add('active');
}

function openOfficialSubTab(tabId) {
  var tabs = document.getElementsByClassName('official-tab-content');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
  var btns = document.getElementsByClassName('tab-btn');
  for (var j = 0; j < btns.length; j++) btns[j].classList.remove('active');
  document.getElementById(tabId).classList.add('active');
  event.currentTarget.classList.add('active');
  if (tabId === 'tabCandidates') initCandidateRows();
  if (tabId === 'tabJudges') updateJudgeProgramDropdown();
  if (tabId === 'tabResult') updateResultProgramDropdown();
}

window.onload = function () {
  fetchCloudData();
  initCandidateRows();
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
        localStorage.setItem('MEELAD_PROGRAMS', JSON.stringify(festPrograms));
        localStorage.setItem('MEELAD_CANDIDATES', JSON.stringify(festCandidates));
        localStorage.setItem('MEELAD_RESULTS', JSON.stringify(festResults));
      }
      refreshAll();
    })
    .catch(err => { console.error("Cloud fetch error:", err); refreshAll(); });
}

function syncToCloud() {
  localStorage.setItem('MEELAD_PROGRAMS', JSON.stringify(festPrograms));
  localStorage.setItem('MEELAD_CANDIDATES', JSON.stringify(festCandidates));
  localStorage.setItem('MEELAD_RESULTS', JSON.stringify(festResults));
  refreshAll();
  var payload = { programs: festPrograms, candidates: festCandidates, results: festResults };
  fetch(CLOUD_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(res => alert(res.message || "Synchronized across all devices!"))
    .catch(err => alert("Saved locally. Background network sync will retry."));
}

function saveAllData() { syncToCloud(); }

function refreshAll() {
  renderProgramsTable();
  renderCandidatesTable();
  renderResultsAdminTable();
  buildPointTables();
  filterStudents();
  refreshCandidateRowsReg();
  renderStudentProgramMatrix();
}

/* 1. PROGRAMS */
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
  div.innerHTML = `
    <input type="text" class="prog-name-input" placeholder="Enter Program Name">
    <button type="button" onclick="this.parentElement.remove()" style="padding:0 12px; background:#ef4444; color:#fff; border:none; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>`;
  container.appendChild(div);
}

function savePrograms() {
  var type = document.getElementById('progType').value;
  var cat = (type === 'General') ? 'GENERAL' : document.getElementById('progCategory').value;
  var inputs = document.querySelectorAll('.prog-name-input');
  var added = 0;
  inputs.forEach(input => {
    var name = input.value.trim();
    if (name) {
      festPrograms.push({ id: Date.now() + Math.random(), name: name, category: cat, type: type });
      added++;
    }
  });
  if (added > 0) {
    saveAllData();
    document.getElementById('programRowsContainer').innerHTML = `
      <div class="program-input-row" style="display:flex; gap:8px; margin-bottom:8px;">
        <input type="text" class="prog-name-input" placeholder="Enter Program Name (e.g. Qira'at, Quiz, Madih, Duff)">
      </div>`;
    alert(`${added} Program(s) added successfully!`);
  } else {
    alert("Please type at least one program name.");
  }
}

function deleteProgram(id) {
  if (confirm("Delete this program?")) {
    festPrograms = festPrograms.filter(p => p.id !== id);
    saveAllData();
  }
}

function renderProgramsTable() {
  var container = document.getElementById('programsListTable');
  if (festPrograms.length === 0) {
    container.innerHTML = "<p style='font-size:13px; padding:12px; color:var(--text-muted);'>No competition programs registered yet.</p>";
    return;
  }
  var html = `<table><thead><tr><th>Type</th><th>Category Scope</th><th>Program Name</th><th>Action</th></tr></thead><tbody>`;
  html += festPrograms.map(p => `
    <tr>
      <td><b>${p.type}</b></td>
      <td><span class="badge" style="background:#e0f2fe; color:var(--navy-dark);">${p.category}</span></td>
      <td style="color:var(--navy-main); font-weight:600;">${p.name}</td>
      <td><button onclick="deleteProgram(${p.id})" style="padding:4px 8px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td>
    </tr>`).join('');
  html += `</tbody></table>`;
  container.innerHTML = html;
}

/* 2. CANDIDATES */
function getTeamCode(t) { return t === "Qahira" ? "A" : t === "Qusdiya" ? "B" : t === "Qurthuba" ? "C" : "A"; }
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
  div.innerHTML = `
    <input type="text" class="cand-row-reg" readonly style="width:130px; font-weight:700; color:var(--navy-main); background:#f8fafc; margin:0;" placeholder="Reg No">
    <input type="text" class="cand-row-name" onkeyup="refreshCandidateRowsReg()" style="flex:1; margin:0;" placeholder="Enter Member Name">
    <button type="button" onclick="removeCandidateRow(this)" style="padding:10px 14px; background:#ef4444; color:#fff; border:none; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>`;
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
    if (name) addedList.push({ id: Date.now() + Math.random(), regNo: reg, name: name, category: cat, team: team });
  });
  if (addedList.length === 0) { alert("Please enter at least one participant name."); return; }
  festCandidates = festCandidates.concat(addedList);
  saveAllData();
  document.getElementById('candidateRowsContainer').innerHTML = "";
  for (var k = 0; k < 3; k++) addCandidateRow();
  alert(`Successfully saved ${addedList.length} candidate(s) under ${team} (${cat})!`);
}

function deleteCandidate(id) {
  if (confirm("Delete this candidate?")) {
    festCandidates = festCandidates.filter(c => c.id !== id);
    saveAllData();
  }
}

function renderCandidatesTable() {
  var container = document.getElementById('candidatesListTable');
  if (!container) return;
  if (festCandidates.length === 0) {
    container.innerHTML = "<p style='font-size:13px; padding:12px; color:var(--text-muted);'>No candidates registered yet.</p>";
    return;
  }
  var html = `<table><thead><tr><th>Reg No</th><th>Candidate Name</th><th>Category</th><th>Team</th><th>Action</th></tr></thead><tbody>`;
  html += festCandidates.map(c => `
    <tr>
      <td><b style="color:var(--navy-main);">${c.regNo}</b></td>
      <td>${c.name}</td>
      <td><span class="badge" style="background:#e0f2fe; color:var(--navy-dark);">${c.category}</span></td>
      <td><span class="badge team-badge-${c.team.toLowerCase()}">${c.team}</span></td>
      <td><button onclick="deleteCandidate(${c.id})" style="padding:4px 8px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td>
    </tr>`).join('');
  html += `</tbody></table>`;
  container.innerHTML = html;
}

/* 3. PRINT TEAM LIST (entry form is in entry-form.js) */
function printTeamListPDF() {
  var teams = ["Qahira", "Qusdiya", "Qurthuba"];
  var categories = ["SENIOR", "JUNIOR", "SUB-JUNIOR"];
  var win = window.open('', '_blank');
  var bodyContent = "";

  teams.forEach(team => {
    bodyContent += `
      <div style="page-break-after:always; margin-bottom:30px;">
        <div style="text-align:center; border-bottom:2px solid #1e3a8a; padding-bottom:8px; margin-bottom:15px;">
          <h2 style="margin:0; font-size:24px; color:#0f172a;">MMO Arts Fest 2k26</h2>
          <h3 style="margin:4px 0 0 0; color:#0284c7; text-transform:uppercase;">OFFICIAL TEAM ROSTER: ${team.toUpperCase()}</h3>
        </div>`;
    categories.forEach(cat => {
      var members = festCandidates.filter(c => c.team === team && c.category === cat);
      bodyContent += `
        <h4 style="background:#f1f5f9; padding:6px 10px; margin:12px 0 6px 0; border-left:4px solid #1e3a8a;">${cat} CATEGORY</h4>
        <table style="width:100%; border-collapse:collapse; margin-bottom:15px;">
          <thead><tr style="background:#f8fafc;">
            <th style="border:1px solid #cbd5e1; padding:6px; width:10%;">Sl No</th>
            <th style="border:1px solid #cbd5e1; padding:6px; width:25%;">Reg No</th>
            <th style="border:1px solid #cbd5e1; padding:6px; width:65%;">Candidate Name</th>
          </tr></thead>
          <tbody>
            ${members.length > 0 ? members.map((m, idx) => `
              <tr>
                <td style="border:1px solid #cbd5e1; padding:6px; text-align:center;">${idx + 1}</td>
                <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">${m.regNo}</td>
                <td style="border:1px solid #cbd5e1; padding:6px;">${m.name}</td>
              </tr>`).join('') : `<tr><td colspan="3" style="border:1px solid #cbd5e1; padding:6px; text-align:center; color:#94a3b8;">No participants registered</td></tr>`}
          </tbody>
        </table>`;
    });
    bodyContent += `
        <div style="display:flex; justify-content:space-between; margin-top:30px; font-weight:bold; font-size:12px;">
          <div>Team Leader Sign: _________________</div>
          <div>Convener Sign: _________________</div>
        </div>
      </div>`;
  });

  var html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Official Team Lists - MMO Arts Fest 2k26</title>
    <style>
      @page { size: A4 portrait; margin: 12mm; }
      * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
      body { background: #fff; color: #0f172a; margin: 0; padding: 0; }
    </style></head><body>${bodyContent}<script>window.print();<\/script></body></html>`;
  win.document.write(html);
  win.document.close();
}

/* 4. JUDGES SLIP */
function updateJudgeProgramDropdown() {
  var cat = document.getElementById('judgeCatSelect').value;
  var select = document.getElementById('judgeItemSelect');
  var progs = (cat === 'GENERAL') ? festPrograms.filter(p => p.type === 'General' || p.category === 'GENERAL') : festPrograms.filter(p => p.category === cat);
  select.innerHTML = progs.length === 0
    ? `<option value="">No programs registered in ${cat}</option>`
    : progs.map(p => `<option value="${p.name}">${p.name} (${p.type})</option>`).join('');
}

function printJudgesSlip() {
  var cat = document.getElementById('judgeCatSelect').value;
  var item = document.getElementById('judgeItemSelect').value || "________________";
  var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  var win = window.open('', '_blank');
  var html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Judges Evaluation Slip - MMO Arts Fest 2k26</title>
    <link href="https://fonts.googleapis.com/css2?family=Anek+Malayalam:wght@700&family=Cinzel:wght@700&family=Gayathri:wght@700&display=swap" rel="stylesheet">
    <style>
      @font-face { font-family: 'CustomFestFont'; src: url('custom-font.ttf') format('truetype'), url('ML-TTRavivarma.ttf') format('truetype'); font-weight: bold; font-style: normal; }
      @page { size: A4 portrait; margin: 10mm; }
      * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
      body { background: #fff; color: #0f172a; margin: 0; padding: 0; }
      .slip-card { width: 100%; min-height: 270mm; border: 3px double #1e3a8a; border-radius: 8px; padding: 15mm 12mm; display: flex; flex-direction: column; justify-content: space-between; }
      .header-banner { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 15px; }
      .title-malayalam { font-family: 'Cinzel', serif; font-size: 28px; font-weight: 800; }
      .title-sub { font-family: 'Cinzel', serif; font-size: 17px; font-weight: 700; color: #1e3a8a; letter-spacing: 2px; text-transform: uppercase; }
      .title-desc { font-size: 12px; color: #059669; margin-top: 2px; font-weight: 700; }
      .meta-grid { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; font-weight: 600; }
      .meta-box { border: 1.5px solid #1e3a8a; padding: 8px 12px; border-radius: 6px; width: 48%; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1.5px solid #1e3a8a; padding: 10px 8px; text-align: center; font-size: 14px; }
      th { background: #f8fafc; color: #1e3a8a; font-weight: 700; text-transform: uppercase; }
      td.code-cell { font-size: 16px; font-weight: 800; background: #fafafa; }
      .signature-area { display: flex; justify-content: space-between; margin-top: 30px; font-size: 13px; font-weight: 700; color: #1e3a8a; }
    </style></head><body>
      <div class="slip-card">
        <div>
          <div class="header-banner">
            <div class="title-malayalam">MMO Arts Fest</div>
            <div class="title-sub">Campus Arts Festival 2k26</div>
            <div class="title-desc">OFFICIAL JUDGES EVALUATION SLIP</div>
          </div>
          <div class="meta-grid">
            <div class="meta-box"><b>CATEGORY / SCOPE:</b> ${cat}</div>
            <div class="meta-box"><b>ITEM:</b> ${item}</div>
          </div>
          <table>
            <thead><tr><th style="width:25%;">Code Letter</th><th style="width:35%;">Mark / Score</th><th style="width:40%;">Remark</th></tr></thead>
            <tbody>${letters.map(l => `<tr><td class="code-cell">${l}</td><td></td><td></td></tr>`).join('')}</tbody>
          </table>
        </div>
        <div class="signature-area">
          <div>Judge Name: __________________________</div>
          <div>Judge Signature: __________________________</div>
        </div>
      </div>
      <script>window.print();<\/script></body></html>`;
  win.document.write(html);
  win.document.close();
}

/* 5. RESULTS */
function updateResultProgramDropdown() {
  var cat = document.getElementById('resCategory').value;
  var select = document.getElementById('resItemSelect');
  var progs = (cat === 'GENERAL') ? festPrograms.filter(p => p.type === 'General' || p.category === 'GENERAL') : festPrograms.filter(p => p.category === cat);
  select.innerHTML = progs.map(p => `<option value="${p.name}">${p.name} (${p.type})</option>`).join('');
  updateResultCandidateDropdown();
}

function updateResultCandidateDropdown() {
  var cat = document.getElementById('resCategory').value;
  var select = document.getElementById('resCandidateSelect');
  if (cat === 'GENERAL') {
    select.innerHTML = `
      <option value="TEAM|Qahira (Team A)|Qahira">Team Qahira (All Categories)</option>
      <option value="TEAM|Qusdiya (Team B)|Qusdiya">Team Qusdiya (All Categories)</option>
      <option value="TEAM|Qurthuba (Team C)|Qurthuba">Team Qurthuba (All Categories)</option>`;
  } else {
    var cands = festCandidates.filter(c => c.category === cat);
    select.innerHTML = cands.length === 0
      ? `<option value="">No candidate registered in ${cat}</option>`
      : cands.map(c => `<option value="${c.regNo}|${c.name}|${c.team}">#${c.regNo} - ${c.name} (${c.team})</option>`).join('');
  }
}

function saveResultEntry() {
  var cat = document.getElementById('resCategory').value;
  var program = document.getElementById('resItemSelect').value;
  var candVal = document.getElementById('resCandidateSelect').value;
  var mark = Number(document.getElementById('resMark').value) || 0;
  var grade = document.getElementById('resGrade').value.trim();
  var place = document.getElementById('resPlace').value;
  var published = document.getElementById('resPublished').value;
  if (!program || !candVal) { alert("Please ensure competition items and candidates are selected."); return; }
  var parts = candVal.split('|');
  festResults.push({ id: Date.now(), regNo: parts[0], name: parts[1], team: parts[2], category: cat, program: program, mark: mark, grade: grade, place: place, published: published });
  saveAllData();
  alert("Result saved successfully!");
}

function deleteResult(id) {
  if (confirm("Delete this result entry?")) {
    festResults = festResults.filter(r => r.id !== id);
    saveAllData();
  }
}

function renderResultsAdminTable() {
  var container = document.getElementById('resultsAdminTable');
  if (festResults.length === 0) {
    container.innerHTML = "<p style='font-size:13px; padding:12px; color:var(--text-muted);'>No results evaluated yet.</p>";
    return;
  }
  var html = `<table><thead><tr><th>Candidate / Squad</th><th>Category</th><th>Item</th><th>Mark</th><th>Place</th><th>Poster</th><th>Action</th></tr></thead><tbody>`;
  html += festResults.map(r => `
    <tr>
      <td><b>${r.name}</b> <span class="badge team-badge-${r.team.toLowerCase()}">${r.team}</span></td>
      <td><span class="badge" style="background:#e0f2fe; color:var(--navy-dark);">${r.category}</span></td>
      <td>${r.program}</td>
      <td style="color:var(--navy-main); font-weight:bold;">${r.mark}</td>
      <td><b style="color:var(--emerald-main);">${r.place}</b></td>
      <td><button onclick="openPosterStudioWithData('${encodeURIComponent(r.name)}', '${encodeURIComponent(r.team)}', '${encodeURIComponent(r.category)}', '${encodeURIComponent(r.program)}', '${encodeURIComponent(r.place || 'WINNER')}')" style="padding:6px 12px; background:var(--navy-main); color:#fff; font-weight:600; border:none; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-wand-magic-sparkles"></i> Poster</button></td>
      <td><button onclick="deleteResult(${r.id})" style="padding:5px 10px; background:#ef4444; color:#fff; border:none; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td>
    </tr>`).join('');
  html += `</tbody></table>`;
  container.innerHTML = html;
}

/* 6. POSTER STUDIO */
function openPosterStudioWithData(nameEnc, teamEnc, catEnc, progEnc, posEnc) {
  document.getElementById('pmCandidateName').value = decodeURIComponent(nameEnc);
  document.getElementById('pmTeam').value = decodeURIComponent(teamEnc);
  document.getElementById('pmCategory').value = decodeURIComponent(catEnc);
  document.getElementById('pmProgram').value = decodeURIComponent(progEnc);
  var pos = decodeURIComponent(posEnc);
  var sel = document.getElementById('pmPosition');
  if (pos.includes('2')) sel.value = 'SECOND PLACE';
  else if (pos.includes('3')) sel.value = 'THIRD PLACE';
  else sel.value = 'FIRST PLACE';
  document.getElementById('posterStudioModal').style.display = 'flex';
  drawPosterPreview();
}

function closePosterStudio() { document.getElementById('posterStudioModal').style.display = 'none'; }

function setPosterModel(n) {
  selectedPosterModel = n;
  document.querySelectorAll('.model-btn').forEach((btn, idx) => btn.classList.toggle('active', (idx + 1) === n));
  drawPosterPreview();
}

function drawPosterPreview() {
  var canvas = document.getElementById('posterCanvas');
  var ctx = canvas.getContext('2d');
  var name = document.getElementById('pmCandidateName').value || "Candidate Name";
  var team = document.getElementById('pmTeam').value || "Qahira";
  var cat = document.getElementById('pmCategory').value || "Senior";
  var prog = document.getElementById('pmProgram').value || "Competition Program";
  var pos = document.getElementById('pmPosition').value || "FIRST PLACE";
  var subHeader = document.getElementById('pmSubHeader').value || "Campus Arts Festival 2k26 • MMO";
  var greeting = document.getElementById('pmGreeting').value || "MUBARAK! HEARTY CONGRATULATIONS";

  var bgImg = new Image();
  bgImg.src = customTemplateImages[selectedPosterModel];
  bgImg.onload = function () {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    renderPosterTypography(ctx, canvas, name, team, cat, prog, pos, subHeader, greeting);
  };
  bgImg.onerror = function () {
    renderBuiltInModelGraphic(ctx, canvas, selectedPosterModel, name, team, cat, prog, pos, subHeader, greeting);
  };
}

function renderBuiltInModelGraphic(ctx, canvas, model, name, team, cat, prog, pos, subHeader, greeting) {
  var w = canvas.width, h = canvas.height, grad;
  if (model === 1) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a192f'); grad.addColorStop(0.5, '#1e3a8a'); grad.addColorStop(1, '#020c1b');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 10; ctx.strokeRect(50, 50, w - 100, h - 100);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'; ctx.lineWidth = 2; ctx.strokeRect(65, 65, w - 130, h - 130);
  } else if (model === 2) {
    grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#022c22'); grad.addColorStop(0.5, '#065f46'); grad.addColorStop(1, '#047857');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#34d399'; ctx.lineWidth = 8; ctx.strokeRect(50, 50, w - 100, h - 100);
  } else if (model === 3) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#450a0a'); grad.addColorStop(0.5, '#7f1d1d'); grad.addColorStop(1, '#1c0505');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 8; ctx.strokeRect(50, 50, w - 100, h - 100);
  } else if (model === 4) {
    grad = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, 700);
    grad.addColorStop(0, '#0f172a'); grad.addColorStop(0.6, '#0284c7'); grad.addColorStop(1, '#031b33');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 6; ctx.strokeRect(50, 50, w - 100, h - 100);
  } else {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1c1917'); grad.addColorStop(0.45, '#451a03'); grad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 14; ctx.strokeRect(40, 40, w - 80, h - 80);
    ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 4; ctx.strokeRect(60, 60, w - 120, h - 120);
  }
  renderPosterTypography(ctx, canvas, name, team, cat, prog, pos, subHeader, greeting);
}

function renderPosterTypography(ctx, canvas, name, team, cat, prog, pos, subHeader, greeting) {
  var w = canvas.width;
  ctx.textAlign = 'center';

  ctx.fillStyle = '#ffffff';
  ctx.font = "700 72px 'Cinzel', serif";
  ctx.fillText("MMO ARTS FEST", w / 2, 190);

  ctx.fillStyle = '#38bdf8';
  ctx.font = "700 24px 'Cinzel', serif";
  ctx.letterSpacing = "4px";
  ctx.fillText(subHeader.toUpperCase(), w / 2, 240);

  ctx.fillStyle = '#f59e0b';
  ctx.font = "700 26px 'Poppins', sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText(greeting, w / 2, 360);

  var pillW = 560, pillH = 76, pillX = (w - pillW) / 2, pillY = 410;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, 38); ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = "800 36px 'Poppins', sans-serif";
  ctx.fillText("★  " + pos.toUpperCase() + "  ★", w / 2, pillY + 52);

  ctx.fillStyle = '#ffffff';
  ctx.font = name.length > 18 ? "800 52px 'Poppins', sans-serif" : "800 70px 'Poppins', sans-serif";
  ctx.fillText(name, w / 2, 620);

  ctx.fillStyle = '#fcd34d';
  ctx.font = "700 34px 'Poppins', sans-serif";
  ctx.fillText("TEAM " + team.toUpperCase() + " (" + cat.toUpperCase() + ")", w / 2, 690);

  var boxW = 860, boxH = 170, boxX = (w - boxW) / 2, boxY = 790;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 16); ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = "600 22px 'Poppins', sans-serif";
  ctx.fillText("COMPETITION ITEM", w / 2, boxY + 55);

  ctx.fillStyle = '#ffffff';
  ctx.font = "800 44px 'Poppins', sans-serif";
  ctx.fillText(prog, w / 2, boxY + 120);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = "500 22px 'Poppins', sans-serif";
  ctx.fillText("MMO Orphanage • Fest Organizing Committee", w / 2, 1160);

  ctx.fillStyle = '#64748b';
  ctx.font = "500 17px 'Poppins', sans-serif";
  ctx.fillText("Official Result Publication", w / 2, 1200);
}

function downloadPosterImage() {
  var canvas = document.getElementById('posterCanvas');
  var name = document.getElementById('pmCandidateName').value.trim() || 'Winner';
  var prog = document.getElementById('pmProgram').value.trim() || 'Result';
  var link = document.createElement('a');
  link.download = `MMOArtsFest_${name.replace(/\s+/g, '_')}_${prog.replace(/\s+/g, '_')}_Poster.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

/* 7. POINT TABLE */
function addManualCategoryScore() {
  var cat = document.getElementById('ptCategory').value;
  var team = document.getElementById('ptTeam').value;
  var reason = document.getElementById('ptReason').value.trim() || "Manual Mark";
  var marks = Number(document.getElementById('ptMarks').value) || 0;
  festResults.push({ id: Date.now(), regNo: '-', name: reason, team: team, category: cat, program: reason, mark: marks, grade: '-', place: '-', published: 'YES' });
  saveAllData();
  document.getElementById('ptReason').value = "";
  document.getElementById('ptMarks').value = "";
}

function buildPointTables() {
  var teams = ["Qurthuba", "Qusdiya", "Qahira"];
  var teamScores = { "Qurthuba": 0, "Qusdiya": 0, "Qahira": 0 };
  var categories = ["SENIOR", "JUNIOR", "SUB-JUNIOR", "GENERAL"];
  var catScores = {};
  categories.forEach(c => { catScores[c] = { "Qurthuba": 0, "Qusdiya": 0, "Qahira": 0 }; });

  festResults.forEach(r => {
    var m = Number(r.mark || 0);
    if (teamScores[r.team] !== undefined) teamScores[r.team] += m;
    if (catScores[r.category] && catScores[r.category][r.team] !== undefined) catScores[r.category][r.team] += m;
  });

  var sortedTeams = teams.map(t => ({ team: t, score: teamScores[t] })).sort((a, b) => b.score - a.score);
  var overallHtml = `
    <table>
      <thead><tr><th>Rank</th><th>Team</th><th>Total Score</th></tr></thead>
      <tbody>${sortedTeams.map((s, idx) => `
        <tr>
          <td><b style="color:var(--navy-main); font-size:15px;">#${idx + 1}</b></td>
          <td><span class="badge team-badge-${s.team.toLowerCase()}">${s.team}</span></td>
          <td style="font-weight:800; font-size:16px; color:var(--emerald-main);">${s.score} pts</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  document.getElementById('teamPointsTable').innerHTML = overallHtml;
  document.getElementById('adminPointTablePreview').innerHTML = overallHtml;

  document.getElementById('categoryBreakdownTables').innerHTML = categories.map(cat => `
    <div style="margin-bottom:16px;">
      <h4 style="color:var(--navy-main); font-size:13px; margin-bottom:6px; letter-spacing:0.5px;">${cat} STANDINGS</h4>
      <table>
        <thead><tr><th>Team</th><th>Score</th></tr></thead>
        <tbody>${teams.map(t => `
          <tr>
            <td><span class="badge team-badge-${t.toLowerCase()}">${t}</span></td>
            <td style="font-weight:700; color:var(--navy-dark); font-size:15px;">${catScores[cat][t]} pts</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');

  buildCarousel(catScores, sortedTeams);

  liveAnnouncedResults = festResults.filter(r => r.place && r.place !== '-' && r.published === 'YES').map(r => ({
    program: r.program, category: r.category, winner: r.name + ' (' + r.team + ') - ' + r.place, rawObj: r
  }));
  rotateAnnouncedResult();
}

function buildCarousel(catScores, sortedTeams) {
  carouselSlides = [];
  ["SENIOR", "JUNIOR", "SUB-JUNIOR", "GENERAL"].forEach(cat => {
    var html = `
      <div style="background:var(--bg-white); padding:16px; border-radius:12px; margin-bottom:12px; border:1px solid var(--border-color); border-left:5px solid var(--emerald-main);">
        <div style="font-size:18px; color:var(--navy-dark); font-weight:bold;">🏆 ${cat} STANDINGS</div>
      </div>
      <div class="table-responsive">
        <table>
          <thead><tr><th>Team</th><th>Current Score</th></tr></thead>
          <tbody>
            <tr><td><span class="badge team-badge-qurthuba">Qurthuba (Red)</span></td><td><b style="color:#b91c1c; font-size:15px;">${catScores[cat]["Qurthuba"]} pts</b></td></tr>
            <tr><td><span class="badge team-badge-qusdiya">Qusdiya (Green)</span></td><td><b style="color:#047857; font-size:15px;">${catScores[cat]["Qusdiya"]} pts</b></td></tr>
            <tr><td><span class="badge team-badge-qahira">Qahira (Blue)</span></td><td><b style="color:#0369a1; font-size:15px;">${catScores[cat]["Qahira"]} pts</b></td></tr>
          </tbody>
        </table>
      </div>`;
    carouselSlides.push({ title: `${cat} STANDINGS`, content: html });
  });
  renderCurrentSlide();
  if (!timerInterval) startCarousel();
}

function startCarousel() {
  if (timerInterval) clearInterval(timerInterval);
  countdown = 30;
  timerInterval = setInterval(function () {
    countdown--;
    document.getElementById('rotatorTimerBadge').innerHTML = `<span class="live-pulse"></span> Auto-Sync: ${countdown}s`;
    if (countdown <= 0) {
      countdown = 30;
      currentSlideIndex = (currentSlideIndex + 1) % carouselSlides.length;
      renderCurrentSlide();
    }
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
  document.getElementById('quoteDisplay').innerHTML = `<div class="quote-text">"${q.text}"</div><div class="quote-translation"><b>തർജ്ജമ:</b> ${q.translation}</div>`;
}

function rotateAnnouncedResult() {
  if (!liveAnnouncedResults || liveAnnouncedResults.length === 0) {
    document.getElementById('announcedDisplay').innerHTML = `<div class="result-program" style="font-size:13px; font-weight:normal; color:var(--text-muted);">No results announced yet.</div>`;
    return;
  }
  if (resultIndex >= liveAnnouncedResults.length) resultIndex = 0;
  var res = liveAnnouncedResults[resultIndex];
  var rObj = res.rawObj || {};
  document.getElementById('announcedDisplay').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div>
        <div class="result-program"><i class="fa-solid fa-award"></i> ${res.program}</div>
        <div class="result-cat">Category: <b>${res.category}</b></div>
        <div class="result-winner">🥇 Winner: <b>${res.winner}</b></div>
      </div>
      <button onclick="openPosterStudioWithData('${encodeURIComponent(rObj.name || '')}', '${encodeURIComponent(rObj.team || '')}', '${encodeURIComponent(rObj.category || '')}', '${encodeURIComponent(rObj.program || '')}', '${encodeURIComponent(rObj.place || '')}')" style="background:#e0f2fe; color:var(--navy-main); font-weight:700; border:1px solid #bae6fd; border-radius:6px; padding:6px 12px; font-size:12px; cursor:pointer;"><i class="fa-solid fa-wand-magic-sparkles"></i> Poster</button>
    </div>`;
  resultIndex = (resultIndex + 1) % liveAnnouncedResults.length;
}

/* 8. STUDENT x PROGRAM MATRIX */
function renderStudentProgramMatrix() {
  var container = document.getElementById('studentProgramMatrixContainer');
  if (!container) return;
  var filterCat = document.getElementById('matrixCatFilter') ? document.getElementById('matrixCatFilter').value : 'ALL';
  var candidates = festCandidates.slice();
  if (filterCat !== 'ALL') candidates = candidates.filter(c => c.category === filterCat);

  var programList = [];
  festPrograms.forEach(p => { if (!programList.includes(p.name)) programList.push(p.name); });
  festResults.forEach(r => { if (r.program && !programList.includes(r.program)) programList.push(r.program); });

  if (candidates.length === 0) {
    container.innerHTML = "<p style='font-size:13px; padding:16px; text-align:center; color:var(--text-muted);'>No candidates available to display in matrix.</p>";
    return;
  }
  if (programList.length === 0) {
    container.innerHTML = "<p style='font-size:13px; padding:16px; text-align:center; color:var(--text-muted);'>No programs registered yet.</p>";
    return;
  }

  var resultMap = {};
  festResults.forEach(r => {
    if (r.published === 'YES' || r.published === undefined) {
      var key = (r.regNo || '').trim().toUpperCase() + '___' + (r.program || '').trim().toUpperCase();
      resultMap[key] = { mark: r.mark, place: r.place, grade: r.grade };
    }
  });

  var html = `<table class="matrix-table"><thead><tr>
    <th class="sticky-col" style="min-width:180px; text-align:left;">Student Name</th>
    <th style="min-width:100px;">Reg No</th>
    <th style="min-width:90px;">Category</th>
    <th style="min-width:100px;">Team</th>
    ${programList.map(prog => `<th style="min-width:110px; font-size:11px;">${prog}</th>`).join('')}
    <th style="min-width:80px; background:#e0f2fe; color:var(--navy-main);">Total</th>
  </tr></thead><tbody>`;

  candidates.forEach(cand => {
    var total = 0, cells = "";
    programList.forEach(prog => {
      var key = (cand.regNo || '').trim().toUpperCase() + '___' + prog.trim().toUpperCase();
      var res = resultMap[key];
      if (res !== undefined) {
        total += Number(res.mark || 0);
        var placeBadge = (res.place && res.place !== '-') ? `<span style="font-size:10px; color:var(--emerald-main); font-weight:bold; display:block;">${res.place}</span>` : '';
        cells += `<td style="font-weight:700; color:var(--navy-main);"><span style="font-size:13.5px;">${res.mark}</span>${placeBadge}</td>`;
      } else {
        cells += `<td style="color:#cbd5e1;">-</td>`;
      }
    });
    html += `<tr>
      <td class="sticky-col"><b style="color:var(--navy-dark);">${cand.name}</b></td>
      <td><code style="font-weight:bold; font-size:12px; color:var(--navy-main);">${cand.regNo}</code></td>
      <td><span class="badge" style="background:#f1f5f9; color:var(--text-dark);">${cand.category}</span></td>
      <td><span class="badge team-badge-${cand.team.toLowerCase()}">${cand.team}</span></td>
      ${cells}
      <td style="font-weight:800; color:var(--emerald-main); background:#f0fdf4;">${total}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

/* 9. AUTH */
function authOfficial() {
  let u = document.getElementById('officialUser').value.trim();
  let p = document.getElementById('officialPass').value.trim();
  if (u === "ADMIN" && p === "*mmo#1956") {
    document.getElementById('officialLoginErr').innerText = "";
    document.getElementById('officialAuth').style.display = "none";
    document.getElementById('officialContent').style.display = "block";
    refreshAll();
  } else {
    document.getElementById('officialLoginErr').innerText = "Access Denied: Invalid Admin Credentials.";
  }
}

function logoutOfficial() {
  document.getElementById('officialAuth').style.display = "block";
  document.getElementById('officialContent').style.display = "none";
}

/* 10. LOOKUP */
function lookupResult() {
  let reg = document.getElementById('studentRegNo').value.trim();
  let box = document.getElementById('studentResultBox');
  if (!reg) return;
  let res = festResults.filter(r => String(r.regNo).toLowerCase() === reg.toLowerCase());
  if (res.length > 0) {
    box.innerHTML = res.map(r => `
      <div style="padding:14px; border:1px solid var(--border-color); background:#f8fafc; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <b>${r.name}</b> <span class="badge team-badge-${(r.team || '').toLowerCase()}">${r.team}</span><br>
          <span style="color:var(--text-muted); font-size:12.5px;">Item: <b>${r.program}</b> (${r.category})</span> | Mark: <b style="color:var(--navy-main);">${r.mark}</b> | Place: <b style="color:var(--emerald-main);">${r.place || '-'}</b>
        </div>
        <button onclick="openPosterStudioWithData('${encodeURIComponent(r.name)}', '${encodeURIComponent(r.team)}', '${encodeURIComponent(r.category)}', '${encodeURIComponent(r.program)}', '${encodeURIComponent(r.place || 'WINNER')}')" style="background:var(--navy-main); color:#fff; font-size:12.5px; font-weight:600; padding:6px 12px; border:none; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-wand-magic-sparkles"></i> Poster</button>
      </div>`).join('');
  } else {
    box.innerHTML = `<p style="color:#ef4444; font-size:13px; padding:6px 0;">No scores found for Reg No: ${reg}</p>`;
  }
}

/* 11. DIRECTORY FILTER */
function filterStudents() {
  let regQuery = (document.getElementById('searchReg') ? document.getElementById('searchReg').value : '').toLowerCase().trim();
  let nameQuery = (document.getElementById('searchName') ? document.getElementById('searchName').value : '').toLowerCase().trim();
  let catQuery = (document.getElementById('searchCategory') ? document.getElementById('searchCategory').value : '').toUpperCase().trim();
  let teamQuery = (document.getElementById('searchTeam') ? document.getElementById('searchTeam').value : '').trim();

  let list = festCandidates.filter(s =>
    (!regQuery || String(s.regNo).toLowerCase().includes(regQuery)) &&
    (!nameQuery || String(s.name).toLowerCase().includes(nameQuery)) &&
    (!catQuery || String(s.category).toUpperCase() === catQuery) &&
    (!teamQuery || s.team === teamQuery));

  let container = document.getElementById('teamMembersTable');
  if (!container) return;
  if (list.length === 0) {
    container.innerHTML = "<p style='font-size:13px; padding:12px; color:var(--text-muted);'>No matching candidates found.</p>";
    return;
  }
  let html = '<table><thead><tr><th>Reg No</th><th>Name</th><th>Category</th><th>Team</th></tr></thead><tbody>';
  html += list.map(m => `<tr><td><b style="color:var(--navy-main);">${m.regNo}</b></td><td>${m.name}</td><td>${m.category}</td><td><span class="badge team-badge-${m.team.toLowerCase()}">${m.team}</span></td></tr>`).join('');
  html += '</tbody></table>';
  container.innerHTML = html;
}
