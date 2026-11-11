/* MMO Arts Fest — Judges slip, exact A4 portrait (210 x 297 mm), one page */
function printJudgesSlip() {
  var cat = document.getElementById('judgeCatSelect').value;
  var item = document.getElementById('judgeItemSelect').value || "______________________";
  var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  var win = window.open('', '_blank');

  var rows = letters.map(function (l) {
    return '<tr><td class="code">' + l + '</td><td></td><td></td><td></td><td></td></tr>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Judges Slip - MMO Arts Fest 2k26</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">' +
    '<style>' +
    '@page{size:A4 portrait;margin:0}' +
    '*{box-sizing:border-box;margin:0;padding:0;font-family:Poppins,"Segoe UI",sans-serif}' +
    'html,body{width:210mm;height:297mm;background:#fff;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.sheet{width:210mm;height:297mm;padding:10mm;overflow:hidden}' +
    '.frame{height:277mm;border:2px solid #0b5d4b;outline:1px solid #c9a24b;outline-offset:-6px;padding:11mm 10mm 9mm;display:flex;flex-direction:column}' +
    '.hdr{text-align:center;border-bottom:2px solid #c9a24b;padding-bottom:4mm}' +
    '.t1{font-family:Cinzel,serif;font-size:27pt;color:#062a24;letter-spacing:3px;text-transform:uppercase}' +
    '.t2{font-size:10pt;letter-spacing:4px;color:#0b5d4b;font-weight:600;margin-top:1mm}' +
    '.t3{display:inline-block;margin-top:3mm;background:#0b5d4b;color:#fff;font-size:9.5pt;font-weight:700;padding:1.2mm 6mm;border-radius:10mm;letter-spacing:1.5px}' +
    '.meta{display:flex;gap:6mm;margin:6mm 0 5mm}' +
    '.meta div{flex:1;border:1.5px solid #0b5d4b;border-radius:2mm;padding:3mm 4mm;font-size:11pt}' +
    '.meta span{display:block;font-size:8pt;color:#64748b;letter-spacing:1px;margin-bottom:.5mm}' +
    'table{width:100%;border-collapse:collapse;flex:1}' +
    'th,td{border:1.4px solid #0b5d4b;text-align:center}' +
    'th{background:#062a24;color:#f4e8c8;font-size:9.5pt;letter-spacing:1px;height:10mm}' +
    'tr.r{height:19.5mm}' +
    'td.code{font-size:20pt;font-weight:700;background:#f6f3ea;width:22mm;color:#062a24}' +
    '.sign{display:flex;justify-content:space-between;margin-top:7mm;font-size:10pt;font-weight:600;color:#0b5d4b}' +
    '.note{font-size:8pt;color:#64748b;margin-top:3mm;text-align:center}' +
    '</style></head><body><div class="sheet"><div class="frame">' +
    '<div class="hdr"><div class="t1">MMO Arts Fest</div><div class="t2">CAMPUS ARTS FESTIVAL 2K26</div><div class="t3">OFFICIAL JUDGES EVALUATION SLIP</div></div>' +
    '<div class="meta"><div><span>CATEGORY / SCOPE</span><b>' + cat + '</b></div><div><span>COMPETITION ITEM</span><b>' + item + '</b></div></div>' +
    '<table><thead><tr><th style="width:22mm">CODE</th><th style="width:38mm">MARK / SCORE</th><th style="width:26mm">GRADE</th><th style="width:26mm">RANK</th><th>REMARKS</th></tr></thead>' +
    '<tbody>' + rows.replace(/<tr>/g, '<tr class="r">') + '</tbody></table>' +
    '<div class="sign"><div>Judge Name: ______________________</div><div>Signature: ______________________</div></div>' +
    '<div class="note">Marks must be written clearly. Do not overwrite — strike through and initial any correction.</div>' +
    '</div></div><script>window.onload=function(){setTimeout(function(){window.print()},600)}<\/script></body></html>';
  win.document.write(html);
  win.document.close();
}
