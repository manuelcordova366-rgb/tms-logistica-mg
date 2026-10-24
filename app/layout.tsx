import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Control de Flota · Logística M&G',
  description:
    'Software de monitoreo de unidades: Patio (En CD), Planeación, Supervisor (Ruta), Resumen General y Rol de Incidencias.',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#070b14',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
