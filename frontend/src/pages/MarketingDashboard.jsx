import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiUsers,
  FiDollarSign,
  FiArrowUpRight,
  FiCheckCircle,
  FiFileText,
  FiArrowRight,
} from "react-icons/fi";
import { FaHandshakeAngle } from "react-icons/fa6";
import useFetchUser from "../hooks/useFetchUser";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// --- Icons ---
const IconSearch = (props) => <FiSearch {...props} />;
const IconUsers = (props) => <FiUsers {...props} />;
const IconDollarSign = (props) => <FiDollarSign {...props} />;
const IconArrowRight = (props) => <FiArrowRight {...props} />;
const IconTrendUp = (props) => <FiArrowUpRight {...props} />;
const IconCircleCheck = (props) => <FiCheckCircle {...props} />;
const IconFileLines = (props) => <FiFileText {...props} />;
const IconHand = (props) => <FaHandshakeAngle {...props} />;

// --- Mock Data ---
const METRICS = [
  {
    icon: IconUsers,
    title: "Total Contacts",
    value: 128,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: IconFileLines,
    title: "Emails Sent",
    value: 450,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: IconTrendUp,
    title: "Active Campaigns",
    value: 9,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: IconDollarSign,
    title: "Revenue",
    value: 125000,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
];

const LATEST_LEADS = [
  {
    name: "Emma Watty",
    company: "Tech Interaction Inc.",
    assignedBy: "Alice Smith",
    source: "Website",
    date: "Oct 10, 2:10 PM",
  },
  {
    name: "John Johnny",
    company: "Capital Business Co.",
    assignedBy: "Bob Johnson",
    source: "Referral",
    date: "Oct 9, 12:00 AM",
  },
  {
    name: "Annie Arnty",
    company: "Dynamic Systems Inc.",
    assignedBy: "Catherine Lee",
    source: "Trade Show",
    date: "Oct 8, 1:25 PM",
  },
  {
    name: "James Wilson",
    company: "Global Services LLC",
    assignedBy: "David Kim",
    source: "Cold Call",
    date: "Oct 7, 11:15 AM",
  },
];

// --- Chart Data ---
const LEADS_CONVERSION_DATA = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  datasets: [
    {
      label: "Leads",
      data: [50, 75, 60, 90],
      backgroundColor: "rgba(96, 165, 250, 0.6)",
      borderColor: "rgba(96, 165, 250, 1)",
      borderWidth: 1,
    },
    {
      label: "Conversions",
      data: [10, 20, 15, 25],
      backgroundColor: "rgba(34, 197, 94, 0.6)",
      borderColor: "rgba(34, 197, 94, 1)",
      borderWidth: 1,
    },
  ],
};

const LEADS_CONVERSION_OPTIONS = {
  responsive: true,
  plugins: {
    legend: { position: "top", labels: { color: "#374151" } },
    title: { display: true, color: "#111827", font: { size: 18 } },
  },
};

const LEADS_CONVERSION_PIE_DATA = {
  labels: ["Leads", "Conversions"],
  datasets: [
    {
      label: "Leads Status",
      data: [75, 25],
      backgroundColor: ["rgba(96, 165, 250, 0.6)", "rgba(34, 197, 94, 0.6)"],
      borderColor: ["rgba(96, 165, 250, 1)", "rgba(34, 197, 94, 1)"],
      borderWidth: 1,
    },
  ],
};

const LEADS_CONVERSION_OPTIONS_PIE = {
  responsive: true,
  plugins: {
    legend: { position: "top", labels: { color: "#374151" } },
    title: { display: true, color: "#111827", font: { size: 18 } },
  },
};

// --- Utility ---
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

// --- Components ---
const TopBar = () => {
  const actionIcons = [
    { icon: IconUsers, label: "New Contact" },
    { icon: IconFileLines, label: "New Campaign" },
    { icon: IconCircleCheck, label: "New Task" },
    { icon: IconHand, label: "New Leads" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4">
      <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 flex-grow focus-within:ring-2 focus-within:ring-indigo-500 transition w-full sm:max-w-md">
        <IconSearch size={20} className="text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Search Contacts, Leads, or Campaigns..."
          className="focus:outline-none text-base w-full"
        />
      </div>
      <div className="flex space-x-3 justify-around w-full md:w-auto">
        {actionIcons.map((item, idx) => (
          <div key={idx} className="relative group">
            <button className="p-2 text-gray-500 hover:text-gray-900 transition rounded-full hover:bg-gray-100 focus:outline-none">
              <item.icon size={20} />
            </button>
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, title, value, color, bgColor }) => (
  <div
    className="flex items-center p-4 bg-white rounded-xl shadow-lg transition duration-300 hover:shadow-xl hover:ring-2 hover:ring-blue-500 cursor-pointer"
    onClick={() => console.log(`Clicked metric card: ${title}`)}
  >
    <div className={`p-3 rounded-full ${bgColor} ${color} mr-4`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-xs text-gray-500 uppercase">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const LeadItem = ({ name, company, assignedBy, source, date }) => {
  const { text, bg } = getLeadSourceClasses(source);
  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded-md">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-gray-800">{name}</p>
          <p className="text-xs text-gray-500">{company}</p>
          {assignedBy && (
            <p className="text-xs text-gray-500">
              Assigned by:{" "}
              <span className="font-semibold text-gray-700">{assignedBy}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{date}</p>
          <span
            className={`inline-block mt-1 text-xs font-medium ${text} ${bg} px-2 py-0.5 rounded-full`}
          >
            {source}
          </span>
        </div>
      </div>
    </div>
  );
};

const ListCard = ({ title, children }) => (
  <div className="bg-white p-5 rounded-xl shadow-md flex flex-col">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <span className="text-sm text-indigo-500 cursor-pointer hover:underline">
        See All
      </span>
    </div>
    {children}
  </div>
);

const GraphCard = ({ title, chartData, chartOptions }) => {
  const [chartType, setChartType] = useState("bar");
  const dataToUse = chartType === "pie" ? LEADS_CONVERSION_PIE_DATA : chartData;
  const optionsToUse =
    chartType === "pie" ? LEADS_CONVERSION_OPTIONS_PIE : chartOptions;
  const ChartComponent =
    chartType === "line" ? Line : chartType === "pie" ? Pie : Bar;
  const chartHeight = chartType === "pie" ? 250 : 300;

  return (
    <div className="bg-white p-4 rounded-xl shadow-md flex flex-col hover:shadow-lg transition">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          <option value="bar">Bar</option>
          <option value="line">Line</option>
          <option value="pie">Pie</option>
        </select>
      </div>
      <div
        className="w-full flex justify-center"
        style={{ height: chartHeight }}
      >
        <ChartComponent data={dataToUse} options={optionsToUse} />
      </div>
    </div>
  );
};

// --- Main Component ---
export default function MarketingDashboard() {
  const { user } = useFetchUser();

  useEffect(() => {
    document.title = "Dashboard | Sari-Sari CRM";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-5 pb-10 font-sans">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-xl font-bold mb-4">
          Welcome back, {user?.name || "Marketing"}! Here’s your marketing
          overview.
        </div>

        <TopBar />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {METRICS.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <GraphCard
            title="Leads & Conversions"
            chartData={LEADS_CONVERSION_DATA}
            chartOptions={LEADS_CONVERSION_OPTIONS}
          />
          <ListCard title="Latest Leads">
            {LATEST_LEADS.map((lead, idx) => (
              <LeadItem key={idx} {...lead} />
            ))}
          </ListCard>
        </div>
      </main>
    </div>
  );
}
