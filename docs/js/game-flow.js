/**
 * Starting and undoing a game of any type.
 */

function startGame() {
  const T = fmt === 'teams' && gt !== 'kl' && gt !== 'pr';
  let sides;
  if (T) {
    const ts = teams.filter((t) => t.m.length);
    if (ts.length < 2) {
      note = 'Teams needs at least two teams with a player in each.';
      return render();
    }
    sides = ts.map((t) => ({
      name: t.name.trim() || t.m.join(' & '),
      m: [...t.m],
      mi: 0,
      rem: mode,
    }));
  } else {
    if (gt === 'pr' && sel.length !== 1) {
      note = 'Practice is for one player. Select just you.';
      return render();
    }
    if (gt === 'pr' && !prOn.length) {
      note = 'Pick at least one drill for your routine.';
      return render();
    }
    if (sel.length < (gt === 'kl' ? 2 : 1)) {
      note = gt === 'kl' ? 'Killer needs at least two players.' : 'Select at least one player.';
      return render();
    }
    sides = sel.map((n) => ({ name: n, m: [n], mi: 0, rem: mode }));
  }
  if (gt === 'mm')
    sides.forEach((x) => {
      x.marks = Object.fromEntries(MT.map((k) => [k, 0]));
      x.mem = {};
    });
  if (gt === 'kl')
    sides.forEach((x) =>
      Object.assign(x, { num: null, lives, alive: true, killer: false, kills: 0, darts: 0 }),
    );
  if (gt === 'ft')
    sides.forEach((x) => Object.assign(x, { qs: [0, 0, 0, 0], goals: 0, behinds: 0, mem: {} }));
  note = '';
  G = {
    id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
    type: gt,
    mode,
    lives,
    kt,
    heal,
    teams: T,
    roster: JSON.stringify(sides.map((x) => x.m)),
    pl: sides,
    cur: 0,
    darts: [],
    start: mode,
    done: null,
    last: '',
    msg: '',
    phase: gt === 'kl' ? 'pick' : 'play',
    out: [],
    vpq,
    q: 0,
    round: 0,
    need: gt === '01' ? need : 1,
    lw: sides.map(() => 0),
    leg: 1,
    starter: 0,
  };
  if (gt === 'pr') {
    Object.assign(G, { steps: [...prOn], si: 0, min: prMin, res: [] });
    prEnter();
  }
  hist = [];
  try {
    localStorage.setItem('setup', JSON.stringify({ gt, fmt, mode, sel, teams, need, lives, kt, heal, vpq, prOn, prMin }));
  } catch (e) {}
  render();
  openCall();
}

function undo() {
  const h = hist.pop();
  if (!h) return;
  if (canSpeak()) speechSynthesis.cancel();
  G = h.G;
  KP = '';
  if (!G.done) delete WINT[G.id];
  visits = visits.filter((v) => !h.added.includes(v.id));
  queue = queue.filter((v) => !h.added.includes(v.id));
  store(['visits', 'queue'], (a, b) =>
    h.added.forEach((id) => {
      a.delete(id);
      b.delete(id);
    }),
  );
  (h.rows || []).forEach((x) => {
    fun[x.t] = fun[x.t].filter((r) => r.id !== x.id);
    fq[x.t] = fq[x.t].filter((r) => r.id !== x.id);
    store([x.t, x.t + 'q'], (a, b) => {
      a.delete(x.id);
      b.delete(x.id);
    });
  });
  persist();
  render();
}
