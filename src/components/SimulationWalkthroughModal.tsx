import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Users,
  Warehouse,
  Send,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { db } from '../services/db';

interface SimulationWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToTab?: (tabName: string) => void;
}

export const SimulationWalkthroughModal: React.FC<SimulationWalkthroughModalProps> = ({
  isOpen,
  onClose,
  onGoToTab,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [simulationData, setSimulationData] = useState<any>({
    requestId: 'REQ-DEMO-991',
    hospital: 'Sivakasi Govt Head Hospital',
    bloodGroup: 'O+',
    units: 2,
    case: 'Emergency Trauma & Hemorrhagic Shock',
    severityScore: 94,
    donorMatched: 'Priya Sharma (2.1 km away)',
    bloodBank: 'Rotary Blood Bank & Transfusion Center',
  });

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: '1. Hospital Creates Emergency Request',
      actor: 'Hospital Trauma Emergency Room',
      desc: 'Patient admitted with severe arterial trauma following highway collision. Transfusion team requests 2 units of O+ blood.',
      status: currentStep >= 1 ? 'COMPLETED' : 'PENDING',
    },
    {
      step: 2,
      title: '2. AI Computes Real-Time Severity Score',
      actor: 'AI Clinical Severity Engine',
      desc: 'Urgency evaluated using clinical case type (Trauma), units required (2), and inventory buffer. Generated score: 94/100 (CRITICAL Priority).',
      status: currentStep >= 2 ? 'COMPLETED' : 'PENDING',
    },
    {
      step: 3,
      title: '3. Smart Donor Matching Algorithm Runs',
      actor: 'Haversine Multi-Factor Ranker',
      desc: 'Screened 20 registered donors. Filtered for O+ & O- compatibility, medical eligibility (interval >90d), and availability. Nearest match: Priya Sharma (2.1 km away, Match Score: 96/100).',
      status: currentStep >= 3 ? 'COMPLETED' : 'PENDING',
    },
    {
      step: 4,
      title: '4. Regional Blood Bank Inventory Verified',
      actor: 'Rotary Cold Storage Hub',
      desc: 'Rotary Blood Bank verified 12 units of O+ available in cold storage. 2 units flagged for immediate dispatch reservation.',
      status: currentStep >= 4 ? 'COMPLETED' : 'PENDING',
    },
    {
      step: 5,
      title: '5. Instant Cross-Platform Alerts Dispatched',
      actor: 'Notification Queue',
      desc: 'High-priority sound alerts and mobile dispatch broadcast to nearby eligible donors and blood bank duty officers.',
      status: currentStep >= 5 ? 'COMPLETED' : 'PENDING',
    },
    {
      step: 6,
      title: '6. Donor Accepts Emergency Call',
      actor: 'Donor App (Priya Sharma)',
      desc: 'Donor reviews distance (2.1 km) and hospital ward location. Taps [Respond to Request]. Status updated to DONOR_NOTIFIED & ACCEPTED.',
      status: currentStep >= 6 ? 'COMPLETED' : 'PENDING',
    },
    {
      step: 7,
      title: '7. Blood Units Dispatched & Transfusion Fulfilled',
      actor: 'Blood Bank Cold Chain Courier',
      desc: 'Blood bank packages 2 tested O+ units with temperature data logger. Hospital emergency room receives courier and marks request FULFILLED.',
      status: currentStep >= 7 ? 'COMPLETED' : 'PENDING',
    },
  ];

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Trigger sample creation in DB
      db.createBloodRequest({
        hospitalId: 'hosp-1',
        hospitalName: 'Sivakasi Govt Head Hospital',
        patientId: 'PT-DEMO-SIM',
        bloodGroup: 'O+',
        unitsRequired: 2,
        hospitalLocation: 'Emergency Trauma Ward #1',
        district: 'Sivakasi / Virudhunagar',
        latitude: 9.4533,
        longitude: 77.7983,
        requiredDate: new Date().toISOString().split('T')[0],
        requiredTime: '13:00',
        caseType: 'Accident & Trauma',
        emergencyLevel: 'CRITICAL',
        additionalNotes: 'Simulation Walkthrough Emergency Request',
      });
    }

    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-600 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                Interactive Verification Flow
              </span>
              <h2 className="text-base font-bold">End-to-End Emergency Lifecycle Simulation</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {steps.map((s) => {
            const isCurrent = currentStep === s.step;
            const isDone = currentStep > s.step;

            return (
              <div
                key={s.step}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-rose-50/50 border-rose-400 ring-2 ring-rose-200 shadow-sm'
                    : isDone
                    ? 'bg-emerald-50/30 border-emerald-200'
                    : 'bg-slate-50/50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center animate-pulse">
                          {s.step}
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-600 font-bold text-xs flex items-center justify-center">
                          {s.step}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{s.title}</span>
                        <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-slate-200 text-slate-700">
                          {s.actor}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{s.desc}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {isDone ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Executed
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                        Active Step
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        Queued
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Simulation
          </button>

          <button
            onClick={handleNextStep}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-98"
          >
            <span>{currentStep === 7 ? 'Complete Simulation' : `Proceed to Step ${currentStep + 1}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
