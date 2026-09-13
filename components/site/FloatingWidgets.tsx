'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, MessageSquareText } from 'lucide-react';
import type { WebsiteFloatingSetting } from '@/lib/websiteSettingService';
import { socialIconPath, whatsappHref } from '@/lib/siteContent';

/**
 * Floating action stack — WhatsApp, quick enquiry and back-to-top, each shown
 * only when the CMS enables it. With no floating-setting record saved yet, only
 * back-to-top shows: it's the one action that can't be misconfigured.
 */
export default function FloatingWidgets({ setting }: { setting: WebsiteFloatingSetting | null }) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const whatsappEnabled = setting?.whatsappEnabled && !!setting.whatsappPhone;
  const enquiryEnabled = setting?.quickEnquiryEnabled && !!setting.quickEnquiryUrl;
  const backToTopEnabled = setting?.backToTopEnabled !== false;
  const whatsappPath = socialIconPath('WHATSAPP');

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2.5 sm:right-6 sm:bottom-6">
      {whatsappEnabled && whatsappPath && (
        <a
          href={whatsappHref(setting.whatsappPhone, setting.whatsappMessage)}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Chat on WhatsApp"
          // WhatsApp green is the brand's own, not the school's theme color.
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-premium-lg transition-transform hover:-translate-y-0.5"
        >
          <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
            <path d={whatsappPath} />
          </svg>
        </a>
      )}

      {enquiryEnabled && (
        <a
          href={setting.quickEnquiryUrl}
          className="group flex h-12 items-center gap-2 rounded-full bg-button-bg px-4 text-sm font-bold text-button-text shadow-glow-button transition-transform hover:-translate-y-0.5"
        >
          <MessageSquareText size={20} className="shrink-0" />
          <span className="hidden sm:inline">{setting.quickEnquiryLabel || 'Quick Enquiry'}</span>
        </a>
      )}

      {backToTopEnabled && (
        <a
          href="#home"
          aria-label="Back to top"
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-premium-lg transition-all duration-300 hover:-translate-y-0.5 ${
            showTop ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
          }`}
        >
          <ArrowUp size={20} />
        </a>
      )}
    </div>
  );
}
