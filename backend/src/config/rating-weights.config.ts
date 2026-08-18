/**
 * Rating Weights Configuration
 *
 * Default weights match the role-based scoring spec.
 * Any weight can be overridden via the corresponding .env variable.
 * If overridden weights do not sum to 1.0 they are auto-normalised.
 *
 * Driver env keys:
 *   RATING_DRIVER_ON_TIME_PICKUP    (default 0.40)
 *   RATING_DRIVER_ON_TIME_DELIVERY  (default 0.40)
 *   RATING_DRIVER_POD_UPLOAD        (default 0.20)
 *
 * Carrier env keys:
 *   RATING_CARRIER_DRIVER_SCORE      (default 1.0)
 *
 * Customer env keys:
 *   RATING_CUSTOMER_PAYMENT_DELAY    (default 0.100)
 */

export interface DriverWeights extends Record<string, number> {
  onTimePickup:   number;  // On-time Pickup    (40%)
  onTimeDelivery: number;  // On-time Delivery  (40%)
  podUploaded:    number;  // POD Upload        (20%)
}

export interface CarrierWeights extends Record<string, number> {
  driverScore:      number;  // Driver Score      (100%)
}

export interface CustomerWeights extends Record<string, number> {
  paymentDelay:  number;  // Payment Delay   (100%)
}

// ─────────────────────────────────────────────────────────────────────────────

function parseWeight(envKey: string, fallback: number): number {
  const v = parseFloat(process.env[envKey] ?? '');
  return isNaN(v) || v < 0 ? fallback : v;
}

function normalizeWeights<T extends Record<string, number>>(raw: T): T {
  const total = Object.values(raw).reduce((s, v) => s + v, 0);
  if (Math.abs(total - 1) < 0.001) return raw;
  console.warn(
    `[RatingWeights] weights sum to ${total.toFixed(4)}, auto-normalising to 1.0`
  );
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, v / total])
  ) as T;
}

// ─── Driver weights ───────────────────────────────────────────────────────────

export const driverWeights: Readonly<DriverWeights> = Object.freeze(
  normalizeWeights<DriverWeights>({
    onTimePickup:   parseWeight('RATING_DRIVER_ON_TIME_PICKUP',   0.40),
    onTimeDelivery: parseWeight('RATING_DRIVER_ON_TIME_DELIVERY', 0.40),
    podUploaded:    parseWeight('RATING_DRIVER_POD_UPLOAD',       0.20),
  })
);

// ─── Carrier weights ──────────────────────────────────────────────────────────

export const carrierWeights: Readonly<CarrierWeights> = Object.freeze(
  normalizeWeights<CarrierWeights>({
    driverScore:      parseWeight('RATING_CARRIER_DRIVER_SCORE',      1.0),
  })
);

// ─── Customer weights ─────────────────────────────────────────────────────────

export const customerWeights: Readonly<CustomerWeights> = Object.freeze(
  normalizeWeights<CustomerWeights>({
    paymentDelay:  parseWeight('RATING_CUSTOMER_PAYMENT_DELAY', 0.100),
  })
);
