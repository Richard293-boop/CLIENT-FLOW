import React, { useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { WaitlistUser } from '../services/waitlistService';
import { getTierProgress, buildReferralUrl } from '../utils/referral';

interface ConfirmationDashboardProps {
  user: WaitlistUser;
  onRefreshStatus: () => Promise<void>;
  onResetSession: () => void;
  isRefreshing: boolean;
}

export const ConfirmationDashboard: React.FC<ConfirmationDashboardProps> = ({
  user,
  onRefreshStatus,
  onResetSession,
  isRefreshing,
}) => {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const referralUrl = buildReferralUrl(
    typeof window !== 'undefined' ? window.location.origin : 'https://[site URL]',
    user.referralCode
  );

  const tierProgress = getTierProgress(user.confirmedReferrals);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      showToast('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Copied link: ' + referralUrl);
    }
  };

  const shareText = encodeURIComponent(
    'I just joined the early waitlist for ClientFlow — it handles routine client work (onboarding, questions, updates, and reminders) so freelancers can focus on real work. Join with my link:'
  );
  const encodedUrl = encodeURIComponent(referralUrl);

  const shareLinks = {
    x: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodeURIComponent(
      'ClientFlow early access for freelancers'
    )}&body=${shareText}%0A%0A${encodedUrl}`,
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 transition-all">
      {/* Toast banner */}
      {toastMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4DA3FF]/10 text-[#1469d8] text-xs font-medium mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4DA3FF]"></span>
            Waitlist Spot Reserved
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {user.firstName ? `Welcome aboard, ${user.firstName}!` : "You're on the waitlist!"}
          </h3>
          {user.email && (
            <p className="text-sm text-slate-500 mt-0.5">
              Registered as <span className="text-slate-800 font-medium">{user.email}</span>
            </p>
          )}
        </div>

        <button
          onClick={onResetSession}
          className="text-xs text-slate-400 hover:text-slate-600 self-start sm:self-center transition-colors cursor-pointer"
          title="Sign up with another email or check a different code"
        >
          Use a different email
        </button>
      </div>

      {/* Real Email Confirmation Notice */}
      {!user.isEmailConfirmed ? (
        <div className="my-5 p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-amber-900">
                Email confirmation required
              </p>
              <p className="text-xs text-amber-800/90 mt-0.5">
                We sent a confirmation email with your activation link. Your referrals and ranking activate once confirmed.
              </p>
            </div>
          </div>
          <button
            onClick={onRefreshStatus}
            disabled={isRefreshing}
            className="shrink-0 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-medium rounded-lg shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Check confirmation status
          </button>
        </div>
      ) : (
        <div className="my-5 p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs sm:text-sm text-emerald-800">
              <span className="font-semibold text-emerald-950">Waitlist spot confirmed.</span> Your
              referral link is active and confirmed friend referrals credit automatically.
            </div>
          </div>
          <button
            onClick={onRefreshStatus}
            disabled={isRefreshing}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-1 cursor-pointer"
            title="Refresh referrals count from database"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      )}

      {/* Metrics Row: Rank & Confirmed Referrals */}
      <div className="grid grid-cols-2 gap-4 my-6">
        <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 text-left">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Current Rank
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900">#{user.rank}</span>
            <span className="text-xs text-slate-400">on leaderboard</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {user.rank <= 3 ? '🎉 In a Lifetime Access spot!' : 'Invite peers to jump ahead'}
          </p>
        </div>

        <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 text-left">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Confirmed Referrals
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-[#1469d8]">
              {user.confirmedReferrals}
            </span>
            <span className="text-xs text-slate-400">peers</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {user.confirmedReferrals === 0
              ? '3 needed for 1 month free'
              : `${tierProgress.neededForNext} more to next perk`}
          </p>
        </div>
      </div>

      {/* Progress towards next reward */}
      <div className="my-6 p-4 rounded-xl border border-slate-100 bg-[#f2f8ff]/60 text-left">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
          <span>Next Milestone: {tierProgress.nextTier.title}</span>
          <span className="font-semibold text-[#1469d8]">
            {user.confirmedReferrals} / {tierProgress.nextTarget} referrals
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4DA3FF] transition-all duration-500 ease-out rounded-full"
            style={{ width: `${Math.min(100, Math.max(8, tierProgress.progressPercent))}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {tierProgress.neededForNext > 0
            ? `Get ${tierProgress.neededForNext} more confirmed friend${
                tierProgress.neededForNext === 1 ? '' : 's'
              } to unlock ${tierProgress.nextTier.title}.`
            : 'You unlocked all milestone reward tiers! Competing for Top 3 Lifetime Access!'}
        </p>
      </div>

      {/* Unique referral link with Copy button */}
      <div className="my-6 text-left">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Your Personal Referral Link
        </label>
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="w-full text-xs sm:text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:border-[#4DA3FF] select-all"
            />
          </div>
          <button
            onClick={handleCopyLink}
            aria-label="Copy personal referral link"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#4DA3FF] hover:bg-[#2a88f5] active:bg-[#1469d8] text-white text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy link'}</span>
          </button>
        </div>
      </div>

      {/* Share buttons */}
      <div className="my-6 text-left">
        <span className="block text-xs font-medium text-slate-500 mb-2">
          Share directly with other freelancers:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* WhatsApp */}
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </a>

          {/* X / Twitter */}
          <a
            href={shareLinks.x}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
          >
            <span className="font-bold text-slate-900 text-xs">𝕏</span>
            <span>Post on X</span>
          </a>

          {/* LinkedIn */}
          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>LinkedIn</span>
          </a>

          {/* Email */}
          <a
            href={shareLinks.email}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-slate-600" />
            <span>Email friend</span>
          </a>
        </div>
      </div>

      {/* Removal and Privacy note */}
      <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-left">
        Want to be removed from the waitlist? Email <a href="mailto:[contact email]" className="text-slate-600 underline">[contact email]</a> with your email or referral code and we will delete your record immediately.
      </div>
    </div>
  );
};
