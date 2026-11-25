(function () {
  var pt = document.getElementById('progType');
  if (pt && !pt.querySelector('option[value="Non-Stage"]')) {
    pt.insertAdjacentHTML('beforeend', '<option value="Non-Stage">Non-Stage (നോൺ സ്റ്റേജ്)</option>');
  }
})();

function printEntryFormPDF() {
  var teams = ["Qahira", "Qudsiya", "Qurthuba"];
  var categories = ["SENIOR", "JUNIOR", "SUB-JUNIOR"];
  var pmax = function (p) { return typeof progMax === 'function' ? progMax(p) : (p.type === 'Individual' ? 3 : 0); };
  var COLS_PER_PAGE = 16;

  var selTeam = document.getElementById('searchTeam') ? document.getElementById('searchTeam').value : "";
  var selCat = document.getElementById('searchCategory') ? document.getElementById('searchCategory').value : "";
  var printTeams = selTeam ? [selTeam] : teams;
  var printCats = selCat ? [selCat] : categories;

  var teamColor = { Qahira: "#0284c7", Qudsiya: "#059669", Qurthuba: "#ef4444" };
  var box = '<span class="box"></span>';
  var pages = "";

  printTeams.forEach(function (team) {
    printCats.forEach(function (cat) {
      var members = festCandidates.filter(function (c) { return c.team === team && c.category === cat; });
      var inCat = festPrograms.filter(function (p) { return p.category === cat; });
      var gen = festPrograms.filter(function (p) { return p.type === 'General' || p.category === 'GENERAL'; });
      var progs = []
        .concat(inCat.filter(function (p) { return p.type === 'Individual'; }).map(function (p) { p._g = 'INDIVIDUAL'; return p; }))
        .concat(inCat.filter(function (p) { return p.type === 'Group'; }).map(function (p) { p._g = 'GROUP'; return p; }))
        .concat(inCat.filter(function (p) { return p.type === 'Non-Stage'; }).map(function (p) { p._g = 'NON-STAGE'; return p; }))
        .concat(gen.map(function (p) { p._g = 'GENERAL'; return p; }));

      var rowsCount = Math.max(members.length, 10);
      var chunks = [];
      for (var i = 0; i < progs.length; i += COLS_PER_PAGE) chunks.push(progs.slice(i, i + COLS_PER_PAGE));
      if (chunks.length === 0) chunks.push([]);

      chunks.forEach(function (chunk, ci) {
        var groupHead = "", last = null, span = 0;
        chunk.forEach(function (p, idx) {
          if (p._g !== last) {
            if (last !== null) groupHead += '<th colspan="' + span + '" class="grp">' + last + '</th>';
            last = p._g; span = 0;
          }
          span++;
          if (idx === chunk.length - 1) groupHead += '<th colspan="' + span + '" class="grp">' + last + '</th>';
        });

        var progHead = chunk.map(function (p) {
          var m = pmax(p); return '<th class="vt"><div>' + p.name + (m > 0 ? '  (max ' + m + ')' : '') + '</div></th>';
        }).join('');

        var body = "";
        for (var r = 0; r < rowsCount; r++) {
          var m = members[r];
          body += '<tr><td class="c">' + (r + 1) + '</td><td class="reg">' + (m ? m.regNo : '') + '</td><td class="nm">' + (m ? m.name : '') + '</td>' +
            chunk.map(function () { return '<td class="c">' + box + '</td>'; }).join('') +
            '<td class="c tot"></td></tr>';
        }

        var countRow = '<tr class="cnt"><td colspan="3" class="nm"><b>Total ticks per item</b></td>' +
          chunk.map(function (p) {
            var m = pmax(p);
            return m > 0 ? '<td class="c lim"><span style="font-size:9px;color:#64748b;">/ ' + m + '</span></td>' : '<td class="c" style="color:#94a3b8;">–</td>';
          }).join('') + '<td></td></tr>';

        pages += '<div class="page">' +
          '<div class="hdr">' + festTitleHtml(17, 8) +
          '<div class="badge" style="background:' + (teamColor[team] || '#1e3a8a') + '">OFFICIAL ENTRY FORM — TICK TO REGISTER</div></div>' +
          '<div class="meta"><div><b>TEAM:</b> ' + team.toUpperCase() + '</div><div><b>CATEGORY:</b> ' + cat + '</div>' +
          '<div><b>DATE:</b> ____ / ____ / 2026</div><div><b>SHEET:</b> ' + (ci + 1) + ' / ' + chunks.length + '</div></div>' +
          '<div class="rules"><b>How to fill:</b> Put a tick (✓) in the box for every item a candidate will take part in. ' +
          '<b>Each item shows its maximum number of candidates per team in the column heading (max N). Do not tick more than that.</b> Items with no "max" have no limit.</div>' +
          (chunk.length === 0 ? '<p style="color:#b91c1c;padding:12px;">No programs have been added for this category yet.</p>' :
          '<table><thead><tr><th rowspan="2" style="width:7mm">#</th><th rowspan="2" style="width:24mm">Reg No</th><th rowspan="2" style="width:52mm">Candidate Name</th>' +
          groupHead + '<th rowspan="2" style="width:12mm">Total</th></tr><tr>' + progHead + '</tr></thead><tbody>' + body + countRow + '</tbody></table>') +
          '<div class="sign"><div>Team Captain Sign: ____________________</div><div>Fest Convener Sign: ____________________</div></div>' +
          '</div>';
      });
    });
  });

  var win = window.open('', '_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Entry Form - MMO Arts Fest 2k26</title>' +
    '<style>@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box;font-family:"Segoe UI",Tahoma,sans-serif}body{margin:0;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.page{page-break-after:always;border:2px solid #217346;border-radius:6px;padding:6mm;min-height:190mm}.hdr{text-align:center;border-bottom:2px solid #33A852;padding-bottom:4px;margin-bottom:6px}' +
    '.badge{display:inline-block;color:#fff;font-size:10px;font-weight:700;padding:2px 12px;border-radius:10px;margin-top:3px}.meta{display:flex;justify-content:space-between;background:#F3F4F6;border:1px solid #f0d27a;padding:5px 10px;font-size:12px;margin-bottom:5px}' +
    '.rules{font-size:10.5px;background:#fff8e1;border-left:4px solid #33A852;padding:5px 8px;margin-bottom:6px}table{width:100%;border-collapse:collapse;table-layout:fixed}' +
    'th,td{border:1px solid #64748b;padding:2px 3px;font-size:11px;height:8.5mm}th{background:#14110b;color:#ffe9a8;font-size:10px}th.grp{background:#217346;font-size:9px}' +
    'th.vt{height:30mm;padding:2px;background:#E8F4EC;color:#14110b}th.vt div{writing-mode:vertical-rl;transform:rotate(180deg);margin:0 auto;font-size:10px;max-height:28mm;overflow:hidden}' +
    'td.c{text-align:center}td.reg{font-weight:700;font-size:10px}td.nm{font-size:11px}.box{display:inline-block;width:5mm;height:5mm;border:1.5px solid #0f172a;border-radius:1px;vertical-align:middle}' +
    'tr.cnt td{background:#F3F4F6}td.lim{background:#fff8e1}.sign{display:flex;justify-content:space-between;margin-top:14px;font-size:11.5px;font-weight:700;color:#217346}</style>' +
    '</head><body>' + pages + '<script>window.print();<\/script></body></html>');
  win.document.close();
}
