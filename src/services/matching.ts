import { BloodGroup, Donor, BloodRequest, DonorMatch } from '../types';

/**
 * Red Blood Cell Compatibility Matrix
 * Key: Recipient Blood Group
 * Value: Array of Donor Blood Groups that are compatible
 */
export const BLOOD_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
};

/**
 * Check if donor's blood group is compatible with recipient's blood group
 */
export function isBloodCompatible(recipientGroup: BloodGroup, donorGroup: BloodGroup): boolean {
  const compatibleDonors = BLOOD_COMPATIBILITY[recipientGroup] || [];
  return compatibleDonors.includes(donorGroup);
}

/**
 * Haversine formula to compute great-circle distance between two points in km
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal precision
}

/**
 * Check donor eligibility (at least 90 days / 3 months since last donation)
 */
export function calculateEligibility(lastDonationDateStr: string): boolean {
  if (!lastDonationDateStr) return true;
  const lastDate = new Date(lastDonationDateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 90;
}

/**
 * Compute transparent smart donor matching score and reasons
 */
export function computeDonorMatch(
  request: BloodRequest,
  donor: Donor
): DonorMatch {
  const compatible = isBloodCompatible(request.bloodGroup, donor.bloodGroup);
  const eligible = donor.eligible && calculateEligibility(donor.lastDonationDate);
  const available = donor.available;
  const distance = calculateDistanceKm(
    request.latitude,
    request.longitude,
    donor.latitude,
    donor.longitude
  );

  // 1. Blood Compatibility (40%)
  // Exact match gets 40, compatible alternative (e.g. O- to A+) gets 35
  let compatibilityScore = 0;
  if (compatible) {
    compatibilityScore = donor.bloodGroup === request.bloodGroup ? 40 : 35;
  }

  // 2. Distance Score (25%)
  let distanceScore = 0;
  if (distance <= 3) {
    distanceScore = 25;
  } else if (distance <= 7) {
    distanceScore = 22;
  } else if (distance <= 15) {
    distanceScore = 18;
  } else if (distance <= 30) {
    distanceScore = 12;
  } else if (distance <= 50) {
    distanceScore = 7;
  } else {
    distanceScore = 3;
  }

  // 3. Eligibility Score (20%)
  const eligibilityScore = eligible ? 20 : 0;

  // 4. Availability Score (10%)
  const availabilityScore = available ? 10 : 0;

  // 5. Response / Reliability Factor (5%)
  const responseScore = Math.min(5, Math.max(2, donor.donationCount > 0 ? 5 : 3));

  const totalScore = Math.min(
    100,
    compatibilityScore + distanceScore + eligibilityScore + availabilityScore + responseScore
  );

  const reasons: string[] = [];
  if (compatible) {
    if (donor.bloodGroup === request.bloodGroup) {
      reasons.push(`✓ Exact match blood group (${donor.bloodGroup})`);
    } else {
      reasons.push(`✓ Universally compatible blood group (${donor.bloodGroup} for ${request.bloodGroup})`);
    }
  } else {
    reasons.push(`✗ Blood group ${donor.bloodGroup} not compatible with ${request.bloodGroup}`);
  }

  if (eligible) {
    reasons.push(`✓ Medically eligible (Last donation >90 days ago)`);
  } else {
    reasons.push(`✗ Ineligible (Donation cooldown active)`);
  }

  if (available) {
    reasons.push(`✓ Available now for emergency response`);
  } else {
    reasons.push(`✗ Currently marked unavailable`);
  }

  reasons.push(`✓ Located ${distance} km from hospital`);

  if (donor.donationCount > 2) {
    reasons.push(`✓ Frequent verified donor (${donor.donationCount} past donations)`);
  }

  return {
    matchId: `match-${request.id}-${donor.id}`,
    requestId: request.id,
    donorId: donor.id,
    donorName: donor.name,
    donorBloodGroup: donor.bloodGroup,
    distanceKm: distance,
    compatibility: compatible,
    eligibility: eligible,
    availability: available,
    matchScore: totalScore,
    scoreBreakdown: {
      compatibilityScore,
      distanceScore,
      eligibilityScore,
      availabilityScore,
      responseScore,
    },
    reasons,
    status: 'IDENTIFIED',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Filter and rank donors nearest-first and highest-score first
 */
export function findNearbyEligibleDonors(
  request: BloodRequest,
  donors: Donor[],
  maxRadiusKm: number = 50
): DonorMatch[] {
  return donors
    .map((d) => computeDonorMatch(request, d))
    .filter((match) => match.distanceKm <= maxRadiusKm)
    .sort((a, b) => {
      // Prioritize compatible + eligible + available first, then nearest distance
      if (a.compatibility !== b.compatibility) return a.compatibility ? -1 : 1;
      if (a.availability !== b.availability) return a.availability ? -1 : 1;
      if (a.eligibility !== b.eligibility) return a.eligibility ? -1 : 1;
      return a.distanceKm - b.distanceKm;
    });
}
