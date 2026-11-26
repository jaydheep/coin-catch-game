const W = 400, H = 560;
const $ = id => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d'), stage = $('stage'), wrap = $('wrap'), overlay = $('overlay');
const scoreEl = $('score'), bestEl = $('best'), whoEl = $('who'), comboEl = $('combo');
const titleEl = $('title'), subEl = $('sub'), nameIn = $('name'), startBtn = $('start'), muteBtn = $('mute');
const lists = [$('list'), $('list2')];
const KEY = 'coin-catch-scores', NAME = 'coin-catch-name';
const TYPES = { coin: { c: '#ffc83d', pts: 1 }, bonus: { c: '#9dff4d', pts: 5 }, bomb: { c: '#ff3d7f', pts: -2 } };
const player = { x: 158, y: 500, w: 84, h: 18, flash: 0 };
let items = [], parts = [], texts = [], score = 0, combo = 0, state = 'idle';
let last = 0, elapsed = 0, spawnIn = 0, shake = 0, flash = 0, user = '';
let left = false, right = false, muted = false, ac, scale = 1;
const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() }));

/* ---------- storage ---------- */
const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let scores = read(KEY) || [{ name: 'Roshan', score: 63 }, { name: 'jay', score: 31 }, { name: 'Player', score: 5 }];

function renderBoard(newest) {
  lists.forEach((ul, i) => {
    ul.innerHTML = '';
    scores.slice(0, i ? 3 : 10).forEach(s => {
      const li = document.createElement('li');
      li.textContent = s.name;
      const sp = document.createElement('span');
      sp.textContent = s.score;
      li.appendChild(sp);
      if (s === newest) li.className = 'new';
      ul.appendChild(li);
    });
  });
  bestEl.textContent = scores.length ? scores[0].score : 0;
}

/* ---------- sound ---------- */
function beep(f, d, type, v) {
  if (muted || !ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(v || 0.07, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + d);
  } catch {}
}

/* ---------- sizing: fit the stage to any screen ---------- */
function fit() {
  const r = wrap.getBoundingClientRect();
  scale = Math.max(0.3, Math.min(r.width / W, r.height / H));
  stage.style.width = W * scale + 'px';
  stage.style.height = H * scale + 'px';
  stage.style.fontSize = Math.max(9, 16 * scale) + 'px';
  const d = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(W * scale * d);
  cv.height = Math.round(H * scale * d);
  ctx.setTransform(scale * d, 0, 0, scale * d, 0, 0);
}
new ResizeObserver(fit).observe(wrap);
fit();

/* ---------- game flow ---------- */
const mult = () => Math.min(4, 1 + Math.floor(combo / 5));

function showCombo() {
  comboEl.textContent = combo >= 2 ? (mult() > 1 ? `x${mult()} multiplier  |  ${combo} streak` : `${combo} streak`) : '';
}

function start() {
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch {}
  user = nameIn.value.trim() || 'Player';
  write(NAME, user); whoEl.textContent = user;
  score = 0; combo = 0; items = []; parts = []; texts = [];
  elapsed = 0; spawnIn = 0.4; shake = 0; flash = 0;
  player.x = (W - player.w) / 2;
  scoreEl.textContent = 0; showCombo();
  overlay.classList.add('hide');
  state = 'run'; last = performance.now();
}

function stop() {
  if (state !== 'run') return;
  state = 'over';
  const prevBest = scores.length ? scores[0].score : 0;
  const entry = { name: user, score };
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 10);
  write(KEY, scores);
  renderBoard(scores.includes(entry) ? entry : null);
  titleEl.textContent = 'Round over';
  subEl.textContent = score > prevBest ? `New best! You scored ${score}.` : `You scored ${score}.`;
  startBtn.textContent = 'Play again';
  overlay.classList.remove('hide');
  beep(300, 0.35, 'triangle', 0.08);
}

function spawn() {
  const r = Math.random();
  const type = r < 0.2 ? 'bomb' : r < 0.3 ? 'bonus' : 'coin';
  items.push({ x: 16 + Math.random() * (W - 32), y: -16, type, seed: Math.random() * 6 });
}

function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 170;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.6, color });
  }
}

