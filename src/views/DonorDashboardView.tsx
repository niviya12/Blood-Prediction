import React, { useState } from 'react';
import {
  Heart,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
  Bell,
  Award,
  History,
  Send,
} from 'lucide-react';
import { BloodRequest, CurrentUser, Donor, AppNotification } from '../types';
import { calculateDistanceKm, isBloodCompatible } from '../services/matching';
import { db } from '../services/db';

interface DonorDashboardViewProps {
  currentUser: CurrentUser | null;
  requests: BloodRequest[];
  notifications: AppNotification[];
  onOpenAlertModal: (request: BloodRequest) => void;
  onSelectNotification?: (notification: AppNotification) => void;
}

export const DonorDashboardView: React.FC<DonorDashboardViewProps> = ({
  currentUser,
  requests,
  notifications,
  onOpenAlertModal,
  onSelectNotification,
}) => {
  const donor: Donor = currentUser?.donorProfile || db.getDonors()[0];
  const [available, setAvailable] = useState<boolean>(donor.available);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const handleToggleAvailability = () => {
    const next = !available;
    setAvailable(next);
    db.updateDonorAvailability(donor.id, next);
  };

  // Filter requests compatible with donor's blood group
  const relevantRequests = requests
    .filter((r) => isBloodCompatible(r.bloodGroup, donor.bloodGroup) && r.status !== 'FULFILLED')
    .map((r) => {
      const distance = calculateDistanceKm(r.latitude, r.longitude, donor.latitude, donor.longitude);
      return { ...r, distance };
    })
    .sort((a, b) => a.distance - b.distance);

  const emergencyRequests = relevantRequests.filter(
    (r) => r.emergencyLevel === 'CRITICAL' || r.emergencyLevel === 'HIGH'
  );

  const handleRespond = (req: BloodRequest) => {
    db.respondToRequest(req.id, donor.id, 'ACCEPT');
    setActionToast(`✓ Thank you, ${donor.name}! Your response for Request #${req.requestId} at ${req.hospitalName} has been communicated and logged. Coordination is active.`);
  };

  const handleDecline = (req: BloodRequest) => {
    db.respondToRequest(req.id, donor.id, 'DECLINE');
    setActionToast(`Marked as not available for Request #${req.requestId}.`);
  };

  return (
    <div className="space-y-6">
      {/* In-App Toast Banner */}
      {actionToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <button
            onClick={() => setActionToast(null)}
            className="p-1 rounded hover:bg-emerald-100 text-emerald-800"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Donor Profile Header & Eligibility Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-rose-200 shrink-0">
              {donor.bloodGroup}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{donor.name}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {donor.donorId}
                </span>
                {donor.eligible ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Eligible to Donate
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Cooldown Active (&lt;90 days)
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {donor.address}, {donor.district}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Last Donation: {donor.lastDonationDate || 'None'}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-rose-500" /> {donor.donationCount} Lives Impacted
                </span>
              </div>
            </div>
          </div>

          {/* Availability Toggle Switch */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-900">
                Available for Emergency Donation
              </div>
              <div className="text-[11px] text-slate-500">
                {available ? 'Active — hospitals can match you' : 'Paused — notifications muted'}
              </div>
            </div>
            <button
              onClick={handleToggleAvailability}
              className={`p-1.5 rounded-full transition-colors ${
                available ? 'text-rose-600' : 'text-slate-400'
              }`}
            >
              {available ? (
                <ToggleRight className="w-9 h-9 fill-rose-600 text-rose-600" />
              ) : (
                <ToggleLeft className="w-9 h-9" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Alert Priority Section */}
      {emergencyRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 px-5 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span className="text-xs font-bold tracking-wide uppercase">
                🚨 Urgent Nearby Hospital Blood Requests Matching Your Group ({donor.bloodGroup})
              </span>
            </div>
            <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
              {emergencyRequests.length} Immediate Cases
            </span>
          </div>

          <div className="divide-y divide-slate-100 p-2">
            {emergencyRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 transition-colors hover:bg-rose-50/40 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{req.hospitalName}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      {req.emergencyLevel}
                    </span>
                    <span className="text-xs font-bold text-rose-600 bg-white border border-rose-200 px-2 py-0.5 rounded-full">
                      {req.distance} km away
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span>Units Required: <strong>{req.unitsRequired} Units ({req.bloodGroup})</strong></span>
                    <span>•</span>
                    <span>Patient ID: {req.patientId}</span>
                    <span>•</span>
                    <span>Clinical Case: {req.caseType}</span>
                  </div>
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    {req.additionalNotes || 'Urgent transfusion needed.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDecline(req)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Not Available
                  </button>
                  <button
                    onClick={() => handleRespond(req)}
                    disabled={req.respondedDonorId === donor.id}
                    className={`px-4 py-2 rounded-lg font-bold text-xs shadow-xs transition-all ${
                      req.respondedDonorId === donor.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-98'
                    }`}
                  >
                    {req.respondedDonorId === donor.id ? '✓ You Responded' : 'Respond to Request'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification History & Real-Time Alerts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-900">Notification History & Alerts</h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {notifications.length} Total Alerts
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No notification alerts logged yet. Emergency calls and match updates will appear here.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  db.markNotificationAsRead(n.id);
                  onSelectNotification?.(n);
                }}
                className={`py-3 px-3 rounded-lg my-1 transition-all cursor-pointer flex items-center justify-between gap-3 hover:bg-slate-50 ${
                  !n.read ? 'bg-rose-50/50 border border-rose-100 font-medium' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      n.priority === 'CRITICAL'
                        ? 'bg-rose-600 text-white'
                        : n.priority === 'HIGH'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {n.type === 'EMERGENCY_REQUEST' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate max-w-md">{n.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      db.markNotificationAsRead(n.id);
                      onSelectNotification?.(n);
                    }}
                    className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Donation History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Personal Donation History</h3>
          </div>
          <span className="text-xs text-slate-500">
            {donor.donationHistory.length} Recorded Transfusions
          </span>
        </div>

        {donor.donationHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No donation records logged yet. Your successful donations will be certified here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Facility / Blood Camp</th>
                  <th className="py-2.5 px-3">Blood Group</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donor.donationHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{rec.date}</td>
                    <td className="py-2.5 px-3 text-slate-700">{rec.hospitalOrCamp}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-600">{rec.bloodGroup}</td>
                    <td className="py-2.5 px-3 text-slate-600">{rec.units} Unit (450ml)</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
