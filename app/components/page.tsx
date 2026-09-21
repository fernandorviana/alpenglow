'use client';

import { Checkmark, CheckmarkOutline, Copy, Search as SearchIcon } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Card, Cards } from '@ui/Card';
import { ToastSpecimen } from '@ui/ToastSpecimen';
import { sectionOf } from '@ui/contents';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card as SurfaceCard, CardBody, CardTitle } from '@/components/Card';
import { Checkbox } from '@/components/Checkbox';
import { DatePicker } from '@/components/DatePicker';
import { Input } from '@/components/Input';
import { Loader } from '@/components/Loader';
import { Pagination } from '@/components/Pagination';
import { Select } from '@/components/Select';
import { Switch } from '@/components/Switch';
import { Table } from '@/components/Table';
import { Alert } from '@/components/Alert';
import { Tabs } from '@/components/Tabs';
import { Tooltip } from '@/components/Tooltip';
import * as lib from '@/index';
import * as icons from '@/icons/index';

/**
 * What the barrel exports that is a component: a capitalised function, or
 * the object React makes of one, and not an icon. Counted from the package
 * rather than written, so the page cannot say one number and ship another.
 */
const COMPONENTS = Object.entries(lib).filter(
  ([name, value]) =>
    /^[A-Z]/.test(name) &&
    !(name in icons) &&
    (typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value)),
).length;

type Person = { id: string; name: string; visits: number };
const PEOPLE: Person[] = [
  { id: '1', name: 'Lisa Roberts', visits: 14 },
  { id: '2', name: 'Gary Martin', visits: 3 },
];

/**
 * The Components section: one page per decision a reader makes — Select
 * and Dropdown menu apart because one holds a value and the other runs a
 * command, Input and Textarea together because they share one Field.
 */
export default function Page() {
  const pages = sectionOf('/components')?.items.length ?? 0;

  return (
    <DocPage
      evidence={
        <>
          <p>{COMPONENTS} components</p>
          <p>{pages} pages</p>
          <p>2 modes, every state</p>
        </>
      }
    >
      <div className="hero">
        <div>
          <h1>Components</h1>
          <p className="lead">
            Built for the dense screens the tokens were measured on: a scheduling grid, a patient
            record, a table that stays legible at 11px. Each page says when to reach for the
            component and when for its neighbour.
          </p>
        </div>
        {/* A few of them at rest, on a well: the picture on a section page is
            the real thing, inert, as on the cards. */}
        <div className="heroSpecimen" inert>
          <div className="heroSpecimenRow">
            <Avatar name="Leonor Viana" status="available" />
            <span className="heroSpecimenName">Leonor Viana</span>
            <Badge tone="success" icon={<Checkmark size={16} />}>
              Confirmed
            </Badge>
          </div>
          <Input size="sm" defaultValue="Follow-up consultation" aria-label="Service" />
          <div className="heroSpecimenRow">
            <Button size="sm">Confirm booking</Button>
            <Button size="sm" variant="outline" tone="neutral">
              Reschedule
            </Button>
          </div>
        </div>
      </div>

      <h2>In this section</h2>
      <Cards>
        <Card
          href="/alert"
          title="Alert"
          description="A tinted line that stays beside what it is about: four tones, one action, a close."
          visual={
            <Alert tone="success" onClose={() => {}}>
              Appointment saved
            </Alert>
          }
        />
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
          href="/card"
          title="Card"
          description="A filled surface and five parts: a picture, a title that makes the card a link, controls that stay pressable."
          visual={
            <div style={{ padding: 'var(--ap-spacing-150)', borderRadius: 'var(--ap-radius-xl)', background: 'var(--ap-color-surface-raised)' }}>
              <SurfaceCard>
                <CardBody>
                  <CardTitle as="div">Phoenix Clinic</CardTitle>
                  <span style={{ color: 'var(--ap-color-text-secondary)' }}>Rochester, MN</span>
                </CardBody>
              </SurfaceCard>
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
          href="/pagination"
          title="Pagination"
          description="Seven places that never move the arrows, and a page size typed or picked inside its own sentence."
          visual={<Pagination page={8} pageCount={24} onPageChange={() => {}} />}
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
        <Card
          href="/tabs"
          title="Tabs"
          description="Underline, segmented and pill over one keyboard pattern, with a thumb that slides."
          visual={
            <Tabs
              label="Appointment"
              variant="segmented"
              defaultValue="people"
              items={[
                { id: 'details', label: 'Details', content: null },
                { id: 'people', label: 'Participants', content: null },
                { id: 'chat', label: 'Chat', content: null },
              ]}
            />
          }
        />
        <Card
          href="/toast"
          title="Toast"
          description="A line on the inverse surface, in a corner: what happened, one way to take it back, and a close."
          visual={
            <ToastSpecimen icon={<CheckmarkOutline size={20} />} action="Undo">
              Appointment saved
            </ToastSpecimen>
          }
        />
        <Card
          href="/tooltip"
          title="Tooltip"
          description="The overlay card and a compact size, opened by hover and by focus, and out of the way on Esc."
          visual={
            <div className="miniRow">
              <Tooltip content="Copy link" purpose="label">
                <Button size="sm" variant="ghost" tone="neutral" iconStart={<Copy size={16} />} />
              </Tooltip>
              <Tooltip content="Search" shortcut="⌘K" purpose="label">
                <Button size="sm" variant="ghost" tone="neutral" iconStart={<SearchIcon size={16} />} />
              </Tooltip>
            </div>
          }
        />
      </Cards>
    </DocPage>
  );
}
