import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import MaungEleven from './MaungEleven';

function App() {
  return (
    <>
      <MaungEleven />
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default App;