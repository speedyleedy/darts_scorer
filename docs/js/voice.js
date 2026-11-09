/**
 * Spoken announcements using the browser's built-in speech (no server, no cost).
 */

/* ---------- game flow ---------- */
/* ---------- voice: the browser's built-in speech (free, no server). Off by default; the toggle is remembered. ---------- */
let voiceOn = !!LS('voice'),
  voiceName = LS('voiceName') || '',
  voiceRate = +LS('voiceRate') || 1;

const canSpeak = () =>
  typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

const enVoices = () =>
  canSpeak() ? speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)) : [];

/* Voices that are neural / enhanced / premium sound far better, so they rank first, then Australian, then British English. */
const isNat = (v) => /natural|neural|premium|enhanced|siri|online/i.test(v.name),
  vRank = (v) =>
    (isNat(v) ? 4 : 0) +
    (/en[-_]AU/i.test(v.lang)
      ? 3
      : /en[-_]GB/i.test(v.lang)
        ? 2
        : /en[-_](NZ|IE|ZA)/i.test(v.lang)
          ? 1
          : 0);

const rankedVoices = () => enVoices().sort((a, b) => vRank(b) - vRank(a));

function pickVoice() {
  const vs = rankedVoices();
  return vs.find((v) => v.name === voiceName) || vs[0] || null;
}

function speak(t) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const v = pickVoice();
  t.filter(Boolean).forEach((x) => {
    const u = new SpeechSynthesisUtterance(x);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    }
    u.rate = voiceRate;
    speechSynthesis.speak(u);
  });
}

const say = (...t) => {
  if (voiceOn) speak(t);
};

const multi = () => G.pl.length > 1 || G.pl.some((x) => x.m.length > 1),
  whoNow = () => {
    const p = G.pl[G.cur];
    return p.m[p.mi];
  };

const spoken = (n) => (n === 180 ? 'One hundred and eighty!' : n === 0 ? 'No score' : String(n));

/* who is up next, plus the checkout call when their score can be finished in three darts */
function turnCall() {
  const p = G.pl[G.cur],
    w = p.m[p.mi];
  if (G.type === '01' && co(p.rem, 3)) return w + ', you have ' + p.rem + ' left';
  return multi() ? w + ' to throw' : '';
}

function openCall() {
  if (G.type === 'pr') return; /* prEnter announces the first drill */
  if (G.type === 'kl') return say(whoNow() + ', pick your number');
  if (G.type === 'ft')
    return say('Quarter 1. Aim at ' + FT[0] + '.', multi() ? whoNow() + ' to throw' : '');
  say(turnCall());
}
