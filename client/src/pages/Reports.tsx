import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFindings, useGenerateReport } from '../hooks/useApi';
import { Download, FileText, Loader2 } from 'lucide-react';

export function Reports() {
  const { data: findings } = useFindings();
  const { mutateAsync: generateReport, isPending } = useGenerateReport();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  const handleGenerate = async () => {
    const result = await generateReport() as Record<string, unknown>;
    setReport(result);
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veil-report-${Date.now()}.json`;
    a.click();
  };

  const handleSarifDownload = async () => {
    const response = await fetch('/api/reports/sarif');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'veil-findings.sarif.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = report?.summary as Record<string, number> | undefined;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Reports</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Generate structured security reports from scenario findings</p>
      </div>

      <div className="rounded-[22px] p-6 border mb-5" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Full Report</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>All {findings?.length ?? 0} findings</div>
          </div>
          <div className="flex items-center gap-2">
            {report && (
              <button onClick={downloadReport} className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm bg-green-500/15 text-green-400 hover:bg-green-500/25">
                <Download size={14} /> Download JSON
              </button>
            )}
            <button
              onClick={handleSarifDownload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm bg-violet-500/15 text-violet-400 hover:bg-violet-500/25"
            >
              <Download size={14} /> Download SARIF
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Generate Report
            </motion.button>
          </div>
        </div>

        {report && summary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total', value: summary.total_findings, color: 'text-blue-400' },
                { label: 'Critical', value: summary.critical, color: 'text-red-400' },
                { label: 'High', value: summary.high, color: 'text-orange-400' },
                { label: 'Medium', value: summary.medium, color: 'text-yellow-400' },
              ].map(s => (
                <div key={s.label} className="rounded-[12px] p-3 text-center" style={{ background: 'var(--surface-2)' }}>
                  <div className={`text-xl font-display font-bold ${s.color}`}>{s.value ?? 0}</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <pre className="text-[11px] font-mono rounded-[12px] p-4 overflow-auto max-h-64" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
              {JSON.stringify(report, null, 2)}
            </pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}
