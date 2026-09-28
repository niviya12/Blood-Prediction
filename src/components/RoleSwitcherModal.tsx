import React from 'react';
import {
  X,
  Building2,
  Heart,
  Warehouse,
  Shield,
  CheckCircle2,
  Sparkles,
  Play,
  ArrowRight,
} from 'lucide-react';
import { UserRole, CurrentUser } from '../types';
import { db } from '../services/db';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
  onSelectRole: (role: UserRole) => void;
  onStartSimulation: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectRole,
  onStartSimulation,
}) => {
  if (!isOpen) return null;

  const roles: {
    role: UserRole;
    title: string;
    description: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    badge: string;
  }[] = [
    {
      role: 'HOSPITAL',
      title: 'Hospital Emergency Unit',
      description: 'Create trauma blood requests, view AI clinical severity score, track nearby donors.',
      name: 'Dr. Arvind Rajan, Sivakasi Govt Head Hospital',
      icon: <Building2 className="w-5 h-5 text-sky-600" />,
      color: 'border-sky-200 hover:border-sky-500 bg-sky-50/40',
      badge: 'Hospital Access',
    },
    {
      role: 'DONOR',
      title: 'Registered Volunteer Donor',
      description: 'Manage availability, receive critical alerts, respond to emergency transfusion calls.',
      name: 'Priya Sharma (O+ Donor, 2.1km away)',
      icon: <Heart className="w-5 h-5 text-rose-600" />,
      color: 'border-rose-200 hover:border-rose-500 bg-rose-50/40',
      badge: 'Donor Access',
    },
    {
      role: 'BLOOD_BANK',
      title: 'Certified Regional Blood Bank',
      description: 'Manage 8-group cold inventory, issue emergency stock, schedule donation camps.',
      name: 'Rotary Blood Bank & Transfusion Center, Sivakasi',
      icon: <Warehouse className="w-5 h-5 text-purple-600" />,
      color: 'border-purple-200 hover:border-purple-500 bg-purple-50/40',
      badge: 'Transfusion Center',
    },
    {
      role: 'ADMIN',
      title: 'State Transfusion Authority',
      description: 'System-wide surveillance, machine learning demand forecast validation, audit logs.',
      name: 'Dr. Meenakshi S., State Council Officer',
      icon: <Shield className="w-5 h-5 text-emerald-600" />,
      color: 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/40',
      badge: 'Super Admin',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
              Prototype Persona Switcher
            </span>
            <h2 className="text-base font-bold">Select Active User Role</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guided End-to-End Simulation Action Banner */}
        <div className="p-4 bg-gradient-to-r from-rose-600 to-red-600 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-black">Run Interactive End-to-End Emergency Simulation</div>
              <div className="text-[11px] text-rose-100">
                Trigger trauma emergency → AI Scoring → Donor Match → Push Notification → Response
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              onStartSimulation();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-rose-700 font-bold text-xs shadow-sm hover:bg-rose-50 transition-colors shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-rose-700" />
            <span>Simulate Now</span>
          </button>
        </div>

        {/* Roles List */}
        <div className="p-5 space-y-3">
          {roles.map((item) => {
            const isSelected = currentUser?.role === item.role;
            return (
              <div
                key={item.role}
                onClick={() => {
                  onSelectRole(item.role);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${item.color} ${
                  isSelected ? 'ring-2 ring-slate-900 border-slate-900' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white shadow-xs shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">{item.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Active
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1">
                      Switch <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          State is persistently synchronized via local storage and cross-tab communication channels.
        </div>
      </div>
    </div>
  );
};
