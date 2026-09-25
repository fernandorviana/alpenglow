'use client';

import { useState } from 'react';
import {
  Add,
  Calendar,
  Catalog,
  Chat,
  Email,
  Enterprise,
  Events,
  Home,
  Location,
  Notification,
  Password,
  Receipt,
  Search,
  Settings,
  Time,
  Tools,
  User,
  UserAvatar,
  UserMultiple,
  VideoChat,
} from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { Sideways } from '@ui/Sideways';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { SideNav, SIDE_NAV_NARROW } from '@/components/SideNav';
import type { SideNavItem } from '@/components/SideNav';
import { SideNavSecondary } from '@/components/SideNavSecondary';
import type { SideNavSection } from '@/components/SideNavSecondary';
import { Table } from '@/components/Table';
import { Tooltip } from '@/components/Tooltip';
import { TopBar } from '@/components/TopBar';
import type { LinkRenderProps } from '@/components/Link';
import { resolve } from '@/tokens/contrast';
import { spacing } from '@/tokens/scale';
import type { Mode } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const USAGE = `import { TopBar, SideNav, SideNavSecondary, Button, Avatar } from 'alpenglow';

const [collapsed, setCollapsed] = useState(false);
const [open, setOpen] = useState(false);
const narrow = useMediaQuery(SIDE_NAV_NARROW); // the app's own hook, or any

<TopBar
  brand={<Logo />}
  onMenu={() => (narrow ? setOpen(true) : setCollapsed((c) => !c))}
  menuExpanded={narrow ? open : !collapsed}
  actions={<><Button iconStart={<Add />}>Create</Button><Avatar name="Helen Hernandez" /></>}
/>
<div style={{ display: 'flex', minHeight: '100dvh' }}>
  <SideNav
    items={items}
    footer={[{ href: '/settings', label: 'Settings', icon: <Settings /> }]}
    renderLink={(props) => <NextLink {...props} />}
    collapsed={collapsed}
    open={open}
    onClose={() => setOpen(false)}
  />
  <SideNavSecondary sections={sections} collapsed={aside} onCollapsedChange={setAside} />
  <main>…</main>
</div>`;

type PropRow = { prop: string; type: string; default: string };
const SIDE: PropRow[] = [
  { prop: 'items', type: 'SideNavItem[] — { href, label, icon, current? }', default: 'required' },
  { prop: 'footer', type: 'SideNavItem[]', default: '—' },
  { prop: 'renderLink', type: '(props) => ReactNode', default: 'an a' },
  { prop: 'aria-label', type: 'string', default: "'Main'" },
  { prop: 'collapsed', type: 'boolean', default: 'false' },
  { prop: 'open, onClose', type: 'boolean, () => void — narrow only', default: 'false' },
  { prop: 'narrow', type: 'string — a media query', default: "media.down.md — '(width < 48rem)'" },
  { prop: 'closeLabel, className', type: 'string', default: "'Close'" },
];
const SECONDARY: PropRow[] = [
  { prop: 'sections', type: 'SideNavSection[] — { label, items, defaultOpen? }', default: 'required' },
  { prop: 'renderLink', type: '(props) => ReactNode', default: 'an a' },
  { prop: 'aria-label', type: 'string', default: "'Section'" },
  { prop: 'collapsed, onCollapsedChange', type: 'boolean, (next) => void', default: 'false' },
  { prop: 'collapseLabel, expandLabel', type: 'string', default: "'Collapse navigation', 'Expand navigation'" },
  { prop: 'className', type: 'string', default: '—' },
];
const TOP: PropRow[] = [
  { prop: 'brand', type: 'ReactNode', default: '—' },
  { prop: 'onMenu', type: '() => void — draws the menu button', default: '—' },
  { prop: 'menuLabel, menuExpanded', type: 'string, boolean', default: "'Menu', —" },
  { prop: 'children', type: 'ReactNode — the middle', default: '—' },
  { prop: 'actions', type: 'ReactNode — the end', default: '—' },
  { prop: 'className', type: 'string', default: '—' },
];

const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

const PRIMARY = [
  { href: '/home', label: 'Home', icon: <Home size={24} /> },
  { href: '/calendar', label: 'Calendar', icon: <Calendar size={24} /> },
  { href: '/clients', label: 'Clients', icon: <UserMultiple size={24} /> },
  { href: '/video', label: 'Video & chat', icon: <VideoChat size={24} /> },
  { href: '/forms', label: 'Forms', icon: <Catalog size={24} /> },
  { href: '/staff', label: 'Staff', icon: <UserAvatar size={24} /> },
  { href: '/services', label: 'Services', icon: <Tools size={24} /> },
  { href: '/locations', label: 'Locations', icon: <Location size={24} /> },
];
const FOOT = [{ href: '/settings', label: 'Settings', icon: <Settings size={24} /> }];

