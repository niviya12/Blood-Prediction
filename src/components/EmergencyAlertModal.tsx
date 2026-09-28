import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Heart,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Warehouse,
  ArrowRight,
  ShieldCheck,
  Send,
  Droplet,
  Users,
} from 'lucide-react';
import { BloodRequest, CurrentUser, Donor } from '../types';
import { db } from '../services/db';
import { isBloodCompatible, calculateDistanceKm } from '../services/matching';

interface EmergencyAlertModalProps {
  request: BloodRequest | null;
  currentUser: CurrentUser | null;
  onClose: () => void;
  onResponded?: (response: 'ACCEPT' | 'DECLINE') => void;
}

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  request,
  currentUser,
  onClose,
  onResponded,
}) => {
  if (!request) return null;

  const [acceptedSuccess, setAcceptedSuccess] = useState(false);
  const [acceptedDonorName, setAcceptedDonorName] = useState<string>('');

  const isDonor = currentUser?.role === 'DONOR';
  const isBloodBank = currentUser?.role === 'BLOOD_BANK';
  const isHospital = currentUser?.role === 'HOSPITAL';

  // Find all compatible eligible donors for this request
  const allDonors = db.getDonors();
  const compatibleDonors = allDonors.filter(
    (d) => isBloodCompatible(request.bloodGroup, d.bloodGroup) && d.eligible && d.available
  );

  // If user is currently a donor, use their profile, else default to the best compatible donor
  const currentDonorProfile: Donor | undefined = currentUser?.donorProfile;
  const defaultDonor =
    currentDonorProfile && isBloodCompatible(request.bloodGroup, currentDonorProfile.bloodGroup)
      ? currentDonorProfile
      : compatibleDonors[0] || allDonors[0];

  const [selectedDonorId, setSelectedDonorId] = useState<string>(defaultDonor?.id || '');

  const chosenDonor = allDonors.find((d) => d.id === selectedDonorId) || defaultDonor;

  // Check blood bank stock
  const allBloodBanks = db.getBloodBanks();
  const currentBank = currentUser?.bloodBankProfile || allBloodBanks[0];
  const bankStock = currentBank?.stock[request.bloodGroup]?.availableUnits || 0;
  const canBankFulfill = bankStock >= request.unitsRequired;

  const handleAcceptRequest = () => {
    if (!chosenDonor) return;

    db.respondToRequest(request.id, chosenDonor.id, 'ACCEPT');
    setAcceptedDonorName(chosenDonor.name);
    setAcceptedSuccess(true);
    onResponded?.('ACCEPT');
  };

  const handleBankDispatch = () => {
    if (!currentBank) return;
    const ok = db.reserveBloodUnits(currentBank.id, request.bloodGroup, request.unitsRequired, request.id);
    if (ok) {
      db.fulfillRequest(request.id);
      setAcceptedSuccess(true);
      setAcceptedDonorName(`${currentBank.name} (Cold Chain Storage)`);
      onResponded?.('ACCEPT');
    }
  };

  const handleDecline = () => {
    if (chosenDonor) {
      db.respondToRequest(request.id, chosenDonor.id, 'DECLINE');
    }
    onResponded?.('DECLINE');
    onClose();
  };

  const isAlreadyAccepted = request.status === 'DONOR_ACCEPTED';
  const isFulfilled = request.status === 'FULFILLED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-rose-200 overflow-hidden my-6">
        {/* Urgent Header */}
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-white/20">
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
                CRITICAL DISPATCH ALERT
              </span>
              <h3 className="text-base sm:text-lg font-bold mt-0.5 leading-tight">
                Emergency Blood Requirement
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-5 text-slate-800 space-y-4">
          {/* Success State Screen */}
          {acceptedSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-emerald-900">
                Request Accepted Successfully!
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
                <strong>{acceptedDonorName || chosenDonor?.name}</strong> has confirmed acceptance for{' '}
                <strong>{request.unitsRequired} Units</strong> of <strong>{request.bloodGroup}</strong> at{' '}
                <strong>{request.hospitalName}</strong>.
              </p>
              <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-slate-600 flex items-center justify-around">
                <div>
                  <span className="text-slate-400 block text-[10px]">Requisition</span>
                  <span className="font-bold text-slate-900">#{request.requestId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status</span>
                  <span className="font-bold text-emerald-700">DONOR_ACCEPTED</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Hospital Dispatch</span>
                  <span className="font-bold text-slate-900">In Route</span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Done & Close Alert
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Status Banner if already accepted */}
              {(isAlreadyAccepted || isFulfilled) && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isFulfilled
                      ? '✓ This request has already been fulfilled.'
                      : `✓ Already Accepted by ${request.respondedDonorName || 'Donor'}! Logistics active.`}
                  </span>
                </div>
              )}

              {/* Patient and Hospital Card */}
              <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-rose-200/60">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-rose-600" />
                    <span className="text-xs font-bold text-rose-900 uppercase">
                      Clinical Case: {request.caseType}
                    </span>
                  </div>
                  <span className="text-xs font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                    {request.emergencyLevel} ({request.severityScore}/100 AI Urgency)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                    <span className="text-[10px] text-slate-500 block">Required Blood Group</span>
                    <span className="text-2xl font-black text-rose-600">{request.bloodGroup}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                    <span className="text-[10px] text-slate-500 block">Units Required</span>
                    <span className="text-2xl font-black text-slate-900">
                      {request.unitsRequired} <span className="text-xs font-medium text-slate-500">Units</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-700 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> Hospital:
                    </span>
                    <span className="font-bold text-slate-900 text-right">{request.hospitalName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location:
                    </span>
                    <span className="font-medium text-slate-800 text-right">{request.hospitalLocation}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Patient ID:</span>
                    <span className="font-mono text-slate-800 font-semibold">{request.patientId}</span>
                  </div>
                </div>

                {request.additionalNotes && (
                  <p className="text-[11px] italic text-slate-600 bg-white/80 p-2 rounded border border-rose-100 mt-2">
                    "{request.additionalNotes}"
                  </p>
                )}
              </div>

              {/* Accept as Donor Selector / Info */}
              {!isAlreadyAccepted && !isFulfilled && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-rose-600" />
                      {isDonor ? 'Your Donor Response:' : 'Respond / Accept as Eligible Donor:'}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {compatibleDonors.length} Compatible Nearby
                    </span>
                  </div>

                  {compatibleDonors.length > 0 ? (
                    <div>
                      <select
                        value={selectedDonorId}
                        onChange={(e) => setSelectedDonorId(e.target.value)}
                        className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      >
                        {compatibleDonors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.bloodGroup}) — {d.district} (Eligible & Available)
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Select a compatible donor to confirm willingness and commit emergency transfusion units.
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                      No matching registered donors currently eligible for {request.bloodGroup}. You can fulfill directly from cold storage blood bank below.
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons: Explicit Accept Options */}
              <div className="pt-2 space-y-2">
                {!isAlreadyAccepted && !isFulfilled ? (
                  <>
                    {/* Primary Button: Accept Request */}
                    <button
                      onClick={handleAcceptRequest}
                      disabled={!chosenDonor}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-rose-200 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>
                        Accept Request & Commit Donation ({chosenDonor?.name || 'Compatible Donor'})
                      </span>
                    </button>

                    {/* Secondary Option: Blood Bank Dispatch */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleBankDispatch}
                        disabled={!canBankFulfill}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                          canBankFulfill
                            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 cursor-pointer'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        }`}
                        title={
                          canBankFulfill
                            ? 'Fulfill directly from Blood Bank storage'
                            : `Insufficient stock in ${currentBank.name} (${bankStock} units available)`
                        }
                      >
                        <Warehouse className="w-3.5 h-3.5" />
                        <span>
                          {canBankFulfill
                            ? `Dispatch from Blood Bank (${bankStock}u Available)`
                            : `Bank Stock Low (${bankStock}u)`}
                        </span>
                      </button>

                      <button
                        onClick={handleDecline}
                        className="py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Decline / Busy
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
                  >
                    Close Dialog
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
