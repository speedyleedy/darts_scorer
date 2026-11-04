/**
 * Number crunching for stats: averages, first 9, doubles, finishes and game results.
 */

/* ---------- views ---------- */
const mean = (p, d) => (d ? (p / d) * 3 : 0),
  f1 = (x) => (x ? x.toFixed(1) : '–');

function pstats(vs, res) {
  const s = {
    dk: 0,
    pts: 0,
    last: 0,
    a: 0,
    b: 0,
    c: 0,
    att: 0,
    hit: 0,
    f9p: 0,
    f9d: 0,
    bf: 0,
    won: 0,
    bl: 0,
    g: {},
  };
  vs.forEach((v) => {
    const g = (s.g[v.game] ??= { n: 0, pts: 0, dk: 0, w: 0 });
    if (g.n < 3) {
      s.f9p += v.total;
      s.f9d += v.d.length;
    }
    g.n++;
    g.pts += v.total;
    g.dk += v.d.length;
    s.dk += v.d.length;
    s.pts += v.total;
    s.last = v.total;
    if (v.total >= 100) s.a++;
    if (v.total >= 140) s.b++;
    if (v.total === 180) s.c++;
    let r = v.start;
    v.d.forEach((d, i) => {
      if ((r >= 2 && r <= 40 && r % 2 === 0) || r === 50) {
        s.att++;
        if (v.co && i === v.d.length - 1) s.hit++;
      }
      r -= val(d);
    });
    if (v.team) g.tm = 1;
    if (res ? res[v.game] && res[v.game].w : v.co || (v.team && WINT[v.game] === v.team)) g.w = 1;
    if (v.co) s.bf = Math.max(s.bf, v.start);
  });
  if (res)
    for (const k in res)
      if (!s.g[k]) s.g[k] = { n: 0, pts: 0, dk: 0, w: res[k].w ? 1 : 0, tm: res[k].tm };
  Object.values(s.g).forEach((g) => {
    if (g.w) {
      s.won++;
      if (!g.tm && g.dk) s.bl = s.bl ? Math.min(s.bl, g.dk) : g.dk;
    }
  });
  return s;
}

function spark(g) {
  const a = Object.values(g)
    .slice(-10)
    .map((x) => mean(x.pts, x.dk));
  if (a.length < 2) return '–';
  const lo = Math.min(...a),
    sp = Math.max(...a) - lo || 1,
    pts = a.map((y, i) => `${i * 10},${22 - ((y - lo) / sp) * 20}`).join(' ');
  return `<svg width="92" height="24" viewBox="-2 -1 94 24"><polyline points="${pts}" fill="none" stroke="var(--acc)" stroke-width="2"/></svg>`;
}

function winLine() {
  const s = pstats(
    visits.filter((v) => v.game === G.id && (G.teams ? v.team : v.player) === G.done),
  );
  return `Won in ${s.dk} darts, 3-dart avg ${f1(mean(s.pts, s.dk))}`;
}

function cks(vs) {
  const f = {},
    d = {};
  vs.forEach((v) => {
    if (v.start <= 170 && co(v.start, 3)) {
      const o = (f[v.start] ??= { att: 0, hit: 0, rt: {} });
      o.att++;
      if (v.co) {
        o.hit++;
        const k = v.d[0] === '?' ? 'total entered' : v.d.map(lbl).join(' ');
        o.rt[k] = (o.rt[k] || 0) + 1;
      }
    }
    let r = v.start;
    v.d.forEach((x, i) => {
      if ((r >= 2 && r <= 40 && r % 2 === 0) || r === 50) {
        const k = r === 50 ? 'Bull' : 'D' + r / 2,
          o = (d[k] ??= { att: 0, hit: 0 });
        o.att++;
        if (v.co && i === v.d.length - 1) o.hit++;
      }
      r -= val(x);
    });
  });
  return { f, d };
}

function ginfo() {
  const M = {};
  visits.forEach((v) => {
    const g = (M[v.game] ??= {
        t: v.time,
        mode: v.mode,
        tm: false,
        sides: null,
        leg: {},
        win: null,
      }),
      k = v.team || v.player;
    if (v.team) g.tm = true;
    if (!g.sides && v.roster) {
      try {
        g.sides = JSON.parse(v.roster);
      } catch (e) {}
    }
    const l = (g.leg[k] ??= []);
    if (!l.includes(v.player)) l.push(v.player);
    if (v.co) g.win = v.player;
  });
  Object.values(M).forEach((g) => {
    if (!g.sides) g.sides = Object.values(g.leg);
    g.wi = g.win == null ? -1 : g.sides.findIndex((sd) => sd.includes(g.win));
  });
  return M;
}
