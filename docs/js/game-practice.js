/**
 * Practice mode: one player works through a routine of drills. Warm-up and doubles are untracked
 * (a target list and a countdown); 30 at 20, 3 in a bed and 10 down are scored and kept in the Practice worksheet.
 */

/* The drills, in routine order. Only the tracked ones write a row. */
const PRS = [
  ['warm', 'Warm-up'],
  ['t20', '30 at 20'],
  ['dbl', 'Doubles'],
  ['bed', '3 in a bed'],
  ['down', '10 down'],
];
const PRL = Object.fromEntries(PRS);
const PRWARM = [
  [20, '20'],
  [50, 'Bull'],
  [19, '19'],
];
/* the row's drill name, and whether a lower score is better */
const PRD = { t20: '30at20', bed: 'bed', down: '10down' },
  prLow = (drill) => drill === '10down';

const prStep = () => G.steps[G.si];

/* the number a dart landed in: 1 to 20, 25 for either bull, 0 for a miss */
const prNum = (d) => (d === '0' ? 0 : d === '25' || d === '50' ? 25 : +d.slice(1));

/* earlier results for this player and drill (10 down only compares the same number) */
const prPrev = (who, drill, target) =>
  fun.pr
    .filter(
      (r) =>
        r.player === who &&
        r.drill === drill &&
        (target == null || String(r.target) === String(target)) &&
        !(G && r.game === G.id),
    )
    .sort(byTime);

const prBest = (rows, drill) =>
  rows.length ? (prLow(drill) ? Math.min : Math.max)(...rows.map((r) => r.score)) : null;

const prNumLbl = (n) => (n === 25 ? 'Bull' : String(n));

/* a new number for 3 in a bed, never one already used this session */
function prBedPick() {
  const left = Array.from({ length: 20 }, (_, i) => i + 1).filter((n) => !G.bed.includes(n));
  G.bed.push(left[Math.floor(Math.random() * left.length)]);
}

/* set up the step at G.si (or finish the routine) */
function prEnter() {
  G.darts = [];
  G.dk = 0;
  G.pts = 0;
  G.stepDone = false;
  const s = prStep();
  if (!s) {
    G.done = G.pl[0].name;
    say('Practice done. Well thrown.');
    if (url) setTimeout(sync, 300);
    return;
  }
  if (s === 'warm') G.wi = 0;
  if (s === 'dbl') {
    G.dEnd = 0;
    G.dLeft = G.min * 60000;
  }
  if (s === 'bed') {
    G.bed = [];
    prBedPick();
  }
  if (s === 'down') {
    G.dn = null;
    G.left = 10;
  }
  say(
    s === 'warm'
      ? 'Warm-up. Nine darts at 20.'
      : s === 't20'
        ? '30 darts at 20.'
        : s === 'dbl'
          ? G.min + ' minutes of doubles.'
          : s === 'bed'
            ? '3 in a bed. Aim at ' + G.bed[0] + '.'
            : '10 down. Tap the number you want.',
  );
}

function prNext() {
  hist.push({ G: JSON.parse(JSON.stringify(G)), added: [], rows: [] });
  G.si++;
  prEnter();
  render();
}

/* a tracked drill is over: record it and show the result */
function prFinish(h, target) {
  const s = prStep(),
    drill = PRD[s],
    who = G.pl[0].name,
    score = s === 'down' ? G.dk : G.pts,
    prev = prPrev(who, drill, s === 'down' ? target : null),
    best = prBest(prev, drill),
    r = {
      id: rid('p'),
      time: new Date().toISOString(),
      game: G.id,
      player: who,
      drill,
      target: String(target),
      darts: G.dk,
      score,
    };
  addRow('pr', r);
  h.rows.push({ t: 'pr', id: r.id });
  G.res.push({ s, target: String(target), score, last: prev.length ? prev[prev.length - 1].score : null, best });
  G.stepDone = true;
  const pb = best != null && (prLow(drill) ? score < best : score > best);
  say(
    s === 'down' ? 'Done in ' + score + ' darts.' : score + (s === 't20' ? ' out of 30.' : ' points.'),
    pb ? 'A new best!' : '',
  );
}

