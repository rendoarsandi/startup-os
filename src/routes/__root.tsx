import { Outlet, ScrollRestoration, createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import * as React from 'react'
import '../index.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Startup OS | Autonomous C-Suite Command Engine' },
      { name: 'description', content: 'Startup OS displaces disjointed agency services and fractional executives with a unified, autonomous network of AI C-suite agents running on real-time transaction ledgers.' },
      { name: 'keywords', content: 'Startup OS, Autonomous CFO, Autonomous CMO, Autonomous CHRO, AI Executive, Ledger-first business automation, fractional CFO' },
      { name: 'author', content: 'Rendo Arsandi' },
      { name: 'robots', content: 'index, follow' },
      { name: 'google-site-verification', content: 'YOUR_GOOGLE_VERIFICATION_TOKEN_HERE' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Startup OS | Autonomous C-Suite Command Engine' },
      { property: 'og:description', content: 'A unified network of autonomous AI C-suite agents running on real-time transaction ledgers.' },
      { property: 'og:url', content: 'https://startupos.my.id' },
      { property: 'og:image', content: '/logo.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Startup OS | Autonomous C-Suite Command Engine' },
      { name: 'twitter:description', content: 'A unified network of autonomous AI C-suite agents running on real-time transaction ledgers.' },
      { name: 'twitter:image', content: '/logo.png' },
    ],
    links: [
      { rel: 'canonical', href: 'https://startupos.my.id' },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Startup OS",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "All",
              "url": "https://startupos.my.id",
              "description": "An autonomous network of AI C-suite agents running on real-time transaction ledgers.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </head>
      <body className="bg-[#030303] text-foreground antialiased min-h-screen">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
