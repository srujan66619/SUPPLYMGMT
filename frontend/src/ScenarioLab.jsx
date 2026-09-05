import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FlaskConical, ArrowRight, ShieldCheck, AlertTriangle, Zap, PackageOpen, Shuffle, MessageCircle, Scale } from 'lucide-react';

export default function ScenarioLab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { id: paramId } = useParams();
  const id = paramId || 1;

  useEffect(() => {
    axios.get(`/api/disruptions/${id}/recommendation`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.detail || err.message || 'Failed to load scenarios');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8 text-slate-500">Running scenario simulations...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!data) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-accent-indigo-light" />
            Scenario Lab
          </h1>
          <p className="text-sm text-slate-muted mt-1">AI-driven simulation of recovery options and secondary ripple effects.</p>
        </div>
        <button 
          onClick={() => navigate(`/decisions/${id}`)}
          className="bg-accent-indigo hover:bg-accent-indigo-light text-foreground px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          OPEN DECISION CENTER
          <Scale className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {(Array.isArray(data.scenarios) ? data.scenarios : (
          [data.metrics, ...(Array.isArray(data.alternatives) ? data.alternatives : [])].filter(Boolean)
        )).map((scenario) => {
          const recName = data.recommendation || data.recommended_action?.option || data.recommended_action;
          const isRecommended = scenario?.name === recName || scenario?.option === recName;
          return (
            <ScenarioCard 
              key={scenario.name || scenario.option} 
              scenario={scenario} 
              isRecommended={isRecommended} 
            />
          );
        })}
      </div>
      
      {/* Ripple Effect Warning */}
      <div className="mt-8 bg-accent-amber/10 border border-accent-amber/30 rounded-xl p-6">
        <h3 className="text-accent-amber font-bold flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5" />
          RIPPLE EFFECT DETECTED
        </h3>
        <p className="text-sm text-accent-amber/80">
          Reallocating stock from lower-priority orders will cause secondary shortages for 2 previously secure orders. The "Reallocate" scenario score has been penalized accordingly.
        </p>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, isRecommended }) {
  const IconMap = {
    'EXPEDITE': Zap,
    'PART-SHIP': PackageOpen,
    'REALLOCATE': Shuffle,
    'INFORM CUSTOMER': MessageCircle
  };
  
  const Icon = IconMap[scenario?.name] || IconMap[scenario?.option] || Zap;

  return (
    <div className={`relative bg-navy-surface rounded-xl shadow-lg border overflow-hidden flex flex-col ${
      isRecommended ? 'border-accent-indigo ring-1 ring-accent-indigo' : 'border-navy-elevated'
    }`}>
      {isRecommended && (
        <div className="bg-accent-indigo text-foreground text-[10px] font-bold uppercase tracking-widest py-1 px-3 text-center">
          AI Recommended
        </div>
      )}
      
      <div className={`p-6 border-b ${isRecommended ? 'bg-accent-indigo/10 border-accent-indigo/20' : 'bg-navy-base border-navy-elevated'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isRecommended ? 'bg-accent-indigo/20 text-accent-indigo-light' : 'bg-navy-elevated text-slate-muted'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-foreground">{scenario?.name || scenario?.option || "Unknown Scenario"}</h3>
        </div>
        <div className="text-2xl font-black text-foreground">
          Score: {Math.round(((scenario?.score !== undefined ? scenario.score : (scenario?.tradeoff_score / 100)) || 0) * 100)}/100
        </div>
      </div>
      
      <div className="p-6 flex-1 text-sm space-y-4">
        <div className="flex justify-between items-center border-b border-navy-elevated pb-2">
          <span className="text-slate-muted">Cost</span>
          <span className="font-bold text-foreground">₹{(scenario?.cost || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center border-b border-navy-elevated pb-2">
          <span className="text-slate-muted">Orders Protected</span>
          <span className="font-bold text-accent-emerald">{scenario?.orders_protected || 0}</span>
        </div>
        <div className="flex justify-between items-center border-b border-navy-elevated pb-2">
          <span className="text-slate-muted">Projected Delay</span>
          <span className="font-bold text-accent-amber">{scenario?.projected_delay || 0} days</span>
        </div>
        <div className="flex justify-between items-center border-b border-navy-elevated pb-2">
          <span className="text-slate-muted">Customer Impact</span>
          <span className={`font-bold capitalize ${
            scenario?.customer_impact === 'high' ? 'text-accent-crimson' :
            scenario?.customer_impact === 'medium' ? 'text-accent-amber' : 'text-accent-emerald'
          }`}>
            {scenario?.customer_impact || "None"}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-navy-elevated pb-2">
          <span className="text-slate-muted">Secondary Risk</span>
          <span className={`font-bold capitalize ${
            scenario?.secondary_risk === 'high' ? 'text-accent-crimson' :
            scenario?.secondary_risk === 'medium' ? 'text-accent-amber' : 'text-accent-emerald'
          }`}>
            {scenario?.secondary_risk || "None"}
          </span>
        </div>
      </div>
    </div>
  );
}
