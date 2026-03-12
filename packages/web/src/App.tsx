import { useState } from 'react';
import { WorkflowInput } from './components/WorkflowInput';
import { CompatibilityReport } from './components/CompatibilityReport';
import type { Report } from './types';

export default function App() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze(yaml: string) {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yaml }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Analysis failed');
        return;
      }

      setReport(data as Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Depot CI Compatibility Checker</h1>
          <p className="mt-2 text-gray-400">
            Paste your GitHub Actions workflow YAML to check Depot CI compatibility
          </p>
        </header>

        <WorkflowInput onAnalyze={handleAnalyze} loading={loading} />

        {error && (
          <div className="mt-6 rounded-lg border border-red-800 bg-red-950 p-4 text-red-300">
            {error}
          </div>
        )}

        {report && <CompatibilityReport report={report} />}
      </div>
    </div>
  );
}
