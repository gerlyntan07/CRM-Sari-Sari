
import { useEffect, useState } from "react";
import useFetchUser from "../hooks/useFetchUser";
import { Outlet, useNavigate } from "react-router-dom";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { FiMenu } from "react-icons/fi";

export default function SuperAdminPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: currentUser } = useFetchUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = `Super Admin | Sari-Sari CRM`;
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[#1e293b] text-white flex flex-col shadow-lg transform transition-transform duration-300 z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        <SuperAdminSidebar />
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
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Sidebar toggle button for mobile */}
            <button
              className="lg:hidden mr-2 text-gray-700 hover:text-black focus:outline-none"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Open sidebar"
            >
              <FiMenu size={24} />
            </button>
            {/* Removed Admin Dashboard title for super admin header */}
          </div>
          {/* Profile section aligned like Admin Panel */}
          <div 
            className="flex items-center cursor-pointer px-3 py-1 rounded-lg hover:bg-gray-100 transition"
            onClick={() => navigate("/super-admin/manage-account")}
          >
            {currentUser?.profile_picture ? (
              <img
                src={currentUser.profile_picture}
                alt="Profile"
                className="w-8 h-8 rounded-full mr-2 border border-gray-300 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full mr-2 bg-indigo-500 flex items-center justify-center text-white font-bold text-base border border-gray-300">
                {(() => {
                  const name = (currentUser?.first_name || '').trim() || (currentUser?.last_name || '').trim() || 'U';
                  return name.charAt(0).toUpperCase();
                })()}
              </div>
            )}
            <div className="flex flex-col justify-center">
              <span className="font-bold text-gray-800 text-base leading-tight">
                {currentUser?.first_name || ''} {currentUser?.last_name || ''}
              </span>
              <span className="text-xs text-gray-500 font-medium leading-tight">System Administrator</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50 hide-scrollbar overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
