import React from 'react';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Package,
  AlertOctagon,
  Building2,
  Warehouse,
  HeartHandshake,
  Bell,
  History,
  User,
  LogOut,
  Sparkles,
  MapPin,
  Shield,
} from 'lucide-react';
import { CurrentUser, UserRole } from '../types';

export type NavTab =
  | 'DASHBOARD'
  | 'DONOR_MATCHING'
  | 'DEMAND_PREDICTION'
  | 'BLOOD_INVENTORY'
  | 'EMERGENCY_REQUESTS'
  | 'MAP_VIEW'
  | 'HOSPITALS'
  | 'BLOOD_BANKS'
  | 'DONORS'
  | 'NOTIFICATIONS'
  | 'REQUEST_HISTORY'
  | 'PROFILE'
  | 'ADMIN_PANEL';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: CurrentUser | null;
  onLogout: () => void;
  emergencyCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  emergencyCount,
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number | string; roleRequired?: UserRole[] }[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'DONOR_MATCHING', label: 'Smart Donor Match', icon: <Users className="w-4 h-4" /> },
    { id: 'DEMAND_PREDICTION', label: 'Demand Prediction (ML)', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'BLOOD_INVENTORY', label: 'Blood Inventory', icon: <Package className="w-4 h-4" /> },
    {
      id: 'EMERGENCY_REQUESTS',
      label: 'Emergency Requests',
      icon: <AlertOctagon className="w-4 h-4" />,
      badge: emergencyCount > 0 ? emergencyCount : undefined,
    },
    { id: 'MAP_VIEW', label: 'Live Geo Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'HOSPITALS', label: 'Hospitals', icon: <Building2 className="w-4 h-4" /> },
    { id: 'BLOOD_BANKS', label: 'Blood Banks', icon: <Warehouse className="w-4 h-4" /> },
    { id: 'DONORS', label: 'Registered Donors', icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'NOTIFICATIONS', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'REQUEST_HISTORY', label: 'Request History', icon: <History className="w-4 h-4" /> },
    { id: 'PROFILE', label: 'My Profile', icon: <User className="w-4 h-4" /> },
  ];

  if (currentUser?.role === 'ADMIN') {
    menuItems.push({
      id: 'ADMIN_PANEL',
      label: 'Admin System Oversight',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      badge: 'Admin',
    });
  }

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-screen">
      {/* Top Sidebar Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/40">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              HAEMA-AI CONNECT
            </h2>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Smart Transfusion Cloud
            </p>
          </div>
        </div>

        {/* Role Quick Indicator Card */}
        <div className="mt-3.5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Signed In As:</div>
            <div className="text-xs font-semibold text-white truncate max-w-[140px]">
              {currentUser?.name || 'Guest User'}
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/30">
            {currentUser?.role || 'VIEWER'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          Navigation Modules
        </div>
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-rose-600 text-white font-semibold shadow-sm shadow-rose-900/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white text-rose-700'
                      : 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom User / System Info & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90">
        <div className="px-3 py-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>AI Engine Version</span>
          <span className="font-mono text-slate-400 text-[10px]">v2.6.4 ML</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full mt-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-800/80 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Switch Role / Sign Out
        </button>
      </div>
    </aside>
  );
};
