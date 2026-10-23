import { GRAVITY, WIDTH, HEIGHT } from './constants';
import { LEVELS } from './levels';

export function createState(levelData = LEVELS[0], characters = { p1: 'platformBlue', p2: 'platformPink' }) {
  return {
    time: 0, levelComplete: false, completedAt: 0, restartRequested: false, restartTime: 0,
    platforms: levelData.platforms.map(p => ({ ...p })),
    blueSpawn: { ...levelData.blueSpawn },
    pinkSpawn: { ...levelData.pinkSpawn },
    players: [
      { color: characters.p1, x: characters.p1 === 'platformBlue' ? levelData.blueSpawn.x : levelData.pinkSpawn.x, y: characters.p1 === 'platformBlue' ? levelData.blueSpawn.y : levelData.pinkSpawn.y, w: 24, h: 24, vx: 0, vy: 0, speed: 260, jumpSpeed: 720, grounded: false, facing: 1, controls: { left: 'KeyA', right: 'KeyD', jump: 'KeyW' }, landedAt: -1, isConnected: true },
      { color: characters.p2, x: characters.p2 === 'platformBlue' ? levelData.blueSpawn.x : levelData.pinkSpawn.x, y: characters.p2 === 'platformBlue' ? levelData.blueSpawn.y : levelData.pinkSpawn.y, w: 24, h: 24, vx: 0, vy: 0, speed: 260, jumpSpeed: 720, grounded: false, facing: 1, controls: { left: 'None', right: 'None', jump: 'None' }, landedAt: -1, isConnected: false }
    ],
    platformChanged: null,
    buttonStateChanged: null, // 🆕 Buton durumu değişince ağa bildirmek için
  };
}

export function updateRemotePlayer(state, remoteData) {
  const remotePlayer = state.players[1]; 
  if (remotePlayer) {
    remotePlayer.isConnected = true;
    remotePlayer.x += (remoteData.x - remotePlayer.x) * 0.5;
    remotePlayer.y += (remoteData.y - remotePlayer.y) * 0.5;
    remotePlayer.vx = remoteData.vx;
    remotePlayer.vy = remoteData.vy;
    remotePlayer.facing = remoteData.facing;
    remotePlayer.grounded = remoteData.grounded;
    remotePlayer.color = remoteData.color;
  }
}

function checkCollision(p, plat) {
  return (
    p.x < plat.x + plat.w && p.x + p.w > plat.x &&
    p.y < plat.y + plat.h && p.y + p.h > plat.y
  );
}

function isSolid(playerColor, plat) {
  if (plat.color === 'platformNeutral') return true; 
  if (plat.color === playerColor) return true; 
  return false; 
}

function handleColorChange(plat, p, state) {
  if (plat.changeable && plat.color !== p.color) {
    plat.color = p.color;
    plat.customColor = null;
    plat.flashUntil = state.time + 0.25;
    state.platformChanged = { index: state.platforms.indexOf(plat), color: p.color };
  }
}

export function update(state, keys, dt) {
  state.time += dt;
  if (state.levelComplete || state.restartRequested) return;

  // 🆕 ZAMANLAYICI PLATFORMLAR (Timer)
  let timerStateChanged = false;
  for (const plat of state.platforms) {
    if (plat.isTimer) {
      // Her 3 saniyede bir renk değiştirir
      const cycle = Math.floor(state.time / 3) % 2; 
      const newColor = cycle === 0 ? 'platformBlue' : 'platformPink';
      if (plat.color !== newColor) {
        plat.color = newColor;
        timerStateChanged = true;
      }
    }
  }
  // Timer değişimini ağa yolla (Sadece state değiştiyse)
  if (timerStateChanged) {
    state.buttonStateChanged = { type: 'timer' }; 
  }

  // 🆕 BUTONLARI KONTROL ET
  let blueBtnPressed = false;
  let pinkBtnPressed = false;
  
  for (const p of state.players) {
    // Eğer oyuncu (veya ağdan gelen P2) butona değiyorsa
    for (const plat of state.platforms) {
      if (plat.isButtonBlue && checkCollision(p, plat)) blueBtnPressed = true;
      if (plat.isButtonPink && checkCollision(p, plat)) pinkBtnPressed = true;
    }
  }

  // Uzaktan kumandalı platformları güncelle
  let remoteChanged = false;
  for (const plat of state.platforms) {
    if (plat.isRemote) {
      let targetColor = null;
      if (blueBtnPressed) targetColor = 'platformBlue';
      if (pinkBtnPressed) targetColor = 'platformPink';
      
      if (targetColor && plat.color !== targetColor) {
        plat.color = targetColor;
        remoteChanged = true;
      }
    }
  }
  if (remoteChanged) {
    state.buttonStateChanged = { type: 'remote' };
  }

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

  for (const plat of state.platforms) {
    if (plat.isWall && !plat.isButtonBlue && !plat.isButtonPink && !plat.isRemote && isSolid(p.color, plat) && checkCollision(p, plat)) {
      if (p.vx > 0) p.x = plat.x - p.w; 
      else if (p.vx < 0) p.x = plat.x + plat.w; 
      p.vx = 0;
      handleColorChange(plat, p, state);
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

  for (const plat of state.platforms) {
    if (!plat.isButtonBlue && !plat.isButtonPink && isSolid(p.color, plat) && checkCollision(p, plat)) {
      if (plat.isWall) {
        if (p.vy > 0 && prevY + p.h <= plat.y + 10) { 
          p.y = plat.y - p.h; p.vy = 0; p.grounded = true;
          handleColorChange(plat, p, state);
        } else if (p.vy < 0 && prevY >= plat.y + plat.h - 10) { 
          p.y = plat.y + plat.h; p.vy = 0;
          handleColorChange(plat, p, state);
        }
      } else {
        if (p.vy >= 0 && prevY + p.h <= plat.y + 5) {
          p.y = plat.y - p.h; p.vy = 0; p.grounded = true;
          handleColorChange(plat, p, state);
        }
      }
    }
  }

  if (p.x < 0) p.x = 0;
  if (p.x + p.w > WIDTH) p.x = WIDTH - p.w;

  if (p.y > HEIGHT + 100) {
    state.restartRequested = true;
    state.restartTime = state.time;
  }

  const goal = state.platforms.find(p => p.isGoal);
  if (goal) {
    const bothOnGoal = state.players.every(p => 
      Math.abs((p.y + p.h) - goal.y) < 15 && 
      p.x + p.w > goal.x && p.x < goal.x + goal.w
    );
    if (bothOnGoal) state.levelComplete = true;
  }
}