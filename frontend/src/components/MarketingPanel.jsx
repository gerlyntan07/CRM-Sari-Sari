import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiUserPlus,
  FiFileText,
  FiClipboard,
  FiBarChart2,
  FiMail,
} from "react-icons/fi";
import MarketingHeader from "./MarketingHeader";
import useFetchUser from "../hooks/useFetchUser";

export default function MarketingPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[#1e293b] text-white flex flex-col shadow-lg transform transition-transform duration-300 z-50
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="bg-[#fbbf24] text-gray-900 font-bold text-xl px-6 py-4 tracking-wide">
          Marketing CRM
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Overview */}
          <NavLink
            to="/marketing/dashboard"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiHome className="text-lg" />
            <span>Dashboard</span>
          </NavLink>

          {/* Contacts */}
          <NavLink
            to="/marketing/contacts"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiUsers className="text-lg" />
            <span>Contacts</span>
          </NavLink>

          {/* Campaigns */}
          <NavLink
            to="/marketing/campaigns"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiMail className="text-lg" />
            <span>Campaigns</span>
          </NavLink>

          {/* Leads */}
          <NavLink
            to="/marketing/leads"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiUserPlus className="text-lg" />
            <span>Leads</span>
          </NavLink>

          {/* Templates */}
          <NavLink
            to="/marketing/templates"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiFileText className="text-lg" />
            <span>Templates</span>
          </NavLink>

          {/* Tasks */}
          <NavLink
            to="/marketing/tasks"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiClipboard className="text-lg" />
            <span>Tasks</span>
          </NavLink>

          {/* Analytics */}
          <NavLink
            to="/marketing/analytics"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiBarChart2 className="text-lg" />
            <span>Analytics</span>
          </NavLink>
        </nav>

        {/* Footer */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
        <MarketingHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
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
