import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiUser,
  FiUserPlus,
  FiBriefcase,
  FiFileText,
  FiTarget,
  FiChevronDown,
} from "react-icons/fi";

export default function AdminPanel() {
  const [salesOpen, setSalesOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-[#1e293b] text-white flex flex-col fixed top-0 left-0 h-screen">
        <div className="bg-[#fbbf24] text-gray-900 font-bold text-lg px-4 py-3">
          CRM ni Josh
        </div>

        <nav className="flex-1 overflow-y-auto">
          {/* Dashboard */}
          <Link
            to="/admin/dashboard"
            className="px-4 py-2 hover:bg-[#334155] cursor-pointer flex items-center gap-2"
          >
            <FiHome className="text-xl" />
            <span>Dashboard</span>
          </Link>

          {/* Sales Dropdown */}
          <div>
            <button
              className="w-full px-4 py-2 flex justify-between items-center text-left hover:bg-[#334155]"
              onClick={() => setSalesOpen(!salesOpen)}
            >
              <span>Sales</span>
              <FiChevronDown
                className={`transition-transform ${salesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {salesOpen && (
              <div className="ml-6 space-y-2">
                <Link
                  to="/admin/accounts"
                  className="flex items-center gap-2 px-2 py-1 hover:bg-[#475569] rounded cursor-pointer"
                >
                  <FiUsers /> Accounts
                </Link>
                <Link
                  to="/admin/contacts"
                  className="flex items-center gap-2 px-2 py-1 hover:bg-[#475569] rounded cursor-pointer"
                >
                  <FiUser /> Contacts
                </Link>
                <Link
                  to="/admin/leads"
                  className="flex items-center gap-2 px-2 py-1 hover:bg-[#475569] rounded cursor-pointer"
                >
                  <FiUserPlus /> Leads
                </Link>
                <Link
                  to="/admin/deals"
                  className="flex items-center gap-2 px-2 py-1 hover:bg-[#475569] rounded cursor-pointer"
                >
                  <FiBriefcase /> Deals
                </Link>
                <Link
                  to="/admin/quotes"
                  className="flex items-center gap-2 px-2 py-1 hover:bg-[#475569] rounded cursor-pointer"
                >
                  <FiFileText /> Quotes
                </Link>
                <Link
                  to="/admin/targets"
                  className="flex items-center gap-2 px-2 py-1 hover:bg-[#475569] rounded cursor-pointer"
                >
                  <FiTarget /> Targets
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Right content area */}
      <div className="flex-1 bg-[#fefce8] ml-64 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
