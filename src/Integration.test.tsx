import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { AuthPage } from './components/AuthPage'
import { http, HttpResponse } from 'msw'
import { server } from './tests/mocks/server'

test('registration signs in before opening the workspace', async () => {
  let registered = false
  server.use(http.post('*/api/auth/sign-up/email', () => { registered = true; return HttpResponse.json({ user: { id: 'new-founder' } }) }), http.post('*/api/auth/sign-in/email', () => { expect(registered).toBe(true); return HttpResponse.json({ user: { id: 'new-founder' } }) }))
  const success = vi.fn()
  render(<AuthPage onAuthSuccess={success} />)
  fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))
  fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Founder' } })
  fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'founder@test.local' } })
  fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Create Workspace' }))
  await screen.findByText('Account created successfully! Logging you in...')
  await waitFor(() => expect(success).toHaveBeenCalledTimes(1))
})
