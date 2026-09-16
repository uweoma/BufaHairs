/** Parses durations like "15m", "7d", "1h", "30s", "500ms" into milliseconds. */
const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseDurationMs(input: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(input.trim());
  if (!match) throw new Error(`Invalid duration: ${input}`);
  const [, value, unit] = match;
  return Number(value) * UNIT_MS[unit];
}
