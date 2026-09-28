import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Phone,
  Shield,
  Send,
  MapPin,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { BloodRequest, Donor, DonorMatch, UserRole } from '../types';
import { computeDonorMatch, findNearbyEligibleDonors } from '../services/matching';
import { db } from '../services/db';

interface MatchedDonorsListProps {
  request: BloodRequest;
  donors: Donor[];
  userRole?: UserRole;
  onDonorContacted?: (donorId: string) => void;
}

export const MatchedDonorsList: React.FC<MatchedDonorsListProps> = ({
  request,
  donors,
  userRole,
  onDonorContacted,
}) => {
  const [revealedContacts, setRevealedContacts] = useState<Record<string, boolean>>({});
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [notifiedDonors, setNotifiedDonors] = useState<Record<string, boolean>>({});
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(25);
  const [privacyWarning, setPrivacyWarning] = useState<string | null>(null);

  const matches: DonorMatch[] = findNearbyEligibleDonors(request, donors, maxRadiusKm);

  const handleRevealContact = (donorId: string) => {
    // Only authorized hospitals, blood banks or admin can reveal
    if (userRole === 'HOSPITAL' || userRole === 'BLOOD_BANK' || userRole === 'ADMIN') {
      setRevealedContacts((prev) => ({ ...prev, [donorId]: true }));
      setPrivacyWarning(null);
      db.addLog({
        actorRole: userRole,
        actorName: 'Authorized Operator',
        action: 'VERIFIED_CONTACT_ACCESS',
        details: `Authorized operator accessed verified contact channel for donor ${donorId}.`,
        level: 'INFO',
      });
    } else {
      setPrivacyWarning(
        'Secure Access Restricted: Full donor phone numbers are strictly protected under clinical privacy regulations. Sign in as an authorized Hospital or Blood Bank to access direct contact coordination.'
      );
    }
  };

  const handleSendEmergencyAlert = (match: DonorMatch) => {
    setNotifiedDonors((prev) => ({ ...prev, [match.donorId]: true }));
    // Dispatch in-app notification & accept request
    db.respondToRequest(request.id, match.donorId, 'ACCEPT');
    onDonorContacted?.(match.donorId);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-6">
      {/* Header bar with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Smart Donor Matching Engine
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Nearest First
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by multi-factor score: blood compatibility, distance, medical eligibility, and availability
          </p>
        </div>

        {/* Search radius selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Radius:</span>
          {[5, 10, 25, 50].map((km) => (
            <button
              key={km}
              onClick={() => setMaxRadiusKm(km)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                maxRadiusKm === km
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {km} km
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Warning Toast if triggered */}
      {privacyWarning && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{privacyWarning}</span>
          </div>
          <button
            onClick={() => setPrivacyWarning(null)}
            className="text-amber-700 hover:text-amber-900 font-bold px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Target Blood Request Summary Box */}
      <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
            {request.bloodGroup}
          </div>
          <div>
            <div className="font-bold text-slate-800">
              Matching for Request #{request.requestId} ({request.unitsRequired} Units Required)
            </div>
            <div className="text-slate-500 flex items-center gap-2 text-[11px]">
              <span>Facility: {request.hospitalName}</span>
              <span>•</span>
              <span>Case: {request.caseType}</span>
              <span>•</span>
              <span className="font-semibold text-rose-600">AI Urgency: {request.severityScore}/100</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-slate-700">
            {matches.length} Compatible Donors in {maxRadiusKm} km
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 px-1">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Operational prioritization mechanism only — does not replace pre-transfusion cross-matching protocols.
        </span>
      </div>

      {/* Donors List */}
      <div className="mt-4 divide-y divide-slate-100">
        {matches.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No compatible donors within {maxRadiusKm} km</p>
            <p className="text-xs text-slate-500 mt-1">Try expanding the search radius to 50 km or querying regional blood banks.</p>
            <button
              onClick={() => setMaxRadiusKm(50)}
              className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
            >
              Expand to 50 km Radius
            </button>
          </div>
        ) : (
          matches.map((match, idx) => {
            const rawDonor = donors.find((d) => d.id === match.donorId);
            const isContactRevealed = revealedContacts[match.donorId];
            const isExpanded = expandedMatchId === match.matchId;
            const isNotified = notifiedDonors[match.donorId] || request.respondedDonorId === match.donorId;

            // Privacy phone masking: +91 98421-XXXXX
            const maskedPhone = rawDonor?.phone
              ? rawDonor.phone.replace(/(\d{4})$/, 'XXXX')
              : '+91 98XXX-XXXXX';

            return (
              <div
                key={match.matchId}
                className="py-3.5 transition-colors hover:bg-slate-50/70 rounded-lg px-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left info */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs mt-0.5">
                        {match.donorBloodGroup}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          {match.donorName}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {match.distanceKm} km away
                        </span>
                        {match.eligibility ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Eligible
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Cooldown
                          </span>
                        )}
                        {match.availability ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            Available Now
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Unavailable
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {rawDonor?.district}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> Last donated: {rawDonor?.lastDonationDate || 'First time'}
                        </span>
                      </div>

                      {/* Reasons tags */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {match.reasons.slice(0, 3).map((reason, rIdx) => (
                          <span
                            key={rIdx}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                              reason.startsWith('✓')
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {reason}
                          </span>
                        ))}
                        {match.reasons.length > 3 && (
                          <button
                            onClick={() => setExpandedMatchId(isExpanded ? null : match.matchId)}
                            className="text-[10px] text-slate-500 hover:text-slate-800 underline font-medium"
                          >
                            {isExpanded ? 'Hide' : `+${match.reasons.length - 3} more`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right score and action buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Match Score
                        </div>
                        <div className="text-lg font-black text-rose-600 leading-none">
                          {match.matchScore}
                          <span className="text-xs font-medium text-slate-400">/100</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedMatchId(isExpanded ? null : match.matchId)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600"
                        title="View score breakdown"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Secure Contact Button */}
                      <button
                        onClick={() => handleRevealContact(match.donorId)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                        title="Authorized hospital verification required"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{isContactRevealed && rawDonor ? rawDonor.phone : maskedPhone}</span>
                      </button>

                      {/* Emergency Dispatch Notification & Acceptance button */}
                      <button
                        onClick={() => handleSendEmergencyAlert(match)}
                        disabled={request.respondedDonorId === match.donorId || isNotified || !match.availability}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all ${
                          request.respondedDonorId === match.donorId || isNotified
                            ? 'bg-emerald-600 text-white cursor-default'
                            : match.availability
                            ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-98 cursor-pointer'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {request.respondedDonorId === match.donorId || isNotified ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted Donor
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Dispatch
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Score Breakdown View */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/80 p-3 rounded-lg text-xs animate-in fade-in">
                    <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                      <span>Transparent AI Match Score Breakdown:</span>
                      <span className="font-mono text-rose-600 font-black">{match.matchScore} / 100</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center mb-3">
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-medium">Blood Compatibility (40%)</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {match.scoreBreakdown.compatibilityScore} / 40
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-medium">Distance Proximity (25%)</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {match.scoreBreakdown.distanceScore} / 25
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-medium">Medical Eligibility (20%)</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {match.scoreBreakdown.eligibilityScore} / 20
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-medium">Live Availability (10%)</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {match.scoreBreakdown.availabilityScore} / 10
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-medium">Response History (5%)</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {match.scoreBreakdown.responseScore} / 5
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-600">Decision Rationale:</div>
                      {match.reasons.map((r, i) => (
                        <div key={i} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
