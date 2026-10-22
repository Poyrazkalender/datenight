import { useEffect, useRef, useState } from 'react';
import { WIDTH, HEIGHT } from '../game/constants';
import { createState, update, updateRemotePlayer } from '../game/engineRestart';
import { render } from '../game/renderer';
import TouchControls from './TouchControls';
// 🆕 ChannelProvider eklendi
import { useChannel, ChannelProvider } from 'ably/react'; 

export default function GameCanvas(props) {
  // Eğer oda seçilmediyse lobi kanalını kullan
  const channelName = props.roomId ? `game-room-${props.roomId}` : 'lobby-offline';

  // Dış bileşen sadece ChannelProvider'ı sağlar
  return (
    <ChannelProvider channelName={channelName}>
      <GameCanvasInner {...props} channelName={channelName} />
    </ChannelProvider>
  );
}

// İç bileşen asıl oyun mantığını barındırır
function GameCanvasInner({ isEditing, selectedTool, levelData, onLevelChange, isMobile, characters, roomId, channelName }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const keysRef = useRef({});
  const lastPublishedTime = useRef(0);
  const hasPublishedComplete = useRef(false);

  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);

  // 🆕 Diğer oyuncudan gelen mesajları dinle (Artık ChannelProvider sayesinde sorunsuz çalışacak)
    const { publish } = useChannel(channelName, (message) => {
    // 🆕 Gelen mesajları konsola yazdır
    console.log('📩 Mesaj Geldi:', message.name, message.data);

    if (isEditing || !stateRef.current) return;

    if (message.name === 'player-state') {
      const myPlayer = stateRef.current.players[0];
      if (message.data.color !== myPlayer.color) {
        updateRemotePlayer(stateRef.current, message.data);
      }
    } 
    // ... geri kalan kodlar aynı
  });

  useEffect(() => {
    stateRef.current = createState(levelData, characters);
    hasPublishedComplete.current = false;
  }, [levelData, characters]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false; 
    
    let rafId;
    let lastTime = performance.now();

    const onKeyDown = e => {
      if (isEditing) return;
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
        // 🚨 RESTART MANTIĞI
        if (state.restartRequested && state.time - state.restartTime > 0.6) {
          stateRef.current = createState(levelData, characters);
          hasPublishedComplete.current = false;
          
                  // 🆕 ABLY: Kendi pozisyonumuzu yayınla
          if (publish && roomId && time - lastPublishedTime.current > 50) {
            const myPlayer = state.players[0];
            console.log('📤 Yayınlanıyor:', myPlayer.color, myPlayer.x.toFixed(1), myPlayer.y.toFixed(1)); // 🆕 Log eklendi
            
            publish('player-state', {
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

          // 🆕 ABLY: Seviye tamamlandıysa diğer oyuncuya bildir
          if (publish && roomId && state.levelComplete && !hasPublishedComplete.current) {
            publish('game-event', { type: 'level-complete' });
            hasPublishedComplete.current = true;
          }
        }
      }
      
      const renderData = isEditing 
        ? { ...levelData, players: [], time: performance.now() / 1000, levelComplete: false } 
        : stateRef.current;
      
      render(ctx, renderData, isEditing, drawStart, drawCurrent);

      // 🚨 RESTART EKRANI
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
  }, [isEditing, levelData, drawStart, drawCurrent, characters, publish, roomId]);

  // --- Editör Fare Kontrolleri ---
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

    const newPlatform = { x, y, w, h, color: selectedTool, brackets: true };
    
    if (['platformNeutral', 'platformBlue', 'platformPink'].includes(selectedTool)) {
      newPlatform.changeable = false;
    } else if (selectedTool === 'changeable') {
      newPlatform.color = 'platformNeutral';
      newPlatform.changeable = true;
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
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ 
          border: '4px solid #111', 
          borderRadius: 8, 
          boxShadow: '0 0 30px rgba(0,0,0,0.8)',
          imageRendering: 'pixelated',
          cursor: isEditing ? 'crosshair' : 'default',
          width: '100%',
          height: 'auto',
          touchAction: 'none'
        }} 
      />
      
      {!isEditing && isMobile && <TouchControls onKeyChange={handleTouchKey} />}
    </div>
  );
}