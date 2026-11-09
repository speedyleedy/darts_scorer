/**
 * Start-up: open the database, load saved data, resume a game in progress.
 */

async function boot() {
  try {
    DB = await new Promise((res, rej) => {
      const r = indexedDB.open('darts', 4);
      r.onupgradeneeded = () =>
        ['visits', 'queue', 'mm', 'mmq', 'kl', 'klq', 'ft', 'ftq', 'pr', 'prq'].forEach((n) => {
          if (!r.result.objectStoreNames.contains(n))
            r.result.createObjectStore(n, { keyPath: 'id' });
        });
      r.onsuccess = () => res(r.result);
      r.onerror = r.onblocked = () => rej(r.error || new Error('blocked'));
    });
    const [v, q] = await Promise.all([idbAll('visits'), idbAll('queue')]);
    visits = v;
    queue = q;
    for (const t of ['mm', 'kl', 'ft', 'pr']) {
      fun[t] = await idbAll(t);
      fq[t] = await idbAll(t + 'q');
    }
    const ov = LS('visits') || [],
      oq = LS('queue') || []; /* one-off move from the old localStorage store */
    if (ov.length || oq.length) {
      const hv = new Set(v.map((x) => x.id)),
        hq = new Set(q.map((x) => x.id)),
        nv = ov.filter((x) => !hv.has(x.id)),
        nq = oq.filter((x) => !hq.has(x.id));
      await tx(['visits', 'queue'], (a, b) => {
        nv.forEach((x) => a.put(x));
        nq.forEach((x) => b.put(x));
      });
      visits = [...visits, ...nv];
      queue = [...queue, ...nq];
      try {
        localStorage.removeItem('visits');
        localStorage.removeItem('queue');
      } catch (e) {}
    }
    visits.sort(byTime);
    players = [...new Set([...players, ...visits.map((x) => x.player)])];
    persist();
    const est =
      navigator.storage && navigator.storage.estimate
        ? await navigator.storage.estimate().catch(() => null)
        : null;
    if (est && est.quota && est.usage / est.quota > 0.8)
      alertMsg = 'Browser storage is over 80% full. Sync, then export a CSV backup.';
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  } catch (e) {
    visits = LS('visits') || [];
    queue = LS('queue') || [];
    DB = null;
    alertMsg =
      'This browser is not letting the app save data, so visits will be lost when you close the page. Press Sync now after every game.';
  }
  rebuildWin();
  render();
  if (syncLink) sync();
}

/* Opened from the Setup QR code: #sync=<Web App URL> */
let syncLink = false;
(() => {
  const m = location.hash.match(/^#sync=(.+)$/);
  if (!m) return;
  const u = decodeURIComponent(m[1]);
  location.replace('#'); /* window.history is shadowed by the History view */
  if (!/^https:\/\/script\.google\.com\//.test(u)) return;
  if (u !== url) {
    cursor = 0;
    curs = {};
    synced = false;
  }
  url = u;
  persist();
  view = 'setup';
  syncLink = true;
})();

(() => {
  const st = LS('setup');
  if (st) {
    if (st.gt) gt = st.gt;
    if (st.fmt) fmt = st.fmt;
    if (st.mode) mode = st.mode;
    if (Array.isArray(st.sel)) sel = st.sel.filter((n) => players.includes(n));
    if (Array.isArray(st.teams) && st.teams.length >= 2) teams = st.teams;
    need = st.need || 1;
    lives = st.lives || 3;
    if (st.kt) kt = st.kt;
    if (st.heal !== undefined) heal = st.heal;
    vpq = st.vpq || 3;
    if (Array.isArray(st.prOn)) prOn = st.prOn;
    prMin = st.prMin || 10;
  }
  const g = LS('game');
  if (g && g.pl && !g.done) {
    G = g;
    view = 'play';
    note = 'Picked up the game you had in progress.';
  }
})();

/* New versions: deploy.sh writes version.txt. Phones (iOS especially) often show a tab from memory
   without reloading it, so check again whenever the page comes back on screen. A changed version
   reloads straight away, or waits behind a button if a game is in progress (the game is saved and resumes). */
let appVersion = null;

async function checkVersion() {
  if (location.protocol === 'file:' || updateReady) return;
  try {
    const r = await fetch('version.txt', { cache: 'no-store' }),
      v = r.ok ? (await r.text()).trim() : '';
    if (!/^[\w.:-]{1,64}$/.test(v)) return;
    if (appVersion === null) appVersion = v;
    else if (v !== appVersion) {
      if (G && !G.done) {
        updateReady = true;
        render();
      } else location.reload();
    }
  } catch (e) {}
}

boot();
checkVersion();
