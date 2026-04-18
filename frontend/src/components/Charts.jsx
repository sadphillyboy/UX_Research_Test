import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Charts({ charts }) {
  if (!charts || charts.length === 0) return null;

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-xl font-bold text-slate-800">Visualizations</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map((chart) => (
          <ChartCard key={chart.id} chart={chart} />
        ))}
      </div>
    </div>
  );
}

function ChartCard({ chart }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">{chart.title}</h3>
        {chart.significant && (
          <span className={`
            text-xs px-2 py-0.5 rounded-full font-medium
            ${chart.significant === 'Yes' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}
          `}>
            {chart.significant === 'Yes' ? '✓ Significant' : 'Not Significant'}
          </span>
        )}
      </div>
      <div className="h-64">
        {chart.type === 'histogram' && <Histogram data={chart.data} />}
        {chart.type === 'bar' && <BarChartViz data={chart.data} />}
        {chart.type === 'box' && <BoxPlot data={chart.data} />}
        {chart.type === 'scatter' && <ScatterPlot data={chart.data} xLabel={chart.x_label} yLabel={chart.y_label} />}
        {chart.type === 'heatmap' && <Heatmap data={chart.data} />}
        {chart.type === 'paired_bar' && <PairedBar data={chart.data} />}
        {chart.type === 'correlation_matrix' && <CorrelationMatrix data={chart.data} />}
      </div>
    </div>
  );
}

