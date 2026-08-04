import type { Theme } from '@/lib/api';

export type ColorFieldKey = Extract<
  keyof Theme,
  | 'primaryColor'
  | 'secondaryColor'
  | 'backgroundColor'
  | 'textColor'
  | 'headingColor'
  | 'linkColor'
  | 'buttonBgColor'
  | 'buttonTextColor'
  | 'navbarBgColor'
  | 'navbarTextColor'
  | 'bottomNavBgColor'
  | 'bottomNavTextColor'
  | 'footerBgColor'
  | 'footerTextColor'
>;

interface ColorFieldGroup {
  title: string;
  fields: { key: ColorFieldKey; label: string }[];
}

export const COLOR_FIELD_GROUPS: ColorFieldGroup[] = [
  {
    title: 'Base colors',
    fields: [
      { key: 'primaryColor', label: 'Primary' },
      { key: 'secondaryColor', label: 'Secondary' },
      { key: 'backgroundColor', label: 'Background' },
      { key: 'textColor', label: 'Text' },
      { key: 'headingColor', label: 'Heading' },
      { key: 'linkColor', label: 'Link' },
    ],
  },
  {
    title: 'Buttons',
    fields: [
      { key: 'buttonBgColor', label: 'Button background' },
      { key: 'buttonTextColor', label: 'Button text' },
    ],
  },
  {
    title: 'Navbar',
    fields: [
      { key: 'navbarBgColor', label: 'Navbar background' },
      { key: 'navbarTextColor', label: 'Navbar text' },
    ],
  },
  {
    title: 'Bottom navigation',
    fields: [
      { key: 'bottomNavBgColor', label: 'Bottom nav background' },
      { key: 'bottomNavTextColor', label: 'Bottom nav text' },
    ],
  },
  {
    title: 'Footer',
    fields: [
      { key: 'footerBgColor', label: 'Footer background' },
      { key: 'footerTextColor', label: 'Footer text' },
    ],
  },
];

export const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
