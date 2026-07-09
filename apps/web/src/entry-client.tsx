import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { createRouter } from './router'
import * as React from 'react'

const router = createRouter()

hydrateRoot(document.getElementById('root')!, <StartClient router={router} />)
