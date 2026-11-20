/* MMO Arts Fest — Announce results (batches), Result Analytics, Toppers */

function isPub(r) { return r.published === 'YES' || r.published === undefined; }
function realResults() { return festResults.filter(function (r) { return r.regNo !== '-'; }); }
function groupKey(r) { return r.category + '|' + r.program; }

/* ================= ANNOUNCE TAB ================= */
function draftGroups() {
  var g = {};
  realResults().filter(function (r) { return !isPub(r); }).forEach(function (r) { (g[groupKey(r)] = g[groupKey(r)] || []).push(r); });
  return g;
}

function renderAnnounceTab() {
  var box = document.getElementById('announceDrafts');
  if (!box) return;
  var g = draftGroups(), keys = Object.keys(g);
  if (!keys.length) { box.innerHTML = '<p class="rot-empty">No draft results. Save a result with "Draft (Hidden)" status and it will appear here.</p>'; return; }
  box.innerHTML = '<table><thead><tr><th style="width:40px;">✓</th><th>Item</th><th>Category</th><th>Participants</th><th>Winners</th></tr></thead><tbody>' +
    keys.map(function (k) {
      var rs = g[k].slice().sort(function (a, b) { return String(a.place).localeCompare(String(b.place)); });
      var win = rs.filter(function (r) { return r.place && r.place !== '-'; }).map(function (r) { return r.place + ' ' + esc(r.name); }).join(', ');
      return '<tr><td><input type="checkbox" class="ann-cb" value="' + enc(k) + '" checked style="width:20px;height:20px;margin:0;"></td><td><b>' + esc(rs[0].program) + '</b></td><td>' + esc(rs[0].category) + '</td><td>' + rs.length + '</td><td style="font-size:12.5px;">' + (win || '–') + '</td></tr>';
    }).join('') + '</tbody></table>';
}

function publishGroups(keys) {
  var g = draftGroups(), picked = keys.filter(function (k) { return g[k]; });
  if (!picked.length) { alert('Please select at least one item to announce.'); return; }
  var batch = Date.now(), iso = new Date().toISOString(), names = [];
  picked.forEach(function (k) {
    g[k].forEach(function (r) { r.published = 'YES'; r.batch = batch; r.pubAt = iso; });
    names.push(g[k][0].program + ' (' + g[k][0].category + ')');
  });
  addNotice('result', 'Results announced', picked.length + ' item' + (picked.length > 1 ? 's' : '') + ': ' + names.slice(0, 4).join(', ') + (names.length > 4 ? ' and ' + (names.length - 4) + ' more' : ''));
  markResultsKnown();
  saveAllData();
}
function announceSelected() {
  var keys = Array.prototype.map.call(document.querySelectorAll('.ann-cb:checked'), function (c) { return decodeURIComponent(c.value); });
  publishGroups(keys);
}
function announceAllDrafts() { publishGroups(Object.keys(draftGroups())); }

function sendAnnouncement() {
  var t = document.getElementById('annTitle').value.trim(), m = document.getElementById('annText').value.trim();
  if (!t && !m) { alert('Please type a title or a message.'); return; }
  addNotice('info', t || 'Announcement', m);
  document.getElementById('annTitle').value = ''; document.getElementById('annText').value = '';
  saveAllData();
}

/* ================= ANALYTICS ================= */
function anaBars(items, color) {
  if (!items.length) return '<div class="ana-empty">No data yet</div>';
  var max = Math.max.apply(null, items.map(function (i) { return i.v; }).concat([1]));
  return items.map(function (i) {
    return '<div class="ana-row"><span class="ana-l" title="' + esc(i.l) + '">' + esc(i.l) + '</span><div class="ana-bar"><i style="width:' + (i.v / max * 100) + '%;background:' + (i.c || color || '#0b7a5f') + '"></i></div><b>' + i.v + '</b></div>';
  }).join('');
}

