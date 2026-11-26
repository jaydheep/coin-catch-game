const W = 400, H = 560, LEVEL_SECS = 14, MAX_LIVES = 3;
const $ = id => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d'), stage = $('stage'), root = document.documentElement;
const scoreEl = $('score'), bestEl = $('best'), lvlEl = $('lvl'), heartsEl = $('hearts'), listEl = $('list'), nameIn = $('name'), overlay = $('overlay');
const KEY = 'coin-catch-scores', NAME = 'coin-catch-name';

const THEMES = [
  { n: 'Midnight', t: [34, 14, 66], b: [10, 5, 28], a: [61, 245, 224] },
  { n: 'Ocean', t: [8, 52, 96], b: [3, 14, 42], a: [96, 220, 255] },
  { n: 'Sunset', t: [124, 36, 88], b: [32, 8, 40], a: [255, 176, 72] },
  { n: 'Aurora', t: [8, 84, 72], b: [4, 22, 36], a: [140, 255, 120] },
  { n: 'Inferno', t: [116, 22, 22], b: [26, 4, 10], a: [255, 112, 72] },
  { n: 'Cosmos', t: [52, 30, 124], b: [8, 6, 30], a: [204, 152, 255] }
];
const TYPES = { coin: { c: '#ffc83d', pts: 1 }, bonus: { c: '#9dff4d', pts: 5 }, bomb: { c: '#ff3d7f', pts: -2 } };
const rgb = (a, al = 1) => `rgba(${a.map(Math.round).join(',')},${al})`;

const player = { x: 158, y: 500, w: 84, h: 18 };
let items = [], parts = [], score = 0, lives = MAX_LIVES, level = 0, playTime = 0, spawnIn = 0;
let shake = 0, flash = 0, invuln = 0, banner = 0, bannerText = '', cd = 0, dyingT = 0, prevBest = 0;
let state = 'menu', last = 0, user = '', scale = 1, left = false, right = false;
let cur = { t: [...THEMES[0].t], b: [...THEMES[0].b], a: [...THEMES[0].a] };
const stars = Array.from({ length: 46 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: .3 + Math.random() * .7 }));

const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let scores = read(KEY) || [{ name: 'Roshan', score: 63 }, { name: 'jay', score: 31 }, { name: 'Player', score: 5 }];

function showPanel(id) {
  overlay.classList.remove('hide');
  ['menu', 'pause', 'over'].forEach(p => $(p).hidden = p !== id);
}
const hidePanels = () => overlay.classList.add('hide');

function renderHearts() {
  heartsEl.innerHTML = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    const h = document.createElement('i');
    h.textContent = '\u2665';
    if (i >= lives) h.className = 'lost';
    heartsEl.appendChild(h);
  }
}

function renderBoard(newest) {
  listEl.innerHTML = '';
  scores.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s.name;
    const sp = document.createElement('span'); sp.textContent = s.score;
    li.appendChild(sp);
    if (s === newest) li.className = 'new';
    listEl.appendChild(li);
  });
  bestEl.textContent = scores.length ? scores[0].score : 0;
}

function showBanner() { banner = 1.8; bannerText = THEMES[level % THEMES.length].n; }

function startGame() {
  user = nameIn.value.trim() || 'Player';
  write(NAME, user);
  prevBest = scores.length ? scores[0].score : 0;
  items = []; parts = []; score = 0; lives = MAX_LIVES; level = 0; playTime = 0; spawnIn = .5;
  shake = flash = invuln = 0; left = right = false;
  player.x = (W - player.w) / 2;
  const th = THEMES[0]; cur = { t: [...th.t], b: [...th.b], a: [...th.a] };
  scoreEl.textContent = 0; lvlEl.textContent = 'Level 1';
  renderHearts(); showBanner(); hidePanels();
  state = 'run';
}

function pause() {
  if (state !== 'run') return;
  state = 'paused'; left = right = false;
  showPanel('pause'); $('resume').focus();
}
function resume() {
  if (state !== 'paused') return;
  hidePanels(); state = 'count'; cd = 3;
}

function die() {
  state = 'dying'; dyingT = 1.4; shake = .7; flash = .8;
  burst(player.x + player.w / 2, player.y, '#ff3d7f', 40);
  burst(player.x + player.w / 2, player.y, '#ffb048', 40);
  burst(player.x + player.w / 2, player.y, '#ffffff', 20);
}

