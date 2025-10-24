import { FiSearch } from "react-icons/fi";
import useFetchUser from "../hooks/useFetchUser";

export default function AdminDashboard() {
  const {user} = useFetchUser();


  return (
    <div className="p-6">
      {/* Welcome */}
      <h1 className="text-xl font-semibold mb-6">
        Welcome back, <span className="text-gray-700">{user?.first_name} {user?.last_name}!</span>
      </h1>

      {/* Search + Quick Actions */}
      <div className="bg-gray-500 rounded-md p-3 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
        <div className="flex items-center bg-white rounded px-2 py-1 w-full md:w-1/3">
          <FiSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search"
            className="w-full outline-none text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-white">
          <button className="bg-[#1e293b] px-3 py-1 rounded">New Account</button>
          <button className="bg-[#1e293b] px-3 py-1 rounded">New Contact</button>
          <button className="bg-[#1e293b] px-3 py-1 rounded">New Deals</button>
          <button className="bg-[#1e293b] px-3 py-1 rounded">New Leads</button>
          <button className="bg-[#1e293b] px-3 py-1 rounded">New Meeting</button>
          <button className="bg-[#1e293b] px-3 py-1 rounded">New Task</button>
          <button className="bg-[#1e293b] px-3 py-1 rounded">New Quotes</button>
          <button className="bg-[#1e293b] px-3 py-1 rounded">Log Calls</button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Chart Section */}
        <div className="bg-white rounded-md shadow p-4 col-span-2 h-64 flex items-center justify-center border">
          <p className="text-gray-400">[Bar Chart Placeholder]</p>
        </div>

        {/* Pipeline Card */}
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
                <li>Acme Corp. Contract (80%) – <b>Proposal</b></li>
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
    </div>
  );
}