function Histogram({ data }) {
  const values = data.values;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binCount = Math.min(Math.ceil(Math.sqrt(values.length)), 30);
  const binWidth = (max - min) / binCount || 1;

  const bins = Array(binCount).fill(0);
  values.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
    bins[idx]++;
  });

  const chartData = bins.map((count, i) => ({
    range: `${(min + i * binWidth).toFixed(1)}`,
    count,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} barCategoryGap="1%">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="range" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function BarChartViz({ data }) {
  const chartData = data.labels.map((label, i) => ({
    name: label,
    value: data.values[i],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function BoxPlot({ data }) {
  const groups = data.groups;
  const summaries = groups.map(g => {
    const sorted = [...g.values].sort((a, b) => a - b);
    const n = sorted.length;
    const q1 = sorted[Math.floor(n * 0.25)];
    const median = sorted[Math.floor(n * 0.5)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const lower = Math.max(sorted[0], q1 - 1.5 * iqr);
    const upper = Math.min(sorted[n - 1], q3 + 1.5 * iqr);

    return {
      name: g.group,
      min: lower,
      q1,
      median,
      q3,
      max: upper,
      range: [q1, q3],
    };
  });

  const chartData = summaries.map(s => ({
    name: s.name,
    min: s.min,
    q1: s.q1,
    median: s.median,
    q3: s.q3,
    max: s.max,
    iqr_low: s.q1,
    iqr_high: s.q3,
    whisker_low: s.min,
    whisker_high: s.max,
  }));

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="overflow-x-auto">
        <div className="flex gap-6 justify-center items-end px-4" style={{ minHeight: 200 }}>
          {chartData.map((d, i) => {
            const allValues = chartData.flatMap(cd => [cd.min, cd.max]);
            const globalMin = Math.min(...allValues);
            const globalMax = Math.max(...allValues);
            const range = globalMax - globalMin || 1;
            const height = 180;

            const toY = v => ((v - globalMin) / range) * height;

            return (
              <div key={d.name} className="flex flex-col items-center gap-2 min-w-[60px]">
                <svg width="60" height={height + 20} viewBox={`0 0 60 ${height + 20}`}>
                  {/* Whisker line */}
                  <line x1="30" y1={height - toY(d.max) + 10} x2="30" y2={height - toY(d.min) + 10}
                    stroke={COLORS[i % COLORS.length]} strokeWidth="1.5" />
                  {/* Top whisker cap */}
                  <line x1="20" y1={height - toY(d.max) + 10} x2="40" y2={height - toY(d.max) + 10}
                    stroke={COLORS[i % COLORS.length]} strokeWidth="1.5" />
                  {/* Bottom whisker cap */}
                  <line x1="20" y1={height - toY(d.min) + 10} x2="40" y2={height - toY(d.min) + 10}
                    stroke={COLORS[i % COLORS.length]} strokeWidth="1.5" />
                  {/* IQR box */}
                  <rect x="12" y={height - toY(d.q3) + 10}
                    width="36" height={Math.max(toY(d.q3) - toY(d.q1), 2)}
                    fill={COLORS[i % COLORS.length]} fillOpacity="0.2"
                    stroke={COLORS[i % COLORS.length]} strokeWidth="1.5" rx="3" />
                  {/* Median line */}
                  <line x1="12" y1={height - toY(d.median) + 10} x2="48" y2={height - toY(d.median) + 10}
                    stroke={COLORS[i % COLORS.length]} strokeWidth="2.5" />
                </svg>
                <span className="text-xs text-slate-600 font-medium text-center truncate max-w-[80px]" title={d.name}>
                  {d.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  med: {d.median.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScatterPlot({ data, xLabel, yLabel }) {
  const points = data.x.map((x, i) => ({ x, y: data.y[i] }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" dataKey="x" name={xLabel} tick={{ fontSize: 11 }}
          label={{ value: xLabel, position: 'insideBottom', offset: -10, fontSize: 11 }} />
        <YAxis type="number" dataKey="y" name={yLabel} tick={{ fontSize: 11 }}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(value, name) => [value?.toFixed(2), name]}
        />
        <Scatter data={points} fill="#6366f1" fillOpacity={0.5} r={3} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function Heatmap({ data }) {
  const rows = Object.keys(data);
  const cols = rows.length > 0 ? Object.keys(data[rows[0]]) : [];

  const allValues = rows.flatMap(r => cols.map(c => data[r][c]));
  const maxVal = Math.max(...allValues, 1);

  return (
    <div className="h-full flex items-center justify-center overflow-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-1"></th>
            {cols.map(c => (
              <th key={c} className="p-1 text-slate-500 font-medium truncate max-w-[60px]" title={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r}>
              <td className="p-1 text-slate-500 font-medium truncate max-w-[60px]" title={r}>{r}</td>
              {cols.map(c => {
                const v = data[r][c];
                const intensity = v / maxVal;
                return (
                  <td key={c} className="p-1">
                    <div
                      className="w-10 h-8 rounded flex items-center justify-center text-[10px] font-mono"
                      style={{
                        backgroundColor: `rgba(99, 102, 241, ${0.1 + intensity * 0.8})`,
                        color: intensity > 0.5 ? 'white' : '#334155',
                      }}
                    >
                      {v}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PairedBar({ data }) {
  const chartData = data.labels.map((l, i) => ({ name: l, value: data.values[i] }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function CorrelationMatrix({ data }) {
  const { labels, matrix } = data;

  return (
    <div className="h-full flex items-center justify-center overflow-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-1"></th>
            {labels.map(l => (
              <th key={l} className="p-1 text-slate-500 font-medium truncate max-w-[50px]" title={l}>
                {l.length > 8 ? l.slice(0, 7) + '…' : l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((rowLabel, ri) => (
            <tr key={rowLabel}>
              <td className="p-1 text-slate-500 font-medium truncate max-w-[60px]" title={rowLabel}>
                {rowLabel.length > 8 ? rowLabel.slice(0, 7) + '…' : rowLabel}
              </td>
              {labels.map((_, ci) => {
                const v = matrix[ri][ci];
                const abs = Math.abs(v);
                const isPositive = v >= 0;
                return (
                  <td key={ci} className="p-1">
                    <div
                      className="w-11 h-8 rounded flex items-center justify-center text-[10px] font-mono"
                      style={{
                        backgroundColor: isPositive
                          ? `rgba(34, 197, 94, ${abs * 0.7})`
                          : `rgba(239, 68, 68, ${abs * 0.7})`,
                        color: abs > 0.5 ? 'white' : '#334155',
                      }}
                      title={`${rowLabel} × ${labels[ci]}: ${v}`}
                    >
                      {v != null ? v.toFixed(2) : '—'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
