import React, { useState, useEffect, useMemo, useRef } from "react";
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
  FiUser,
} from "react-icons/fi";
import TaskModal from "../components/TaskModal";
import PaginationControls from "../components/PaginationControls.jsx";
import api from "../api";
import { toast } from "react-toastify";
import useFetchUser from "../hooks/useFetchUser";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const BOARD_COLUMNS = ["To Do", "In Progress", "Review", "Completed"];
const LIST_PAGE_SIZE = 10;

// Mock Data
const MOCK_USERS = [
  { id: 1, first_name: "John", last_name: "Doe", email: "john.doe@example.com" },
  { id: 2, first_name: "Jane", last_name: "Smith", email: "jane.smith@example.com" },
  { id: 3, first_name: "Mike", last_name: "Johnson", email: "mike.johnson@example.com" },
  { id: 4, first_name: "Sarah", last_name: "Williams", email: "sarah.williams@example.com" },
];

const MOCK_TASKS = [
  {
    id: 1,
    title: "Follow up with TechStart Inc",
    description: "Schedule a meeting to discuss the new product proposal",
    type: "Call",
    priority: "High",
    status: "To Do",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    dateAssigned: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignedToId: 1,
    assignedToName: "John Doe",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 1,
    createdBy: "Admin User",
    relatedTo: "TechStart Inc",
    notes: "Important client, need to follow up soon",
    isPersonal: false,
  },
  {
    id: 2,
    title: "Review Q4 Sales Report",
    description: "Analyze the quarterly sales data and prepare summary",
    type: "Task",
    priority: "Medium",
    status: "In Progress",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    dateAssigned: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignedToId: 2,
    assignedToName: "Jane Smith",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 1,
    createdBy: "Admin User",
    relatedTo: "Q4 Report",
    notes: "Due by end of week",
    isPersonal: false,
  },
  {
    id: 3,
    title: "Update CRM Database",
    description: "Sync customer information and update contact details",
    type: "Task",
    priority: "Low",
    status: "Review",
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    dateAssigned: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignedToId: 3,
    assignedToName: "Mike Johnson",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 1,
    createdBy: "Admin User",
    relatedTo: "CRM System",
    notes: "Overdue task",
    isPersonal: false,
  },
  {
    id: 4,
    title: "Client Meeting Preparation",
    description: "Prepare presentation materials for upcoming client meeting",
    type: "Meeting",
    priority: "High",
    status: "Completed",
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dateAssigned: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    assignedToId: 4,
    assignedToName: "Sarah Williams",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 1,
    createdBy: "Admin User",
    relatedTo: "Client ABC",
    notes: "Completed successfully",
    isPersonal: false,
  },
  {
    id: 5,
    title: "Send Proposal to New Client",
    description: "Draft and send proposal document to potential new client",
    type: "Email",
    priority: "Medium",
    status: "To Do",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    dateAssigned: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignedToId: 1,
    assignedToName: "John Doe",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 1,
    createdBy: "Admin User",
    relatedTo: "New Client XYZ",
    notes: "",
    isPersonal: false,
  },
  {
    id: 6,
    title: "Team Standup Meeting",
    description: "Daily team synchronization meeting",
    type: "Meeting",
    priority: "Low",
    status: "In Progress",
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    dateAssigned: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignedToId: 2,
    assignedToName: "Jane Smith",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 1,
    createdBy: "Admin User",
    relatedTo: "Team",
    notes: "Recurring meeting",
    isPersonal: false,
  },
  {
    id: 7,
    title: "Update Marketing Materials",
    description: "Refresh marketing collateral with new branding",
    type: "Task",
    priority: "Medium",
    status: "Review",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    dateAssigned: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    assignedToId: 3,
    assignedToName: "Mike Johnson",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 1,
    createdBy: "Admin User",
    relatedTo: "Marketing",
    notes: "Waiting for approval",
    isPersonal: false,
  },
  {
    id: 8,
    title: "Customer Feedback Analysis",
    description: "Review and analyze customer feedback from Q4",
    type: "Task",
    priority: "High",
    status: "Completed",
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dateAssigned: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    assignedToId: 4,
    assignedToName: "Sarah Williams",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 1,
    createdBy: "Admin User",
    relatedTo: "Customer Feedback",
    notes: "Analysis complete",
    isPersonal: false,
  },
  {
    id: 9,
    title: "Prepare Budget Report",
    description: "Compile monthly budget report for management review",
    type: "Task",
    priority: "High",
    status: "To Do",
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    dateAssigned: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignedToId: 1,
    assignedToName: "John Doe",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 1,
    createdBy: "Admin User",
    relatedTo: "Finance",
    notes: "Urgent",
    isPersonal: false,
  },
  {
    id: 10,
    title: "Website Content Update",
    description: "Update website content with latest product information",
    type: "Task",
    priority: "Low",
    status: "In Progress",
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    dateAssigned: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    assignedToId: 2,
    assignedToName: "Jane Smith",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 1,
    createdBy: "Admin User",
    relatedTo: "Website",
    notes: "In progress",
    isPersonal: false,
  },
];

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
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    relatedTo: 0,
    priority: "",
    status: "",
    dueDate: "",
    assignedTo: "",
  });

  useEffect(() => {
    if (!userLoading) {
      // Use mock data for frontend development
      // Backend API calls are kept below for future use
      loadMockData();
      // fetchUsers();
      // fetchTasks();
    }
  }, [userLoading]);

  // Load mock data for frontend development
  const loadMockData = () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setUsers(MOCK_USERS);
      setTasks(MOCK_TASKS);
      setLoading(false);
    }, 500);
  };

  // Backend API functions - kept for future use
  // const fetchTasks = async () => {
  //   try {
  //     setLoading(true);
  //     const res = await api.get("/tasks/all");
  //     const formatted = (Array.isArray(res.data) ? res.data : []).map(
  //       (task) => ({
  //         id: task.id,
  //         title: task.title,
  //         description: task.description,
  //         type: task.type,
  //         priority: task.priority,
  //         status: task.status,
  //         dueDate: task.dueDate || task.due_date || null,
  //         dateAssigned: task.dateAssigned || task.date_assigned || null,
  //         assignedToId: task.assignedToId ?? task.assigned_to ?? null,
  //         assignedToName:
  //           task.assignedToName ||
  //           task.assignedTo ||
  //           (task.assigned_to ? String(task.assigned_to) : "Unassigned"),
  //         createdAt: task.createdAt || null,
  //         createdById: task.createdById ?? null,
  //         createdBy: task.createdBy ?? null,
  //         relatedTo: task.relatedTo || "",
  //         notes: task.notes || "",
  //         isPersonal: Boolean(task.isPersonal),
  //       })
  //     );

  //     formatted.sort((a, b) => {
  //       const aDate = a.createdAt ? new Date(a.createdAt) : 0;
  //       const bDate = b.createdAt ? new Date(b.createdAt) : 0;
  //       return bDate - aDate;
  //     });
  //     setTasks(formatted);
  //     if (view === "list") {
  //       setCurrentPage(1);
  //     }
  //   } catch (error) {
  //     console.error("Failed to load tasks:", error);
  //     toast.error("Failed to load tasks. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const fetchUsers = async () => {
  //   try {
  //     const res = await api.get("/users/all");
  //     setUsers(Array.isArray(res.data) ? res.data : []);
  //   } catch (error) {
  //     console.error("Failed to fetch users:", error);
  //     toast.error("Failed to fetch users. Please refresh and try again.");
  //   }
  // };

  const resetForm = () => {
    setFormData({
      title: "",
    description: "",
    type: "",
    relatedTo: 0,
    priority: "",
    status: "",
    dueDate: "",
    assignedTo: "",
    });
  };

  const handleOpenModal = (task = null, isViewOnly = false) => {
    setSelectedTask(task);
    setViewMode(isViewOnly);
    // if (task) {
    //   setFormData({
    //     title: task.title || "",
    //     description: task.description || "",
    //     type: task.type || "Call",
    //     priority: task.priority || "Low",
    //     status: task.status || "To Do",
    //     dueDate: toDateTimeInputValue(task.dueDate),
    //     assignedTo: task.assignedToId ? String(task.assignedToId) : "",
    //     relatedTo: task.relatedTo || "",
    //     notes: task.notes || "",
    //     isPersonal: Boolean(task.isPersonal),
    //   });
    // } else {
    //   resetForm();
    // }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTask(null);
    setViewMode(false);
    resetForm();
  };

  const handleSaveTask = async(newTask, relatedTo) => {
    setFormData(newTask);    
    const newFormData = { 
      ...newTask, 
      type: relatedTo,
      assignedTo: parseInt(newTask.assignedTo),
      relatedTo: parseInt(newTask.relatedTo),
    };
    console.log('nd', newFormData);

    try{
      const res = await api.post(`/tasks/createtask`, newFormData);
      toast.success("Task saved successfully.");
      console.log('Task saved', res);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to save task:", error);
    }
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
      // Using mock data for frontend development
      // Backend API calls are kept below for future use
      
      if (type === "create") {
        // Mock create - add to local state
        const newTask = {
          id: Date.now(), // Generate temporary ID
          title: payload.title || "",
          description: payload.description || "",
          type: payload.type || "Call",
          priority: payload.priority || "Low",
          status: payload.status || "To Do",
          dueDate: payload.dueDate || null,
          dateAssigned: new Date().toISOString(),
          assignedToId: payload.assignedTo ? Number(payload.assignedTo) : null,
          assignedToName: MOCK_USERS.find(u => String(u.id) === payload.assignedTo) 
            ? `${MOCK_USERS.find(u => String(u.id) === payload.assignedTo).first_name} ${MOCK_USERS.find(u => String(u.id) === payload.assignedTo).last_name}`
            : "Unassigned",
          createdAt: new Date().toISOString(),
          createdById: currentUser?.id || 1,
          createdBy: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : "Admin User",
          relatedTo: payload.relatedTo || "",
          notes: payload.notes || "",
          isPersonal: Boolean(payload.isPersonal),
        };
        setTasks(prev => [newTask, ...prev]);
        toast.success("Task created successfully.");
        handleCloseModal();
        
        // Backend API call (commented for now)
        // const requestPayload = buildTaskPayload(payload);
        // await api.post("/tasks/createtask", requestPayload);
        // await fetchTasks();
      } else if (type === "update") {
        if (!targetId) {
          throw new Error("Missing task identifier for update.");
        }
        // Mock update - update in local state
        setTasks(prev => prev.map(task => {
          if (task.id === targetId) {
            return {
              ...task,
              title: payload.title || task.title,
              description: payload.description || task.description,
              type: payload.type || task.type,
              priority: payload.priority || task.priority,
              status: payload.status || task.status,
              dueDate: payload.dueDate || task.dueDate,
              assignedToId: payload.assignedTo ? Number(payload.assignedTo) : task.assignedToId,
              assignedToName: payload.assignedTo 
                ? (MOCK_USERS.find(u => String(u.id) === payload.assignedTo) 
                  ? `${MOCK_USERS.find(u => String(u.id) === payload.assignedTo).first_name} ${MOCK_USERS.find(u => String(u.id) === payload.assignedTo).last_name}`
                  : "Unassigned")
                : task.assignedToName,
              relatedTo: payload.relatedTo || task.relatedTo,
              notes: payload.notes || task.notes,
              isPersonal: Boolean(payload.isPersonal),
            };
          }
          return task;
        }));
        toast.success("Task updated successfully.");
        handleCloseModal();
        
        // Backend API call (commented for now)
        // const requestPayload = buildTaskPayload(payload);
        // await api.put(`/tasks/${targetId}`, requestPayload);
        // await fetchTasks();
      } else if (type === "delete") {
        if (!targetId) {
          throw new Error("Missing task identifier for deletion.");
        }
        // Mock delete - remove from local state
        setTasks(prev => prev.filter(task => task.id !== targetId));
        toast.success(
          name ? `Task "${name}" deleted successfully.` : "Task deleted."
        );
        
        // Backend API call (commented for now)
        // await api.delete(`/tasks/${targetId}`);
        // await fetchTasks();
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
        filterStatus === "Filter by Status" || task.status === filterStatus;
      const matchesPriority =
        filterPriority === "Filter by Priority" || task.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, filterStatus, filterPriority]);

  // Pagination for list view only
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterPriority, view]);

  useEffect(() => {
    if (view === "list") {
      const maxPage =
        filteredTasks.length === 0
          ? 1
          : Math.ceil(filteredTasks.length / LIST_PAGE_SIZE);
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
      }
    }
  }, [filteredTasks.length, currentPage, view]);

  // Board view: show all tasks, List view: paginated
  const displayTasks = useMemo(() => {
    if (view === "board") {
      return filteredTasks;
    } else {
      const startIndex = (currentPage - 1) * LIST_PAGE_SIZE;
      return filteredTasks.slice(startIndex, startIndex + LIST_PAGE_SIZE);
    }
  }, [filteredTasks, currentPage, view]);

  const METRICS = useMemo(() => {
    const now = new Date();
    return [
      {
        title: "To Do",
        value: tasks.filter((t) => t.status === "To Do").length,
        icon: FiClock,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        title: "In Progress",
        value: tasks.filter((t) => t.status === "In Progress").length,
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
          (t) =>
            t.dueDate && new Date(t.dueDate) < now && t.status !== "Completed"
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
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "Completed";

  const getTaskCardColor = (task) => {
    // Use status-based colors matching list view badges
    switch (task.status) {
      case "To Do":
        return "bg-blue-50 hover:bg-blue-100 border-blue-200";
      case "In Progress":
        return "bg-purple-50 hover:bg-purple-100 border-purple-200";
      case "Review":
        return "bg-orange-50 hover:bg-orange-100 border-orange-200";
      case "Completed":
        return "bg-green-50 hover:bg-green-100 border-green-200";
      default:
        return "bg-gray-50 hover:bg-gray-100 border-gray-100";
    }
  };

  // Helper functions for list view badges
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "To Do":
        return "bg-blue-100 text-blue-700";
      case "In Progress":
        return "bg-purple-100 text-purple-700";
      case "Review":
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
      {loading && <LoadingSpinner message="Loading tasks..." />}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
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

      {loading && <p className="text-gray-500">Loading tasks...</p>}

      {/* Board View */}
      {!loading && view === "board" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 rounded-md">
          {BOARD_COLUMNS.map((column) => {
            const columnTasks = displayTasks.filter(
              (task) => task.status === column
            );
            
            return (
              <div
                key={column}
                className="bg-white p-4 shadow border border-gray-200 flex flex-col relative"
              >
                {/* Top horizontal line */}
                <div className="absolute top-0 left-0 w-full h-5 bg-secondary rounded-t-md" />

                <div className="flex items-center justify-between mb-3 pt-7">
                  <h3 className="font-medium text-gray-900">{column}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                    {columnTasks.length}
                  </span>
                </div>
                <div 
                  className={`space-y-3 ${columnTasks.length > 3 ? 'overflow-y-auto max-h-[480px] hide-scrollbar' : ''}`}
                >
                  {columnTasks.length > 0 ? (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`border rounded-lg p-3 transition flex justify-between items-start cursor-pointer ${getTaskCardColor(task)}`}
                        onClick={() => handleOpenModal(task, true)}
                      >
                        <div className="text-left flex-1">
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
        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 text-left">
                <tr>
                  <th className="py-3 px-4 font-medium">
                    Task
                  </th>
                  <th className="py-3 px-4 font-medium">
                    Status
                  </th>
                  <th className="py-3 px-4 font-medium">
                    Priority
                  </th>
                  <th className="py-3 px-4 font-medium">
                    Assigned To
                  </th>
                  <th className="py-3 px-4 font-medium">
                    Date Assigned
                  </th>
                  <th className="py-3 px-4 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
            <tbody>
              {displayTasks.length > 0 ? (
                displayTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                    onClick={() => handleOpenModal(task, true)}
                  >
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap font-medium">
                      {task.title}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeClass(
                          task.status || "To Do"
                        )}`}
                      >
                        {task.status || "To Do"}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityBadgeClass(
                          task.priority || "Low"
                        )}`}
                      >
                        {task.priority || "Low"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                      {task.assignedToName || "Unassigned"}
                    </td>
                    <td
                      className={`py-3 px-4 text-gray-700 whitespace-nowrap ${
                        isTaskOverdue(task) ? "text-red-600 font-medium" : ""
                      }`}
                    >
                      {task.dateAssigned
                        ? formatDateDisplay(task.dateAssigned)
                        : "—"}
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
                ))
              ) : (
                <tr>
                  <td
                    className="py-3 px-4 text-center text-sm text-gray-500"
                    colSpan={6}
                  >
                    No tasks found.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination for List View only */}
      {!loading && view === "list" && (
        <PaginationControls
          className="mt-6"
          totalItems={filteredTasks.length}
          pageSize={LIST_PAGE_SIZE}
          currentPage={filteredTasks.length === 0 ? 0 : currentPage}
          onPrev={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          onNext={() =>
            setCurrentPage((prev) =>
              Math.min(
                prev + 1,
                Math.max(1, Math.ceil(filteredTasks.length / LIST_PAGE_SIZE) || 1)
              )
            )
          }
          label="tasks"
        />
      )}

      {/* Task Modal */}
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
  bgColor = "bg-blue-100",
  onClick,
}) {
  const handleClick = () => {
    if (typeof onClick === "function") {
      onClick();
    } else {
      console.log(`Clicked: ${title}`);
    }
  };

  return (
    <div
      className="flex items-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all duration-300"
      onClick={handleClick}
    >
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
