export type UserRole = 'DONOR' | 'HOSPITAL' | 'BLOOD_BANK' | 'ADMIN';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type EmergencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RequestStatus = 'PENDING' | 'MATCHING' | 'DONOR_NOTIFIED' | 'DONOR_ACCEPTED' | 'FULFILLED' | 'CANCELLED';

export type CaseType =
  | 'Accident & Trauma'
  | 'Emergency Surgery'
  | 'Postpartum Hemorrhage'
  | 'Cancer & Oncology'
  | 'Thalassemia / Anemia'
  | 'Cardiovascular Surgery'
  | 'ICU Resuscitation'
  | 'Routine Transfusion';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  district: string;
  city: string;
  address: string;
  pincode?: string;
}

export interface Donor {
  id: string;
  donorId: string;
  name: string;
  email: string;
  phone: string; // Masked for privacy in unauthorized views
  bloodGroup: BloodGroup;
  dateOfBirth: string;
  gender?: 'Male' | 'Female' | 'Other';
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  lastDonationDate: string; // YYYY-MM-DD
  eligible: boolean; // Auto-calculated (last donation > 90 days)
  available: boolean; // "Available for Emergency Donation" toggle
  verified: boolean;
  emergencyNotificationsEnabled: boolean;
  donationCount: number;
  createdAt: string;
  donationHistory: {
    id: string;
    date: string;
    hospitalOrCamp: string;
    units: number;
    bloodGroup: BloodGroup;
  }[];
}

export interface Hospital {
  id: string;
  hospitalId: string;
  hospitalName: string;
  registrationId: string;
  email: string;
  phone: string;
  emergencyContact: string;
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  verified: boolean;
  bedsCount?: number;
  type?: 'Government' | 'Private' | 'Charity';
  createdAt: string;
}

export interface BloodStockItem {
  bloodGroup: BloodGroup;
  availableUnits: number;
  reservedUnits: number;
  expiredUnits: number;
  lastUpdated: string;
  storageStatus: 'NORMAL' | 'LOW' | 'CRITICAL';
}

export interface BloodBank {
  id: string;
  bloodBankId: string;
  name: string;
  registrationId: string;
  licenseNumber?: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  verified: boolean;
  operatingHours: string;
  stock: Record<BloodGroup, BloodStockItem>;
  createdAt: string;
}

export interface BloodRequest {
  id: string;
  requestId: string;
  hospitalId: string;
  hospitalName: string;
  patientId: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospitalLocation: string;
  district: string;
  latitude: number;
  longitude: number;
  requiredDate: string;
  requiredTime: string;
  caseType: CaseType;
  emergencyLevel: EmergencyLevel;
  severityScore: number; // 0-100 AI calculated
  additionalNotes?: string;
  status: RequestStatus;
  createdAt: string;
  respondedDonorId?: string;
  respondedDonorName?: string;
  respondedAt?: string;
  reservedBloodBankId?: string;
  fulfilledAt?: string;
}

export interface DonorMatch {
  matchId: string;
  requestId: string;
  donorId: string;
  donorName: string;
  donorBloodGroup: BloodGroup;
  distanceKm: number;
  compatibility: boolean;
  eligibility: boolean;
  availability: boolean;
  matchScore: number; // 0-100
  scoreBreakdown: {
    compatibilityScore: number; // max 40
    distanceScore: number;      // max 25
    eligibilityScore: number;   // max 20
    availabilityScore: number;  // max 10
    responseScore: number;      // max 5
  };
  reasons: string[];
  status: 'IDENTIFIED' | 'NOTIFIED' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  notificationId: string;
  receiverId: string; // 'ALL', donorId, hospitalId, bloodBankId, or 'ADMIN'
  receiverRole?: UserRole | 'ALL';
  requestId?: string;
  type:
    | 'EMERGENCY_REQUEST'
    | 'DONOR_MATCH_FOUND'
    | 'BLOOD_BANK_STOCK_AVAILABLE'
    | 'REQUEST_ACCEPTED'
    | 'REQUEST_FULFILLED'
    | 'REQUEST_CANCELLED'
    | 'AVAILABILITY_UPDATE';
  title: string;
  message: string;
  priority: EmergencyLevel;
  read: boolean;
  createdAt: string;
  data?: {
    bloodGroup?: BloodGroup;
    hospitalName?: string;
    distanceKm?: number;
    unitsRequired?: number;
    severityScore?: number;
  };
}

export interface DemandPrediction {
  id: string;
  district: string;
  bloodGroup: BloodGroup;
  currentStock: number;
  predictedDemand: number;
  historicalAverageDemand: number;
  deficitOrSurplus: number; // currentStock - predictedDemand
  riskLevel: 'NORMAL' | 'MODERATE_SHORTAGE' | 'CRITICAL_SHORTAGE';
  confidenceScore: number; // e.g. 94.8%
  forecastPeriod: 'WEEKLY' | 'MONTHLY';
  keyDrivers: string[];
}

export interface SystemLog {
  id: string;
  timestamp: string;
  actorRole: UserRole | 'SYSTEM';
  actorName: string;
  action: string;
  details: string;
  level: 'INFO' | 'WARN' | 'WARNING' | 'EMERGENCY' | 'CRITICAL';
}

export type AuditLog = SystemLog;

export interface CurrentUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  donorProfile?: Donor;
  hospitalProfile?: Hospital;
  bloodBankProfile?: BloodBank;
}
