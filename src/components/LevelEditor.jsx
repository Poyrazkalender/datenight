import { useState } from 'react';

export default function LevelEditor({ selectedTool, setSelectedTool, levelData, setLevelData }) {
  const [copied, setCopied] = useState(false);

  const tools = [
    { id: 'changeable', label: 'Değişken Platform', color: '#8a8aa8' },
    { id: 'platformNeutral', label: 'Sabit Nötr', color: '#e67e22' },
    { id: 'platformBlue', label: 'Sabit Mavi', color: '#00a7f8' },
    { id: 'platformPink', label: 'Sabit Pembe', color: '#e84393' },
    { id: 'goal', label: 'Hedef Koy', color: '#ff4757' },
    { id: 'spawnBlue', label: 'Mavi Spawn', color: '#00a7f8' },
    { id: 'spawnPink', label: 'Pembe Spawn', color: '#e84393' },
    { id: 'delete', label: 'Sil', color: '#ff0000' },
  ];

  const handleExport = () => {
    const json = JSON.stringify({ platforms: levelData.platforms, blueSpawn: levelData.blueSpawn, pinkSpawn: levelData.pinkSpawn }, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ width: 250, background: '#1a1a2e', padding: 20, borderRadius: 8, marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0, color: '#fff', fontSize: 16 }}>Level Editör</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
        {tools.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTool(t.id)}
            style={{
              padding: '8px 4px', fontSize: 11, cursor: 'pointer',
              background: selectedTool === t.id ? t.color : '#2a2a40',
              color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <hr style={{ borderColor: '#333', width: '100%' }} />

      <button onClick={() => setLevelData({ platforms: [], blueSpawn: { x: 100, y: 400 }, pinkSpawn: { x: 150, y: 400 } })} style={{ padding: 10, background: '#c0392b', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
        Sahneyi Temizle
      </button>

      <button onClick={handleExport} style={{ padding: 10, background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
        {copied ? 'Kopyalandı!' : 'JSON Kopyala'}
      </button>
    </div>
  );
}