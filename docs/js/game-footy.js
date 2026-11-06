/**
 * AFL Footy: four quarters aiming at 6, 3, 11, 20. Scoring rules and scoreboard.
 */

/* AFL Footy: four quarters aiming at 6, 3, 11, 20. Target = goal (6), neighbouring number on the board = behind (1).
   Doubles and trebles multiply both, so a treble is three goals (or three behinds). Highest total wins. */
const FT = [6, 3, 11, 20],
  ftAdj = (t) => {
    const i = ORDER.indexOf(t);
    return [ORDER[(i + 19) % 20], ORDER[(i + 1) % 20]];
  },
  ftTot = (x) => x.qs.reduce((a, b) => a + b, 0);

function ftThr(d) {
  const h = { G: JSON.parse(JSON.stringify(G)), added: [], rows: [] };
  hist.push(h);
  const p = G.pl[G.cur],
    who = p.m[p.mi],
    e = (p.mem[who] ??= { darts: 0, goals: 0, behinds: 0, pts: 0 });
  const q0 = G.q,
    t = FT[G.q],
    n = ['25', '50', '0'].includes(d) ? 0 : +d.slice(1),
    m = d[0] === 'D' ? 2 : d[0] === 'T' ? 3 : 1;
  G.darts.push(d);
  e.darts++;
  if (n === t) {
    p.goals += m;
    e.goals += m;
    e.pts += 6 * m;
    p.qs[G.q] += 6 * m;
  } else if (n && ftAdj(t).includes(n)) {
    p.behinds += m;
    e.behinds += m;
    e.pts += m;
    p.qs[G.q] += m;
  }
  if (G.darts.length === 3) {
    G.last = who + ': ' + G.darts.map(lbl).join(' ');
    G.darts = [];
    p.mi = (p.mi + 1) % p.m.length;
    G.cur = (G.cur + 1) % G.pl.length;
    if (G.cur === 0) {
      G.round++;
      if (G.round === G.vpq) {
        G.round = 0;
        G.q++;
      }
    }
    if (G.q === 4) {
      const mx = Math.max(...G.pl.map(ftTot)),
        top = G.pl.filter((x) => ftTot(x) === mx);
      G.done = top.length === 1 ? top[0].name : 'Draw';
      G.pl.forEach((sd) =>
        sd.m.forEach((nm) => {
          const x = sd.mem[nm] || { darts: 0, goals: 0, behinds: 0, pts: 0 },
            r = {
              id: rid('f'),
              time: new Date().toISOString(),
              game: G.id,
              player: nm,
              team: G.teams ? sd.name : '',
              roster: G.roster,
              darts: x.darts,
              goals: x.goals,
              behinds: x.behinds,
              pts: x.pts,
              place: 1 + G.pl.filter((o) => ftTot(o) > ftTot(sd)).length,
              won: ftTot(sd) === mx ? (top.length === 1 ? 1 : 0.5) : 0,
            };
          addRow('ft', r);
          h.rows.push({ t: 'ft', id: r.id });
        }),
      );
      if (url) setTimeout(sync, 300);
    }
  }
  if (G.done) say(G.done === 'Draw' ? 'The game is drawn.' : G.done + ' wins!');
  else if (G.darts.length === 0)
    say(
      G.q !== q0 ? 'Quarter ' + (G.q + 1) + '. Aim at ' + FT[G.q] + '.' : '',
      multi() ? whoNow() + ' to throw' : '',
    );
  render();
}

function ftView() {
  const q = Math.min(G.q, 3),
    t = FT[q],
    adj = ftAdj(t),
    on = (k) => k === G.cur && !G.done;
  const head = FT.map(
    (x, k) =>
      `<th class="${k === q && !G.done ? 'cur' : ''}">Q${k + 1} <small class=mut>${x}</small></th>`,
  ).join('');
  const rows = G.pl
    .map(
      (x, k) =>
        `<tr class="${on(k) ? 'cur' : ''}"><td>${esc(x.name)}</td>${x.qs.map((v, k2) => `<td>${k2 > G.q && !G.done ? '–' : v}</td>`).join('')}<td><b>${x.goals}.${x.behinds}</b> (${ftTot(x)})</td></tr>`,
    )
    .join('');
  const aim = G.done
    ? ''
    : `<div class="choose dsk"><b>Quarter ${q + 1} of 4</b> <span class=mut>visit ${G.round + 1} of ${G.vpq}</span><div>Aim at <b>${t}</b> for a goal (6). Behinds on <b>${adj[0]}</b> and <b>${adj[1]}</b> (1 each). Doubles and trebles multiply.</div></div>`;
  return shell(
    `<div class=sec style="overflow-x:auto"><table class=mmt><tr><th></th>${head}<th>Score</th></tr>${rows}</table></div>
    <div class=slots style="margin:8px 0">${[0, 1, 2].map((k) => (G.darts[k] ? dtag(G.darts[k]) : '<span class="dt e">·</span>')).join('')}</div>
    ${G.done ? '<div class="hint mob"></div>' : `<div class="hint mob">Q${q + 1}, visit ${G.round + 1} of ${G.vpq}: aim at <b>${t}</b> for a goal, <b>${adj[0]}</b> or <b>${adj[1]}</b> for a behind</div>`}
    ${G.done ? winCard() : ''}<div class=mut>${esc(G.last)}</div>`,
    'Footy' + (G.teams ? ' · teams' : ''),
    G.done ? '' : turnBar() + aim,
  );
}
