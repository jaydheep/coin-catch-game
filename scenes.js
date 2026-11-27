/* ---------- World scenes: adjective = palette + weather, noun = landscape ---------- */
const WORLD_AMB = ['warp', 'sparkle', 'embers', 'snow', 'petal', 'dust', 'stars', 'fire', 'rain', 'motes'];
const rnd = seed => { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; };
let scene = null, sceneW = -1, lightning = 0, nextBolt = 6;

function buildScene(w) {
  const noun = Math.floor(w / 10) % 10, r = rnd(w * 977 + 13), rr = (a, b) => a + r() * (b - a), d = {};
  if (noun === 0) { d.lh = rr(40, 90); d.cranes = [rr(110, 170), rr(240, 330)]; d.boats = Array.from({ length: 3 }, (_, i) => ({ x: rr(0, 460), s: rr(.7, 1.2), p: rr(0, 6), y: 486 + i * 14 })); }
  else if (noun === 1) d.layers = [430, 455, 480].map(base => { const pts = []; let x = -10; while (x < W + 10) { const h = rr(10, 60), wd = rr(35, 80); pts.push([x, base - h], [x + wd, base - h]); x += wd + rr(8, 20); } return pts; });
  else if (noun === 2) { d.bushes = Array.from({ length: 9 }, (_, i) => ({ x: i * 50 + rr(0, 20), r: rr(22, 38) })); d.trees = Array.from({ length: 3 }, (_, i) => ({ x: 50 + i * 140 + rr(-20, 20), h: rr(50, 90), r: rr(22, 32) })); d.flowers = Array.from({ length: 26 }, () => ({ x: rr(0, W), y: rr(514, 548), c: r() < .5 })); }
  else if (noun === 3) { d.pagodas = [{ x: rr(60, 120), s: rr(.9, 1.2), tiers: 3 + Math.floor(r() * 2) }, { x: rr(270, 340), s: rr(.7, 1), tiers: 2 + Math.floor(r() * 2) }]; d.pillars = [20, 70, 330, 380]; d.lanterns = [60, 120, 190, 250, 320, 370].map(x => x + rr(-10, 10)); }
  else if (noun === 4) { d.bld = []; for (let l = 1; l >= 0; l--) { let x = -10 + rr(0, 20); while (x < W) { const wd = rr(20, 44), h = rr(70, 190) * (l ? 1 : .75), win = []; for (let wy = 10; wy < h - 6; wy += 10) for (let wx = 5; wx < wd - 5; wx += 8) if (r() < .6) win.push({ x: wx, y: wy, p: rr(0, 40), c: r() < .25 }); d.bld.push({ x, w: wd, h, l, win, ant: r() < .3 }); x += wd + rr(0, 8); } } }
  else if (noun === 5) { d.islands = [{ x: rr(50, 120), w: rr(50, 80) }, { x: rr(260, 350), w: rr(40, 70) }]; d.palms = [{ x: d.islands[0].x - 10, h: rr(50, 80), lean: rr(-14, 14) }, { x: d.islands[0].x + 18, h: rr(40, 60), lean: rr(-14, 14) }, { x: d.islands[1].x, h: rr(45, 70), lean: rr(-14, 14) }]; }
  else if (noun === 6) { d.peaks = []; for (let l = 0; l < 2; l++) for (let i = 0; i < 3; i++) d.peaks.push({ x: i * 150 + rr(-20, 60) + l * 60, h: rr(110, 190) - l * 25, w: rr(80, 120), l }); d.clouds = Array.from({ length: 4 }, () => ({ x: rr(0, 460), y: rr(380, 470), w: rr(30, 60), v: rr(4, 10) })); }
  else if (noun === 7) d.tents = Array.from({ length: 5 }, (_, i) => ({ x: 40 + i * 80 + rr(-12, 12), w: rr(60, 90), h: rr(40, 70), c: r() < .5 }));
  else if (noun === 8) { d.corals = Array.from({ length: 8 }, () => ({ x: rr(10, W - 10), h: rr(26, 60), t: r() < .5 })); d.kelp = Array.from({ length: 6 }, () => ({ x: rr(10, W - 10), h: rr(50, 110) })); d.fish = Array.from({ length: 6 }, () => ({ x: rr(0, 460), y: rr(330, 470), s: rr(.7, 1.3), v: rr(10, 28) })); }
  else d.towers = [{ x: 40, w: 36, h: 120 }, { x: 200, w: 44, h: 150 }, { x: 360, w: 36, h: 110 }].map(t => ({ ...t, x: t.x + rr(-12, 12), h: t.h + rr(-15, 15) }));
  return { noun, d };
}

