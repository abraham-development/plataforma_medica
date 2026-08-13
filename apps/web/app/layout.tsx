import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/header'

export const metadata: Metadata = {
  title: { default: 'MediCerca', template: '%s | MediCerca' },
  description: 'Consultas virtuales y atención médica a domicilio en Lima y Callao.',
}
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main>{children}</main>
        <footer className="mt-20 border-t border-slate-200 bg-white py-10">
          <div className="container-page flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:justify-between">
            <span>© 2026 MediCerca</span>
            <span>Conectamos pacientes y profesionales de salud.</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
