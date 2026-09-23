'use client';

import type { ReactNode } from 'react';
import { SideNav } from '@/components/SideNav';
import type { SideNavItem } from '@/components/SideNav';
import type { LinkRenderProps } from '@/components/linkRender';
import { useMediaQuery } from '@/components/useMediaQuery';
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

/**
 * The spec's table puts 768 in the sheet; SIDE_NAV_NARROW is 760. Waiting on
 * the breakpoints piece of wave 4.
 */
export const NAV_NARROW = '(max-width: 800px)';

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
  // The spec's table puts 1024 on the rail. Waiting on the breakpoints piece of wave 4.
  const collapsed = useMediaQuery('(max-width: 1279px)');

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