function update(dt) {
  elapsed += dt;
  const dir = (right ? 1 : 0) - (left ? 1 : 0);
  player.x = Math.max(0, Math.min(W - player.w, player.x + dir * 420 * dt));
  spawnIn -= dt;
  if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.33, 0.7 - elapsed * 0.004); }
  const fall = 240 + elapsed * 4;
  items = items.filter(it => {
    it.y += fall * dt;
    const hit = it.y + 10 >= player.y && it.y - 10 <= player.y + player.h && it.x >= player.x - 8 && it.x <= player.x + player.w + 8;
    if (!hit) return it.y < H + 24;
    const t = TYPES[it.type];
    let pts = t.pts;
    if (it.type === 'bomb') {
      combo = 0; shake = 0.3; flash = 0.35;
      beep(110, 0.3, 'sawtooth', 0.09);
    } else {
      combo++;
      pts *= mult();
      player.flash = 0.15;
      if (it.type === 'bonus') beep(1250, 0.18, 'triangle'); else beep(880 + Math.min(combo, 15) * 25, 0.08, 'sine');
    }
    score += pts; scoreEl.textContent = score; showCombo();
    burst(it.x, player.y, t.c, it.type === 'bomb' ? 26 : 12);
    texts.push({ x: it.x, y: player.y - 8, life: 0.8, color: t.c, text: (pts > 0 ? '+' : '') + pts });
    return false;
  });
  parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt; });
  parts = parts.filter(p => p.life > 0);
  texts.forEach(t => { t.y -= 50 * dt; t.life -= dt; });
  texts = texts.filter(t => t.life > 0);
  shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt); player.flash = Math.max(0, player.flash - dt);
}

/* ---------- drawing ---------- */
function starShape(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function drawItem(it, t) {
  const c = TYPES[it.type].c;
  ctx.shadowColor = c; ctx.shadowBlur = 16;
  if (it.type === 'coin') {
    const f = Math.max(0.25, Math.abs(Math.cos(t * 5 + it.seed)));
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(it.x, it.y, 10 * f, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#b57f00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(it.x, it.y, 6 * f, 6, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (it.type === 'bonus') {
    ctx.fillStyle = c; starShape(it.x, it.y, 14); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffffaa'; starShape(it.x, it.y, 6); ctx.fill();
  } else {
    const g = ctx.createRadialGradient(it.x - 3, it.y - 3, 1, it.x, it.y, 11);
    g.addColorStop(0, '#5a1d4a'); g.addColorStop(1, '#14040f');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(it.x, it.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = c; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(it.x, it.y, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = Math.random() > 0.5 ? '#ffc83d' : '#fff';
    ctx.beginPath(); ctx.arc(it.x + 6, it.y - 12, 2 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function draw() {
  const t = performance.now() / 1000;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1f0e40'); g.addColorStop(1, '#0b0620');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  stars.forEach(s => {
    ctx.globalAlpha = 0.25 + s.z * 0.6;
    ctx.fillStyle = s.z > 0.8 ? '#3df5e0' : '#fff';
    ctx.fillRect(s.x, s.y, 1 + s.z * 1.5, 1 + s.z * 1.5);
  });
  ctx.globalAlpha = 1;
  /* floor glow */
  const fg = ctx.createLinearGradient(0, H - 70, 0, H);
  fg.addColorStop(0, '#3df5e000'); fg.addColorStop(1, '#3df5e033');
  ctx.fillStyle = fg; ctx.fillRect(0, H - 70, W, 70);

  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
  const pg = ctx.createLinearGradient(player.x, 0, player.x + player.w, 0);
  pg.addColorStop(0, player.flash > 0 ? '#fff' : '#3df5e0'); pg.addColorStop(1, player.flash > 0 ? '#fff' : '#7a7bff');
  ctx.shadowColor = '#3df5e0'; ctx.shadowBlur = 22; ctx.fillStyle = pg;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(player.x, player.y, player.w, player.h, 9); else ctx.rect(player.x, player.y, player.w, player.h);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff66'; ctx.fillRect(player.x + 10, player.y + 3, player.w - 20, 2);
  items.forEach(it => drawItem(it, t));
  parts.forEach(p => { ctx.globalAlpha = Math.max(0, p.life * 1.8); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); });
  ctx.globalAlpha = 1;
  ctx.font = "700 18px 'Chakra Petch', sans-serif"; ctx.textAlign = 'center';
  texts.forEach(tx => { ctx.globalAlpha = Math.min(1, tx.life * 2); ctx.fillStyle = tx.color; ctx.fillText(tx.text, tx.x, tx.y); });
  ctx.globalAlpha = 1;
  ctx.restore();
  if (flash > 0) { ctx.fillStyle = `rgba(255,61,127,${flash})`; ctx.fillRect(0, 0, W, H); }
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  stars.forEach(s => { s.y += (18 + s.z * 50) * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });
  if (state === 'run') update(dt);
  draw();
  requestAnimationFrame(loop);
}

/* ---------- input ---------- */
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') left = true;
  if (k === 'arrowright' || k === 'd') right = true;
  if (k === 'escape') stop();
  if (k === 'enter' && state !== 'run' && document.activeElement !== startBtn) start();
});
addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') left = false;
  if (k === 'arrowright' || k === 'd') right = false;
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
muteBtn.addEventListener('click', () => { muted = !muted; muteBtn.textContent = muted ? 'Sound off' : 'Sound on'; });

nameIn.value = read(NAME) || '';
renderBoard();
requestAnimationFrame(t => { last = t; loop(t); });
