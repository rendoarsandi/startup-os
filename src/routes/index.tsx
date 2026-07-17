import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '../components/LandingPage'
import * as React from 'react'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return <LandingPage />
}
