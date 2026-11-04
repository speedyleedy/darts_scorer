/**
 * Mickey Mouse: scoring rules and scoreboard.
 */

/* ---------- party games: Mickey Mouse and Killer (own tables, own worksheets) ---------- */
const MT = ['20', '19', '18', '17', '16', '15', '14', '13', '12', 'D', 'T', 'Bed', 'B'];

/* Mickey Mouse: throw all three darts, then choose where each one goes.
   A double or treble of 12 to 20 goes EITHER to its number (2 or 3 hits) OR counts as one hit on Doubles / Trebles.
   3 in a bed: all three darts in the same bed (any mix of single, double and treble; the bull counts too).
   It can be taken as one hit on Bed, which uses all three darts.
   The choices only show when there is more than one way to score the visit. */
function mmOpts(p, d) {
  if (d === '25' || d === '50') return p.marks.B < 3 ? [{ t: 'B', n: d === '25' ? 1 : 2 }] : [];
  if (d === '0') return [];
  const ty = d[0],
    n = +d.slice(1),
    o = [];
  if (n >= 12 && p.marks[String(n)] < 3)
    o.push({ t: String(n), n: ty === 'S' ? 1 : ty === 'D' ? 2 : 3 });
  if (ty !== 'S' && p.marks[ty] < 3) o.push({ t: ty, n: 1 });
  return o;
}

const mmBedOf = (d) => (d === '25' || d === '50' ? 'B' : d === '0' ? '' : d.slice(1));

const mmBed = (p, ds) =>
  p.marks.Bed < 3 && ds.length === 3 && !!mmBedOf(ds[0]) && ds.every((d) => mmBedOf(d) === mmBedOf(ds[0]));

/* The marks after the visit: each dart on its picked option, or one hit on Bed. */
function mmMarks(p, ds, pk, bed) {
  const m = { ...p.marks };
  if (bed) m.Bed++;
  else
    ds.forEach((d, i) => {
      const x = mmOpts(p, d)[pk[i]];
      if (x) m[x.t] = Math.min(3, m[x.t] + x.n);
    });
  return m;
}

const mmWon = (m) => MT.every((k) => m[k] >= 3);

/* Every way to score the darts thrown so far: [picks, bed]. */
function mmWays(p, ds) {
  let w = [[]];
  ds.forEach((d) => {
    const n = mmOpts(p, d).length || 1;
    w = w.flatMap((pk) => Array.from({ length: n }, (_, k) => [...pk, k]));
  });
  w = w.map((pk) => [pk, false]);
  if (mmBed(p, ds)) w.push([ds.map(() => 0), true]);
  return w;
}

function mmThr(d) {
  if (G.darts.length >= 3) return;
  G.pl.forEach((x) => (x.marks.Bed ??= 0)); /* games started before 3 in a bed was added */
  if (!G.mmPk || G.mmPk.length !== G.darts.length) G.mmPk = G.darts.map(() => 0);
  hist.push({ G: JSON.parse(JSON.stringify(G)), added: [], rows: [] });
  const p = G.pl[G.cur];
  G.darts.push(d);
  G.mmPk.push(0);
  G.mmBedOn = false;
  if (G.darts.length === 3) {
    const ways = mmWays(p, G.darts),
      out = new Set(ways.map(([pk, bed]) => JSON.stringify(mmMarks(p, G.darts, pk, bed))));
    if (out.size === 1) {
      [G.mmPk, G.mmBedOn] = ways[ways.length - 1];
      return mmScore();
    }
    /* a bed whose darts score nothing else (e.g. three 5s): take the bed */
    if (mmBed(p, G.darts) && G.darts.every((x) => !mmOpts(p, x).length)) {
      G.mmBedOn = true;
      return mmScore();
    }
  } else if (mmWon(mmMarks(p, G.darts, G.mmPk, false)) && mmWays(p, G.darts).length === 1)
    return mmScore();
  render();
}

/* Can the darts thrown so far already win? Then the visit can be scored early. */
const mmCanWin = () =>
  mmWays(G.pl[G.cur], G.darts).some(([pk, bed]) => mmWon(mmMarks(G.pl[G.cur], G.darts, pk, bed)));

