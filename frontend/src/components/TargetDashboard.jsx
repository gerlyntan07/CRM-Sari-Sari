import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiTarget,
  FiDollarSign, 
  FiX,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
  FiBarChart2,
  FiAward,
  FiUsers,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import { FaPesoSign, FaDollarSign } from "react-icons/fa6"; 

import { HiX } from "react-icons/hi";
import { toast } from "react-toastify";
import api from "../api";
import PaginationControls from "./PaginationControls.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import useFetchUser from "../hooks/useFetchUser"; 

/* ======================================================
   CONSTANTS
====================================================== */
const INITIAL_FORM_STATE = {
  user_id: "",
  start_date: "",
  end_date: "",
  target_amount: "",
  period_type: "CUSTOM",
  period_year: new Date().getFullYear(),
  period_number: 1,
};

const PERIOD_TYPES = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "SEMIANNUAL", label: "Semi-Annual" },
  { value: "ANNUAL", label: "Annual" },
  { value: "CUSTOM", label: "Custom" },
];

const COLORS = [
  "#6366f1", "#22c55e", "#f97316", "#0ea5e9", "#a855f7", "#f43f5e",
  "#eab308", "#8b5cf6", "#10b981", "#ec4899", "#14b8a6", "#f59e0b",
];

/* ======================================================
   SEARCHABLE SELECT COMPONENT
====================================================== */
function SearchableSelect({ name, items = [], value = "", onChange, getLabel, placeholder = "Search..." }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  const selectedItem = items.find((i) => String(i.id) === String(value));
  const selectedLabel = selectedItem ? getLabel(selectedItem) : "";

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return query
      ? items.filter((i) => getLabel(i).toLowerCase().includes(query))
      : items;
  }, [items, q, getLabel]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex justify-center w-full">
      <input
        value={open ? q : selectedLabel}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        className="w-full max-w-md border text-gray-500 border-gray-300 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
      />

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.length ? (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange({ target: { name, value: String(item.id) } });
                  setOpen(false);
                  setQ("");
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                {getLabel(item)}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ======================================================
   TARGET DASHBOARD COMPONENT
====================================================== */
export default function TargetDashboard({ currentUserRole, currentUserId }) {
  // 1. Get Global User Context AND Mutate function
  const { user, mutate } = useFetchUser();
  
  // 2. Determine Currency Symbol & Icon
  // Optional chaining is critical here in case company is null during loading
  const currencySymbol = user?.company?.currency || "₱";
  const CurrencyIcon = currencySymbol === "$" ? FaDollarSign : FaPesoSign;

  // 3. ✅ FORCE REFRESH: When this dashboard mounts, force a user data refresh
  // This ensures we get the latest Currency setting immediately.
  useEffect(() => {
    if (mutate) {
      mutate(); 
    }
  }, [mutate]);

  // Debugging: Check console to see if the currency is arriving correctly
  useEffect(() => {
    if (user?.company) {
      console.log("Dashboard detected Company Settings:", user.company);
    }
  }, [user]);

  useEffect(() => {
    document.title = "Targets | Sari-Sari CRM";
  }, []);

  const [targets, setTargets] = useState([]);
  const [users, setUsers] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTargetId, setCurrentTargetId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const [selectedTarget, setSelectedTarget] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Chart state
  const [timeframe, setTimeframe] = useState("annual");
  const [selectedPeriod, setSelectedPeriod] = useState(1);

  // Leaderboard & Evaluation state
  const [activeTab, setActiveTab] = useState("overview"); // overview, leaderboard, history
  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [selectedUserHistory, setSelectedUserHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [teamSummary, setTeamSummary] = useState(null);
  
  // Fiscal settings from company
  const [fiscalSettings, setFiscalSettings] = useState(null);
  
  // Period filter for leaderboard
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterPeriodType, setFilterPeriodType] = useState("");
  const [filterPeriodNumber, setFilterPeriodNumber] = useState(1);

  // Determine if user can create targets (SALES is read-only)
  const canCreateTarget = useMemo(
    () => ["CEO", "ADMIN", "GROUP MANAGER", "MANAGER"].includes(currentUserRole?.toUpperCase()),
    [currentUserRole]
  );

  // Determine if user can delete targets (SALES is read-only)
  const canDeleteTarget = useMemo(
    () => ["CEO", "ADMIN", "GROUP MANAGER", "MANAGER"].includes(currentUserRole?.toUpperCase()),
    [currentUserRole]
  );

  /* ======================================================
     FETCH DATA
  ====================================================== */
  const fetchTargets = useCallback(async () => {
    setTargetsLoading(true);
    try {
      const res = await api.get("/targets/admin/fetch-all");
      setTargets(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load targets.");
    } finally {
      setTargetsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      if (canCreateTarget) {
        const res = await api.get("/targets/admin/get-users");
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [canCreateTarget]);

  const fetchFiscalSettings = useCallback(async () => {
    try {
      const res = await api.get("/targets/fiscal-settings");
      setFiscalSettings(res.data);
    } catch (err) {
      console.error("Failed to fetch fiscal settings:", err);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPeriodType) params.append("period_type", filterPeriodType);
      if (filterYear) params.append("period_year", filterYear);
      if (filterPeriodNumber) params.append("period_number", filterPeriodNumber);
      
      const res = await api.get(`/targets/leaderboard?${params.toString()}`);
      setLeaderboard(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leaderboard.");
    } finally {
      setLeaderboardLoading(false);
    }
  }, [filterPeriodType, filterYear, filterPeriodNumber]);

  const fetchTeamSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterPeriodType) params.append("period_type", filterPeriodType);
      if (filterYear) params.append("period_year", filterYear);
      if (filterPeriodNumber) params.append("period_number", filterPeriodNumber);
      
      const res = await api.get(`/targets/team-summary?${params.toString()}`);
      setTeamSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [filterPeriodType, filterYear, filterPeriodNumber]);

  const fetchUserHistory = useCallback(async (userId) => {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/targets/history/${userId}`);
      setSelectedUserHistory(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load user history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTargets();
    fetchUsers();
    fetchFiscalSettings();
  }, [fetchTargets, fetchUsers, fetchFiscalSettings]);

  useEffect(() => {
    if (activeTab === "leaderboard") {
      fetchLeaderboard();
      fetchTeamSummary();
    }
  }, [activeTab, fetchLeaderboard, fetchTeamSummary]);

  /* ======================================================
     METRICS
  ====================================================== */
  const metrics = useMemo(() => {
    const totalTarget = targets.reduce((sum, t) => sum + (Number(t.target_amount) || 0), 0);
    const totalAchieved = targets.reduce((sum, t) => sum + (Number(t.achieved_amount) || 0), 0);
    const achievement = totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(1) : 0;
    const remaining = Math.max(0, totalTarget - totalAchieved);

    return {
      totalTarget,
      totalAchieved,
      achievement,
      remaining,
      totalCount: targets.length,
    };
  }, [targets]);

  /* ======================================================
     BUILD PIE CHART DATA
  ====================================================== */
  const getTargetsForPeriod = useCallback(() => {
    // Helper function to check if target falls within selected period
    const filterTargetsByPeriod = (targets) => {
      if (timeframe === "annual") {
        return targets; // Show all targets
      }

      return targets.filter((target) => {
        const startDate = new Date(target.start_date);
        const endDate = new Date(target.end_date);
        const startMonth = startDate.getMonth(); // 0-11
        const endMonth = endDate.getMonth();

        let periodMatch = false;

        if (timeframe === "semiannual") {
          const period1Start = 0, period1End = 5;
          const period2Start = 6, period2End = 11;

          if (selectedPeriod === 1) {
            periodMatch = (startMonth <= period1End && endMonth >= period1Start);
          } else {
            periodMatch = (startMonth <= period2End && endMonth >= period2Start);
          }
        } else if (timeframe === "trimester") {
          const trimesters = [
            { start: 0, end: 3 },   // Jan-Apr
            { start: 4, end: 7 },   // May-Aug
            { start: 8, end: 11 },  // Sep-Dec
          ];
          const tri = trimesters[selectedPeriod - 1];
          periodMatch = (startMonth <= tri.end && endMonth >= tri.start);
        } else if (timeframe === "quarterly") {
          const quarters = [
            { start: 0, end: 2 },   // Jan-Mar
            { start: 3, end: 5 },   // Apr-Jun
            { start: 6, end: 8 },   // Jul-Sep
            { start: 9, end: 11 },  // Oct-Dec
          ];
          const quarter = quarters[selectedPeriod - 1];
          periodMatch = (startMonth <= quarter.end && endMonth >= quarter.start);
        }

        return periodMatch;
      });
    };

    return filterTargetsByPeriod(targets);
  }, [targets, timeframe, selectedPeriod]);

  const pieChartData = useMemo(() => {
    const filteredTargets = getTargetsForPeriod();

    // Group targets by sales person (user)
    const groupedByUser = {};

    filteredTargets.forEach((target) => {
      const userId = target.user_id;
      const userName = target.user ? `${target.user.first_name} ${target.user.last_name}` : "Unknown";

      if (!groupedByUser[userId]) {
        groupedByUser[userId] = {
          userId,
          name: userName,
          targetAmount: 0,
          achievedAmount: 0,
        };
      }

      groupedByUser[userId].targetAmount += Number(target.target_amount) || 0;
      groupedByUser[userId].achievedAmount += Number(target.achieved_amount) || 0;
    });

    const data = Object.values(groupedByUser).map((item, idx) => ({
      ...item,
      fill: COLORS[idx % COLORS.length],
    }));

    // Calculate total for percentage calculation
    const totalTarget = data.reduce((sum, item) => sum + item.targetAmount, 0);
    const dataWithPercent = data.map((item) => ({
      ...item,
      percentage: totalTarget > 0 ? ((item.targetAmount / totalTarget) * 100).toFixed(1) : 0,
    }));

    return dataWithPercent;
  }, [getTargetsForPeriod]);

  /* ======================================================
     BUILD BAR CHART DATA
  ====================================================== */
  const barChartData = useMemo(() => {
    return pieChartData.slice(0, 8).map((item) => ({
      name: item.name.split(" ")[0], // First name only for space
      achievement: Number(item.achievedAmount),
      target: Number(item.targetAmount),
    }));
  }, [pieChartData]);

  /* ======================================================
     SEARCH + PAGINATION
  ====================================================== */
  const filteredTargets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return targets.filter((t) => {
      const userName = t.user
        ? `${t.user.first_name} ${t.user.last_name}`.toLowerCase()
        : "";
      return (
        userName.includes(q) ||
        t.start_date?.includes(q) ||
        t.end_date?.includes(q)
      );
    });
  }, [targets, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTargets.length / itemsPerPage));
  const paginatedTargets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTargets.slice(start, start + itemsPerPage);
  }, [filteredTargets, currentPage, itemsPerPage]);

  /* ======================================================
     HANDLERS
  ====================================================== */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setCurrentTargetId(null);
    setShowModal(true);
  };

  const handleEditClick = (target) => {
    setFormData({
      user_id: target.user?.id ? String(target.user.id) : "",
      start_date: target.start_date || "",
      end_date: target.end_date || "",
      target_amount: target.target_amount?.toString() || "",
      period_type: target.period_type || "CUSTOM",
      period_year: target.period_year || new Date().getFullYear(),
      period_number: target.period_number || 1,
    });
    setIsEditing(true);
    setCurrentTargetId(target.id);
    setShowModal(true);
    setSelectedTarget(null);
  };

  const handleDelete = (target) => {
    const userName = target.user
      ? `${target.user.first_name} ${target.user.last_name}`
      : "Unknown";

    setConfirmModalData({
      title: "Delete Target",
      message: (
        <span>
          Are you sure you want to delete the target for{" "}
          <span className="font-semibold">{userName}</span>?
        </span>
      ),
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "danger",
      action: async () => {
        await api.delete(`/targets/admin/${target.id}`);
        toast.success("Target deleted successfully.");
        fetchTargets();
        setSelectedTarget(null);
      },
    });
  };

  const handleSelectAll = () => {
    if (paginatedTargets.every((t) => selectedIds.includes(t.id))) {
      setSelectedIds(selectedIds.filter((id) => !paginatedTargets.map((t) => t.id).includes(id)));
    } else {
      const newIds = paginatedTargets.map((t) => t.id);
      setSelectedIds([...new Set([...selectedIds, ...newIds])]);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setConfirmModalData({
      title: "Delete Targets",
      message: (
        <span>
          Are you sure you want to delete{" "}
          <span className="font-semibold">{selectedIds.length}</span> selected
          targets? This action cannot be undone.
        </span>
      ),
      confirmLabel: `Delete ${selectedIds.length} Target(s)`,
      cancelLabel: "Cancel",
      variant: "danger",
      action: async () => {
        await api.post("/targets/admin/bulk-delete", {
          target_ids: selectedIds,
        });
        toast.success(`Successfully deleted ${selectedIds.length} targets`);
        setSelectedIds([]);
        fetchTargets();
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.user_id ||
      !formData.start_date ||
      !formData.end_date ||
      !formData.target_amount
    ) {
      toast.error("All fields are required.");
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error("End date must be after start date.");
      return;
    }

    const payload = {
      user_id: Number(formData.user_id),
      target_amount: Number(formData.target_amount),
      start_date: formData.start_date,
      end_date: formData.end_date,
      period_type: formData.period_type || "CUSTOM",
      period_year: formData.period_year || new Date().getFullYear(),
      period_number: formData.period_number || null,
    };

    const actionLabel = isEditing ? "Update Target" : "Create Target";

    setConfirmModalData({
      title: actionLabel,
      message: "Are you sure you want to proceed?",
      confirmLabel: actionLabel,
      cancelLabel: "Cancel",
      variant: "primary",
      action: async () => {
        setIsSubmitting(true);
        try {
          if (isEditing) {
            await api.put(`/targets/admin/${currentTargetId}`, payload);
            toast.success("Target updated successfully.");
          } else {
            await api.post("/targets/admin/create", payload);
            toast.success("Target created successfully.");
          }
          setShowModal(false);
          fetchTargets();
        } catch (err) {
          console.error(err);
          const errorMessage = err.response?.data?.detail || err.message || "Operation failed.";
          toast.error(errorMessage);
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
        {targetsLoading && <LoadingSpinner message="Loading targets..." />}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <h1 className="flex items-center text-xl sm:text-2xl font-semibold">
            <FiTarget className="mr-2 text-blue-600" /> Targets
          </h1>
          {canCreateTarget && (
            <div className="flex justify-center lg:justify-end w-full sm:w-auto">
              <button
                onClick={handleOpenAddModal}
                className="flex items-center bg-black text-white px-3 sm:px-4 py-2 my-1 lg:my-0 rounded-md hover:bg-gray-800 text-sm sm:text-base mx-auto sm:ml-auto cursor-pointer"
              >
                <FiPlus className="mr-2" /> Add Target
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {(currentUserRole?.toUpperCase() !== "SALES") && (
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiPieChart className="inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "leaderboard"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiAward className="inline mr-2" />
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "history"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiClock className="inline mr-2" />
              History
            </button>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Targets"
            value={metrics.totalCount}
            icon={<FiTarget size={22} />}
            color="blue"
          />
          <MetricCard
            title="Target Amount"
            value={`${currencySymbol}${metrics.totalTarget.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            icon={<CurrencyIcon size={22} />}
            color="green"
          />
          <MetricCard
            title="Achieved Amount"
            value={`${currencySymbol}${metrics.totalAchieved.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            icon={<FiTrendingUp size={22} />}
            color="purple"
          />
          <MetricCard
            title="Achievement Rate"
            value={`${metrics.achievement}%`}
            icon={<FiTarget size={22} />}
            color="orange"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart - Sales Achievement */}
          <div className="bg-white rounded-xl shadow p-4 md:h-[420px] h-[350px] flex flex-col">
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold mb-3">Sales Achievement</h2>
              <div className="h-[38px] w-full invisible"></div>
            </div>
            {barChartData.length > 0 ? (
              <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "Amount", angle: -90, position: "insideLeft", offset: 3 }}
                      domain={[0, (dataMax) => Math.ceil(dataMax / 50) * 50]}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0, 0, 0, 0.15)" }}
                      wrapperStyle={{
                        outline: "none",
                        zIndex: 9999,
                        pointerEvents: "auto"
                      }}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "2px solid #1f2937",
                        borderRadius: "8px",
                        padding: "12px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                        zIndex: 9999,
                        pointerEvents: "auto",
                      }}
                      labelFormatter={(label) => `Sales: ${label}`}
                      formatter={(value, name, props) => {
                        if (!props || !props.payload) return [value, name];

                        const data = props.payload;
                        const achievement = Number(data.achievement) || 0;
                        const target = Number(data.target) || 0;
                        const remaining = Math.max(0, target - achievement);
                        const percentage = target > 0 ? ((achievement / target) * 100).toFixed(1) : 0;

                        if (name === "Achieved") {
                          return [
                            `${currencySymbol}${achievement.toLocaleString()} (${percentage}%)`,
                            "Achieved",
                          ];
                        } else if (name === "Remaining") {
                          return [`${currencySymbol}${remaining.toLocaleString()}`, "Remaining"];
                        }
                        return [value, name];
                      }}
                    />
                    <Bar
                      dataKey="achievement"
                      stackId="a"
                      fill="#10b981"
                      name="Achieved"
                      label={({ x, y, width, value, payload }) => {
                        if (!payload || payload.target === undefined) return null;
                        const percent = ((value / payload.target) * 100).toFixed(0);
                        const labelY = y - 10 < 0 ? 10 : y - 10;
                        return (
                          <text
                            x={x + width / 2}
                            y={labelY}
                            textAnchor="middle"
                            fill="#111827"
                            fontSize={10}
                            fontWeight={500}
                          >
                            {percent}%
                          </text>
                        );
                      }}
                    />
                    <Bar
                      dataKey={(row) => Math.max(0, row.target - row.achievement)}
                      stackId="a"
                      fill="#e5e7eb"
                      name="Remaining"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                <FiBarChart2 size={48} className="mb-2 opacity-20" />
                <p className="text-gray-500 font-medium text-center">No sales data available</p>
              </div>
            )}
          </div>

          {/* Pie Chart - Target Distribution */}
          <div className="bg-white rounded-xl shadow p-4 md:h-[420px] h-[350px] flex flex-col">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold mb-3">Target Distribution by Sales</h2>
              <div className="flex flex-col sm:flex-row gap-2 justify-center items-center flex-wrap">
                <select
                  value={timeframe}
                  onChange={(e) => {
                    setTimeframe(e.target.value);
                    setSelectedPeriod(1);
                  }}
                  className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="annual">Annual</option>
                  <option value="semiannual">Every 6 Months</option>
                  <option value="trimester">Every 4 Months</option>
                  <option value="quarterly">Quarterly</option>
                </select>

                {timeframe !== "annual" && (
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {timeframe === "semiannual" && (
                      <>
                        <option value={1}>Jan - Jun</option>
                        <option value={2}>Jul - Dec</option>
                      </>
                    )}
                    {timeframe === "trimester" && (
                      <>
                        <option value={1}>Jan - Apr</option>
                        <option value={2}>May - Aug</option>
                        <option value={3}>Sep - Dec</option>
                      </>
                    )}
                    {timeframe === "quarterly" && (
                      <>
                        <option value={1}>Q1 (Jan - Mar)</option>
                        <option value={2}>Q2 (Apr - Jun)</option>
                        <option value={3}>Q3 (Jul - Sep)</option>
                        <option value={4}>Q4 (Oct - Dec)</option>
                      </>
                    )}
                  </select>
                )}
              </div>
            </div>
            {pieChartData.length > 0 ? (
              <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #333",
                        borderRadius: "6px",
                        padding: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        outline: "none",
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                              <p className="text-sm font-semibold text-gray-800">{data.name}</p>
                              <p className="text-xs text-blue-600 mt-1">
                                <span className="font-semibold">Target Amount:</span> {currencySymbol}{Number(data.targetAmount || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                              </p>
                              <p className="text-xs text-purple-600 font-semibold mt-2">
                                Distribution: {data.percentage}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={pieChartData}
                      dataKey="targetAmount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percentage, fill }) => (
                        <text
                          fill={fill}
                          fontSize={12}
                          fontWeight={600}
                        >
                          {name.split(" ")[0]}: {percentage}%
                        </text>
                      )}
                      labelLine={false}
                      isAnimationActive
                      animationDuration={800}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                <FiPieChart size={48} className="mb-2 opacity-20" />
                <p className="text-gray-500 font-medium text-center">No targets data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {canCreateTarget && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
            <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full focus-within:ring-2 focus-within:ring-indigo-500 transition">
              <FiSearch className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search targets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full outline-none"
              />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
            <thead className="bg-gray-100 font-semibold text-gray-600">
              <tr>
                {canDeleteTarget && (
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600"
                      checked={
                        paginatedTargets.length > 0 &&
                        paginatedTargets.every((t) => selectedIds.includes(t.id))
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th className="py-3 px-4 text-left">User</th>
                <th className="py-3 px-4 text-left">Target Amount</th>
                <th className="py-3 px-4 text-left">Achieved Amount</th>
                <th className="py-3 px-4 text-left">Achievement %</th>
                <th className="py-3 px-4 text-left">Start Date</th>
                <th className="py-3 px-4 text-left">End Date</th>
                {canDeleteTarget && (
                  <th className="py-3 px-4 text-center w-24">
                    {selectedIds.length > 0 ? (
                      <button
                        onClick={handleBulkDelete}
                        className="text-red-600 hover:text-red-800 transition p-1 rounded-full hover:bg-red-50"
                        title={`Delete ${selectedIds.length} selected targets`}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    ) : (
                      ""
                    )}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedTargets.length > 0 ? (
                paginatedTargets.map((t) => {
                  const achievementPercent =
                    Number(t.target_amount) > 0
                      ? ((Number(t.achieved_amount) / Number(t.target_amount)) * 100).toFixed(1)
                      : 0;
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50 cursor-pointer border-b border-gray-200"
                    >
                      {canDeleteTarget && (
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-blue-600"
                            checked={selectedIds.includes(t.id)}
                            onChange={() => handleCheckboxChange(t.id)}
                          />
                        </td>
                      )}
                      <td className="py-3 px-4 text-left font-medium" onClick={() => setSelectedTarget(t)}>
                        {t.user
                          ? `${t.user.first_name} ${t.user.last_name}`
                          : "Unknown"}
                      </td>
                      <td className="py-3 px-4 text-left" onClick={() => setSelectedTarget(t)}>
                        {currencySymbol}{Number(t.target_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-left" onClick={() => setSelectedTarget(t)}>
                        {currencySymbol}{Number(t.achieved_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-left" onClick={() => setSelectedTarget(t)}>
                        <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${achievementPercent >= 100
                            ? "bg-green-500"
                            : achievementPercent >= 75
                              ? "bg-blue-500"
                              : achievementPercent >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}>
                          {achievementPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left" onClick={() => setSelectedTarget(t)}>{t.start_date}</td>
                      <td className="py-3 px-4 text-left" onClick={() => setSelectedTarget(t)}>{t.end_date}</td>
                      <td></td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-4 px-4 text-center text-gray-500">
                    No targets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          className="mt-4"
          totalItems={filteredTargets.length}
          pageSize={itemsPerPage}
          currentPage={currentPage}
          onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          onPageSizeChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 20, 30, 40, 50]}
          label="targets"
        />
          </>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === "leaderboard" && (
          <div className="space-y-6">
            {/* Period Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by Period:</span>
              </div>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
              <select
                value={filterPeriodType}
                onChange={(e) => {
                  setFilterPeriodType(e.target.value);
                  setFilterPeriodNumber(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Periods</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="SEMIANNUAL">Semi-Annual</option>
                <option value="ANNUAL">Annual</option>
              </select>
              {filterPeriodType === "QUARTERLY" && (
                <select
                  value={filterPeriodNumber}
                  onChange={(e) => setFilterPeriodNumber(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
              )}
              {filterPeriodType === "SEMIANNUAL" && (
                <select
                  value={filterPeriodNumber}
                  onChange={(e) => setFilterPeriodNumber(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={1}>H1 (Jan-Jun)</option>
                  <option value={2}>H2 (Jul-Dec)</option>
                </select>
              )}
              {filterPeriodType === "MONTHLY" && (
                <select
                  value={filterPeriodNumber}
                  onChange={(e) => setFilterPeriodNumber(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              )}
              <button
                onClick={fetchLeaderboard}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                Apply Filter
              </button>
            </div>

            {/* Team Summary Cards */}
            {teamSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Sales Reps"
                  value={teamSummary.total_sales_reps}
                  icon={<FiUsers size={22} />}
                  color="blue"
                />
                <MetricCard
                  title="Met Quota"
                  value={teamSummary.above_target_count}
                  icon={<FiTrendingUp size={22} />}
                  color="green"
                />
                <MetricCard
                  title="Below Quota"
                  value={teamSummary.below_target_count}
                  icon={<FiTrendingDown size={22} />}
                  color="orange"
                />
                <MetricCard
                  title="Team Achievement"
                  value={`${teamSummary.overall_achievement}%`}
                  icon={<FiTarget size={22} />}
                  color="purple"
                />
              </div>
            )}

            {/* Leaderboard Table */}
            {leaderboardLoading ? (
              <LoadingSpinner message="Loading leaderboard..." />
            ) : leaderboard?.entries?.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FiAward className="mr-2 text-yellow-500" />
                    Sales Leaderboard
                    {leaderboard.period_type !== "ALL" && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({leaderboard.period_type} {leaderboard.period_year})
                      </span>
                    )}
                  </h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left font-semibold text-gray-600">Rank</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-600">Sales Rep</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-600">Role</th>
                      <th className="py-3 px-4 text-right font-semibold text-gray-600">Target</th>
                      <th className="py-3 px-4 text-right font-semibold text-gray-600">Achieved</th>
                      <th className="py-3 px-4 text-right font-semibold text-gray-600">Achievement</th>
                      <th className="py-3 px-4 text-center font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.entries.map((entry) => (
                      <tr key={entry.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            entry.rank === 1
                              ? "bg-yellow-100 text-yellow-700"
                              : entry.rank === 2
                              ? "bg-gray-100 text-gray-700"
                              : entry.rank === 3
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-50 text-gray-600"
                          }`}>
                            {entry.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">{entry.user_name}</td>
                        <td className="py-3 px-4 text-gray-500">{entry.role}</td>
                        <td className="py-3 px-4 text-right">{currencySymbol}{Number(entry.target_amount).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">{currencySymbol}{Number(entry.achieved_amount).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                            entry.achievement_percentage >= 100
                              ? "bg-green-500"
                              : entry.achievement_percentage >= 75
                              ? "bg-blue-500"
                              : entry.achievement_percentage >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}>
                            {entry.achievement_percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              fetchUserHistory(entry.user_id);
                              setActiveTab("history");
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                <FiAward size={48} className="mx-auto mb-4 opacity-20" />
                <p>No leaderboard data available for the selected period.</p>
              </div>
            )}

            {/* Needs Attention Section */}
            {teamSummary?.needs_attention?.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                  <FiTrendingDown className="mr-2" />
                  Needs Attention (Below 50%)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teamSummary.needs_attention.map((rep) => (
                    <div key={rep.user_id} className="bg-white rounded-lg p-3 border border-red-100">
                      <p className="font-medium text-gray-800">{rep.user_name}</p>
                      <p className="text-sm text-gray-500">{rep.role}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-red-600 font-semibold">{rep.achievement_percentage}%</span>
                        <span className="text-xs text-gray-500">
                          {currencySymbol}{Number(rep.remaining_amount).toLocaleString()} remaining
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* User Selection */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Select Sales Rep to View History:</h3>
              <div className="flex gap-4 flex-wrap">
                <select
                  onChange={(e) => e.target.value && fetchUserHistory(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  value={selectedUserHistory?.user_id || ""}
                >
                  <option value="">-- Select User --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {historyLoading ? (
              <LoadingSpinner message="Loading history..." />
            ) : selectedUserHistory ? (
              <>
                {/* User Summary */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">{selectedUserHistory.user_name}</h2>
                  
                  {/* Period Comparison */}
                  {selectedUserHistory.current_period && selectedUserHistory.previous_period && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium">Current Period</p>
                        <p className="text-xs text-gray-500">{selectedUserHistory.current_period.period_label}</p>
                        <p className="text-2xl font-bold text-blue-700 mt-2">
                          {selectedUserHistory.current_period.achievement_percentage}%
                        </p>
                        <p className="text-sm text-gray-600">
                          {currencySymbol}{Number(selectedUserHistory.current_period.achieved_amount).toLocaleString()} / {currencySymbol}{Number(selectedUserHistory.current_period.target_amount).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 font-medium">Previous Period</p>
                        <p className="text-xs text-gray-500">{selectedUserHistory.previous_period.period_label}</p>
                        <p className="text-2xl font-bold text-gray-700 mt-2">
                          {selectedUserHistory.previous_period.achievement_percentage}%
                        </p>
                        <p className="text-sm text-gray-600">
                          {currencySymbol}{Number(selectedUserHistory.previous_period.achieved_amount).toLocaleString()} / {currencySymbol}{Number(selectedUserHistory.previous_period.target_amount).toLocaleString()}
                        </p>
                      </div>
                      <div className={`rounded-lg p-4 ${selectedUserHistory.growth_percentage >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                        <p className="text-sm font-medium" style={{ color: selectedUserHistory.growth_percentage >= 0 ? "#16a34a" : "#dc2626" }}>
                          Growth
                        </p>
                        <p className={`text-2xl font-bold mt-2 flex items-center ${selectedUserHistory.growth_percentage >= 0 ? "text-green-700" : "text-red-700"}`}>
                          {selectedUserHistory.growth_percentage >= 0 ? <FiTrendingUp className="mr-2" /> : <FiTrendingDown className="mr-2" />}
                          {selectedUserHistory.growth_percentage >= 0 ? "+" : ""}{selectedUserHistory.growth_percentage?.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedUserHistory.growth_amount >= 0 ? "+" : ""}{currencySymbol}{Number(selectedUserHistory.growth_amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Historical Chart */}
                  {selectedUserHistory.periods?.length > 0 && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[...selectedUserHistory.periods].reverse()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period_label" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value, name) => [
                              `${currencySymbol}${Number(value).toLocaleString()}`,
                              name === "achieved_amount" ? "Achieved" : "Target"
                            ]}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="target_amount" stroke="#6366f1" name="Target" strokeWidth={2} />
                          <Line type="monotone" dataKey="achieved_amount" stroke="#22c55e" name="Achieved" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* History Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold">All Historical Periods</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left font-semibold text-gray-600">Period</th>
                        <th className="py-3 px-4 text-left font-semibold text-gray-600">Date Range</th>
                        <th className="py-3 px-4 text-right font-semibold text-gray-600">Target</th>
                        <th className="py-3 px-4 text-right font-semibold text-gray-600">Achieved</th>
                        <th className="py-3 px-4 text-right font-semibold text-gray-600">Achievement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserHistory.periods.map((period, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium">{period.period_label}</td>
                          <td className="py-3 px-4 text-gray-500">{period.start_date} - {period.end_date}</td>
                          <td className="py-3 px-4 text-right">{currencySymbol}{Number(period.target_amount).toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">{currencySymbol}{Number(period.achieved_amount).toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                              period.achievement_percentage >= 100
                                ? "bg-green-500"
                                : period.achievement_percentage >= 75
                                ? "bg-blue-500"
                                : period.achievement_percentage >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}>
                              {period.achievement_percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                <FiClock size={48} className="mx-auto mb-4 opacity-20" />
                <p>Select a sales rep to view their historical performance.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}
      {selectedTarget && (
        <DetailModal
          target={selectedTarget}
          currencySymbol={currencySymbol} // PASS SYMBOL TO MODAL
          onClose={() => setSelectedTarget(null)}
          onEdit={() => handleEditClick(selectedTarget)}
          onDelete={() => handleDelete(selectedTarget)}
          canEdit={canCreateTarget}
          canDelete={canDeleteTarget}
        />
      )}

      {showModal && canCreateTarget && (
        <FormModal
          formData={formData}
          users={users}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onChange={handleInputChange}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          fiscalSettings={fiscalSettings}
        />
      )}

      {confirmModalData && (
        <ConfirmationModal
          {...confirmModalData}
          loading={confirmProcessing}
          onConfirm={async () => {
            setConfirmProcessing(true);
            await confirmModalData.action();
            setConfirmProcessing(false);
            setConfirmModalData(null);
          }}
          onCancel={() => setConfirmModalData(null)}
        />
      )}
    </>
  );
}

/* ======================================================
   METRIC CARD COMPONENT
====================================================== */
function MetricCard({ title, value, icon, color = "blue" }) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200">
      <div className={`p-3 rounded-full ${colorMap[color]} mr-4`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

/* ======================================================
   DETAIL MODAL
====================================================== */
function DetailModal({ target, onClose, onEdit, onDelete, canEdit, canDelete, currencySymbol }) {
  const achievementPercent =
    Number(target.target_amount) > 0
      ? ((Number(target.achieved_amount) / Number(target.target_amount)) * 100).toFixed(1)
      : 0;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto hide-scrollbar animate-scale-in font-inter relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-tertiary w-full flex items-center justify-between p-3 lg:p-4 rounded-t-xl">
          <h1 className="lg:text-3xl text-xl text-white font-semibold text-center w-full">
            Target Details
          </h1>
          <button
            onClick={onClose}
            className="text-gray-200 hover:text-white transition cursor-pointer"
          >
            <FiX size={25} />
          </button>
        </div>

        {canEdit && (
          <div className="p-6 lg:p-4">
            <div className="flex flex-col md:flex-row md:justify-between lg:flex-row lg:items-center lg:justify-between mt-3 gap-2 px-2 md:items-center lg:gap-4 md:mx-7 lg:mx-7">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                  {target.user && `${target.user.first_name} ${target.user.last_name}`}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                  onClick={onEdit}
                >
                  <FiEdit className="mr-2" />
                  Edit
                </button>
                {canDelete && (
                  <button
                    className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                    onClick={onDelete}
                  >
                    <FiTrash2 className="mr-2" />
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="border-b border-gray-200 my-5"></div>
          </div>
        )}

        <div className="p-4 lg:p-6">
          <div className="flex w-full bg-gray-600 text-white overflow-x-auto">
            <button className="flex-1 min-w-[90px] px-4 py-2 lg:text-lg text-sm font-medium text-center text-white">
              Overview
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm sm:p-6 lg:p-5 border border-gray-200 text-sm text-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <p className="font-semibold text-gray-900">Sales Person:</p>
                <p>
                  {target.user
                    ? `${target.user.first_name} ${target.user.last_name}`
                    : "Unknown"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Target Amount:</p>
                <p className="text-green-600 font-semibold">{currencySymbol}{Number(target.target_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Achieved Amount:</p>
                <p className="text-blue-600 font-semibold">{currencySymbol}{Number(target.achieved_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Achievement Rate:</p>
                <p className={`font-semibold ${achievementPercent >= 100
                    ? "text-green-600"
                    : achievementPercent >= 75
                      ? "text-blue-600"
                      : achievementPercent >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}>
                  {achievementPercent}%
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Start Date:</p>
                <p>{target.start_date}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">End Date:</p>
                <p>{target.end_date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   FORM MODAL
====================================================== */
function FormModal({
  formData,
  users,
  isEditing,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
  fiscalSettings,
}) {
  // Get fiscal start month (1-12), default to January if not set
  const fiscalStartMonth = fiscalSettings?.fiscal_start_month || 1;
  
  // Helper to format date as YYYY-MM-DD without timezone issues
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Helper to calculate dates based on period type with fiscal year support
  const calculatePeriodDates = (periodType, year, periodNum) => {
    let startDate, endDate;
    
    if (periodType === "MONTHLY") {
      // Monthly is always calendar month (periodNum = 1-12 for Jan-Dec)
      startDate = new Date(year, periodNum - 1, 1);
      endDate = new Date(year, periodNum, 0); // Last day of that month
    } else if (periodType === "QUARTERLY") {
      // Fiscal quarters: Q1 starts at fiscal start month
      // For September fiscal start (9): Q1=Sep-Nov, Q2=Dec-Feb, Q3=Mar-May, Q4=Jun-Aug
      const monthsFromFiscalStart = (periodNum - 1) * 3;
      const startMonthIndex = (fiscalStartMonth - 1 + monthsFromFiscalStart) % 12;
      
      // Determine calendar year for this quarter
      let startYear = year;
      if (fiscalStartMonth > 1) {
        // Fiscal year spans two calendar years
        // FY2026 with Sep start = Sep 2025 - Aug 2026
        if (startMonthIndex >= fiscalStartMonth - 1) {
          // This quarter is in the first calendar year of the fiscal year
          startYear = year - 1;
        } else {
          // This quarter is in the second calendar year
          startYear = year;
        }
      }
      
      startDate = new Date(startYear, startMonthIndex, 1);
      // End date: last day of the 3rd month of the quarter
      const endMonthIndex = (startMonthIndex + 2) % 12;
      const endYear = startMonthIndex + 2 >= 12 ? startYear + 1 : startYear;
      endDate = new Date(endYear, endMonthIndex + 1, 0);
    } else if (periodType === "SEMIANNUAL") {
      // Fiscal halves: H1 = first 6 months, H2 = last 6 months
      const monthsFromFiscalStart = (periodNum - 1) * 6;
      const startMonthIndex = (fiscalStartMonth - 1 + monthsFromFiscalStart) % 12;
      
      let startYear = year;
      if (fiscalStartMonth > 1) {
        if (startMonthIndex >= fiscalStartMonth - 1) {
          startYear = year - 1;
        } else {
          startYear = year;
        }
      }
      
      startDate = new Date(startYear, startMonthIndex, 1);
      // End date: last day of the 6th month of the half
      const endMonthIndex = (startMonthIndex + 5) % 12;
      const endYear = startMonthIndex + 5 >= 12 ? startYear + 1 : startYear;
      endDate = new Date(endYear, endMonthIndex + 1, 0);
    } else if (periodType === "ANNUAL") {
      // Full fiscal year
      // FY2026 with September start = September 1, 2025 to August 31, 2026
      const startMonthIndex = fiscalStartMonth - 1; // 0-indexed (Sep = 8)
      let startYear = fiscalStartMonth > 1 ? year - 1 : year;
      
      startDate = new Date(startYear, startMonthIndex, 1);
      // End date: last day of month before fiscal start, next year
      // For Sep start: end is Aug 31 of following year
      const endMonthIndex = (fiscalStartMonth - 2 + 12) % 12; // Month before fiscal start
      endDate = new Date(startYear + 1, endMonthIndex + 1, 0);
    }
    
    return { startDate, endDate };
  };

  const handlePeriodTypeChange = (e) => {
    const periodType = e.target.value;
    onChange({ target: { name: "period_type", value: periodType } });
    
    if (periodType !== "CUSTOM") {
      const year = formData.period_year || new Date().getFullYear();
      const periodNum = formData.period_number || 1;
      
      const { startDate, endDate } = calculatePeriodDates(periodType, year, periodNum);
      
      if (startDate && endDate) {
        onChange({ target: { name: "start_date", value: formatDateLocal(startDate) } });
        onChange({ target: { name: "end_date", value: formatDateLocal(endDate) } });
      }
    }
  };

  const handlePeriodNumberChange = (e) => {
    const periodNum = Number(e.target.value);
    onChange({ target: { name: "period_number", value: periodNum } });
    
    const year = formData.period_year || new Date().getFullYear();
    const periodType = formData.period_type;
    
    if (periodType !== "CUSTOM") {
      const { startDate, endDate } = calculatePeriodDates(periodType, year, periodNum);
      
      if (startDate && endDate) {
        onChange({ target: { name: "start_date", value: formatDateLocal(startDate) } });
        onChange({ target: { name: "end_date", value: formatDateLocal(endDate) } });
      }
    }
  };

  const handleYearChange = (e) => {
    const year = Number(e.target.value);
    onChange({ target: { name: "period_year", value: year } });
    
    const periodType = formData.period_type;
    const periodNum = formData.period_number || 1;
    
    if (periodType !== "CUSTOM") {
      const { startDate, endDate } = calculatePeriodDates(periodType, year, periodNum);
      
      if (startDate && endDate) {
        onChange({ target: { name: "start_date", value: formatDateLocal(startDate) } });
        onChange({ target: { name: "end_date", value: formatDateLocal(endDate) } });
      }
    }
  };

  // Recalculate dates when modal opens or fiscal settings change
  useEffect(() => {
    if (formData.period_type !== "CUSTOM" && !formData.start_date) {
      const year = formData.period_year || new Date().getFullYear();
      const periodNum = formData.period_number || 1;
      const { startDate, endDate } = calculatePeriodDates(formData.period_type, year, periodNum);
      
      if (startDate && endDate) {
        onChange({ target: { name: "start_date", value: formatDateLocal(startDate) } });
        onChange({ target: { name: "end_date", value: formatDateLocal(endDate) } });
      }
    }
  }, [fiscalSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 relative overflow-y-auto max-h-[90vh] hide-scrollbar">
        <button onClick={onClose} className="absolute top-5 right-5">
          <FiX size={24} />
        </button>

        <h2 className="text-2xl font-semibold text-center mb-6">
          {isEditing ? "Edit Target" : "Add New Target"}
        </h2>

        <form onSubmit={onSubmit} className="grid gap-4 text-base">
          <div className="flex flex-col gap-1 relative">
            <label className="text-sm font-medium text-gray-700">
              Assign User
            </label>

            <SearchableSelect
              name="user_id"
              items={users}
              value={formData.user_id}
              onChange={onChange}
              getLabel={(u) => `${u.first_name} ${u.last_name}`}
              placeholder="Search user..."
            />
          </div>

          {/* Period Type Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 text-left">
              Period Type
            </label>
            <select
              name="period_type"
              value={formData.period_type}
              onChange={handlePeriodTypeChange}
              className="w-full border text-gray-500 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            >
              {PERIOD_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </div>

          {/* Period Number (for non-custom periods) */}
          {formData.period_type !== "CUSTOM" && formData.period_type !== "ANNUAL" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 text-left">
                {formData.period_type === "MONTHLY" ? "Month" : 
                 formData.period_type === "QUARTERLY" ? "Quarter" : "Half"}
              </label>
              <select
                name="period_number"
                value={formData.period_number}
                onChange={handlePeriodNumberChange}
                className="w-full border text-gray-500 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              >
                {formData.period_type === "MONTHLY" && 
                  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))
                }
                {formData.period_type === "QUARTERLY" && 
                  [1, 2, 3, 4].map((q) => (
                    <option key={q} value={q}>Q{q} {fiscalSettings?.quarters?.[`Q${q}`] ? `(${fiscalSettings.quarters[`Q${q}`]})` : ""}</option>
                  ))
                }
                {formData.period_type === "SEMIANNUAL" && 
                  [1, 2].map((h) => (
                    <option key={h} value={h}>H{h} {fiscalSettings?.halves?.[`H${h}`] ? `(${fiscalSettings.halves[`H${h}`]})` : `(${h === 1 ? "Jan-Jun" : "Jul-Dec"})`}</option>
                  ))
                }
              </select>
            </div>
          )}

          {/* Year Selection */}
          {formData.period_type !== "CUSTOM" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 text-left">
                {fiscalStartMonth !== 1 ? "Fiscal Year" : "Year"}
              </label>
              <select
                name="period_year"
                value={formData.period_year}
                onChange={handleYearChange}
                className="w-full border text-gray-500 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() + 1 - i;
                  return <option key={year} value={year}>{fiscalStartMonth !== 1 ? `FY${year}` : year}</option>;
                })}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 text-left">
              Target Amount
            </label>
            <div className="flex justify-center w-full">
              <input
                type="number"
                name="target_amount"
                placeholder="0.00"
                value={formData.target_amount}
                onChange={onChange}
                required
                className="w-full max-w-md border text-gray-500 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 text-left">
              Start Date {formData.period_type !== "CUSTOM" && <span className="text-gray-400 text-xs">(auto-calculated)</span>}
            </label>
            <div className="flex justify-center w-full">
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={onChange}
                required
                className="w-full max-w-md border text-gray-500 border-gray-300 text-gray-500 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 text-left">
              End Date
            </label>
            <div className="flex justify-center w-full">
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={onChange}
                required
                className="w-full max-w-md border text-gray-500 border-gray-300 text-gray-500 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-red-400 text-white px-5 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-tertiary text-white px-5 py-2 rounded-lg hover:bg-tertiary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Target"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ======================================================
   CONFIRMATION MODAL
====================================================== */
function ConfirmationModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  loading,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{message}</p>

        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-70"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`w-full sm:w-auto px-4 py-2 rounded-md text-white transition disabled:opacity-70 ${variant === "danger"
                ? "bg-red-500 hover:bg-red-600 border border-red-400"
                : "bg-tertiary hover:bg-tertiary/90 border border-tertiary"
              }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}