import type { FeatureCheck } from '../types';

interface FeatureTableProps {
  category: string;
  features: FeatureCheck[];
}

const STATUS_ICONS: Record<string, string> = {
  supported: '\u2705',
  warning: '\uD83D\uDD28',
  unsupported: '\u274C',
};

const STATUS_COLORS: Record<string, string> = {
  supported: 'text-green-400',
  warning: 'text-yellow-400',
  unsupported: 'text-red-400',
};

export function FeatureTable({ category, features }: FeatureTableProps) {
  if (features.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-800">
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-200">{category}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left text-xs uppercase text-gray-500">
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Feature</th>
            <th className="px-4 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, i) => (
            <tr key={i} className="border-b border-gray-800/50 last:border-0">
              <td className="px-4 py-2.5">
                <span className={STATUS_COLORS[feature.status]}>
                  {STATUS_ICONS[feature.status]} {feature.status}
                </span>
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-300">{feature.name}</td>
              <td className="px-4 py-2.5">
                <span className="text-gray-400">{feature.notes}</span>
                {feature.workaround && (
                  <div className="mt-1 text-xs text-blue-400">Workaround: {feature.workaround}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
