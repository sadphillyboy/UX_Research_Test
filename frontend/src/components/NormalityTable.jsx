import { Info } from 'lucide-react';

export default function NormalityTable({ normality }) {
  if (!normality || normality.length === 0) return null;

  return (
    <div className="fade-in">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl font-bold text-slate-800">Normality Assessment</h2>
        <div className="group relative">
          <Info className="w-4 h-4 text-slate-400 cursor-help" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Normality tests help justify the use of non-parametric methods. Non-parametric tests are valid regardless of distribution, but it's good practice to check.
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Variable</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Test</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Statistic</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">p-value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Normal?</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {normality.map((n, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">{n.variable}</td>
                  <td className="px-4 py-3 text-slate-600">{n.test}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{n.statistic?.toFixed(4)}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                    {n.p_value < 0.001 ? '< 0.001' : n.p_value?.toFixed(4)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full font-medium
                      ${n.normal === 'Yes' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}
                    `}>
                      {n.normal === 'Yes' ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">{n.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
