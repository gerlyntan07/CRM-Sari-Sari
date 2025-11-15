import React, { useState, useMemo, useEffect } from "react";
import {
  FiSearch,
  FiPlus,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiStar,
} from "react-icons/fi";
import { toast } from "react-toastify";
import CreateMeetingModal from "../components/CreateMeetingModal";
import AdminMeetingInfomation from "../components/AdminMeetingInfomation";
import PaginationControls from "../components/PaginationControls.jsx";

// --- DUMMY DATA ---
const DUMMY_MEETINGS = [
  {
    id: 1,
    priority: "HIGH",
    activity: "Enterprise ni Jesselle Toborow",
    description: "Discuss implementation timeline and pricing",
    relatedTo: "TechCorp Solutions - Enterprise Software Deals",
    dueDate: "Dec 12, 2024",
    assignedTo: "Lester Claro",
    status: "PENDING",
    completed: false,
  },
  {
    id: 2,
    priority: "MEDIUM",
    activity: "Q3 Budget Review",
    description: "Review departmental spend and forecast for Q4",
    relatedTo: "Finance Department",
    dueDate: "Oct 30, 2024",
    assignedTo: "Maria Sanchez",
    status: "IN PROGRESS",
    completed: false,
  },
  {
    id: 3,
    priority: "LOW",
    activity: "Team Standup (Daily)",
    description: "Daily synchronization meeting",
    relatedTo: "Project Falcon",
    dueDate: "Today",
    assignedTo: "John Doe",
    status: "DONE",
    completed: true,
  },
  {
    id: 4,
    priority: "HIGH",
    activity: "Client Onboarding Call",
    description: "First call with new client: Alpha Solutions",
    relatedTo: "Sales Leads",
    dueDate: "Nov 5, 2024",
    assignedTo: "Sarah Connor",
    status: "PENDING",
    completed: false,
  },
];

// --- HELPER FUNCTIONS ---
const normalizeStatus = (status) => (status ? status.toUpperCase() : "");

