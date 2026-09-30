'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ComponentType } from 'react';
import { toast } from 'sonner';
import { Instagram, Facebook, Twitter, Mail, Loader2 } from 'lucide-react';
import { Logo } from './logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { http, ApiError } from '@/lib/api';
import {
  FOOTER_LINKS,
  BRAND_DESCRIPTION,
  BRAND_NAME,
  SOCIAL_LINKS,
  CONTACT_EMAIL,
  type SocialIcon,
} from '@/lib/constants';

/** TikTok isn't in lucide, so we ship a small inline glyph. */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.08-.14 1.62.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<SocialIcon, ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  tiktok: TikTokIcon,
  facebook: Facebook,
  twitter: Twitter,
};

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await http.post('/newsletter/subscribe', { email: email.trim() }, { auth: false });
      toast.success("You're subscribed!", { description: 'Watch your inbox for exclusive drops.' });
      setEmail('');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not subscribe. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm gap-2">
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        aria-label="Email address"
        className="bg-white/10 text-white placeholder:text-white/50 border-white/20 focus-visible:ring-white/40"
      />
      <Button type="submit" variant="secondary" disabled={loading} className="shrink-0">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
      </Button>
    </form>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-primary-royal text-white/90">
      <div className="container py-14">
        {/* Newsletter */}
        <div className="flex flex-col gap-6 border-b border-white/25 pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <h3 className="font-serif text-2xl font-semibold text-white">Join the BufaHairs circle</h3>
            <p className="mt-2 text-sm text-white/85">
              Be first to know about new arrivals, restocks and members-only offers.
            </p>
          </div>
          <NewsletterForm />
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 py-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo inverted />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/85">{BRAND_DESCRIPTION}</p>
            {SOCIAL_LINKS.length > 0 && (
              <div className="mt-5 flex gap-3">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = SOCIAL_ICONS[social.icon];
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="rounded-full bg-white/15 p-2 transition-colors hover:bg-white/25"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <FooterColumn title="Shop" links={FOOTER_LINKS.shop} />
          <FooterColumn title="Support" links={FOOTER_LINKS.support} />
          <FooterColumn title="Company" links={FOOTER_LINKS.company} />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/25 pt-8 text-xs text-white/80 sm:flex-row">
          <p>© {year} {BRAND_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-1.5 hover:text-white">
              <Mail className="h-3.5 w-3.5" /> {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{title}</h4>
      <ul className="space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-white/85 transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
