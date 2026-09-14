'use client';

import AboutSection from '@/components/site/sections/AboutSection';
import AdmissionCta from '@/components/site/sections/AdmissionCta';
import AnnouncementBar from '@/components/site/sections/AnnouncementBar';
import FeatureStrip from '@/components/site/sections/FeatureStrip';
import FloatingWidgets from '@/components/site/sections/FloatingWidgets';
import GallerySection from '@/components/site/sections/GallerySection';
import SiteFooter from '@/components/site/sections/SiteFooter';
import SiteHeader from '@/components/site/sections/SiteHeader';
import StatsBand from '@/components/site/sections/StatsBand';
import TestimonialsSection from '@/components/site/sections/TestimonialsSection';
import ToppersSection from '@/components/site/sections/ToppersSection';
import TopBar from '@/components/site/sections/TopBar';
import WhyChooseSection from '@/components/site/sections/WhyChooseSection';
import { orderBlocks, type TemplateBlock } from '@/components/site/useSiteContent';
import type { SiteTemplateProps } from '../types';
import ShowcaseHero from './Hero';

/**
 * Premium 03 — "Showcase": light utility bar and centred nav over a shaped
 * hero, the announcement as an inset card, the about photo on the left, and
 * every closing block run full width.
 */
export default function Premium03Template({ site }: SiteTemplateProps) {
  const blocks: TemplateBlock[] = [];

  if (site.shows.FEATURES) {
    blocks.push({ id: 'features', keys: [['FEATURES', 1]], node: <FeatureStrip features={site.stripFeatures} /> });
  }

  if (site.shows.ABOUT) {
    blocks.push({
      id: 'about',
      keys: [['ABOUT', 2]],
      node: (
        <AboutSection
          copy={site.copy.about}
          highlights={site.aboutHighlights}
          media={site.aboutMedia}
          mediaSide="left"
          ctaLabel="Read More About Us"
          ctaUrl={site.enquiryUrl}
        />
      ),
    });
  }

  if (site.shows.STATISTICS) {
    blocks.push({
      id: 'statistics',
      keys: [['STATISTICS', 3]],
      node: <StatsBand stats={site.statistics} layout="card" />,
    });
  }

  if (site.shows.TOPPERS) {
    blocks.push({
      id: 'toppers',
      keys: [['TOPPERS', 4]],
      node: <ToppersSection toppers={site.toppers} copy={site.copy.toppers} />,
    });
  }

  if (site.shows.GALLERY) {
    blocks.push({
      id: 'gallery',
      keys: [['GALLERY', 5]],
      node: <GallerySection items={site.galleryItems} copy={site.copy.gallery} layout="wide" ctaUrl="#gallery" />,
    });
  }

  if (site.shows.WHY_CHOOSE) {
    blocks.push({
      id: 'why-choose',
      keys: [['WHY_CHOOSE', 6]],
      node: (
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <WhyChooseSection
            points={site.whyChoosePoints}
            copy={site.copy.whyChoose}
            image={site.whyChooseImage}
            ctaLabel="Take Campus Tour"
            ctaUrl={site.enquiryUrl}
            tone="light"
          />
        </div>
      ),
    });
  }

  if (site.shows.TESTIMONIALS) {
    blocks.push({
      id: 'testimonials',
      keys: [['TESTIMONIALS', 7]],
      node: <TestimonialsSection testimonials={site.testimonials} copy={site.copy.testimonials} layout="wide" />,
    });
  }

  if (site.shows.ADMISSION_CTA) {
    blocks.push({
      id: 'admission-cta',
      keys: [['ADMISSION_CTA', 8]],
      node: (
        <AdmissionCta
          copy={site.copy.admission}
          ctaLabel="Apply for Admission"
          ctaUrl={site.enquiryUrl}
          // This band carries a photo and a second, quieter action.
          image={site.photos[2]?.imageUrl ?? site.photos[0]?.imageUrl ?? null}
          secondary={{ label: 'Contact School', url: '#contact' }}
        />
      ),
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar contact={site.content.contact} socials={site.socials} tone="light" />
      <SiteHeader
        header={site.content.header}
        navItems={site.navItems}
        schoolName={site.schoolName}
        tagline={site.tagline}
        navAlign="center"
      />

      <main className="flex-1">
        {site.shows.HERO && <ShowcaseHero site={site} />}
        {site.shows.ANNOUNCEMENT && (
          <AnnouncementBar
            copy={site.copy.announcement}
            holiday={site.content.holiday}
            ctaLabel="Apply Now"
            ctaUrl={site.enquiryUrl}
            layout="card"
          />
        )}
        {orderBlocks(blocks, site.order).map((block) => (
          <div key={block.id}>{block.node}</div>
        ))}
      </main>

      <SiteFooter
        setting={site.content.setting}
        contact={site.content.contact}
        navItems={site.navItems}
        socials={site.socials}
        schoolName={site.schoolName}
        tagline={site.tagline}
        logoUrl={site.content.header?.logoUrl ?? ''}
      />
      <FloatingWidgets setting={site.content.floatingSetting} />
    </div>
  );
}
