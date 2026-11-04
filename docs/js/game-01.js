/**
 * 01 games (301, 501, ...): dart by dart, total entry, legs and the finish.
 */

function thr(d) {
  if (!G || G.done || G.legWon || G.pendCo) return;
  if (G.type === 'mm') return mmThr(d);
  if (G.type === 'kl') return klThr(d);
  if (G.type === 'ft') return ftThr(d);
  const h = { G: JSON.parse(JSON.stringify(G)), added: [] };
  hist.push(h);
  const p = G.pl[G.cur],
    who = p.m[p.mi],
    left = p.rem - val(d);
  G.darts.push(d);
  const bust = left < 0 || left === 1 || (left === 0 && d[0] !== 'D' && d !== '50'),
    win = left === 0 && !bust;
  if (!bust) p.rem = left;
  if (bust || win || G.darts.length === 3)
    visitDone(h, p, who, G.darts, bust ? 0 : G.darts.reduce((s, x) => s + val(x), 0), bust, win);
  persist();
  render();
}

/* A finished visit, however it was entered (dart by dart or as a total): record it, then game shot / next thrower. */
function visitDone(h, p, who, darts, total, bust, win) {
  const v = {
    id: 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    time: new Date().toISOString(),
    game: G.id,
    mode: G.mode,
    player: who,
    team: G.teams ? p.name : '',
    roster: G.roster,
    start: G.start,
    d: [...darts],
    total,
    bust: +bust,
    co: +win,
  };
  visits.push(v);
  queue.push(v);
  h.added.push(v.id);
  store(['visits', 'queue'], (a, b) => {
    a.put(v);
    b.put(v);
  });
  if (bust) p.rem = G.start;
  G.last =
    who +
    ': ' +
    (darts[0] === '?' ? '' : darts.map(lbl).join(' ') + ' = ') +
    (bust ? 'bust' : total);
  if (win) {
    if (v.team) WINT[G.id] = v.team;
    if (url) setTimeout(sync, 300);
    if (G.need > 1 && ++G.lw[G.cur] < G.need) {
      G.legWon = p.name;
      say('Game shot! ' + p.name + ' wins the leg.');
    } else {
      G.done = p.name;
      say(
        G.need > 1
          ? 'Game shot, and the match! ' + p.name + ' wins.'
          : 'Game shot! ' + p.name + ' wins the leg.',
      );
    }
  } else {
    p.mi = (p.mi + 1) % p.m.length;
    G.cur = (G.cur + 1) % G.pl.length;
    G.darts = [];
    G.start = G.pl[G.cur].rem;
    say(bust ? 'Bust' : spoken(total), turnCall());
  }
}

/* Total entry: the whole visit typed or tapped at once. A finish asks how many darts it took. */
let KP = '',
  entryMode = LS('entry') || 'board';

function entry(total) {
  if (!G || G.type !== '01' || G.done || G.legWon || G.pendCo || !(total >= 0 && total <= 180))
    return;
  if (G.pl[G.cur].rem - total === 0) {
    G.pendCo = total;
    KP = '';
    return render();
  }
  entryGo(total, 3);
}

function entryGo(total, nd) {
  G.pendCo = 0;
  const h = { G: JSON.parse(JSON.stringify(G)), added: [] };
  hist.push(h);
  const p = G.pl[G.cur],
    who = p.m[p.mi],
    left = p.rem - total,
    bust = left < 0 || left === 1,
    win = left === 0;
  if (!bust) p.rem = left;
  KP = '';
  visitDone(h, p, who, Array(nd).fill('?'), bust ? 0 : total, bust, win);
  persist();
  render();
}

function nextLeg() {
  G.starter = (G.starter + 1) % G.pl.length;
  G.leg++;
  G.legWon = null;
  G.id = 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
  G.pl.forEach((x) => {
    x.rem = G.mode;
    x.mi = 0;
  });
  G.cur = G.starter;
  G.darts = [];
  G.start = G.mode;
  G.last = '';
  render();
  say(turnCall());
}
