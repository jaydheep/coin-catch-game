const W = 400, H = 560, MAX_LIVES = 3, TOTAL = 1000;
const $ = id => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d'), stageEl = $('stage'), root = document.documentElement;
const PANELS = ['menu', 'stages', 'board', 'pause', 'clear', 'over'];
const ADJ = ['Neon', 'Crystal', 'Ember', 'Frozen', 'Velvet', 'Solar', 'Lunar', 'Jade', 'Cobalt', 'Amber'];
const NOUN = ['Harbor', 'Canyon', 'Garden', 'Temple', 'Skyline', 'Lagoon', 'Summit', 'Bazaar', 'Reef', 'Citadel'];
const worldName = w => ADJ[w % 10] + ' ' + NOUN[Math.floor(w / 10) % 10];
const MISSIONS = ['score', 'coins', 'gems', 'survive', 'dodge', 'combo', 'power', 'clean', 'color', 'boss'];
const COIN_T = ['coin', 'ice', 'vio'], COLOR_NAMES = ['gold', 'cyan', 'violet'];
const TYPES = {
  coin: { c: '#ffc83d', pts: 1, good: 1, coin: 1 }, ice: { c: '#4de1ff', pts: 1, good: 1, coin: 1 }, vio: { c: '#b985ff', pts: 1, good: 1, coin: 1 },
  gem: { c: '#9dff4d', pts: 5, good: 1 }, bomb: { c: '#ff3d7f' },
  shield: { c: '#4dd2ff', g: 'S', pw: 1 }, magnet: { c: '#ff5cf0', g: 'M', pw: 1 }, slow: { c: '#a8ff5c', g: 'T', pw: 1 },
  x2: { c: '#ffd24d', g: 'x2', pw: 1 }, wide: { c: '#ff9a4d', g: 'W', pw: 1 }
};

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
  const d = { n, w, i, m, fall: 200 + 260 * e, spawn: .75 - .45 * e, bombP: .14 + .2 * e, gemP: .1, powP: n >= 3 ? .05 : 0, pw: 92 - 22 * e, ci: (n * 7) % 3 };
  const T = { score: 14 * k, coins: 10 * k, gems: 3 + 1.5 * k, survive: Math.min(60, 15 + 4 * k), dodge: 8 + 3 * k, combo: Math.min(30, 6 + 2.2 * k), power: 2 + .8 * k, clean: 18 * k, color: 6 + 2.5 * k, boss: 30 * k };
  d.target = Math.round(T[m]);
  if (m === 'gems') d.gemP = .35;
  if (m === 'dodge') { d.bombP += .25; d.spawn *= .85; }
  if (m === 'survive') d.bombP += .1;
  if (m === 'power') d.powP = .22;
  if (m === 'boss') { d.fall *= 1.15; d.spawn *= .8; d.bombP += .08; }
  const t = d.target;
  d.text = { score: `Score ${t} points`, coins: `Catch ${t} coins`, gems: `Collect ${t} gems`, survive: `Survive ${t} seconds`, dodge: `Let ${t} bombs fall past`, combo: `Chain ${t} catches in a row`, power: `Grab ${t} power-ups`, clean: `Score ${t} with no bomb hit`, color: `Catch ${t} ${COLOR_NAMES[d.ci]} coins`, boss: `BOSS: score ${t} points` }[m];
  return d;
}

const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const save = read('cc2-save') || { unlocked: 1, cleared: 0, stars: {} };
let board = read('cc2-board') || [];
let muted = read('cc2-mute') === true, ac = null;

function sfx(f, d = .08, type = 'sine', v = .05, slide = 0) {
  if (muted) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(t + d);
  } catch {}
}

const player = { x: 150, y: 500, w: 92, h: 18 };
let def = stageDef(Math.min(save.unlocked, TOTAL)), items = [], parts = [], score = 0, lives = MAX_LIVES, playTime = 0, spawnIn = 0;
let combo = 0, maxCombo = 0, coins = 0, gems = 0, dodged = 0, powers = 0, colorCnt = 0;
let shake = 0, flash = 0, invuln = 0, banner = 0, cd = 0, dyingT = 0, T0 = 0, selW = 0;
let state = 'menu', last = 0, user = '', scale = 1, left = false, right = false;
const timers = { shield: 0, magnet: 0, slow: 0, x2: 0, wide: 0 };
let cur = themeOf(def.w);
const amb = Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: .3 + Math.random() * .7, ph: Math.random() * 6 }));

const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
const prog = () => ({ score, coins, gems, survive: Math.floor(playTime), dodge: dodged, combo: maxCombo, power: powers, clean: score, color: colorCnt, boss: score }[def.m]);

