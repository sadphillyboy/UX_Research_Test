import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';

export default function TestResults({ results }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  if (!results || results.length === 0) return null;

  const grouped = {};
  results.forEach((r) => {
    const key = r.test;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-xl font-bold text-slate-800">Statistical Test Results</h2>

      {Object.entries(grouped).map(([testName, tests]) => (
        <div key={testName} className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            {testName}
            <span className="text-xs font-normal bg-slate-100 px-2 py-0.5 rounded-full">
              {tests.length} test{tests.length > 1 ? 's' : ''}
            </span>
          </h3>

          {tests.map((r, idx) => {
            const globalIdx = results.indexOf(r);
            const isExpanded = expandedIdx === globalIdx;
            const isSig = r.significant === 'Yes';

            return (
              <div
                key={globalIdx}
                className={`
                  border rounded-xl overflow-hidden transition-all duration-200
                  ${isSig ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-white'}
                `}
              >
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : globalIdx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isSig ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {_testTitle(r)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {_formatP(r.p_value)} · Effect: {r.effect_label || 'N/A'}
                        {r.effect_size != null && ` (${r.effect_size.toFixed(3)})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`
                      text-xs px-2 py-1 rounded-full font-medium
                      ${isSig ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
                    `}>
                      {isSig ? 'Significant' : 'Not Significant'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">
                      {r.insight}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <MiniStat label="Statistic" value={r.statistic?.toFixed(3)} />
                      <MiniStat label="p-value" value={_formatP(r.p_value)} />
                      <MiniStat label="Effect Size" value={r.effect_size?.toFixed(3)} />
                      <MiniStat label="Effect" value={r.effect_label} />
                    </div>

                    {r.group_medians && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500 uppercase">Group Medians</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(r.group_medians).map(([group, median]) => (
                            <span key={group} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">
                              {group}: {typeof median === 'number' ? median.toFixed(2) : median}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.post_hoc && r.post_hoc.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500 uppercase">Post-hoc Pairwise Comparisons</p>
                        <div className="space-y-1">
                          {r.post_hoc.map((ph, phIdx) => (
                            <div key={phIdx} className={`
                              flex items-center justify-between text-xs px-3 py-2 rounded-lg
                              ${ph.significant === 'Yes' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}
                            `}>
                              <span>{ph.comparison}</span>
                              <span>{_formatP(ph.p_value)}</span>
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
      ))}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-700">{value ?? '—'}</p>
    </div>
  );
}

function _testTitle(r) {
  if (r.variable && r.grouping_variable) {
    return `${r.variable} by ${r.grouping_variable}`;
  }
  if (r.variable_1 && r.variable_2) {
    return `${r.variable_1} vs ${r.variable_2}`;
  }
  return r.test;
}

function _formatP(p) {
  if (p == null) return '—';
  if (p < 0.001) return 'p < 0.001';
  return `p = ${p.toFixed(4)}`;
}
