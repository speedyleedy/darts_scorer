/**
 * The History tab: a list of finished games.
 */

let hp = '';

function history() {
  const M = ginfo(),
    T = {},
    rows = [];
  visits.forEach((v) => {
    const o = (T[v.game + '|' + v.player] ??= { p: 0, d: 0 });
    o.p += v.total;
    o.d += v.d.length;
  });
  Object.entries(M).forEach(([id, g]) => {
    const w = g.wi >= 0 ? g.sides[g.wi] : [],
      o = w.reduce(
        (x, n) => {
          const y = T[id + '|' + n] || { p: 0, d: 0 };
          return { p: x.p + y.p, d: x.d + y.d };
        },
        { p: 0, d: 0 },
      );
    rows.push({
      t: +new Date(g.t),
      game: (g.mode || '01') + (g.tm ? ' teams' : ''),
      sd: g.sides.map((x) => x.join(' & ')).join(' v '),
      w: w.join(' & '),
      avg: o.d ? f1(mean(o.p, o.d)) : '–',
      all: g.sides.flat(),
    });
  });
  const grp = (a) => {
    const o = {};
    a.forEach((r) => (o[r.game] ??= []).push(r));
    return Object.values(o);
  };
  grp(fun.mm).forEach((rs) => {
    let sd;
    try {
      sd = JSON.parse(rs[0].roster);
    } catch (e) {
      sd = rs.map((r) => [r.player]);
    }
    rows.push({
      t: +new Date(rs[0].time),
      game: 'Mickey Mouse',
      sd: sd.map((x) => x.join(' & ')).join(' v '),
      w: rs
        .filter((r) => r.won)
        .map((r) => r.player)
        .join(' & '),
      avg: '–',
      all: rs.map((r) => r.player),
    });
  });
  grp(fun.kl).forEach((rs) =>
    rows.push({
      t: +new Date(rs[0].time),
      game: 'Killer',
      sd: rs.map((r) => r.player).join(', '),
      w: (rs.find((r) => r.won) || {}).player || '',
      avg: '–',
      all: rs.map((r) => r.player),
    }),
  );
  grp(fun.ft).forEach((rs) => {
    let sd;
    try {
      sd = JSON.parse(rs[0].roster);
    } catch (e) {
      sd = rs.map((r) => [r.player]);
    }
    rows.push({
      t: +new Date(rs[0].time),
      game: 'Footy',
      sd: sd.map((x) => x.join(' & ')).join(' v '),
      w:
        rs
          .filter((r) => r.won >= 1)
          .map((r) => r.player)
          .join(' & ') || (rs.some((r) => r.won === 0.5) ? 'Drawn' : ''),
      avg: '–',
      all: rs.map((r) => r.player),
    });
  });
  const names = [...new Set(rows.flatMap((r) => r.all))].sort(),
    list = rows
      .filter((r) => !hp || r.all.includes(hp))
      .sort((a, b) => b.t - a.t)
      .slice(0, 200);
  const dt = (t) =>
    new Date(t).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  return `<div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-2"><h2 class=hd style="margin:0">Match history</h2><span class=mut>Total <b class=text-body>${list.length}</b> result${list.length === 1 ? '' : 's'}</span></div><div class="pills d-flex flex-wrap gap-1 mb-3"><button data-a=hp data-v="" class="${hp ? '' : 'on'}">All players</button>${names.map((n) => `<button data-a=hp data-v="${esc(n)}" class="${n === hp ? 'on' : ''}">${esc(n)}</button>`).join('')}</div>
  ${list.length ? `<div class=table-responsive><table class=hl><tr><th>Date</th><th>Game</th><th>Players</th><th>Winner</th><th>Winner avg</th></tr>${list.map((r) => `<tr><td>${dt(r.t)}</td><td>${esc(r.game)}</td><td>${esc(r.sd)}</td><td>${r.w ? '<b>' + esc(r.w) + '</b>' : '<span class=mut>No result</span>'}</td><td>${r.avg}</td></tr>`).join('')}</table></div>` : '<span class=mut>No games yet.</span>'}`;
}
