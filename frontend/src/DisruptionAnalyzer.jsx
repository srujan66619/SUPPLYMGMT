import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { SearchCode, Database, AlertCircle, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export default function DisruptionAnalyzer() {
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [verification, setVerification] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    let cleanNotice = notice.trim();
    if (!cleanNotice) return;
    
    // Prevent massively long texts from crashing backend
    if (cleanNotice.length > 3000) {
      cleanNotice = cleanNotice.substring(0, 3000);
    }
    
    setLoading(true);
    setError('');
    setAnalysis(null);
    setVerification(null);
    try {
      const res = await axios.post('http://localhost:8000/api/extract', { text: cleanNotice });
      setAnalysis(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'ANALYSIS FAILED');
    } finally {
      setLoading(false);
    }
  };

  const demoScenarios = [
    {
      label: 'Scenario A: Business Impact',
      text: 'Due to an unexpected production shutdown at Apex Components, production of AX-500 has stopped. Shipment SHP-1042 originally expected on September 8 will now arrive on September 18.'
    },
    {
      label: 'Scenario B: Zero Impact',
      text: 'Production at Zenith Supply has been temporarily suspended.'
    },
    {
      label: 'Scenario C: Ambiguous',
      text: 'AX units will be delayed due to severe weather.'
    },
    {
      label: 'Scenario D: Ripple Effect',
      text: 'Apex Components Ltd is experiencing delays. AX-500 shipments including SHP-1042 are delayed by 10 days.'
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <SearchCode className="h-6 w-6 text-indigo-600" />
            Disruption Analyzer
          </h1>
          <p className="text-sm text-slate-500 mt-1">Parse unstructured notices and map them to operational data.</p>
        </div>
        
        <div className="flex gap-2">
          {demoScenarios.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setNotice(s.text)}
              className="text-[10px] uppercase tracking-wider font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 px-3 py-1.5 rounded-md transition-colors shadow-sm"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <textarea
          value={notice}
          onChange={(e) => setNotice(e.target.value)}
          placeholder="Paste supplier notice, email, or alert text here..."
          className="w-full h-40 border border-slate-300 rounded-lg p-4 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm leading-relaxed"
        />
        <div className="mt-4 flex justify-between items-center">
          {error && (
            <div className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error} - PLEASE RETRY
            </div>
          )}
          {!error && <div />}
          <button
            onClick={handleAnalyze}
            disabled={loading || !notice.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            {loading ? 'ANALYZING...' : 'ANALYZE NOTICE'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      {analysis && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <Database className="h-4 w-4 text-indigo-600" />
              Entity Extraction & Resolution
            </h2>
            {analysis._fallback_used && (
              <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">
                <AlertCircle className="h-3 w-3" />
                AI unavailable. Using deterministic extraction.
              </div>
            )}
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side: AI Extraction */}
            <div>
              <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Raw Extracted Parameters</h3>
              <div className="space-y-3">
                <DataRow label="Disruption Type" value={analysis.disruption_type} />
                <DataRow label="Supplier Ref" value={analysis.supplier_reference} />
                <DataRow label="Product Ref" value={analysis.product_reference} />
                <DataRow label="Shipment Ref" value={analysis.shipment_reference} />
                <DataRow label="Warehouse Ref" value={analysis.warehouse_reference} />
                <DataRow label="Carrier Ref" value={analysis.carrier_reference} />
                <DataRow label="Original ETA" value={analysis.original_eta} />
                <DataRow label="Revised ETA" value={analysis.revised_eta} />
              </div>
            </div>

            {/* Right side: Database Resolution */}
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Database Verification</h3>
                {!verifying && !verification && (
                  <button
                    onClick={async () => {
                      setVerifying(true);
                      try {
                        const res = await axios.post('http://localhost:8000/api/resolve', analysis);
                        setVerification(res.data);
                      } catch (err) {
                        console.error(err);
                        setVerification({ error: "ANALYSIS FAILED" });
                      } finally {
                        setVerifying(false);
                      }
                    }}
                    className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1 rounded font-semibold border border-indigo-200 transition-colors"
                  >
                    RUN RESOLVER
                  </button>
                )}
                {verifying && <span className="text-xs text-indigo-600 font-semibold animate-pulse">VERIFYING...</span>}
              </div>

              {verification ? (
                <div className="space-y-4">
                  <VerificationRow label="Supplier" entity={verification.supplier} />
                  <VerificationRow label="Product" entity={verification.product} />
                  <VerificationRow label="Shipment" entity={verification.shipment} />
                  <VerificationRow label="Warehouse" entity={verification.warehouse} />
                  
                  {verification.disruption_id && (
                    <div className="mt-8">
                      <button
                        onClick={() => navigate(`/impact/${verification.disruption_id}`)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        VIEW IMPACT TRACE
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  Run resolver to map entities to operational DB.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DataRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-medium text-slate-800">{value}</span>
    </div>
  );
};

const VerificationRow = ({ label, entity }) => {
  if (!entity) return null;
  const isResolved = entity.resolved;
  
  // Custom badges for PS08 states
  let badgeText = "NOT FOUND";
  let badgeStyle = "text-red-700 bg-red-100/50";
  let containerStyle = "bg-red-50 border-red-100";
  let icon = <XCircle className="h-4 w-4 text-red-500" />;
  
  if (isResolved) {
    badgeText = "VERIFIED";
    badgeStyle = "text-emerald-700 bg-emerald-100/50";
    containerStyle = "bg-emerald-50 border-emerald-100";
    icon = <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  } else if (entity.error === "AMBIGUOUS MATCH") {
    badgeText = "NEEDS VERIFICATION";
    badgeStyle = "text-amber-700 bg-amber-100/50";
    containerStyle = "bg-amber-50 border-amber-100";
    icon = <AlertCircle className="h-4 w-4 text-amber-500" />;
  }
  
  return (
    <div className={`p-3 rounded-md border ${containerStyle}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm text-slate-800">{label}</span>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${badgeStyle}`}>
          {badgeText}
        </span>
      </div>
      {isResolved && (
        <div className="mt-2 text-xs text-slate-600 space-y-1 pl-6">
          <div><span className="text-slate-400">ID:</span> <span className="font-mono">{entity.db_id}</span></div>
          {entity.name && <div><span className="text-slate-400">Name:</span> {entity.name}</div>}
        </div>
      )}
      {!isResolved && entity.error === "AMBIGUOUS MATCH" && (
        <div className="mt-2 text-xs text-amber-800 space-y-1 pl-6 font-medium">
          AMBIGUOUS MATCH
        </div>
      )}
    </div>
  );
};
