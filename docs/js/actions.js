/**
 * Every button's action. A button's data-a="name" calls A.name(value).
 */

/* ---------- events ---------- */
const A = {
  need(v) {
    need = +v;
    render();
  },
  nextleg: nextLeg,
  em(v) {
    entryMode = v;
    put('entry', v);
    KP = '';
    render();
  },
  kd(v) {
    KP = (KP + v).replace(/^0+(?=\d)/, '');
    if (+KP > 180) KP = KP.slice(0, -1);
    render();
  },
  kb() {
    KP = KP.slice(0, -1);
    render();
  },
  ke() {
    if (KP !== '') entry(+KP);
  },
  kq(v) {
    entry(+v);
  },
  kco(v) {
    if (G && G.pendCo) entryGo(G.pendCo, +v);
  },
  theme(v) {
    theme = v;
    put('theme', v);
    applyTheme();
    render();
  },
  voice() {
    voiceOn = !voiceOn;
    put('voice', voiceOn);
    if (voiceOn) speak(['Voice on']);
    else if (canSpeak()) speechSynthesis.cancel();
    render();
  },
  vtest() {
    speak(['One hundred and eighty!', 'Peter, you have 44 left']);
  },
  vpq(v) {
    vpq = +v;
    render();
  },
  mmc(v) {
    const [i, k] = v.split(':').map(Number);
    G.mmPk[i] = k;
    render();
  },
  mmbed(v) {
    G.mmBedOn = v === '1';
    render();
  },
  mmgo() {
    if (G && G.type === 'mm' && G.darts.length) mmScore();
  },
  prs(v) {
    const on = prOn.includes(v) ? prOn.filter((x) => x !== v) : [...prOn, v];
    prOn = PRS.map(([k]) => k).filter((k) => on.includes(k));
    render();
  },
  prmin(v) {
    prMin = +v;
    render();
  },
  prnext() {
    if (G && G.type === 'pr' && !G.done) prNext();
  },
  prwarm() {
    G.wi++;
    say('Nine darts at ' + (PRWARM[G.wi % 3][0] === 50 ? 'the bull' : PRWARM[G.wi % 3][0]) + '.');
    render();
  },
  prclk() {
    if (G.dEnd) {
      G.dLeft = Math.max(0, G.dEnd - Date.now());
      G.dEnd = 0;
    } else G.dEnd = Date.now() + G.dLeft;
    render();
  },
  prrst() {
    G.dEnd = 0;
    G.dLeft = G.min * 60000;
    render();
  },
  newsok() {
    newsSeen();
    render();
  },
  newsup() {
    newsSeen();
    view = 'setup';
    note = '';
    render();
  },
  hp(v) {
    hp = v;
    render();
  },
  gt(v) {
    gt = v;
    render();
  },
  lives(v) {
    lives = +v;
    render();
  },
  kt(v) {
    kt = v;
    render();
  },
  heal(v) {
    heal = v === '1';
    render();
  },
  cust() {
    const n = Math.round(+$('#cm').value);
    if (n >= 2 && n <= 9999) {
      mode = n;
      note = '';
    } else note = 'Enter a starting score between 2 and 9999.';
    render();
  },
  fm(v) {
    fm = v;
    render();
  },
  fmt(v) {
    fmt = v;
    render();
  },
  pt(v) {
    const was = teams[at].m.includes(v);
    teams.forEach((t) => (t.m = t.m.filter((x) => x !== v)));
    if (!was) teams[at].m.push(v);
    render();
  },
  at(v) {
    at = +v;
    render();
  },
  addt() {
    teams.push({ name: '', m: [] });
    at = teams.length - 1;
    render();
  },
  tup(v) {
    v = +v;
    if (v > 0) {
      [teams[v - 1], teams[v]] = [teams[v], teams[v - 1]];
      if (at === v) at--;
      else if (at === v - 1) at++;
    }
    render();
  },
  tdn(v) {
    v = +v;
    if (v < teams.length - 1) {
      [teams[v + 1], teams[v]] = [teams[v], teams[v + 1]];
      if (at === v) at++;
      else if (at === v + 1) at--;
    }
    render();
  },
  tdel(v) {
    if (teams.length > 2) {
      teams.splice(+v, 1);
      at = Math.min(at, teams.length - 1);
    }
    render();
  },
  mup(v) {
    const [i, j] = v.split(':').map(Number),
      m = teams[i].m;
    if (j > 0) [m[j - 1], m[j]] = [m[j], m[j - 1]];
    render();
  },
  mdn(v) {
    const [i, j] = v.split(':').map(Number),
      m = teams[i].m;
    if (j < m.length - 1) [m[j + 1], m[j]] = [m[j], m[j + 1]];
    render();
  },
  mrm(v) {
    const [i, j] = v.split(':').map(Number);
    teams[i].m.splice(j, 1);
    render();
  },
  resync() {
    cursor = 0;
    curs = {};
    persist();
    sync();
  },
  sp(v) {
    sp = v;
    render();
  },
  rng(v) {
    rng = v;
    render();
  },
  tab(v) {
    view = v;
    note = '';
    render();
  },
  sel(v) {
    sel = sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v];
    render();
  },
  mode(v) {
    mode = +v;
    render();
  },
  addp() {
    const n = ($('#np').value || '').trim();
    if (n && !players.includes(n)) {
      players.push(n);
      (fmt === 'teams' ? teams[at].m : sel).push(n);
      persist();
    }
    render();
    $('#np') && $('#np').focus();
  },
  start: startGame,
  undo,
  sync,
  exp: exportCsv,
  again() {
    gt = G.type;
    lives = G.lives;
    vpq = G.vpq || 3;
    need = G.need || 1;
    if (G.type === 'pr') {
      prOn = [...G.steps];
      prMin = G.min;
    }
    if (!G.teams) {
      sel = G.pl.map((q) => q.name);
      sel.push(sel.shift());
    } else teams.push(teams.shift());
    mode = G.mode;
    startGame();
  },
  /* End game during play sits right by the board, so it asks first */
  quitc() {
    if (G && !G.done && !confirm('End this game?')) return;
    A.quit();
  },
  quit() {
    G = null;
    hist = [];
    render();
  },
  reload() {
    location.reload();
  },
  nagoff() {
    put('nagOff', Date.now());
    render();
  },
  saveurl() {
    const u = $('#url').value.trim();
    if (u !== url) {
      cursor = 0;
      curs = {};
      synced = false;
    }
    url = u;
    persist();
    note = 'URL saved.';
    render();
  },
  qr() {
    const u = $('#url').value.trim();
    if (!/^https:\/\/script\.google\.com\//.test(u)) {
      note = 'Paste your Web App URL first, then show the QR code.';
      return render();
    }
    if (u !== url) A.saveurl();
    const box = $('#qr');
    if (typeof QRCode === 'undefined') {
      box.textContent = 'The QR code library did not load. Check you are online.';
      return;
    }
    const link = location.href.split('#')[0] + '#sync=' + encodeURIComponent(u);
    box.innerHTML = '';
    new QRCode(box, { text: link, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
    if (location.protocol === 'file:')
      box.insertAdjacentHTML(
        'beforeend',
        '<p class=mut>This page is opened from a file, so another device cannot open the link. Use the GitHub Pages address.</p>',
      );
  },
  copy() {
    const t = $('#sc');
    t.select();
    (navigator.clipboard ? navigator.clipboard.writeText(SCRIPT) : Promise.reject()).catch(() =>
      document.execCommand('copy'),
    );
    note = 'Script copied.';
  },
};
