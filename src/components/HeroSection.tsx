import React from 'react';
import { WaitlistUser } from '../services/waitlistService';
import { WaitlistForm } from './WaitlistForm';
import { ConfirmationDashboard } from './ConfirmationDashboard';

interface HeroSectionProps {
  user: WaitlistUser | null;
  onSubmit: (data: { email: string; firstName?: string; consent: boolean }) => Promise<void>;
  onRefreshStatus: () => Promise<void>;
  onResetSession: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
  referrerCode: string | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  user,
  onSubmit,
  onRefreshStatus,
  onResetSession,
  isLoading,
  isRefreshing,
  referrerCode,
}) => {
  return (
    <section id="hero" className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Subtle top pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2f8ff] border border-[#bfe1fd] text-[#1053ae] text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4DA3FF]"></span>
          <span>AI client-ops tool built for freelancers</span>
        </div>

        {/* Required Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
          Stop chasing your clients. <br className="hidden sm:inline" />
          <span className="text-[#4DA3FF]">Keep doing the work.</span>
        </h1>

        {/* Required One-sentence subhead */}
        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          ClientFlow handles routine client work—onboarding, questions, progress updates, reminders, delivery, and offboarding—automatically and escalates sensitive matters directly to you, so you spend more time on your craft and less time managing clients.
        </p>

        {/* Form or Confirmation Card */}
        <div className="mt-8 sm:mt-10 max-w-xl mx-auto">
          {user ? (
            <ConfirmationDashboard
              user={user}
              onRefreshStatus={onRefreshStatus}
              onResetSession={onResetSession}
              isRefreshing={isRefreshing}
            />
          ) : (
            <WaitlistForm
              onSubmit={onSubmit}
              isLoading={isLoading}
              referrerCode={referrerCode}
            />
          )}
        </div>
      </div>
    </section>
  );
};
