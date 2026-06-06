import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone } from 'lucide-react';

const socialLinks = [
  { label: 'Facebook', short: 'f', href: '#' },
  { label: 'Instagram', short: 'ig', href: '#' },
  { label: 'LinkedIn', short: 'in', href: '#' },
  { label: 'YouTube', short: 'yt', href: '#' },
];

const seekerLinks = ['Browse Jobs', 'Create Profile', 'Upload Resume', 'Job Alerts', 'Companies'];
const employerLinks = ['Post a Job', 'Register Company', 'Browse Candidates', 'Pricing Plans', 'Dashboard'];

export default function HomeFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 pb-28 pt-12 sm:px-6 md:pb-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Image src="/logo.png" alt="THENIJOBS Logo" width={128} height={32} className="h-8 w-auto object-contain" />
            </div>
            <p className="mb-4 text-sm font-semibold leading-6 text-slate-500">
              Search, connect, hire and grow. Theni jobs and business discovery platform.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs font-black uppercase text-slate-600 hover:bg-teal-50 hover:text-teal-800"
                  aria-label={item.label}
                >
                  {item.short}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black text-slate-950">For Job Seekers</h4>
            <ul className="space-y-2">
              {seekerLinks.map((link) => (
                <li key={link}>
                  <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-teal-700">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black text-slate-950">For Employers</h4>
            <ul className="space-y-2">
              {employerLinks.map((link) => (
                <li key={link}>
                  <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-teal-700">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black text-slate-950">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm font-semibold text-slate-500">
                <MapPin size={16} className="mt-0.5 shrink-0 text-teal-700" />
                Theni, Tamil Nadu, India
              </li>
              <li className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Phone size={16} className="shrink-0 text-teal-700" />
                +91 98765 43210
              </li>
              <li className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Mail size={16} className="shrink-0 text-teal-700" />
                hello@thenijobs.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 THENIJOBS. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-teal-700">Privacy</Link>
            <Link href="/terms" className="hover:text-teal-700">Terms</Link>
            <Link href="/sitemap.xml" className="hover:text-teal-700">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
