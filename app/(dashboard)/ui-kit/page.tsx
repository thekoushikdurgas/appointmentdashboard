"use client";

import { useState } from "react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Progress } from "@/components/ui/Progress";
import { Accordion } from "@/components/ui/Accordion";
import { RangeSlider, RangeSliderDual } from "@/components/ui/RangeSlider";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { MediaObject } from "@/components/ui/MediaObject";
import { DataTable } from "@/components/ui/DataTable";
import { useSweetAlert } from "@/components/ui/SweetAlert";
import { Carousel } from "@/components/ui/Carousel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { SparklineChart } from "@/components/shared/SparklineChart";
import { CalendarView } from "@/components/shared/CalendarView";
import { ReviewList } from "@/components/shared/ReviewList";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Radio } from "@/components/ui/Radio";
import { Tooltip } from "@/components/ui/Tooltip";
import { Popover } from "@/components/ui/Popover";
import {
  Zap,
  Mail,
  Search,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const SAMPLE_TABLE_DATA = [
  {
    id: "1",
    name: "John Doe",
    email: "john@acme.com",
    role: "Admin",
    status: "Active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@corp.io",
    role: "User",
    status: "Active",
  },
  {
    id: "3",
    name: "Bob Wilson",
    email: "bob@startup.co",
    role: "Editor",
    status: "Inactive",
  },
  {
    id: "4",
    name: "Alice Chen",
    email: "alice@tech.com",
    role: "Viewer",
    status: "Active",
  },
  {
    id: "5",
    name: "Carlos Rivera",
    email: "carlos@biz.net",
    role: "User",
    status: "Pending",
  },
];

const SPARK_DATA = Array.from({ length: 10 }, (_, i) => ({
  value: 20 + Math.sin(i) * 15 + i * 3,
}));

export default function UIKitPage() {
  useSessionGuard({ requireAdmin: true });

  const [modalOpen, setModalOpen] = useState(false);
  const [bgGroup, setBgGroup] = useState("all");
  const [sliderVal, setSliderVal] = useState(45);
  const [checked, setChecked] = useState(false);
  const [radioVal, setRadioVal] = useState("opt1");
  const { show: showAlert, SweetAlertNode } = useSweetAlert();

  return (
    <DashboardPageLayout>
      <div className="c360-page-header">
        <div>
          <h1 className="c360-page-header__title">UI Component Kit</h1>
          <p className="c360-page-header__subtitle">
            All available UI elements from the Dashboard design system
          </p>
        </div>
        <Badge color="blue">Reference</Badge>
      </div>

      <Tabs defaultValue="forms">
        <div className="c360-mb-6">
          <TabsList>
            <TabsTrigger value="forms">Forms & Inputs</TabsTrigger>
            <TabsTrigger value="display">Display & Cards</TabsTrigger>
            <TabsTrigger value="buttons">Buttons & Badges</TabsTrigger>
            <TabsTrigger value="feedback">Feedback & Alerts</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="misc">Misc</TabsTrigger>
          </TabsList>
        </div>

        {/* Forms & Inputs */}
        <TabsContent value="forms">
          <div className="c360-section-stack c360-section-stack--lg">
            <Card title="Text Inputs">
              <div className="c360-2col-grid">
                <Input label="Default input" placeholder="Enter text..." />
                <Input
                  label="With icon"
                  placeholder="Search..."
                  leftIcon={<Search size={16} />}
                />
                <Input
                  label="Error state"
                  placeholder="Error..."
                  error="This field is required"
                />
                <Input label="Success state" placeholder="Verified" />
                <Input
                  type="password"
                  label="Password"
                  placeholder="Enter password..."
                />
                <Input
                  type="email"
                  label="Email"
                  placeholder="user@example.com"
                  leftIcon={<Mail size={16} />}
                />
              </div>
            </Card>

            <Card title="Checkboxes & Radio">
              <div className="c360-section-stack c360-section-stack--sm">
                <Checkbox
                  checked={checked}
                  onChange={() => setChecked(!checked)}
                  label="I agree to the terms and conditions"
                />
                <Checkbox
                  checked={true}
                  onChange={() => {}}
                  label="Always checked (controlled)"
                />
                <Checkbox
                  checked={false}
                  onChange={() => {}}
                  label="Always unchecked"
                  disabled
                />
                <div className="c360-mt-3">
                  <Radio
                    name="demo"
                    value="opt1"
                    checked={radioVal === "opt1"}
                    onChange={() => setRadioVal("opt1")}
                    label="Option 1 — Recommended"
                  />
                  <Radio
                    name="demo"
                    value="opt2"
                    checked={radioVal === "opt2"}
                    onChange={() => setRadioVal("opt2")}
                    label="Option 2 — Advanced"
                  />
                  <Radio
                    name="demo"
                    value="opt3"
                    checked={radioVal === "opt3"}
                    onChange={() => setRadioVal("opt3")}
                    label="Option 3 — Disabled"
                    disabled
                  />
                </div>
              </div>
            </Card>

            <Card title="Range Sliders">
              <div className="c360-section-stack c360-section-stack--lg">
                <RangeSlider
                  label="Volume"
                  value={sliderVal}
                  onChange={setSliderVal}
                  min={0}
                  max={100}
                />
                <RangeSlider
                  label="Price (USD)"
                  value={250}
                  onChange={() => {}}
                  min={0}
                  max={1000}
                  formatValue={(v) => `$${v}`}
                />
                <RangeSliderDual
                  label="Credit range"
                  defaultValues={[200, 800]}
                  min={0}
                  max={1000}
                  formatValue={(v) => `${v}`}
                />
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Display & Cards */}
        <TabsContent value="display">
          <div className="c360-section-stack c360-section-stack--lg">
            <Card title="Cards">
              <div className="c360-widget-grid">
                <Card title="Basic card" subtitle="With subtitle">
                  Content here
                </Card>
                <Card
                  title="Card with actions"
                  actions={<Button size="sm">Action</Button>}
                >
                  Body content
                </Card>
                <Card
                  title="Card with footer"
                  footer={
                    <Button size="sm" className="c360-w-full">
                      Footer CTA
                    </Button>
                  }
                >
                  Body content
                </Card>
              </div>
            </Card>

            <Card title="Accordion">
              <Accordion
                items={[
                  {
                    id: "a1",
                    title: "What is Contact360?",
                    content:
                      "Contact360 is a B2B email finder and enrichment platform that helps sales teams find and verify professional email addresses at scale.",
                  },
                  {
                    id: "a2",
                    title: "How many credits do I get?",
                    content:
                      "Starter plan includes 1,000 credits per month. Professional gives 10,000. Enterprise is unlimited.",
                  },
                  {
                    id: "a3",
                    title: "Is my data secure?",
                    content:
                      "Yes — all data is encrypted at rest and in transit using AES-256 and TLS 1.3.",
                  },
                ]}
                allowMultiple
                defaultOpen={["a1"]}
              />
            </Card>

            <Card title="Media Objects">
              <div className="c360-section-stack">
                {[
                  {
                    name: "Alice Johnson",
                    role: "Sales Director",
                    text: "Excellent results — found 92% valid emails.",
                  },
                  {
                    name: "Bob Chen",
                    role: "Growth Lead",
                    text: "Great tool overall. Fast and accurate.",
                  },
                ].map((item) => (
                  <MediaObject
                    key={item.name}
                    media={
                      <div className="c360-avatar-circle c360-w-12 c360-h-12 c360-bg-primary c360-text-white">
                        {item.name[0]}
                      </div>
                    }
                    title={item.name}
                    body={
                      <>
                        <span className="c360-text-primary c360-text-xs">
                          {item.role}
                        </span>
                        <br />
                        {item.text}
                      </>
                    }
                  />
                ))}
              </div>
            </Card>

            <Card title="Progress Bars">
              <div className="c360-section-stack c360-section-stack--sm">
                <Progress value={75} label="Standard" showValue />
                <Progress value={45} label="Medium" showValue color="warning" />
                <Progress value={20} label="Low" showValue color="danger" />
                <Progress
                  value={100}
                  label="Complete"
                  showValue
                  color="success"
                />
              </div>
            </Card>

            <Card title="Tabs">
              <Tabs defaultValue="t1">
                <TabsList>
                  <TabsTrigger value="t1">Overview</TabsTrigger>
                  <TabsTrigger value="t2">Details</TabsTrigger>
                  <TabsTrigger value="t3">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="t1">
                  <p className="c360-tab-content-p">Overview content here.</p>
                </TabsContent>
                <TabsContent value="t2">
                  <p className="c360-tab-content-p">Details content here.</p>
                </TabsContent>
                <TabsContent value="t3">
                  <p className="c360-tab-content-p">Settings content here.</p>
                </TabsContent>
              </Tabs>
            </Card>

            <Card title="Carousel">
              <Carousel
                slides={[
                  {
                    id: 1,
                    content: (
                      <div className="c360-ad-slide c360-ad-slide--gradient-brand c360-ad-slide--ui-kit">
                        <h3>Slide 1</h3>
                        <p>First carousel slide with gradient background.</p>
                      </div>
                    ),
                  },
                  {
                    id: 2,
                    content: (
                      <div className="c360-ad-slide c360-ad-slide--gradient-midnight c360-ad-slide--ui-kit">
                        <h3>Slide 2</h3>
                        <p>Second slide with dark theme.</p>
                      </div>
                    ),
                  },
                  {
                    id: 3,
                    content: (
                      <div className="c360-ad-slide c360-ad-slide--gradient-ocean c360-ad-slide--ui-kit">
                        <h3>Slide 3</h3>
                        <p>Third slide with ocean theme.</p>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </div>
        </TabsContent>

        {/* Buttons & Badges */}
        <TabsContent value="buttons">
          <div className="c360-section-stack c360-section-stack--lg">
            <Card title="Buttons">
              <div className="c360-btn-row c360-mb-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
              <div className="c360-badge-row">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="sm" leftIcon={<Mail size={14} />}>
                  With Icon
                </Button>
                <Button size="sm" rightIcon={<Zap size={14} />}>
                  Right Icon
                </Button>
              </div>
            </Card>

            <Card title="Button Groups">
              <div className="c360-section-stack">
                <ButtonGroup
                  options={[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "paused", label: "Paused" },
                    { value: "done", label: "Completed" },
                  ]}
                  value={bgGroup}
                  onChange={setBgGroup}
                />
                <ButtonGroup
                  options={[
                    { value: "day", label: "Day" },
                    { value: "week", label: "Week" },
                    { value: "month", label: "Month" },
                  ]}
                  value="week"
                  variant="pills"
                />
              </div>
            </Card>

            <Card title="Badges">
              <div className="c360-badge-row">
                <Badge color="blue">Blue</Badge>
                <Badge color="green">Green</Badge>
                <Badge color="orange">Orange</Badge>
                <Badge color="red">Red</Badge>
                <Badge color="gray">Gray</Badge>
                <Badge color="purple">Purple</Badge>
                <Badge color="blue" dot>
                  Live
                </Badge>
                <Badge color="green" dot>
                  Online
                </Badge>
                <Badge color="red" dot>
                  Error
                </Badge>
              </div>
            </Card>

            <Card title="Typography">
              <h1 className="c360-page-title c360-mb-2">
                Heading 1 — 2xl Bold
              </h1>
              <h2 className="c360-font-bold c360-mb-2">
                Heading 2 — xl Semi-bold
              </h2>
              <h3 className="c360-font-semibold c360-mb-2">
                Heading 3 — lg Medium
              </h3>
              <p className="c360-leading-loose c360-mb-2 c360-text-body">
                Body text — regular paragraph text with comfortable line height
                for reading.
              </p>
              <p className="c360-page-subtitle c360-mb-2">
                Small text — used for metadata, labels, and secondary content.
              </p>
              <code className="c360-mono c360-code-pill">
                Monospace code snippet
              </code>
            </Card>
          </div>
        </TabsContent>

        {/* Feedback & Alerts */}
        <TabsContent value="feedback">
          <div className="c360-section-stack c360-section-stack--lg">
            <Card title="Alerts">
              <div className="c360-section-stack c360-section-stack--sm">
                <Alert variant="info" title="Informational">
                  This is an informational alert with details.
                </Alert>
                <Alert variant="success" title="Success!" onClose={() => {}}>
                  Your action was completed successfully.
                </Alert>
                <Alert variant="warning" title="Warning" onClose={() => {}}>
                  Please review your settings before continuing.
                </Alert>
                <Alert variant="danger" title="Error" onClose={() => {}}>
                  Something went wrong. Please try again.
                </Alert>
              </div>
            </Card>

            <Card title="Sweet Alerts (Custom Dialogs)">
              <div className="c360-btn-row">
                <Button
                  onClick={() =>
                    showAlert({
                      type: "success",
                      title: "Great job!",
                      message: "Your operation completed successfully.",
                      confirmLabel: "Awesome",
                    })
                  }
                >
                  <CheckCircle size={14} className="c360-mr-1-5" />
                  Success
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    showAlert({
                      type: "error",
                      title: "Something went wrong",
                      message:
                        "An unexpected error occurred. Please try again.",
                      confirmLabel: "Retry",
                    })
                  }
                >
                  <XCircle size={14} className="c360-mr-1-5" />
                  Error
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    showAlert({
                      type: "warning",
                      title: "Are you sure?",
                      message: "This action is irreversible.",
                      confirmLabel: "Yes, proceed",
                    })
                  }
                >
                  <AlertTriangle size={14} className="c360-mr-1-5" />
                  Warning
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    showAlert({
                      type: "confirm",
                      title: "Confirm deletion",
                      message: "Delete this item permanently?",
                      confirmLabel: "Delete",
                      cancelLabel: "Keep it",
                    })
                  }
                >
                  <Info size={14} className="c360-mr-1-5" />
                  Confirm
                </Button>
              </div>
            </Card>
            {SweetAlertNode}

            <Card title="Modals">
              <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
              <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Example Modal"
                footer={
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setModalOpen(false)}>Confirm</Button>
                  </>
                }
              >
                <p className="c360-page-subtitle c360-mb-4">
                  This is a modal dialog with a footer and header.
                </p>
                <Input label="Modal input" placeholder="Enter something..." />
              </Modal>
            </Card>

            <Card title="Tooltips & Popovers">
              <div className="c360-flex-row-wrap">
                <Tooltip content="This is a tooltip!" placement="top">
                  <Button variant="secondary" size="sm">
                    Hover me (Tooltip)
                  </Button>
                </Tooltip>
                <Popover
                  trigger={
                    <Button variant="secondary" size="sm">
                      Click me (Popover)
                    </Button>
                  }
                  content={
                    <div className="c360-popover-body">
                      <strong>Help hint</strong>
                      <p>
                        Click here to learn more about this feature and how to
                        use it effectively.
                      </p>
                    </div>
                  }
                />
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Charts */}
        <TabsContent value="charts">
          <div className="c360-2col-grid">
            <Card title="Sparkline — Primary">
              <SparklineChart
                data={SPARK_DATA}
                color="var(--c360-primary)"
                height={80}
                showTooltip
              />
            </Card>
            <Card title="Sparkline — Success">
              <SparklineChart
                data={SPARK_DATA.map((d) => ({ value: d.value + 10 }))}
                color="var(--c360-success)"
                height={80}
                showTooltip
              />
            </Card>
            <Card title="Calendar View" className="c360-col-span-2">
              <CalendarView height={380} />
            </Card>
          </div>
        </TabsContent>

        {/* Tables */}
        <TabsContent value="tables">
          <Card title="DataTable" subtitle="Sortable, searchable, paginated">
            <DataTable
              data={SAMPLE_TABLE_DATA}
              rowKey="id"
              columns={[
                { key: "name", header: "Name", sortable: true },
                { key: "email", header: "Email", sortable: true },
                { key: "role", header: "Role", sortable: true },
                {
                  key: "status",
                  header: "Status",
                  sortable: true,
                  render: (row) => (
                    <Badge
                      color={
                        row.status === "Active"
                          ? "green"
                          : row.status === "Inactive"
                            ? "gray"
                            : "orange"
                      }
                    >
                      {row.status as string}
                    </Badge>
                  ),
                },
              ]}
              pageSize={3}
            />
          </Card>
        </TabsContent>

        {/* Misc */}
        <TabsContent value="misc">
          <Card title="Review List">
            <ReviewList reviews={[]} entityName="this feature" />
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardPageLayout>
  );
}
