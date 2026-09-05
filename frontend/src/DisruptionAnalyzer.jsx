import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { SearchCode, Database, AlertCircle, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export default function DisruptionAnalyzer() {
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [disruptionId, setDisruptionId] = useState(null);
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
      const createRes = await axios.post('/api/disruptions', { notice: cleanNotice });
      setDisruptionId(createRes.data.id);
      
      const res = await axios.post('/api/disruptions/analyze', { notice: cleanNotice });
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
    <div className="p-8 max-w-5xl mx-auto relative z-10">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SearchCode className="h-6 w-6 text-accent-indigo-light" />
            Disruption Analyzer
          </h1>
          <p className="text-sm text-slate-muted mt-1">Parse unstructured notices and map them to operational data.</p>
        </div>
        
        <div className="flex gap-2">
          {demoScenarios.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setNotice(s.text)}
              className="text-[10px] uppercase tracking-wider font-bold bg-navy-surface border border-navy-elevated text-slate-muted hover:bg-navy-elevated hover:text-accent-indigo-light px-3 py-1.5 rounded-md transition-colors shadow-sm"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-navy-surface rounded-xl shadow-lg border border-navy-elevated p-6 mb-8">
        <textarea
          value={notice}
          onChange={(e) => setNotice(e.target.value)}
          placeholder="Paste supplier notice, email, or alert text here..."
          className="w-full h-40 bg-navy-base border border-navy-elevated rounded-lg p-4 text-foreground focus:ring-2 focus:ring-accent-indigo focus:border-accent-indigo font-mono text-sm leading-relaxed"
        />
        <div className="mt-4 flex justify-between items-center">
          {error && (
            <div className="text-accent-crimson bg-accent-crimson/10 px-3 py-1.5 rounded-lg border border-accent-crimson/20 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error} - PLEASE RETRY
            </div>
          )}
          {!error && <div />}
          <button
            onClick={handleAnalyze}
            disabled={loading || !notice.trim()}
            className="bg-accent-indigo hover:bg-accent-indigo-light disabled:bg-accent-indigo/50 text-foreground font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            {loading ? 'ANALYZING...' : 'ANALYZE NOTICE'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      {analysis && (
        <div className="bg-navy-surface rounded-xl shadow-lg border border-navy-elevated overflow-hidden mb-8">
          <div className="bg-navy-base border-b border-navy-elevated px-6 py-4 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider">
              <Database className="h-4 w-4 text-accent-indigo-light" />
              Entity Extraction & Resolution
            </h2>
            {analysis._fallback_used && (
              <div className="flex items-center gap-2 bg-accent-amber/10 text-accent-amber border border-accent-amber/20 px-3 py-1 rounded-full text-xs font-bold">
                <AlertCircle className="h-3 w-3" />
                AI unavailable. Using deterministic extraction.
              </div>
            )}
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side: AI Extraction */}
            <div>
              <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider border-b border-navy-elevated pb-2 mb-4">Raw Extracted Parameters</h3>
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
              <div className="flex justify-between items-center border-b border-navy-elevated pb-2 mb-4">
                <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">Database Verification</h3>
                {!verifying && !verification && (
                  <button
                    onClick={async () => {
                      setVerifying(true);
                      try {
                        const verifyRes = await axios.post(`/api/disruptions/${disruptionId}/verify`, { extracted_data: analysis });
                        await axios.post(`/api/disruptions/${disruptionId}/confirm`, { extracted_data: { ...analysis, ...verifyRes.data } });
                        setVerification({ ...verifyRes.data, disruption_id: disruptionId });
                      } catch (err) {
                        console.error(err);
                        setVerification({ error: "ANALYSIS FAILED" });
                      } finally {
                        setVerifying(false);
                      }
                    }}
                    className="text-xs bg-accent-indigo/10 text-accent-indigo-light hover:bg-accent-indigo/20 px-3 py-1 rounded font-semibold border border-accent-indigo/20 transition-colors"
                  >
                    RUN RESOLVER
                  </button>
                )}
                {verifying && <span className="text-xs text-accent-indigo-light font-semibold animate-pulse">VERIFYING...</span>}
              </div>

              {verification ? (
                <div className="space-y-4">
                  <VerificationRow label="Supplier" entity={verification.Supplier} />
                  <VerificationRow label="Product" entity={verification.Product} />
                  <VerificationRow label="Shipment" entity={verification.Shipment} />
                  <VerificationRow label="Warehouse" entity={verification.Warehouse} />
                  
                  {verification.disruption_id && (
                    <div className="mt-8">
                      <button
                        onClick={() => navigate(`/impact/${verification.disruption_id}`)}
                        className="w-full bg-accent-indigo hover:bg-accent-indigo-light text-foreground font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        VIEW IMPACT TRACE
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-muted text-sm bg-navy-base rounded-lg border border-dashed border-navy-elevated">
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
    <div className="flex justify-between text-sm py-1 border-b border-navy-elevated last:border-0">
      <span className="text-slate-muted">{label}</span>
      <span className="font-mono font-medium text-foreground">{value}</span>
    </div>
  );
};

const VerificationRow = ({ label, entity }) => {
  if (!entity) return null;
  const isResolved = entity.status === 'VERIFIED';
  
  // Custom badges for PS08 states
  let badgeText = "NOT FOUND";
  let badgeStyle = "text-accent-crimson bg-accent-crimson/10 border-accent-crimson/20";
  let containerStyle = "bg-navy-base border-accent-crimson/30";
  let icon = <XCircle className="h-4 w-4 text-accent-crimson" />;
  
  if (isResolved) {
    badgeText = "VERIFIED";
    badgeStyle = "text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20";
    containerStyle = "bg-navy-base border-accent-emerald/30";
    icon = <CheckCircle2 className="h-4 w-4 text-accent-emerald" />;
  } else if (entity.status === "NEEDS VERIFICATION") {
    badgeText = "NEEDS VERIFICATION";
    badgeStyle = "text-accent-amber bg-accent-amber/10 border-accent-amber/20";
    containerStyle = "bg-navy-base border-accent-amber/30";
    icon = <AlertCircle className="h-4 w-4 text-accent-amber" />;
  }
  
  return (
    <div className={`p-3 rounded-md border ${containerStyle}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm text-foreground">{label}</span>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeStyle}`}>
          {badgeText}
        </span>
      </div>
      {isResolved && entity.matched_record && (
        <div className="mt-2 text-xs text-slate-muted space-y-1 pl-6">
          <div><span className="text-slate-muted/70">ID:</span> <span className="font-mono text-foreground">{entity.matched_record.id}</span></div>
          {entity.matched_record.name && <div><span className="text-slate-muted/70">Name:</span> <span className="text-foreground">{entity.matched_record.name}</span></div>}
        </div>
      )}
      {!isResolved && entity.status === "NEEDS VERIFICATION" && (
        <div className="mt-2 text-xs text-accent-amber space-y-1 pl-6 font-medium">
          AMBIGUOUS MATCH
        </div>
      )}
    </div>
  );
};
