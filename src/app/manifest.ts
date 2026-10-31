import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Finance — Catatan Keuangan',
    short_name: 'Finance',
    description: 'Pencatatan pemasukan, pengeluaran, dan transfer dengan saldo yang selalu akurat.',
    start_url: '/',
    display: 'standalone',
    background_color: '#08090B',
    theme_color: '#08090B',
    orientation: 'portrait',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
