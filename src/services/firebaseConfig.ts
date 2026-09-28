/**
 * Firebase Firestore & Authentication Architecture Specification
 * Compatible with Google Cloud Firebase Web SDK v10+
 */

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDemoKeyBloodNetwork_AutoConfig",
  authDomain: "ai-blood-matcher.firebaseapp.com",
  projectId: "ai-blood-matcher",
  storageBucket: "ai-blood-matcher.appspot.com",
  messagingSenderId: "315439356413",
  appId: "1:315439356413:web:7566f9ea900646819bfc",
};

/**
 * Firestore Database Collection Architecture:
 * 
 * 1. /users/{userId}
 *    - role: "DONOR" | "HOSPITAL" | "BLOOD_BANK" | "ADMIN"
 *    - email: string
 *    - name: string
 *    - entityId: string (donorId / hospitalId / bloodBankId)
 * 
 * 2. /donors/{donorId}
 *    - donorId, name, email, phone (masked), bloodGroup, dateOfBirth
 *    - location, latitude, longitude, district, address
 *    - lastDonationDate, eligible, available, emergencyNotificationsEnabled
 *    - donationCount, createdAt
 * 
 * 3. /hospitals/{hospitalId}
 *    - hospitalId, hospitalName, registrationId, email, phone, emergencyContact
 *    - address, district, latitude, longitude, verified, createdAt
 * 
 * 4. /blood_banks/{bloodBankId}
 *    - bloodBankId, name, registrationId, email, phone
 *    - address, district, latitude, longitude, verified, operatingHours, createdAt
 * 
 * 5. /blood_requests/{requestId}
 *    - requestId, hospitalId, hospitalName, patientId, bloodGroup, unitsRequired
 *    - priority (LOW/MEDIUM/HIGH/CRITICAL), severityScore (0-100), caseType
 *    - latitude, longitude, status, createdAt, fulfilledAt
 * 
 * 6. /blood_inventory/{inventoryId}
 *    - bloodBankId, bloodGroup, availableUnits, reservedUnits, expiredUnits, updatedAt
 * 
 * 7. /donor_matches/{matchId}
 *    - matchId, requestId, donorId, distanceKm, compatibility, eligibility, matchScore, status
 * 
 * 8. /notifications/{notificationId}
 *    - notificationId, receiverId, receiverRole, requestId, type, title, message, priority, read, createdAt
 * 
 * 9. /admin_logs/{logId}
 *    - logId, timestamp, actorRole, actorName, action, details, level
 */

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  DONORS: 'donors',
  HOSPITALS: 'hospitals',
  BLOOD_BANKS: 'blood_banks',
  BLOOD_REQUESTS: 'blood_requests',
  BLOOD_INVENTORY: 'blood_inventory',
  DONOR_MATCHES: 'donor_matches',
  NOTIFICATIONS: 'notifications',
  EMERGENCY_REQUESTS: 'emergency_requests',
  REQUEST_HISTORY: 'request_history',
  DEMAND_PREDICTIONS: 'demand_predictions',
  LOCATIONS: 'locations',
  ADMIN_LOGS: 'admin_logs',
} as const;
