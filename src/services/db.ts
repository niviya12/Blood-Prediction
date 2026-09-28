import {
  Donor,
  Hospital,
  BloodBank,
  BloodRequest,
  BloodGroup,
  AppNotification,
  SystemLog,
  CurrentUser,
  EmergencyLevel,
  CaseType,
} from '../types';
import { calculateAISeverityScore } from './severity';
import { computeDonorMatch, findNearbyEligibleDonors } from './matching';

// Storage keys
const DB_STORAGE_KEY = 'ai_blood_network_db_v2';
const CURRENT_USER_KEY = 'ai_blood_network_user_v2';

export interface DatabaseState {
  donors: Donor[];
  hospitals: Hospital[];
  bloodBanks: BloodBank[];
  requests: BloodRequest[];
  notifications: AppNotification[];
  logs: SystemLog[];
}

// Initial 20 Realistic Donors
const INITIAL_DONORS: Donor[] = [
  {
    id: 'donor-1',
    donorId: 'DON-0101',
    name: 'Karthik Subramanian',
    email: 'karthik.s@example.com',
    phone: '+91 98421-45892',
    bloodGroup: 'O+',
    dateOfBirth: '1995-04-12',
    gender: 'Male',
    address: '14 Gandhi Road, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4578,
    longitude: 77.8012,
    lastDonationDate: '2026-04-10', // > 90 days ago -> Eligible
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 6,
    createdAt: '2024-01-15T10:00:00Z',
    donationHistory: [
      { id: 'dh-1', date: '2026-04-10', hospitalOrCamp: 'Sivakasi Rotary Blood Bank', units: 1, bloodGroup: 'O+' },
      { id: 'dh-2', date: '2025-11-05', hospitalOrCamp: 'Govt Headquarter Hospital', units: 1, bloodGroup: 'O+' },
    ],
  },
  {
    id: 'donor-2',
    donorId: 'DON-0102',
    name: 'Ananya Ramesh',
    email: 'ananya.r@example.com',
    phone: '+91 94432-88124',
    bloodGroup: 'O+',
    dateOfBirth: '1998-08-22',
    gender: 'Female',
    address: '28 Velayutham Road, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4625,
    longitude: 77.8105,
    lastDonationDate: '2026-02-18', // > 90 days -> Eligible
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 4,
    createdAt: '2024-02-10T11:00:00Z',
    donationHistory: [
      { id: 'dh-3', date: '2026-02-18', hospitalOrCamp: 'Sivakasi Medical Trust', units: 1, bloodGroup: 'O+' },
    ],
  },
  {
    id: 'donor-3',
    donorId: 'DON-0103',
    name: 'Venkatesh Murugan',
    email: 'venkat.m@example.com',
    phone: '+91 97890-11234',
    bloodGroup: 'O-',
    dateOfBirth: '1992-11-05',
    gender: 'Male',
    address: '8 Police Station Lane, Thiruthangal, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4750,
    longitude: 77.8150,
    lastDonationDate: '2026-01-14', // Universal donor! Eligible
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 8,
    createdAt: '2023-08-12T09:30:00Z',
    donationHistory: [
      { id: 'dh-4', date: '2026-01-14', hospitalOrCamp: 'Red Cross Emergency Reserve', units: 1, bloodGroup: 'O-' },
    ],
  },
  {
    id: 'donor-4',
    donorId: 'DON-0104',
    name: 'Priya Dharshini',
    email: 'priya.d@example.com',
    phone: '+91 99521-77890',
    bloodGroup: 'A+',
    dateOfBirth: '1996-03-30',
    gender: 'Female',
    address: '45 Kamaraj Nagar, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4480,
    longitude: 77.7950,
    lastDonationDate: '2026-05-20',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 3,
    createdAt: '2024-05-19T14:20:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-5',
    donorId: 'DON-0105',
    name: 'Mohamed Rafiq',
    email: 'm.rafiq@example.com',
    phone: '+91 98845-66712',
    bloodGroup: 'B+',
    dateOfBirth: '1991-09-14',
    gender: 'Male',
    address: '11 Mosque Street, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4510,
    longitude: 77.7990,
    lastDonationDate: '2026-03-01',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 5,
    createdAt: '2023-11-20T12:00:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-6',
    donorId: 'DON-0106',
    name: 'Deepak Selvaraj',
    email: 'deepak.s@example.com',
    phone: '+91 94421-33451',
    bloodGroup: 'AB+',
    dateOfBirth: '1997-07-19',
    gender: 'Male',
    address: '62 Chairman Shanmugam Rd, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4590,
    longitude: 77.8040,
    lastDonationDate: '2026-05-02',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 2,
    createdAt: '2024-03-11T16:00:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-7',
    donorId: 'DON-0107',
    name: 'Sangeetha Kannan',
    email: 'sangeetha.k@example.com',
    phone: '+91 97901-22879',
    bloodGroup: 'A-',
    dateOfBirth: '1999-12-04',
    gender: 'Female',
    address: '18 Railway Feeder Rd, Virudhunagar',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.5850,
    longitude: 77.9550,
    lastDonationDate: '2026-02-10',
    eligible: true,
    available: false, // marked unavailable
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 3,
    createdAt: '2024-01-28T09:00:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-8',
    donorId: 'DON-0108',
    name: 'Rajesh Natarajan',
    email: 'rajesh.n@example.com',
    phone: '+91 98433-99012',
    bloodGroup: 'O+',
    dateOfBirth: '1994-01-25',
    gender: 'Male',
    address: '90 Madurai Main Rd, Tirumangalam',
    district: 'Madurai',
    latitude: 9.8220,
    longitude: 77.9890,
    lastDonationDate: '2026-08-30', // Ineligible: donated 22 days ago (<90 days cooldown)
    eligible: false,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 7,
    createdAt: '2023-05-14T08:00:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-9',
    donorId: 'DON-0109',
    name: 'Meera Krishnan',
    email: 'meera.k@example.com',
    phone: '+91 96291-55423',
    bloodGroup: 'B-',
    dateOfBirth: '2000-05-18',
    gender: 'Female',
    address: '33 Anna Nagar, Madurai',
    district: 'Madurai',
    latitude: 9.9320,
    longitude: 78.1380,
    lastDonationDate: '2026-03-25',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 4,
    createdAt: '2024-04-01T15:00:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-10',
    donorId: 'DON-0110',
    name: 'Suresh Balaji',
    email: 'suresh.b@example.com',
    phone: '+91 98840-77123',
    bloodGroup: 'AB-',
    dateOfBirth: '1993-02-14',
    gender: 'Male',
    address: '5 West Masi Street, Madurai',
    district: 'Madurai',
    latitude: 9.9190,
    longitude: 78.1180,
    lastDonationDate: '2026-04-15',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 5,
    createdAt: '2023-09-09T10:15:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-11',
    donorId: 'DON-0111',
    name: 'Gowri Shankar',
    email: 'gowri.s@example.com',
    phone: '+91 94862-44129',
    bloodGroup: 'O+',
    dateOfBirth: '1989-10-10',
    gender: 'Male',
    address: '12 Bye-Pass Rd, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4540,
    longitude: 77.8080,
    lastDonationDate: '2026-03-12',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 9,
    createdAt: '2023-03-10T11:00:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-12',
    donorId: 'DON-0112',
    name: 'Divya Pandian',
    email: 'divya.p@example.com',
    phone: '+91 97511-88902',
    bloodGroup: 'A+',
    dateOfBirth: '1996-06-21',
    gender: 'Female',
    address: '77 South Car St, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4520,
    longitude: 77.7970,
    lastDonationDate: '2026-04-20',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 3,
    createdAt: '2024-02-22T13:45:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-13',
    donorId: 'DON-0113',
    name: 'Aravind Kumar',
    email: 'aravind.k@example.com',
    phone: '+91 99440-12349',
    bloodGroup: 'B+',
    dateOfBirth: '1995-12-01',
    gender: 'Male',
    address: '21 K.R. Nagar, Rajapalayam',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4500,
    longitude: 77.5500,
    lastDonationDate: '2026-05-11',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 2,
    createdAt: '2024-06-05T09:00:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-14',
    donorId: 'DON-0114',
    name: 'Kavitha Jayaram',
    email: 'kavitha.j@example.com',
    phone: '+91 94433-22119',
    bloodGroup: 'O-',
    dateOfBirth: '1998-03-15',
    gender: 'Female',
    address: '102 KK Nagar, Madurai',
    district: 'Madurai',
    latitude: 9.9400,
    longitude: 78.1450,
    lastDonationDate: '2026-02-01',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 6,
    createdAt: '2023-12-10T14:30:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-15',
    donorId: 'DON-0115',
    name: 'Manoj Prabhakar',
    email: 'manoj.p@example.com',
    phone: '+91 98425-66778',
    bloodGroup: 'A-',
    dateOfBirth: '1992-04-27',
    gender: 'Male',
    address: '15 Gandhi Nagar, Virudhunagar',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.5780,
    longitude: 77.9610,
    lastDonationDate: '2026-03-18',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 4,
    createdAt: '2024-01-05T10:00:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-16',
    donorId: 'DON-0116',
    name: 'Swathi Vijay',
    email: 'swathi.v@example.com',
    phone: '+91 99944-55123',
    bloodGroup: 'O+',
    dateOfBirth: '1997-11-12',
    gender: 'Female',
    address: '42 Subbiah Pillai Rd, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4560,
    longitude: 77.8030,
    lastDonationDate: '2026-04-05',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 4,
    createdAt: '2024-03-20T17:00:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-17',
    donorId: 'DON-0117',
    name: 'Naveen Karthik',
    email: 'naveen.k@example.com',
    phone: '+91 97899-33211',
    bloodGroup: 'B+',
    dateOfBirth: '1994-08-08',
    gender: 'Male',
    address: '56 Thiruvalluvar Nagar, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4610,
    longitude: 77.8070,
    lastDonationDate: '2026-05-15',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 3,
    createdAt: '2024-04-18T11:45:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-18',
    donorId: 'DON-0118',
    name: 'Lakshmi Narayanan',
    email: 'lakshmi.n@example.com',
    phone: '+91 94870-11223',
    bloodGroup: 'AB+',
    dateOfBirth: '1990-01-30',
    gender: 'Male',
    address: '88 Ramasamy St, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4495,
    longitude: 77.7985,
    lastDonationDate: '2026-01-20',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 8,
    createdAt: '2023-04-12T09:15:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-19',
    donorId: 'DON-0119',
    name: 'Poornima Devi',
    email: 'poornima.d@example.com',
    phone: '+91 98402-99887',
    bloodGroup: 'B-',
    dateOfBirth: '1996-09-09',
    gender: 'Female',
    address: '14 Alagarkoil Rd, Madurai',
    district: 'Madurai',
    latitude: 9.9450,
    longitude: 78.1420,
    lastDonationDate: '2026-03-30',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 2,
    createdAt: '2024-05-02T13:00:00Z',
    donationHistory: [],
  },
  {
    id: 'donor-20',
    donorId: 'DON-0120',
    name: 'Balaji Venkatraman',
    email: 'balaji.v@example.com',
    phone: '+91 97911-66554',
    bloodGroup: 'O+',
    dateOfBirth: '1993-07-04',
    gender: 'Male',
    address: '3 Velar St, Thiruthangal, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4720,
    longitude: 77.8120,
    lastDonationDate: '2026-05-18',
    eligible: true,
    available: true,
    verified: true,
    emergencyNotificationsEnabled: true,
    donationCount: 5,
    createdAt: '2023-10-15T15:30:00Z',
    donationHistory: [],
  },
];

