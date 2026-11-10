/**
 * The What's new popup: shown once per release (not mid-game), until it is dismissed.
 * To announce a release, add an entry at the TOP of NEWS with a new id. Set script: true when the
 * release changes js/apps-script.js, so people who sync are reminded to update their Sheet.
 */

const NEWS = [
  {
    id: '2026-11-practice',
    title: 'Practice mode is here',
    items: [
      '<b>Practice mode</b>: pick your routine (warm-up, 30 at 20, a doubles countdown, 3 in a bed and 10 down) and see your score against last time and your best. Your progress is on the Party tab.',
      '<b>Clearer turns</b>: the player throwing now sits at the top with <b>Your turn</b> on their card, and everyone else gets a compact card.',
      '<b>Enter manually</b>: the button for typing in a whole visit has a clearer name.',
    ],
    script: true,
  },
];

const newsOpen = () => NEWS.length && LS('news') !== NEWS[0].id && !(G && !G.done);

const newsSeen = () => put('news', NEWS[0].id);

/* a brand-new user has nothing to catch up on, so they start with this release already seen */
function newsInit() {
  if (LS('news') == null && !url && !visits.length && !players.length) newsSeen();
}

function news() {
  if (!newsOpen()) return '';
  const n = NEWS[0],
    sheet =
      n.script && url
        ? `<div class=newsh><b>Update your Google Sheet script</b><p>Syncing the new features needs the latest script. It takes about a minute:</p><ol><li>In Setup, press <b>Copy script</b>.</li><li>In your Sheet, open Extensions, Apps Script. Paste over the old code and save.</li><li>Choose Deploy, Manage deployments, Edit (the pencil), set Version to <b>New version</b>, and Deploy.</li></ol><p class=mut>Your URL stays the same. Until you update, new results wait safely on this device.</p></div>`
        : '';
  return `<div class="modal d-block news" role=dialog aria-modal=true aria-labelledby=newst><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class=modal-content><div class=modal-header><h2 class=modal-title id=newst><small>What's new</small>${esc(n.title)}</h2><button type=button class=btn-close aria-label=Close data-a=newsok></button></div><div class=modal-body><ul>${n.items.map((x) => `<li>${x}</li>`).join('')}</ul>${sheet}</div><div class=modal-footer>${sheet ? '<button data-a=newsup class=pri>Go to Setup</button><button data-a=newsok>Close</button>' : '<button data-a=newsok class=pri>Got it</button>'}</div></div></div></div>`;
}
