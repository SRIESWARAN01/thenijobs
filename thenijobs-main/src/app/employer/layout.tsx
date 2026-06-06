'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, Briefcase, Users2, Calendar,
  Search, MessageSquare, BarChart3, CreditCard, Star,
  LogOut, ChevronLeft, ChevronRight, Menu, X, Bell, TrendingUp, Plus
} from 'lucide-react';

import { useRequireAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useNotifications } from '@/contexts/NotificationContext';
import MobileVerificationGate from '@/components/auth/MobileVerificationGate';

const EMPLOYER_NAV = [
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்டு', icon: LayoutDashboard, href: '/employer/dashboard' },
  { label: 'Company Profile', tamilLabel: 'நிறுவன விவரம்', icon: Building2, href: '/employer/company-profile' },
  { label: 'Jobs', tamilLabel: 'வேலைகள்', icon: Briefcase, href: '/employer/jobs' },
  { label: 'Candidates', tamilLabel: 'விண்ணப்பதாரர்கள்', icon: Users2, href: '/employer/candidates' },
  { label: 'Interviews', tamilLabel: 'நேர்காணல்கள்', icon: Calendar, href: '/employer/interviews' },
  { label: 'Talent Search', tamilLabel: 'திறமை தேடல்', icon: Search, href: '/employer/talent-search' },
  { label: 'Leads', tamilLabel: 'விசாரணைகள்', icon: TrendingUp, href: '/employer/leads' },
  { label: 'Messages', tamilLabel: 'செய்திகள்', icon: MessageSquare, href: '/employer/messages' },
  { label: 'Reports', tamilLabel: 'அறிக்கைகள்', icon: BarChart3, href: '/employer/reports' },
  { label: 'Billing', tamilLabel: 'கட்டணம்', icon: CreditCard, href: '/employer/billing' },
  { label: 'Reviews', tamilLabel: 'மதிப்புரைகள்', icon: Star, href: '/employer/reviews' },
];

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useRequireAuth(['employer', 'business_owner']);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  
  // Fetch employer's company dynamically
  const { data: companies } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies[0];

  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center font-outfit">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-400">Verifying access...</p>
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

  return (
    <MobileVerificationGate>
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-emerald-600 flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white font-outfit truncate">THENIJOBS</h2>
                <p className="text-[10px] text-cyan-400 font-medium">Employer Portal</p>
              </div>
            </>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-emerald-600 flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Action */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <Link
              href="/employer/post-job"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Post a Job
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar">
          {EMPLOYER_NAV.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-gradient-to-r from-cyan-600/20 to-emerald-600/10 text-white border border-cyan-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-cyan-500 rounded-r-full" />
                )}
                <Icon size={18} className={isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'} />
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
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.displayName ? user.displayName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'E')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.displayName || user?.email?.split('@')[0] || 'Employer'}</p>
                <p className="text-[10px] text-gray-500 truncate">{company?.name || 'No Company Profile'}</p>
              </div>
              <button onClick={handleLogout} title="Logout" className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4 lg:px-6 gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 max-w-lg relative hidden sm:block">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search jobs, candidates..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 focus:bg-white/[0.06] outline-none transition-all"
            />
          </div>

          <div className="flex-1 sm:hidden" />

          <div className="flex items-center gap-2 relative">
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
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0d0d20] border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden font-outfit">
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
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
              <span className="text-white text-xs font-bold">
                {user?.displayName ? user.displayName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'E')}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
    </MobileVerificationGate>
  );
}
