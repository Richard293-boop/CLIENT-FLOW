import React, { useState } from 'react';
import { ArrowRight, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import { validateEmail } from '../utils/referral';

interface WaitlistFormProps {
  onSubmit: (data: { email: string; firstName?: string; consent: boolean }) => Promise<void>;
  isLoading: boolean;
  referrerCode: string | null;
}

export const WaitlistForm: React.FC<WaitlistFormProps> = ({
  onSubmit,
  isLoading,
  referrerCode,
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address (e.g., name@domain.com).');
      return;
    }

    if (!consent) {
      setError('Please check the box agreeing to receive launch updates.');
      return;
    }

    try {
      await onSubmit({
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        consent,
      });
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-left transition-all">
      {/* Optional referrer badge notice */}
      {referrerCode && (
        <div className="mb-5 p-3 rounded-xl bg-[#f2f8ff] border border-[#bfe1fd] flex items-center gap-2.5 text-xs text-[#1053ae]">
          <UserCheck className="w-4 h-4 text-[#4DA3FF] shrink-0" />
          <span>
            You were referred with code <strong className="font-semibold uppercase tracking-wider">{referrerCode}</strong>. Confirm your email after signup to help you both move up!
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* First name (optional) */}
        <div>
          <label htmlFor="firstName" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            First name <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Alex"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#4DA3FF] focus:ring-2 focus:ring-[#4DA3FF]/20 transition-all"
          />
        </div>

        {/* Email input */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Email address <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="alex@yourstudio.com"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#4DA3FF] focus:ring-2 focus:ring-[#4DA3FF]/20 transition-all"
          />
        </div>

        {/* Clear consent line */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (error) setError(null);
              }}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#4DA3FF] focus:ring-[#4DA3FF] cursor-pointer"
            />
            <span className="leading-snug">
              I agree to receive launch updates from ClientFlow.
            </span>
          </label>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#4DA3FF] hover:bg-[#2a88f5] active:bg-[#1469d8] text-white font-medium text-sm sm:text-base shadow-xs hover:shadow transition-all focus:outline-hidden focus:ring-2 focus:ring-[#4DA3FF]/40 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reserving your spot...</span>
              </>
            ) : (
              <>
                <span>Join the waitlist</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Required visible placeholder line */}
        <div className="pt-1 text-center">
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            [N] spots in the first group. Opening [launch date].
          </p>
        </div>
      </form>
    </div>
  );
};
