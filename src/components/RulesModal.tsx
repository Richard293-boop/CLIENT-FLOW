import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const rules = [
    {
      title: 'Rewards apply after launch',
      text: 'All earned referral credits and badges activate once ClientFlow officially opens to the public, subject to standard fair use.',
    },
    {
      title: 'Email confirmation is required',
      text: 'An invitation is credited to your referral count only after the person you invited confirms their email address.',
    },
    {
      title: 'No fake or self-referral accounts',
      text: 'Self-referrals (using multiple addresses from the same device/browser) or fraudulent automated signups are automatically disqualified along with any perks attached to them.',
    },
    {
      title: 'Lifetime access scope',
      text: 'Lifetime access refers to the full lifetime of the ClientFlow product and is strictly limited to the top 3 verified freelancers on the leaderboard at launch.',
    },
    {
      title: 'Program flexibility',
      text: 'We aim to keep everything as straightforward as possible, but we reserve the right to modify or adjust program terms if unexpected circumstances or abuse occur.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 text-left max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-heading"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#f2f8ff] text-[#1469d8] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 id="rules-heading" className="text-lg font-bold text-slate-900">
              Waitlist & Referral Rules
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close rules"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {rules.map((rule, idx) => (
            <div key={idx} className="flex gap-3 text-left">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{rule.title}</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                  {rule.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  );
};
