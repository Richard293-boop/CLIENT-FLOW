import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'What is ClientFlow?',
      answer:
        'ClientFlow is an AI client-ops tool built specifically for freelancers. It handles routine, administrative client interactions—like project onboarding, routine questions, status updates, file requests, reminders, and delivery handoffs—automatically. Whenever a sensitive question, scope dispute, or unusual situation arises, it escalates it to you with context so you can make the call.',
    },
    {
      question: 'When does it launch?',
      answer:
        'We are currently onboarding early users in batches. The first group opens on [launch date]. Waitlist members will receive priority access notifications based on their position in line.',
    },
    {
      question: 'Is joining free?',
      answer:
        'Yes, joining the waitlist is 100% free and requires only your email address. There is no credit card required and no obligation.',
    },
    {
      question: 'How are referrals counted?',
      answer:
        'A referral is counted when a fellow freelancer joins using your unique link and confirms their email address. This ensures that every entry on the waitlist is genuine and fair.',
    },
    {
      question: 'What does "fair use" mean?',
      answer:
        '"Fair use" simply means using ClientFlow as an individual freelancer or solopreneur for legitimate client projects. It prevents abusive automated bot spam or attempts to run a high-volume agency operation under an individual account.',
    },
    {
      question: 'Do rewards apply after launch?',
      answer:
        'Yes. All earned referral perks (including 1, 3, or 6 months of free access and locked-in founding member pricing) will be credited directly to your account as soon as ClientFlow opens to the public.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 sm:py-24 bg-white border-t border-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold text-[#1469d8] uppercase tracking-wider">
            Questions & Answers
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500">
            Everything you need to know about the waitlist and referral rewards.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200/90 rounded-xl overflow-hidden transition-all bg-white"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-slate-800 hover:text-slate-950 transition-colors cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#4DA3FF]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100/60 animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
