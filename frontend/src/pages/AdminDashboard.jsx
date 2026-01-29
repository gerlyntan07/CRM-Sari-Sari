import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import {
  FiSearch, FiUsers, FiDollarSign, FiUserPlus, FiClock, FiBriefcase, FiTarget, FiArrowUpRight, FiArrowDownRight,
  FiUser, FiCalendar, FiCheckCircle, FiFileText, FiPhone, FiList, FiBookmark, FiEdit, FiArrowRight, FiPhoneCall,
  FiClipboard
} from "react-icons/fi";
import { LuMapPin } from "react-icons/lu";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { FaHandshakeAngle } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { LineChart } from '@mui/x-charts/LineChart';
import api from '../api';
import useFetchUser from '../hooks/useFetchUser';
import LoadingSpinner from '../components/LoadingSpinner';

// --- NEW IMPORT ---
import FunnelWidget from '../components/FunnelWidget';

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

// Dynamic Currency Formatter
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

// ... [TopBar component] ...
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
      </div>

      <div className="w-full overflow-x-auto lg:overflow-x-hidden scroll-smooth flex justify-center">
        <div className="flex flex-nowrap space-x-3 lg:space-x-4 xl:space-x-3 px-2 sm:px-0">
          {actionIcons.map((item, index) => (
            <div key={index} className="relative flex-shrink-0 group">
              <button
                className="p-3 text-gray-500 hover:text-gray-900 transition duration-150 rounded-full hover:bg-gray-100 focus:outline-none cursor-pointer"
                aria-label={item.label}
                onClick={() => {
                  const routes = {
                    "Account": "/admin/accounts",
                    "Contact": "/admin/contacts",
                    "Leads": "/admin/leads",
                    "Deals": "/admin/deals",
                    "Quotes": "/admin/quotes",
                    "Target": "/admin/targets",
                    "Task": "/admin/tasks",
                    "Meeting": "/admin/meetings",
                    "Call": "/admin/calls",
                    "Audit": "/admin/audit",
                    "Territory": "/admin/territory"
                  };
                  if(routes[item.label]) navigate(routes[item.label]);
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
  const { user } = useFetchUser();
  const currencySymbol = user?.company?.currency || "₱";

  // --- NEW: State for Targets ---
  const [allTargets, setAllTargets] = useState([]);
  const [totalTarget, setTotalTarget] = useState(0);

  const [metrics, setMetrics] = useState({
    activeLeads: 0,
    totalDeals: 0,
    activeAccounts: 0,
    overdueTasks: 0,
  });
  const [latestLeads, setLatestLeads] = useState([]);
  const [latestDeals, setLatestDeals] = useState([]);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
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
        logsRes,
        targetsRes // --- NEW: Fetch Targets ---
      ] = await Promise.all([
        api.get('/leads/admin/getLeads').catch((err) => { console.error('Error fetching leads:', err); return { data: [] }; }),
        api.get('/deals/admin/fetch-all').catch((err) => { console.error('Error fetching deals:', err); return { data: [] }; }),
        api.get('/accounts/admin/fetch-all').catch((err) => { console.error('Error fetching accounts:', err); return { data: [] }; }),
        api.get('/tasks/all').catch((err) => { console.error('Error fetching tasks:', err); return { data: [] }; }),
        api.get('/meetings/admin/fetch-all').catch((err) => { console.error('Error fetching meetings:', err); return { data: [] }; }),
        api.get('/calls/admin/fetch-all').catch((err) => { console.error('Error fetching calls:', err); return { data: [] }; }),
        api.get('/logs/read-all').catch((err) => { console.error('Error fetching logs:', err); return { data: [] }; }),
        api.get('/targets/admin/fetch-all').catch((err) => { console.error('Error fetching targets:', err); return { data: [] }; }) // --- NEW API CALL ---
      ]);

      const leads = Array.isArray(leadsRes.data) ? leadsRes.data : [];
      const deals = Array.isArray(dealsRes.data) ? dealsRes.data : [];
      const accounts = Array.isArray(accountsRes.data) ? accountsRes.data : [];
      const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      const meetings = Array.isArray(meetingsRes.data) ? meetingsRes.data : [];
      const calls = Array.isArray(callsRes.data) ? callsRes.data : [];
      const logs = Array.isArray(logsRes.data) ? logsRes.data : [];
      const targets = Array.isArray(targetsRes.data) ? targetsRes.data : [];

      setAllLeads(leads);
      setAllDeals(deals);
      setAllAccounts(accounts);
      setAllTargets(targets); // --- Store Targets ---

      // --- Calculate Total Target ---
      const totalTargetVal = targets.reduce((sum, t) => sum + parseFloat(t.amount || t.value || 0), 0);
      setTotalTarget(totalTargetVal);

      setMetrics({
        activeLeads: leads.filter(lead => lead.status && !['Lost', 'Converted'].includes(lead.status)).length,
        totalDeals: deals.length,
        activeAccounts: accounts.length,
        overdueTasks: tasks.filter(task => {
          if (!task.dueDate || task.status === 'Completed') return false;
          return new Date(task.dueDate) < new Date();
        }).length,
      });

      const sortedLeads = [...leads].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);
      setLatestLeads(sortedLeads);

      const sortedDeals = [...deals].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);
      setLatestDeals(sortedDeals);

      const activities = [];
      calls.forEach(call => {
        const callDate = call.due_date || call.call_time;
        const status = (call.status || '').toUpperCase();
        if (callDate && !['COMPLETED', 'MISSED', 'NOT_HELD', 'HELD'].includes(status)) {
          activities.push({
            type: 'Call',
            title: call.subject || 'Untitled Call',
            assignedTo: call.assigned_to || (call.call_assign_to ? `${call.call_assign_to.first_name || ''} ${call.call_assign_to.last_name || ''}`.trim() : 'Unassigned'),
            scheduledDate: callDate,
            priority: (call.priority || 'MEDIUM').toUpperCase(),
            id: call.id,
            activityType: 'call',
            fullData: call
          });
        }
      });

      meetings.forEach(meeting => {
        const meetingDate = meeting.dueDate || meeting.start_time;
        const status = (meeting.status || '').toUpperCase();
        if (meetingDate && !['COMPLETED', 'CANCELLED', 'DONE'].includes(status)) {
          activities.push({
            type: 'Meeting',
            title: meeting.subject || meeting.activity || 'Untitled Meeting',
            assignedTo: meeting.assignedTo || (meeting.meet_assign_to ? `${meeting.meet_assign_to.first_name || ''} ${meeting.meet_assign_to.last_name || ''}`.trim() : 'Unassigned'),
            scheduledDate: meetingDate,
            priority: (meeting.priority || 'MEDIUM').toUpperCase(),
            id: meeting.id,
            activityType: 'meeting',
            fullData: meeting
          });
        }
      });

      const priorityOrder = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      const sortedActivities = activities.sort((a, b) => {
        const priorityA = priorityOrder[a.priority] || 3;
        const priorityB = priorityOrder[b.priority] || 3;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return new Date(a.scheduledDate || 0) - new Date(b.scheduledDate || 0);
      }).slice(0, 5);
      setUpcomingActivities(sortedActivities);

      setRevenueData(deals);
      const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
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
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [fetchAllData]);

  // ... (WebSocket useEffect remains unchanged) ...

  const metricsConfig = [
    {
      icon: IconUsers,
      title: "Active Leads",
      value: metrics.activeLeads,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => navigate('/admin/leads')
    },
    // --- NEW: Total Targets Card ---
    {
      icon: IconFiTarget,
      title: "Total Targets",
      value: formatCurrency(totalTarget, currencySymbol),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      onClick: () => navigate('/admin/targets')
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
        {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"><p className="font-medium">{error}</p></div>}

        {/* ROW 1: Top Bar & Metrics & Recent Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-9 flex flex-col space-y-4">
            <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} searchResults={searchResults} onSearchResultClick={handleSearchResultClick} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {metricsConfig.map((metric) => (
                <MetricCard key={metric.title} {...metric} loading={loading} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <RecentLogsCard logs={auditLogs} loading={loading} />
          </div>
        </div>

        {/* ROW 2: NEW Funnel Intelligence Section (With Targets passed in) */}
        <div className="mb-8">
            <FunnelWidget 
                leads={allLeads} 
                deals={allDeals} 
                targets={allTargets} // --- NEW PROP ---
                currencySymbol={currencySymbol} 
            />
        </div>

        {/* ROW 3: Revenue Chart */}
        <div className="grid grid-cols-1 mb-8">
           <RevenueChart revenueData={revenueData} loading={loading} />
        </div>

        {/* ROW 4: Detailed Lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ListCard title="Latest Leads">
            {latestLeads.length > 0 ? latestLeads.map((lead, index) => <LeadItem key={lead.id || index} {...lead} />) : <div className="text-sm text-gray-500 py-4 text-center">No leads found</div>}
          </ListCard>
          <ListCard title="Latest Deals">
            {latestDeals.length > 0 ? latestDeals.map((deal, index) => <DealItem key={deal.id || index} {...deal} stage_updated_at={deal.stage_updated_at} currencySymbol={currencySymbol} />) : <div className="text-sm text-gray-500 py-4 text-center">No deals found</div>}
          </ListCard>
          <ListCard title="Upcoming Activities">
            {upcomingActivities.length > 0 ? upcomingActivities.map((activity, index) => <ActivityItem key={activity.id || index} {...activity} />) : <div className="text-sm text-gray-500 py-4 text-center">No upcoming activities</div>}
          </ListCard>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;