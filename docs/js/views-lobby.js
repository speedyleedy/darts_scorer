/**
 * The New game screen.
 */

const gameOpts = () =>
  gt === '01'
    ? `<div class="d-flex flex-wrap gap-2 align-items-center" style="margin:10px 0">${[301, 501, 701].map((m) => `<button data-a=mode data-v=${m} class="${mode === m ? 'on' : ''}">${m}</button>`).join('')}<input id=cm type=number min=2 max=9999 placeholder="Custom" value="${[301, 501, 701].includes(mode) ? '' : mode}" style="width:7rem"><button data-a=cust>Use</button></div><p class=lobby-note>Starts on ${mode}. Double out.</p><h4 style="margin-top:1.25rem">Match</h4><div class="d-flex flex-wrap gap-2 align-items-center"><span class=mut>First to</span>${[1, 2, 3, 5].map((n) => `<button data-a=need data-v=${n} class="${need === n ? 'on' : ''}">${n}</button>`).join('')}<span class=mut>leg${need > 1 ? 's' : ''}</span></div>`
    : gt === 'mm'
      ? '<p class=mut>Close 20 down to 12, any three doubles, any three trebles, three lots of 3 in a bed and the bull. Each needs three hits: a double counts as two and a treble as three. Throw all three darts, then choose where they go: a double or treble of 12 to 20 goes either to its number or as one hit on Doubles or Trebles. 3 in a bed is all three darts in the same bed (any mix of singles, doubles and trebles, or the bull) and takes all three darts for one hit. First side to close everything wins. Teams share a scoreboard.</p>'
      : gt === 'ft'
        ? `<div class="d-flex flex-wrap gap-2 align-items-center" style="margin:10px 0"><span class=mut>Visits per quarter</span>${[1, 2, 3, 5].map((n) => `<button data-a=vpq data-v=${n} class="${vpq === n ? 'on' : ''}">${n}</button>`).join('')}</div><p class=mut>Four quarters, aiming at 6, then 3, then 11, then 20. Hit the target for a goal (6 points) or a neighbouring number for a behind (1 point). Doubles and trebles multiply both. Highest total after four quarters wins. Teams share a score.</p>`
        : `<div class="d-flex flex-wrap gap-2 align-items-center" style="margin:10px 0"><span class=mut>Lives</span>${[3, 5].map((n) => `<button data-a=lives data-v=${n} class="${lives === n ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="d-flex flex-wrap gap-2 align-items-center" style="margin:10px 0"><span class=mut>Target</span><button data-a=kt data-v=w class="${kt === 'w' ? 'on' : ''}">Whole wedge</button><button data-a=kt data-v=d class="${kt === 'd' ? 'on' : ''}">Doubles only</button></div>
        <div class="d-flex flex-wrap gap-2 align-items-center" style="margin:10px 0"><span class=mut>Lives back</span><button data-a=heal data-v=1 class="${heal ? 'on' : ''}">On</button><button data-a=heal data-v=0 class="${heal ? '' : 'on'}">Off</button></div>
        <p class=mut>Each player taps a number on the board to claim it. ${
          kt === 'w'
            ? 'Hit anywhere in your own wedge to become a killer, then hit other players\' wedges to take their lives: a single takes one, a double two and a treble three.'
            : 'Hit your own double to become a killer, then hit other players\' doubles to take their lives, one per hit.'
        }${heal ? ` Hitting your own ${kt === 'w' ? 'wedge' : 'double'} also wins back lives you have lost${kt === 'w' ? ' (a double two, a treble three)' : ''}, up to ${lives}.` : ''} Last player standing wins.</p>`;

const tn = (t, i) => t.name.trim() || t.m.join(' & ') || 'Team ' + (i + 1);

function lobby() {
  const T = fmt === 'teams' && gt !== 'kl',
    inT = (n) => teams.findIndex((t) => t.m.includes(n));
  const chips =
    players
      .map((p) => {
        const i = T ? inT(p) : sel.indexOf(p);
        return `<button data-a=${T ? 'pt' : 'sel'} data-v="${esc(p)}" class="${i >= 0 ? 'on' : ''}">${i >= 0 ? (T ? 'T' + (i + 1) + ' · ' : i + 1 + '. ') : ''}${esc(p)}</button>`;
      })
      .join('') || '<span class=mut>Add a player to start.</span>';
  const tcards = teams
    .map(
      (
        t,
        i,
      ) => `<div class="tm${i === at ? ' act' : ''}"><div class="d-flex flex-wrap gap-2 align-items-center"><b>Team ${i + 1}</b><input data-tn=${i} placeholder="${esc(tn({ name: '', m: t.m }, i))}" value="${esc(t.name)}"><button data-a=at data-v=${i} class="${i === at ? 'on' : ''}">${i === at ? 'Adding players here' : 'Add players here'}</button><button data-a=tup data-v=${i} title="Play earlier">↑</button><button data-a=tdn data-v=${i} title="Play later">↓</button><button data-a=tdel data-v=${i} title="Remove team">×</button></div>
    <ol class=mm>${t.m.map((n, j) => `<li>${esc(n)}<span><button data-a=mup data-v="${i}:${j}" title="Throw earlier">↑</button><button data-a=mdn data-v="${i}:${j}" title="Throw later">↓</button><button data-a=mrm data-v="${i}:${j}" title="Remove">×</button></span></li>`).join('') || '<li class=mut>No players yet</li>'}</ol></div>`,
    )
    .join('');
  return `<div class="row g-4"><div class="col-lg-6"><h4>Game</h4><div class=gt>${[
    ['01', '01 games'],
    ['mm', 'Mickey Mouse'],
    ['kl', 'Killer'],
    ['ft', 'Footy'],
  ]
    .map(([k, l]) => `<button data-a=gt data-v=${k} class="${gt === k ? 'on' : ''}">${l}</button>`)
    .join('')}</div>
    ${gt === 'kl' ? '' : `<div class="d-flex flex-wrap gap-2 mb-3"><button data-a=fmt data-v=solo class="${T ? '' : 'on'}">Individual</button><button data-a=fmt data-v=teams class="${T ? 'on' : ''}">Teams</button></div>`}
    <h4>Options</h4>${gameOpts()}</div>
  <div class="col-lg-6"><h4>Players <span class="mut fw-normal">${T ? 'tap to add to the highlighted team' : 'the number is the order of play'}</span></h4><div class="d-flex flex-wrap gap-2 mb-3">${chips}</div>
    <div class="d-flex gap-2"><input id=np placeholder="New player name" style="max-width:22rem"><button data-a=addp>Add player</button></div>
    ${T ? `<h4 style="margin-top:1.5rem">Teams</h4>${tcards}<div class="d-flex flex-wrap gap-2 align-items-center"><button data-a=addt>+ Add team</button></div><p class=lobby-note>Teams take turns in the order shown, and each team's players throw in their listed order. Teams can be different sizes.</p>` : ''}</div></div>
  <div class=startbar><button class=pri data-a=start>Start game</button></div>`;
}
