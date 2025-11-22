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
import api from "../api";
import CreateMeetingModal from "../components/CreateMeetingModal";
import AdminMeetingInfomation from "../components/AdminMeetingInfomation";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";


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
  duration: "",
  meetingLink: "",
  agenda: "",
  dueDate: "",
  assignedTo: "",
  relatedType: "",
  relatedTo: "",
  priority: "Low",
};

const AdminMeeting = () => {
  useEffect(() => {
    document.title = "Meetings | Sari-Sari CRM";
  }, []);

  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
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

  // Fetch meetings from backend
  const fetchMeetings = async () => {
    setMeetingsLoading(true);
    try {
      const res = await api.get(`/meetings/admin/fetch-all`);
      const data = Array.isArray(res.data) ? res.data : [];
      // Sort by created_at descending (most recent first)
      const sorted = [...data].sort((a, b) => {
        const aDate = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
      setMeetings(sorted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load meetings.");
      setMeetings([]);
    } finally {
      setMeetingsLoading(false);
    }
  };

  // Fetch users for assignment dropdown
  const fetchUsers = async () => {
    try {
      const res = await api.get(`/users/all`);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.warn("Unable to load users for assignment (permission denied).");
      }
    }
  };

  // Fetch accounts for related to dropdown
  const fetchAccounts = async () => {
    try {
      const res = await api.get(`/accounts/admin/fetch-all`);
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.warn("Unable to load accounts (permission denied).");
      }
    }
  };

  // Fetch contacts for related to dropdown
  const fetchContacts = async () => {
    try {
      const res = await api.get(`/contacts/admin/fetch-all`);
      setContacts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.warn("Unable to load contacts (permission denied).");
      }
    }
  };

  // Fetch leads for related to dropdown
  const fetchLeads = async () => {
    try {
      const res = await api.get(`/leads/admin/getLeads`);
      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.warn("Unable to load leads (permission denied).");
      }
    }
  };

  // Fetch deals for related to dropdown
  const fetchDeals = async () => {
    try {
      const res = await api.get(`/deals/admin/fetch-all`);
      setDeals(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.warn("Unable to load deals (permission denied).");
      }
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
    fetchAccounts();
    fetchContacts();
    fetchLeads();
    fetchDeals();
  }, []);

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
    // Find user ID from assignedTo name
    let assignedToId = "";
    if (meeting.assignedTo) {
      const user = users.find(
        (u) => `${u.first_name} ${u.last_name}` === meeting.assignedTo
      );
      assignedToId = user?.id ? String(user.id) : "";
    }

    // Find related entity ID from relatedTo name
    let relatedToId = "";
    let relatedType = meeting.relatedType || "";
    
    if (meeting.relatedType && meeting.relatedTo) {
      const relatedToName = meeting.relatedTo;
      
      if (relatedType === "Account") {
        const account = accounts.find((acc) => acc.name === relatedToName);
        relatedToId = account?.id ? String(account.id) : "";
      } else if (relatedType === "Contact") {
        const contact = contacts.find(
          (c) => `${c.first_name || ""} ${c.last_name || ""}`.trim() === relatedToName
        );
        relatedToId = contact?.id ? String(contact.id) : "";
      } else if (relatedType === "Lead") {
        const lead = leads.find(
          (l) => `${l.first_name || ""} ${l.last_name || ""}`.trim() === relatedToName
        );
        relatedToId = lead?.id ? String(lead.id) : "";
      } else if (relatedType === "Deal") {
        const deal = deals.find((d) => d.name === relatedToName);
        relatedToId = deal?.id ? String(deal.id) : "";
      }
      
      // If we couldn't find the entity, reset relatedType to avoid errors
      if (!relatedToId) {
        relatedType = "";
      }
    }

    setFormData({
      meetingTitle: meeting.activity || "",
      location: meeting.location || "",
      duration: meeting.duration ? String(meeting.duration) : "",
      meetingLink: meeting.meetingLink || "",
      agenda: meeting.description || "",
      dueDate: meeting.dueDate || "",
      assignedTo: assignedToId,
      relatedType: relatedType,
      relatedTo: relatedToId,
      priority: meeting.priority || "Low",
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

  const handleStatusUpdate = async (meetingId, newStatus) => {
    if (!meetingId) return;

    try {
      // Update meeting status via API
      await api.put(`/meetings/${meetingId}`, {
        status: newStatus,
      });

      toast.success(`Meeting status updated to ${formatStatusLabel(newStatus)}`);

      // Update meeting in state without reloading
      setMeetings((prevMeetings) => {
        return prevMeetings.map((meeting) => {
          if (meeting.id === meetingId) {
            return {
              ...meeting,
              status: newStatus,
            };
          }
          return meeting;
        });
      });

      // Close the popup
      setSelectedMeeting(null);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.detail || "Failed to update meeting status. Please try again.";
      toast.error(message);
    }
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

    // Convert duration to integer
    let duration = null;
    if (formDataFromModal.duration && formDataFromModal.duration.trim()) {
      const parsed = parseInt(formDataFromModal.duration, 10);
      // Only set if it's a valid number (not NaN)
      if (!isNaN(parsed) && parsed > 0) {
        duration = parsed;
      }
    }

    // Convert assignedTo to integer (user ID)
    // Allow empty string to be converted to null (for clearing assignment)
    let assignedToId = null;
    if (formDataFromModal.assignedTo && formDataFromModal.assignedTo.trim()) {
      const parsed = parseInt(formDataFromModal.assignedTo, 10);
      // Only set if it's a valid number (not NaN)
      if (!isNaN(parsed)) {
        assignedToId = parsed;
      }
    }

    // Convert relatedTo to integer (entity ID)
    let relatedToId = null;
    if (formDataFromModal.relatedTo && formDataFromModal.relatedTo.trim()) {
      const parsed = parseInt(formDataFromModal.relatedTo, 10);
      // Only set if it's a valid number (not NaN)
      if (!isNaN(parsed)) {
        relatedToId = parsed;
      }
    }
    
    // If relatedType is provided but relatedTo is null, set relatedType to null too
    const finalRelatedType = (formDataFromModal.relatedType && relatedToId) ? formDataFromModal.relatedType : null;

    const payload = {
      subject: trimmedTitle,
      location: formDataFromModal.location?.trim() || null,
      duration: duration,
      meeting_link: formDataFromModal.meetingLink?.trim() || null,
      agenda: formDataFromModal.agenda?.trim() || null,
      due_date: formDataFromModal.dueDate,
      assigned_to: assignedToId,
      related_type: finalRelatedType,
      related_to: relatedToId,
      priority: formDataFromModal.priority || "Low",
      // Only set status for create, not for update (preserve existing status)
      ...(isEditing && currentMeetingId ? {} : { status: "PENDING" }),
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
        await api.post(`/meetings/create`, payload);
        toast.success(`Meeting "${name}" created successfully.`);
        closeModal();
        // Refresh meetings list
        await fetchMeetings();
      } else if (type === "update") {
        if (!targetId) {
          throw new Error("Missing meeting identifier for update.");
        }
        setIsSubmitting(true);
        await api.put(`/meetings/${targetId}`, payload);
        toast.success(`Meeting "${name}" updated successfully.`);
        closeModal();
        // Refresh meetings list
        await fetchMeetings();
      } else if (type === "delete") {
        if (!targetId) {
          throw new Error("Missing meeting identifier for deletion.");
        }
        await api.delete(`/meetings/${targetId}`);
        toast.success(`Meeting "${name}" deleted successfully.`);
        if (selectedMeeting?.id === targetId) {
          setSelectedMeeting(null);
        }
        // Refresh meetings list
        await fetchMeetings();
      }
    } catch (err) {
      console.error(err);
      console.error("Error details:", err.response?.data);
      console.error("Payload sent:", payload);
      const defaultMessage =
        type === "create"
          ? "Failed to create meeting. Please review the details and try again."
          : type === "update"
          ? "Failed to update meeting. Please review the details and try again."
          : "Failed to delete meeting. Please try again.";
      
      // Better error message handling for validation errors
      let message = defaultMessage;
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Pydantic validation errors come as an array
          const errors = err.response.data.detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
          message = `Validation error: ${errors}`;
        } else {
          message = err.response.data.detail;
        }
      }
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
  const done = meetings.filter((m) => m.status === "DONE" || m.status === "COMPLETED").length;
  const highPriority = meetings.filter((m) => normalizeStatus(m.priority) === "HIGH").length;

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
    <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
      {meetingsLoading && <LoadingSpinner message="Loading meetings..." />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiCalendar className="mr-2 text-blue-600" />
          Meetings
        </h1>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base ml-auto sm:ml-0 cursor-pointer"
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
                  className="hover:bg-gray-50 text-sm cursor-pointer"
                  onClick={() => {
                    // Force re-render by creating a new object reference
                    setSelectedMeeting({ ...meeting });
                  }}
                >
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(
                        meeting.priority || "LOW"
                      )}`}
                    >
                      {formatStatusLabel(meeting.priority || "LOW")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-blue-600 hover:underline break-all text-sm">
                        {meeting.activity}
                      </div>
                      <div className="text-gray-500 text-xs break-all">
                        {meeting.description || "--"}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-800 text-sm leading-tight">
                        {meeting.relatedTo || "--"}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                    {meeting.dueDate || "--"}
                  </td>
                  <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                    {meeting.assignedTo || "--"}
                  </td>
                  <td className="py-3 px-4">
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
          users={users}
          accounts={accounts}
          contacts={contacts}
          leads={leads}
          deals={deals}
        />
      )}

      {/* Modal: Selected Meeting Info */}
      {selectedMeeting && (
        <AdminMeetingInfomation
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          onStatusUpdate={handleStatusUpdate}
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