// Initial 5 Realistic Hospitals
const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-1',
    hospitalId: 'HOSP-SIV-01',
    hospitalName: 'Sivakasi Government District Headquarters Hospital',
    registrationId: 'TN-MED-77891',
    email: 'admin.gh@sivakasimed.org',
    phone: '+91 4562-220250',
    emergencyContact: '+91 4562-220999',
    address: 'Hospital Road, Near Court Complex, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4533,
    longitude: 77.7983,
    verified: true,
    bedsCount: 350,
    type: 'Government',
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'hosp-2',
    hospitalId: 'HOSP-SIV-02',
    hospitalName: 'Grace Meenakshi Multi-Specialty Hospital',
    registrationId: 'TN-MED-99412',
    email: 'emergency@gracemulti.com',
    phone: '+91 4562-278000',
    emergencyContact: '+91 94431-88899',
    address: 'Bye-Pass Junction, Thiruthangal Main Rd, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4580,
    longitude: 77.8050,
    verified: true,
    bedsCount: 180,
    type: 'Private',
    createdAt: '2023-02-15T00:00:00Z',
  },
  {
    id: 'hosp-3',
    hospitalId: 'HOSP-MAD-03',
    hospitalName: 'Apollo Specialty Hospitals, Madurai',
    registrationId: 'TN-MED-33419',
    email: 'trauma.madurai@apollohospitals.com',
    phone: '+91 452-2580880',
    emergencyContact: '1066',
    address: 'Lake View Road, K.K. Nagar, Madurai',
    district: 'Madurai',
    latitude: 9.9252,
    longitude: 78.1198,
    verified: true,
    bedsCount: 420,
    type: 'Private',
    createdAt: '2023-03-10T00:00:00Z',
  },
  {
    id: 'hosp-4',
    hospitalId: 'HOSP-MAD-04',
    hospitalName: 'Meenakshi Mission Hospital & Research Centre',
    registrationId: 'TN-MED-12884',
    email: 'bloodtransfusion@mmhrc.in',
    phone: '+91 452-4263000',
    emergencyContact: '+91 452-2588741',
    address: 'Melur Road, Madurai',
    district: 'Madurai',
    latitude: 9.9480,
    longitude: 78.1520,
    verified: true,
    bedsCount: 800,
    type: 'Charity',
    createdAt: '2023-04-01T00:00:00Z',
  },
  {
    id: 'hosp-5',
    hospitalId: 'HOSP-VIR-05',
    hospitalName: 'Virudhunagar Govt Medical College Hospital',
    registrationId: 'TN-MED-55120',
    email: 'dean.vdr@tn.gov.in',
    phone: '+91 4562-243555',
    emergencyContact: '+91 4562-243108',
    address: 'Collectorate Master Plan Complex, Virudhunagar',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.5680,
    longitude: 77.9620,
    verified: true,
    bedsCount: 500,
    type: 'Government',
    createdAt: '2023-05-20T00:00:00Z',
  },
];

