/* MMO Arts Fest — Judges slips, 4 per A4 page (2 x 2).
   Slip 1 can be the "candidate-name slip": code column blank, candidate names listed, then mark / grade / rank.
   The other 3 slips are the normal code slips (A to I). Blank mode prints 4 empty slips. */

function judgeNames(cat, item) {
  if (!item) return [];
  if (cat === 'GENERAL') return REP_TEAMS.map(function (t) { return { name: 'Team ' + t, reg: '' }; });
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
  return '<div class="hdr"><div class="t1">MMO Arts Fest</div><div class="t2">JUDGES EVALUATION SLIP' + (tag ? ' — ' + tag : '') + '</div></div>' +
    '<div class="meta"><div><span>CATEGORY</span>' + catHtml + '</div><div><span>ITEM</span>' + itemHtml + '</div></div>';
}
var JUDGE_SIGN = '<div class="sign"><div>Judge: ____________________</div><div>Sign: ______________</div></div>';

function judgeSlipHtml(cat, item) {
  var rows = 'ABCDEFGHI'.split('').map(function (l) { return '<tr><td class="code">' + l + '</td><td></td><td></td><td></td></tr>'; }).join('');
  return '<div class="slip"><div class="in">' + judgeHead(cat, item, '') +
    '<table><thead><tr><th style="width:15mm">CODE</th><th>MARK</th><th style="width:16mm">GRADE</th><th style="width:16mm">RANK</th></tr></thead><tbody>' + rows + '</tbody></table>' + JUDGE_SIGN + '</div></div>';
}

/* slip with candidate names, code column left blank */
function judgeNamesSlipHtml(cat, item, names) {
  var n = Math.min(Math.max(names.length, 9), 14), rows = '';
  for (var i = 0; i < n; i++) {
    var c = names[i];
    rows += '<tr><td></td><td class="nm">' + (c ? esc(c.name) + (c.reg ? ' <small>(' + esc(c.reg) + ')</small>' : '') : '') + '</td><td></td><td></td><td></td></tr>';
  }
  return '<div class="slip"><div class="in">' + judgeHead(cat, item, 'NAME SLIP') +
    '<table><thead><tr><th style="width:12mm">CODE</th><th>CANDIDATE</th><th style="width:15mm">MARK</th><th style="width:12mm">GRADE</th><th style="width:12mm">RANK</th></tr></thead><tbody>' + rows + '</tbody></table>' + JUDGE_SIGN + '</div></div>';
}

/* builds A4 pages (4 slips each) from a list of slip HTML strings; empty spaces stay blank */
function openSlipDoc(slips) {
  var body = '';
  for (var i = 0; i < slips.length; i += 4) {
    var chunk = slips.slice(i, i + 4);
    while (chunk.length < 4) chunk.push('<div class="slip"></div>');
    body += '<div class="page">' + chunk.join('') + '</div>';
  }
  var win = window.open('', '_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Judges Slips - MMO Arts Fest 2k26</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">' +
    '<style>' +
    '@page{size:A4 portrait;margin:0}' +
    '*{box-sizing:border-box;margin:0;padding:0;font-family:Poppins,"Segoe UI",sans-serif}' +
    'html,body{width:210mm;background:#fff;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.page{width:210mm;height:297mm;display:grid;grid-template-columns:105mm 105mm;grid-template-rows:148.5mm 148.5mm;page-break-after:always;overflow:hidden}' +
    '.page:last-child{page-break-after:auto}' +
    '.slip{padding:5mm;border:.25mm dashed #94a3b8;overflow:hidden}.slip:empty{border:none}' +
    '.in{height:100%;border:.5mm solid #0b5d4b;outline:.2mm solid #c9a24b;outline-offset:-1.4mm;padding:3.5mm 4mm 3mm;display:flex;flex-direction:column}' +
    '.hdr{text-align:center;border-bottom:.4mm solid #c9a24b;padding-bottom:1.5mm}' +
    '.t1{font-family:Cinzel,serif;font-size:13pt;letter-spacing:1.5px;color:#062a24;text-transform:uppercase}' +
    '.t2{font-size:6.2pt;letter-spacing:1.4px;color:#0b5d4b;font-weight:700;margin-top:.5mm}' +
    '.meta{display:flex;gap:2mm;margin:2.5mm 0}' +
    '.meta div{flex:1;border:.3mm solid #0b5d4b;border-radius:1mm;padding:1.2mm 1.8mm;font-size:8pt;min-height:9mm}' +
    '.meta span{display:block;font-size:5.5pt;color:#64748b;letter-spacing:.8px}' +
    '.line{display:block;border-bottom:.25mm solid #64748b;height:4mm}' +
    'table{width:100%;border-collapse:collapse;flex:1}' +
    'th,td{border:.3mm solid #0b5d4b;text-align:center}' +
    'th{background:#062a24;color:#f4e8c8;font-size:6.5pt;height:5.5mm;letter-spacing:.5px}' +
    'td.code{font-size:11pt;font-weight:700;background:#f6f3ea;color:#062a24}' +
    'td.nm{text-align:left;font-size:7.5pt;padding:0 1.5mm;font-weight:600}td.nm small{font-weight:400;color:#64748b;font-size:6pt}' +
    '.sign{display:flex;justify-content:space-between;margin-top:2.5mm;font-size:6.8pt;font-weight:600;color:#0b5d4b}' +
    '</style></head><body>' + body +
    '<script>window.onload=function(){setTimeout(function(){window.print()},600)}<\/script></body></html>');
  win.document.close();
}

