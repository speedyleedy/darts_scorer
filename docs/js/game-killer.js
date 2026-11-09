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
  /* hits: whole wedge counts a single 1, double 2, treble 3; doubles only counts a double as 1.
     Games saved before the options existed have no kt, so they keep the doubles rules. */
  const hits = !n ? 0 : G.kt === 'w' ? ({ S: 1, D: 2, T: 3 })[ty] : ty === 'D' ? 1 : 0;
  if (hits && n === p.num) {
    const msg = [];
    if (!p.killer) {
      p.killer = true;
      p.kd = p.darts;
      msg.push(p.name + ' is now a KILLER!');
    }
    const back = G.heal ? Math.min(hits, G.lives - p.lives) : 0;
    if (back) {
      p.lives += back;
      msg.push(p.name + ' wins back ' + (back > 1 ? back + ' lives' : 'a life') + ': ' + p.lives + ' left');
    }
    G.msg = msg.join(' ');
  } else if (hits && p.killer) {
    const v = G.pl.find((x) => x.alive && x !== p && x.num === n);
    if (v) {
      const took = Math.min(hits, v.lives);
      v.lives -= took;
      p.kills += took;
      G.msg =
        p.name + ' hit ' + v.name + (took > 1 ? ' for ' + took : '') + ': ' + (v.lives ? v.lives + ' left' : 'OUT!');
      if (!v.lives) {
        v.alive = false;
        G.out.push(v.name);
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
    p = G.pl[G.cur],
    w = G.kt === 'w',
    tgt = (x) => (w ? '' : 'D') + x.num;
  /* the thrower's card first and full size; everyone else gets a one-line card */
  const cards = byTurn()
    .map((i) => {
      const x = G.pl[i],
        head = `<h3>${esc(x.name)}${x.killer ? '<span class=bdg style="color:var(--acc)">KILLER</span>' : ''}${x.alive ? '' : '<span class=bdg>Out</span>'}</h3>`,
        lv = `${'●'.repeat(x.lives)}<span class=mut>${'○'.repeat(G.lives - x.lives)}</span>`;
      return i === G.cur
        ? `<div class="pl${G.done ? '' : ' cur'}" style="${x.alive ? '' : 'opacity:.4'}">${G.done ? head : head.replace(esc(x.name), yourTurn(x.name, pick ? 'Pick a number' : 'Your turn'))}<div class="rem krem">${x.num ? tgt(x) : '–'}</div><div style="letter-spacing:3px;font-size:18px">${lv} <span class=mut style="letter-spacing:0;font-size:13px">${x.kills} kills</span></div></div>`
        : `<div class="pl sm" style="${x.alive ? '' : 'opacity:.4'}">${head}<div class=rm><div class=rem>${x.num ? tgt(x) : '–'}</div></div><div class=sml><span style="letter-spacing:2px">${lv}</span> · ${x.kills} kills</div></div>`;
    })
    .join('');
  const tg = G.pl
    .filter((x) => x.alive && x !== p && x.num)
    .map((x) => `${tgt(x)} (${esc(x.name)})`)
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
        ? `<div class=hint>You are a killer. Take lives with <b>${tg}</b>${G.heal && p.lives < G.lives ? `. Hit <b>${tgt(p)}</b> for lives back.` : ''}</div>`
        : `<div class=hint>Hit <b>${tgt(p)}</b>${w ? ' (any ring)' : ''} to become a killer.</div>`;
  return shell(
    `${cards}${G.msg ? `<div class="alert kmsg">${esc(G.msg)}</div>` : tip}${G.done ? winCard() : ''}`,
    'Killer · ' + G.lives + ' lives' + (w ? ' · whole wedge' : ' · doubles') + (G.heal ? ' · lives back' : ''),
    G.done ? '' : turnBar(pick ? 'Pick a number' : 'Your turn', 'dup'),
  );
}