function showPanel(id) {
  $('overlay').classList.remove('hide');
  PANELS.forEach(p => $(p).hidden = p !== id);
  if (id === 'menu') $('play').textContent = `Play \u00B7 Stage ${Math.min(save.unlocked, TOTAL)}`;
}
const hidePanels = () => $('overlay').classList.add('hide');

function renderHearts() {
  const el = $('hearts'); el.innerHTML = '';
  for (let i = 0; i < MAX_LIVES; i++) {
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
    b.type = 'button'; b.className = 'st' + (i === 9 ? ' boss' : '');
    const s = save.stars[n] || 0;
    b.innerHTML = `<b>${n}</b><small>${n > save.unlocked ? '\uD83D\uDD12' : '\u2605'.repeat(s) + '\u2606'.repeat(3 - s)}</small>`;
    b.disabled = n > save.unlocked;
    b.addEventListener('click', () => startStage(n));
    g.appendChild(b);
  }
  $('wPrev').disabled = selW === 0; $('wNext').disabled = selW >= 99;
}
function openStages() { selW = Math.floor((Math.min(save.unlocked, TOTAL) - 1) / 10); renderStages(); showPanel('stages'); }

function renderBoard() {
  const l = $('list'); l.innerHTML = '';
  if (!board.length) { const li = document.createElement('li'); li.textContent = 'Clear a stage to join the board.'; li.className = 'empty'; l.appendChild(li); return; }
  board.forEach(s => {
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

function startStage(n) {
  user = $('name').value.trim() || 'Player'; write('cc2-name', user);
  def = stageDef(n);
  items = []; parts = []; score = 0; lives = MAX_LIVES; playTime = 0; spawnIn = .6;
  combo = maxCombo = coins = gems = dodged = powers = colorCnt = 0;
  shake = flash = invuln = 0; left = right = false;
  Object.keys(timers).forEach(k => timers[k] = 0);
  player.w = def.pw; player.x = (W - player.w) / 2;
  renderHearts(); hud(); hidePanels();
  banner = 2.4; state = 'count'; cd = 2;
  sfx(440, .12, 'triangle', .05);
}

function pause() { if (state !== 'run') return; state = 'paused'; left = right = false; showPanel('pause'); $('resume').focus(); }
function resume() { if (state !== 'paused') return; hidePanels(); state = 'count'; cd = 3; }

function die() {
  state = 'dying'; dyingT = 1.4; shake = .7; flash = .8;
  const x = player.x + player.w / 2;
  burst(x, player.y, '#ff3d7f', 40); burst(x, player.y, '#ffb048', 40); burst(x, player.y, '#ffffff', 20);
  sfx(220, .9, 'sawtooth', .08, -170);
}
function gameOver() {
  state = 'over'; items = [];
  $('oMsg').textContent = `${def.text} \u2014 you got ${Math.min(prog(), def.target)}/${def.target}`;
  showPanel('over'); $('retry').focus();
}
function clearStage() {
  state = 'clear';
  const st = lives >= 3 ? 3 : lives === 2 ? 2 : 1;
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
  showPanel('clear'); $('next').focus();
}
const checkClear = () => { if (state === 'run' && prog() >= def.target) clearStage(); };

function spawn() {
  const r = Math.random(); let type;
  if (r < def.bombP) type = 'bomb';
  else if (r < def.bombP + def.powP) type = ['shield', 'magnet', 'slow', 'x2', 'wide'][Math.floor(Math.random() * 5)];
  else if (r < def.bombP + def.powP + def.gemP) type = 'gem';
  else if (def.m === 'color') type = Math.random() < .45 ? COIN_T[def.ci] : COIN_T[Math.floor(Math.random() * 3)];
  else { const q = Math.random(); type = q < .6 ? 'coin' : q < .8 ? 'ice' : 'vio'; }
  items.push({ x: 16 + Math.random() * (W - 32), y: -16, type, ph: Math.random() * 6 });
}
function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 190;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .5 + Math.random() * .5, color });
  }
}

