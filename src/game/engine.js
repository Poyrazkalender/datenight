import { GRAVITY, WIDTH, HEIGHT } from './constants';
import { LEVELS } from './levels';

// levelData parametresi eklendi (Editörden gelen veri)
export function createState(levelData = LEVELS[0]) {
  return {
    time: 0,
    levelComplete: false,
    completedAt: 0,
    platforms: levelData.platforms.map(p => ({ ...p })),
    blueSpawn: { ...levelData.blueSpawn },
    pinkSpawn: { ...levelData.pinkSpawn },
    players: [
      { 
        color: 'platformBlue', 
        x: levelData.blueSpawn.x, y: levelData.blueSpawn.y, w: 24, h: 24, vx: 0, vy: 0, 
        speed: 260, jumpSpeed: 720, grounded: false, 
        controls: { left: 'KeyA', right: 'KeyD', jump: 'KeyW' }, landedAt: -1 
      },
      { 
        color: 'platformPink', 
        x: levelData.pinkSpawn.x, y: levelData.pinkSpawn.y, w: 24, h: 24, vx: 0, vy: 0, 
        speed: 260, jumpSpeed: 720, grounded: false, 
        controls: { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp' }, landedAt: -1 
      }
    ],
  };
}

export function update(state, keys, dt) {
  state.time += dt;
  if (state.levelComplete) return;

  for (const p of state.players) {
    let moveX = 0;
    if (keys[p.controls.left]) moveX -= 1;
    if (keys[p.controls.right]) moveX += 1;

    const targetVX = moveX * p.speed;
    p.vx += (targetVX - p.vx) * Math.min(1, 15 * dt);

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
      const spawn = p.color === 'platformBlue' ? state.blueSpawn : state.pinkSpawn;
      p.x = spawn.x; p.y = spawn.y; p.vx = 0; p.vy = 0;
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