import React from 'react';
import { useParams } from 'react-router-dom';
import { Database } from 'lucide-react';

export default function DataTable() {
  const { type } = useParams();
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 capitalize flex items-center gap-2">
          <Database className="h-6 w-6 text-indigo-600" />
          {type} Database
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Read-only view of the operational {type} tables synced from the ERP system.
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col items-center justify-center p-16 text-center">
        <Database className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">Data View Available</h3>
        <p className="text-sm text-slate-500 max-w-md mt-2">
          In a full production deployment, this screen connects directly to the SQLite `{type}` table. Currently showing placeholder view for the {type} dashboard.
        </p>
      </div>
    </div>
  );
}
