/* eslint-disable import/first */
import { render, screen } from '@testing-library/react';

// Mock Vercel Analytics before importing App
jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}), { virtual: true });

// Mock Vercel Speed Insights before importing App
jest.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => null,
}), { virtual: true });

import App from './App';

test('renders Maung Eleven app', () => {
  render(<App />);
  const titleElement = screen.getByText(/maung eleven/i);
  expect(titleElement).toBeInTheDocument();
});