function worldFx(dt) {
  if (sceneW !== def.w) { scene = buildScene(def.w); sceneW = def.w; }
  if (def.w % 10 === 8 && (state === 'run' || state === 'menu' || state === 'count')) {
    nextBolt -= dt;
    if (nextBolt <= 0) { lightning = .22; nextBolt = 5 + Math.random() * 6; if (state !== 'menu') setTimeout(() => sfx(70, .7, 'sawtooth', .05, -25), 280); }
  }
  lightning = Math.max(0, lightning - dt);
}

function drawSky() {
  const adj = def.w % 10;
  if (adj === 0) {
    const g = ctx.createLinearGradient(0, 345, 0, 430); g.addColorStop(0, 'rgba(255,220,90,.42)'); g.addColorStop(1, 'rgba(255,60,170,.42)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, 430, 85, Math.PI, 0); ctx.fill();
    ctx.fillStyle = rgb(cur.b, .85); for (let i = 0; i < 5; i++) ctx.fillRect(W / 2 - 90, 392 + i * 8, 180, 2 + i * .7);
  } else if (adj === 2) {
    const g = ctx.createRadialGradient(W / 2, H, 10, W / 2, H, 330); g.addColorStop(0, 'rgba(255,90,30,.32)'); g.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else if (adj === 3) {
    ctx.lineWidth = 22;
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = i % 2 ? 'rgba(120,255,200,.1)' : rgb(cur.a, .12); ctx.beginPath(); for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 100 + i * 28 + Math.sin(x * .02 + T0 * .6 + i) * 18); ctx.stroke(); }
    ctx.lineWidth = 2;
  } else if (adj === 5) {
    const sx = 300, sy = 250, g = ctx.createRadialGradient(sx, sy, 10, sx, sy, 170); g.addColorStop(0, 'rgba(255,200,90,.45)'); g.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,215,120,.3)'; ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + T0 * .15; ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * 48, sy + Math.sin(a) * 48); ctx.lineTo(sx + Math.cos(a) * 78, sy + Math.sin(a) * 78); ctx.stroke(); }
    ctx.lineWidth = 2; ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.arc(sx, sy, 34, 0, 7); ctx.fill();
  } else if (adj === 6) {
    const mx = 85, my = 130, g = ctx.createRadialGradient(mx, my, 10, mx, my, 110); g.addColorStop(0, 'rgba(210,220,255,.35)'); g.addColorStop(1, 'rgba(210,220,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#eef1ff'; ctx.beginPath(); ctx.arc(mx, my, 30, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(120,130,170,.35)';
    [[-9, -6, 6], [10, 8, 8], [4, -14, 4]].forEach(c => { ctx.beginPath(); ctx.arc(mx + c[0], my + c[1], c[2], 0, 7); ctx.fill(); });
  }
}

function updateAmb(dt) {
  const st = WORLD_AMB[def.w % 10], n = S.quality === 'high' ? 50 : 20;
  for (let i = 0; i < n; i++) {
    const a = amb[i];
    if (st === 'warp') a.y += (90 + def.fall * .3) * a.s * dt;
    else if (st === 'rain') { a.y += (320 + a.s * 200) * dt; a.x -= 50 * dt; }
    else if (st === 'snow') { a.y += (40 + 40 * a.s) * dt; a.x += Math.sin(T0 + a.ph) * 22 * dt; }
    else if (st === 'petal') { a.y += (35 + 30 * a.s) * dt; a.x += (22 + Math.sin(T0 + a.ph) * 25) * dt; }
    else if (st === 'dust') { a.y += (12 + 14 * a.s) * dt; a.x += (10 + 12 * a.s) * dt; }
    else if (st === 'motes') { a.y -= (10 + 14 * a.s) * dt; a.x += Math.sin(T0 * .7 + a.ph) * 14 * dt; }
    else if (st === 'embers') { a.y -= (40 + 70 * a.s) * dt; a.x += Math.sin(T0 * 2 + a.ph) * 26 * dt; }
    else if (st === 'fire') { a.x += Math.sin(T0 * .8 + a.ph) * 24 * dt; a.y += Math.cos(T0 * .6 + a.ph * 2) * 18 * dt; }
    if (a.y > H + 10) { a.y = -10; a.x = Math.random() * W; }
    if (a.y < -10) { a.y = H + 10; a.x = Math.random() * W; }
    if (a.x < -10) a.x = W + 10;
    if (a.x > W + 10) a.x = -10;
  }
}
function drawAmb() {
  const st = WORLD_AMB[def.w % 10], n = S.quality === 'high' ? 50 : 20;
  for (let i = 0; i < n; i++) {
    const a = amb[i];
    if (st === 'warp') { ctx.strokeStyle = rgb(cur.a, .12 + .45 * a.s); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x, a.y - 10 * a.s - 4); ctx.stroke(); }
    else if (st === 'rain') { ctx.strokeStyle = 'rgba(180,200,255,' + (.2 + .3 * a.s) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + 4, a.y - 16 * a.s - 6); ctx.stroke(); }
    else if (st === 'snow') { ctx.fillStyle = 'rgba(255,255,255,' + (.3 + .5 * a.s) + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, 1 + 2.2 * a.s, 0, 7); ctx.fill(); }
    else if (st === 'petal') { ctx.fillStyle = 'rgba(255,120,190,.55)'; ctx.beginPath(); ctx.ellipse(a.x, a.y, 4 * a.s + 2, 2 * a.s + 1, T0 + a.ph, 0, 7); ctx.fill(); }
    else if (st === 'dust') { ctx.fillStyle = 'rgba(255,220,150,' + (.15 + .25 * a.s) + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, 1 + 2 * a.s, 0, 7); ctx.fill(); }
    else if (st === 'motes') { ctx.fillStyle = 'rgba(255,200,110,' + (.2 + .3 * a.s) + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, 1.2 + 2 * a.s, 0, 7); ctx.fill(); }
    else if (st === 'embers') { ctx.fillStyle = 'rgba(255,' + Math.round(110 + 90 * a.s) + ',60,' + (.3 + .5 * Math.abs(Math.sin(T0 * 4 + a.ph))) + ')'; ctx.fillRect(a.x, a.y, 2.5, 2.5); }
    else if (st === 'fire') { const k = Math.abs(Math.sin(T0 * 2 + a.ph)); ctx.fillStyle = 'rgba(190,255,120,' + (.08 + .12 * k) + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, 6, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(210,255,150,' + (.3 + .6 * k) + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, 1.8, 0, 7); ctx.fill(); }
    else if (st === 'sparkle') {
      const k = .5 + .5 * Math.sin(T0 * 2 + a.ph * 3); if (k < .2) continue;
      const sz = 2 + 5 * k * a.s; ctx.fillStyle = 'rgba(255,255,255,' + (.3 + .6 * k) + ')'; ctx.beginPath();
      ctx.moveTo(a.x, a.y - sz); ctx.lineTo(a.x + sz * .25, a.y - sz * .25); ctx.lineTo(a.x + sz, a.y); ctx.lineTo(a.x + sz * .25, a.y + sz * .25);
      ctx.lineTo(a.x, a.y + sz); ctx.lineTo(a.x - sz * .25, a.y + sz * .25); ctx.lineTo(a.x - sz, a.y); ctx.lineTo(a.x - sz * .25, a.y - sz * .25); ctx.closePath(); ctx.fill();
    } else if (st === 'stars') { ctx.fillStyle = 'rgba(255,255,255,' + (.25 + .6 * Math.abs(Math.sin(T0 * 1.5 + a.ph * 4))) + ')'; ctx.beginPath(); ctx.arc(a.x, a.y * .62, .8 + 1.4 * a.s, 0, 7); ctx.fill(); }
  }
}

