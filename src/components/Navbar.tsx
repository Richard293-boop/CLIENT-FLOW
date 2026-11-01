import React from 'react';

interface NavbarProps {
  onJoinClick: () => void;
  isRegistered?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onJoinClick, isRegistered }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-xs border-b border-slate-100 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center group text-decoration-none py-1">
          <img
            src="/assets/aistudio/clientflow_logo_clean.png"
            alt="Client's Flow"
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-102"
          />
        </a>

        {/* CTA Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onJoinClick}
            className="inline-flex items-center justify-center text-sm font-medium px-4 py-2 rounded-lg bg-[#4DA3FF] hover:bg-[#2a88f5] text-white transition-all shadow-xs hover:shadow focus:outline-hidden focus:ring-2 focus:ring-[#4DA3FF]/30 active:scale-98 cursor-pointer"
          >
            {isRegistered ? 'View my referral status' : 'Join the waitlist'}
          </button>
        </div>
      </div>
    </header>
  );
};
