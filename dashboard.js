/* KADHARVA — premium dashboard: Festival Overview, FEST CONTROL, quick navigation, global search,
   live leaderboard, countdown, winner banner, recent activity, export centre, section identities */

var ovPrev = {};
var TEAM_HEX = { Qahira: '#0284c7', Qudsiya: '#059669', Qurthuba: '#ef4444' };
function $(id) { return document.getElementById(id); }

/* ---------- small helpers ---------- */
function agoText(ts) {
  var s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return s + 's ago';
  var m = Math.floor(s / 60); if (m < 60) return m + ' min ago';
  var h = Math.floor(m / 60); if (h < 24) return h + ' h ago';
  return Math.floor(h / 24) + ' d ago';
}
function animateNumber(el, from, to, suffix) {
  suffix = suffix || '';
  if (!el) return;
  if (from === to) { el.textContent = to + suffix; return; }
  var t0 = performance.now(), d = 900;
  (function step(t) {
    var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e) + suffix;
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}
function countTo(key, el, to, suffix) {
  var from = ovPrev[key] === undefined ? 0 : ovPrev[key];
  ovPrev[key] = to;
  animateNumber(el, from, to, suffix);
}

/* ---------- activity log ---------- */
function addLog(text) {
  festLog.push({ t: new Date().toISOString(), text: text });
  if (festLog.length > 80) festLog = festLog.slice(-80);
  localStorage.setItem('MEELAD_LOG', JSON.stringify(festLog));
}
(function wrapForLog() {
  function wrap(name, before, after) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      var b = before ? before() : null, r = orig.apply(this, arguments);
      try { after(b); } catch (e) { }
      return r;
    };
  }
  wrap('saveBatchCandidates', function () { return festCandidates.length; }, function (b) { if (festCandidates.length > b) addLog('Registered ' + (festCandidates.length - b) + ' candidate(s)'); });
  wrap('savePrograms', function () { return festPrograms.length; }, function (b) { if (festPrograms.length > b) addLog('Added ' + (festPrograms.length - b) + ' program(s)'); });
  wrap('saveResultBatch', function () { return { r: festResults, c: $('resCategory').value, i: $('resItemSelect').value }; }, function (b) { if (festResults !== b.r) addLog('Saved result: ' + b.i + ' (' + b.c + ')'); });
  wrap('saveEntries', function () { return $('entTeam').value + ' ' + $('entCat').value; }, function (b) { addLog('Saved entries: ' + b); });
  wrap('addScheduleItem', function () { return festSchedule.length; }, function (b) { if (festSchedule.length > b) addLog('Added a schedule item'); });
  wrap('publishGroups', function () { return realResults().filter(isPub).length; }, function (b) { if (realResults().filter(isPub).length > b) addLog('Announced results'); });
  wrap('deleteProgramByKey', function () { return festPrograms.length; }, function (b) { if (festPrograms.length < b) addLog('Deleted a program'); });
  wrap('deleteCandidate', function () { return festCandidates.length; }, function (b) { if (festCandidates.length < b) addLog('Deleted a candidate'); });
})();

/* ---------- numbers ---------- */
function ovNumbers() {
  var entries = 0;
  festCandidates.forEach(function (c) { entries += candProgCount(c).length; });
  var groups = {};
  realResults().forEach(function (r) { (groups[groupKey(r)] = groups[groupKey(r)] || []).push(r); });
  var pub = 0, draft = 0;
  Object.keys(groups).forEach(function (k) { if (groups[k].some(isPub)) pub++; else draft++; });
  var pendList = [];
  festPrograms.forEach(function (p) {
    var n = totalEntered(progKey(p));
    if (n > 0 && !festResults.some(function (r) { return r.program === p.name && r.category === p.category && isPub(r) && r.regNo !== '-'; })) pendList.push({ p: p, n: n });
  });
  return { programs: festPrograms.length, candidates: festCandidates.length, entries: entries, published: pub, drafts: draft, pending: pendList.length, pendList: pendList };
}

