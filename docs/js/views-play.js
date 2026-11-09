/**
 * The live game screen: player cards, the board panel, the keypad and the visits list.
 */

const dtag = (d, x = '') => {
  const c = d[0] === 'T' ? 'var(--tr)' : d[0] === 'D' || d === '50' ? 'var(--db)' : 'var(--line)';
  return `<span class="dt ${x}" style="--c:${c}">${lbl(d)}</span>`;
};

function card(q, i, c) {
  const cur = i === G.cur,
    mine = visits.filter(
      (v) => v.game === G.id && (G.teams ? v.team === q.name : v.player === q.name),
    ),
    s = pstats(mine),
    lv = mine[mine.length - 1];
  const base = pstats(visits.filter((v) => v.player === q.name && v.game !== G.id)),
    avg = mean(s.pts, s.dk),
    dl = !G.teams && s.dk >= 3 && base.dk >= 30 ? avg - mean(base.pts, base.dk) : null;
  const ds = cur ? G.darts : lv ? lv.d : [],
    t = G.darts.reduce((x, d) => x + val(d), 0),
    on = cur && !G.done && c;
  const entered = !cur && lv && lv.d[0] === '?';
  const slots = entered
    ? `<span class=dt style="width:auto;flex:none;padding:0 1rem">${lv.bust ? 'Bust' : lv.total}</span>`
    : [0, 1, 2]
        .map((k) =>
          ds[k]
            ? dtag(ds[k])
            : `<span class="dt e${cur && !G.done && k === ds.length ? ' nx' : ''}">·</span>`,
        )
        .join('');
  const tons = [
    ['180', s.c],
    ['140+', s.b],
    ['100+', s.a],
  ]
    .filter((x) => x[1])
    .slice(0, 1)
    .map((x) => `<span class=bdg>${x[0]} ×${x[1]}</span>`)
    .join('');
  const badges = `${G.need > 1 ? `<span class=bdg>Legs ${G.lw[i]}</span>` : ''}${G.done === q.name ? '<span class=bdg style="color:var(--db)">Winner</span>' : ''}`;
  /* everyone waiting gets a one-line card, so the thrower's card always has the room */
  if (!cur)
    return `<div class="pl sm"><h3>${esc(q.name)}${badges}</h3><div class=rm><div class=rem>${q.rem}</div></div><div class=sml>${G.teams ? esc(q.m[q.mi]) + ' next · ' : ''}Last ${lv ? (lv.bust ? 'bust' : lv.total) : '–'} · Avg ${f1(avg)}</div></div>`;
  return `<div class="pl${cur ? ' cur' : ''}"><h3>${cur && !G.done && !G.legWon ? yourTurn(q.m[q.mi]) : esc(q.name)}${G.need > 1 ? `<span class=bdg>Legs ${G.lw[i]}</span>` : ''}${G.teams ? `<span class=mem>${q.m.map((n, k) => `<span class="${cur && !G.done && k === q.mi ? 'now' : ''}">${esc(n)}</span>`).join('')}</span>` : ''}${G.done === q.name ? '<span class=bdg style="color:var(--db)">Winner</span>' : ''}${tons}</h3>
  <div class=rm><div class="rem${on ? ' on' : ''}">${q.rem}</div></div>
  <div class=slots>${slots}${cur ? `<span class=vt>${G.darts.length ? t : ''}</span>` : ''}</div>
  ${on ? `<div class=fin><span class=mut>Finish</span>${c.map((d) => dtag(d)).join('<span class=mut>›</span>')}</div>` : ''}
  <div class=st><div><small>Average</small><b>${f1(avg)}</b>${dl == null ? '' : `<span class="dl ${dl >= 0 ? 'up' : 'dn'}">${dl >= 0 ? '▲' : '▼'} ${Math.abs(dl).toFixed(1)}</span>`}</div><div><small>First 9</small><b>${f1(mean(s.f9p, s.f9d))}</b></div><div><small>Darts</small><b>${s.dk}</b></div><div><small>Last visit</small>${lv ? (lv.bust ? '<b class=dn>Bust</b>' : `<b>${lv.total}</b>`) : '<b>–</b>'}</div></div></div>`;
}

