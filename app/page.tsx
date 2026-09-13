'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { EMPTY_WEBSITE_CONTENT, getWebsiteContent, type WebsiteContent } from '@/lib/freeService';
import {
  activeSorted,
  buildSectionMap,
  DEFAULT_NAV_ITEMS,
  isSectionEnabled,
  resolveSiteVariant,
  sectionCopy,
  sectionOrder,
  yearsOfExcellence,
  type SiteSectionKey,
} from '@/lib/siteContent';
import TopBar from '@/components/site/TopBar';
import SiteHeader from '@/components/site/SiteHeader';
import Hero from '@/components/site/Hero';
import AnnouncementBar from '@/components/site/AnnouncementBar';
import FeatureStrip from '@/components/site/FeatureStrip';
import AboutSection from '@/components/site/AboutSection';
import StatsBand from '@/components/site/StatsBand';
import ToppersSection from '@/components/site/ToppersSection';
import GallerySection from '@/components/site/GallerySection';
import WhyChooseSection from '@/components/site/WhyChooseSection';
import TestimonialsSection from '@/components/site/TestimonialsSection';
import AdmissionCta from '@/components/site/AdmissionCta';
import SiteFooter from '@/components/site/SiteFooter';
import FloatingWidgets from '@/components/site/FloatingWidgets';

// The pillar strip takes the first few features; anything beyond that becomes
// the highlight grid inside the About block, so a CMS with a long feature list
// fills both without either repeating the other.
const STRIP_FEATURE_COUNT = 5;

/** Ordered content blocks; `fallback` is this page's own position, used when the CMS has no displayOrder for the section and to break ties. */
interface ContentBlock {
  id: string;
  order: number;
  fallback: number;
  node: ReactNode;
}

function SiteSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-20 bg-navbar-bg" />
      <div className="skeleton h-[30rem] w-full sm:h-[34rem]" />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="skeleton h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function Home() {
  const { theme, loading: themeLoading } = useTheme();
  const [content, setContent] = useState<WebsiteContent>(EMPTY_WEBSITE_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A failed request keeps the empty content shell — the page still renders
    // its chrome and a name-only hero rather than going blank.
    getWebsiteContent()
      .then(setContent)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sections = useMemo(() => buildSectionMap(content.sections), [content.sections]);

  const data = useMemo(
    () => ({
      navItems: activeSorted(content.navigationItems),
      socials: activeSorted(content.socialLinks),
      heroSlides: activeSorted(content.heroSlides),
      features: activeSorted(content.features),
      statistics: activeSorted(content.statistics),
      galleryItems: activeSorted(content.galleryItems),
      testimonials: activeSorted(content.testimonials),
      whyChoosePoints: activeSorted(content.whyChoosePoints),
      toppers: content.toppers.filter((topper) => topper.active !== false).sort((a, b) => a.rank - b.rank),
    }),
    [content],
  );

  if (loading || themeLoading) return <SiteSkeleton />;

  // The active colour theme decides both the palette (CSS vars, via
  // ThemeContext) and which of the two premium layouts the page renders.
  const variant = resolveSiteVariant(theme.themeType);

  const schoolName = content.setting?.schoolName?.trim() || theme.companyName || 'SQR School';
  const tagline = content.setting?.tagline?.trim() || '';
  const enquiryUrl = content.header?.ctaUrl?.trim() || '#contact';
  const navItems = data.navItems.length > 0 ? data.navItems : DEFAULT_NAV_ITEMS;

  const stripFeatures = data.features.slice(0, STRIP_FEATURE_COUNT);
  const aboutHighlights = data.features.slice(STRIP_FEATURE_COUNT);

  const photos = data.galleryItems.filter((item) => (item.type ?? '').toUpperCase() !== 'VIDEO');
  const video = data.galleryItems.find((item) => (item.type ?? '').toUpperCase() === 'VIDEO');
  const aboutMedia = {
    src: photos[0]?.imageUrl ?? '/images/building.jpg',
    alt: `${schoolName} campus`,
    videoUrl: video?.imageUrl,
  };
  const whyChooseImage = photos[1]?.imageUrl ?? photos[0]?.imageUrl ?? '/images/faculty.jpg';

  const topperSession = data.toppers.find((topper) => topper.session)?.session;

  const copyFor = {
    announcement: sectionCopy(sections, 'ANNOUNCEMENT', {
      eyebrow: 'Latest Announcement',
      title: '',
      description: '',
    }),
    features: sectionCopy(sections, 'FEATURES', { eyebrow: '', title: '', description: '' }),
    about: sectionCopy(sections, 'ABOUT', {
      eyebrow: 'About Us',
      title: content.setting?.establishedYear
        ? `Excellence in Education Since ${content.setting.establishedYear}`
        : 'Excellence in Education',
      description: '',
    }),
    toppers: sectionCopy(sections, 'TOPPERS', {
      eyebrow: 'Achievements',
      title: topperSession ? `Our Toppers (${topperSession})` : 'Our Toppers',
      description: '',
    }),
    gallery: sectionCopy(sections, 'GALLERY', { eyebrow: 'Campus Life', title: 'Gallery', description: '' }),
    whyChoose: sectionCopy(sections, 'WHY_CHOOSE', { eyebrow: '', title: 'Why Choose Us?', description: '' }),
    testimonials: sectionCopy(sections, 'TESTIMONIALS', {
      eyebrow: 'Testimonials',
      title: 'What Parents Say',
      description: '',
    }),
    admission: sectionCopy(sections, 'ADMISSION_CTA', {
      eyebrow: 'Admissions',
      title: 'Admissions are now open',
      description: '',
    }),
  };

  const show = (key: SiteSectionKey, hasContent: boolean) => hasContent && isSectionEnabled(sections, key);
  const showGallery = show('GALLERY', data.galleryItems.length > 0);
  const showWhyChoose = show('WHY_CHOOSE', data.whyChoosePoints.length > 0);
  const showTestimonials = show('TESTIMONIALS', data.testimonials.length > 0);

  const blocks: ContentBlock[] = [];
  const push = (id: string, keys: [SiteSectionKey, number][], node: ReactNode) => {
    // A pair of sections takes the earlier of the two positions so the row
    // lands where the first of its halves was ordered.
    const fallback = Math.min(...keys.map(([, position]) => position));
    const order = Math.min(...keys.map(([key, position]) => sectionOrder(sections, key, position)));
    blocks.push({ id, order, fallback, node });
  };

  if (show('FEATURES', stripFeatures.length > 0)) {
    push('features', [['FEATURES', 1]], <FeatureStrip features={stripFeatures} />);
  }

  if (show('ABOUT', Boolean(sections.ABOUT) || aboutHighlights.length > 0)) {
    push(
      'about',
      [['ABOUT', 2]],
      <AboutSection
        copy={copyFor.about}
        highlights={aboutHighlights}
        media={aboutMedia}
        variant={variant}
        ctaLabel="Read More About Us"
        ctaUrl={enquiryUrl}
      />,
    );
  }

  if (show('STATISTICS', data.statistics.length > 0)) {
    push('statistics', [['STATISTICS', 3]], <StatsBand stats={data.statistics} variant={variant} />);
  }

  if (show('TOPPERS', data.toppers.length > 0)) {
    push('toppers', [['TOPPERS', 4]], <ToppersSection toppers={data.toppers} copy={copyFor.toppers} />);
  }

  const galleryPanel = showGallery && (
    <GallerySection items={data.galleryItems} copy={copyFor.gallery} layout="panel" ctaUrl="#gallery" />
  );
  const whyChoosePanel = (tone: 'dark' | 'light') =>
    showWhyChoose && (
      <WhyChooseSection
        points={data.whyChoosePoints}
        copy={copyFor.whyChoose}
        image={whyChooseImage}
        ctaLabel="Take Campus Tour"
        ctaUrl={enquiryUrl}
        tone={tone}
      />
    );

  if (variant === 'split') {
    // Split layout: the gallery shares a row with "why choose us", and the
    // testimonials run full width beneath them.
    if (showGallery || showWhyChoose) {
      push(
        'gallery-why',
        [
          ['GALLERY', 5],
          ['WHY_CHOOSE', 6],
        ],
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2">
          {galleryPanel}
          {whyChoosePanel('light')}
        </div>,
      );
    }
    if (showTestimonials) {
      push(
        'testimonials',
        [['TESTIMONIALS', 7]],
        <TestimonialsSection testimonials={data.testimonials} copy={copyFor.testimonials} layout="wide" />,
      );
    }
  } else {
    // Classic layout: a full-width gallery strip, then "why choose us"
    // alongside the testimonials.
    if (showGallery) {
      push(
        'gallery',
        [['GALLERY', 5]],
        <GallerySection items={data.galleryItems} copy={copyFor.gallery} layout="wide" ctaUrl="#gallery" />,
      );
    }
    if (showWhyChoose || showTestimonials) {
      push(
        'why-testimonials',
        [
          ['WHY_CHOOSE', 6],
          ['TESTIMONIALS', 7],
        ],
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-5">
          {/* min-w-0: without it a grid item's auto minimum lets the panels'
              content widen the track past the viewport on phones. */}
          <div className="min-w-0 lg:col-span-2">{whyChoosePanel('dark')}</div>
          <div className="min-w-0 lg:col-span-3">
            {showTestimonials && (
              <TestimonialsSection testimonials={data.testimonials} copy={copyFor.testimonials} layout="panel" />
            )}
          </div>
        </div>,
      );
    }
  }

  // Unlike every other block this one is pure copy, so it renders only when the
  // CMS actually configured the section — there's no list to infer it from.
  if (show('ADMISSION_CTA', Boolean(sections.ADMISSION_CTA))) {
    push(
      'admission-cta',
      [['ADMISSION_CTA', 8]],
      <AdmissionCta copy={copyFor.admission} ctaLabel="Enquire Now" ctaUrl={enquiryUrl} />,
    );
  }

  blocks.sort((a, b) => a.order - b.order || a.fallback - b.fallback);

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar contact={content.contact} socials={data.socials} />
      <SiteHeader
        header={content.header}
        navItems={navItems}
        schoolName={schoolName}
        tagline={tagline}
      />

      <main className="flex-1">
        {isSectionEnabled(sections, 'HERO') && (
          <Hero
            slides={data.heroSlides}
            buttons={content.heroButtons}
            variant={variant}
            schoolName={schoolName}
            tagline={tagline}
            yearsOfExcellence={yearsOfExcellence(content.setting?.establishedYear)}
          />
        )}

        {isSectionEnabled(sections, 'ANNOUNCEMENT') && (
          <AnnouncementBar
            copy={copyFor.announcement}
            holiday={content.holiday}
            ctaLabel="Apply Now"
            ctaUrl={enquiryUrl}
          />
        )}

        {blocks.map((block) => (
          <div key={block.id}>{block.node}</div>
        ))}
      </main>

      <SiteFooter
        setting={content.setting}
        contact={content.contact}
        navItems={navItems}
        socials={data.socials}
        schoolName={schoolName}
        tagline={tagline}
        logoUrl={content.header?.logoUrl ?? ''}
      />

      <FloatingWidgets setting={content.floatingSetting} />
    </div>
  );
}
