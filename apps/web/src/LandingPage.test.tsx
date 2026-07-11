// @vitest-environment jsdom
import './setupTests';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { LandingPage } from './components/LandingPage';

test('renders Startup OS Landing Page elements', async () => {
  render(<LandingPage />);

  // Check logo text / title
  const mainHeader = await screen.findByRole('heading', { name: /Re-engineering the/i, level: 1 });
  expect(mainHeader).toBeInTheDocument();

  // Check product roadmap header
  const roadmapHeader = await screen.findByRole('heading', { name: /Product Roadmap/i, level: 2 });
  expect(roadmapHeader).toBeInTheDocument();

  // Check coming soon badge
  const comingSoonBadge = screen.getAllByText(/Coming Soon/i);
  expect(comingSoonBadge.length).toBeGreaterThan(0);
});
