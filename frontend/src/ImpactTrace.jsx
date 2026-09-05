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
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Map className="h-6 w-6 text-accent-indigo-light" />
            Impact Map: DIS-{id}
          </h1>
          <p className="text-sm text-slate-muted mt-1">Trace operational dependencies from source to customer.</p>
        </div>
        {!isZeroImpact && (
          <Link 
            to={`/scenarios/${id}`}
            className="bg-accent-indigo hover:bg-accent-indigo-light text-foreground px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 text-sm"
          >
            RUN SCENARIO LAB
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {isZeroImpact ? (
        <div className="bg-accent-emerald/10 border border-accent-emerald/20 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <ShieldCheck className="h-12 w-12 text-accent-emerald mb-4" />
          <h2 className="text-xl font-bold text-accent-emerald mb-2">NO BUSINESS IMPACT</h2>
          <p className="text-accent-emerald/80 max-w-md">
            This disruption maps to known entities, but there are no pending shipments, inventory shortages, or open orders affected.
          </p>
          <div className="mt-6 px-4 py-2 bg-accent-emerald/20 text-accent-emerald rounded-md font-semibold text-sm border border-accent-emerald/30">
            NO ACTION REQUIRED
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard title="Affected Supplier" value={data.supplier?.name} icon={<Factory className="h-4 w-4 text-slate-muted" />} />
            <SummaryCard title="Delayed Shipment" value={data.shipment?.id} icon={<Truck className="h-4 w-4 text-slate-muted" />} />
            <SummaryCard title="Inventory Shortage" value={data.inventory?.shortage ? 'YES' : 'NO'} icon={<Database className="h-4 w-4 text-slate-muted" />} highlight={data.inventory?.shortage} />
            <SummaryCard title="Orders At Risk" value={data.orders?.length || 0} icon={<Box className="h-4 w-4 text-slate-muted" />} highlight={true} />
          </div>

          {/* Trace Pipeline */}
          <div className="bg-navy-surface border border-navy-elevated rounded-xl shadow-lg p-6 relative overflow-x-auto">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-6 border-b border-navy-elevated pb-2">Dependency Trace</h3>
            
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
            <div className="bg-navy-surface border border-navy-elevated rounded-xl shadow-lg overflow-hidden">
              <div className="bg-navy-base border-b border-navy-elevated px-6 py-4 flex justify-between items-center">
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Affected Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-navy-elevated text-slate-muted uppercase tracking-wider text-xs bg-navy-surface/50">
                      <th className="px-6 py-3 font-semibold">Order ID</th>
                      <th className="px-6 py-3 font-semibold">Customer</th>
                      <th className="px-6 py-3 font-semibold text-right">Shortage</th>
                      <th className="px-6 py-3 font-semibold text-right">Delay (Days)</th>
                      <th className="px-6 py-3 font-semibold text-center">Priority</th>
                      <th className="px-6 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-elevated">
                    {data.orders.map(order => (
                      <tr key={order.order_id} className="hover:bg-navy-elevated/50 transition-colors cursor-pointer" onClick={() => setSelectedNode({ type: 'order', data: order })}>
                        <td className="px-6 py-4 font-mono font-medium text-accent-indigo-light hover:underline">{order.order_id}</td>
                        <td className="px-6 py-4 text-slate-muted">{order.customer}</td>
                        <td className="px-6 py-4 text-right font-bold text-accent-crimson">{order.shortage} units</td>
                        <td className="px-6 py-4 text-right font-medium text-accent-amber">{order.delay_days}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${
                            order.priority === 1 ? 'bg-accent-crimson/10 text-accent-crimson border-accent-crimson/20' : 'bg-accent-amber/10 text-accent-amber border-accent-amber/20'
                          }`}>
                            P{order.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            className="text-slate-muted hover:text-foreground transition-colors"
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
          <div className="absolute inset-0 bg-navy-base/60 backdrop-blur-sm" onClick={() => setSelectedNode(null)} />
          <div className="relative w-full max-w-md bg-navy-surface h-full shadow-2xl border-l border-navy-elevated flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-6 border-b border-navy-elevated bg-navy-base">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 uppercase tracking-widest">
                <FileText className="h-5 w-5 text-accent-indigo-light" />
                Evidence Drawer
              </h2>
              <button onClick={() => setSelectedNode(null)} className="text-slate-muted hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-navy-surface">
              <EvidenceContent node={selectedNode} />
            </div>
            
            <div className="p-6 border-t border-navy-elevated bg-navy-base text-xs text-slate-muted font-medium flex justify-between items-center">
              <span>Data source verified</span>
              <span className="text-accent-emerald flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> SECURE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SummaryCard = ({ title, value, icon, highlight }) => (
  <div className="bg-navy-surface border border-navy-elevated rounded-lg p-4 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-slate-muted text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
      <h3 className={`text-lg font-bold ${highlight ? 'text-accent-crimson' : 'text-foreground'}`}>{value || 'N/A'}</h3>
    </div>
    <div className="bg-navy-base p-2 rounded-md border border-navy-elevated">
      {icon}
    </div>
  </div>
);

const TraceNode = ({ icon, label, value, status, alert, onClick }) => (
  <div onClick={onClick} className="flex flex-col items-center text-center w-32 shrink-0 group cursor-pointer">
    <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 shadow-sm border transition-transform group-hover:scale-110 ${
      alert ? 'bg-accent-crimson/10 border-accent-crimson text-accent-crimson group-hover:bg-accent-crimson/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-accent-indigo/10 border-accent-indigo text-accent-indigo-light group-hover:bg-accent-indigo/20 shadow-[0_0_15px_rgba(79,70,229,0.2)]'
    }`}>
      {React.cloneElement(icon, { className: 'h-5 w-5' })}
    </div>
    <div className="font-semibold text-foreground text-sm group-hover:text-accent-indigo-light transition-colors">{label}</div>
    <div className="text-xs text-slate-muted mt-1 truncate w-full px-2">{value || '-'}</div>
    <div className={`text-xs font-bold mt-2 px-2 py-0.5 rounded border ${
      alert ? 'bg-accent-crimson/10 text-accent-crimson border-accent-crimson/20' : 'bg-navy-elevated text-slate-muted border-slate-muted/20'
    }`}>
      {status}
    </div>
  </div>
);

const TraceArrow = () => (
  <div className="flex flex-1 items-center justify-center pt-6 px-2 min-w-[50px]">
    <div className="w-full border-t border-dashed border-navy-elevated relative">
      <div className="absolute -right-1 -top-[9px] text-navy-elevated">
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  </div>
);

const EvidenceContent = ({ node }) => {
  if (node.type === 'shipment') {
    return (
      <div className="space-y-6">
        <h3 className="font-bold text-foreground border-b border-navy-elevated pb-2">Shipment Record: <span className="text-accent-indigo-light">{node.data.id}</span></h3>
        <div className="space-y-4">
          <div><label className="text-xs text-slate-muted uppercase">Original ETA</label><p className="font-medium text-foreground">{node.data.original_eta}</p></div>
          <div><label className="text-xs text-slate-muted uppercase">Revised ETA</label><p className="font-medium text-accent-amber">{node.data.revised_eta}</p></div>
        </div>
        <div className="bg-navy-base border border-navy-elevated p-4 rounded-lg">
          <p className="text-xs font-mono text-slate-muted">Calculated Delay: {
            Math.max(0, Math.floor((new Date(node.data.revised_eta) - new Date(node.data.original_eta)) / (1000 * 60 * 60 * 24)))
          } days</p>
        </div>
      </div>
    );
  }
  
  if (node.type === 'inventory') {
    return (
      <div className="space-y-6">
        <h3 className="font-bold text-foreground border-b border-navy-elevated pb-2">Inventory Calculation</h3>
        <div className="space-y-4">
          <div><label className="text-xs text-slate-muted uppercase">Warehouse</label><p className="font-medium text-foreground">WH-01</p></div>
          <div><label className="text-xs text-slate-muted uppercase">Product</label><p className="font-medium text-foreground">{node.data.product}</p></div>
          <div className="flex gap-8 border-t border-navy-elevated pt-4 mt-2">
            <div><label className="text-xs text-slate-muted uppercase">Available</label><p className="font-bold text-lg text-accent-emerald">{node.data.available}</p></div>
            <div><label className="text-xs text-slate-muted uppercase">Reserved</label><p className="font-bold text-lg text-accent-amber">{node.data.reserved}</p></div>
          </div>
        </div>
      </div>
    );
  }

  if (node.type === 'order') {
    return (
      <div className="space-y-6">
        <h3 className="font-bold text-foreground border-b border-navy-elevated pb-2">Order Impact Analysis</h3>
        <div className="space-y-4">
          <div><label className="text-xs text-slate-muted uppercase">Order ID</label><p className="font-mono text-accent-indigo-light font-medium">{node.data.order_id}</p></div>
          <div><label className="text-xs text-slate-muted uppercase">Customer</label><p className="font-medium text-foreground">{node.data.customer}</p></div>
          <div><label className="text-xs text-slate-muted uppercase">Promise Date</label><p className="font-medium text-foreground">{node.data.promise_date}</p></div>
          <div><label className="text-xs text-slate-muted uppercase">Projected Fulfillment</label><p className="font-medium text-accent-amber">{node.data.projected_fulfillment_date}</p></div>
          
          <div className="bg-accent-crimson/10 border border-accent-crimson/20 p-4 rounded-lg mt-4 flex gap-8">
            <div><label className="text-xs text-accent-crimson uppercase font-bold">Shortage</label><p className="font-bold text-xl text-accent-crimson">{node.data.shortage}</p></div>
            <div><label className="text-xs text-accent-crimson uppercase font-bold">Delay</label><p className="font-bold text-xl text-accent-crimson">{node.data.delay_days} days</p></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (node.type === 'supplier') {
    return (
      <div className="space-y-6">
        <h3 className="font-bold text-foreground border-b border-navy-elevated pb-2">Supplier Record</h3>
        <div className="space-y-4">
          <div><label className="text-xs text-slate-muted uppercase">Supplier Name</label><p className="font-medium text-foreground">{node.data.name}</p></div>
          <div><label className="text-xs text-slate-muted uppercase">Status</label><p className="font-medium text-accent-emerald">Active</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-foreground border-b border-navy-elevated pb-2">Entity Data</h3>
      <pre className="text-xs font-mono bg-navy-base p-4 rounded-lg overflow-x-auto text-slate-muted border border-navy-elevated">
        {JSON.stringify(node.data, null, 2)}
      </pre>
    </div>
  );
};
