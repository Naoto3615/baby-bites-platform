import type { Metadata } from 'next';
import { M_PLUS_Rounded_1c, Nunito } from 'next/font/google';
import { SiteNav } from './components/site-nav';
import './globals.css';

const nunito = Nunito({
  variable: '--font-ui-display',
  subsets: ['latin'],
  weight: ['500', '700', '800'],
});

const roundedJp = M_PLUS_Rounded_1c({
  variable: '--font-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Baby Bites Platform',
  description: '子育て世代向け離乳食・コミュニティ・生活支援プラットフォーム',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${nunito.variable} ${roundedJp.variable}`}>
      <body className="min-h-screen">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
