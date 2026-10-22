import { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import LevelEditor from './components/LevelEditor';
import { LEVELS } from './game/levels';

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [isMobile, setIsMobile] = useState(false);
  const [characters, setCharacters] = useState({ p1: 'platformBlue', p2: 'platformPink' });
  const [roomId, setRoomId] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [selectedTool, setSelectedTool] = useState('changeable');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [levelData, setLevelData] = useState(LEVELS[currentLevelIndex]);

  useEffect(() => {
    setLevelData(LEVELS[currentLevelIndex]);
  }, [currentLevelIndex]);

  const handleNextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) setCurrentLevelIndex(prev => prev + 1);
    else alert("Tüm seviyeler tamamlandı! Tebrikler.");
  };

  const startGame = (mobileMode) => {
    setIsMobile(mobileMode);
    if (!roomId.trim()) {
      const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
      setRoomId(randomCode);
    }
    setScreen('game');
  };

  if (screen === 'menu') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', minHeight: '100vh', fontFamily: 'monospace', color: '#fff' }}>
        <h1 style={{ fontSize: 48, color: '#e84393', textShadow: '0 0 20px #e84393', marginBottom: 20 }}>LOVE GAME</h1>
        
        <div style={{ marginBottom: 30, textAlign: 'center' }}>
          <input 
            type="text" 
            placeholder="Oda Kodu (Örn: 1234)" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{ padding: 15, fontSize: 20, borderRadius: 8, border: '2px solid #3498db', background: '#1a1a2e', color: '#fff', textAlign: 'center', width: 250, outline: 'none' }}
          />
          <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Arkadaşınla aynı kodu girerek aynı odada buluşun.</p>
        </div>

        <div style={{ padding: 20, background: '#1a1a2e', borderRadius: 8, border: '1px solid #333', marginBottom: 30 }}>
          <h3 style={{ marginTop: 0, marginBottom: 15 }}>Karakterini Seç (Online)</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={() => setCharacters({ p1: 'platformBlue', p2: 'platformPink' })}
              style={{ padding: '15px 30px', background: characters.p1 === 'platformBlue' ? '#00a7f8' : '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
            >
              Mavi (P1)
            </button>
            <button 
              onClick={() => setCharacters({ p1: 'platformPink', p2: 'platformBlue' })}
              style={{ padding: '15px 30px', background: characters.p1 === 'platformPink' ? '#e84393' : '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
            >
              Pembe (P2)
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#888', marginTop: 15, maxWidth: 250 }}>
            *Online oynarken birbirinizle aynı rengi SEÇMEYİN.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={() => startGame(false)} style={{ padding: '20px 40px', fontSize: 24, background: '#3498db', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
            💻 Bilgisayar
          </button>
          <button onClick={() => startGame(true)} style={{ padding: '20px 40px', fontSize: 24, background: '#e84393', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
            📱 Mobil / Tablet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0a0a0a', minHeight: '100vh', fontFamily: 'monospace', color: '#fff', paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 15, flexWrap: 'wrap', justifyContent: 'center' }}>
        <h1 style={{ margin: 0, letterSpacing: 2, color: '#e84393', textShadow: '0 0 10px #e84393' }}>LOVE GAME</h1>
        
        <div style={{ padding: '8px 15px', background: '#1a1a2e', borderRadius: 4, border: '1px solid #3498db', color: '#3498db', fontWeight: 'bold' }}>
          Oda: {roomId}
        </div>

        <select value={currentLevelIndex} onChange={(e) => setCurrentLevelIndex(Number(e.target.value))} style={{ padding: '8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 4, fontWeight: 'bold' }}>
          {LEVELS.map((_, index) => <option key={index} value={index}>Seviye {index + 1}</option>)}
        </select>

        <button onClick={() => setIsEditing(!isEditing)} style={{ padding: '10px 20px', background: isEditing ? '#f1c40f' : '#3498db', color: isEditing ? '#000' : '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>
          {isEditing ? '▶ OYNA' : '🛠 EDİTÖR'}
        </button>

        {!isEditing && (
          <button onClick={handleNextLevel} style={{ padding: '10px 20px', background: '#8e44ad', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>
            ⏭ SONRAKİ SEVİYE
          </button>
        )}

        <button onClick={() => setScreen('menu')} style={{ padding: '10px 20px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>
          🏠 MENÜ
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        <GameCanvas 
          isEditing={isEditing} 
          selectedTool={selectedTool} 
          levelData={levelData} 
          onLevelChange={setLevelData} 
          isMobile={isMobile} 
          characters={characters} 
          roomId={roomId} 
        />
        
        {isEditing && (
          <LevelEditor selectedTool={selectedTool} setSelectedTool={setSelectedTool} levelData={levelData} setLevelData={setLevelData} />
        )}
      </div>

      <div style={{ marginTop: 15, color: '#888' }}>
        {isEditing ? 'Fareyle tıkla ve sürükle -> Platform çiz.' : 'Kendi karakterini hareket ettir. (PC: A / D / W)'}
      </div>
    </div>
  );
}