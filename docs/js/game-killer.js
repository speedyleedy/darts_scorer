/**
 * Killer: scoring rules and screen.
 */

function klr() {
  if (G.done) say(G.msg, G.done + ' wins!');
  else if (G.phase === 'pick') say(G.msg, whoNow() + ', pick your number');
  else say(G.msg, G.darts.length === 0 ? whoNow() + ' to throw' : '');
  render();
}

function klThr(d) {
  const h = { G: JSON.parse(JSON.stringify(G)), added: [], rows: [] },
    ty = d[0],
    n = ['25', '50', '0'].includes(d) ? 0 : +d.slice(1);
  if (G.phase === 'pick') {
    const p = G.pl[G.cur];
    if (!n) {
      G.msg = 'Tap a number on the board.';
      return klr();
    }
    if (G.pl.some((x) => x.num === n)) {
      G.msg = n + ' is taken. Pick another number.';
      return klr();
    }
    hist.push(h);
    p.num = n;
    G.msg = '';
    if (G.cur === G.pl.length - 1) {
      G.phase = 'play';
      G.cur = 0;
    } else G.cur++;
    return klr();
  }
  hist.push(h);
  const p = G.pl[G.cur];
  p.darts++;
  G.darts.push(d);
  G.msg = '';
  if (ty === 'D' && n) {
    if (n === p.num && !p.killer) {
      p.killer = true;
      p.kd = p.darts;
      G.msg = p.name + ' is now a KILLER!';
    } else if (p.killer) {
      const v = G.pl.find((x) => x.alive && x !== p && x.num === n);
      if (v) {
        v.lives--;
        p.kills++;
        G.msg = p.name + ' hit ' + v.name + ': ' + (v.lives ? v.lives + ' left' : 'OUT!');
        if (!v.lives) {
          v.alive = false;
          G.out.push(v.name);
        }
      }
    }
  }
  const alive = G.pl.filter((x) => x.alive);
  if (alive.length === 1) {
    G.done = alive[0].name;
    const N = G.pl.length;
    G.pl.forEach((x) => {
      const r = {
        id: rid('k'),
        time: new Date().toISOString(),
        game: G.id,
        player: x.name,
        number: x.num,
        lives: G.lives,
        darts: x.darts,
        kills: x.kills,
        killer: +x.killer,
        kd: x.kd || '',
        place: x.name === G.done ? 1 : N - G.out.indexOf(x.name),
        won: +(x.name === G.done),
      };
      addRow('kl', r);
      h.rows.push({ t: 'kl', id: r.id });
    });
    if (url) setTimeout(sync, 300);
  } else if (G.darts.length === 3) {
    G.darts = [];
    do {
      G.cur = (G.cur + 1) % G.pl.length;
    } while (!G.pl[G.cur].alive);
  }
  klr();
}

function klView() {
  const pick = G.phase === 'pick',
    p = G.pl[G.cur];
  const cards = G.pl
    .map(
      (x, i) =>
        `<div class="pl${i === G.cur && !G.done ? ' cur' : ''}" style="${x.alive ? '' : 'opacity:.4'}"><h3>${esc(x.name)}${x.killer ? '<span class=bdg style="color:var(--acc)">KILLER</span>' : ''}${x.alive ? '' : '<span class=bdg>Out</span>'}</h3><div class=rem style="grid-row:1/3;grid-column:2;font-size:56px">${x.num ? 'D' + x.num : '–'}</div><div style="letter-spacing:3px;font-size:18px">${'●'.repeat(x.lives)}<span class=mut>${'○'.repeat(G.lives - x.lives)}</span> <span class=mut style="letter-spacing:0;font-size:13px">${x.kills} kills</span></div></div>`,
    )
    .join('');
  const tg = G.pl
    .filter((x) => x.alive && x !== p && x.num)
    .map((x) => `D${x.num} (${esc(x.name)})`)
    .join(', ');
  const tip = G.done
    ? ''
    : pick
      ? `<div class=hint>${esc(p.name)}, tap your number on the board. Taken: ${
          G.pl
            .filter((x) => x.num)
            .map((x) => x.num)
            .join(', ') || 'none'
        }.</div>`
      : p.killer
        ? `<div class=hint>You are a killer. Take lives with <b>${tg}</b></div>`
        : `<div class=hint>Hit <b>D${p.num}</b> to become a killer.</div>`;
  return shell(
    `${cards}${tip}${G.msg ? `<div class=alert style="position:static">${esc(G.msg)}</div>` : ''}${G.done ? winCard() : ''}`,
    'Killer · ' + G.lives + ' lives',
    G.done ? '' : turnBar(pick ? 'Pick a number' : 'Your turn'),
  );
}
