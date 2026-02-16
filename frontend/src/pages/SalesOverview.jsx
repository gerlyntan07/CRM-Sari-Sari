import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";

import {
  FiSearch,
  FiUsers,
  FiDollarSign,
  FiUserPlus,
  FiClock,
  FiBriefcase,
  FiTarget,
  FiArrowUpRight,
  FiArrowDownRight,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiPhone,
  FiList,
  FiBookmark,
  FiEdit,
  FiArrowRight,
  FiPhoneCall,
  FiClipboard,
} from "react-icons/fi";
import { LuMapPin } from "react-icons/lu";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { FaHandshakeAngle } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import api from "../api";
import useFetchUser from "../hooks/useFetchUser";
import LoadingSpinner from "../components/LoadingSpinner";
import FunnelWidget from "../components/FunnelWidget";
import { LineChart } from "@mui/x-charts/LineChart";

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

// --- Constants (No more mock data, all will be dynamic) ---

// Utility function to format currency
const formatCurrency = (amount, symbol = "₱") => {
  const numericAmount = parseFloat(amount) || 0;

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  })
    .format(numericAmount)
    .replace(/^/, `${symbol} `);
};

// Utility function to map DEAL status to classes
const getStatusClasses = (status) => {
  switch (status) {
    case "Negotiation":
      return { text: "text-purple-700", bg: "bg-purple-100" };
    case "Proposal":
      return { text: "text-red-700", bg: "bg-red-100" };
    case "Qualification":
      return { text: "text-yellow-700", bg: "bg-yellow-100" };
    case "Prospecting":
      return { text: "text-blue-700", bg: "bg-blue-100" };
    case "Closed Won":
      return { text: "text-green-700", bg: "bg-green-100" };
    case "Closed Lost":
      return { text: "text-red-700", bg: "bg-red-100" };
    default:
      return { text: "text-gray-700", bg: "bg-gray-100" };
  }
};

// Utility function to map LEAD source colors
const getLeadSourceClasses = (source) => {
  switch (source) {
    case "Website":
      return { text: "text-green-600", bg: "bg-green-100" };
    case "Referral":
      return { text: "text-purple-600", bg: "bg-purple-100" };
    case "Trade Show":
      return { text: "text-orange-600", bg: "bg-orange-100" };
    case "Cold Call":
      return { text: "text-red-600", bg: "bg-red-100" };
    default:
      return { text: "text-gray-600", bg: "bg-gray-100" };
  }
};

// Utility function for Activity Stages
const getActivityType = (type) => {
  // Updated with Inline SVG Components
  switch (type) {
    case "call":
      return { Icon: IconPhone, color: "text-red-500", bgColor: "bg-red-100" };
    case "qualification":
      return {
        Icon: IconBookmark,
        color: "text-green-600",
        bgColor: "bg-green-100",
      };
    case "meeting":
    default:
      return {
        Icon: IconCalendar,
        color: "text-blue-500",
        bgColor: "bg-blue-100",
      };
  }
};

// Utility for Priority Tags
const getPriorityClasses = (priority) => {
  switch (priority.toUpperCase()) {
    case "HIGH":
      return { text: "text-red-700", bg: "bg-red-100" };
    case "LOW":
      return { text: "text-blue-700", bg: "bg-blue-100" };
    default:
      return { text: "text-gray-700", bg: "bg-gray-100" };
  }
};

