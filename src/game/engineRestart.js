import { GRAVITY, WIDTH, HEIGHT } from './constants';
import { LEVELS } from './levels';

// 🆕 characters parametresi eklendi
export function createState(levelData = LEVELS[0], characters = { p1: 'platformBlue', p2: 'platformPink' }) {
  return {
    time: 0,
    levelComplete: false,
    completedAt: 0,
    restartRequested: false,
    restartTime: 0,
    platforms: levelData.platforms.map(p => ({ ...p })),
    blueSpawn: { ...levelData.blueSpawn },
    pinkSpawn: { ...levelData.pinkSpawn },
    players: [
      { 
        color: characters.p1, // Dışarıdan gelen renk
        x: levelData.blueSpawn.x, y: levelData.blueSpawn.y, w: 50, h: 50, vx: 0, vy: 0, 
        speed: 260, jumpSpeed: 720, grounded: false, facing: 1,
        controls: { left: 'KeyA', right: 'KeyD', jump: 'KeyW' }, landedAt: -1 
      },
      { 
        color: characters.p2, // Dışarıdan gelen renk
        x: levelData.pinkSpawn.x, y: levelData.pinkSpawn.y, w: 50, h: 50, vx: 0, vy: 0, 
        speed: 260, jumpSpeed: 720, grounded: false, facing: 1,
        controls: { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp' }, landedAt: -1 
      }
    ],
  };
}

// ... (mevcut import'lar ve createState fonksiyonu aynı kalacak)

// 🆕 Diğer oyuncunun pozisyonunu güncellemek için fonksiyon
export function updateRemotePlayer(state, remoteData) {
  const remotePlayer = state.players.find(p => p.color === remoteData.color);
  if (remotePlayer) {
    // Gelen pozisyonu doğrudan ata (daha yumuşak geçiş için lerp kullanılabilir)
    remotePlayer.x = remoteData.x;
    remotePlayer.y = remoteData.y;
    remotePlayer.vx = remoteData.vx;
    remotePlayer.vy = remoteData.vy;
    remotePlayer.facing = remoteData.facing;
    remotePlayer.grounded = remoteData.grounded;
  }
}

// ... (mevcut update fonksiyonu aynı kalacak)

export function update(state, keys, dt) {
  state.time += dt;
  if (state.levelComplete || state.restartRequested) return;

  for (const p of state.players) {
    let moveX = 0;
    if (keys[p.controls.left]) moveX -= 1;
    if (keys[p.controls.right]) moveX += 1;

    const targetVX = moveX * p.speed;
    p.vx += (targetVX - p.vx) * Math.min(1, 15 * dt);

    if (p.vx > 10) p.facing = 1;
    else if (p.vx < -10) p.facing = -1;

    if (keys[p.controls.jump] && p.grounded) {
      p.vy = -p.jumpSpeed;
      p.grounded = false;
    }

    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    if (p.x < 0) { p.x = 0; p.vx = 0; }
    if (p.x + p.w > WIDTH) { p.x = WIDTH - p.w; p.vx = 0; }

    const prevBottom = p.y + p.h;
    const wasAirborne = !p.grounded;
    const prevVy = p.vy;
    p.y += p.vy * dt;
    p.grounded = false;

    if (p.vy >= 0) {
      for (const plat of state.platforms) {
        if (plat.color !== 'platformNeutral' && plat.color !== p.color) continue;
        if (p.x + p.w <= plat.x || p.x >= plat.x + plat.w) continue;
        
        const currBottom = p.y + p.h;
        if (prevBottom <= plat.y + 1 && currBottom >= plat.y) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
          if (wasAirborne && prevVy > 400) p.landedAt = state.time;
          if (plat.changeable && plat.color !== p.color) {
            plat.color = p.color;
            plat.flashUntil = state.time + 0.25;
          }
        }
      }
    }

    if (p.y > HEIGHT + 100) {
      state.restartRequested = true;
      state.restartTime = state.time;
      return;
    }
  }

  const goal = state.platforms.find(p => p.isGoal);
  if (goal) {
    const bothOnGoal = state.players.every(p =>
      p.grounded &&
      Math.abs((p.y + p.h) - goal.y) < 5 &&
      p.x + p.w > goal.x && p.x < goal.x + goal.w
    );
    if (bothOnGoal) state.levelComplete = true;
  }
}