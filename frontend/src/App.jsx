import React from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './Dashboard'
import DisruptionAnalyzer from './DisruptionAnalyzer'
import ImpactTrace from './ImpactTrace'
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Map, 
  PackageSearch, 
  Scale, 
  FlaskConical, 
  Users, 
  Box, 
  Truck
} from 'lucide-react'

function Sidebar() {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Control Tower', path: '/', icon: LayoutDashboard },
    { name: 'Disruptions', path: '/disruptions/analyze', icon: AlertTriangle },
    { name: 'Impact Map', path: '#', icon: Map },
    { name: 'Orders', path: '#', icon: PackageSearch },
    { name: 'Decision Center', path: '#', icon: Scale },
    { name: 'Scenario Lab', path: '#', icon: FlaskConical },
  ]
  
  const dataItems = [
    { name: 'Suppliers', path: '#', icon: Users },
    { name: 'Inventory', path: '#', icon: Box },
    { name: 'Shipments', path: '#', icon: Truck },
    { name: 'Customers', path: '#', icon: Users },
  ]

  return (
    <div className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-wider">NEXUSFLOW AI</h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Supply Chain OS</p>
      </div>
      
      <div className="flex-1 py-6 overflow-y-auto">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Operations
        </div>
        <nav className="space-y-1 px-2 mb-8">
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.name} to={item.path} className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Supply Chain Data
        </div>
        <nav className="space-y-1 px-2">
          {dataItems.map(item => (
            <Link key={item.name} to={item.path} className="flex items-center px-3 py-2.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
              <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/disruptions/analyze" element={<DisruptionAnalyzer />} />
            <Route path="/impact/:id" element={<ImpactTrace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
