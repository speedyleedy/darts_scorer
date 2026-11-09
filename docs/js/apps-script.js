/**
 * The Google Apps Script shown in Setup (also the code you paste into your Sheet).
 * Keep it free of backticks and ${} so it can live in a template string.
 */

const SCRIPT = `var S = {
  visits: [
    'Visits',
    [
      'id',
      'time',
      'game',
      'mode',
      'player',
      'start',
      'd1',
      'd2',
      'd3',
      'total',
      'bust',
      'checkout',
      'team',
      'roster',
    ],
  ],
  mm: [
    'Mickey Mouse',
    [
      'id',
      'time',
      'game',
      'player',
      'team',
      'roster',
      'darts',
      'marks',
      'visits',
      'won',
    ],
  ],
  kl: [
    'Killer',
    [
      'id',
      'time',
      'game',
      'player',
      'number',
      'startLives',
      'darts',
      'kills',
      'becameKiller',
      'dartsToKiller',
      'place',
      'won',
    ],
  ],
  ft: [
    'Footy',
    [
      'id',
      'time',
      'game',
      'player',
      'team',
      'roster',
      'darts',
      'goals',
      'behinds',
      'points',
      'place',
      'won',
    ],
  ],
  pr: [
    'Practice',
    ['id', 'time', 'game', 'player', 'drill', 'target', 'darts', 'score'],
  ],
};

function sh(k) {
  var d = S[k] || S.visits,
    s = SpreadsheetApp.getActiveSpreadsheet(),
    t = s.getSheetByName(d[0]) || s.insertSheet(d[0]),
    h = d[1];
  if (!t.getLastRow()) t.appendRow(h);
  else {
    var r = t.getRange(1, 1, 1, h.length);
    if (r.getValues()[0].join() !== h.join()) r.setValues([h]);
  }
  return { t: t, w: h.length };
}

function doPost(e) {
  var b = JSON.parse(e.postData.contents),
    o = sh(b.t),
    t = o.t,
    n = t.getLastRow(),
    k = Math.min(n - 1, 1000),
    have = k > 0 ? t.getRange(n - k + 1, 1, k, 1).getValues().flat() : [],
    r = b.rows.filter(function (x) {
      return have.indexOf(x[0]) < 0;
    });
  if (r.length) t.getRange(n + 1, 1, r.length, o.w).setValues(r);
  return out({ ok: true, added: r.length });
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var o = sh(p.t),
    t = o.t,
    n = Math.max(t.getLastRow() - 1, 0),
    a = 0,
    l = p.limit == null ? 5000 : +p.limit;
    
  // Support time-based filtering
  if (p.afterTime) {
    var values = t.getRange(2, 2, n, 1).getValues().flat(); // Assuming the "time" column is the 2nd column
    a = values.findIndex((time) => new Date(time).getTime() > +p.afterTime);
    if (a === -1) a = n; // If no rows are found after 'afterTime', return no rows
  } else {
    a = Math.min(Math.max(+p.after || 0, 0), n);
  }

  var c = Math.min(l, n - a);

  return out({
    v: 5,
    rows: c > 0 ? t.getRange(a + 2, 1, c, o.w).getValues() : [],
    total: n,
  });
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(
    ContentService.MimeType.JSON,
  );
}`;