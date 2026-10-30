import React from 'react';
import { MessageSquareOff, FileSpreadsheet, BellRing } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const problems = [
    {
      icon: MessageSquareOff,
      title: 'Clients go quiet',
      description:
        'Projects stall in limbo waiting on feedback or sign-off, leaving your schedule and cash flow hanging in suspense.',
    },
    {
      icon: FileSpreadsheet,
      title: 'Scope drifts because nothing is written down',
      description:
        'Quick requests buried in chat messages turn into unpaid revisions and misaligned expectations.',
    },
    {
      icon: BellRing,
      title: 'Endless follow-ups for files, approvals and payments',
      description:
        'You spend hours drafting polite nudges and chasing missing assets instead of focusing on billable creative work.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 border-t border-slate-100 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-semibold text-[#1469d8] uppercase tracking-wider">
            The Freelance Reality
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Client management shouldn't eat half your workday.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500">
            Most freelance friction does not come from doing the work—it comes from the administrative chaos around it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {problems.map((prob, index) => {
            const Icon = prob.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 hover:border-slate-300 transition-all text-left flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#f2f8ff] border border-[#bfe1fd] flex items-center justify-center text-[#1469d8] mb-5">
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-2.5">
                    {prob.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {prob.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
