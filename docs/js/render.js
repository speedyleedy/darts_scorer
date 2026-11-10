/**
 * Drawing the page: render(), the Bootstrap skin and keeping the screen awake.
 */

/* The logo, drawn inline in the text colour so it follows the light / dark theme (img/logo.svg is the tile version). */
const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="3.2"><circle cx="30" cy="30" r="6" pathLength="100" stroke-dasharray="18 14 68 0"/><circle cx="30" cy="30" r="13" pathLength="100" stroke-dasharray="86 9 5 0"/><circle cx="30" cy="30" r="20" pathLength="100" stroke-dasharray="38 7 24 5 26 0"/><circle cx="30" cy="30" r="27" pathLength="100" stroke-dasharray="48 6 26 5 15 0"/></g><g transform="translate(31.5 28) rotate(-45)"><path d="M4 0H25" stroke="var(--bs-body-bg)" stroke-width="7"/><path d="M4 0H25" stroke-width="3"/><path d="M0 0L6 -2.6V2.6Z" fill="currentColor" stroke-width="1.5"/><path d="M22 0L28 -6.5H32.5L28.5 0L32.5 6.5H28Z" fill="currentColor" stroke="var(--bs-body-bg)" stroke-width="2"/></g><path d="M26.5 34.5A3.5 3.5 0 0 1 33.5 34.5V41.5A2.75 2.75 0 0 1 39 41.5V43A2.5 2.5 0 0 1 44 43V45A2.25 2.25 0 0 1 48.5 45V52Q48.5 59 42 59H31Q27 59 24.5 56L17.5 48.5A2.6 2.6 0 0 1 21.5 45L26.5 49Z" fill="var(--bs-body-bg)" stroke="var(--bs-body-bg)" stroke-width="7"/><path d="M26.5 34.5A3.5 3.5 0 0 1 33.5 34.5V41.5A2.75 2.75 0 0 1 39 41.5V43A2.5 2.5 0 0 1 44 43V45A2.25 2.25 0 0 1 48.5 45V52Q48.5 59 42 59H31Q27 59 24.5 56L17.5 48.5A2.6 2.6 0 0 1 21.5 45L26.5 49Z" fill="var(--bs-body-bg)" stroke-width="3"/><path d="M33.5 41.5V45.5M39 43V46.5M44 45V48" stroke-width="2.4"/></g></svg>`;

/* Bootstrap skin: the app renders plain markup; this adds the matching Bootstrap component classes after each render. */
function skin() {
  const a = $('#app');
  if (!a || !a.querySelectorAll) return;
  a.querySelectorAll('button:not(.nav-link):not(.btn-close)').forEach((b) => {
    const c = b.classList;
    c.add(
      'btn',
      c.contains('on')
        ? 'btn-dark'
        : c.contains('pri')
          ? 'btn-primary'
          : c.contains('dng')
            ? 'btn-danger'
            : 'btn-outline-secondary',
    );
    if (b.matches('[data-a=start]')) c.add('btn-lg', 'w-100');
    if (b.closest('.mm,.tm,.lv,.kq,.cnr')) c.add('btn-sm');
    if (b.closest('.pills')) c.add('btn-sm', 'rounded-pill');
  });
  a.querySelectorAll('input').forEach((i) => i.classList.add('form-control'));
  a.querySelectorAll('select').forEach((i) => i.classList.add('form-select'));
  a.querySelectorAll('textarea').forEach((i) => i.classList.add('form-control', 'font-monospace'));
  a.querySelectorAll('table').forEach((t) => t.classList.add('table', 'table-sm'));
  a.querySelectorAll('.alert').forEach((x) => x.classList.add('alert-danger', 'py-2'));
  a.querySelectorAll('.bdg').forEach((x) => x.classList.add('badge'));
}

let wl = null;

async function keepAwake(on) {
  try {
    if (on && navigator.wakeLock && !wl) {
      wl = await navigator.wakeLock.request('screen');
      wl.addEventListener('release', () => {
        wl = null;
      });
    } else if (!on && wl) {
      const w = wl;
      wl = null;
      await w.release();
    }
  } catch (e) {
    wl = null;
  }
}

function render() {
  CH.forEach((c) => c.destroy());
  CH = [];
  try {
    if (G && !G.done) localStorage.setItem('game', JSON.stringify(G));
    else localStorage.removeItem('game');
  } catch (e) {}
  const tabs = [
    ['play', 'Play'],
    ['stats', 'Stats'],
    ['history', 'History'],
    ['fun', 'Party'],
    ['setup', 'Setup'],
  ]
    .map(
      ([t, l]) =>
        `<li class=nav-item><button data-a=tab data-v=${t} class="nav-link${view === t ? ' active' : ''}">${l}</button></li>`,
    )
    .join('');
  /* until a Sync has worked, point people at Setup (not on Setup, not mid-game, and not for a week after it is dismissed) */
  const syncNag =
    !synced && view !== 'setup' && !(G && !G.done) && !(Date.now() - (LS('nagOff') || 0) < 7 * 864e5)
      ? `<div class="alert d-flex flex-wrap gap-2 align-items-center" role=alert><span><b>${url ? 'Not synced yet.' : 'Not backed up.'}</b> ${url ? 'Your Google Sheet has not synced yet. Press Sync now in Setup so your stats are backed up.' : 'Your stats are only saved in this browser. Set up Google Sheets sync to back them up and share them between devices.'}</span><button class="dng ms-auto" data-a=tab data-v=setup>${url ? 'Go to Setup' : 'Set up sync'}</button><button type=button class=btn-close aria-label=Dismiss title="Hide for a week" data-a=nagoff></button></div>`
      : '';
  const upd =
    updateReady
      ? '<div class="alert d-flex flex-wrap gap-2 align-items-center" role=status><span><b>New version available.</b> Your game is saved and carries on after the update.</span><button class="dng ms-auto" data-a=reload>Update now</button></div>'
      : '';
  $('#app').innerHTML =
    `<nav class=navbar><div class=container><span class=navbar-brand>${LOGO}TapDarts</span><ul class=nav>${tabs}</ul></div></nav><main class="container shell">${upd}${syncNag}${alertMsg || (url && queue.length >= 100) ? `<p class=alert>${esc(alertMsg || queue.length + ' visits are waiting to sync. Press Sync now in Setup.')}</p>` : ''}${note ? `<p class=mut>${esc(note)}</p>` : ''}${view === 'stats' ? stats() : view === 'history' ? history() : view === 'fun' ? funStats() : view === 'setup' ? setup() : G ? game() : lobby()}</main>${news()}`;
  document.body.classList.toggle('playing', view === 'play' && !!G);
  skin();
  document.documentElement.style.setProperty('--navh', $('#app > nav').offsetHeight + 'px');
  const cur = document.querySelector('.playing .cards .pl.cur');
  if (cur && matchMedia('(max-width: 767px)').matches) {
    /* scroll the scoreboard, never the page */
    const box = cur.parentElement.getBoundingClientRect(),
      c = cur.getBoundingClientRect();
    if (c.top < box.top || c.bottom > box.bottom) cur.parentElement.scrollTop += c.top - box.top;
  }
  keepAwake(!!G && !G.done);
  if (view === 'stats') draw(SV);
}
