import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import {
  FiSearch, FiUsers, FiDollarSign, FiUserPlus, FiClock, FiBriefcase, FiTarget, FiArrowUpRight, FiArrowDownRight,
  FiUser, FiCalendar, FiCheckCircle, FiFileText, FiPhone, FiList, FiBookmark, FiEdit, FiArrowRight, FiPhoneCall, FiClipboard,
  FiFilter
} from "react-icons/fi";
import { LuMapPin } from "react-icons/lu";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { FaHandshakeAngle } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import api from '../api';
import useFetchUser from '../hooks/useFetchUser';
import LoadingSpinner from '../components/LoadingSpinner';
import { LineChart } from '@mui/x-charts/LineChart';

// --- Icon Components using React Icons ---

export const IconSearch = (props) => <FiSearch {...props} />;
export const IconDollarSign = (props) => <FiDollarSign {...props} />;
export const IconBuilding = (props) => <HiOutlineOfficeBuilding {...props} />;
export const IconTableCells = (props) => <FiList {...props} />;
export const IconClock = (props) => <FiClock {...props} />;
export const IconTrendUp = (props) => <FiArrowUpRight {...props} />;
export const IconTrendDown = (props) => <FiArrowDownRight {...props} />;
export const IconCalendar = (props) => <FiCalendar {...props} />;
export const IconPhone = (props) => <FiPhone {...props} />;
export const IconList = (props) => <FiList {...props} />;
export const IconBookmark = (props) => <FiBookmark {...props} />;
export const IconPenToSquare = (props) => <FiEdit {...props} />;
export const IconArrowRight = (props) => <FiArrowRight {...props} />;
export const IconHand = (props) => <FaHandshakeAngle {...props} />;

export const IconUsers = (props) => <FiUsers {...props} />;
export const IconUser = (props) => <FiUser {...props} />;
export const IconFiUserPlus = (props) => <FiUserPlus {...props} />;
export const IconFiBriefcase = (props) => <FiBriefcase {...props} />;
export const IconFiFileText = (props) => <FiFileText {...props} />;
export const IconFiTarget = (props) => <FiTarget {...props} />;
export const IconFiCircleCheck = (props) => <FiCheckCircle {...props} />;
export const IconFiCalendar = (props) => <FiCalendar {...props} />;
export const IconFiPhoneCall = (props) => <FiPhoneCall {...props} />;
export const IconLuMapPin = (props) => <LuMapPin {...props} />;
export const IconFiClipboard = (props) => <FiClipboard {...props} />;

// --- Constants ---

// ✅ UPDATED: Dynamic Currency Formatter
const formatCurrency = (amount, symbol = "₱") => {
  return `${symbol} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(amount)}`;
};
const getDaysStuck = (dateString) => {
  if (!dateString) return 0;
  const diff = new Date() - new Date(dateString);
  return Math.floor(diff / (1000 * 60 * 60 * 24)); // Convert ms to Days
};

// Utility function to map DEAL status to classes
const getStatusClasses = (status) => {
  switch (status) {
    case 'Negotiation': return { text: 'text-purple-700', bg: 'bg-purple-100' };
    case 'Proposal': return { text: 'text-red-700', bg: 'bg-red-100' };
    case 'Qualification': return { text: 'text-yellow-700', bg: 'bg-yellow-100' };
    case 'Prospecting': return { text: 'text-blue-700', bg: 'bg-blue-100' };
    case 'Closed Won': return { text: 'text-green-700', bg: 'bg-green-100' };
    case 'Closed Lost': return { text: 'text-red-700', bg: 'bg-red-100' };
    default: return { text: 'text-gray-700', bg: 'bg-gray-100' };
  }
};

// Utility function to map LEAD source colors
const getLeadSourceClasses = (source) => {
  switch (source) {
    case 'Website': return { text: 'text-green-600', bg: 'bg-green-100' };
    case 'Referral': return { text: 'text-purple-600', bg: 'bg-purple-100' };
    case 'Trade Show': return { text: 'text-orange-600', bg: 'bg-orange-100' };
    case 'Cold Call': return { text: 'text-red-600', bg: 'bg-red-100' };
    default: return { text: 'text-gray-600', bg: 'bg-gray-100' };
  }
};

// Utility for Activity Stages
const getActivityType = (type) => {
  switch (type) {
    case 'call': return { Icon: IconPhone, color: 'text-red-500', bgColor: 'bg-red-100' };
    case 'qualification': return { Icon: IconBookmark, color: 'text-green-600', bgColor: 'bg-green-100' };
    case 'meeting': default: return { Icon: IconCalendar, color: 'text-blue-500', bgColor: 'bg-blue-100' };
  }
};

// Utility for Priority Tags
const getPriorityClasses = (priority) => {
  switch (priority.toUpperCase()) {
    case 'HIGH': return { text: 'text-red-700', bg: 'bg-red-100' };
    case 'LOW': return { text: 'text-blue-700', bg: 'bg-blue-100' };
    default: return { text: 'text-gray-700', bg: 'bg-gray-100' };
  }
};