function collect(it) {
  const t = TYPES[it.type];
  if (it.type === 'bomb') {
    if (timers.shield > 0) { timers.shield = 0; burst(it.x, it.y, '#4dd2ff', 24); sfx(320, .2, 'triangle', .06, 200); return; }
    if (invuln > 0) { burst(it.x, it.y, t.c, 10); return; }
    lives = def.m === 'clean' ? 0 : lives - 1; combo = 0; invuln = 1; shake = .35; flash = .35;
    renderHearts(); burst(it.x, it.y, t.c, 28); sfx(180, .3, 'sawtooth', .08, -120);
    if (lives <= 0) die();
  } else if (t.pw) {
    timers[it.type] = it.type === 'shield' ? 999 : it.type === 'wide' ? 10 : 8;
    powers++; burst(it.x, it.y, t.c, 18); sfx(520, .25, 'triangle', .06, 500);
  } else {
    combo++; maxCombo = Math.max(maxCombo, combo);
    const mult = 1 + Math.min(4, Math.floor(combo / 5));
    score += t.pts * mult * (timers.x2 > 0 ? 2 : 1);
    if (t.coin) coins++;
    if (it.type === 'gem') gems++;
    if (it.type === COIN_T[def.ci]) colorCnt++;
    burst(it.x, it.y, t.c, it.type === 'gem' ? 18 : 10);
    it.type === 'gem' ? sfx(990, .15, 'square', .04) : sfx(620 + Math.min(combo, 20) * 22, .08, 'triangle', .05);
  }
  hud(); checkClear();
}
const hitTest = it => it.y + 10 >= player.y && it.y - 10 <= player.y + player.h && it.x >= player.x - 8 && it.x <= player.x + player.w + 8;

function update(dt) {
  T0 += dt;
  const run = state === 'run';
  if (state === 'count') { cd -= dt; if (cd <= 0) state = 'run'; }
  if (run) {
    playTime += dt;
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    const tw = def.pw * (timers.wide > 0 ? 1.5 : 1);
    player.w += (tw - player.w) * Math.min(1, dt * 10);
    player.x = Math.max(0, Math.min(W - player.w, player.x + dir * 440 * dt));
    Object.keys(timers).forEach(k => { if (k !== 'shield' && timers[k] > 0) timers[k] = Math.max(0, timers[k] - dt); });
    spawnIn -= dt;
    if (spawnIn <= 0) { spawn(); spawnIn = def.spawn * (.8 + Math.random() * .4); }
    if (def.m === 'survive') { hud(); checkClear(); }
  }
  if (state === 'dying') { dyingT -= dt; if (dyingT <= 0) gameOver(); }
  if (run || state === 'dying') {
    const fall = def.fall * (run ? (timers.slow > 0 ? .55 : 1) : .3);
    items = items.filter(it => {
      it.y += fall * dt;
      if (run && timers.magnet > 0 && TYPES[it.type].good) it.x += (player.x + player.w / 2 - it.x) * Math.min(1, dt * 3.5);
      if (run && hitTest(it)) { collect(it); return false; }
      if (it.y >= H + 20) {
        if (run && TYPES[it.type].good) { if (combo) { combo = 0; } }
        if (run && it.type === 'bomb') { dodged++; hud(); checkClear(); }
        return false;
      }
      return true;
    });
  }
  invuln -= dt; flash -= dt; shake -= dt; banner -= dt;
  parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
  parts = parts.filter(p => p.life > 0);
  const st = def.w % 5;
  amb.forEach(a => {
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

function drawItem(it) {
  const t = TYPES[it.type];
  ctx.save(); ctx.translate(it.x, it.y);
  if (def.m === 'color' && it.type === COIN_T[def.ci]) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.stroke(); }
  ctx.shadowColor = t.c; ctx.shadowBlur = 14; ctx.fillStyle = t.c;
  if (t.coin) {
    const s = Math.abs(Math.cos(T0 * 3 + it.ph));
    ctx.beginPath(); ctx.ellipse(0, 0, Math.max(2, 10 * s), 10, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1, 6 * s), 6, 0, 0, 7); ctx.stroke();
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
  amb.forEach(a => {
    if (st === 0) { ctx.strokeStyle = rgb(cur.a, .12 + .45 * a.s); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x, a.y - 10 * a.s - 4); ctx.stroke(); }
    else if (st === 1) { ctx.strokeStyle = rgb(cur.a, .3 * a.s + .1); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + 4, a.y - 16 * a.s - 6); ctx.stroke(); }
    else if (st === 2) { ctx.fillStyle = `rgba(255,255,255,${.25 + .4 * a.s})`; ctx.beginPath(); ctx.arc(a.x, a.y, 1 + 2 * a.s, 0, 7); ctx.fill(); }
    else if (st === 3) { ctx.strokeStyle = rgb(cur.a, .2 + .3 * a.s); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(a.x, a.y, 2 + 6 * a.s, 0, 7); ctx.stroke(); }
    else { ctx.fillStyle = rgb(cur.a, .3 + .5 * Math.abs(Math.sin(T0 * 4 + a.ph))); ctx.fillRect(a.x, a.y, 2.5, 2.5); }
  });
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
  if (shake > 0) { const m = 10 * Math.min(1, shake * 2); ctx.translate((Math.random() - .5) * m, (Math.random() - .5) * m); }
  const playing = state === 'run' || state === 'count' || state === 'paused';
  if (playing && !(invuln > 0 && Math.floor(invuln * 14) % 2)) {
    const pg = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    pg.addColorStop(0, '#fff'); pg.addColorStop(.3, rgb(cur.a)); pg.addColorStop(1, rgb(cur.a.map(v => v * .55)));
    ctx.shadowColor = rgb(cur.a); ctx.shadowBlur = 20; ctx.fillStyle = pg;
    ctx.beginPath(); ctx.roundRect(player.x, player.y, player.w, player.h, 9); ctx.fill(); ctx.shadowBlur = 0;
    if (timers.shield > 0) { ctx.strokeStyle = '#4dd2ff'; ctx.lineWidth = 3; ctx.shadowColor = '#4dd2ff'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.ellipse(player.x + player.w / 2, player.y + 9, player.w / 2 + 12, 24, 0, 0, 7); ctx.stroke(); ctx.shadowBlur = 0; }
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
    const mult = 1 + Math.min(4, Math.floor(combo / 5));
    if (combo >= 5) {
      ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#ffc83d'; ctx.font = "700 28px 'Chakra Petch',sans-serif";
      ctx.fillText('x' + mult, W - 10, 34); ctx.fillStyle = '#fff'; ctx.font = "500 12px 'Chakra Petch',sans-serif"; ctx.fillText(combo + ' combo', W - 10, 50);
    }
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (banner > 0 && state !== 'menu' && state !== 'over' && state !== 'clear') {
    ctx.globalAlpha = Math.min(1, banner * 1.5);
    ctx.fillStyle = def.m === 'boss' ? '#ff5a6e' : rgb(cur.a); ctx.font = "700 44px 'Chakra Petch',sans-serif";
    ctx.fillText(def.m === 'boss' ? 'BOSS STAGE ' + def.n : 'STAGE ' + def.n, W / 2, 200);
    ctx.fillStyle = '#fff'; ctx.font = "500 19px 'Chakra Petch',sans-serif"; ctx.fillText(def.text, W / 2, 234);
    ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.font = "500 14px 'Chakra Petch',sans-serif"; ctx.fillText(`World ${def.w + 1} \u00B7 ${worldName(def.w)}`, W / 2, 258);
    ctx.globalAlpha = 1;
  }
  if (state === 'count') {
    const f = cd - Math.floor(cd);
    ctx.globalAlpha = .4 + .6 * f; ctx.fillStyle = '#fff'; ctx.font = `700 ${90 + 40 * f}px 'Chakra Petch',sans-serif`;
    ctx.fillText(Math.ceil(cd), W / 2, 340); ctx.globalAlpha = 1;
  }
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, .05); last = now;
  if (state !== 'paused') update(dt);
  draw(now);
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
    if (state === 'menu') startStage(Math.min(save.unlocked, TOTAL));
    else if (state === 'clear' && def.n < TOTAL) startStage(def.n + 1);
    else if (state === 'over') startStage(def.n);
  }
});
addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') right = false;
});
const hold = (id, fn) => {
  const b = $(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); fn(true); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => fn(false)));
};
hold('left', v => left = v); hold('right', v => right = v);
const drag = e => {
  if (state !== 'run' && state !== 'count') return;
  const r = cv.getBoundingClientRect();
  player.x = Math.max(0, Math.min(W - player.w, (e.clientX - r.left) / r.width * W - player.w / 2));
};
cv.addEventListener('pointermove', drag); cv.addEventListener('pointerdown', drag);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
document.addEventListener('touchmove', e => { if (!e.target.closest('.panel')) e.preventDefault(); }, { passive: false });

