/* Minimal structured logger — avoids a heavy dependency while keeping
 * consistent, timestamped output. Swap for pino/winston in production if
 * centralized logging is required. */
import { env } from './env';

type Level = 'debug' | 'info' | 'warn' | 'error';

const COLORS: Record<Level, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};
const RESET = '\x1b[0m';

function log(level: Level, message: unknown, ...meta: unknown[]) {
  if (level === 'debug' && !env.isDev) return;
  const ts = new Date().toISOString();
  const color = env.isDev ? COLORS[level] : '';
  const reset = env.isDev ? RESET : '';
  // eslint-disable-next-line no-console
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`${color}[${ts}] ${level.toUpperCase()}${reset}`, message, ...meta);
}

export const logger = {
  debug: (m: unknown, ...meta: unknown[]) => log('debug', m, ...meta),
  info: (m: unknown, ...meta: unknown[]) => log('info', m, ...meta),
  warn: (m: unknown, ...meta: unknown[]) => log('warn', m, ...meta),
  error: (m: unknown, ...meta: unknown[]) => log('error', m, ...meta),
};
