/* MMO Arts Fest — Program Schedule (public view + admin editing + print) */
var SCHED_CATS = [['ALL', 'All Categories'], ['SENIOR', 'Senior'], ['JUNIOR', 'Junior'], ['SUB-JUNIOR', 'Sub-Junior'], ['GENERAL', 'General']];

function fmtTime(t) {
  if (!t) return '';
  var p = t.split(':'), h = Number(p[0]), ap = h >= 12 ? 'PM' : 'AM';
  return (h % 12 || 12) + ':' + p[1] + ' ' + ap;
}
function fmtDate(d) {
  if (!d) return 'Date not set';
  var x = new Date(d + 'T00:00:00');
  return isNaN(x) ? d : x.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function schedSorted(cat) {
  return festSchedule.filter(function (s) { return !cat || s.category === cat || s.category === 'ALL'; })
    .sort(function (a, b) { return String(a.date || '').localeCompare(String(b.date || '')) || String(a.time || '').localeCompare(String(b.time || '')); });
}
function catLabel(c) { return c === 'ALL' ? 'All' : c === 'GENERAL' ? 'General' : c; }

/* grouped-by-date table HTML, used on screen and in print */
function scheduleHtml(cat) {
  var list = schedSorted(cat);
  if (!list.length) return '<p style="padding:14px;color:#64748b;">No schedule added yet.</p>';
  var out = '', last = null;
  list.forEach(function (s) {
    if (s.date !== last) {
      if (last !== null) out += '</tbody></table>';
      out += '<h3>' + fmtDate(s.date) + '</h3><table><thead><tr><th style="width:20%">Time</th><th>Program</th><th style="width:16%">Category</th><th style="width:20%">Venue</th></tr></thead><tbody>';
      last = s.date;
    }
    out += '<tr><td><b>' + fmtTime(s.time) + (s.endTime ? ' – ' + fmtTime(s.endTime) : '') + '</b></td><td><b>' + esc(s.program) + '</b>' + (s.note ? '<br><small>' + esc(s.note) + '</small>' : '') + '</td><td>' + catLabel(s.category) + '</td><td>' + esc(s.venue || '') + '</td></tr>';
  });
  return out + '</tbody></table>';
}

function renderScheduleViews() {
  var pub = document.getElementById('scheduleBox');
  if (pub) {
    var f = document.getElementById('schedFilter') ? document.getElementById('schedFilter').value : '';
    pub.innerHTML = scheduleHtml(f === 'ALL' ? '' : f);
  }
  var adm = document.getElementById('schedAdminList');
  if (adm) {
    var list = schedSorted('');
    adm.innerHTML = !list.length ? "<p style='padding:12px;font-size:13px;color:var(--text-muted);'>No schedule items yet.</p>" :
      '<table><thead><tr><th>Date</th><th>Time</th><th>Program</th><th>Category</th><th>Venue</th><th>Action</th></tr></thead><tbody>' +
      list.map(function (s) {
        return '<tr><td>' + esc(s.date || '–') + '</td><td><b>' + fmtTime(s.time) + (s.endTime ? ' – ' + fmtTime(s.endTime) : '') + '</b></td><td>' + esc(s.program) + '</td><td>' + catLabel(s.category) + '</td><td>' + esc(s.venue || '') + '</td>' +
          '<td style="white-space:nowrap;"><button onclick="editSchedule(' + s.id + ')" style="padding:4px 10px;background:#0284c7;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:4px;"><i class="fa-solid fa-pen"></i></button>' +
          '<button onclick="deleteSchedule(' + s.id + ')" style="padding:4px 8px;background:#ef4444;color:#fff;border:none;border-radius:4px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td></tr>';
      }).join('') + '</tbody></table>';
  }
  var dl = document.getElementById('schProgList');
  if (dl) {
    var names = []; festPrograms.forEach(function (p) { if (names.indexOf(p.name) < 0) names.push(p.name); });
    dl.innerHTML = names.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('');
  }
}

function addScheduleItem() {
  var g = function (id) { return document.getElementById(id).value.trim(); };
  if (!g('schProgram') || !g('schTime')) { alert('Please enter at least the program name and the start time.'); return; }
  festSchedule.push({ id: Date.now() + Math.floor(Math.random() * 1000), date: g('schDate'), time: g('schTime'), endTime: g('schEnd'), program: g('schProgram'), category: g('schCategory'), venue: g('schVenue'), note: g('schNote') });
  addNotice('schedule', 'New schedule item', festSchedule[festSchedule.length - 1].program + ' (' + catLabel(festSchedule[festSchedule.length - 1].category) + ') • ' + fmtDate(festSchedule[festSchedule.length - 1].date) + ' ' + fmtTime(festSchedule[festSchedule.length - 1].time));
  ['schProgram', 'schTime', 'schEnd', 'schVenue', 'schNote'].forEach(function (id) { document.getElementById(id).value = ''; });
  saveAllData();
}

function deleteSchedule(id) {
  if (!confirm('Delete this schedule item?')) return;
  festSchedule = festSchedule.filter(function (s) { return s.id !== id; });
  addNotice('schedule', 'Schedule item removed', 'An item was removed from the schedule.');
  saveAllData();
}

function editSchedule(id) {
  var s = festSchedule.filter(function (x) { return x.id === id; })[0];
  if (!s) return;
  var cats = SCHED_CATS.map(function (c) { return '<option value="' + c[0] + '"' + (s.category === c[0] ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('');
  miniModal('Edit Schedule Item',
    '<label style="font-size:12px;">Date</label><input type="date" id="esDate" value="' + esc(s.date) + '">' +
    '<div style="display:flex;gap:10px;"><div style="flex:1;"><label style="font-size:12px;">Start time</label><input type="time" id="esTime" value="' + esc(s.time) + '"></div><div style="flex:1;"><label style="font-size:12px;">End time</label><input type="time" id="esEnd" value="' + esc(s.endTime) + '"></div></div>' +
    '<label style="font-size:12px;">Program</label><input type="text" id="esProg" value="' + esc(s.program) + '">' +
    '<label style="font-size:12px;">Category</label><select id="esCat">' + cats + '</select>' +
    '<label style="font-size:12px;">Venue / Stage</label><input type="text" id="esVenue" value="' + esc(s.venue) + '">' +
    '<label style="font-size:12px;">Note</label><input type="text" id="esNote" value="' + esc(s.note) + '">',
    function () {
      var p = document.getElementById('esProg').value.trim(), t = document.getElementById('esTime').value;
      if (!p || !t) { alert('Program name and start time are required.'); return false; }
      s.date = document.getElementById('esDate').value; s.time = t; s.endTime = document.getElementById('esEnd').value;
      s.program = p; s.category = document.getElementById('esCat').value; s.venue = document.getElementById('esVenue').value.trim(); s.note = document.getElementById('esNote').value.trim();
      addNotice('schedule', 'Schedule updated', s.program + ' (' + catLabel(s.category) + ') • ' + fmtDate(s.date) + ' ' + fmtTime(s.time));
      saveAllData();
    });
}

function printSchedule() {
  var f = document.getElementById('schedFilter') ? document.getElementById('schedFilter').value : '';
  reportShell('Program Schedule' + (f && f !== 'ALL' ? ' — ' + catLabel(f) : ''), scheduleHtml(f === 'ALL' ? '' : f));
}

var _refreshAllSched = refreshAll;
refreshAll = function () { _refreshAllSched.apply(this, arguments); renderScheduleViews(); renderProgramListView(); };

renderScheduleViews();
renderProgramListView();
