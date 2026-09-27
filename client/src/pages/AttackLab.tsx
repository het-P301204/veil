import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronRight, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useScenarios, useRunScenario } from '../hooks/useApi';
import { useVeilStore, useTelemetryStore } from '../store';
import { SeverityBadge, ModuleBadge, OWASPBadge } from '../components/ui/Badge';
import { RevealHiddenContent } from '../components/RevealHiddenContent';
import type { RunStage, ScenarioConfig } from '../types';

const STAGES: Array<{ id: RunStage; label: string; desc: string }> = [
  { id: 'initializing', label: 'MCP Initialization', desc: 'Client connecting to server' },
  { id: 'tools_list', label: 'tools/list Request', desc: 'Requesting tool definitions' },
  { id: 'analyzing', label: 'Definition Analysis', desc: 'VEIL inspecting tool content' },
  { id: 'detecting', label: 'Instruction Detected', desc: 'Hidden payload identified' },
  { id: 'tool_call', label: 'tools/call', desc: 'Executing tool interaction' },
  { id: 'verified', label: 'Evidence Captured', desc: 'Finding verified' },
];

function StageIndicator({ stage, current }: { stage: typeof STAGES[0]; current: RunStage }) {
  const stageOrder = STAGES.map(s => s.id);
  const currentIdx = stageOrder.indexOf(current);
  const stageIdx = stageOrder.indexOf(stage.id);
  const isDone = currentIdx > stageIdx;
  const isActive = stage.id === current;
  const isFailed = current === 'failed' && isActive;

  return (
    <motion.div
      animate={{
        borderColor: isActive ? '#f97316' : isDone ? '#10b981' : 'var(--surface-border)',
        backgroundColor: isActive ? 'rgba(249,115,22,0.08)' : isDone ? 'rgba(16,185,129,0.06)' : 'transparent',
      }}
      className="rounded-[12px] p-3 border mb-2"
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
          isDone ? 'bg-green-500' : isActive ? 'bg-orange-500' : ''
        }`} style={{ border: isDone || isActive ? 'none' : '1px solid var(--surface-border)' }}>
          {isDone && <CheckCircle size={12} className="text-white" />}
          {isActive && !isFailed && <Loader2 size={10} className="text-white animate-spin" />}
          {isFailed && <AlertTriangle size={10} className="text-white" />}
          {!isDone && !isActive && <Clock size={10} style={{ color: 'var(--text-tertiary)' }} />}
        </div>
        <div>
          <div className="text-xs font-medium font-mono" style={{ color: isDone ? '#10b981' : isActive ? '#f97316' : 'var(--text-secondary)' }}>
            {stage.label}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{stage.desc}</div>
        </div>
      </div>
    </motion.div>
  );
}

export function AttackLab() {
  const { data: scenarios, isLoading } = useScenarios();
  const { mutateAsync: runScenario, isPending } = useRunScenario();
  const { activeScenario, setActiveScenario, runStage, setRunStage, isRunning, setIsRunning, currentResult } = useVeilStore();
  const { events, protocolEvents, clearEvents } = useTelemetryStore();

  const handleRun = async () => {
    if (!activeScenario || isRunning) return;
    clearEvents();
    setRunStage('initializing');
    setIsRunning(true);
    try {
      await runScenario(activeScenario.name);
    } catch (e) {
      setRunStage('failed');
      setIsRunning(false);
    }
  };

  const activeProtocol = protocolEvents.slice(0, 10);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-1)' }}>
        <div>
          <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Attack Lab</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Controlled MCP security testing environment</p>
        </div>
        <div className="flex items-center gap-3">
          {runStage !== 'idle' && (
            <span className={`text-xs font-mono px-2 py-1 rounded-[6px] ${
              runStage === 'verified' ? 'bg-green-500/15 text-green-400' :
              runStage === 'failed' ? 'bg-red-500/15 text-red-400' :
              'bg-orange-500/15 text-orange-400'
            }`}>
              {runStage.toUpperCase().replace('_', ' ')}
            </span>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRun}
            disabled={!activeScenario || isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isRunning ? 'rgba(249,115,22,0.15)' : '#3b82f6',
              color: isRunning ? '#fb923c' : 'white',
            }}
          >
            {isRunning ? <><Loader2 size={14} className="animate-spin" /> Running</> : <><Play size={14} /> Run Scenario</>}
          </motion.button>
        </div>
      </div>

      {/* 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Scenario selector */}
        <div className="w-72 border-r overflow-y-auto p-3" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-1)' }}>
          <div className="text-xs font-medium uppercase tracking-wide mb-3 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Scenarios
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-blue-400" />
            </div>
          ) : scenarios?.map((s, i) => (
            <motion.button
              key={s.name}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ x: 2 }}
              onClick={() => setActiveScenario(s)}
              className={`w-full text-left rounded-[12px] p-3 mb-2 border transition-all ${
                activeScenario?.name === s.name
                  ? 'border-blue-500/40 bg-blue-500/10'
                  : 'hover:bg-white/5'
              }`}
              style={{ borderColor: activeScenario?.name === s.name ? undefined : 'var(--surface-border)' }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-xs font-mono font-medium leading-tight" style={{ color: activeScenario?.name === s.name ? '#60a5fa' : 'var(--text-primary)' }}>
                  {s.name}
                </span>
                <SeverityBadge severity={s.severity} />
              </div>
              <p className="text-[11px] leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>{s.description}</p>
              <ModuleBadge module={s.module} />
            </motion.button>
          ))}
        </div>

        {/* CENTER: Attack lifecycle */}
        <div className="flex-1 overflow-y-auto p-6">
          {!activeScenario ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-[20px] bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <ChevronRight size={24} className="text-blue-400" />
                </div>
                <div className="font-display font-semibold" style={{ color: 'var(--text-secondary)' }}>Select a scenario</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Choose an attack scenario from the left panel</div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{activeScenario.name}</span>
                  <SeverityBadge severity={activeScenario.severity} />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{activeScenario.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <ModuleBadge module={activeScenario.module} />
                  {activeScenario.owasp?.map(o => <OWASPBadge key={o} category={o} />)}
                </div>
              </div>

              {/* Attack stages */}
              {runStage !== 'idle' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                  <div className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
                    Attack Lifecycle
                  </div>
                  {STAGES.map(stage => (
                    <StageIndicator key={stage.id} stage={stage} current={runStage} />
                  ))}
                </motion.div>
              )}

              {/* Tool definitions with reveal */}
              {activeScenario.tools && activeScenario.tools.length > 0 && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
                    Tool Definitions
                  </div>
                  {activeScenario.tools.map(tool => (
                    tool.hidden_instruction ? (
                      <div key={tool.name} className="mb-3">
                        <RevealHiddenContent
                          toolName={tool.name}
                          visibleContent={tool.description}
                          hiddenContent={tool.hidden_instruction}
                        />
                      </div>
                    ) : (
                      <div key={tool.name} className="mb-3 rounded-[16px] p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--surface-border)' }}>
                        <div className="font-mono text-sm text-cyan-400 mb-1">{tool.name}</div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tool.description}</p>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Result */}
              <AnimatePresence>
                {currentResult && runStage === 'verified' && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-[16px] p-4 border border-green-500/30 bg-green-500/5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={16} className="text-green-400" />
                      <span className="font-display font-semibold text-sm text-green-400">Attack Verified</span>
                    </div>
                    <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {currentResult.assertions_passed}/{currentResult.assertions_total} assertions passed
                      {' · '}{Math.round(currentResult.duration_ms)}ms
                      {currentResult.finding_id && ' · Finding generated'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* RIGHT: Evidence / protocol */}
        <div className="w-80 border-l overflow-y-auto p-3" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-1)' }}>
          <div className="text-xs font-medium uppercase tracking-wide mb-3 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Protocol Trace
          </div>
          {activeProtocol.length === 0 ? (
            <div className="text-xs text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
              Run a scenario to see protocol events
            </div>
          ) : activeProtocol.map((evt, i) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-[10px] p-2.5 mb-2 ${evt.is_malicious ? 'bg-orange-500/10 border border-orange-500/30' : 'border'}`}
              style={evt.is_malicious ? {} : { background: 'var(--surface-2)', borderColor: 'var(--surface-border)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono ${
                  evt.direction === 'client_to_server' ? 'text-blue-400' :
                  evt.direction === 'server_to_client' ? 'text-cyan-400' : 'text-violet-400'
                }`}>
                  {evt.direction === 'client_to_server' ? 'C → S' : evt.direction === 'server_to_client' ? 'S → C' : 'VEIL'}
                </span>
                {evt.is_malicious && <span className="text-[9px] font-medium text-orange-400 bg-orange-500/15 px-1.5 py-0.5 rounded-[4px]">MALICIOUS</span>}
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{evt.method}</div>
              {evt.malicious_content && (
                <div className="text-[10px] mt-1 text-orange-300 font-mono truncate">{evt.malicious_content.slice(0, 60)}...</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
