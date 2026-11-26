const W = 400, H = 560, TOTAL = 1000;
const $ = id => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d'), stageEl = $('stage'), root = document.documentElement;
const PANELS = ['menu', 'help', 'stages', 'board', 'settings', 'pause', 'clear', 'over'];
const ADJ = ['Neon', 'Crystal', 'Ember', 'Frozen', 'Velvet', 'Solar', 'Lunar', 'Jade', 'Cobalt', 'Amber'];
const NOUN = ['Harbor', 'Canyon', 'Garden', 'Temple', 'Skyline', 'Lagoon', 'Summit', 'Bazaar', 'Reef', 'Citadel'];
const worldName = w => ADJ[w % 10] + ' ' + NOUN[Math.floor(w / 10) % 10];
const MISSIONS = ['score', 'sum', 'rule', 'seq', 'math', 'gems', 'survive', 'gauntlet', 'dodge', 'boss'];
const BRAIN = ['sum', 'rule', 'seq', 'math', 'gauntlet', 'boss'];
const COIN_T = ['coin', 'ice', 'vio'];
const TYPES = {
  coin: { c: '#ffc83d', pts: 1, good: 1, coin: 1 }, ice: { c: '#4de1ff', pts: 1, good: 1, coin: 1 }, vio: { c: '#b985ff', pts: 1, good: 1, coin: 1 },
  gem: { c: '#9dff4d', pts: 5, good: 1 }, bomb: { c: '#ff3d7f' }, num: { c: '#efe9ff' },
  shield: { c: '#4dd2ff', g: 'S', pw: 1 }, magnet: { c: '#ff5cf0', g: 'M', pw: 1 }, slow: { c: '#a8ff5c', g: 'T', pw: 1 },
  x2: { c: '#ffd24d', g: 'x2', pw: 1 }, wide: { c: '#ff9a4d', g: 'W', pw: 1 }
};
const irand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const isPrime = x => { if (x < 2) return false; for (let i = 2; i * i <= x; i++) if (x % i === 0) return false; return true; };

function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
const themeOf = w => { const h = (w * 47 + 265) % 360; return { t: hsl(h, 55, 22), b: hsl(h + 25, 65, 6), a: hsl(h - 70, 100, 64) }; };
const rgb = (a, al = 1) => `rgba(${a.map(Math.round).join(',')},${al})`;

function stageDef(n) {
  const w = Math.floor((n - 1) / 10), i = (n - 1) % 10, m = MISSIONS[i];
  const k = 1 + Math.log2(1 + n / 12), e = 1 - Math.exp(-n / 250);
  const d = { n, w, i, m, brain: BRAIN.includes(m), fall: 200 + 260 * e, spawn: .75 - .45 * e, bombP: .14 + .2 * e, gemP: .1, powP: n >= 3 ? .05 : 0, pw: 92 - 22 * e };
  const R = { score: 14 * k, gems: 3 + 1.5 * k, survive: Math.min(60, 15 + 4 * k), dodge: 8 + 3 * k,
    sum: 3 + Math.min(5, Math.floor(n / 120)), rule: 3 + Math.min(5, Math.floor(n / 110)), seq: 2 + Math.min(4, Math.floor(n / 100)),
    math: 4 + Math.min(6, Math.floor(n / 90)), gauntlet: 5 + Math.min(7, Math.floor(n / 80)), boss: 8 + Math.min(8, Math.floor(n / 70)) };
  d.target = Math.round(R[m]);
  if (m === 'gems') d.gemP = .35;
  if (m === 'dodge') { d.bombP += .25; d.spawn *= .85; }
  if (m === 'survive') d.bombP += .1;
  if (d.brain) { d.fall *= m === 'boss' ? .9 : .72; d.spawn *= 1.1; d.bombP *= m === 'boss' ? .9 : .5; d.gemP = 0; }
  const t = d.target;
  d.text = { score: `Score ${t} points`, gems: `Collect ${t} gems`, survive: `Survive ${t} seconds`, dodge: `Let ${t} bombs fall past`, sum: `Solve ${t} sum puzzles`, rule: `Follow the rule for ${t} rounds`, seq: `Repeat the colour order ${t} times`, math: `Answer ${t} quick maths`, gauntlet: `Brain gauntlet: ${t} mixed rounds`, boss: `BOSS: ${t} mixed rounds` }[m];
  d.hint = { score: 'Catch coins, dodge bombs', gems: 'Gems are worth 5 points', survive: 'Stay alive until the time is up', dodge: 'Do not catch bombs. Let them pass', sum: 'Catch numbers that add up to the exact total', rule: 'Catch only numbers that match the rule', seq: 'Catch coin colours in the shown order', math: 'Catch the number that answers the sum', gauntlet: 'The puzzle type changes every round', boss: 'Mixed puzzles while bombs rain down' }[m];
  return d;
}

const RULES = [
  () => ({ t: 'EVEN numbers', f: x => x % 2 === 0 }),
  () => ({ t: 'ODD numbers', f: x => x % 2 === 1 }),
  () => ({ t: 'Multiples of 3', f: x => x % 3 === 0 }),
  () => ({ t: 'PRIME numbers', f: isPrime }),
  r => { const k = Math.min(irand(4, 10), r - 3); return { t: `Bigger than ${k}`, f: x => x > k }; },
  r => { const k = Math.min(irand(6, 14), r - 2); return { t: `Smaller than ${k}`, f: x => x < k }; },
  () => ({ t: 'Multiples of 4', f: x => x % 4 === 0 }),
  () => ({ t: 'Multiples of 5', f: x => x % 5 === 0 }),
  () => ({ t: 'SQUARE numbers', f: x => Number.isInteger(Math.sqrt(x)) })
];
function genMath(n) {
  const tier = n < 100 ? 0 : n < 300 ? 1 : 2;
  const op = pick(tier === 0 ? ['+', '\u2212'] : tier === 1 ? ['+', '\u2212', '\u00D7'] : ['+', '\u2212', '\u00D7', '\u00F7']);
  let a, b, ans;
  if (op === '+') { const m = [9, 30, 99][tier]; a = irand(1, m); b = irand(1, m); ans = a + b; }
  else if (op === '\u2212') { const m = [12, 40, 99][tier]; a = irand(2, m); b = irand(1, a); ans = a - b; }
  else if (op === '\u00D7') { const m = [0, 6, 12][tier]; a = irand(2, m); b = irand(2, m); ans = a * b; }
  else { b = irand(2, 12); ans = irand(2, 12); a = b * ans; }
  return { q: `${a} ${op} ${b} = ?`, ans };
}

