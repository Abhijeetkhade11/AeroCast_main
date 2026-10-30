import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AeroCast — ML-Powered Flight Delay Intelligence',
  description:
    'AeroCast transforms real aviation and weather data into explainable flight delay intelligence for US domestic aviation.',
  keywords: ['flight delay prediction', 'aviation intelligence', 'machine learning', 'airport analytics'],
  openGraph: {
    title: 'AeroCast — Predict Delays. Understand the Skies.',
    description: 'ML-powered flight delay intelligence for US domestic aviation.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
