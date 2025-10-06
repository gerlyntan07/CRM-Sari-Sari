import React from "react";
import { FiEye, FiDownload } from "react-icons/fi";

export default function AdminAudit() {
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2">
          <FiEye className="text-gray-700" size={20} />
          <h2 className="text-xl font-semibold text-gray-700">Audit Logs</h2>
        </div>
        <button className="flex items-center border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition">
          <FiDownload className="mr-2" />
          Export Logs
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-6 py-3 border-b">Timestamp</th>
              <th className="px-6 py-3 border-b">User</th>
              <th className="px-6 py-3 border-b">Action</th>
              <th className="px-6 py-3 border-b">Resource</th>
              <th className="px-6 py-3 border-b">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50 border-t transition-colors"
              >
                <td className="px-6 py-3 whitespace-nowrap text-gray-700">
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
  );
}
