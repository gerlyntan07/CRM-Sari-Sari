import React, { useState, useEffect, useMemo } from 'react';

import { 
  FiSearch, FiUsers, FiDollarSign, FiUserPlus, FiClock, FiBriefcase, FiTarget, FiArrowUpRight, FiArrowDownRight,
  FiUser, FiCalendar, FiCheckCircle, FiFileText, FiPhone, FiList, FiBookmark, FiEdit, FiArrowRight, FiPhoneCall, FiClipboard,
} from "react-icons/fi";
import { LuMapPin } from "react-icons/lu";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { FaHandshakeAngle } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';

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
export const IconHand = (props) => <FaHandshakeAngle {...props}/>;

export const IconUsers = (props) => <FiUsers {...props} />;
export const IconUser = (props) => <FiUser {...props} />;
export const IconFiUserPlus = (props) => <FiUserPlus {...props}/>;
export const IconFiBriefcase = (props) => <FiBriefcase {...props}/>;
export const IconFiFileText = (props) => <FiFileText {...props} />;
export const IconFiTarget = (props) => <FiTarget {...props} />;
export const IconFiCircleCheck = (props) => <FiCheckCircle {...props} />;
export const IconFiCalendar = (props) => <FiCalendar {...props} />;
export const IconFiPhoneCall = (props) => <FiPhoneCall {...props} />;
export const IconLuMapPin = (props) => <LuMapPin {...props} />;
export const IconFiClipboard = (props) => <FiClipboard {...props} />;





// --- Constants and Mock Data ---
const METRICS = [
  // Updated with Inline SVG Components
  { icon: IconUsers, title: "Active Leads", value: 200, color: "text-blue-600", bgColor: "bg-blue-50" },
  { icon: IconDollarSign, title: "Total Deals", value: 99, color: "text-yellow-600", bgColor: "bg-yellow-50" },
  // REPLACED IconTableCells with the new IconBuilding
  { icon: IconBuilding, title: "Active Account", value: 12, color: "text-green-600", bgColor: "bg-green-50" },
  { icon: IconClock, title: "Overdue Tasks", value: 20, color: "text-red-600", bgColor: "bg-red-50" },
];

const LATEST_LEADS = [
  { name: "Emma Watty", company: "Tech Interaction Inc.", source: "Website", date: "Jul 10, 2:10 PM" },
  { name: "John Johnny", company: "Capital Business Co.", source: "Referral", date: "Jul 9, 12:00 AM" },
  { name: "Annie Arnty", company: "Dynamic Systems Inc.", source: "Trade Show", date: "Dec 12, 1:25 PM" },
  { name: "James Wilson", company: "Global Services LLC", source: "Cold Call", date: "Dec 1, 11:15 AM" },
];

const LATEST_DEALS = [
  // Negotiation: Purple
  { name: "Cloud Migration Project", value: 125000, company: "GlobalTech Industries", status: "Negotiation", contact: "John Johnny", trend: 'up' },
  // Proposal: Red/Orange
  { name: "New Hardware Acquisition", value: 1000, company: "Digital Solutions Co", status: "Proposal", contact: "Jane Doe", trend: 'down' },
  // Qualification: Yellow
  { name: "Renewal Contract Phase 2", value: 125000, company: "Enterprise Systems Inc", status: "Qualification", contact: "Annie Arnty", trend: 'up' },
  // Prospecting: Blue
  { name: "Software License Upgrade", value: 65000, company: "Cloud Services LLC", status: "Prospecting", contact: "James Wilson", trend: 'up' },
];

const UPCOMING_ACTIVITIES = [
  { type: "call", title: "Follow up call with Tech Corp.", assigned: "Jesselle Ramos", time: "Today, 2:00 PM", priority: "HIGH" },
  { type: "meeting", title: "Zoom Meeting with NLF Inc.", assigned: "Joshua Vergara", time: "Tomorrow, 3:00 PM", priority: "LOW" },
  { type: "meeting", title: "Zoom Meeting with NLF Inc.", assigned: "Joshua Vergara", time: "Tomorrow, 3:00 PM", priority: "LOW" }, 
  { type: "meeting", title: "Zoom Meeting with NLF Inc.", assigned: "Joshua Vergara", time: "Tomorrow, 3:00 PM", priority: "LOW" },
];

