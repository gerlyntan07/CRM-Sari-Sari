import { useEffect, useState } from "react";
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
  FiCheckSquare,
  FiCalendar,
  FiPhoneCall,
  FiClipboard,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import ManagerHeader from "./ManagerHeader";
import useFetchUser from "../hooks/useFetchUser";

export default function ManagerPanel() {
  const [salesOpen, setSalesOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(false);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar
  const location = useLocation();
  const { fetchUser } = useFetchUser();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    document.title = `Panel | Sari-Sari CRM`;
  }, []);

  const activeLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-[#1e293b] font-semibold shadow-sm";
  const normalLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#334155] hover:text-white transition";

  const salesRoutes = [
    "/manager/accounts",
    "/manager/contacts",
    "/manager/leads",
    "/manager/deals",
    "/manager/quotes",
    "/manager/targets",
    "/manager/meetings",
    "/manager/manage-account",
  ];
  const isSalesActive = salesRoutes.includes(location.pathname);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[#1e293b] text-white flex flex-col shadow-lg transform transition-transform duration-300 z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="bg-[#fbbf24] text-gray-900 font-bold text-xl px-6 py-4.5 tracking-wide">
          Manager CRM
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Dashboard */}
          <NavLink
            to="/manager/dashboard"
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
                  to="/manager/accounts"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiUsers /> Accounts
                </NavLink>
                <NavLink
                  to="/manager/contacts"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiUser /> Contacts
                </NavLink>
                <NavLink
                  to="/manager/leads"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiUserPlus /> Leads
                </NavLink>
                <NavLink
                  to="/manager/deals"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiBriefcase /> Deals
                </NavLink>
                <NavLink
                  to="/manager/quotes"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiFileText /> Quotes
                </NavLink>
                <NavLink
                  to="/manager/targets"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiTarget /> Targets
                </NavLink>
              </div>
            )}
          </div>

          {/* Activity Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-[#334155] rounded-lg transition"
              onClick={() => setActivityOpen(!activityOpen)}
            >
              <span className="flex items-center gap-2">
                <FiClipboard className="text-lg" />
                Activity
              </span>
              <FiChevronDown
                className={`transition-transform ${activityOpen ? "rotate-180" : ""}`}
              />
            </button>

            {activityOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/manager/tasks"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiCheckSquare /> Tasks
                </NavLink>
                <NavLink
                  to="/manager/meetings"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiCalendar /> Meetings
                </NavLink>
                <NavLink
                  to="/manager/calls"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiPhoneCall /> Calls
                </NavLink>
                <NavLink
                  to="/manager/audit"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiClipboard /> Audit
                </NavLink>
              </div>
            )}
          </div>

          {/* User Management Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-[#334155] rounded-lg transition"
              onClick={() => setUserMgmtOpen(!userMgmtOpen)}
            >
              <span className="flex items-center gap-2">
                <FiSettings className="text-lg" />
                User Management
              </span>
              <FiChevronDown
                className={`transition-transform ${userMgmtOpen ? "rotate-180" : ""}`}
              />
            </button>

            {userMgmtOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/manager/users"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiUsers /> Users
                </NavLink>
                <NavLink
                  to="/manager/manage-account"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiUser /> Manage Account
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-700">
          © {new Date().getFullYear()} Sari-Sari CRM 
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
        <ManagerHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main
          className="flex-1 p-6 overflow-auto"
          style={{ backgroundColor: "#fffeee" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
