// frontend/src/pages/AdminTask.jsx
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
  FiCheckSquare,
} from "react-icons/fi";
import TaskModal from "../components/TaskModal";
import PaginationControls from "../components/PaginationControls.jsx";
import api from "../api";
import { toast } from "react-toastify";
import useFetchUser from "../hooks/useFetchUser";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useLocation, useNavigate } from "react-router-dom";

const BOARD_COLUMNS = ["Not started", "In progress", "Deferred", "Completed"];

const STATUS_NORMALIZATION_MAP = {
  "NOT_STARTED": "Not started",
  "NOT STARTED": "Not started",
  "TO DO": "Not started",
  "IN_PROGRESS": "In progress",
  "IN PROGRESS": "In progress",
  "COMPLETED": "Completed",
  "DEFERRED": "Deferred",
  "Not started": "Not started",
  "In progress": "In progress",
  "Completed": "Completed",
  "Deferred": "Deferred",
  "In Progress": "In progress",
  "To Do": "Not started",
  "Review": "Deferred"
};

const normalizeTaskStatus = (status) => {
  if (!status) return "Not started";
  // Try exact match first, then uppercase match, then default
  return STATUS_NORMALIZATION_MAP[status] || STATUS_NORMALIZATION_MAP[String(status).toUpperCase()] || "Not started";
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

const buildTaskPayload = (data) => {
  const trimmedTitle = data.subject?.trim() ?? "";
  const trimmedDescription = data.description?.trim() ?? "";
  const trimmedNotes = data.notes?.trim() ?? "";

  // 1. Force Clean the Enum Values
  // We define the maps locally to ensure they are used
  const PRIORITY_MAP = {
    "HIGH": "High",
    "NORMAL": "Normal",
    "LOW": "Low",
    "High": "High",
    "Normal": "Normal",
    "Low": "Low"
  };

  const rawPriority = data.priority ? String(data.priority).toUpperCase() : "NORMAL";

  // Default to "Normal" if the map lookup fails
  const cleanPriority = PRIORITY_MAP[rawPriority] || "Normal";
  
  // Default to "Not started" if the map lookup fails
  const cleanStatus = normalizeTaskStatus(data.status);

  // Initialize specific foreign keys
  let lead_id = null;
  let account_id = null;
  let contact_id = null;
  let deal_id = null;

  // 1. Map Level 1 (Lead or Account)
  if (data.relatedType1 === "Lead" && data.relatedTo1) {
      lead_id = Number(data.relatedTo1);
  } else if (data.relatedType1 === "Account" && data.relatedTo1) {
      account_id = Number(data.relatedTo1);
  }

  // 2. Map Level 2 (Contact or Deal) - Only if Account is selected
  if (data.relatedType1 === "Account") {
      if (data.relatedType2 === "Contact" && data.relatedTo2) {
          contact_id = Number(data.relatedTo2);
      } else if (data.relatedType2 === "Deal" && data.relatedTo2) {
          deal_id = Number(data.relatedTo2);
      }
  }

  const assignedToValue = data.assignedTo ? Number(data.assignedTo) : null;
  
  // 3. Determine Primary Polymorphic Relation
  const primaryRelatedId = contact_id || deal_id || account_id || lead_id;
  const primaryRelatedType = contact_id ? 'Contact' : deal_id ? 'Deal' : account_id ? 'Account' : lead_id ? 'Lead' : null;

  return {
    title: trimmedTitle,
    description: trimmedDescription,
    
    // NO MAPPING NEEDED - Send what the modal gives us
    priority: data.priority || "Normal", 
    status: data.status || "Not started", 

    due_date: data.dueDate ? data.dueDate : null,
    assigned_to: assignedToValue,
    notes: trimmedNotes,
    is_personal: false, 
    lead_id: lead_id,
    account_id: account_id,
    contact_id: contact_id,
    deal_id: deal_id,
    related_to_1: data.relatedTo1 ? Number(data.relatedTo1) : null,
    related_type_1: data.relatedType1,
    related_to_2: data.relatedTo2 ? Number(data.relatedTo2) : null,
    related_type_2: data.relatedType2,
    related_to: primaryRelatedId,
    related_type: primaryRelatedType,
  };
};

const mapBackendTaskToFrontend = (task) => {
  const assignedToName = task.task_assign_to
    ? `${task.task_assign_to.first_name} ${task.task_assign_to.last_name}`
    : task.assigned_to
    ? String(task.assigned_to)
    : "Unassigned";

  const createdByName = task.task_creator
    ? `${task.task_creator.first_name} ${task.task_creator.last_name}`
    : task.created_by
    ? String(task.created_by)
    : "System";

  const dueDate = task.due_date || task.dueDate || null;
  const dateAssigned = task.date_assigned || task.created_at || null;

  const assignedToContact = task.contact
    ? `${task.contact.first_name} ${task.contact.last_name}`
    : task.assigned_to
    ? String(task.assigned_to.id)
    : "Unassigned";

  // --- FIX START: ROBUST ID EXTRACTION ---
  // Helper to get ID from either nested object or flat field
  const getLeadId = () => task.lead?.id || task.lead_id;
  const getAccountId = () => task.account?.id || task.account_id;
  const getContactId = () => task.contact?.id || task.contact_id;
  const getDealId = () => task.deal?.id || task.deal_id;
  const getAssignedToId = () => task.task_assign_to?.id || task.assigned_to;

  const getLeadName = () => task.lead?.title || task.lead_id;
  const getAccountName = () => task.account?.name || task.account_id;
  const getContactName = () => assignedToContact || task.contact_id;
  const getDealName = () => task.deal?.name || task.deal_id;
  // --- FIX END ---

  // Reverse Map for Edit Form: Attempt to detect relationship
  let relatedType1 = "Lead";
  let relatedTo1 = "";
  let relatedType2 = "";
  let relatedTo2 = "";

  let relatedType1Text = "Lead";
  let relatedTo1Text = "";
  let relatedType2Text = "";
  let relatedTo2Text = "";

  const activeAccountId = getAccountId();
  const activeAccountName = getAccountName();
  const activeLeadId = getLeadId();
  const activeLeadName = getLeadName();

  if (activeAccountId) {
    relatedType1 = "Account";
    relatedType1Text = "Account";
    relatedTo1Text = activeAccountName;
    relatedTo1 = String(activeAccountId);

    const activeContactId = getContactId();
    const activeDealId = getDealId();
    const activeContactName = getContactName();
    const activeDealName = getDealName();

    if (activeContactId) {
      relatedType2 = "Contact";
      relatedType2Text = "Contact";
      relatedTo2Text = activeContactName;
      relatedTo2 = String(activeContactId);
    } else if (activeDealId) {
      relatedType2Text = "Deal";
      relatedType2 = "Deal";
      relatedTo2Text = activeDealName;
      relatedTo2 = String(activeDealId);
    }
  } else if (activeLeadId) {
    relatedType1Text = "Lead";
    relatedTo1Text = activeLeadName;
    relatedType1 = "Lead";
    relatedTo1 = String(activeLeadId);
  } else if (task.related_type === "Account") {
    relatedType1 = "Account";
    relatedTo1 = String(task.related_to);
  }

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority || "Normal",
    status: normalizeTaskStatus(task.status),
    dueDate: dueDate,
    dateAssigned: dateAssigned,
    
    // Updated to grab ID correctly for the dropdown
    assignedToId: getAssignedToId() || null, 
    assignedToName: assignedToName,
    
    createdAt: task.created_at || null,
    createdById: task.created_by ?? null,
    createdBy: createdByName,
    notes: task.notes || "",
    isPersonal: Boolean(task.is_personal),

    relatedType1Text,
    relatedTo1Text,
    relatedType2Text,
    relatedTo2Text,

    // Mapped for Edit Form
    subject: task.title,
    relatedType1,
    relatedTo1, // This will now have the value "8"
    relatedType2,
    relatedTo2,
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    id: "",
    subject: "",
    description: "",
    priority: "",
    status: "",
    dueDate: "",
    assignedTo: "",
    notes: "",
    relatedType1: "Lead",
    relatedType2: "Contact",
    relatedTo1: "",
    relatedTo2: "",
  });

  // State to track taskID passed from navigation (e.g., from AdminAccounts)
  const [pendingTaskId, setPendingTaskId] = useState(null);

  // --- Auto-Open Modal Logic ---
  useEffect(() => {
    const shouldOpen = location.state?.openTaskModal;
    const initialData = location.state?.initialTaskData;
    const taskIdFromState = location.state?.taskID;

    if (shouldOpen) {
      setShowModal(true);
      if (initialData) {
        setFormData((prev) => ({
          ...prev,
          ...initialData,
        }));
      }
      navigate(location.pathname, { replace: true, state: {} });
    } else if (taskIdFromState) {
      // If taskID is passed from another page (e.g., AdminAccounts), store it
      setPendingTaskId(taskIdFromState);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // --- Effect to open task modal when taskID is passed and tasks are loaded ---
  useEffect(() => {
    if (pendingTaskId && tasks.length > 0 && !loading) {
      const foundTask = tasks.find((task) => task.id === pendingTaskId);
      if (foundTask) {
        handleOpenModal(foundTask, true); // Open in view mode
      } else {
        toast.error("Task not found.");
      }
      setPendingTaskId(null); // Clear pending task ID
    }
  }, [pendingTaskId, tasks, loading]);

  // --- API Fetch Functions ---

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/all"); 
      setUsers(Array.isArray(res.data) ? res.data : []);      
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users.");
    }
  };

  const fetchTasks = async () => {
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

      console.log("Fetched Tasks:", formattedTasks);
      
      setTasks(formattedTasks);
      if (view === "list") setCurrentPage(1);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && currentUser) {
      fetchUsers();
      fetchTasks();
    }
  }, [userLoading, currentUser]); 

  const resetForm = () => {
    setSelectedTask(null);
    setFormData({
        id: "",
        subject: "",
        description: "",
        priority: "Normal",
        status: "Not started",
        dueDate: "",
        assignedTo: "",
        notes: "",
        relatedType1: "Lead",
        relatedType2: "Contact",
        relatedTo1: "",
        relatedTo2: "",
    });
  };

  const handleOpenModal = (task = null, isViewOnly = false) => {
    setSelectedTask(task);
    setViewMode(isViewOnly);
    
    if (task) {
      setFormData({
        id: task.id,
        subject: task.title || "",
        description: task.description || "",
        priority: task.priority || "Normal",
        status: task.status || "Not started",
        dueDate: toDateTimeInputValue(task.dueDate),
        assignedTo: task.assignedToId ? String(task.assignedToId) : "",
        notes: task.notes || "",
        
        relatedType1Text: task.relatedType1Text || "",
        relatedTo1Text: task.relatedTo1Text || "",
        relatedType2Text: task.relatedType2Text || "",
        relatedTo2Text: task.relatedTo2Text || "",
        // Populate from the mapping function
        relatedType1: task.relatedType1 || "",
        relatedTo1: task.relatedTo1 || "",
        relatedType2: task.relatedType2 || "",
        relatedTo2: task.relatedTo2 || "",        
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTask(null);
    setViewMode(false);
    resetForm();
  };

  const handleSaveTask = async (newTaskData) => { 
      const requestPayload = buildTaskPayload(newTaskData);
      
      try {
          if (selectedTask && !viewMode) {
              await api.put(`/tasks/${selectedTask.id}`, requestPayload);
              toast.success(`Task updated successfully.`);              
          } else {
              await api.post(`/tasks/create`, requestPayload);
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
          Are you sure you want to delete <span className="font-semibold">{task.title}</span>? 
        </>
      ),
      confirmLabel: "Delete Task",
      cancelLabel: "Cancel",
      variant: "danger",
      action: { type: "delete", targetId: task.id },
    });
  };

  const handleSelectAll = () => {
    if (displayTasks.every((t) => selectedIds.includes(t.id))) {
      setSelectedIds(selectedIds.filter((id) => !displayTasks.map((t) => t.id).includes(id)));
    } else {
      const newIds = displayTasks.map((t) => t.id);
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
      title: "Delete Tasks",
      message: (
        <span>
          Are you sure you want to delete{" "}
          <span className="font-semibold">{selectedIds.length}</span> selected
          tasks? This action cannot be undone.
        </span>
      ),
      confirmLabel: `Delete ${selectedIds.length} Task(s)`,
      cancelLabel: "Cancel",
      variant: "danger",
      action: {
        type: "bulk-delete",
        task_ids: selectedIds,
      },
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModalData?.action) {
      setConfirmModalData(null);
      return;
    }
    const { action } = confirmModalData;
    setConfirmProcessing(true);

    try {
      if (action.type === "delete") {
        await api.delete(`/tasks/${action.targetId}`);
        toast.success("Task deleted successfully.");
        await fetchTasks();
      } else if (action.type === "bulk-delete") {
        await api.delete("/tasks/admin/bulk-delete", {
          data: { task_ids: action.task_ids },
        });
        toast.success(`Successfully deleted ${action.task_ids.length} tasks`);
        setSelectedIds([]);
        await fetchTasks();
      } 
    } catch (error) {
      console.error("Task action failed:", error);
      toast.error("Failed to delete task.");
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

  // Pagination logic
  useEffect(() => { setCurrentPage(1); }, [search, filterStatus, filterPriority, view, itemsPerPage]);
  
  useEffect(() => {
    if (view === "list") {
      const maxPage = filteredTasks.length === 0 ? 1 : Math.ceil(filteredTasks.length / itemsPerPage);
      if (currentPage > maxPage) setCurrentPage(maxPage);
    }
  }, [filteredTasks.length, currentPage, view, itemsPerPage]);

  const displayTasks = useMemo(() => {
    if (view === "board") return filteredTasks;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTasks, currentPage, view, itemsPerPage]);

  const METRICS = useMemo(() => {
    const now = new Date();
    return [
      {
        title: "To Do",
        value: tasks.filter((t) => t.status === "Not started").length,
        icon: FiClock,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        title: "In Progress",
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
      case "Not started": return "bg-blue-50 hover:bg-blue-100 border-blue-200";
      case "In progress": return "bg-purple-50 hover:bg-purple-100 border-purple-200";
      case "Deferred": return "bg-orange-50 hover:bg-orange-100 border-orange-200";
      case "Completed": return "bg-green-50 hover:bg-green-100 border-green-200";
      default: return "bg-gray-50 hover:bg-gray-100 border-gray-100";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Not started": return "bg-blue-100 text-blue-700";
      case "In progress": return "bg-purple-100 text-purple-700";
      case "Deferred": return "bg-orange-100 text-orange-700";
      case "Completed": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-700";
      case "Normal": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen font-inter relative">
      {(loading || userLoading) && <LoadingSpinner message="Loading tasks..." />}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
      
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiActivity className="text-blue-600" /> Tasks Board
          </h1>
    
         <div className="flex justify-center lg:justify-end w-full sm:w-auto">
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base self-end sm:self-auto mt-2 lg:mt-0 cursor-pointer"
        >
          <FiPlus /> Create Task
        </button>
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 w-full break-words overflow-hidden lg:overflow-visible">
        {METRICS.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

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
            <option>Normal</option>
            <option>Low</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setView("board")}
          className={`px-4 py-2 rounded-full text-sm ${view === "board" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Board View
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`px-4 py-2 rounded-full text-sm ${view === "list" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          List View
        </button>
      </div>

      {/* Board View */}
      {!loading && !userLoading && view === "board" && (
        filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 rounded-md">
          {BOARD_COLUMNS.map((column) => {
            const columnTasks = displayTasks.filter((task) => task.status === column);
            return (
              <div key={column} className="bg-white p-4 shadow border border-gray-200 flex flex-col relative rounded-md">
                <div className="absolute top-0 left-0 w-full h-5 bg-secondary rounded-t-md" /> 
                <div className="flex items-center justify-between mb-3 pt-7">
                  <h3 className="font-medium text-gray-900">{column}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                    {columnTasks.length}
                  </span>
                </div>
                <div className={`space-y-3 ${columnTasks.length > 3 ? 'overflow-y-auto max-h-[480px] hide-scrollbar' : ''}`}>
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
                          <p className="text-xs text-gray-500 mt-1">Assigned To: {task.assignedToName}</p>
                          <p className="text-xs mt-1 text-gray-500">
                            Date: <span className={isTaskOverdue(task) ? "text-red-600" : "text-gray-600"}>{task.dateAssigned ? formatDateDisplay(task.dateAssigned) : "—"}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(task); }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task); }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-500">No tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        ) : (
          <div className="col-span-4 text-center py-10 text-gray-500 border border-dashed rounded-xl">No tasks found.</div>
        )
      )}

      {/* List View */}
      {!loading && !userLoading && view === "list" && (
        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 text-left">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600"
                      checked={
                        displayTasks.length > 0 &&
                        displayTasks.every((t) => selectedIds.includes(t.id))
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="py-3 px-4 font-medium">Task</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Priority</th>
                  <th className="py-3 px-4 font-medium">Assigned To</th>
                  <th className="py-3 px-4 font-medium">Date Assigned</th>
                  <th className="py-3 px-4 font-medium text-center w-24">
                    {selectedIds.length > 0 ? (
                      <button
                        onClick={handleBulkDelete}
                        className="text-red-600 hover:text-red-800 transition p-1 rounded-full hover:bg-red-50"
                        title={`Delete ${selectedIds.length} selected tasks`}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    ) : (
                      ""
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayTasks.length > 0 ? displayTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-blue-600"
                        checked={selectedIds.includes(task.id)}
                        onChange={() => handleCheckboxChange(task.id)}
                      />
                    </td>
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap font-medium" onClick={() => handleOpenModal(task, true)}>{task.title}</td>
                    <td className="py-3 px-4 whitespace-nowrap" onClick={() => handleOpenModal(task, true)}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeClass(task.status || "Not started")}`}>{task.status || "Not started"}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap" onClick={() => handleOpenModal(task, true)}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityBadgeClass(task.priority || "Low")}`}>{task.priority || "Low"}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap" onClick={() => handleOpenModal(task, true)}>{task.assignedToName || "Unassigned"}</td>
                    <td className={`py-3 px-4 text-gray-700 whitespace-nowrap ${isTaskOverdue(task) ? "text-red-600 font-medium" : ""}`} onClick={() => handleOpenModal(task, true)}>
                      {task.dateAssigned ? formatDateDisplay(task.dateAssigned) : "—"}
                    </td>
                    <td></td>
                  </tr>
                )) : <tr><td colSpan={7} className="text-center py-4 text-gray-500">No tasks found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !userLoading && view === "list" && (
        <PaginationControls
          className="mt-6"
          totalItems={filteredTasks.length}
          pageSize={itemsPerPage}
          currentPage={filteredTasks.length === 0 ? 0 : currentPage}
          onPrev={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          onNext={() => setCurrentPage((prev) => Math.min(prev + 1, Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage) || 1)))}
          onPageSizeChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 20, 30, 40, 50]}
          label="tasks"
        />
      )}

      {/* Task Modal - Passing updated form logic props */}
      <TaskModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        onEdit={() => setViewMode(false)} // <-- toggles to edit mode
        setFormData={setFormData}
        formData={formData}
          isEditing={!viewMode && Boolean(selectedTask)}
        viewMode={viewMode}
        users={users}
        currentUser={currentUser}
        onDelete={handleDeleteTask}
      />

      {confirmModalData && (
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
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, color, bgColor, onClick }) {
  return (
    <div
      className="flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300 cursor-default"
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

function ConfirmationModal({ open, title, message, confirmLabel, cancelLabel, variant, loading, onConfirm, onCancel }) {
  if (!open) return null;
  const confirmClasses = variant === "danger" ? "bg-red-500 hover:bg-red-600 border border-red-400" : "bg-tertiary hover:bg-secondary border border-tertiary";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{message}</p>
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
          <button type="button" onClick={onCancel} className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-70" disabled={loading}>{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className={`w-full sm:w-auto px-4 py-2 rounded-md text-white transition disabled:opacity-70 ${confirmClasses}`} disabled={loading}>{loading ? "Processing..." : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}