function renderAnalytics() {
  var box = document.getElementById('analyticsBox');
  if (!box) return;
  var res = realResults(), pub = res.filter(isPub), groups = {};
  res.forEach(function (r) { (groups[groupKey(r)] = groups[groupKey(r)] || []).push(r); });
  var pubProgs = 0, draftProgs = 0, pubByCat = {}, batches = {}, days = {};
  Object.keys(groups).forEach(function (k) {
    var g = groups[k];
    if (g.some(isPub)) { pubProgs++; pubByCat[g[0].category] = (pubByCat[g[0].category] || 0) + 1; } else draftProgs++;
  });
  var notStarted = Math.max(0, festPrograms.length - pubProgs - draftProgs);

  var totalPts = festResults.filter(isPub).reduce(function (s, r) { return s + Number(r.mark || 0); }, 0);
  var ptsByCat = {};
  festResults.filter(isPub).forEach(function (r) { ptsByCat[r.category] = (ptsByCat[r.category] || 0) + Number(r.mark || 0); });

  var tieMap = {}, ties = 0;
  pub.forEach(function (r) { if (['1st', '2nd', '3rd'].indexOf(r.place) >= 0) { var k = groupKey(r) + '|' + r.place; tieMap[k] = (tieMap[k] || 0) + 1; } });
  Object.keys(tieMap).forEach(function (k) { if (tieMap[k] > 1) ties++; });

  pub.forEach(function (r) {
    var b = r.batch || 'earlier';
    (batches[b] = batches[b] || { t: r.pubAt || '', progs: {} }).progs[groupKey(r)] = 1;
    var d = r.pubAt ? new Date(r.pubAt).toLocaleDateString() : 'Earlier';
    days[d] = (days[d] || 0) + 1;
  });
  var batchKeys = Object.keys(batches).sort(function (a, b) { return String(batches[a].t).localeCompare(String(batches[b].t)); });

  var pos = ['1st', '2nd', '3rd'].map(function (p, i) { return { l: p + ' place', v: pub.filter(function (r) { return r.place === p; }).length, c: ['#c9a24b', '#94a3b8', '#b45309'][i] }; });
  var grd = ['A', 'B', 'C'].map(function (g, i) { return { l: 'Grade ' + g, v: pub.filter(function (r) { return r.grade === g; }).length, c: ['#059669', '#0284c7', '#f59e0b'][i] }; });
  var cats = ['SENIOR', 'JUNIOR', 'SUB-JUNIOR', 'GENERAL'];

  box.innerHTML =
    '<div class="ana-cards">' +
    '<div class="ana-card dark"><small>Published</small><h4>' + pubProgs + ' published</h4><span>' + (pubProgs + draftProgs) + ' generated</span></div>' +
    '<div class="ana-card"><small>Total points</small><h4>' + totalPts + ' pts</h4><span>festival points awarded</span></div>' +
    '<div class="ana-card"><small>Position ties</small><h4>' + ties + ' ties</h4><span>tied program ranks</span></div>' +
    '<div class="ana-card"><small>Release batches</small><h4>' + batchKeys.length + ' cycles</h4><span>published batches</span></div>' +
    '<div class="ana-card"><small>Unpublished</small><h4>' + draftProgs + ' pending</h4><span>awaiting publication</span></div></div>' +
    '<div class="ana-grid">' +
    '<div class="ana-panel"><h5>🗓️ Result Publishing Timeline</h5>' + anaBars(Object.keys(days).map(function (d) { return { l: d, v: days[d] }; }), '#0284c7') + '</div>' +
    '<div class="ana-panel"><h5>📄 Programs Status Breakdown</h5>' + anaBars([{ l: 'Published', v: pubProgs, c: '#059669' }, { l: 'Draft / pending', v: draftProgs, c: '#f59e0b' }, { l: 'Not started', v: notStarted, c: '#94a3b8' }], '') + '</div>' +
    '<div class="ana-panel"><h5>🏅 Candidates by Awarded Position</h5>' + anaBars(pos, '') + '</div>' +
    '<div class="ana-panel"><h5>🎖️ Candidates by Awarded Grade</h5>' + anaBars(grd, '') + '</div>' +
    '<div class="ana-panel"><h5>🧮 Total Points Contributed per Category</h5>' + anaBars(cats.filter(function (c) { return ptsByCat[c]; }).map(function (c) { return { l: c, v: ptsByCat[c] }; }), '#7c3aed') + '</div>' +
    '<div class="ana-panel"><h5>📚 Published Programs per Category</h5>' + anaBars(cats.filter(function (c) { return pubByCat[c]; }).map(function (c) { return { l: c, v: pubByCat[c] }; }), '#0b7a5f') + '</div>' +
    '<div class="ana-panel"><h5>📢 Programmes Published per Announcement Batch</h5>' + anaBars(batchKeys.map(function (b, i) { return { l: batches[b].t ? 'Batch ' + (i + 1) + ' · ' + new Date(batches[b].t).toLocaleDateString() : 'Earlier', v: Object.keys(batches[b].progs).length }; }), '#c9a24b') + '</div>' +
    '</div>';
}

/* ================= TOPPERS ================= */
function toppersHtml(filterCat) {
  var out = '', medals = ['🥇', '🥈', '🥉'];
  ['SENIOR', 'JUNIOR', 'SUB-JUNIOR'].forEach(function (cat) {
    if (filterCat && filterCat !== cat) return;
    var m = {};
    festResults.filter(function (r) { return r.category === cat && isPub(r) && r.regNo && r.regNo !== '-' && r.regNo !== 'TEAM'; }).forEach(function (r) {
      var o = m[r.regNo] = m[r.regNo] || { name: r.name, team: r.team, reg: r.regNo, total: 0, p1: 0, p2: 0, p3: 0, gr: 0 };
      o.total += Number(r.mark || 0);
      if (r.place === '1st') o.p1++; else if (r.place === '2nd') o.p2++; else if (r.place === '3rd') o.p3++;
      if (r.grade) o.gr++;
    });
    var list = Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.total - a.total || b.p1 - a.p1; }).slice(0, 10);
    out += '<div class="top-card"><h3 style="margin-bottom:6px;">' + cat + ' TOPPERS</h3>' +
      (list.length ? list.map(function (o, i) {
        return '<div class="top-row"><div class="m">' + (medals[i] || (i + 1)) + '</div><div style="flex:1;"><b>' + esc(o.name) + '</b> <small style="color:#64748b;">' + esc(o.reg) + '</small><br><span class="badge team-badge-' + String(o.team).toLowerCase() + '">' + esc(o.team) + '</span> <small style="color:#64748b;">🥇' + o.p1 + ' 🥈' + o.p2 + ' 🥉' + o.p3 + ' • ' + o.gr + ' grades</small></div><div style="font-size:22px;font-weight:800;color:#0b7a5f;">' + o.total + '</div></div>';
      }).join('') : '<div class="ana-empty">No published results yet</div>') + '</div>';
  });
  return out;
}
function renderToppers() {
  var box = document.getElementById('toppersBox');
  if (!box) return;
  var f = document.getElementById('topFilter') ? document.getElementById('topFilter').value : '';
  box.innerHTML = toppersHtml(f);
}
function printToppers() {
  var f = document.getElementById('topFilter') ? document.getElementById('topFilter').value : '';
  reportShell('Toppers' + (f ? ' — ' + f : ''), toppersHtml(f).replace(/class="top-card"/g, 'style="margin-bottom:10px"'));
}
