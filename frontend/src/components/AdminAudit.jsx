import React, { useEffect, useMemo, useState } from "react";
import { FiEye, FiDownload, FiSearch, FiClipboard } from "react-icons/fi";
import api from "../api";
import toast, { Toaster } from "react-hot-toast";
import PaginationControls from "./PaginationControls.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { FiCalendar } from "react-icons/fi";

const ITEMS_PER_PAGE = 10;

export default function AdminAudit() {
  useEffect(() => {
    document.title = "Audit | Sari-Sari CRM";
  }, []);

  const [logs, setLogs] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Filter by Actions");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/logs/read-all");
      setLogs(res.data);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];

    const normalizedSearch = search.trim().toLowerCase();
    const normalizedFilter = filter?.toUpperCase?.() || "ALL";

    const filtered = logs.filter((log) => {
      const timestampString = log.timestamp
        ? new Date(log.timestamp).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "";

      const resourceString = `${log.entity_type || ""} ${
        log.entity_name ||
        log.entity_details?.name ||
        log.entity_details?.title ||
        log.entity_id ||
        ""
      }`;

      const userName = `${log.logger?.first_name || ""} ${
        log.logger?.last_name || ""
      }`;

      const searchFields = [
        timestampString,
        userName,
        log.action,
        log.entity_type,
        resourceString,
        log.description,
      ];

      const matchesSearch =
        normalizedSearch === "" ||
        searchFields.some((field) => {
          if (field === null || field === undefined) return false;
          return field.toString().toLowerCase().includes(normalizedSearch);
        });

      const matchesFilter =
        normalizedFilter === "FILTER BY ACTIONS" ||
        (log.action || "").toUpperCase() === normalizedFilter;

      return matchesSearch && matchesFilter;
    });

    // Sort by timestamp descending (most recent first)
    return filtered.sort((a, b) => {
      const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timestampB - timestampA; // Descending order (newest first)
    });
  }, [logs, search, filter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredLogs.length]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const pageStart =
    filteredLogs.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

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
          .map(
            (cell) => `"${String(cell).replace(/"/g, '""')}"` // Escape double quotes
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
    const normalized = (type || "").toUpperCase();
    switch (normalized) {
      case "CREATE":
        return "bg-green-100 text-green-700";
      case "UPDATE":
      case "EDIT":
        return "bg-blue-100 text-blue-700";
      case "DELETE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
      {logs === null && <LoadingSpinner message="Loading audit logs..." />}
      <Toaster
        toastOptions={{
          duration: 1000,
        }}
      />

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-md flex items-center">
        <FiCalendar className="text-blue-600 mr-3 flex-shrink-0" size={20} />
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Data Retention Policy:</span> Audit
          logs are automatically purged after 30 days to optimize system
          performance.
        </p>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <FiClipboard className="text-blue-600" size={20} />
          <h2 className="text-2xl sm:text-xl font-semibold text-gray-700">
            Audit Logs
          </h2>
        </div>
               <div className="flex justify-center lg:justify-end w-full sm:w-auto">
        <button
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base self-end sm:self-auto cursor-pointer"
          onClick={exportToExcel}
        >
          <FiDownload className="mr-2" />
          Export Logs
        </button>
      </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition bg-white">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search audit logs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:outline-none text-base w-full"
          />
        </div>
        <div className="w-full lg:w-1/4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="Filter by Actions">Filter by Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="DELETE">DELETE</option>
            <option value="UPDATE">UPDATE</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
          <thead className="bg-gray-100 text-left text-gray-600 text-sm tracking-wide font-semibold">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Resource</th>
              <th className="py-3 px-4">Details</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredLogs) && filteredLogs.length > 0 ? (
              paginatedLogs.map((log, i) => (
                <tr key={i} className="hover:bg-gray-50 text-sm">
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                    {new Date(log.timestamp)
                      .toLocaleString("en-US", {
                        month: "numeric",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                      .replace(",", "")}
                  </td>
                  <td className="py-3 px-4 text-gray-700">{log.name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getTagColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {log.entity_type}: {log.entity_id}
                  </td>
                  <td className="py-3 px-4 text-gray-700">{log.description}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="py-3 px-4 text-sm text-gray-500 text-center"
                  colSpan={5}
                >
                  No activities to show.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        className="mt-4"
        totalItems={filteredLogs.length}
        pageSize={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        label="logs"
      />
    </div>
  );
}