function statsHtml(n, big) {
  var blocks = [['Total Programs', n.programs], ['Registered Candidates', n.candidates], ['Total Entries', n.entries], ['Published Results', n.published]];
  if (!big) blocks = blocks.concat([['Pending Results', n.pending], ['Draft Results', n.drafts]]);
  return blocks.map(function (b) { return '<div class="ov-stat"><b data-k="st-' + b[0] + '" data-v="' + b[1] + '">0</b><span>' + b[0] + '</span></div>'; }).join('');
}
function fillStats(box) {
  Array.prototype.forEach.call(box.querySelectorAll('b[data-k]'), function (b) { countTo(box.id + b.getAttribute('data-k'), b, Number(b.getAttribute('data-v'))); });
}

/* ---------- live leaderboard ---------- */
function leaderboardData() {
  return REP_TEAMS.map(function (t) {
    return { t: t, tot: REP_CATS.reduce(function (s, c) { return s + rotTotal(t, c); }, 0) };
  }).sort(function (a, b) { return b.tot - a.tot; });
}
function renderLeaderboard(id) {
  var box = $(id); if (!box) return;
  var d = leaderboardData(), max = Math.max.apply(null, d.map(function (x) { return x.tot; }).concat([1]));
  box.innerHTML = '<div class="ov-h">LIVE TEAM LEADERBOARD</div>' + d.map(function (x, i) {
    var first = i === 0 && x.tot > 0;
    return '<div class="lb-row' + (first ? ' first' : '') + '"><span class="lb-rank">' + (first ? '👑' : '#' + (i + 1)) + '</span><span class="badge team-badge-' + x.t.toLowerCase() + '">' + x.t + '</span>' +
      '<div class="lb-bar"><i style="width:' + (x.tot / max * 100) + '%"></i></div><b class="lb-pts" data-t="' + x.t + '" data-v="' + x.tot + '">0</b></div>';
  }).join('');
  Array.prototype.forEach.call(box.querySelectorAll('.lb-pts'), function (b) { countTo(id + b.getAttribute('data-t'), b, Number(b.getAttribute('data-v')), ' pts'); });
}

/* ---------- upcoming + countdown ---------- */
function upcomingList(n) {
  var now = new Date();
  var arr = festSchedule.map(function (s) {
    var d = s.date ? new Date(s.date + 'T' + (s.time || '00:00')) : null;
    return { s: s, d: d && !isNaN(d) ? d : null };
  }).filter(function (x) { return x.d && x.d >= now; }).sort(function (a, b) { return a.d - b.d; });
  return arr.slice(0, n);
}
function renderUpcoming(id) {
  var box = $(id); if (!box) return;
  var up = upcomingList(5), nx = up[0];
  var cd = nx ? '<div class="cd-label">NEXT: ' + esc(nx.s.program) + ' <small>(' + catLabel(nx.s.category) + ')</small></div><div class="cd-time" data-t="' + nx.d.getTime() + '">--:--:--</div>' : '<div class="cd-label" style="opacity:.7;">No upcoming programs scheduled</div>';
  box.innerHTML = '<div class="ov-h">UPCOMING PROGRAMS</div><div class="cd-box">' + cd + '</div>' +
    (up.length ? up.map(function (x) { return '<div class="up-row"><b>' + fmtTime(x.s.time) + '</b><span>' + esc(x.s.program) + '</span><small>' + catLabel(x.s.category) + (x.s.venue ? ' · ' + esc(x.s.venue) : '') + '</small></div>'; }).join('') : '');
  tickCountdown();
}
function tickCountdown() {
  var any = false;
  Array.prototype.forEach.call(document.querySelectorAll('.cd-time'), function (el) {
    var ms = Number(el.getAttribute('data-t')) - Date.now();
    if (ms <= 0) { any = true; return; }
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    var p = function (n) { return String(n).padStart(2, '0'); };
    el.textContent = (d ? d + 'd ' : '') + p(h) + ':' + p(m) + ':' + p(sec);
  });
  if (any) { renderUpcoming('ovUpcoming'); renderUpcoming('fcUpcoming'); }
}
setInterval(tickCountdown, 1000);

