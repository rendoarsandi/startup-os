import { createFileRoute } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../App'
import * as React from 'react'

const queryClient = new QueryClient()

export const Route = createFileRoute('/app')({
  component: AppRoute,
})

function AppRoute() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}
