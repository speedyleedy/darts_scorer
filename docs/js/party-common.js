/**
 * Shared pieces for the party games: their Sheet tables, row ids and syncing.
 */

const FUN = {
  ft: {
    v: 4,
    name: 'Footy',
    to: (r) => [
      r.id,
      r.time,
      r.game,
      r.player,
      r.team,
      r.roster,
      r.darts,
      r.goals,
      r.behinds,
      r.pts,
      r.place,
      r.won,
    ],
    from: (a) => ({
      id: String(a[0]),
      time: a[1],
      game: a[2],
      player: String(a[3]),
      team: String(a[4] || ''),
      roster: String(a[5] || ''),
      darts: +a[6],
      goals: +a[7],
      behinds: +a[8],
      pts: +a[9],
      place: +a[10],
      won: +a[11],
    }),
  },
  mm: {
    v: 3,
    name: 'Mickey Mouse',
    to: (r) => [
      r.id,
      r.time,
      r.game,
      r.player,
      r.team,
      r.roster,
      r.darts,
      r.marks,
      r.visits,
      r.won,
    ],
    from: (a) => ({
      id: String(a[0]),
      time: a[1],
      game: a[2],
      player: String(a[3]),
      team: String(a[4] || ''),
      roster: String(a[5] || ''),
      darts: +a[6],
      marks: +a[7],
      visits: +a[8],
      won: +a[9],
    }),
  },
  kl: {
    v: 3,
    name: 'Killer',
    to: (r) => [
      r.id,
      r.time,
      r.game,
      r.player,
      r.number,
      r.lives,
      r.darts,
      r.kills,
      r.killer,
      r.kd,
      r.place,
      r.won,
    ],
    from: (a) => ({
      id: String(a[0]),
      time: a[1],
      game: a[2],
      player: String(a[3]),
      number: +a[4],
      lives: +a[5],
      darts: +a[6],
      kills: +a[7],
      killer: +a[8],
      kd: a[9] === '' ? '' : +a[9],
      place: +a[10],
      won: +a[11],
    }),
  },
};

const rid = (c) => c + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const addRow = (t, r) => {
  fun[t].push(r);
  fq[t].push(r);
  store([t, t + 'q'], (a, b) => {
    a.put(r);
    b.put(r);
  });
};

async function syncFun(t, call) {
  const f = FUN[t];
  if (fq[t].length) {
    const c = await call(url + '?t=' + t + '&after=0&limit=0');
    if (!(c.v >= f.v))
      throw new Error(
        'Paste the latest script from Setup and deploy a New version to sync ' + f.name + ' games.',
      );
    while (fq[t].length) {
      const part = fq[t].slice(0, 500),
        r = await call(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ t, rows: part.map(f.to) }),
        });
      if (!r.ok) throw new Error('The script rejected the ' + f.name + ' data.');
      const ids = new Set(part.map((x) => x.id));
      fq[t] = fq[t].filter((x) => !ids.has(x.id));
      await tx([t + 'q'], (a) => ids.forEach((id) => a.delete(id)));
    }
  }
  const have = new Set(fun[t].map((x) => x.id));
  let j;
  do {
    j = await call(url + '?t=' + t + '&after=' + (curs[t] || 0) + '&limit=5000');
    if (!(j.v >= f.v)) return;
    const fresh = j.rows.map(f.from).filter((x) => !have.has(x.id));
    fresh.forEach((x) => have.add(x.id));
    fun[t].push(...fresh);
    if (fresh.length) await tx([t], (a) => fresh.forEach((x) => a.put(x)));
    curs[t] = Math.min((curs[t] || 0) + j.rows.length, j.total);
    persist();
  } while (curs[t] < j.total && j.rows.length);
}
