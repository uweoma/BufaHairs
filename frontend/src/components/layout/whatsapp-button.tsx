'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_NUMBER, BRAND_NAME } from '@/lib/constants';

/**
 * Floating WhatsApp contact button. Renders only when a number is configured
 * via NEXT_PUBLIC_WHATSAPP_NUMBER (env-driven, per spec).
 */
export function WhatsAppButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !WHATSAPP_NUMBER) return null;

  const message = encodeURIComponent(
    `Hi ${BRAND_NAME}! I'd love to know more about your hair collection.`,
  );
  const href = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      <MessageCircle className="h-6 w-6 fill-white" />
      <span className="hidden text-sm font-medium sm:inline">Chat with us</span>
    </a>
  );
}