const SECTIONS = [
  {
    label: 'Me',
    items: [
      { href: '/settings/profile', label: 'Profile', icon: <User size={24} /> },
      { href: '/settings/password', label: 'Login & password', icon: <Password size={24} /> },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/settings/business', label: 'Business settings', icon: <Enterprise size={24} /> },
      { href: '/settings/users', label: 'Users', icon: <Events size={24} /> },
      { href: '/settings/billing', label: 'Billing & subscription', icon: <Receipt size={24} /> },
    ],
  },
  {
    label: 'Calendar',
    items: [
      { href: '/settings/sync', label: 'Calendar sync', icon: <Calendar size={24} /> },
      { href: '/settings/hours', label: 'Working hours', icon: <Time size={24} /> },
    ],
  },
  {
    label: 'Notifications',
    defaultOpen: false,
    items: [
      { href: '/settings/notifications', label: 'Notifications', icon: <Notification size={24} /> },
      { href: '/settings/email', label: 'Email settings', icon: <Email size={24} /> },
    ],
  },
];

const TITLES: Record<string, string> = {
  '/home': 'Home',
  '/calendar': 'Calendar',
  '/clients': 'Clients',
  '/video': 'Video & chat',
  '/forms': 'Forms',
  '/staff': 'Staff',
  '/services': 'Services',
  '/locations': 'Locations',
  '/settings': 'Settings',
};