const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const save = read('cc2-save') || { unlocked: 1, cleared: 0, stars: {} };
let board = read('cc2-board') || [];
const DEF_S = { diff: 'normal', hints: true, assist: false, sound: true, music: true, vol: 70, vibrate: true, ctrl: 'direct', plate: 'auto', quality: 'high', shake: true, cblind: false };
const S = { ...DEF_S, ...(read('cc2-settings') || {}) };
const saveS = () => write('cc2-settings', S);
const DIFF = { easy: { lives: 5, speed: .82, pen: 999, bomb: .75 }, normal: { lives: 3, speed: 1, pen: 20, bomb: 1 }, hard: { lives: 2, speed: 1.15, pen: 1, bomb: 1.2 } };
const PLATE_COLS = { cyan: [61, 245, 224], gold: [255, 200, 61], pink: [255, 92, 170], lime: [157, 255, 77] };
const plateCol = () => PLATE_COLS[S.plate] || cur.a;
const GB = v => S.quality === 'high' ? v : 0;
const vib = p => { if (S.vibrate && navigator.vibrate) { try { navigator.vibrate(p); } catch {} } };
let ac = null, maxLives = 3, mNext = 0, mStep = 0;

function audio() {
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch {}
  return ac;
}
function sfx(f, d = .08, type = 'sine', v = .05, slide = 0) {
  if (!S.sound || S.vol <= 0 || !audio()) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v * S.vol / 70, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(t + d);
  } catch {}
}
function mnote(f, t, d, type, v) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .02);
}
function music() {
  if (!S.sound || !S.music || S.vol <= 0 || !ac || ac.state !== 'running') return;
  if (!(state === 'run' || state === 'count' || state === 'menu' || state === 'dying')) { mNext = 0; return; }
  const t0 = ac.currentTime; if (mNext < t0) mNext = t0 + .05;
  const danger = state === 'run' && lives === 1 ? 16 : 0;
  const bpm = state === 'menu' ? 84 : 98 + Math.min(40, def.n * .1) + danger, dur = 60 / bpm / 2, vol = .028 * S.vol / 70;
  const root = 45 + (def.w * 3) % 12, f = m => 440 * Math.pow(2, (m - 69) / 12);
  const SC = [0, 3, 5, 7, 10, 12, 10, 7], PAT = [0, 2, 4, 2, 5, 4, 3, 1];
  try {
    while (mNext < t0 + .3) {
      const st = mStep % 16;
      if (st % 4 === 0) mnote(f(root - (st === 8 ? 5 : 0)), mNext, dur * 3.5, 'triangle', vol * 2.2);
      mnote(f(root + 12 + SC[(PAT[st % 8] + (st >= 8 ? 2 : 0)) % 8]), mNext, dur * .9, 'square', vol * .6);
      if (def.n >= 50 && st % 2 === 1) mnote(f(root + 24 + SC[PAT[(st + 3) % 8]]), mNext, dur * .5, 'sine', vol * .5);
      mNext += dur; mStep++;
    }
  } catch {}
}

const player = { x: 154, y: 500, w: 92, h: 18 };
let def = stageDef(Math.min(save.unlocked, TOTAL)), items = [], parts = [], score = 0, lives = 3, playTime = 0, spawnIn = 0;
let combo = 0, maxCombo = 0, gems = 0, dodged = 0, done = 0, task = null, lastKind = '';
let shake = 0, flash = 0, invuln = 0, banner = 0, cd = 0, dyingT = 0, T0 = 0, selW = 0, msgT = 0, msgText = '', msgCol = '#fff';
let state = 'menu', last = 0, user = '', scale = 1, helpFrom = 'menu', uiIdle = null, uiLive = null;
const timers = { shield: 0, magnet: 0, slow: 0, x2: 0, wide: 0 };
let cur = themeOf(def.w);
const amb = Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: .3 + Math.random() * .7, ph: Math.random() * 6 }));

const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
const unlockedN = () => Math.min(save.unlocked, TOTAL);
const prog = () => ({ score, gems, survive: Math.floor(playTime), dodge: dodged }[def.m] ?? done);
const pop = (txt, col) => { msgText = txt; msgCol = col; msgT = 1.4; };
const dropOld = () => { items = items.filter(it => it.type === 'bomb' || TYPES[it.type].pw); };

function showPanel(id) {
  const ov = $('overlay');
  ov.classList.remove('hide'); ov.classList.toggle('home', id === 'menu');
  PANELS.forEach(p => $(p).hidden = p !== id);
  if (id === 'menu') homeInfo();
}
const hidePanels = () => $('overlay').classList.add('hide');

function homeInfo() {
  const n = unlockedN();
  $('play').textContent = `\u25B6  PLAY \u00B7 Stage ${n}`;
  $('hWorld').textContent = `World ${Math.floor((n - 1) / 10) + 1}: ${worldName(Math.floor((n - 1) / 10))}`;
  $('hStage').textContent = `${save.cleared}/${TOTAL}`;
  $('hBar').style.width = (save.cleared / TOTAL * 100) + '%';
  $('hStars').textContent = `\u2605 ${totalStars()} stars`;
  $('hClr').textContent = `${save.cleared} cleared`;
  $('avatar').textContent = ($('name').value.trim()[0] || 'P').toUpperCase();
}

function renderHearts() {
  const el = $('hearts'); el.innerHTML = '';
  for (let i = 0; i < maxLives; i++) {
    const h = document.createElement('i'); h.textContent = '\u2665';
    if (i >= lives) h.className = 'lost';
    el.appendChild(h);
  }
}
function hud() {
  const p = Math.min(prog(), def.target);
  $('score').textContent = score; $('stageLbl').textContent = 'Stage ' + def.n;
  $('mText').textContent = def.text; $('mCount').textContent = `${p}/${def.target}`;
  $('mBar').style.width = (p / def.target * 100) + '%';
  $('hud').classList.toggle('boss', def.m === 'boss');
}

