import { FiSearch, FiTrendingUp, FiUsers, FiBriefcase, FiFileText } from "react-icons/fi";
import useFetchUser from "../hooks/useFetchUser";

export default function MarketingDashboard() {
  const { user } = useFetchUser();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Welcome Section */}
      <h1 className="text-2xl font-semibold mb-6">
        Welcome back,{" "}
        <span className="text-gray-700">
          {user?.first_name} {user?.last_name}!
        </span>
      </h1>

      {/* Search & Quick Actions */}
      <div className="bg-gray-600 rounded-md p-3 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
        <div className="flex items-center bg-white rounded px-3 py-2 w-full md:w-1/3">
          <FiSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search campaigns, contacts..."
            className="w-full outline-none text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-white">
          {[
            "New Campaign",
            "New Lead",
            "New Deal",
            "New Contact",
            "Schedule Meeting",
            "Log Call",
          ].map((action) => (
            <button
              key={action}
              className="bg-[#1e293b] hover:bg-[#334155] px-3 py-1 rounded transition"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Total Leads</p>
            <FiUsers className="text-blue-500" />
          </div>
          <p className="text-2xl font-semibold mt-2">128</p>
          <p className="text-xs text-green-600 mt-1">+12% this month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Open Deals</p>
            <FiBriefcase className="text-green-500" />
          </div>
          <p className="text-2xl font-semibold mt-2">45</p>
          <p className="text-xs text-green-600 mt-1">+5% this week</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Campaigns</p>
            <FiTrendingUp className="text-purple-500" />
          </div>
          <p className="text-2xl font-semibold mt-2">9</p>
          <p className="text-xs text-red-500 mt-1">-2% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Pending Quotes</p>
            <FiFileText className="text-yellow-500" />
          </div>
          <p className="text-2xl font-semibold mt-2">6</p>
          <p className="text-xs text-green-600 mt-1">+1 since yesterday</p>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Chart Section */}
        <div className="bg-white rounded-md shadow p-4 col-span-2 h-72 flex items-center justify-center border">
          <p className="text-gray-400">[Bar / Line Chart Placeholder]</p>
        </div>

        {/* Pipeline Summary */}
        <div className="bg-white rounded-md shadow overflow-hidden border">
          <div className="bg-[#1e293b] text-white px-4 py-2 font-semibold">
            My Open Pipeline
          </div>
          <div className="p-4 text-sm">
            <div className="flex justify-between border-b pb-2 mb-2">
              <div>
                <p>Total Value:</p>
                <p className="font-bold">$250,000.00</p>
              </div>
              <div>
                <p>Weighted Value:</p>
                <p className="font-bold">$150,000.00</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-semibold">Deals:</p>
              <ul className="pl-4 list-disc">
                <li>Acme Corp. (80%) – <b>Proposal</b></li>
                <li>New Server Install (50%) – <b>Negotiation</b></li>
                <li>Consulting Project (30%) – <b>Qualified</b></li>
              </ul>
            </div>

            <div className="mb-4">
              <p className="font-semibold">Leads:</p>
              <ul className="pl-4 list-disc">
                <li>Sarah Williams – <span className="text-yellow-600">Qualified</span></li>
                <li>David Miller – <span className="text-blue-600">Contacted</span></li>
                <li>Jessica Lee – <span className="text-green-600">New</span></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">Quotes:</p>
              <ul className="pl-4 list-disc">
                <li>QUO-2025-001 – <span className="text-red-600">Sent</span></li>
                <li>QUO-2025-002 – <span className="text-gray-500">Draft</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-md shadow p-4 mt-6 border">
        <h2 className="text-lg font-semibold mb-3">Recent Activities</h2>
        <ul className="text-sm space-y-2 text-gray-600">
          <li>✅ You created a new campaign <b>“Spring Email Blast”</b>.</li>
          <li>📞 You followed up with <b>David Miller</b>.</li>
          <li>📊 Updated deal stage for <b>Acme Corp.</b> to <b>Negotiation</b>.</li>
          <li>🧾 Sent quote <b>QUO-2025-001</b> to <b>Sarah Williams</b>.</li>
        </ul>
      </div>
    </div>
  );
}
