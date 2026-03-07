import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FiHome,
  FiHelpCircle,
  FiSettings,
  FiAlertTriangle,
  FiUsers,
  FiMessageSquare,
  FiClipboard,
  FiBarChart,
  FiChevronDown,
  FiTool,
  FiBell,
  FiBook,
  FiHeadphones,
  FiMonitor,
} from "react-icons/fi";
import TechnicalSupportHeader from "./TechnicalSupportHeader";
import useFetchUser from "../hooks/useFetchUser";

export default function TechnicalSupportPanel() {
  const [ticketOpen, setTicketOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar
  const location = useLocation();
  const { user } = useFetchUser();

  useEffect(() => {
    user && console.log("Fetched user:", user);
  }, [user]);

  useEffect(() => {
    document.title = `Technical Support | Sari-Sari CRM`;
  }, []);

  const ticketRoutes = [
    "/technical-support/tickets",
    "/technical-support/knowledge-base",
    "/technical-support/user-support",
  ];
  const isTicketActive = ticketRoutes.includes(location.pathname);

  const systemRoutes = [
    "/technical-support/system-alerts",
    "/technical-support/system-monitoring",
    "/technical-support/maintenance",
  ];
  const isSystemActive = systemRoutes.includes(location.pathname);

  // Auto-open dropdowns when navigating to related routes
  useEffect(() => {
    if (isTicketActive) {
      setTicketOpen(true);
    }
    if (isSystemActive) {
      setSystemOpen(true);
    }
  }, [location.pathname, isTicketActive, isSystemActive]);

  const activeLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-[#1e293b] font-semibold shadow-sm";
  const normalLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#334155] hover:text-white transition";

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[#1e293b] text-white flex flex-col shadow-lg transform transition-transform duration-300 z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-4 py-3 bg-[#fbbf24] leading-none">
          <p className="text-gray-900 font-bold text-lg m-0 p-0"> Sari-Sari.CRM{" "}
            <span className="text-[12px] text-gray-700 font-medium align-bottom">
              v2
            </span>
          </p>
          {user && user.company && (
            <p
              className="text-[12px] text-gray-600 font-medium w-full truncate"
              title={user.company.company_name}
            >
              {user.company.slug || user.company.company_name}
            </p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
          {/* Dashboard */}
          <NavLink
            to="/technical-support/dashboard"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiHome className="text-lg" />
            <span>Dashboard</span>
          </NavLink>

          {/* Ticket Management Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-[#334155] rounded-lg transition"
              onClick={() => setTicketOpen(!ticketOpen)}
            >
              <span className="flex items-center gap-2">
                <FiHeadphones className="text-lg" />
                Support Center
              </span>
              <FiChevronDown
                className={`transition-transform ${ticketOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {ticketOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/technical-support/tickets"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiMessageSquare /> Handle Tickets
                </NavLink>
                <NavLink
                  to="/technical-support/knowledge-base"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiBook /> Knowledge Base
                </NavLink>
                <NavLink
                  to="/technical-support/user-support"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiUsers /> User Support
                </NavLink>
              </div>
            )}
          </div>

          {/* System Management Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-[#334155] rounded-lg transition"
              onClick={() => setSystemOpen(!systemOpen)}
            >
              <span className="flex items-center gap-2">
                <FiMonitor className="text-lg" />
                System Management
              </span>
              <FiChevronDown
                className={`transition-transform ${systemOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {systemOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/technical-support/system-alerts"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiBell /> System Alerts
                </NavLink>
                <NavLink
                  to="/technical-support/system-monitoring"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiBarChart /> System Monitoring
                </NavLink>
                <NavLink
                  to="/technical-support/maintenance"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiTool /> Maintenance
                </NavLink>
              </div>
            )}
          </div>

          {/* Reports */}
          <NavLink
            to="/technical-support/reports"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiClipboard className="text-lg" />
            <span>Reports</span>
          </NavLink>

          {/* Settings */}
          <NavLink
            to="/technical-support/settings"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiSettings className="text-lg" />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
              {user?.first_name ? user.first_name.charAt(0).toUpperCase() : "T"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : "Technical Support"}
              </p>
              <p className="text-xs text-gray-400 truncate">Technical Support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col overflow-hidden">
        {/* Header */}
        <TechnicalSupportHeader />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#1e293b] text-white p-2 rounded-md"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}