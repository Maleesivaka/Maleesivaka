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

function openJudgesDoc(cat, item, pages, withNames) {
  var plain = judgeSlipHtml(cat, item);
  var first = withNames ? judgeNamesSlipHtml(cat, item, judgeNames(cat, item)) : plain;
  var pg = '<div class="page">' + first + plain + plain + plain + '</div>';
  var body = ''; for (var i = 0; i < pages; i++) body += pg;
  var win = window.open('', '_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Judges Slips - MMO Arts Fest 2k26</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">' +
    '<style>' +
    '@page{size:A4 portrait;margin:0}' +
    '*{box-sizing:border-box;margin:0;padding:0;font-family:Poppins,"Segoe UI",sans-serif}' +
    'html,body{width:210mm;background:#fff;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.page{width:210mm;height:297mm;display:grid;grid-template-columns:105mm 105mm;grid-template-rows:148.5mm 148.5mm;page-break-after:always;overflow:hidden}' +
    '.page:last-child{page-break-after:auto}' +
    '.slip{padding:5mm;border:.25mm dashed #94a3b8;overflow:hidden}' +
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
