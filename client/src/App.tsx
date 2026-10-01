import { useEffect, useState } from 'react';
import { 
  Bot, 
  CheckCircle2, 
  AlertCircle, 
  Workflow, 
  Server,
  Play,
  RotateCcw,
  User,
  Building,
  Terminal,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Wifi,
  Key
} from 'lucide-react';
import { Ticket, KnowledgeArticle, WorkflowStageResult } from './types.js';

interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
  aiProvider: string;
  version: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [backendLoading, setBackendLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('TCK-1001');
  const [kbArticles, setKbArticles] = useState<KnowledgeArticle[]>([]);
  const [activeTab, setActiveTab] = useState<'workbench' | 'telemetry' | 'kb'>('workbench');
  
  // Investigation state
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [visibleStageCount, setVisibleStageCount] = useState<number>(0);
  const [expandedStageIndex, setExpandedStageIndex] = useState<number | null>(null);
  const [telemetryData, setTelemetryData] = useState<Record<string, unknown> | null>(null);

  // Fetch initial data
  const loadData = async () => {
    try {
      const [hRes, tRes, kbRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/tickets'),
        fetch('/api/kb')
      ]);

      if (hRes.ok) {
        setHealth(await hRes.json());
      }
      if (tRes.ok) {
        const data = await tRes.json();
        setTickets(data.tickets);
        if (data.tickets.length > 0 && !selectedTicketId) {
          setSelectedTicketId(data.tickets[0].id);
        }
      }
      if (kbRes.ok) {
        const data = await kbRes.json();
        setKbArticles(data.articles);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setBackendLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  // Fetch telemetry whenever selected ticket changes
  useEffect(() => {
    if (selectedTicket) {
      fetch(`/api/telemetry/${encodeURIComponent(selectedTicket.employeeEmail)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.telemetry) {
            setTelemetryData(data.telemetry);
          }
        })
        .catch(err => console.error('Failed to load telemetry:', err));

      // If the ticket was already investigated, show all stages
      if (selectedTicket.investigationResult) {
        setVisibleStageCount(selectedTicket.investigationResult.stages.length);
      } else {
        setVisibleStageCount(0);
      }
    }
  }, [selectedTicketId, selectedTicket?.status]);

  // Execute Agent Workflow
  const handleInvestigate = async () => {
    if (!selectedTicket || isInvestigating) return;

    setIsInvestigating(true);
    setVisibleStageCount(0);
    setExpandedStageIndex(null);

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/investigate`, {
        method: 'POST'
      });
      const data = await res.json();

      if (data.success && data.result) {
        const stages: WorkflowStageResult[] = data.result.stages;

        // Animate stage reveals sequentially for live observability
        for (let i = 1; i <= stages.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 350));
          setVisibleStageCount(i);
        }

        // Update local tickets state with result
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
        
        // Auto-expand the decisive stage (stage 4 or 5 or 6)
        if (data.result.outcome === 'RESOLVED') {
          setExpandedStageIndex(4); // Resolution stage
        } else {
          setExpandedStageIndex(5); // Escalation stage
        }
      }
    } catch (err) {
      console.error('Investigation failed:', err);
    } finally {
      setIsInvestigating(false);
    }
  };

  // Reset Demo State
  const handleReset = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        await loadData();
        setSelectedTicketId('TCK-1001');
        setVisibleStageCount(0);
      }
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const currentResult = selectedTicket?.investigationResult;
  const stagesToDisplay = currentResult ? currentResult.stages.slice(0, visibleStageCount) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-500/10 border border-sky-500/30 p-2 rounded-xl text-sky-400 shadow-inner">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">ResolveAI</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Problem #12
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ₹0 Cost Stack
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous IT Service Desk Resolution Agent</p>
          </div>
        </div>

        {/* Navigation Tabs & Status */}
        <div className="flex items-center space-x-4">
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('workbench')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${activeTab === 'workbench' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Workbench
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${activeTab === 'telemetry' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Simulated Telemetry
            </button>
            <button
              onClick={() => setActiveTab('kb')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${activeTab === 'kb' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Knowledge Base
            </button>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition"
            title="Reset tickets and mock telemetry to default"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Demo</span>
          </button>

          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-xs">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Backend:</span>
            {backendLoading ? (
              <span className="text-amber-400">Checking...</span>
            ) : health ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Online ({health.aiProvider})
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Disconnected
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        
        {/* Scenario Quick Selector Banner */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Demo Scenarios & Test Suite</span>
              <p className="text-xs text-slate-400">Select any realistic IT service desk scenario to evaluate the autonomous agent workflow:</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {tickets.map((t) => {
              const isSelected = t.id === selectedTicketId;
              let scenarioTag = 'Autonomous';
              let tagColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
              if (t.scenarioKey === 'vpn_cert' || t.scenarioKey === 'software_request' || t.scenarioKey === 'hardware_failure') {
                scenarioTag = 'Escalation';
                tagColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
              }

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`text-left p-2.5 rounded-lg border transition-all flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-sky-950/60 border-sky-500 ring-1 ring-sky-500 shadow-md' 
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{t.id}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${tagColor}`}>
                        {scenarioTag}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 line-clamp-1">{t.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <User className="w-2.5 h-2.5" />
                      <span>{t.employeeName}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded font-bold ${
                      t.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300' :
                      t.status === 'ESCALATED' ? 'bg-amber-500/20 text-amber-300' :
                      t.status === 'INVESTIGATING' ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {t.status}
                    </span>
                    <span className="text-slate-500 font-mono">{t.priority}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* WORKBENCH VIEW */}
        {activeTab === 'workbench' && selectedTicket && (
          <div className="space-y-6">
            {/* Selected Ticket Active Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-400">
                      {selectedTicket.id}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedTicket.category}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      selectedTicket.priority === 'P1' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      selectedTicket.priority === 'P2' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      Priority: {selectedTicket.priority}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      selectedTicket.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      selectedTicket.status === 'ESCALATED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      Status: {selectedTicket.status}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {selectedTicket.title}
                  </h2>

                  <p className="text-sm text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 font-mono">
                    "{selectedTicket.description}"
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedTicket.employeeName}</span>
                      <span className="text-slate-600">({selectedTicket.employeeEmail})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedTicket.department}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={handleInvestigate}
                    disabled={isInvestigating}
                    className={`flex items-center space-x-2.5 px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
                      isInvestigating 
                        ? 'bg-sky-600/50 text-sky-200 cursor-wait' 
                        : 'bg-sky-600 hover:bg-sky-500 text-white hover:shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {isInvestigating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Investigating with Agent...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Investigate with ResolveAI</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-400">
                    Executes real 6-phase autonomous pipeline
                  </p>
                </div>
              </div>
            </div>

            {/* 6-STAGE WORKFLOW PIPELINE GRAPH */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Workflow className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    6-Phase Autonomous Agent Pipeline Execution
                  </h3>
                </div>
                {currentResult && (
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-400">Overall Confidence:</span>
                    <span className="font-bold font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {currentResult.confidence}%
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Stepper Bar */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 pt-2">
                {[
                  { name: '1. Ticket Triage', key: 'triage' },
                  { name: '2. Knowledge / RAG', key: 'rag' },
                  { name: '3. System Diagnosis', key: 'diagnosis' },
                  { name: '4. Troubleshooting', key: 'troubleshooting' },
                  { name: '5. Resolution', key: 'resolution' },
                  { name: '6. Escalation', key: 'escalation' },
                ].map((step, idx) => {
                  const stageResult = currentResult?.stages[idx];
                  const isVisible = visibleStageCount > idx;
                  const isExecuting = isInvestigating && visibleStageCount === idx;
                  const isSuccess = isVisible && stageResult?.status === 'SUCCESS';
                  const isSkipped = isVisible && stageResult?.status === 'SKIPPED';
                  const isSelectedForDetail = expandedStageIndex === idx;

                  let borderClass = 'border-slate-800 bg-slate-950/40 text-slate-500';
                  if (isExecuting) {
                    borderClass = 'border-sky-500 bg-sky-950/40 text-sky-300 animate-pulse ring-1 ring-sky-500';
                  } else if (isSuccess) {
                    borderClass = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
                  } else if (isSkipped) {
                    borderClass = 'border-slate-700 bg-slate-900/60 text-slate-400';
                  }

                  return (
                    <button
                      key={step.key}
                      onClick={() => setExpandedStageIndex(expandedStageIndex === idx ? null : idx)}
                      disabled={!isVisible}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${borderClass} ${
                        isSelectedForDetail ? 'ring-2 ring-sky-400' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                        <span>Phase {idx + 1}</span>
                        {isExecuting ? (
                          <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                        ) : isSuccess ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isSkipped ? (
                          <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">Bypassed</span>
                        ) : (
                          <span className="text-slate-600">Pending</span>
                        )}
                      </div>
                      <div className="text-xs font-bold truncate text-slate-200">
                        {step.name.split('. ')[1]}
                      </div>
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                        {isVisible && stageResult ? (
                          <>
                            <span className="font-mono">{stageResult.confidence}% conf</span>
                            <span>{stageResult.toolCalls.length} tool calls</span>
                          </>
                        ) : (
                          <span>Waiting...</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STAGE EXECUTION DETAILS & EVIDENCE */}
            {stagesToDisplay.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Live Stage Telemetry, Tool Calls & Evidence
                  </h3>
                  <span className="text-xs text-slate-500">
                    Click any stage card to toggle tool parameters & evidence inspection
                  </span>
                </div>

                <div className="space-y-3">
                  {stagesToDisplay.map((stage, idx) => {
                    const isExpanded = expandedStageIndex === idx;

                    return (
                      <div 
                        key={stage.stage}
                        className={`border rounded-xl transition-all duration-200 ${
                          stage.status === 'SUCCESS' ? 'border-slate-800 bg-slate-900/90' :
                          stage.status === 'SKIPPED' ? 'border-slate-800/80 bg-slate-900/50' :
                          'border-rose-900/50 bg-rose-950/20'
                        }`}
                      >
                        {/* Stage Card Header */}
                        <div 
                          onClick={() => setExpandedStageIndex(isExpanded ? null : idx)}
                          className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              stage.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              stage.status === 'SKIPPED' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              <Terminal className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white">{stage.stageName}</h4>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  stage.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                                  stage.status === 'SKIPPED' ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  {stage.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1 font-medium">
                                {stage.decision}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 self-end md:self-auto">
                            <div className="text-right">
                              <div className="text-[10px] text-slate-400 font-mono">Confidence</div>
                              <div className="text-xs font-bold text-sky-400 font-mono">{stage.confidence}%</div>
                            </div>

                            <button className="p-1 rounded hover:bg-slate-800 text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Inspection: Decision Rationale, Evidence, Tool Calls */}
                        {isExpanded && (
                          <div className="border-t border-slate-800/80 p-4 space-y-4 bg-slate-950/60 rounded-b-xl text-xs">
                            {/* Concise Rationale */}
                            <div>
                              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                                Decision Rationale
                              </span>
                              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-slate-200 leading-relaxed font-sans">
                                {stage.rationale}
                              </div>
                            </div>

                            {/* Evidence Gathered */}
                            {stage.evidence.length > 0 && (
                              <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                  Evidence Collected ({stage.evidence.length} items)
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {stage.evidence.map((ev, i) => (
                                    <div key={i} className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between">
                                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                        <span className="font-semibold">{ev.label}</span>
                                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">{ev.source}</span>
                                      </div>
                                      <div className="text-slate-100 font-mono text-xs font-bold break-all">
                                        {typeof ev.value === 'object' ? JSON.stringify(ev.value) : String(ev.value)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tool Calls */}
                            {stage.toolCalls.length > 0 && (
                              <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                  Simulated Diagnostic / Tool Executions ({stage.toolCalls.length})
                                </span>
                                <div className="space-y-2">
                                  {stage.toolCalls.map((tc, i) => (
                                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden font-mono">
                                      <div className="bg-slate-800/80 px-3 py-1.5 flex items-center justify-between text-[11px]">
                                        <span className="text-sky-400 font-bold flex items-center gap-1.5">
                                          <Terminal className="w-3 h-3" />
                                          {tc.toolName}()
                                        </span>
                                        <span className="text-slate-500 text-[10px]">{tc.timestamp.split('T')[1]?.replace('Z', '')}</span>
                                      </div>
                                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                                        <div>
                                          <div className="text-[10px] text-slate-500 font-semibold mb-1">INPUT:</div>
                                          <pre className="bg-slate-950 p-2 rounded border border-slate-800/80 text-emerald-400 overflow-x-auto">
                                            {JSON.stringify(tc.input, null, 2)}
                                          </pre>
                                        </div>
                                        <div>
                                          <div className="text-[10px] text-slate-500 font-semibold mb-1">OUTPUT:</div>
                                          <pre className="bg-slate-950 p-2 rounded border border-slate-800/80 text-sky-300 overflow-x-auto">
                                            {JSON.stringify(tc.output, null, 2)}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FINAL OUTCOME CARD: RESOLUTION OR HUMAN ESCALATION */}
            {currentResult && visibleStageCount === currentResult.stages.length && (
              <div className="pt-2">
                {currentResult.outcome === 'RESOLVED' ? (
                  <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">Autonomous Remediation Succeeded</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            Ticket Resolved
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Remediation action verified with 0 human intervention required.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block mb-1">Action Executed:</span>
                        <div className="text-emerald-300 font-bold">
                          {currentResult.remediationAction?.actionName}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Post-Remediation Verification:</span>
                        <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verification Passed: 100% Health Probe OK</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <strong>Resolution Summary:</strong> {currentResult.finalRationale}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">Human Escalation Dossier Dispatched</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            Human-in-the-Loop Safe
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Automated execution safely halted per policy boundaries and routed to human queue.
                        </p>
                      </div>
                    </div>

                    {currentResult.escalationDossier && (
                      <div className="bg-slate-950/80 border border-amber-500/20 rounded-xl p-4 space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-800">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Assigned Queue</span>
                            <span className="text-amber-300 font-bold font-mono">
                              {currentResult.escalationDossier.assignedQueue}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Urgency Level</span>
                            <span className="text-rose-400 font-bold font-mono">
                              {currentResult.escalationDossier.urgencyLevel} (Escalated SLA)
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Escalation Trigger</span>
                            <span className="text-slate-200 font-medium">
                              Policy / Hardware Boundary
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Escalation Reason:</span>
                          <div className="text-slate-200 font-medium bg-slate-900 p-2.5 rounded border border-slate-800">
                            {currentResult.escalationDossier.escalationReason}
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Diagnostic Findings Brief:</span>
                          <div className="text-slate-300 font-mono text-[11px] bg-slate-900 p-2.5 rounded border border-slate-800">
                            {currentResult.escalationDossier.diagnosticFindings}
                          </div>
                        </div>

                        <div>
                          <span className="text-amber-400 text-[10px] uppercase font-bold block mb-1">Recommended Action for Human Engineer:</span>
                          <div className="text-amber-200 bg-amber-500/10 p-2.5 rounded border border-amber-500/30">
                            {currentResult.escalationDossier.recommendedHumanAction}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SIMULATED TELEMETRY VIEW */}
        {activeTab === 'telemetry' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-sky-400" />
                Live Simulated Enterprise Telemetry Store
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time simulated telemetry for active employee: <span className="font-mono text-sky-400">{selectedTicket?.employeeEmail}</span>
              </p>
            </div>

            {telemetryData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Network Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                    <Wifi className="w-4 h-4" />
                    <h4>Network Controller (DHCP / DNS)</h4>
                  </div>
                  <pre className="text-[11px] text-slate-300 font-mono bg-slate-900/60 p-3 rounded-lg overflow-x-auto border border-slate-800/80">
                    {JSON.stringify(telemetryData['network'], null, 2)}
                  </pre>
                </div>

                {/* Identity Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Key className="w-4 h-4" />
                    <h4>Identity Directory (Okta / AD)</h4>
                  </div>
                  <pre className="text-[11px] text-slate-300 font-mono bg-slate-900/60 p-3 rounded-lg overflow-x-auto border border-slate-800/80">
                    {JSON.stringify(telemetryData['identity'], null, 2)}
                  </pre>
                </div>

                {/* Device Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Cpu className="w-4 h-4" />
                    <h4>MDM & Endpoint Health (Jamf)</h4>
                  </div>
                  <pre className="text-[11px] text-slate-300 font-mono bg-slate-900/60 p-3 rounded-lg overflow-x-auto border border-slate-800/80">
                    {JSON.stringify(telemetryData['device'], null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">No telemetry data loaded.</div>
            )}
          </div>
        )}

        {/* KNOWLEDGE BASE VIEW */}
        {activeTab === 'kb' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                Local IT Knowledge Base & Standard Operating Procedures (SOPs)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Authoritative markdown SOPs and runbooks indexed for the RAG phase.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kbArticles.map((kb) => (
                <div key={kb.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {kb.id}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {kb.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{kb.title}</h4>
                  <p className="text-xs text-slate-300">{kb.summary}</p>
                  <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2.5 rounded border border-slate-800/80 whitespace-pre-line">
                    {kb.content}
                  </div>
                  {kb.approvedRemediation && (
                    <div className="pt-2 flex items-center justify-between text-[11px] border-t border-slate-800/80">
                      <span className="text-slate-400">Approved Remediation:</span>
                      <span className={`font-semibold ${kb.approvedRemediation.isAutomated ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {kb.approvedRemediation.actionName}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between mt-auto">
        <div>ResolveAI — Problem Statement #12: AI IT Service Desk Autonomous Resolution Agent</div>
        <div className="mt-2 sm:mt-0 flex items-center gap-3">
          <span>₹0 Cost Architecture</span>
          <span>•</span>
          <span>Zero Paid APIs</span>
          <span>•</span>
          <span>Local Deterministic Reasoner</span>
        </div>
      </footer>
    </div>
  );
}
