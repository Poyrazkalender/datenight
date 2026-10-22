import React, { useRef, useState } from 'react';

export default function TouchControls({ onKeyChange }) {
  const joystickRef = useRef(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  // Joystick alanına dokunulduğunda veya sürüklendiğinde
  const handleTouch = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2 - 20; // Knob'un gidebileceği maksimum mesafe

    if (distance > maxDist) {
      dx = (dx / distance) * maxDist;
      dy = (dy / distance) * maxDist;
    }
    setKnobPos({ x: dx, y: dy });

    // Yatay eksende yön kontrolü (Ölü bölge: 10px)
    if (dx > 10) {
      onKeyChange('KeyA', false);
      onKeyChange('KeyD', true);
    } else if (dx < -10) {
      onKeyChange('KeyD', false);
      onKeyChange('KeyA', true);
    } else {
      onKeyChange('KeyA', false);
      onKeyChange('KeyD', false);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setKnobPos({ x: 0, y: 0 });
    onKeyChange('KeyA', false);
    onKeyChange('KeyD', false);
  };

  const handleJump = (isPressed) => (e) => {
    e.preventDefault();
    onKeyChange('KeyW', isPressed);
  };

  const btnStyle = {
    width: 70, height: 70, borderRadius: '50%',
    background: 'rgba(0, 167, 248, 0.4)',
    border: '3px solid rgba(255,255,255,0.6)',
    color: '#fff', fontSize: 28, fontWeight: 'bold',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    userSelect: 'none', touchAction: 'none',
    boxShadow: '0 0 15px rgba(0,167,248,0.5)'
  };

  return (
    <div style={{
      position: 'absolute', bottom: 20, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', padding: '0 30px',
      pointerEvents: 'none' // Tıklamaların canvas'a geçmesini engellemek için
    }}>
      {/* Sol Taraf: Joystick */}
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          ref={joystickRef}
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          onTouchEnd={handleTouchEnd}
          style={{
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(255,255,255,0.3)',
            position: 'relative', touchAction: 'none',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}
        >
          {/* Joystick Topuzu (Knob) */}
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
            position: 'absolute',
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: knobPos.x === 0 && knobPos.y === 0 ? 'transform 0.1s' : 'none',
            pointerEvents: 'none'
          }} />
        </div>
      </div>

      {/* Sağ Taraf: Zıplama Butonu */}
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-end', paddingBottom: 20 }}>
        <div
          style={btnStyle}
          onTouchStart={handleJump(true)}
          onTouchEnd={handleJump(false)}
        >
          ↑
        </div>
      </div>
    </div>
  );
}