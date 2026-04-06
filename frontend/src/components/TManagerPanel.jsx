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
  FiMail,
  FiTrendingUp,
  FiShield,
} from "react-icons/fi";
import { MdOutlineSwitchAccount } from "react-icons/md";
import { BiCoinStack } from "react-icons/bi";
import { LuMapPin } from "react-icons/lu";
import { toast } from "react-toastify";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import TManagerHeader from "./TManagerHeader"; 
import SubscriptionBanner from "./SubscriptionBanner";
import useFetchUser from "../hooks/useFetchUser";

export default function TManagerPanel() {
  const [salesOpen, setSalesOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [accountingOpen, setAccountingOpen] = useState(false);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const location = useLocation();
  const { user } = useFetchUser();

  useEffect(() => {
    user && console.log("Fetched user:", user);
  }, [user]);

  useEffect(() => {
    console.log("Simulating user fetch... (no backend)");
  }, []);

  useEffect(() => {
    document.title = `Panel | Forekas`;
  }, []);

  const activeLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-tertiary font-semibold shadow-sm";
  const normalLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-secondary hover:text-white transition";

  const salesRoutes = [
    "/group-manager/accounts",
    "/group-manager/contacts",
    "/group-manager/leads",
    "/group-manager/deals",
    "/group-manager/quotes",
    "/group-manager/soas",
    "/group-manager/targets",
    "/group-manager/meetings",
  ];
  const isSalesActive = salesRoutes.includes(location.pathname);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-tertiary text-white flex flex-col shadow-lg transform transition-transform duration-300 z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-4 py-3 bg-accent leading-none">
            <p className="text-gray-900 font-bold text-lg m-0 p-0"> Forekas CRM{" "}
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
            to="/group-manager/dashboard"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiHome className="text-lg" />
            <span>Dashboard</span>
          </NavLink>

          {/* Sales Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-secondary rounded-lg transition"
              onClick={() => setSalesOpen(!salesOpen)}
            >
              <span className="flex items-center gap-2">
                <FiBriefcase className="text-lg" />
                Sales
              </span>
              <FiChevronDown
                className={`transition-transform ${salesOpen ? "rotate-180" : ""}`}
              />
            </button>

            {salesOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/group-manager/accounts"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <HiOutlineOfficeBuilding /> Accounts
                </NavLink>
                <NavLink
                  to="/group-manager/contacts"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiUser /> Contacts
                </NavLink>
                <NavLink
                  to="/group-manager/leads"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiUserPlus /> Leads
                </NavLink>
                <NavLink
                  to="/group-manager/deals"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiBriefcase /> Deals
                </NavLink>
                <NavLink
                  to="/group-manager/quotes"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiFileText /> Quotes
                </NavLink>
                <NavLink
                  to="/group-manager/targets"
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
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-secondary rounded-lg transition"
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
                  to="/group-manager/calendar"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiCalendar /> Calendar
                </NavLink>
                <NavLink
                  to="/group-manager/tasks"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiCheckSquare /> Tasks
                </NavLink>                
                <NavLink
                  to="/group-manager/meetings"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiCalendar /> Meetings
                </NavLink>
                <NavLink
                  to="/group-manager/calls"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiPhoneCall /> Calls
                </NavLink>
                <NavLink
                  to="/group-manager/audit"
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
                        to="/group-manager/territory"
                        className={({ isActive }) => (isActive ? activeLink : normalLink)}
                      >
                        <span className="flex items-center gap-2">
                          <LuMapPin className="text-lg" />
                          Territory
                        </span>
                      </NavLink>
                    </div>

                    {/* Accounting Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-secondary rounded-lg transition"
              onClick={() => setAccountingOpen(!accountingOpen)}
            >
              <span className="flex items-center gap-2">
                <BiCoinStack className="text-lg" />
                Accounting
              </span>
              <FiChevronDown
                className={`transition-transform ${accountingOpen ? "rotate-180" : ""}`}
              />
            </button>

            {accountingOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/group-manager/soas"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                  title="Statement of Account"
                >
                  <MdOutlineSwitchAccount /> SOA
                </NavLink>                
              </div>
            )}
          </div>

            {/* Marketing Dropdown */}
                    <div>
                      <button
                        className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-secondary rounded-lg transition"
                        onClick={() => setMarketingOpen(!marketingOpen)}
                      >
                        <span className="flex items-center gap-2">
                          <FiTrendingUp className="text-lg" />
                          Marketing
                        </span>
                        <FiChevronDown
                          className={`transition-transform ${marketingOpen ? "rotate-180" : ""
                            }`}
                        />
                      </button>
          
                      {marketingOpen && (
                        <div className="ml-6 mt-2 space-y-1">
                          <NavLink
                            to="#"
                            className={() => normalLink}
                            onClick={e => {
                              e.preventDefault();
                              toast.info("This feature is coming soon!");
                            }}
                            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                          >
                            <FiMail /> Email Templates
                          </NavLink>
                        </div>
                      )}
                    </div>

          {/* User Management Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-secondary rounded-lg transition"
              onClick={() => setUserMgmtOpen(!userMgmtOpen)}
            >
              <span className="flex items-center gap-2">
                <FiSettings className="text-lg" />
                Settings
              </span>
              <FiChevronDown
                className={`transition-transform ${userMgmtOpen ? "rotate-180" : ""}`}
              />
            </button>

            {userMgmtOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/group-manager/users"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiUsers /> Users
                </NavLink>
                <NavLink
                  to="/group-manager/manage-account"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiUser /> Your Profile
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-700">
          © {new Date().getFullYear()} Forekas CRM 
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
        <TManagerHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main
          className="flex-1 p-6 overflow-auto hide-scrollbar"
          style={{ backgroundColor: "var(--color-paper-white)" }}
        >
          <SubscriptionBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
