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
} from "react-icons/fi";
import { FaPesoSign } from "react-icons/fa6";

import { HiX } from "react-icons/hi";
import { toast } from "react-toastify";
import api from "../api";
import PaginationControls from "./PaginationControls.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

/* ======================================================
   CONSTANTS
====================================================== */
const ITEMS_PER_PAGE = 10;

const INITIAL_FORM_STATE = {
  user_id: "",
  start_date: "",
  end_date: "",
  target_amount: "",
};

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
  useEffect(() => {
    document.title = "Targets | Sari-Sari CRM";
  }, []);

  const [targets, setTargets] = useState([]);
  const [users, setUsers] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTargetId, setCurrentTargetId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const [selectedTarget, setSelectedTarget] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  // Chart state
  const [timeframe, setTimeframe] = useState("annual");
  const [selectedPeriod, setSelectedPeriod] = useState(1);

  // Determine if user can create targets
  const canCreateTarget = useMemo(
    () => ["CEO", "ADMIN", "GROUP MANAGER", "MANAGER", "SALES"].includes(currentUserRole?.toUpperCase()),
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
      // Don't show error toast for users who can't access user list
    }
  }, [canCreateTarget]);

  useEffect(() => {
    fetchTargets();
    fetchUsers();
  }, [fetchTargets, fetchUsers]);

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
          // 6-month periods: Jan-Jun (period 1), Jul-Dec (period 2)
          const period1Start = 0, period1End = 5;
          const period2Start = 6, period2End = 11;

          if (selectedPeriod === 1) {
            periodMatch = (startMonth <= period1End && endMonth >= period1Start);
          } else {
            periodMatch = (startMonth <= period2End && endMonth >= period2Start);
          }
        } else if (timeframe === "trimester") {
          // 4-month periods: Jan-Apr (1), May-Aug (2), Sep-Dec (3)
          const trimesters = [
            { start: 0, end: 3 },   // Jan-Apr
            { start: 4, end: 7 },   // May-Aug
            { start: 8, end: 11 },  // Sep-Dec
          ];
          const tri = trimesters[selectedPeriod - 1];
          periodMatch = (startMonth <= tri.end && endMonth >= tri.start);
        } else if (timeframe === "quarterly") {
          // 3-month periods: Q1, Q2, Q3, Q4
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

  const totalPages = Math.max(1, Math.ceil(filteredTargets.length / ITEMS_PER_PAGE));
  const paginatedTargets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTargets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTargets, currentPage]);

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
          // Display backend error message if available
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
          {(canCreateTarget && currentUserRole.toLowerCase() !== "sales") && (
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
            value={`₱${metrics.totalTarget.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            icon={<FaPesoSign size={22} />}
            color="green"
          />
          <MetricCard
            title="Achieved Amount"
            value={`₱${metrics.totalAchieved.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
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
          <div className="bg-white rounded-xl shadow p-4 md:h-[420px] h-[350px]">
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold">Sales Achievement</h2>
            </div>
            <ResponsiveContainer width="100%" height="85%">
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
                        `₱${achievement.toLocaleString()} (${percentage}%)`,
                        "Achieved",
                      ];
                    } else if (name === "Remaining") {
                      return [`₱${remaining.toLocaleString()}`, "Remaining"];
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

          {/* Pie Chart - Target Distribution */}
          <div className="bg-white rounded-xl shadow p-4 md:h-[420px] h-[350px]">
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
            <ResponsiveContainer width="100%" height="85%">
              {pieChartData.length > 0 ? (
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
                              <span className="font-semibold">Target Amount:</span> ₱{Number(data.targetAmount || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-center">No targets data available</p>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Search Bar */}
        {(canCreateTarget && currentUserRole.toLowerCase() !== "sales") && (
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
                <th className="py-3 px-4 text-left">User</th>
                <th className="py-3 px-4 text-left">Target Amount</th>
                <th className="py-3 px-4 text-left">Achieved Amount</th>
                <th className="py-3 px-4 text-left">Achievement %</th>
                <th className="py-3 px-4 text-left">Start Date</th>
                <th className="py-3 px-4 text-left">End Date</th>
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
                      onClick={() => setSelectedTarget(t)}
                    >
                      <td className="py-3 px-4 text-left font-medium">
                        {t.user
                          ? `${t.user.first_name} ${t.user.last_name}`
                          : "Unknown"}
                      </td>
                      <td className="py-3 px-4 text-left">
                        ₱{Number(t.target_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-left">
                        ₱{Number(t.achieved_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-left">
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
                      <td className="py-3 px-4 text-left">{t.start_date}</td>
                      <td className="py-3 px-4 text-left">{t.end_date}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                    No targets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {paginatedTargets.length > 0 && (
          <PaginationControls
            className="mt-4"
            totalItems={filteredTargets.length}
            pageSize={ITEMS_PER_PAGE}
            currentPage={currentPage}
            onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            label="targets"
          />
        )}
      </div>

      {/* ================= MODALS ================= */}
      {selectedTarget && (
        <DetailModal
          target={selectedTarget}
          onClose={() => setSelectedTarget(null)}
          onEdit={() => handleEditClick(selectedTarget)}
          onDelete={() => handleDelete(selectedTarget)}
          canEdit={canCreateTarget}
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
function DetailModal({ target, onClose, onEdit, onDelete, canEdit }) {
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
            <HiX size={25} />
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
                <button
                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                  onClick={onDelete}
                >
                  <FiTrash2 className="mr-2" />
                  Delete
                </button>
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
                <p className="text-green-600 font-semibold">₱{Number(target.target_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Achieved Amount:</p>
                <p className="text-blue-600 font-semibold">₱{Number(target.achieved_amount).toLocaleString()}</p>
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
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 relative overflow-y-auto min-h-[50vh]">
        <button onClick={onClose} className="absolute top-5 right-5">
          <FiX size={24} />
        </button>

        <h2 className="text-2xl font-semibold text-center mb-8">
          {isEditing ? "Edit Target" : "Add New Target"}
        </h2>

        <form onSubmit={onSubmit} className="grid gap-5 text-base">
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
                className="w-full max-w-md border text-gray-500 border-gray-300 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 text-left">
              Start Date
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