// ... [TopBar component remains unchanged] ...
const TopBar = ({ searchQuery, onSearchChange, searchResults, onSearchResultClick }) => {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const actionIcons = [
    { icon: IconUsers, label: "Account" },
    { icon: IconUser, label: "Contact" },
    { icon: IconFiUserPlus, label: "Leads" },
    { icon: IconFiBriefcase, label: "Deals" },
    { icon: IconFiFileText, label: "Quotes" },
    { icon: IconFiTarget, label: "Target" },
    { icon: IconFiCircleCheck, label: "Task" },
    { icon: IconFiCalendar, label: "Meeting" },
    { icon: IconFiPhoneCall, label: "Call" },
    { icon: IconFiClipboard, label: "Audit" },
    { icon: IconLuMapPin, label: "Territory" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    onSearchChange(e.target.value);
    setShowResults(e.target.value.trim().length > 0);
  };

  const handleResultClick = (result) => {
    if (onSearchResultClick) {
      onSearchResultClick(result);
    }
    setShowResults(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 flex flex-col items-start space-y-4 w-full">
      <div className="w-full flex justify-center relative" ref={searchRef}>
        <div className="flex items-center border border-gray-300 rounded-lg lg:mt-3 px-4 py-2 w-full max-w-md md:max-w-2xl lg:max-w-2xl focus-within:ring-2 focus-within:ring-blue-500 transition duration-150">
          <IconSearch size={20} className="text-gray-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search Leads, Deals, or Accounts..."
            className="focus:outline-none text-base w-full"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.trim().length > 0 && setShowResults(true)}
          />
        </div>

        {showResults && Array.isArray(searchResults) && searchResults.length > 0 && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-full max-w-md md:max-w-lg lg:max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition duration-150"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{result.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{result.type}</p>
                    {result.details && (
                      <p className="text-xs text-gray-400 mt-1">{result.details}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${result.type === 'Lead' ? 'bg-blue-100 text-blue-600' :
                    result.type === 'Deal' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                    {result.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {showResults && searchQuery.trim().length > 0 && (!Array.isArray(searchResults) || searchResults.length === 0) && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-full max-w-md md:max-w-lg lg:max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4 text-center text-sm text-gray-500">
            No results found
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto lg:overflow-x-hidden scroll-smooth flex justify-center">
        <div className="flex flex-nowrap space-x-3 lg:space-x-4 xl:space-x-3 px-2 sm:px-0">
          {actionIcons.map((item, index) => (
            <div key={index} className="relative flex-shrink-0 group">
              <button
                className="p-3 text-gray-500 hover:text-gray-900 transition duration-150 rounded-full hover:bg-gray-100 focus:outline-none cursor-pointer"
                aria-label={item.label}
                onClick={() => {
                  switch (item.label) {
                    case "Account": navigate("/admin/accounts"); break;
                    case "Contact": navigate("/admin/contacts"); break;
                    case "Leads": navigate("/admin/leads"); break;
                    case "Deals": navigate("/admin/deals"); break;
                    case "Quotes": navigate("/admin/quotes"); break;
                    case "Target": navigate("/admin/targets"); break;
                    case "Task": navigate("/admin/tasks"); break;
                    case "Meeting": navigate("/admin/meetings"); break;
                    case "Call": navigate("/admin/calls"); break;
                    case "Audit": navigate("/admin/audit"); break;
                    case "Territory": navigate("/admin/territory"); break;
                    default: console.log(`Clicked ${item.label}`);
                  }
                }}
              >
                <item.icon size={24} className="lg:scale-95" />
              </button>
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-700 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 pointer-events-none z-20 shadow-md">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ... [AuditLogItem and RecentLogsCard remain unchanged] ...
const AuditLogItem = ({ action, description, entity_type, entity_name, timestamp }) => {
  const navigate = useNavigate();

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const displayAction = action || description || "Action";
  const displayTarget = entity_name || entity_type || "System";
  const timeAgo = formatTimeAgo(timestamp);

  return (
    <li
      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 -mx-2 rounded-md"
      onClick={() => navigate('/admin/audit')}
    >
      <p className="text-sm text-gray-800 flex-grow font-medium">
        {displayAction} <span className="text-gray-500 italic text-xs">({displayTarget})</span>
      </p>
      <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
        {timeAgo}
      </span>
    </li>
  );
};

const RecentLogsCard = ({ logs, loading }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md font-semibold text-gray-800">Recent Logs</h2>
        <span className="text-sm text-blue-500 cursor-pointer hover:underline flex items-center space-x-1 font-medium"
          onClick={() => navigate('/admin/audit')}>
          <span>See All</span>
          <IconArrowRight size={14} className="transform -rotate-45" />
        </span>
      </div>
      {logs && logs.length > 0 ? (
        <ul className="space-y-1">
          {logs.slice(0, 3).map((log, index) => (
            <AuditLogItem key={index} {...log} />
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500 py-4">No recent logs</div>
      )}
    </div>
  );
};

// ... [MetricCard remains unchanged] ...
const MetricCard = ({ icon: Icon, title, value, color, bgColor, loading, onClick }) => (
  <div
    className="flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300"
    onClick={onClick || (() => console.log(`Clicked metric card: ${title}`))}
  >
    <div className={`p-3 rounded-full ${bgColor} ${color} mr-4`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value || 0}</p>
    </div>
  </div>
);

// ... [RevenueChart remains unchanged] ...
const RevenueChart = ({ revenueData, loading }) => {
  const navigate = useNavigate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const chartData = useMemo(() => {
    if (!revenueData || revenueData.length === 0) {
      const now = new Date();
      const currentMonth = now.getMonth();
      const labels = [];
      const revenues = [];
      for (let monthIndex = 0; monthIndex <= currentMonth; monthIndex++) {
        labels.push(monthNames[monthIndex]);
        revenues.push(0);
      }
      return { labels, revenues, maxRevenue: 0 };
    }

    const monthlyRevenue = {};
    revenueData.forEach((deal) => {
      const closeDate = deal.close_date || deal.closeDate || null;
      const stage = deal.stage || '';
      const isClosedWon = stage.toUpperCase() === 'CLOSED_WON' || stage === 'CLOSED_WON';

      let amount = deal.amount;
      if (amount && typeof amount === 'object' && amount.toString) {
        amount = parseFloat(amount.toString());
      } else {
        amount = parseFloat(amount) || 0;
      }
      const hasAmount = amount > 0;

      if ((closeDate && closeDate !== null) && isClosedWon && hasAmount) {
        try {
          let date = new Date(closeDate);
          if (isNaN(date.getTime())) {
            const dateStr = String(closeDate).split('T')[0];
            date = new Date(dateStr + 'T00:00:00');
          }
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            if (!monthlyRevenue[monthKey]) {
              monthlyRevenue[monthKey] = 0;
            }
            monthlyRevenue[monthKey] += amount;
          }
        } catch (error) {
          console.error('Error parsing deal date:', closeDate, error);
        }
      }
    });

    const revenueYears = Object.keys(monthlyRevenue).map(key => parseInt(key.split('-')[0]));
    const uniqueYears = revenueYears.length > 0 ? [...new Set(revenueYears)].sort() : [];
    const currentYear = new Date().getFullYear();

    const labels = [];
    const revenues = [];

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`;
      labels.push(monthNames[monthIndex]);
      revenues.push(monthlyRevenue[monthKey] || 0);
    }

    if (uniqueYears.length > 0) {
      const maxYear = Math.max(...uniqueYears);
      if (maxYear > currentYear) {
        for (let year = currentYear + 1; year <= maxYear; year++) {
          for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
            const revenue = monthlyRevenue[monthKey] || 0;
            labels.push(`${monthNames[monthIndex]} ${year}`);
            revenues.push(revenue);
          }
        }
      }
    }

    const maxRevenue = Math.max(...revenues, 1);
    return { labels, revenues, maxRevenue };
  }, [revenueData]);

  const xAxisData = chartData.labels;
  const yAxisData = chartData.revenues;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Revenue Overview</h2>
        <span className="text-sm text-blue-500 cursor-pointer hover:underline flex items-center space-x-1 font-medium"
          onClick={() => navigate('/admin/deals')}>
          <span>See All</span>
          <IconArrowRight size={14} className="transform -rotate-45" />
        </span>
      </div>
      <div className="h-80 relative flex-1 flex items-center justify-center p-6">
        <div className="w-full h-full flex items-center justify-start lg:justify-center overflow-x-auto sm:overflow-x-hidden">
          {xAxisData && xAxisData.length > 0 && yAxisData && yAxisData.length > 0 ? (
            <LineChart
              xAxis={[{
                data: xAxisData,
                scaleType: 'point',
              }]}
              yAxis={[{
                valueFormatter: (value) => {
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(0)}k`;
                  }
                  return value.toString();
                },
              }]}
              series={[{
                data: yAxisData,
                showMark: true,
                area: true,
              }]}
              height={320}
              width={undefined}
              grid={{ vertical: true, horizontal: true }}
              margin={{ top: 40, right: 40, bottom: 50, left: 50 }}
              sx={{
                width: '100%',
                maxWidth: '100%',
                minWidth: { xs: 600, lg: '100%' },
              }}

            />
          ) : (
            <div className="text-center text-gray-500">
              <p className="text-sm">No revenue data available</p>
              <p className="text-xs mt-2">Closed won deals with close dates will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ UPDATED: Now calculates Weighted Forecast (Business View)
// ✅ UPDATED: Includes "Leads" at the top (Top of Funnel)
const SalesFunnel = ({ pipelineData, loading, currencySymbol, leadCount = 0 }) => {
  const navigate = useNavigate();

  const allStages = [
    { key: 'PROSPECTING', label: 'Prospecting', color: 'bg-blue-500', isOutcome: false },
    { key: 'QUALIFICATION', label: 'Qualification', color: 'bg-indigo-500', isOutcome: false },
    { key: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-500', isOutcome: false },
    { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-pink-500', isOutcome: false },
    { key: 'CLOSED_WON', label: 'Closed Won', color: 'bg-emerald-500', isOutcome: true },
    { key: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-red-500', isOutcome: true },
  ];

  const { activeStages, outcomeStages, totalValue, totalWeightedValue, totalDeals, maxCount } = useMemo(() => {
    const counts = {};
    const values = {};
    const weightedValues = {};

    allStages.forEach(s => {
      counts[s.key] = 0;
      values[s.key] = 0;
      weightedValues[s.key] = 0;
    });

    if (pipelineData) {
      pipelineData.forEach(deal => {
        const stage = (deal.stage || '').toUpperCase();
        if (counts[stage] !== undefined) {
          counts[stage]++;
          const amount = parseFloat(deal.amount || 0);
          values[stage] += amount;
          const prob = deal.probability || 0;
          weightedValues[stage] += (amount * (prob / 100));
        }
      });
    }

    // ✅ Include Leads in the Max Count calculation so the funnel scales correctly
    const maxCount = Math.max(...Object.values(counts), leadCount, 1);

    const processStage = (stage, index, array) => {
      const count = counts[stage.key];
      // If first stage, compare to Leads. Otherwise compare to previous stage.
      const prevCount = index === 0 ? leadCount : counts[array[index - 1].key];

      let conversionLabel = "—";
      let conversionColor = "text-gray-300";

      if (prevCount > 0) {
        const rate = ((count / prevCount) * 100);
        conversionLabel = `${rate.toFixed(0)}%`;
        conversionColor = rate >= 50 ? "text-green-600" : "text-gray-400";
      }

      const widthPercent = (count / maxCount) * 100;
      const isEmpty = count === 0;

      return {
        ...stage,
        count,
        value: values[stage.key],
        weightedValue: weightedValues[stage.key],
        width: isEmpty ? "100%" : `${Math.max(widthPercent, 12)}%`,
        conversionLabel,
        conversionColor,
        isEmpty,
        prevCount,
        showConnector: true // Always show connector in main flow
      };
    };

    const active = allStages.filter(s => !s.isOutcome).map(processStage);
    const outcomes = allStages.filter(s => s.isOutcome).map((s) => ({
      ...s,
      count: counts[s.key],
      value: values[s.key],
      isEmpty: counts[s.key] === 0,
      width: counts[s.key] === 0 ? "100%" : `${Math.max((counts[s.key] / maxCount) * 100, 12)}%`
    }));

    const totalValue = Object.values(values).reduce((a, b) => a + b, 0);
    const totalWeightedValue = Object.values(weightedValues).reduce((a, b) => a + b, 0);
    const totalDeals = Object.values(counts).reduce((a, b) => a + b, 0);

    return { activeStages: active, outcomeStages: outcomes, totalValue, totalWeightedValue, totalDeals, maxCount };

  }, [pipelineData, leadCount]);

  // Lead Width Calculation
  const leadWidth = maxCount > 0 ? (leadCount / maxCount) * 100 : 100;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col font-inter border border-gray-100">

      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Overall Sales Funnel</h2>
          <p className="text-xs text-gray-400 mt-1">Leads <IconArrowRight className="inline mx-1" size={10} /> Deals <IconArrowRight className="inline mx-1" size={10} /> Revenue</p>
        </div>
        <button onClick={() => navigate('/admin/deals')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
          <IconArrowRight size={18} className="transform -rotate-45" />
        </button>
      </div>

      <div className="flex-col items-center justify-center space-y-0">

        {/* 🆕 TOP OF FUNNEL: LEADS */}
        <div className="w-full flex items-center group cursor-pointer py-1.5" onClick={() => navigate('/admin/leads')}>
          <div className="w-28 text-right pr-4 flex-shrink-0">
            <p className="text-xs font-bold text-blue-600">Total Leads</p>
          </div>
          <div className="flex-grow flex justify-center relative h-9">
            <div
              className="h-full rounded-md flex items-center justify-center text-xs font-bold relative transition-all duration-500 bg-blue-100 text-blue-700 hover:bg-blue-200"
              style={{ width: `${Math.max(leadWidth, 12)}%` }}
            >
              <span>{leadCount}</span>
              {/* Info Tooltip: Just Name & Number */}
              <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                Potential Clients (Not Contacted)
              </div>
            </div>
          </div>
          <div className="w-28 pl-4 flex-shrink-0 text-left">
            <p className="text-xs text-gray-400">Target</p>
          </div>
        </div>

        {/* MIDDLE OF FUNNEL: DEALS */}
        {activeStages.map((stage) => (
          <React.Fragment key={stage.key}>
            {/* Connector */}
            <div className="h-5 w-full flex items-center justify-center relative my-0.5">
              <div className="absolute h-full w-px bg-gray-100 z-0"></div>
              {/* Conversion logic handles Lead -> Prospecting now */}
              <div className={`z-10 px-2 py-0.5 rounded-full text-[10px] font-bold border border-gray-200 bg-white shadow-sm ${stage.conversionColor}`}>
                {stage.conversionLabel}
              </div>
            </div>

            <div className="w-full flex items-center group cursor-pointer py-1.5" onClick={() => navigate('/admin/deals')}>
              <div className="w-28 text-right pr-4 flex-shrink-0">
                <p className={`text-xs font-semibold transition-colors ${stage.isEmpty ? 'text-gray-300' : 'text-gray-600 group-hover:text-blue-600'}`}>
                  {stage.label}
                </p>
              </div>

              <div className="flex-grow flex justify-center relative h-9">
                <div
                  className={`h-full rounded-md flex items-center justify-center text-xs font-bold relative transition-all duration-500 ${stage.isEmpty ? 'bg-gray-50 text-gray-300 border border-dashed border-gray-200' : `${stage.color} text-white shadow-sm hover:brightness-110 hover:shadow-md`}`}
                  style={{ width: stage.isEmpty ? '60%' : stage.width }}
                >
                  {stage.isEmpty ? <span className="text-[10px] font-normal opacity-50">0</span> : <span>{stage.count}</span>}

                  {/* Info Tooltip: Potential Value & Probability */}
                  <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    <div>Total: {formatCurrency(stage.value, currencySymbol)}</div>
                    <div className="text-gray-400 text-[10px]">Forecast: {formatCurrency(stage.weightedValue, currencySymbol)}</div>
                  </div>
                </div>
              </div>

              <div className="w-28 pl-4 flex-shrink-0 text-left">
                <p className={`text-xs font-medium ${stage.isEmpty ? 'text-gray-200' : 'text-gray-500'}`}>
                  {stage.isEmpty ? "—" : formatCurrency(stage.value, currencySymbol)}
                </p>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200 border-dashed"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Final Outcome
          </span>
        </div>
      </div>

      {/* BOTTOM OF FUNNEL: CLOSED */}
      <div className="flex-col items-center justify-center space-y-2">
        {outcomeStages.map((stage) => (
          <div key={stage.key} className="w-full flex items-center group cursor-pointer py-1" onClick={() => navigate('/admin/deals')}>
            <div className="w-28 text-right pr-4 flex-shrink-0">
              <p className="text-xs font-bold text-gray-700">{stage.label}</p>
            </div>
            <div className="flex-grow flex justify-center relative h-9">
              <div
                className={`h-full rounded-md flex items-center justify-center text-xs font-bold relative transition-all duration-500 ${stage.isEmpty ? 'bg-gray-50 text-gray-300 border border-dashed border-gray-200' : `${stage.color} text-white shadow-sm hover:brightness-110 hover:shadow-md`}`}
                style={{ width: stage.isEmpty ? '60%' : stage.width }}
              >
                {stage.isEmpty ? <span className="text-[10px] font-normal opacity-50">0</span> : <span>{stage.count}</span>}

                {/* Info Tooltip: Final Revenue */}
                <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                  {stage.isEmpty ? "No deals finalized" : `Booked: ${formatCurrency(stage.value, currencySymbol)}`}
                </div>
              </div>
            </div>
            <div className="w-28 pl-4 flex-shrink-0 text-left">
              <p className={`text-xs font-medium ${stage.isEmpty ? 'text-gray-200' : 'text-gray-700'}`}>
                {stage.isEmpty ? "—" : formatCurrency(stage.value, currencySymbol)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Summary */}
      <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between mt-4">
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Pipeline</span>
          <p className="text-sm font-bold text-gray-800 mt-0.5">
            {formatCurrency(totalValue, currencySymbol)}
          </p>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-blue-500 uppercase font-bold tracking-wider">Weighted Forecast</span>
          <p className="text-sm font-bold text-blue-600 mt-0.5">
            {formatCurrency(totalWeightedValue, currencySymbol)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Deals</span>
          <p className="text-sm font-bold text-gray-800 mt-0.5">{totalDeals}</p>
        </div>
      </div>
    </div>
  );
};
const SalesPipeline = ({ pipelineData, loading, currencySymbol }) => {
  const navigate = useNavigate();

  const getStageConfig = (stage) => {
    const stageUpper = (stage || '').toUpperCase();
    const configMap = {
      'PROSPECTING': { name: 'Prospecting', color: 'bg-blue-500' },
      'QUALIFICATION': { name: 'Qualification', color: 'bg-yellow-500' },
      'PROPOSAL': { name: 'Proposal', color: 'bg-orange-500' },
      'NEGOTIATION': { name: 'Negotiation', color: 'bg-purple-500' },
      'CLOSED_WON': { name: 'Closed Won', color: 'bg-green-500' },
      'CLOSED_LOST': { name: 'Closed Lost', color: 'bg-red-500' },
    };

    if (configMap[stageUpper]) {
      return configMap[stageUpper];
    }

    const colors = ['bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500'];
    const colorIndex = Math.abs(stageUpper.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
    return {
      name: stage || 'Unknown',
      color: colors[colorIndex]
    };
  };

  const calculatePipeline = () => {
    if (!pipelineData || pipelineData.length === 0) {
      const defaultStages = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
      return defaultStages.map(stage => {
        const config = getStageConfig(stage);
        return {
          stage: config.name,
          value: 0,
          deals: 0,
          color: config.color
        };
      });
    }

    const stageGroups = {};
    pipelineData.forEach(deal => {
      const stage = deal.stage || 'PROSPECTING';
      if (!stageGroups[stage]) {
        stageGroups[stage] = { deals: 0, value: 0 };
      }
      stageGroups[stage].deals += 1;
      stageGroups[stage].value += parseFloat(deal.amount || 0);
    });

    const maxValue = Math.max(...Object.values(stageGroups).map(g => g.value), 1);

    const orderedStages = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    const result = [];

    orderedStages.forEach(stage => {
      const config = getStageConfig(stage);
      const group = stageGroups[stage] || { deals: 0, value: 0 };
      result.push({
        stage: config.name,
        value: group.value,
        deals: group.deals,
        color: config.color,
        percentage: maxValue > 0 ? (group.value / maxValue) * 100 : 0
      });
    });

    return result;
  };

  const pipeline = calculatePipeline();

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Pipeline Stages</h2>
        <span className="text-sm text-blue-500 cursor-pointer hover:underline"
          onClick={() => navigate('/admin/deals')}>See All</span>
      </div>
      <div className="space-y-4 flex-grow">
        {pipeline.slice(0, 6).map((item) => (
          <div
            key={item.stage}
            className="flex flex-col cursor-pointer hover:opacity-85 transition duration-150"
            onClick={() => navigate('/admin/deals')}
          >
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="font-medium text-gray-700">{item.stage}</span>
              {/* ✅ Use Dynamic formatCurrency */}
              <span className="font-semibold text-gray-800">{formatCurrency(item.value, currencySymbol)}</span>
            </div>
            <div className="relative h-2 rounded-full bg-gray-200">
              <div
                className={`absolute top-0 left-0 h-full rounded-full ${item.color}`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{item.deals} Deals</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ... [ListCard, LeadItem, DealItem, ActivityItem remain unchanged] ...
const ListCard = ({ title, items, children, onSeeAll }) => {
  const navigate = useNavigate();

  const handleSeeAll = () => {
    if (onSeeAll) {
      onSeeAll();
    } else {
      const routeMap = {
        'Latest Leads': '/admin/leads',
        'Latest Deals': '/admin/deals',
        'Upcoming Activities': '/admin/tasks'
      };
      if (routeMap[title]) {
        navigate(routeMap[title]);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <span className="text-sm text-blue-500 cursor-pointer hover:underline"
          onClick={handleSeeAll}>See All</span>
      </div>
      {children}
    </div>
  );
};

const LeadItem = ({ first_name, last_name, company_name, source, created_at, id }) => {
  const navigate = useNavigate();
  const { text, bg } = getLeadSourceClasses(source || 'Website');

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const name = `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown';
  const company = company_name || 'Unknown Company';
  const date = formatDate(created_at);

  return (
    <div
      className="py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 -mx-2 rounded-md"
      onClick={() => id && navigate(`/admin/leads/${id}`)}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-gray-800">{name}</p>
          <p className="text-xs text-gray-500">{company}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{date}</p>
          <span className={`inline-block mt-1 text-xs font-medium ${text} ${bg} px-2 py-0.5 rounded-full`}>{source || 'Website'}</span>
        </div>
      </div>
    </div>
  );
};

// ✅ UPDATED: Now shows "Stuck" warnings based on stage_updated_at
const DealItem = ({ name, amount, account, stage, created_at, stage_updated_at, id, previousAmount, currencySymbol }) => {
  const navigate = useNavigate();

  const stageMap = {
    'PROSPECTING': 'Prospecting',
    'QUALIFICATION': 'Qualification',
    'PROPOSAL': 'Proposal',
    'NEGOTIATION': 'Negotiation',
    'CLOSED_WON': 'Closed Won',
    'CLOSED_LOST': 'Closed Lost',
  };

  const displayStage = stageMap[stage] || stage || 'Unknown';
  const { text, bg } = getStatusClasses(displayStage);

  // 🆕 Bottleneck Logic
  const daysStuck = getDaysStuck(stage_updated_at || created_at);
  const isBottleneck = daysStuck > 30 && stage !== 'CLOSED_WON' && stage !== 'CLOSED_LOST';

  const currentAmount = parseFloat(amount || 0);
  const trend = previousAmount ? (currentAmount >= previousAmount ? 'up' : 'down') : 'up';
  const TrendIcon = trend === 'up' ? IconTrendUp : IconTrendDown;
  const trendColor = trend === 'up' ? 'text-green-400' : 'text-red-400';

  const companyName = account?.name || 'Unknown Company';

  return (
    <div
      className="py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 -mx-2 rounded-md"
      onClick={() => id && navigate(`/admin/deals/info?id=${id}`)}
    >
      <div className="flex justify-between items-center">

        <div className="flex-shrink">
          <div className="flex items-center space-x-2">
            <p className="font-semibold text-sm text-gray-900">{name || 'Unnamed Deal'}</p>
            {/* 🆕 Bottleneck Warning */}
            {isBottleneck && (
              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200 font-bold flex items-center">
                <IconClock size={10} className="mr-1" /> {daysStuck} days stuck
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{companyName}</p>

          <div className="mt-1 flex items-center space-x-2">
            <span className={`inline-block text-xs font-medium ${text} ${bg} px-2 py-0.5 rounded-full`}>
              {displayStage}
            </span>
          </div>
        </div>

        <div className="text-right flex flex-col items-end flex-shrink-0">
          <p className="text-md font-bold text-gray-800">{formatCurrency(currentAmount, currencySymbol)}</p>
          <TrendIcon size={16} className={`${trendColor} mt-1`} />
        </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ type, title, assignedTo, dueDate, scheduledDate, priority, id, activityType, fullData }) => {
  const navigate = useNavigate();

  const activityTypeMap = {
    'Call': 'call',
    'Meeting': 'meeting',
    'Task': 'qualification',
  };

  const finalType = activityType || activityTypeMap[type] || 'meeting';
  const { Icon, color, bgColor } = getActivityType(finalType);
  const { text, bg } = getPriorityClasses(priority || 'MEDIUM');

  const formatDateTime = (dateString) => {
    if (!dateString) return "No date set";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays === 1) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays === -1) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  const dateTime = dueDate || scheduledDate;
  const timeDisplay = formatDateTime(dateTime);
  const assignedName = assignedTo || 'Unassigned';

  const handleClick = () => {
    if (id) {
      if (fullData) {
        if (finalType === 'call') {
          sessionStorage.setItem('callDetailData', JSON.stringify(fullData));
          navigate(`/admin/calls/info?id=${id}`);
        } else if (finalType === 'meeting') {
          sessionStorage.setItem('meetingDetailData', JSON.stringify(fullData));
          navigate(`/admin/meetings/info?id=${id}`);
        } else {
          navigate('/admin/tasks');
        }
      } else {
        if (finalType === 'call') {
          navigate(`/admin/calls/info?id=${id}`);
        } else if (finalType === 'meeting') {
          navigate(`/admin/meetings/info?id=${id}`);
        } else {
          navigate('/admin/tasks');
        }
      }
    }
  };

  return (
    <div
      className="flex items-start py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 -mx-2 rounded-md"
      onClick={handleClick}
    >
      <div className={`p-2 rounded-lg ${bgColor} mr-3 flex-shrink-0 mt-1`}>
        <Icon size={20} className={`${color}`} />
      </div>

      <div className="flex-grow">
        <p className="font-medium text-gray-800 flex items-center mb-1">
          <span className="text-xl leading-none mr-2">•</span>
          {title || 'Untitled Activity'}
        </p>

        <div className="space-y-1 text-xs text-gray-500">
          <p className="flex items-center">
            <IconClock size={14} className="mr-1.5 text-gray-400" />
            {timeDisplay}
          </p>
          <p className="flex items-center">
            <IconUser size={14} className="mr-1.5 text-gray-400" />
            Assigned to: {assignedName}
          </p>
        </div>
      </div>

      <span className={`inline-block text-xs font-medium ${text} ${bg} px-2 py-0.5 rounded-full flex-shrink-0 self-center ml-4`}>
        {(priority || 'MEDIUM').toUpperCase()}
      </span>

    </div>
  );
};

// --- Main AdminDashboard Component ---

const AdminDashboard = () => {
  const navigate = useNavigate();
  // ✅ Extract user to get currency
  const { user } = useFetchUser();

  // ✅ Determine currency symbol
  const currencySymbol = user?.company?.currency || "₱";

  const [metrics, setMetrics] = useState({
    activeLeads: 0,
    totalDeals: 0,
    activeAccounts: 0,
    overdueTasks: 0,
  });
  const [latestLeads, setLatestLeads] = useState([]);
  const [latestDeals, setLatestDeals] = useState([]);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [salesPipeline, setSalesPipeline] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [allLeads, setAllLeads] = useState([]);
  const [allDeals, setAllDeals] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const refreshIntervalRef = useRef(null);
  const wsRef = useRef(null);

  const searchResults = useMemo(() => {
    try {
      if (!searchQuery.trim()) return [];

      const query = searchQuery.toLowerCase().trim();
      const results = [];

      if (Array.isArray(allLeads)) {
        allLeads.forEach(lead => {
          const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim().toLowerCase();
          const company = (lead.company_name || '').toLowerCase();
          const email = (lead.email || '').toLowerCase();
          const phone = (lead.phone || '').toLowerCase();

          if (name.includes(query) || company.includes(query) || email.includes(query) || phone.includes(query)) {
            results.push({
              id: lead.id,
              name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unnamed Lead',
              type: 'Lead',
              details: lead.company_name || 'No company',
              route: `/admin/leads/${lead.id}`
            });
          }
        });
      }

      if (Array.isArray(allDeals)) {
        allDeals.forEach(deal => {
          const name = (deal.name || '').toLowerCase();
          const accountName = (deal.account?.name || '').toLowerCase();
          const description = (deal.description || '').toLowerCase();

          if (name.includes(query) || accountName.includes(query) || description.includes(query)) {
            results.push({
              id: deal.id,
              name: deal.name || 'Unnamed Deal',
              type: 'Deal',
              details: deal.account?.name || 'No account',
              route: `/admin/deals/info?id=${deal.id}`
            });
          }
        });
      }

      if (Array.isArray(allAccounts)) {
        allAccounts.forEach(account => {
          const name = (account.name || '').toLowerCase();
          const email = (account.email || '').toLowerCase();
          const phone = (account.phone || '').toLowerCase();
          const website = (account.website || '').toLowerCase();

          if (name.includes(query) || email.includes(query) || phone.includes(query) || website.includes(query)) {
            results.push({
              id: account.id,
              name: account.name || 'Unnamed Account',
              type: 'Account',
              details: account.email || account.phone || 'No contact info',
              route: `/admin/accounts`
            });
          }
        });
      }

      return results.slice(0, 10);
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  }, [searchQuery, allLeads, allDeals, allAccounts]);

  const handleSearchResultClick = (result) => {
    if (result.route) {
      navigate(result.route);
      setSearchQuery('');
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        leadsRes,
        dealsRes,
        accountsRes,
        tasksRes,
        meetingsRes,
        callsRes,
        logsRes
      ] = await Promise.all([
        api.get('/leads/admin/getLeads').catch((err) => {
          console.error('Error fetching leads:', err);
          return { data: [] };
        }),
        api.get('/deals/admin/fetch-all').catch((err) => {
          console.error('Error fetching deals:', err);
          return { data: [] };
        }),
        api.get('/accounts/admin/fetch-all').catch((err) => {
          console.error('Error fetching accounts:', err);
          return { data: [] };
        }),
        api.get('/tasks/all').catch((err) => {
          console.error('Error fetching tasks:', err);
          return { data: [] };
        }),
        api.get('/meetings/admin/fetch-all').catch((err) => {
          console.error('Error fetching meetings:', err);
          return { data: [] };
        }),
        api.get('/calls/admin/fetch-all').catch((err) => {
          console.error('Error fetching calls:', err);
          return { data: [] };
        }),
        api.get('/logs/read-all').catch((err) => {
          console.error('Error fetching logs:', err);
          return { data: [] };
        })
      ]);

      const leads = Array.isArray(leadsRes.data) ? leadsRes.data : [];
      const deals = Array.isArray(dealsRes.data) ? dealsRes.data : [];
      const accounts = Array.isArray(accountsRes.data) ? accountsRes.data : [];
      const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      const meetings = Array.isArray(meetingsRes.data) ? meetingsRes.data : [];
      const calls = Array.isArray(callsRes.data) ? callsRes.data : [];
      const logs = Array.isArray(logsRes.data) ? logsRes.data : [];

      setAllLeads(leads);
      setAllDeals(deals);
      setAllAccounts(accounts);

      const activeLeads = leads.filter(lead =>
        lead.status && !['Lost', 'Converted'].includes(lead.status)
      ).length;

      const overdueTasks = tasks.filter(task => {
        if (!task.dueDate || task.status === 'Completed') return false;
        return new Date(task.dueDate) < new Date();
      }).length;

      setMetrics({
        activeLeads,
        totalDeals: deals.length,
        activeAccounts: accounts.length,
        overdueTasks,
      });

      const sortedLeads = [...leads]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5);
      setLatestLeads(sortedLeads);

      const sortedDeals = [...deals]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5);
      setLatestDeals(sortedDeals);

      const now = new Date();
      const activities = [];

      calls.forEach(call => {
        const callDate = call.due_date || call.call_time;
        const status = (call.status || '').toUpperCase();

        if (callDate) {
          const isExcluded = status === 'COMPLETED' || status === 'MISSED' || status === 'NOT_HELD' || status === 'HELD';

          if (!isExcluded) {
            activities.push({
              type: 'Call',
              title: call.subject || 'Untitled Call',
              assignedTo: call.assigned_to || (call.call_assign_to ?
                `${call.call_assign_to.first_name || ''} ${call.call_assign_to.last_name || ''}`.trim() :
                'Unassigned'),
              scheduledDate: callDate,
              priority: (call.priority || 'MEDIUM').toUpperCase(),
              id: call.id,
              activityType: 'call',
              fullData: call
            });
          }
        }
      });

      meetings.forEach(meeting => {
        const meetingDate = meeting.dueDate || meeting.start_time;
        const status = (meeting.status || '').toUpperCase();

        if (meetingDate) {
          const isExcluded = status === 'COMPLETED' || status === 'CANCELLED' || status === 'DONE';

          if (!isExcluded) {
            activities.push({
              type: 'Meeting',
              title: meeting.subject || meeting.activity || 'Untitled Meeting',
              assignedTo: meeting.assignedTo || (meeting.meet_assign_to ?
                `${meeting.meet_assign_to.first_name || ''} ${meeting.meet_assign_to.last_name || ''}`.trim() :
                'Unassigned'),
              scheduledDate: meetingDate,
              priority: (meeting.priority || 'MEDIUM').toUpperCase(),
              id: meeting.id,
              activityType: 'meeting',
              fullData: meeting
            });
          }
        }
      });

      const priorityOrder = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      const sortedActivities = activities
        .sort((a, b) => {
          const priorityA = priorityOrder[a.priority] || 3;
          const priorityB = priorityOrder[b.priority] || 3;
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          const dateA = new Date(a.scheduledDate || 0);
          const dateB = new Date(b.scheduledDate || 0);
          return dateA - dateB;
        })
        .slice(0, 5);
      setUpcomingActivities(sortedActivities);

      setSalesPipeline(deals);

      const closedWonDeals = deals.filter(d => {
        const stage = (d.stage || '').toUpperCase();
        return stage === 'CLOSED_WON';
      });

      if (closedWonDeals.length > 0) {
        closedWonDeals.forEach((deal, idx) => {
          let amountValue = deal.amount;
          if (amountValue && typeof amountValue === 'object') {
            if (amountValue.toString) {
              amountValue = parseFloat(amountValue.toString());
            } else {
              amountValue = parseFloat(amountValue);
            }
          } else {
            amountValue = parseFloat(amountValue) || 0;
          }
        });
      }

      setRevenueData(deals);

      const sortedLogs = [...logs]
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      setAuditLogs(sortedLogs);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Dashboard | Sari-Sari CRM";
    fetchAllData();

    refreshIntervalRef.current = setInterval(() => {
      fetchAllData();
      setLastUpdate(new Date());
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchAllData]);

  useEffect(() => {
    if (!user || !user.id) return;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname === 'localhost'
        ? 'localhost:8000'
        : window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/ws/notifications?user_id=${user.id}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const notification = JSON.parse(event.data);

            if (notification.event) {
              const refreshEvents = [
                'new_task', 'task_updated', 'new_lead', 'lead_updated',
                'new_deal', 'deal_updated', 'new_account', 'account_updated',
                'new_meeting', 'meeting_updated', 'new_call', 'call_updated'
              ];

              if (refreshEvents.includes(notification.event)) {
                fetchAllData();
                setLastUpdate(new Date());
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          if (reconnectAttempts === 0) {
            console.warn('⚠️ WebSocket connection unavailable (this is optional)');
          }
        };

        ws.onclose = () => {
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            reconnectTimeout = setTimeout(() => {
              if (user && user.id) {
                connectWebSocket();
              }
            }, 5000);
          }
        };
      } catch (error) {
        console.warn('⚠️ WebSocket not available (optional feature)');
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, fetchAllData]);

  const metricsConfig = [
    {
      icon: IconUsers,
      title: "Active Leads",
      value: metrics.activeLeads,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => navigate('/admin/leads')
    },
    {
      icon: IconDollarSign,
      title: "Total Deals",
      value: metrics.totalDeals,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      onClick: () => navigate('/admin/deals')
    },
    {
      icon: IconBuilding,
      title: "Active Account",
      value: metrics.activeAccounts,
      color: "text-green-600",
      bgColor: "bg-green-50",
      onClick: () => navigate('/admin/accounts')
    },
    {
      icon: IconClock,
      title: "Overdue Tasks",
      value: metrics.overdueTasks,
      color: "text-red-600",
      bgColor: "bg-red-50",
      onClick: () => navigate('/admin/tasks')
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-inter relative w-full">

      {loading && <LoadingSpinner />}

      <div className="max-w-screen-2xl mx-auto">

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* ROW 1: Top Bar & Metrics & Recent Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-9 flex flex-col space-y-4">
            <TopBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchResults={searchResults}
              onSearchResultClick={handleSearchResultClick}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {metricsConfig.map((metric) => (
                <MetricCard
                  key={metric.title}
                  {...metric}
                  loading={loading}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <RecentLogsCard logs={auditLogs} loading={loading} />
          </div>
        </div>

        {/* ROW 2: Revenue Chart (Wider) & Pipeline List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RevenueChart revenueData={revenueData} loading={loading} />
          </div>
          <div className="lg:col-span-1">
            <SalesPipeline pipelineData={salesPipeline} loading={loading} currencySymbol={currencySymbol} />
          </div>
        </div>

        {/* ROW 3: Sales Funnel (Full Width for Clarity) */}
        <div className="w-full mb-8">
          <SalesFunnel
            pipelineData={salesPipeline}
            loading={loading}
            currencySymbol={currencySymbol}
            // ✅ ADD THIS LINE:
            leadCount={metrics.activeLeads}
          />
        </div>

        {/* ROW 4: Detailed Lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ListCard title="Latest Leads">
            {latestLeads.length > 0 ? (
              latestLeads.map((lead, index) => (
                <LeadItem key={lead.id || index} {...lead} />
              ))
            ) : (
              <div className="text-sm text-gray-500 py-4 text-center">No leads found</div>
            )}
          </ListCard>

          <ListCard title="Latest Deals">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                <div className="text-sm text-gray-500">Loading deals...</div>
              </div>
            ) : latestDeals.length > 0 ? (
              latestDeals.map((deal, index) => (
                <DealItem
                  key={deal.id || index}
                  {...deal}
                  // ✅ Ensure this is passed down (it comes from {...deal} but explicit is safe)
                  stage_updated_at={deal.stage_updated_at}
                  currencySymbol={currencySymbol}
                />
              ))
            ) : (
              <div className="text-sm text-gray-500 py-4 text-center">No deals found</div>
            )}
          </ListCard>

          <ListCard title="Upcoming Activities">
            {upcomingActivities.length > 0 ? (
              upcomingActivities.map((activity, index) => (
                <ActivityItem key={activity.id || index} {...activity} />
              ))
            ) : (
              <div className="text-sm text-gray-500 py-4 text-center">No upcoming activities</div>
            )}
          </ListCard>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;