function prThr(d) {
  const s = prStep();
  if (G.stepDone || !['t20', 'bed', 'down'].includes(s)) return;
  const h = { G: JSON.parse(JSON.stringify(G)), added: [], rows: [] };
  hist.push(h);
  const n = prNum(d);
  if (s === 'down' && !G.dn) {
    /* the first tap picks the number */
    if (!n) {
      hist.pop();
      note = 'Tap the number you want to aim at.';
      return render();
    }
    G.dn = n;
    say('Aim at ' + (n === 25 ? 'the bull' : n) + '.');
    return render();
  }
  if (G.darts.length === 3) G.darts = [];
  G.darts.push(d);
  G.dk++;
  if (s === 't20') {
    if (n === 20) G.pts++;
    if (G.dk === 30) prFinish(h, 20);
  } else if (s === 'bed') {
    const t = G.bed[G.bed.length - 1];
    if (n === t) G.pts += d[0] === 'T' ? 2 : 1;
    if (G.dk % 3 === 0) {
      if (G.bed.length === 3) prFinish(h, G.bed.join(' '));
      else {
        prBedPick();
        say('Aim at ' + G.bed[G.bed.length - 1] + '.');
      }
    }
  } else {
    G.left += n === G.dn ? -1 : 1;
    if (G.left === 0) prFinish(h, prNumLbl(G.dn));
  }
  render();
}

/* ---------- doubles countdown ---------- */
const prClk = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const prLeft = () => (G.dEnd ? G.dEnd - Date.now() : G.dLeft);

setInterval(() => {
  if (!G || G.type !== 'pr' || G.done || prStep() !== 'dbl' || !G.dEnd) return;
  const ms = G.dEnd - Date.now(),
    el = document.getElementById('prclk');
  if (ms <= 0) {
    G.dEnd = 0;
    G.dLeft = 0;
    try {
      navigator.vibrate && navigator.vibrate([300, 150, 300]);
    } catch (e) {}
    say("Time's up.");
    render();
  } else if (el) el.textContent = prClk(ms);
}, 250);

/* ---------- screen ---------- */

/* warm-up and doubles have no board: their controls take its place */
const prOff = () => G.type === 'pr' && !G.done && ['warm', 'dbl'].includes(prStep());

