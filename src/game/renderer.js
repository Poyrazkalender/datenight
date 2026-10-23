import { COLORS, WIDTH, HEIGHT } from './constants';

// 🖼️ Karakter Resimlerini Yükle
const blueImg = new Image();
blueImg.src = '/assets/player-blue.png';
const pinkImg = new Image();
pinkImg.src = '/assets/player-pink.png';

function roundRect(ctx, x, y, w, h, r) { /* Aynı kalacak */ 
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawBrickWall(ctx) { /* Aynı kalacak */ 
  ctx.fillStyle = COLORS.bgDark;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const bw = 80, bh = 30;
  ctx.fillStyle = COLORS.brickLight;
  ctx.strokeStyle = COLORS.bgDark;
  ctx.lineWidth = 4;
  for (let y = 0; y < HEIGHT; y += bh) {
    const offset = (Math.floor(y / bh) % 2) * (bw / 2);
    for (let x = -bw; x < WIDTH + bw; x += bw) {
      ctx.fillRect(x + offset, y, bw, bh);
      ctx.strokeRect(x + offset, y, bw, bh);
      ctx.fillStyle = COLORS.brickDark;
      ctx.fillRect(x + offset + 4, y + 4, bw - 8, bh - 8);
      ctx.fillStyle = COLORS.brickLight;
    }
  }
  ctx.lineWidth = 16; ctx.strokeStyle = '#8c5b37'; ctx.strokeRect(0, 0, WIDTH, HEIGHT);
  ctx.lineWidth = 4; ctx.strokeStyle = '#c8955b'; ctx.strokeRect(8, 8, WIDTH - 16, HEIGHT - 16);
}

function drawPlatforms(ctx, state) { /* Aynı kalacak */ 
  for (const plat of state.platforms) {
    if (plat.isGoal) continue;
    const color = COLORS[plat.color] || plat.color;
    const isFlashing = plat.flashUntil && state.time < plat.flashUntil;
    ctx.save();
    ctx.shadowColor = isFlashing ? '#ffffff' : color;
    ctx.shadowBlur = isFlashing ? 30 : 10;
    ctx.fillStyle = isFlashing ? '#ffffff' : color;
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    ctx.restore();
    if (!isFlashing) { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(plat.x, plat.y, plat.w, 3); }
    if (plat.brackets) {
      ctx.fillStyle = '#333';
      const bSpacing = plat.w / 4;
      for (let i = 1; i <= 3; i++) {
        const bx = plat.x + (bSpacing * i) - 2;
        ctx.fillRect(bx, plat.y + plat.h, 4, 8);
        ctx.beginPath(); ctx.arc(bx + 2, plat.y + plat.h + 8, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
	// drawPlatforms içine ekle:
    if (plat.isWall) {
      // Duvarların üzerine ince dikey çizgiler çiz (tuğla hissi)
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for(let i = plat.x + 10; i < plat.x + plat.w; i += 10) {
         ctx.fillRect(i, plat.y, 2, plat.h);
      }
    }
  }
}

function drawGoal(ctx, state) { /* Aynı kalacak */ 
  const goal = state.platforms.find(p => p.isGoal);
  if (!goal) return;
  const pulse = 0.5 + 0.5 * Math.sin(state.time * 4);
  const cx = goal.x + goal.w / 2; const cy = goal.y + goal.h / 2;
  const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 150 + pulse * 30);
  rad.addColorStop(0, `rgba(255, 71, 87, ${0.4 + pulse * 0.2})`);
  rad.addColorStop(1, 'rgba(255, 71, 87, 0)');
  ctx.fillStyle = rad; ctx.fillRect(cx - 200, cy - 200, 400, 400);
  ctx.fillStyle = state.levelComplete ? '#4caf50' : COLORS.goalGlow;
  ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
  ctx.fillStyle = '#333';
  ctx.fillRect(goal.x + 20, goal.y + goal.h, 4, 8);
  ctx.fillRect(goal.x + goal.w - 24, goal.y + goal.h, 4, 8);
}

// 🎨 KARAKTER ÇİZİMİ (Idle & Jump Animasyonları Eklendi)
function drawPlayers(ctx, state) {
  for (const p of state.players) {
    const img = p.color === 'platformBlue' ? blueImg : pinkImg;
    
    // 1. Yere İnme (Squash) Efekti
    const sinceLand = state.time - p.landedAt;
    const squash = sinceLand >= 0 && sinceLand < 0.15 ? Math.sin((sinceLand / 0.15) * Math.PI) * 0.2 : 0;
    let sx = 1 + squash;
    let sy = 1 - squash;

    // 2. Zıplama (Stretch) Efekti - Havaya doğru hızlıca çıkıyorsa
    const isJumping = !p.grounded && p.vy < -50;
    if (isJumping) {
      sy = 1.18; // Dikeyde lastik gibi uzasın
      sx = 0.88; // Hacmi korumak için yatayda daralsın
    }

    // 3. Nefes Alma (Idle) Efekti - Yerdeyse, duruyorsa ve zıplamıyorsa
    const isIdle = p.grounded && Math.abs(p.vx) < 10 && !isJumping && squash === 0;
    if (isIdle) {
      // Zamanla hafifçe büyüyüp küçülen bir sinüs dalgası (yavaş nefes)
      const breath = Math.sin(state.time * 4) * 0.035;
      sy = 1 + breath;
      sx = 1 - breath * 0.5; // Hacmi korumak için yatayda hafif daralma
    }
    
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Sola bakıyorsa resmi ters çevir
    if (p.facing === -1) {
      ctx.scale(-1, 1);
    }

    // Tüm esneme efektlerini uygula
    ctx.scale(sx, sy);

    if (img.complete && img.naturalHeight !== 0) {
      ctx.drawImage(img, -p.w / 2, -p.h / 2, p.w, p.h);
    } else {
      ctx.fillStyle = COLORS[p.color];
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }

    ctx.restore();
  }
}

// Editör Modu Ekstra Çizimleri
function drawEditorOverlays(ctx, state, drawStart, drawCurrent) {
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke(); }
  for (let y = 0; y < HEIGHT; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke(); }

  // 🆕 Editörde Spawn Noktalarına Karakter Resimlerini Çiz
  if (state.blueSpawn) {
    if (blueImg.complete && blueImg.naturalHeight !== 0) {
      ctx.drawImage(blueImg, state.blueSpawn.x, state.blueSpawn.y, 50, 50);
    } else {
      ctx.fillStyle = COLORS.platformBlue; ctx.fillRect(state.blueSpawn.x, state.blueSpawn.y, 50, 50);
    }
    ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('P1', state.blueSpawn.x + 4, state.blueSpawn.y - 4);
  }
  if (state.pinkSpawn) {
    if (pinkImg.complete && pinkImg.naturalHeight !== 0) {
      ctx.drawImage(pinkImg, state.pinkSpawn.x, state.pinkSpawn.y, 50, 50);
    } else {
      ctx.fillStyle = COLORS.platformPink; ctx.fillRect(state.pinkSpawn.x, state.pinkSpawn.y, 50, 50);
    }
    ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('P2', state.pinkSpawn.x + 4, state.pinkSpawn.y - 4);
  }

  if (drawStart && drawCurrent) {
    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.max(20, Math.abs(drawCurrent.x - drawStart.x));
    const h = Math.max(20, Math.abs(drawCurrent.y - drawStart.y));
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(x, y, w, h);
  }
}

export function render(ctx, state, isEditing, drawStart, drawCurrent) {
  drawBrickWall(ctx);
  drawPlatforms(ctx, state);
  drawGoal(ctx, state);
  if (!isEditing) drawPlayers(ctx, state); 
  
  if (isEditing) drawEditorOverlays(ctx, state, drawStart, drawCurrent);

  const vg = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, HEIGHT*0.4, WIDTH/2, HEIGHT/2, HEIGHT*0.9);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, WIDTH, HEIGHT);

  
}