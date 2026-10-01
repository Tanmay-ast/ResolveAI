import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  Cpu,
  FileText,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  Menu,
  Network,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Terminal,
  Ticket as TicketIcon,
  User,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import type { KnowledgeArticle, Ticket } from './types';

type View =
  | 'dashboard'
  | 'support'
  | 'queue'
  | 'investigation'
  | 'activity'
  | 'knowledge'
  | 'settings';
type HealthStatus = {
  status?: string;
  aiProvider?: string;
  uptime?: number;
};

type NavItem = {
  id: View;
  label: string;
  icon: LucideIcon;
};
const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Operations', icon: LayoutDashboard },
  { id: 'support', label: 'Employee Support', icon: TicketIcon },
  { id: 'queue', label: 'Ticket Queue', icon: ListTodo },
  { id: 'investigation', label: 'Investigation', icon: BrainCircuit },
  { id: 'activity', label: 'Agent Activity', icon: Activity },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'settings', label: 'Governance', icon: Settings },
];
const pipelineNames = [
  'Ticket Triage',
  'Knowledge / RAG',
  'System Diagnosis',
  'Troubleshooting',
  'Resolution',
  'Escalation',
];

const stageIcons = [
  ListTodo,
  BookOpen,
  Cpu,
  Terminal,
  CheckCircle2,
  ShieldCheck,
];