function drawScene() {
  if (!scene) return;
  const d = scene.d, dark = rgb(cur.b, .96), mid = rgb(cur.t.map(v => v * .55), .96), rim = rgb(cur.a, .32), lit = rgb(cur.a, .9);
  const water = y0 => {
    const wg = ctx.createLinearGradient(0, y0, 0, H); wg.addColorStop(0, rgb(cur.t.map(v => v * .7), .92)); wg.addColorStop(1, dark);
    ctx.fillStyle = wg; ctx.fillRect(0, y0, W, H - y0); ctx.strokeStyle = rim; ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { const y = y0 + 10 + i * 13; ctx.beginPath(); for (let x = 0; x <= W; x += 10) ctx.lineTo(x, y + Math.sin(x * .05 + T0 * 1.5 + i) * 2); ctx.stroke(); }
  };
  const circ = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const gb = S.quality === 'high' ? 10 : 0;
  switch (scene.noun) {
    case 0: {
      water(470);
      ctx.fillStyle = dark; ctx.fillRect(0, 462, 90, 100); ctx.fillRect(W - 80, 466, 80, 100);
      d.cranes.forEach(x => { ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x, 420); ctx.lineTo(x + 40, 420); ctx.moveTo(x + 36, 420); ctx.lineTo(x + 36, 440); ctx.stroke(); });
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(d.lh - 9, 470); ctx.lineTo(d.lh - 5, 410); ctx.lineTo(d.lh + 5, 410); ctx.lineTo(d.lh + 9, 470); ctx.fill();
      const x2 = d.lh + 300 * Math.cos(T0 * .9); ctx.fillStyle = rgb(cur.a, .14); ctx.beginPath(); ctx.moveTo(d.lh, 405); ctx.lineTo(x2, 330); ctx.lineTo(x2, 385); ctx.closePath(); ctx.fill();
      ctx.fillStyle = lit; circ(d.lh, 405, 4);
      d.boats.forEach(b => {
        const x = (b.x + T0 * 6 * b.s) % 460 - 30, y = b.y + Math.sin(T0 * 1.3 + b.p) * 2;
        ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(x - 14 * b.s, y); ctx.lineTo(x + 14 * b.s, y); ctx.lineTo(x + 9 * b.s, y + 7 * b.s); ctx.lineTo(x - 9 * b.s, y + 7 * b.s); ctx.fill();
        ctx.fillStyle = rgb(cur.a, .7); ctx.beginPath(); ctx.moveTo(x, y - 22 * b.s); ctx.lineTo(x, y - 2); ctx.lineTo(x + 12 * b.s, y - 2); ctx.fill();
      });
      break;
    }
    case 1:
      d.layers.forEach((pts, l) => {
        ctx.fillStyle = l === 2 ? dark : rgb(cur.t.map(v => v * (.5 + l * .1)), .96);
        ctx.beginPath(); ctx.moveTo(-10, H); pts.forEach(q => ctx.lineTo(q[0], q[1])); ctx.lineTo(W + 10, H); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.clip(); ctx.strokeStyle = rgb(cur.a, .12); ctx.lineWidth = 1.5;
        for (let y = 400 + l * 20; y < H; y += 14) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        ctx.restore(); ctx.strokeStyle = rgb(cur.a, .2 + l * .08); ctx.lineWidth = 2; ctx.stroke();
      });
      break;
    case 2:
      ctx.fillStyle = dark; ctx.fillRect(0, 506, W, 60);
      ctx.fillStyle = mid; d.bushes.forEach(b => { ctx.beginPath(); ctx.arc(b.x, 508, b.r, Math.PI, 0); ctx.fill(); });
      d.trees.forEach(t => {
        ctx.fillStyle = dark; ctx.fillRect(t.x - 3, 506 - t.h, 6, t.h);
        circ(t.x, 506 - t.h, t.r); circ(t.x - t.r * .6, 506 - t.h + t.r * .4, t.r * .7); circ(t.x + t.r * .6, 506 - t.h + t.r * .4, t.r * .7);
        ctx.strokeStyle = rim; ctx.beginPath(); ctx.arc(t.x, 506 - t.h, t.r, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      });
      d.flowers.forEach(f => { ctx.fillStyle = f.c ? lit : 'rgba(255,170,210,.8)'; circ(f.x, f.y + Math.sin(T0 * 2 + f.x) * 1, 3); });
      break;
    case 3:
      ctx.fillStyle = dark; ctx.fillRect(0, 508, W, 60);
      d.pillars.forEach(x => { ctx.fillStyle = mid; ctx.fillRect(x - 5, 440, 10, 70); ctx.fillStyle = dark; ctx.fillRect(x - 8, 436, 16, 6); });
      d.pagodas.forEach(pg => {
        for (let i = 0; i < pg.tiers; i++) {
          const y = 480 - i * 34, w = (46 - i * 7) * pg.s;
          ctx.fillStyle = mid; ctx.fillRect(pg.x - w * .6, y, w * 1.2, 28);
          ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(pg.x - w - 8, y + 2); ctx.quadraticCurveTo(pg.x - w * .5, y - 4, pg.x, y - 16); ctx.quadraticCurveTo(pg.x + w * .5, y - 4, pg.x + w + 8, y + 2); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = rim; ctx.stroke();
        }
        ctx.fillStyle = dark; ctx.fillRect(pg.x - 1.5, 480 - pg.tiers * 34 - 22, 3, 24);
      });
      ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 380); ctx.quadraticCurveTo(W / 2, 420, W, 380); ctx.stroke();
      d.lanterns.forEach(x => {
        const t = x / W, ry = 380 + 80 * t * (1 - t), sw = Math.sin(T0 + x) * 3;
        ctx.strokeStyle = dark; ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x + sw, ry + 14); ctx.stroke();
        ctx.fillStyle = lit; ctx.shadowColor = rgb(cur.a); ctx.shadowBlur = gb; ctx.beginPath(); ctx.ellipse(x + sw, ry + 22, 6, 8, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      });
      break;
    case 4:
      ctx.fillStyle = dark; ctx.fillRect(0, 508, W, 52);
      d.bld.forEach(b => {
        ctx.fillStyle = b.l ? mid : dark; ctx.fillRect(b.x, 508 - b.h, b.w, b.h + 60);
        ctx.strokeStyle = rim; ctx.strokeRect(b.x, 508 - b.h, b.w, b.h);
        b.win.forEach(w => { if (Math.sin(T0 * .5 + w.p) < -.6) return; ctx.fillStyle = w.c ? lit : 'rgba(255,230,150,.75)'; ctx.fillRect(b.x + w.x, 508 - b.h + w.y, 3, 4); });
        if (b.ant) { ctx.fillStyle = dark; ctx.fillRect(b.x + b.w / 2 - 1, 508 - b.h - 18, 2, 18); if (Math.sin(T0 * 3 + b.x) > 0) { ctx.fillStyle = '#ff4d4d'; circ(b.x + b.w / 2, 508 - b.h - 18, 2.5); } }
      });
      break;
    case 5:
      water(462);
      ctx.fillStyle = rgb(cur.a, .1); for (let i = 0; i < 5; i++) ctx.fillRect(W * .72 - 30 + Math.sin(T0 + i) * 4, 490 + i * 12, 60 - i * 8, 2);
      ctx.fillStyle = dark; d.islands.forEach(i => { ctx.beginPath(); ctx.ellipse(i.x, 470, i.w, 14, 0, Math.PI, 0); ctx.fill(); });
      d.palms.forEach(pm => {
        const tx = pm.x + pm.lean + Math.sin(T0 * 1.2 + pm.x) * 3, ty = 468 - pm.h;
        ctx.strokeStyle = dark; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(pm.x, 470); ctx.quadraticCurveTo(pm.x + pm.lean * .2, 468 - pm.h * .5, tx, ty); ctx.stroke();
        ctx.lineWidth = 3;
        for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .55; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * 18, ty + Math.sin(a) * 18 - 6, tx + Math.cos(a) * 30, ty + Math.sin(a) * 30 + 8); ctx.stroke(); }
      });
      break;
    case 6:
      d.clouds.forEach(c => { const x = (c.x + T0 * c.v) % 480 - 40; ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.ellipse(x, c.y, c.w, 9, 0, 0, 7); ctx.fill(); });
      d.peaks.forEach(pk => {
        ctx.fillStyle = pk.l === 0 ? mid : dark; ctx.beginPath(); ctx.moveTo(pk.x - pk.w, 510); ctx.lineTo(pk.x - pk.w * .25, 510 - pk.h * .65); ctx.lineTo(pk.x, 510 - pk.h); ctx.lineTo(pk.x + pk.w * .3, 510 - pk.h * .6); ctx.lineTo(pk.x + pk.w, 510); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(pk.x, 510 - pk.h); ctx.lineTo(pk.x - pk.w * .2, 510 - pk.h * .72); ctx.lineTo(pk.x - pk.w * .08, 510 - pk.h * .78); ctx.lineTo(pk.x, 510 - pk.h * .7); ctx.lineTo(pk.x + pk.w * .1, 510 - pk.h * .76); ctx.lineTo(pk.x + pk.w * .22, 510 - pk.h * .68); ctx.closePath(); ctx.fill();
      });
      ctx.fillStyle = dark; ctx.fillRect(0, 510, W, 52);
      break;
    case 7:
      ctx.fillStyle = dark; ctx.fillRect(0, 510, W, 52);
      d.tents.forEach(t => {
        ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(t.x - t.w / 2, 510); ctx.lineTo(t.x, 510 - t.h); ctx.lineTo(t.x + t.w / 2, 510); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rim; ctx.stroke();
        ctx.fillStyle = t.c ? rgb(cur.a, .5) : 'rgba(255,120,170,.5)';
        for (let k = 0; k < 4; k += 2) { ctx.beginPath(); ctx.moveTo(t.x, 510 - t.h); ctx.lineTo(t.x - t.w / 2 + k * t.w / 4, 510); ctx.lineTo(t.x - t.w / 2 + (k + 1) * t.w / 4, 510); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = lit; circ(t.x, 506 - t.h, 3);
      });
      ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 400); ctx.quadraticCurveTo(W / 2, 450, W, 400); ctx.stroke();
      for (let i = 0; i <= 15; i++) {
        const t = i / 15, x = t * W, y = 400 + 100 * t * (1 - t);
        ctx.fillStyle = i % 3 === 0 ? lit : i % 3 === 1 ? 'rgba(255,200,80,.75)' : 'rgba(255,120,170,.75)';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y); ctx.lineTo(x + 5, y + 12 + Math.sin(T0 * 3 + i) * 2); ctx.closePath(); ctx.fill();
      }
      break;
    case 8:
      d.fish.forEach(f => {
        const x = ((f.x + T0 * f.v) % 460 + 460) % 460 - 30, y = f.y + Math.sin(T0 + f.x) * 4;
        ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.ellipse(x, y, 9 * f.s, 4 * f.s, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - 8 * f.s, y); ctx.lineTo(x - 15 * f.s, y - 4 * f.s); ctx.lineTo(x - 15 * f.s, y + 4 * f.s); ctx.fill();
      });
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 514 + Math.sin(x * .03) * 6);
      ctx.lineTo(W, H); ctx.fill();
      d.kelp.forEach(k => { ctx.strokeStyle = 'rgba(80,220,140,.45)'; ctx.lineWidth = 4; ctx.beginPath(); for (let y = 0; y <= k.h; y += 8) ctx.lineTo(k.x + Math.sin(T0 * 1.5 + y * .08 + k.x) * 6, 518 - y); ctx.stroke(); });
      d.corals.forEach(c => {
        ctx.strokeStyle = c.t ? rgb(cur.a, .8) : 'rgba(255,120,170,.8)'; ctx.lineWidth = 4;
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(c.x, 518); ctx.quadraticCurveTo(c.x + k * 10, 518 - c.h * .6, c.x + k * 16, 518 - c.h); ctx.stroke(); }
      });
      break;
    default:
      ctx.fillStyle = mid; ctx.fillRect(0, 462, W, 70);
      for (let x = 0; x < W; x += 24) ctx.fillRect(x, 452, 14, 12);
      d.towers.forEach(t => {
        const top = 508 - t.h;
        ctx.fillStyle = dark; ctx.fillRect(t.x - t.w / 2, top, t.w, t.h + 60);
        for (let k = 0; k < 3; k++) ctx.fillRect(t.x - t.w / 2 + k * t.w / 3, top - 8, t.w / 3 - 3, 8);
        ctx.fillStyle = rgb(cur.a, .4); ctx.beginPath(); ctx.moveTo(t.x - t.w / 2 - 4, top - 8); ctx.lineTo(t.x, top - 40); ctx.lineTo(t.x + t.w / 2 + 4, top - 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = lit; ctx.fillRect(t.x - 2, top + 14, 4, 9);
        ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(t.x, top - 40); ctx.lineTo(t.x, top - 56); ctx.stroke();
        ctx.fillStyle = rgb(cur.a, .9); ctx.beginPath(); ctx.moveTo(t.x, top - 56); ctx.lineTo(t.x + 14 + Math.sin(T0 * 4 + t.x) * 3, top - 51); ctx.lineTo(t.x, top - 46); ctx.fill();
      });
      [90, 280].forEach(x => { ctx.fillStyle = 'rgba(255,170,70,' + (.6 + .3 * Math.sin(T0 * 9 + x)) + ')'; circ(x, 486, 3 + Math.sin(T0 * 7 + x)); });
      ctx.fillStyle = dark; ctx.fillRect(0, 508, W, 52);
  }
}
