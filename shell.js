/* KADHARVA Campus Arts Fest 2K26 — site shell
   Rail navigation, top bar, page titles, admin privacy, public Live Results, and the extra admin sections
   (Toppers review, Poster Studio, Settings & Backup). Does not touch login credentials or stored data. */

var PAGE_TITLES = { dashboardView: 'Festival Dashboard', programListView: 'Programs', scheduleView: 'Schedule', resultsView: 'Live Results', pointTableView: 'Point Table',
  toppersView: 'Toppers', teamView: 'Candidates', notificationsView: 'Notifications', officialView: 'Official Portal' };

/* ---------- rail / drawer ---------- */
openNav = function () { var s = document.getElementById('sideNav'), o = document.getElementById('drawerOverlay'); if (s) s.classList.add('open'); if (o) o.style.display = 'block'; };
closeNav = function () { var s = document.getElementById('sideNav'), o = document.getElementById('drawerOverlay'); if (s) s.classList.remove('open'); if (o) o.style.display = 'none'; };

var _showViewShell = showView;
showView = function (id) {
  _showViewShell.apply(this, arguments);
  closeNav();
  Array.prototype.forEach.call(document.querySelectorAll('#sideNav a[data-v]'), function (a) { a.classList.toggle('on', a.getAttribute('data-v') === id); });
  var t = document.getElementById('tbTitle'); if (t) t.textContent = PAGE_TITLES[id] || '';
  window.scrollTo(0, 0);
  if (id === 'officialView' && !(typeof adminLoggedIn === 'function' && adminLoggedIn())) {
    showToast('Official Portal', 'Please enter your login credentials to continue.', 'warn');
    setTimeout(function () { var u = document.getElementById('officialUser'); if (u) u.focus(); }, 300);
  }
};

/* ---------- admin privacy: official tools only show after the existing admin login ---------- */
function syncAdminUI() {
  var on = typeof adminLoggedIn === 'function' && adminLoggedIn();
  document.body.classList.toggle('is-admin', !!on);
  var b = document.getElementById('tbAdmin'); if (b) b.innerHTML = on ? '<i class="fa-solid fa-user-shield"></i> Admin Dashboard' : '<i class="fa-solid fa-user-shield"></i> Official Portal';
  var lo = document.getElementById('tbLogout'); if (lo) lo.style.display = on ? 'inline-flex' : 'none';
}
var _authShell = authOfficial;
authOfficial = function () { _authShell.apply(this, arguments); syncAdminUI(); };
var _logoutShell = logoutOfficial;
logoutOfficial = function () { _logoutShell.apply(this, arguments); syncAdminUI(); showView('dashboardView'); };

/* official actions refuse to run for visitors who are not logged in */
['openPosterStudioWithData', 'printEntryFormPDF', 'printTeamListPDF', 'openPrintCenter', 'printAllData'].forEach(function (n) {
  var f = window[n]; if (typeof f !== 'function') return;
  window[n] = function () {
    if (!(typeof adminLoggedIn === 'function' && adminLoggedIn())) { alert('This is an official tool. Please log in to the Official Portal first.'); return; }
    return f.apply(this, arguments);
  };
});

/* ---------- logos (trim transparent margins so any PNG size works) ---------- */
(function brandLogos() {
  var set = function (cls, file) {
    kdTrimSafe(file, function (u) {
      Array.prototype.forEach.call(document.querySelectorAll(cls), function (img) {
        if (u) img.src = u; else { img.style.display = 'none'; var fb = img.nextElementSibling; if (fb && fb.classList.contains('logo-fb')) fb.style.display = 'block'; }
      });
    });
  };
  set('.js-logo-name', FEST_NAME_IMG); set('.js-logo-sub', FEST_SUB_IMG);
})();
function kdTrimSafe(f, cb) { if (typeof kdTrim === 'function') kdTrim(f, cb); else cb(f); }

