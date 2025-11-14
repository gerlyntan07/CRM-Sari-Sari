import React, { useState, useEffect, useMemo } from "react";
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

const BOARD_COLUMNS = ["To Do", "In Progress", "Review", "Completed"];
const BOARD_PAGE_SIZE = 12;
const LIST_PAGE_SIZE = 10;

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

const buildTaskPayload = (data) => {
  const trimmedTitle = data.title?.trim() ?? "";
  const trimmedDescription = data.description?.trim() ?? "";
  const trimmedNotes = data.notes?.trim() ?? "";
  const trimmedRelated = data.relatedTo?.trim() ?? "";
  const isPersonal = Boolean(data.isPersonal);
  const assignedToValue = data.assignedTo ? Number(data.assignedTo) : null;
  return {
    title: trimmedTitle,
    description: trimmedDescription,
    type: data.type || "Call",
    priority: data.priority || "Low",
    status: data.status || "To Do",
    due_date: data.dueDate ? data.dueDate : null,
    assigned_to: assignedToValue,
    related_to: trimmedRelated || null,
    notes: trimmedNotes,
    is_personal: isPersonal,
    visibility: isPersonal ? "personal" : "shared",
  };
};

export default function AdminTask() {
  const { user: currentUser, loading: userLoading } = useFetchUser();
  const [view, setView] = useState("board");
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Call",
    priority: "Low",
    status: "To Do",
    dueDate: "",
    assignedTo: "",
    relatedTo: "",
    notes: "",
    isPersonal: false,
  });

  const pageSize = view === "board" ? BOARD_PAGE_SIZE : LIST_PAGE_SIZE;

  useEffect(() => {
    if (!userLoading) {
      fetchUsers();
      fetchTasks();
    }
  }, [userLoading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterPriority, view]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tasks/all");
      const formatted = (Array.isArray(res.data) ? res.data : []).map(
        (task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          type: task.type,
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate || task.due_date || null,
          dateAssigned: task.dateAssigned || task.date_assigned || null,
          assignedToId: task.assignedToId ?? task.assigned_to ?? null,
          assignedToName:
            task.assignedToName ||
            task.assignedTo ||
            (task.assigned_to ? String(task.assigned_to) : "Unassigned"),
          createdAt: task.createdAt || null,
          createdById: task.createdById ?? null,
          createdBy: task.createdBy ?? null,
          relatedTo: task.relatedTo || "",
          notes: task.notes || "",
          isPersonal: Boolean(task.isPersonal),
        })
      );

      formatted.sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt) : 0;
        const bDate = b.createdAt ? new Date(b.createdAt) : 0;
        return bDate - aDate;
      });
      setTasks(formatted);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      toast.error("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/all");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users. Please refresh and try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "Call",
      priority: "Low",
      status: "To Do",
      dueDate: "",
      assignedTo: currentUser ? String(currentUser.id) : "",
      relatedTo: "",
      notes: "",
      isPersonal: false,
    });
  };

  const handleOpenModal = (task = null) => {
    setSelectedTask(task);
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        type: task.type || "Call",
        priority: task.priority || "Low",
        status: task.status || "To Do",
        dueDate: toDateTimeInputValue(task.dueDate),
        assignedTo: task.assignedToId ? String(task.assignedToId) : "",
        relatedTo: task.relatedTo || "",
        notes: task.notes || "",
        isPersonal: Boolean(task.isPersonal),
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTask(null);
    resetForm();
  };

  const handleSaveTask = (newTask) => {
    setFormData(newTask);
    const isEditing = Boolean(selectedTask?.id);
    const actionType = isEditing ? "update" : "create";
    const taskTitle = newTask.title?.trim() || "this task";
    setConfirmModalData({
      title: isEditing ? "Confirm Update" : "Confirm New Task",
      message: isEditing
        ? `Save changes to "${taskTitle}"?`
        : `Create task "${taskTitle}"?`,
      confirmLabel: isEditing ? "Update Task" : "Create Task",
      cancelLabel: "Cancel",
      variant: "primary",
      action: {
        type: actionType,
        payload: newTask,
        targetId: selectedTask?.id ?? null,
      },
    });
  };

  const handleDeleteTask = (task) => {
    if (!task) return;
    setConfirmModalData({
      title: "Delete Task",
      message: (
        <>
          Are you sure you want to delete{" "}
          <span className="font-semibold">{task.title}</span>? This action
          cannot be undone.
        </>
      ),
      confirmLabel: "Delete Task",
      cancelLabel: "Cancel",
      variant: "danger",
      action: {
        type: "delete",
        targetId: task.id,
        name: task.title,
      },
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModalData?.action) {
      setConfirmModalData(null);
      return;
    }

    const { action } = confirmModalData;
    const { type, payload, targetId, name } = action;

    setConfirmProcessing(true);

    try {
      if (type === "create") {
        const requestPayload = buildTaskPayload(payload);
        await api.post("/tasks/createtask", requestPayload);
        toast.success("Task created successfully.");
        await fetchTasks();
        handleCloseModal();
      } else if (type === "update") {
        if (!targetId) {
          throw new Error("Missing task identifier for update.");
        }
        const requestPayload = buildTaskPayload(payload);
        await api.put(`/tasks/${targetId}`, requestPayload);
        toast.success("Task updated successfully.");
        await fetchTasks();
        handleCloseModal();
      } else if (type === "delete") {
        if (!targetId) {
          throw new Error("Missing task identifier for deletion.");
        }
        await api.delete(`/tasks/${targetId}`);
        toast.success(
          name ? `Task "${name}" deleted successfully.` : "Task deleted."
        );
        await fetchTasks();
      }
    } catch (error) {
      console.error("Task action failed:", error);
      const detail =
        error.response?.data?.detail ||
        (type === "create"
          ? "Failed to create task."
          : type === "update"
          ? "Failed to update task."
          : "Failed to delete task.");
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
        filterStatus === "All" || task.status === filterStatus;
      const matchesPriority =
        filterPriority === "All" || task.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, filterStatus, filterPriority]);

  useEffect(() => {
    const maxPage =
      filteredTasks.length === 0
        ? 1
        : Math.ceil(filteredTasks.length / pageSize);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredTasks.length, currentPage, pageSize]);

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTasks.slice(startIndex, startIndex + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  const METRICS = useMemo(() => {
    const now = new Date();
    return [
      {
        title: "To Do",
        value: tasks.filter((t) => t.status === "To Do").length,
        icon: FiClock,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "In Progress",
        value: tasks.filter((t) => t.status === "In Progress").length,
        icon: FiActivity,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        title: "Completed",
        value: tasks.filter((t) => t.status === "Completed").length,
        icon: FiCheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        title: "Overdue",
        value: tasks.filter(
          (t) =>
            t.dueDate && new Date(t.dueDate) < now && t.status !== "Completed"
        ).length,
        icon: FiAlertCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
      },
      {
        title: "High Priority",
        value: tasks.filter((t) => t.priority === "High").length,
        icon: FiStar,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
    ];
  }, [tasks]);

  const isTaskOverdue = (task) =>
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "Completed";

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
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiActivity className="text-blue-600" /> Tasks and Reminders
          </h1>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 gap-1"
        >
          <FiPlus /> Create Task
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
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
            placeholder="Search by title, description, or assignee..."
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
            <option>All</option>
            {BOARD_COLUMNS.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option>All</option>
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

      {loading && <p className="text-gray-500">Loading tasks...</p>}

      {/* Board View */}
      {!loading && view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {BOARD_COLUMNS.map((column) => {
            const columnTasks = paginatedTasks.filter(
              (task) => task.status === column
            );
            return (
              <div
                key={column}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{column}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {columnTasks.length > 0 ? (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`border border-gray-100 rounded-lg p-3 transition flex justify-between items-start ${
                          isTaskOverdue(task)
                            ? "bg-red-50 hover:bg-red-100"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenModal(task)}
                          className="text-left"
                        >
                          <p className="font-medium text-gray-800 text-sm">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Priority: {task.priority}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Assigned To: {task.assignedToName || "Unassigned"}
                          </p>
                          <p className="text-xs mt-1 text-gray-500">
                            Date:{" "}
                            <span
                              className={
                                isTaskOverdue(task)
                                  ? "text-red-600"
                                  : "text-gray-600"
                              }
                            >
                              {task.dateAssigned
                                ? formatDateDisplay(task.dateAssigned)
                                : "—"}
                            </span>
                          </p>
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(task)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No tasks
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {!loading && view === "list" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-200 text-sm">
                <th className="py-3 px-4 font-medium">Task</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Priority</th>
                <th className="py-3 px-4 font-medium">Assigned To</th>
                <th className="py-3 px-4 font-medium">Date Assigned</th>
                <th className="py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.length > 0 ? (
                paginatedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      isTaskOverdue(task) ? "bg-red-50 hover:bg-red-100" : ""
                    }`}
                  >
                    <td
                      className="py-3 px-4 text-gray-800 text-sm font-medium cursor-pointer"
                      onClick={() => handleOpenModal(task)}
                    >
                      {task.title}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {task.status}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {task.priority}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {task.assignedToName || "Unassigned"}
                    </td>
                    <td
                      className={`py-3 px-4 text-sm ${
                        isTaskOverdue(task) ? "text-red-600" : "text-gray-600"
                      }`}
                    >
                      {task.dateAssigned
                        ? formatDateDisplay(task.dateAssigned)
                        : "—"}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-3">
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="py-4 px-4 text-center text-sm text-gray-500"
                    colSpan={6}
                  >
                    No tasks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <PaginationControls
        className="mt-6"
        totalItems={filteredTasks.length}
        pageSize={pageSize}
        currentPage={filteredTasks.length === 0 ? 0 : currentPage}
        onPrev={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        onNext={() =>
          setCurrentPage((prev) =>
            Math.min(
              prev + 1,
              Math.max(1, Math.ceil(filteredTasks.length / pageSize) || 1)
            )
          )
        }
        label="tasks"
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        setFormData={setFormData}
        formData={formData}
        isEditing={Boolean(selectedTask)}
        users={users}
        currentUser={currentUser}
      />

      {confirmationModal}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  color = "text-blue-600",
  bgColor = "bg-blue-50",
}) {
  return (
    <div className="flex items-center p-4 bg-white rounded-xl shadow-lg hover:shadow-xl hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all duration-300">
      <div
        className={`flex-shrink-0 p-3 rounded-full ${bgColor} ${color} mr-4`}
      >
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
        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
          {message}
        </p>

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
