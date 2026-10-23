import { useEffect, useRef, useState } from 'react';
import { WIDTH, HEIGHT } from '../game/constants';
import { createState, update, updateRemotePlayer } from '../game/engineRestart';
import { render } from '../game/renderer';
import TouchControls from './TouchControls';
import { joinRoom } from '@trystero-p2p/mqtt'; 
import { LEVELS } from '../game/levels';

// 🆕 customColor prop olarak eklendi
export default function GameCanvas({ isEditing, selectedTool, customColor, levelData, onLevelChange, isMobile, characters, roomId, currentLevelIndex, setCurrentLevelIndex, onExit }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const keysRef = useRef({});
  const lastPublishedTime = useRef(0);
  const hasPublishedComplete = useRef(false);
  const hasPublishedRestart = useRef(false); 
  const isRemoteLevelChange = useRef(false);

  const roomRef = useRef(null);
  const playerStateActionRef = useRef(null);
  const gameEventActionRef = useRef(null);
  const levelActionRef = useRef(null);

  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    stateRef.current = createState(levelData, characters);
    hasPublishedComplete.current = false;
    hasPublishedRestart.current = false;
    keysRef.current = {}; 
    setIsComplete(false);
  }, [levelData, characters]);

  useEffect(() => {
    if (!roomId || isEditing) return;

    const room = joinRoom({ appId: 'love-game' }, roomId);
    roomRef.current = room;

    const playerStateAction = room.makeAction('player-state');
    const gameEventAction = room.makeAction('game-event');
    const levelAction = room.makeAction('change-level'); 

    playerStateActionRef.current = playerStateAction;
    gameEventActionRef.current = gameEventAction;
    levelActionRef.current = levelAction;

    playerStateAction.onMessage = (data) => {
      if (!stateRef.current) return;
      updateRemotePlayer(stateRef.current, data);
    };

    gameEventAction.onMessage = (data) => {
      if (!stateRef.current) return;
      if (data.type === 'level-complete') {
        stateRef.current.levelComplete = true;
        setIsComplete(true);
      } else if (data.type === 'restart') {
        if (!stateRef.current.restartRequested) {
          stateRef.current.restartRequested = true;
          stateRef.current.restartTime = stateRef.current.time;
          setIsComplete(false);
        }
      } else if (data.type === 'exit') {
        onExit();
      } else if (data.type === 'platform-change') {
        stateRef.current.platforms[data.index].color = data.color;
      }
    };

    levelAction.onMessage = (index) => {
      if (setCurrentLevelIndex) {
        isRemoteLevelChange.current = true;
        setCurrentLevelIndex(index);
        setIsComplete(false);
      }
    };

    return () => {
      room.leave();
      roomRef.current = null;
    };
  }, [roomId, isEditing, setCurrentLevelIndex, onExit]);

  useEffect(() => {
    if (isRemoteLevelChange.current) {
      isRemoteLevelChange.current = false;
      return;
    }
    if (levelActionRef.current && roomId && !isEditing) {
      levelActionRef.current.send(currentLevelIndex);
    }
  }, [currentLevelIndex, roomId, isEditing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false; 
    
    let rafId;
    let lastTime = performance.now();

    const onKeyDown = e => {
      if (isEditing || isComplete) return;
      keysRef.current[e.code] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
    };
    const onKeyUp = e => { keysRef.current[e.code] = false; };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const loop = time => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      
      const state = stateRef.current;

      if (!isEditing) {
        update(state, keysRef.current, dt);

        if (state.levelComplete && !isComplete) {
          setIsComplete(true);
        }

        if (state.restartRequested) {
          if (!hasPublishedRestart.current) {
            hasPublishedRestart.current = true;
            if (gameEventActionRef.current) gameEventActionRef.current.send({ type: 'restart' });
          }

          if (state.time - state.restartTime > 0.6) {
            stateRef.current = createState(levelData, characters);
            hasPublishedComplete.current = false;
            hasPublishedRestart.current = false; 
            keysRef.current = {}; 
          }
        } else if (!state.levelComplete) {
          if (gameEventActionRef.current && roomId && state.platformChanged) {
            gameEventActionRef.current.send({ type: 'platform-change', index: state.platformChanged.index, color: state.platformChanged.color });
            state.platformChanged = null;
          }

          if (playerStateActionRef.current && roomId && time - lastPublishedTime.current > 50) {
            const myPlayer = state.players[0];
            playerStateActionRef.current.send({
              color: myPlayer.color,
              x: myPlayer.x,
              y: myPlayer.y,
              vx: myPlayer.vx,
              vy: myPlayer.vy,
              facing: myPlayer.facing,
              grounded: myPlayer.grounded,
            });
            lastPublishedTime.current = time;
          }

          if (gameEventActionRef.current && roomId && state.levelComplete && !hasPublishedComplete.current) {
            gameEventActionRef.current.send({ type: 'level-complete' });
            hasPublishedComplete.current = true;
          }
        }
      }
      
      const renderData = isEditing 
        ? { ...levelData, players: [], time: performance.now() / 1000, levelComplete: false } 
        : stateRef.current;
      
      render(ctx, renderData, isEditing, drawStart, drawCurrent);

      if (!isEditing && state.restartRequested) {
        const progress = Math.min(1, (state.time - state.restartTime) / 0.6);
        ctx.fillStyle = `rgba(0, 0, 0, ${progress * 0.8})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        
        ctx.fillStyle = `rgba(255, 80, 80, ${progress})`;
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DÜŞTÜNÜZ!', WIDTH / 2, HEIGHT / 2 - 10);
        ctx.font = '16px monospace';
        ctx.fillStyle = `rgba(255, 255, 255, ${progress})`;
        ctx.fillText('yeniden başlıyor...', WIDTH / 2, HEIGHT / 2 + 30);
        ctx.textAlign = 'left';
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isEditing, levelData, drawStart, drawCurrent, characters, roomId, isComplete]);

  const handleNextLevel = () => {
    const nextIndex = currentLevelIndex + 1;
    if (nextIndex < LEVELS.length) {
      if (levelActionRef.current) levelActionRef.current.send(nextIndex);
      setCurrentLevelIndex(nextIndex);
    } else {
      handleExit();
    }
  };

  const handleRestartLevel = () => {
    if (gameEventActionRef.current) gameEventActionRef.current.send({ type: 'restart' });
    stateRef.current.restartRequested = true;
    stateRef.current.restartTime = stateRef.current.time;
    setIsComplete(false);
  };

  const handleExit = () => {
    if (gameEventActionRef.current) gameEventActionRef.current.send({ type: 'exit' });
    onExit();
  };

  const getGridCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / 20) * 20;
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / 20) * 20;
    return { x, y };
  };

  const onMouseDown = (e) => {
    if (!isEditing) return;
    const { x, y } = getGridCoords(e);
    if (selectedTool === 'delete') {
      const newPlatforms = levelData.platforms.filter(p => 
        !(x >= p.x - 10 && x <= p.x + p.w + 10 && y >= p.y - 10 && y <= p.y + p.h + 10)
      );
      onLevelChange({ ...levelData, platforms: newPlatforms });
      return;
    }
    if (selectedTool === 'spawnBlue' || selectedTool === 'spawnPink' || selectedTool === 'goal') {
      if (selectedTool === 'spawnBlue') onLevelChange({ ...levelData, blueSpawn: { x, y } });
      if (selectedTool === 'spawnPink') onLevelChange({ ...levelData, pinkSpawn: { x, y } });
      if (selectedTool === 'goal') {
        const newPlatforms = levelData.platforms.filter(p => !p.isGoal);
        newPlatforms.push({ x, y, w: 100, h: 20, color: 'platformNeutral', isGoal: true, brackets: true });
        onLevelChange({ ...levelData, platforms: newPlatforms });
      }
      return;
    }
    setDrawStart({ x, y });
    setDrawCurrent({ x, y });
  };

  const onMouseMove = (e) => {
    if (!isEditing || !drawStart) return;
    setDrawCurrent(getGridCoords(e));
  };

  const onMouseUp = () => {
    if (!isEditing || !drawStart || !drawCurrent) return;
    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.max(20, Math.abs(drawCurrent.x - drawStart.x));
    const h = Math.max(20, Math.abs(drawCurrent.y - drawStart.y));
    const newPlatform = { x, y, w, h, brackets: true };
    
    if (selectedTool === 'changeable') {
      newPlatform.color = 'platformNeutral'; newPlatform.changeable = true; newPlatform.isWall = false;
    } else if (selectedTool === 'wallChangeable') {
      newPlatform.color = 'platformNeutral'; newPlatform.changeable = true; newPlatform.isWall = true;
    } else if (selectedTool === 'platformNeutral') {
      newPlatform.color = 'platformNeutral'; newPlatform.changeable = false; newPlatform.isWall = false;
    } else if (selectedTool === 'wallNeutral') {
      newPlatform.color = 'platformNeutral'; newPlatform.changeable = false; newPlatform.isWall = true;
    } else if (selectedTool === 'platformBlue' || selectedTool === 'platformPink') {
      newPlatform.color = selectedTool; newPlatform.changeable = false; newPlatform.isWall = false;
    }

    // 🆕 DOM sorgusu yerine prop kullanılıyor
    if (newPlatform.color === 'platformNeutral') {
        newPlatform.customColor = customColor; 
    }

    onLevelChange({ ...levelData, platforms: [...levelData.platforms, newPlatform] });
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const handleTouchKey = (key, isPressed) => {
    keysRef.current[key] = isPressed;
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: WIDTH, display: 'flex', justifyContent: 'center' }}>
      <canvas 
        ref={canvasRef} 
        width={WIDTH} 
        height={HEIGHT} 
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        style={{ 
          border: '4px solid #111', borderRadius: 8, boxShadow: '0 0 30px rgba(0,0,0,0.8)',
          imageRendering: 'pixelated', cursor: isEditing ? 'crosshair' : 'default',
          width: '100%', height: 'auto', touchAction: 'none'
        }} 
      />
      
      {!isEditing && isMobile && <TouchControls onKeyChange={handleTouchKey} />}

      {isComplete && !isEditing && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 20, 0.85)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 8
        }}>
          <h1 style={{ color: '#4caf50', fontSize: 48, margin: 0, textShadow: '0 0 20px #4caf50' }}>TEBRİKLER!</h1>
          <p style={{ color: '#fff', fontSize: 20, marginTop: 10, marginBottom: 30 }}>Seviyeyi başarıyla tamamladınız.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15, width: 250 }}>
            <button onClick={handleNextLevel} style={{ padding: 15, background: '#27ae60', color: '#fff', border: 'none', borderRadius: 8, fontSize: 18, fontWeight: 'bold', cursor: 'pointer' }}>
              ⏭ SONRAKİ SEVİYE
            </button>
            <button onClick={handleRestartLevel} style={{ padding: 15, background: '#f39c12', color: '#fff', border: 'none', borderRadius: 8, fontSize: 18, fontWeight: 'bold', cursor: 'pointer' }}>
              🔄 YENİDEN OYNA
            </button>
            <button onClick={handleExit} style={{ padding: 15, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, fontSize: 18, fontWeight: 'bold', cursor: 'pointer' }}>
              🚪 ANA MENÜ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}