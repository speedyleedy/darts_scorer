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
  curs = LS('curs') || {},
  fun = { mm: [], kl: [], ft: [] },
  fq = { mm: [], kl: [], ft: [] },
  alertMsg = '',
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
  vpq = 3,
  need = 1;

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
  put('curs', curs);
};