// Initial 3 Realistic Blood Banks with 8-group stock
const INITIAL_BLOOD_BANKS: BloodBank[] = [
  {
    id: 'bb-1',
    bloodBankId: 'BB-SIV-01',
    name: 'Sivakasi Central Rotary Blood Centre',
    registrationId: 'BB-REG-TN-401',
    email: 'rotaryblood.sivakasi@gmail.com',
    phone: '+91 4562-224411',
    address: 'Rotary Community Hall Campus, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4510,
    longitude: 77.7940,
    verified: true,
    operatingHours: '24 Hours Emergency Service',
    createdAt: '2023-01-10T00:00:00Z',
    stock: {
      'A+': { bloodGroup: 'A+', availableUnits: 24, reservedUnits: 4, expiredUnits: 0, lastUpdated: '2026-09-21 08:30', storageStatus: 'NORMAL' },
      'A-': { bloodGroup: 'A-', availableUnits: 6, reservedUnits: 1, expiredUnits: 0, lastUpdated: '2026-09-21 08:30', storageStatus: 'LOW' },
      'B+': { bloodGroup: 'B+', availableUnits: 32, reservedUnits: 6, expiredUnits: 1, lastUpdated: '2026-09-21 08:30', storageStatus: 'NORMAL' },
      'B-': { bloodGroup: 'B-', availableUnits: 4, reservedUnits: 2, expiredUnits: 0, lastUpdated: '2026-09-21 08:30', storageStatus: 'CRITICAL' },
      'AB+': { bloodGroup: 'AB+', availableUnits: 12, reservedUnits: 2, expiredUnits: 0, lastUpdated: '2026-09-21 08:30', storageStatus: 'NORMAL' },
      'AB-': { bloodGroup: 'AB-', availableUnits: 2, reservedUnits: 1, expiredUnits: 0, lastUpdated: '2026-09-21 08:30', storageStatus: 'CRITICAL' },
      'O+': { bloodGroup: 'O+', availableUnits: 28, reservedUnits: 8, expiredUnits: 1, lastUpdated: '2026-09-21 08:30', storageStatus: 'LOW' },
      'O-': { bloodGroup: 'O-', availableUnits: 5, reservedUnits: 3, expiredUnits: 0, lastUpdated: '2026-09-21 08:30', storageStatus: 'CRITICAL' },
    },
  },
  {
    id: 'bb-2',
    bloodBankId: 'BB-VIR-02',
    name: 'Indian Red Cross Blood Bank, Virudhunagar',
    registrationId: 'BB-REG-TN-219',
    email: 'redcross.vdr@redcrossindia.org',
    phone: '+91 4562-242890',
    address: 'Near Old Bus Stand, Virudhunagar',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.5850,
    longitude: 77.9550,
    verified: true,
    operatingHours: '24 Hours Emergency Service',
    createdAt: '2023-02-01T00:00:00Z',
    stock: {
      'A+': { bloodGroup: 'A+', availableUnits: 18, reservedUnits: 3, expiredUnits: 0, lastUpdated: '2026-09-21 07:00', storageStatus: 'NORMAL' },
      'A-': { bloodGroup: 'A-', availableUnits: 5, reservedUnits: 0, expiredUnits: 0, lastUpdated: '2026-09-21 07:00', storageStatus: 'LOW' },
      'B+': { bloodGroup: 'B+', availableUnits: 25, reservedUnits: 4, expiredUnits: 0, lastUpdated: '2026-09-21 07:00', storageStatus: 'NORMAL' },
      'B-': { bloodGroup: 'B-', availableUnits: 3, reservedUnits: 1, expiredUnits: 0, lastUpdated: '2026-09-21 07:00', storageStatus: 'CRITICAL' },
      'AB+': { bloodGroup: 'AB+', availableUnits: 8, reservedUnits: 1, expiredUnits: 0, lastUpdated: '2026-09-21 07:00', storageStatus: 'NORMAL' },
      'AB-': { bloodGroup: 'AB-', availableUnits: 1, reservedUnits: 0, expiredUnits: 0, lastUpdated: '2026-09-21 07:00', storageStatus: 'CRITICAL' },
      'O+': { bloodGroup: 'O+', availableUnits: 34, reservedUnits: 5, expiredUnits: 2, lastUpdated: '2026-09-21 07:00', storageStatus: 'NORMAL' },
      'O-': { bloodGroup: 'O-', availableUnits: 4, reservedUnits: 2, expiredUnits: 0, lastUpdated: '2026-09-21 07:00', storageStatus: 'CRITICAL' },
    },
  },
  {
    id: 'bb-3',
    bloodBankId: 'BB-MAD-03',
    name: 'Madurai City Blood Transfusion Center',
    registrationId: 'BB-REG-TN-105',
    email: 'transfusion.city@maduraiblood.org',
    phone: '+91 452-2533441',
    address: 'Opposite Railway Junction, Madurai',
    district: 'Madurai',
    latitude: 9.9180,
    longitude: 78.1250,
    verified: true,
    operatingHours: '24 Hours Emergency Service',
    createdAt: '2023-01-20T00:00:00Z',
    stock: {
      'A+': { bloodGroup: 'A+', availableUnits: 45, reservedUnits: 10, expiredUnits: 1, lastUpdated: '2026-09-21 06:15', storageStatus: 'NORMAL' },
      'A-': { bloodGroup: 'A-', availableUnits: 14, reservedUnits: 2, expiredUnits: 0, lastUpdated: '2026-09-21 06:15', storageStatus: 'NORMAL' },
      'B+': { bloodGroup: 'B+', availableUnits: 50, reservedUnits: 12, expiredUnits: 2, lastUpdated: '2026-09-21 06:15', storageStatus: 'NORMAL' },
      'B-': { bloodGroup: 'B-', availableUnits: 8, reservedUnits: 2, expiredUnits: 0, lastUpdated: '2026-09-21 06:15', storageStatus: 'LOW' },
      'AB+': { bloodGroup: 'AB+', availableUnits: 20, reservedUnits: 4, expiredUnits: 0, lastUpdated: '2026-09-21 06:15', storageStatus: 'NORMAL' },
      'AB-': { bloodGroup: 'AB-', availableUnits: 5, reservedUnits: 1, expiredUnits: 0, lastUpdated: '2026-09-21 06:15', storageStatus: 'LOW' },
      'O+': { bloodGroup: 'O+', availableUnits: 42, reservedUnits: 14, expiredUnits: 3, lastUpdated: '2026-09-21 06:15', storageStatus: 'NORMAL' },
      'O-': { bloodGroup: 'O-', availableUnits: 9, reservedUnits: 4, expiredUnits: 0, lastUpdated: '2026-09-21 06:15', storageStatus: 'LOW' },
    },
  },
];

