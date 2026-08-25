import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import '@/styles/globals.scss';
import '@/styles/phase3.scss';
import '@/styles/phase3-live.scss';

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'GSC Analyzer',
  description: 'Google Search Consoleのデータから改善機会を発見する分析ツール',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={notoSansJp.variable}>
      <body>{children}</body>
    </html>
  );
}
