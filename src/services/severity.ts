import { CaseType, EmergencyLevel, BloodGroup } from '../types';

export interface SeverityInput {
  caseType: CaseType;
  unitsRequired: number;
  emergencyLevel: EmergencyLevel;
  requiredDate: string;
  requiredTime: string;
  bloodGroup: BloodGroup;
  nearbyStockAvailable?: number; // Total available units in regional banks
  nearbyEligibleDonorsCount?: number;
  isIcuOrTrauma?: boolean;
}

export interface SeverityResult {
  score: number; // 0 to 100
  level: EmergencyLevel;
  breakdown: {
    clinicalUrgency: number; // max 35
    caseTypeWeight: number;  // max 25
    unitsRiskFactor: number; // max 15
    supplyDeficitPenalty: number; // max 15
    timeProximityRisk: number; // max 10
  };
  rationale: string;
  recommendedAction: string;
}

export function calculateAISeverityScore(input: SeverityInput): SeverityResult {
  let clinicalUrgency = 15;
  switch (input.emergencyLevel) {
    case 'CRITICAL':
      clinicalUrgency = 35;
      break;
    case 'HIGH':
      clinicalUrgency = 27;
      break;
    case 'MEDIUM':
      clinicalUrgency = 18;
      break;
    case 'LOW':
      clinicalUrgency = 8;
      break;
  }

  let caseTypeWeight = 10;
  switch (input.caseType) {
    case 'Accident & Trauma':
      caseTypeWeight = 25;
      break;
    case 'Postpartum Hemorrhage':
      caseTypeWeight = 24;
      break;
    case 'ICU Resuscitation':
      caseTypeWeight = 23;
      break;
    case 'Emergency Surgery':
      caseTypeWeight = 20;
      break;
    case 'Cardiovascular Surgery':
      caseTypeWeight = 17;
      break;
    case 'Cancer & Oncology':
      caseTypeWeight = 12;
      break;
    case 'Thalassemia / Anemia':
      caseTypeWeight = 10;
      break;
    case 'Routine Transfusion':
      caseTypeWeight = 5;
      break;
  }

  // Units required risk (each unit above 1 adds risk)
  let unitsRiskFactor = Math.min(15, Math.round(input.unitsRequired * 3.2));

  // Supply deficit penalty (if local blood bank stock is low, urgency scales up)
  const availableStock = input.nearbyStockAvailable ?? 10;
  let supplyDeficitPenalty = 0;
  if (availableStock === 0) {
    supplyDeficitPenalty = 15;
  } else if (availableStock < input.unitsRequired) {
    supplyDeficitPenalty = 12;
  } else if (availableStock <= input.unitsRequired * 2) {
    supplyDeficitPenalty = 7;
  } else {
    supplyDeficitPenalty = 2;
  }

  // Time proximity risk
  let timeProximityRisk = 8;
  const now = new Date();
  const reqDateTime = new Date(`${input.requiredDate}T${input.requiredTime || '12:00'}`);
  const hoursUntilRequired = (reqDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilRequired <= 1) {
    timeProximityRisk = 10;
  } else if (hoursUntilRequired <= 3) {
    timeProximityRisk = 8;
  } else if (hoursUntilRequired <= 12) {
    timeProximityRisk = 5;
  } else {
    timeProximityRisk = 2;
  }

  const rawScore = clinicalUrgency + caseTypeWeight + unitsRiskFactor + supplyDeficitPenalty + timeProximityRisk;
  const score = Math.max(5, Math.min(99, rawScore));

  let level: EmergencyLevel = 'LOW';
  if (score >= 81) {
    level = 'CRITICAL';
  } else if (score >= 61) {
    level = 'HIGH';
  } else if (score >= 31) {
    level = 'MEDIUM';
  } else {
    level = 'LOW';
  }

  let rationale = '';
  let recommendedAction = '';
  if (level === 'CRITICAL') {
    rationale = `Severe acute blood loss risk (${input.caseType}) requiring ${input.unitsRequired} units immediately with localized inventory pressure.`;
    recommendedAction = 'Instant broadcast to all nearby verified donors within 25km and reserve remaining blood bank stock.';
  } else if (level === 'HIGH') {
    rationale = `Elevated urgency for ${input.caseType}. Timely transfusion critical to avert patient deterioration.`;
    recommendedAction = 'Notify top-ranked eligible donors within 15km and dispatch hospital logistics.';
  } else if (level === 'MEDIUM') {
    rationale = `Scheduled/semi-urgent clinical requirement for ${input.caseType}. Stock buffer moderate.`;
    recommendedAction = 'Query regional blood banks and enqueue matching donor recommendations.';
  } else {
    rationale = `Routine elective transfusion. Sufficient preparation window available.`;
    recommendedAction = 'Standard inventory allocation from primary blood bank schedule.';
  }

  return {
    score,
    level,
    breakdown: {
      clinicalUrgency,
      caseTypeWeight,
      unitsRiskFactor,
      supplyDeficitPenalty,
      timeProximityRisk,
    },
    rationale,
    recommendedAction,
  };
}
