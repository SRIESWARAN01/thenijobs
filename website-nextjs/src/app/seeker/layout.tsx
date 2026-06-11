'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, User, FileText, Search, Bookmark,
  Bell, Calendar, Building2, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Sparkles,
  Briefcase, Send, GraduationCap
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { useNotifications } from '@/contexts/NotificationContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import type { JobSeekerProfile } from '@/lib/types';

const SEEKER_NAV = [
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்டு', icon: LayoutDashboard, href: '/seeker/dashboard' },
  { label: 'My Profile', tamilLabel: 'என் விவரம்', icon: User, href: '/seeker/profile' },
  { label: 'Resume', tamilLabel: 'ரெஸ்யூம்', icon: FileText, href: '/seeker/resume' },
  { label: 'Job Search', tamilLabel: 'வேலை தேடல்', icon: Search, href: '/jobs' },
  { label: 'Applications', tamilLabel: 'விண்ணப்பங்கள்', icon: Send, href: '/seeker/applications' },
  { label: 'Saved Jobs', tamilLabel: 'சேமித்த வேலைகள்', icon: Bookmark, href: '/seeker/saved-jobs' },
  { label: 'Job Alerts', tamilLabel: 'வேலை அலர்ட்', icon: Bell, href: '/seeker/job-alerts' },
  { label: 'Interviews', tamilLabel: 'நேர்காணல்கள்', icon: Calendar, href: '/seeker/interviews' },
  { label: 'Companies', tamilLabel: 'நிறுவனங்கள்', icon: Building2, href: '/businesses' },
  { label: 'AI Coach', tamilLabel: 'AI பயிற்சி', icon: Sparkles, href: '/seeker/ai-coach' },
  { label: 'Skill Dev', tamilLabel: 'திறன் மேம்பாடு', icon: GraduationCap, href: '/seeker/skills' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: Settings, href: '/seeker/settings' },
];

export default function SeekerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useRequireAuth(['job_seeker']);
  const { data: seekerProfile } = useDocument<JobSeekerProfile>('seekerProfiles', user?.uid);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center font-outfit">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-400">Verifying seeker access...</p>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const userInitials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email ? user.email[0].toUpperCase() : 'JS');
  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || 'Job Seeker';
  const profileStrength = Math.min(100, Math.max(0, Number(seekerProfile?.profileStrength ?? 0)));
  const isOpenToWork = seekerProfile?.isOpenToWork !== false;

  const handleHeaderSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = headerSearch.trim();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    const queryString = params.toString();
    router.push(queryString ? `/jobs?${queryString}` : '/jobs');
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[280px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-[#0d0d20]/95 backdrop-blur-xl border-r border-white/[0.06]
          flex flex-col`}
      >
        {/* Brand Header */}
        <div className={`flex items-center h-16 px-4 border-b border-white/[0.06] ${collapsed ? 'justify-center' : 'gap-3'}`}>
          {!collapsed && (
            <>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center">
                <Briefcase size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white font-outfit truncate">THENIJOBS</h2>
                <p className="text-[10px] text-emerald-400 font-medium">Job Seeker Portal</p>
              </div>
            </>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center">
              <Briefcase size={18} className="text-white" />
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Completion */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Profile Strength</span>
                <span className="text-xs font-bold text-emerald-400">{profileStrength}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${profileStrength}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar">
          {SEEKER_NAV.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/10 text-white border border-emerald-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-emerald-500 rounded-r-full" />
                )}
                <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'} />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.tamilLabel && (
                      <span className="text-[9px] text-gray-600 hidden xl:block">{item.tamilLabel}</span>
                    )}
                  </>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg
                    opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50
                    border border-white/10 shadow-xl">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="hidden lg:block px-2 py-2 border-t border-white/[0.06]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> <span>Collapse</span></>}
          </button>
        </div>

        {/* User Section */}
        <div className={`px-3 py-3 border-t border-white/[0.06] ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <button onClick={handleLogout} title="Logout" className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
              <LogOut size={18} />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{userInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{userDisplayName}</p>
                <p className={`flex items-center gap-1.5 text-[10px] ${isOpenToWork ? 'text-emerald-400' : 'text-gray-500'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isOpenToWork ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                  {isOpenToWork ? 'Open to Work' : 'Not Looking'}
                </p>
              </div>
              <button onClick={handleLogout} title="Logout" className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4 lg:px-6 gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Menu size={20} />
          </button>

          <form onSubmit={handleHeaderSearch} className="flex-1 max-w-lg relative hidden sm:block" aria-label="Search jobs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={headerSearch}
              onChange={(event) => setHeaderSearch(event.target.value)}
              placeholder="Search jobs, companies, skills..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/40 focus:bg-white/[0.06] outline-none transition-all"
            />
          </form>

          <div className="flex-1 sm:hidden" />

          <div className="flex items-center gap-2">
            <Link
              href="/jobs"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Search size={14} />
              Find Jobs
            </Link>
            <Link
              href="/jobs"
              aria-label="Search jobs"
              className="sm:hidden p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <Search size={18} />
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="fixed left-3 right-3 top-16 z-50 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d20] font-outfit shadow-[0_10px_30px_rgba(0,0,0,0.5)] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={async () => {
                          await markAllAsRead();
                          setShowNotifDropdown(false);
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04] no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-gray-500">
                        You&apos;re all caught up!
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={async () => {
                            await markAsRead(n.id);
                            setShowNotifDropdown(false);
                            if (n.actionUrl) {
                              router.push(n.actionUrl);
                            }
                          }}
                          className={`px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors ${!n.read ? 'bg-cyan-500/[0.03]' : ''}`}
                        >
                          <p className="text-xs font-bold text-white leading-tight">{n.title}</p>
                          <p className="text-[11px] text-gray-400 mt-1 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-white/[0.06] text-center bg-white/[0.01]">
                    <Link
                      href="/seeker/notifications"
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold block"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link href="/seeker/profile" aria-label="Open profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center hover:opacity-90 transition-opacity">
              <span className="text-white text-xs font-bold">{userInitials}</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
