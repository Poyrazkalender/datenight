import { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import LevelEditor from './components/LevelEditor';
import { LEVELS as INITIAL_LEVELS } from './game/levels';

export default function App() {
  const [screen, setScreen] = useState('menu'); 
  const [isMobile, setIsMobile] = useState(false);
  const [characters, setCharacters] = useState({ p1: 'platformBlue', p2: 'platformPink' });
  const [roomId, setRoomId] = useState('');
  
  const [selectedTool, setSelectedTool] = useState('changeable');
  const [customColor, setCustomColor] = useState('#ff5733');
  
  // 🆕 Seviyeleri State olarak tutuyoruz
  const [levelsList, setLevelsList] = useState(INITIAL_LEVELS);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [levelData, setLevelData] = useState(INITIAL_LEVELS[0]);

  useEffect(() => {
    setLevelData(levelsList[currentLevelIndex]);
  }, [currentLevelIndex, levelsList]);

  const startGame = (mobileMode) => {
    setIsMobile(mobileMode);
    if (!roomId.trim()) {
      const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
      setRoomId(randomCode);
    }
    setScreen('game');
  };

  // 🆕 Yeni Seviye Ekleme
  const handleAddNewLevel = () => {
    const newLevels = [...levelsList, JSON.parse(JSON.stringify(levelData))]; // Derin kopya
    setLevelsList(newLevels);
    setCurrentLevelIndex(newLevels.length - 1);
    alert("Seviye listeye eklendi! Kalıcı yapmak için JSON'u kopyalayıp src/game/levels.js dosyasına yapıştırın.");
  };

  const handleExportJSON = () => {
    const json = JSON.stringify({ platforms: levelData.platforms, blueSpawn: levelData.blueSpawn, pinkSpawn: levelData.pinkSpawn, backgroundImage: levelData.backgroundImage || null }, null, 2);
    navigator.clipboard.writeText(json);
  };

  // ... MENÜ EKRANI (Aynı) ...
  if (screen === 'menu') { /* ... */ }

  // ... EDİTÖR EKRANI ...
  if (screen === 'editor') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0a0a0a', minHeight: '100vh', fontFamily: 'monospace', color: '#fff', paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 15 }}>
          <h1 style={{ margin: 0, color: '#f1c40f' }}>LEVEL EDİTÖRÜ</h1>
          <select value={currentLevelIndex} onChange={(e) => setCurrentLevelIndex(Number(e.target.value))} style={{ padding: '8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 4, fontWeight: 'bold' }}>
            {levelsList.map((_, index) => <option key={index} value={index}>Seviye {index + 1}</option>)}
          </select>
          <button onClick={() => setScreen('menu')} style={{ padding: '10px 20px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>🏠 ANA MENÜ</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <GameCanvas 
            isEditing={true} selectedTool={selectedTool} customColor={customColor}
            levelData={levelData} onLevelChange={setLevelData} isMobile={false} characters={characters} 
            roomId={null} currentLevelIndex={0} setCurrentLevelIndex={() => {}} onExit={() => setScreen('menu')} 
          />
          <LevelEditor 
            selectedTool={selectedTool} setSelectedTool={setSelectedTool} 
            customColor={customColor} setCustomColor={setCustomColor} 
            levelData={levelData} setLevelData={setLevelData} 
            onAddNewLevel={handleAddNewLevel} onExportJSON={handleExportJSON} 
          />
        </div>
      </div>
    );
  }

  // ... OYUN EKRANI ...
  return (
    // Oyun ekranı aynı, sadece GameCanvas'a giden levelData vs. aynı kalacak
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0a0a0a', minHeight: '100vh', fontFamily: 'monospace', color: '#fff', paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 15, flexWrap: 'wrap', justifyContent: 'center' }}>
        <h1 style={{ margin: 0, letterSpacing: 2, color: '#e84393', textShadow: '0 0 10px #e84393' }}>LOVE GAME</h1>
        <div style={{ padding: '8px 15px', background: '#1a1a2e', borderRadius: 4, border: '1px solid #3498db', color: '#3498db', fontWeight: 'bold' }}>Oda: {roomId}</div>
        <button onClick={() => setScreen('menu')} style={{ padding: '10px 20px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>🏠 MENÜ</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        <GameCanvas 
          isEditing={false} selectedTool={selectedTool} customColor={customColor}
          levelData={levelData} onLevelChange={setLevelData} isMobile={isMobile} characters={characters} 
          roomId={roomId} currentLevelIndex={currentLevelIndex} setCurrentLevelIndex={setCurrentLevelIndex} onExit={() => setScreen('menu')} 
        />
      </div>
    </div>
  );
}