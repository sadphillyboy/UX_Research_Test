import { useState } from 'react';
import { Table2, ChevronDown, ChevronUp } from 'lucide-react';

export default function DescriptiveStats({ descriptives }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!descriptives || Object.keys(descriptives).length === 0) return null;

  const numeric = Object.entries(descriptives).filter(([, v]) => v.type === 'numeric');
  const categorical = Object.entries(descriptives).filter(([, v]) => v.type === 'categorical');

  return (
    <div className="fade-in">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xl font-bold text-slate-800 hover:text-indigo-600 transition-colors"
      >
        <Table2 className="w-5 h-5" />
        Descriptive Statistics
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          {numeric.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <h3 className="px-4 py-3 text-sm font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                Numeric Variables
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Variable</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">N</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Mean</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Median</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">SD</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Min</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Max</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Skew</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {numeric.map(([name, stats]) => (
                      <tr key={name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 font-medium text-slate-700">{name}</td>
                        <td className="px-3 py-2 text-right text-slate-600 font-mono text-xs">{stats.count}</td>
                        <td className="px-3 py-2 text-right text-slate-600 font-mono text-xs">{stats.mean?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-slate-600 font-mono text-xs">{stats.median?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-slate-600 font-mono text-xs">{stats.std?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-slate-600 font-mono text-xs">{stats.min?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-slate-600 font-mono text-xs">{stats.max?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-slate-600 font-mono text-xs">{stats.skewness?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {categorical.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <h3 className="px-4 py-3 text-sm font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                Categorical Variables
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Variable</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">N</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Unique</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Most Common</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {categorical.map(([name, stats]) => (
                      <tr key={name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 font-medium text-slate-700">{name}</td>
                        <td className="px-3 py-2 text-right text-slate-600 font-mono text-xs">{stats.count}</td>
                        <td className="px-3 py-2 text-right text-slate-600 font-mono text-xs">{stats.unique}</td>
                        <td className="px-3 py-2 text-slate-600 text-xs">
                          {stats.top} ({stats.freq})
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(stats.distribution || {}).slice(0, 5).map(([k, v]) => (
                              <span key={k} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
