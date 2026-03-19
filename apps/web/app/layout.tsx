import type { Metadata } from 'next';
import { Noto_Sans_JP, Sora } from 'next/font/google';
import { SiteNav } from './components/site-nav';
import './globals.css';

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
});

const notoSansJp = Noto_Sans_JP({
  variable: '--font-jp',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Baby Bites Platform',
  description: '子育て世代向け離乳食・コミュニティ・生活支援プラットフォーム',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${sora.variable} ${notoSansJp.variable}`}>
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
