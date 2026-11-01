import React from 'react';
import { Database, Shield } from 'lucide-react';

interface FooterProps {
  onOpenRules: () => void;
  onOpenDbGuide: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenRules, onOpenDbGuide }) => {
  return (
    <footer className="w-full bg-white border-t border-slate-100 py-12 px-4 sm:px-6 text-slate-500">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-center sm:text-left">
        {/* Left: Brand & Privacy note */}
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
            <img
              src="/assets/aistudio/clientflow_logo_clean.png"
              alt="Client's Flow"
              className="h-7 sm:h-8 w-auto object-contain"
            />
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">AI Client-Ops for Freelancers</span>
          </div>
          <p className="text-slate-400 max-w-md">
            Privacy note: We respect your inbox. No spam, no selling personal data. Unsubscribe anytime.
          </p>
        </div>

        {/* Right: Links */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-5">
          <button
            onClick={onOpenRules}
            className="text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Rules</span>
          </button>

          <button
            onClick={onOpenDbGuide}
            className="text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <Database className="w-3.5 h-3.5 text-[#4DA3FF]" />
            <span>Database Setup Guide</span>
          </button>

          <a
            href="mailto:[contact email]"
            className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            [contact email]
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-slate-100/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
        <span>© {new Date().getFullYear()} ClientFlow. All rights reserved.</span>
        <span className="mt-2 sm:mt-0">[N] spots in the first group. Opening [launch date].</span>
      </div>
    </footer>
  );
};
