import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiFilter, FiRefreshCw, FiAlertCircle, FiCheckCircle, 
  FiClock, FiDollarSign, FiArrowRight, FiUser, FiLayout, 
  FiPhone, FiMail, FiArrowDown, FiArrowUp, FiGrid, FiList
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

const FunnelBar = ({ label, count, value, width, color, onClick, isActive, isLead, weightedValue, currencySymbol, conversionRate, compact = false }) => (
  <div className="flex flex-col items-center w-full">
    
    {/* Conversion Connector */}
    {conversionRate && (
       <div className={`flex justify-center relative z-0 ${compact ? '-my-1' : '-my-2 mb-1'}`}>
          <div className={`bg-gray-100 text-gray-500 font-bold rounded-full border border-white shadow-sm flex items-center ${compact ? 'text-[8px] px-1.5' : 'text-[10px] px-2 py-0.5'}`}>
             <FiArrowDown className="mr-1"/> {conversionRate}%
          </div>
       </div>
    )}

    <div 
      onClick={onClick}
      className={`
        w-full relative group cursor-pointer transition-all duration-300 transform
        ${isActive ? 'scale-105 z-10' : 'hover:scale-102 hover:opacity-90'}
      `}
    >
      <div className="flex justify-between items-end mb-1 px-1">
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold uppercase tracking-wider ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
          {label}
        </span>
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-400`}>
          {count}
        </span>
      </div>

      <div className={`${compact ? 'h-6' : 'h-10'} w-full bg-gray-100 rounded-r-lg overflow-hidden flex items-center relative shadow-sm`}>
        <div 
          className={`h-full ${color} transition-all duration-700 ease-out flex items-center px-2 text-white font-bold relative overflow-hidden`}
          style={{ width: width }}
        >
          <span className={`z-10 drop-shadow-md ${compact ? 'text-xs' : 'text-sm'}`}>
            {isLead ? count : formatCurrency(value, currencySymbol)}
          </span>
        </div>
        
        {/* Weighted Forecast Ghost Bar */}
        {!isLead && weightedValue > 0 && (
          <div 
             className="absolute left-0 top-0 h-full bg-white opacity-20 z-20" 
             style={{ width: `${(weightedValue / value) * parseFloat(width)}%` }} 
             title="Weighted Probability"
          />
        )}
      </div>
    </div>
  </div>
);

// ✅ NEW COMPONENT: Individual User Card for Comparison
const UserComparisonCard = ({ user, metrics, stages, currencySymbol }) => {
    // Calculate total pipeline value for this user
    const totalPipeline = metrics.filteredDeals.reduce((a, b) => a + parseFloat(b.amount || 0), 0);
    const weightedForecast = metrics.filteredDeals.reduce((a, b) => a + (parseFloat(b.amount || 0) * ((b.probability||0)/100)), 0);
    const winRate = metrics.metrics['CLOSED_WON'].count > 0 
        ? ((metrics.metrics['CLOSED_WON'].count / (metrics.metrics['CLOSED_WON'].count + metrics.metrics['CLOSED_LOST'].count)) * 100).toFixed(0)
        : 0;

    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                    {user.name.charAt(0)}
                </div>
                <div>
                    <h4 className="font-bold text-gray-800">{user.name}</h4>
                    <div className="flex gap-2 text-xs mt-1">
                        <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">Win Rate: {winRate}%</span>
                        <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Fcst: {formatCurrency(weightedForecast, currencySymbol)}</span>
                    </div>
                </div>
            </div>

            <div className="flex-grow space-y-2">
                {stages.map((stage, index) => {
                    const metric = metrics.metrics[stage.key];
                    let conversionRate = null;
                    if (index > 0) {
                        const prevStageKey = stages[index - 1].key;
                        const prevCount = metrics.metrics[prevStageKey].count;
                        if (prevCount > 0) conversionRate = ((metric.count / prevCount) * 100).toFixed(0);
                    }

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
                            conversionRate={conversionRate}
                            compact={true} // Use compact mode
                            onClick={() => {}} 
                            isActive={false}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const DetailTable = ({ data, stageKey, currencySymbol }) => {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });

  const isLeadStage = stageKey === 'LEADS';
  const isClosedWon = stageKey === 'CLOSED_WON';
  const isActiveDeal = !isLeadStage && !isClosedWon && stageKey !== 'CLOSED_LOST';

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'amount') {
         aVal = parseFloat(a.amount || 0);
         bVal = parseFloat(b.amount || 0);
      } else if (sortConfig.key === 'probability') {
         aVal = parseInt(a.probability || 0);
         bVal = parseInt(b.probability || 0);
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc'
    });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <FiArrowDown className="inline ml-1 opacity-0 group-hover:opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <FiArrowUp className="inline ml-1 text-blue-600" /> 
      : <FiArrowDown className="inline ml-1 text-blue-600" />;
  };

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
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer group" onClick={() => handleSort('name')}>
                Name <SortIcon columnKey="name"/>
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
              
              {isLeadStage && <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>}

              {isActiveDeal && (
                <>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right cursor-pointer group" onClick={() => handleSort('amount')}>
                    Value <SortIcon columnKey="amount"/>
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center cursor-pointer group" onClick={() => handleSort('probability')}>
                    Prob. <SortIcon columnKey="probability"/>
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Forecast</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Age</th>
                </>
              )}

              {isClosedWon && (
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right text-green-600 cursor-pointer group" onClick={() => handleSort('amount')}>
                    Booked <SortIcon columnKey="amount"/>
                 </th>
              )}
              
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map((item) => {
              const daysStuck = !isLeadStage ? getDaysStuck(item.stage_updated_at || item.created_at) : 0;
              const isBottleneck = daysStuck > 30 && isActiveDeal;
              const weightedVal = !isLeadStage ? (parseFloat(item.amount || 0) * ((item.probability || 0) / 100)) : 0;
              
              return (
                <tr 
                  key={item.id} 
                  className="hover:bg-blue-50 transition-colors cursor-pointer group"
                  onClick={() => navigate(isLeadStage ? `/admin/leads/${item.id}` : `/admin/deals/info?id=${item.id}`)}
                >
                  <td className="p-4">
                    <p className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">
                      {isLeadStage ? `${item.first_name} ${item.last_name}` : item.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.created_at)}</p>
                  </td>
                  
                  <td className="p-4 text-sm text-gray-600">
                    {isLeadStage ? item.company_name : item.account?.name}
                  </td>

                  {isLeadStage && (
                    <td className="p-4 text-xs text-gray-500">
                        {item.email && <div className="flex items-center mb-1"><FiMail className="mr-1"/> {item.email}</div>}
                        {item.phone && <div className="flex items-center"><FiPhone className="mr-1"/> {item.phone}</div>}
                    </td>
                  )}

                  {isActiveDeal && (
                    <>
                      <td className="p-4 text-right font-medium text-gray-700">
                        {formatCurrency(item.amount, currencySymbol)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          item.probability >= 80 ? 'bg-green-100 text-green-700' :
                          item.probability >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
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
                        ) : <span className="text-xs text-gray-400">{daysStuck}d</span>}
                      </td>
                    </>
                  )}

                  {isClosedWon && (
                     <td className="p-4 text-right font-bold text-green-700">
                        {formatCurrency(item.amount, currencySymbol)}
                     </td>
                  )}

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end text-gray-500 text-xs">
                      <FiUser className="mr-1" />
                      {/* ✅ FIX: Correctly finding Lead Owner or Deal Owner */}
                      {isLeadStage
                        ? (item.lead_owner?.first_name || item.owner?.first_name || item.assigned_to?.first_name || 'Unassigned')
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
  
  // States for Filtering and View Mode
  const [filterTime, setFilterTime] = useState('ALL'); 
  const [filterUser, setFilterUser] = useState('ALL');
  const [viewMode, setViewMode] = useState('AGGREGATE'); // 'AGGREGATE' or 'COMPARE'

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

  const usersList = useMemo(() => {
    const users = new Map();
    const addUser = (u) => { if(u && u.id) users.set(u.id, `${u.first_name} ${u.last_name}`); }
    
    // ✅ FIX: Populate filter list correctly from leads and deals
    leads.forEach(l => addUser(l.lead_owner || l.owner || l.assigned_to));
    deals.forEach(d => { addUser(d.assigned_deals); addUser(d.deal_creator); });
    
    return Array.from(users.entries()).map(([id, name]) => ({ id, name }));
  }, [leads, deals]);

  // --- Funnel Logic (Supports Grouping) ---
  const funnelData = useMemo(() => {
    const now = new Date();
    let startDate = null;
    
    if (filterTime === 'THIS_MONTH') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (filterTime === 'THIS_QUARTER') startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    else if (filterTime === 'THIS_YEAR') startDate = new Date(now.getFullYear(), 0, 1);

    const filterItem = (item) => {
      const itemDate = new Date(item.created_at);
      if (startDate && itemDate < startDate) return false;
      
      if (filterUser !== 'ALL') {
         // ✅ FIX: Robust User Filtering
         const userId = parseInt(filterUser);
         // Check Leads
         if (item.lead_owner) return item.lead_owner.id === userId || item.lead_owner === userId; 
         if (item.assigned_to?.id) return item.assigned_to.id === userId;
         if (item.owner?.id) return item.owner.id === userId;
         
         // Check Deals
         if (item.assigned_deals?.id) return item.assigned_deals.id === userId;
         if (item.created_by) return item.created_by === userId;
         
         return false;
      }
      return true;
    };

    const filteredLeads = leads.filter(filterItem);
    const filteredDeals = deals.filter(filterItem);

    // Stages Config
    const stages = [
      { key: 'LEADS', label: 'Top Leads', color: 'bg-blue-400', isDeal: false },
      { key: 'PROSPECTING', label: 'Prospecting', color: 'bg-blue-600', isDeal: true },
      { key: 'QUALIFICATION', label: 'Qualification', color: 'bg-indigo-600', isDeal: true },
      { key: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-600', isDeal: true },
      { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-pink-600', isDeal: true },
      { key: 'CLOSED_WON', label: 'Closed Won', color: 'bg-emerald-500', isDeal: true },
      { key: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-red-500', isDeal: true },
    ];

    // Helper to calculate metrics for a dataset
    const calculateMetrics = (subsetLeads, subsetDeals) => {
        const metrics = stages.reduce((acc, stage) => {
            acc[stage.key] = { ...stage, count: 0, value: 0, weightedValue: 0, items: [] };
            return acc;
        }, {});

        metrics['LEADS'].count = subsetLeads.length;
        metrics['LEADS'].items = subsetLeads;

        subsetDeals.forEach(deal => {
            const stageKey = (deal.stage || '').toUpperCase();
            if (metrics[stageKey]) {
                metrics[stageKey].count++;
                metrics[stageKey].items.push(deal);
                const amt = parseFloat(deal.amount || 0);
                metrics[stageKey].value += amt;
                metrics[stageKey].weightedValue += (amt * ((deal.probability || 0) / 100));
            }
        });

        // Calc visuals
        const maxCount = Math.max(...Object.values(metrics).map(m => m.count), 1);
        Object.keys(metrics).forEach(key => {
            const item = metrics[key];
            item.width = item.count === 0 ? '0%' : `${Math.max((item.count / maxCount) * 100, 15)}%`;
        });

        return { metrics, filteredDeals: subsetDeals, filteredLeads: subsetLeads };
    };

    // 1. Total Aggregate
    const aggregate = calculateMetrics(filteredLeads, filteredDeals);

    // 2. Per User Grouping (Only if needed for Compare View)
    const userGroups = [];
    if (viewMode === 'COMPARE') {
        const relevantUsers = filterUser === 'ALL' ? usersList : usersList.filter(u => u.id === parseInt(filterUser));
        
        relevantUsers.forEach(u => {
            const uLeads = filteredLeads.filter(l => (l.lead_owner?.id || l.owner?.id || l.assigned_to?.id) === parseInt(u.id));
            const uDeals = filteredDeals.filter(d => (d.assigned_deals?.id || d.created_by) === parseInt(u.id));
            
            // Only show users with activity
            if (uLeads.length > 0 || uDeals.length > 0) {
                userGroups.push({
                    user: u,
                    data: calculateMetrics(uLeads, uDeals)
                });
            }
        });
    }

    return { stages, aggregate, userGroups };
  }, [deals, leads, filterTime, filterUser, viewMode, usersList]);

  const activeTableData = useMemo(() => {
    if (selectedStage === 'ALL') return []; 
    return funnelData.aggregate.metrics[selectedStage]?.items || [];
  }, [selectedStage, funnelData]);

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

      {/* Filter Bar & View Toggle */}
      <div className="flex flex-wrap justify-between gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-center">
         <div className="flex gap-4 items-center">
             <span className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center">
                <FiFilter className="mr-2"/> Filters:
             </span>
             <select 
                value={filterTime} 
                onChange={(e) => setFilterTime(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2.5"
             >
                <option value="ALL">All Time</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="THIS_QUARTER">This Quarter</option>
                <option value="THIS_YEAR">This Year</option>
             </select>

             <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2.5"
             >
                <option value="ALL">All Users</option>
                {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                ))}
             </select>
         </div>

         {/* View Toggles */}
         <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setViewMode('AGGREGATE')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'AGGREGATE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <FiLayout className="mr-2"/> Aggregate
            </button>
            <button 
                onClick={() => setViewMode('COMPARE')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'COMPARE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <FiGrid className="mr-2"/> Compare Users
            </button>
         </div>
      </div>

      {/* CONDITIONAL RENDER: Aggregate vs Compare */}
      {viewMode === 'COMPARE' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {funnelData.userGroups.map((group) => (
                  <UserComparisonCard 
                      key={group.user.id}
                      user={group.user}
                      metrics={group.data}
                      stages={funnelData.stages.filter(s => s.key !== 'CLOSED_LOST')} // Hide Lost for cleaner card
                      currencySymbol={currencySymbol}
                  />
              ))}
              {funnelData.userGroups.length === 0 && (
                  <div className="col-span-full text-center py-20 text-gray-400">
                      No user data found for the selected filters.
                  </div>
              )}
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* LEFT COLUMN: The Visual Funnel */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                  <FiLayout className="mr-2" /> Pipeline Stages
                </h3>
                
                <div className="space-y-4 relative">
                  <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-100 -z-0"></div>

                  {funnelData.stages.filter(s => s.key !== 'CLOSED_LOST').map((stage, index) => {
                    const metric = funnelData.aggregate.metrics[stage.key];
                    
                    let conversionRate = null;
                    if (index > 0) {
                        const prevStageKey = funnelData.stages[index - 1].key;
                        const prevCount = funnelData.aggregate.metrics[prevStageKey].count;
                        if (prevCount > 0) {
                            conversionRate = ((metric.count / prevCount) * 100).toFixed(0);
                        }
                    }

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
                        conversionRate={conversionRate}
                        onClick={() => setSelectedStage(stage.key)}
                      />
                    );
                  })}
                </div>

                {/* Global Summary */}
                <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Pipeline Value</p>
                        <p className="text-xl font-bold text-gray-800">
                            {formatCurrency(funnelData.aggregate.filteredDeals.reduce((a, b) => a + parseFloat(b.amount || 0), 0), currencySymbol)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-blue-500 uppercase font-bold">Weighted Forecast</p>
                        <p className="text-xl font-bold text-blue-600">
                            {formatCurrency(funnelData.aggregate.filteredDeals.reduce((a, b) => a + (parseFloat(b.amount || 0) * ((b.probability||0)/100)), 0), currencySymbol)}
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
                      <span className={`w-3 h-3 rounded-full mr-3 ${funnelData.aggregate.metrics[selectedStage]?.color}`}></span>
                      {funnelData.stages.find(s => s.key === selectedStage)?.label} Details
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
                    

[Image of funnel stages with details]

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
      )}
    </div>
  );
};

export default AdminFunnelPage;