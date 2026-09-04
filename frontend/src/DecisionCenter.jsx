import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Scale, CheckCircle2, AlertTriangle, Check, X, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export default function DecisionCenter() {
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [operatorNotes, setOperatorNotes] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState('');
  
  // Assuming ID 1 for MVP
  const disruptionId = '1';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recRes, ordRes, decRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/disruptions/${disruptionId}/recommendation`),
          axios.get(`http://localhost:8000/api/disruptions/${disruptionId}/affected-orders`),
          axios.get(`http://localhost:8000/api/disruptions/${disruptionId}/decisions`)
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
      await axios.post(`http://localhost:8000/api/decisions`, payload);
      const decRes = await axios.get(`http://localhost:8000/api/disruptions/${disruptionId}/decisions`);
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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Scale className="h-6 w-6 text-indigo-600" />
          Decision Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">Review AI recommendations and explicitly approve or modify operational actions.</p>
      </div>

      <div className="bg-indigo-900 text-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-indigo-800 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-indigo-400" />
          <h2 className="text-lg font-semibold">Global AI Recommendation: {data.recommendation}</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-indigo-950/50">
          <div>
            <h3 className="text-indigo-300 text-xs uppercase tracking-wider font-bold mb-3 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Why this option?
            </h3>
            <p className="text-sm text-indigo-100 leading-relaxed bg-indigo-900/50 p-4 rounded-lg">
              {data.explanation.why}
            </p>
          </div>
          <div>
            <h3 className="text-indigo-300 text-xs uppercase tracking-wider font-bold mb-3 flex items-center gap-1">
              <HelpCircle className="h-4 w-4" /> Why not alternatives?
            </h3>
            <p className="text-sm text-indigo-100 leading-relaxed bg-indigo-900/50 p-4 rounded-lg">
              {data.explanation.why_not}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Human Decision Boundary — Affected Orders
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Recommendation only — no automatic execution. You must explicitly accept or modify the action for each affected order. Operational records will NOT be automatically modified.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {orders.map(order => {
            const decision = getDecisionForOrder(order.order_id);
            
            if (decision) {
              return (
                <div key={order.order_id} className="bg-white border border-emerald-200 rounded-lg shadow-sm overflow-hidden animate-in fade-in duration-500">
                  <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex justify-between items-center">
                    <span className="font-bold text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Decision Audit Log: {order.order_id}
                    </span>
                    <span className="text-xs font-mono text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                      {new Date(decision.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white">
                    <div>
                      <span className="block text-slate-400 text-xs uppercase mb-1">Customer</span>
                      <span className="font-medium text-slate-800">{order.customer}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase mb-1">AI Recommendation</span>
                      <span className="font-medium text-slate-800">{decision.recommended_action}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase mb-1">Operator Action</span>
                      <span className={`font-bold ${
                        decision.selected_action === decision.recommended_action ? 'text-emerald-600' : 
                        decision.selected_action === 'REJECT' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {decision.selected_action}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase mb-1">Operator Notes</span>
                      <span className="text-slate-600 italic">"{decision.operator_notes || "No notes provided."}"</span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={order.order_id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-800">{order.order_id}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    order.priority === 1 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    Priority {order.priority}
                  </span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                    <div>
                      <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Customer</span>
                      <span className="font-medium text-slate-800">{order.customer}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Shortage</span>
                      <span className="font-bold text-red-600">{order.shortage} units</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Delay</span>
                      <span className="font-bold text-amber-600">{order.delay_days} days</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Projected Date</span>
                      <span className="font-medium text-slate-800">{order.projected_fulfillment_date}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">AI Recommendation</span>
                      <span className="font-bold text-indigo-600">{data.recommendation}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-4 mt-2 bg-slate-50/50 -mx-4 -mb-4 p-4">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Operator Notes</label>
                    <textarea 
                      value={operatorNotes[order.order_id] || ""}
                      onChange={(e) => setOperatorNotes({...operatorNotes, [order.order_id]: e.target.value})}
                      className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4 bg-white shadow-sm"
                      placeholder="Optional justification for audit log..."
                      rows="2"
                    />
                    
                    <div className="flex gap-3">
                      <button 
                        disabled={submitting === order.order_id}
                        onClick={() => handleDecision(order.order_id, data.recommendation, data.recommendation)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium text-sm transition-colors flex justify-center items-center gap-2 shadow-sm"
                      >
                        <Check className="h-4 w-4" /> ACCEPT
                      </button>
                      
                      <select 
                        disabled={submitting === order.order_id}
                        className="flex-1 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg px-3 font-medium text-sm focus:ring-2 focus:ring-amber-500 shadow-sm cursor-pointer outline-none transition-colors"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleDecision(order.order_id, e.target.value, data.recommendation);
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
                        onClick={() => handleDecision(order.order_id, "REJECT", data.recommendation)}
                        className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 py-2 rounded-lg font-medium text-sm transition-colors flex justify-center items-center gap-2 shadow-sm"
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
