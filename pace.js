/* ---------- Speed waves (calm, build up, rush, cool down), twist events and clutch time ---------- */
let tempo = 1, phase = 0, phaseT = 10, phaseLen = 10, twist = null, windV = 0, clutch = 0, clutchCool = 0;
const PHASES = ['CALM', 'BUILD UP', 'RUSH x2', 'COOL DOWN'];
const PH_COL = ['#4de1ff', '#ffd86b', '#ff5a6e', '#9dff4d'];
const TW = { wind: 'WIND GUSTS', fog: 'FOG AT THE TOP', mirror: 'MIRRORED CONTROLS' };
const rushOn = () => S.waves && phase === 2 && state === 'run';
const twistOn = k => !!twist && twist.warn <= 0 && twist.k === k;
const tempoCfg = () => { const D = DIFF[S.diff] || DIFF.normal; return def.brain ? { lo: .62, hi: def.m === 'boss' ? 1.35 : 1.25 } : { lo: D.lo, hi: D.hi }; };

function paceReset(menu) {
  phase = 0; phaseLen = phaseT = 9 + Math.random() * 3;
  tempo = menu ? 1 : tempoCfg().lo;
  twist = null; windV = 0; clutch = 0; clutchCool = 0;
}
function startTwist() {
  if (!S.twists || def.n < 3) return;
  const D = DIFF[S.diff] || DIFF.normal;
  const pool = def.brain ? D.tw.filter(k => k === 'wind') : D.tw;
  if (!pool.length || Math.random() > (S.diff === 'hard' ? .85 : .6)) return;
  twist = { k: pool[Math.floor(Math.random() * pool.length)], warn: 1.5 };
  pop('RUSH! ' + TW[twist.k], '#ffc83d');
}
function nextPhase() {
  phase = (phase + 1) % 4;
  phaseLen = phaseT = [8 + Math.random() * 3, 4, 5.5 + Math.random() * 2.5, 3.5][phase];
  if (phase === 2) { pop(def.brain ? 'FAST LANE!' : 'RUSH! x2 points', '#ff5a6e'); sfx(220, .4, 'sawtooth', .05, 420); vib(30); startTwist(); }
  else if (phase === 0) { twist = null; pop('Breather. Catch your breath', '#4de1ff'); }
  else if (phase === 3) twist = null;
}
function paceUpdate(dt) {
  if (!S.waves) { tempo = 1; phase = 1; twist = null; }
  else {
    phaseT -= dt; if (phaseT <= 0) nextPhase();
    const c = tempoCfg(), p = 1 - phaseT / phaseLen;
    const target = phase === 0 ? c.lo : phase === 1 ? c.lo + (1.1 - c.lo) * p : phase === 2 ? c.hi : c.hi + (c.lo - c.hi) * p;
    tempo += (target - tempo) * Math.min(1, dt * 3);
  }
  if (twist && twist.warn > 0) twist.warn -= dt;
  windV = twistOn('wind') ? Math.sin(T0 * .8) * 70 : 0;
  clutchCool -= dt; clutch = Math.max(0, clutch - dt);
  if (lives === 1 && clutch <= 0 && clutchCool <= 0 && items.some(b => b.type === 'bomb' && b.y > player.y - 110 && b.y < player.y - 14 && Math.abs(b.x - (player.x + player.w / 2)) < player.w / 2 + 26)) {
    clutch = 1.2; clutchCool = 14; pop('CLUTCH TIME!', '#4de1ff'); sfx(300, .4, 'sine', .06, -120);
  }
}
function drawPaceFx() {
  if (state !== 'run' && state !== 'count') return;
  if (S.waves && phase === 2) {
    ctx.strokeStyle = 'rgba(255,90,110,.28)'; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { const x = i < 6 ? 8 + i * 5 : W - 8 - (i - 6) * 5, y = (T0 * 700 + i * 97) % (H + 60) - 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 45); ctx.stroke(); }
  }
  if (twistOn('wind')) {
    const sg = Math.sign(windV) || 1; ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) { const y = (i * 43 + T0 * 30) % H, x = (((T0 * 220 * sg + i * 61) % (W + 80)) + W + 80) % (W + 80) - 40; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 34 * sg, y); ctx.stroke(); }
  }
  if (twistOn('mirror')) { ctx.fillStyle = 'rgba(180,90,255,.07)'; ctx.fillRect(0, 0, W, H); }
}
function drawFog() {
  if (!twistOn('fog') || (state !== 'run' && state !== 'count')) return;
  const fg = ctx.createLinearGradient(0, 0, 0, 340);
  fg.addColorStop(0, rgb(cur.b, .97)); fg.addColorStop(.6, rgb(cur.b, .85)); fg.addColorStop(1, rgb(cur.b, 0));
  ctx.fillStyle = fg; ctx.fillRect(0, 0, W, 340);
}
function drawPaceHud() {
  if (!S.waves) return;
  const y = def.brain ? 74 : 14, cx = W / 2, col = PH_COL[phase], c = tempoCfg();
  const f = Math.max(.08, Math.min(1, (tempo - c.lo * .8) / (c.hi - c.lo * .8)));
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.roundRect(cx - 56, y, 112, 21, 10); ctx.fill();
  ctx.fillStyle = col; ctx.globalAlpha = .9; ctx.beginPath(); ctx.roundRect(cx - 50, y + 16, 100 * f, 3, 2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = "700 11px 'Chakra Petch',sans-serif"; ctx.fillStyle = col;
  ctx.fillText(phase === 2 && def.brain ? 'FAST LANE' : PHASES[phase], cx, y + 9);
  if (twist) {
    ctx.globalAlpha = twist.warn > 0 ? .5 + .5 * Math.sin(T0 * 14) : 1; ctx.fillStyle = '#ffc83d'; ctx.font = "700 12px 'Chakra Petch',sans-serif";
    ctx.fillText(TW[twist.k] + (twist.warn > 0 ? ' in ' + Math.ceil(twist.warn) : ''), cx, y + 33); ctx.globalAlpha = 1;
  }
}