function gameOver() {
  state = 'over'; items = [];
  const entry = { name: user, score };
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 10);
  write(KEY, scores);
  const idx = scores.indexOf(entry);
  renderBoard(idx >= 0 ? entry : null);
  $('fScore').textContent = score;
  $('fLevel').textContent = level + 1;
  $('fRank').textContent = idx >= 0 ? '#' + (idx + 1) : '-';
  $('badge').hidden = !(score > prevBest && score > 0);
  showPanel('over'); $('again').focus();
}

function spawn() {
  const bombP = .2 + Math.min(level * .015, .1);
  const r = Math.random();
  const type = r < bombP ? 'bomb' : r < bombP + .1 ? 'bonus' : 'coin';
  items.push({ x: 14 + Math.random() * (W - 28), y: -14, type });
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
    if (invuln > 0) { burst(it.x, it.y, t.c, 10); return; }
    score = Math.max(0, score + t.pts);
    lives--; invuln = 1; shake = .35; flash = .35;
    renderHearts(); burst(it.x, it.y, t.c, 28);
    if (lives <= 0) die();
  } else {
    score += t.pts; burst(it.x, it.y, t.c, it.type === 'bonus' ? 18 : 10);
  }
  scoreEl.textContent = score;
}

const hitTest = it => it.y + 10 >= player.y && it.y - 10 <= player.y + player.h && it.x >= player.x - 8 && it.x <= player.x + player.w + 8;

function update(dt) {
  const run = state === 'run';
  if (state === 'count') { cd -= dt; if (cd <= 0) state = 'run'; }
  if (run) {
    playTime += dt;
    const lv = Math.floor(playTime / LEVEL_SECS);
    if (lv !== level) {
      level = lv; lvlEl.textContent = 'Level ' + (level + 1); showBanner();
      for (let i = 0; i < 24; i++) burst(Math.random() * W, 30, rgb(THEMES[level % 6].a), 1);
    }
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    player.x = Math.max(0, Math.min(W - player.w, player.x + dir * 420 * dt));
    spawnIn -= dt;
    if (spawnIn <= 0) { spawn(); spawnIn = Math.max(.3, .72 - level * .05); }
  }
  if (state === 'dying') { dyingT -= dt; if (dyingT <= 0) gameOver(); }
  if (run || state === 'dying') {
    const fall = (230 + level * 26) * (run ? 1 : .3);
    items = items.filter(it => {
      it.y += fall * dt;
      if (run && hitTest(it)) { collect(it); return false; }
      return it.y < H + 20;
    });
  }
  invuln -= dt; flash -= dt; shake -= dt; banner -= dt;
  parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
  parts = parts.filter(p => p.life > 0);
  stars.forEach(s => { s.y += (60 + level * 18) * s.s * dt; if (s.y > H) { s.y = -10; s.x = Math.random() * W; } });
  const target = THEMES[level % THEMES.length], k = Math.min(1, dt * 2);
  ['t', 'b', 'a'].forEach(key => cur[key] = cur[key].map((v, i) => v + (target[key][i] - v) * k));
  root.style.setProperty('--bg1', rgb(cur.t));
  root.style.setProperty('--bg2', rgb(cur.b));
  root.style.setProperty('--acc', rgb(cur.a));
}

