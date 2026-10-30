import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { RewardsLadderSection } from './components/RewardsLadderSection';
import { LeaderboardSection } from './components/LeaderboardSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { RulesModal } from './components/RulesModal';
import { DatabaseGuideModal } from './components/DatabaseGuideModal';
import {
  WaitlistUser,
  LeaderboardEntry,
  getSavedSession,
  saveSignup,
  confirmEmail,
  getUserStatus,
  getLeaderboard,
  clearSession,
} from './services/waitlistService';
import { CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<WaitlistUser | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [referrerCode, setReferrerCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isDbGuideOpen, setIsDbGuideOpen] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  useEffect(() => {
    // 1. Check existing saved user session
    const saved = getSavedSession();
    if (saved) {
      setCurrentUser(saved);
      // Fetch latest status in background
      getUserStatus(saved.referralCode)
        .then((fresh) => {
          setCurrentUser(fresh);
        })
        .catch(() => {});
    }

    // 2. Parse URL parameters for referral code or confirmation token
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        setReferrerCode(ref.toUpperCase().trim());
      }

      const confirmToken = urlParams.get('confirm');
      if (confirmToken) {
        handleConfirmToken(confirmToken.trim());
      }
    }

    // 3. Load live leaderboard
    fetchLeaderboard(saved?.referralCode);
  }, []);

  const fetchLeaderboard = async (userCode?: string) => {
    try {
      const entries = await getLeaderboard(userCode);
      setLeaderboard(entries);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    }
  };

  const handleConfirmToken = async (token: string) => {
    setIsRefreshing(true);
    try {
      const res = await confirmEmail(token);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setBanner({
          type: 'success',
          text: 'Your email has been confirmed! Your waitlist spot is active and your referral link is now live.',
        });
        await fetchLeaderboard(res.user.referralCode);

        // Remove the confirm query parameter from the URL cleanly
        if (typeof window !== 'undefined' && window.history.replaceState) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    } catch (err: any) {
      setBanner({
        type: 'error',
        text: err.message || 'The confirmation link is invalid or has expired. Please sign up again.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignup = async (data: { email: string; firstName?: string; consent: boolean }) => {
    setIsLoading(true);
    try {
      const res = await saveSignup({
        email: data.email,
        firstName: data.firstName,
        referrerCode,
        consentGiven: data.consent,
      });

      if (res.success && res.user) {
        setCurrentUser(res.user);
        await fetchLeaderboard(res.user.referralCode);

        if (res.isExisting) {
          setBanner({
            type: 'info',
            text: res.message || "You're already on the waitlist! Showing your active dashboard.",
          });
        } else {
          setBanner({
            type: 'success',
            text: 'You are on the waitlist! We sent a confirmation email to your inbox. Please click the link to confirm your spot.',
          });
        }
      }
    } catch (err: any) {
      setBanner({
        type: 'error',
        text: err.message || 'Unable to complete signup. Please try again.',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!currentUser) return;
    setIsRefreshing(true);
    try {
      const updated = await getUserStatus(currentUser.referralCode);
      setCurrentUser(updated);
      await fetchLeaderboard(updated.referralCode);
      setBanner({
        type: 'info',
        text: 'Waitlist status updated.',
      });
    } catch (err: any) {
      setBanner({
        type: 'error',
        text: err.message || 'Failed to refresh status.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetSession = () => {
    clearSession();
    setCurrentUser(null);
    setBanner({
      type: 'info',
      text: 'Session reset. You can now test or register with another email.',
    });
  };

  const scrollToHero = () => {
    const el = document.getElementById('hero');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-700 flex flex-col font-sans">
      {/* Top Banner (Success / Error / Info) */}
      {banner && (
        <aside
          aria-label="Status notifications"
          className={`text-xs sm:text-sm py-2.5 px-4 text-center flex items-center justify-center gap-2 transition-all ${
            banner.type === 'error'
              ? 'bg-rose-600 text-white'
              : banner.type === 'info'
              ? 'bg-[#1469d8] text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {banner.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{banner.text}</span>
          <button
            onClick={() => setBanner(null)}
            className="ml-3 underline opacity-80 hover:opacity-100 cursor-pointer text-xs"
          >
            Dismiss
          </button>
        </aside>
      )}

      {/* Referral Link Detection Banner (if visited with ?ref=CODE) */}
      {referrerCode && !currentUser && (
        <aside
          aria-label="Referral link notice"
          className="bg-[#f2f8ff] border-b border-[#bfe1fd] text-[#1053ae] text-xs py-2 px-4 text-center flex items-center justify-center gap-2"
        >
          <UserCheck className="w-3.5 h-3.5 text-[#4DA3FF]" />
          <span>
            You were invited with referral code <strong>{referrerCode}</strong>. Confirm your email after signup to activate rewards for both of you!
          </span>
        </aside>
      )}

      {/* 1. Navigation */}
      <Navbar onJoinClick={scrollToHero} isRegistered={!!currentUser} />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 2. Hero Section & Waitlist Form / Confirmation State */}
        <HeroSection
          user={currentUser}
          onSubmit={handleSignup}
          onRefreshStatus={handleRefreshStatus}
          onResetSession={handleResetSession}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          referrerCode={referrerCode}
        />

        {/* 3. The Problem Section */}
        <ProblemSection />

        {/* 4. How It Works Section */}
        <HowItWorksSection />

        {/* 5. Referral Rewards Progress Ladder */}
        <RewardsLadderSection
          userConfirmedCount={currentUser?.confirmedReferrals || 0}
          onJoinClick={scrollToHero}
          isRegistered={!!currentUser}
        />

        {/* 7. Leaderboard */}
        <LeaderboardSection
          entries={leaderboard}
          userRank={currentUser?.rank}
        />

        {/* 8. FAQ Section */}
        <FaqSection />
      </main>

      {/* 9. Footer */}
      <Footer
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenDbGuide={() => setIsDbGuideOpen(true)}
      />

      {/* Modals */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <DatabaseGuideModal isOpen={isDbGuideOpen} onClose={() => setIsDbGuideOpen(false)} />
    </div>
  );
}