function renderStages() {
  $('wTitle').textContent = `World ${selW + 1}: ${worldName(selW)}`;
  $('wSub').textContent = `${totalStars()} stars \u00B7 cleared ${save.cleared}/${TOTAL}`;
  const g = $('grid'); g.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const n = selW * 10 + i + 1, b = document.createElement('button');
    b.type = 'button'; b.className = 'st' + (BRAIN.includes(MISSIONS[i]) ? ' brain' : '') + (i === 9 ? ' boss' : '');
    const s = save.stars[n] || 0;
    b.innerHTML = `<b>${n}</b><small>${n > save.unlocked ? '\uD83D\uDD12' : '\u2605'.repeat(s) + '\u2606'.repeat(3 - s)}</small>`;
    b.disabled = n > save.unlocked;
    b.addEventListener('click', () => startStage(n));
    g.appendChild(b);
  }
  $('wPrev').disabled = selW === 0; $('wNext').disabled = selW >= 99;
}
function openStages() { selW = Math.floor((unlockedN() - 1) / 10); renderStages(); showPanel('stages'); }

async function renderBoard() {
  const l = $('list'); l.innerHTML = '<li class="empty">Loading...</li>';
  const rows = board.map(x => ({ ...x }));
  try {
    const r = await fetch('leaderboard.txt?' + Date.now(), { cache: 'no-store' });
    if (r.ok) (await r.text()).split(/\r?\n/).forEach(line => {
      line = line.trim(); if (!line || line[0] === '#') return;
      const [name, c, s] = line.split(',');
      if (name && !isNaN(+c)) rows.push({ name: name.trim(), cleared: +c, stars: +s || 0 });
    });
  } catch {}
  const map = new Map();
  rows.forEach(x => {
    const k = x.name.toLowerCase(), o = map.get(k);
    if (!o || x.cleared > o.cleared || (x.cleared === o.cleared && x.stars > o.stars)) map.set(k, x);
  });
  const list = [...map.values()].sort((a, b) => b.cleared - a.cleared || b.stars - a.stars).slice(0, 10);
  l.innerHTML = '';
  if (!list.length) { l.innerHTML = '<li class="empty">Clear a stage to join the board.</li>'; return; }
  list.forEach(s => {
    const li = document.createElement('li'); li.textContent = s.name;
    const sp = document.createElement('span'); sp.textContent = `Stage ${s.cleared} \u00B7 ${s.stars}\u2605`;
    li.appendChild(sp); l.appendChild(li);
  });
}
function recordBoard() {
  const key = user.toLowerCase();
  let e = board.find(x => x.name.toLowerCase() === key);
  if (!e) { e = { name: user, cleared: 0, stars: 0 }; board.push(e); }
  e.cleared = Math.max(e.cleared, save.cleared); e.stars = totalStars();
  board.sort((a, b) => b.cleared - a.cleared || b.stars - a.stars);
  board = board.slice(0, 10); write('cc2-board', board);
}

function newTask(kind) {
  const n = def.n; lastKind = kind;
  if (kind === 'sum') task = { kind, mx: Math.min(9, 3 + Math.floor(n / 50)), target: Math.min(45, 5 + irand(0, 5) + Math.floor(n / 20)), sum: 0, t: 0 };
  else if (kind === 'rule') {
    const rmax = Math.min(30, 9 + Math.floor(n / 30)), avail = Math.min(RULES.length, 4 + Math.floor(n / 15));
    const rule = RULES[irand(0, avail - 1)](rmax), all = Array.from({ length: rmax }, (_, i) => i + 1);
    task = { kind, rule, got: 0, need: 3, valid: all.filter(rule.f), bad: all.filter(x => !rule.f(x)), t: 0 };
  } else if (kind === 'seq') task = { kind, seq: Array.from({ length: Math.min(8, 3 + Math.floor(n / 80)) }, () => irand(0, 2)), pos: 0, t: 0 };
  else task = { kind: 'math', ...genMath(n), t: 0 };
}
const kindFor = () => (def.m === 'gauntlet' || def.m === 'boss') ? pick(['sum', 'rule', 'seq', 'math'].filter(x => x !== lastKind)) : def.m;

function startStage(n) {
  user = $('name').value.trim() || 'Player'; write('cc2-name', user);
  def = stageDef(n);
  const D = DIFF[S.diff] || DIFF.normal; maxLives = D.lives; def.fall *= D.speed; def.spawn /= D.speed; def.bombP *= D.bomb; aimX = null;
  items = []; parts = []; score = 0; lives = maxLives; playTime = 0; spawnIn = .6; done = 0; msgT = 0;
  combo = maxCombo = gems = dodged = 0; shake = flash = invuln = 0;
  Object.keys(timers).forEach(k => timers[k] = 0);
  lastKind = ''; task = def.brain ? (newTask(kindFor()), task) : null;
  player.w = def.pw; player.x = (W - player.w) / 2;
  renderHearts(); hud(); hidePanels();
  banner = def.brain ? 3.4 : 2.4; state = 'count'; cd = def.brain ? 3 : 2;
  sfx(440, .12, 'triangle', .05);
}
function toMenuState() {
  state = 'menu'; items = []; parts = []; task = null; def = stageDef(unlockedN());
  Object.keys(timers).forEach(k => timers[k] = 0);
  player.w = 92; player.x = (W - 92) / 2; spawnIn = .3; msgT = 0; hud();
}
const goHome = () => { toMenuState(); showPanel('menu'); };
const goStages = () => { toMenuState(); openStages(); };
function playFlow() {
  if (!save.seen) { save.seen = true; write('cc2-save', save); helpFrom = 'play'; $('helpGo').textContent = "Got it, let's play"; showPanel('help'); }
  else startStage(unlockedN());
}

function pause() { if (state !== 'run') return; state = 'paused'; left = right = false; showPanel('pause'); $('resume').focus(); }
function resume() { if (state !== 'paused') return; hidePanels(); state = 'count'; cd = 3; }

