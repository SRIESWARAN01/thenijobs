'use client';

import { useState } from 'react';
import { Share2, CreditCard, Printer, Wallet, Check, Sparkles, X, Palette } from 'lucide-react';
import SmartIdCard, { SmartIdData } from './SmartIdCard';
import { useToast } from '@/contexts/ToastContext';
import {
  getPaletteAccent,
  normalizeSmartIdTheme,
  type SmartIdBackground,
  type SmartIdPalette,
  type SmartIdStyle,
  type SmartIdTheme,
} from '@/lib/smartId';

interface IdWidgetProps {
  type: 'job_seeker' | 'employer' | 'business_owner';
  data: SmartIdData;
  onThemeChange?: (theme: SmartIdTheme) => Promise<void> | void;
}

const PALETTES: SmartIdPalette[] = ['emerald', 'cyan', 'violet', 'amber', 'slate'];
const BACKGROUNDS: SmartIdBackground[] = ['aurora', 'carbon', 'grid', 'plain'];
const STYLES: SmartIdStyle[] = ['glass', 'solid', 'minimal'];

export default function IdWidget({ type, data, onThemeChange }: IdWidgetProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState(() => normalizeSmartIdTheme(data.theme));
  const themedData = { ...data, theme };

  // Dynamic Portfolio URL
  const portfolioUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/id/${data.id}`
    : `https://thenijobs.web.app/id/${data.id}`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${data.name}'s THENIJOBS Smart ID`,
          text: `Check out my verified professional card & portfolio!`,
          url: portfolioUrl,
        });
      } else {
        await navigator.clipboard.writeText(portfolioUrl);
        setCopied(true);
        showToast('Link copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error(err);
      showToast('Could not share. URL copied instead.', 'info');
    }
  };

  const handlePrint = () => {
    // Open print view in new window containing just the card
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up blocked. Please allow pop-ups to print.', 'warning');
      return;
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(portfolioUrl)}`;
    const formattedId = data.theniJobsId || `THJ-TN-2026-${data.id.substring(0, 6).toUpperCase()}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Smart ID Card - ${data.name}</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; }
            .card-container { display: flex; gap: 40px; }
            .card-side { width: 320px; height: 480px; border: 2px solid #ccc; border-radius: 24px; padding: 24px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
            .header { display: flex; justify-content: space-between; align-items: center; }
            .logo { font-weight: 900; font-size: 14px; letter-spacing: 0.1em; color: #7c3aed; }
            .badge { font-size: 9px; font-weight: 700; border: 1px solid #7c3aed; color: #7c3aed; padding: 2px 6px; border-radius: 100px; }
            .profile { text-align: center; margin-top: 40px; }
            .avatar { width: 96px; height: 96px; border-radius: 16px; background: #eee; margin: 0 auto 16px; display: flex; justify-content: center; align-items: center; }
            .name { font-size: 18px; font-weight: 700; text-transform: uppercase; margin: 0; }
            .title { font-size: 12px; color: #666; margin: 4px 0 0; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 12px; margin-top: 40px; background: #f9f9f9; padding: 12px; border-radius: 16px; }
            .grid-label { font-size: 8px; color: #666; font-weight: 700; text-transform: uppercase; }
            .grid-val { font-size: 12px; font-weight: 600; }
            .qr-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
            .qr-image { width: 160px; height: 160px; border: 1px solid #ddd; padding: 8px; border-radius: 12px; }
            @media print {
              .no-print { display: none; }
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="card-container">
            <!-- Front -->
            <div class="card-side">
              <div class="header">
                <span class="logo">THENIJOBS</span>
                <span class="badge">${data.isVerified ? 'VERIFIED' : 'ACTIVE'}</span>
              </div>
              <div class="profile">
                <div class="avatar">
                  ${data.photoUrl 
                    ? `<img src="${data.photoUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 14px;" />`
                    : `<span style="font-size: 24px;">👤</span>`
                  }
                </div>
                <h2 class="name">${data.name}</h2>
                <p class="title">${type === 'job_seeker' ? (data.qualification || 'Candidate') : (data.category || 'Employer')}</p>
              </div>
              <div class="grid">
                <div>
                  <div class="grid-label">THENIJOBS ID</div>
                  <div class="grid-val">${formattedId}</div>
                </div>
                <div>
                  <div class="grid-label">District</div>
                  <div class="grid-val">${data.district || 'Theni'}</div>
                </div>
              </div>
            </div>

            <!-- Back -->
            <div class="card-side" style="justify-content: center;">
              <div class="qr-container">
                <img class="qr-image" src="${qrUrl}" />
                <p style="font-size: 10px; color: #666; text-align: center; margin-top: 16px;">
                  Scan to view verified digital profile.<br/><b>${formattedId}</b>
                </p>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const updateTheme = async (next: Partial<SmartIdTheme>) => {
    const normalized = normalizeSmartIdTheme({ ...theme, ...next });
    setTheme(normalized);
    try {
      await onThemeChange?.(normalized);
    } catch (err) {
      console.error(err);
      showToast('Smart ID theme could not be saved.', 'error');
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-white/[0.06] flex flex-col md:flex-row gap-8 items-center font-outfit">
      
      {/* 3D Smart Card Section */}
      <div className="flex-shrink-0">
        <SmartIdCard type={type} data={themedData} />
      </div>

      {/* Control Actions & Features Column */}
      <div className="flex-1 space-y-6 w-full">
        <div>
          <div className="flex items-center gap-2 text-violet-400">
            <Sparkles size={18} className="animate-pulse" />
            <h3 className="text-lg font-bold font-outfit text-white">THENIJOBS Smart Digital ID</h3>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            Your dynamic professional card is loaded with a dynamic QR code pointing directly to your local online portfolio. Tap the card to rotate and view the QR code.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
            <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Dynamic QR Link</span>
            <span className="font-medium text-gray-300 mt-1 block truncate">thenijobs.com/id/...</span>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
            <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Verification Level</span>
            <span className="font-bold text-emerald-400 mt-1 block">
              {data.isVerified ? 'Gold Verified' : 'Bronze Verified'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300">
            <Palette size={14} className="text-violet-400" />
            Customize Card
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Color</div>
            <div className="flex flex-wrap gap-2">
              {PALETTES.map(palette => (
                <button
                  key={palette}
                  type="button"
                  onClick={() => updateTheme({ palette, accentColor: getPaletteAccent(palette) })}
                  className={`h-8 w-8 rounded-full border transition-all ${theme.palette === palette ? 'border-white scale-110' : 'border-white/10'}`}
                  style={{ backgroundColor: getPaletteAccent(palette) }}
                  title={palette}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Background</label>
              <select
                value={theme.background}
                onChange={(e) => updateTheme({ background: e.target.value as SmartIdBackground })}
                className="search-input w-full px-3 py-2 text-xs bg-[#0e0e22]"
              >
                {BACKGROUNDS.map(background => (
                  <option key={background} value={background}>{background}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Style</label>
              <select
                value={theme.style}
                onChange={(e) => updateTheme({ style: e.target.value as SmartIdStyle })}
                className="search-input w-full px-3 py-2 text-xs bg-[#0e0e22]"
              >
                {STYLES.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button 
            onClick={() => setIsFullscreen(true)}
            className="btn-gradient py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
          >
            <CreditCard size={14} /> View Card Fullscreen
          </button>
          
          <button 
            onClick={handleShare}
            className="btn-outline-glass py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
            {copied ? 'Copied!' : 'Share Portfolio Link'}
          </button>

          <button 
            onClick={handlePrint}
            className="btn-outline-glass py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Printer size={14} /> Print Smart ID
          </button>

          <button 
            onClick={() => setShowWallet(true)}
            className="btn-outline-glass py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Wallet size={14} /> Add to Mobile Wallet
          </button>
        </div>

        {/* Action Callouts */}
        <p className="text-[10px] text-gray-500 text-center font-medium">
          Premium Physical PVC Cards available for ₹299 · Metal Cards at ₹999
        </p>
      </div>

      {/* ── WALLET MOCK POPUP ── */}
      {showWallet && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl border border-white/10 relative animate-fade-in-scale">
            <button 
              onClick={() => setShowWallet(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-violet-600/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mx-auto text-violet-400 shadow-lg glow-purple">
                <Wallet size={24} />
              </div>
              <h4 className="text-md font-bold text-white font-outfit">Add to Apple or Google Wallet</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Sync your verified Smart ID directly to your Apple Wallet or Google Wallet app. Perfect for quick NFC scanning and digital business exchanges.
              </p>
              
              <div className="space-y-2 pt-2">
                <button 
                  onClick={() => {
                    showToast('Smart ID synced with Apple Wallet!', 'success');
                    setShowWallet(false);
                  }}
                  className="w-full bg-black border border-white/10 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:bg-zinc-900 transition-colors"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Add_to_Apple_Wallet_logo.svg/320px-Add_to_Apple_Wallet_logo.svg.png" className="h-6 w-auto object-contain" alt="Add to Apple Wallet" />
                </button>
                <button 
                  onClick={() => {
                    showToast('Smart ID synced with Google Wallet!', 'success');
                    setShowWallet(false);
                  }}
                  className="w-full bg-black border border-white/10 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:bg-zinc-900 transition-colors"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Get_it_on_Google_Play_Badge.svg/320px-Get_it_on_Google_Play_Badge.svg.png" className="h-6 w-auto object-contain" alt="Add to Google Wallet" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN POPUP ── */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative animate-fade-in-scale flex flex-col items-center gap-4">
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-white/10 p-2 rounded-full border border-white/10"
            >
              <X size={20} />
            </button>
            <SmartIdCard type={type} data={themedData} className="w-80 h-[480px] shadow-2xl" />
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black text-center animate-pulse mt-2">
              Tap Card to Flip
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
