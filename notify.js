/* MMO Arts Fest — pop-up notifications (toasts), bell icon and Notifications page.
   Notices are created when results are announced, the schedule/programs change, or an admin sends a message. */

(function injectNotifyStyles() {
  var st = document.createElement('style');
  st.textContent =
    '#toastBox{position:fixed;top:14px;right:14px;z-index:6000;width:360px;max-width:calc(100vw - 28px);display:flex;flex-direction:column;gap:10px;pointer-events:none}' +
    '.toast{pointer-events:auto;background:#fff;border-radius:14px;box-shadow:0 14px 34px rgba(6,42,36,.28);border-left:6px solid #0284c7;padding:12px 38px 12px 14px;position:relative;animation:toastIn .35s ease;cursor:pointer}' +
    '.toast.result{border-left-color:#c9a24b;background:linear-gradient(135deg,#fffdf5,#fff6dc)}.toast.schedule{border-left-color:#0b7a5f}.toast.program{border-left-color:#7c3aed}.toast.warn{border-left-color:#f59e0b}' +
    '.toast b{display:block;font-size:13.5px;color:#062a24}.toast span{display:block;font-size:12.5px;color:#334155;margin-top:2px;line-height:1.4}' +
    '.toast i.x{position:absolute;top:8px;right:12px;font-style:normal;font-size:18px;color:#94a3b8}' +
    '@keyframes toastIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}' +
    '.notif-badge{background:#ef4444;color:#fff;border-radius:999px;font-size:10px;font-weight:800;padding:1px 6px;margin-left:6px}' +
    '.notice-item{display:flex;gap:14px;padding:14px 16px;border:1px solid #e6dfcc;border-radius:14px;margin-bottom:10px;background:#fff}' +
    '.notice-item.unread{background:#fff8e1;border-color:#c9a24b}.notice-ic{font-size:24px;line-height:1}' +
    '.notice-item b{display:block;color:#062a24}.notice-item small{color:#64748b}' +
    '.ana-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:16px}' +
    '.ana-card{background:#fff;border:1px solid #e6dfcc;border-radius:14px;padding:14px 16px}.ana-card.dark{background:#111827;color:#fff;border:0}' +
    '.ana-card small{font-size:11px;letter-spacing:1px;text-transform:uppercase;opacity:.75}.ana-card h4{font-size:24px;margin:6px 0 0}.ana-card span{font-size:12px;opacity:.7}' +
    '.ana-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}' +
    '.ana-panel{background:#fff;border:1px solid #e6dfcc;border-radius:14px;padding:14px 16px}.ana-panel h5{font-size:13.5px;color:#062a24;margin-bottom:10px}' +
    '.ana-row{display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:12.5px}.ana-l{width:110px;flex:none;color:#475569;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.ana-bar{flex:1;background:#eef2f1;border-radius:6px;height:12px;overflow:hidden}.ana-bar i{display:block;height:100%;border-radius:6px}.ana-empty{color:#94a3b8;font-size:12.5px;text-align:center;padding:14px}' +
    '.top-card{background:#fff;border:1px solid #e6dfcc;border-radius:14px;padding:14px 16px;margin-bottom:16px}' +
    '.top-row{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f1ede0}.top-row:last-child{border:0}.top-row .m{font-size:22px;width:34px;text-align:center}';
  document.head.appendChild(st);
})();

/* ---------- pop-up toasts ---------- */
var NOTICE_ICON = { result: '🏆', schedule: '🗓️', program: '📋', info: '📢' };

function showToast(title, msg, type) {
  var box = document.getElementById('toastBox');
  if (!box) { box = document.createElement('div'); box.id = 'toastBox'; document.body.appendChild(box); }
  var t = document.createElement('div');
  t.className = 'toast ' + (type || 'info');
  t.innerHTML = '<i class="x">×</i>' + (title ? '<b>' + (NOTICE_ICON[type] || '🔔') + ' ' + esc(title) + '</b>' : '') + '<span>' + esc(msg) + '</span>';
  var kill = function () { if (t.parentNode) t.parentNode.removeChild(t); };
  t.onclick = kill;
  box.appendChild(t);
  setTimeout(kill, type === 'result' ? 12000 : 7000);
}

/* normal alert() messages now appear as pop-up notifications */
window.alert = function (m) {
  var s = String(m);
  showToast('', s, /please|maximum|cannot|invalid|denied|already|required|empty|select|choose/i.test(s) ? 'warn' : 'info');
};

/* ---------- notices ---------- */
function addNotice(type, title, text) {
  festNotices.push({ id: Date.now() + Math.floor(Math.random() * 999), time: new Date().toISOString(), type: type, title: title, text: text });
  if (festNotices.length > 150) festNotices = festNotices.slice(-150);
  localStorage.setItem('MEELAD_NOTICES', JSON.stringify(festNotices));
}
function loadIds(key) { try { var v = JSON.parse(localStorage.getItem(key)); return Array.isArray(v) ? v : null; } catch (e) { return null; } }
function saveIds(key, arr) { localStorage.setItem(key, JSON.stringify(arr.slice(-400))); }

