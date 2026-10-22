import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import * as Ably from 'ably';
import { AblyProvider } from 'ably/react';

// 🆕 Her oyuncu için benzersiz bir clientId oluştur
const myClientId = `player-${Math.random().toString(36).substr(2, 9)}`;

const realtimeClient = new Ably.Realtime({
  // 🆕 authUrl'e clientId parametresini ekle
  authUrl: `/api/auth?clientId=${myClientId}`, 
  clientId: myClientId, 
});

// 🆕 Bağlantı durumunu konsola yazdır
realtimeClient.connection.on('connected', () => console.log('✅ Ably Bağlandı! Client ID:', realtimeClient.auth.clientId));
realtimeClient.connection.on('failed', (err) => console.error('❌ Ably Bağlantı Hatası:', err));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AblyProvider client={realtimeClient}>
      <App />
    </AblyProvider>
  </React.StrictMode>,
)