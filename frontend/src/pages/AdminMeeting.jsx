import React, { useState, useMemo, useEffect } from "react";
import {
  FiSearch,
  FiPlus,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import CreateMeetingModal from "../components/CreateMeetingModal";
import AdminMeetingInfomation from "../components/AdminMeetingInfomation";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";


// --- HELPER FUNCTIONS ---
const normalizeStatus = (status) => (status ? status.toUpperCase() : "");
const toAdminStatus = (status) => {
  const s = normalizeStatus(status);
  if (s === "PENDING" || s === "IN PROGRESS") return "PLANNED";
  if (s === "COMPLETED" || s === "DONE") return "HELD";
  if (s === "CANCELLED") return "NOT_HELD";
  return "PLANNED";
};
const toBackendStatus = (adminStatus) => {
  const s = normalizeStatus(adminStatus);
  if (s === "PLANNED") return "PENDING";
  if (s === "HELD") return "COMPLETED";
  if (s === "NOT_HELD") return "CANCELLED";
  return "PENDING";
};

const formatStatusLabel = (status) => {
  if (!status) return "--";
  return status
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusBadgeClass = (status) => {
  const s = normalizeStatus(status);
  const base = s === "PLANNED" ? "PENDING" : s === "HELD" ? "COMPLETED" : s === "NOT_HELD" ? "CANCELLED" : s;
  switch (base) {
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

const formatDateTime = (iso) => {
  if (!iso) return "--";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "--";
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
  subject: "",
  startTime: "",
  endTime: "",
  location: "",
  status: "PLANNED",
  notes: "",
  assignedTo: "",
  relatedType: "",
  relatedTo: "",
};

const AdminMeeting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const meetingIdFromQuery = searchParams.get('id');
  const isInfoRoute = location.pathname === '/admin/meetings/info';

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
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

 //----------------------------------------------------------------------------
  // AUTO-OPEN LOGIC HERE
  useEffect(() => {
  console.log("MEETING LOCATION STATE:", location.state);

  const shouldOpen = location.state?.openMeetingModal;

  // This is what you pass from another page as "initialMeetingData"
  const incomingId =
    location.state?.initialMeetingData?.relatedTo ||
    searchParams.get("id");

  if (shouldOpen || incomingId) {
    console.log("AUTO OPEN MEETING FORM");

    // OPEN THE MODAL
    setShowModal(true);

    // If redirected with pre-filled form data
    if (location.state?.initialMeetingData) {
      setFormData((prev) => ({
        ...prev,
        ...location.state.initialMeetingData,
      }));
    }

    // If pages send ?id=123
    if (incomingId) {
      setFormData((prev) => ({
        ...prev,
        relatedTo: incomingId,
      }));
    }

    // Clear route state to prevent reopening on refresh
    navigate(location.pathname, { replace: true, state: {} });
  }
}, [location, searchParams, navigate]);

  //----------------------------------------------------------------------

  // Fetch meetings from backend
  const fetchMeetings = async () => {
    // Check if we have data from sessionStorage (instant access from dashboard)
    if (meetingIdFromQuery && isInfoRoute) {
      const storedData = sessionStorage.getItem('meetingDetailData');
      if (storedData) {
        try {
          const meetingData = JSON.parse(storedData);
          if (meetingData.id === parseInt(meetingIdFromQuery)) {
            setSelectedMeeting(meetingData);
            sessionStorage.removeItem('meetingDetailData'); // Clean up
            return; // Don't fetch all meetings, use stored data
          }
        } catch (e) {
          console.error('Error parsing stored meeting data:', e);
        }
      }
    }
    
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
      
      // If there's a meeting ID in query params, find and select it
      if (meetingIdFromQuery && !selectedMeeting) {
        const meeting = sorted.find(m => m.id === parseInt(meetingIdFromQuery));
        if (meeting) {
          setSelectedMeeting(meeting);
        }
      }
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
    const normalizedPriorityFilter = "FILTER BY PRIORITY";

    return meetings.filter((meeting) => {
      // Search across all visible table fields
      const searchFields = [
        meeting?.activity,
        meeting?.description,
        meeting?.relatedTo,
        meeting?.assignedTo,
        meeting?.startTime,
        meeting?.endTime,
        toAdminStatus(meeting?.status)?.replace("_", " "),
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
        toAdminStatus(meeting.status || "PENDING") === normalizedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [meetings, searchTerm, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMeetings.length / ITEMS_PER_PAGE) || 1
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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

    // Derive related fields for edit form (supports Lead/Account/Contact/Deal)
    let relatedType = meeting.relatedType || "";
    const relatedToName = meeting.relatedTo || "";
    let relatedToId = "";
    // Additional UI fields for dependent selects
    let relatedType1 = "Lead";
    let relatedTo1 = "";
    let relatedType2 = null;
    let relatedTo2 = "";

    if (relatedType && relatedToName) {
      if (relatedType === "Account") {
        const account = accounts.find((acc) => acc.name === relatedToName);
        if (account?.id) {
          relatedToId = String(account.id);
          relatedType1 = "Account";
          relatedTo1 = String(account.id);
          relatedType2 = null;
          relatedTo2 = "";
        }
      } else if (relatedType === "Contact") {
        const contact = contacts.find(
          (c) =>
            `${c.first_name || ""} ${c.last_name || ""}`.trim() === relatedToName
        );
        if (contact?.id) {
          relatedToId = String(contact.id);
          relatedType1 = "Account";
          relatedTo1 = contact.account_id ? String(contact.account_id) : "";
          relatedType2 = "Contact";
          relatedTo2 = String(contact.id);
        }
      } else if (relatedType === "Lead") {
        // Prefer title match; fallback to full name
        let lead = leads.find((l) => (l.title || "").trim() === relatedToName);
        if (!lead) {
          lead = leads.find(
            (l) =>
              `${l.first_name || ""} ${l.last_name || ""}`.trim() ===
              relatedToName
          );
        }
        if (lead?.id) {
          relatedToId = String(lead.id);
          relatedType1 = "Lead";
          relatedTo1 = String(lead.id);
          relatedType2 = null;
          relatedTo2 = "";
        }
      } else if (relatedType === "Deal") {
        const deal = deals.find((d) => d.name === relatedToName);
        if (deal?.id) {
          relatedToId = String(deal.id);
          relatedType1 = "Account";
          relatedTo1 = deal.account_id ? String(deal.account_id) : "";
          relatedType2 = "Deal";
          relatedTo2 = String(deal.id);
        }
      }
    }
    // If nothing matched, clear to avoid broken state
    if (!relatedToId) {
      relatedType = "";
      relatedType1 = "Lead";
      relatedTo1 = "";
      relatedType2 = null;
      relatedTo2 = "";
    }

    const toLocalInput = (iso) => {
      if (!iso) return "";
      try {
        const d = new Date(iso);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
      } catch {
        return "";
      }
    };
    const startTime = toLocalInput(meeting.startTime);
    const endTime = toLocalInput(meeting.endTime);

    const statusMap = {
      PENDING: "PLANNED",
      "IN PROGRESS": "PLANNED",
      DONE: "HELD",
      COMPLETED: "HELD",
      CANCELLED: "NOT_HELD",
    };

    setFormData({
      subject: meeting.activity || "",
      location: meeting.location || "",
      startTime,
      endTime,
      status: statusMap[(meeting.status || "PENDING").toUpperCase()] || "PLANNED",
      notes: meeting.description || "",
      assignedTo: assignedToId,
      relatedType: relatedType,
      relatedTo: relatedToId,
      relatedType1,
      relatedTo1,
      relatedType2,
      relatedTo2,
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

      toast.success(`Meeting status updated to ${toAdminStatus(newStatus).replace("_", " ")}`);

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
    const trimmedSubject = (formDataFromModal.subject || "").trim();
    if (!trimmedSubject) {
      toast.error("Subject is required.");
      return;
    }

    if (!formDataFromModal.startTime) {
      toast.error("Start time is required.");
      return;
    }

    let duration = null;
    if (formDataFromModal.endTime) {
      const start = new Date(formDataFromModal.startTime);
      const end = new Date(formDataFromModal.endTime);
      const diffMs = end.getTime() - start.getTime();
      if (diffMs > 0) {
        duration = Math.round(diffMs / 60000);
      } else {
        toast.error("End time must be after start time.");
        return;
      }
    }

    let assignedToId = null;
    if (formDataFromModal.assignedTo && formDataFromModal.assignedTo.trim()) {
      const parsed = parseInt(formDataFromModal.assignedTo, 10);
      if (!isNaN(parsed)) {
        assignedToId = parsed;
      }
    }

    let relatedToId = null;
    if (formDataFromModal.relatedTo && formDataFromModal.relatedTo.trim()) {
      const parsed = parseInt(formDataFromModal.relatedTo, 10);
      if (!isNaN(parsed)) {
        relatedToId = parsed;
      }
    }

    const finalRelatedType = formDataFromModal.relatedType && relatedToId ? formDataFromModal.relatedType : null;

    const statusMapToBackend = {
      PLANNED: "PENDING",
      HELD: "COMPLETED",
      NOT_HELD: "CANCELLED",
    };

    const payload = {
      subject: trimmedSubject,
      location: formDataFromModal.location?.trim() || null,
      duration,
      meeting_link: null,
      agenda: formDataFromModal.notes?.trim() || null,
      due_date: formDataFromModal.startTime,
      assigned_to: assignedToId,
      related_type: finalRelatedType,
      related_to: relatedToId,
      status: statusMapToBackend[(formDataFromModal.status || "PLANNED").toUpperCase().replace(" ", "_")] || "PENDING",
    };

    const actionType = isEditing && currentMeetingId ? "update" : "create";
    const meetingName = trimmedSubject;

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
  const planned = meetings.filter((m) => {
    const s = (m.status || "").toUpperCase();
    return s === "PENDING" || s === "IN PROGRESS";
  }).length;
  const held = meetings.filter((m) => {
    const s = (m.status || "").toUpperCase();
    return s === "COMPLETED" || s === "DONE";
  }).length;
  const notHeld = meetings.filter((m) => (m.status || "").toUpperCase() === "CANCELLED").length;

  const metricCards = [
    {
      title: "Total",
      value: total,
      icon: FiCalendar,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
    },
    {
      title: "Planned",
      value: planned,
      icon: FiClock,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Held",
      value: held,
      icon: FiCheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Not Held",
      value: notHeld,
      icon: FiXCircle,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
  ];

  // If accessed via /info route, only show detail modal
  if (isInfoRoute && meetingIdFromQuery) {
    if (!selectedMeeting) {
      return <LoadingSpinner message="Loading meeting..." />;
    }
    return (
      <AdminMeetingInfomation
        meeting={selectedMeeting}
        onClose={() => {
          setSelectedMeeting(null);
          navigate('/admin/dashboard');
        }}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        onStatusUpdate={handleStatusUpdate}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
      {meetingsLoading && !meetingIdFromQuery && <LoadingSpinner message="Loading meetings..." />}
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 w-full break-words overflow-hidden lg:overflow-visible">
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
            <option value="PLANNED">PLANNED</option>
            <option value="HELD">HELD</option>
            <option value="NOT_HELD">NOT HELD</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
          <thead className="bg-gray-100 text-left text-gray-600 text-sm tracking-wide font-semibold">
            <tr>
              <th className="py-3 px-4">Activity</th>
              <th className="py-3 px-4">Related</th>
              <th className="py-3 px-4">Start Time</th>
              <th className="py-3 px-4">End Time</th>
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
                    {formatDateTime(meeting.startTime)}
                  </td>
                  <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                    {formatDateTime(meeting.endTime)}
                  </td>
                  <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                    {meeting.assignedTo || "--"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeClass(
                        toAdminStatus(meeting.status || "PENDING")
                      )}`}
                    >
                      {toAdminStatus(meeting.status || "PENDING").replace("_", " ")}
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
          onClose={() => {
            setSelectedMeeting(null);
            // If accessed from dashboard via query param, navigate back
            if (meetingIdFromQuery) {
              navigate('/admin/dashboard');
            }
          }}
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
className="flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300"
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