/* results already known on this device (used when the cloud script cannot store notices) */
function publishedKeys() {
  return festResults.filter(function (r) { return r.published === 'YES' && r.place && r.place !== '-'; })
    .map(function (r) { return r.category + '|' + r.program + '|' + r.regNo + '|' + r.team + '|' + r.place; });
}
function markResultsKnown() { saveIds('MEELAD_KNOWN_RES', publishedKeys()); }

function checkNotices() {
  if (!cloudLoaded) return;
  var seen = loadIds('MEELAD_TOASTED');
  if (seen === null) { saveIds('MEELAD_TOASTED', festNotices.map(function (n) { return n.id; })); markResultsKnown(); updateBadges(); return; }

  var fresh = festNotices.filter(function (n) { return seen.indexOf(n.id) < 0; }).sort(function (a, b) { return a.time.localeCompare(b.time); });
  fresh.slice(-3).forEach(function (n) { showToast(n.title, n.text, n.type); });
  if (fresh.length > 3) showToast('', (fresh.length - 3) + ' more notifications — see the Notifications page.', 'info');
  if (fresh.length) saveIds('MEELAD_TOASTED', seen.concat(fresh.map(function (n) { return n.id; })));

  if (!cloudHasNotices) {   /* fallback: detect newly published results by comparing with what this device knew */
    var known = loadIds('MEELAD_KNOWN_RES') || [], cur = publishedKeys();
    var newOnes = festResults.filter(function (r) {
      return r.published === 'YES' && r.place && r.place !== '-' && known.indexOf(r.category + '|' + r.program + '|' + r.regNo + '|' + r.team + '|' + r.place) < 0;
    });
    var groups = {};
    newOnes.forEach(function (r) { (groups[r.category + '|' + r.program] = groups[r.category + '|' + r.program] || []).push(r); });
    Object.keys(groups).slice(0, 3).forEach(function (k) {
      var g = groups[k];
      showToast('Result announced', g[0].program + ' (' + g[0].category + ') — ' + g.sort(function (x, y) { return x.place.localeCompare(y.place); }).map(function (r) { return r.place + ' ' + r.name; }).join(', '), 'result');
    });
    saveIds('MEELAD_KNOWN_RES', cur);
  }
  updateBadges();
}

function unreadCount() {
  var read = loadIds('MEELAD_READ') || [];
  return festNotices.filter(function (n) { return read.indexOf(n.id) < 0; }).length;
}
function updateBadges() {
  var n = unreadCount();
  ['bellCount', 'notifBadge'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.textContent = n > 99 ? '99+' : n; el.style.display = n ? 'inline-block' : 'none'; }
  });
}
function markAllRead() { saveIds('MEELAD_READ', festNotices.map(function (n) { return n.id; })); updateBadges(); }

function renderNoticeList() {
  var box = document.getElementById('noticeList');
  if (!box) return;
  var read = loadIds('MEELAD_READ') || [];
  var list = festNotices.slice().sort(function (a, b) { return b.time.localeCompare(a.time); });
  box.innerHTML = !list.length ? '<p class="rot-empty">No notifications yet. Result announcements and schedule changes will appear here.</p>' :
    list.map(function (n) {
      return '<div class="notice-item' + (read.indexOf(n.id) < 0 ? ' unread' : '') + '"><div class="notice-ic">' + (NOTICE_ICON[n.type] || '🔔') + '</div><div><b>' + esc(n.title) + '</b>' + esc(n.text) + '<br><small>' + new Date(n.time).toLocaleString() + '</small></div></div>';
    }).join('');
}

/* ---------- bell icon in the header ---------- */
(function addBell() {
  var hc = document.querySelector('.header-controls');
  if (!hc || document.getElementById('bellCount')) return;
  var fs = hc.children[1], grp = document.createElement('div');
  grp.style.cssText = 'display:flex;gap:8px;align-items:center';
  var bell = document.createElement('div');
  bell.className = 'icon-btn';
  bell.innerHTML = '<i class="fa-solid fa-bell"></i><span id="bellCount" class="notif-badge" style="display:none"></span>';
  bell.onclick = function () { showView('notificationsView'); };
  hc.insertBefore(grp, fs); grp.appendChild(bell); grp.appendChild(fs);
})();

/* ---------- hooks into existing functions ---------- */
var _showViewN = showView;
showView = function (id) {
  _showViewN.apply(this, arguments);
  if (id === 'notificationsView') { renderNoticeList(); markAllRead(); }
  if (id === 'toppersView' && typeof renderToppers === 'function') renderToppers();
};

var _refreshAllN = refreshAll;
refreshAll = function () {
  _refreshAllN.apply(this, arguments);
  [renderNoticeList, checkNotices, function () { if (typeof renderToppers === 'function') renderToppers(); }, function () { if (typeof renderAnnounceTab === 'function') renderAnnounceTab(); }, function () { if (typeof renderAnalytics === 'function') renderAnalytics(); }]
    .forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
};

var _openSubN = openOfficialSubTab;
openOfficialSubTab = function (id) {
  _openSubN.apply(this, arguments);
  if (id === 'tabAnnounce' && typeof renderAnnounceTab === 'function') renderAnnounceTab();
  if (id === 'tabAnalytics' && typeof renderAnalytics === 'function') renderAnalytics();
};

updateBadges();
