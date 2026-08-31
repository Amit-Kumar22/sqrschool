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
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import SchoolPageContent from '@/components/school/SchoolPageContent';
import YoutubeContent from '../youtube-testimonial/YoutubeContent';
import HolidayPageContent from "../holiday/HolidayPageContent"
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
  { key: 'school', label: 'School', icon: PanelTop },
  { key: 'holiday', label: 'Holiday', icon: PanelTop },
  { key: 'youtube', label: 'Youtube', icon: PanelTop },
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
  const activeTabLabel = TABS.find((tab) => tab.key === active)?.label ?? 'Website Settings';

  return (
    <div className="space-y-4">
      {/* Wins over any SetPageTitle the active tab's own content sets (e.g. SchoolPageContent, YoutubeContent) — this effect always fires last since it's the parent and re-runs on every tab switch. */}
      <SetPageTitle title={activeTabLabel} />

      <div className="card-premium overflow-hidden">
        <Tabs tabs={TABS} active={active} onChange={setActive} />
        <div className="p-3 sm:p-4">
          {active === 'school' && <SchoolPageContent />}
          {active === 'holiday' && <HolidayPageContent />}
          {active === 'youtube' && <YoutubeContent />}
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
