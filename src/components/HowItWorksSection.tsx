import { Sliders, MessageSquare, AlertTriangle } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      icon: Sliders,
      title: 'Set up how you work once',
      description:
        'Outline your milestones, intake questions, delivery checkpoints, and communication rules. ClientFlow adapts to your standard operating procedure.',
    },
    {
      number: '02',
      icon: MessageSquare,
      title: 'ClientFlow handles routine conversations',
      description:
        'From onboarding questions and file collection to status check-ins, delivery handoffs, and polite reminders—routine touchpoints run automatically.',
    },
    {
      number: '03',
      icon: AlertTriangle,
      title: 'It flags anything sensitive for you to decide',
      description:
        'When scope changes, budget questions, or unusual requests arise, ClientFlow pauses and surfaces a concise decision briefing directly to you.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-slate-50/60 border-t border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-semibold text-[#1469d8] uppercase tracking-wider">
            Simple & Transparent
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How ClientFlow works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500">
            Automating the busywork while leaving you fully in control of every client relationship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 relative text-left shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#4DA3FF]/10 text-[#1469d8] flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5 stroke-[1.75]" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      Step {step.number}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight mb-2.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
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