/* ---------- winner banner ---------- */
function renderBanner() {
  var box = $('ovBanner'); if (!box) return;
  var pub = realResults().filter(isPub).filter(function (r) { return r.place && r.place !== '-'; });
  if (!pub.length) { box.innerHTML = ''; return; }
  pub.sort(function (a, b) { return String(b.pubAt || '').localeCompare(String(a.pubAt || '')) || (b.id - a.id); });
  var top = pub[0], med = { '1st': '🥇', '2nd': '🥈', '3rd': '🥉' };
  var g = pub.filter(function (r) { return r.program === top.program && r.category === top.category; }).sort(function (a, b) { return a.place.localeCompare(b.place); });
  box.innerHTML = '<div class="win-banner"><div class="wb-t">🏆 LATEST RESULT</div><div class="wb-p">' + esc(top.program) + ' <small>(' + esc(top.category) + ')</small></div><div class="wb-w">' +
    g.map(function (r) { return '<span>' + (med[r.place] || '') + ' <b>' + esc(r.name) + '</b> <em>' + esc(r.team) + '</em></span>'; }).join('') + '</div></div>';
}

/* ---------- recent activity / pending ---------- */
function renderActivity() {
  var box = $('fcActivity'); if (!box) return;
  var list = festLog.slice().reverse().slice(0, 8);
  box.innerHTML = '<div class="ov-h">RECENT ACTIVITY</div>' + (list.length ? list.map(function (l) { return '<div class="act-row"><span>' + esc(l.text) + '</span><small>' + agoText(new Date(l.t).getTime()) + '</small></div>'; }).join('') : '<div class="ana-empty">Nothing yet — actions you take will be listed here.</div>');
}
function renderPending(n) {
  var box = $('fcPending'); if (!box) return;
  box.innerHTML = '<div class="ov-h">PENDING RESULTS <small>' + n.pending + ' program' + (n.pending === 1 ? '' : 's') + ' with entries but no published result</small></div>' +
    (n.pendList.length ? n.pendList.slice(0, 7).map(function (x) { return '<div class="act-row"><span>' + esc(x.p.name) + ' <small>(' + esc(x.p.category) + ')</small></span><small>' + x.n + ' entered</small></div>'; }).join('') + (n.pendList.length > 7 ? '<div class="act-row"><small>… and ' + (n.pendList.length - 7) + ' more</small></div>' : '') : '<div class="ana-empty">All programs with entries have published results 🎉</div>');
}

/* ---------- main render ---------- */
function syncText() {
  return lastSyncAt ? 'Last cloud sync: ' + new Date(lastSyncAt).toLocaleTimeString() + ' (' + agoText(lastSyncAt) + ')' : 'Waiting for cloud…';
}
function renderLive() {
  ['ovLive', 'fcLive'].forEach(function (id) { var e = $(id); if (e) e.innerHTML = cloudLoaded ? '<span class="live-dot"></span> LIVE' : '<span class="live-dot off"></span> CONNECTING'; });
  ['ovSync', 'fcSync'].forEach(function (id) { var e = $(id); if (e) e.textContent = syncText(); });
}
function renderOverview() {
  var n = ovNumbers();
  var s = $('ovStats'); if (s) { s.innerHTML = statsHtml(n, true); fillStats(s); }
  renderLeaderboard('ovLeader'); renderUpcoming('ovUpcoming'); renderBanner(); renderLive();
}
function renderFestControl() {
  var n = ovNumbers();
  var s = $('fcStats'); if (s) { s.innerHTML = statsHtml(n, false); fillStats(s); }
  renderLeaderboard('fcLeader'); renderUpcoming('fcUpcoming'); renderPending(n); renderActivity(); renderLive();
}
setInterval(renderLive, 5000);

/* ---------- animated points in the point tables ---------- */
function animatePointCells() {
  ['teamPointsTable', 'adminPointTablePreview'].forEach(function (id) {
    var box = $(id); if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('td'), function (td, i) {
      var m = /^(\d+) pts$/.exec(td.textContent.trim()); if (!m) return;
      countTo('pt-' + id + i, td, Number(m[1]), ' pts');
    });
  });
}

