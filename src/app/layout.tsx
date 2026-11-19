import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Link from 'next/link'

import InteractionMode from '@/components/InteractionMode'

import './globals.css'

const instrument = localFont({
  src: '../../public/brand/InstrumentSans.woff2',
  variable: '--font-instrument',
  weight: '400 700',
  display: 'swap'
})
const newsreader = localFont({
  src: '../../public/brand/Newsreader.woff2',
  variable: '--font-newsreader',
  weight: '200 800',
  display: 'swap'
})

const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined)
const publicUrl = configuredUrl ? new URL(configuredUrl) : undefined

export const metadata: Metadata = {
  ...(publicUrl
    ? { metadataBase: publicUrl, alternates: { canonical: '/' } }
    : {}),
  title: 'RutaCréditos · Tu próximo paso, claro.',
  description:
    'Entiende tu avance en ISIA, revisa requisitos y equivalencias ICSI y explora próximos ciclos. Gratis, sin cuenta y con datos locales.',
  icons: { icon: '/brand/favicon.svg', apple: '/brand/rc-simbolo-color.svg' },
  openGraph: {
    title: 'RutaCréditos · Tu próximo paso, claro.',
    description:
      'Tu avance, los bloqueos y tus próximos ciclos en un mismo lugar.',
    images: [
      {
        url: '/brand/og.png',
        width: 1200,
        height: 630,
        alt: 'RutaCréditos · Umbral + Dovi'
      }
    ],
    locale: 'es_PE',
    type: 'website'
  },
  twitter: { card: 'summary_large_image', images: ['/brand/og.png'] }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F6F0E6'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang='es-PE'
      className={`${instrument.variable} ${newsreader.variable}`}
    >
      <body>
        <InteractionMode />
        <Link className='skip-link' href='#main'>
          Saltar al contenido
        </Link>
        {children}
      </body>
    </html>
  )
}
