import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiUser,
  FiUserPlus,
  FiBriefcase,
  FiTarget,
  FiChevronDown,
  FiCheckSquare,
  FiClipboard,
  FiSend,
  FiLayout,
} from "react-icons/fi";
import MarketingHeader from "./MarketingHeader";
import useFetchUser from "../hooks/useFetchUser";

export default function MarketingPanel() {
  const [marketingToolsOpen, setMarketingToolsOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
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

  const marketingRoutes = ["/marketing/campaigns", "/marketing/templates"];
  const salesRoutes = [
    "/marketing/accounts",
    "/marketing/contacts",
    "/marketing/leads",
  ];
  const activityRoutes = ["/marketing/tasks"];

  const isMarketingActive = marketingRoutes.includes(location.pathname);
  const isSalesActive = salesRoutes.includes(location.pathname);
  const isActivityActive = activityRoutes.includes(location.pathname);

  // Auto expand if route is active
  useEffect(() => {
    if (isMarketingActive) setMarketingToolsOpen(true);
    if (isSalesActive) setSalesOpen(true);
    if (isActivityActive) setActivityOpen(true);
  }, [isMarketingActive, isSalesActive, isActivityActive]);

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

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Dashboard */}
          <NavLink
            to="/marketing/dashboard"
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
                className={`transition-transform ${
                  salesOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {salesOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/marketing/accounts"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiUsers /> Accounts
                </NavLink>
                <NavLink
                  to="/marketing/contacts"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiUser /> Contacts
                </NavLink>
                <NavLink
                  to="/marketing/leads"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiUserPlus /> Leads
                </NavLink>
              </div>
            )}
          </div>

          {/* Marketing Tools Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-[#334155] rounded-lg transition"
              onClick={() => setMarketingToolsOpen(!marketingToolsOpen)}
            >
              <span className="flex items-center gap-2">
                <FiTarget className="text-lg" />
                Tools
              </span>
              <FiChevronDown
                className={`transition-transform ${
                  marketingToolsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {marketingToolsOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/marketing/campaigns"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiSend /> Campaign
                </NavLink>
                <NavLink
                  to="/marketing/templates"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiLayout /> Templates
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
                className={`transition-transform ${
                  activityOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {activityOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/marketing/tasks"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiCheckSquare /> Tasks
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-700">
          © {new Date().getFullYear()} Marketing CRM
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
