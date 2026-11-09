/**
 * Shared state and small helpers: the variables every other file reads and writes.
 */

const $ = (s) => document.querySelector(s);

const LS = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k));
  } catch (e) {
    return null;
  }
};

const warn = (m) => {
  alertMsg = m;
  try {
    render();
  } catch (e) {}
};

const put = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    warn('This browser would not save your settings (storage full or blocked).');
  }
};

const byTime = (a, b) => (String(a.time) < String(b.time) ? -1 : 1);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');

let players = LS('players') || [],
  visits = [],
  queue = [],
  url = LS('url') || '',
  cursor = +LS('cursor') || 0,
  synced = !!LS('synced') || cursor > 0 /* a Sync with the current URL has worked */,
  curs = LS('curs') || {},
  fun = { mm: [], kl: [], ft: [], pr: [] },
  fq = { mm: [], kl: [], ft: [], pr: [] },
  alertMsg = '',
  updateReady = false /* a new version is deployed (boot.js) */,
  DB = null;

let G = null,
  hist = [],
  view = 'play',
  sel = [],
  mode = 501,
  note = '',
  fmt = 'solo',
  teams = [
    { name: '', m: [] },
    { name: '', m: [] },
  ],
  at = 0,
  fm = 'all',
  SR = {},
  gt = '01',
  lives = 3,
  kt = 'w' /* Killer target: 'w' whole wedge, 'd' doubles only */,
  heal = true /* Killer: hit your own number to get lives back */,
  vpq = 3,
  need = 1,
  prOn = ['warm', 't20', 'dbl', 'bed', 'down'] /* Practice: the drills in the routine */,
  prMin = 10 /* Practice: minutes of doubles */;

const WINT = {};

function rebuildWin() {
  for (const k in WINT) delete WINT[k];
  visits.forEach((v) => {
    if (v.co && v.team) WINT[v.game] = v.team;
  });
}

const persist = () => {
  put('players', players);
  put('url', url);
  put('cursor', cursor);
  put('synced', synced);
  put('curs', curs);
};
