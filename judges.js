var JUDGE_LETTERS = 'ABCDEFGHIJKLMNOP';
function judgeCodeCount() {
  var e = document.getElementById('judgeCodes'), n = parseInt(e && e.value, 10);
  return n >= 1 && n <= 16 ? n : 9;
}
function judgeNames(cat, item) {
  if (!item) return [];
  if (cat === 'GENERAL') return ['Qahira', 'Qudsiya', 'Qurthuba'].map(function (t) { return { name: 'Team ' + t, reg: '' }; });
  var p = festPrograms.filter(function (x) { return x.name === item && x.category === cat; })[0];
  if (!p) return [];
  var k = progKey(p);
  return festCandidates.filter(function (c) { return c.category === cat && (c.entries || []).indexOf(k) >= 0; })
    .sort(function (a, b) { return String(a.team).localeCompare(String(b.team)) || String(a.name).localeCompare(String(b.name)); })
    .map(function (c) { return { name: c.name, reg: c.regNo }; });
}
function judgeHead(cat, item, tag) {
  var catHtml = cat ? '<b>' + esc(cat) + '</b>' : '<span class="line"></span>';
  var itemHtml = item ? '<b>' + esc(item) + '</b>' : '<span class="line"></span>';
  return '<div class="hdr">' + festTitleHtml(11, 5) + '<div class="t2">JUDGES EVALUATION SLIP' + (tag ? ' — ' + tag : '') + '</div></div>' +
    '<div class="meta"><div><span>CATEGORY</span>' + catHtml + '</div><div><span>ITEM</span>' + itemHtml + '</div></div>';
}
var JUDGE_SIGN = '<div class="sign"><div>Judge: ____________________</div><div>Sign: ______________</div></div>';
function judgeSlipHtml(cat, item) {
  var rows = JUDGE_LETTERS.slice(0, judgeCodeCount()).split('').map(function (l) { return '<tr><td class="code">' + l + '</td><td></td><td></td><td></td></tr>'; }).join('');
  return '<div class="slip"><div class="in">' + judgeHead(cat, item, '') +
    '<table><thead><tr><th style="width:15mm">CODE</th><th>MARK</th><th style="width:16mm">GRADE</th><th style="width:16mm">RANK</th></tr></thead><tbody>' + rows + '</tbody></table>' + JUDGE_SIGN + '</div></div>';
}
function judgeNamesSlipHtml(cat, item, names) {
  var n = Math.min(Math.max(names.length, judgeCodeCount()), 16), rows = '';
  for (var i = 0; i < n; i++) {
    var c = names[i];
    rows += '<tr><td></td><td class="nm">' + (c ? esc(c.name) + (c.reg ? ' <small>(' + esc(c.reg) + ')</small>' : '') : '') + '</td><td></td><td></td><td></td></tr>';
  }
  return '<div class="slip"><div class="in">' + judgeHead(cat, item, 'NAME SLIP') +
    '<table><thead><tr><th style="width:12mm">CODE</th><th>CANDIDATE</th><th style="width:15mm">MARK</th><th style="width:12mm">GRADE</th><th style="width:12mm">RANK</th></tr></thead><tbody>' + rows + '</tbody></table>' + JUDGE_SIGN + '</div></div>';
}
function openSlipDoc(slips) {
  var body = '';
  for (var i = 0; i < slips.length; i += 4) {
    var chunk = slips.slice(i, i + 4);
    while (chunk.length < 4) chunk.push('<div class="slip"></div>');
    body += '<div class="page">' + chunk.join('') + '</div>';
  }
  var win = window.open('', '_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Judges Slips</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box;margin:0;padding:0;font-family:"Segoe UI",sans-serif}html,body{width:210mm;background:#fff;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{width:210mm;height:297mm;display:grid;grid-template-columns:105mm 105mm;grid-template-rows:148.5mm 148.5mm;page-break-after:always;overflow:hidden}.slip{padding:5mm;border:.25mm dashed #94a3b8;overflow:hidden}.slip:empty{border:none}.in{height:100%;border:.5mm solid #217346;outline:.2mm solid #33A852;outline-offset:-1.4mm;padding:3.5mm 4mm 3mm;display:flex;flex-direction:column}.hdr{text-align:center;border-bottom:.4mm solid #33A852;padding-bottom:1.5mm}.t2{font-size:6.2pt;letter-spacing:1.4px;color:#217346;font-weight:700;margin-top:.5mm}.meta{display:flex;gap:2mm;margin:2.5mm 0}.meta div{flex:1;border:.3mm solid #217346;border-radius:1mm;padding:1.2mm 1.8mm;font-size:8pt;min-height:9mm}.meta span{display:block;font-size:5.5pt;color:#64748b}.line{display:block;border-bottom:.25mm solid #64748b;height:4mm}table{width:100%;border-collapse:collapse;flex:1}th,td{border:.3mm solid #217346;text-align:center}th{background:#09090b;color:#fde68a;font-size:6.5pt;height:5.5mm}td.code{font-size:10pt;font-weight:700;background:#F3F4F6}td.nm{text-align:left;font-size:7.5pt;padding:0 1.5mm;font-weight:600}.sign{display:flex;justify-content:space-between;margin-top:2.5mm;font-size:6.8pt;font-weight:600;color:#217346}</style></head><body>' + body + '<script>window.onload=function(){setTimeout(function(){window.print()},500)}<\/script></body></html>');
  win.document.close();
}
function openJudgesDoc(cat, item, pages, withNames) {
  var plain = judgeSlipHtml(cat, item);
  var first = withNames ? judgeNamesSlipHtml(cat, item, judgeNames(cat, item)) : plain;
  var one = [first, plain, plain, plain], all = [];
  for (var i = 0; i < pages; i++) all = all.concat(one);
  openSlipDoc(all);
}
function judgePageCount() { var n = parseInt((document.getElementById('judgePages') || {}).value, 10); return n > 0 ? Math.min(n, 50) : 1; }
function printJudgesSlip() {
  var cat = document.getElementById('judgeCatSelect').value, item = document.getElementById('judgeItemSelect').value;
  if (!item) { alert('Select a competition item first.'); return; }
  var cb = document.getElementById('judgeNamesSlip');
  logAdminAction('Printed judges slips for ' + item + ' (' + cat + ')');
  openJudgesDoc(cat, item, judgePageCount(), !cb || cb.checked);
}
function printBlankJudgesSlips() { openJudgesDoc('', '', judgePageCount(), false); }
var jcRows = [];
function jcItems(cat) {
  var names = [];
  festPrograms.forEach(function (p) {
    var ok = cat === 'GENERAL' ? (p.type === 'General' || p.category === 'GENERAL') : p.category === cat;
    if (ok && names.indexOf(p.name) < 0) names.push(p.name);
  });
  return names;
}
function jcSlips() {
  var out = [];
  jcRows.forEach(function (r) {
    for (var k = 0; k < r.count; k++) {
      if (!r.item) out.push(judgeSlipHtml('', ''));
      else if (k === 0 && r.named) out.push(judgeNamesSlipHtml(r.cat, r.item, judgeNames(r.cat, r.item)));
      else out.push(judgeSlipHtml(r.cat, r.item));
    }
  });
  var rep = Math.max(1, parseInt((document.getElementById('jcRepeat') || {}).value, 10) || 1), all = [];
  for (var i = 0; i < rep; i++) all = all.concat(out);
  return all;
}
function jcAddRow() { var last = jcRows[jcRows.length - 1]; jcRows.push({ cat: last ? last.cat : 'SENIOR', item: '', count: 2, named: true }); jcRender(); }
function jcRemoveRow(i) { jcRows.splice(i, 1); jcRender(); }
function jcSet(i, field, val) { if (field === 'count') val = Number(val); if (field === 'named') val = !!val; jcRows[i][field] = val; if (field === 'cat') jcRows[i].item = ''; jcRender(); }
function jcRender() {
  var box = document.getElementById('jcRows'); if (!box) return;
  if (!jcRows.length) jcRows.push({ cat: 'SENIOR', item: '', count: 4, named: true });
  var cats = [['SENIOR', 'Senior'], ['JUNIOR', 'Junior'], ['SUB-JUNIOR', 'Sub-Junior'], ['GENERAL', 'General']];
  box.innerHTML = jcRows.map(function (r, i) {
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">' +
      '<select style="width:auto;margin:0;" onchange="jcSet(' + i + ','cat',this.value)">' + cats.map(function (c) { return '<option value="' + c[0] + '"' + (r.cat === c[0] ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select>' +
      '<select style="flex:1;min-width:150px;margin:0;" onchange="jcSet(' + i + ','item',this.value)"><option value="">— blank —</option>' + jcItems(r.cat).map(function (n) { return '<option value="' + esc(n) + '"' + (r.item === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select>' +
      '<select style="width:auto;margin:0;" onchange="jcSet(' + i + ','count',this.value)">' + [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return '<option' + (r.count === n ? ' selected' : '') + '>' + n + ' slip(s)</option>'; }).join('') + '</select>' +
      '<label class="checkbox-inline" style="margin:0;"><input type="checkbox" ' + (r.named ? 'checked ' : '') + 'onchange="jcSet(' + i + ','named',this.checked)"> Name slip 1st</label>' +
      '<button type="button" onclick="jcRemoveRow(' + i + ')" class="btn-danger-sm">✕</button></div>';
  }).join('');
  jcPreview();
}
function jcPreview() {
  var pv = document.getElementById('jcPreview'); if (!pv) return;
  var s = jcSlips();
  pv.innerHTML = '<span class="muted-text">Total slips queued: <b>' + s.length + '</b> (' + Math.max(1, Math.ceil(s.length / 4)) + ' A4 page(s))</span>';
}
function printCustomSlips() { var s = jcSlips(); if (!s.length) return; openSlipDoc(s); }
var _ujpdJ = updateJudgeProgramDropdown;
updateJudgeProgramDropdown = function () { _ujpdJ.apply(this, arguments); jcRender(); };
