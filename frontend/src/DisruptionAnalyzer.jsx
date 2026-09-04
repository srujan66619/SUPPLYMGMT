import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, FileText, X, CheckCircle2 } from 'lucide-react';

export default function DisruptionAnalyzer() {
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState(null);
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
    setAnalysis(null);
    setAnalyzing(false);
    setVerification(null);
    setVerifying(false);
    
    try {
      const res = await axios.post('http://localhost:8000/api/disruptions', { notice });
      setSuccess(res.data);
      
      // Phase 3: Transition to analysis
      setAnalyzing(true);
      const analysisRes = await axios.post('http://localhost:8000/api/disruptions/analyze', { notice });
      setAnalysis(analysisRes.data);
      setAnalyzing(false);
      
      if (!analysisRes.data.error) {
        setVerifying(true);
        const verifyRes = await axios.post(`http://localhost:8000/api/disruptions/${res.data.id}/verify`, { extracted_data: analysisRes.data });
        setVerification(verifyRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
      setAnalyzing(false);
      setVerifying(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Disruption Analyzer</h1>
        <p className="text-slate-500 mt-1">Paste the notice exactly as received.</p>
      </div>
      
      {success && !analysis && !analyzing && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-emerald-800">Disruption Submitted Successfully</h3>
            <p className="text-emerald-700 text-sm mt-1 font-mono">Disruption ID: {success.id}</p>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-start gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mt-0.5"></div>
          <div>
            <h3 className="font-semibold text-indigo-800">Understanding Notice...</h3>
            <p className="text-indigo-700 text-sm mt-1">Analyzing context using AI...</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-full">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">AI INTERPRETATION</h3>
              {analysis.error && (
                <p className="text-red-500 text-xs mt-1">Fallback: {analysis.message}</p>
              )}
            </div>
            {!analysis.error && (
              <div className="p-4 flex flex-col gap-3 text-sm">
                <div><span className="text-slate-500">Disruption Type:</span> <span className="font-medium">{analysis.disruption_type || 'null'}</span></div>
                <div><span className="text-slate-500">Supplier:</span> <span className="font-medium">{analysis.supplier_reference || 'null'}</span></div>
                <div><span className="text-slate-500">Product:</span> <span className="font-medium">{analysis.product_reference || 'null'}</span></div>
                <div><span className="text-slate-500">Shipment:</span> <span className="font-medium">{analysis.shipment_reference || 'null'}</span></div>
                <div><span className="text-slate-500">Warehouse:</span> <span className="font-medium">{analysis.warehouse_reference || 'null'}</span></div>
                <div><span className="text-slate-500">Carrier:</span> <span className="font-medium">{analysis.carrier_reference || 'null'}</span></div>
                <div><span className="text-slate-500">Confidence:</span> <span className="font-medium">{analysis.confidence || 'null'}</span></div>
              </div>
            )}
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">DATABASE VERIFICATION</h3>
              {!verifying && verification && (
                <button
                  onClick={async () => {
                    try {
                      await axios.post(`http://localhost:8000/api/disruptions/${success.id}/confirm`, { extracted_data: verification });
                      navigate(`/impact/${success.id}`);
                    } catch (err) {
                      setError(err.response?.data?.detail || 'Failed to confirm impact');
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 text-xs rounded font-medium transition-colors"
                >
                  Calculate Impact &rarr;
                </button>
              )}
            </div>
            <div className="p-4 flex flex-col gap-3 text-sm flex-1">
              {verifying && <div className="text-slate-500">Verifying extracted entities...</div>}
              {verification && Object.entries(verification).map(([entityType, result]) => (
                <div key={entityType} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-slate-800">{entityType}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      result.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                      result.status === 'NEEDS VERIFICATION' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">Query: "{result.query}"</div>
                  {result.status === 'VERIFIED' && result.matched_record && (
                    <div className="text-xs font-medium text-emerald-600 mt-1">
                      Matched: {result.matched_record.name || result.matched_record.id} ({result.confidence})
                    </div>
                  )}
                  {result.status === 'NEEDS VERIFICATION' && (
                    <div className="text-xs text-amber-600 mt-1">
                      Ambiguous match. Candidates: {result.candidates.map(c => c.matched_term).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
