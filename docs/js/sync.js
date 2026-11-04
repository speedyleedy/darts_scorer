/**
 * Sync with the user's Google Sheet (via the Apps Script) and CSV export.
 */

const HEAD = [
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
];

const toRow = (v) => [
  v.id,
  v.time,
  v.game,
  v.mode,
  v.player,
  v.start,
  v.d[0] || '',
  v.d[1] || '',
  v.d[2] || '',
  v.total,
  v.bust,
  v.co,
  v.team || '',
  v.roster || '',
];

const fromRow = (r) => ({
  id: String(r[0]),
  time: r[1],
  game: r[2],
  mode: r[3],
  player: String(r[4]),
  start: +r[5],
  d: [r[6], r[7], r[8]].filter((x) => x !== '' && x != null).map(String),
  total: +r[9],
  bust: +r[10],
  co: +r[11],
  team: String(r[12] || ''),
  roster: String(r[13] || ''),
});

async function sync() {
  if (!url) {
    note = 'Paste your Web App URL in Setup first.';
    return render();
  }
  note = 'Syncing…';
  render();
  const call = async (u, o) => {
    const t = await (await fetch(u, o)).text();
    try {
      return JSON.parse(t);
    } catch (e) {
      throw new Error(
          /Script function not found/i.test(t)
              ? 'The script has no doGet/doPost. Paste the full script and deploy a New version.'
              : 'The URL returned a web page, not data. Set access to Anyone, redeploy, and use the /exec URL. If you recently updated the app, also paste the latest script from Setup and deploy a New version.',
      );
    }
  };
  try {
    while (queue.length) {
      const part = queue.slice(0, 500),
          r = await call(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ rows: part.map(toRow) }),
          });
      if (!r.ok) throw new Error('The script rejected the data.');
      const ids = new Set(part.map((v) => v.id));
      queue = queue.filter((v) => !ids.has(v.id));
      await tx(['queue'], (q) => ids.forEach((id) => q.delete(id)));
    }
    const have = new Set(visits.map((v) => v.id));
    let j,
        added = 0;
    do {
      j = await call(url + (url.includes('?') ? '&' : '?') + 'after=' + cursor + '&limit=5000');
      const fresh = j.rows.map(fromRow).filter((v) => !have.has(v.id));
      fresh.forEach((v) => have.add(v.id));
      visits.push(...fresh);
      added += fresh.length;
      if (fresh.length) await tx(['visits'], (a) => fresh.forEach((v) => a.put(v)));
      cursor = j.total === undefined ? j.rows.length : Math.min(cursor + j.rows.length, j.total);
      persist();
    } while (j.total !== undefined && cursor < j.total && j.rows.length);
    for (const t of ['mm', 'kl', 'ft']) await syncFun(t, call);
    visits.sort(byTime);
    rebuildWin();
    players = [...new Set([...players, ...visits.map((v) => v.player)])];
    persist();
    note =
        'Synced. ' +
        added +
        ' new from the Sheet, ' +
        visits.length +
        ' visits stored here.' +
        (j.total === undefined
            ? ' Tip: paste the latest script from Setup and deploy a New version, so syncing only downloads new rows.'
            : '');
  } catch (e) {
    note =
        'Sync failed: ' +
        (e.message === 'Failed to fetch'
            ? 'could not reach the URL (check it is the full /exec link and you are online).'
            : e.message) +
        ' Your data is safe on this device.';
  }
  render();
}

function exportCsv() {
  const c = [HEAD, ...visits.map(toRow)].map((r) => r.join(',')).join('\n'),
      a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([c], { type: 'text/csv' }));
  a.download = 'darts.csv';
  a.click();
}