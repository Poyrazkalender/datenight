import { GRAVITY, WIDTH, HEIGHT } from './constants';
import { LEVELS } from './levels';

export function createState(levelData = LEVELS[0], characters = { p1: 'platformBlue', p2: 'platformPink' }) {
  return {
    time: 0, levelComplete: false, completedAt: 0, restartRequested: false, restartTime: 0,
    platforms: levelData.platforms.map(p => ({ ...p })),
    blueSpawn: { ...levelData.blueSpawn },
    pinkSpawn: { ...levelData.pinkSpawn },
    players: [
      { color: characters.p1, x: characters.p1 === 'platformBlue' ? levelData.blueSpawn.x : levelData.pinkSpawn.x, y: characters.p1 === 'platformBlue' ? levelData.blueSpawn.y : levelData.pinkSpawn.y, w: 24, h: 24, vx: 0, vy: 0, speed: 260, jumpSpeed: 720, grounded: false, facing: 1, controls: { left: 'KeyA', right: 'KeyD', jump: 'KeyW' }, landedAt: -1 },
      { color: characters.p2, x: characters.p2 === 'platformBlue' ? levelData.blueSpawn.x : levelData.pinkSpawn.x, y: characters.p2 === 'platformBlue' ? levelData.blueSpawn.y : levelData.pinkSpawn.y, w: 24, h: 24, vx: 0, vy: 0, speed: 260, jumpSpeed: 720, grounded: false, facing: 1, controls: { left: 'None', right: 'None', jump: 'None' }, landedAt: -1 }
    ],
  };
}

export function updateRemotePlayer(state, remoteData) {
  const remotePlayer = state.players[1]; 
  if (remotePlayer) {
    remotePlayer.x += (remoteData.x - remotePlayer.x) * 0.5;
    remotePlayer.y += (remoteData.y - remotePlayer.y) * 0.5;
    remotePlayer.vx = remoteData.vx;
    remotePlayer.vy = remoteData.vy;
    remotePlayer.facing = remoteData.facing;
    remotePlayer.grounded = remoteData.grounded;
    remotePlayer.color = remoteData.color;
  }
}

// 🆕 Çarpışma Kontrolü (AABB)
function checkCollision(p, plat) {
  return (
    p.x < plat.x + plat.w &&
    p.x + p.w > plat.x &&
    p.y < plat.y + plat.h &&
    p.y + p.h > plat.y
  );
}

// 🆕 Duvardan Geçiş İzni
function canPassThrough(playerColor, plat) {
  // Nötr duvar her zaman katıdır (geçilemez)
  if (plat.color === 'platformNeutral') return false;
  
  // Renkli duvarlar, sadece kendi rengindeyse geçilebilir
  if (playerColor === plat.color) return true;
  
  return false;
}

export function update(state, keys, dt) {
  state.time += dt;
  if (state.levelComplete || state.restartRequested) return;

  const p = state.players[0]; 
  
  // --- 1. YATAY HAREKET (X Ekseni) ---
  let moveX = 0;
  if (keys[p.controls.left]) moveX -= 1;
  if (keys[p.controls.right]) moveX += 1;

  const targetVX = moveX * p.speed;
  p.vx += (targetVX - p.vx) * Math.min(1, 15 * dt);

  if (p.vx > 10) p.facing = 1;
  else if (p.vx < -10) p.facing = -1;

  p.x += p.vx * dt;

  // X Ekseni Çarpışma (Sadece Duvarlar için)
  for (const plat of state.platforms) {
    if (plat.isWall && checkCollision(p, plat) && !canPassThrough(p.color, plat)) {
      if (p.vx > 0) p.x = plat.x - p.w; // Sağdan çarptı
      else if (p.vx < 0) p.x = plat.x + plat.w; // Soldan çarptı
      p.vx = 0;
    }
  }

  // --- 2. DİKEY HAREKET (Y Ekseni) ---
  if (keys[p.controls.jump] && p.grounded) {
    p.vy = -p.jumpSpeed;
    p.grounded = false;
  }

  p.vy += GRAVITY * dt;
  const prevY = p.y;
  p.y += p.vy * dt;
  p.grounded = false;

  // Y Ekseni Çarpışma (Zeminler ve Duvarlar için)
  for (const plat of state.platforms) {
    if (checkCollision(p, plat) && !canPassThrough(p.color, plat)) {
      
      // Eğer normal platform ise, sadece yukarıdan inerken üstüne bas
      if (!plat.isWall) {
        if (p.vy >= 0 && prevY + p.h <= plat.y + 5) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
          if (plat.changeable && plat.color !== p.color) {
            plat.color = p.color;
            plat.flashUntil = state.time + 0.25;
          }
        }
      } 
      // Eğer duvar ise, her yönden çarpabilir
      else {
        if (p.vy > 0) { // Aşağı düşerken
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
          if (plat.changeable && plat.color !== p.color) {
            plat.color = p.color;
            plat.flashUntil = state.time + 0.25;
          }
        } else if (p.vy < 0) { // Yukarı zıplarken (tavana çarpma)
          p.y = plat.y + plat.h;
          p.vy = 0;
        }
      }
    }
  }

  // Ekran Sınırları
  if (p.x < 0) p.x = 0;
  if (p.x + p.w > WIDTH) p.x = WIDTH - p.w;

  if (p.y > HEIGHT + 100) {
    state.restartRequested = true;
    state.restartTime = state.time;
  }

  // Hedef Kontrolü
  const goal = state.platforms.find(p => p.isGoal);
  if (goal) {
    const bothOnGoal = state.players.every(p => 
      p.grounded && Math.abs((p.y + p.h) - goal.y) < 5 && p.x + p.w > goal.x && p.x < goal.x + goal.w
    );
    if (bothOnGoal) state.levelComplete = true;
  }
}