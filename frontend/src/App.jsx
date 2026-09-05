import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Activity, AlertCircle, Home, Database, Box, Users, Truck, Factory, Scale, FlaskConical, Map, X, Edit2 } from 'lucide-react';

import Dashboard from './Dashboard';
import DisruptionAnalyzer from './DisruptionAnalyzer';
import ImpactTrace from './ImpactTrace';
import ScenarioLab from './ScenarioLab';
import DecisionCenter from './DecisionCenter';
import DataTable from './DataTable';

function Sidebar({ lastApiLatency, profile, setProfile, onOpenProfile }) {
  const location = useLocation();

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="w-64 bg-navy-surface/90 backdrop-blur-md border-r border-navy-elevated text-slate-muted flex flex-col h-screen overflow-y-auto relative z-10">
      <div className="p-5 border-b border-navy-elevated">
        <div className="flex items-center gap-2 text-foreground font-bold text-xl tracking-tight">
          <Activity className="h-6 w-6 text-accent-indigo-light" />
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
          <NavItem to="/decisions/1" icon={<Scale className="h-4 w-4" />} label="Decision Center" current={location.pathname} />
          <NavItem to="/scenarios/1" icon={<FlaskConical className="h-4 w-4" />} label="Scenario Lab" current={location.pathname} />
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

      <div className="p-4 border-t border-navy-elevated">
        <div className="bg-navy-base rounded-lg p-3 flex flex-col items-center justify-center border border-navy-elevated mb-4">
          <div className="flex items-center gap-2 text-slate-muted mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">System Latency</span>
          </div>
          <div className={`text-lg font-mono font-bold ${
            lastApiLatency > 1000 ? 'text-accent-amber' : 'text-accent-emerald'
          }`}>
            {lastApiLatency ? `${lastApiLatency} ms` : '--- ms'}
          </div>
          <div className="text-[9px] text-accent-indigo-light mt-1">NEXUSFLOW AI ENGINE</div>
        </div>
        
        <div 
          className="flex items-center gap-3 text-sm cursor-pointer hover:bg-navy-elevated p-2 rounded-md transition-colors"
          onClick={onOpenProfile}
        >
          <div className="h-8 w-8 rounded-full bg-accent-indigo flex items-center justify-center text-foreground font-bold">
            {getInitials(profile.name)}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-foreground font-medium truncate">{profile.name}</div>
            <div className="text-slate-muted text-xs truncate">{profile.role}</div>
          </div>
          <Edit2 className="h-4 w-4 text-slate-muted flex-shrink-0" />
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
        isActive ? 'bg-accent-indigo/20 text-accent-indigo-light' : 'hover:bg-navy-elevated hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
};

function AppContent() {
  const [lastApiLatency, setLastApiLatency] = useState(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('nexusflow_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore JSON parse error
      }
    }
    return { name: 'Srujan Sinha', role: 'Supply Chain Operator' };
  });

  const [editForm, setEditForm] = useState({ name: '', role: '' });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem('nexusflow_profile', JSON.stringify(profile));
  }, [profile]);

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

  const openProfile = () => {
    setEditForm({ name: profile.name, role: profile.role });
    setSaveSuccess(false);
    setIsProfileModalOpen(true);
  };

  const saveProfile = () => {
    if (editForm.name.trim() === '') return;
    setProfile(editForm);
    setSaveSuccess(true);
    setTimeout(() => {
      setIsProfileModalOpen(false);
    }, 1000);
  };

  return (
    <>
      <div className="dynamic-backdrop">
        <div className="network-layer"></div>
      </div>
      <div className="flex h-screen overflow-hidden bg-transparent relative z-10">
        <Sidebar 
        lastApiLatency={lastApiLatency} 
        profile={profile}
        setProfile={setProfile}
        onOpenProfile={openProfile}
      />
      <main className="flex-1 overflow-y-auto relative z-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/disruptions" element={<DisruptionAnalyzer />} />
          <Route path="/impact/:id" element={<ImpactTrace />} />
          <Route path="/scenarios" element={<ScenarioLab />} />
          <Route path="/scenarios/:id" element={<ScenarioLab />} />
          <Route path="/decisions" element={<DecisionCenter />} />
          <Route path="/decisions/:id" element={<DecisionCenter />} />
          <Route path="/data/:type" element={<DataTable />} />
        </Routes>
      </main>

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-navy-base/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-navy-surface border border-navy-elevated rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-navy-elevated">
              <h2 className="text-lg font-bold text-foreground">Edit Profile</h2>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 flex-1">
              {saveSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100 flex items-center">
                  Profile updated successfully!
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-muted mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-navy-base border border-navy-elevated text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-indigo focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-muted mb-1">Role</label>
                  <input 
                    type="text" 
                    value={editForm.role}
                    onChange={e => setEditForm({...editForm, role: e.target.value})}
                    className="w-full bg-navy-base border border-navy-elevated text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-indigo focus:border-transparent"
                    placeholder="Enter your role"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-navy-base border-t border-navy-elevated flex justify-end gap-3">
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveProfile}
                disabled={editForm.name.trim() === ''}
                className="px-4 py-2 bg-accent-indigo hover:bg-accent-indigo-light text-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App;
