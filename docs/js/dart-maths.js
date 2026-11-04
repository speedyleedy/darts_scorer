/**
 * Dart values, labels and checkout routes.
 */

/* ---------- darts maths ---------- */
const val = (d) =>
  d === '0' ? 0 : d === '25' ? 25 : d === '50' ? 50 : { S: 1, D: 2, T: 3 }[d[0]] * +d.slice(1);

const lbl = (d) => (d === '50' ? 'Bull' : d === '25' ? '25' : d === '0' ? 'Miss' : d);

const FIN = [
  'D20',
  'D16',
  'D8',
  'D12',
  'D10',
  'D18',
  'D14',
  'D6',
  'D4',
  'D2',
  'D1',
  'D3',
  'D5',
  'D7',
  'D9',
  'D11',
  'D13',
  'D15',
  'D17',
  'D19',
  '50',
];

const ALL = [];

for (let n = 20; n >= 1; n--) for (const t of 'TDS') ALL.push(t + n);

ALL.push('25', '50');

const SET = ALL.slice().sort((a, b) => val(b) - val(a));

const memo = {};

function ex(r, m) {
  const k = r + '/' + m;
  if (k in memo) return memo[k];
  let o = null;
  if (m === 1) {
    const f = FIN.find((f) => val(f) === r);
    if (f) o = [f];
  } else
    for (const a of SET) {
      const v = val(a);
      if (v >= r) continue;
      const x = ex(r - v, m - 1);
      if (x) {
        o = [a, ...x];
        break;
      }
    }
  return (memo[k] = o);
}

function co(r, n) {
  if (r > 170 || r < 2) return null;
  for (let m = 1; m <= n; m++) {
    const x = ex(r, m);
    if (x) return x;
  }
  return null;
}
