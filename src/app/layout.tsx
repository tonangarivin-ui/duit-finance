import type { Metadata, Viewport } from 'next';
import './globals.css';
import { listCategories, balances } from '@/lib/ledger';
import QuickAddButton from '@/components/QuickAddButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Finance',
  description: 'Pencatatan keuangan pribadi',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Finance' },
};

export const viewport: Viewport = {
  themeColor: '#08090B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Layout cuma chrome (nav + tombol +). Kalau belum login (halaman /login), api()
  // akan melempar redirect('/login') — di sini ditelan supaya tidak jadi loop.
  const [accounts, categories] = await Promise.all([
    balances()
      .then((rows) => rows.map((a) => ({ id: a.id, name: a.name, balance: a.balance })))
      .catch(() => []),
    listCategories()
      .then((rows) =>
        rows.map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.kind,
          color: c.color,
          icon: c.icon,
        })),
      )
      .catch(() => []),
  ]);

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* terapkan tema sebelum paint supaya tidak ada flash */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('fin.theme');if(t==='glass'){t='vanilla';localStorage.setItem('fin.theme','vanilla');}if(t==='vanilla')document.documentElement.dataset.theme='vanilla';}catch(e){}",
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col bg-bg pb-24 font-sans text-ink antialiased lg:pb-10 lg:pl-60">
        {children}
        <QuickAddButton accounts={accounts} categories={categories} />
      </body>
    </html>
  );
}
