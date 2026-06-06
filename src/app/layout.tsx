import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  applicationName: 'Mundial 2026',
  title: {
    default: 'Mundial 2026 — Fixture, Llave y Figuritas',
    template: '%s · Mundial 2026',
  },
  description:
    'Seguí el Mundial 2026 con horarios de Argentina, simulá la llave de los partidos y completá tu álbum de figuritas. Funciona sin conexión.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Mundial 2026' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1320' },
  ],
};

// Evita el "flash" de tema incorrecto aplicando la clase .dark antes de pintar.
const themeInit = `(function(){try{var s=localStorage.getItem('m26-preferences');var t='system';if(s){var p=JSON.parse(s);t=(p&&p.state&&p.state.theme)||'system';}var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Providers>
          <div className="pb-nav mx-auto min-h-dvh max-w-app">
            <main>{children}</main>
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
