import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Database, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function DataTable() {
  const { type } = useParams();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/${type}`);
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load data. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  const renderTableHeaders = () => {
    if (data.length === 0) return null;
    const keys = Object.keys(data[0]).filter(k => k !== 'raw_id' && k !== 'source_records');
    return (
      <tr className="border-b border-navy-elevated text-slate-muted text-xs uppercase tracking-wider bg-navy-surface/50">
        {keys.map(k => (
          <th key={k} className="px-6 py-4 font-semibold text-left">{k.replace(/_/g, ' ')}</th>
        ))}
      </tr>
    );
  };

  const renderTableBody = () => {
    if (data.length === 0) return null;
    const keys = Object.keys(data[0]).filter(k => k !== 'raw_id' && k !== 'source_records');
    return data.map((row, i) => (
      <tr key={i} className="border-b border-navy-elevated hover:bg-navy-elevated/30 transition-colors text-sm">
        {keys.map(k => {
          let cellValue = row[k];
          let displayClass = "text-slate-muted";
          if (k === 'status') {
            return (
              <td key={k} className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                  cellValue === 'delayed' || cellValue === 'at_risk' ? 'bg-accent-crimson/10 text-accent-crimson border-accent-crimson/20' :
                  cellValue === 'active' || cellValue === 'pending_analysis' ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/20' :
                  'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20'
                }`}>
                  {cellValue}
                </span>
              </td>
            );
          }
          if (k === 'id') {
             displayClass = "font-mono font-medium text-foreground";
          }
          return <td key={k} className={`px-6 py-4 ${displayClass}`}>{cellValue !== null ? String(cellValue) : '-'}</td>;
        })}
      </tr>
    ));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground capitalize flex items-center gap-2">
            <Database className="h-6 w-6 text-accent-indigo-light" />
            {type} Database
          </h1>
          <p className="text-sm text-slate-muted mt-1">
            Real-time {type} table synced from the operational data store.
          </p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-navy-surface border border-navy-elevated shadow-sm rounded-md text-sm font-medium text-foreground hover:bg-navy-elevated transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="bg-navy-surface rounded-xl shadow-lg border border-navy-elevated overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <RefreshCw className="h-8 w-8 text-accent-indigo-light animate-spin mb-4" />
            <h3 className="text-lg font-medium text-foreground">Loading {type}...</h3>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <AlertCircle className="h-12 w-12 text-accent-crimson mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Error</h3>
            <p className="text-sm text-slate-muted max-w-md mt-2">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-accent-indigo hover:bg-accent-indigo-light text-foreground rounded-md text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Database className="h-12 w-12 text-slate-muted mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No records found.</h3>
            <p className="text-sm text-slate-muted max-w-md mt-2">
              The {type} database is currently empty.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                {renderTableHeaders()}
              </thead>
              <tbody>
                {renderTableBody()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
