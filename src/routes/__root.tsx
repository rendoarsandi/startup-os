import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import '../index.css'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Startup OS | AI operations for small teams' },
      { name: 'description', content: 'Help your startup manage business records, delegate recurring checks, and review AI drafts and internal tasks.' },
      { name: 'keywords', content: 'Startup OS, Autonomous CFO, Autonomous CMO, Autonomous CHRO, AI Executive, Ledger-first business automation, fractional CFO' },
      { name: 'author', content: 'Rendo Arsandi' },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Startup OS | AI operations for small teams' },
      { property: 'og:description', content: 'AI-assisted operations with recorded business data, reviewable drafts, and internal task automation.' },
      { property: 'og:url', content: 'https://startupos.my.id' },
      { property: 'og:image', content: '/logo.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Startup OS | AI operations for small teams' },
      { name: 'twitter:description', content: 'AI-assisted operations with recorded business data, reviewable drafts, and internal task automation.' },
      { name: 'twitter:image', content: '/logo.png' },
    ],
    links: [
      { rel: 'canonical', href: 'https://startupos.my.id' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700;800&display=swap' },
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
              "description": "AI-assisted operations for founders and small startup teams.",
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
        <Scripts />
      </body>
    </html>
  )
}
