import { useState } from 'react';
import { BarChart3, CheckCircle2, XCircle, FlaskConical, Lightbulb, Sparkles, ChevronDown, ChevronUp, Target, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Summary({ summary, datasetInfo, aiInsights }) {
  if (!summary) return null;

  return (
    <div className="fade-in space-y-6">
      <StatCards summary={summary} datasetInfo={datasetInfo} />
      {aiInsights && <AIInsights insights={aiInsights} />}
      {!aiInsights && summary.key_findings.length > 0 && (
        <FallbackFindings findings={summary.key_findings} />
      )}
      <RawFindings summary={summary} hasAI={!!aiInsights} />
      <Recommendations recommendations={summary.recommendations} />
    </div>
  );
}

function StatCards({ summary, datasetInfo }) {
  return (
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

function AIInsights({ insights }) {
  return (
    <div className="space-y-4">
      {/* Headline */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-indigo-200" />
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">AI Analysis</span>
        </div>
        <h2 className="text-xl font-bold leading-snug">{insights.headline}</h2>
        <p className="mt-3 text-sm text-indigo-100 leading-relaxed">{insights.executive_summary}</p>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} index={i} />
        ))}
      </div>

      {/* Limitations */}
      {insights.what_the_data_doesnt_tell_us && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Limitations</p>
            <p className="text-sm text-slate-600 leading-relaxed">{insights.what_the_data_doesnt_tell_us}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight, index }) {
  const colors = [
    'border-l-indigo-500',
    'border-l-emerald-500',
    'border-l-amber-500',
    'border-l-rose-500',
    'border-l-cyan-500',
  ];

  return (
    <div className={`bg-white border border-slate-200 border-l-4 ${colors[index % colors.length]} rounded-xl p-5 shadow-sm`}>
      <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-slate-400" />
        {insight.title}
      </h3>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">What we found</p>
          <p className="text-slate-700 leading-relaxed">{insight.finding}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Why it matters</p>
          <p className="text-slate-700 leading-relaxed">{insight.impact}</p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-3 flex items-start gap-2">
          <ArrowRight className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-indigo-500 uppercase tracking-wider mb-0.5">Next step</p>
            <p className="text-indigo-800 font-medium leading-relaxed">{insight.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FallbackFindings({ findings }) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-emerald-800 flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5" />
        Key Findings
      </h3>
      <ul className="space-y-3">
        {findings.map((finding, i) => (
          <li key={i} className="text-sm text-emerald-900 leading-relaxed pl-4 border-l-2 border-emerald-300">
            {finding}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-emerald-600 italic">
        Tip: Add an ANTHROPIC_API_KEY environment variable to get AI-powered insights translated into plain language for product managers.
      </p>
    </div>
  );
}

function RawFindings({ summary, hasAI }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!summary.key_findings || summary.key_findings.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <FlaskConical className="w-4 h-4" />
          {hasAI ? 'Raw Statistical Findings' : 'Detailed Statistical Findings'}
          <span className="text-xs font-normal bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            {summary.key_findings.length}
          </span>
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-4 border-t border-slate-100">
          <ul className="space-y-2 mt-3">
            {summary.key_findings.map((finding, i) => (
              <li key={i} className="text-xs text-slate-600 leading-relaxed pl-3 border-l-2 border-slate-200 font-mono">
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Recommendations({ recommendations }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="border border-amber-200 rounded-xl overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-amber-100/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-amber-700">
          <Lightbulb className="w-4 h-4" />
          Methodology Notes
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-amber-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-500" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-4 border-t border-amber-200">
          <ul className="space-y-2 mt-3">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-amber-900 leading-relaxed pl-3 border-l-2 border-amber-300">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
