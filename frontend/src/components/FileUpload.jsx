import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';

export default function FileUpload({ onResults, onLoading }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExt) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setError(null);
    setLoading(true);
    setFileName(file.name);
    onLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      let res;
      try {
        res = await fetch('/api/upload', { method: 'POST', body: formData });
      } catch (fetchErr) {
        throw new Error('Cannot connect to the backend server. Make sure the backend is running on port 8000 (see README for instructions).');
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('The backend returned an invalid response. Check the backend terminal for errors.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onResults(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
      onResults(null);
    } finally {
      setLoading(false);
      onLoading(false);
    }
  }, [onResults, onLoading]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files[0];
    handleFile(file);
  }, [handleFile]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 ease-out
          ${isDragging
            ? 'border-indigo-500 bg-indigo-50 scale-[1.02] shadow-lg shadow-indigo-100'
            : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-md'
          }
        `}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleInputChange}
          className="hidden"
        />

        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <div>
              <p className="text-lg font-semibold text-slate-700">Analyzing {fileName}...</p>
              <p className="text-sm text-slate-500 mt-1">Running non-parametric tests and generating visualizations</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className={`
              p-4 rounded-2xl transition-colors duration-300
              ${isDragging ? 'bg-indigo-100' : 'bg-slate-100'}
            `}>
              {isDragging ? (
                <FileSpreadsheet className="w-12 h-12 text-indigo-500" />
              ) : (
                <Upload className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-700">
                {isDragging ? 'Drop your file here' : 'Drag & drop your data file'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Supports CSV and Excel files (.csv, .xlsx, .xls)
              </p>
            </div>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-lg">
              <Upload className="w-4 h-4" />
              Or click to browse
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
