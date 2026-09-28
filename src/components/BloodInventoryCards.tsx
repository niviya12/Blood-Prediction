import React, { useState } from 'react';
import { Plus, Minus, ShieldAlert, CheckCircle, AlertTriangle, Layers } from 'lucide-react';
import { BloodBank, BloodGroup, UserRole } from '../types';
import { db } from '../services/db';

interface BloodInventoryCardsProps {
  bloodBanks: BloodBank[];
  userRole?: UserRole;
  selectedBloodBankId?: string;
  onSelectBloodBank?: (id: string) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const BloodInventoryCards: React.FC<BloodInventoryCardsProps> = ({
  bloodBanks,
  userRole,
  selectedBloodBankId,
  onSelectBloodBank,
}) => {
  const activeBankId = selectedBloodBankId || bloodBanks[0]?.id || '';
  const currentBank = bloodBanks.find((b) => b.id === activeBankId) || bloodBanks[0];
  const [adjustingGroup, setAdjustingGroup] = useState<BloodGroup | null>(null);

  // Compute aggregated stock across all banks if viewer wants regional totals
  const aggregatedStock: Record<BloodGroup, { available: number; reserved: number; status: 'NORMAL' | 'LOW' | 'CRITICAL' }> = {
    'A+': { available: 0, reserved: 0, status: 'NORMAL' },
    'A-': { available: 0, reserved: 0, status: 'NORMAL' },
    'B+': { available: 0, reserved: 0, status: 'NORMAL' },
    'B-': { available: 0, reserved: 0, status: 'NORMAL' },
    'AB+': { available: 0, reserved: 0, status: 'NORMAL' },
    'AB-': { available: 0, reserved: 0, status: 'NORMAL' },
    'O+': { available: 0, reserved: 0, status: 'NORMAL' },
    'O-': { available: 0, reserved: 0, status: 'NORMAL' },
  };

  bloodBanks.forEach((bb) => {
    BLOOD_GROUPS.forEach((bg) => {
      const item = bb.stock[bg];
      if (item) {
        aggregatedStock[bg].available += item.availableUnits;
        aggregatedStock[bg].reserved += item.reservedUnits;
      }
    });
  });

  BLOOD_GROUPS.forEach((bg) => {
    const avail = aggregatedStock[bg].available;
    if (avail <= 8) aggregatedStock[bg].status = 'CRITICAL';
    else if (avail <= 20) aggregatedStock[bg].status = 'LOW';
    else aggregatedStock[bg].status = 'NORMAL';
  });

  const handleStockUpdate = (bg: BloodGroup, delta: number) => {
    if (!currentBank) return;
    db.updateBloodStock(currentBank.id, bg, { deltaAvailable: delta });
  };

  const getStatusBadge = (status: 'NORMAL' | 'LOW' | 'CRITICAL') => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> Normal Stock
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Buffer
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-600" /> Critical Deficit
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Live Blood Inventory Dashboard
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cold-chain stock status across certified regional transfusion centers
          </p>
        </div>

        {/* Blood Bank Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Facility:</span>
          <select
            value={currentBank?.id || ''}
            onChange={(e) => onSelectBloodBank && onSelectBloodBank(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-rose-600"
          >
            {bloodBanks.map((bb) => (
              <option key={bb.id} value={bb.id}>
                {bb.name} ({bb.district.split('/')[0].trim()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 8 Blood Group Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-4">
        {BLOOD_GROUPS.map((bg) => {
          const item = currentBank?.stock[bg] || {
            bloodGroup: bg,
            availableUnits: 0,
            reservedUnits: 0,
            expiredUnits: 0,
            lastUpdated: 'Just now',
            storageStatus: 'CRITICAL',
          };

          const isUniversalDonor = bg === 'O-';
          const isUniversalRecipient = bg === 'AB+';

          return (
            <div
              key={bg}
              className={`rounded-xl p-3 border transition-all hover:shadow-md flex flex-col justify-between ${
                item.storageStatus === 'CRITICAL'
                  ? 'bg-rose-50/40 border-rose-200'
                  : item.storageStatus === 'LOW'
                  ? 'bg-amber-50/30 border-amber-200'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-slate-900 tracking-tight">
                    {bg}
                  </span>
                  {isUniversalDonor && (
                    <span className="text-[8px] uppercase font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded">
                      Universal
                    </span>
                  )}
                  {isUniversalRecipient && (
                    <span className="text-[8px] uppercase font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                      Universal Rx
                    </span>
                  )}
                </div>

                <div className="mt-2 mb-3">
                  <div className="text-2xl font-black text-slate-900 leading-none">
                    {item.availableUnits}
                    <span className="text-xs font-medium text-slate-500 ml-1">units</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>Reserved:</span>
                    <span className="font-semibold text-slate-700">{item.reservedUnits} u</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2">
                  {getStatusBadge(item.storageStatus)}
                </div>

                {/* Staff controls to adjust units */}
                {(userRole === 'BLOOD_BANK' || userRole === 'ADMIN') && (
                  <div className="flex items-center gap-1 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => handleStockUpdate(bg, 1)}
                      className="flex-1 flex items-center justify-center p-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold"
                      title="Add 1 unit"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleStockUpdate(bg, -1)}
                      disabled={item.availableUnits <= 0}
                      className="flex-1 flex items-center justify-center p-1 rounded bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-300 text-xs font-bold"
                      title="Issue 1 unit"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal Stock (&gt;10 units)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Low Buffer (4-10 units)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span> Critical (&le;3 units)
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Last updated: {currentBank?.stock['O+']?.lastUpdated || 'Today 08:30'}
        </span>
      </div>
    </div>
  );
};
