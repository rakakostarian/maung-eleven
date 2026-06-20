import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import MaungEleven from './MaungEleven';
import RoadToGlory from './RoadToGlory';

function App() {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('maung_pendingMode') || 'classic';
    } catch(e) { return 'classic'; }
  });

  useEffect(() => {
    try { localStorage.removeItem('maung_pendingMode'); } catch(e) {}
  }, []);

  const switchToClassic = () => {
    try { localStorage.setItem('maung_lastMode', 'classic'); } catch(e) {}
    setMode('classic');
  };

  return (
    <>
      {mode === 'rtg'
        ? <RoadToGlory onSwitchMode={switchToClassic}/>
        : <MaungEleven />
      }
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default App;
