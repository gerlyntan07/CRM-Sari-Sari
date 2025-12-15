import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FiClock,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiStar,
  FiEdit2,
  FiSearch,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

import TaskModal from "../components/TaskModal";
import PaginationControls from "../components/PaginationControls.jsx";
import api from "../api";
import { toast } from "react-toastify";
import useFetchUser from "../hooks/useFetchUser";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useLocation, useNavigate } from "react-router-dom";

/** ✅ Match your backend Enum values */
const BOARD_COLUMNS = ["Not started", "In progress", "Deferred", "Completed"];
const LIST_PAGE_SIZE = 10;

const RELATED_TYPES = ["Account", "Contact", "Lead", "Deal"];

const normalizeRelatedType = (t) => {
  if (!t) return null;
  const v = String(t).trim().toLowerCase();
  if (v === "account") return "Account";
  if (v === "contact") return "Contact";
  if (v === "lead") return "Lead";
  if (v === "deal") return "Deal";
  return null;
};

const parseOptionalInt = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// --- Utility Functions ---
const toDateTimeInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - tzOffset * 60 * 1000);
  return adjusted.toISOString().slice(0, 16);
};

const formatDateDisplay = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * ✅ IMPORTANT:
 * - Send type ONLY if it's Account/Contact/Lead/Deal
 * - Convert relatedTo to int
 * - If type is invalid, relatedTo is forced to null (prevents backend 422)
 */
const buildTaskPayload = (data) => {
  const trimmedTitle = data.title?.trim() ?? "";
  const trimmedDescription = data.description?.trim() ?? "";
  const trimmedNotes = data.notes?.trim() ?? "";

  const assignedToValue = parseOptionalInt(data.assignedTo);

  const type = normalizeRelatedType(data.type);
  const relatedToId = parseOptionalInt(data.relatedTo);

  return {
    title: trimmedTitle,
    description: trimmedDescription,
    type: type, // ✅ null OR Account/Contact/Lead/Deal
    priority: data.priority || "Low",
    status: data.status || "Not started",
    dueDate: data.dueDate ? data.dueDate : null,
    assignedTo: assignedToValue,
    relatedTo: type ? relatedToId : null, // ✅ only allow relatedTo if type is valid
    notes: trimmedNotes || null,
    isPersonal: Boolean(data.isPersonal),
    visibility: Boolean(data.isPersonal) ? "personal" : "shared",
  };
};

// --- Task Data Mapping (supports snake_case OR nested relations)
const mapBackendTaskToFrontend = (task) => {
  const assignedToId = task.assignedTo ?? task.assigned_to ?? null;

  const assignedToName =
    task.assignedToName ??
    (task.task_assign_to
      ? `${task.task_assign_to.first_name} ${task.task_assign_to.last_name}`
      : task.assigned_to
      ? String(task.assigned_to)
      : "Unassigned");

  const createdByName =
    task.createdBy ??
    (task.task_creator
      ? `${task.task_creator.first_name} ${task.task_creator.last_name}`
      : task.created_by
      ? String(task.created_by)
      : "System");

  const dueDate = task.dueDate ?? task.due_date ?? null;

  const dateAssigned =
    task.dateAssigned ??
    task.date_assigned ??
    task.created_at ??
    task.createdAt ??
    null;

  const createdAt = task.createdAt ?? task.created_at ?? null;

  // ✅ infer relatedType + relatedId from FK or nested models
  const relatedType =
    normalizeRelatedType(task.type) ||
    (task.related_to_account || task.account ? "Account" : null) ||
    (task.related_to_contact || task.contact ? "Contact" : null) ||
    (task.related_to_lead || task.lead ? "Lead" : null) ||
    (task.related_to_deal || task.deal ? "Deal" : null);

  const relatedToId =
    task.relatedTo ??
    task.related_to ??
    task.related_to_account ??
    task.related_to_contact ??
    task.related_to_lead ??
    task.related_to_deal ??
    task.account?.id ??
    task.contact?.id ??
    task.lead?.id ??
    task.deal?.id ??
    null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority || "Low",
    status: task.status || "Not started",
    dueDate,
    dateAssigned,
    assignedToId,
    assignedToName,
    createdAt,
    createdById: task.createdById ?? task.created_by ?? null,
    createdBy: createdByName,
    relatedType,
    relatedToId,
    notes: task.notes || "",
    isPersonal: Boolean(task.isPersonal ?? task.is_personal),
  };
};

