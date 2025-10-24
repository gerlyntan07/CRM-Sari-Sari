import React, { useEffect } from "react";
import { FiEye, FiDownload } from "react-icons/fi";

export default function AdminAudit() {
  useEffect(() => {
    document.title = "Audit | Sari-Sari CRM";
  }, []);

  const logs = [
    {
      timestamp: "1/30/2024, 6:30:00 PM",
      user: "admin@company.com",
      action: "USER_CREATED",
      resource: "User: jane.smith@company.com",
      details: "Created new sales user with territory assignment",
      type: "success",
    },
    {
      timestamp: "1/30/2024, 5:15:00 PM",
      user: "manager@company.com",
      action: "DEAL_APPROVED",
      resource: "Deal: D25-00003",
      details: "Approved deal worth $50,000",
      type: "success",
    },
    {
      timestamp: "1/30/2024, 4:45:00 PM",
      user: "admin@company.com",
      action: "SYSTEM_CONFIG",
      resource: "Pipeline Settings",
      details: "Updated deal pipeline stages",
      type: "info",
    },
  ];

  const getTagColor = (type) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-700 border-green-300";
      case "info":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "error":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <FiEye className="text-blue-600" size={20} />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
            Audit Logs
          </h2>
        </div>
        <button className="flex items-center justify-center border border-tertiary hover:text-white hover:bg-secondary text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto">
          <FiDownload className="mr-2" />
          Export Logs
        </button>
      </div>

      <div className="bg-white rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Timestamp</th>
                <th className="px-6 py-3 whitespace-nowrap">User</th>
                <th className="px-6 py-3 whitespace-nowrap">Action</th>
                <th className="px-6 py-3 whitespace-nowrap">Resource</th>
                <th className="px-6 py-3 whitespace-nowrap">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 transition-colors text-xs" 
                >
                  <td className="px-6 py-3 text-gray-700 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-3 text-gray-700">{log.user}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 border text-xs font-semibold rounded-md ${getTagColor(
                        log.type
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{log.resource}</td>
                  <td className="px-6 py-3 text-gray-700">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
