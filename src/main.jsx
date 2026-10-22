import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import * as Ably from 'ably';
import { AblyProvider } from 'ably/react';

const realtimeClient = new Ably.Realtime({
  authUrl: '/api/auth', 
  clientId: `player-${Math.random().toString(36).substr(2, 9)}`, 
});

// 🆕 Ably Bağlantı Durumunu Konsola Yazdır
realtimeClient.connection.on('connected', () => console.log('✅ Ably Bağlandı! Client ID:', realtimeClient.auth.clientId));
realtimeClient.connection.on('failed', (err) => console.error('❌ Ably Bağlantı Hatası:', err));
realtimeClient.connection.on('disconnected', () => console.warn('⚠️ Ably Bağlantısı Kesildi'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AblyProvider client={realtimeClient}>
      <App />
    </AblyProvider>
  </React.StrictMode>,
)