/* ---------- public Live Results ---------- */
function renderPublicResults() {
  var box = document.getElementById('liveResultsBox'); if (!box) return;
  var cat = (document.getElementById('lrCat') || {}).value || '', team = (document.getElementById('lrTeam') || {}).value || '';
  var rk = { '1st': 1, '2nd': 2, '3rd': 3 }, med = { '1st': '🥇', '2nd': '🥈', '3rd': '🥉' };
  var list = realResults().filter(function (r) { return isPub(r) && ((r.place && r.place !== '-') || r.grade) && (!cat || r.category === cat) && (!team || r.team === team); });
  var groups = {}; list.forEach(function (r) { (groups[groupKey(r)] = groups[groupKey(r)] || []).push(r); });
  var keys = Object.keys(groups).sort();
  box.innerHTML = !keys.length ? '<div class="rot-empty">No results have been published yet. Results appear here as soon as they are announced.</div>' :
    keys.map(function (k) {
      var g = groups[k].sort(function (a, b) { return (rk[a.place] || 9) - (rk[b.place] || 9) || Number(b.mark) - Number(a.mark); });
      return '<div class="lr-card"><h4>' + esc(g[0].program) + ' <small>' + esc(g[0].category) + '</small></h4>' + g.map(function (r) {
        return '<div class="lr-row"><span class="rk">' + (med[r.place] || '•') + '</span><span class="nm">' + esc(r.name) + ' <span class="badge team-badge-' + String(r.team).toLowerCase() + '">' + esc(r.team) + '</span></span>' +
          (r.grade ? '<span class="gr-chip">Grade ' + esc(r.grade) + '</span>' : '') + '<span class="mk">' + r.mark + '</span></div>';
      }).join('') + '</div>';
    }).join('');
}

/* ---------- extra admin sections ---------- */
function renderAdminToppers() {
  var box = document.getElementById('adminToppersBox'); if (!box) return;
  var f = (document.getElementById('adminTopFilter') || {}).value || '';
  box.innerHTML = toppersHtml(f);
}
function renderPosterWinners() {
  var box = document.getElementById('posterWinners'); if (!box) return;
  var list = realResults().filter(function (r) { return isPub(r) && r.place && r.place !== '-'; })
    .sort(function (a, b) { return String(b.pubAt || '').localeCompare(String(a.pubAt || '')) || (b.id - a.id); }).slice(0, 10);
  box.innerHTML = !list.length ? '<div class="rot-empty">Published winners will be listed here so you can make their posters quickly.</div>' :
    '<table><thead><tr><th>Winner</th><th>Item</th><th>Rank</th><th></th></tr></thead><tbody>' + list.map(function (r) {
      return '<tr><td><b>' + esc(r.name) + '</b> <span class="badge team-badge-' + String(r.team).toLowerCase() + '">' + esc(r.team) + '</span></td><td>' + esc(r.program) + ' <small>(' + esc(r.category) + ')</small></td><td>' + esc(r.place) + '</td>' +
        '<td><button class="btn" style="width:auto;padding:6px 14px;margin:0;" onclick="openPosterStudioWithData(\'' + enc(r.name) + '\',\'' + enc(r.team) + '\',\'' + enc(r.category) + '\',\'' + enc(r.program) + '\',\'' + enc(r.place) + '\')"><i class="fa-solid fa-wand-magic-sparkles"></i> Poster</button></td></tr>';
    }).join('') + '</tbody></table>';
}
function renderSettingsInfo() {
  var e = document.getElementById('settingsInfo'); if (!e) return;
  var n = ovNumbers();
  e.innerHTML = '<div class="ov-stats"><div class="ov-stat"><b>' + n.programs + '</b><span>Programs</span></div><div class="ov-stat"><b>' + n.candidates + '</b><span>Candidates</span></div><div class="ov-stat"><b>' + n.entries + '</b><span>Entries</span></div><div class="ov-stat"><b>' + festResults.length + '</b><span>Result records</span></div><div class="ov-stat"><b>' + festSchedule.length + '</b><span>Schedule items</span></div></div>' +
    '<div class="tab-note">' + syncText() + '</div>';
}
function reloadFromCloud() {
  if (typeof entriesDirty !== 'undefined' && entriesDirty && !confirm('You have unsaved entry changes. Reloading from the cloud will discard them. Continue?')) return;
  entriesDirty = false; fetchCloudData(); alert('Reloading the latest data from the cloud…');
}
function openPosterBlank() { openPosterStudioWithData('', 'Qahira', 'Senior', '', '1st'); }

