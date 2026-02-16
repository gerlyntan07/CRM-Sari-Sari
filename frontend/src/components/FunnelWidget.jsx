import React, { useState, useMemo } from 'react';
import { 
  FiFilter, FiLayout, FiMail, 
  FiArrowDown, FiArrowUp, FiDownload, FiPhone, FiUser, FiTarget, 
  FiActivity, FiXCircle, FiCheckCircle, FiMove 
} from "react-icons/fi"; 
import { useNavigate } from 'react-router-dom';

// --- NEW IMPORTS FOR DRAG AND DROP ---
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Local Helpers (Unchanged) ---
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

const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const flattened = data.map(item => ({
      ID: item.id,
      Name: item.name || `${item.first_name} ${item.last_name}`,
      Company: item.company_name || item.account?.name || '',
      Stage: item.stage || item.status,
      Amount: item.amount || 0,
      Date: formatDate(item.created_at)
  }));
  const headers = Object.keys(flattened[0]).join(",");
  const rows = flattened.map(row => 
    Object.values(row).map(val => typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val).join(",")
  );
  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Sub-Components ---

const FunnelBar = ({ label, count, value, width, color, onClick, isActive, isLead, weightedValue, currencySymbol, conversionRate, compact = false }) => (
  <div className="flex flex-col items-center w-full">
    {conversionRate && (
       <div className={`flex justify-center relative z-0 ${compact ? '-my-1' : '-my-2 mb-1'}`}>
          <div className={`bg-gray-100 text-gray-500 font-bold rounded-full border border-white shadow-sm flex items-center ${compact ? 'text-[8px] px-1.5' : 'text-[10px] px-2 py-0.5'}`}>
             <FiArrowDown className="mr-1"/> {conversionRate}%
          </div>
       </div>
    )}
    <div 
      onClick={onClick}
      className={`w-full relative group cursor-pointer transition-all duration-300 transform ${isActive ? 'scale-105 z-10' : 'hover:scale-102 hover:opacity-90'}`}
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
        {!isLead && weightedValue > 0 && (
          <div 
              className="absolute left-0 top-0 h-full bg-white opacity-20 z-20" 
              style={{ width: `${(weightedValue / value) * parseFloat(width)}%` }} 
          />
        )}
      </div>
    </div>
  </div>
);

// --- NEW: Sortable Wrapper Component ---
const SortableUserItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    position: 'relative', // Ensure positioning context
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full">
       {/* Pass drag handlers to the child component */}
       {React.cloneElement(children, { dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  );
};

const UserComparisonCard = ({ user, metrics, stages, currencySymbol, target, dragHandleProps }) => {
    const closedWonAmount = metrics.metrics['CLOSED_WON']?.value || 0;
    const closedLostAmount = metrics.metrics['CLOSED_LOST']?.value || 0;
    
    const totalClosed = metrics.metrics['CLOSED_WON'].count + metrics.metrics['CLOSED_LOST'].count;
    const winRate = totalClosed > 0 
        ? ((metrics.metrics['CLOSED_WON'].count / totalClosed) * 100).toFixed(0)
        : 0;
    
    const progress = target > 0 ? (closedWonAmount / target) * 100 : 0;

    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col h-full hover:shadow-lg transition-shadow relative group">
            
            {/* Header Section with Drag Handle */}
            <div className="flex flex-col mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3 flex-shrink-0">
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm">{user.name}</h4>
                            <div className="flex gap-2 text-[10px] mt-1">
                                <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">Win: {winRate}%</span>
                                <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Lost: {formatCurrency(closedLostAmount, currencySymbol)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* --- DRAG HANDLE --- */}
                    {dragHandleProps && (
                        <button 
                            {...dragHandleProps} 
                            className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-md cursor-grab active:cursor-grabbing transition-colors touch-none"
                            title="Drag to reorder"
                        >
                            <FiMove size={16} />
                        </button>
                    )}
                </div>

                {/* Target Progress */}
                {target > 0 ? (
                    <div className="w-full mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                             <span className="font-semibold text-gray-600">Target Achievement</span>
                             <span className={progress >= 100 ? "text-green-600 font-bold" : "text-blue-600 font-bold"}>{progress.toFixed(0)}%</span>
                        </div>
                        
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between text-[9px] text-gray-400">
                            <span>Achieved: <span className="text-gray-700 font-medium">{formatCurrency(closedWonAmount, currencySymbol)}</span></span>
                            <span>Target: {formatCurrency(target, currencySymbol)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-400 italic mt-1 text-center bg-gray-50 p-1 rounded">No target assigned</div>
                )}
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
                            compact={true} 
                            onClick={() => {}} 
                            isActive={false}
                        />
                    );
                })}
            </div>
        </div>
    );
};

