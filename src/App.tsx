import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertOctagon,
  Plus,
  Play,
  Layers,
  Users,
  Compass,
  Building2,
  Warehouse,
  History,
  CheckCircle2,
  RefreshCw,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { db } from './services/db';
import {
  BloodRequest,
  Donor,
  BloodBank,
  Hospital,
  AppNotification,
  AuditLog,
  CurrentUser,
  UserRole,
} from './types';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopMetricCards } from './components/TopMetricCards';
import { BloodInventoryCards } from './components/BloodInventoryCards';
import { InteractiveMap } from './components/InteractiveMap';
import { MatchedDonorsList } from './components/MatchedDonorsList';
import { CreateRequestModal } from './components/CreateRequestModal';
import { EmergencyAlertModal } from './components/EmergencyAlertModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { SimulationWalkthroughModal } from './components/SimulationWalkthroughModal';
import { NotificationDetailModal } from './components/NotificationDetailModal';

// Views
import { DemandPredictionView } from './views/DemandPredictionView';
import { DonorDashboardView } from './views/DonorDashboardView';
import { HospitalDashboardView } from './views/HospitalDashboardView';
import { BloodBankDashboardView } from './views/BloodBankDashboardView';
import { AdminPanelView } from './views/AdminPanelView';
import { NotificationsView } from './views/NotificationsView';
import { RequestHistoryView } from './views/RequestHistoryView';
import { ProfileView } from './views/ProfileView';

