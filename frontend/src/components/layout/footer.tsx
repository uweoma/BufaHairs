'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Instagram, Facebook, Twitter, Mail, Loader2 } from 'lucide-react';
import { Logo } from './logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { http, ApiError } from '@/lib/api';
import { FOOTER_LINKS, BRAND_DESCRIPTION, BRAND_NAME } from '@/lib/constants';

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
    <footer className="mt-16 bg-dark text-white/80">
      <div className="container py-14">
        {/* Newsletter */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <h3 className="font-serif text-2xl font-semibold text-white">Join the BufaHairs circle</h3>
            <p className="mt-2 text-sm text-white/60">
              Be first to know about new arrivals, restocks and members-only offers.
            </p>
          </div>
          <NewsletterForm />
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 py-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{BRAND_DESCRIPTION}</p>
            <div className="mt-5 flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          <FooterColumn title="Shop" links={FOOTER_LINKS.shop} />
          <FooterColumn title="Support" links={FOOTER_LINKS.support} />
          <FooterColumn title="Company" links={FOOTER_LINKS.company} />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row">
          <p>© {year} {BRAND_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <a href="mailto:hello@bufahairs.com" className="flex items-center gap-1.5 hover:text-white">
              <Mail className="h-3.5 w-3.5" /> hello@bufahairs.com
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
            <Link href={l.href} className="text-white/60 transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
