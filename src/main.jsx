// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import * as Ably from 'ably';
import { AblyProvider } from 'ably/react';

// Ably istemcisini bileşen dışında oluştur
const realtimeClient = new Ably.Realtime({
  authUrl: '/api/auth', // Vercel'deki token endpoint'imiz
  clientId: `player-${Math.random().toString(36).substr(2, 9)}`, // Her oyuncuya benzersiz bir ID
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AblyProvider client={realtimeClient}>
      <App />
    </AblyProvider>
  </React.StrictMode>
);