// Initial 20 Realistic Blood Requests
const INITIAL_REQUESTS: BloodRequest[] = [
  {
    id: 'req-1',
    requestId: 'REQ-2026-0901',
    hospitalId: 'hosp-1',
    hospitalName: 'Sivakasi Government District Headquarters Hospital',
    patientId: 'PT-8849',
    bloodGroup: 'O+',
    unitsRequired: 2,
    hospitalLocation: 'Sivakasi District Hospital - ICU Ward 3',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4533,
    longitude: 77.7983,
    requiredDate: '2026-09-21',
    requiredTime: '11:00',
    caseType: 'Accident & Trauma',
    emergencyLevel: 'CRITICAL',
    severityScore: 94,
    additionalNotes: 'Multiple fracture emergency trauma resuscitation. Urgent matching required.',
    status: 'PENDING',
    createdAt: '2026-09-21T08:45:00Z',
  },
  {
    id: 'req-2',
    requestId: 'REQ-2026-0902',
    hospitalId: 'hosp-2',
    hospitalName: 'Grace Meenakshi Multi-Specialty Hospital',
    patientId: 'PT-9102',
    bloodGroup: 'B+',
    unitsRequired: 3,
    hospitalLocation: 'Operation Theatre 2, Sivakasi',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4580,
    longitude: 77.8050,
    requiredDate: '2026-09-21',
    requiredTime: '14:30',
    caseType: 'Emergency Surgery',
    emergencyLevel: 'HIGH',
    severityScore: 78,
    additionalNotes: 'Emergency abdominal laparotomy surgery.',
    status: 'MATCHING',
    createdAt: '2026-09-21T07:15:00Z',
  },
  {
    id: 'req-3',
    requestId: 'REQ-2026-0903',
    hospitalId: 'hosp-1',
    hospitalName: 'Sivakasi Government District Headquarters Hospital',
    patientId: 'PT-7640',
    bloodGroup: 'O-',
    unitsRequired: 2,
    hospitalLocation: 'Maternity Wing Block B',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.4533,
    longitude: 77.7983,
    requiredDate: '2026-09-21',
    requiredTime: '10:00',
    caseType: 'Postpartum Hemorrhage',
    emergencyLevel: 'CRITICAL',
    severityScore: 96,
    additionalNotes: 'Rare negative donor required immediately. Acute postpartum blood loss.',
    status: 'DONOR_NOTIFIED',
    createdAt: '2026-09-21T08:10:00Z',
  },
  {
    id: 'req-4',
    requestId: 'REQ-2026-0904',
    hospitalId: 'hosp-3',
    hospitalName: 'Apollo Specialty Hospitals, Madurai',
    patientId: 'PT-6021',
    bloodGroup: 'A+',
    unitsRequired: 2,
    hospitalLocation: 'Cardiothoracic ICU, Madurai',
    district: 'Madurai',
    latitude: 9.9252,
    longitude: 78.1198,
    requiredDate: '2026-09-22',
    requiredTime: '09:00',
    caseType: 'Cardiovascular Surgery',
    emergencyLevel: 'MEDIUM',
    severityScore: 54,
    status: 'MATCHING',
    createdAt: '2026-09-20T16:00:00Z',
  },
  {
    id: 'req-5',
    requestId: 'REQ-2026-0905',
    hospitalId: 'hosp-4',
    hospitalName: 'Meenakshi Mission Hospital & Research Centre',
    patientId: 'PT-4421',
    bloodGroup: 'AB+',
    unitsRequired: 1,
    hospitalLocation: 'Pediatric Oncology Ward',
    district: 'Madurai',
    latitude: 9.9480,
    longitude: 78.1520,
    requiredDate: '2026-09-22',
    requiredTime: '15:00',
    caseType: 'Cancer & Oncology',
    emergencyLevel: 'LOW',
    severityScore: 28,
    status: 'FULFILLED',
    createdAt: '2026-09-20T11:20:00Z',
    fulfilledAt: '2026-09-20T17:30:00Z',
  },
  {
    id: 'req-6',
    requestId: 'REQ-2026-0906',
    hospitalId: 'hosp-5',
    hospitalName: 'Virudhunagar Govt Medical College Hospital',
    patientId: 'PT-3112',
    bloodGroup: 'A-',
    unitsRequired: 2,
    hospitalLocation: 'Casualty Trauma Care',
    district: 'Sivakasi / Virudhunagar',
    latitude: 9.5680,
    longitude: 77.9620,
    requiredDate: '2026-09-21',
    requiredTime: '13:00',
    caseType: 'Accident & Trauma',
    emergencyLevel: 'HIGH',
    severityScore: 76,
    status: 'DONOR_ACCEPTED',
    respondedDonorId: 'donor-7',
    respondedDonorName: 'Sangeetha Kannan',
    respondedAt: '2026-09-21T08:30:00Z',
    createdAt: '2026-09-21T07:45:00Z',
  },
  // 14 additional historical and pending requests
  ...Array.from({ length: 14 }).map((_, i) => {
    const bgs: BloodGroup[] = ['O+', 'A+', 'B+', 'AB+', 'O-', 'B-'];
    const levels: EmergencyLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const statuses: ('PENDING' | 'MATCHING' | 'FULFILLED')[] = ['FULFILLED', 'FULFILLED', 'PENDING'];
    const bg = bgs[i % bgs.length];
    const level = levels[i % levels.length];
    const status = statuses[i % statuses.length];
    return {
      id: `req-hist-${i + 7}`,
      requestId: `REQ-2026-08${(10 + i).toString()}`,
      hospitalId: i % 2 === 0 ? 'hosp-1' : 'hosp-2',
      hospitalName: i % 2 === 0 ? 'Sivakasi Government District Headquarters Hospital' : 'Grace Meenakshi Multi-Specialty Hospital',
      patientId: `PT-${1000 + i * 73}`,
      bloodGroup: bg,
      unitsRequired: (i % 3) + 1,
      hospitalLocation: 'General Surgery / Emergency Ward',
      district: 'Sivakasi / Virudhunagar',
      latitude: 9.4533 + (i * 0.002),
      longitude: 77.7983 + (i * 0.002),
      requiredDate: `2026-09-${(10 + (i % 10)).toString().padStart(2, '0')}`,
      requiredTime: '10:00',
      caseType: (i % 2 === 0 ? 'Emergency Surgery' : 'Accident & Trauma') as CaseType,
      emergencyLevel: level,
      severityScore: level === 'CRITICAL' ? 88 : level === 'HIGH' ? 68 : level === 'MEDIUM' ? 45 : 22,
      status,
      createdAt: `2026-09-${(10 + (i % 10)).toString().padStart(2, '0')}T10:00:00Z`,
      fulfilledAt: status === 'FULFILLED' ? `2026-09-${(10 + (i % 10)).toString().padStart(2, '0')}T16:00:00Z` : undefined,
    };
  }),
];

