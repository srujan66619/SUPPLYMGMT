import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, AlertTriangle, Box, Package, Truck, Users, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function ImpactTrace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/impact/${id}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load impact data');
      } finally {
        setLoading(false);
      }
    };
    fetchImpact();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="ml-3 text-slate-600 font-medium">Calculating Impact...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          <AlertTriangle className="h-5 w-5 mb-2" />
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/disruptions/analyze')} className="mt-4 text-sm font-medium underline">
            Back to Analyzer
          </button>
        </div>
      </div>
    );
  }

  const { summary, trace_path, affected_orders } = data;

  if (summary.impact_level === 'ZERO') {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Impact Trace</h1>
          <p className="text-slate-500 mt-1">Disruption ID: {id} — Cascading supply chain impact</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center shadow-sm max-w-3xl mx-auto mt-12">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-100 rounded-full mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-800 mb-2 tracking-tight">NO BUSINESS IMPACT</h2>
          <p className="text-emerald-700 text-lg mb-8 font-medium">Recommended action: NO ACTION REQUIRED</p>
          
          <div className="bg-white/60 border border-emerald-100 rounded-lg p-6 max-w-xl mx-auto text-sm text-left grid grid-cols-2 gap-y-4 shadow-sm">
            <div className="text-slate-500 font-medium uppercase tracking-wider text-xs">Pending Shipments</div>
            <div className="font-semibold text-slate-800 text-right">{summary.pending_shipments_count || 0}</div>
            
            <div className="text-slate-500 font-medium uppercase tracking-wider text-xs">Affected Inventory</div>
            <div className="font-semibold text-slate-800 text-right">0</div>
            
            <div className="text-slate-500 font-medium uppercase tracking-wider text-xs">Open Orders</div>
            <div className="font-semibold text-slate-800 text-right">0</div>
            
            <div className="text-slate-500 font-medium uppercase tracking-wider text-xs">Affected Customers</div>
            <div className="font-semibold text-slate-800 text-right">0</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Impact Trace</h1>
        <p className="text-slate-500 mt-1">Disruption ID: {id} — Cascading supply chain impact</p>
      </div>

      {/* Visual Chain */}
      <div className="mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Propagation Path</h3>
        <div className="flex items-center gap-2 min-w-max">
          {trace_path.map((node, i) => (
            <React.Fragment key={i}>
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 shadow-sm">
                {node}
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </React.Fragment>
          ))}
          <div className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-lg text-sm font-medium text-orange-800 shadow-sm flex items-center gap-1.5">
            <Package className="h-4 w-4" /> {summary.total_orders_affected} Orders
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium text-red-800 shadow-sm flex items-center gap-1.5">
            <Users className="h-4 w-4" /> {summary.customers_impacted} Customers
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Orders</div>
          <div className="text-2xl font-bold text-slate-800">{summary.total_orders_affected}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Critical Risk</div>
          <div className="text-2xl font-bold text-red-600">{summary.critical_orders}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Shortage</div>
          <div className="text-2xl font-bold text-slate-800">{summary.total_shortage} units</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Customers</div>
          <div className="text-2xl font-bold text-slate-800">{summary.customers_impacted}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Max Delay</div>
          <div className="text-2xl font-bold text-amber-600">{summary.estimated_delay_days} days</div>
        </div>
      </div>

      {/* Affected Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Affected Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium text-right">Required</th>
                <th className="px-4 py-3 font-medium text-right">Available</th>
                <th className="px-4 py-3 font-medium text-right">Shortage</th>
                <th className="px-4 py-3 font-medium">Promise Date</th>
                <th className="px-4 py-3 font-medium">Projected</th>
                <th className="px-4 py-3 font-medium">Delay</th>
                <th className="px-4 py-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {affected_orders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-slate-500">No orders affected.</td>
                </tr>
              ) : (
                affected_orders.map((order, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{order.order_id}</td>
                    <td className="px-4 py-3">{order.customer_name}</td>
                    <td className="px-4 py-3 text-slate-500">{order.product_sku}</td>
                    <td className="px-4 py-3 text-right">{order.quantity_required}</td>
                    <td className="px-4 py-3 text-right">{order.quantity_available}</td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">{order.shortage > 0 ? order.shortage : '-'}</td>
                    <td className="px-4 py-3">{order.promise_date}</td>
                    <td className="px-4 py-3 font-medium">{order.projected_fulfillment_date}</td>
                    <td className="px-4 py-3 text-amber-600 font-medium">{order.delay_days > 0 ? `${order.delay_days} days` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.risk === 'Critical' ? 'bg-red-100 text-red-700' :
                        order.risk === 'High' ? 'bg-orange-100 text-orange-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {order.risk}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
