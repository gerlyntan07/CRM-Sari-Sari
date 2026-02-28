import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import SuperAdminSidebar from "./SuperAdminSidebar";

export default function SuperAdminPanel() {
  useEffect(() => {
    document.title = `Super Admin | Sari-Sari CRM`;
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Use the SuperAdminSidebar component */}
      <SuperAdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">System Administrator</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
