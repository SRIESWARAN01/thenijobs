'use client';

import { useState } from 'react';
import { ShieldCheck, MapPin, Star, Building2, User, Sparkles } from 'lucide-react';
import { normalizeSmartIdTheme, type SmartIdTheme } from '@/lib/smartId';

export interface SmartIdData {
  id: string;
  name: string;
  photoUrl?: string;
  theniJobsId?: string;
  district?: string;
  qualification?: string;
  category?: string;
  profileStrength?: number;
  isVerified?: boolean;
  isPremium?: boolean;
  rating?: number;
  foundedYear?: number;
  theme?: Partial<SmartIdTheme>;
}

interface SmartIdCardProps {
  type: 'job_seeker' | 'employer' | 'business_owner';
  data: SmartIdData;
  className?: string;
}

export default function SmartIdCard({ type, data, className = '' }: SmartIdCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Auto-generate a formatted ID if not provided
  const formattedId = data.theniJobsId || `THJ-TN-2026-${data.id.substring(0, 6).toUpperCase()}`;
  const theme = normalizeSmartIdTheme(data.theme);
  const cardStyle = {
    borderColor: `${theme.accentColor}55`,
    boxShadow: theme.style === 'minimal'
      ? `0 0 0 1px ${theme.accentColor}33`
      : `0 24px 80px ${theme.accentColor}22`,
  };
  const plainBackground = theme.background === 'plain';

  // Get dynamic portfolio URL
  const portfolioUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/id/${data.id}`
    : `https://thenijobs.web.app/id/${data.id}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(portfolioUrl)}`;

  // Determine dynamic badge level based on score/status
  const profileScore = data.profileStrength || 75;
  let verificationLevel = 'Bronze';
  let badgeColor = 'from-amber-700 to-amber-900';
  if (data.isVerified) {
    if (profileScore >= 95) {
      verificationLevel = 'Diamond';
      badgeColor = 'from-cyan-400 to-indigo-600';
    } else if (profileScore >= 85) {
      verificationLevel = 'Platinum';
      badgeColor = 'from-slate-300 to-slate-500';
    } else if (profileScore >= 70) {
      verificationLevel = 'Gold';
      badgeColor = 'from-yellow-400 to-amber-500';
    } else {
      verificationLevel = 'Silver';
      badgeColor = 'from-slate-400 to-slate-600';
    }
  }

  return (
    <div 
      onClick={() => setIsFlipped(!isFlipped)}
      className={`relative w-80 h-[480px] perspective-1000 cursor-pointer select-none group ${className}`}
    >
      <div className={`relative w-full h-full duration-700 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* ── CARD FRONT ── */}
        <div style={cardStyle} className={`absolute inset-0 w-full h-full rounded-3xl p-6 backface-hidden flex flex-col justify-between overflow-hidden border
          ${type === 'employer' 
            ? 'glass-id-card-front glass-id-card-employer' 
            : type === 'job_seeker' 
              ? 'glass-id-card-front glass-id-card-seeker' 
              : 'glass-id-card-front glass-id-card-business'
          }`}
        >
          {/* Decorative glowing blobs inside the card */}
          {!plainBackground && (
            <>
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: `${theme.accentColor}22` }} />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: `${theme.accentColor}18` }} />
            </>
          )}

          {/* Header */}
          <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs glow-purple">
                TJ
              </div>
              <span className="font-outfit font-black tracking-widest text-[11px] text-white">THENIJOBS</span>
            </div>
            {data.isVerified && (
              <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <ShieldCheck size={11} /> Verified
              </span>
            )}
          </div>

          {/* Card Body */}
          <div className="flex flex-col items-center text-center mt-4 z-10">
            {/* Avatar Container */}
            <div className="relative mb-4">
              <div className={`w-28 h-28 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr
                ${type === 'employer' 
                  ? 'from-cyan-500 to-indigo-600' 
                  : type === 'job_seeker' 
                    ? 'from-emerald-500 to-cyan-500' 
                    : 'from-amber-500 to-rose-500'
                }`}
              >
                {data.photoUrl ? (
                  <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover rounded-[14px]" />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center rounded-[14px]">
                    {type === 'employer' ? (
                      <Building2 size={36} className="text-cyan-400" />
                    ) : (
                      <User size={36} className="text-emerald-400" />
                    )}
                  </div>
                )}
              </div>
              
              {data.isPremium && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white p-1 rounded-lg shadow-lg">
                  <Star size={12} fill="white" />
                </div>
              )}
            </div>

            {/* Name & Title */}
            <h2 className="font-outfit font-bold text-lg text-white tracking-wide uppercase line-clamp-1">{data.name}</h2>
            <p className="text-[11px] text-gray-400 tracking-wider font-semibold mt-0.5 line-clamp-1">
              {type === 'job_seeker' ? (data.qualification || 'Job Seeker') : (data.category || 'Business Owner')}
            </p>
          </div>

          {/* Bottom Data Grid */}
          <div className="grid grid-cols-2 gap-3 bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl z-10 mt-2">
            <div>
              <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">THENIJOBS ID</span>
              <span className="text-xs font-semibold text-white tracking-wide font-outfit">{formattedId}</span>
            </div>
            <div>
              <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">District</span>
              <span className="text-xs font-semibold text-white flex items-center gap-0.5">
                <MapPin size={11} className="text-violet-400 shrink-0" />
                <span className="line-clamp-1">{data.district || 'Theni'}</span>
              </span>
            </div>
            {type === 'job_seeker' ? (
              <>
                <div>
                  <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">Category</span>
                  <span className="text-xs font-semibold text-white line-clamp-1">{data.category || 'General'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">Profile Score</span>
                  <span className="text-xs font-bold text-emerald-400 font-outfit">{profileScore}%</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">Rating</span>
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-0.5">
                    <Star size={11} fill="#fbbf24" className="text-amber-400" />
                    <span>{data.rating ? `${data.rating}/5` : '4.8/5'}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">Verification</span>
                  <span className={`text-[10px] font-bold bg-gradient-to-r ${badgeColor} text-white px-2 py-0.5 rounded-md text-center inline-block shadow-sm`}>
                    {verificationLevel}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Prompt to flip */}
          <div className="text-center mt-3 z-10">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black animate-pulse">Click to View QR</span>
          </div>
        </div>

        {/* ── CARD BACK ── */}
        <div style={cardStyle} className={`absolute inset-0 w-full h-full rounded-3xl p-6 backface-hidden rotate-y-180 flex flex-col justify-between overflow-hidden border
          ${type === 'employer' 
            ? 'glass-id-card-back glass-id-card-employer' 
            : type === 'job_seeker' 
              ? 'glass-id-card-back glass-id-card-seeker' 
              : 'glass-id-card-back glass-id-card-business'
          }`}
        >
          {/* Decorative glowing blobs */}
          {!plainBackground && (
            <>
              <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: `${theme.accentColor}22` }} />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: `${theme.accentColor}18` }} />
            </>
          )}

          {/* Header */}
          <div className="flex justify-between items-center z-10">
            <span className="font-outfit font-black tracking-widest text-[11px] text-white">SMART ID SYSTEM</span>
            <span className="text-[9px] font-bold text-gray-400 tracking-wider">DYNAMIC PORTFOLIO</span>
          </div>

          {/* QR Container */}
          <div className="flex flex-col items-center z-10 mt-2">
            <div className="relative bg-white/3 border border-white/10 p-4 rounded-2xl shadow-xl flex items-center justify-center glow-purple bg-gradient-to-b from-white/5 to-white/1 flex-shrink-0">
              <img 
                src={qrUrl} 
                alt="QR Code" 
                className="w-40 h-40 object-contain rounded-lg filter drop-shadow-md border border-white/10" 
              />
              <div className="absolute w-8 h-8 rounded-lg bg-indigo-950/80 backdrop-blur-sm border border-indigo-500/30 flex items-center justify-center shadow-lg">
                <Sparkles size={14} className="text-indigo-400 animate-pulse" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider text-center mt-3 max-w-[200px]">
              Scan to view my full verified profile & resume.
            </p>
          </div>

          {/* Identification Footer */}
          <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl z-10 mt-2 flex justify-between items-center">
            <div>
              <span className="text-[8px] text-gray-500 font-bold block uppercase tracking-wider">Unique Serial</span>
              <span className="text-xs font-semibold text-white tracking-widest font-outfit">{formattedId}</span>
            </div>
            <div className="text-right">
              <span className="text-[8px] text-gray-500 font-bold block uppercase tracking-wider">Platform status</span>
              <span className="text-xs font-bold text-cyan-400">ACTIVE</span>
            </div>
          </div>

          {/* Prompt to flip back */}
          <div className="text-center mt-3 z-10">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black animate-pulse">Click to View Details</span>
          </div>
        </div>

      </div>
    </div>
  );
}