function die() {
  state = 'dying'; dyingT = 1.4; shake = .7; flash = .8;
  const x = player.x + player.w / 2;
  burst(x, player.y, '#ff3d7f', 40); burst(x, player.y, '#ffb048', 40); burst(x, player.y, '#ffffff', 20);
  sfx(220, .9, 'sawtooth', .08, -170); vib([200]);
}
function gameOver() {
  state = 'over'; items = [];
  $('oMsg').textContent = `${def.text} \u2014 you got ${Math.min(prog(), def.target)}/${def.target}`;
  showPanel('over'); $('retry').focus();
}
function clearStage() {
  state = 'clear'; items = [];
  const lost = maxLives - lives, st = lost === 0 ? 3 : lost === 1 ? 2 : 1;
  save.stars[def.n] = Math.max(save.stars[def.n] || 0, st);
  save.cleared = Math.max(save.cleared, def.n);
  save.unlocked = Math.max(save.unlocked, Math.min(TOTAL, def.n + 1));
  write('cc2-save', save); recordBoard();
  $('cInfo').textContent = def.text;
  [...$('stars').children].forEach((s, i) => s.classList.toggle('on', i < st));
  $('cScore').textContent = score; $('cLives').textContent = lives; $('cTotal').textContent = totalStars();
  $('next').disabled = def.n >= TOTAL;
  for (let i = 0; i < 60; i++) burst(Math.random() * W, 120 + Math.random() * 200, rgb(cur.a), 1);
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => sfx(f, .2, 'triangle', .06), i * 110));
  vib([30, 40, 30]); showPanel('clear'); $('next').focus();
}
const checkClear = () => { if (state === 'run' && prog() >= def.target) clearStage(); };

function skipSpawn() {
  if (def.m === 'score') return score + items.reduce((s, it) => s + (TYPES[it.type].good ? TYPES[it.type].pts : 0), 0) >= def.target;
  if (def.m === 'gems') return gems + items.filter(it => it.type === 'gem').length >= def.target;
  if (def.m === 'survive') return playTime >= def.target - 1.5;
  if (def.m === 'dodge') return dodged + items.filter(it => it.type === 'bomb').length >= def.target;
  return false;
}
const add = (type, val = 0) => items.push({ x: 20 + Math.random() * (W - 40), y: -18, type, val, ph: Math.random() * 6 });
function spawn() {
  if (skipSpawn()) return;
  const r = Math.random();
  if (r < def.bombP) return add('bomb');
  if (r < def.bombP + def.powP) return add(pick(['shield', 'magnet', 'slow', 'x2', 'wide']));
  if (def.brain) return spawnBrain();
  if (r < def.bombP + def.powP + def.gemP) return add('gem');
  const q = Math.random(); add(q < .6 ? 'coin' : q < .8 ? 'ice' : 'vio');
}
function spawnBrain() {
  const tk = task; let val = 0;
  if (tk.kind === 'sum') { const need = tk.target - tk.sum; val = need <= tk.mx && Math.random() < .25 ? need : Math.random() < .4 ? irand(1, Math.min(tk.mx, need)) : irand(1, tk.mx); return add('num', val); }
  if (tk.kind === 'rule') return add('num', Math.random() < .5 ? pick(tk.valid) : pick(tk.bad));
  if (tk.kind === 'math') { if (Math.random() < .34) val = tk.ans; else do { val = tk.ans + pick([-1, 1]) * irand(1, 6); } while (val < 0 || val === tk.ans); return add('num', val); }
  add(COIN_T[Math.random() < .4 ? tk.seq[tk.pos] : irand(0, 2)]);
}
function burst(x, y, color, n) {
  n = S.quality === 'high' ? n : Math.ceil(n / 2);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 190;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .5 + Math.random() * .5, color });
  }
}

function loseLife(why) {
  if (invuln > 0) return;
  lives--; combo = 0; invuln = 1; shake = .35; flash = .35;
  renderHearts(); sfx(180, .3, 'sawtooth', .08, -120); vib(60);
  if (why) pop(why, '#ff6b7d');
  if (lives <= 0) die();
}
function penalty(why) {
  combo = 0;
  if (def.n < (DIFF[S.diff] || DIFF.normal).pen) { flash = .3; sfx(200, .2, 'square', .05); vib(40); pop(why, '#ff6b7d'); } else loseLife(why);
}
function roundDone() {
  done++; score += 10 * (1 + Math.floor(def.n / 100));
  burst(player.x + player.w / 2, player.y, rgb(cur.a), 30); sfx(780, .25, 'triangle', .06, 400);
  if (done >= def.target) return;
  const kind = kindFor(), changed = kind !== lastKind;
  newTask(kind); dropOld();
  pop(changed && (def.m === 'gauntlet' || def.m === 'boss') ? 'NEW PUZZLE!' : 'Correct!', '#9dff4d');
}
function brainCatch(it) {
  const k = task.kind; let ok = false;
  if (k === 'sum') {
    task.sum += it.val; burst(it.x, it.y, '#efe9ff', 10); sfx(540 + it.val * 30, .08, 'triangle', .05);
    if (task.sum === task.target) ok = true;
    else if (task.sum > task.target) { task.sum = 0; penalty('Too much! Total reset'); }
  } else if (k === 'rule') {
    if (task.rule.f(it.val)) { task.got++; burst(it.x, it.y, '#9dff4d', 10); sfx(700 + task.got * 80, .1, 'triangle', .05); if (task.got >= task.need) ok = true; }
    else { task.got = 0; penalty('Wrong! ' + task.rule.t); }
  } else if (k === 'math') {
    if (it.val === task.ans) ok = true; else penalty('Wrong answer');
  } else {
    if (COIN_T.indexOf(it.type) === task.seq[task.pos]) { task.pos++; burst(it.x, it.y, TYPES[it.type].c, 10); sfx(600 + task.pos * 60, .1, 'triangle', .05); if (task.pos >= task.seq.length) ok = true; }
    else { task.pos = 0; penalty('Wrong colour! Start again'); }
  }
  if (ok) roundDone();
}

function collect(it) {
  const t = TYPES[it.type];
  if (it.type === 'bomb') {
    if (timers.shield > 0) { timers.shield = 0; burst(it.x, it.y, '#4dd2ff', 24); sfx(320, .2, 'triangle', .06, 200); return; }
    if (invuln > 0) { burst(it.x, it.y, t.c, 10); return; }
    burst(it.x, it.y, t.c, 28); loseLife();
  } else if (t.pw) {
    timers[it.type] = it.type === 'shield' ? 999 : it.type === 'wide' ? 10 : 8;
    burst(it.x, it.y, t.c, 18); sfx(520, .25, 'triangle', .06, 500);
  } else if (def.brain && task) brainCatch(it);
  else {
    combo++; maxCombo = Math.max(maxCombo, combo);
    const mult = 1 + Math.min(4, Math.floor(combo / 5));
    score += t.pts * mult * (timers.x2 > 0 ? 2 : 1);
    if (it.type === 'gem') gems++;
    burst(it.x, it.y, t.c, it.type === 'gem' ? 18 : 10);
    it.type === 'gem' ? sfx(990, .15, 'square', .04) : sfx(620 + Math.min(combo, 20) * 22, .08, 'triangle', .05);
  }
  hud(); checkClear();
}
const radius = it => it.type === 'num' ? 16 : 10;
const hitTest = it => it.y + radius(it) >= player.y && it.y - radius(it) <= player.y + player.h && it.x >= player.x - 8 && it.x <= player.x + player.w + 8;

