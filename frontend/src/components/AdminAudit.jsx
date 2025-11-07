import React, { useEffect, useState } from "react";
import { FiEye, FiDownload, FiSearch } from "react-icons/fi";
import api from "../api";
import toast, { Toaster } from "react-hot-toast";

export default function AdminAudit() {
  useEffect(() => {
    document.title = "Audit | Sari-Sari CRM";
  }, []);

  const [logs, setLogs] = useState(null);
  const [search, setSearch]   = useState('');
  const [filter, setFilter] = useState("All");

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

  const filteredLogs = Array.isArray(logs)
  ? logs.filter((c) => {
      const monthNames = [
        "jan", "feb", "mar", "apr", "may", "jun",
        "jul", "aug", "sep", "oct", "nov", "dec"
      ];

      // Convert timestamp to month string
      const dateObj = new Date(c.timestamp);
      const month = monthNames[dateObj.getMonth()]; // e.g., "oct"

      const searchLower = search.toLowerCase();

      const matchesSearch =
        c.description?.toLowerCase().includes(searchLower) ||
        c.action?.toLowerCase().includes(searchLower) ||
        c.entity_type?.toLowerCase().includes(searchLower) ||
        `${c.logger?.first_name} ${c.logger?.last_name}`.toLowerCase().includes(searchLower) ||
        month.includes(searchLower); // <-- checks month

      const matchesAccount =
        filter === "All" || c.action === filter;

      return matchesSearch && matchesAccount;
    })
  : [];

  const exportToExcel = () => {
  if (!filteredLogs.length) {
    toast.error("No logs to export!");
    return;
  }

  // Define the table headers
  const headers = ["Timestamp", "User", "Action", "Resource", "Details"];

  // Map filteredLogs into rows
  const rows = filteredLogs.map((log) => [
    new Date(log.timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    `${log.logger?.first_name || ""} ${log.logger?.last_name || ""}`.trim(),
    log.action,
    `${log.entity_type}: ${log.entity_id}`,
    log.description || "",
  ]);

  // Convert to CSV-like content (Excel can open CSV)
  const csvContent = [
    headers.join(","), // header row
    ...rows.map((row) =>
      row
        .map((cell) =>
          `"${String(cell).replace(/"/g, '""')}"` // Escape double quotes
        )
        .join(",")
    ),
  ].join("\n");

  // Create a downloadable Blob (in memory)
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a temporary link and trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AuditLogs_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};



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
      <Toaster toastOptions={{
    duration: 1000
  }} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <FiEye className="text-blue-600" size={20} />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
            Audit Logs
          </h2>
        </div>
        <button className="flex items-center justify-center border border-tertiary hover:text-white hover:bg-secondary text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto" onClick={exportToExcel}>
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm cursor-pointer w-full sm:w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option className="All">All</option>
                <option value='CREATE'>CREATE</option>
                <option value='DELETE'>DELETE</option>
                <option value='UPDATE'>UPDATE</option>
                <option value='READ'>READ</option>
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
              {Array.isArray(filteredLogs) && filteredLogs.length > 0 ? (
                filteredLogs.map((log, i) => (
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