const on = (id, fn) => $(id).addEventListener('click', fn);
on('play', () => startStage(Math.min(save.unlocked, TOTAL)));
on('openStages', openStages); on('openBoard', () => { renderBoard(); showPanel('board'); });
on('bdBack', () => showPanel('menu')); on('stBack', () => showPanel('menu'));
on('wPrev', () => { selW = Math.max(0, selW - 1); renderStages(); });
on('wNext', () => { selW = Math.min(99, selW + 1); renderStages(); });
on('wCur', () => { selW = Math.floor((Math.min(save.unlocked, TOTAL) - 1) / 10); renderStages(); });
on('resume', resume); on('restart', () => startStage(def.n));
on('pauseStages', () => { state = 'menu'; openStages(); });
on('next', () => startStage(def.n + 1)); on('replay', () => startStage(def.n));
on('clStages', () => { state = 'menu'; openStages(); });
on('retry', () => startStage(def.n));
on('ovStages', () => { state = 'menu'; openStages(); });
on('pauseBtn', togglePause);
on('muteBtn', () => { muted = !muted; write('cc2-mute', muted); $('muteBtn').classList.toggle('off', muted); });

$('name').value = read('cc2-name') || '';
$('muteBtn').classList.toggle('off', muted);
renderHearts(); hud(); showPanel('menu'); fit();
requestAnimationFrame(t => { last = t; loop(t); });
