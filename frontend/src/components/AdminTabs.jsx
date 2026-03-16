import React from "react";

// Simple badge component
function Badge({ children }) {
  return (
    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
      {children}
    </span>
  );
}

// Tab button
function TabButton({ active, children, onClick }) {
  return (
    <button
      className={`px-3 py-1 rounded-lg font-medium focus:outline-none transition-colors duration-150 w-full cursor-pointer whitespace-nowrap ${
        active
          ? "bg-blue-600 text-white"
          : "bg-transparent text-gray-600 hover:bg-blue-50"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export default function AdminTabs({
  activeTab,
  onTabChange,
  counts = { pastPerformance: 3, keyPersonnel: 2 },
}) {
  return (
    <>
      <div className="flex w-full bg-white p-2 rounded-xl mb-4 gap-2 whitespace-nowrap overflow-x-auto">
        <TabButton active={!activeTab || activeTab === "all"} onClick={() => onTabChange("all")}>All</TabButton>
        <TabButton active={activeTab === "logsLeaders"} onClick={() => onTabChange("logsLeaders")}>Logs & Performers</TabButton>
        <TabButton active={activeTab === "pipelineSummary"} onClick={() => onTabChange("pipelineSummary")}>Pipeline Intelligence</TabButton>
        <TabButton active={activeTab === "revenuePerformance"} onClick={() => onTabChange("revenuePerformance")}>Revenue Overview</TabButton>
        <TabButton active={activeTab === "quickDataAccess"} onClick={() => onTabChange("quickDataAccess")}>Quick Data Access</TabButton>
      </div>
      <hr className="mb-4 mt-0 border-gray-300" />
      {/* Only show content for selected tab, single line */}
      {/* No placeholder content, only tabs */}
      <div className="w-full mt-2"></div>
    </>
  );
}
