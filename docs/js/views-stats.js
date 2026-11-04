/**
 * The Stats tab: tiles, charts, finishes, heat map and the all-players table.
 */

let sp = '',
  rng = 'all',
  SV = [],
  CH = [];

const gauge = (l, pct, t, c, sub) =>
  `<div class=g><span>${esc(l)}${sub ? `<small>${esc(sub)}</small>` : ''}</span><div class=gb><i style="width:${Math.max(2, Math.round(pct))}%;background:${c}"></i></div><b>${t}</b></div>`;

function draw(vs) {
  if (typeof Chart === 'undefined' || !vs.length) return;
  const css = getComputedStyle(document.documentElement),
    col = (n) => css.getPropertyValue(n).trim(),
    days = {};
  Chart.defaults.font.size = Math.round(12 * ((parseFloat(css.fontSize) || 16) / 16));
  vs.forEach((v) => (days[new Date(v.time).toLocaleDateString('en-CA')] ??= []).push(v));
  const keys = Object.keys(days),
    resDay = (k) => {
      const o = {};
      for (const g in SR) if (new Date(SR[g].t).toLocaleDateString('en-CA') === k) o[g] = SR[g];
      return o;
    },
    D = keys.map((k) => pstats(days[k], resDay(k))),
    pct = (a, b) => (b ? +((a / b) * 100).toFixed(1) : null);
  const mk = (id, sets, max) => {
    const el = $(id);
    if (!el) return;
    CH.push(
      new Chart(el, {
        type: 'line',
        data: {
          labels: keys,
          datasets: sets.map(([label, data, c, fill]) => ({
            label,
            data,
            borderColor: col(c),
            backgroundColor: col(c) + '26',
            fill: !!fill,
            tension: 0.3,
            pointRadius: 2.5,
            borderWidth: 2,
            spanGaps: true,
          })),
        },
        options: {
          animation: false,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { labels: { color: col('--mut'), boxWidth: 12 } } },
          scales: {
            x: { ticks: { color: col('--mut'), maxTicksLimit: 8 }, grid: { color: col('--line') } },
            y: { min: 0, max, ticks: { color: col('--mut') }, grid: { color: col('--line') } },
          },
        },
      }),
    );
  };
  mk('#c1', [
    ['3-dart average', D.map((s) => +mean(s.pts, s.dk).toFixed(1)), '--acc', 1],
    ['First 9', D.map((s) => (s.f9d ? +mean(s.f9p, s.f9d).toFixed(1) : null)), '--bl'],
  ]);
  const run = (f) => {
    let a = 0,
      b = 0;
    return D.map((s) => {
      const [x, y] = f(s);
      a += x;
      b += y;
      return pct(a, b);
    });
  };
  mk(
    '#c2',
    [
      ['Win %', run((s) => [s.won, Object.keys(s.g).length]), '--db'],
      ['Doubles hit %', run((s) => [s.hit, s.att]), '--acc'],
    ],
    100,
  );
  mk('#c3', [
    ['100+', keys.map((k, i) => pct(D[i].a, days[k].length)), '--acc', 1],
    ['140+', keys.map((k, i) => pct(D[i].b, days[k].length)), '--bl'],
  ]);
}

/* Where your darts land: the board shaded by how often each segment was hit (tap-the-board visits only). */
function heat(c) {
  const mx = Math.max(1, ...Object.values(c)),
    fill = (k) => {
      const n = c[k] || 0;
      return n
        ? `color-mix(in srgb,var(--acc) ${Math.round(20 + Math.sqrt(n / mx) * 70)}%,var(--card))`
        : 'var(--bs-tertiary-bg)';
    };
  let h =
    '<svg viewBox="-240 -240 480 480" class=heat role=img aria-label="Heat map of where your darts landed"><circle r="232" style="fill:var(--bs-secondary-bg)"/>';
  ORDER.forEach((n, i) => {
    const a1 = i * 18 - 9,
      a2 = i * 18 + 9;
    [
      [28, 98, 'S'],
      [98, 122, 'T'],
      [122, 168, 'S'],
      [168, 196, 'D'],
    ].forEach(([r1, r2, t]) => {
      h += `<path d="${arc(r1, r2, a1, a2)}" style="fill:${fill(t + n)};stroke:var(--card);stroke-width:1"/>`;
    });
    const [x, y] = P(215, i * 18);
    h += `<text x="${x}" y="${y + 6}" text-anchor="middle" style="fill:var(--mut);font-size:17px;font-weight:600">${n}</text>`;
  });
  return (
    h +
    `<circle r="28" style="fill:${fill('25')};stroke:var(--card)"/><circle r="12" style="fill:${fill('50')};stroke:var(--card)"/></svg>`
  );
}