const TopBar = ({
  searchQuery,
  onSearchChange,
  searchResults,
  onSearchResultClick,
}) => {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const actionIcons = [
    { icon: IconBuilding, label: "Account" },
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

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      {/* Large Search Bar */}
      <div className="w-full flex justify-center relative" ref={searchRef}>
        <div className="flex items-center border border-gray-300 rounded-lg lg:mt-3 px-4 py-2 w-full max-w-md md:max-w-lg lg:max-w-2xl focus-within:ring-2 focus-within:ring-blue-500 transition duration-150">
          <IconSearch size={20} className="text-gray-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search Leads, Deals, or Accounts..."
            className="focus:outline-none text-base w-full"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() =>
              searchQuery.trim().length > 0 && setShowResults(true)
            }
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults &&
          Array.isArray(searchResults) &&
          searchResults.length > 0 && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-full max-w-md md:max-w-lg lg:max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition duration-150"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">
                        {result.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.type}
                      </p>
                      {result.details && (
                        <p className="text-xs text-gray-400 mt-1">
                          {result.details}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        result.type === "Lead"
                          ? "bg-blue-100 text-blue-600"
                          : result.type === "Deal"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {result.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        {showResults &&
          searchQuery.trim().length > 0 &&
          (!Array.isArray(searchResults) || searchResults.length === 0) && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-full max-w-md md:max-w-lg lg:max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4 text-center text-sm text-gray-500">
              No results found
            </div>
          )}
      </div>

      {/* Action Icons */}
      {/*   <div className="w-full overflow-x-auto scroll-smooth hide-scrollbar flex justify-center"> */}
      <div className="w-full overflow-x-auto lg:overflow-x-hidden scroll-smooth flex justify-center">
        <div className="flex flex-nowrap space-x-3 lg:space-x-4 xl:space-x-3 px-2 sm:px-0">
          {actionIcons.map((item, index) => (
            <div key={index} className="relative flex-shrink-0 group flex items-center justify-center">
              <button
                className="p-3 text-gray-500 hover:text-gray-900 transition duration-150 rounded-full hover:bg-gray-100 focus:outline-none cursor-pointer"
                aria-label={item.label}
                title={item.label}
                onClick={() => {
                  switch (item.label) {
                    case "Account":
                      navigate("/sales/accounts");
                      break;
                    case "Contact":
                      navigate("/sales/contacts");
                      break;
                    case "Leads":
                      navigate("/sales/leads");
                      break;
                    case "Deals":
                      navigate("/sales/deals");
                      break;
                    case "Quotes":
                      navigate("/sales/quotes");
                      break;
                    case "Target":
                      navigate("/sales/targets");
                      break;
                    case "Task":
                      navigate("/sales/tasks");
                      break;
                    case "Meeting":
                      navigate("/sales/meetings");
                      break;
                    case "Call":
                      navigate("/sales/calls");
                      break;
                    case "Audit":
                      navigate("/sales/audit");
                      break;
                    case "Territory":
                      navigate("/sales/territory");
                      break;
                    default:
                      console.log(`Clicked ${item.label}`);
                  }
                }}
              >
                <item.icon size={24} className="lg:scale-95" />
              </button>

              {/* Tooltip - appears on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-75 ease-in-out z-50 shadow-lg">
                {item.label}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// NEW COMPONENT: Audit Log Item (Action and Time only)
const AuditLogItem = ({
  action,
  description,
  entity_type,
  entity_name,
  timestamp,
}) => {
  const navigate = useNavigate();

  // Format time ago
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
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const displayAction = action || description || "Action";
  const displayTarget = entity_name || entity_type || "System";
  const timeAgo = formatTimeAgo(timestamp);

  return (
    <li
      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 -mx-2 rounded-md"
      onClick={() => navigate("/sales/audit")}
    >
      {/* Action and Target */}
      <p className="text-sm text-gray-800 flex-grow font-medium">
        {displayAction}{" "}
        <span className="text-gray-500 italic text-xs">({displayTarget})</span>
      </p>
      {/* Timestamp */}
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
        <span
          className="text-sm text-blue-500 cursor-pointer hover:underline flex items-center space-x-1 font-medium"
          onClick={() => navigate("/sales/audit")}
        >
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

const MetricCard = ({
  icon: Icon,
  title,
  value,
  color,
  bgColor,
  loading,
  onClick,
}) => (
  <div
    className="flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300"
    onClick={onClick || (() => console.log(`Clicked metric card: ${title}`))}
  >
    <div className={`p-3 rounded-full ${bgColor} ${color} mr-4`}>
      {/* Icon is now the inline SVG Component */}
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
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Calculate revenue data from deals
  const chartData = useMemo(() => {
    console.log("=== RevenueChart calculateRevenueData ===");
    console.log("revenueData:", revenueData);
    console.log("revenueData length:", revenueData?.length);

    if (!revenueData || revenueData.length === 0) {
      console.log("No revenue data, returning empty chart");
      // Return empty data - show from January to current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const labels = [];
      const revenues = [];

      for (let monthIndex = 0; monthIndex <= currentMonth; monthIndex++) {
        labels.push(monthNames[monthIndex]);
        revenues.push(0);
      }

      return { labels, revenues, maxRevenue: 0 };
    }

    // Group deals by month
    const monthlyRevenue = {};
    let validDealsCount = 0;
    let closedWonCount = 0;

    console.log("Processing deals:", revenueData.length);

    revenueData.forEach((deal, index) => {
      // Check all possible field names for close date
      const closeDate = deal.close_date || deal.closeDate || null;
      const hasCloseDate = closeDate && closeDate !== null && closeDate !== "";

      // Check stage - be more lenient
      const stage = deal.stage || "";
      const isClosedWon =
        stage.toUpperCase() === "CLOSED_WON" || stage === "CLOSED_WON";

      // Check amount - handle Decimal types from backend
      let amount = deal.amount;
      if (amount && typeof amount === "object" && amount.toString) {
        amount = parseFloat(amount.toString());
      } else {
        amount = parseFloat(amount) || 0;
      }
      const hasAmount = amount > 0;

      if (isClosedWon) {
        closedWonCount++;
        console.log(`Deal ${index + 1} (CLOSED_WON):`, {
          id: deal.id,
          name: deal.name,
          stage: stage,
          close_date: closeDate,
          close_date_type: typeof closeDate,
          amount: amount,
          amount_type: typeof deal.amount,
          hasCloseDate,
          hasAmount,
          willBeAdded: hasCloseDate && hasAmount,
          allFields: Object.keys(deal),
        });
      }

      if (hasCloseDate && isClosedWon && hasAmount) {
        try {
          // Try multiple date parsing methods
          let date = new Date(closeDate);

          // If invalid, try parsing as ISO string
          if (isNaN(date.getTime())) {
            // Remove timezone if present and try again
            const dateStr = String(closeDate).split("T")[0];
            date = new Date(dateStr + "T00:00:00");
          }

          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const monthKey = `${year}-${String(month).padStart(2, "0")}`;
            if (!monthlyRevenue[monthKey]) {
              monthlyRevenue[monthKey] = 0;
            }
            monthlyRevenue[monthKey] += amount;
            validDealsCount++;
            console.log(
              `✓ Added deal ${deal.id} to month ${monthKey}: ₱${amount}, total: ₱${monthlyRevenue[monthKey]}`
            );
            console.log(
              `  - Close date: ${closeDate} -> Parsed: ${date.toISOString()} -> Month: ${monthKey} (Year: ${year}, Month: ${month})`
            );
          } else {
            console.warn(
              `✗ Invalid date for deal ${deal.id}:`,
              closeDate,
              "Type:",
              typeof closeDate
            );
          }
        } catch (error) {
          console.error("Error parsing deal date:", closeDate, error);
        }
      } else if (isClosedWon) {
        console.warn(`✗ Deal ${deal.id} is CLOSED_WON but missing data:`, {
          hasCloseDate,
          hasAmount,
          closeDate,
          amount,
          originalAmount: deal.amount,
        });
      }
    });

    console.log("Summary:", {
      totalDeals: revenueData.length,
      closedWonDeals: closedWonCount,
      validDealsForGraph: validDealsCount,
      monthlyRevenue: monthlyRevenue,
    });

    // Get all unique years from revenue data
    const revenueYears = Object.keys(monthlyRevenue).map((key) =>
      parseInt(key.split("-")[0])
    );
    const uniqueYears =
      revenueYears.length > 0 ? [...new Set(revenueYears)].sort() : [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const labels = [];
    const revenues = [];

    // Always show all 12 months of current year (January to December)
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthKey = `${currentYear}-${String(monthIndex + 1).padStart(
        2,
        "0"
      )}`;
      labels.push(monthNames[monthIndex]);
      const revenue = monthlyRevenue[monthKey] || 0;
      revenues.push(revenue);
      if (revenue > 0) {
        console.log(
          `Month ${monthNames[monthIndex]} (${monthKey}): ₱${revenue}`
        );
      }
    }

    // Include future years if data exists (e.g., 2025)
    if (uniqueYears.length > 0) {
      const maxYear = Math.max(...uniqueYears);
      if (maxYear > currentYear) {
        for (let year = currentYear + 1; year <= maxYear; year++) {
          // Show all 12 months of future years that have data
          for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            const monthKey = `${year}-${String(monthIndex + 1).padStart(
              2,
              "0"
            )}`;
            const revenue = monthlyRevenue[monthKey] || 0;
            labels.push(`${monthNames[monthIndex]} ${year}`);
            revenues.push(revenue);
            if (revenue > 0) {
              console.log(
                `Month ${monthNames[monthIndex]} ${year} (${monthKey}): ₱${revenue}`
              );
            }
          }
        }
      }
    }

    const maxRevenue = Math.max(...revenues, 1);

    console.log("Final chart data:", {
      labels,
      revenues,
      maxRevenue,
      hasData: revenues.some((r) => r > 0),
    });

    return { labels, revenues, maxRevenue };
  }, [revenueData]);

  // Prepare data for MUI X Charts
  const xAxisData = chartData.labels;
  const yAxisData = chartData.revenues;

  console.log("=== FINAL CHART DATA ===");
  console.log("X Axis (Months):", xAxisData);
  console.log("Y Axis (Revenue):", yAxisData);
  console.log(
    "Has any revenue > 0:",
    yAxisData.some((d) => d > 0)
  );
  console.log("All revenue values:", yAxisData);
  console.log("Max revenue:", chartData.maxRevenue);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Revenue Overview
        </h2>
        <span
          className="text-sm text-blue-500 cursor-pointer hover:underline flex items-center space-x-1 font-medium"
          onClick={() => navigate("/sales/deals")}
        >
          <span>See All</span>
          <IconArrowRight size={14} className="transform -rotate-45" />
        </span>
      </div>
      <div className="h-80 relative flex-1 flex items-center justify-center p-6">
        <div className="w-full h-full flex items-center justify-center">
          {xAxisData &&
          xAxisData.length > 0 &&
          yAxisData &&
          yAxisData.length > 0 ? (
            <LineChart
              xAxis={[
                {
                  data: xAxisData,
                  scaleType: "point",
                },
              ]}
              yAxis={[
                {
                  valueFormatter: (value) => {
                    if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}k`;
                    }
                    return value.toString();
                  },
                },
              ]}
              series={[
                {
                  data: yAxisData,
                  showMark: true,
                  area: true,
                },
              ]}
              height={320}
              width={undefined}
              grid={{ vertical: true, horizontal: true }}
              margin={{ top: 40, right: 40, bottom: 50, left: 50 }}
              sx={{
                width: "100%",
                maxWidth: "100%",
              }}
            />
          ) : (
            <div className="text-center text-gray-500">
              <p className="text-sm">No revenue data available</p>
              <p className="text-xs mt-2">
                Closed won deals with close dates will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// My Activities Chart Component
const MyActivitiesChart = ({ activityData, loading }) => {
  const [showTasks, setShowTasks] = useState(true);
  const [showMeetings, setShowMeetings] = useState(true);
  const [showCalls, setShowCalls] = useState(true);
  const [showLastYear, setShowLastYear] = useState(true);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Prepare data for the chart
  const chartData = useMemo(() => {
    if (!activityData) {
      return {
        labels: monthNames,
        tasksCurrentYear: new Array(12).fill(0),
        tasksLastYear: new Array(12).fill(0),
        meetingsCurrentYear: new Array(12).fill(0),
        meetingsLastYear: new Array(12).fill(0),
        callsCurrentYear: new Array(12).fill(0),
        callsLastYear: new Array(12).fill(0),
      };
    }

    return {
      labels: monthNames,
      tasksCurrentYear: activityData.tasks?.currentYear || new Array(12).fill(0),
      tasksLastYear: activityData.tasks?.lastYear || new Array(12).fill(0),
      meetingsCurrentYear: activityData.meetings?.currentYear || new Array(12).fill(0),
      meetingsLastYear: activityData.meetings?.lastYear || new Array(12).fill(0),
      callsCurrentYear: activityData.calls?.currentYear || new Array(12).fill(0),
      callsLastYear: activityData.calls?.lastYear || new Array(12).fill(0),
    };
  }, [activityData]);

  const hasData = 
    chartData.tasksCurrentYear.some(val => val > 0) || 
    chartData.tasksLastYear.some(val => val > 0) ||
    chartData.meetingsCurrentYear.some(val => val > 0) || 
    chartData.meetingsLastYear.some(val => val > 0) ||
    chartData.callsCurrentYear.some(val => val > 0) || 
    chartData.callsLastYear.some(val => val > 0);

  // Calculate totals for current year
  const currentYearTasks = chartData.tasksCurrentYear.reduce((sum, val) => sum + val, 0);
  const currentYearMeetings = chartData.meetingsCurrentYear.reduce((sum, val) => sum + val, 0);
  const currentYearCalls = chartData.callsCurrentYear.reduce((sum, val) => sum + val, 0);
  const currentYearTotal = currentYearTasks + currentYearMeetings + currentYearCalls;

  // Calculate totals for last year
  const lastYearTasks = chartData.tasksLastYear.reduce((sum, val) => sum + val, 0);
  const lastYearMeetings = chartData.meetingsLastYear.reduce((sum, val) => sum + val, 0);
  const lastYearCalls = chartData.callsLastYear.reduce((sum, val) => sum + val, 0);
  const lastYearTotal = lastYearTasks + lastYearMeetings + lastYearCalls;

  const percentageChange = lastYearTotal > 0 
    ? ((currentYearTotal - lastYearTotal) / lastYearTotal * 100).toFixed(1)
    : 0;

  // Calculate individual percentage changes
  const tasksChange = lastYearTasks > 0 
    ? ((currentYearTasks - lastYearTasks) / lastYearTasks * 100).toFixed(0)
    : currentYearTasks > 0 ? 100 : 0;
  const meetingsChange = lastYearMeetings > 0 
    ? ((currentYearMeetings - lastYearMeetings) / lastYearMeetings * 100).toFixed(0)
    : currentYearMeetings > 0 ? 100 : 0;
  const callsChange = lastYearCalls > 0 
    ? ((currentYearCalls - lastYearCalls) / lastYearCalls * 100).toFixed(0)
    : currentYearCalls > 0 ? 100 : 0;

  // Build series array based on toggles
  const series = [];
  if (showTasks) {
    series.push({
      data: chartData.tasksCurrentYear,
      label: `Tasks ${new Date().getFullYear()}`,
      color: '#10b981',
      showMark: true,
      curve: 'catmullRom',
    });
    if (showLastYear) {
      series.push({
        data: chartData.tasksLastYear,
        label: `Tasks ${new Date().getFullYear() - 1}`,
        color: '#86efac',
        showMark: false,
        curve: 'linear',
      });
    }
  }
  if (showMeetings) {
    series.push({
      data: chartData.meetingsCurrentYear,
      label: `Meetings ${new Date().getFullYear()}`,
      color: '#14b8a6',
      showMark: true,
      curve: 'catmullRom',
    });
    if (showLastYear) {
      series.push({
        data: chartData.meetingsLastYear,
        label: `Meetings ${new Date().getFullYear() - 1}`,
        color: '#5eead4',
        showMark: false,
        curve: 'linear',
      });
    }
  }
  if (showCalls) {
    series.push({
      data: chartData.callsCurrentYear,
      label: `Calls ${new Date().getFullYear()}`,
      color: '#6366f1',
      showMark: true,
      curve: 'catmullRom',
    });
    if (showLastYear) {
      series.push({
        data: chartData.callsLastYear,
        label: `Calls ${new Date().getFullYear() - 1}`,
        color: '#a5b4fc',
        showMark: false,
        curve: 'linear',
      });
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            My Activities
            {hasData && (
              <span className={`ml-3 text-sm font-medium px-2 py-1 rounded-full ${
                percentageChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {percentageChange >= 0 ? '↑' : '↓'} {Math.abs(percentageChange)}%
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Track your productivity across tasks, meetings & calls
          </p>
        </div>
        {hasData && (
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-800">{currentYearTotal}</p>
            <p className="text-xs text-gray-500 mt-1">Total this year</p>
          </div>
        )}
      </div>

      {/* Activity Type Summary Cards */}
      {hasData && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Tasks Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-1">
              <IconFiCircleCheck size={16} className="text-green-600" />
              {tasksChange !== 0 && (
                <span className={`text-xs font-semibold ${
                  tasksChange >= 0 ? 'text-green-700' : 'text-red-600'
                }`}>
                  {tasksChange >= 0 ? '+' : ''}{tasksChange}%
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-1">Tasks</p>
            <p className="text-xl font-bold text-green-700">{currentYearTasks}</p>
            <p className="text-xs text-gray-500 mt-1">vs {lastYearTasks} last year</p>
          </div>

          {/* Meetings Card */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-3 rounded-lg border border-teal-200">
            <div className="flex items-center justify-between mb-1">
              <IconFiCalendar size={16} className="text-teal-600" />
              {meetingsChange !== 0 && (
                <span className={`text-xs font-semibold ${
                  meetingsChange >= 0 ? 'text-teal-700' : 'text-red-600'
                }`}>
                  {meetingsChange >= 0 ? '+' : ''}{meetingsChange}%
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-1">Meetings</p>
            <p className="text-xl font-bold text-teal-700">{currentYearMeetings}</p>
            <p className="text-xs text-gray-500 mt-1">vs {lastYearMeetings} last year</p>
          </div>

          {/* Calls Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between mb-1">
              <IconFiPhoneCall size={16} className="text-indigo-600" />
              {callsChange !== 0 && (
                <span className={`text-xs font-semibold ${
                  callsChange >= 0 ? 'text-indigo-700' : 'text-red-600'
                }`}>
                  {callsChange >= 0 ? '+' : ''}{callsChange}%
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-1">Calls</p>
            <p className="text-xl font-bold text-indigo-700">{currentYearCalls}</p>
            <p className="text-xs text-gray-500 mt-1">vs {lastYearCalls} last year</p>
          </div>
        </div>
      )}

      {/* Filter Toggles */}
      {hasData && (
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
          <button
            onClick={() => setShowTasks(!showTasks)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              showTasks
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
            }`}
          >
            <IconFiCircleCheck size={12} className="inline mr-1" />
            Tasks
          </button>
          <button
            onClick={() => setShowMeetings(!showMeetings)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              showMeetings
                ? 'bg-teal-100 text-teal-700 border-2 border-teal-300'
                : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
            }`}
          >
            <IconFiCalendar size={12} className="inline mr-1" />
            Meetings
          </button>
          <button
            onClick={() => setShowCalls(!showCalls)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              showCalls
                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
            }`}
          >
            <IconFiPhoneCall size={12} className="inline mr-1" />
            Calls
          </button>
          <button
            onClick={() => setShowLastYear(!showLastYear)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ml-auto ${
              showLastYear
                ? 'bg-gray-200 text-gray-700 border-2 border-gray-300'
                : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
            }`}
          >
            Show {new Date().getFullYear() - 1}
          </button>
        </div>
      )}

      {/* Chart */}
      <div className="flex-grow min-h-[320px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : hasData && series.length > 0 ? (
          <LineChart
            xAxis={[
              {
                scaleType: 'point',
                data: chartData.labels,
              },
            ]}
            series={series}
            height={320}
            width={undefined}
            grid={{ vertical: false, horizontal: true }}
            margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
            sx={{
              width: '100%',
              maxWidth: '100%',
              '& .MuiLineElement-root': {
                strokeWidth: 2.5,
              },
              '& .MuiMarkElement-root': {
                scale: '0.8',
              },
            }}
          />
        ) : hasData && series.length === 0 ? (
          <div className="text-center text-gray-500 flex items-center justify-center h-full">
            <div>
              <FiCheckCircle size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">Select at least one activity type</p>
              <p className="text-xs mt-2">Toggle the filters above to view data</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 flex items-center justify-center h-full">
            <div>
              <FiCheckCircle size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">No completed activities yet</p>
              <p className="text-xs mt-2 text-gray-400">
                Complete tasks, meetings, or calls to track your productivity
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SalesPipeline = ({ pipelineData, loading }) => {
  const navigate = useNavigate();

  // Map deal stages to display names and colors - dynamic based on actual stages
  const getStageConfig = (stage) => {
    const stageUpper = (stage || "").toUpperCase();
    const configMap = {
      PROSPECTING: { name: "Prospecting", color: "bg-blue-500" },
      QUALIFICATION: { name: "Qualification", color: "bg-yellow-500" },
      PROPOSAL: { name: "Proposal", color: "bg-orange-500" },
      NEGOTIATION: { name: "Negotiation", color: "bg-purple-500" },
      CLOSED_WON: { name: "Closed Won", color: "bg-green-500" },
      CLOSED_LOST: { name: "Closed Lost", color: "bg-red-500" },
    };

    // Return config if exists, otherwise create dynamic config
    if (configMap[stageUpper]) {
      return configMap[stageUpper];
    }

    // Dynamic fallback for unknown stages
    const colors = [
      "bg-blue-500",
      "bg-yellow-500",
      "bg-orange-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-red-500",
    ];
    const colorIndex =
      Math.abs(
        stageUpper.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      ) % colors.length;
    return {
      name: stage || "Unknown",
      color: colors[colorIndex],
    };
  };

  // Calculate pipeline data from deals - fully dynamic
  const calculatePipeline = () => {
    if (!pipelineData || pipelineData.length === 0) {
      // Return empty state with default stages
      const defaultStages = [
        "PROSPECTING",
        "QUALIFICATION",
        "PROPOSAL",
        "NEGOTIATION",
        "CLOSED_WON",
        "CLOSED_LOST",
      ];
      return defaultStages.map((stage) => {
        const config = getStageConfig(stage);
        return {
          stage: config.name,
          value: 0,
          deals: 0,
          color: config.color,
        };
      });
    }

    // Group deals by stage dynamically
    const stageGroups = {};
    pipelineData.forEach((deal) => {
      const stage = deal.stage || "PROSPECTING";
      if (!stageGroups[stage]) {
        stageGroups[stage] = { deals: 0, value: 0 };
      }
      stageGroups[stage].deals += 1;
      stageGroups[stage].value += parseFloat(deal.amount || 0);
    });

    // Get max value for percentage calculation
    const maxValue = Math.max(
      ...Object.values(stageGroups).map((g) => g.value),
      1
    );

    // Return all stages in order from Prospecting to Closed Lost (always show all 6 stages)
    const orderedStages = [
      "PROSPECTING",
      "QUALIFICATION",
      "PROPOSAL",
      "NEGOTIATION",
      "CLOSED_WON",
      "CLOSED_LOST",
    ];
    const result = [];

    // Always show all stages from Prospecting to Closed Lost
    orderedStages.forEach((stage) => {
      const config = getStageConfig(stage);
      const group = stageGroups[stage] || { deals: 0, value: 0 };
      result.push({
        stage: config.name,
        value: group.value,
        deals: group.deals,
        color: config.color,
        percentage: maxValue > 0 ? (group.value / maxValue) * 100 : 0,
      });
    });

    return result;
  };

  const pipeline = calculatePipeline();

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Sales Pipeline</h2>
        <span
          className="text-sm text-blue-500 cursor-pointer hover:underline"
          onClick={() => navigate("/sales/deals")}
        >
          See All
        </span>
      </div>
      <div className="space-y-4 flex-grow">
        {pipeline.slice(0, 6).map((item) => (
          <div
            key={item.stage}
            className="flex flex-col cursor-pointer hover:opacity-85 transition duration-150"
            onClick={() => navigate("/sales/deals")}
          >
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="font-medium text-gray-700">{item.stage}</span>
              <span className="font-semibold text-gray-800">
                {formatCurrency(item.value)}
              </span>
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

const ListCard = ({ title, items, children, onSeeAll }) => {
  const navigate = useNavigate();

  const handleSeeAll = () => {
    if (onSeeAll) {
      onSeeAll();
    } else {
      // Default navigation based on title
      const routeMap = {
        "Latest Leads": "/sales/leads",
        "Latest Deals": "/sales/deals",
        "Upcoming Activities": "/sales/tasks",
      };
      if (routeMap[title]) {
        navigate(routeMap[title]);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <span
          className="text-sm text-blue-500 cursor-pointer hover:underline"
          onClick={handleSeeAll}
        >
          See All
        </span>
      </div>
      {children}
    </div>
  );
};

const LeadItem = ({
  first_name,
  last_name,
  company_name,
  source,
  created_at,
  id,
}) => {
  const navigate = useNavigate();

  // Get classes based on the lead source (status)
  const { text, bg } = getLeadSourceClasses(source || "Website");

  // Format date
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
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    if (diffDays < 7) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const name = `${first_name || ""} ${last_name || ""}`.trim() || "Unknown";
  const company = company_name || "Unknown Company";
  const date = formatDate(created_at);

  return (
    <div
      className="py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 -mx-2 rounded-md"
      onClick={() => id && navigate(`/sales/leads/${id}`)}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-gray-800">{name}</p>
          <p className="text-xs text-gray-500">{company}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{date}</p>
          {/* Apply dynamic classes for color */}
          <span
            className={`inline-block mt-1 text-xs font-medium ${text} ${bg} px-2 py-0.5 rounded-full`}
          >
            {source || "Website"}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- DEAL ITEM COMPONENT - REMOVED PROSPECT/CONTACT LINE ---
const DealItem = ({
  name,
  amount,
  account,
  stage,
  created_at,
  id,
  previousAmount,
  currencySymbol,
}) => {
  const navigate = useNavigate();

  // Map stage to display name
  const stageMap = {
    PROSPECTING: "Prospecting",
    QUALIFICATION: "Qualification",
    PROPOSAL: "Proposal",
    NEGOTIATION: "Negotiation",
    CLOSED_WON: "Closed Won",
    CLOSED_LOST: "Closed Lost",
  };

  const displayStage = stageMap[stage] || stage || "Unknown";
  const { text, bg } = getStatusClasses(displayStage);

  // Determine trend (compare with previous amount if available, otherwise default to up)
  const currentAmount = parseFloat(amount || 0);
  const trend = previousAmount
    ? currentAmount >= previousAmount
      ? "up"
      : "down"
    : "up";
  const TrendIcon = trend === "up" ? IconTrendUp : IconTrendDown;
  const trendColor = trend === "up" ? "text-green-400" : "text-red-400";

  const companyName = account?.name || "Unknown Company";

  return (
    <div
      className="py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 -mx-2 rounded-md"
      onClick={() => id && navigate(`/sales/deals/info?id=${id}`)}
    >
      <div className="flex justify-between items-center">
        {/* Left Side: Name, Company, Status */}
        <div className="flex-shrink">
          {/* Deal Name */}
          <p className="font-semibold text-sm text-gray-900">
            {name || "Unnamed Deal"}
          </p>

          {/* Company Info - Stays, as this is the associated account */}
          <p className="text-xs text-gray-500 mt-0.5">{companyName}</p>

          {/* Status Tag (Consistent badge style with background) */}
          <span
            className={`inline-block mt-1 text-xs font-medium ${text} ${bg} px-2 py-0.5 rounded-full`}
          >
            {displayStage}
          </span>
        </div>

        {/* Right side: Value and Sparkline Icon */}
        <div className="text-right flex flex-col items-end flex-shrink-0">
          <p className="text-md font-bold text-gray-800">
            {formatCurrency(currentAmount, currencySymbol)}
          </p>
          {/* Dynamic Trend icon with color */}
          <TrendIcon size={16} className={`${trendColor} mt-1`} />
        </div>
      </div>
    </div>
  );
};

// --- ACTIVITY ITEM COMPONENT ---
const ActivityItem = ({
  type,
  title,
  assignedTo,
  dueDate,
  scheduledDate,
  priority,
  id,
  activityType,
  fullData,
}) => {
  const navigate = useNavigate();

  // Determine activity type from data
  const activityTypeMap = {
    Call: "call",
    Meeting: "meeting",
    Task: "qualification",
  };

  const finalType = activityType || activityTypeMap[type] || "meeting";
  const { Icon, color, bgColor } = getActivityType(finalType);
  const { text, bg } = getPriorityClasses(priority || "MEDIUM");

  // Format date/time
  const formatDateTime = (dateString) => {
    if (!dateString) return "No date set";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else if (diffDays === 1) {
      return `Tomorrow, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else if (diffDays === -1) {
      return `Yesterday, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

  const dateTime = dueDate || scheduledDate;
  const timeDisplay = formatDateTime(dateTime);
  const assignedName = assignedTo || "Unassigned";

  const handleClick = () => {
    if (id) {
      // Store full data in sessionStorage for instant access
      if (fullData) {
        if (finalType === "call") {
          sessionStorage.setItem("callDetailData", JSON.stringify(fullData));
          navigate(`/sales/calls/info?id=${id}`);
        } else if (finalType === "meeting") {
          sessionStorage.setItem("meetingDetailData", JSON.stringify(fullData));
          navigate(`/sales/meetings/info?id=${id}`);
        } else {
          navigate("/sales/tasks");
        }
      } else {
        // Fallback if no fullData
        if (finalType === "call") {
          navigate(`/sales/calls/info?id=${id}`);
        } else if (finalType === "meeting") {
          navigate(`/sales/meetings/info?id=${id}`);
        } else {
          navigate("/sales/tasks");
        }
      }
    }
  };

  return (
    <div
      className="flex items-start py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 -mx-2 rounded-md"
      onClick={handleClick}
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
          {title || "Untitled Activity"}
        </p>

        {/* Time and Assigned Group - Updated Icons */}
        <div className="space-y-1 text-xs text-gray-500">
          {/* Time/Date */}
          <p className="flex items-center">
            <IconClock size={14} className="mr-1.5 text-gray-400" />
            {timeDisplay}
          </p>
          {/* Assigned To */}
          <p className="flex items-center">
            <IconUser size={14} className="mr-1.5 text-gray-400" />
            Assigned to: {assignedName}
          </p>
        </div>
      </div>

      {/* Priority Tag (Far Right side) */}
      <span
        className={`inline-block text-xs font-medium ${text} ${bg} px-2 py-0.5 rounded-full flex-shrink-0 self-center ml-4`}
      >
        {(priority || "MEDIUM").toUpperCase()}
      </span>
    </div>
  );
};

// --- Main SalesOverview Component ---

const SalesOverview= () => {
  const navigate = useNavigate();
  const { user } = useFetchUser();

  const currencySymbol = user?.company?.currency || "₱";

  // State for all data
  const [metrics, setMetrics] = useState({
    activeLeads: 0,
    totalDeals: 0,
    activeAccounts: 0,
    overdueTasks: 0,
    completedTasks: 0,
    completedMeetings: 0,
    completedCalls: 0,
  });
  const [latestLeads, setLatestLeads] = useState([]);
  const [latestDeals, setLatestDeals] = useState([]);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [salesPipeline, setSalesPipeline] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [taskCompletionData, setTaskCompletionData] = useState({
    tasks: { currentYear: new Array(12).fill(0), lastYear: new Array(12).fill(0) },
    meetings: { currentYear: new Array(12).fill(0), lastYear: new Array(12).fill(0) },
    calls: { currentYear: new Array(12).fill(0), lastYear: new Array(12).fill(0) },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search functionality state
  const [searchQuery, setSearchQuery] = useState("");
  const [allLeads, setAllLeads] = useState([]);
  const [allDeals, setAllDeals] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);

  const [allTargets, setAllTargets] = useState([]);
  const [totalTarget, setTotalTarget] = useState(0);

  // Real-time update state
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const refreshIntervalRef = useRef(null);
  const wsRef = useRef(null);

  // Search results
  const searchResults = useMemo(() => {
    try {
      if (!searchQuery.trim()) return [];

      const query = searchQuery.toLowerCase().trim();
      const results = [];

      // Search in leads
      if (Array.isArray(allLeads)) {
        allLeads.forEach((lead) => {
          const name = `${lead.first_name || ""} ${lead.last_name || ""}`
            .trim()
            .toLowerCase();
          const company = (lead.company_name || "").toLowerCase();
          const email = (lead.email || "").toLowerCase();
          const phone = (lead.phone || "").toLowerCase();

          if (
            name.includes(query) ||
            company.includes(query) ||
            email.includes(query) ||
            phone.includes(query)
          ) {
            results.push({
              id: lead.id,
              name:
                `${lead.first_name || ""} ${lead.last_name || ""}`.trim() ||
                "Unnamed Lead",
              type: "Lead",
              details: lead.company_name || "No company",
              route: `/sales/leads/${lead.id}`,
            });
          }
        });
      }

      // Search in deals
      if (Array.isArray(allDeals)) {
        allDeals.forEach((deal) => {
          const name = (deal.name || "").toLowerCase();
          const accountName = (deal.account?.name || "").toLowerCase();
          const description = (deal.description || "").toLowerCase();

          if (
            name.includes(query) ||
            accountName.includes(query) ||
            description.includes(query)
          ) {
            results.push({
              id: deal.id,
              name: deal.name || "Unnamed Deal",
              type: "Deal",
              details: deal.account?.name || "No account",
              route: `/sales/deals/info?id=${deal.id}`,
            });
          }
        });
      }

      // Search in accounts
      if (Array.isArray(allAccounts)) {
        allAccounts.forEach((account) => {
          const name = (account.name || "").toLowerCase();
          const email = (account.email || "").toLowerCase();
          const phone = (account.phone || "").toLowerCase();
          const website = (account.website || "").toLowerCase();

          if (
            name.includes(query) ||
            email.includes(query) ||
            phone.includes(query) ||
            website.includes(query)
          ) {
            results.push({
              id: account.id,
              name: account.name || "Unnamed Account",
              type: "Account",
              details: account.email || account.phone || "No contact info",
              route: `/sales/accounts`,
            });
          }
        });
      }

      return results.slice(0, 10); // Limit to 10 results
    } catch (error) {
      console.error("Error in search:", error);
      return [];
    }
  }, [searchQuery, allLeads, allDeals, allAccounts]);

  // Handle search result click
  const handleSearchResultClick = (result) => {
    if (result.route) {
      navigate(result.route);
      setSearchQuery(""); // Clear search after navigation
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel with proper error handling
      const [
        leadsRes,
        dealsRes,
        accountsRes,
        tasksRes,
        meetingsRes,
        callsRes,
        logsRes,
        targetsRes,
      ] = await Promise.all([
        api.get("/leads/admin/getLeads").catch((err) => {
          console.error("Error fetching leads:", err);
          return { data: [] };
        }),
        api.get("/deals/admin/fetch-all").catch((err) => {
          console.error("Error fetching deals:", err);
          return { data: [] };
        }),
        api.get("/accounts/admin/fetch-all").catch((err) => {
          console.error("Error fetching accounts:", err);
          return { data: [] };
        }),
        api.get("/tasks/all").catch((err) => {
          console.error("Error fetching tasks:", err);
          return { data: [] };
        }),
        api.get("/meetings/admin/fetch-all").catch((err) => {
          console.error("Error fetching meetings:", err);
          return { data: [] };
        }),
        api.get("/calls/admin/fetch-all").catch((err) => {
          console.error("Error fetching calls:", err);
          return { data: [] };
        }),
        api.get("/logs/read-all").catch((err) => {
          console.error("Error fetching logs:", err);
          return { data: [] };
        }),
        api.get("/targets/admin/fetch-all").catch((err) => {
          console.error("Error fetching targets:", err);
          return { data: [] };
        }),
      ]);

      const leads = Array.isArray(leadsRes.data) ? leadsRes.data : [];
      const deals = Array.isArray(dealsRes.data) ? dealsRes.data : [];
      const accounts = Array.isArray(accountsRes.data) ? accountsRes.data : [];
      const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      const meetings = Array.isArray(meetingsRes.data) ? meetingsRes.data : [];
      const calls = Array.isArray(callsRes.data) ? callsRes.data : [];
      const logs = Array.isArray(logsRes.data) ? logsRes.data : [];
      const targets = Array.isArray(targetsRes.data) ? targetsRes.data : [];

      // Log raw deals data structure
      console.log("=== RAW DEALS API RESPONSE ===");
      console.log("Deals count:", deals.length);
      if (deals.length > 0) {
        console.log(
          "First deal sample (raw):",
          JSON.stringify(deals[0], null, 2)
        );
        console.log("First deal keys:", Object.keys(deals[0]));
      }

      // Store all data for search functionality
      setAllLeads(leads);
      setAllDeals(deals);
      setAllAccounts(accounts);

      setAllTargets(targets);

      const totalTargetVal = targets.reduce((sum, t) => {
        const val = t.amount || t.value || t.target_amount || 0;
        const numericVal =
          typeof val === "string"
            ? parseFloat(val.replace(/[^\d.-]/g, ""))
            : parseFloat(val);
        return sum + (Number.isFinite(numericVal) ? numericVal : 0);
      }, 0);

      setTotalTarget(totalTargetVal);

      // Calculate metrics dynamically
      const activeLeads = leads.filter(
        (lead) => lead.status && !["Lost", "Converted"].includes(lead.status)
      ).length;

      const overdueTasks = tasks.filter((task) => {
        if (!task.dueDate || task.status === "Completed") return false;
        return new Date(task.dueDate) < new Date();
      }).length;

      // Calculate completed items
      const completedTasks = tasks.filter((task) => {
        const status = (task.status || '').toLowerCase();
        return status === 'completed';
      }).length;

      const completedMeetings = meetings.filter((meeting) => {
        const status = (meeting.status || '').toUpperCase();
        return status === 'COMPLETED' || status === 'DONE';
      }).length;

      const completedCalls = calls.filter((call) => {
        const status = (call.status || '').toUpperCase();
        return status === 'COMPLETED' || status === 'HELD';
      }).length;

      setMetrics({
        activeLeads,
        totalDeals: deals.length,
        activeAccounts: accounts.length,
        overdueTasks,
        completedTasks,
        completedMeetings,
        completedCalls,
      });

      // Get latest leads (sorted by created_at descending - most recent first) - dynamic
      const sortedLeads = [...leads]
        .sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        )
        .slice(0, 5); // Show 5 most recent
      setLatestLeads(sortedLeads);

      // Get latest deals (sorted by created_at descending - most recent first) - dynamic
      const sortedDeals = [...deals]
        .sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        )
        .slice(0, 5); // Show 5 most recent
      setLatestDeals(sortedDeals);

      // Get upcoming calls and meetings (most recent, prioritize high priority)
      const now = new Date();
      const activities = [];

      // Add upcoming calls
      calls.forEach((call) => {
        // Use due_date (which maps to call_time) for scheduled date
        const callDate = call.due_date || call.call_time;
        const status = (call.status || "").toUpperCase();

        if (callDate) {
          const callDateTime = new Date(callDate);
          // Exclude only completed or missed calls, show everything else
          const isExcluded =
            status === "COMPLETED" ||
            status === "MISSED" ||
            status === "NOT_HELD" ||
            status === "HELD";

          if (!isExcluded) {
            activities.push({
              type: "Call",
              title: call.subject || "Untitled Call",
              assignedTo:
                call.assigned_to ||
                (call.call_assign_to
                  ? `${call.call_assign_to.first_name || ""} ${
                      call.call_assign_to.last_name || ""
                    }`.trim()
                  : "Unassigned"),
              scheduledDate: callDate,
              priority: (call.priority || "MEDIUM").toUpperCase(),
              id: call.id,
              activityType: "call",
              fullData: call, // Store full call data for instant display
            });
          }
        }
      });

      // Add upcoming meetings
      meetings.forEach((meeting) => {
        // Use dueDate for scheduled date
        const meetingDate = meeting.dueDate || meeting.start_time;
        const status = (meeting.status || "").toUpperCase();

        if (meetingDate) {
          const meetingDateTime = new Date(meetingDate);
          // Exclude only completed or cancelled meetings, show everything else
          const isExcluded =
            status === "COMPLETED" ||
            status === "CANCELLED" ||
            status === "DONE";

          if (!isExcluded) {
            activities.push({
              type: "Meeting",
              title: meeting.subject || meeting.activity || "Untitled Meeting",
              assignedTo:
                meeting.assignedTo ||
                (meeting.meet_assign_to
                  ? `${meeting.meet_assign_to.first_name || ""} ${
                      meeting.meet_assign_to.last_name || ""
                    }`.trim()
                  : "Unassigned"),
              scheduledDate: meetingDate,
              priority: (meeting.priority || "MEDIUM").toUpperCase(),
              id: meeting.id,
              activityType: "meeting",
              fullData: meeting, // Store full meeting data for instant display
            });
          }
        }
      });

      // Sort activities: first by priority (HIGH > MEDIUM > LOW), then by date (most recent/upcoming first)
      const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      const sortedActivities = activities
        .sort((a, b) => {
          // First sort by priority
          const priorityA = priorityOrder[a.priority] || 3;
          const priorityB = priorityOrder[b.priority] || 3;
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          // If same priority, sort by date (most recent/upcoming first)
          const dateA = new Date(a.scheduledDate || 0);
          const dateB = new Date(b.scheduledDate || 0);
          return dateA - dateB;
        })
        .slice(0, 5); // Show max 5 most recent/upcoming activities
      setUpcomingActivities(sortedActivities);

      // Set pipeline and revenue data
      setSalesPipeline(deals);

      // Calculate activity completion data (tasks, meetings, calls)
      const calculateActivityCompletion = () => {
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;
        
        const tasksCurrentYear = new Array(12).fill(0);
        const tasksLastYear = new Array(12).fill(0);
        const meetingsCurrentYear = new Array(12).fill(0);
        const meetingsLastYear = new Array(12).fill(0);
        const callsCurrentYear = new Array(12).fill(0);
        const callsLastYear = new Array(12).fill(0);

        console.log('=== MY ACTIVITIES DEBUG ===');
        console.log('Total tasks:', tasks.length);
        console.log('Total meetings:', meetings.length);
        console.log('Total calls:', calls.length);

        let completedTasksCount = 0;
        let completedMeetingsCount = 0;
        let completedCallsCount = 0;

        // Process tasks
        tasks.forEach((task, index) => {
          if (index === 0) {
            console.log('Sample task:', {
              id: task.id,
              status: task.status,
              due_date: task.due_date,
              updated_at: task.updated_at,
            });
          }

          const status = (task.status || '').toLowerCase();
          if (status !== 'completed') return;

          completedTasksCount++;
          const completionDate = task.completedAt || task.completed_at || task.updatedAt || task.updated_at || task.dueDate || task.due_date;
          if (!completionDate) return;

          try {
            const date = new Date(completionDate);
            if (isNaN(date.getTime())) return;

            const year = date.getFullYear();
            const month = date.getMonth();

            if (year === currentYear) {
              tasksCurrentYear[month]++;
            } else if (year === lastYear) {
              tasksLastYear[month]++;
            }
          } catch (error) {
            console.error('Error parsing task date:', error);
          }
        });

        // Process meetings
        meetings.forEach((meeting, index) => {
          if (index === 0) {
            console.log('Sample meeting:', {
              id: meeting.id,
              status: meeting.status,
              dueDate: meeting.dueDate,
              updated_at: meeting.updated_at,
            });
          }

          const status = (meeting.status || '').toUpperCase();
          if (status !== 'COMPLETED' && status !== 'DONE') return;

          completedMeetingsCount++;
          const completionDate = meeting.completedAt || meeting.completed_at || meeting.updatedAt || meeting.updated_at || meeting.dueDate || meeting.start_time;
          if (!completionDate) return;

          try {
            const date = new Date(completionDate);
            if (isNaN(date.getTime())) return;

            const year = date.getFullYear();
            const month = date.getMonth();

            if (year === currentYear) {
              meetingsCurrentYear[month]++;
            } else if (year === lastYear) {
              meetingsLastYear[month]++;
            }
          } catch (error) {
            console.error('Error parsing meeting date:', error);
          }
        });

        // Process calls
        calls.forEach((call, index) => {
          if (index === 0) {
            console.log('Sample call:', {
              id: call.id,
              status: call.status,
              due_date: call.due_date,
              updated_at: call.updated_at,
            });
          }

          const status = (call.status || '').toUpperCase();
          if (status !== 'COMPLETED' && status !== 'HELD') return;

          completedCallsCount++;
          const completionDate = call.completedAt || call.completed_at || call.updatedAt || call.updated_at || call.due_date || call.call_time;
          if (!completionDate) return;

          try {
            const date = new Date(completionDate);
            if (isNaN(date.getTime())) return;

            const year = date.getFullYear();
            const month = date.getMonth();

            if (year === currentYear) {
              callsCurrentYear[month]++;
            } else if (year === lastYear) {
              callsLastYear[month]++;
            }
          } catch (error) {
            console.error('Error parsing call date:', error);
          }
        });

        console.log('Activities summary:', {
          completedTasks: completedTasksCount,
          completedMeetings: completedMeetingsCount,
          completedCalls: completedCallsCount,
          tasksCurrentYear,
          tasksLastYear,
          meetingsCurrentYear,
          meetingsLastYear,
          callsCurrentYear,
          callsLastYear,
        });

        return {
          tasks: {
            currentYear: tasksCurrentYear,
            lastYear: tasksLastYear,
          },
          meetings: {
            currentYear: meetingsCurrentYear,
            lastYear: meetingsLastYear,
          },
          calls: {
            currentYear: callsCurrentYear,
            lastYear: callsLastYear,
          },
        };
      };

      setTaskCompletionData(calculateActivityCompletion());

      // Log deals data for debugging
      console.log("=== ALL DEALS DATA ===");
      console.log("Total deals:", deals.length);
      const closedWonDeals = deals.filter((d) => {
        const stage = (d.stage || "").toUpperCase();
        return stage === "CLOSED_WON";
      });
      console.log("CLOSED_WON deals:", closedWonDeals.length);

      if (closedWonDeals.length > 0) {
        console.log("=== CLOSED_WON DEALS DETAILS ===");
        closedWonDeals.forEach((deal, idx) => {
          // Try to parse amount - handle Decimal types
          let amountValue = deal.amount;
          if (amountValue && typeof amountValue === "object") {
            if (amountValue.toString) {
              amountValue = parseFloat(amountValue.toString());
            } else {
              amountValue = parseFloat(amountValue);
            }
          } else {
            amountValue = parseFloat(amountValue) || 0;
          }

          console.log(`Deal ${idx + 1}:`, {
            id: deal.id,
            name: deal.name,
            stage: deal.stage,
            stage_upper: (deal.stage || "").toUpperCase(),
            amount: deal.amount,
            amount_parsed: amountValue,
            amount_type: typeof deal.amount,
            close_date: deal.close_date,
            close_date_type: typeof deal.close_date,
            close_date_value: deal.close_date
              ? new Date(deal.close_date)
              : null,
            has_close_date: !!deal.close_date,
            has_amount: amountValue > 0,
            all_keys: Object.keys(deal),
            full_deal: deal,
          });
        });
      } else {
        console.log("⚠️ No CLOSED_WON deals found!");
        console.log(
          "All deal stages:",
          deals.map((d) => d.stage)
        );
      }

      setRevenueData(deals);

      // Set audit logs (sorted by timestamp)
      const sortedLogs = [...logs].sort(
        (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
      );
      setAuditLogs(sortedLogs);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Dashboard | Sari-Sari CRM";
    console.log("SalesOverview mounted, fetching data...");
    fetchAllData();

    // Set up auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      console.log("Auto-refreshing dashboard data...");
      fetchAllData();
      setLastUpdate(new Date());
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchAllData]);

  // WebSocket connection for real-time updates (optional - won't break if unavailable)
  useEffect(() => {
    if (!user || !user.id) return;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      // Get WebSocket URL from API base URL
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost =
        window.location.hostname === "localhost"
          ? "localhost:8000"
          : window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/ws/notifications?user_id=${user.id}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ WebSocket connected for dashboard updates");
          reconnectAttempts = 0; // Reset on successful connection
        };

        ws.onmessage = (event) => {
          try {
            const notification = JSON.parse(event.data);
            console.log("🔔 Real-time notification received:", notification);

            // Refresh data when we receive notifications about changes
            if (notification.event) {
              const refreshEvents = [
                "new_task",
                "task_updated",
                "new_lead",
                "lead_updated",
                "new_deal",
                "deal_updated",
                "new_account",
                "account_updated",
                "new_meeting",
                "meeting_updated",
                "new_call",
                "call_updated",
              ];

              if (refreshEvents.includes(notification.event)) {
                console.log(
                  "🔄 Refreshing dashboard due to:",
                  notification.event
                );
                fetchAllData();
                setLastUpdate(new Date());
              }
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          // Silently handle WebSocket errors - it's optional functionality
          // Only log once to avoid spam
          if (reconnectAttempts === 0) {
            console.warn(
              "⚠️ WebSocket connection unavailable (this is optional)"
            );
          }
        };

        ws.onclose = () => {
          // Only attempt to reconnect if we haven't exceeded max attempts
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
        // Silently handle WebSocket initialization errors
        console.warn("⚠️ WebSocket not available (optional feature)");
      }
    };

    connectWebSocket();

    // Cleanup WebSocket on unmount
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

  // Metric configuration
  const metricsConfig = [
    {
      icon: IconUsers,
      title: "Active Leads",
      value: metrics.activeLeads,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => navigate("/sales/leads"),
    },
    {
      icon: IconFiTarget,
      title: "Total Targets",
      value: formatCurrency(totalTarget, currencySymbol),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      onClick: () => navigate("/sales/targets"),
    },
    {
       icon: IconFiBriefcase,
      title: "Total Deals",
      value: metrics.totalDeals,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      onClick: () => navigate("/sales/deals"),
    },
    {
      icon: IconClock,
      title: "Overdue Tasks",
      value: metrics.overdueTasks,
      color: "text-red-600",
      bgColor: "bg-red-50",
      onClick: () => navigate("/sales/tasks"),
    },
    {
      icon: IconFiCircleCheck,
      title: "Completed Tasks",
      value: metrics.completedTasks,
      color: "text-green-600",
      bgColor: "bg-green-50",
      onClick: () => navigate("/sales/tasks"),
    },
    {
      icon: IconFiCalendar,
      title: "Completed Meetings",
      value: metrics.completedMeetings,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      onClick: () => navigate("/sales/meetings"),
    },
    {
      icon: IconFiPhoneCall,
      title: "Completed Calls",
      value: metrics.completedCalls,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      onClick: () => navigate("/sales/calls"),
    },
  ];

  // Debug: Log render
  console.log(
    "SalesOverview rendering, loading:",
    loading,
    "error:",
    error
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-inter relative w-full">
      {/* Loading Spinner - Full page overlay */}
      {loading && <LoadingSpinner />}

      {/* CHANGED: max-w-7xl to max-w-screen-2xl 
        This increases the maximum width of the content on large screens.
      */}
      <div className="max-w-screen-2xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* ROW 1: Top Bar (Full Width) */}
        <div className="mb-8">
          <TopBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchResults={searchResults}
            onSearchResultClick={handleSearchResultClick}
          />
        </div>

        {/* ROW 2: Metrics Cards (Full Width) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 mb-8">
          {metricsConfig.map((metric) => (
            <MetricCard key={metric.title} {...metric} loading={loading} />
          ))}
        </div>

        {/* ROW 3: Recent Logs & My Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RecentLogsCard logs={auditLogs} loading={loading} />
          <MyActivitiesChart activityData={taskCompletionData} loading={loading} />
        </div>

        {/* ROW 4: Funnel Intelligence Section (With Targets passed in) */}
        <div className="mb-8">
          <FunnelWidget
            leads={allLeads}
            deals={allDeals}
            targets={allTargets}
            currencySymbol={currencySymbol}
            basePath="/sales"
            currentUser={user}
          />
        </div>

        {/* ROW 5: Revenue Chart */}
        <div className="grid grid-cols-1 mb-8">
          <RevenueChart revenueData={revenueData} loading={loading} />
        </div>

        {/* ROW 6: Detailed Lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ListCard title="Latest Leads">
            {latestLeads.length > 0 ? (
              latestLeads.map((lead, index) => (
                <LeadItem key={lead.id || index} {...lead} />
              ))
            ) : (
              <div className="text-sm text-gray-500 py-4 text-center">
                No leads found
              </div>
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
                  currencySymbol={currencySymbol}
                />
              ))
            ) : (
              <div className="text-sm text-gray-500 py-4 text-center">
                No deals found
              </div>
            )}
          </ListCard>

          <ListCard title="Upcoming Activities">
            {upcomingActivities.length > 0 ? (
              upcomingActivities.map((activity, index) => (
                <ActivityItem key={activity.id || index} {...activity} />
              ))
            ) : (
              <div className="text-sm text-gray-500 py-4 text-center">
                No upcoming activities
              </div>
            )}
          </ListCard>
        </div>
      </div>
    </div>
  );
};

export default SalesOverview;
