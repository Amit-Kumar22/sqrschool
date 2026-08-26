'use client';

import { useState } from 'react';
import {
  BarChart3,
  Contact2,
  GalleryHorizontal,
  Globe,
  Images,
  LayoutPanelTop,
  ListChecks,
  MousePointerClick,
  PanelTop,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trophy,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import WebsiteHeaderTab from './WebsiteHeaderTab';
import WebsiteHeroSlideTab from './WebsiteHeroSlideTab';
import WebsiteHeroButtonTab from './WebsiteHeroButtonTab';
import WebsiteSectionTab from './WebsiteSectionTab';
import WebsiteFeatureTab from './WebsiteFeatureTab';
import WebsiteStatisticTab from './WebsiteStatisticTab';
import WebsiteWhyChoosePointTab from './WebsiteWhyChoosePointTab';
import WebsiteTopperTab from './WebsiteTopperTab';
import WebsiteGalleryItemTab from './WebsiteGalleryItemTab';
import WebsiteSocialLinkTab from './WebsiteSocialLinkTab';
import WebsiteContactTab from './WebsiteContactTab';
import WebsiteFloatingSettingTab from './WebsiteFloatingSettingTab';

const TABS: TabItem[] = [
  { key: 'header', label: 'Header', icon: PanelTop },
  { key: 'hero-slide', label: 'Hero Slides', icon: GalleryHorizontal },
  { key: 'hero-button', label: 'Hero Buttons', icon: MousePointerClick },
  { key: 'section', label: 'Sections', icon: LayoutPanelTop },
  { key: 'feature', label: 'Features', icon: Sparkles },
  { key: 'statistic', label: 'Statistics', icon: BarChart3 },
  { key: 'why-choose-point', label: 'Why Choose Us', icon: ListChecks },
  { key: 'topper', label: 'Toppers', icon: Trophy },
  { key: 'gallery-item', label: 'Gallery', icon: Images },
  { key: 'social-link', label: 'Social Links', icon: Share2 },
  { key: 'contact', label: 'Contact', icon: Contact2 },
  { key: 'floating-setting', label: 'Floating Widgets', icon: SlidersHorizontal },
];

/** Website Settings — a tabbed CMS for the public marketing site, shared between the Staff and Super Admin panels. */
export default function WebsiteSettingPageContent() {
  const [active, setActive] = useState(TABS[0].key);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Globe}
        title="Website Settings"
        description="Manage the public marketing website's header, hero, sections and content."
      />

      <div className="card-premium overflow-hidden">
        <Tabs tabs={TABS} active={active} onChange={setActive} />
        <div className="p-3 sm:p-4">
          {active === 'header' && <WebsiteHeaderTab />}
          {active === 'hero-slide' && <WebsiteHeroSlideTab />}
          {active === 'hero-button' && <WebsiteHeroButtonTab />}
          {active === 'section' && <WebsiteSectionTab />}
          {active === 'feature' && <WebsiteFeatureTab />}
          {active === 'statistic' && <WebsiteStatisticTab />}
          {active === 'why-choose-point' && <WebsiteWhyChoosePointTab />}
          {active === 'topper' && <WebsiteTopperTab />}
          {active === 'gallery-item' && <WebsiteGalleryItemTab />}
          {active === 'social-link' && <WebsiteSocialLinkTab />}
          {active === 'contact' && <WebsiteContactTab />}
          {active === 'floating-setting' && <WebsiteFloatingSettingTab />}
        </div>
      </div>
    </div>
  );
}
