import { Resend } from 'resend';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

const resend = env.emailEnabled ? new Resend(env.RESEND_API_KEY) : null;

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a transactional email via Resend. When RESEND_API_KEY is not set
 * (typical in local dev), the email is logged instead of silently dropped —
 * so behaviour is transparent and never faked. Never throws to the caller:
 * a failed notification must not break the core flow (e.g. order creation).
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  if (!resend) {
    logger.info(`📧 [email disabled] To: ${to} | Subject: ${subject}`);
    logger.debug(html);
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
    if (error) {
      logger.error('Resend error', error);
      return false;
    }
    logger.info(`📧 Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    logger.error('Failed to send email', err);
    return false;
  }
}