const formatStatusLabel = (status) => {
  if (!status) return "--";
  return status
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusBadgeClass = (status) => {
  switch (normalizeStatus(status)) {
    case "PENDING":
      return "bg-indigo-100 text-indigo-700";
    case "COMPLETED":
    case "DONE":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-gray-200 text-gray-700";
    case "IN PROGRESS":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getPriorityBadgeClass = (priority) => {
  switch (normalizeStatus(priority)) {
    case "HIGH":
      return "bg-red-100 text-red-700";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700";
    case "LOW":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const ITEMS_PER_PAGE = 10;

const INITIAL_FORM_STATE = {
  meetingTitle: "",
  location: "",
  duration: "30",
  meetingLink: "",
  agenda: "",
  dueDate: "",
  assignedTo: "",
  relatedType: "",
  relatedTo: "",
  priority: "Medium",
};

const AdminMeeting = () => {
  useEffect(() => {
    document.title = "Meetings | Sari-Sari CRM";
  }, []);

  const [meetings, setMeetings] = useState(DUMMY_MEETINGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Filter by Status");
  const [priorityFilter, setPriorityFilter] = useState("Filter by Priority");
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  const handleSearch = (event) => setSearchTerm(event.target.value);

  const filteredMeetings = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const normalizedStatusFilter = statusFilter.trim().toUpperCase();
    const normalizedPriorityFilter = priorityFilter.trim().toUpperCase();

    return meetings.filter((meeting) => {
      // Search across all visible table fields
      const searchFields = [
        meeting?.activity,
        meeting?.description,
        meeting?.relatedTo,
        meeting?.assignedTo,
        meeting?.dueDate,
        meeting?.priority ? formatStatusLabel(meeting.priority) : "",
        meeting?.status ? formatStatusLabel(meeting.status) : "",
      ];

      const matchesSearch =
        normalizedQuery === "" ||
        searchFields.some((field) => {
          if (field === null || field === undefined || field === "")
            return false;
          return field.toString().toLowerCase().includes(normalizedQuery);
        });

      const matchesStatus =
        normalizedStatusFilter === "FILTER BY STATUS" ||
        normalizeStatus(meeting.status || "PENDING") === normalizedStatusFilter;

      const matchesPriority =
        normalizedPriorityFilter === "FILTER BY PRIORITY" ||
        normalizeStatus(meeting.priority || "LOW") === normalizedPriorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [meetings, searchTerm, statusFilter, priorityFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMeetings.length / ITEMS_PER_PAGE) || 1
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredMeetings.length / ITEMS_PER_PAGE) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredMeetings.length]);

  const paginatedMeetings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMeetings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMeetings, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const closeModal = () => {
    setShowModal(false);
    setFormData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setCurrentMeetingId(null);
    setIsSubmitting(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target.id === "modalBackdrop") closeModal();
  };

  const handleOpenAddModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setCurrentMeetingId(null);
    setShowModal(true);
  };

  const handleEditClick = (meeting) => {
    setFormData({
      meetingTitle: meeting.activity || "",
      location: meeting.location || "",
      duration: meeting.duration || "30",
      meetingLink: meeting.meetingLink || "",
      agenda: meeting.description || "",
      dueDate: meeting.dueDate || "",
      assignedTo: meeting.assignedTo || "",
      relatedType: meeting.relatedType || "",
      relatedTo: meeting.relatedTo || "",
      priority: meeting.priority || "Medium",
    });
    setIsEditing(true);
    setCurrentMeetingId(meeting.id);
    setSelectedMeeting(null);
    setShowModal(true);
  };

  const handleDelete = (meeting) => {
    if (!meeting) return;
    const name = meeting.activity || "this meeting";
    setConfirmModalData({
      title: "Delete Meeting",
      message: (
        <span>
          Are you sure you want to permanently delete{" "}
          <span className="font-semibold">{name}</span>? This action cannot be
          undone.
        </span>
      ),
      confirmLabel: "Delete Meeting",
      cancelLabel: "Cancel",
      variant: "danger",
      action: {
        type: "delete",
        targetId: meeting.id,
        name,
      },
    });
  };

  const handleSubmit = (formDataFromModal) => {
    const trimmedTitle = formDataFromModal.meetingTitle.trim();
    if (!trimmedTitle) {
      toast.error("Meeting title is required.");
      return;
    }

    if (!formDataFromModal.dueDate) {
      toast.error("Due date is required.");
      return;
    }

    const payload = {
      activity: trimmedTitle,
      location: formDataFromModal.location?.trim() || null,
      duration: formDataFromModal.duration || null,
      meetingLink: formDataFromModal.meetingLink?.trim() || null,
      description: formDataFromModal.agenda?.trim() || null,
      dueDate: formDataFromModal.dueDate,
      assignedTo: formDataFromModal.assignedTo || null,
      relatedType: formDataFromModal.relatedType || null,
      relatedTo: formDataFromModal.relatedTo || null,
      priority: formDataFromModal.priority || "Medium",
      status: "PENDING",
    };

    const actionType = isEditing && currentMeetingId ? "update" : "create";
    const meetingName = trimmedTitle;

    setConfirmModalData({
      title: actionType === "create" ? "Confirm New Meeting" : "Confirm Update",
      message:
        actionType === "create" ? (
          <span>
            Are you sure you want to schedule{" "}
            <span className="font-semibold">{meetingName}</span>?
          </span>
        ) : (
          <span>
            Save changes to <span className="font-semibold">{meetingName}</span>
            ?
          </span>
        ),
      confirmLabel:
        actionType === "create" ? "Create Meeting" : "Update Meeting",
      cancelLabel: "Cancel",
      variant: "primary",
      action: {
        type: actionType,
        payload,
        targetId: currentMeetingId || null,
        name: meetingName,
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
        setIsSubmitting(true);
        // TODO: Replace with actual API call
        // await api.post(`/meetings/create`, payload);
        const newMeeting = {
          id: meetings.length + 1,
          ...payload,
          status: "PENDING",
          completed: false,
        };
        setMeetings((prev) => [newMeeting, ...prev]);
        toast.success(`Meeting "${name}" created successfully.`);
        closeModal();
      } else if (type === "update") {
        if (!targetId) {
          throw new Error("Missing meeting identifier for update.");
        }
        setIsSubmitting(true);
        // TODO: Replace with actual API call
        // await api.put(`/meetings/${targetId}`, payload);
        setMeetings((prev) =>
          prev.map((m) => (m.id === targetId ? { ...m, ...payload } : m))
        );
        toast.success(`Meeting "${name}" updated successfully.`);
        closeModal();
      } else if (type === "delete") {
        if (!targetId) {
          throw new Error("Missing meeting identifier for deletion.");
        }
        // TODO: Replace with actual API call
        // await api.delete(`/meetings/${targetId}`);
        setMeetings((prev) => prev.filter((m) => m.id !== targetId));
        toast.success(`Meeting "${name}" deleted successfully.`);
        if (selectedMeeting?.id === targetId) {
          setSelectedMeeting(null);
        }
      }
    } catch (err) {
      console.error(err);
      const defaultMessage =
        type === "create"
          ? "Failed to create meeting. Please review the details and try again."
          : type === "update"
          ? "Failed to update meeting. Please review the details and try again."
          : "Failed to delete meeting. Please try again.";
      const message = err.response?.data?.detail || defaultMessage;
      toast.error(message);
    } finally {
      if (type === "create" || type === "update") {
        setIsSubmitting(false);
      }
      setConfirmProcessing(false);
      setConfirmModalData(null);
    }
  };

  const handleCancelConfirm = () => {
    if (confirmProcessing) return;
    setConfirmModalData(null);
  };

  const total = meetings.length;
  const pending = meetings.filter((m) => m.status === "PENDING").length;
  const inProgress = meetings.filter((m) => m.status === "IN PROGRESS").length;
  const done = meetings.filter((m) => m.status === "DONE").length;
  const highPriority = meetings.filter((m) => m.priority === "HIGH").length;

  const metricCards = [
    {
      title: "Total",
      value: total,
      icon: FiCalendar,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
    },
    {
      title: "Pending",
      value: pending,
      icon: FiClock,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "In Progress",
      value: inProgress,
      icon: FiClock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Done",
      value: done,
      icon: FiCheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "High Priority",
      value: highPriority,
      icon: FiStar,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiCalendar className="mr-2 text-blue-600" />
          Meetings
        </h1>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base ml-auto sm:ml-0"
        >
          <FiPlus className="mr-2" /> Add Meeting
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {metricCards.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search meetings"
            value={searchTerm}
            onChange={handleSearch}
            className="focus:outline-none text-base w-full"
          />
        </div>
        <div className="w-full lg:w-auto flex flex-col lg:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full lg:w-40 focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="Filter by Status">Filter by Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full lg:w-40 focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="Filter by Priority">Filter by Priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
          <thead className="bg-gray-100 text-left text-gray-600 text-sm tracking-wide font-semibold">
            <tr>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Activity</th>
              <th className="py-3 px-4">Related</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Assigned</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeetings.length > 0 ? (
              paginatedMeetings.map((meeting) => (
                <tr
                  key={meeting.id}
                  className="hover:bg-gray-50 text-xs cursor-pointer"
                  onClick={() => {
                    // Force re-render by creating a new object reference
                    setSelectedMeeting({ ...meeting });
                  }}
                >
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(
                        meeting.priority || "LOW"
                      )}`}
                    >
                      {formatStatusLabel(meeting.priority || "LOW")}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <div>
                      <div className="font-medium text-blue-600 hover:underline break-all">
                        {meeting.activity}
                      </div>
                      <div className="text-gray-500 text-xs break-all">
                        {meeting.description || "--"}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div>
                      <div className="font-medium text-gray-800 text-xs leading-tight">
                        {meeting.relatedTo || "--"}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-gray-800 font-medium text-xs">
                    {meeting.dueDate || "--"}
                  </td>
                  <td className="py-2 px-4 text-gray-800 font-medium text-xs">
                    {meeting.assignedTo || "--"}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeClass(
                        meeting.status || "PENDING"
                      )}`}
                    >
                      {formatStatusLabel(meeting.status || "PENDING")}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={6}
                >
                  No meetings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        className="mt-4"
        totalItems={filteredMeetings.length}
        pageSize={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        label="meetings"
      />

      {/* Modal: Create/Edit Meeting */}
      {showModal && (
        <CreateMeetingModal
          onClose={closeModal}
          formData={formData}
          setFormData={setFormData}
          isEditing={isEditing}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting || confirmProcessing}
        />
      )}

      {/* Modal: Selected Meeting Info */}
      {selectedMeeting && (
        <AdminMeetingInfomation
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onEdit={handleEditClick}
          onDelete={handleDelete}
        />
      )}

      {/* Confirmation Modal */}
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
};

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

export default AdminMeeting;
