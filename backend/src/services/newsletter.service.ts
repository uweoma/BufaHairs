import { prisma } from '../config/prisma';

/**
 * Idempotent subscribe. Re-subscribing a previously unsubscribed email simply
 * reactivates it. We never reveal whether an email already existed.
 */
export async function subscribe(email: string) {
  const normalized = email.trim().toLowerCase();
  await prisma.newsletterSubscriber.upsert({
    where: { email: normalized },
    update: { isActive: true },
    create: { email: normalized, isActive: true },
  });
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
