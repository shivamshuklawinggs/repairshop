
// ─────────────────────────────────────────────────────────────────────────────
export const LATE_GRACE_MIN = 120;
// ─────────────────────────────────────────────────────────────────────────────
// BASIC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Clamp 0–100
export const clamp = (v: number): number =>
  Math.max(0, Math.min(100, v));

// Convert score → stars (0–5)
export const toStars = (score: number): number =>
  parseFloat((score / 20).toFixed(1));

// Boolean → score
// true = 100, false = 0, null = 100 (neutral)
export const scoreBool = (v: boolean | null): number =>
  v === false ? 0 : 100;
export function scoreStar(value: boolean | null): number {
  if (value === null) return 0; // or keep null if you want to exclude in avg
  return value ? 5 : 0;
}
export function toRating(value: boolean | null, neutral: number | null = null): number | null {
  if (value === null) return neutral; // use null to exclude from avg
  return value ? 5 : 0;
}

// Helper to handle both boolean and graduated rating inputs
export function toRatingFromMixed(value: boolean | number | null, neutral: number | null = null): number | null {
  if (value === null) return neutral;
  if (typeof value === 'number') return value; // Already a graduated rating (0-5)
  return value ? 5 : 0; // Boolean conversion
}

export const getMatchField = (entityType: 'driver' | 'carrier' | 'customer') => {
  return entityType=="driver"?'carrierIds.assignDrivers':entityType=="carrier"?'carrierIds.carrier':'customerId'
}
export function ratingToPercent(rating: number | null): number {
  if (rating === null) return 0;
  return (rating / 5) * 100;
}
// Safe date diff in minutes
export const diffMinutes = (
  a?: Date | null,
  b?: Date | null
): number | null => {
  if (!a || !b) return null;
  return (a.getTime() - b.getTime()) / 60000;
};

// ─────────────────────────────────────────────────────────────────────────────
// GRADUATED RATING SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

// Calculate rating based on minutes late for pickup/delivery
export const calculateGraduatedRating = (
  actual?: Date | null,
  planned?: Date | null,
  graceMin: number = LATE_GRACE_MIN
): number => {

  const diff = diffMinutes(actual, planned);
  
  if (diff === null) {
  
    return 0;
  }
  
  // Early or within grace period = 5 stars
  if (diff <= graceMin) {
    return 5;
  }
  
  // Late by minutes - graduated rating
  const minutesLate = diff - graceMin;
  console.log('  ⚠️ Minutes late:', minutesLate);
  
  let rating = 0.3; // Default for very late
  if (minutesLate <= 5) {
    rating = 4.5;
  } else if (minutesLate <= 10) {
    rating = 4;
  } else if (minutesLate <= 15) {
    rating = 3.5;
  } else if (minutesLate <= 20) {
    rating = 3;
  } else if (minutesLate <= 30) {
    rating = 2.5;
  } else if (minutesLate <= 45) {
    rating = 2;
  } else if (minutesLate <= 60) {
    rating = 1.5;
    
  } else if (minutesLate <= 90) {
    rating = 1;
  
  } else if (minutesLate <= 120) {
    rating = 0.5;
   
  } else {
  
  }
  
  return rating;
};

// ─────────────────────────────────────────────────────────────────────────────
// TIME EVALUATORS
// ─────────────────────────────────────────────────────────────────────────────

// Check if event is within grace
export const isOnTime = (
  actual?: Date | null,
  planned?: Date | null,
  graceMin: number = LATE_GRACE_MIN
): boolean | null => {
  const diff = diffMinutes(actual, planned);
  if (diff === null) return null;
  return diff <= graceMin;
};

// First valid stop evaluator
export const evaluateFirst = <T>(
  arr: T[],
  predicate: (item: T) => boolean,
  evaluator: (item: T) => boolean | null
): boolean | null => {
  const found = arr.find(predicate);
  return found ? evaluator(found) : null;
};

// All valid stops evaluator
export const evaluateAll = <T>(
  arr: T[],
  predicate: (item: T) => boolean,
  evaluator: (item: T) => boolean
): boolean | null => {
  const valid = arr.filter(predicate);
  if (valid.length === 0) return null;
  return valid.every(evaluator);
};
