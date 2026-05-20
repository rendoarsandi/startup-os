// @vitest-environment jsdom
import './setupTests';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';

test('renders AI CFO Dashboard heading', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /^AI CFO$/i, level: 1 });
  expect(heading).toBeInTheDocument();
});
