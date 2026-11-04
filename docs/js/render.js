/**
 * Drawing the page: render(), the Bootstrap skin and keeping the screen awake.
 */

/* Bootstrap skin: the app renders plain markup; this adds the matching Bootstrap component classes after each render. */
function skin() {
  const a = $('#app');
  if (!a || !a.querySelectorAll) return;
  a.querySelectorAll('button:not(.nav-link)').forEach((b) => {
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
    if (b.closest('.mm,.tm,.lv,.kq')) c.add('btn-sm');
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
  /* until a Sync has worked, point people at Setup (not on Setup itself) */
  const syncNag =
    !synced && view !== 'setup'
      ? `<div class="alert d-flex flex-wrap gap-2 align-items-center" role=alert><span><b>${url ? 'Not synced yet.' : 'Not backed up.'}</b> ${url ? 'Your Google Sheet has not synced yet. Press Sync now in Setup so your stats are backed up.' : 'Your stats are only saved in this browser. Set up Google Sheets sync to back them up and share them between devices.'}</span><button class="dng ms-auto" data-a=tab data-v=setup>${url ? 'Go to Setup' : 'Set up sync'}</button></div>`
      : '';
  $('#app').innerHTML =
    `<nav class=navbar><div class=container><span class=navbar-brand>Darts</span><ul class=nav>${tabs}</ul></div></nav><main class="container shell">${syncNag}${alertMsg || (url && queue.length >= 100) ? `<p class=alert>${esc(alertMsg || queue.length + ' visits are waiting to sync. Press Sync now in Setup.')}</p>` : ''}${note ? `<p class=mut>${esc(note)}</p>` : ''}${view === 'stats' ? stats() : view === 'history' ? history() : view === 'fun' ? funStats() : view === 'setup' ? setup() : G ? game() : lobby()}</main>`;
  skin();
  keepAwake(!!G && !G.done);
  if (view === 'stats') draw(SV);
}
