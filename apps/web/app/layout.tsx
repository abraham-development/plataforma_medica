import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/header'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: { default: 'MediCerca', template: '%s | MediCerca' },
  description:
    'Atención médica cercana, humana y confiable. Consultas virtuales y atención a domicilio en Lima Metropolitana.',
}
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        <Header />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
