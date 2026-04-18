import { BarChart3, CheckCircle2, XCircle, FlaskConical, Lightbulb } from 'lucide-react';

export default function Summary({ summary, datasetInfo }) {
  if (!summary) return null;

  return (
    <div className="fade-in space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Dataset Size"
          value={`${datasetInfo.rows} × ${datasetInfo.columns}`}
          sub="rows × columns"
          color="blue"
        />
        <StatCard
          icon={<FlaskConical className="w-5 h-5" />}
          label="Tests Run"
          value={summary.total_tests_run}
          sub="non-parametric tests"
          color="indigo"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Significant"
          value={summary.significant_results}
          sub="p < 0.05"
          color="green"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5" />}
          label="Not Significant"
          value={summary.not_significant_results}
          sub="p ≥ 0.05"
          color="slate"
        />
      </div>

      {summary.key_findings.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-emerald-800 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5" />
            Key Findings
          </h3>
          <ul className="space-y-3">
            {summary.key_findings.map((finding, i) => (
              <li key={i} className="text-sm text-emerald-900 leading-relaxed pl-4 border-l-2 border-emerald-300">
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-amber-800 flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5" />
            Recommendations
          </h3>
          <ul className="space-y-3">
            {summary.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-amber-900 leading-relaxed pl-4 border-l-2 border-amber-300">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const iconBg = {
    blue: 'bg-blue-100',
    indigo: 'bg-indigo-100',
    green: 'bg-emerald-100',
    slate: 'bg-slate-100',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg[color]}`}>{icon}</div>
        <div>
          <p className="text-xs font-medium opacity-75">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs opacity-60">{sub}</p>
        </div>
      </div>
    </div>
  );
}