function demo(dt) {
  spawnIn -= dt;
  if (spawnIn <= 0) { spawnIn = .4 + Math.random() * .35; const r = Math.random(); add(r < .2 ? 'bomb' : r < .3 ? 'gem' : pick(COIN_T)); }
  const c = player.x + player.w / 2; let best = null, tx = W / 2;
  items.forEach(it => {
    if (!TYPES[it.type].good || it.y < 40) return;
    if (items.some(b => b.type === 'bomb' && Math.abs(b.x - it.x) < player.w / 2 + 12 && b.y > it.y - 130 && b.y < player.y)) return;
    if (!best || it.y > best.y) best = it;
  });
  if (best) tx = best.x;
  items.forEach(b => { if (b.type === 'bomb' && b.y > player.y - 160 && b.y < player.y + 10 && Math.abs(b.x - c) < player.w / 2 + 24) tx = c + (b.x < c ? 1 : -1) * 90; });
  player.x = Math.max(0, Math.min(W - player.w, player.x + Math.max(-380 * dt, Math.min(380 * dt, tx - c))));
  items = items.filter(it => {
    it.y += 170 * dt;
    if (hitTest(it)) { burst(it.x, it.y, TYPES[it.type].c, it.type === 'bomb' ? 20 : 8); return false; }
    return it.y < H + 20;
  });
}

let left = false, right = false, aimX = null;
function update(dt) {
  T0 += dt;
  const run = state === 'run';
  if (state === 'menu') demo(dt);
  if (state === 'count') { cd -= dt; if (cd <= 0) state = 'run'; }
  if (run) {
    playTime += dt;
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    const tw = def.pw * (timers.wide > 0 ? 1.5 : 1);
    player.w += (tw - player.w) * Math.min(1, dt * 10);
    if (dir) aimX = null;
    player.x += dir * 440 * dt;
    if (aimX !== null) player.x += (aimX - player.x) * (S.ctrl === 'direct' ? 1 : Math.min(1, dt * 12));
    player.x = Math.max(0, Math.min(W - player.w, player.x));
    if (combo >= 10 && !def.brain && Math.random() < .6) parts.push({ x: player.x + Math.random() * player.w, y: player.y + player.h, vx: (Math.random() - .5) * 30, vy: 60 + Math.random() * 90, life: .35, color: rgb(plateCol(), .9) });
    Object.keys(timers).forEach(k => { if (k !== 'shield' && timers[k] > 0) timers[k] = Math.max(0, timers[k] - dt); });
    spawnIn -= dt;
    if (spawnIn <= 0) { spawn(); spawnIn = def.spawn * (.8 + Math.random() * .4); }
    if (def.m === 'survive') { hud(); checkClear(); }
    if (def.brain && task) {
      task.t += dt;
      if (def.m === 'rule' && def.n >= 100 && task.t > 14) { newTask('rule'); dropOld(); pop('RULE CHANGE!', '#ffc83d'); }
    }
  }
  if (state === 'dying') { dyingT -= dt; if (dyingT <= 0) gameOver(); }
  if (run || state === 'dying') {
    const fall = def.fall * (run ? (timers.slow > 0 ? .55 : 1) : .3);
    items = items.filter(it => {
      it.y += fall * dt;
      if (run && !def.brain && timers.magnet > 0 && TYPES[it.type].good) it.x += (player.x + player.w / 2 - it.x) * Math.min(1, dt * 3.5);
      if (run && hitTest(it)) { collect(it); return false; }
      if (it.y >= H + 20) {
        if (run && TYPES[it.type].good && combo) combo = 0;
        if (run && it.type === 'bomb') { dodged++; hud(); checkClear(); }
        return false;
      }
      return true;
    });
  }
  invuln -= dt; flash -= dt; shake -= dt; banner -= dt; msgT -= dt;
  parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
  parts = parts.filter(p => p.life > 0);
  const st = def.w % 5;
  amb.slice(0, S.quality === 'high' ? 50 : 20).forEach(a => {
    if (st === 0) a.y += (90 + def.fall * .3) * a.s * dt;
    else if (st === 1) { a.y += (320 + a.s * 200) * dt; a.x -= 50 * dt; }
    else if (st === 2) { a.y += (40 + 40 * a.s) * dt; a.x += Math.sin(T0 + a.ph) * 22 * dt; }
    else if (st === 3) { a.y -= (30 + 40 * a.s) * dt; a.x += Math.sin(T0 + a.ph) * 14 * dt; }
    else { a.y -= (40 + 70 * a.s) * dt; a.x += Math.sin(T0 * 2 + a.ph) * 26 * dt; }
    if (a.y > H + 10) { a.y = -10; a.x = Math.random() * W; }
    if (a.y < -10) { a.y = H + 10; a.x = Math.random() * W; }
    if (a.x < -10) a.x = W + 10; if (a.x > W + 10) a.x = -10;
  });
  const target = themeOf(def.w), k = Math.min(1, dt * 2);
  ['t', 'b', 'a'].forEach(key => cur[key] = cur[key].map((v, i) => v + (target[key][i] - v) * k));
  root.style.setProperty('--bg1', rgb(cur.t)); root.style.setProperty('--bg2', rgb(cur.b)); root.style.setProperty('--acc', rgb(cur.a));
}