// Initial Notifications
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    notificationId: 'NOTIF-01',
    receiverId: 'ALL',
    receiverRole: 'ALL',
    requestId: 'req-1',
    type: 'EMERGENCY_REQUEST',
    title: '🚨 CRITICAL EMERGENCY BLOOD REQUEST',
    message: 'O+ blood needed at Sivakasi Government District Headquarters Hospital (ICU Resuscitation). 2 Units Required.',
    priority: 'CRITICAL',
    read: false,
    createdAt: '2026-09-21T08:46:00Z',
    data: {
      bloodGroup: 'O+',
      hospitalName: 'Sivakasi Government District Headquarters Hospital',
      unitsRequired: 2,
      distanceKm: 2.1,
      severityScore: 94,
    },
  },
  {
    id: 'notif-2',
    notificationId: 'NOTIF-02',
    receiverId: 'hosp-1',
    receiverRole: 'HOSPITAL',
    requestId: 'req-1',
    type: 'DONOR_MATCH_FOUND',
    title: 'Matching Donors & Blood Banks Found',
    message: 'Matching algorithm identified 5 eligible donors nearby. Closest donor is 2.1 km away.',
    priority: 'HIGH',
    read: false,
    createdAt: '2026-09-21T08:47:00Z',
    data: {
      bloodGroup: 'O+',
      distanceKm: 2.1,
    },
  },
  {
    id: 'notif-3',
    notificationId: 'NOTIF-03',
    receiverId: 'bb-1',
    receiverRole: 'BLOOD_BANK',
    requestId: 'req-1',
    type: 'BLOOD_BANK_STOCK_AVAILABLE',
    title: '🚨 Urgent Blood Requirement Near You',
    message: 'Sivakasi Govt Hospital requested 2 units of O+ blood. Please verify cold storage stock.',
    priority: 'CRITICAL',
    read: false,
    createdAt: '2026-09-21T08:48:00Z',
  },
];

// Initial System Logs
const INITIAL_LOGS: SystemLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-21T08:45:10Z',
    actorRole: 'HOSPITAL',
    actorName: 'Sivakasi Govt Hospital',
    action: 'CREATE_BLOOD_REQUEST',
    details: 'Created CRITICAL emergency blood request for 2 units O+ (Patient PT-8849)',
    level: 'EMERGENCY',
  },
  {
    id: 'log-2',
    timestamp: '2026-09-21T08:45:12Z',
    actorRole: 'SYSTEM',
    actorName: 'AI Matching Engine',
    action: 'EXECUTE_SMART_MATCHING',
    details: 'Evaluated 20 registered donors. Found 5 compatible within 10km radius.',
    level: 'INFO',
  },
  {
    id: 'log-3',
    timestamp: '2026-09-21T08:30:00Z',
    actorRole: 'BLOOD_BANK',
    actorName: 'Sivakasi Central Rotary Blood Centre',
    action: 'UPDATE_INVENTORY',
    details: 'Added 5 units O+ and 2 units B+ to active inventory.',
    level: 'INFO',
  },
];

class RealTimeDatabase {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private currentUser: CurrentUser | null = null;

  constructor() {
    this.state = this.loadFromStorage();
    this.currentUser = this.loadUserFromStorage();
    this.initBroadcast();
  }

  private loadFromStorage(): DatabaseState {
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return {
      donors: INITIAL_DONORS,
      hospitals: INITIAL_HOSPITALS,
      bloodBanks: INITIAL_BLOOD_BANKS,
      requests: INITIAL_REQUESTS,
      notifications: INITIAL_NOTIFICATIONS,
      logs: INITIAL_LOGS,
    };
  }

