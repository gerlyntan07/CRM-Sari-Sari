import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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
import AdminHeader from "./AdminHeader";

export default function AdminPanel() {
  const [salesOpen, setSalesOpen] = useState(true);
  const location = useLocation();

  // styles
  const activeLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-[#1e293b] font-semibold shadow-sm";
  const normalLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#334155] hover:text-white transition";

  // expand Sales if a child is active
  const salesRoutes = [
    "/admin/accounts",
    "/admin/contacts",
    "/admin/leads",
    "/admin/deals",
    "/admin/quotes",
    "/admin/targets",
  ];
  const isSalesActive = salesRoutes.includes(location.pathname);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-[#1e293b] text-white flex flex-col fixed top-0 left-0 h-screen shadow-lg">
        {/* Logo */}
        <div className="bg-[#fbbf24] text-gray-900 font-bold text-xl px-6 py-4 tracking-wide">
          CRM ni Josh
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Dashboard */}
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiHome className="text-lg" />
            <span>Dashboard</span>
          </NavLink>

          {/* Sales Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-[#334155] rounded-lg transition"
              onClick={() => setSalesOpen(!salesOpen)}
            >
              <span className="flex items-center gap-2">
                <FiBriefcase className="text-lg" />
                Sales
              </span>
              <FiChevronDown
                className={`transition-transform ${salesOpen || isSalesActive ? "rotate-180" : ""}`}
              />
            </button>

            {(salesOpen || isSalesActive) && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/admin/accounts"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiUsers /> Accounts
                </NavLink>
                <NavLink
                  to="/admin/contacts"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiUser /> Contacts
                </NavLink>
                <NavLink
                  to="/admin/leads"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiUserPlus /> Leads
                </NavLink>
                <NavLink
                  to="/admin/deals"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiBriefcase /> Deals
                </NavLink>
                <NavLink
                  to="/admin/quotes"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiFileText /> Quotes
                </NavLink>
                <NavLink
                  to="/admin/targets"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiTarget /> Targets
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-700">
          © {new Date().getFullYear()} CRM ni Josh
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <AdminHeader />

        {/* Page Content */}
      <main className="flex-1 p-6" style={{ backgroundColor: "#fffeee" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
