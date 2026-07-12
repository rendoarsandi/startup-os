// @vitest-environment jsdom
import './setupTests';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { LandingPage } from './components/LandingPage';

test('renders Startup OS Landing Page elements', async () => {
  const { container } = render(<LandingPage />);

  // Check logo text / title
  const mainHeader = await screen.findByRole('heading', { name: /Re-engineering the/i, level: 1 });
  expect(mainHeader).toBeInTheDocument();

  // Check product roadmap header
  const roadmapHeader = await screen.findByRole('heading', { name: /Product Roadmap/i, level: 2 });
  expect(roadmapHeader).toBeInTheDocument();

  // Check coming soon badge
  const comingSoonBadge = screen.getAllByText(/Coming Soon/i);
  expect(comingSoonBadge.length).toBeGreaterThan(0);

  // Check fixed video background wrapper is rendered at root level
  const fixedVideoWrapper = container.querySelector('.fixed.inset-0.z-0.pointer-events-none');
  expect(fixedVideoWrapper).toBeInTheDocument();

  // Check that the header does not contain the fixed video container
  const header = container.querySelector('header');
  expect(header).toBeInTheDocument();
  expect(header?.querySelector('.fixed.inset-0.z-0.pointer-events-none')).toBeNull();

  // Check that main and footer have bg-transparent style instead of bg-black
  const main = container.querySelector('main');
  expect(main).toHaveClass('bg-transparent');
  expect(main).not.toHaveClass('bg-black');

  const footer = container.querySelector('footer');
  expect(footer).toHaveClass('bg-transparent');
  expect(footer).not.toHaveClass('bg-black');

  // Verify that the body overflow is overridden to auto
  expect(document.body.style.overflow).toBe('auto');
}, 30000);

