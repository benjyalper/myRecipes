import Head from 'next/head';
import Link from 'next/link';
import { ReactNode } from 'react';

interface LayoutProps {
  title?: string;
  children: ReactNode;
}

/**
 * Root layout — sets <head>, renders the top nav, and wraps content.
 */
export default function Layout({ title, children }: LayoutProps) {
  const pageTitle = title ? `${title} | המתכונים שלי` : 'המתכונים שלי';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="אפליקציית המתכונים שלי — חלצו מתכונים מתמונות בקלות" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* ── Top Navigation ── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-cream-300 shadow-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            {/* Cookbook icon */}
            <span className="text-2xl" aria-hidden="true">📖</span>
            <span className="font-bold text-lg text-warm-700 group-hover:text-peach-500 transition-colors">
              המתכונים שלי
            </span>
          </Link>

          {/* Right side — could hold future nav items */}
          <div className="flex items-center gap-3 text-sm text-warm-400">
            {/* placeholder for future nav items */}
          </div>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 py-8 border-t border-cream-300 text-center text-sm text-warm-300">
        המתכונים שלי &mdash; חלצו מתכונים מתמונות
      </footer>
    </>
  );
}