function sym(i, x, y, r, col) {
  ctx.fillStyle = col; ctx.beginPath();
  if (i === 0) ctx.arc(x, y, r * .7, 0, 7);
  else if (i === 1) { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y + r * .8); ctx.lineTo(x - r, y + r * .8); ctx.closePath(); }
  else ctx.rect(x - r * .8, y - r * .8, r * 1.6, r * 1.6);
  ctx.fill();
}
function isRight(it) {
  if (!def.brain || !task) return false;
  const k = task.kind;
  if (k === 'sum') return it.type === 'num' && it.val <= task.target - task.sum;
  if (k === 'rule') return it.type === 'num' && task.rule.f(it.val);
  if (k === 'math') return it.type === 'num' && it.val === task.ans;
  return COIN_T.indexOf(it.type) === task.seq[task.pos];
}
function drawItem(it) {
  const t = TYPES[it.type];
  ctx.save(); ctx.translate(it.x, it.y);
  if (S.assist && state === 'run' && isRight(it)) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  ctx.shadowColor = t.c; ctx.shadowBlur = GB(14); ctx.fillStyle = t.c;
  if (it.type === 'num') {
    ctx.shadowColor = rgb(cur.a);
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = rgb(cur.a); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#160a2b'; ctx.font = `700 ${String(it.val).length > 2 ? 12 : 17}px 'Chakra Petch',sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(it.val, 0, 1);
  } else if (t.coin) {
    const s = Math.abs(Math.cos(T0 * 3 + it.ph));
    ctx.beginPath(); ctx.ellipse(0, 0, Math.max(2, 10 * s), 10, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1, 6 * s), 6, 0, 0, 7); ctx.stroke();
    if (S.cblind) sym(COIN_T.indexOf(it.type), 0, 0, 5, 'rgba(0,0,0,.6)');
  } else if (it.type === 'gem') {
    ctx.rotate(Math.sin(T0 * 3 + it.ph) * .3);
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(12, 0); ctx.lineTo(0, 14); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(5, -2); ctx.lineTo(0, 0); ctx.lineTo(-5, -2); ctx.closePath(); ctx.fill();
  } else if (it.type === 'bomb') {
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#160a2b'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(7, -10, 2 + Math.random() * 2, 0, 7); ctx.fill();
  } else {
    ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#160a2b'; ctx.font = "700 13px 'Chakra Petch',sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(t.g, 0, 1);
  }
  ctx.restore();
}