/* ---------- section identities (admin) ---------- */
var SEC = {
  tabPrograms: { t: 'Programs Management', d: 'Program categories, competition types, registration status and program counts.', c: '#2B7CD3', i: 'fa-list-check', s: function () { return festPrograms.length + ' programs'; } },
  tabCandidates: { t: 'Candidate Management', d: 'Search, filter, register, edit and manage candidates.', c: '#38bdf8', i: 'fa-users', s: function () { return festCandidates.length + ' candidates'; } },
  tabEntries: { t: 'Entries', d: 'Tick the programs every candidate takes part in. Team limits are enforced.', c: '#34d399', i: 'fa-square-check', s: function () { return ovNumbers().entries + ' entries'; } },
  tabSchedule: { t: 'Schedule', d: 'Program timings, venues and categories for the whole fest.', c: '#a78bfa', i: 'fa-calendar-days', s: function () { return festSchedule.length + ' items'; } },
  tabJudges: { t: 'Judges Slips', d: 'Code slips and candidate-name slips, 4 per A4 page.', c: '#fb7185', i: 'fa-scale-balanced', s: function () { return ''; } },
  tabResult: { t: 'Results Management', d: 'Result entry, rank assignment, grade, points and publishing.', c: '#2B7CD3', i: 'fa-award', s: function () { var n = ovNumbers(); return n.published + ' published · ' + n.drafts + ' draft'; } },
  tabAnnounce: { t: 'Announcements', d: 'Publish results in batches and send messages to everyone.', c: '#2B7CD3', i: 'fa-bullhorn', s: function () { return ovNumbers().drafts + ' waiting'; } },
  tabAnalytics: { t: 'Result Analytics', d: 'Publishing timeline, ranks, grades and points at a glance.', c: '#2dd4bf', i: 'fa-chart-pie', s: function () { return ''; } },
  tabPointTable: { t: 'Team Points', d: 'Qurthuba, Qudsiya and Qahira standings with animated score changes.', c: '#2B7CD3', i: 'fa-trophy', s: function () { var d = leaderboardData(); return d[0] && d[0].tot ? '👑 ' + d[0].t : ''; } }
};
function decorateAdminSections() {
  Object.keys(SEC).forEach(function (id) {
    var el = $(id), c = SEC[id];
    if (!el || el.querySelector('.sec-head')) return;
    el.style.setProperty('--sec', c.c);
    var h = document.createElement('div');
    h.className = 'sec-head';
    h.innerHTML = '<div class="sec-ic"><i class="fa-solid ' + c.i + '"></i></div><div class="sec-tx"><h3>' + c.t + '</h3><p>' + c.d + '</p></div><div class="sec-stat" id="ss-' + id + '"></div>';
    el.insertBefore(h, el.firstChild);
  });
}
function updateSectionStats() {
  Object.keys(SEC).forEach(function (id) { var e = $('ss-' + id); if (e) e.textContent = SEC[id].s(); });
}