function statusTone(status?: string) {
  const value = String(status ?? '').toUpperCase();

  if (value === 'RESOLVED' || value === 'COMPLETED') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  if (value === 'ESCALATED' || value === 'FAILED') {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }

  if (value === 'INVESTIGATING' || value === 'RUNNING') {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }

  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function priorityTone(priority?: string) {
  const value = String(priority ?? '').toUpperCase();

  if (value === 'P1') {
    return 'bg-rose-100 text-rose-700';
  }

  if (value === 'P2') {
    return 'bg-orange-100 text-orange-700';
  }

  return 'bg-slate-100 text-slate-600';
}

function prettyStatus(status?: string) {
  return String(status ?? 'UNKNOWN')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}



export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [kbArticles, setKbArticles] = useState<KnowledgeArticle[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [visibleStageCount, setVisibleStageCount] = useState(0);
  const [expandedStageIndex, setExpandedStageIndex] = useState<number | null>(null);
  const [telemetryData, setTelemetryData] = useState<unknown>(null);
  const [backendLoading, setBackendLoading] = useState(true);
  const [error, setError] = useState('');
  const [queueSearch, setQueueSearch] = useState('');
  const [kbSearch, setKbSearch] = useState('');

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId),
    [tickets, selectedTicketId],
  );

  const currentResult = selectedTicket?.investigationResult;
  const visibleStages = currentResult?.stages?.slice(0, visibleStageCount) ?? [];

  const metrics = useMemo(() => {
    const resolved = tickets.filter(
      (ticket) => String(ticket.status).toUpperCase() === 'RESOLVED',
    ).length;

    const escalated = tickets.filter(
      (ticket) => String(ticket.status).toUpperCase() === 'ESCALATED',
    ).length;

    const pending = tickets.filter(
      (ticket) =>
        !['RESOLVED', 'ESCALATED'].includes(
          String(ticket.status).toUpperCase(),
        ),
    ).length;

    const investigated = tickets.filter(
      (ticket) => Boolean(ticket.investigationResult),
    ).length;

    return { resolved, escalated, pending, investigated };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const query = queueSearch.trim().toLowerCase();

    if (!query) return tickets;

    return tickets.filter((ticket) =>
      [
        ticket.id,
        ticket.title,
        ticket.description,
        ticket.employeeName,
        ticket.employeeEmail,
        ticket.department,
        ticket.category,
        ticket.status,
        ticket.priority,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [tickets, queueSearch]);

  const filteredKnowledge = useMemo(() => {
    const query = kbSearch.trim().toLowerCase();

    if (!query) return kbArticles;

    return kbArticles.filter((article) =>
      [
        article.id,
        article.title,
        article.category,
        article.summary,
        article.content,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [kbArticles, kbSearch]);

  const activityItems = useMemo(() => {
    if (!currentResult?.stages) return [];

    return currentResult.stages.flatMap((stage: any, index: number) => {
      const stageItem = {
        type: 'stage',
        key: `stage-${index}`,
        index,
        title: stage.stageName ?? pipelineNames[index],
        status: stage.status,
        decision: stage.decision,
        rationale: stage.rationale,
      };

      const toolItems = (stage.toolCalls ?? []).map(
        (tool: any, toolIndex: number) => ({
          type: 'tool',
          key: `tool-${index}-${toolIndex}`,
          index,
          title: tool.name ?? tool.tool ?? 'Tool call',
          status: 'completed',
          decision: tool.result ?? tool.action ?? tool.output,
          rationale: tool.description,
        }),
      );

      return [stageItem, ...toolItems];
    });
  }, [currentResult]);

  async function loadData() {
    setBackendLoading(true);
    setError('');

    try {
      const [healthResponse, ticketsResponse, kbResponse] =
        await Promise.all([
          fetch('/api/health'),
          fetch('/api/tickets'),
          fetch('/api/kb'),
        ]);

      if (!healthResponse.ok || !ticketsResponse.ok || !kbResponse.ok) {
        throw new Error('Backend returned an unexpected response.');
      }

      const healthJson = await healthResponse.json();
      const ticketsJson = await ticketsResponse.json();
      const kbJson = await kbResponse.json();

      setHealth(healthJson);
      setTickets(ticketsJson.tickets ?? ticketsJson);
      setKbArticles(kbJson.articles ?? kbJson);

      const loadedTickets = ticketsJson.tickets ?? ticketsJson;

      if (!selectedTicketId && loadedTickets.length > 0) {
        setSelectedTicketId(loadedTickets[0].id);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to connect to the ResolveAI backend.',
      );
    } finally {
      setBackendLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!selectedTicket) return;

    if (selectedTicket.investigationResult) {
      setVisibleStageCount(selectedTicket.investigationResult.stages?.length ?? 0);
    } else {
      setVisibleStageCount(0);
    }

    void fetch(
      `/api/telemetry/${encodeURIComponent(selectedTicket.employeeEmail)}`,
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setTelemetryData(data))
      .catch(() => setTelemetryData(null));
  }, [
    selectedTicketId,
    selectedTicket?.employeeEmail,
    selectedTicket?.investigationResult,
  ]);

  async function handleInvestigate() {
    if (!selectedTicket || isInvestigating) return;

    setActiveView('investigation');
    setIsInvestigating(true);
    setVisibleStageCount(0);
    setExpandedStageIndex(null);
    setError('');

    try {
      const response = await fetch(
        `/api/tickets/${selectedTicket.id}/investigate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!response.ok) {
        throw new Error(`Investigation failed with HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = data.result ?? data.ticket?.investigationResult;

      if (!result) {
        throw new Error('Backend returned no investigation result.');
      }

      setTickets((previous) =>
        previous.map((ticket) =>
          ticket.id === selectedTicket.id
            ? {
                ...ticket,
                ...(data.ticket ?? {}),
                investigationResult: result,
                status: data.ticket?.status ?? result.outcome ?? ticket.status,
              }
            : ticket,
        ),
      );

      const stageCount = result.stages?.length ?? pipelineNames.length;

      for (let index = 0; index < stageCount; index += 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        setVisibleStageCount(index + 1);
      }

      setExpandedStageIndex(
        result.outcome === 'RESOLVED' ? stageCount - 2 : stageCount - 1,
      );
    } catch (investigationError) {
      setError(
        investigationError instanceof Error
          ? investigationError.message
          : 'Investigation failed.',
      );
    } finally {
      setIsInvestigating(false);
    }
  }

  async function handleReset() {
    try {
      await fetch('/api/reset', { method: 'POST' });
      setVisibleStageCount(0);
      setExpandedStageIndex(null);
      setTelemetryData(null);
      await loadData();
      setActiveView('dashboard');
    } catch {
      setError('Unable to reset the demo.');
    }
  }

  function selectTicket(id: string, view: View = 'investigation') {
    setSelectedTicketId(id);
    setActiveView(view);
    setMobileNavOpen(false);
  }

  function navigate(view: View) {
    setActiveView(view);
    setMobileNavOpen(false);
  }

  const sidebar = (
    <aside className="flex h-full w-[250px] flex-col border-r border-slate-200 bg-white">
      <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          <Bot size={21} />
        </div>
        <div>
          <div className="text-[15px] font-bold tracking-tight text-slate-900">
            ResolveAI
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Autonomous Service Desk
          </div>
        </div>
      </div>

      <div className="px-3 py-5">
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.id === 'queue' && tickets.length > 0 ? (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      active
                        ? 'bg-white/15 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tickets.length}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-3 p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-slate-700">
              Agent online
            </span>
          </div>
          <p className="text-[11px] leading-5 text-slate-500">
            Tool-enabled workflow with human escalation boundaries.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <RotateCcw size={14} />
          Reset demo
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">{sidebar}</div>

        {mobileNavOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-900/30"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative h-full w-[270px]">{sidebar}</div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {navItems.find((item) => item.id === activeView)?.label}
                </div>
                <div className="hidden text-[11px] text-slate-400 sm:block">
                  IT operations control center
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
                <Search size={15} className="text-slate-400" />
                <input
                  value={queueSearch}
                  onChange={(event) => {
                    setQueueSearch(event.target.value);
                    setActiveView('queue');
                  }}
                  placeholder="Search tickets..."
                  className="w-40 bg-transparent text-xs outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold text-slate-600">
                  Backend {health?.status === 'ok' ? 'healthy' : 'ready'}
                </span>
              </div>

              <button
                onClick={() => void loadData()}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                title="Refresh"
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 md:p-6 lg:p-8">
            {error ? (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle size={18} />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError('')}>
                  <X size={16} />
                </button>
              </div>
            ) : null}

            {backendLoading && tickets.length === 0 ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                  <RefreshCw size={18} className="animate-spin text-slate-500" />
                  <span className="text-sm font-medium text-slate-600">
                    Connecting to ResolveAI...
                  </span>
                </div>
              </div>
            ) : null}

            {!backendLoading || tickets.length > 0 ? (
              <>
  {activeView === 'support' ? (
    <EmployeeSupportView
      onTicketCreated={(ticketId) => {
        setSelectedTicketId(ticketId);
        setActiveView('investigation');
        void loadData();
      }}
    />
  ) : null}

  {activeView === 'dashboard' ? (
  <DashboardView
    tickets={tickets}
    metrics={metrics}
    selectedTicket={selectedTicket}
    health={health}
    onSelect={selectTicket}
    onInvestigate={handleInvestigate}
  />
) : null}


{activeView === 'queue' ? (
                  <QueueView
                    tickets={filteredTickets}
                    search={queueSearch}
                    onSearch={setQueueSearch}
                    selectedTicketId={selectedTicketId}
                    onSelect={selectTicket}
                  />
                ) : null}

                {activeView === 'investigation' ? (
                  <InvestigationView
                    ticket={selectedTicket}
                    visibleStages={visibleStages}
                    visibleStageCount={visibleStageCount}
                    expandedStageIndex={expandedStageIndex}
                    setExpandedStageIndex={setExpandedStageIndex}
                    isInvestigating={isInvestigating}
                    telemetryData={telemetryData}
                    onInvestigate={handleInvestigate}
                    onOpenQueue={() => navigate('queue')}
                  />
                ) : null}

                {activeView === 'activity' ? (
                  <ActivityView
                    ticket={selectedTicket}
                    activityItems={activityItems}
                    onSelectTicket={(id) => selectTicket(id, 'activity')}
                    tickets={tickets}
                  />
                ) : null}

                {activeView === 'knowledge' ? (
                  <KnowledgeView
                    articles={filteredKnowledge}
                    search={kbSearch}
                    onSearch={setKbSearch}
                  />
                ) : null}

                {activeView === 'settings' ? (
                  <SettingsView health={health} />
                ) : null}
              </>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
function EmployeeSupportView({
  onTicketCreated,
}: {
  onTicketCreated: (ticketId: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const demoScenarios = [
    {
      label: 'Company portal unavailable',
      title: 'Company portal is not opening',
      description:
        "I'm connected to Wi-Fi, but the company portal is not opening.",
    },
    {
      label: 'VPN certificate expired',
      title: 'VPN certificate has expired',
      description:
        'I cannot connect to the company VPN because my certificate appears to be expired.',
    },
    {
      label: 'Hardware failure',
      title: 'Laptop hardware failure',
      description:
        'My laptop is showing hardware problems and the disk health appears critical.',
    },
    {
      label: 'Account locked',
      title: 'My account is locked',
      description:
        'I am unable to sign in because my corporate account appears to be locked.',
    },
    {
      label: 'Software request',
      title: 'I need software administrator access',
      description:
        'I need administrator privileges to install Docker for my development work.',
    },
  ];

  function useScenario(scenario: {
    title: string;
    description: string;
  }) {
    setTitle(scenario.title);
    setDescription(scenario.description);
    setError('');
  }

  async function submitTicket() {
    if (!title.trim() || !description.trim() || !employeeEmail.trim()) {
      setError('Please provide the issue title, description, and email.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          employeeEmail: employeeEmail.trim(),
          employeeName: employeeName.trim() || undefined,
          department: department.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ticket?.id) {
        throw new Error(data.error ?? 'Unable to create the support ticket.');
      }

      onTicketCreated(data.ticket.id);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to create the support ticket.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-7">
      <section>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
          <TicketIcon size={13} />
          Employee support
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
          Report an IT issue
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Submit a real-time support request and let ResolveAI investigate,
          troubleshoot, resolve, or escalate it.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-900">
              Describe your problem
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              The submitted ticket will enter the same autonomous workflow
              used by the operations console.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Issue title
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Company portal is not opening"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                What's happening?
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the IT problem..."
                rows={6}
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Your name
                </label>
                <input
                  value={employeeName}
                  onChange={(event) => setEmployeeName(event.target.value)}
                  placeholder="Employee name"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Email *
                </label>
                <input
                  type="email"
                  value={employeeEmail}
                  onChange={(event) => setEmployeeEmail(event.target.value)}
                  placeholder="employee@company.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Department
              </label>
              <input
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                placeholder="e.g. Engineering"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              onClick={() => void submitTicket()}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Creating ticket...
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Submit to ResolveAI
                </>
              )}
            </button>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Bot size={17} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">
              Try a demo scenario
            </h2>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            These examples use the controlled enterprise simulation data
            already connected to the ResolveAI workflow.
          </p>

          <div className="mt-5 space-y-2">
            {demoScenarios.map((scenario) => (
              <button
                key={scenario.label}
                onClick={() => useScenario(scenario)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-slate-300 hover:bg-white"
              >
                <span className="text-xs font-semibold text-slate-700">
                  {scenario.label}
                </span>
                <ArrowUpRight size={14} className="text-slate-400" />
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                What happens next
              </span>
            </div>

            <div className="mt-3 space-y-2.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <CircleDot size={12} />
                Ticket created
              </div>
              <div className="flex items-center gap-2">
                <CircleDot size={12} />
                Agent investigates
              </div>
              <div className="flex items-center gap-2">
                <CircleDot size={12} />
                Tools selected from evidence
              </div>
              <div className="flex items-center gap-2">
                <CircleDot size={12} />
                Resolution verified or escalated
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
function DashboardView({
  tickets,
  metrics,
  selectedTicket,
  health,
  onSelect,
  onInvestigate,
}: {
  tickets: Ticket[];
  metrics: {
    resolved: number;
    escalated: number;
    pending: number;
    investigated: number;
  };
  selectedTicket?: Ticket;
  health: HealthStatus | null;
  onSelect: (id: string) => void;
  onInvestigate: () => void;
}) {
  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
            <Zap size={13} />
            Autonomous operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
            Service desk operations
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor tickets, inspect agent decisions, and demonstrate
            autonomous resolution with controlled escalation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Server size={15} />
          <span>
            Provider:{' '}
            <strong className="font-semibold text-slate-700">
              {health?.aiProvider ?? 'Configured backend'}
            </strong>
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Tickets"
          value={tickets.length}
          icon={TicketIcon}
          detail="Demo queue"
        />
        <MetricCard
          label="Resolved"
          value={metrics.resolved}
          icon={CheckCircle2}
          detail="Closed automatically"
        />
        <MetricCard
          label="Escalated"
          value={metrics.escalated}
          icon={ShieldCheck}
          detail="Human handoff"
        />
        <MetricCard
          label="Investigated"
          value={metrics.investigated}
          icon={BrainCircuit}
          detail={`${metrics.pending} awaiting action`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ticket queue</h2>
              <p className="mt-1 text-xs text-slate-400">
                Select a scenario to inspect the agent.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
              {tickets.length} scenarios
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {tickets.slice(0, 5).map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => onSelect(ticket.id)}
                className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${priorityTone(
                    ticket.priority,
                  )}`}
                >
                  {String(ticket.category).toLowerCase().includes('network') ? (
                    <Wifi size={17} />
                  ) : String(ticket.category).toLowerCase().includes('vpn') ? (
                    <KeyRound size={17} />
                  ) : String(ticket.category).toLowerCase().includes('hardware') ? (
                    <HardDrive size={17} />
                  ) : (
                    <TicketIcon size={17} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">
                      {ticket.id}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${priorityTone(
                        ticket.priority,
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-slate-800">
                    {ticket.title}
                  </div>
                  <div className="mt-1 truncate text-xs text-slate-400">
                    {ticket.employeeName} · {ticket.department}
                  </div>
                </div>

                <div className="hidden items-center gap-3 sm:flex">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusTone(
                      ticket.status,
                    )}`}
                  >
                    {prettyStatus(ticket.status)}
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">Agent pipeline</h2>
            <p className="mt-1 text-xs text-slate-400">
              Every ticket follows a decision-driven workflow.
            </p>
          </div>

          <div className="p-5">
            <div className="space-y-3">
              {pipelineNames.map((name, index) => {
                const Icon = stageIcons[index];

                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Icon size={15} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-700">
                        {name}
                      </div>
                    </div>
                    {index < pipelineNames.length - 1 ? (
                      <ChevronDown size={13} className="text-slate-300" />
                    ) : (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    )}
                  </div>
                );
              })}
            </div>

            {selectedTicket ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Selected
                  </span>
                  <span
                    className={`rounded-full border px-2 py-1 text-[9px] font-bold ${statusTone(
                      selectedTicket.status,
                    )}`}
                  >
                    {prettyStatus(selectedTicket.status)}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {selectedTicket.id}
                </div>
                <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {selectedTicket.title}
                </div>
                <button
                  onClick={onInvestigate}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  <Play size={14} />
                  {selectedTicket.investigationResult
                    ? 'Run investigation again'
                    : 'Investigate ticket'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  detail,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={17} />
        </div>
      </div>
      <div className="mt-3 text-[10px] font-medium text-slate-400">{detail}</div>
    </div>
  );
}

function QueueView({
  tickets,
  search,
  onSearch,
  selectedTicketId,
  onSelect,
}: {
  tickets: Ticket[];
  search: string;
  onSearch: (value: string) => void;
  selectedTicketId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Ticket queue
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose a support scenario and open the autonomous investigation.
        </p>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <ListTodo size={17} />
            All tickets
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={15} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Filter queue..."
              className="w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-slate-400 md:w-64"
            />
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Ticket</th>
                <th className="px-5 py-3">Requester</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={`transition hover:bg-slate-50 ${
                    selectedTicketId === ticket.id ? 'bg-slate-50' : ''
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="text-[11px] font-bold text-slate-400">
                      {ticket.id}
                    </div>
                    <div className="mt-1 max-w-md truncate text-sm font-semibold text-slate-800">
                      {ticket.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {ticket.category}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs font-semibold text-slate-700">
                      {ticket.employeeName}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      {ticket.department}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${priorityTone(
                        ticket.priority,
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusTone(
                        ticket.status,
                      )}`}
                    >
                      {prettyStatus(ticket.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => onSelect(ticket.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      Inspect
                      <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => onSelect(ticket.id)}
              className="w-full p-4 text-left hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-400">
                    {ticket.id}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-800">
                    {ticket.title}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold ${statusTone(
                    ticket.status,
                  )}`}
                >
                  {prettyStatus(ticket.status)}
                </span>
              </div>
            </button>
          ))}
        </div>

        {tickets.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No tickets match the current search.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InvestigationView({
  ticket,
  visibleStages,
  visibleStageCount,
  expandedStageIndex,
  setExpandedStageIndex,
  isInvestigating,
  telemetryData,
  onInvestigate,
  onOpenQueue,
}: {
  ticket?: Ticket;
  visibleStages: any[];
  visibleStageCount: number;
  expandedStageIndex: number | null;
  setExpandedStageIndex: (index: number | null) => void;
  isInvestigating: boolean;
  telemetryData: any;
  onInvestigate: () => void;
  onOpenQueue: () => void;
}) {
  if (!ticket) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <TicketIcon className="mx-auto text-slate-300" size={30} />
          <h2 className="mt-4 text-sm font-bold text-slate-800">
            No ticket selected
          </h2>
          <button
            onClick={onOpenQueue}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white"
          >
            Open ticket queue
          </button>
        </div>
      </div>
    );
  }

  const totalStages = ticket.investigationResult?.stages?.length ?? 6;
  const completed = Math.min(visibleStageCount, totalStages);
  const outcome = ticket.investigationResult?.outcome ?? ticket.status;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <button
            onClick={onOpenQueue}
            className="mb-3 text-xs font-semibold text-slate-400 hover:text-slate-700"
          >
            ← Back to queue
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">
              {ticket.id}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${priorityTone(
                ticket.priority,
              )}`}
            >
              {ticket.priority}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${statusTone(
                ticket.status,
              )}`}
            >
              {prettyStatus(ticket.status)}
            </span>
          </div>
          <h1 className="mt-2 max-w-4xl text-2xl font-bold tracking-tight text-slate-950">
            {ticket.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {ticket.description}
          </p>
        </div>

        <button
          onClick={onInvestigate}
          disabled={isInvestigating}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
        >
          {isInvestigating ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              Agent working...
            </>
          ) : (
            <>
              <Play size={15} />
              {ticket.investigationResult
                ? 'Run investigation again'
                : 'Start investigation'}
            </>
          )}
        </button>
      </section>

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800">
                Requester
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                {String(ticket.employeeName ?? 'U')
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-800">
                  {ticket.employeeName}
                </div>
                <div className="truncate text-[11px] text-slate-400">
                  {ticket.employeeEmail}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
              <InfoRow label="Department" value={ticket.department} />
              <InfoRow label="Category" value={ticket.category} />
              <InfoRow label="Priority" value={ticket.priority} />
              <InfoRow label="Status" value={prettyStatus(ticket.status)} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Network size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800">
                System telemetry
              </h2>
            </div>

            {telemetryData ? (
              <pre className="max-h-52 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] leading-5 text-slate-300">
                {JSON.stringify(telemetryData, null, 2)}
              </pre>
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-400">
                Telemetry will appear when available for this requester.
              </div>
            )}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Autonomous investigation
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Decision-driven execution across six operational stages.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-400">
                {completed}/{totalStages} stages
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all duration-500"
                  style={{
                    width: `${(completed / totalStages) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="relative">
              <div className="absolute left-[17px] top-5 bottom-5 w-px bg-slate-200" />

              <div className="space-y-3">
                {pipelineNames.map((name, index) => {
                  const Icon = stageIcons[index];
                  const stage = visibleStages[index];
                  const isComplete = Boolean(stage);
                  const isCurrent =
                    isInvestigating &&
                    visibleStageCount === index &&
                    !isComplete;
                  const isExpanded = expandedStageIndex === index;

                  return (
                    <div key={name} className="relative">
                      <button
                        onClick={() =>
                          isComplete &&
                          setExpandedStageIndex(
                            isExpanded ? null : index,
                          )
                        }
                        disabled={!isComplete}
                        className={`relative z-10 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                          isExpanded
                            ? 'border-slate-300 bg-slate-50'
                            : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                            isComplete
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                              : isCurrent
                                ? 'border-blue-200 bg-blue-50 text-blue-600'
                                : 'border-slate-200 bg-white text-slate-300'
                          }`}
                        >
                          {isCurrent ? (
                            <RefreshCw size={15} className="animate-spin" />
                          ) : isComplete ? (
                            <CheckCircle2 size={15} />
                          ) : (
                            <Icon size={15} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400">
                              0{index + 1}
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {name}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`text-[10px] font-semibold ${
                                isCurrent
                                  ? 'text-blue-600'
                                  : isComplete
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
                              }`}
                            >
                              {isCurrent
                                ? 'Executing'
                                : isComplete
                                  ? prettyStatus(stage?.status ?? 'completed')
                                  : 'Waiting'}
                            </span>

                            {stage?.confidence != null ? (
                              <span className="text-[10px] text-slate-400">
                                Confidence {Math.round(stage.confidence)}%
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {isComplete ? (
                          isExpanded ? (
                            <ChevronDown size={16} className="text-slate-400" />
                          ) : (
                            <ChevronRight size={16} className="text-slate-300" />
                          )
                        ) : null}
                      </button>

                      {isExpanded && stage ? (
                        <StageDetail stage={stage} />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {ticket.investigationResult && !isInvestigating && visibleStageCount >= totalStages ? ( 
              <OutcomeCard ticket={ticket} outcome={outcome} />
            ) : null}

            {isInvestigating ? (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                  <Bot size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-800">
                    Agent is executing the workflow
                  </div>
                  <div className="mt-0.5 text-[10px] text-blue-600">
                    Selecting actions from available evidence and escalating
                    when policy requires human intervention.
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: unknown }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="max-w-[170px] truncate text-right text-xs font-semibold text-slate-700">
        {String(value ?? '—')}
      </span>
    </div>
  );
}

function StageDetail({ stage }: { stage: any }) {
  return (
    <div className="ml-12 mr-2 mt-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Agent decision
          </div>
          <div className="mt-2 text-sm font-bold text-slate-800">
            {stage.decision ?? 'No explicit decision recorded'}
          </div>
          {stage.rationale ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {stage.rationale}
            </p>
          ) : null}
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Evidence
          </div>

          {stage.evidence?.length ? (
            <div className="mt-2 space-y-2">
              {stage.evidence.map((item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="text-[11px] font-semibold text-slate-700">
                    {typeof item === 'string'
                      ? item
                      : item.label ?? item.name ?? 'Evidence'}
                  </div>
                  {typeof item !== 'string' && item.value != null ? (
                    <div className="mt-1 text-[10px] text-slate-400">
                      {typeof item.value === 'object'
                        ? JSON.stringify(item.value)
                        : String(item.value)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-400">
              No additional evidence recorded.
            </div>
          )}
        </div>
      </div>

      {stage.toolCalls?.length ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="mb-2 flex items-center gap-2">
            <Terminal size={13} className="text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tool calls
            </span>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {stage.toolCalls.map((tool: any, index: number) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="text-[11px] font-bold text-slate-700">
                  {tool.name ?? tool.tool ?? 'Tool'}
                </div>
                <div className="mt-1 line-clamp-3 text-[10px] leading-4 text-slate-400">
                  {tool.result
                    ? typeof tool.result === 'string'
                      ? tool.result
                      : JSON.stringify(tool.result)
                    : tool.action ?? tool.description ?? 'Executed'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OutcomeCard({
  ticket,
  outcome,
}: {
  ticket: Ticket;
  outcome?: unknown;
}) {
  const resolved = String(outcome ?? '').toUpperCase() === 'RESOLVED';

  return (
    <div
      className={`mt-5 rounded-2xl border p-5 ${
        resolved
          ? 'border-emerald-200 bg-emerald-50/70'
          : 'border-rose-200 bg-rose-50/70'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            resolved
              ? 'bg-white text-emerald-600'
              : 'bg-white text-rose-600'
          }`}
        >
          {resolved ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />}
        </div>

        <div className="min-w-0">
          <div
            className={`text-sm font-bold ${
              resolved ? 'text-emerald-800' : 'text-rose-800'
            }`}
          >
            {resolved ? 'Autonomous resolution completed' : 'Human escalation required'}
          </div>

          <p
            className={`mt-1 text-xs leading-5 ${
              resolved ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {ticket.investigationResult?.finalRationale ??
            ticket.investigationResult?.finalRationale ??
              (resolved
                ? 'The agent completed its investigation and recorded a successful post-check.'
                : 'The agent identified a boundary that requires human intervention.')}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActivityView({
  ticket,
  activityItems,
  tickets,
  onSelectTicket,
}: {
  ticket?: Ticket;
  activityItems: any[];
  tickets: Ticket[];
  onSelectTicket: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Agent activity
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          A chronological view of decisions, evidence, and tool execution.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Investigated tickets
          </div>

          <div className="space-y-1">
            {tickets.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectTicket(item.id)}
                className={`w-full rounded-xl p-3 text-left transition ${
                  ticket?.id === item.id
                    ? 'bg-slate-900 text-white'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div
                  className={`text-[10px] font-bold ${
                    ticket?.id === item.id
                      ? 'text-white/60'
                      : 'text-slate-400'
                  }`}
                >
                  {item.id}
                </div>
                <div
                  className={`mt-1 truncate text-xs font-bold ${
                    ticket?.id === item.id
                      ? 'text-white'
                      : 'text-slate-700'
                  }`}
                >
                  {item.title}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-900">
                {ticket?.id ?? 'No ticket selected'}
              </span>
            </div>
          </div>

          {activityItems.length > 0 ? (
            <div className="space-y-0 p-5">
              {activityItems.map((item, index) => (
                <div key={item.key} className="relative flex gap-4 pb-6">
                  {index < activityItems.length - 1 ? (
                    <div className="absolute left-[13px] top-7 bottom-0 w-px bg-slate-200" />
                  ) : null}

                  <div
                    className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      item.type === 'stage'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.type === 'stage' ? (
                      <CircleDot size={13} />
                    ) : (
                      <Terminal size={12} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {item.title}
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                        {item.type === 'stage'
                          ? `Stage ${item.index + 1}`
                          : 'Tool call'}
                      </span>
                    </div>

                    {item.decision ? (
                      <div className="mt-2 text-xs font-semibold text-slate-600">
                        {typeof item.decision === 'string'
                          ? item.decision
                          : JSON.stringify(item.decision)}
                      </div>
                    ) : null}

                    {item.rationale ? (
                      <div className="mt-1 text-[11px] leading-5 text-slate-400">
                        {item.rationale}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Clock3 className="mx-auto text-slate-300" size={28} />
              <div className="mt-3 text-sm font-bold text-slate-700">
                No activity yet
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Run an investigation to populate the agent timeline.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KnowledgeView({
  articles,
  search,
  onSearch,
}: {
  articles: KnowledgeArticle[];
  search: string;
  onSearch: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Knowledge base
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Approved operational knowledge available to the agent during
            investigation.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search size={15} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search knowledge..."
            className="w-52 bg-transparent text-xs outline-none placeholder:text-slate-400"
          />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <article
            key={article.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {article.category}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {article.id}
              </span>
            </div>

            <h2 className="mt-4 text-sm font-bold leading-5 text-slate-800">
              {article.title}
            </h2>

            <p className="mt-2 line-clamp-4 text-xs leading-5 text-slate-500">
              {article.summary ?? article.content}
            </p>

            {article.approvedRemediation ? (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                  Approved remediation
                </div>
                <div className="mt-1 text-[11px] leading-4 text-emerald-800">
                  {article.approvedRemediation.actionName}
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          No knowledge articles match the search.
        </div>
      ) : null}
    </div>
  );
}

function SettingsView({ health }: { health: HealthStatus | null }) {
  const governance = [
    {
      icon: ShieldCheck,
      title: 'Human escalation',
      description:
        'Security-sensitive and high-risk conditions can be routed to the appropriate human team.',
    },
    {
      icon: Terminal,
      title: 'Controlled remediation',
      description:
        'The demo remediation layer is isolated from real infrastructure changes.',
    },
    {
      icon: BookOpen,
      title: 'Knowledge grounding',
      description:
        'The workflow can use approved knowledge before selecting a troubleshooting action.',
    },
    {
      icon: Activity,
      title: 'Auditable execution',
      description:
        'Stage decisions, evidence, and tool calls are surfaced for technical defense.',
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Governance & system
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Operational boundaries and runtime information for the demonstration.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Server size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Runtime status
              </h2>
              <p className="text-[11px] text-slate-400">
                ResolveAI backend connection
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <InfoRow
              label="Backend"
              value={health?.status === 'ok' ? 'Healthy' : 'Available'}
            />
            <InfoRow
              label="AI provider"
              value={health?.aiProvider ?? 'Configured'}
            />
            <InfoRow label="API" value="Connected through /api" />
            <InfoRow label="Execution" value="Controlled demo environment" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Agent policy
              </h2>
              <p className="text-[11px] text-slate-400">
                What the interface exposes to operators
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="mt-0.5 text-amber-500" />
              <p className="text-xs leading-5 text-slate-600">
                The agent is expected to reason over ticket context, retrieve
                knowledge, inspect telemetry, select a remediation tool, verify
                the result, or escalate when an action exceeds its boundary.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {governance.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
