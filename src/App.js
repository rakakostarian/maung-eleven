\import React from 'react';
import MaungEleven from './MaungEleven';
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <MaungEleven />
      <Analytics />
    </>
  );
}

export default App;