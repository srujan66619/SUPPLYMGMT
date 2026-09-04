import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, PackageSearch, Users, ArrowRight, BarChart3, Clock, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ active: 0, atRisk: 0, critical: 0, customers: 0 });

  // In a real app we'd fetch this from the backend
  useEffect(() => {
    setStats({
      active: 1,
      atRisk: 14,
      critical: 4,
      customers: 3
    });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="h-6 w-6 text-indigo-600" />
          Control Tower
        </h1>
        <p className="text-sm text-slate-500 mt-1">Real-time supply chain disruption monitoring</p>
      </div>
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Active Disruptions" 
          value={stats.active} 
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} 
          trend="+1 in last 24h"
          trendColor="text-amber-600"
        />
        <StatCard 
          title="At-Risk Orders" 
          value={stats.atRisk} 
          icon={<PackageSearch className="h-5 w-5 text-indigo-500" />} 
          trend="Requires Review"
          trendColor="text-slate-500"
        />
        <StatCard 
          title="Critical Orders" 
          value={stats.critical} 
          icon={<ShieldAlert className="h-5 w-5 text-red-500" />} 
          trend="High Priority"
          trendColor="text-red-600"
        />
        <StatCard 
          title="Exposed Customers" 
          value={stats.customers} 
          icon={<Users className="h-5 w-5 text-blue-500" />} 
          trend="Monitor closely"
          trendColor="text-slate-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Disruptions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Recent Disruptions</h2>
            <Link to="/disruptions" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Analyze New <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">ID</th>
                  <th className="px-6 py-3 font-semibold">Event</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-600 text-xs">DIS-001</td>
                  <td className="px-6 py-4 font-medium text-slate-800">Apex Components Halt</td>
                  <td className="px-6 py-4">
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-semibold">Pending Action</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link to="/impact/1" className="text-indigo-600 font-medium hover:text-indigo-700">View Impact</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* System Status / Network Health */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">Network Health</h2>
          
          <div className="space-y-4">
            <HealthIndicator label="Entity Resolution API" status="Operational" />
            <HealthIndicator label="ERP Database Sync" status="Operational" />
            <HealthIndicator label="Scenario Lab Engine" status="Operational" />
            <HealthIndicator label="LLM Inference" status="Operational" />
          </div>
          
          <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Last updated: Just now
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        <p className={`text-xs mt-2 font-medium ${trendColor}`}>{trend}</p>
      </div>
      <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function HealthIndicator({ label, status }) {
  const isGood = status === 'Operational';
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-600 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-slate-800 font-semibold">{status}</span>
        <div className={`h-2 w-2 rounded-full ${isGood ? 'bg-emerald-500' : 'bg-red-500'}`} />
      </div>
    </div>
  );
}
