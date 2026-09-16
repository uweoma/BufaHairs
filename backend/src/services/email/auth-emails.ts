import { env } from '../../config/env';
import { sendEmail } from './mailer';
import { renderLayout, heading, paragraph, button, infoBox } from './layout';

export function sendWelcomeEmail(to: string, name: string) {
  const html = renderLayout({
    title: 'Welcome to BufaHairs',
    preheader: 'Your crown awaits.',
    bodyHtml:
      heading(`Welcome, ${name} 👑`) +
      paragraph('Thank you for joining BufaHairs — home of premium human hair, wigs and extensions.') +
      paragraph('Explore our best sellers and find the perfect look to elevate your everyday crown.') +
      button({ label: 'Shop the Collection', url: `${env.CLIENT_URL}/shop` }),
  });
  return sendEmail({ to, subject: 'Welcome to BufaHairs 👑', html });
}

export function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const html = renderLayout({
    title: 'Verify your email',
    preheader: 'Confirm your email to activate your account.',
    bodyHtml:
      heading(`Hi ${name}, confirm your email`) +
      paragraph('Please verify your email address to secure your account and receive order updates.') +
      button({ label: 'Verify Email', url }) +
      paragraph('This link expires in 24 hours. If you did not create an account, you can ignore this email.'),
  });
  return sendEmail({ to, subject: 'Verify your BufaHairs email', html });
}

export function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const html = renderLayout({
    title: 'Reset your password',
    preheader: 'Reset your BufaHairs password.',
    bodyHtml:
      heading(`Hi ${name}, reset your password`) +
      paragraph('We received a request to reset your password. Click the button below to choose a new one.') +
      button({ label: 'Reset Password', url }) +
      infoBox('For your security, this link expires in 1 hour and can be used once.') +
      paragraph('If you did not request this, please ignore this email — your password will not change.'),
  });
  return sendEmail({ to, subject: 'Reset your BufaHairs password', html });
}
