import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';
import '@testing-library/jest-dom';

test('renders AI CFO Dashboard heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/AI CFO Dashboard/i);
  expect(headingElement).toBeInTheDocument();
});
