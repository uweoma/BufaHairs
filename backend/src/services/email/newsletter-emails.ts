import { env } from '../../config/env';
import { sendEmail } from './mailer';
import { renderLayout, heading, paragraph, button } from './layout';

/**
 * Confirmation email sent when someone subscribes to the newsletter.
 * Like every other email, this is a no-op log when Resend is not configured
 * (see mailer.sendEmail) and never throws to the caller.
 */
export function sendNewsletterWelcomeEmail(to: string) {
  const html = renderLayout({
    title: "You're on the list",
    preheader: 'Welcome to the BufaHairs circle — exclusive drops incoming.',
    bodyHtml:
      heading('Welcome to the circle 👑') +
      paragraph(
        "You're subscribed to BufaHairs. You'll be first to know about new arrivals, restocks and members-only offers.",
      ) +
      paragraph('In the meantime, explore our best sellers and find your next crown.') +
      button({ label: 'Shop the Collection', url: `${env.CLIENT_URL}/shop` }),
  });
  return sendEmail({ to, subject: "You're on the list 💜", html });
}