function drawHills() {
  const p = def.w * 1.7;
  for (let l = 0; l < 2; l++) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H - 54 - l * 36 + Math.sin(x * .018 * (1 + l * .6) + p + l) * (16 + l * 8) + Math.sin(x * .045 + p * 2) * 7);
    ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = rgb(cur.b, .85); ctx.fill();
    ctx.strokeStyle = rgb(cur.a, .22 - l * .08); ctx.lineWidth = 2; ctx.stroke();
  }
}
function drawAmb() {
  const st = def.w % 5;
  amb.slice(0, S.quality === 'high' ? 50 : 20).forEach(a => {
    if (st === 0) { ctx.strokeStyle = rgb(cur.a, .12 + .45 * a.s); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x, a.y - 10 * a.s - 4); ctx.stroke(); }
    else if (st === 1) { ctx.strokeStyle = rgb(cur.a, .3 * a.s + .1); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + 4, a.y - 16 * a.s - 6); ctx.stroke(); }
    else if (st === 2) { ctx.fillStyle = `rgba(255,255,255,${.25 + .4 * a.s})`; ctx.beginPath(); ctx.arc(a.x, a.y, 1 + 2 * a.s, 0, 7); ctx.fill(); }
    else if (st === 3) { ctx.strokeStyle = rgb(cur.a, .2 + .3 * a.s); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(a.x, a.y, 2 + 6 * a.s, 0, 7); ctx.stroke(); }
    else { ctx.fillStyle = rgb(cur.a, .3 + .5 * Math.abs(Math.sin(T0 * 4 + a.ph))); ctx.fillRect(a.x, a.y, 2.5, 2.5); }
  });
}
function drawTask() {
  const x = 82, y = 8, w = 236, h = 58, cx = W / 2, k = task.kind;
  ctx.fillStyle = 'rgba(8,4,24,.66)'; ctx.strokeStyle = rgb(cur.a, .6); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  if (k === 'sum') {
    ctx.font = "700 20px 'Chakra Petch',sans-serif"; ctx.fillText(`Make exactly ${task.target}`, cx, y + 19);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.roundRect(x + 16, y + 38, w - 32, 9, 5); ctx.fill();
    ctx.fillStyle = rgb(cur.a); ctx.beginPath(); ctx.roundRect(x + 16, y + 38, Math.max(9, (w - 32) * task.sum / task.target), 9, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = "700 12px 'Chakra Petch',sans-serif"; ctx.fillText(`${task.sum} / ${task.target}`, cx, y + 53);
  } else if (k === 'rule') {
    ctx.font = "700 18px 'Chakra Petch',sans-serif"; ctx.fillText('Catch: ' + task.rule.t, cx, y + 20);
    for (let i = 0; i < task.need; i++) { ctx.fillStyle = i < task.got ? '#9dff4d' : 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(cx + (i - (task.need - 1) / 2) * 24, y + 42, 7, 0, 7); ctx.fill(); }
  } else if (k === 'math') {
    ctx.font = "700 28px 'Chakra Petch',sans-serif"; ctx.fillText(task.q, cx, y + 30);
  } else {
    const L = task.seq.length, hide = def.n >= 200 && task.t > 3;
    ctx.font = "500 11px 'Chakra Petch',sans-serif"; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(hide ? 'REMEMBER THE ORDER' : 'CATCH IN THIS ORDER', cx, y + 13);
    for (let i = 0; i < L; i++) {
      const px = cx + (i - (L - 1) / 2) * 24, hid = hide && i >= task.pos;
      ctx.fillStyle = hid ? 'rgba(255,255,255,.2)' : TYPES[COIN_T[task.seq[i]]].c; ctx.globalAlpha = i < task.pos ? .45 : 1;
      ctx.beginPath(); ctx.arc(px, y + 36, 9, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      if (S.cblind && !hid) sym(task.seq[i], px, y + 36, 6, 'rgba(0,0,0,.6)');
      if (i === task.pos) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(px, y + 36, 12, 0, 7); ctx.stroke(); }
      if (hid) { ctx.fillStyle = '#fff'; ctx.font = "700 12px 'Chakra Petch',sans-serif"; ctx.fillText('?', px, y + 37); }
    }
  }
}

function draw(now) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgb(cur.t)); g.addColorStop(1, rgb(cur.b));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H, 10, W / 2, H, 330);
  glow.addColorStop(0, rgb(cur.a, .24)); glow.addColorStop(1, rgb(cur.a, 0));
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  ctx.lineCap = 'round';
  drawAmb(); drawHills();
  ctx.save();
  if (shake > 0 && S.shake) { const m = 10 * Math.min(1, shake * 2); ctx.translate((Math.random() - .5) * m, (Math.random() - .5) * m); }
  const playing = state === 'run' || state === 'count' || state === 'paused';
  if ((playing || state === 'menu') && !(invuln > 0 && Math.floor(invuln * 14) % 2)) {
    const pc = plateCol(), pg = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    pg.addColorStop(0, '#fff'); pg.addColorStop(.3, rgb(pc)); pg.addColorStop(1, rgb(pc.map(v => v * .55)));
    ctx.shadowColor = rgb(pc); ctx.shadowBlur = GB(combo >= 10 ? 36 : 20); ctx.fillStyle = pg;
    ctx.beginPath(); ctx.roundRect(player.x, player.y, player.w, player.h, 9); ctx.fill(); ctx.shadowBlur = 0;
    if (timers.shield > 0) { ctx.strokeStyle = '#4dd2ff'; ctx.lineWidth = 3; ctx.shadowColor = '#4dd2ff'; ctx.shadowBlur = GB(16); ctx.beginPath(); ctx.ellipse(player.x + player.w / 2, player.y + 9, player.w / 2 + 12, 24, 0, 0, 7); ctx.stroke(); ctx.shadowBlur = 0; }
  }
  items.forEach(drawItem);
  parts.forEach(p => { ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); });
  ctx.globalAlpha = 1; ctx.restore();
  if (lives === 1 && (state === 'run' || state === 'count')) {
    const v = ctx.createRadialGradient(W / 2, H / 2, 180, W / 2, H / 2, 420);
    v.addColorStop(0, 'rgba(255,40,80,0)'); v.addColorStop(1, `rgba(255,40,80,${.2 + .15 * Math.sin(now / 160)})`);
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  if (flash > 0) { ctx.fillStyle = `rgba(255,50,90,${Math.min(.5, flash * .7)})`; ctx.fillRect(0, 0, W, H); }
  if (playing) {
    let y = 8;
    Object.keys(timers).forEach(k => {
      if (timers[k] <= 0) return;
      const full = k === 'shield' ? 1 : timers[k] / (k === 'wide' ? 10 : 8), c = TYPES[k].c;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.roundRect(8, y, 64, 15, 7); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(8, y, Math.max(8, 64 * full), 15, 7); ctx.fill();
      ctx.fillStyle = '#160a2b'; ctx.font = "700 11px 'Chakra Petch',sans-serif"; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(TYPES[k].g, 14, y + 8); y += 19;
    });
    if (!def.brain && combo >= 5) {
      const mult = 1 + Math.min(4, Math.floor(combo / 5));
      ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#ffc83d'; ctx.font = "700 28px 'Chakra Petch',sans-serif";
      ctx.fillText('x' + mult, W - 10, 34); ctx.fillStyle = '#fff'; ctx.font = "500 12px 'Chakra Petch',sans-serif"; ctx.fillText(combo + ' combo', W - 10, 50);
    }
    if (def.brain && task) drawTask();
    if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT * 2); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = msgCol; ctx.font = "700 24px 'Chakra Petch',sans-serif"; ctx.fillText(msgText, W / 2, 106); ctx.globalAlpha = 1; }
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (banner > 0 && (state === 'count' || state === 'run')) {
    ctx.globalAlpha = Math.min(1, banner * 1.5);
    ctx.fillStyle = def.m === 'boss' ? '#ff5a6e' : rgb(cur.a); ctx.font = "700 44px 'Chakra Petch',sans-serif";
    ctx.fillText(def.m === 'boss' ? 'BOSS STAGE ' + def.n : 'STAGE ' + def.n, W / 2, 190);
    ctx.fillStyle = '#fff'; ctx.font = "500 19px 'Chakra Petch',sans-serif"; ctx.fillText(def.text, W / 2, 224);
    ctx.fillStyle = '#ffd86b'; ctx.font = "500 15px 'Chakra Petch',sans-serif"; if (S.hints) ctx.fillText(def.hint, W / 2, 250);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = "500 13px 'Chakra Petch',sans-serif"; ctx.fillText(`World ${def.w + 1} \u00B7 ${worldName(def.w)}`, W / 2, 275);
    ctx.globalAlpha = 1;
  }
  if (state === 'count') {
    const f = cd - Math.floor(cd);
    ctx.globalAlpha = .4 + .6 * f; ctx.fillStyle = '#fff'; ctx.font = `700 ${90 + 40 * f}px 'Chakra Petch',sans-serif`;
    ctx.fillText(Math.ceil(cd), W / 2, 380); ctx.globalAlpha = 1;
  }
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, .05); last = now;
  if (state !== 'paused') update(dt);
  draw(now); music();
  const idle = state === 'menu', live = state === 'run' || state === 'count' || state === 'paused' || state === 'dying';
  if (idle !== uiIdle || live !== uiLive) { uiIdle = idle; uiLive = live; $('hud').classList.toggle('idle', idle); $('btns').classList.toggle('off', !live); }
  requestAnimationFrame(loop);
}
function fit() {
  const r = stageEl.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  scale = cv.width / W;
}
new ResizeObserver(fit).observe(stageEl);

const typing = () => ['BUTTON', 'INPUT'].includes(document.activeElement.tagName);
const togglePause = () => { state === 'run' ? pause() : resume(); };
addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') right = true;
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
  if (e.key === ' ' && !typing()) { e.preventDefault(); togglePause(); }
  if (e.key === 'Enter' && !typing()) {
    if (state === 'menu' && !$('menu').hidden) playFlow();
    else if (state === 'clear' && def.n < TOTAL) startStage(def.n + 1);
    else if (state === 'over') startStage(def.n);
  }
});
addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') right = false;
});
const drag = e => {
  if (state !== 'run' && state !== 'count') return;
  const r = cv.getBoundingClientRect();
  aimX = Math.max(0, Math.min(W - player.w, (e.clientX - r.left) / r.width * W - player.w / 2));
  if (state === 'count' || S.ctrl === 'direct') player.x = aimX;
};
cv.addEventListener('pointermove', drag); cv.addEventListener('pointerdown', drag);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
document.addEventListener('touchmove', e => { if (!e.target.closest('.panel')) e.preventDefault(); }, { passive: false });

