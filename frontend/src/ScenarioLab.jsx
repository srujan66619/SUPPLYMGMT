import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FlaskConical, ArrowRight, ShieldCheck, AlertTriangle, Zap, PackageOpen, Shuffle, MessageCircle, Scale } from 'lucide-react';

export default function ScenarioLab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Assuming disruption ID 1 for MVP
  const id = 1;

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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-indigo-600" />
            Scenario Lab
          </h1>
          <p className="text-sm text-slate-500 mt-1">AI-driven simulation of recovery options and secondary ripple effects.</p>
        </div>
        <button 
          onClick={() => navigate('/decisions')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          OPEN DECISION CENTER
          <Scale className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {data.scenarios.map((scenario) => {
          const isRecommended = scenario.name === data.recommendation;
          return (
            <ScenarioCard 
              key={scenario.name} 
              scenario={scenario} 
              isRecommended={isRecommended} 
            />
          );
        })}
      </div>
      
      {/* Ripple Effect Warning */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5" />
          RIPPLE EFFECT DETECTED
        </h3>
        <p className="text-sm text-amber-900">
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
  
  const Icon = IconMap[scenario.name] || Zap;

  return (
    <div className={`relative bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col ${
      isRecommended ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200'
    }`}>
      {isRecommended && (
        <div className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 text-center">
          AI Recommended
        </div>
      )}
      
      <div className={`p-6 border-b ${isRecommended ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isRecommended ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-slate-800">{scenario.name}</h3>
        </div>
        <div className="text-2xl font-black text-slate-900">
          Score: {Math.round(scenario.score * 100)}/100
        </div>
      </div>
      
      <div className="p-6 flex-1 text-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-slate-500">Cost</span>
          <span className="font-bold text-slate-800">₹{scenario.cost.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-slate-500">Orders Protected</span>
          <span className="font-bold text-emerald-600">{scenario.orders_protected}</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-slate-500">Projected Delay</span>
          <span className="font-bold text-amber-600">{scenario.projected_delay} days</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-slate-500">Customer Impact</span>
          <span className={`font-bold capitalize ${
            scenario.customer_impact === 'high' ? 'text-red-600' :
            scenario.customer_impact === 'medium' ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {scenario.customer_impact}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-slate-500">Secondary Risk</span>
          <span className={`font-bold capitalize ${
            scenario.secondary_risk === 'high' ? 'text-red-600' :
            scenario.secondary_risk === 'medium' ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {scenario.secondary_risk}
          </span>
        </div>
      </div>
    </div>
  );
}
