import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mi espacio · RutaCréditos',
  robots: { index: false, follow: true }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children
}
