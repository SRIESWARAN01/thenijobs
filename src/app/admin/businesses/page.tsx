'use client';

import { useState } from 'react';
import {
  Building2, Search, ChevronDown, Eye, CheckCircle, XCircle,
  Star, Crown, MapPin, Phone, Globe, LayoutGrid, List,
  Download, BadgeCheck, Clock, Loader2
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import {
  approveCompany,
  rejectCompany,
  featureCompany,
  updateDocument,
} from '@/lib/firebase/firestoreService';

// ===== TYPES =====
interface BusinessDoc {
  id: string;
  name: string;
  category?: string;
  district?: string;
  ownerName?: string;
  phone?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  isActive?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  createdAt?: any;
  description?: string;
}

// ===== CONSTANTS =====
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  verified: { label: 'Verified', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  rejected: { label: 'Rejected', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/20' },
};

const TABS = ['All', 'Pending', 'Verified', 'Rejected', 'Featured'] as const;
const CATEGORIES = ['All Categories', 'IT & Software', 'Agriculture', 'Food & Beverage', 'Healthcare', 'Education', 'Retail', 'Construction', 'Transport', 'Manufacturing', 'Textiles'];
const DISTRICTS = ['All Districts', 'Theni', 'Madurai', 'Dindigul', 'Chennai', 'Coimbatore', 'Trichy', 'Salem'];

const INITIAL_COLORS = [
  'from-violet-500 to-indigo-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-purple-500 to-violet-500',
  'from-blue-500 to-cyan-500',
  'from-teal-500 to-emerald-500',
];

export default function BusinessesPage() {
  const { user: currentUser } = useAuth();
  const { data: businesses, loading } = useCollection<BusinessDoc>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CO';
  };

  const getInitialColor = (name?: string) => {
    const code = (name || '').charCodeAt(0) || 0;
    return INITIAL_COLORS[code % INITIAL_COLORS.length];
  };

  const filteredBusinesses = businesses.filter((biz) => {
    const matchSearch = biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (biz.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const status = biz.verificationStatus || 'pending';
    let matchTab = activeTab === 'All';
    if (activeTab === 'Featured') {
      matchTab = !!biz.isFeatured;
    } else if (activeTab === 'Verified') {
      matchTab = status === 'verified';
    } else {
      matchTab = status === activeTab.toLowerCase();
    }

    const matchCategory = categoryFilter === 'All Categories' || biz.category === categoryFilter;
    const matchDistrict = districtFilter === 'All Districts' || biz.district === districtFilter;
    
    return matchSearch && matchTab && matchCategory && matchDistrict;
  });

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveCompany(id, currentUser?.uid || 'admin');
    } catch (err) {
      console.error('Approve company error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason === null) return;
    setActionLoading(id);
    try {
      await rejectCompany(id, currentUser?.uid || 'admin', reason);
    } catch (err) {
      console.error('Reject company error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured?: boolean) => {
    setActionLoading(id);
    try {
      await featureCompany(id, !currentFeatured);
    } catch (err) {
      console.error('Feature company error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePremium = async (id: string, currentPremium?: boolean) => {
    setActionLoading(id);
    try {
      await updateDocument('companies', id, { isPremium: !currentPremium });
    } catch (err) {
      console.error('Premium toggle error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Dynamic stats
  const totalCount = businesses.length;
  const pendingCount = businesses.filter((b) => (b.verificationStatus || 'pending') === 'pending').length;
  const verifiedCount = businesses.filter((b) => b.verificationStatus === 'verified').length;
  const premiumCount = businesses.filter((b) => b.isPremium || b.isFeatured).length;

  const stats = [
    { label: 'Total Businesses', value: totalCount, icon: Building2, color: 'violet' },
    { label: 'Pending Approval', value: pendingCount, icon: Clock, color: 'amber' },
    { label: 'Verified', value: verifiedCount, icon: BadgeCheck, color: 'emerald' },
    { label: 'Premium / Featured', value: premiumCount, icon: Crown, color: 'cyan' },
  ];

  const statColorMap: Record<string, { bg: string; text: string }> = {
    violet: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Business Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage business listings, approvals, and featured status</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const colors = statColorMap[stat.color];
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4 hover:border-white/[0.15] transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Icon size={18} className={colors.text} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white font-outfit">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            {tab}
            {tab === 'Pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-gray-300 outline-none focus:border-violet-500/40 transition-all cursor-pointer"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-gray-300 outline-none focus:border-violet-500/40 transition-all cursor-pointer"
            >
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-white'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-white'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Business Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading businesses from Firestore...</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
          {filteredBusinesses.map((biz) => {
            const bizStatus = biz.verificationStatus || 'pending';
            const statusCfg = STATUS_CONFIG[bizStatus] || STATUS_CONFIG.pending;
            const initials = getInitials(biz.name);
            const initialBg = getInitialColor(biz.name);

            return (
              <div
                key={biz.id}
                className={`glass-card rounded-2xl p-5 hover:border-white/[0.15] transition-all ${bizStatus === 'pending' ? 'border-amber-500/25' : ''
                  } ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}
              >
                <div className={`flex items-start gap-4 ${viewMode === 'list' ? 'flex-1' : 'mb-4'}`}>
                  {/* Logo/Avatar */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${initialBg} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-sm font-bold">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">{biz.name}</h3>
                      {bizStatus === 'verified' && <BadgeCheck size={14} className="text-cyan-400 flex-shrink-0" />}
                      {biz.isPremium && <Crown size={14} className="text-amber-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{biz.category || 'General'} · {biz.district || 'Theni'}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Owner: {biz.ownerName || 'User'}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusCfg.bg} ${statusCfg.text} flex-shrink-0`}>
                    {statusCfg.label}
                  </span>
                </div>

                {viewMode === 'grid' && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-4">{biz.description || 'No description provided.'}</p>
                )}

                {/* Actions */}
                <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'border-t border-white/[0.06] pt-4 font-outfit' : ''}`}>
                  {actionLoading === biz.id ? (
                    <Loader2 size={16} className="text-violet-400 animate-spin mx-auto" />
                  ) : (
                    <>
                      {bizStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(biz.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(biz.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleToggleFeatured(biz.id, biz.isFeatured)}
                        className={`p-2 rounded-lg transition-all ${biz.isFeatured ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10'}`}
                        title={biz.isFeatured ? 'Remove Featured' : 'Feature Business'}
                      >
                        <Star size={15} />
                      </button>
                      <button
                        onClick={() => handleTogglePremium(biz.id, biz.isPremium)}
                        className={`p-2 rounded-lg transition-all ${biz.isPremium ? 'text-violet-400 bg-violet-500/10 hover:bg-violet-500/20' : 'text-gray-400 hover:text-violet-400 hover:bg-violet-500/10'}`}
                        title={biz.isPremium ? 'Remove Premium' : 'Make Premium'}
                      >
                        <Crown size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
            <Building2 size={28} className="text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-400">No businesses found</p>
          <p className="text-xs text-gray-600 mt-1">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  );
}
