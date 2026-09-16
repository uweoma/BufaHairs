import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

type ZoneWithRates = Awaited<ReturnType<typeof loadActiveZones>>[number];

function loadActiveZones() {
  return prisma.shippingZone.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      rates: { where: { isActive: true }, orderBy: { price: 'asc' } },
    },
  });
}

const isNigeria = (country?: string | null) =>
  !country || country.trim().toLowerCase() === 'nigeria';

/**
 * Resolves the shipping zone for a destination.
 * - International address  -> the non-Nigeria (catch-all international) zone
 * - Nigerian state listed  -> that zone
 * - Nigerian state unlisted -> the catch-all Nigeria zone (empty states[])
 */
export function resolveZoneFrom(zones: ZoneWithRates[], country?: string | null, state?: string | null) {
  if (!isNigeria(country)) {
    return zones.find((z) => z.country.trim().toLowerCase() !== 'nigeria') ?? null;
  }
  const target = state?.trim().toLowerCase();
  if (target) {
    const match = zones.find(
      (z) =>
        z.country.trim().toLowerCase() === 'nigeria' &&
        z.states.some((s) => s.trim().toLowerCase() === target),
    );
    if (match) return match;
  }
  // Catch-all Nigerian zone: country Nigeria + no specific states.
  return (
    zones.find((z) => z.country.trim().toLowerCase() === 'nigeria' && z.states.length === 0) ?? null
  );
}

function computeCost(price: number, threshold: number | null | undefined, subtotal: number) {
  const free = threshold != null && subtotal >= threshold;
  return { cost: free ? 0 : price, isFree: free };
}

/** All zones + rates, for a public shipping-info page. */
export async function listZones() {
  const zones = await loadActiveZones();
  return zones.map((z) => ({
    id: z.id,
    name: z.name,
    description: z.description,
    country: z.country,
    states: z.states,
    rates: z.rates.map((r) => ({
      id: r.id,
      name: r.name,
      price: r.price,
      minDeliveryDays: r.minDeliveryDays,
      maxDeliveryDays: r.maxDeliveryDays,
      freeShippingThreshold: r.freeShippingThreshold,
    })),
  }));
}

/** Shipping options for a destination + subtotal (preview/estimate). */
export async function quote(input: { country?: string; state?: string; subtotal?: number }) {
  const zones = await loadActiveZones();
  const zone = resolveZoneFrom(zones, input.country, input.state);
  if (!zone) {
    return { zone: null, options: [], message: 'We do not currently ship to this destination' };
  }
  const subtotal = input.subtotal ?? 0;
  const options = zone.rates.map((r) => {
    const { cost, isFree } = computeCost(r.price, r.freeShippingThreshold, subtotal);
    return {
      rateId: r.id,
      name: r.name,
      price: r.price,
      cost,
      isFree,
      freeShippingThreshold: r.freeShippingThreshold,
      minDeliveryDays: r.minDeliveryDays,
      maxDeliveryDays: r.maxDeliveryDays,
      estimate: `${r.minDeliveryDays}–${r.maxDeliveryDays} business days`,
    };
  });
  return {
    zone: { id: zone.id, name: zone.name, description: zone.description },
    options,
  };
}

/**
 * Authoritative shipping cost for order creation. Validates the chosen rate is
 * active AND serves the destination, then recomputes cost from the real subtotal.
 * Never trusts a client-provided shipping amount.
 */
export async function priceSelection(params: {
  rateId: string;
  country?: string | null;
  state?: string | null;
  subtotal: number;
}) {
  const zones = await loadActiveZones();
  const destinationZone = resolveZoneFrom(zones, params.country, params.state);
  if (!destinationZone) {
    throw ApiError.badRequest('We do not currently ship to this destination');
  }
  const rate = destinationZone.rates.find((r) => r.id === params.rateId);
  if (!rate) {
    throw ApiError.badRequest('Selected shipping method is not available for this address');
  }
  const { cost, isFree } = computeCost(rate.price, rate.freeShippingThreshold, params.subtotal);
  return {
    zone: destinationZone,
    rate,
    shippingCost: cost,
    isFree,
    shippingMethod: rate.name,
    shippingZone: destinationZone.name,
  };
}