export default function Page() {
  const [current, setCurrent] = useState('/settings/profile');
  const [collapsed, setCollapsed] = useState(false);
  const [aside, setAside] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [open, setOpen] = useState(false);

  // The page's own links: nothing to navigate to, so a press moves the mark.
  const renderLink = (props: LinkRenderProps) => (
    <a
      {...props}
      onClick={(event) => {
        event.preventDefault();
        setCurrent(props.href);
        setOpen(false);
      }}
    />
  );
  const mark = (items: SideNavItem[]) => items.map((item) => ({ ...item, current: item.href === current }));
  const section = current.startsWith('/settings') ? '/settings' : current;
  const sections: SideNavSection[] = SECTIONS.map((s) => ({ ...s, items: mark(s.items) }));

  return (
    <DocPage
      evidence={
        <>
          <div>
            <p>the current item, on surface/base</p>
            {MODES.map((mode) => (
              <p key={mode}>
                {mode} <Ratio fg={resolve('text/accent', mode)} bg={resolve('surface/base', mode)} />
              </p>
            ))}
          </div>
          <div>
            <p>the current item, on surface/raised</p>
            {MODES.map((mode) => (
              <p key={mode}>
                {mode} <Ratio fg={resolve('text/accent', mode)} bg={resolve('surface/raised', mode)} />
              </p>
            ))}
          </div>
          <div>
            <p>a section&rsquo;s caption</p>
            {MODES.map((mode) => (
              <p key={mode}>
                {mode} <Ratio fg={resolve('text/tertiary', mode)} bg={resolve('surface/base', mode)} />
              </p>
            ))}
          </div>
        </>
      }
    >
      <h1>Navigation</h1>
      <p className="lead">
        The bar along the top, the column of sections at the side, and the pages of a section beside it.
      </p>

      <h2>Try it</h2>
      <div className="specimenRow" style={{ marginBottom: spacing[200] }}>
        <Checkbox checked={collapsed} onChange={(e) => setCollapsed(e.target.checked)}>
          Collapse the side nav
        </Checkbox>
        <Checkbox checked={aside} onChange={(e) => setAside(e.target.checked)}>
          Collapse the second level
        </Checkbox>
        <Checkbox
          checked={narrow}
          onChange={(e) => {
            setNarrow(e.target.checked);
            setOpen(false);
          }}
        >
          Preview the narrow screen
        </Checkbox>
      </div>
      {/* The bar with its five actions is 636 wide and has no phone shape in the
          drawing: on a screen narrower than that the specimen scrolls. */}
      <Sideways className="specimen" style={{ padding: 0, background: 'var(--ap-color-surface-base)' }}>
        <TopBar
          brand={<strong style={{ fontSize: 'var(--ap-text-body-lg-size)' }}>Alpenglow</strong>}
          onMenu={() => (narrow ? setOpen(true) : setCollapsed((c) => !c))}
          menuExpanded={narrow ? open : !collapsed}
          actions={
            <>
              <Button variant="outline" tone="neutral" iconStart={<Add size={20} />}>
                Create
              </Button>
              <Tooltip content="Search" purpose="label">
                <Button variant="outline" tone="neutral" iconStart={<Search size={20} />} />
              </Tooltip>
              <Tooltip content="Messages" purpose="label">
                <Button variant="outline" tone="neutral" iconStart={<Chat size={20} />} />
              </Tooltip>
              <Tooltip content="Notifications" purpose="label">
                <Button variant="outline" tone="neutral" iconStart={<Notification size={20} />} />
              </Tooltip>
              <Avatar name="Helen Hernandez" size="md" />
            </>
          }
        />
        <div style={{ display: 'flex', height: 520 }}>
          <SideNav
            items={mark(PRIMARY)}
            footer={mark(FOOT).map((i) => ({ ...i, current: section === i.href }))}
            renderLink={renderLink}
            collapsed={collapsed}
            open={open}
            onClose={() => setOpen(false)}
            narrow={narrow ? 'all' : SIDE_NAV_NARROW}
          />
          {section === '/settings' && (
            <SideNavSecondary
              sections={sections}
              renderLink={renderLink}
              aria-label="Settings"
              collapsed={aside}
              onCollapsedChange={setAside}
            />
          )}
          <main style={{ flex: 1, minWidth: 0, padding: spacing[400] }}>
            <h3 style={{ margin: 0 }}>{TITLES[section]}</h3>
            <p className="alias" style={{ marginTop: spacing[100] }}>
              {current}
            </p>
          </main>
        </div>
      </Sideways>
      <p className="alias">
        The menu button collapses the side nav; with the narrow preview on, it opens the nav as a drawer over
        the page. Press a page to move there.
      </p>

      <h2>Two levels</h2>
      <p>
        <code>SideNav</code> is the primary navigation, drawn 200 wide and 80 with icons only: a link per item
        with a 24 icon and a Semibold label, the current one on <code>surface/base</code> in the accent, and a
        group at the foot for Settings. Collapsed, every item keeps its name in a Tooltip. <code>SideNavSecondary</code>{' '}
        is the second level, the pages of the section the reader is in: sections under captions that fold, each a{' '}
        <code>details</code> as the Accordion&rsquo;s item, so folding is the platform&rsquo;s; 240 wide, or a 24
        strip holding the drawn collapse button. They are two components because their anatomy and the way they
        collapse differ; one API with a level would carry props that serve one of them.
      </p>

      <h2>The control is the top bar&rsquo;s</h2>
      <p>
        The drawing puts the menu button in the TopBar, and that is the control: on a wide screen it collapses
        the side nav, on a narrow one it opens it. <code>onMenu</code> draws the button; the caller holds{' '}
        <code>collapsed</code> and <code>open</code> and decides which the press means. The side nav has no button
        of its own; the second level has the drawn one on its strip.
      </p>

      <h2>On a narrow screen</h2>
      <p>
        Below <code>narrow</code>, <code>media.down.md</code>, below 768, unless told, the side nav is a modal{' '}
        <code>dialog</code> sliding from the start side: the top layer, the scrim, the inert page, Esc and the focus going back are
        the platform&rsquo;s, as the Dialog&rsquo;s. <code>onClose</code> is called and the caller sets{' '}
        <code>open</code> to false. In the drawer the labels are always shown, whatever <code>collapsed</code> says.
        A press on a link does not close it: the caller closes on navigation, as its router tells it, which is
        what this page does. Breakpoints are not tokens yet, which is why the query is a prop.
      </p>
      <p>
        The drawing has no phone version of the top bar&rsquo;s actions or of the second level, and neither
        component takes one on: on a narrow screen the caller keeps the actions that fit, an overflow menu for
        the rest, and collapses or leaves out the second level, whose pages are then reached from the page
        itself.
      </p>

      <h2>Where it departs from the drawing</h2>
      <p>
        The second level&rsquo;s captions are drawn in <code>text/disabled</code>; here they are{' '}
        <code>text/tertiary</code>, because a caption is information and has to read. The site&rsquo;s own nav
        keeps its rail with captions, the Material 3 site&rsquo;s shape; the package takes the product&rsquo;s.
      </p>

      <h2>Accessibility</h2>
      <p>
        Each is a <code>nav</code> with a name, Main and Section unless told, so a reader can jump between them;
        the current page carries <code>aria-current</code>, which the caller sets. The top bar is the page&rsquo;s
        banner. The menu button says what it controls with <code>aria-expanded</code>. A folded section is a{' '}
        <code>details</code>: Enter and Space and the state a reader hears are the platform&rsquo;s, and text in a
        folded section is found by the browser&rsquo;s own search.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table caption="SideNav props" captionVisible density="compact" columns={propColumns} rows={SIDE} getRowId={(r) => r.prop} />
      </div>
      <div className="specimen">
        <Table caption="SideNavSecondary props" captionVisible density="compact" columns={propColumns} rows={SECONDARY} getRowId={(r) => r.prop} />
      </div>
      <div className="specimen">
        <Table caption="TopBar props" captionVisible density="compact" columns={propColumns} rows={TOP} getRowId={(r) => r.prop} />
      </div>
    </DocPage>
  );
}
