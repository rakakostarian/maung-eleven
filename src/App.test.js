import { render, screen } from '@testing-library/react';

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
