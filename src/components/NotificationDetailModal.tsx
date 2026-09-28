import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Bell,
  Heart,
  Building2,
  Warehouse,
  MapPin,
  Calendar,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ExternalLink,
  Activity,
  Droplet,
  Radio,
  Clock,
  Send,
  EyeOff,
  Users,
} from 'lucide-react';
import { AppNotification, BloodRequest, CurrentUser, Donor } from '../types';
import { db } from '../services/db';
import { isBloodCompatible } from '../services/matching';

interface NotificationDetailModalProps {
  notification: AppNotification | null;
  onClose: () => void;
  currentUser: CurrentUser | null;
  onNavigateToRequest?: (req: BloodRequest) => void;
  onOpenAlertModal?: (req: BloodRequest) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  onClose,
  currentUser,
  onNavigateToRequest,
  onOpenAlertModal,
}) => {
  if (!notification) return null;

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Find linked blood request if available
  const allRequests = db.getRequests();
  const linkedRequest = notification.requestId
    ? allRequests.find((r) => r.id === notification.requestId)
    : null;

  const allDonors = db.getDonors();
  const compatibleDonors = linkedRequest
    ? allDonors.filter(
        (d) => isBloodCompatible(linkedRequest.bloodGroup, d.bloodGroup) && d.eligible && d.available
      )
    : [];

  const donorProfile: Donor | undefined = currentUser?.donorProfile;
  const activeDonor =
    donorProfile && linkedRequest && isBloodCompatible(linkedRequest.bloodGroup, donorProfile.bloodGroup)
      ? donorProfile
      : compatibleDonors[0] || allDonors[0];

  const handleToggleRead = () => {
    if (notification.read) {
      db.markNotificationAsUnread(notification.id);
    } else {
      db.markNotificationAsRead(notification.id);
    }
  };

  const handleDelete = () => {
    db.deleteNotification(notification.id);
    onClose();
  };

  const handleAcceptRequest = () => {
    if (linkedRequest && activeDonor) {
      db.respondToRequest(linkedRequest.id, activeDonor.id, 'ACCEPT');
      setFeedbackMsg(`✓ Request #${linkedRequest.requestId} accepted! Donor ${activeDonor.name} (${activeDonor.bloodGroup}) committed to fulfill.`);
    }
  };

  const handleDeclineRequest = () => {
    if (linkedRequest && activeDonor) {
      db.respondToRequest(linkedRequest.id, activeDonor.id, 'DECLINE');
      setFeedbackMsg(`Marked as unavailable for Request #${linkedRequest.requestId}.`);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          border: 'border-rose-300',
          accent: 'text-rose-600',
          headerBg: 'from-rose-600 to-red-700',
        };
      case 'HIGH':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          border: 'border-amber-300',
          accent: 'text-amber-600',
          headerBg: 'from-amber-600 to-orange-700',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          border: 'border-blue-300',
          accent: 'text-blue-600',
          headerBg: 'from-blue-600 to-indigo-700',
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-700 border-slate-300',
          border: 'border-slate-200',
          accent: 'text-slate-600',
          headerBg: 'from-slate-700 to-slate-800',
        };
    }
  };

  const priorityStyle = getPriorityStyle(notification.priority);
  const isAccepted = linkedRequest?.status === 'DONOR_ACCEPTED';
  const isFulfilled = linkedRequest?.status === 'FULFILLED';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dynamic Header */}
        <div className={`bg-gradient-to-r ${priorityStyle.headerBg} p-5 text-white flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-white/20">
              {notification.type === 'EMERGENCY_REQUEST' ? (
                <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
              ) : notification.type === 'DONOR_MATCH_FOUND' ? (
                <Heart className="w-5 h-5 text-white" />
              ) : notification.type === 'BLOOD_BANK_STOCK_AVAILABLE' ? (
                <Warehouse className="w-5 h-5 text-white" />
              ) : (
                <Bell className="w-5 h-5 text-white" />
              )}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/20">
                  {notification.priority} PRIORITY
                </span>
                <span className="text-[11px] opacity-80">
                  {notification.notificationId}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 leading-tight">
                Notification Details
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Title & Timestamp */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {notification.title}
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${priorityStyle.badge}`}>
                {notification.priority}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {new Date(notification.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                at{' '}
                {new Date(notification.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span>•</span>
              <span className="text-slate-600 font-medium">
                {notification.read ? 'Status: Read' : 'Status: Unread'}
              </span>
            </div>
          </div>

          {/* Full Message Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-line">
            {notification.message}
          </div>

          {/* Feedback Banner if action performed */}
          {feedbackMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Linked Blood Request Card */}
          {linkedRequest && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                    Linked Emergency Requisition #{linkedRequest.requestId}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  isAccepted
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : isFulfilled
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-white text-rose-700 border-rose-200'
                }`}>
                  {linkedRequest.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                  <div className="text-[10px] text-slate-500">Blood Group Needed</div>
                  <div className="text-base font-black text-rose-600 mt-0.5">
                    {linkedRequest.bloodGroup}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                  <div className="text-[10px] text-slate-500">Units Required</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {linkedRequest.unitsRequired} Units
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                  <div className="text-[10px] text-slate-500">AI Severity Score</div>
                  <div className="text-base font-black text-indigo-700 mt-0.5">
                    {linkedRequest.severityScore}/100
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{linkedRequest.hospitalName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{linkedRequest.hospitalLocation} ({linkedRequest.district})</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span>Clinical Case: <strong>{linkedRequest.caseType}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Patient ID: <strong>{linkedRequest.patientId}</strong></span>
                </div>
                {linkedRequest.respondedDonorName && (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Donor Committed: {linkedRequest.respondedDonorName}</span>
                  </div>
                )}
                {linkedRequest.additionalNotes && (
                  <p className="text-[11px] italic text-slate-500 mt-1 bg-white/70 p-2 rounded border border-rose-100">
                    "{linkedRequest.additionalNotes}"
                  </p>
                )}
              </div>

              {/* Action Buttons for Linked Request: Accept is always accessible! */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {!isFulfilled && (
                  <>
                    <button
                      onClick={handleAcceptRequest}
                      disabled={isAccepted}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-white shadow-xs transition-all active:scale-98 cursor-pointer ${
                        isAccepted
                          ? 'bg-emerald-600 opacity-90'
                          : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isAccepted
                          ? `✓ Accepted by ${linkedRequest.respondedDonorName || 'Donor'}`
                          : `Accept Request (as ${activeDonor?.name || 'Compatible Donor'})`}
                      </span>
                    </button>

                    {!isAccepted && (
                      <button
                        onClick={handleDeclineRequest}
                        className="py-2 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                      >
                        Decline
                      </button>
                    )}
                  </>
                )}

                {onNavigateToRequest && (
                  <button
                    onClick={() => {
                      onNavigateToRequest(linkedRequest);
                      onClose();
                    }}
                    className="flex items-center gap-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>Smart Matching</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {onOpenAlertModal && (
                  <button
                    onClick={() => {
                      onOpenAlertModal(linkedRequest);
                      onClose();
                    }}
                    className="flex items-center gap-1 py-2 px-3 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Broadcast Alert</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Notification Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleRead}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium py-1 px-2 rounded hover:bg-slate-100 cursor-pointer"
              >
                {notification.read ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mark as Unread</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mark as Read</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium py-1 px-2 rounded hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
