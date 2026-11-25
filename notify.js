(function () {
  var st = document.createElement('style');
  st.textContent = '#toastBox{position:fixed;top:78px;right:16px;z-index:6000;width:340px;max-width:calc(100vw - 32px);display:flex;flex-direction:column;gap:8px;pointer-events:none}' +
    '.toast{pointer-events:auto;background:#FFFFFF;color:#202124;border-radius:12px;border:1px solid #E9EAED;border-left:4px solid #217346;padding:11px 32px 11px 14px;position:relative;box-shadow:0 10px 25px rgba(32,33,36,0.12);cursor:pointer;font-size:12.5px}' +
    '.toast b{display:block;color:#202124;margin-bottom:2px}.toast i.x{position:absolute;top:6px;right:10px;font-style:normal;color:#4B5565;font-size:16px}' +
    '.notice-item{display:flex;gap:12px;padding:14px 16px;border:1px solid #E9EAED;border-radius:12px;margin-bottom:10px;background:#FFFFFF}' +
    '.notice-item.unread{border-color:#217346;background:#E8F4EC}';
  document.head.appendChild(st);
})();
function showToast(title, msg) {
  var box = document.getElementById('toastBox');
  if (!box) { box = document.createElement('div'); box.id = 'toastBox'; document.body.appendChild(box); }
  var t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = '<i class="x">×</i>' + (title ? '<b>' + esc(title) + '</b>' : '') + '<span>' + esc(msg) + '</span>';
  t.onclick = function () { if (t.parentNode) t.parentNode.removeChild(t); };
  box.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 6000);
}
window.alert = function (m) { showToast('MMO Campus Arts Fest', String(m)); };
function addNotice(type, title, text) {
  festNotices.push({ id: Date.now() + Math.floor(Math.random() * 999), time: new Date().toISOString(), type: type, title: title, text: text });
  if (festNotices.length > 100) festNotices = festNotices.slice(-100);
  localStorage.setItem('MEELAD_NOTICES', JSON.stringify(festNotices));
}
function markResultsKnown() {}
function updateBadges() {
  var n = festNotices.length;
  ['bellCount', 'notifBadge', 'railBadge'].forEach(function (id) { var el = document.getElementById(id); if (el) { el.textContent = n; el.style.display = n ? 'inline-block' : 'none'; } });
}
function renderNoticeList() {
  var box = document.getElementById('noticeList'); if (!box) return;
  var list = festNotices.slice().sort(function (a, b) { return b.time.localeCompare(a.time); });
  box.innerHTML = !list.length ? '<div class="surface-card"><p class="muted-text">No notifications yet.</p></div>' :
    list.map(function (n) { return '<div class="notice-item"><div><b style="color:#217346;">' + esc(n.title) + '</b><p style="font-size:13px;margin:2px 0;color:#202124;">' + esc(n.text) + '</p><small class="muted-text">' + new Date(n.time).toLocaleString() + '</small></div></div>'; }).join('');
}
var _showViewN = showView;
showView = function (id) { _showViewN.apply(this, arguments); if (id === 'notificationsView') renderNoticeList(); if (id === 'toppersView' && typeof renderToppers === 'function') renderToppers(); };
var _refreshAllN = refreshAll;
refreshAll = function () { _refreshAllN.apply(this, arguments); updateBadges(); renderNoticeList(); if (typeof renderToppers === 'function') renderToppers(); if (typeof renderAnnounceTab === 'function') renderAnnounceTab(); if (typeof renderAnalytics === 'function') renderAnalytics(); };
updateBadges();
