import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Map, ArrowRight, Box, Factory, Truck, Database, Users, ShieldCheck, AlertTriangle, X, FileText, ChevronRight } from 'lucide-react';

export default function ImpactTrace() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    axios.get(`/api/impact/${id}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.detail || err.message || 'Failed to load impact');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8 text-slate-500">Loading trace...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!data) return null;

  const isZeroImpact = data.summary === "NO BUSINESS IMPACT";

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Map className="h-6 w-6 text-indigo-600" />
            Impact Map: DIS-{id}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Trace operational dependencies from source to customer.</p>
        </div>
        {!isZeroImpact && (
          <Link 
            to="/scenarios"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 text-sm"
          >
            RUN SCENARIO LAB
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {isZeroImpact ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <ShieldCheck className="h-12 w-12 text-emerald-500 mb-4" />
          <h2 className="text-xl font-bold text-emerald-900 mb-2">NO BUSINESS IMPACT</h2>
          <p className="text-emerald-700 max-w-md">
            This disruption maps to known entities, but there are no pending shipments, inventory shortages, or open orders affected.
          </p>
          <div className="mt-6 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-md font-semibold text-sm">
            NO ACTION REQUIRED
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard title="Affected Supplier" value={data.supplier?.name} icon={<Factory className="h-4 w-4 text-slate-400" />} />
            <SummaryCard title="Delayed Shipment" value={data.shipment?.id} icon={<Truck className="h-4 w-4 text-slate-400" />} />
            <SummaryCard title="Inventory Shortage" value={data.inventory?.shortage ? 'YES' : 'NO'} icon={<Database className="h-4 w-4 text-slate-400" />} highlight={data.inventory?.shortage} />
            <SummaryCard title="Orders At Risk" value={data.orders?.length || 0} icon={<Box className="h-4 w-4 text-slate-400" />} highlight={true} />
          </div>

          {/* Trace Pipeline */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 relative overflow-x-auto">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">Dependency Trace</h3>
            
            <div className="flex justify-between items-start min-w-[800px] relative z-10 px-4">
              <TraceNode 
                icon={<Factory />} label="Supplier" value={data.supplier?.name} status="Source" 
                onClick={() => setSelectedNode({ type: 'supplier', data: data.supplier })}
              />
              <TraceArrow />
              <TraceNode 
                icon={<Truck />} label="Shipment" value={data.shipment?.id} status="Delayed" alert 
                onClick={() => setSelectedNode({ type: 'shipment', data: data.shipment })}
              />
              <TraceArrow />
              <TraceNode 
                icon={<Database />} label="Inventory" value={data.inventory?.product} status={`${data.inventory?.available} available`} 
                onClick={() => setSelectedNode({ type: 'inventory', data: data.inventory })}
              />
              <TraceArrow />
              <TraceNode 
                icon={<Box />} label="Orders" value={`${data.orders?.length || 0} Open`} status="Exposed" alert 
                onClick={() => setSelectedNode({ type: 'orders', data: data.orders })}
              />
              <TraceArrow />
              <TraceNode 
                icon={<Users />} label="Customers" value={`${new Set(data.orders?.map(o => o.customer)).size} Affected`} status="At Risk" alert 
                onClick={() => setSelectedNode({ type: 'customers', data: data.orders })}
              />
            </div>
          </div>

          {/* Affected Orders Table */}
          {data.orders && data.orders.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Affected Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs bg-slate-50">
                      <th className="px-6 py-3 font-semibold">Order ID</th>
                      <th className="px-6 py-3 font-semibold">Customer</th>
                      <th className="px-6 py-3 font-semibold text-right">Shortage</th>
                      <th className="px-6 py-3 font-semibold text-right">Delay (Days)</th>
                      <th className="px-6 py-3 font-semibold text-center">Priority</th>
                      <th className="px-6 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.orders.map(order => (
                      <tr key={order.order_id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedNode({ type: 'order', data: order })}>
                        <td className="px-6 py-4 font-mono font-medium text-indigo-600 hover:underline">{order.order_id}</td>
                        <td className="px-6 py-4 text-slate-600">{order.customer}</td>
                        <td className="px-6 py-4 text-right font-bold text-red-600">{order.shortage} units</td>
                        <td className="px-6 py-4 text-right font-medium text-amber-600">{order.delay_days}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            order.priority === 1 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            P{order.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            className="text-slate-500 hover:text-slate-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNode({ type: 'order', data: order });
                            }}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evidence Drawer Overlay */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectedNode(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                <FileText className="h-5 w-5 text-indigo-600" />
                Evidence Drawer
              </h2>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <EvidenceContent node={selectedNode} />
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 font-medium flex justify-between items-center">
              <span>Data source verified</span>
              <span className="text-emerald-600 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> SECURE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SummaryCard = ({ title, value, icon, highlight }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
      <h3 className={`text-lg font-bold ${highlight ? 'text-red-600' : 'text-slate-800'}`}>{value || 'N/A'}</h3>
    </div>
    <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
      {icon}
    </div>
  </div>
);

const TraceNode = ({ icon, label, value, status, alert, onClick }) => (
  <div onClick={onClick} className="flex flex-col items-center text-center w-32 shrink-0 group cursor-pointer">
    <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 shadow-sm border-2 transition-transform group-hover:scale-110 ${
      alert ? 'bg-red-50 border-red-200 text-red-500 group-hover:bg-red-100' : 'bg-indigo-50 border-indigo-200 text-indigo-600 group-hover:bg-indigo-100'
    }`}>
      {React.cloneElement(icon, { className: 'h-5 w-5' })}
    </div>
    <div className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600">{label}</div>
    <div className="text-xs text-slate-500 mt-1 truncate w-full px-2">{value || '-'}</div>
    <div className={`text-xs font-bold mt-2 px-2 py-0.5 rounded ${
      alert ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
    }`}>
      {status}
    </div>
  </div>
);

