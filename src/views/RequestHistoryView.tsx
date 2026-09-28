import React, { useState } from 'react';
import { History, Search, Filter, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { BloodRequest } from '../types';

interface RequestHistoryViewProps {
  requests: BloodRequest[];
}

export const RequestHistoryView: React.FC<RequestHistoryViewProps> = ({ requests }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (
      searchTerm &&
      !r.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !r.requestId.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !r.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Transfusion Request Audit History
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Comprehensive audit record of all emergency, surgical, and scheduled clinical blood requisitions
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Search hospital, ID, blood..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="MATCHING">Matching</option>
            <option value="DONOR_NOTIFIED">Donor Notified</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Req ID</th>
              <th className="py-2.5 px-3">Hospital</th>
              <th className="py-2.5 px-3">Blood Group</th>
              <th className="py-2.5 px-3">Units</th>
              <th className="py-2.5 px-3">Clinical Case</th>
              <th className="py-2.5 px-3">Emergency Priority</th>
              <th className="py-2.5 px-3">AI Score</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{req.requestId}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">{req.hospitalName}</td>
                <td className="py-2.5 px-3 font-black text-rose-600 text-sm">{req.bloodGroup}</td>
                <td className="py-2.5 px-3 font-bold text-slate-800">{req.unitsRequired} u</td>
                <td className="py-2.5 px-3 text-slate-600">{req.caseType}</td>
                <td className="py-2.5 px-3">
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
                </td>
                <td className="py-2.5 px-3 font-bold text-indigo-700">{req.severityScore}/100</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      req.status === 'FULFILLED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                  {new Date(req.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