/* ---------- section headings for the new admin sections + quick navigation ---------- */
SEC.tabToppers = { t: 'Toppers', d: 'Top scorers per category, taken from published results.', c: '', i: 'fa-crown', s: function () { return ''; } };
SEC.tabPoster = { t: 'Poster Studio', d: 'Winner posters with your own PNG design, photo, item and rank.', c: '', i: 'fa-wand-magic-sparkles', s: function () { return ''; } };
SEC.tabSettings = { t: 'Settings & Backup', d: 'Cloud sync, data counts, export and backup tools.', c: '', i: 'fa-gear', s: function () { return ''; } };


/* ---------- admin: main menu first, each feature opens on its own ---------- */
var ADMIN_TILES = [
  ['festControl', 'fa-gauge-high', 'Fest Control', 'Overview, leaderboard, pending work and quick actions', function () { return ovNumbers().programs + ' programs'; }],
  ['tabPrograms', 'fa-list-check', 'Programs', 'Add, edit and organise competition items', function () { return festPrograms.length + ' programs'; }],
  ['tabCandidates', 'fa-users', 'Candidates', 'Register, edit and search candidates', function () { return festCandidates.length + ' candidates'; }],
  ['tabEntries', 'fa-square-check', 'Entries', 'Tick the programs each candidate takes part in', function () { return ovNumbers().entries + ' entries'; }],
  ['tabSchedule', 'fa-calendar-days', 'Schedule', 'Program timetable, time and venue', function () { return festSchedule.length + ' items'; }],
  ['tabJudges', 'fa-scale-balanced', 'Judges & Print', 'Judges slips, custom sheets and printing', function () { return ''; }],
  ['tabResult', 'fa-award', 'Results', 'Enter ranks and grades for every item', function () { return realResults().length + ' records'; }],
  ['tabAnnounce', 'fa-bullhorn', 'Announcements', 'Publish results and send messages', function () { return Object.keys(draftGroups()).length + ' drafts'; }],
  ['tabAnalytics', 'fa-chart-pie', 'Analytics', 'Result statistics and charts', function () { return ''; }],
  ['tabPointTable', 'fa-ranking-star', 'Team Points', 'Standings and manual score adjustment', function () { return ''; }],
  ['tabToppers', 'fa-crown', 'Toppers', 'Top scorers by category', function () { return ''; }],
  ['tabPoster', 'fa-wand-magic-sparkles', 'Poster Studio', 'Winner posters with photos and designs', function () { return ''; }],
  ['tabSettings', 'fa-gear', 'Settings & Backup', 'Cloud sync, exports and backup', function () { return ''; }]
];
var ADMIN_MODULES = ADMIN_TILES.map(function (t) { return t[0]; });
function adminEls() { return ADMIN_MODULES.map(function (id) { return document.getElementById(id); }).filter(Boolean); }
function renderAdminMenu() {
  var box = document.getElementById('adminMenu'); if (!box) return;
  box.innerHTML = ADMIN_TILES.map(function (t) {
    var st = ''; try { st = t[4](); } catch (e) { }
    return '<button type="button" class="am-tile" onclick="adminOpen(\'' + t[0] + '\')"><span class="am-ic"><i class="fa-solid ' + t[1] + '"></i></span><span class="am-tx"><b>' + t[2] + '</b><small>' + t[3] + '</small></span>' + (st ? '<span class="am-st">' + st + '</span>' : '') + '<i class="fa-solid fa-chevron-right am-go"></i></button>';
  }).join('');
}
function adminMenuShow() {
  adminEls().forEach(function (e) { e.classList.remove('mod-open'); });
  var m = document.getElementById('adminMenu'), b = document.getElementById('adminBar'); if (m) m.style.display = ''; if (b) b.style.display = 'none';
  var sub = document.getElementById('adminSub'); if (sub) sub.textContent = 'Choose what you want to manage.';
  renderAdminMenu(); window.scrollTo(0, 0);
}
function adminOpen(id) {
  var t = ADMIN_TILES.filter(function (x) { return x[0] === id; })[0]; if (!t) return;
  adminEls().forEach(function (e) { e.classList.toggle('mod-open', e.id === id); });
  var m = document.getElementById('adminMenu'), b = document.getElementById('adminBar'); if (m) m.style.display = 'none'; if (b) b.style.display = 'flex';
  var c = document.getElementById('adminCrumb'); if (c) c.innerHTML = '<i class="fa-solid ' + t[1] + '"></i> ' + t[2];
  var sub = document.getElementById('adminSub'); if (sub) sub.textContent = t[3];
  window.scrollTo(0, 0);
}
adminGo = function (id) {
  showView('officialView');
  setTimeout(function () { if (!adminLoggedIn()) return; if (ADMIN_MODULES.indexOf(id) >= 0) adminOpen(id); else adminMenuShow(); }, 80);
};
/* inside a feature, long pages are split into short tabs (for example: Add / List) */
var MOD_TABS = {
  tabPrograms: { n: ['Add Program', 'Program List'], at: 'H4' }, tabCandidates: { n: ['Register Candidates', 'Candidate Directory'], at: 'H4' },
  tabSchedule: { n: ['Add Schedule Item', 'Schedule List'], at: 1 }, tabJudges: { n: ['Judges Slips', 'Custom Slip Sheet'], at: 1 },
  tabResult: { n: ['Enter Result', 'Evaluated Results'], at: 'H4' }, tabAnnounce: { n: ['Announce Results', 'Send a Message'], at: 1 },
  tabPointTable: { n: ['Manual Adjustment', 'Standings'], at: 'H4' }
};
function setupModuleTabs() {
  Object.keys(MOD_TABS).forEach(function (id) {
    var m = document.getElementById(id); if (!m || m.querySelector('.mod-tabs')) return;
    var cfg = MOD_TABS[id], kids = Array.prototype.filter.call(m.children, function (k) { return !k.classList.contains('sec-head'); }), cut = -1;
    if (cfg.at === 'H4') { for (var i = 0; i < kids.length; i++) if (kids[i].tagName === 'H4') { cut = i; break; } } else cut = cfg.at;
    if (cut <= 0 || cut >= kids.length) return;
    var p0 = document.createElement('div'), p1 = document.createElement('div'); p0.className = 'mod-pane on'; p1.className = 'mod-pane';
    kids.forEach(function (k, i) { (i < cut ? p0 : p1).appendChild(k); });
    var bar = document.createElement('div'); bar.className = 'mod-tabs';
    bar.innerHTML = cfg.n.map(function (t, i) { return '<button type="button" class="mod-tab' + (i ? '' : ' on') + '" data-i="' + i + '">' + t + '</button>'; }).join('');
    var head = m.querySelector('.sec-head'); if (head) head.after(bar); else m.prepend(bar);
    bar.after(p0); p0.after(p1);
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.mod-tab'); if (!b) return; var n = +b.getAttribute('data-i');
      bar.querySelectorAll('.mod-tab').forEach(function (x, j) { x.classList.toggle('on', j === n); }); p0.classList.toggle('on', n === 0); p1.classList.toggle('on', n === 1);
    });
  });
}
var _authAcc = authOfficial;
authOfficial = function () { _authAcc.apply(this, arguments); if (adminLoggedIn()) adminMenuShow(); };

/* login screen: Enter key submits, eye icon shows / hides the password */
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target && (e.target.id === 'officialUser' || e.target.id === 'officialPass')) authOfficial(); });
function togglePw() { var i = document.getElementById('officialPass'), e = document.getElementById('pwEye'); if (!i) return; var show = i.type === 'password'; i.type = show ? 'text' : 'password'; if (e) e.className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'; }

/* Ctrl+K focuses the search box */
focusSearch = function () { var i = document.getElementById('gSearch'); if (i) { i.focus(); i.select(); } };
document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); focusSearch(); } });

/* ---------- refresh hook ---------- */
var _refreshAllShell = refreshAll;
refreshAll = function () {
  _refreshAllShell.apply(this, arguments);
  [renderPublicResults, renderAdminToppers, renderPosterWinners, renderSettingsInfo, decorateAdminSections, syncAdminUI].forEach(function (fn) { try { fn(); } catch (err) { console.error(err); } });
};
try { decorateAdminSections(); setupModuleTabs(); renderPublicResults(); syncAdminUI(); } catch (err) { console.error(err); }
