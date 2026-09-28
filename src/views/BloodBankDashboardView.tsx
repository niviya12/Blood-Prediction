import React, { useState } from 'react';
import {
  Warehouse,
  Plus,
  Minus,
  AlertTriangle,
  Clock,
  Calendar,
  Send,
  CheckCircle2,
  Users,
  Layers,
  MapPin,
  XCircle,
} from 'lucide-react';
import { BloodBank, BloodGroup, BloodRequest, CurrentUser, Donor } from '../types';
import { BloodInventoryCards } from '../components/BloodInventoryCards';
import { db } from '../services/db';

interface BloodBankDashboardViewProps {
  currentUser: CurrentUser | null;
  bloodBanks: BloodBank[];
  requests: BloodRequest[];
  donors: Donor[];
}

interface DonationCamp {
  id: string;
  name: string;
  location: string;
  date: string;
  targetUnits: number;
  registeredDonors: number;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
}

export const BloodBankDashboardView: React.FC<BloodBankDashboardViewProps> = ({
  currentUser,
  bloodBanks,
  requests,
  donors,
}) => {
  const currentBank = currentUser?.bloodBankProfile || bloodBanks[0];
  const [camps, setCamps] = useState<DonationCamp[]>([
    {
      id: 'camp-1',
      name: 'Rotary Club Mega Blood Donation Camp',
      location: 'Sivakasi Town Hall Ground',
      date: '2026-09-28',
      targetUnits: 150,
      registeredDonors: 118,
      status: 'UPCOMING',
    },
    {
      id: 'camp-2',
      name: 'Engineering College Voluntary Youth Drive',
      location: 'Mepco Schlenk Campus Auditorium',
      date: '2026-10-04',
      targetUnits: 200,
      registeredDonors: 164,
      status: 'UPCOMING',
    },
  ]);

  const [newCampName, setNewCampName] = useState('');
  const [newCampLocation, setNewCampLocation] = useState('');
  const [newCampDate, setNewCampDate] = useState('');
  const [newCampTarget, setNewCampTarget] = useState(100);
  const [showAddCamp, setShowAddCamp] = useState(false);
  const [statusToast, setStatusToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Incoming hospital requests
  const incomingRequests = requests.filter((r) => r.status !== 'FULFILLED');

  const handleDispatchUnits = (req: BloodRequest) => {
    // Reserve/dispatch from current blood bank
    const ok = db.reserveBloodUnits(currentBank.id, req.bloodGroup, req.unitsRequired, req.id);
    if (ok) {
      db.fulfillRequest(req.id);
      setStatusToast({
        type: 'success',
        message: `✓ Dispatched ${req.unitsRequired} units of ${req.bloodGroup} to ${req.hospitalName}. Cold chain transfer logged!`,
      });
    } else {
      setStatusToast({
        type: 'error',
        message: `Insufficient stock of ${req.bloodGroup} in cold storage to fulfill ${req.unitsRequired} units.`,
      });
    }
  };

  const handleCreateCamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName || !newCampLocation || !newCampDate) return;

    const newCamp: DonationCamp = {
      id: `camp-${Date.now()}`,
      name: newCampName,
      location: newCampLocation,
      date: newCampDate,
      targetUnits: Number(newCampTarget) || 100,
      registeredDonors: 0,
      status: 'UPCOMING',
    };

    setCamps((prev) => [newCamp, ...prev]);
    setShowAddCamp(false);
    setNewCampName('');
    setNewCampLocation('');
    setNewCampDate('');

    db.addLog({
      actorRole: 'BLOOD_BANK',
      actorName: currentBank.name,
      action: 'DONATION_CAMP_SCHEDULED',
      details: `New donation camp scheduled: ${newCamp.name} on ${newCamp.date}`,
      level: 'INFO',
    });
  };

  return (
    <div className="space-y-6">
      {statusToast && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in ${
            statusToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <span>{statusToast.message}</span>
          <button
            onClick={() => setStatusToast(null)}
            className="p-1 rounded hover:bg-black/5"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Blood Bank Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-100 shrink-0">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{currentBank.name}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Cold Chain Transfusion Center
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3">
              <span>Licence: {currentBank.licenseNumber || currentBank.registrationId}</span>
              <span>•</span>
              <span>{currentBank.district}</span>
              <span>•</span>
              <span>Hours: {currentBank.operatingHours}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCamp(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Donation Drive</span>
          </button>
        </div>
      </div>

      {/* Blood Inventory Cards (with staff add/issue controls) */}
      <BloodInventoryCards
        bloodBanks={bloodBanks}
        userRole="BLOOD_BANK"
        selectedBloodBankId={currentBank.id}
      />

      {/* Incoming Hospital Requests for Blood Bank Dispatch */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Incoming Hospital Dispatch Requests
            </h3>
            <p className="text-xs text-slate-500">
              Emergency allocations requiring cold storage unit issue & verification
            </p>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
            {incomingRequests.length} Pending Actions
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {incomingRequests.map((req) => {
            const currentStockForGroup = currentBank.stock[req.bloodGroup]?.availableUnits || 0;
            const hasStock = currentStockForGroup >= req.unitsRequired;

            return (
              <div
                key={req.id}
                className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {req.bloodGroup}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {req.hospitalName} ({req.requestId})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        {req.emergencyLevel}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        Units: <strong>{req.unitsRequired}</strong>
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3">
                      <span>Case: {req.caseType}</span>
                      <span>•</span>
                      <span>Location: {req.hospitalLocation}</span>
                      <span>•</span>
                      <span>
                        Your Stock: <strong className={hasStock ? 'text-emerald-700' : 'text-rose-700'}>{currentStockForGroup} units</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDispatchUnits(req)}
                    disabled={!hasStock}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      hasStock
                        ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-98'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{hasStock ? 'Dispatch Blood Units' : 'Stock Insufficient'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheduled Blood Donation Camps */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Community Blood Donation Drives & Camps
            </h3>
            <p className="text-xs text-slate-500">
              Mobile collection drives to replenish regional blood stocks
            </p>
          </div>
          <button
            onClick={() => setShowAddCamp(!showAddCamp)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
          >
            {showAddCamp ? 'Close Form' : '+ New Drive'}
          </button>
        </div>

        {/* Schedule form */}
        {showAddCamp && (
          <form onSubmit={handleCreateCamp} className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Drive Name</label>
              <input
                type="text"
                value={newCampName}
                onChange={(e) => setNewCampName(e.target.value)}
                placeholder="e.g. Lions Club Drive"
                className="w-full bg-white border border-slate-300 rounded-lg p-2"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Location / Venue</label>
              <input
                type="text"
                value={newCampLocation}
                onChange={(e) => setNewCampLocation(e.target.value)}
                placeholder="e.g. Community Hall"
                className="w-full bg-white border border-slate-300 rounded-lg p-2"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Drive Date</label>
              <input
                type="date"
                value={newCampDate}
                onChange={(e) => setNewCampDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Units</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newCampTarget}
                  onChange={(e) => setNewCampTarget(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg shrink-0"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {camps.map((camp) => (
            <div
              key={camp.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 text-sm">{camp.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {camp.status}
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{camp.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date: <strong>{camp.date}</strong></span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Goal: <strong>{camp.targetUnits} units</strong>
                </span>
                <span className="text-emerald-700 font-bold">
                  {camp.registeredDonors} Donors Registered
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