const SALES_PIPELINE = [
  { stage: "Prospecting", value: 100000, deals: 24, color: "bg-blue-500" },
  { stage: "Qualification", value: 90000, deals: 18, color: "bg-yellow-500" },
  { stage: "Proposal", value: 85000, deals: 12, color: "bg-orange-500" },
  { stage: "Negotiation", value: 90000, deals: 8, color: "bg-purple-500" },
  { stage: "Closed Won", value: 90000, deals: 6, color: "bg-green-500" },
  { stage: "Closed Lost", value: 90000, deals: 6, color: "bg-red-500" },
];

// UPDATED MOCK DATA: Simple Audit Logs (Action + Target + Time)
const AUDIT_LOGS = [
    { action: "Updated security policy", target: "System Settings", time: "5 min ago" },
    { action: "Successfully logged in", target: "Sales Portal", time: "12 min ago" },
    { action: "Failed login attempt (bad password)", target: "Sales Portal", time: "25 min ago" },
    { action: "Exported 50 records", target: "Latest Leads", time: "1 hour ago" },
    { action: "Granted 'Editor' role", target: "Emma Watty", time: "3 hours ago" },
    { action: "Database backup completed", target: "Data Services", time: "Yesterday" },
    // --- New Logs Added Here ---
    { action: "Created new lead", target: "Acme Corp", time: "2 days ago" },
    { action: "Deal status updated to Won", target: "Project Aurora", time: "3 days ago" },
    { action: "Password reset requested", target: "User Account (ID: 456)", time: "4 days ago" },
];

// Utility function to format currency
const formatCurrency = (amount) => {
  return `P ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0 }).format(amount)}`;
};

// Utility function to map DEAL status to classes
const getStatusClasses = (status) => {
    switch (status) {
        case 'Negotiation':
            return { text: 'text-purple-600', bg: 'bg-transparent' }; 
        case 'Proposal':
            return { text: 'text-red-500', bg: 'bg-transparent' };
        case 'Qualification':
            return { text: 'text-yellow-600', bg: 'bg-transparent' };
        case 'Prospecting':
            return { text: 'text-blue-600', bg: 'bg-transparent' };
        case 'Closed Won':
            return { text: 'text-green-600', bg: 'bg-transparent' };
        default:
            return { text: 'text-gray-900', bg: 'bg-transparent' };
    }
};

// Utility function to map LEAD source colors
const getLeadSourceClasses = (source) => {
    switch (source) {
        case 'Website':
            return { text: 'text-green-600', bg: 'bg-green-100' };
        case 'Referral':
            return { text: 'text-purple-600', bg: 'bg-purple-100' };
        case 'Trade Show':
            return { text: 'text-orange-600', bg: 'bg-orange-100' };
        case 'Cold Call':
            return { text: 'text-red-600', bg: 'bg-red-100' };
        default:
            return { text: 'text-gray-600', bg: 'bg-gray-100' };
    }
};

// Utility function for Activity Stages
const getActivityType = (type) => {
  // Updated with Inline SVG Components
  switch (type) {
    case 'call':
      return { Icon: IconPhone, color: 'text-red-500', bgColor: 'bg-red-100' };
    case 'qualification':
      return { Icon: IconBookmark, color: 'text-green-600', bgColor: 'bg-green-100' };
    case 'meeting':
    default:
      return { Icon: IconCalendar, color: 'text-blue-500', bgColor: 'bg-blue-100' };
  }
};

