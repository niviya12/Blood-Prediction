import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Heart,
  Calendar,
  Clock,
  Building,
  User,
  Sparkles,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { BloodGroup, CaseType, EmergencyLevel, Hospital } from '../types';
import { calculateAISeverityScore } from '../services/severity';
import { db } from '../services/db';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitals: Hospital[];
  currentHospitalId?: string;
  onRequestCreated?: (requestId: string) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const CASE_TYPES: CaseType[] = [
  'Accident & Trauma',
  'Postpartum Hemorrhage',
  'Emergency Surgery',
  'ICU Resuscitation',
  'Cardiovascular Surgery',
  'Cancer & Oncology',
  'Thalassemia / Anemia',
  'Routine Transfusion',
];

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  hospitals,
  currentHospitalId,
  onRequestCreated,
}) => {
  const defaultHosp = hospitals.find((h) => h.id === currentHospitalId) || hospitals[0];

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(defaultHosp?.id || '');
  const [patientId, setPatientId] = useState<string>(`PT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [unitsRequired, setUnitsRequired] = useState<number>(2);
  const [caseType, setCaseType] = useState<CaseType>('Accident & Trauma');
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>('CRITICAL');
  const [requiredDate, setRequiredDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [requiredTime, setRequiredTime] = useState<string>('12:00');
  const [hospitalLocation, setHospitalLocation] = useState<string>('ICU Emergency Trauma Ward, 2nd Floor');
  const [additionalNotes, setAdditionalNotes] = useState<string>('Acute hemorrhagic hypovolemia shock. Immediate crossmatching and donor dispatch required.');

  // Live AI Severity Calculation
  const activeHospital = hospitals.find((h) => h.id === selectedHospitalId) || defaultHosp;
  const currentTotalStock = db.getTotalStockMap()[bloodGroup] || 0;

  const severity = calculateAISeverityScore({
    caseType,
    unitsRequired,
    emergencyLevel,
    requiredDate,
    requiredTime,
    bloodGroup,
    nearbyStockAvailable: currentTotalStock,
  });

  useEffect(() => {
    if (defaultHosp && !selectedHospitalId) {
      setSelectedHospitalId(defaultHosp.id);
    }
  }, [defaultHosp]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHospital) return;

    const newReq = db.createBloodRequest({
      hospitalId: activeHospital.id,
      hospitalName: activeHospital.hospitalName,
      patientId,
      bloodGroup,
      unitsRequired,
      hospitalLocation,
      district: activeHospital.district,
      latitude: activeHospital.latitude,
      longitude: activeHospital.longitude,
      requiredDate,
      requiredTime,
      caseType,
      emergencyLevel,
      additionalNotes,
    });

    onRequestCreated?.(newReq.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Create Emergency Blood Request</h2>
              <p className="text-xs text-rose-100">
                AI Severity Engine will evaluate urgency and trigger smart donor dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Severity Live Score Preview Banner */}
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-600/30 border border-rose-500/40 text-rose-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <span>AI Operational Severity Score</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  Non-clinical triage
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
                {severity.rationale}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-rose-400 leading-none">
              {severity.score}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                severity.level === 'CRITICAL'
                  ? 'bg-rose-600 text-white'
                  : severity.level === 'HIGH'
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {severity.level} PRIORITY
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Hospital & Patient Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hospital Facility
              </label>
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-rose-600"
                required
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hospitalName} ({h.district.split('/')[0].trim()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient Medical Record ID
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-rose-600"
                placeholder="e.g. PT-8849"
                required
              />
            </div>
          </div>

          {/* Blood Group & Units Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Blood Group Required
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    type="button"
                    key={bg}
                    onClick={() => setBloodGroup(bg)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      bloodGroup === bg
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Units Required (Pints)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setUnitsRequired(num)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      unitsRequired === num
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Available in regional blood banks: <strong className="text-slate-800">{currentTotalStock} units</strong>
              </div>
            </div>
          </div>

          {/* Case Type & Emergency Level Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Case Category
              </label>
              <select
                value={caseType}
                onChange={(e) => setCaseType(e.target.value as CaseType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-rose-600"
              >
                {CASE_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hospital Emergency Level
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as EmergencyLevel[]).map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setEmergencyLevel(lvl)}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
                      emergencyLevel === lvl
                        ? lvl === 'CRITICAL'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : lvl === 'HIGH'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location & Time Required */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Required Date
              </label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-rose-600"
                required
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Required Time
              </label>
              <input
                type="time"
                value={requiredTime}
                onChange={(e) => setRequiredTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-rose-600"
                required
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Internal Hospital Wing
              </label>
              <input
                type="text"
                value={hospitalLocation}
                onChange={(e) => setHospitalLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-rose-600"
                placeholder="e.g. Ward 4 / OT 2"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Additional Clinical Notes / Transfusion Instructions
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-rose-600"
              placeholder="Provide relevant clinical context..."
            />
          </div>

          {/* Modal Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Emergency Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
