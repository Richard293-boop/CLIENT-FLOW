import React from 'react';
import { Award, Check, Crown, Gift, Sparkles, Star } from 'lucide-react';
import { REWARD_TIERS } from '../utils/referral';

interface RewardsLadderSectionProps {
  userConfirmedCount?: number;
  onJoinClick: () => void;
  isRegistered?: boolean;
}

export const RewardsLadderSection: React.FC<RewardsLadderSectionProps> = ({
  userConfirmedCount = 0,
  onJoinClick,
  isRegistered,
}) => {
  const ladderTiers = [
    {
      count: '3',
      label: '3 confirmed referrals',
      badge: 'Founding Member badge + 1 month free',
      description: 'Unlock permanent Founding Member status and 1 month free when ClientFlow launches.',
      unlocked: userConfirmedCount >= 3,
      isTop: false,
    },
    {
      count: '5',
      label: '5 confirmed referrals',
      badge: '3 months free',
      description: 'Get a full quarter of automated client-ops workflows completely free.',
      unlocked: userConfirmedCount >= 5,
      isTop: false,
    },
    {
      count: '10',
      label: '10 confirmed referrals',
      badge: '6 months free + founding-member pricing locked in',
      description: 'Half a year of free service, plus permanent price-lock guaranteed for the life of your account.',
      unlocked: userConfirmedCount >= 10,
      isTop: false,
    },
    {
      count: 'Top 3',
      label: 'Top 3 on the leaderboard',
      badge: 'Lifetime access',
      description: 'Lifetime access for the lifetime of the product (limited to 3 people, subject to fair use).',
      unlocked: false,
      isTop: true,
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-semibold text-[#1469d8] uppercase tracking-wider">
            Referral Rewards
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Invite friends to move up the list.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500">
            Every fellow freelancer who confirms their email moves you closer to free months and exclusive founding perks.
          </p>
        </div>

        {/* Progress Ladder */}
        <div className="space-y-4 sm:space-y-5">
          {ladderTiers.map((tier, index) => {
            return (
              <div
                key={index}
                className={`relative rounded-2xl border p-5 sm:p-6 transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  tier.isTop
                    ? 'bg-amber-50/40 border-amber-200 shadow-2xs'
                    : tier.unlocked
                    ? 'bg-[#f2f8ff] border-[#4DA3FF] shadow-2xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Step counter pill */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      tier.isTop
                        ? 'bg-amber-500 text-white shadow-xs'
                        : tier.unlocked
                        ? 'bg-[#4DA3FF] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tier.isTop ? <Crown className="w-5 h-5" /> : tier.count}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        {tier.label}
                      </span>
                      {tier.unlocked && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 stroke-[3]" /> Unlocked
                        </span>
                      )}
                      {tier.isTop && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          Grand Prize
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                      {tier.badge}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                      {tier.description}
                    </p>
                  </div>
                </div>

                {/* Status indicator on right */}
                <div className="shrink-0 self-end sm:self-center">
                  {tier.unlocked ? (
                    <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                      Earned
                    </div>
                  ) : tier.isTop ? (
                    <div className="text-xs font-semibold text-amber-800 bg-amber-100/80 border border-amber-300 px-3 py-1.5 rounded-lg">
                      Top 3 Only
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                      {tier.count} referrals needed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footnote CTA */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 mb-3">
            Referrals are counted once the invited freelancer confirms their email address.
          </p>
          {!isRegistered && (
            <button
              onClick={onJoinClick}
              className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              Join the waitlist to get your link
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
