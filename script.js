const W = 400, H = 560;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);
const scoreEl = $('score'), bestEl = $('best'), whoEl = $('who'), overlay = $('overlay');
const nameIn = $('name'), startBtn = $('start'), subEl = $('sub'), listEl = $('list');
const KEY = 'coin-catch-scores', NAME = 'coin-catch-name';

const dpr = Math.min(window.devicePixelRatio || 1, 2);
cv.width = W * dpr; cv.height = H * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

const TYPES = { coin: { c: '#ffc83d', pts: 1 }, bonus: { c: '#9dff4d', pts: 5 }, bomb: { c: '#ff3d7f', pts: -2 } };
const player = { x: 160, y: 500, w: 84, h: 18 };
let items = [], parts = [], score = 0, state = 'idle', last = 0, elapsed = 0, spawnIn = 0, shake = 0, user = '';
let left = false, right = false;

const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let scores = read(KEY) || [{ name: 'Roshan', score: 63 }, { name: 'jay', score: 31 }, { name: 'Player', score: 5 }];

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

function start() {
  user = nameIn.value.trim() || 'Player';
  write(NAME, user); whoEl.textContent = user;
  score = 0; items = []; parts = []; elapsed = 0; spawnIn = 0.4; shake = 0;
  player.x = (W - player.w) / 2;
  scoreEl.textContent = 0;
  overlay.classList.add('hide');
  state = 'run'; last = performance.now();
}

function stop() {
  if (state !== 'run') return;
  state = 'over';
  const entry = { name: user, score };
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 10);
  write(KEY, scores);
  renderBoard(scores.includes(entry) ? entry : null);
  subEl.textContent = `Round over. You scored ${score}.`;
  startBtn.textContent = 'Play again';
  overlay.classList.remove('hide');
}

function spawn() {
  const r = Math.random();
  const type = r < 0.2 ? 'bomb' : r < 0.3 ? 'bonus' : 'coin';
  items.push({ x: 14 + Math.random() * (W - 28), y: -12, type });
}

function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 140;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, color });
  }
}

function update(dt) {
  elapsed += dt;
  const dir = (right ? 1 : 0) - (left ? 1 : 0);
  player.x = Math.max(0, Math.min(W - player.w, player.x + dir * 400 * dt));
  spawnIn -= dt;
  if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.35, 0.7 - elapsed * 0.004); }
  const fall = 240 + elapsed * 4;
  items = items.filter(it => {
    it.y += fall * dt;
    const hit = it.y + 10 >= player.y && it.y - 10 <= player.y + player.h && it.x >= player.x - 8 && it.x <= player.x + player.w + 8;
    if (hit) {
      const t = TYPES[it.type];
      score += t.pts; scoreEl.textContent = score;
      burst(it.x, player.y, t.c, it.type === 'bomb' ? 22 : 10);
      if (it.type === 'bomb') shake = 0.25;
      return false;
    }
    return it.y < H + 20;
  });
  parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
  parts = parts.filter(p => p.life > 0);
  shake = Math.max(0, shake - dt);
}

function drawItem(it) {
  const t = TYPES[it.type];
  ctx.shadowColor = t.c; ctx.shadowBlur = 14; ctx.fillStyle = t.c;
  ctx.beginPath();
  if (it.type === 'bonus') {
    ctx.moveTo(it.x, it.y - 13); ctx.lineTo(it.x + 11, it.y); ctx.lineTo(it.x, it.y + 13); ctx.lineTo(it.x - 11, it.y);
    ctx.closePath();
  } else ctx.arc(it.x, it.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  if (it.type === 'coin') { ctx.strokeStyle = '#b57f00'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(it.x, it.y, 6, 0, Math.PI * 2); ctx.stroke(); }
  if (it.type === 'bomb') { ctx.fillStyle = '#160a2b'; ctx.beginPath(); ctx.arc(it.x, it.y, 5, 0, Math.PI * 2); ctx.fill(); }
}

function draw() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1d0d3a'); g.addColorStop(1, '#0d0620');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - .5) * 8, (Math.random() - .5) * 8);
  ctx.shadowColor = '#3df5e0'; ctx.shadowBlur = 18; ctx.fillStyle = '#3df5e0';
  ctx.beginPath(); ctx.roundRect(player.x, player.y, player.w, player.h, 9); ctx.fill();
  ctx.shadowBlur = 0;
  items.forEach(drawItem);
  parts.forEach(p => { ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); });
  ctx.globalAlpha = 1;
  ctx.restore();
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (state === 'run') update(dt);
  draw();
  requestAnimationFrame(loop);
}

addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') left = true;
  if (e.key === 'ArrowRight') right = true;
  if (e.key === 'Enter' && state !== 'run' && document.activeElement !== startBtn) start();
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
startBtn.addEventListener('click', start);
$('stop').addEventListener('click', stop);

nameIn.value = read(NAME) || '';
renderBoard();
requestAnimationFrame(t => { last = t; loop(t); });
