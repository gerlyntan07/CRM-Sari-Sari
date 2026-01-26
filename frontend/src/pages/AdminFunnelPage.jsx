import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiFilter, FiRefreshCw, FiAlertCircle, FiCheckCircle, 
  FiClock, FiDollarSign, FiArrowRight, FiUser, FiLayout, FiPhone, FiMail
} from "react-icons/fi";
import { useNavigate } from 'react-router-dom';
import api from '../api';
import useFetchUser from '../hooks/useFetchUser';
import LoadingSpinner from '../components/LoadingSpinner';

// --- Utility Functions ---

const formatCurrency = (amount, symbol = "₱") => {
  return `${symbol} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(amount || 0)}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDaysStuck = (dateString) => {
  if (!dateString) return 0;
  const diff = new Date() - new Date(dateString);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// --- Sub-Components ---

const FunnelBar = ({ label, count, value, width, color, onClick, isActive, isLead, weightedValue, currencySymbol }) => (
  <div 
    onClick={onClick}
    className={`
      relative group cursor-pointer transition-all duration-300 transform
      ${isActive ? 'scale-105 z-10' : 'hover:scale-102 hover:opacity-90'}
    `}
  >
    <div className="flex justify-between items-end mb-1 px-1">
      <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
        {label}
      </span>
      <span className="text-xs text-gray-400">
        {count} {isLead ? 'Leads' : 'Deals'}
      </span>
    </div>

    <div className="h-10 w-full bg-gray-100 rounded-r-lg overflow-hidden flex items-center relative shadow-sm">
      <div 
        className={`h-full ${color} transition-all duration-700 ease-out flex items-center px-3 text-white font-bold text-sm relative overflow-hidden`}
        style={{ width: width }}
      >
        {isActive && <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>}
        <span className="z-10 drop-shadow-md">
          {isLead ? count : formatCurrency(value, currencySymbol)}
        </span>
      </div>
      
      {!isLead && weightedValue > 0 && (
        <div 
           className="absolute left-0 top-0 h-1 bg-white opacity-30 z-20" 
           style={{ width: `${(weightedValue / value) * parseFloat(width)}%` }} 
           title="Weighted Probability"
        />
      )}
    </div>

    {isActive && (
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-6 text-blue-500 animate-bounce-x">
        <FiArrowRight size={24} />
      </div>
    )}
  </div>
);

// ✅ UPDATED DETAIL TABLE: Changes columns based on Stage Type
const DetailTable = ({ data, stageKey, currencySymbol }) => {
  const navigate = useNavigate();

  const isLeadStage = stageKey === 'LEADS';
  const isClosedWon = stageKey === 'CLOSED_WON';
  const isClosedLost = stageKey === 'CLOSED_LOST';
  const isActiveDeal = !isLeadStage && !isClosedWon && !isClosedLost;

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <FiLayout size={48} className="mb-4 opacity-50" />
        <p className="font-medium">No records in this stage</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto flex-grow">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
              
              {/* DYNAMIC COLUMNS */}
              {isLeadStage && (
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
              )}

              {isActiveDeal && (
                <>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Potential Value</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Prob.</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Forecast</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Age</th>
                </>
              )}

              {isClosedWon && (
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right text-green-600">Revenue Booked</th>
              )}
              
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => {
              const daysStuck = !isLeadStage ? getDaysStuck(item.stage_updated_at || item.created_at) : 0;
              const isBottleneck = daysStuck > 30 && isActiveDeal;
              const weightedVal = !isLeadStage ? (parseFloat(item.amount || 0) * ((item.probability || 0) / 100)) : 0;
              
              return (
                <tr 
                  key={item.id} 
                  className="hover:bg-blue-50 transition-colors cursor-pointer group"
                  onClick={() => navigate(isLeadStage ? `/admin/leads/${item.id}` : `/admin/deals/info?id=${item.id}`)}
                >
                  {/* Name Column */}
                  <td className="p-4">
                    <p className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">
                      {isLeadStage ? `${item.first_name} ${item.last_name}` : item.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.created_at)}</p>
                  </td>
                  
                  {/* Company Column */}
                  <td className="p-4 text-sm text-gray-600">
                    {isLeadStage ? item.company_name : item.account?.name}
                  </td>

                  {/* LEAD INFO: Contact Details */}
                  {isLeadStage && (
                    <td className="p-4 text-xs text-gray-500">
                        {item.email && <div className="flex items-center mb-1"><FiMail className="mr-1"/> {item.email}</div>}
                        {item.phone && <div className="flex items-center"><FiPhone className="mr-1"/> {item.phone}</div>}
                    </td>
                  )}

                  {/* ACTIVE DEAL INFO: Forecast & Bottlenecks */}
                  {isActiveDeal && (
                    <>
                      <td className="p-4 text-right font-medium text-gray-700">
                        {formatCurrency(item.amount, currencySymbol)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          item.probability >= 80 ? 'bg-green-100 text-green-700' :
                          item.probability >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {item.probability}%
                        </span>
                      </td>
                      <td className="p-4 text-right text-sm text-gray-500">
                        {formatCurrency(weightedVal, currencySymbol)}
                      </td>
                      <td className="p-4 text-center">
                        {isBottleneck ? (
                          <div className="flex items-center justify-center text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100" title="Stuck for >30 days">
                            <FiAlertCircle size={14} className="mr-1" />
                            <span className="text-xs font-bold">{daysStuck}d</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">{daysStuck}d</span>
                        )}
                      </td>
                    </>
                  )}

                  {/* CLOSED WON INFO: Revenue */}
                  {isClosedWon && (
                     <td className="p-4 text-right font-bold text-green-700">
                        {formatCurrency(item.amount, currencySymbol)}
                     </td>
                  )}

                  {/* Owner Column */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end text-gray-500 text-xs">
                      <FiUser className="mr-1" />
                      {isLeadStage
                        ? (item.owner?.first_name || 'Unassigned')
                        : (item.assigned_deals?.first_name || 'Unassigned')
                      }
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main Page Component ---

const AdminFunnelPage = () => {
  const navigate = useNavigate();
  const { user } = useFetchUser();
  const currencySymbol = user?.company?.currency || "₱";

  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedStage, setSelectedStage] = useState('ALL'); 

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, dealsRes] = await Promise.all([
        api.get('/leads/admin/getLeads'),
        api.get('/deals/admin/fetch-all')
      ]);
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
      setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
    } catch (error) {
      console.error("Failed to fetch funnel data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Funnel Logic Calculation (Memoized) ---
  const funnelMetrics = useMemo(() => {
    // 1. Setup Stages
    const stages = [
      { key: 'LEADS', label: 'Top Leads', color: 'bg-blue-400', isDeal: false },
      { key: 'PROSPECTING', label: 'Prospecting', color: 'bg-blue-600', isDeal: true },
      { key: 'QUALIFICATION', label: 'Qualification', color: 'bg-indigo-600', isDeal: true },
      { key: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-600', isDeal: true },
      { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-pink-600', isDeal: true },
      { key: 'CLOSED_WON', label: 'Closed Won', color: 'bg-emerald-500', isDeal: true },
    ];

    // 2. Aggregate Data
    const metrics = stages.reduce((acc, stage) => {
      acc[stage.key] = { ...stage, count: 0, value: 0, weightedValue: 0, items: [] };
      return acc;
    }, {});

    // Fill Leads
    metrics['LEADS'].count = leads.length;
    metrics['LEADS'].items = leads;

    // Fill Deals
    deals.forEach(deal => {
      const stageKey = (deal.stage || '').toUpperCase();
      if (metrics[stageKey]) {
        metrics[stageKey].count++;
        metrics[stageKey].items.push(deal);
        const amt = parseFloat(deal.amount || 0);
        metrics[stageKey].value += amt;
        metrics[stageKey].weightedValue += (amt * ((deal.probability || 0) / 100));
      }
    });

    // 3. Calculate Visuals (Widths)
    const maxCount = Math.max(...Object.values(metrics).map(m => m.count), 1);
    
    Object.keys(metrics).forEach(key => {
      const item = metrics[key];
      // Lead width is based on count vs deal max count to show drop off
      item.width = item.count === 0 ? '0%' : `${Math.max((item.count / maxCount) * 100, 15)}%`;
    });

    return { stages, metrics };
  }, [deals, leads]);

  // --- Determine Table Data ---
  const activeTableData = useMemo(() => {
    if (selectedStage === 'ALL') {
        return []; 
    }
    return funnelMetrics.metrics[selectedStage]?.items || [];
  }, [selectedStage, funnelMetrics]);

  return (
    <div className="p-6 lg:p-10 font-inter bg-gray-50 min-h-screen text-gray-800">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Funnel Intelligence</h1>
          <p className="text-gray-500 mt-1">Analyze pipeline velocity, conversion, and bottlenecks.</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button 
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* LEFT COLUMN: The Visual Funnel */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <FiFilter className="mr-2" /> Pipeline Stages
            </h3>
            
            <div className="space-y-4 relative">
              {/* Connector Line running through the funnel */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-100 -z-0"></div>

              {funnelMetrics.stages.map((stage) => {
                const metric = funnelMetrics.metrics[stage.key];
                return (
                  <FunnelBar 
                    key={stage.key}
                    label={stage.label}
                    count={metric.count}
                    value={metric.value}
                    width={metric.width}
                    color={metric.color}
                    isLead={!stage.isDeal}
                    weightedValue={metric.weightedValue}
                    currencySymbol={currencySymbol}
                    isActive={selectedStage === stage.key}
                    onClick={() => setSelectedStage(stage.key)}
                  />
                );
              })}
            </div>

            {/* Global Summary */}
            <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Total Pipeline</p>
                    <p className="text-xl font-bold text-gray-800">
                        {formatCurrency(deals.reduce((a, b) => a + parseFloat(b.amount || 0), 0), currencySymbol)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-blue-500 uppercase font-bold">Weighted Forecast</p>
                    <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(deals.reduce((a, b) => a + (parseFloat(b.amount || 0) * ((b.probability||0)/100)), 0), currencySymbol)}
                    </p>
                </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Detail View */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-200px)]">
          <div className="bg-white p-4 rounded-t-xl border-b border-gray-200 flex justify-between items-center shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              {selectedStage === 'ALL' ? (
                <span>Select a stage to view details</span>
              ) : (
                <>
                  <span className={`w-3 h-3 rounded-full mr-3 ${funnelMetrics.metrics[selectedStage]?.color}`}></span>
                  {funnelMetrics.stages.find(s => s.key === selectedStage)?.label} Details
                  <span className="ml-3 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {activeTableData.length} records
                  </span>
                </>
              )}
            </h3>
          </div>
          
          {selectedStage === 'ALL' ? (
             <div className="bg-white flex-grow rounded-b-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center p-12 text-center text-gray-400">
                <FiFilter size={64} className="mb-4 text-blue-100" />
                <h4 className="text-xl font-semibold text-gray-600 mb-2">Detailed Breakdown</h4>
                <p>Click on any stage bar on the left to inspect the specific Leads or Deals inside that stage.</p>
                
             </div>
          ) : (
             <DetailTable 
                data={activeTableData} 
                stageKey={selectedStage}
                currencySymbol={currencySymbol} 
             />
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminFunnelPage;