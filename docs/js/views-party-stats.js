/**
 * The Party tab: stats for Mickey Mouse, Killer and Footy.
 */

function funStats() {
  const agg = (rows, f) => {
    const m = {};
    rows.forEach((r) => f((m[r.player] ??= { g: 0, w: 0, a: 0, b: 0, c: 0 }), r));
    return Object.entries(m).sort((x, y) => y[1].w - x[1].w || y[1].g - x[1].g);
  };
  const pc = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '–'),
    fx = (a, b) => (b ? (a / b).toFixed(1) : '–');
  const tbl = (h, r) =>
    r.length
      ? `<table><tr>${h.map((x) => `<th>${x}</th>`).join('')}</tr>${r.join('')}</table>`
      : '<span class=mut>No finished games yet.</span>';
  const mm = agg(fun.mm, (o, r) => {
    o.g++;
    o.w += r.won;
    o.a += r.marks;
    o.b += r.visits;
    o.c += r.darts;
  });
  const kl = agg(fun.kl, (o, r) => {
    o.g++;
    o.w += r.won;
    o.a += r.kills;
    o.b += r.killer;
    o.c += r.place;
  });
  const ft = agg(fun.ft, (o, r) => {
      o.g++;
      o.w += r.won;
      o.a += r.goals;
      o.b += r.behinds;
      o.c += r.pts;
    }),
    wn = (v) => (Number.isInteger(v) ? v : v.toFixed(1));
  return `<h2 class=hd>Party games</h2><div class=sec><h4>Mickey Mouse</h4>${tbl(
    ['Player', 'Games', 'Wins', 'Win %', 'Marks per round', 'Darts per game'],
    mm.map(
      ([n, o]) =>
        `<tr><td>${esc(n)}</td><td>${o.g}</td><td>${o.w}</td><td>${pc(o.w, o.g)}</td><td>${fx(o.a, o.b)}</td><td>${fx(o.c, o.g)}</td></tr>`,
    ),
  )}</div>
  <div class=sec><h4>Killer</h4>${tbl(
    ['Player', 'Games', 'Wins', 'Win %', 'Kills', 'Became killer', 'Average place'],
    kl.map(
      ([n, o]) =>
        `<tr><td>${esc(n)}</td><td>${o.g}</td><td>${o.w}</td><td>${pc(o.w, o.g)}</td><td>${o.a}</td><td>${pc(o.b, o.g)}</td><td>${fx(o.c, o.g)}</td></tr>`,
    ),
  )}</div>
  <div class=sec><h4>Footy</h4>${tbl(
    ['Player', 'Games', 'Wins', 'Win %', 'Points per game', 'Goals per game', 'Behinds per game'],
    ft.map(
      ([n, o]) =>
        `<tr><td>${esc(n)}</td><td>${o.g}</td><td>${wn(o.w)}</td><td>${pc(o.w, o.g)}</td><td>${fx(o.c, o.g)}</td><td>${fx(o.a, o.g)}</td><td>${fx(o.b, o.g)}</td></tr>`,
    ),
  )}</div>
  <p class=mut style="font-size:13px">Party games are tracked apart from your practice stats, in their own worksheets. Only finished games are recorded.</p>`;
}