function drawItem(it) {
  const t = TYPES[it.type];
  ctx.shadowColor = t.c; ctx.shadowBlur = 14; ctx.fillStyle = t.c;
  ctx.beginPath();
  if (it.type === 'bonus') {
    ctx.moveTo(it.x, it.y - 14); ctx.lineTo(it.x + 12, it.y); ctx.lineTo(it.x, it.y + 14); ctx.lineTo(it.x - 12, it.y);
    ctx.closePath();
  } else ctx.arc(it.x, it.y, 10, 0, Math.PI * 2);
  ctx.fill(); ctx.shadowBlur = 0;
  if (it.type === 'coin') { ctx.strokeStyle = '#b57f00'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(it.x, it.y, 6, 0, Math.PI * 2); ctx.stroke(); }
  if (it.type === 'bomb') {
    ctx.fillStyle = '#160a2b'; ctx.beginPath(); ctx.arc(it.x, it.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(it.x + 7, it.y - 9, 2 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
  }
}

function draw(now) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgb(cur.t)); g.addColorStop(1, rgb(cur.b));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H, 10, W / 2, H, 320);
  glow.addColorStop(0, rgb(cur.a, .22)); glow.addColorStop(1, rgb(cur.a, 0));
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = 2; ctx.lineCap = 'round';
  stars.forEach(s => {
    ctx.strokeStyle = rgb(cur.a, .12 + .45 * s.s);
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y - (4 + level * 3) * s.s * 2); ctx.stroke();
  });
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - .5) * 10 * Math.min(1, shake * 2), (Math.random() - .5) * 10 * Math.min(1, shake * 2));
  if (state !== 'over' && state !== 'menu' && !(state === 'dying') && !(invuln > 0 && Math.floor(invuln * 14) % 2)) {
    ctx.shadowColor = rgb(cur.a); ctx.shadowBlur = 20; ctx.fillStyle = rgb(cur.a);
    ctx.beginPath(); ctx.roundRect(player.x, player.y, player.w, player.h, 9); ctx.fill(); ctx.shadowBlur = 0;
  }
  items.forEach(drawItem);
  parts.forEach(p => { ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); });
  ctx.globalAlpha = 1;
  ctx.restore();
  if (lives === 1 && (state === 'run' || state === 'count')) {
    const v = ctx.createRadialGradient(W / 2, H / 2, 180, W / 2, H / 2, 420);
    v.addColorStop(0, 'rgba(255,40,80,0)'); v.addColorStop(1, `rgba(255,40,80,${.2 + .15 * Math.sin(now / 160)})`);
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  if (flash > 0) { ctx.fillStyle = `rgba(255,50,90,${Math.min(.5, flash * .7)})`; ctx.fillRect(0, 0, W, H); }
  ctx.textAlign = 'center';
  if (banner > 0 && state !== 'menu' && state !== 'over') {
    ctx.globalAlpha = Math.min(1, banner * 1.5);
    ctx.fillStyle = rgb(cur.a); ctx.font = "700 46px 'Chakra Petch',sans-serif";
    ctx.fillText('LEVEL ' + (level + 1), W / 2, 220);
    ctx.fillStyle = '#fff'; ctx.font = "500 20px 'Chakra Petch',sans-serif";
    ctx.fillText(bannerText, W / 2, 252);
    ctx.globalAlpha = 1;
  }
  if (state === 'count') {
    const f = cd - Math.floor(cd);
    ctx.globalAlpha = .4 + .6 * f; ctx.fillStyle = '#fff'; ctx.font = `700 ${90 + 40 * f}px 'Chakra Petch',sans-serif`;
    ctx.fillText(Math.ceil(cd), W / 2, 300); ctx.globalAlpha = 1;
  }
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, .05); last = now;
  if (state !== 'paused') update(dt);
  draw(now);
  requestAnimationFrame(loop);
}

function fit() {
  const r = stage.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  scale = cv.width / W;
}
new ResizeObserver(fit).observe(stage);

const typing = () => ['BUTTON', 'INPUT'].includes(document.activeElement.tagName);
addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') left = true;
  if (e.key === 'ArrowRight') right = true;
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { state === 'run' ? pause() : resume(); }
  if (e.key === ' ' && !typing()) { e.preventDefault(); state === 'run' ? pause() : resume(); }
  if (e.key === 'Enter' && !typing() && (state === 'menu' || state === 'over')) startGame();
});
addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') left = false;
  if (e.key === 'ArrowRight') right = false;
});
const hold = (id, fn) => {
  const b = $(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); fn(true); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => fn(false)));
};
hold('left', v => left = v); hold('right', v => right = v);
cv.addEventListener('pointermove', e => {
  if (state !== 'run') return;
  const r = cv.getBoundingClientRect();
  player.x = Math.max(0, Math.min(W - player.w, (e.clientX - r.left) / r.width * W - player.w / 2));
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
$('start').addEventListener('click', startGame);
$('again').addEventListener('click', startGame);
$('change').addEventListener('click', () => { showPanel('menu'); nameIn.focus(); });
$('resume').addEventListener('click', resume);
$('quit').addEventListener('click', () => { if (state === 'paused') gameOver(); });
$('pauseBtn').addEventListener('click', () => { state === 'run' ? pause() : resume(); });

nameIn.value = read(NAME) || '';
renderBoard(); renderHearts(); showPanel('menu');
fit();
requestAnimationFrame(t => { last = t; loop(t); });