// Utility for Priority Tags
const getPriorityClasses = (priority) => {
    switch (priority.toUpperCase()) {
        case 'HIGH':
            return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300' };
        case 'LOW':
            return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' };
        default:
            return { text: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300' };
    }
};

const TopBar = () => {
  const navigate = useNavigate(); 

  const actionIcons = [
    { icon: IconUsers, label: "New Account" },
    { icon: IconUser, label: "New Contact" },
    { icon: IconFiUserPlus, label: "New Leads" },
    { icon: IconFiBriefcase, label: "New Deals" },
    { icon: IconFiFileText, label: "New Quotes" },
    { icon: IconFiTarget, label: "New Target" },
    { icon: IconFiCircleCheck, label: "New Task" },
    { icon: IconFiCalendar, label: "New Meeting" },
    { icon: IconFiPhoneCall, label: "New Call" },
    { icon: IconFiClipboard, label: "Audit" },
    { icon: IconLuMapPin, label: "New Territory" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 flex flex-col items-start space-y-4 w-full">
      
      {/* Large Search Bar */}
      <div className="w-full flex justify-center">
        <div className="flex items-center border border-gray-300 rounded-lg lg:mt-3 px-4 py-2 w-full max-w-md md:max-w-lg lg:max-w-2xl focus-within:ring-2 focus-within:ring-blue-500 transition duration-150">
          <IconSearch size={20} className="text-gray-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search Leads, Deals, or Accounts..."
            className="focus:outline-none text-base w-full"
          />
        </div>
      </div>

      {/* Action Icons */}
      <div className="w-full overflow-x-auto scroll-smooth hide-scrollbar flex justify-center">
        <div className="flex flex-nowrap space-x-3 sm:space-x-4 px-2 sm:px-0">
          {actionIcons.map((item, index) => (
            <div key={index} className="relative flex-shrink-0 group">
              <button
                className="p-3 text-gray-500 hover:text-gray-900 transition duration-150 rounded-full hover:bg-gray-100 focus:outline-none cursor-pointer"
                aria-label={item.label}
                onClick={() => {
                  switch(item.label) {
                    case "New Account": navigate("/admin/accounts"); break;
                    case "New Contact": navigate("/admin/contacts"); break;
                    case "New Leads": navigate("/admin/leads"); break;
                    case "New Deals": navigate("/admin/deals"); break;
                    case "New Quotes": navigate("/admin/quotes"); break;
                    case "New Target": navigate("/admin/targets"); break;
                    case "New Task": navigate("/admin/tasks"); break;
                    case "New Meeting": navigate("/admin/meetings"); break;
                    case "New Call": navigate("/admin/calls"); break;
                    case "Audit": navigate("/admin/audit"); break;
                    case "New Territory": navigate("/admin/territory"); break;
                    default: console.log(`Clicked ${item.label}`);
                  }
                }}
              >
                <item.icon size={24} className="lg:scale-95" />
              </button>

              {/* Tooltip */}
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


// NEW COMPONENT: Audit Log Item (Action and Time only)
const AuditLogItem = ({ action, target, time }) => (
    <li 
        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 -mx-2 rounded-md"
        onClick={() => console.log(`Clicked audit log: ${action} on ${target}`)}
    >
        {/* Action and Target */}
        <p className="text-sm text-gray-800 flex-grow font-medium">
            {action} <span className="text-gray-500 italic text-xs">({target})</span>
        </p>
        {/* Timestamp */}
        <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
          {time}
        </span>
    </li>
);


const RecentLogsCard = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-md font-semibold text-gray-800">Recent Logs</h2>
            <span className="text-sm text-blue-500 cursor-pointer hover:underline flex items-center space-x-1 font-medium"
                  onClick={() => console.log('Clicked See All Logs')}>
                <span>See All</span>
                {/* Replaced FaArrowRight with IconArrowRight */}
                <IconArrowRight size={14} className="transform -rotate-45" />
            </span>
        </div>
        
        {/* UPDATED: Removed flex-grow and overflow-y-auto to eliminate the scrollbar, as we only show 2 items now. */}
        <ul className="space-y-1">
            {AUDIT_LOGS.slice(0, 2).map((log, index) => (
                <AuditLogItem key={index} {...log} />
            ))}
        </ul>
        
    </div>
);


const MetricCard = ({ icon: Icon, title, value, color, bgColor }) => (
  <div 
    className="flex items-center p-4 bg-white rounded-xl shadow-lg cursor-pointer"
    onClick={() => console.log(`Clicked metric card: ${title}`)}
  >
    <div className={`p-3 rounded-full ${bgColor} ${color} mr-4`}>
      {/* Icon is now the inline SVG Component */}
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const RevenueChart = () => {
  // Mock data for the area chart (simplified SVG path for the required shape)
  const chartPoints = "M 0 150 C 100 130, 150 100, 200 120 C 250 140, 300 80, 350 100 C 400 130, 450 110, 500 90 C 550 70, 600 50, 650 40 C 700 30, 750 20, 800 10 L 800 150 Z";

  const yAxisLabels = [100, 75, 50, 25, 0].map(v => `${v}k`);
  const xAxisLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-500/50 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Revenue Overview</h2>
        <span className="text-sm text-blue-500 cursor-pointer hover:underline"
              onClick={() => console.log('Clicked See All Revenue')}>See All</span>
      </div>
      <div className="h-64 relative">
        <svg viewBox="0 0 850 180" className="w-full h-full">
          {/* Y-Axis Lines and Labels */}
          {yAxisLabels.map((label, index) => {
            const y = (index / (yAxisLabels.length - 1)) * 150 + 10;
            return (
              <g key={label}>
                <line x1="50" y1={y} x2="850" y2={y} stroke="#e5e7eb" strokeDasharray="3 3" />
                <text x="40" y={y + 3} textAnchor="end" fontSize="12" fill="#6b7280">
                  {label}
                </text>
              </g>
            );
          })}

    {/* Area Chart Path */}
          <g transform="translate(50, 10)">
            <path
              d={chartPoints}
              fill="#eff6ff" // Light Blue/Gray fill
              stroke="#60a5fa" // Tailwind blue-400 for outline (optional)
              strokeWidth="1"
            />
          </g>

          {/* X-Axis Labels */}
          {xAxisLabels.map((label, index) => (
            <text
              key={label}
              x={50 + (index / (xAxisLabels.length - 1)) * 800}
              y="175"
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};


const SalesPipeline = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-800">Sales Pipeline</h2>
      <span className="text-sm text-blue-500 cursor-pointer hover:underline"
            onClick={() => console.log('Clicked See All Pipeline')}>See All</span>
    </div>
    <div className="space-y-4 flex-grow"> 
      {SALES_PIPELINE.map((item) => (
        <div 
            key={item.stage} 
            className="flex flex-col cursor-pointer hover:opacity-85 transition duration-150"
            onClick={() => console.log(`Clicked pipeline stage: ${item.stage}`)}
        >
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="font-medium text-gray-700">{item.stage}</span>
            <span className="font-semibold text-gray-800">{formatCurrency(item.value)}</span>
          </div>
          <div className="relative h-2 rounded-full bg-gray-200">
            <div
              className={`absolute top-0 left-0 h-full rounded-full ${item.color}`}
              style={{ width: `${(item.value / 100000) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{item.deals} Deals</p>
        </div>
      ))}
    </div>
  </div>
);


const ListCard = ({ title, items, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <span className="text-sm text-blue-500 cursor-pointer hover:underline"
            onClick={() => console.log(`Clicked See All ${title}`)}>See All</span>
    </div>
    {children}
  </div>
);

const LeadItem = ({ name, company, source, date }) => {
    // Get classes based on the lead source (status)
    const { text, bg } = getLeadSourceClasses(source);

    return (
        <div 
          className="py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 -mx-2 rounded-md"
          onClick={() => console.log(`Clicked lead item: ${name}`)}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800">{name}</p>
              <p className="text-xs text-gray-500">{company}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{date}</p>
              {/* Apply dynamic classes for color */}
              <span className={`inline-block mt-1 text-xs font-medium ${text} ${bg} px-2 py-0.5 rounded-full`}>{source}</span>
            </div>
          </div>
        </div>
    );
};

// --- DEAL ITEM COMPONENT - REMOVED PROSPECT/CONTACT LINE ---
const DealItem = ({ name, value, company, status, contact, trend }) => {
  // Call getStatusClasses with the 'status' property
  const { text } = getStatusClasses(status);

  // Determine the correct icon and color based on the 'trend' prop
  // Updated Icons with SVG Components
  const TrendIcon = trend === 'up' ? IconTrendUp : IconTrendDown;
  const trendColor = trend === 'up' ? 'text-green-400' : 'text-red-400';
  
  return (
    <div 
      className="py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 -mx-2 rounded-md"
      onClick={() => console.log(`Clicked deal item: ${name}`)}
    >
      <div className="flex justify-between items-center">
        
        {/* Left Side: Name, Company, Status */}
        <div className="flex-shrink">
          {/* Deal Name */}
          <p className="font-semibold text-sm text-gray-900">{name}</p>
          
          {/* Company Info - Stays, as this is the associated account */}
          <p className="text-xs text-gray-500 mt-0.5">{company}</p>
          {/* REMOVED: Prospect: {contact} */}
          
          {/* Status Tag (Inline text, no background, using dynamic color based on status) */}
          <p className={`inline-block mt-1 text-xs font-medium ${text}`}>
            {status}
          </p>
        </div>

        {/* Right side: Value and Sparkline Icon */}
        <div className="text-right flex flex-col items-end flex-shrink-0">
          <p className="text-md font-bold text-gray-800">{formatCurrency(value)}</p>
          {/* Dynamic Trend icon with color */}
          <TrendIcon size={16} className={`${trendColor} mt-1`} /> 
        </div>
      </div>
    </div>
  );
};

// --- ACTIVITY ITEM COMPONENT ---
const ActivityItem = ({ type, title, assigned, time, priority }) => {
  // getActivityType now returns Inline SVG Components
  const { Icon, color, bgColor } = getActivityType(type);
  const { text, bg, border } = getPriorityClasses(priority);
  
  const handleCompleteClick = (e) => {
    e.stopPropagation(); 
    console.log(`Completed activity: ${title}`);
  };

  return (
    <div 
      className="flex items-start py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 -mx-2 rounded-md"
      onClick={() => console.log(`Clicked activity item: ${title}`)}
    >
      {/* Icon (Left side) */}
      <div className={`p-2 rounded-lg ${bgColor} mr-3 flex-shrink-0 mt-1`}>
        {/* Icon is now the inline SVG Component */}
        <Icon size={20} className={`${color}`} />
      </div>
      
      {/* Middle Content (Title, Time, Assigned) */}
      <div className="flex-grow">
        {/* Title with dot (matching image style) */}
        <p className="font-medium text-gray-800 flex items-center mb-1">
            <span className="text-xl leading-none mr-2">•</span> 
            {title}
        </p>
        
        {/* Time and Assigned Group - Updated Icons */}
        <div className="space-y-1 text-xs text-gray-500">
            {/* Time/Date */}
            <p className="flex items-center">
                {/* Replaced FaClock with IconClock */}
                <IconClock size={14} className="mr-1.5 text-gray-400" />
                {time}
            </p>
            {/* Assigned To */}
            <p className="flex items-center">
                {/* Replaced FaUser with IconUser */}
                <IconUser size={14} className="mr-1.5 text-gray-400" />
                Assigned to: {assigned}
            </p>
        </div>
      </div>
      
      {/* Priority Tag (Far Right side) */}
      <span className={`inline-block text-xs font-semibold ${text} ${bg} border ${border} px-2 py-0.5 rounded-lg flex-shrink-0 self-center ml-4`}>
        {priority.toUpperCase()}
      </span>
      
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  useEffect(() => {
    document.title = "Dashboard | Sari-Sari CRM";
  }, []);

  return (
    <div className="min-h-screen pt-5 pb-10 font-sans">
      
      {/* CHANGED: max-w-7xl to max-w-screen-2xl 
        This increases the maximum width of the content on large screens.
      */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* NEW LAYOUT: Top Section (TopBar, Metrics, and Tall Recent Logs) */}
        {/* Removed lg:h-[200px] and ensured responsiveness with flex/grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            
            {/* Left Column: TopBar and Metrics (Spans 9 columns) */}
            <div className="lg:col-span-9 flex flex-col space-y-4">
                
                <TopBar />
                
                {/* 2. Metrics Container (Inner grid for the 4 cards) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {METRICS.map((metric) => (
                        <MetricCard key={metric.title} {...metric} />
                    ))}
                </div>
            </div>

            {/* Right Column: Recent Logs Card (Spans 3 columns) */}
            <div className="lg:col-span-3">
                <RecentLogsCard />
            </div>
        </div>

        {/* Revenue Chart & Sales Pipeline - Side by Side on Large Screens */}
        {/* Changed gap-8 to gap-6 for consistent spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <div>
            <SalesPipeline />
          </div>
        </div>

        {/* Bottom Lists: Leads, Deals, Activities */}
        {/* Changed gap-8 to gap-6 for consistent spacing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <ListCard title="Latest Leads">
            {LATEST_LEADS.map((lead, index) => (
              <LeadItem key={index} {...lead} />
            ))}
          </ListCard>

          <ListCard title="Latest Deals">
            {LATEST_DEALS.map((deal, index) => (
              <DealItem key={index} {...deal} />
            ))}
          </ListCard>

          <ListCard title="Upcoming Activities">
            {UPCOMING_ACTIVITIES.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </ListCard>
        </div>

      </main>

    </div>
  );
};

export default App;