const SCHEMA = [
  { h: 'Gameplay' },
  { k: 'diff', l: 'Difficulty', t: 'seg', o: [['easy', 'Chill'], ['normal', 'Normal'], ['hard', 'Hard']], d: 'Chill: 5 lives, slower. Normal: 3 lives. Hard: 2 lives, faster, and wrong puzzle catches cost a life from stage 1. Applies when a stage starts.' },
  { k: 'assist', l: 'Puzzle assist', t: 'tog', d: 'Draws a dashed ring around the correct item in brain stages.' },
  { k: 'hints', l: 'Stage hints', t: 'tog' },
  { h: 'Sound' },
  { k: 'sound', l: 'Sound', t: 'tog' },
  { k: 'music', l: 'Music', t: 'tog' },
  { k: 'vol', l: 'Volume', t: 'range' },
  { k: 'vibrate', l: 'Vibration', t: 'tog' },
  { h: 'Controls' },
  { k: 'ctrl', l: 'Plate movement', t: 'seg', o: [['direct', 'Direct'], ['smooth', 'Smooth']] },
  { h: 'Look' },
  { k: 'plate', l: 'Plate colour', t: 'seg', o: [['auto', 'Auto'], ['cyan', 'Cyan'], ['gold', 'Gold'], ['pink', 'Pink'], ['lime', 'Lime']] },
  { k: 'quality', l: 'Effects', t: 'seg', o: [['high', 'High'], ['low', 'Low']] },
  { k: 'shake', l: 'Screen shake', t: 'tog' },
  { k: 'cblind', l: 'Colour-blind symbols', t: 'tog', d: 'Adds a circle, triangle or square to each coin colour.' },
  { h: 'Progress' },
  { t: 'btn', l: 'Reset all progress' }
];
let setFrom = 'menu', resetArm = 0;
function syncMute() { $('muteBtn').classList.toggle('off', !S.sound); }
function resetProgress() {
  save.unlocked = 1; save.cleared = 0; save.stars = {}; write('cc2-save', save);
  board = []; write('cc2-board', board); homeInfo();
}
function renderSettings() {
  const panel = $('settings'), sc = panel.scrollTop, box = $('setList'); box.innerHTML = '';
  SCHEMA.forEach(r => {
    if (r.h) { const h = document.createElement('div'); h.className = 'sh'; h.textContent = r.h; box.appendChild(h); return; }
    const row = document.createElement('div'); row.className = 'sr';
    if (r.t === 'btn') {
      row.className = 'sr full';
      const b = document.createElement('button'); b.type = 'button'; b.className = 'danger'; b.textContent = resetArm ? 'Tap again to confirm' : r.l;
      b.addEventListener('click', () => {
        if (!resetArm) { resetArm = 1; renderSettings(); setTimeout(() => { resetArm = 0; if (!panel.hidden) renderSettings(); }, 3000); }
        else { resetArm = 0; resetProgress(); renderSettings(); }
      });
      row.appendChild(b); box.appendChild(row); return;
    }
    const lab = document.createElement('span'); lab.textContent = r.l; row.appendChild(lab);
    if (r.t === 'seg') {
      const g = document.createElement('div'); g.className = 'seg';
      r.o.forEach(([v, t]) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = t; if (S[r.k] === v) b.className = 'on';
        b.addEventListener('click', () => { S[r.k] = v; saveS(); renderSettings(); });
        g.appendChild(b);
      });
      row.appendChild(g);
    } else if (r.t === 'tog') {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'sw' + (S[r.k] ? ' on' : ''); b.setAttribute('aria-pressed', S[r.k]);
      b.addEventListener('click', () => { S[r.k] = !S[r.k]; saveS(); syncMute(); renderSettings(); });
      row.appendChild(b);
    } else {
      const i = document.createElement('input'); i.type = 'range'; i.min = 0; i.max = 100; i.value = S[r.k];
      i.addEventListener('input', () => { S[r.k] = +i.value; saveS(); });
      i.addEventListener('change', () => sfx(660, .12, 'triangle', .06));
      row.appendChild(i);
    }
    box.appendChild(row);
    if (r.d) { const d = document.createElement('small'); d.textContent = r.d; box.appendChild(d); }
  });
  panel.scrollTop = sc;
}

const on = (id, fn) => $(id).addEventListener('click', fn);
const toggleMute = () => { S.sound = !S.sound; saveS(); syncMute(); };
on('play', playFlow);
on('howBtn', () => { helpFrom = 'menu'; $('helpGo').textContent = 'Back'; showPanel('help'); });
on('helpGo', () => { helpFrom === 'play' ? startStage(unlockedN()) : showPanel('menu'); });
on('openStages', openStages); on('openBoard', () => { showPanel('board'); renderBoard(); });
on('bdBack', () => showPanel('menu')); on('stBack', () => showPanel('menu'));
on('wPrev', () => { selW = Math.max(0, selW - 1); renderStages(); });
on('wNext', () => { selW = Math.min(99, selW + 1); renderStages(); });
on('wCur', () => { selW = Math.floor((unlockedN() - 1) / 10); renderStages(); });
on('resume', resume); on('restart', () => startStage(def.n));
on('pauseStages', goStages); on('pauseHome', goHome);
on('next', () => startStage(def.n + 1)); on('replay', () => startStage(def.n));
on('clStages', goStages); on('clHome', goHome);
on('retry', () => startStage(def.n)); on('ovStages', goStages); on('ovHome', goHome);
on('pauseBtn', togglePause); on('muteBtn', toggleMute);
on('openSettings', () => { setFrom = 'menu'; renderSettings(); showPanel('settings'); });
on('pauseSettings', () => { setFrom = 'pause'; renderSettings(); showPanel('settings'); });
on('setBack', () => showPanel(setFrom));
$('name').addEventListener('input', homeInfo);

$('name').value = read('cc2-name') || '';
syncMute();
addEventListener('pointerdown', audio, { once: true }); addEventListener('keydown', audio, { once: true });
player.w = 92; player.x = (W - 92) / 2;
renderHearts(); hud(); showPanel('menu'); fit();
requestAnimationFrame(t => { last = t; loop(t); });
