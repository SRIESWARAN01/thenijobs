'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Building2, Home, Store, User } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', tamil: 'முகப்பு', icon: Home },
  { href: '/jobs', label: 'Jobs', tamil: 'வேலை', icon: Briefcase },
  { href: '/businesses', label: 'Business', tamil: 'நிறுவனம்', icon: Building2 },
  { href: '/services', label: 'Services', tamil: 'சேவை', icon: Store },
  { href: '/profile', label: 'Profile', tamil: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map(({ href, tamil, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition-colors ${
                isActive ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                  isActive ? 'bg-teal-50' : 'bg-transparent'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.6 : 2} />
              </span>
              <span>{tamil}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
