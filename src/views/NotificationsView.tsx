import React, { useState } from 'react';
import {
  Bell,
  Check,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Info,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Heart,
  Warehouse,
  Droplet,
} from 'lucide-react';
import { AppNotification, BloodRequest } from '../types';
import { db } from '../services/db';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onSelectNotification?: (notification: AppNotification) => void;
  onNavigateToRequest?: (req: BloodRequest) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onSelectNotification,
  onNavigateToRequest,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'CRITICAL' | 'MATCHES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleMarkAllRead = () => {
    db.markAllNotificationsAsRead();
  };

  const filteredNotifications = notifications.filter((n) => {
    // Tab filter
    if (filterTab === 'UNREAD' && n.read) return false;
    if (filterTab === 'CRITICAL' && n.priority !== 'CRITICAL' && n.priority !== 'HIGH') return false;
    if (filterTab === 'MATCHES' && n.type !== 'DONOR_MATCH_FOUND' && n.type !== 'BLOOD_BANK_STOCK_AVAILABLE') {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.data?.hospitalName && n.data.hospitalName.toLowerCase().includes(q)) ||
        (n.data?.bloodGroup && n.data.bloodGroup.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalCount = notifications.filter((n) => n.priority === 'CRITICAL' || n.priority === 'HIGH').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Emergency Transfusion Notification Center
            </h2>
            <p className="text-xs text-slate-500">
              Click any notification to open full clinical details, linked requisitions, and action controls
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilterTab('UNREAD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterTab === 'UNREAD'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilterTab('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterTab === 'CRITICAL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🚨 Urgent / High ({criticalCount})
          </button>
          <button
            onClick={() => setFilterTab('MATCHES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterTab === 'MATCHES'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Matches & Inventory
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-56 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-slate-100 mt-2">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No notifications match your current filter</p>
            <p className="text-[11px] text-slate-400">
              When emergency blood requests, donor matches, or stock updates occur, they appear here instantly.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isCritical = n.priority === 'CRITICAL';
            const isHigh = n.priority === 'HIGH';

            return (
              <div
                key={n.id}
                onClick={() => {
                  db.markNotificationAsRead(n.id);
                  onSelectNotification?.(n);
                }}
                className={`p-4 rounded-xl my-1.5 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group border hover:border-rose-300 hover:shadow-xs ${
                  !n.read
                    ? 'bg-rose-50/50 border-rose-200 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      n.type === 'EMERGENCY_REQUEST'
                        ? 'bg-rose-600 text-white shadow-xs shadow-rose-200'
                        : n.type === 'DONOR_MATCH_FOUND'
                        ? 'bg-purple-600 text-white shadow-xs shadow-purple-200'
                        : n.type === 'BLOOD_BANK_STOCK_AVAILABLE'
                        ? 'bg-amber-600 text-white shadow-xs shadow-amber-200'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {n.type === 'EMERGENCY_REQUEST' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : n.type === 'DONOR_MATCH_FOUND' ? (
                      <Heart className="w-4 h-4" />
                    ) : n.type === 'BLOOD_BANK_STOCK_AVAILABLE' ? (
                      <Warehouse className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition-colors">
                        {n.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isHigh
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {n.priority}
                      </span>
                      {!n.read && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 font-mono">
                      <span>
                        {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        •{' '}
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {n.data?.bloodGroup && (
                        <span className="font-sans font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                          Group: {n.data.bloodGroup}
                        </span>
                      )}
                      {n.data?.hospitalName && (
                        <span className="font-sans text-slate-500 truncate max-w-[200px]">
                          {n.data.hospitalName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div
                  className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      db.markNotificationAsRead(n.id);
                      onSelectNotification?.(n);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <span>Open Message</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (n.read) db.markNotificationAsUnread(n.id);
                      else db.markNotificationAsRead(n.id);
                    }}
                    title={n.read ? 'Mark as Unread' : 'Mark as Read'}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    {n.read ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => db.deleteNotification(n.id)}
                    title="Delete Notification"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
