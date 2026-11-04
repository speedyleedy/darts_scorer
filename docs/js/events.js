/**
 * Page-level event listeners: clicks, keyboard, theme and speech.
 */

document.addEventListener('click', (e) => {
  const t = e.target,
    d = t.dataset && t.dataset.d,
    a = t.dataset && t.dataset.a;
  if (d !== undefined) {
    try {
      navigator.vibrate && navigator.vibrate(10);
    } catch (x) {}
    thr(d);
    document.querySelectorAll('[data-d="' + d + '"]').forEach((x) => {
      x.classList.add('hit');
      setTimeout(() => x.classList.remove('hit'), 260);
    });
  } else if (a) A[a](t.dataset.v);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') keepAwake(!!G && !G.done);
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'vs') {
    voiceName = e.target.value;
    put('voiceName', voiceName);
  }
  if (e.target.id === 'vr') {
    voiceRate = +e.target.value;
    put('voiceRate', voiceRate);
  }
});

if (canSpeak())
  speechSynthesis.onvoiceschanged = () => {
    if (view === 'setup') render();
  };

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'np') {
    A.addp();
    return;
  }
  if (
    !G ||
    view !== 'play' ||
    !tot() ||
    G.done ||
    G.legWon ||
    /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)
  )
    return;
  if (G.pendCo) {
    if (/^[123]$/.test(e.key)) entryGo(G.pendCo, +e.key);
    return;
  }
  if (/^\d$/.test(e.key)) A.kd(e.key);
  else if (e.key === 'Backspace') A.kb();
  else if (e.key === 'Enter') A.ke();
});

document.addEventListener('input', (e) => {
  const i = e.target.dataset && e.target.dataset.tn;
  if (i !== undefined) teams[+i].name = e.target.value;
});
