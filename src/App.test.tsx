import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { AuthPage } from './components/AuthPage'
import { http, HttpResponse } from 'msw'
import { server } from './tests/mocks/server'

test('authentication errors remain visible and preserve the founders input', async () => {
  server.use(http.post('*/api/auth/sign-in/email', () => HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 })))
  const success = vi.fn()
  render(<AuthPage onAuthSuccess={success} />)
  fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'founder@test.local' } })
  fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
  fireEvent.click(screen.getAllByRole('button', { name: /^Sign In$/i }).find(button => button.closest('form'))!)
  expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('you@company.com')).toHaveValue('founder@test.local')
  expect(success).not.toHaveBeenCalled()
})
