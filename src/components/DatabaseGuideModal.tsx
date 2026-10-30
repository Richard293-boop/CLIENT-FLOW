import React, { useState } from 'react';
import { X, Database, Check, ShieldCheck, Cloud } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface DatabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseGuideModal: React.FC<DatabaseGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 text-left max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="db-heading"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 id="db-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Firebase Database Live</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Provisioned & Connected
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Project: {firebaseConfig.projectId} | Firestore DB: {firebaseConfig.firestoreDatabaseId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm text-slate-600">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-950 text-xs sm:text-sm">
                No manual setup required!
              </p>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Your Firebase Firestore database has been provisioned automatically. All signups, referral codes, and confirmed referrals are saved directly into your cloud database.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-1 text-xs sm:text-sm">Active Cloud Collections</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-mono font-semibold text-slate-900 mb-1">/waitlist_signups</div>
                <p className="text-slate-500 leading-relaxed">
                  Stores registration details, email verification status, and referral codes. Protected by Firestore security rules so emails are never publicly listable.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-mono font-semibold text-slate-900 mb-1">/public_leaderboard</div>
                <p className="text-slate-500 leading-relaxed">
                  Stores live rankings with only first names/nicknames and confirmed referral counts. Zero email or personal data is accessible here.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-1 text-xs sm:text-sm">Active Security Rules</h4>
            <p className="text-xs text-slate-500 mb-2 leading-relaxed">
              Rules defined in <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">firestore.rules</code> are actively deployed to your project to prevent unauthorized scraping and tampering.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
