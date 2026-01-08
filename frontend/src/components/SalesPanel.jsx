import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
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
  FiGrid,
  FiX,
} from "react-icons/fi";
import { LuMapPin } from "react-icons/lu";
import SalesHeader from "./SalesHeader"; 
import useFetchUser from "../hooks/useFetchUser";

export default function SalesPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // ✅ Sidebar toggle state
  const [activityOpen, setActivityOpen] = useState(false);
  const { user } = useFetchUser();

  useEffect(() => {
    user && console.log("Fetched user:", user);
  }, [user]);

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
        <div className="px-4 py-3 bg-[#fbbf24] leading-none">
          <p className="text-gray-900 font-bold text-lg m-0 p-0"> Sari-Sari.CRM{" "}
          <span className="text-[12px] text-gray-700 font-medium align-bottom">
            v2
          </span>
        </p>
          {user && user.company && (
            <p className="text-[12px] text-gray-600 font-medium w-full truncate">
              {user.company.company_name}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
          <NavLink
            to="/sales/overview"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiHome className="text-lg" />
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/sales/hub"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiGrid className="text-lg" />
            <span>Sales Hub</span>
          </NavLink>

          <NavLink
            to="/sales/accounts"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiUsers className="text-lg" />
            <span>Accounts</span>
          </NavLink>

          <NavLink
            to="/sales/contacts"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiUser className="text-lg" />
            <span>Contacts</span>
          </NavLink>

          <NavLink
            to="/sales/leads"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiUserPlus className="text-lg" />
            <span>Leads</span>
          </NavLink>

          <NavLink
            to="/sales/deals"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiBriefcase className="text-lg" />
            <span>Deals</span>
          </NavLink>

          <NavLink
            to="/sales/quotes"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiFileText className="text-lg" />
            <span>Quotes</span>
          </NavLink>

          <NavLink
            to="/sales/targets"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiTarget className="text-lg" />
            <span>Targets</span>
          </NavLink>

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
                            to="/sales/tasks"
                            className={({ isActive }) => (isActive ? activeLink : normalLink)}
                          >
                            <FiCheckSquare /> Tasks
                          </NavLink>
                          <NavLink
                            to="/sales/meetings"
                            className={({ isActive }) => (isActive ? activeLink : normalLink)}
                          >
                            <FiCalendar /> Meetings
                          </NavLink>
                          <NavLink
                            to="/sales/calls"
                            className={({ isActive }) => (isActive ? activeLink : normalLink)}
                          >
                            <FiPhoneCall /> Calls
                          </NavLink>
                          <NavLink
                            to="/sales/audit"
              className={({ isActive }) => (isActive ? activeLink : normalLink)}
                          >
                            <FiClipboard /> Audit
                          </NavLink>
                        </div>
                      )}
                    </div>

                    {/* Territory */}
                              <div>
                                <NavLink
                                  to="/sales/territory"
                                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                                >
                                  <span className="flex items-center gap-2">
                                    <LuMapPin className="text-lg" />
                                    Territory
                                  </span>
                                </NavLink>
                              </div>

        
          <NavLink
            to="/sales/manage-account"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiUser className="text-lg" />
            <span>Manage Account</span>
          </NavLink>     
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
        {/* ✅ Only SalesHeader handles the menu toggle */}
        <SalesHeader toggleSidebar={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main
          className="flex-1 p-6 overflow-auto hide-scrollbar"
          style={{ backgroundColor: "#fffeee" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