  private loadUserFromStorage(): CurrentUser | null {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    // Default to Hospital role for immediate full access to requests & matching
    const defaultHospital = INITIAL_HOSPITALS[0];
    return {
      id: defaultHospital.id,
      role: 'HOSPITAL',
      name: defaultHospital.hospitalName,
      email: defaultHospital.email,
      hospitalProfile: defaultHospital,
    };
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  private saveUserToStorage(): void {
    try {
      if (this.currentUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.warn('Failed to save user:', e);
    }
  }

  private initBroadcast(): void {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('blood_network_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC') {
            this.state = this.loadFromStorage();
            this.notify();
          }
        };
      }
    } catch {
      // BroadcastChannel unavailable
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error(e);
      }
    });
  }

  private broadcastChange(): void {
    this.saveToStorage();
    this.notify();
    try {
      this.broadcastChannel?.postMessage({ type: 'SYNC' });
    } catch {
      // ignore
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // --- Auth & User State ---
  public getCurrentUser(): CurrentUser | null {
    return this.currentUser;
  }

  public setCurrentUser(user: CurrentUser | null): void {
    this.currentUser = user;
    this.saveUserToStorage();
    this.broadcastChange();
  }

  public switchRole(role: 'DONOR' | 'HOSPITAL' | 'BLOOD_BANK' | 'ADMIN'): void {
    if (role === 'DONOR') {
      const donor = this.state.donors[0];
      this.setCurrentUser({
        id: donor.id,
        role: 'DONOR',
        name: donor.name,
        email: donor.email,
        donorProfile: donor,
      });
    } else if (role === 'HOSPITAL') {
      const hosp = this.state.hospitals[0];
      this.setCurrentUser({
        id: hosp.id,
        role: 'HOSPITAL',
        name: hosp.hospitalName,
        email: hosp.email,
        hospitalProfile: hosp,
      });
    } else if (role === 'BLOOD_BANK') {
      const bb = this.state.bloodBanks[0];
      this.setCurrentUser({
        id: bb.id,
        role: 'BLOOD_BANK',
        name: bb.name,
        email: bb.email,
        bloodBankProfile: bb,
      });
    } else {
      this.setCurrentUser({
        id: 'admin-01',
        role: 'ADMIN',
        name: 'State Transfusion Admin (Virudhunagar & Madurai)',
        email: 'admin.bloodnetwork@tn.gov.in',
      });
    }
  }

  // --- State Getters ---
  public getDonors(): Donor[] {
    return [...this.state.donors];
  }

  public getHospitals(): Hospital[] {
    return [...this.state.hospitals];
  }

  public getBloodBanks(): BloodBank[] {
    return [...this.state.bloodBanks];
  }

  public getRequests(): BloodRequest[] {
    return [...this.state.requests];
  }

  public getNotifications(): AppNotification[] {
    return [...this.state.notifications];
  }

  public getLogs(): SystemLog[] {
    return [...this.state.logs];
  }

  // Aggregate total blood stock across all banks
  public getTotalStockMap(): Record<BloodGroup, number> {
    const total: Record<BloodGroup, number> = {
      'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0,
      'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0,
    };
    this.state.bloodBanks.forEach((bb) => {
      Object.keys(total).forEach((bg) => {
        total[bg as BloodGroup] += bb.stock[bg as BloodGroup]?.availableUnits || 0;
      });
    });
    return total;
  }

  // --- Actions ---

  // 1. Create Blood Request
  public createBloodRequest(data: Omit<BloodRequest, 'id' | 'requestId' | 'severityScore' | 'status' | 'createdAt'>): BloodRequest {
    const id = `req-${Date.now()}`;
    const requestId = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const totalStock = this.getTotalStockMap()[data.bloodGroup] || 0;
    const severityResult = calculateAISeverityScore({
      caseType: data.caseType,
      unitsRequired: data.unitsRequired,
      emergencyLevel: data.emergencyLevel,
      requiredDate: data.requiredDate,
      requiredTime: data.requiredTime,
      bloodGroup: data.bloodGroup,
      nearbyStockAvailable: totalStock,
    });

    const newRequest: BloodRequest = {
      ...data,
      id,
      requestId,
      severityScore: severityResult.score,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.state.requests.unshift(newRequest);

    // Auto-log
    this.addLog({
      actorRole: 'HOSPITAL',
      actorName: data.hospitalName,
      action: 'CREATE_BLOOD_REQUEST',
      details: `Created ${data.emergencyLevel} request (${data.unitsRequired} units ${data.bloodGroup}) with AI Severity Score: ${severityResult.score}/100.`,
      level: data.emergencyLevel === 'CRITICAL' ? 'EMERGENCY' : 'INFO',
    });

    // Run matching and trigger emergency notification workflow if HIGH or CRITICAL
    const matches = findNearbyEligibleDonors(newRequest, this.state.donors, 50);
    const nearbyDonorsCount = matches.filter((m) => m.compatibility && m.eligibility && m.availability).length;

    // Create system notification for all donors and nearby blood banks
    const isUrgent = data.emergencyLevel === 'CRITICAL' || data.emergencyLevel === 'HIGH';
    if (isUrgent) {
      this.state.notifications.unshift({
        id: `notif-${Date.now()}-1`,
        notificationId: `NOTIF-${Math.floor(1000 + Math.random() * 9000)}`,
        receiverId: 'ALL',
        receiverRole: 'DONOR',
        requestId: newRequest.id,
        type: 'EMERGENCY_REQUEST',
        title: `🚨 EMERGENCY BLOOD REQUEST (${data.bloodGroup})`,
        message: `Hospital: ${data.hospitalName} requires ${data.unitsRequired} units of ${data.bloodGroup} urgently (${data.caseType}). Are you available to respond?`,
        priority: data.emergencyLevel,
        read: false,
        createdAt: new Date().toISOString(),
        data: {
          bloodGroup: data.bloodGroup,
          hospitalName: data.hospitalName,
          unitsRequired: data.unitsRequired,
          severityScore: severityResult.score,
        },
      });

      this.state.notifications.unshift({
        id: `notif-${Date.now()}-2`,
        notificationId: `NOTIF-${Math.floor(1000 + Math.random() * 9000)}`,
        receiverId: 'ALL',
        receiverRole: 'BLOOD_BANK',
        requestId: newRequest.id,
        type: 'EMERGENCY_REQUEST',
        title: `🚨 URGENT BLOOD REQUIREMENT: ${data.bloodGroup}`,
        message: `${data.hospitalName} has initiated a priority alert for ${data.unitsRequired} units of ${data.bloodGroup}. Please check cold room inventory.`,
        priority: data.emergencyLevel,
        read: false,
        createdAt: new Date().toISOString(),
        data: {
          bloodGroup: data.bloodGroup,
          hospitalName: data.hospitalName,
          unitsRequired: data.unitsRequired,
        },
      });
    }

    // Hospital confirmation notification
    const closestMatch = matches[0];
    this.state.notifications.unshift({
      id: `notif-${Date.now()}-3`,
      notificationId: `NOTIF-${Math.floor(1000 + Math.random() * 9000)}`,
      receiverId: data.hospitalId,
      receiverRole: 'HOSPITAL',
      requestId: newRequest.id,
      type: 'DONOR_MATCH_FOUND',
      title: 'Smart Matching Initiated',
      message: `Matching donors and blood banks identified. Eligible donors: ${nearbyDonorsCount}. Closest donor: ${closestMatch ? `${closestMatch.distanceKm} km` : '12 km'}.`,
      priority: data.emergencyLevel,
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.broadcastChange();
    return newRequest;
  }

  // 2. Donor Responds to Request
  public respondToRequest(requestId: string, donorId: string, response: 'ACCEPT' | 'DECLINE'): void {
    const request = this.state.requests.find((r) => r.id === requestId);
    const donor = this.state.donors.find((d) => d.id === donorId);
    if (!request || !donor) return;

    if (response === 'ACCEPT') {
      request.status = 'DONOR_ACCEPTED';
      request.respondedDonorId = donor.id;
      request.respondedDonorName = donor.name;
      request.respondedAt = new Date().toISOString();

      // Notify hospital
      this.state.notifications.unshift({
        id: `notif-${Date.now()}`,
        notificationId: `NOTIF-${Math.floor(1000 + Math.random() * 9000)}`,
        receiverId: request.hospitalId,
        receiverRole: 'HOSPITAL',
        requestId: request.id,
        type: 'REQUEST_ACCEPTED',
        title: `✅ Donor Accepted Request #${request.requestId}`,
        message: `Donor ${donor.name} (${donor.bloodGroup}) accepted emergency donation request! Secure coordination is ready.`,
        priority: 'HIGH',
        read: false,
        createdAt: new Date().toISOString(),
      });

      this.addLog({
        actorRole: 'DONOR',
        actorName: donor.name,
        action: 'RESPOND_REQUEST_ACCEPTED',
        details: `Accepted blood request ${request.requestId} for ${request.hospitalName}.`,
        level: 'INFO',
      });
    } else {
      this.addLog({
        actorRole: 'DONOR',
        actorName: donor.name,
        action: 'RESPOND_REQUEST_DECLINED',
        details: `Donor indicated unavailable for request ${request.requestId}.`,
        level: 'INFO',
      });
    }

    this.broadcastChange();
  }

  // 3. Mark Request as Fulfilled
  public fulfillRequest(requestId: string): void {
    const request = this.state.requests.find((r) => r.id === requestId);
    if (!request) return;
    request.status = 'FULFILLED';
    request.fulfilledAt = new Date().toISOString();

    // If donor accepted, increment donor donation history
    if (request.respondedDonorId) {
      const donor = this.state.donors.find((d) => d.id === request.respondedDonorId);
      if (donor) {
        donor.donationCount += 1;
        donor.lastDonationDate = new Date().toISOString().split('T')[0];
        donor.eligible = false; // Cooldown initiated
        donor.donationHistory.unshift({
          id: `dh-${Date.now()}`,
          date: donor.lastDonationDate,
          hospitalOrCamp: request.hospitalName,
          units: request.unitsRequired,
          bloodGroup: donor.bloodGroup,
        });
      }
    }

    this.state.notifications.unshift({
      id: `notif-${Date.now()}`,
      notificationId: `NOTIF-${Math.floor(1000 + Math.random() * 9000)}`,
      receiverId: request.hospitalId,
      receiverRole: 'HOSPITAL',
      requestId: request.id,
      type: 'REQUEST_FULFILLED',
      title: `🎉 Blood Request Fulfilled: #${request.requestId}`,
      message: `Transfusion requirements fulfilled for patient ${request.patientId} (${request.unitsRequired} units ${request.bloodGroup}).`,
      priority: 'LOW',
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.addLog({
      actorRole: 'HOSPITAL',
      actorName: request.hospitalName,
      action: 'REQUEST_FULFILLED',
      details: `Request ${request.requestId} successfully fulfilled.`,
      level: 'INFO',
    });

    this.broadcastChange();
  }

  // 4. Update Blood Bank Stock
  public updateBloodStock(
    bloodBankId: string,
    bloodGroup: BloodGroup,
    unitsToAddOrSet: { availableUnits?: number; reservedUnits?: number; deltaAvailable?: number }
  ): void {
    const bb = this.state.bloodBanks.find((b) => b.id === bloodBankId);
    if (!bb || !bb.stock[bloodGroup]) return;

    const currentItem = bb.stock[bloodGroup];
    let newAvailable = currentItem.availableUnits;
    let newReserved = currentItem.reservedUnits;

    if (unitsToAddOrSet.deltaAvailable !== undefined) {
      newAvailable = Math.max(0, newAvailable + unitsToAddOrSet.deltaAvailable);
    } else if (unitsToAddOrSet.availableUnits !== undefined) {
      newAvailable = Math.max(0, unitsToAddOrSet.availableUnits);
    }

    if (unitsToAddOrSet.reservedUnits !== undefined) {
      newReserved = Math.max(0, unitsToAddOrSet.reservedUnits);
    }

    let storageStatus: 'NORMAL' | 'LOW' | 'CRITICAL' = 'NORMAL';
    if (newAvailable <= 3) storageStatus = 'CRITICAL';
    else if (newAvailable <= 10) storageStatus = 'LOW';

    bb.stock[bloodGroup] = {
      ...currentItem,
      availableUnits: newAvailable,
      reservedUnits: newReserved,
      storageStatus,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    this.addLog({
      actorRole: 'BLOOD_BANK',
      actorName: bb.name,
      action: 'STOCK_UPDATED',
      details: `Updated ${bloodGroup} stock: Available=${newAvailable}, Reserved=${newReserved} (Status: ${storageStatus}).`,
      level: storageStatus === 'CRITICAL' ? 'WARNING' : 'INFO',
    });

    this.broadcastChange();
  }

  // 5. Reserve Blood Units from Blood Bank
  public reserveBloodUnits(bloodBankId: string, bloodGroup: BloodGroup, units: number, requestId?: string): boolean {
    const bb = this.state.bloodBanks.find((b) => b.id === bloodBankId);
    if (!bb || !bb.stock[bloodGroup] || bb.stock[bloodGroup].availableUnits < units) {
      return false;
    }

    bb.stock[bloodGroup].availableUnits -= units;
    bb.stock[bloodGroup].reservedUnits += units;
    bb.stock[bloodGroup].lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (requestId) {
      const req = this.state.requests.find((r) => r.id === requestId);
      if (req) {
        req.reservedBloodBankId = bloodBankId;
        req.status = 'MATCHING';
      }
    }

    this.addLog({
      actorRole: 'BLOOD_BANK',
      actorName: bb.name,
      action: 'STOCK_RESERVED',
      details: `Reserved ${units} units of ${bloodGroup} for emergency fulfillment.`,
      level: 'INFO',
    });

    this.broadcastChange();
    return true;
  }

  // 6. Update Donor Profile / Toggle Availability
  public updateDonorAvailability(donorId: string, available: boolean): void {
    const donor = this.state.donors.find((d) => d.id === donorId);
    if (!donor) return;
    donor.available = available;

    this.addLog({
      actorRole: 'DONOR',
      actorName: donor.name,
      action: 'AVAILABILITY_CHANGED',
      details: `Emergency Availability toggled to ${available ? 'ON (Active)' : 'OFF (Paused)'}.`,
      level: 'INFO',
    });

    this.broadcastChange();
  }

  public registerDonor(donorData: Omit<Donor, 'id' | 'donorId' | 'eligible' | 'donationCount' | 'donationHistory' | 'createdAt' | 'verified'>): Donor {
    const id = `donor-${Date.now()}`;
    const donorId = `DON-${Math.floor(1000 + Math.random() * 9000)}`;

    const lastDate = donorData.lastDonationDate ? new Date(donorData.lastDonationDate) : new Date(2020, 1, 1);
    const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    const eligible = diffDays >= 90;

    const newDonor: Donor = {
      ...donorData,
      id,
      donorId,
      eligible,
      donationCount: 0,
      donationHistory: [],
      verified: true,
      createdAt: new Date().toISOString(),
    };

    this.state.donors.unshift(newDonor);

    this.addLog({
      actorRole: 'DONOR',
      actorName: newDonor.name,
      action: 'DONOR_REGISTRATION',
      details: `New donor registered: ${newDonor.name} (${newDonor.bloodGroup}, ${newDonor.district}).`,
      level: 'INFO',
    });

    this.broadcastChange();
    return newDonor;
  }

  public registerHospital(hospData: Omit<Hospital, 'id' | 'hospitalId' | 'verified' | 'createdAt'>): Hospital {
    const id = `hosp-${Date.now()}`;
    const hospitalId = `HOSP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newHospital: Hospital = {
      ...hospData,
      id,
      hospitalId,
      verified: true,
      createdAt: new Date().toISOString(),
    };
    this.state.hospitals.push(newHospital);

    this.addLog({
      actorRole: 'HOSPITAL',
      actorName: newHospital.hospitalName,
      action: 'HOSPITAL_REGISTRATION',
      details: `New hospital registered: ${newHospital.hospitalName} (${newHospital.registrationId}).`,
      level: 'INFO',
    });

    this.broadcastChange();
    return newHospital;
  }

  public registerBloodBank(bbData: Omit<BloodBank, 'id' | 'bloodBankId' | 'verified' | 'createdAt' | 'stock'>): BloodBank {
    const id = `bb-${Date.now()}`;
    const bloodBankId = `BB-${Math.floor(1000 + Math.random() * 9000)}`;
    const bgs: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const stock: Record<BloodGroup, any> = {} as any;
    bgs.forEach((bg) => {
      stock[bg] = {
        bloodGroup: bg,
        availableUnits: 10,
        reservedUnits: 0,
        expiredUnits: 0,
        lastUpdated: new Date().toISOString().substring(0, 16),
        storageStatus: 'NORMAL',
      };
    });

    const newBloodBank: BloodBank = {
      ...bbData,
      id,
      bloodBankId,
      verified: true,
      stock,
      createdAt: new Date().toISOString(),
    };
    this.state.bloodBanks.push(newBloodBank);

    this.addLog({
      actorRole: 'BLOOD_BANK',
      actorName: newBloodBank.name,
      action: 'BLOOD_BANK_REGISTRATION',
      details: `New blood bank registered: ${newBloodBank.name}.`,
      level: 'INFO',
    });

    this.broadcastChange();
    return newBloodBank;
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.broadcastChange();
    }
  }

  public markNotificationAsUnread(id: string): void {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = false;
      this.broadcastChange();
    }
  }

  public deleteNotification(id: string): void {
    this.state.notifications = this.state.notifications.filter((n) => n.id !== id);
    this.broadcastChange();
  }

  public markAllNotificationsAsRead(): void {
    this.state.notifications.forEach((n) => (n.read = true));
    this.broadcastChange();
  }

  public getAuditLogs(): SystemLog[] {
    return this.state.logs;
  }

  public verifyHospital(id: string): void {
    const hosp = this.state.hospitals.find((h) => h.id === id);
    if (hosp) {
      hosp.verified = true;
      this.addLog({
        actorRole: 'ADMIN',
        actorName: 'State Health Authority',
        action: 'HOSPITAL_ACCREDITED',
        details: `Hospital facility verified: ${hosp.hospitalName}`,
        level: 'INFO',
      });
      this.broadcastChange();
    }
  }

  public verifyBloodBank(id: string): void {
    const bb = this.state.bloodBanks.find((b) => b.id === id);
    if (bb) {
      bb.verified = true;
      this.addLog({
        actorRole: 'ADMIN',
        actorName: 'State Health Authority',
        action: 'BLOOD_BANK_VERIFIED',
        details: `Blood bank verified and cold chain license accredited: ${bb.name}`,
        level: 'INFO',
      });
      this.broadcastChange();
    }
  }

  public addLog(log: Omit<SystemLog, 'id' | 'timestamp'>): void {
    this.state.logs.unshift({
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
    // Keep max 100 logs
    if (this.state.logs.length > 100) {
      this.state.logs.pop();
    }
  }

  public resetToDemoData(): void {
    this.state = {
      donors: INITIAL_DONORS,
      hospitals: INITIAL_HOSPITALS,
      bloodBanks: INITIAL_BLOOD_BANKS,
      requests: INITIAL_REQUESTS,
      notifications: INITIAL_NOTIFICATIONS,
      logs: INITIAL_LOGS,
    };
    this.switchRole('HOSPITAL');
    this.broadcastChange();
  }
}

export const db = new RealTimeDatabase();
