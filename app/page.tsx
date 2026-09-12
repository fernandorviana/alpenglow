'use client';

import Link from 'next/link';
import { Calendar as CalendarIcon, Checkmark, Search, Time } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Bedrock } from '@ui/Bedrock';
import { Card, Cards } from '@ui/Card';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { DatePicker } from '@/components/DatePicker';
import { Input } from '@/components/Input';
import { Loader } from '@/components/Loader';
import { Select } from '@/components/Select';
import { Switch } from '@/components/Switch';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { theme } from '@/tokens/theme';
import { primitives } from '@/tokens/primitives';
import { textStyle } from '@/tokens/typography';

/** A strip of one family, the accent's, lightest to darkest. */
function Ramp() {
  const stops = Object.entries(primitives).filter(([name]) => name.startsWith('twilight/'));
  return (
    <div className="miniRamp">
      {stops.map(([name, value]) => (
        <span key={name} style={{ background: value }} />
      ))}
    </div>
  );
}

type Person = { id: string; name: string; visits: number };
const PEOPLE: Person[] = [
  { id: '1', name: 'Lisa Roberts', visits: 14 },
  { id: '2', name: 'Gary Martin', visits: 3 },
];

export default function Page() {
  const counts = {
    primitives: Object.keys(primitives).length,
    theme: Object.keys(theme).length,
    // Derived, not typed. A hand-written count is exactly the kind of number
    // this system exists to stop shipping.
    aliases: Object.values(theme).filter((t) => !String(t.light).startsWith('#')).length,
    styles: Object.keys(textStyle).length,
  };

  return (
    <DocPage
      evidence={
        <>
          <p>{counts.primitives} primitives</p>
          <p>{counts.theme} theme tokens</p>
          <p>{counts.aliases} aliases</p>
          <p>0 hex</p>
        </>
      }
    >
      <div className="hero">
        <div>
          <h1>Bring structure to light</h1>
          <p className="lead">
            A design system that shows its working. Alpenglow is built for dense, data-heavy
            interfaces — scheduling grids, patient records, tables that stay legible at 11px. Light
            and dark, with every contrast ratio measured rather than assumed.
          </p>
          <p className="heroActions">
            <Link href="/install" className="heroAction">
              Install
            </Link>
            <Link href="/why">Why Alpenglow</Link>
          </p>
          <p className="ratioLine">
            Body text on a card, measured as this page renders —{' '}
            <Ratio fg={resolve('text/primary', 'light')} bg={resolve('surface/raised', 'light')} />{' '}
            light,{' '}
            <Ratio fg={resolve('text/primary', 'dark')} bg={resolve('surface/raised', 'dark')} />{' '}
            dark.
          </p>
        </div>
        <Bedrock />
      </div>

      <h2>Start here</h2>
      <Cards>
        <Card
          href="/why"
          title="Why Alpenglow"
          description="The name, the landscape the layers take, and the rule that splits them."
        />
        <Card
          href="/accessibility"
          title="Accessibility"
          description="What is measured, what the suite asserts, and where the system stops short."
        />
        <Card
          href="/decisions"
          title="Decisions"
          description="The parts that look like mistakes, and the numbers that made them the right answer."
        />
      </Cards>

      <h2>Developers</h2>
      <Cards>
        <Card
          href="/install"
          title="Install"
          description="The package, its stylesheet, and a first component in a Next.js or Vite app."
        />
        <Card
          href="/tailwind"
          title="Tailwind"
          description="The tokens as a Tailwind v4 theme, pointing at the same variables."
        />
        <Card
          href="/dark-mode"
          title="Dark mode"
          description="One attribute on the root, a script that runs before the first paint, and what changes with the light."
        />
      </Cards>

      <h2>Foundations</h2>
      <Cards>
        <Card
          href="/colour"
          title="Colour"
          description="Ten families of eleven stops, one lightness per stop, and the semantic layer over them."
          visual={<Ramp />}
        />
        <Card
          href="/elevation"
          title="Elevation and states"
          description="Three surface levels in dark, shadows that stop working, and the wash that replaced the fill."
          visual={
            <div className="miniElevation">
              <span className="miniElevationMd" />
              <span className="miniElevationLg" />
            </div>
          }
        />
        <Card
          href="/typography"
          title="Typography"
          description={`${counts.styles} text styles in one family, from the page title down to 11px.`}
          visual={
            <div className="miniType">
              <span className="miniTypeSpecimen">Aa</span>
              <span className="miniTypeCaption">Inter</span>
            </div>
          }
        />
        <Card
          href="/space"
          title="Space and shape"
          description="Spacing on an 8px base, ten radii, and the capsule that every button takes."
          visual={
            <div className="miniShape">
              <span className="miniShapeSm" />
              <span className="miniShapeLg" />
              <span className="miniShapeFull" />
            </div>
          }
        />
        <Card
          href="/icons"
          title="Icons"
          description="IBM Carbon, installed by the consumer, plus fifteen drawn for this system."
          visual={
            <div className="miniIcons">
              <Search size={24} />
              <CalendarIcon size={24} />
              <Time size={24} />
              <Checkmark size={24} />
            </div>
          }
        />
      </Cards>

      <h2>Components</h2>
      <Cards>
        <Card
          href="/avatar"
          title="Avatar and Loader"
          description="Initials, a status dot, a group with overflow, and a spinner that keeps its tone."
          visual={
            <div className="miniRow">
              <Avatar name="Leonor Viana" status="available" />
              <Loader size="md" />
            </div>
          }
        />
        <Card
          href="/badge"
          title="Badge"
          description="Seven tones, two sizes, with an icon or a dot."
          visual={
            <div className="miniRow">
              <Badge tone="success" icon={<Checkmark size={16} />}>
                Confirmed
              </Badge>
              <Badge tone="warning" dot size="sm">
                Awaiting
              </Badge>
            </div>
          }
        />
        <Card
          href="/button"
          title="Button"
          description="Three variants, five tones, three sizes, and a loading state that does not look disabled."
          visual={
            <div className="miniRow">
              <Button size="sm">Confirm booking</Button>
              <Button size="sm" variant="outline" tone="neutral">
                Go back
              </Button>
            </div>
          }
        />
        <Card
          href="/input"
          title="Input and Textarea"
          description="Text fields with a label, a description and an error, sharing one Field."
          visual={<Input size="sm" defaultValue="Leonor Viana" aria-label="Name" />}
        />
        <Card
          href="/choice"
          title="Checkbox, Radio, Switch"
          description="The controls whose border is the control, and the one border strong enough for them."
          visual={
            <div className="miniStack">
              <Checkbox defaultChecked>Send a reminder</Checkbox>
              <Switch defaultChecked>Allow online booking</Switch>
            </div>
          }
        />
        <Card
          href="/date-picker"
          title="Date picker"
          description="A masked field and a calendar, single date or range, that never intercepts a key."
          visual={<DatePicker label="Appointment date" value="2023-04-12" onSelect={() => {}} />}
        />
        <Card
          href="/dialog"
          title="Dialog"
          description="Four sizes, a form with initial focus, and no light dismiss on purpose."
          visual={
            <div className="miniDialog">
              <p className="miniDialogTitle">Cancel this appointment?</p>
              <div className="miniRow">
                <Button size="sm" variant="ghost" tone="neutral">
                  Keep it
                </Button>
                <Button size="sm" tone="danger">
                  Cancel appointment
                </Button>
              </div>
            </div>
          }
        />
        <Card
          href="/dropdown-menu"
          title="Dropdown menu"
          description="A command list on a popover, placed with CSS anchors, with a border only in dark."
          visual={
            <div className="miniMenu">
              <span>Reschedule</span>
              <span className="miniMenuHover">Send reminder</span>
              <span className="miniMenuDanger">Cancel appointment</span>
            </div>
          }
        />
        <Card
          href="/select"
          title="Select"
          description="The native select, styled. It holds a value where the menu runs a command."
          visual={
            <Select size="sm" aria-label="Service" defaultValue="consultation">
              <option value="consultation">Consultation</option>
              <option value="follow-up">Follow-up</option>
            </Select>
          }
        />
        <Card
          href="/table"
          title="Table"
          description="Sorting and selection, two densities, and a list form below 40rem."
          visual={
            // Full width on purpose: the Table's wrapper is a size container,
            // and centred in the well it would measure its intrinsic width — 0.
            <div className="miniTable">
              <Table
                caption="Two clients"
                density="compact"
                columns={[
                  {
                    key: 'name',
                    header: 'Client',
                    primary: true,
                    cell: (p: Person) => p.name,
                  },
                  {
                    key: 'visits',
                    header: 'Visits',
                    align: 'end',
                    cell: (p: Person) => p.visits,
                  },
                ]}
                rows={PEOPLE}
                getRowId={(p) => p.id}
              />
            </div>
          }
        />
      </Cards>
    </DocPage>
  );
}
