import { Outlet, ScrollRestoration, createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import * as React from 'react'
import '../index.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Startup OS' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700;800&display=swap' },
      // Inject the Vite-compiled stylesheet with the correct query param that Vite needs
      { rel: 'stylesheet', href: '/@tanstack-start/styles.css?routes=__root__%2C%2F' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-[#030303] text-foreground antialiased min-h-screen">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
