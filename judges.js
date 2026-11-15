/* MMO Arts Fest — Judges slips, 4 per A4 page (2 x 2), with item filled in or left blank */
function judgeSlipHtml(cat, item) {
  var rows = 'ABCDEFGHI'.split('').map(function (l) {
    return '<tr><td class="code">' + l + '</td><td></td><td></td><td></td></tr>';
  }).join('');
  var catHtml = cat ? '<b>' + cat + '</b>' : '<span class="line"></span>';
  var itemHtml = item ? '<b>' + item + '</b>' : '<span class="line"></span>';
  return '<div class="slip"><div class="in">' +
    '<div class="hdr"><div class="t1">MMO Arts Fest</div><div class="t2">JUDGES EVALUATION SLIP</div></div>' +
    '<div class="meta"><div><span>CATEGORY</span>' + catHtml + '</div><div><span>ITEM</span>' + itemHtml + '</div></div>' +
    '<table><thead><tr><th style="width:15mm">CODE</th><th>MARK</th><th style="width:16mm">GRADE</th><th style="width:16mm">RANK</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<div class="sign"><div>Judge: ____________________</div><div>Sign: ______________</div></div>' +
    '</div></div>';
}

function openJudgesDoc(cat, item, pages) {
  var one = judgeSlipHtml(cat, item);
  var pg = '<div class="page">' + one + one + one + one + '</div>';
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
    '.t2{font-size:6.5pt;letter-spacing:1.6px;color:#0b5d4b;font-weight:700;margin-top:.5mm}' +
    '.meta{display:flex;gap:2mm;margin:2.5mm 0}' +
    '.meta div{flex:1;border:.3mm solid #0b5d4b;border-radius:1mm;padding:1.2mm 1.8mm;font-size:8pt;min-height:9mm}' +
    '.meta span{display:block;font-size:5.5pt;color:#64748b;letter-spacing:.8px}' +
    '.line{display:block;border-bottom:.25mm solid #64748b;height:4mm}' +
    'table{width:100%;border-collapse:collapse;flex:1}' +
    'th,td{border:.3mm solid #0b5d4b;text-align:center}' +
    'th{background:#062a24;color:#f4e8c8;font-size:6.5pt;height:5.5mm;letter-spacing:.5px}' +
    'td.code{font-size:11pt;font-weight:700;background:#f6f3ea;color:#062a24}' +
    '.sign{display:flex;justify-content:space-between;margin-top:2.5mm;font-size:6.8pt;font-weight:600;color:#0b5d4b}' +
    '</style></head><body>' + body +
    '<script>window.onload=function(){setTimeout(function(){window.print()},600)}<\/script></body></html>');
  win.document.close();
}

function judgePageCount() {
  var n = parseInt((document.getElementById('judgePages') || {}).value, 10);
  return n > 0 ? Math.min(n, 50) : 1;
}

/* selected category + item filled in */
function printJudgesSlip() {
  var cat = document.getElementById('judgeCatSelect').value;
  var item = document.getElementById('judgeItemSelect').value;
  if (!item) { alert('Select a competition item first, or use "Print Blank Slips".'); return; }
  openJudgesDoc(cat, item, judgePageCount());
}

/* category and item left empty to write by hand */
function printBlankJudgesSlips() {
  openJudgesDoc('', '', judgePageCount());
}
