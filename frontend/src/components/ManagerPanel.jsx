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
  FiClipboard,
} from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi2";
import ManagerHeader from "./ManagerHeader";
import useFetchUser from "../hooks/useFetchUser";

export default function ManagerPanel() {
  const [salesOpen, setSalesOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { fetchUser } = useFetchUser();

  useEffect(() => {
    fetchUser();
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
    "/manager/teams",
  ];
  const isSalesActive = salesRoutes.includes(location.pathname);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[#1e293b] text-white shadow-lg transform transition-transform duration-300 z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="bg-[#fbbf24] text-gray-900 font-bold text-xl px-6 py-4 tracking-wide">
          Manager CRM
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <NavLink
            to="/manager/overview"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiHome className="text-lg" />
            <span>Overview</span>
          </NavLink>

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
                <NavLink
                  to="/manager/audit"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiClipboard /> Audit
                </NavLink>
                <NavLink
                  to="/manager/teams"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <HiOutlineUserGroup /> Team Management
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-700">
          © {new Date().getFullYear()} CRM ni Josh
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