function mmScore() {
  const h = hist[hist.length - 1],
    p = G.pl[G.cur],
    who = p.m[p.mi],
    e = (p.mem[who] ??= { darts: 0, marks: 0, visits: 0 }),
    m = mmMarks(p, G.darts, G.mmPk, G.mmBedOn);
  e.darts += G.darts.length;
  e.visits++;
  e.marks += MT.reduce((a, k) => a + m[k] - p.marks[k], 0);
  p.marks = m;
  G.last = who + ': ' + G.darts.map(lbl).join(' ') + (G.mmBedOn ? ' (3 in a bed)' : '');
  G.darts = [];
  G.mmPk = [];
  G.mmBedOn = false;
  if (mmWon(m)) {
    G.done = p.name;
    G.pl.forEach((sd) =>
      sd.m.forEach((nm) => {
        const x = sd.mem[nm] || { darts: 0, marks: 0, visits: 0 },
          r = {
            id: rid('m'),
            time: new Date().toISOString(),
            game: G.id,
            player: nm,
            team: G.teams ? sd.name : '',
            roster: G.roster,
            darts: x.darts,
            marks: x.marks,
            visits: x.visits,
            won: +(sd.name === G.done),
          };
        addRow('mm', r);
        h.rows.push({ t: 'mm', id: r.id });
      }),
    );
    if (url) setTimeout(sync, 300);
  } else {
    p.mi = (p.mi + 1) % p.m.length;
    G.cur = (G.cur + 1) % G.pl.length;
  }
  if (G.done) say(G.done + ' wins!');
  else if (multi()) say(whoNow() + ' to throw');
  render();
}

const mmOptLbl = (x) =>
  x.t === 'D' || x.t === 'T' ? '1 on ' + (x.t === 'D' ? 'Doubles' : 'Trebles') : x.n + ' on ' + (x.t === 'B' ? 'Bull' : x.t);

const mmChoose = () => {
  const p = G.pl[G.cur],
    ds = G.darts;
  if (!ds.length || (ds.length < 3 && !mmCanWin())) return '';
  const bed = mmBed(p, ds),
    pk = G.mmPk || [],
    m = mmMarks(p, ds, pk, G.mmBedOn),
    rows = ds
      .map((d, i) => {
        const o = mmOpts(p, d);
        return `<div class="d-flex flex-wrap gap-2 align-items-center mt-2">${dtag(d)}${
          !o.length
            ? '<span class=mut>scores nothing</span>'
            : o.length === 1
              ? `<span class=mut>${mmOptLbl(o[0])}</span>`
              : `<span class=pills>${o.map((x, k) => `<button data-a=mmc data-v=${i}:${k} class="${pk[i] === k ? 'on' : ''}">${mmOptLbl(x)}</button>`).join(' ')}</span>`
        }</div>`;
      })
      .join('');
  return `<div class=choose><b>Score this visit</b>${
    bed
      ? `<div class="pills d-flex flex-wrap gap-2 mt-2"><button data-a=mmbed data-v=0 class="${G.mmBedOn ? '' : 'on'}">Score the darts</button><button data-a=mmbed data-v=1 class="${G.mmBedOn ? 'on' : ''}">3 in a bed (uses all 3 darts)</button></div>`
      : ''
  }${G.mmBedOn ? '' : rows}<div class="d-flex flex-wrap gap-2 align-items-center mt-2"><button class=pri data-a=mmgo>${mmWon(m) ? 'Score visit and win' : 'Score visit'}</button>${ds.length < 3 ? '<span class=mut>These darts can win the game.</span>' : ''}</div></div>`;
};

function mmView() {
  const lab = { D: 'Doubles', T: 'Trebles', Bed: '3 in a bed', B: 'Bull' },
    sym = ['', '/', '✕', '⊗'],
    on = (i) => i === G.cur && !G.done;
  const rows = MT.map(
    (k) =>
      `<tr><td>${lab[k] || k}</td>${G.pl.map((x, i) => `<td class="${x.marks[k] >= 3 ? 'cl' : ''}${on(i) ? ' cur' : ''}">${sym[x.marks[k] || 0]}</td>`).join('')}</tr>`,
  ).join('');
  return shell(
    `<div class=sec style="overflow-x:auto"><table class=mmt><tr><th></th>${G.pl.map((x, i) => `<th class="${on(i) ? 'cur' : ''}">${esc(x.name)}</th>`).join('')}</tr>${rows}</table></div>
    <div class=slots style="margin:8px 0">${[0, 1, 2].map((k) => (G.darts[k] ? dtag(G.darts[k]) : '<span class="dt e">·</span>')).join('')}</div>
    ${G.done ? winCard() : ''}<div class=mut>${esc(G.last)}</div>`,
    'Mickey Mouse' + (G.teams ? ' · teams' : ''),
    G.done ? '' : turnBar() + mmChoose(),
  );
}
