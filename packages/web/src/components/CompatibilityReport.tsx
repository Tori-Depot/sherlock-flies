import type { Report } from '../types';
import { FeatureTable } from './FeatureTable';

interface CompatibilityReportProps {
  report: Report;
}

function scoreColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreBorder(score: number): string {
  if (score >= 90) return 'border-green-800 bg-green-950/50';
  if (score >= 70) return 'border-yellow-800 bg-yellow-950/50';
  return 'border-red-800 bg-red-950/50';
}

export function CompatibilityReport({ report }: CompatibilityReportProps) {
  return (
    <div className="mt-8 space-y-6">
      {/* Score summary */}
      <div className={`rounded-lg border p-6 ${scoreBorder(report.score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-4xl font-bold ${scoreColor(report.score)}`}>{report.score}%</p>
            <p className="mt-1 text-gray-300">{report.summary}</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{report.supported}</p>
              <p className="text-gray-500">Supported</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{report.warnings}</p>
              <p className="text-gray-500">Warnings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{report.unsupported}</p>
              <p className="text-gray-500">Unsupported</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature tables */}
      {report.rules.map((rule) => (
        <FeatureTable key={rule.category} category={rule.category} features={rule.features} />
      ))}
    </div>
  );
}