/* ---------- quick navigation ---------- */
function adminLoggedIn() { var oc = $('officialContent'); return oc && oc.style.display !== 'none'; }
function adminGo(id) {
  showView('officialView');
  setTimeout(function () {
    if (!adminLoggedIn()) { alert('Please log in as admin first.'); return; }
    var el = $(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}
var QN_IDS = ['festControl', 'tabPrograms', 'tabCandidates', 'tabEntries', 'tabSchedule', 'tabJudges', 'tabResult', 'tabAnnounce', 'tabAnalytics', 'tabPointTable'];
var qnTick = false;
window.addEventListener('scroll', function () {
  if (qnTick || !adminLoggedIn()) return; qnTick = true;
  requestAnimationFrame(function () {
    qnTick = false;
    var cur = QN_IDS[0];
    QN_IDS.forEach(function (id) { var e = $(id); if (e && e.getBoundingClientRect().top < 170) cur = id; });
    Array.prototype.forEach.call(document.querySelectorAll('#quickNav button'), function (b) { b.classList.toggle('on', b.getAttribute('data-go') === cur); });
  });
}, { passive: true });

function adminInitAll() {
  [decorateAdminSections, initCandidateRows, updateJudgeProgramDropdown, updateResultProgramDropdown, renderEntriesTab, renderAnnounceTab, renderAnalytics, renderScheduleViews, jcRender, renderFestControl, updateSectionStats]
    .forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
}
var _authDash = authOfficial;
authOfficial = function () {
  _authDash.apply(this, arguments);
  if (adminLoggedIn()) { adminInitAll(); addLog('Admin signed in'); }
};

/* ---------- global search ---------- */
function searchHits(q) {
  q = q.toLowerCase().trim(); if (q.length < 2) return [];
  var out = [];
  festCandidates.forEach(function (c) { if ((c.name + ' ' + c.regNo + ' ' + c.team + ' ' + c.category).toLowerCase().indexOf(q) >= 0) out.push({ k: 'cand', l: c.name, s: c.regNo + ' · ' + c.team + ' · ' + c.category, id: c.regNo }); });
  festPrograms.forEach(function (p) { if ((p.name + ' ' + p.category + ' ' + p.type).toLowerCase().indexOf(q) >= 0) out.push({ k: 'prog', l: p.name, s: p.type + ' · ' + p.category, id: progKey(p) }); });
  festSchedule.forEach(function (s) { if ((s.program + ' ' + (s.venue || '') + ' ' + s.category).toLowerCase().indexOf(q) >= 0) out.push({ k: 'sched', l: s.program, s: fmtDate(s.date) + ' ' + fmtTime(s.time), id: s.id }); });
  return out.slice(0, 10);
}
function onGlobalSearch(inp) {
  var box = $('gRes'); if (!box) return;
  var hits = searchHits(inp.value);
  if (!hits.length) { box.innerHTML = inp.value.trim().length >= 2 ? '<div class="g-empty">No match</div>' : ''; box.style.display = inp.value.trim().length >= 2 ? 'block' : 'none'; return; }
  var ic = { cand: '👤', prog: '📋', sched: '🗓️' };
  box.innerHTML = hits.map(function (h) { return '<div class="g-hit" onmousedown="openHit(\'' + h.k + '\',\'' + enc(String(h.id)) + '\')"><span>' + ic[h.k] + '</span><div><b>' + esc(h.l) + '</b><small>' + esc(h.s) + '</small></div></div>'; }).join('');
  box.style.display = 'block';
}
document.addEventListener('click', function (e) { var b = $('gRes'); if (b && !e.target.closest('.gsearch')) b.style.display = 'none'; });

function infoModal(title, html) {
  miniModal(title, html, function () { }, 'Close');
  var c = $('mmCancel'); if (c) c.style.display = 'none';
}
function openHit(k, id) {
  id = decodeURIComponent(id);
  if ($('gRes')) $('gRes').style.display = 'none';
  if (k === 'cand') {
    var c = festCandidates.filter(function (x) { return String(x.regNo) === id; })[0]; if (!c) return;
    var rs = festResults.filter(function (r) { return String(r.regNo) === String(c.regNo) && isPub(r); }), tot = rs.reduce(function (s, r) { return s + Number(r.mark || 0); }, 0);
    infoModal(esc(c.name),
      '<p><span class="badge team-badge-' + c.team.toLowerCase() + '">' + esc(c.team) + '</span> &nbsp; <b>' + esc(c.regNo) + '</b> · ' + esc(c.category) + '</p>' +
      '<h4 style="margin:12px 0 4px;">Programs (' + candProgCount(c).length + ')</h4><p style="font-size:13px;">' + (candProgCount(c).map(function (k) { return esc(findProgByKey(k).name); }).join(', ') || '—') + '</p>' +
      '<h4 style="margin:12px 0 4px;">Results · ' + tot + ' pts</h4>' + (rs.length ? rs.map(function (r) { return '<div class="act-row"><span>' + esc(r.program) + '</span><small>' + (r.place && r.place !== '-' ? r.place + ' · ' : '') + (r.grade ? 'Grade ' + esc(r.grade) + ' · ' : '') + r.mark + ' pts</small></div>'; }).join('') : '<p style="font-size:13px;">No published results yet.</p>'));
  } else if (k === 'prog') {
    var p = findProgByKey(id); if (!p) return;
    var rs2 = festResults.filter(function (r) { return r.program === p.name && r.category === p.category && r.regNo !== '-' && isPub(r) && r.place && r.place !== '-'; }).sort(function (a, b) { return a.place.localeCompare(b.place); });
    infoModal(esc(p.name),
      '<p>' + esc(p.type) + ' · ' + esc(p.category) + ' · max ' + maxText(p) + ' per team · status: ' + progResultStatus(p) + '</p>' +
      '<h4 style="margin:12px 0 4px;">Entered</h4>' + REP_TEAMS.map(function (t) { return '<div class="act-row"><span><span class="badge team-badge-' + t.toLowerCase() + '">' + t + '</span></span><small>' + teamCount(t, id) + ' / ' + maxText(p) + '</small></div>'; }).join('') +
      '<h4 style="margin:12px 0 4px;">Winners</h4>' + (rs2.length ? rs2.map(function (r) { return '<div class="act-row"><span>' + r.place + ' — <b>' + esc(r.name) + '</b></span><small>' + esc(r.team) + '</small></div>'; }).join('') : '<p style="font-size:13px;">No published winners yet.</p>'));
  } else {
    var s = festSchedule.filter(function (x) { return String(x.id) === id; })[0]; if (!s) return;
    infoModal(esc(s.program), '<p><b>' + fmtDate(s.date) + '</b><br>' + fmtTime(s.time) + (s.endTime ? ' – ' + fmtTime(s.endTime) : '') + '</p><p>' + catLabel(s.category) + (s.venue ? ' · ' + esc(s.venue) : '') + '</p>' + (s.note ? '<p style="font-size:13px;">' + esc(s.note) + '</p>' : ''));
  }
}
function focusSearch() { showView('dashboardView'); setTimeout(function () { var i = $('gSearch'); if (i) { i.scrollIntoView({ behavior: 'smooth', block: 'center' }); i.focus(); } }, 120); }

/* ---------- export centre ---------- */
function csvText(rows) { return rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n'); }
function saveFile(name, text, mime) {
  var b = new Blob([(mime ? '' : '\uFEFF') + text], { type: mime || 'text/csv;charset=utf-8' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 600);
}
function exportData(kind) {
  var rows = [], f = 'mmo-arts-fest-' + kind + '.csv';
  if (kind === 'programs') { rows.push(['Category', 'Type', 'Program', 'Max per team', 'Entered']); festPrograms.forEach(function (p) { rows.push([p.category, p.type, p.name, maxText(p), totalEntered(progKey(p))]); }); }
  else if (kind === 'candidates') { rows.push(['Reg No', 'Name', 'Team', 'Category', 'Programs', 'Program names']); festCandidates.forEach(function (c) { var k = candProgCount(c); rows.push([c.regNo, c.name, c.team, c.category, k.length, k.map(function (x) { return findProgByKey(x).name; }).join('; ')]); }); }
  else if (kind === 'entries') { rows.push(['Category', 'Program', 'Type', 'Team', 'Reg No', 'Name']); festPrograms.forEach(function (p) { festCandidates.forEach(function (c) { if ((c.entries || []).indexOf(progKey(p)) >= 0) rows.push([p.category, p.name, p.type, c.team, c.regNo, c.name]); }); }); }
  else if (kind === 'results') { rows.push(['Category', 'Program', 'Reg No', 'Name', 'Team', 'Rank', 'Grade', 'Mark', 'Published']); festResults.forEach(function (r) { rows.push([r.category, r.program, r.regNo, r.name, r.team, r.place || '', r.grade || '', r.mark, r.published || 'YES']); }); }
  else if (kind === 'schedule') { rows.push(['Date', 'Start', 'End', 'Program', 'Category', 'Venue', 'Note']); schedSorted('').forEach(function (s) { rows.push([s.date, s.time, s.endTime || '', s.program, s.category, s.venue || '', s.note || '']); }); }
  else if (kind === 'backup') { saveFile('mmo-arts-fest-backup.json', JSON.stringify({ programs: festPrograms, candidates: festCandidates, results: festResults, schedule: festSchedule, notices: festNotices, log: festLog }, null, 1), 'application/json'); alert('Full backup downloaded.'); return; }
  saveFile(f, csvText(rows)); alert('Downloaded ' + f);
}

/* ---------- festival atmosphere ---------- */
(function heroParticles() {
  var h = document.querySelector('.top-header'); if (!h || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (var i = 0; i < 22; i++) {
    var d = document.createElement('i'), s = 3 + Math.random() * 6;
    d.className = 'gp';
    d.style.cssText = 'left:' + (Math.random() * 100) + '%;top:' + (30 + Math.random() * 70) + '%;width:' + s + 'px;height:' + s + 'px;animation-duration:' + (7 + Math.random() * 7) + 's;animation-delay:' + (Math.random() * 8) + 's';
    h.appendChild(d);
  }
})();

/* ---------- hook into the existing refresh ---------- */
var _refreshAllDash = refreshAll;
refreshAll = function () {
  _refreshAllDash.apply(this, arguments);
  [renderOverview, renderFestControl, updateSectionStats, animatePointCells, decorateAdminSections].forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
};
decorateAdminSections();
renderOverview();
renderFestControl();
