import { createFileRoute } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../App'
import * as React from 'react'

const queryClient = new QueryClient()

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}
