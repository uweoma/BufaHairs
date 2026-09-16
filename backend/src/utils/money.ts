/**
 * Money helpers. Canonical storage unit is the KOBO (NGN minor unit) as an
 * integer. Never do arithmetic on naira floats.
 */
export const KOBO_PER_NAIRA = 100;

export const nairaToKobo = (naira: number): number => Math.round(naira * KOBO_PER_NAIRA);

export const koboToNaira = (kobo: number): number => kobo / KOBO_PER_NAIRA;

export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(koboToNaira(kobo));
}