function openJudgesDoc(cat, item, pages, withNames) {
  var plain = judgeSlipHtml(cat, item);
  var first = withNames ? judgeNamesSlipHtml(cat, item, judgeNames(cat, item)) : plain;
  var one = [first, plain, plain, plain], all = [];
  for (var i = 0; i < pages; i++) all = all.concat(one);
  openSlipDoc(all);
}

function judgePageCount() {
  var n = parseInt((document.getElementById('judgePages') || {}).value, 10);
  return n > 0 ? Math.min(n, 50) : 1;
}

/* selected category + item filled in (slip 1 = candidate names, if ticked) */
function printJudgesSlip() {
  var cat = document.getElementById('judgeCatSelect').value;
  var item = document.getElementById('judgeItemSelect').value;
  if (!item) { alert('Select a competition item first, or use "Print Blank Slips".'); return; }
  var cb = document.getElementById('judgeNamesSlip');
  openJudgesDoc(cat, item, judgePageCount(), !cb || cb.checked);
}

/* nothing filled in: write by hand */
function printBlankJudgesSlips() { openJudgesDoc('', '', judgePageCount(), false); }

/* ================= CUSTOM SLIP SHEET: mix programs on one A4 ================= */
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

function jcAddRow() {
  var last = jcRows[jcRows.length - 1];
  jcRows.push({ cat: last ? last.cat : 'SENIOR', item: '', count: 2, named: true });
  jcRender();
}
function jcRemoveRow(i) { jcRows.splice(i, 1); jcRender(); }
function jcSet(i, field, val) {
  if (field === 'count') val = Number(val);
  if (field === 'named') val = !!val;
  jcRows[i][field] = val;
  if (field === 'cat') jcRows[i].item = '';
  jcRender();
}

function jcRender() {
  var box = document.getElementById('jcRows');
  if (!box) return;
  if (!jcRows.length) jcRows.push({ cat: 'SENIOR', item: '', count: 4, named: true });
  var cats = [['SENIOR', 'Senior'], ['JUNIOR', 'Junior'], ['SUB-JUNIOR', 'Sub-Junior'], ['GENERAL', 'General']];
  box.innerHTML = jcRows.map(function (r, i) {
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;background:#fff;border:1px solid #e6dfcc;border-radius:10px;padding:8px;">' +
      '<select style="width:auto;margin:0;" onchange="jcSet(' + i + ',\'cat\',this.value)">' + cats.map(function (c) { return '<option value="' + c[0] + '"' + (r.cat === c[0] ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select>' +
      '<select style="flex:1;min-width:150px;margin:0;" onchange="jcSet(' + i + ',\'item\',this.value)"><option value="">— blank (write by hand) —</option>' +
      jcItems(r.cat).map(function (n) { return '<option value="' + esc(n) + '"' + (r.item === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select>' +
      '<label style="font-size:12px;font-weight:600;white-space:nowrap;">Slips <select style="width:auto;margin:0;display:inline-block;" onchange="jcSet(' + i + ',\'count\',this.value)">' +
      [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return '<option' + (r.count === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' +
      '<label style="font-size:12px;white-space:nowrap;"><input type="checkbox" style="width:auto;margin:0;" ' + (r.named ? 'checked ' : '') + 'onchange="jcSet(' + i + ',\'named\',this.checked)"> name slip first</label>' +
      '<button type="button" onclick="jcRemoveRow(' + i + ')" style="padding:6px 10px;background:#ef4444;color:#fff;border:none;border-radius:6px;cursor:pointer;">✕</button></div>';
  }).join('');
  jcPreview();
}

function jcPreview() {
  var pv = document.getElementById('jcPreview');
  if (!pv) return;
  var labels = [];
  jcRows.forEach(function (r) {
    for (var k = 0; k < r.count; k++) labels.push((r.item ? r.item : 'Blank') + (r.item ? ' · ' + r.cat : '') + (r.item && k === 0 && r.named ? ' (names)' : ''));
  });
  var rep = Math.max(1, parseInt((document.getElementById('jcRepeat') || {}).value, 10) || 1), all = [];
  for (var i = 0; i < rep; i++) all = all.concat(labels);
  var pages = Math.max(1, Math.ceil(all.length / 4)), html = '';
  for (var p = 0; p < pages; p++) {
    html += '<div style="display:inline-block;margin:0 10px 10px 0;"><div style="font-size:11px;color:#64748b;">Page ' + (p + 1) + '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;width:230px;height:160px;background:#e6dfcc;padding:3px;border-radius:6px;">';
    for (var s = 0; s < 4; s++) {
      var t = all[p * 4 + s];
      html += '<div style="background:' + (t ? '#fff' : '#f6f3ea') + ';border:1px dashed #94a3b8;font-size:9.5px;padding:4px;overflow:hidden;line-height:1.25;">' + (t ? esc(t) : '<span style="color:#cbd5e1;">empty</span>') + '</div>';
    }
    html += '</div></div>';
  }
  pv.innerHTML = '<div style="font-size:12px;margin-bottom:6px;"><b>' + all.length + '</b> slip(s) on <b>' + pages + '</b> A4 page(s)</div>' + html;
}

function printCustomSlips() {
  var s = jcSlips();
  if (!s.length) { alert('Please add at least one program.'); return; }
  openSlipDoc(s);
}

/* refresh the custom-sheet rows whenever the Judges tab opens or programs change */
var _ujpdJ = updateJudgeProgramDropdown;
updateJudgeProgramDropdown = function () { _ujpdJ.apply(this, arguments); jcRender(); };
