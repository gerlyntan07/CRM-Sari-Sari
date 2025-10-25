import React, { useEffect, useState } from "react";
import { FiEye, FiDownload, FiSearch } from "react-icons/fi";
import api from "../api";

export default function AdminAudit() {
  useEffect(() => {
    document.title = "Audit | Sari-Sari CRM";
  }, []);

  const [logs, setLogs] = useState(null);

  // const logs = [
  //   {
  //     timestamp: "1/30/2024, 6:30:00 PM",
  //     user: "admin@company.com",
  //     action: "USER_CREATED",
  //     resource: "User: jane.smith@company.com",
  //     details: "Created new sales user with territory assignment",
  //     type: "success",
  //   },
  //   {
  //     timestamp: "1/30/2024, 5:15:00 PM",
  //     user: "manager@company.com",
  //     action: "DEAL_APPROVED",
  //     resource: "Deal: D25-00003",
  //     details: "Approved deal worth $50,000",
  //     type: "success",
  //   },
  //   {
  //     timestamp: "1/30/2024, 4:45:00 PM",
  //     user: "admin@company.com",
  //     action: "SYSTEM_CONFIG",
  //     resource: "Pipeline Settings",
  //     details: "Updated deal pipeline stages",
  //     type: "info",
  //   },
  // ];

  const fetchLogs = async() => {
    try{
      const res = await api.get('/logs/read-all');
      setLogs(res.data);
    } catch(error){
      console.error("Error fetching audit logs:", error);
    }
  }

  useEffect(() => {
    fetchLogs();
  },[])

  const getTagColor = (type) => {
    switch (type) {
      case "CREATE":
        return "bg-green-100 text-green-700 border-green-300";
      case "EDIT":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "DELETE":
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

       {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-7">
              <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-full sm:w-1/3 shadow-sm">
                <FiSearch className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Search Audit..."
                  className="ml-2 bg-transparent w-full outline-none text-sm"
                />
              </div>
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm cursor-pointer w-full sm:w-auto">
                <option>Date</option>
                <option>Day</option>
                <option>Week</option>
                <option>Month</option>
              </select>
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
              {Array.isArray(logs) && logs.length > 0 ? (
                logs.map((log, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 transition-colors text-xs" 
                >
                  <td className="px-6 py-3 text-gray-700 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }).replace(",", "")}
                  </td>
                  <td className="px-6 py-3 text-gray-700">{log.name}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 border text-xs font-semibold rounded-md ${getTagColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{log.entity_type}: {log.entity_id}</td>
                  <td className="px-6 py-3 text-gray-700">{log.description}</td>
                </tr>
              ))
              ): (
                <tr><td className="px-6 py-3 text-gray-700 col-span-5">No activites to show</td></tr>
              )}
              
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