function stats() {
  const all = [...visits].sort(byTime),
    names = [...new Set(all.map((v) => v.player))];
  if (!names.length)
    return '<div class=sec><span class=mut>No games yet. Play a game and your stats will appear here.</span></div>';
  if (!names.includes(sp)) sp = names[0];
  const t = (v) => +new Date(v.time),
    span = rng === 'all' ? 0 : rng * 864e5,
    cut = rng === 'all' ? 0 : Date.now() - span,
    res = {};
  Object.entries(ginfo()).forEach(([id, g]) => {
    const si = g.sides.findIndex((sd) => sd.includes(sp));
    if (si >= 0)
      res[id] = {
        w: g.wi === si ? 1 : 0,
        t: +new Date(g.t),
        tm: g.tm,
        mates: g.sides[si].filter((x) => x !== sp),
      };
  });
  const fok = (x) => fm === 'all' || (fm === 'teams') === !!x;
  const pick = (lo, hi) => {
    const v = all.filter((x) => x.player === sp && fok(x.team) && t(x) >= lo && t(x) < hi),
      r = {};
    for (const k in res) if (fok(res[k].tm) && res[k].t >= lo && res[k].t < hi) r[k] = res[k];
    return [v, r];
  };
  const [vs, rs] = pick(cut, Infinity),
    pp = rng === 'all' ? null : pick(cut - span, cut);
  SV = vs;
  SR = rs;
  const S = pstats(vs, rs),
    gm = Object.keys(S.g).length;
  const m = (s) => {
    const g = Object.keys(s.g).length;
    return {
      avg: mean(s.pts, s.dk),
      f9: mean(s.f9p, s.f9d),
      win: g ? (s.won / g) * 100 : 0,
      dbl: s.att ? (s.hit / s.att) * 100 : 0,
    };
  };
  const a = m(S),
    b = pp && pp[0].length ? m(pstats(pp[0], pp[1])) : null;
  const dl = (k, u = '') =>
    b && b[k]
      ? `<span class="dl ${a[k] >= b[k] ? 'up' : 'dn'}">${a[k] >= b[k] ? '▲' : '▼'} ${Math.abs(a[k] - b[k]).toFixed(1)}${u}</span>`
      : '';
  const tile = (l, v, d = '') => `<div class=tile><small>${l}</small><b>${v}</b>${d}</div>`;
  const { f, d } = cks(vs),
    fe = Object.entries(f),
    rate = (o) => o.hit / o.att,
    pc = (o) => Math.round(rate(o) * 100) + '% · ' + o.hit + '/' + o.att;
  const top = (o) => (Object.entries(o.rt).sort((x, y) => y[1] - x[1])[0] || [''])[0];
  const fav = fe
      .filter(([, o]) => o.hit)
      .sort((x, y) => y[1].hit - x[1].hit)
      .slice(0, 6),
    mx = fav.length ? fav[0][1].hit : 1;
  const ok = fe
    .filter(([, o]) => o.att >= 3)
    .sort((x, y) => rate(y[1]) - rate(x[1]) || y[1].att - x[1].att);
  const dr = Object.entries(d)
    .filter(([, o]) => o.att >= 3)
    .sort((x, y) => y[1].att - x[1].att)
    .slice(0, 8);
  const pm = {};
  Object.values(rs).forEach((r) =>
    r.mates.forEach((n) => {
      const o = (pm[n] ??= { g: 0, w: 0 });
      o.g++;
      o.w += r.w;
    }),
  );
  const hc = {};
  vs.forEach((v) =>
    v.d.forEach((x) => {
      if (x !== '?') hc[x] = (hc[x] || 0) + 1;
    }),
  );
  const hn = Object.values(hc).reduce((a, b) => a + b, 0);
  const pt = Object.entries(pm)
    .sort((x, y) => y[1].g - x[1].g)
    .slice(0, 6);
  const none = '<span class=mut>Needs at least 3 attempts.</span>';
  const rows = (l, c) => l.map(([k, o]) => gauge(k, rate(o) * 100, pc(o), c)).join('') || none;
  const btn = (a2, v, l, on) =>
    `<button data-a=${a2} data-v="${esc(v)}" class="${on ? 'on' : ''}">${l}</button>`;
  return `<h2 class=hd>Player stats</h2><div class="pills d-flex flex-wrap gap-1 align-items-center mb-2">${names.map((n) => btn('sp', n, esc(n), n === sp)).join('')}<span style="flex:1"></span>${[
    ['7', '7d'],
    ['30', '30d'],
    ['90', '90d'],
    ['all', 'All'],
  ]
    .map(([k, l]) => btn('rng', k, l, rng === k))
    .join('')}</div>
  <div class="pills d-flex flex-wrap gap-1 align-items-center mb-3">${[
    ['all', 'All games'],
    ['solo', 'Individual'],
    ['teams', 'Teams'],
  ]
    .map(([k, l]) => btn('fm', k, l, fm === k))
    .join('')}</div>
  <div class=tiles>${tile('3-dart average', f1(a.avg), dl('avg'))}${tile('First 9', f1(a.f9), dl('f9'))}${tile('Win rate', gm ? Math.round(a.win) + '%' : '–', dl('win', '%'))}${tile('Doubles hit', S.att ? Math.round(a.dbl) + '%' : '–', dl('dbl', '%'))}${tile('100+', S.a)}${tile('140+', S.b)}${tile('180s', S.c)}${tile('Best finish', S.bf || '–')}${tile('Games', gm)}</div>
  ${vs.length ? `<div class="row row-cols-1 row-cols-lg-2 row-cols-xxl-3 g-4"><div class=sec><h4>Scoring</h4><div class=cv><canvas id=c1></canvas></div></div><div class=sec><h4>Winning and finishing, to date</h4><div class=cv><canvas id=c2></canvas></div></div><div class=sec><h4>Big scores, % of visits</h4><div class=cv><canvas id=c3></canvas></div></div></div>` : '<div class=sec><span class=mut>No visits for this selection.</span></div>'}
  <div class="row row-cols-1 row-cols-md-2 g-4 mt-1"><div class=sec><h4>Favourite finishes</h4>${fav.map(([k, o]) => gauge(k, (o.hit / mx) * 100, o.hit + '×', 'var(--acc)', top(o))).join('') || none}</div>
  <div class=sec><h4>Most reliable finishes</h4>${rows(ok.filter(([, o]) => o.hit).slice(0, 5), 'var(--db)')}</div>
  <div class=sec><h4>Least reliable finishes</h4>${rows(ok.slice().reverse().slice(0, 5), 'var(--tr)')}</div>
  <div class=sec><h4>Doubles you throw at most</h4>${dr.map(([k, o]) => gauge(k, rate(o) * 100, pc(o), 'var(--bl)')).join('') || none}</div>
  <div class=sec><h4>Where your darts land</h4>${hn >= 15 ? `${heat(hc)}<p class=mut style="font-size:.8rem;margin:.5rem 0 0;text-align:center">The stronger the colour, the more darts landed there. ${hc['0'] || 0} of ${hn} missed the board.</p>` : '<span class=mut>Needs a few more tap-the-board games.</span>'}</div>
  ${pt.length ? `<div class=sec><h4>Playing with</h4>${pt.map(([n, o]) => gauge(n, (o.w / o.g) * 100, Math.round((o.w / o.g) * 100) + '% · ' + o.w + '/' + o.g, 'var(--db)', 'win rate together')).join('')}</div>` : ''}</div>
  <p class=mut style="font-size:13px">Games and wins count every game you were in, even if you never got to throw. In a team game, a win counts for every team member. A finish counts as an attempt each time a visit starts on that score and it can be checked out in three darts.</p>
  <h4 style="margin:18px 0 8px">All players</h4>${statsTable()}`;
}

