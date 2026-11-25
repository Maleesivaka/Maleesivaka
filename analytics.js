function isPub(r) { return r.published === 'YES' || r.published === undefined; }
function realResults() { return festResults.filter(function (r) { return r.regNo !== '-'; }); }
function groupKey(r) { return r.category + '|' + r.program; }

function draftGroups() {
  var g = {};
  realResults().filter(function (r) { return !isPub(r); }).forEach(function (r) { (g[groupKey(r)] = g[groupKey(r)] || []).push(r); });
  return g;
}
function renderAnnounceTab() {
  var box = document.getElementById('announceDrafts'); if (!box) return;
  var g = draftGroups(), keys = Object.keys(g);
  if (!keys.length) { box.innerHTML = '<p class="muted-text" style="padding:12px;">No unpublished draft results in queue.</p>'; return; }
  box.innerHTML = '<table><thead><tr><th style="width:40px;">✓</th><th>Item</th><th>Category</th><th>Entries</th></tr></thead><tbody>' +
    keys.map(function (k) { var rs = g[k]; return '<tr><td><input type="checkbox" class="ann-cb" value="' + enc(k) + '" checked style="width:18px;height:18px;margin:0;accent-color:#217346;"></td><td><b>' + esc(rs[0].program) + '</b></td><td>' + esc(rs[0].category) + '</td><td>' + rs.length + '</td></tr>'; }).join('') + '</tbody></table>';
}
function publishGroups(keys) {
  var g = draftGroups(), picked = keys.filter(function (k) { return g[k]; });
  if (!picked.length) { alert('Select at least one draft result to publish.'); return; }
  picked.forEach(function (k) { g[k].forEach(function (r) { r.published = 'YES'; r.pubAt = new Date().toISOString(); }); });
  logAdminAction('Published ' + picked.length + ' draft result(s)');
  addNotice('result', 'Results Published', picked.length + ' competition result(s) published live!');
  saveAllData();
}
function announceSelected() { publishGroups(Array.prototype.map.call(document.querySelectorAll('.ann-cb:checked'), function (c) { return decodeURIComponent(c.value); })); }
function announceAllDrafts() { publishGroups(Object.keys(draftGroups())); }
function sendAnnouncement() {
  var t = document.getElementById('annTitle').value.trim(), m = document.getElementById('annText').value.trim();
  if (!t && !m) { alert('Enter a title or message.'); return; }
  addNotice('info', t || 'Festival Alert', m);
  logAdminAction('Broadcasted alert: ' + (t || m));
  document.getElementById('annTitle').value = ''; document.getElementById('annText').value = '';
  saveAllData();
}
function renderAnalytics() {
  var box = document.getElementById('analyticsBox'); if (!box) return;
  var res = realResults(), pub = res.filter(isPub);
  var totalPts = festResults.filter(isPub).reduce(function (s, r) { return s + Number(r.mark || 0); }, 0);
  box.innerHTML = '<div class="stats-row"><div class="stat-card"><div class="stat-label">Published Entries</div><div class="stat-value">' + pub.length + '</div></div>' +
    '<div class="stat-card"><div class="stat-label">Draft Entries</div><div class="stat-value coral-text">' + (res.length - pub.length) + '</div></div>' +
    '<div class="stat-card"><div class="stat-label">Total Points Awarded</div><div class="stat-value">' + totalPts + '</div></div></div>';
}
function toppersHtml(filterCat) {
  var out = '', medals = ['🥇', '🥈', '🥉'];
  ['SENIOR', 'JUNIOR', 'SUB-JUNIOR'].forEach(function (cat) {
    if (filterCat && filterCat !== cat) return;
    var m = {};
    festResults.filter(function (r) { return r.category === cat && isPub(r) && r.regNo && r.regNo !== '-' && r.regNo !== 'TEAM'; }).forEach(function (r) {
      var o = m[r.regNo] = m[r.regNo] || { name: r.name, team: r.team, reg: r.regNo, total: 0 };
      o.total += Number(r.mark || 0);
    });
    var list = Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.total - a.total; }).slice(0, 10);
    out += '<div class="surface-card"><h3>' + cat + ' Toppers</h3>' +
      (list.length ? '<div class="table-responsive"><table><thead><tr><th style="width:60px;">Rank</th><th>Candidate</th><th>Team</th><th>Points</th></tr></thead><tbody>' +
      list.map(function (o, i) { return '<tr><td>' + (medals[i] || '#' + (i + 1)) + '</td><td><b>' + esc(o.name) + '</b> <small class="muted-text">(' + esc(o.reg) + ')</small></td><td><span class="badge team-badge-' + String(o.team).toLowerCase() + '">' + esc(o.team) + '</span></td><td style="font-weight:800;color:#217346;">' + o.total + ' pts</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted-text">No published results yet.</p>') + '</div>';
  });
  return out;
}
function renderToppers() { var box = document.getElementById('toppersBox'); if (box) box.innerHTML = toppersHtml(document.getElementById('topFilter') ? document.getElementById('topFilter').value : ''); }
function printToppers() { var f = document.getElementById('topFilter') ? document.getElementById('topFilter').value : ''; reportShell('Category Toppers', toppersHtml(f)); }