function prPanel() {
  if (prStep() === 'warm') {
    const [, l] = PRWARM[G.wi % 3];
    return `<div class=prp><small class=mut>Round ${Math.floor(G.wi / 3) + 1} · not scored</small><div class=prbig>9 at ${l}</div><div class=prseq>${PRWARM.map(([, x], k) => `<span class="${k === G.wi % 3 ? 'on' : ''}">${x}</span>`).join('')}</div><div class="d-flex flex-wrap gap-2 justify-content-center"><button class=pri data-a=prwarm>Next: 9 at ${PRWARM[(G.wi + 1) % 3][1]}</button><button data-a=prnext>Warmed up</button></div></div>`;
  }
  const ms = prLeft(),
    run = !!G.dEnd;
  return `<div class=prp><small class=mut>Doubles of your choice · not scored</small><div class=prbig id=prclk>${prClk(ms)}</div><div class="d-flex flex-wrap gap-2 justify-content-center">${
    ms > 0
      ? `<button class=pri data-a=prclk>${run ? 'Pause' : ms < G.min * 60000 ? 'Resume' : 'Start'}</button><button data-a=prrst>Reset</button><button data-a=prnext>Finish early</button>`
      : `<button class=pri data-a=prnext>Time's up: next</button>`
  }</div></div>`;
}

/* the routine as a row of steps, the current one marked */
const prSteps = () =>
  `<div class=prseq>${G.steps.map((s, k) => `<span class="${k === G.si && !G.done ? 'on' : k < G.si || G.done ? 'dn' : ''}">${PRL[s]}</span>`).join('')}</div>`;

const prFmt = (x, drill) => (x == null ? '–' : drill === '10down' ? x + ' darts' : String(x));

/* last time and best for the drill in play */
function prCmp() {
  const s = prStep(),
    drill = PRD[s];
  if (!drill || (s === 'down' && !G.dn)) return { last: null, best: null };
  const prev = prPrev(G.pl[0].name, drill, s === 'down' ? prNumLbl(G.dn) : null);
  return { last: prev.length ? prev[prev.length - 1].score : null, best: prBest(prev, drill), drill };
}

function prCard() {
  const s = prStep(),
    p = G.pl[0],
    { last, best, drill } = prCmp(),
    big =
      s === 'warm'
        ? Math.floor(G.wi / 3) + 1
        : s === 'dbl'
          ? '<span class=mut>–</span>'
          : s === 'down'
            ? G.dn
              ? G.left
              : 10
            : G.pts,
    ds = G.darts,
    slots =
      ['t20', 'bed', 'down'].includes(s) &&
      `<div class=slots>${[0, 1, 2].map((k) => (ds[k] ? dtag(ds[k]) : `<span class="dt e${!G.stepDone && k === ds.length ? ' nx' : ''}">·</span>`)).join('')}</div>`,
    st =
      s === 't20'
        ? [
            ['Darts', G.dk + ' / 30'],
            ['Hit %', G.dk ? Math.round((G.pts / G.dk) * 100) + '%' : '–'],
            ['Last time', prFmt(last, drill)],
            ['Best', prFmt(best, drill)],
          ]
        : s === 'bed'
          ? [
              ['Number', G.bed.length + ' of 3'],
              ['Darts', G.dk + ' / 9'],
              ['Last time', prFmt(last, drill)],
              ['Best', prFmt(best, drill)],
            ]
          : s === 'down'
            ? [
                ['Number', G.dn ? prNumLbl(G.dn) : '–'],
                ['Darts', G.dk],
                ['Last time', prFmt(last, drill)],
                ['Best', prFmt(best, drill)],
              ]
            : null;
  return `<div class="pl cur"><h3>${esc(p.name)}<span class=bdg>${PRL[s]}</span></h3><div class=rm><div class=rem>${big}</div></div>${slots || ''}${st ? `<div class=st>${st.map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('')}</div>` : ''}</div>`;
}

/* one line under the card: what to aim at, and the numbers to beat (phones hide the stats grid) */
function prHint() {
  const s = prStep(),
    { last, best, drill } = prCmp(),
    beat = drill && (last != null || best != null) ? ` · last ${prFmt(last, drill)} · best ${prFmt(best, drill)}` : '';
  if (s === 'warm') return 'Nine darts at 20, then the bull, then 19. Go round until you are warm.';
  if (s === 'dbl') return `Pick a few doubles and work on them until the clock runs out.`;
  if (s === 't20') return `Aim at <b>20</b>: 1 point for every dart in the 20${beat}`;
  if (s === 'bed')
    return `Aim at <b>${G.bed[G.bed.length - 1]}</b>: 1 point, 2 for the treble${beat}`;
  return G.dn
    ? `Aim at <b>${prNumLbl(G.dn)}</b>: a hit takes 1 off, a miss adds 1${beat}`
    : 'Tap the number you want to aim at. You start on 10.';
}

const prResLine = (r) => {
  const drill = PRD[r.s],
    pb = r.best != null && (prLow(drill) ? r.score < r.best : r.score > r.best);
  return `<tr><td>${PRL[r.s]}${r.s === 't20' ? '' : ` <span class=mut>${esc(r.target)}</span>`}</td><td><b>${prFmt(r.score, drill)}</b>${pb ? ' <span class=bdg style="color:var(--db)">New best</span>' : ''}</td><td>${prFmt(r.last, drill)}</td><td>${prFmt(r.best, drill)}</td></tr>`;
};

function prView() {
  const s = G.done ? null : prStep(),
    r = G.res[G.res.length - 1],
    over =
      G.stepDone && r
        ? `<div class="sec ovl"><b>${PRL[r.s]}: ${prFmt(r.score, PRD[r.s])}${r.s === 't20' ? ' / 30' : ''}</b> <span class=mut>last ${prFmt(r.last, PRD[r.s])} · best ${prFmt(r.best, PRD[r.s])}</span><div class="d-flex flex-wrap gap-2 align-items-center" style="margin-top:8px"><button class=pri data-a=prnext>${G.si + 1 < G.steps.length ? 'Next: ' + PRL[G.steps[G.si + 1]] : 'Finish'}</button></div></div>`
        : '',
    done = G.done
      ? `<div class="sec ovl"><b>Practice done.</b>${G.res.length ? `<div class=table-responsive><table><tr><th>Drill</th><th>Today</th><th>Last time</th><th>Best before</th></tr>${G.res.map(prResLine).join('')}</table></div>` : ' <span class=mut>Nothing scored this time.</span>'}<div class="d-flex flex-wrap gap-2 align-items-center" style="margin-top:8px"><button class=pri data-a=again>Practise again</button><button data-a=quit>Done</button></div></div>`
      : '',
    tb = G.done
      ? ''
      : `<div class=turn><small>${s === 'warm' || s === 'dbl' ? 'Practice' : PRL[s]}</small><b>${s === 'bed' ? 'Aim at ' + G.bed[G.bed.length - 1] : s === 'down' ? (G.dn ? 'Aim at ' + prNumLbl(G.dn) : 'Pick a number') : s === 't20' ? 'Aim at 20' : s === 'dbl' ? 'Doubles' : 'Warm-up'}</b></div>`;
  return shell(
    `${G.done ? '' : prCard()}${prSteps()}${G.done ? '' : `<div class=hint>${prHint()}</div>`}${over}${done}`,
    'Practice',
    tb,
  );
}

/* ---------- progress: one player's drills, for the lobby and the Party tab ---------- */
function prBoard(who) {
  const rows = fun.pr.filter((r) => r.player === who).sort(byTime),
    lines = [];
  [
    ['30at20', '30 at 20'],
    ['bed', '3 in a bed'],
  ].forEach(([d, l]) => lines.push([l, d, rows.filter((r) => r.drill === d)]));
  [...new Set(rows.filter((r) => r.drill === '10down').map((r) => r.target))]
    .sort((a, b) => (a === 'Bull' ? 25 : +a) - (b === 'Bull' ? 25 : +b))
    .forEach((t) =>
      lines.push(['10 down · ' + esc(t), '10down', rows.filter((r) => r.drill === '10down' && r.target === t)]),
    );
  const body = lines
    .filter(([, , rs]) => rs.length)
    .map(([l, d, rs]) => {
      const sc = rs.map((r) => r.score),
        l5 = sc.slice(-5);
      return `<tr><td>${l}</td><td>${rs.length}</td><td>${prFmt(sc[sc.length - 1], d)}</td><td>${prFmt(prBest(rs, d), d)}</td><td>${(l5.reduce((a, b) => a + b, 0) / l5.length).toFixed(1)}</td><td class=mut>${sc.slice(-10).join(' ')}</td></tr>`;
    })
    .join('');
  return body
    ? `<div class=table-responsive><table><tr><th>${esc(who)}</th><th>Times</th><th>Last</th><th>Best</th><th>Last 5 avg</th><th>Recent</th></tr>${body}</table></div>`
    : `<p class=lobby-note>No practice recorded for ${esc(who)} yet.</p>`;
}