// ... [DetailTable Component remains exactly the same as before] ...
const DetailTable = ({ data, stageKey, currencySymbol, basePath = '/admin' }) => {
    const navigate = useNavigate();
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  
    const isLeadStage = stageKey === 'LEADS';
    const isClosedWon = stageKey === 'CLOSED_WON';
    const isClosedLost = stageKey === 'CLOSED_LOST';
    const isActiveDeal = !isLeadStage && !isClosedWon && !isClosedLost;
  
    const sortedData = useMemo(() => {
      if (!sortConfig.key) return data;
      return [...data].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'amount' || sortConfig.key === 'probability') {
           aVal = parseFloat(a[sortConfig.key] || 0);
           bVal = parseFloat(b[sortConfig.key] || 0);
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
                
                {/* Active Deal Columns */}
                {isActiveDeal && (
                  <>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right cursor-pointer group" onClick={() => handleSort('amount')}>
                      Value <SortIcon columnKey="amount"/>
                    </th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center cursor-pointer group" onClick={() => handleSort('probability')}>
                      Prob. <SortIcon columnKey="probability"/>
                    </th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Age</th>
                  </>
                )}
  
                {/* Closed Won Columns */}
                {isClosedWon && (
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right text-green-600 cursor-pointer group" onClick={() => handleSort('amount')}>
                      Booked <SortIcon columnKey="amount"/>
                    </th>
                )}
  
                {/* Closed Lost Columns - NEW */}
                {isClosedLost && (
                    <>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right text-red-600 cursor-pointer group" onClick={() => handleSort('amount')}>
                          Lost Value <SortIcon columnKey="amount"/>
                      </th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                          Lost Date
                      </th>
                    </>
                )}
  
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedData.map((item) => {
                const daysStuck = !isLeadStage ? getDaysStuck(item.stage_updated_at || item.created_at) : 0;
                const isBottleneck = daysStuck > 30 && isActiveDeal;
                return (
                  <tr 
                    key={item.id} 
                    className="hover:bg-blue-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(isLeadStage ? `${basePath}/leads/${item.id}` : `${basePath}/deals/info?id=${item.id}`)}
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
                        <td className="p-4 text-center">
                          {isBottleneck ? (
                            <div className="flex items-center justify-center text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100" title="Stuck for >30 days">
                              <FiActivity size={14} className="mr-1" />
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
                    {isClosedLost && (
                        <>
                          <td className="p-4 text-right font-bold text-red-600 opacity-75">
                              {formatCurrency(item.amount, currencySymbol)}
                          </td>
                          <td className="p-4 text-center text-xs text-gray-500">
                              {formatDate(item.stage_updated_at)}
                          </td>
                        </>
                    )}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end text-gray-500 text-xs">
                        <FiUser className="mr-1" />
                        {isLeadStage
                          ? (item.lead_owner?.first_name || item.owner?.first_name || item.assigned_to?.first_name || 'Unassigned')
                          : (item.assigned_deals?.first_name || item.deal_creator?.first_name || 'Unassigned')
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

// --- MAIN EXPORTED WIDGET ---

const FunnelWidget = ({ leads, deals, currencySymbol, targets = [], basePath = '/admin', currentUser = null }) => {
    const [selectedStage, setSelectedStage] = useState('ALL'); 
    const [filterTime, setFilterTime] = useState('ALL'); 
    const [filterUser, setFilterUser] = useState('ALL');
    const [viewMode, setViewMode] = useState('AGGREGATE');
    
    // If currentUser is provided, always filter to that user
    const effectiveFilterUser = currentUser ? currentUser.id.toString() : filterUser;
    const isPersonalDashboard = !!currentUser;
    
    // --- DRAG AND DROP STATE ---
    const [userOrder, setUserOrder] = useState([]); 

    // Sensors for drag detection (Pointer + Keyboard for accessibility)
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
  
    // 1. Determine Date Range
    const dateRange = useMemo(() => {
        const now = new Date();
        if (filterTime === 'THIS_MONTH') {
            return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
        }
        if (filterTime === 'THIS_QUARTER') {
            const qStart = Math.floor(now.getMonth() / 3) * 3;
            return { start: new Date(now.getFullYear(), qStart, 1), end: new Date(now.getFullYear(), qStart + 3, 0) };
        }
        if (filterTime === 'THIS_YEAR') {
            return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
        }
        return null; // ALL TIME
    }, [filterTime]);

    // 2. Filter Targets
    const filteredTargets = useMemo(() => {
        return targets.filter(t => {
            if (filterUser !== 'ALL') {
                const tUserId = t.user?.id || t.user_id || t.assigned_to;
                if (parseInt(tUserId) !== parseInt(filterUser)) return false;
            }
            if (dateRange) {
                const tStart = new Date(t.start_date);
                const tEnd = new Date(t.end_date);
                return tStart <= dateRange.end && tEnd >= dateRange.start;
            }
            return true;
        });
    }, [targets, filterUser, dateRange]);

    const usersList = useMemo(() => {
      const users = new Map();
      const addUser = (u) => { if(u && u.id) users.set(u.id, `${u.first_name} ${u.last_name}`); }
      leads.forEach(l => addUser(l.lead_owner || l.owner || l.assigned_to));
      deals.forEach(d => { addUser(d.assigned_deals); addUser(d.deal_creator); });
      return Array.from(users.entries()).map(([id, name]) => ({ id, name }));
    }, [leads, deals]);
  
    const funnelData = useMemo(() => {
      const now = new Date();
      let startDate = null;
      if (filterTime === 'THIS_MONTH') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (filterTime === 'THIS_QUARTER') startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      else if (filterTime === 'THIS_YEAR') startDate = new Date(now.getFullYear(), 0, 1);
  
      const filterItem = (item) => {
        const itemDate = new Date(item.created_at);
        if (startDate && itemDate < startDate) return false;
        
        if (effectiveFilterUser !== 'ALL') {
             const userId = parseInt(effectiveFilterUser);
             if (item.lead_owner) {
                 const oid = item.lead_owner.id || item.lead_owner;
                 if (oid === userId) return true;
             }
             if (item.assigned_to?.id === userId) return true;
             if (item.owner?.id === userId) return true;
             if (item.assigned_deals?.id === userId) return true;
             if (item.created_by === userId) return true;
             return false;
        }
        return true;
      };
  
      const filteredLeads = leads.filter(filterItem);
      const filteredDeals = deals.filter(filterItem);
  
      const stages = [
        { key: 'LEADS', label: 'Top Leads', color: 'bg-blue-400', isDeal: false },
        { key: 'PROSPECTING', label: 'Prospecting', color: 'bg-blue-600', isDeal: true },
        { key: 'QUALIFICATION', label: 'Qualification', color: 'bg-indigo-600', isDeal: true },
        { key: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-600', isDeal: true },
        { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-pink-600', isDeal: true },
        { key: 'CLOSED_WON', label: 'Closed Won', color: 'bg-emerald-500', isDeal: true },
        { key: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-red-500', isDeal: true },
      ];
  
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
  
          const maxCount = Math.max(...Object.values(metrics).map(m => m.count), 1);
          Object.keys(metrics).forEach(key => {
              const item = metrics[key];
              item.width = item.count === 0 ? '0%' : `${Math.max((item.count / maxCount) * 100, 15)}%`;
          });
  
          return { metrics, filteredDeals: subsetDeals, filteredLeads: subsetLeads };
      };
  
      const aggregate = calculateMetrics(filteredLeads, filteredDeals);
  
      const userGroups = [];
      if (viewMode === 'COMPARE') {
          const relevantUsers = effectiveFilterUser === 'ALL' ? usersList : usersList.filter(u => u.id === parseInt(effectiveFilterUser));
          relevantUsers.forEach(u => {
              const uid = parseInt(u.id);
              const uLeads = filteredLeads.filter(l => {
                  const oid = l.lead_owner?.id || l.lead_owner || l.assigned_to?.id || l.owner?.id;
                  return oid === uid;
              });
              const uDeals = filteredDeals.filter(d => (d.assigned_deals?.id || d.created_by) === uid);
              
              const userTargetObj = filteredTargets.find(t => {
                   const tUserId = t.user?.id || t.user_id || t.assigned_to;
                   return parseInt(tUserId) === uid;
              });
              const userTargetAmount = parseFloat(userTargetObj?.amount || userTargetObj?.target_amount || userTargetObj?.value || 0);

              if (uLeads.length > 0 || uDeals.length > 0 || userTargetAmount > 0) {
                  userGroups.push({
                      user: u,
                      data: calculateMetrics(uLeads, uDeals),
                      target: userTargetAmount
                  });
              }
          });
      }
      return { stages, aggregate, userGroups };
    }, [deals, leads, filterTime, effectiveFilterUser, viewMode, usersList, filteredTargets]);

    // --- SORTED USER GROUPS LOGIC ---
    const sortedUserGroups = useMemo(() => {
        if (!funnelData.userGroups.length) return [];
        
        // If we have a custom order, use it to sort the groups.
        // Users not in 'userOrder' (new ones) are appended at the end.
        const items = [...funnelData.userGroups];
        if (userOrder.length > 0) {
            items.sort((a, b) => {
                const indexA = userOrder.indexOf(a.user.id);
                const indexB = userOrder.indexOf(b.user.id);
                
                // If both are found, sort by index
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                // If A found, it comes first
                if (indexA !== -1) return -1;
                // If B found, it comes first
                if (indexB !== -1) return 1;
                // If neither found, keep original order
                return 0;
            });
        }
        return items;
    }, [funnelData.userGroups, userOrder]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
        setUserOrder(() => {
                // Determine the current order of IDs
                const currentIds = sortedUserGroups.map(g => g.user.id);
                const oldIndex = currentIds.indexOf(active.id);
                const newIndex = currentIds.indexOf(over.id);
                return arrayMove(currentIds, oldIndex, newIndex);
            });
        }
    };
  
    // 3. Calculate Global Totals & Health Metrics
    const globalMetrics = useMemo(() => {
        const totalTarget = filteredTargets.reduce((acc, t) => acc + parseFloat(t.amount || t.target_amount || t.value || 0), 0);
        
        const metrics = funnelData.aggregate.metrics;
        
        const totalWon = metrics['CLOSED_WON']?.value || 0;
        const totalWonCount = metrics['CLOSED_WON']?.count || 0;
        const totalLost = metrics['CLOSED_LOST']?.value || 0;
        const totalLostCount = metrics['CLOSED_LOST']?.count || 0;
        
        const totalLeads = metrics['LEADS']?.count || 0;
        
        const progress = totalTarget > 0 ? (totalWon / totalTarget) * 100 : 0;
        
        const totalClosedCount = totalWonCount + totalLostCount;
        const winRate = totalClosedCount > 0 ? (totalWonCount / totalClosedCount) * 100 : 0;
        const conversionRate = totalLeads > 0 ? (totalWonCount / totalLeads) * 100 : 0;

        return { totalTarget, totalWon, totalLost, progress, winRate, conversionRate };
    }, [filteredTargets, funnelData]);

    const activeTableData = useMemo(() => {
      if (selectedStage === 'ALL') return []; 
      return funnelData.aggregate.metrics[selectedStage]?.items || [];
    }, [selectedStage, funnelData]);
  
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col h-full">
         <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <FiLayout className="mr-2" /> {isPersonalDashboard ? 'My Pipeline' : 'Pipeline Intelligence'}
                </h3>
                <p className="text-sm text-gray-500">
                    {isPersonalDashboard ? 'Your personal pipeline performance and metrics.' : 'Analyze pipeline velocity and bottlenecks.'}
                </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
               <select 
                  value={filterTime} 
                  onChange={(e) => setFilterTime(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
               >
                  <option value="ALL">All Time</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="THIS_QUARTER">This Quarter</option>
                  <option value="THIS_YEAR">This Year</option>
               </select>
  
               {/* Show user filter and compare mode only if not personal dashboard */}
               {!isPersonalDashboard && (
                 <>
                   <select
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                   >
                      <option value="ALL">All Users</option>
                      {usersList.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                   </select>
      
                   <div className="flex bg-gray-100 p-0.5 rounded-lg">
                      <button 
                          onClick={() => setViewMode('AGGREGATE')}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'AGGREGATE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                          Aggregate
                      </button>
                      <button 
                          onClick={() => setViewMode('COMPARE')}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'COMPARE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                          Compare
                      </button>
                   </div>
                 </>
               )}
            </div>
         </div>
  
         {viewMode === 'COMPARE' ? (
             <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
             >
                <SortableContext 
                    items={sortedUserGroups.map(g => g.user.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto pb-4">
                        {sortedUserGroups.map((group) => (
                            <SortableUserItem key={group.user.id} id={group.user.id}>
                                <UserComparisonCard 
                                    user={group.user}
                                    metrics={group.data}
                                    stages={funnelData.stages.filter(s => s.key !== 'CLOSED_LOST')} 
                                    currencySymbol={currencySymbol}
                                    target={group.target}
                                />
                            </SortableUserItem>
                        ))}
                        {sortedUserGroups.length === 0 && (
                            <div className="col-span-full text-center py-10 text-gray-400">No data for selected filters.</div>
                        )}
                    </div>
                </SortableContext>
             </DndContext>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-4 flex flex-col space-y-2 relative">
                  
                  {/* Active Funnel */}
                  <div className="relative">
                      <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-100 -z-0"></div>
                      {funnelData.stages.filter(s => s.key !== 'CLOSED_LOST').map((stage, index) => {
                          const metric = funnelData.aggregate.metrics[stage.key];
                          let conversionRate = null;
                          if (index > 0) {
                              const prevStageKey = funnelData.stages[index - 1].key;
                              const prevCount = funnelData.aggregate.metrics[prevStageKey].count;
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
                              isActive={selectedStage === stage.key}
                              conversionRate={conversionRate}
                              onClick={() => setSelectedStage(stage.key)}
                            />
                          );
                      })}
                  </div>

                  {/* Funnel Health Dashboard & Outcome Section */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="mb-2 text-xs font-bold text-gray-400 uppercase">Funnel Health</div>
                        <div className="grid grid-cols-3 gap-2 text-center mb-4">
                            <div className="bg-green-50 rounded p-2 border border-green-100">
                               <p className="text-[9px] text-green-600 uppercase font-bold">Win Rate</p>
                               <p className="text-sm font-bold text-gray-800">{globalMetrics.winRate.toFixed(0)}%</p>
                            </div>
                            <div className="bg-blue-50 rounded p-2 border border-blue-100">
                               <p className="text-[9px] text-blue-600 uppercase font-bold">Conversion</p>
                               <p className="text-sm font-bold text-gray-800">{globalMetrics.conversionRate.toFixed(0)}%</p>
                            </div>
                            <div className="bg-red-50 rounded p-2 border border-red-100">
                               <p className="text-[9px] text-red-600 uppercase font-bold">Lost Value</p>
                               <p className="text-sm font-bold text-gray-800">{formatCurrency(globalMetrics.totalLost, currencySymbol)}</p>
                            </div>
                        </div>

                        {/* Explicit Lost Bar for Analysis */}
                        <FunnelBar 
                            label="Closed Lost"
                            key="CLOSED_LOST"
                            count={funnelData.aggregate.metrics['CLOSED_LOST'].count}
                            value={funnelData.aggregate.metrics['CLOSED_LOST'].value}
                            width={funnelData.aggregate.metrics['CLOSED_LOST'].width}
                            color="bg-red-500 opacity-90"
                            isLead={false}
                            weightedValue={0}
                            currencySymbol={currencySymbol}
                            isActive={selectedStage === 'CLOSED_LOST'}
                            onClick={() => setSelectedStage('CLOSED_LOST')}
                        />

                        {/* Total Target Progress Bar */}
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 mt-4">
                            <div className="flex justify-between items-center text-[10px] mb-1">
                                <span className="font-bold text-gray-600 flex items-center"><FiTarget className="mr-1"/> Total Target</span>
                                <span className={globalMetrics.progress >= 100 ? "text-green-600 font-bold" : "text-blue-600 font-bold"}>
                                    {globalMetrics.progress.toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${globalMetrics.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                    style={{ width: `${Math.min(globalMetrics.progress, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-400">
                                <span>Achieved: <span className="text-gray-700 font-medium">{formatCurrency(globalMetrics.totalWon, currencySymbol)}</span></span>
                                <span>Goal: {formatCurrency(globalMetrics.totalTarget, currencySymbol)}</span>
                            </div>
                        </div>
                   </div>
               </div>
  
               <div className="lg:col-span-8 h-[600px] flex flex-col">
                  <div className="bg-gray-50 p-3 rounded-t-xl border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center">
                          {selectedStage === 'ALL' ? (
                            <span>Select a stage to view details</span>
                          ) : (
                            <>
                              <span className={`w-2.5 h-2.5 rounded-full mr-2 ${funnelData.aggregate.metrics[selectedStage]?.color}`}></span>
                              {funnelData.stages.find(s => s.key === selectedStage)?.label} Details
                              <span className="ml-2 px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-[10px] rounded-full">
                                {activeTableData.length} records
                              </span>
                            </>
                          )}
                        </h3>
                        {selectedStage !== 'ALL' && activeTableData.length > 0 && (
                          <button 
                            onClick={() => downloadCSV(activeTableData, `Funnel_${selectedStage}`)}
                            className="text-[10px] font-bold text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition-colors flex items-center"
                          >
                            <FiDownload className="mr-1" /> Export
                          </button>
                        )}
                  </div>
                  {selectedStage === 'ALL' ? (
                        <div className="bg-white flex-grow rounded-b-xl border border-gray-100 flex flex-col items-center justify-center p-12 text-center text-gray-400">
                          <FiFilter size={48} className="mb-4 text-blue-100" />
                          <p>Click on any stage bar (including Lost Deals) to inspect records.</p>
                        </div>
                  ) : (
                        <DetailTable 
                           data={activeTableData} 
                           stageKey={selectedStage}
                           currencySymbol={currencySymbol} 
                          basePath={basePath}
                        />
                  )}
               </div>
            </div>
         )}
      </div>
    );
};

export default FunnelWidget;