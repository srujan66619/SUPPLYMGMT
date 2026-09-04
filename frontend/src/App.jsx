import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Activity, AlertCircle, Home, Database, Box, Users, Truck, Factory, Scale, FlaskConical, Map } from 'lucide-react';

import Dashboard from './Dashboard';
import DisruptionAnalyzer from './DisruptionAnalyzer';
import ImpactTrace from './ImpactTrace';
import ScenarioLab from './ScenarioLab';
import DecisionCenter from './DecisionCenter';
import DataTable from './DataTable';

function Sidebar({ lastApiLatency }) {
  const location = useLocation();

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen overflow-y-auto">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
          <Activity className="h-6 w-6 text-indigo-400" />
          NEXUSFLOW AI
        </div>
      </div>
      
      <div className="flex-1 py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Operations
        </div>
        <nav className="space-y-0.5 px-2">
          <NavItem to="/" icon={<Home className="h-4 w-4" />} label="Control Tower" current={location.pathname} />
          <NavItem to="/disruptions" icon={<AlertCircle className="h-4 w-4" />} label="Disruptions" current={location.pathname} />
          <NavItem to="/impact/1" icon={<Map className="h-4 w-4" />} label="Impact Map" current={location.pathname} />
          <NavItem to="/data/orders" icon={<Box className="h-4 w-4" />} label="Orders" current={location.pathname} />
          <NavItem to="/decisions" icon={<Scale className="h-4 w-4" />} label="Decision Center" current={location.pathname} />
          <NavItem to="/scenarios" icon={<FlaskConical className="h-4 w-4" />} label="Scenario Lab" current={location.pathname} />
        </nav>

        <div className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Supply Chain Data
        </div>
        <nav className="space-y-0.5 px-2">
          <NavItem to="/data/suppliers" icon={<Factory className="h-4 w-4" />} label="Suppliers" current={location.pathname} />
          <NavItem to="/data/inventory" icon={<Database className="h-4 w-4" />} label="Inventory" current={location.pathname} />
          <NavItem to="/data/shipments" icon={<Truck className="h-4 w-4" />} label="Shipments" current={location.pathname} />
          <NavItem to="/data/customers" icon={<Users className="h-4 w-4" />} label="Customers" current={location.pathname} />
        </nav>
      </div>

      <div className="p-4 border-t border-indigo-900/50">
        <div className="bg-indigo-900/50 rounded-lg p-3 flex flex-col items-center justify-center border border-indigo-800/50 mb-4">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">System Latency</span>
          </div>
          <div className={`text-lg font-mono font-bold ${
            lastApiLatency > 1000 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {lastApiLatency ? `${lastApiLatency} ms` : '--- ms'}
          </div>
          <div className="text-[9px] text-indigo-500 mt-1">NEXUSFLOW AI ENGINE</div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
            JD
          </div>
          <div>
            <div className="text-white font-medium">Jane Doe</div>
            <div className="text-slate-500 text-xs">Supply Chain Operator</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const NavItem = ({ to, icon, label, current }) => {
  const isActive = current === to || (to !== '/' && current.startsWith(to));
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
        isActive ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

function AppContent() {
  const [lastApiLatency, setLastApiLatency] = useState(0);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use((response) => {
      const pTime = response.headers['x-process-time'];
      if (pTime) {
        setLastApiLatency(parseFloat(pTime));
      }
      return response;
    }, (error) => {
      const pTime = error.response?.headers?.['x-process-time'];
      if (pTime) {
        setLastApiLatency(parseFloat(pTime));
      }
      return Promise.reject(error);
    });
    
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar lastApiLatency={lastApiLatency} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/disruptions" element={<DisruptionAnalyzer />} />
          <Route path="/impact/:id" element={<ImpactTrace />} />
          <Route path="/scenarios" element={<ScenarioLab />} />
          <Route path="/decisions" element={<DecisionCenter />} />
          <Route path="/data/:type" element={<DataTable />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
