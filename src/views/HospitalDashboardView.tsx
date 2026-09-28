import React, { useState } from 'react';
import {
  Building2,
  Plus,
  AlertTriangle,
  Search,
  Users,
  Warehouse,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Phone,
  Shield,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { BloodRequest, CurrentUser, Donor, BloodBank, Hospital, BloodGroup } from '../types';
import { MatchedDonorsList } from '../components/MatchedDonorsList';
import { calculateDistanceKm, isBloodCompatible } from '../services/matching';
import { db } from '../services/db';

interface HospitalDashboardViewProps {
  currentUser: CurrentUser | null;
  requests: BloodRequest[];
  donors: Donor[];
  bloodBanks: BloodBank[];
  hospitals: Hospital[];
  onOpenCreateRequest: () => void;
}

export const HospitalDashboardView: React.FC<HospitalDashboardViewProps> = ({
  currentUser,
  requests,
  donors,
  bloodBanks,
  hospitals,
  onOpenCreateRequest,
}) => {
  const currentHospital = currentUser?.hospitalProfile || hospitals[0];
  const [activeSubTab, setActiveSubTab] = useState<'ACTIVE_REQUESTS' | 'MATCHED_DONORS' | 'SEARCH_DONORS' | 'SEARCH_BANKS'>('ACTIVE_REQUESTS');
  const [selectedRequestForMatch, setSelectedRequestForMatch] = useState<BloodRequest>(requests[0]);
  const [donorSearchRadius, setDonorSearchRadius] = useState<number>(25);
  const [donorBloodFilter, setDonorBloodFilter] = useState<string>('ALL');

  // Filter requests belonging to this hospital
  const hospitalRequests = requests.filter(
    (r) => r.hospitalId === currentHospital.id || r.hospitalName.includes(currentHospital.hospitalName.substring(0, 10))
  );

  const activeRequests = hospitalRequests.filter((r) => r.status !== 'FULFILLED');
  const fulfilledRequests = hospitalRequests.filter((r) => r.status === 'FULFILLED');

  const handleFulfillRequest = (requestId: string) => {
    db.fulfillRequest(requestId);
  };

  const handleReserveFromBank = (bbId: string, bg: BloodGroup, units: number, reqId?: string) => {
    const ok = db.reserveBloodUnits(bbId, bg, units, reqId);
    if (ok) {
      alert(`Reserved ${units} units of ${bg} from blood bank. Units have been allocated for transfer.`);
    } else {
      alert('Insufficient available units in selected blood bank.');
    }
  };

  // Nearby donors search
  const nearbyDonors = donors
    .map((d) => {
      const dist = calculateDistanceKm(currentHospital.latitude, currentHospital.longitude, d.latitude, d.longitude);
      return { ...d, distance: dist };
    })
    .filter((d) => {
      if (d.distance > donorSearchRadius) return false;
      if (donorBloodFilter !== 'ALL' && d.bloodGroup !== donorBloodFilter) return false;
      return true;
    })
    .sort((a, b) => a.distance - b.distance);

  // Nearby blood banks search
  const nearbyBanks = bloodBanks
    .map((b) => {
      const dist = calculateDistanceKm(currentHospital.latitude, currentHospital.longitude, b.latitude, b.longitude);
      return { ...b, distance: dist };
    })
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="space-y-6">
      {/* Hospital Identity Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-100 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{currentHospital.hospitalName}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Verified Medical Facility
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3">
              <span>Reg ID: {currentHospital.registrationId}</span>
              <span>•</span>
              <span>{currentHospital.district}</span>
              <span>•</span>
              <span>Emergency Desk: {currentHospital.emergencyContact}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenCreateRequest}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-98 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Blood Request</span>
        </button>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('ACTIVE_REQUESTS')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeSubTab === 'ACTIVE_REQUESTS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Active Transfusion Requests ({activeRequests.length})
        </button>
        <button
          onClick={() => setActiveSubTab('MATCHED_DONORS')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeSubTab === 'MATCHED_DONORS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Smart Matched Donors
        </button>
        <button
          onClick={() => setActiveSubTab('SEARCH_DONORS')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeSubTab === 'SEARCH_DONORS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Radius Donor Radar
        </button>
        <button
          onClick={() => setActiveSubTab('SEARCH_BANKS')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeSubTab === 'SEARCH_BANKS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Regional Blood Banks
        </button>
      </div>

      {/* View 1: Active Requests */}
      {activeSubTab === 'ACTIVE_REQUESTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Active Hospital Requests ({activeRequests.length} pending / matching)
            </h3>
            <span className="text-xs text-slate-500">
              {fulfilledRequests.length} historical fulfillments recorded
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {activeRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active pending requests. Click "New Blood Request" to initiate a clinical broadcast.
              </div>
            ) : (
              activeRequests.map((req) => (
                <div
                  key={req.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-rose-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                      {req.bloodGroup}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {req.requestId} (Patient: {req.patientId})
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            req.emergencyLevel === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : req.emergencyLevel === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {req.emergencyLevel}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          AI Urgency: {req.severityScore}/100
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Status: {req.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>Units Required: <strong>{req.unitsRequired}</strong></span>
                        <span>•</span>
                        <span>Case: {req.caseType}</span>
                        <span>•</span>
                        <span>Location: {req.hospitalLocation}</span>
                      </div>

                      {req.respondedDonorName && (
                        <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Donor Accepted: {req.respondedDonorName} is en route.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedRequestForMatch(req);
                        setActiveSubTab('MATCHED_DONORS');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold"
                    >
                      View Matches
                    </button>
                    {!req.respondedDonorName && req.status !== 'FULFILLED' && (
                      <button
                        onClick={() => {
                          const compatible =
                            donors.find(
                              (d) => isBloodCompatible(req.bloodGroup, d.bloodGroup) && d.eligible
                            ) || donors[0];
                          if (compatible) {
                            db.respondToRequest(req.id, compatible.id, 'ACCEPT');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Accept & Assign Donor
                      </button>
                    )}
                    <button
                      onClick={() => handleFulfillRequest(req.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Mark Fulfilled
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* View 2: Matched Donors for Selected Request */}
      {activeSubTab === 'MATCHED_DONORS' && (
        <div>
          {/* Request Selector */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Select Active Request to Match:</span>
            <select
              value={selectedRequestForMatch?.id || ''}
              onChange={(e) => {
                const found = requests.find((r) => r.id === e.target.value);
                if (found) setSelectedRequestForMatch(found);
              }}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1 text-xs font-bold text-slate-900"
            >
              {requests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.requestId} ({r.unitsRequired}u {r.bloodGroup} - {r.emergencyLevel})
                </option>
              ))}
            </select>
          </div>

          <MatchedDonorsList
            request={selectedRequestForMatch || requests[0]}
            donors={donors}
            userRole={currentUser?.role}
          />
        </div>
      )}

      {/* View 3: Radar Search Nearby Donors */}
      {activeSubTab === 'SEARCH_DONORS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nearby Donor Proximity Radar
              </h3>
              <p className="text-xs text-slate-500">
                Scanning verified volunteer donors centered on {currentHospital.hospitalName}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Radius:</span>
              {[5, 10, 25, 50].map((km) => (
                <button
                  key={km}
                  onClick={() => setDonorSearchRadius(km)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    donorSearchRadius === km
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {km} km
                </button>
              ))}

              <select
                value={donorBloodFilter}
                onChange={(e) => setDonorBloodFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 font-medium rounded-lg px-2 py-1 text-xs"
              >
                <option value="ALL">All Groups</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {nearbyDonors.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">{d.name}</span>
                    <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      {d.bloodGroup}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Proximity:</span>
                      <span className="font-bold text-rose-600">{d.distance} km away</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Eligibility:</span>
                      <span className={`font-semibold ${d.eligible ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {d.eligible ? 'Eligible' : 'Cooldown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Availability:</span>
                      <span className="font-semibold text-slate-800">
                        {d.available ? 'Active Now' : 'Standby'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[10px]">Privacy Masked</span>
                  <button
                    onClick={() => alert(`Authorized dispatch request logged. Secure contact initialized with ${d.name}.`)}
                    className="text-rose-600 hover:text-rose-700 font-bold text-xs"
                  >
                    Direct Dispatch →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View 4: Regional Blood Banks */}
      {activeSubTab === 'SEARCH_BANKS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Regional Blood Banks & Transfusion Centers
            </h3>
            <p className="text-xs text-slate-500">
              Real-time cold-chain inventory availability for immediate hospital dispatch
            </p>
          </div>

          <div className="space-y-4">
            {nearbyBanks.map((bb) => (
              <div
                key={bb.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-purple-600" />
                    <span className="font-bold text-slate-900 text-sm">{bb.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {bb.distance} km away
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3">
                    <span>{bb.address}</span>
                    <span>•</span>
                    <span>Phone: {bb.phone}</span>
                    <span>•</span>
                    <span>Hours: {bb.operatingHours}</span>
                  </div>

                  {/* Quick stock chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as BloodGroup[]).map((bg) => {
                      const item = bb.stock[bg];
                      const avail = item?.availableUnits || 0;
                      return (
                        <div
                          key={bg}
                          className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1.5 font-bold ${
                            avail <= 3
                              ? 'bg-rose-50 border-rose-200 text-rose-800'
                              : avail <= 8
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <span>{bg}:</span>
                          <span className="text-sm font-black">{avail}u</span>
                          <button
                            onClick={() => handleReserveFromBank(bb.id, bg, 1)}
                            disabled={avail <= 0}
                            className="ml-1 text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded hover:bg-rose-600 disabled:opacity-30"
                            title={`Reserve 1 unit of ${bg}`}
                          >
                            Reserve
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
