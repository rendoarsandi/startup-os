import { Outlet, ScrollRestoration, createRootRoute } from '@tanstack/react-router'
import { Meta, Scripts } from '@tanstack/react-start'
import * as React from 'react'
import indexCss from '../index.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Startup OS' },
    ],
    links: [
      { rel: 'stylesheet', href: indexCss },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="en" className="dark">
      <head>
        <Meta />
      </head>
      <body className="bg-[#030303] text-foreground antialiased min-h-screen">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
