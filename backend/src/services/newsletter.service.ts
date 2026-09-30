import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { sendNewsletterWelcomeEmail } from './email/newsletter-emails';

/**
 * Idempotent subscribe. Re-subscribing a previously unsubscribed email simply
 * reactivates it. We never reveal whether an email already existed.
 *
 * A welcome email is sent to brand-new or reactivated subscribers only (not to
 * an address that was already active), fire-and-forget so a mail failure never
 * breaks the subscribe flow.
 */
export async function subscribe(email: string) {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalized },
    select: { isActive: true },
  });
  await prisma.newsletterSubscriber.upsert({
    where: { email: normalized },
    update: { isActive: true },
    create: { email: normalized, isActive: true },
  });

  const isNewOrReactivated = !existing || !existing.isActive;
  if (isNewOrReactivated) {
    void sendNewsletterWelcomeEmail(normalized).catch((err) =>
      logger.error('Newsletter welcome email failed', err),
    );
  }
  return { subscribed: true };
}

export async function unsubscribe(email: string) {
  const normalized = email.trim().toLowerCase();
  await prisma.newsletterSubscriber.updateMany({
    where: { email: normalized },
    data: { isActive: false },
  });
  return { unsubscribed: true };
}
