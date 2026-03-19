import Link from 'next/link';

const links = [
  { href: '/', label: 'ホーム' },
  { href: '/recipes', label: 'レシピ' },
  { href: '/community', label: '相談ひろば' },
  { href: '/resources', label: 'お役立ち' },
  { href: '/studio', label: '投稿' },
  { href: '/account', label: 'アカウント' },
  { href: '/moderation', label: '安心サポート' },
];

export function SiteNav() {
  return (
    <header className="border-b border-white/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="font-[var(--font-display)] text-sm font-extrabold tracking-wide text-[#db7351] md:text-base">
          Baby Bites | はじめての離乳食
        </Link>
        <nav className="flex items-center gap-2 md:gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="btn-sub px-3 py-1.5 text-xs md:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