function statsTable() {
  const by = {},
    all = [...visits].sort((a, b) => (String(a.time) < String(b.time) ? -1 : 1));
  all.forEach((v) => (by[v.player] ??= []).push(v));
  const rows = Object.entries(by)
    .map(([n, vs]) => {
      const s = pstats(vs);
      return `<tr><td>${esc(n)}</td><td>${Object.keys(s.g).length}</td><td>${s.won}</td><td>${f1(mean(s.pts, s.dk))}</td><td>${f1(mean(s.f9p, s.f9d))}</td><td>${s.a}</td><td>${s.b}</td><td>${s.c}</td><td>${s.att ? Math.round((s.hit / s.att) * 100) + '%' : '–'}</td><td>${s.bl || '–'}</td><td>${s.bf || '–'}</td><td>${spark(s.g)}</td></tr>`;
    })
    .join('');
  return `<div class=sec style="overflow-x:auto">${rows ? `<table><tr><th>Player</th><th>Games</th><th>Won</th><th>3-dart avg</th><th>First 9</th><th>100+</th><th>140+</th><th>180</th><th>Doubles</th><th>Best leg</th><th>Best finish</th><th>Last 10 games</th></tr>${rows}</table><p class=mut style="font-size:13px">Doubles is finishes hit out of darts thrown while on a double. Best leg is the fewest darts to win. A bust scores 0.</p>` : '<span class=mut>No games yet. Play a game and your stats will appear here.</span>'}</div>`;
}
