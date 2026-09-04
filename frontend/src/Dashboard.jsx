import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, 
  PackageSearch, 
  AlertOctagon,
  Users,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/api/dashboard')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-screen text-slate-500">Loading Control Tower...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Control Tower</h1>
          <p className="text-slate-500 mt-1">Real-time supply chain overview and disruption monitoring.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
          <Activity className="h-4 w-4" />
          ANALYZE DISRUPTION
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Active Disruptions" 
          value={data?.active_disruptions || 0} 
          icon={AlertTriangle} 
          color="text-amber-500" 
          bg="bg-amber-50"
        />
        <StatCard 
          title="At-Risk Orders" 
          value={data?.at_risk_orders || 0} 
          icon={PackageSearch} 
          color="text-orange-500" 
          bg="bg-orange-50"
        />
        <StatCard 
          title="Critical Orders" 
          value={data?.critical_orders || 0} 
          icon={AlertOctagon} 
          color="text-red-500" 
          bg="bg-red-50"
        />
        <StatCard 
          title="Customers Exposed" 
          value={data?.customers_exposed || 0} 
          icon={Users} 
          color="text-indigo-500" 
          bg="bg-indigo-50"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Disruptions</h2>
           {data?.recent_disruptions?.length > 0 ? (
             <div className="text-sm text-slate-500">List of disruptions...</div>
           ) : (
             <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Activity className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                <p>No active disruptions detected in the supply chain.</p>
             </div>
           )}
        </div>
        
        <div className="space-y-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Supply Chain Overview</h2>
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-slate-600">Total Suppliers</span>
                        <span className="font-semibold text-slate-900">{data?.supply_chain_overview?.total_suppliers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-slate-600">Total Products</span>
                        <span className="font-semibold text-slate-900">{data?.supply_chain_overview?.total_products || 0}</span>
                    </div>
                </div>
            </div>
            
            <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6">
                <h3 className="font-bold text-indigo-900 mb-2">System Status</h3>
                <p className="text-sm text-indigo-700 mb-4">All data streams are connected and syncing normally.</p>
                <a href="#" className="text-indigo-600 font-medium text-sm flex items-center hover:text-indigo-800 transition-colors">
                    View Network Logs <ArrowRight className="h-4 w-4 ml-1" />
                </a>
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-start gap-4 transition-shadow hover:shadow-md">
      <div className={`p-3 rounded-lg ${bg} ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
