import React from 'react';
import { Crown, Trophy, Sparkles, Users } from 'lucide-react';
import { LeaderboardEntry } from '../services/waitlistService';

interface LeaderboardSectionProps {
  entries: LeaderboardEntry[];
  userRank?: number;
}

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
  entries,
}) => {
  const hasEntries = entries && entries.length > 0;

  return (
    <section id="leaderboard" className="py-16 sm:py-24 bg-slate-50/70 border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs font-semibold text-[#1469d8] uppercase tracking-wider">
            Early Access Rankings
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Leaderboard
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500">
            Top 10 freelancers by confirmed referrals. The top 3 win lifetime access to ClientFlow.
          </p>
        </div>

        {!hasEntries ? (
          /* Clean empty state for fresh production database */
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 sm:p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#f2f8ff] text-[#1469d8] flex items-center justify-center mx-auto mb-4 border border-[#bfe1fd]">
              <Trophy className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Top spots are open
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-5">
              Be the first to invite peers and claim a spot on the leaderboard. The top 3 win lifetime access at launch.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>3 Lifetime Access spots available</span>
            </div>
          </div>
        ) : (
          <>
            {/* Top 3 Highlight Cards */}
            {entries.length >= 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {entries.slice(0, 3).map((topEntry, idx) => {
                  const placeTitles = ['1st Place', '2nd Place', '3rd Place'];
                  const placeColors = [
                    'bg-amber-500 text-white',
                    'bg-slate-400 text-white',
                    'bg-amber-700/80 text-white',
                  ];
                  const borderColors = [
                    'border-amber-300 bg-amber-50/30',
                    'border-slate-200 bg-white',
                    'border-amber-200 bg-white',
                  ];

                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-5 text-center relative transition-all shadow-2xs ${
                        borderColors[idx]
                      } ${topEntry.isCurrentUser ? 'ring-2 ring-[#4DA3FF]' : ''}`}
                    >
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full mb-3">
                        <Crown className="w-3.5 h-3.5" />
                        <span>Lifetime Access Spot</span>
                      </div>

                      <div
                        className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-sm mb-3 ${placeColors[idx]}`}
                      >
                        #{topEntry.rank}
                      </div>

                      <h3 className="font-bold text-slate-900 text-base flex items-center justify-center gap-1.5">
                        {topEntry.displayName}
                        {topEntry.isCurrentUser && (
                          <span className="text-[10px] bg-[#4DA3FF] text-white px-1.5 py-0.5 rounded font-normal">
                            You
                          </span>
                        )}
                      </h3>

                      <p className="text-xs text-slate-400 mt-0.5">{placeTitles[idx]}</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Confirmed referrals</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {topEntry.confirmedReferrals}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table for Top 10 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Rank & Name
                </span>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Confirmed Referrals
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {entries.map((entry) => {
                  const isTop3 = entry.rank <= 3;
                  return (
                    <div
                      key={entry.rank}
                      className={`px-6 py-3.5 flex items-center justify-between transition-colors ${
                        entry.isCurrentUser
                          ? 'bg-[#f2f8ff]'
                          : isTop3
                          ? 'hover:bg-amber-50/30'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isTop3
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {entry.rank}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">
                              {entry.displayName}
                            </span>
                            {entry.isCurrentUser && (
                              <span className="text-[10px] bg-[#4DA3FF] text-white px-2 py-0.5 rounded-full font-medium">
                                You
                              </span>
                            )}
                            {isTop3 && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                Lifetime Access
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {entry.confirmedReferrals}
                        </span>
                        <span className="text-xs text-slate-400">friends</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4">
              Leaderboard updates in real-time as invited freelancers confirm their emails. Only first names or nicknames are shown to protect privacy.
            </p>
          </>
        )}
      </div>
    </section>
  );
};
