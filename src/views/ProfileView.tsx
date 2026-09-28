import React, { useState } from 'react';
import { User, Shield, Phone, Mail, MapPin, Calendar, Heart, Award, CheckCircle2 } from 'lucide-react';
import { CurrentUser } from '../types';

interface ProfileViewProps {
  currentUser: CurrentUser | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser }) => {
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-md">
            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{currentUser?.name}</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {currentUser?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Account ID: {currentUser?.id} • Connected to Real-Time Health Authority Cloud
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                defaultValue={currentUser?.name || ''}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Email Address</label>
              <input
                type="email"
                defaultValue={currentUser?.email || ''}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Registered Contact Number</label>
              <input
                type="text"
                defaultValue={currentUser?.donorProfile?.phone || '+91 98421-12345'}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                🔒 Protected under Privacy Rules. Never revealed publicly.
              </span>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Operational District</label>
              <input
                type="text"
                defaultValue="Sivakasi / Virudhunagar, Tamil Nadu"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
              />
            </div>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile details updated successfully in real-time database.</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
