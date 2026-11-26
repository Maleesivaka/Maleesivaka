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
QN_IDS = ['festControl', 'tabPrograms', 'tabCandidates', 'tabEntries', 'tabSchedule', 'tabJudges', 'tabResult', 'tabAnnounce', 'tabAnalytics', 'tabPointTable', 'tabToppers', 'tabPoster', 'tabSettings'];

/* ---------- admin accordion: sections stay closed until you click them (one open at a time) ---------- */
function adminSections() { return Array.prototype.slice.call(document.querySelectorAll('#officialContent .official-tab-content')); }
function markQuick(id) { Array.prototype.forEach.call(document.querySelectorAll('#quickNav button'), function (b) { b.classList.toggle('on', b.getAttribute('data-go') === id); }); }
function collapseAdminSections() { adminSections().forEach(function (s) { s.classList.add('collapsed'); }); markQuick(''); }
function scrollToEl(el) { if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 84, behavior: 'smooth' }); }
function openAdminSection(id) {
  adminSections().forEach(function (s) { s.classList.toggle('collapsed', s.id !== id); });
  markQuick(id);
  var el = document.getElementById(id); if (el) setTimeout(function () { scrollToEl(el); }, 80);
}
adminGo = function (id) {
  showView('officialView');
  setTimeout(function () {
    if (!adminLoggedIn()) { alert('Please log in as admin first.'); return; }
    if (id === 'festControl') { collapseAdminSections(); scrollToEl(document.getElementById('festControl')); } else openAdminSection(id);
  }, 80);
};
document.addEventListener('click', function (e) {
  var h = e.target.closest && e.target.closest('.sec-head'); if (!h) return;
  var p = h.parentElement; if (!p || !p.classList.contains('official-tab-content')) return;
  if (p.classList.contains('collapsed')) openAdminSection(p.id); else { p.classList.add('collapsed'); markQuick(''); }
});
var _authAcc = authOfficial;
authOfficial = function () { _authAcc.apply(this, arguments); if (adminLoggedIn()) { collapseAdminSections(); window.scrollTo(0, 0); } };

/* Ctrl+K focuses the search box */
focusSearch = function () { var i = document.getElementById('gSearch'); if (i) { i.focus(); i.select(); } };
document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); focusSearch(); } });

/* ---------- refresh hook ---------- */
var _refreshAllShell = refreshAll;
refreshAll = function () {
  _refreshAllShell.apply(this, arguments);
  [renderPublicResults, renderAdminToppers, renderPosterWinners, renderSettingsInfo, decorateAdminSections, syncAdminUI].forEach(function (fn) { try { fn(); } catch (err) { console.error(err); } });
};
try { decorateAdminSections(); collapseAdminSections(); renderPublicResults(); syncAdminUI(); } catch (err) { console.error(err); }
