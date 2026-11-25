function fmtTime(t) { if (!t) return ''; var p = t.split(':'), h = Number(p[0]), ap = h >= 12 ? 'PM' : 'AM'; return (h % 12 || 12) + ':' + p[1] + ' ' + ap; }
function fmtDate(d) { if (!d) return 'Date TBD'; var x = new Date(d + 'T00:00:00'); return isNaN(x) ? d : x.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
function schedSorted(cat) {
  return festSchedule.filter(function (s) { return !cat || s.category === cat || s.category === 'ALL'; })
    .sort(function (a, b) { return String(a.date || '').localeCompare(String(b.date || '')) || String(a.time || '').localeCompare(String(b.time || '')); });
}
function scheduleHtml(cat) {
  var list = schedSorted(cat);
  if (!list.length) return '<p class="muted-text" style="padding:14px;">No schedule items published yet.</p>';
  var out = '', last = null;
  list.forEach(function (s) {
    if (s.date !== last) {
      if (last !== null) out += '</tbody></table></div>';
      out += '<h3 style="margin:14px 0 6px;">' + fmtDate(s.date) + '</h3><div class="table-responsive"><table><thead><tr><th style="width:22%">Time</th><th>Program</th><th style="width:16%">Category</th><th style="width:20%">Venue</th></tr></thead><tbody>';
      last = s.date;
    }
    out += '<tr><td><b style="color:#217346;">' + fmtTime(s.time) + (s.endTime ? ' – ' + fmtTime(s.endTime) : '') + '</b></td><td><b>' + esc(s.program) + '</b>' + (s.note ? '<br><small class="muted-text">' + esc(s.note) + '</small>' : '') + '</td><td>' + esc(s.category) + '</td><td>' + esc(s.venue || '') + '</td></tr>';
  });
  return out + '</tbody></table></div>';
}
function renderScheduleViews() {
  var pub = document.getElementById('scheduleBox');
  if (pub) { var f = document.getElementById('schedFilter') ? document.getElementById('schedFilter').value : ''; pub.innerHTML = scheduleHtml(f === 'ALL' ? '' : f); }
  var adm = document.getElementById('schedAdminList');
  if (adm) {
    var list = schedSorted('');
    adm.innerHTML = !list.length ? "<p class='muted-text' style='padding:12px;'>No schedule items yet.</p>" :
      '<table><thead><tr><th>Date</th><th>Time</th><th>Program</th><th>Category</th><th>Venue</th><th>Action</th></tr></thead><tbody>' +
      list.map(function (s) {
        return '<tr><td>' + esc(s.date || '–') + '</td><td><b>' + fmtTime(s.time) + '</b></td><td>' + esc(s.program) + '</td><td>' + esc(s.category) + '</td><td>' + esc(s.venue || '') + '</td>' +
          '<td><button onclick="deleteSchedule(' + s.id + ')" class="btn-danger-sm"><i class="fa-solid fa-trash"></i></button></td></tr>';
      }).join('') + '</tbody></table>';
  }
  var dl = document.getElementById('schProgList');
  if (dl) { var names = []; festPrograms.forEach(function (p) { if (names.indexOf(p.name) < 0) names.push(p.name); }); dl.innerHTML = names.map(function (n) { return '<option value="' + esc(n) + '">'; }).join(''); }
}
function addScheduleItem() {
  var g = function (id) { return document.getElementById(id).value.trim(); };
  if (!g('schProgram') || !g('schTime')) { alert('Please enter program name and start time.'); return; }
  festSchedule.push({ id: Date.now(), date: g('schDate'), time: g('schTime'), endTime: g('schEnd'), program: g('schProgram'), category: g('schCategory'), venue: g('schVenue'), note: g('schNote') });
  logAdminAction('Scheduled ' + g('schProgram') + ' at ' + g('schTime'));
  addNotice('schedule', 'Schedule updated', g('schProgram') + ' (' + g('schCategory') + ')');
  ['schProgram', 'schTime', 'schEnd', 'schVenue', 'schNote'].forEach(function (id) { document.getElementById(id).value = ''; });
  saveAllData();
}
function deleteSchedule(id) { if (confirm('Remove this schedule slot?')) { festSchedule = festSchedule.filter(function (s) { return s.id !== id; }); saveAllData(); } }
function printSchedule() { var f = document.getElementById('schedFilter') ? document.getElementById('schedFilter').value : ''; reportShell('Program Schedule', scheduleHtml(f === 'ALL' ? '' : f)); }
var _refreshAllSched = refreshAll;
refreshAll = function () { _refreshAllSched.apply(this, arguments); renderScheduleViews(); renderProgramListView(); };
renderScheduleViews(); renderProgramListView();