export default function App() {
  // Central DB State
  const [requests, setRequests] = useState<BloodRequest[]>(db.getRequests());
  const [donors, setDonors] = useState<Donor[]>(db.getDonors());
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>(db.getBloodBanks());
  const [hospitals, setHospitals] = useState<Hospital[]>(db.getHospitals());
  const [notifications, setNotifications] = useState<AppNotification[]>(db.getNotifications());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(db.getAuditLogs());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(db.getCurrentUser());

  // Navigation & UI State
  const [currentTab, setCurrentTab] = useState<NavTab>('DASHBOARD');
  const [selectedRequestForMatch, setSelectedRequestForMatch] = useState<BloodRequest>(
    requests[0] || null
  );

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [activeAlertRequest, setActiveAlertRequest] = useState<BloodRequest | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  // Subscribe to real-time database changes
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setRequests([...db.getRequests()]);
      setDonors([...db.getDonors()]);
      setBloodBanks([...db.getBloodBanks()]);
      setHospitals([...db.getHospitals()]);
      setNotifications([...db.getNotifications()]);
      setAuditLogs([...db.getAuditLogs()]);
      setCurrentUser(db.getCurrentUser());
    });

    return () => unsubscribe();
  }, []);

  // Update selected request if deleted or updated
  useEffect(() => {
    if (requests.length > 0 && (!selectedRequestForMatch || !requests.find((r) => r.id === selectedRequestForMatch.id))) {
      setSelectedRequestForMatch(requests[0]);
    }
  }, [requests]);

  const handleSwitchRole = (role: UserRole) => {
    db.switchRole(role);
    // If switching to DONOR or HOSPITAL or BLOOD_BANK, route to appropriate view for best UX
    if (role === 'DONOR') setCurrentTab('DONORS');
    else if (role === 'HOSPITAL') setCurrentTab('HOSPITALS');
    else if (role === 'BLOOD_BANK') setCurrentTab('BLOOD_BANKS');
    else if (role === 'ADMIN') setCurrentTab('ADMIN_PANEL');
  };

  const handleRequestCreated = (reqId: string) => {
    const created = db.getRequests().find((r) => r.id === reqId);
    if (created) {
      setSelectedRequestForMatch(created);
      // Auto open alert modal for demonstration
      setActiveAlertRequest(created);
    }
  };

  const emergencyCount = requests.filter(
    (r) => (r.emergencyLevel === 'CRITICAL' || r.emergencyLevel === 'HIGH') && r.status !== 'FULFILLED'
  ).length;

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans antialiased">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={() => setIsRoleModalOpen(true)}
        emergencyCount={emergencyCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Navigation Header */}
        <Header
          currentUser={currentUser}
          notifications={notifications}
          onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
          onOpenCreateRequest={() => setIsCreateModalOpen(true)}
          onOpenNotifications={() => setCurrentTab('NOTIFICATIONS')}
          onSelectNotification={(n) => setSelectedNotification(n)}
          onStartSimulation={() => setIsSimulationOpen(true)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Quick Simulation Banner if on Dashboard */}
            {currentTab === 'DASHBOARD' && (
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-950/60">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-wide">
                      AI-Based Blood Demand Prediction & Smart Donor Dispatch
                    </h3>
                    <p className="text-xs text-slate-300">
                      Real-time prototype connecting hospitals, certified blood banks, and verified donors
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSimulationOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all active:scale-98"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Run 7-Step Emergency Simulation</span>
                  </button>
                  <button
                    onClick={() => setIsRoleModalOpen(true)}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    Switch Role ({currentUser?.role})
                  </button>
                </div>
              </div>
            )}

            {/* TAB: DASHBOARD (Unified High-Level Operations) */}
            {currentTab === 'DASHBOARD' && (
              <>
                {/* 6 Top Metric Cards */}
                <TopMetricCards
                  donors={donors}
                  requests={requests}
                  bloodBanks={bloodBanks}
                />

                {/* Live Blood Inventory (8 groups) */}
                <BloodInventoryCards
                  bloodBanks={bloodBanks}
                  userRole={currentUser?.role}
                />

                {/* Interactive Leaflet Map with Radius Search */}
                <InteractiveMap
                  donors={donors}
                  hospitals={hospitals}
                  bloodBanks={bloodBanks}
                  requests={requests}
                  onSelectDonor={(d) => {
                    // Navigate to donors tab or preview
                  }}
                  onSelectHospital={(h) => {
                    setCurrentTab('HOSPITALS');
                  }}
                  onSelectBloodBank={(b) => {
                    setCurrentTab('BLOOD_BANKS');
                  }}
                />

                {/* Smart Donor Matching Engine for Active Urgent Request */}
                {selectedRequestForMatch && (
                  <MatchedDonorsList
                    request={selectedRequestForMatch}
                    donors={donors}
                    userRole={currentUser?.role}
                    onDonorContacted={(donorId) => {
                      // refresh state
                    }}
                  />
                )}
              </>
            )}

            {/* TAB: SMART DONOR MATCH */}
            {currentTab === 'DONOR_MATCHING' && (
              <div className="space-y-4">
                {/* Request Selector */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Smart Donor Matching Engine
                    </h3>
                    <p className="text-slate-500 text-xs">
                      Select an active clinical requisition to rank nearby donors by compatibility, distance, eligibility, and availability
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">Requisition:</span>
                    <select
                      value={selectedRequestForMatch?.id || ''}
                      onChange={(e) => {
                        const found = requests.find((r) => r.id === e.target.value);
                        if (found) setSelectedRequestForMatch(found);
                      }}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 text-xs"
                    >
                      {requests.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.requestId} ({r.hospitalName} - {r.unitsRequired}u {r.bloodGroup})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedRequestForMatch && (
                  <MatchedDonorsList
                    request={selectedRequestForMatch}
                    donors={donors}
                    userRole={currentUser?.role}
                  />
                )}
              </div>
            )}

            {/* TAB: DEMAND PREDICTION (ML) */}
            {currentTab === 'DEMAND_PREDICTION' && (
              <DemandPredictionView bloodBanks={bloodBanks} />
            )}

            {/* TAB: BLOOD INVENTORY */}
            {currentTab === 'BLOOD_INVENTORY' && (
              <div className="space-y-6">
                <BloodInventoryCards
                  bloodBanks={bloodBanks}
                  userRole={currentUser?.role}
                />
              </div>
            )}

            {/* TAB: EMERGENCY REQUESTS */}
            {currentTab === 'EMERGENCY_REQUESTS' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Emergency & Critical Blood Requisitions
                    </h3>
                    <p className="text-xs text-slate-500">
                      High-severity transfusion cases requiring immediate cold-chain courier or voluntary donor dispatch
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Emergency Request</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 mt-3">
                  {requests
                    .filter((r) => r.status !== 'FULFILLED')
                    .map((req) => (
                      <div
                        key={req.id}
                        className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                            {req.bloodGroup}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{req.hospitalName}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  req.emergencyLevel === 'CRITICAL'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {req.emergencyLevel}
                              </span>
                              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                AI Score: {req.severityScore}/100
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                              Req #{req.requestId} • Case: <strong>{req.caseType}</strong> • Required: <strong>{req.unitsRequired} Units</strong> • Location: {req.hospitalLocation}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedRequestForMatch(req);
                              setCurrentTab('DONOR_MATCHING');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                          >
                            Find Donors
                          </button>
                          <button
                            onClick={() => setActiveAlertRequest(req)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                          >
                            Broadcast Alert
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB: MAP VIEW */}
            {currentTab === 'MAP_VIEW' && (
              <InteractiveMap
                donors={donors}
                hospitals={hospitals}
                bloodBanks={bloodBanks}
                requests={requests}
              />
            )}

            {/* TAB: HOSPITALS */}
            {currentTab === 'HOSPITALS' && (
              <HospitalDashboardView
                currentUser={currentUser}
                requests={requests}
                donors={donors}
                bloodBanks={bloodBanks}
                hospitals={hospitals}
                onOpenCreateRequest={() => setIsCreateModalOpen(true)}
              />
            )}

            {/* TAB: BLOOD BANKS */}
            {currentTab === 'BLOOD_BANKS' && (
              <BloodBankDashboardView
                currentUser={currentUser}
                bloodBanks={bloodBanks}
                requests={requests}
                donors={donors}
              />
            )}

            {/* TAB: DONORS */}
            {currentTab === 'DONORS' && (
              <DonorDashboardView
                currentUser={currentUser}
                requests={requests}
                notifications={notifications}
                onOpenAlertModal={(req) => setActiveAlertRequest(req)}
                onSelectNotification={(n) => setSelectedNotification(n)}
              />
            )}

            {/* TAB: NOTIFICATIONS */}
            {currentTab === 'NOTIFICATIONS' && (
              <NotificationsView
                notifications={notifications}
                onSelectNotification={(n) => setSelectedNotification(n)}
                onNavigateToRequest={(req) => {
                  setSelectedRequestForMatch(req);
                  setCurrentTab('DONOR_MATCHING');
                }}
              />
            )}

            {/* TAB: REQUEST HISTORY */}
            {currentTab === 'REQUEST_HISTORY' && (
              <RequestHistoryView requests={requests} />
            )}

            {/* TAB: PROFILE */}
            {currentTab === 'PROFILE' && (
              <ProfileView currentUser={currentUser} />
            )}

            {/* TAB: ADMIN PANEL */}
            {currentTab === 'ADMIN_PANEL' && (
              <AdminPanelView
                hospitals={hospitals}
                bloodBanks={bloodBanks}
                donors={donors}
                auditLogs={auditLogs}
              />
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Create Emergency Blood Request Modal (with live AI severity calculation) */}
      <CreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        hospitals={hospitals}
        currentHospitalId={currentUser?.hospitalProfile?.id}
        onRequestCreated={handleRequestCreated}
      />

      {/* 2. Emergency Alert Modal (Donor / Blood Bank response) */}
      <EmergencyAlertModal
        request={activeAlertRequest}
        currentUser={currentUser}
        onClose={() => setActiveAlertRequest(null)}
      />

      {/* 3. Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUser={currentUser}
        onSelectRole={handleSwitchRole}
        onStartSimulation={() => setIsSimulationOpen(true)}
      />

      {/* 4. 7-Step Guided End-to-End Simulation Walkthrough Modal */}
      <SimulationWalkthroughModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
      />

      {/* 5. Notification Detail Modal (Full message, clinical details, response actions) */}
      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        currentUser={currentUser}
        onNavigateToRequest={(req) => {
          setSelectedRequestForMatch(req);
          setCurrentTab('DONOR_MATCHING');
        }}
        onOpenAlertModal={(req) => setActiveAlertRequest(req)}
      />
    </div>
  );
}
