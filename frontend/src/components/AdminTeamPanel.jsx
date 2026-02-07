import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FiHome,
  FiMessageSquare,
  FiHeadphones,
  FiCreditCard,
  FiUsers,
  FiSettings,
  FiHelpCircle,
  FiActivity,
} from "react-icons/fi";
import AdminHeader from "./AdminHeader";
import useFetchUser from "../hooks/useFetchUser";

export default function AdminTeamPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useFetchUser();

  useEffect(() => {
    document.title = `Support Team | Sari-Sari CRM`;
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
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-4 py-3 bg-[#10b981] leading-none">
          <p className="text-white font-bold text-lg m-0 p-0">
            Sari-Sari.CRM{" "}
            <span className="text-[12px] text-green-200 font-medium align-bottom">
              Support
            </span>
          </p>
          {user && user.company && (
            <p className="text-[12px] text-green-100 font-medium w-full truncate">
              Admin Team
            </p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
          {/* Dashboard */}
          <NavLink
            to="/support/dashboard"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiActivity className="text-lg" />
            <span>Dashboard</span>
          </NavLink>

          {/* Support Tickets */}
          <NavLink
            to="/support/tickets"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiMessageSquare className="text-lg" />
            <span>Support Tickets</span>
          </NavLink>

          {/* Live Chat */}
          <NavLink
            to="/support/chat"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiHeadphones className="text-lg" />
            <span>Live Chat</span>
          </NavLink>

          {/* Subscriptions */}
          <NavLink
            to="/support/subscriptions"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiCreditCard className="text-lg" />
            <span>Subscriptions</span>
          </NavLink>

          {/* Divider */}
          <div className="border-t border-gray-700 my-4"></div>

          {/* Help Center (same as users) */}
          <NavLink
            to="/support/help"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiHelpCircle className="text-lg" />
            <span>Help Center</span>
          </NavLink>

          {/* Settings */}
          <NavLink
            to="/support/settings"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiSettings className="text-lg" />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* User Info at bottom */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.first_name?.[0] || "S"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 lg:ml-64 overflow-hidden">
        <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-auto bg-gray-100 p-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