export default function AdminTask() {
  useEffect(() => {
    document.title = "Tasks | Sari-Sari CRM";
  }, []);

  const { user: currentUser, loading: userLoading } = useFetchUser();

  const [view, setView] = useState("board");
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Filter by Status");
  const [filterPriority, setFilterPriority] = useState("Filter by Priority");

  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // store taskId to open after tasks load (notif)
  const [pendingOpenTaskId, setPendingOpenTaskId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "", // ✅ no default "Call"
    relatedTo: "",
    priority: "Low",
    status: "Not started",
    dueDate: "",
    assignedTo: "",
    isPersonal: false,
    notes: "",
  });

  const resetForm = useCallback(() => {
    setSelectedTask(null);
    setFormData({
      title: "",
      description: "",
      type: "",
      relatedTo: "",
      priority: "Low",
      status: "Not started",
      dueDate: "",
      assignedTo: "",
      isPersonal: false,
      notes: "",
    });
  }, []);

  const handleOpenModal = useCallback(
    (task = null, isViewOnly = false) => {
      setSelectedTask(task);
      setViewMode(isViewOnly);

      if (task) {
        setFormData({
          title: task.title || "",
          description: task.description || "",
          type: task.relatedType || "", // ✅ inferred from backend data
          priority: task.priority || "Low",
          status: task.status || "Not started",
          dueDate: toDateTimeInputValue(task.dueDate),
          assignedTo: task.assignedToId ? String(task.assignedToId) : "",
          relatedTo: task.relatedToId ? String(task.relatedToId) : "",
          notes: task.notes || "",
          isPersonal: Boolean(task.isPersonal),
        });
      } else {
        resetForm();
      }

      setShowModal(true);
    },
    [resetForm]
  );

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedTask(null);
    setViewMode(false);
    resetForm();
  }, [resetForm]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/users/all");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users. Please refresh and try again.");
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/tasks/all");
      const rawTasks = Array.isArray(res.data) ? res.data : [];
      const formattedTasks = rawTasks.map(mapBackendTaskToFrontend);

      formattedTasks.sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt) : 0;
        const bDate = b.createdAt ? new Date(b.createdAt) : 0;
        return bDate - aDate;
      });

      setTasks(formattedTasks);

      if (view === "list") setCurrentPage(1);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      toast.error("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    if (!userLoading && currentUser) {
      fetchUsers();
      fetchTasks();
    }
  }, [userLoading, currentUser, fetchUsers, fetchTasks]);

  // accept navigation state from notification (taskId)
  useEffect(() => {
    const shouldOpen = location.state?.openTaskModal;
    const initialData = location.state?.initialTaskData;
    const taskId = location.state?.taskId;

    if (!shouldOpen) return;

    if (taskId) {
      setPendingOpenTaskId(taskId);
    } else {
      setShowModal(true);
      if (initialData) setFormData((prev) => ({ ...prev, ...initialData }));
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [location, navigate]);

  // open the task after tasks are loaded
  useEffect(() => {
    if (!pendingOpenTaskId) return;
    if (loading || userLoading) return;

    const found = tasks.find((t) => String(t.id) === String(pendingOpenTaskId));
    if (found) handleOpenModal(found, true);
    else toast.error("Task not found or you don't have access to it.");

    setPendingOpenTaskId(null);
  }, [pendingOpenTaskId, tasks, loading, userLoading, handleOpenModal]);

  const handleSaveTask = async (newTask) => {
    const requestPayload = buildTaskPayload(newTask);

    // optional guard: prevent sending relatedTo with invalid type
    if (parseOptionalInt(newTask.relatedTo) && !normalizeRelatedType(newTask.type)) {
      toast.error("Select a valid Type (Account/Contact/Lead/Deal) before choosing Related To.");
      return;
    }

    try {
      if (selectedTask && !viewMode) {
        await api.put(`/tasks/${selectedTask.id}`, requestPayload);
        toast.success(`Task "${selectedTask.title}" updated successfully.`);
      } else {
        await api.post(`/tasks/createtask`, requestPayload);
        toast.success("Task created successfully.");
      }

      setShowModal(false);
      await fetchTasks();
    } catch (error) {
      console.error("Failed to save task:", error);
      const detail = error.response?.data?.detail || "Failed to save task.";
      toast.error(detail);
    }
  };

  const handleDeleteTask = (task) => {
    if (!task) return;
    setConfirmModalData({
      title: "Delete Task",
      message: (
        <>
          Are you sure you want to delete{" "}
          <span className="font-semibold">{task.title}</span>? This action cannot be undone.
        </>
      ),
      confirmLabel: "Delete Task",
      cancelLabel: "Cancel",
      variant: "danger",
      action: { type: "delete", targetId: task.id, name: task.title },
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModalData?.action) {
      setConfirmModalData(null);
      return;
    }

    const { type, targetId, name } = confirmModalData.action;
    setConfirmProcessing(true);

    try {
      if (type === "delete") {
        await api.delete(`/tasks/${targetId}`);
        toast.success(name ? `Task "${name}" deleted successfully.` : "Task deleted.");
        await fetchTasks();
      }
    } catch (error) {
      console.error("Task action failed:", error);
      const detail = error.response?.data?.detail || "Failed to delete task.";
      toast.error(detail);
    } finally {
      setConfirmProcessing(false);
      setConfirmModalData(null);
    }
  };

  const handleCancelConfirm = () => {
    if (confirmProcessing) return;
    setConfirmModalData(null);
  };

  const filteredTasks = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const sortedTasks = [...tasks].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt) : 0;
      const bDate = b.createdAt ? new Date(b.createdAt) : 0;
      return bDate - aDate;
    });

    return sortedTasks.filter((task) => {
      const matchesSearch =
        normalized === "" ||
        task.title?.toLowerCase().includes(normalized) ||
        task.description?.toLowerCase().includes(normalized) ||
        task.assignedToName?.toLowerCase().includes(normalized) ||
        task.createdBy?.toLowerCase().includes(normalized);

      const matchesStatus =
        filterStatus === "Filter by Status" || task.status === filterStatus;

      const matchesPriority =
        filterPriority === "Filter by Priority" || task.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, filterStatus, filterPriority]);

  useEffect(() => setCurrentPage(1), [search, filterStatus, filterPriority, view]);

  useEffect(() => {
    if (view === "list") {
      const maxPage =
        filteredTasks.length === 0 ? 1 : Math.ceil(filteredTasks.length / LIST_PAGE_SIZE);
      if (currentPage > maxPage) setCurrentPage(maxPage);
    }
  }, [filteredTasks.length, currentPage, view]);

  const displayTasks = useMemo(() => {
    if (view === "board") return filteredTasks;
    const startIndex = (currentPage - 1) * LIST_PAGE_SIZE;
    return filteredTasks.slice(startIndex, startIndex + LIST_PAGE_SIZE);
  }, [filteredTasks, currentPage, view]);

  const METRICS = useMemo(() => {
    const now = new Date();
    return [
      {
        title: "Not started",
        value: tasks.filter((t) => t.status === "Not started").length,
        icon: FiClock,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        title: "In progress",
        value: tasks.filter((t) => t.status === "In progress").length,
        icon: FiActivity,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
      {
        title: "Completed",
        value: tasks.filter((t) => t.status === "Completed").length,
        icon: FiCheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        title: "Overdue",
        value: tasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "Completed"
        ).length,
        icon: FiAlertCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
      },
      {
        title: "High Priority",
        value: tasks.filter((t) => t.priority === "High").length,
        icon: FiStar,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      },
    ];
  }, [tasks]);

  const isTaskOverdue = (task) =>
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Completed";

  const getTaskCardColor = (task) => {
    switch (task.status) {
      case "Not started":
        return "bg-blue-50 hover:bg-blue-100 border-blue-200";
      case "In progress":
        return "bg-purple-50 hover:bg-purple-100 border-purple-200";
      case "Deferred":
        return "bg-orange-50 hover:bg-orange-100 border-orange-200";
      case "Completed":
        return "bg-green-50 hover:bg-green-100 border-green-200";
      default:
        return "bg-gray-50 hover:bg-gray-100 border-gray-100";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Not started":
        return "bg-blue-100 text-blue-700";
      case "In progress":
        return "bg-purple-100 text-purple-700";
      case "Deferred":
        return "bg-orange-100 text-orange-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      case "Low":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const confirmationModal = confirmModalData ? (
    <ConfirmationModal
      open
      title={confirmModalData.title}
      message={confirmModalData.message}
      confirmLabel={confirmModalData.confirmLabel}
      cancelLabel={confirmModalData.cancelLabel}
      variant={confirmModalData.variant}
      onConfirm={handleConfirmAction}
      onCancel={handleCancelConfirm}
      loading={confirmProcessing}
    />
  ) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen font-inter relative">
      {(loading || userLoading) && <LoadingSpinner message="Loading tasks..." />}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiActivity className="text-blue-600" /> Tasks Board
          </h1>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base self-end sm:self-auto mt-8 lg:mt-0 cursor-pointer"
        >
          <FiPlus /> Create Task
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6 w-full break-words overflow-hidden lg:overflow-visible">
        {METRICS.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mt-6 mb-4 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:outline-none text-base w-full"
          />
        </div>
        <div className="flex flex-col sm:flex-row w-full lg:w-1/2 gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option>Filter by Status</option>
            {BOARD_COLUMNS.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option>Filter by Priority</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setView("board")}
          className={`px-4 py-2 rounded-full text-sm ${
            view === "board"
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Board View
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`px-4 py-2 rounded-full text-sm ${
            view === "list"
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          List View
        </button>
      </div>

      {!loading && !userLoading && filteredTasks.length === 0 && (
        <p className="text-center text-gray-500 mt-10 p-4 bg-white shadow rounded-lg">
          No tasks found matching current filters.
        </p>
      )}

      {/* Board View */}
      {!loading && !userLoading && filteredTasks.length > 0 && view === "board" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 rounded-md">
          {BOARD_COLUMNS.map((column) => {
            const columnTasks = displayTasks.filter((task) => task.status === column);
            return (
              <div
                key={column}
                className="bg-white p-4 shadow border border-gray-200 flex flex-col relative"
              >
                <div className="absolute top-0 left-0 w-full h-5 bg-secondary rounded-t-md" />
                <div className="flex items-center justify-between mb-3 pt-7">
                  <h3 className="font-medium text-gray-900">{column}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                    {columnTasks.length}
                  </span>
                </div>

                <div className={`space-y-3 ${columnTasks.length > 3 ? "overflow-y-auto max-h-[480px] hide-scrollbar" : ""}`}>
                  {columnTasks.length > 0 ? (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`border rounded-lg p-3 transition flex justify-between items-start cursor-pointer ${getTaskCardColor(task)}`}
                        onClick={() => handleOpenModal(task, true)}
                      >
                        <div className="text-left flex-1">
                          <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                          <p className="text-xs text-gray-500 mt-1">Priority: {task.priority}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Assigned To: {task.assignedToName || "Unassigned"}
                          </p>
                          <p className="text-xs mt-1 text-gray-500">
                            Date:{" "}
                            <span className={isTaskOverdue(task) ? "text-red-600" : "text-gray-600"}>
                              {task.dateAssigned ? formatDateDisplay(task.dateAssigned) : "—"}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 ml-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(task);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {!loading && !userLoading && filteredTasks.length > 0 && view === "list" && (
        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 text-left">
                <tr>
                  <th className="py-3 px-4 font-medium">Task</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Priority</th>
                  <th className="py-3 px-4 font-medium">Assigned To</th>
                  <th className="py-3 px-4 font-medium">Date Assigned</th>
                  <th className="py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {displayTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                    onClick={() => handleOpenModal(task, true)}
                  >
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap font-medium">
                      {task.title}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeClass(task.status)}`}>
                        {task.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                      {task.assignedToName || "Unassigned"}
                    </td>

                    <td className={`py-3 px-4 text-gray-700 whitespace-nowrap ${isTaskOverdue(task) ? "text-red-600 font-medium" : ""}`}>
                      {task.dateAssigned ? formatDateDisplay(task.dateAssigned) : "—"}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(task)}
                          className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task)}
                          className="text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !userLoading && view === "list" && (
        <PaginationControls
          className="mt-6"
          totalItems={filteredTasks.length}
          pageSize={LIST_PAGE_SIZE}
          currentPage={filteredTasks.length === 0 ? 0 : currentPage}
          onPrev={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          onNext={() =>
            setCurrentPage((prev) =>
              Math.min(prev + 1, Math.max(1, Math.ceil(filteredTasks.length / LIST_PAGE_SIZE) || 1))
            )
          }
          label="tasks"
        />
      )}

      <TaskModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        setFormData={setFormData}
        formData={formData}
        isEditing={Boolean(selectedTask) && !viewMode}
        viewMode={viewMode}
        users={users}
        currentUser={currentUser}
        relatedTypes={RELATED_TYPES} // ✅ if you want to use it in TaskModal
      />

      {confirmationModal}
    </div>
  );
}

// --- Helper UI Components ---
function MetricCard({ icon: Icon, title, value, color = "text-blue-600", bgColor = "bg-blue-100", onClick }) {
  return (
    <div
      className="flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300"
      onClick={onClick}
    >
      <div className={`flex-shrink-0 p-3 rounded-full ${bgColor} ${color} mr-4`}>
        {Icon ? <Icon size={22} /> : null}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmClasses =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600 border border-red-400"
      : "bg-tertiary hover:bg-secondary border border-tertiary";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{message}</p>

        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-70"
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:w-auto px-4 py-2 rounded-md text-white transition disabled:opacity-70 ${confirmClasses}`}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
