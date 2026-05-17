import { useState } from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Summary from './components/Summary';
import Charts from './components/Charts';
import TestResults from './components/TestResults';
import NormalityTable from './components/NormalityTable';
import DescriptiveStats from './components/DescriptiveStats';

export default function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setResults(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <FlaskConical className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">UX Research Analyzer</h1>
              <p className="text-xs text-slate-500">Non-parametric statistical analysis</p>
            </div>
          </div>
          {results && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              New Analysis
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {!results ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="text-center max-w-lg">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">
                Analyze Your UX Data
              </h2>
              <p className="text-slate-500 leading-relaxed">
                Drop in your CSV or Excel file and get instant non-parametric statistical
                analysis with visualizations and actionable insights — no configuration needed.
              </p>
            </div>
            <FileUpload onResults={setResults} onLoading={setLoading} />
            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-4">
                <FeatureCard
                  title="Auto-Detection"
                  desc="Automatically identifies variable types and selects appropriate tests"
                />
                <FeatureCard
                  title="Non-Parametric Tests"
                  desc="Mann-Whitney U, Kruskal-Wallis, Chi-squared, Spearman, Wilcoxon"
                />
                <FeatureCard
                  title="AI-Powered Insights"
                  desc="Claude translates statistics into actionable findings for PMs and designers"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <Summary summary={results.summary} datasetInfo={results.dataset_info} aiInsights={results.ai_insights} />
            <Charts charts={results.charts} />
            <TestResults results={results.test_results} />
            <NormalityTable normality={results.normality_tests} />
            <DescriptiveStats descriptives={results.descriptives} />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-400">
          UX Research Non-Parametric Analysis Tool · All tests use α = 0.05
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}