/* the thrower's card leads with their name, big enough to read from the oche */
const yourTurn = (n, l = 'Your turn') => `<span class=yt>${l}, <b>${esc(n)}!</b></span>`;

/* player indexes from the thrower round, so the thrower's card comes first and the rest follow in throwing order */
const byTurn = () => G.pl.map((_, k) => (G.cur + k) % G.pl.length);

const turnBar = (l, cls = '') => {
  const p = G.pl[G.cur];
  return `<div class="turn ${cls}"><small>${l || 'Your turn'}</small><b>${esc(p.m[p.mi])}</b>${G.teams ? `<span class=mut>${esc(p.name)}</span>` : ''}</div>`;
};

const tot = () => G.type === '01' && entryMode === 'total';

const keypad = () => {
  if (G.pendCo)
    return `<div class=choose><b>${G.pendCo}</b> <span class=mut>Game shot. How many darts did the finish take?</span><div class="d-flex gap-2 mt-2">${[1, 2, 3].map((n) => `<button class=pri data-a=kco data-v=${n}>${n} dart${n > 1 ? 's' : ''}</button>`).join('')}</div></div>`;
  return `<div class=kpw><div class=kd>${KP || '<span class=mut>Score</span>'}</div><div class=kg>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-a=kd data-v=${n}>${n}</button>`).join('')}<button data-a=kb aria-label="Delete">⌫</button><button data-a=kd data-v=0>0</button><button class=pri data-a=ke>Enter</button></div><div class=kq>${[26, 41, 45, 60, 85, 100, 140, 180].map((n) => `<button data-a=kq data-v=${n}>${n}</button>`).join('')}</div><p class=mut style="font-size:.8rem;margin:.6rem 0 0;text-align:center">Total entry skips dart-by-dart stats such as doubles and the heat map.</p></div>`;
};

/* extra: shown under the cards on wider screens; below: shown under the one-screen game area on phones */
const shell = (left, sub, tb, extra = '', below = '') =>
  `<div class="row g-3 g-lg-4${tot() ? ' tot' : ''}"><div class="col-lg-5"><div class=cards><h2 class=hd>Live match</h2>${left}</div>${extra ? `<div class=dsk>${extra}</div>` : ''}</div><div class="col-lg-7"><div class=panel><div class=lv><span class=live>Live</span><span class=mut>${sub}</span>${G.type === '01' ? `<div class="pills d-flex gap-1 ms-auto"><button data-a=em data-v=board class="${tot() ? '' : 'on'}">Board</button><button data-a=em data-v=total class="${tot() ? 'on' : ''}">Enter Manually</button></div>` : ''}${canSpeak() ? `<button data-a=voice class="${G.type === '01' ? '' : 'ms-auto'}${voiceOn ? ' on' : ''}">${voiceOn ? 'Voice on' : 'Voice off'}</button>` : ''}</div>${tb}${tot() ? keypad() : prOff() ? prPanel() : `<div class=bd>${BOARD}</div>`}${tot() || prOff() ? '<div class="d-flex flex-wrap gap-2 align-items-center" style="margin-top:.5rem"><button data-a=undo>Undo</button><button data-a=quit>End game</button></div>' : G.type === 'pr' && !G.done && !G.stepDone ? prCtrls : ctrls}</div></div></div>${below ? `<div class="mob mhist">${below}</div>` : ''}`;

const ctrls =
  '<div class="d-flex flex-wrap gap-2 align-items-center" style="margin-top:8px"><button data-a=undo>Undo</button><button data-d="0">Miss</button><button data-a=quit>End game</button></div>';

/* practice drills can be skipped without recording anything */
const prCtrls =
  '<div class="d-flex flex-wrap gap-2 align-items-center" style="margin-top:8px"><button data-a=undo>Undo</button><button data-d="0">Miss</button><button data-a=prnext>Skip drill</button><button data-a=quit>End game</button></div>';

const winCard = () =>
  `<div class="sec ovl"><b>${G.done === 'Draw' ? 'Drawn game' : esc(G.done) + ' wins!'}</b><div class="d-flex flex-wrap gap-2 align-items-center" style="margin-top:8px"><button class=pri data-a=again>Rematch</button><button data-a=quit>New game</button></div></div>`;

function game() {
  if (G.type === 'mm') return mmView();
  if (G.type === 'kl') return klView();
  if (G.type === 'ft') return ftView();
  if (G.type === 'pr') return prView();
  const hx = visits
    .filter((v) => v.game === G.id)
    .slice(-8)
    .reverse();
  const row = (v) =>
    `<tr><td>${esc(v.player)}</td><td>${v.d[0] === '?' ? '<span class=mut>total entered</span>' : v.d.map(lbl).join(' ')}</td><td>${v.bust ? 'Bust' : v.total}</td><td>${v.bust ? v.start : v.start - v.total}</td></tr>`;
  const all = visits.filter((v) => v.game === G.id).reverse(),
    /* phones: every visit of this game, always rendered so the game area above never changes height */
    below = `<div class="sec hsec"><h4>Visits</h4>${all.length ? `<div class=table-responsive><table class=hist><tr><th>Player</th><th>Darts</th><th>Score</th><th>Left</th></tr>${all.map(row).join('')}</table></div>` : '<p class=mut>No visits yet.</p>'}</div>`;
  const hsec = hx.length
    ? `<div class="sec hsec"><h4>Visits</h4><div class=table-responsive><table class=hist><tr><th>Player</th><th>Darts</th><th>Score</th><th>Left</th></tr>${hx.map((v) => `<tr><td>${esc(v.player)}</td><td>${v.d[0] === '?' ? '<span class=mut>total entered</span>' : v.d.map(lbl).join(' ')}</td><td>${v.bust ? 'Bust' : v.total}</td><td>${v.bust ? v.start : v.start - v.total}</td></tr>`).join('')}</table></div></div>`
    : '';
  const p = G.pl[G.cur],
    c = G.done ? null : co(p.rem, 3 - G.darts.length);
  const left = byTurn()
      .map((i) => card(G.pl[i], i, c))
      .join(''),
    who = p.m[p.mi],
    turn =
      G.pl.length > 1 || p.m.length > 1
        ? `<div class="turn dup"${G.done || G.legWon ? ' style="visibility:hidden"' : ''}><small>Your turn</small><b>${esc(who)}</b>${G.teams ? `<span class=mut>${esc(p.name)}</span>` : ''}</div>`
        : '',
    /* phones: the finish route sits on its own fixed line, so the cards never change height */
    mfin = `<div class=mfin>${c ? `<span class=mut>Finish</span>${c.map((d) => dtag(d)).join('<span class=mut>›</span>')}` : ''}</div>`;
  return shell(
    `${left}${mfin}
    ${G.legWon ? `<div class="sec ovl"><b>${esc(G.legWon)} wins leg ${G.leg}.</b> <span class=mut>${G.pl.map((x, k) => esc(x.name) + ' ' + G.lw[k]).join(' · ')}</span><div class="d-flex flex-wrap gap-2 align-items-center" style="margin-top:.5rem"><button class=pri data-a=nextleg>Next leg</button></div></div>` : ''}${G.done ? `<div class="sec ovl"><b>${esc(G.done)} wins ${G.need > 1 ? 'the match' : 'the leg'}.</b> <span class=mut>${winLine()}</span><div class="d-flex flex-wrap gap-2 align-items-center" style="margin-top:8px"><button class=pri data-a=again>Rematch</button><button data-a=quit>New game</button></div></div>` : ''}`,
    G.mode +
      ' · double out' +
      (G.teams ? ' · teams' : '') +
      (G.need > 1 ? ' · first to ' + G.need + ', leg ' + G.leg : ''),
    turn,
    hsec,
    below,
  );
}
