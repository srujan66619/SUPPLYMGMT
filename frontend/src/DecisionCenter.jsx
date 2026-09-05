import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Scale, CheckCircle2, AlertTriangle, Check, X, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export default function DecisionCenter() {
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [operatorNotes, setOperatorNotes] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState('');
  
  const { id } = useParams();
  const disruptionId = id || '1';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recRes, ordRes, decRes] = await Promise.all([
          axios.get(`/api/disruptions/${disruptionId}/recommendation`),
          axios.get(`/api/disruptions/${disruptionId}/affected-orders`),
          axios.get(`/api/disruptions/${disruptionId}/decisions`)
        ]);
        setData(recRes.data);
        setOrders(ordRes.data);
        setDecisions(decRes.data);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load data');
      }
    };
    fetchData();
  }, [disruptionId]);

  const handleDecision = async (orderId, action, recommended_action) => {
    setSubmitting(orderId);
    try {
      const payload = {
        disruption_id: parseInt(disruptionId),
        order_id: orderId,
        recommended_action: recommended_action,
        selected_action: action,
        operator_notes: operatorNotes[orderId] || ""
      };
      await axios.post(`/api/decisions`, payload);
      const decRes = await axios.get(`/api/disruptions/${disruptionId}/decisions`);
      setDecisions(decRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(null);
    }
  };

  const getDecisionForOrder = (orderId) => {
    return decisions.find(d => d.order_id === orderId);
  };

  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!data || !orders.length) return <div className="p-8 text-slate-500">Loading Decision Center...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto relative z-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Scale className="h-6 w-6 text-accent-indigo-light" />
          Decision Center
        </h1>
        <p className="text-sm text-slate-muted mt-1">Review AI recommendations and explicitly approve or modify operational actions.</p>
      </div>

      <div className="bg-indigo-900 text-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-indigo-800 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-indigo-400" />
          <h2 className="text-lg font-semibold">Global AI Recommendation: {data.recommendation || data.recommended_action?.option || data.recommended_action}</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-indigo-950/50">
          <div>
            <h3 className="text-indigo-300 text-xs uppercase tracking-wider font-bold mb-3 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Why this option?
            </h3>
            <p className="text-sm text-indigo-100 leading-relaxed bg-indigo-900/50 p-4 rounded-lg">
              {data.explanation?.why || (data.why_this_option && data.why_this_option.join(" "))}
            </p>
          </div>
          <div>
            <h3 className="text-indigo-300 text-xs uppercase tracking-wider font-bold mb-3 flex items-center gap-1">
              <HelpCircle className="h-4 w-4" /> Why not alternatives?
            </h3>
            <p className="text-sm text-indigo-100 leading-relaxed bg-indigo-900/50 p-4 rounded-lg">
              {data.explanation?.why_not || (data.why_not_alternatives && data.why_not_alternatives.join(" "))}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-navy-surface border border-navy-elevated rounded-xl shadow-lg overflow-hidden">
        <div className="bg-navy-base border-b border-navy-elevated p-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-accent-amber" />
            Human Decision Boundary — Affected Orders
          </h3>
          <p className="text-sm text-slate-muted mt-2">
            Recommendation only — no automatic execution. You must explicitly accept or modify the action for each affected order. Operational records will NOT be automatically modified.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {orders.map(order => {
            const decision = getDecisionForOrder(order.order_id);
            
            if (decision) {
              return (
                <div key={order.order_id} className="bg-navy-surface border border-accent-emerald/30 rounded-lg shadow-sm overflow-hidden animate-in fade-in duration-500">
                  <div className="bg-accent-emerald/10 px-4 py-3 border-b border-accent-emerald/20 flex justify-between items-center">
                    <span className="font-bold text-accent-emerald flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent-emerald" />
                      Decision Audit Log: {order.order_id}
                    </span>
                    <span className="text-xs font-mono text-accent-emerald border border-accent-emerald/30 bg-accent-emerald/10 px-2 py-1 rounded">
                      {new Date(decision.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-navy-surface">
                    <div>
                      <span className="block text-slate-muted text-xs uppercase mb-1">Customer</span>
                      <span className="font-medium text-foreground">{order.customer || order.customer_name}</span>
                    </div>
                    <div>
                      <span className="block text-slate-muted text-xs uppercase mb-1">AI Recommendation</span>
                      <span className="font-medium text-foreground">{decision.recommended_action}</span>
                    </div>
                    <div>
                      <span className="block text-slate-muted text-xs uppercase mb-1">Operator Action</span>
                      <span className={`font-bold ${
                        decision.selected_action === decision.recommended_action ? 'text-accent-emerald' : 
                        decision.selected_action === 'REJECT' ? 'text-accent-crimson' : 'text-accent-amber'
                      }`}>
                        {decision.selected_action}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-muted text-xs uppercase mb-1">Operator Notes</span>
                      <span className="text-slate-muted/80 italic">"{decision.operator_notes || "No notes provided."}"</span>
                    </div>
                  </div>
                </div>
              );
            }

              const recName = data.recommendation || data.recommended_action?.option || data.recommended_action;
              return (
              <div key={order.order_id} className="bg-navy-surface border border-navy-elevated rounded-lg shadow-sm overflow-hidden">
                <div className="bg-navy-base px-4 py-3 border-b border-navy-elevated flex justify-between items-center">
                  <span className="font-bold text-foreground">{order.order_id}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                    order.priority === 1 ? 'bg-accent-crimson/10 text-accent-crimson border-accent-crimson/20' : 'bg-accent-amber/10 text-accent-amber border-accent-amber/20'
                  }`}>
                    Priority {order.priority}
                  </span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                    <div>
                      <span className="block text-slate-muted text-xs uppercase tracking-wider mb-1">Customer</span>
                      <span className="font-medium text-foreground">{order.customer || order.customer_name}</span>
                    </div>
                    <div>
                      <span className="block text-slate-muted text-xs uppercase tracking-wider mb-1">Shortage</span>
                      <span className="font-bold text-accent-crimson">{order.shortage} units</span>
                    </div>
                    <div>
                      <span className="block text-slate-muted text-xs uppercase tracking-wider mb-1">Delay</span>
                      <span className="font-bold text-accent-amber">{order.delay_days} days</span>
                    </div>
                    <div>
                      <span className="block text-slate-muted text-xs uppercase tracking-wider mb-1">Projected Date</span>
                      <span className="font-medium text-foreground">{order.projected_fulfillment_date}</span>
                    </div>
                    <div>
                      <span className="block text-slate-muted text-xs uppercase tracking-wider mb-1">AI Recommendation</span>
                      <span className="font-bold text-accent-indigo-light">{recName}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-navy-elevated pt-4 mt-2 bg-navy-base/50 -mx-4 -mb-4 p-4">
                    <label className="block text-xs font-semibold text-slate-muted uppercase mb-2">Operator Notes</label>
                    <textarea 
                      value={operatorNotes[order.order_id] || ""}
                      onChange={(e) => setOperatorNotes({...operatorNotes, [order.order_id]: e.target.value})}
                      className="w-full bg-navy-surface border border-navy-elevated rounded-md p-2.5 text-sm focus:ring-2 focus:ring-accent-indigo focus:border-accent-indigo mb-4 text-foreground shadow-sm placeholder:text-slate-muted/50"
                      placeholder="Optional justification for audit log..."
                      rows="2"
                    />
                    
                    <div className="flex gap-3">
                      <button 
                        disabled={submitting === order.order_id}
                        onClick={() => handleDecision(order.order_id, recName, recName)}
                        className="flex-1 bg-accent-emerald/10 hover:bg-accent-emerald/20 border border-accent-emerald/30 text-accent-emerald py-2 rounded-lg font-medium text-sm transition-colors flex justify-center items-center gap-2 shadow-sm"
                      >
                        <Check className="h-4 w-4" /> ACCEPT
                      </button>
                      
                      <select 
                        disabled={submitting === order.order_id}
                        className="flex-1 bg-accent-amber/10 border border-accent-amber/30 hover:bg-accent-amber/20 text-accent-amber rounded-lg px-3 font-medium text-sm focus:ring-2 focus:ring-accent-amber shadow-sm cursor-pointer outline-none transition-colors"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleDecision(order.order_id, e.target.value, recName);
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>MODIFY ACTION...</option>
                        <option value="EXPEDITE">EXPEDITE</option>
                        <option value="PART-SHIP">PART-SHIP</option>
                        <option value="REALLOCATE">REALLOCATE</option>
                        <option value="INFORM CUSTOMER">INFORM CUSTOMER</option>
                      </select>
                      
                      <button 
                        disabled={submitting === order.order_id}
                        onClick={() => handleDecision(order.order_id, "REJECT", recName)}
                        className="flex-1 bg-accent-crimson/10 hover:bg-accent-crimson/20 border border-accent-crimson/30 text-accent-crimson py-2 rounded-lg font-medium text-sm transition-colors flex justify-center items-center gap-2 shadow-sm"
                      >
                        <X className="h-4 w-4" /> REJECT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