const TraceArrow = () => (
  <div className="flex flex-1 items-center justify-center pt-6 px-2 min-w-[50px]">
    <div className="w-full border-t-2 border-dashed border-slate-300 relative">
      <div className="absolute -right-1 -top-1.5 text-slate-300">
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  </div>
);

const EvidenceContent = ({ node }) => {
  if (node.type === 'shipment') {
    return (
      <div className="space-y-6">
        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Shipment Record: {node.data.id}</h3>
        <div className="space-y-4">
          <div><label className="text-xs text-slate-500 uppercase">Original ETA</label><p className="font-medium">{node.data.original_eta}</p></div>
          <div><label className="text-xs text-slate-500 uppercase">Revised ETA</label><p className="font-medium text-amber-600">{node.data.revised_eta}</p></div>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <p className="text-xs font-mono text-slate-600">Calculated Delay: {
            Math.max(0, Math.floor((new Date(node.data.revised_eta) - new Date(node.data.original_eta)) / (1000 * 60 * 60 * 24)))
          } days</p>
        </div>
      </div>
    );
  }
  
  if (node.type === 'inventory') {
    return (
      <div className="space-y-6">
        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Inventory Calculation</h3>
        <div className="space-y-4">
          <div><label className="text-xs text-slate-500 uppercase">Warehouse</label><p className="font-medium">WH-01</p></div>
          <div><label className="text-xs text-slate-500 uppercase">Product</label><p className="font-medium">{node.data.product}</p></div>
          <div className="flex gap-8 border-t border-slate-100 pt-4 mt-2">
            <div><label className="text-xs text-slate-500 uppercase">Available</label><p className="font-bold text-lg text-emerald-600">{node.data.available}</p></div>
            <div><label className="text-xs text-slate-500 uppercase">Reserved</label><p className="font-bold text-lg text-amber-600">{node.data.reserved}</p></div>
          </div>
        </div>
      </div>
    );
  }

  if (node.type === 'order') {
    return (
      <div className="space-y-6">
        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Order Impact Analysis</h3>
        <div className="space-y-4">
          <div><label className="text-xs text-slate-500 uppercase">Order ID</label><p className="font-mono text-indigo-600 font-medium">{node.data.order_id}</p></div>
          <div><label className="text-xs text-slate-500 uppercase">Customer</label><p className="font-medium">{node.data.customer}</p></div>
          <div><label className="text-xs text-slate-500 uppercase">Promise Date</label><p className="font-medium">{node.data.promise_date}</p></div>
          <div><label className="text-xs text-slate-500 uppercase">Projected Fulfillment</label><p className="font-medium text-amber-600">{node.data.projected_fulfillment_date}</p></div>
          
          <div className="bg-red-50 border border-red-100 p-4 rounded-lg mt-4 flex gap-8">
            <div><label className="text-xs text-red-700 uppercase font-bold">Shortage</label><p className="font-bold text-xl text-red-600">{node.data.shortage}</p></div>
            <div><label className="text-xs text-red-700 uppercase font-bold">Delay</label><p className="font-bold text-xl text-red-600">{node.data.delay_days} days</p></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (node.type === 'supplier') {
    return (
      <div className="space-y-6">
        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Supplier Record</h3>
        <div className="space-y-4">
          <div><label className="text-xs text-slate-500 uppercase">Supplier Name</label><p className="font-medium">{node.data.name}</p></div>
          <div><label className="text-xs text-slate-500 uppercase">Status</label><p className="font-medium text-emerald-600">Active</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Entity Data</h3>
      <pre className="text-xs font-mono bg-slate-50 p-4 rounded-lg overflow-x-auto text-slate-700 border border-slate-200">
        {JSON.stringify(node.data, null, 2)}
      </pre>
    </div>
  );
};
