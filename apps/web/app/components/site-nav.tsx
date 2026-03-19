import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/recipes', label: 'Recipes' },
  { href: '/community', label: 'Community' },
  { href: '/resources', label: 'Resources' },
  { href: '/studio', label: 'Studio' },
  { href: '/account', label: 'Account' },
  { href: '/moderation', label: 'Moderation' },
];

export function SiteNav() {
  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="text-sm font-semibold tracking-wide text-cyan-200">
          Baby Bites Platform
        </Link>
        <nav className="flex items-center gap-2 md:gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100 md:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
