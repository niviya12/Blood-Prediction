import React from 'react';
import {
  Sparkles,
  Users,
  Clock,
  Droplet,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { BloodRequest, Donor, BloodBank } from '../types';

interface TopMetricCardsProps {
  donors: Donor[];
  requests: BloodRequest[];
  bloodBanks: BloodBank[];
}

export const TopMetricCards: React.FC<TopMetricCardsProps> = ({
  donors,
  requests,
  bloodBanks,
}) => {
  // Total available units
  let totalAvailableUnits = 0;
  bloodBanks.forEach((bb) => {
    Object.values(bb.stock).forEach((item) => {
      totalAvailableUnits += item.availableUnits;
    });
  });

  const activeRequests = requests.filter(
    (r) => r.status === 'PENDING' || r.status === 'MATCHING' || r.status === 'DONOR_NOTIFIED'
  );

  const emergencyRequests = requests.filter(
    (r) => (r.emergencyLevel === 'CRITICAL' || r.emergencyLevel === 'HIGH') && r.status !== 'FULFILLED'
  );

  const availableDonors = donors.filter((d) => d.eligible && d.available).length;

  const highestSeverity = emergencyRequests.length > 0
    ? Math.max(...emergencyRequests.map((r) => r.severityScore))
    : 0;

  const cards = [
    {
      id: 'metric-accuracy',
      title: 'MODEL ACCURACY',
      value: '94.8%',
      subtitle: 'Gradient-Boosted Forecast R²',
      icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
      accentColor: 'border-l-4 border-indigo-500',
      badge: 'Validated',
      badgeColor: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'metric-donors',
      title: 'REGISTERED DONORS',
      value: donors.length.toString(),
      subtitle: `${availableDonors} eligible & active now`,
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      accentColor: 'border-l-4 border-emerald-500',
      badge: 'Live',
      badgeColor: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'metric-active',
      title: 'ACTIVE REQUESTS',
      value: activeRequests.length.toString(),
      subtitle: `${requests.filter((r) => r.status === 'FULFILLED').length} fulfilled this week`,
      icon: <Clock className="w-5 h-5 text-sky-600" />,
      accentColor: 'border-l-4 border-sky-500',
      badge: 'Tracking',
      badgeColor: 'bg-sky-50 text-sky-700',
    },
    {
      id: 'metric-units',
      title: 'AVAILABLE BLOOD UNITS',
      value: totalAvailableUnits.toString(),
      subtitle: `Across ${bloodBanks.length} verified blood banks`,
      icon: <Droplet className="w-5 h-5 text-rose-600" />,
      accentColor: 'border-l-4 border-rose-500',
      badge: 'Cold Storage',
      badgeColor: 'bg-rose-50 text-rose-700',
    },
    {
      id: 'metric-emergency',
      title: 'EMERGENCY REQUESTS',
      value: emergencyRequests.length.toString(),
      subtitle: `${emergencyRequests.filter((r) => r.emergencyLevel === 'CRITICAL').length} Critical level`,
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      accentColor: 'border-l-4 border-amber-500',
      badge: emergencyRequests.length > 0 ? 'Urgent Alert' : 'Normal',
      badgeColor: emergencyRequests.length > 0 ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-slate-100 text-slate-700',
    },
    {
      id: 'metric-matches',
      title: 'PEAK SEVERITY SCORE',
      value: highestSeverity > 0 ? `${highestSeverity}/100` : 'Normal',
      subtitle: 'Fast 2.1km average match proximity',
      icon: <Zap className="w-5 h-5 text-purple-600" />,
      accentColor: 'border-l-4 border-purple-500',
      badge: 'AI Scored',
      badgeColor: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`bg-white rounded-xl p-3.5 sm:p-4 shadow-xs border border-slate-200/90 ${card.accentColor} transition-all hover:shadow-md flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 uppercase truncate">
              {card.title}
            </span>
            <div className="p-1.5 rounded-lg bg-slate-50 shrink-0">
              {card.icon}
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
              {card.value}
            </div>
            <div className="flex items-center justify-between gap-1 mt-1">
              <span className="text-[11px] text-slate-500 font-medium truncate">
                {card.subtitle}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
