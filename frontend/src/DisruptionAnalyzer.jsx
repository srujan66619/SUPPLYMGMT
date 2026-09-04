import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, FileText, X, CheckCircle2 } from 'lucide-react';

export default function DisruptionAnalyzer() {
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const exampleNotice = `Due to an unexpected production shutdown at our Hyderabad facility,
production of AX-500 units has stopped. Shipment SHP-1042 originally
expected on September 8 will now be delayed until September 18.

Regards,
Apex Components`;

  const handleAnalyze = async () => {
    if (notice.trim().length < 10) {
      setError('Notice is too short. Please provide more detail.');
      return;
    }
    if (notice.length > 5000) {
      setError('Notice is too long. Maximum 5000 characters allowed.');
      return;
    }
    
    setError('');
    setLoading(true);
    setSuccess(null);
    
    try {
      const res = await axios.post('http://localhost:8000/api/disruptions', { notice });
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Disruption Analyzer</h1>
        <p className="text-slate-500 mt-1">Paste the notice exactly as received.</p>
      </div>
      
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-emerald-800">Disruption Submitted Successfully</h3>
            <p className="text-emerald-700 text-sm mt-1 font-mono">Disruption ID: {success.id}</p>
            <p className="text-emerald-600 text-sm mt-2">Transitioning to analysis engine...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
            <FileText className="h-4 w-4" /> Raw Notice Input
          </div>
          <button 
            onClick={() => { setNotice(exampleNotice); setError(''); }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
          >
            Load Example
          </button>
        </div>
        <textarea
          value={notice}
          onChange={(e) => setNotice(e.target.value)}
          placeholder="Paste email, message, or document text here..."
          className="w-full h-64 p-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-0 resize-none font-mono text-sm"
          disabled={loading || success}
        />
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 flex justify-between items-center">
          <div className={`text-xs ${notice.length > 5000 ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
            {notice.length} / 5000 characters
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setNotice(''); setError(''); setSuccess(null); }}
              disabled={loading || success || notice.length === 0}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <X className="h-4 w-4" /> Clear
            </button>
            <button
              onClick={handleAnalyze}
              disabled={loading || success || notice.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Analyze Disruption'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
