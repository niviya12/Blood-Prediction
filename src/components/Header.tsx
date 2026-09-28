import React, { useState, useEffect } from 'react';
import {
  Bell,
  Heart,
  ShieldCheck,
  Building2,
  Warehouse,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { db } from '../services/db';
import { AppNotification, CurrentUser, UserRole } from '../types';

interface HeaderProps {
  currentUser: CurrentUser | null;
  onOpenAuthModal?: () => void;
  onOpenRoleSwitcher?: () => void;
  onOpenCreateRequest: () => void;
  onOpenNotifications?: () => void;
  onSelectNotification?: (notification: AppNotification) => void;
  onStartSimulation?: () => void;
  notifications?: AppNotification[];
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuthModal,
  onOpenRoleSwitcher,
  onOpenCreateRequest,
  onOpenNotifications,
  onSelectNotification,
  onStartSimulation,
  notifications: passedNotifications,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(passedNotifications || []);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(true);

  const handleOpenAuthOrRole = onOpenRoleSwitcher || onOpenAuthModal || (() => {});

  useEffect(() => {
    if (passedNotifications) {
      setNotifications(passedNotifications);
    }
  }, [passedNotifications]);

  useEffect(() => {
    const update = () => {
      setNotifications(db.getNotifications());
    };
    update();
    return db.subscribe(update);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalRequests = db
    .getRequests()
    .filter((r) => (r.emergencyLevel === 'CRITICAL' || r.emergencyLevel === 'HIGH') && r.status === 'PENDING');

  const handleRoleSwitch = (role: UserRole) => {
    db.switchRole(role);
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'DONOR':
        return {
          label: 'Donor Portal',
          icon: <Heart className="w-3.5 h-3.5 text-rose-500" />,
          bgColor: 'bg-rose-50 border-rose-200 text-rose-700',
        };
      case 'HOSPITAL':
        return {
          label: 'Hospital Unit',
          icon: <Building2 className="w-3.5 h-3.5 text-sky-500" />,
          bgColor: 'bg-sky-50 border-sky-200 text-sky-700',
        };
      case 'BLOOD_BANK':
        return {
          label: 'Blood Bank Hub',
          icon: <Warehouse className="w-3.5 h-3.5 text-amber-500" />,
          bgColor: 'bg-amber-50 border-amber-200 text-amber-700',
        };
      case 'ADMIN':
        return {
          label: 'System Overseer',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />,
          bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        };
      default:
        return {
          label: 'Guest Access',
          icon: <UserCheck className="w-3.5 h-3.5 text-slate-500" />,
          bgColor: 'bg-slate-50 border-slate-200 text-slate-700',
        };
    }
  };

  const badge = getRoleBadge(currentUser?.role);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Critical Emergency Banner Ticker */}
      {showEmergencyBanner && criticalRequests.length > 0 && (
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 max-w-5xl truncate">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="font-semibold uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded text-[10px]">
              CRITICAL EMERGENCY DISPATCH
            </span>
            <span className="truncate">
              {criticalRequests[0].hospitalName} requires {criticalRequests[0].unitsRequired} units of{' '}
              <strong className="underline decoration-white font-black text-amber-200 text-sm">
                {criticalRequests[0].bloodGroup}
              </strong>{' '}
              ({criticalRequests[0].caseType}). AI Smart Matching is searching active donors.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenCreateRequest}
              className="bg-white text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded font-semibold text-[11px] transition-colors"
            >
              View Match Details
            </button>
            <button
              onClick={() => setShowEmergencyBanner(false)}
              className="text-white/80 hover:text-white p-0.5"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left branding & title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-200 shrink-0">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                AI-Based Blood Requirement Prediction & Smart Donor Matching
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" /> Live Central Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Real-Time Blood Demand • Smart Matching • Emergency Response
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick 1-Click Role Switcher */}
          <div className="hidden xl:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-[11px] font-medium text-slate-500 px-2">Role:</span>
            {(['DONOR', 'HOSPITAL', 'BLOOD_BANK', 'ADMIN'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleSwitch(r)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  currentUser?.role === r
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'DONOR'
                  ? 'Donor'
                  : r === 'HOSPITAL'
                  ? 'Hospital'
                  : r === 'BLOOD_BANK'
                  ? 'Blood Bank'
                  : 'Admin'}
              </button>
            ))}
          </div>

          {/* New Request Button */}
          <button
            onClick={onOpenCreateRequest}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all active:scale-98"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Request Blood</span>
            <span className="sm:hidden">Request</span>
          </button>

          {/* Real-time Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-rose-600" />
                    <span className="font-semibold text-xs text-slate-800">
                      Real-Time Notifications ({unreadCount} new)
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => db.markAllNotificationsAsRead()}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          db.markNotificationAsRead(n.id);
                          onSelectNotification?.(n);
                          setShowNotifMenu(false);
                        }}
                        className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 relative group ${
                          !n.read ? 'bg-rose-50/40 font-medium' : 'text-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              n.priority === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : n.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {n.priority}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900 text-xs group-hover:text-rose-600 transition-colors">{n.title}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Click to open details</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    Click message to open
                  </span>
                  {onOpenNotifications && (
                    <button
                      onClick={() => {
                        onOpenNotifications();
                        setShowNotifMenu(false);
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 py-0.5 px-2 rounded hover:bg-rose-50 transition-colors"
                    >
                      <span>Notification Center</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill / Auth */}
          <div
            onClick={handleOpenAuthOrRole}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                {currentUser?.name || 'Sign In'}
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <span className={`inline-flex items-center gap-1 font-semibold px-1 rounded ${badge.bgColor}`}>
                  {badge.icon} {badge.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
