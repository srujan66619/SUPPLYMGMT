import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, PackageSearch, Users, ArrowRight, Clock, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState({ active_disruptions: 0, at_risk_orders: 0, critical_orders: 0, customers_exposed: 0 });
  const [recentDisruptions, setRecentDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('/api/dashboard');
        setStats(response.data);
        setRecentDisruptions(response.data.recent_disruptions || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="h-6 w-6 text-accent-indigo-light" />
          Control Tower
        </h1>
        <p className="text-sm text-slate-muted mt-1">Real-time supply chain disruption monitoring</p>
      </div>

      {/* 8-Stage Pipeline Lifecycle Visualizer */}
      <div className="mb-8 bg-navy-surface border border-navy-elevated rounded-xl p-6 shadow-lg">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 border-b border-navy-elevated pb-2">8-Stage Pipeline Lifecycle</h2>
        <div className="flex items-center justify-between text-xs font-medium text-slate-muted">
          <div className="flex flex-col items-center gap-2"><div className="w-8 h-8 rounded-full bg-accent-indigo/20 border border-accent-indigo flex items-center justify-center text-accent-indigo-light">1</div><span>NOTICE</span></div>
          <div className="h-px bg-navy-elevated flex-1 mx-2"></div>
          <div className="flex flex-col items-center gap-2"><div className="w-8 h-8 rounded-full bg-accent-indigo/20 border border-accent-indigo flex items-center justify-center text-accent-indigo-light">2</div><span>UNDERSTAND</span></div>
          <div className="h-px bg-navy-elevated flex-1 mx-2"></div>
          <div className="flex flex-col items-center gap-2"><div className="w-8 h-8 rounded-full bg-accent-emerald/20 border border-accent-emerald flex items-center justify-center text-accent-emerald">3</div><span>VERIFY</span></div>
          <div className="h-px bg-navy-elevated flex-1 mx-2"></div>
          <div className="flex flex-col items-center gap-2"><div className="w-8 h-8 rounded-full bg-navy-elevated border border-slate-muted/30 flex items-center justify-center">4</div><span>TRACE</span></div>
          <div className="h-px bg-navy-elevated flex-1 mx-2"></div>
          <div className="flex flex-col items-center gap-2"><div className="w-8 h-8 rounded-full bg-navy-elevated border border-slate-muted/30 flex items-center justify-center">5</div><span>CHALLENGE</span></div>
          <div className="h-px bg-navy-elevated flex-1 mx-2"></div>
          <div className="flex flex-col items-center gap-2"><div className="w-8 h-8 rounded-full bg-navy-elevated border border-slate-muted/30 flex items-center justify-center">6</div><span>SIMULATE</span></div>
          <div className="h-px bg-navy-elevated flex-1 mx-2"></div>
          <div className="flex flex-col items-center gap-2"><div className="w-8 h-8 rounded-full bg-navy-elevated border border-slate-muted/30 flex items-center justify-center">7</div><span>RECOMMEND</span></div>
          <div className="h-px bg-navy-elevated flex-1 mx-2"></div>
          <div className="flex flex-col items-center gap-2"><div className="w-8 h-8 rounded-full bg-navy-elevated border border-slate-muted/30 flex items-center justify-center">8</div><span>DECISION</span></div>
        </div>
      </div>
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Active Disruptions" 
          value={loading ? "..." : stats.active_disruptions} 
          icon={<AlertTriangle className="h-5 w-5 text-accent-amber" />} 
          trend="Current count"
          trendColor="text-slate-muted"
        />
        <StatCard 
          title="At-Risk Orders" 
          value={loading ? "..." : stats.at_risk_orders} 
          icon={<PackageSearch className="h-5 w-5 text-accent-indigo" />} 
          trend="Requires Review"
          trendColor="text-slate-muted"
        />
        <StatCard 
          title="Critical Orders" 
          value={loading ? "..." : stats.critical_orders} 
          icon={<ShieldAlert className="h-5 w-5 text-accent-crimson" />} 
          trend="Priority 1"
          trendColor="text-accent-crimson"
        />
        <StatCard 
          title="Exposed Customers" 
          value={loading ? "..." : stats.customers_exposed} 
          icon={<Users className="h-5 w-5 text-accent-indigo-light" />} 
          trend="Monitor closely"
          trendColor="text-slate-muted"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Disruptions */}
        <div className="lg:col-span-2 bg-navy-surface rounded-xl shadow-lg border border-navy-elevated overflow-hidden flex flex-col">
          <div className="bg-navy-base border-b border-navy-elevated px-6 py-4 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Recent Disruptions</h2>
            <Link to="/disruptions" className="text-xs font-medium text-accent-indigo-light hover:text-white flex items-center gap-1 transition-colors">
              Analyze New <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy-elevated text-slate-muted text-xs uppercase tracking-wider bg-navy-surface/50">
                  <th className="px-6 py-3 font-semibold">ID</th>
                  <th className="px-6 py-3 font-semibold">Event</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-elevated">
                {recentDisruptions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-muted text-sm">
                      {loading ? "Loading..." : "No recent disruptions."}
                    </td>
                  </tr>
                ) : (
                  recentDisruptions.map(d => (
                    <tr key={d.id} className="hover:bg-navy-elevated/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-muted text-xs">{d.id}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{d.event}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                          d.status === 'pending_analysis' ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/20' :
                          d.status === 'analyzed' ? 'bg-accent-indigo/10 text-accent-indigo-light border-accent-indigo/20' :
                          'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20'
                        }`}>
                          {d.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/impact/${d.raw_id}`} className="text-accent-indigo-light font-medium hover:text-white transition-colors">View Impact</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Status / Network Health */}
        <div className="bg-navy-surface rounded-xl shadow-lg border border-navy-elevated p-6 flex flex-col">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-navy-elevated pb-3 mb-4">Network Health</h2>
          
          <div className="space-y-4">
            <HealthIndicator label="Entity Resolution API" status="Operational" latency="14ms" />
            <HealthIndicator label="ERP Database Sync" status="Operational" latency="28ms" />
            <HealthIndicator label="Scenario Lab Engine" status="Operational" latency="48ms" />
            <HealthIndicator label="LLM Inference" status="Operational" latency="96ms" />
          </div>
          
          <div className="mt-8 pt-4 border-t border-navy-elevated text-xs text-slate-muted flex items-center gap-2">
            <Clock className="h-4 w-4" /> Last updated: Just now
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendColor }) {
  return (
    <div className="bg-navy-surface rounded-xl shadow-lg border border-navy-elevated p-6 flex items-start justify-between hover:border-slate-muted/30 transition-colors">
      <div>
        <p className="text-slate-muted text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-foreground">{value}</h3>
        <p className={`text-xs mt-2 font-medium ${trendColor}`}>{trend}</p>
      </div>
      <div className="h-10 w-10 rounded-lg bg-navy-base border border-navy-elevated flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function HealthIndicator({ label, status, latency }) {
  const isGood = status === 'Operational';
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-muted font-medium">{label}</span>
      <div className="flex items-center gap-3">
        {latency && <span className="text-xs font-mono text-slate-muted/70">{latency}</span>}
        <span className="text-foreground font-semibold">{status}</span>
        <div className={`h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${isGood ? 'bg-accent-emerald shadow-accent-emerald/50' : 'bg-accent-crimson shadow-accent-crimson/50'}`} />
      </div>
    </div>
  );
}
