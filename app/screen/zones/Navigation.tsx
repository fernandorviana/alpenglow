'use client';

import type { ReactNode } from 'react';
import { SideNav } from '@/components/SideNav';
import type { SideNavItem } from '@/components/SideNav';
import type { LinkRenderProps } from '@/components/linkRender';
import { useMediaQuery } from '@/components/useMediaQuery';
import { media } from '@/tokens/scale';
import { CalendarGlyph, Clients, Messages, Reports, Settings, Today } from './glyphs';

export const sections = ['today', 'calendar', 'clients', 'messages', 'reports', 'settings'] as const;
export type Section = (typeof sections)[number];

export const SECTION_LABEL: Record<Section, string> = {
  today: 'Today',
  calendar: 'Calendar',
  clients: 'Clients',
  messages: 'Messages',
  reports: 'Reports',
  settings: 'Settings',
};

export const SECTION_ICON: Record<Section, ReactNode> = {
  today: <Today />,
  calendar: <CalendarGlyph />,
  clients: <Clients />,
  messages: <Messages />,
  reports: <Reports />,
  settings: <Settings />,
};

/** The spec puts 768 in the sheet and 1024 on the rail: the sheet is below lg. */
export const NAV_NARROW = media.down.lg;

const item = (section: Section, current: Section): SideNavItem => ({
  href: `#${section}`,
  label: SECTION_LABEL[section],
  icon: SECTION_ICON[section],
  current: section === current,
});

/** Only Today is real; the others lead to an EmptyState in the body. */
export function Navigation({
  section,
  onSection,
  open,
  onClose,
}: {
  section: Section;
  onSection: (section: Section) => void;
  open: boolean;
  onClose: () => void;
}) {
  // On the rail below xl, expanded from xl.
  const collapsed = useMediaQuery(media.down.xl);

  const renderLink = (props: LinkRenderProps) => (
    <a
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onSection(props.href.slice(1) as Section);
        onClose();
      }}
    />
  );

  return (
    <SideNav
      items={(['today', 'calendar', 'clients', 'messages', 'reports'] as const).map((s) => item(s, section))}
      footer={[item('settings', section)]}
      renderLink={renderLink}
      collapsed={collapsed}
      narrow={NAV_NARROW}
      open={open}
      onClose={onClose}
    />
  );
}
