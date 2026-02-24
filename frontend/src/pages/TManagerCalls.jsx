// frontend/src/pages/AdminCalls.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiPhoneCall,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiPhone,
  FiMail,
  FiCalendar,
  FiCheckSquare,
  FiEdit,
  FiArchive,
} from "react-icons/fi";
import { HiX } from "react-icons/hi";
import PaginationControls from "../components/PaginationControls.jsx";
import api from "../api.js";
import { toast } from "react-toastify";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import CommentSection from "../components/CommentSection.jsx";
import { useComments } from "../hooks/useComments.js";
import useFetchUser from "../hooks/useFetchUser.js";

// --- Constants (UI Options) ---
const PRIORITY_OPTIONS = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const ITEMS_PER_PAGE = 10;

// --- Helper Functions for UI Rendering ---
const STATUS_OPTIONS = [
  { value: "PLANNED", label: "PLANNED" },
  { value: "HELD", label: "HELD" },
  { value: "NOT_HELD", label: "NOT HELD" },
];

const normalizeStatus = (status) =>
  status ? String(status).toUpperCase() : "";

const toAdminCallStatus = (status) => {
  const s = normalizeStatus(status);
  if (s === "PLANNED" || s === "PENDING") return "PLANNED";
  if (s === "HELD" || s === "COMPLETED") return "HELD";
  if (s === "NOT HELD" || s === "NOT_HELD" || s === "CANCELLED")
    return "NOT_HELD";
  return "PLANNED";
};

const formatAdminCallStatusLabel = (status) => {
  const key = toAdminCallStatus(status);
  if (key === "PLANNED") return "PLANNED";
  if (key === "HELD") return "HELD";
  if (key === "NOT_HELD") return "NOT HELD";
  return "--";
};

const getCallStatusBadgeClass = (status) => {
  const key = toAdminCallStatus(status);
  switch (key) {
    case "PLANNED":
      return "bg-indigo-100 text-indigo-700";
    case "HELD":
      return "bg-green-100 text-green-700";
    case "NOT_HELD":
      return "bg-gray-200 text-gray-700";
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

const formattedDateTime = (datetime) => {
  if (!datetime) return "--";
  return new Date(datetime).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

export default function AdminCalls() {
  // 1) State
  const [showModal, setShowModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [relatedTo1Values, setRelatedTo1Values] = useState(null);
  const [relatedTo2Values, setRelatedTo2Values] = useState(null);
  const [calls, setCalls] = useState([]);
  const [team, setTeam] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [statusSelection, setStatusSelection] = useState("PLANNED");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [callsLoading, setCallsLoading] = useState(false);
  const [pendingCallId, setPendingCallId] = useState(null);
  const [selectedCallIds, setSelectedCallIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { user: currentUser } = useFetchUser();

  const {
    comments: callComments,
    addComment: addCallComment,
    refresh: refreshCallComments,
  } = useComments({
    relatedType: "call",
    relatedId: selectedCall?.id,
  });

  useEffect(() => {
    if (selectedCall?.id) refreshCallComments();
  }, [selectedCall?.id, refreshCallComments]);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const formatQuoteId = (quoteId) => {
    if (!quoteId) return "";
    // Convert D25-1-00001 to D25-00001 (remove middle company ID)
    const parts = String(quoteId).split("-");
    if (parts.length === 3) {
      return `${parts[0]}-${parts[2]}`;
    }
    return String(quoteId);
  };

  const getDefaultCallTime = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const date = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}T08:00`;
  };

  // Form State
  const INITIAL_FORM_STATE = {
    subject: "",
    call_time: getDefaultCallTime(),
    duration_minutes: "",
    direction: "Outgoing",
    status: "Planned",
    notes: "",
    relatedType1: "Lead",
    relatedType2: null,
    relatedTo1: null,
    relatedTo2: null,
    assigned_to: null,
  };
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // ✅ Auto open modal if passed via state or query
  useEffect(() => {
    const state = location.state;
    const callIdFromState = state?.callID;

    // Handle case where only callID is passed (e.g., from AdminAccounts related activities)
    if (callIdFromState && !state?.openCallModal) {
      setPendingCallId(callIdFromState);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    // Handle case where openCallModal is passed with initialCallData
    if (!state?.openCallModal || !state?.initialCallData) return;

    // Wait until related options are loaded
    if (
      state.initialCallData.relatedType1 === "Lead" &&
      Array.isArray(relatedTo1Values) &&
      relatedTo1Values.length === 0
    )
      return;

    if (
      state.initialCallData.relatedType1 === "Account" &&
      (!Array.isArray(relatedTo1Values) || relatedTo1Values.length === 0)
    )
      return;

    setShowModal(true);

    setFormData((prev) => ({
      ...prev,
      ...state.initialCallData,
      relatedTo1: state.initialCallData.relatedTo1
        ? String(state.initialCallData.relatedTo1)
        : "",
      relatedTo2: state.initialCallData.relatedTo2
        ? String(state.initialCallData.relatedTo2)
        : "",
    }));

    // cleanup
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, relatedTo1Values]);

  useEffect(() => {
    if (pendingCallId && calls.length > 0 && !callsLoading) {
      const foundCall = calls.find((call) => call.id === pendingCallId);
      if (foundCall) {
        setSelectedCall(foundCall);
      } else {
        toast.error("Call not found.");
      }
      setPendingCallId(null); // Clear pending call ID
    }
  }, [pendingCallId, calls, callsLoading]);

  const fetchCalls = async () => {
    try {
      setCallsLoading(true);

      const res = await api.get("/calls/admin/fetch-all");
      const data = Array.isArray(res.data) ? res.data : [];

      const sortedData = [...data].sort((a, b) => {
        const dateA = a?.created_at ? new Date(a.created_at) : 0;
        const dateB = b?.created_at ? new Date(b.created_at) : 0;
        return dateB - dateA;
      });

      setCalls(sortedData);
    } catch (err) {
      console.error("Error fetching calls:", err);
      toast.error("Failed to load calls");
    } finally {
      setCallsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/users/all`);
      setTeam(res.data);
    } catch (err) {
      console.error(`Error fetching users: `, err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCalls();
  }, []);

  // Filter & Pagination Logic
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Filter by Status");
  const [userFilter, setUserFilter] = useState("Filter by Users");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const users = Array.isArray(team)
    ? team.map((u) => ({ id: u.id, name: `${u.first_name} ${u.last_name}` }))
    : [];

  // Filter out INACTIVE calls for non-admin roles (archived calls)
  // Admins (CEO, ADMIN) can see all calls including archived
  const nonAdminRoles = ["GROUP MANAGER", "MANAGER", "SALES"];
  const baseFilteredCalls = nonAdminRoles.includes(currentUser?.role?.toUpperCase())
    ? calls.filter((c) => c.status !== "INACTIVE")
    : calls;

  const filteredCalls = useMemo(() => {
    return baseFilteredCalls.filter((call) => {
      const matchesSearch =
        !searchTerm ||
        [
          call.subject,
          call.notes,
          call.lead?.title,
          call.account?.name,
          call.contact?.first_name,
          call.contact?.last_name,
          call.deal?.name,
        ].some(
          (field) =>
            field &&
            String(field).toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const matchesStatus =
        statusFilter === "Filter by Status" ||
        toAdminCallStatus(call.status) === statusFilter;

      const assignedName = call.call_assign_to
        ? `${call.call_assign_to.first_name} ${call.call_assign_to.last_name}`
        : "";
      const matchesUser =
        userFilter === "Filter by Users" || assignedName === userFilter;

      return matchesSearch && matchesStatus && matchesUser;
    });
  }, [baseFilteredCalls, searchTerm, statusFilter, userFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCalls.length / itemsPerPage) || 1,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, userFilter, itemsPerPage]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredCalls.length / itemsPerPage) || 1,
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredCalls.length, itemsPerPage]);

  const paginatedCalls = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCalls.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCalls, currentPage, itemsPerPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Metrics
  const totalCalls = baseFilteredCalls.length;
  const plannedCalls = baseFilteredCalls.filter(
    (c) => toAdminCallStatus(c.status) === "PLANNED",
  ).length;
  const heldCalls = baseFilteredCalls.filter(
    (c) => toAdminCallStatus(c.status) === "HELD",
  ).length;
  const notHeldCalls = baseFilteredCalls.filter(
    (c) => toAdminCallStatus(c.status) === "NOT_HELD",
  ).length;

  const metricCards = [
    {
      title: "Total",
      value: totalCalls,
      icon: FiPhoneCall,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
    },
    {
      title: "Planned",
      value: plannedCalls,
      icon: FiClock,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Held",
      value: heldCalls,
      icon: FiCheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Not Held",
      value: notHeldCalls,
      icon: FiXCircle,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
  ];

  const [activeTab, setActiveTab] = useState("Overview");

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "relatedType1") {
        updated.relatedTo1 = "";
        if (value === "Lead") {
          updated.relatedType2 = null;
          updated.relatedTo2 = null;
          setRelatedTo2Values([]);
        } else if (value === "Account") {
          updated.relatedType2 = "Contact";
        }
      }

      if (name === "relatedType2") {
        updated.relatedTo2 = "";
      }

      return updated;
    });
  };

  // Fetch RelatedTo1 options (Lead / Account)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setRelatedTo1Values([]);

        let res;
        if (formData.relatedType1 === "Lead") {
          res = await api.get(`/leads/admin/getLeads`);
        } else if (formData.relatedType1 === "Account") {
          res = await api.get(`/accounts/admin/fetch-all`);
        }

        let items = [];
        if (res && Array.isArray(res.data)) items = res.data;
        else items = [];

        // If in edit mode and have a selected value, fetch that specific item
        if (isEditing && formData.relatedTo1) {
          try {
            let specificRes;
            if (formData.relatedType1 === "Lead") {
              specificRes = await api.get(`/leads/get/${formData.relatedTo1}`);
            } else if (formData.relatedType1 === "Account") {
              specificRes = await api.get(
                `/accounts/get/${formData.relatedTo1}`,
              );
            }

            if (specificRes && specificRes.data) {
              // Check if item already exists in list (by id)
              const exists = items.some(
                (item) => String(item.id) === String(formData.relatedTo1),
              );
              if (!exists) {
                items = [specificRes.data, ...items];
              }
            }
          } catch (err) {
            console.error("Error fetching specific related item:", err);
          }
        }

        setRelatedTo1Values(items);
      } catch (error) {
        console.error("Error fetching data:", error);
        setRelatedTo1Values([]);
      }
    };

    if (formData.relatedType1) fetchData();
  }, [formData.relatedType1, isEditing, formData.relatedTo1]);

  // Fetch RelatedTo2 options (Contact / Deal from Account)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setRelatedTo2Values([]);

        let res;
        if (formData.relatedType1 === "Account" && formData.relatedTo1) {
          if (formData.relatedType2 === "Contact") {
            res = await api.get(`/contacts/from-acc/${formData.relatedTo1}`);
          } else if (formData.relatedType2 === "Deal") {
            res = await api.get(`/deals/from-acc/${formData.relatedTo1}`);
          } else if (formData.relatedType2 === "Quote") {
            res = await api.get(`/quotes/from-acc/${formData.relatedTo1}`);
          }
        } else {
          setRelatedTo2Values([]);
          return;
        }

        let items = [];
        if (res && Array.isArray(res.data)) items = res.data;
        else items = [];

        // If in edit mode and have a selected value, fetch that specific item
        if (isEditing && formData.relatedTo2) {
          try {
            let specificRes;
            if (formData.relatedType2 === "Contact") {
              specificRes = await api.get(
                `/contacts/get/${formData.relatedTo2}`,
              );
            } else if (formData.relatedType2 === "Deal") {
              specificRes = await api.get(`/deals/get/${formData.relatedTo2}`);
            } else if (formData.relatedType2 === "Quote") {
              specificRes = await api.get(`/quotes/get/${formData.relatedTo2}`);
            }

            if (specificRes && specificRes.data) {
              // Check if item already exists in list (by id)
              const exists = items.some(
                (item) => String(item.id) === String(formData.relatedTo2),
              );
              if (!exists) {
                items = [specificRes.data, ...items];
              }
            }
          } catch (err) {
            console.error("Error fetching specific related item:", err);
          }
        }

        setRelatedTo2Values(items);
      } catch (error) {
        console.error("Error fetching data:", error);
        setRelatedTo2Values([]);
      }
    };

    if (formData.relatedType2) fetchData();
  }, [
    formData.relatedType2,
    formData.relatedTo1,
    formData.relatedType1,
    isEditing,
    formData.relatedTo2,
  ]);

  //validation
  const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    const subject = formData.subject;
    if (!subject || subject.trim() === "") {
      toast.error("Subject is required.");
      return;
    }

    const relatedTo1 = formData.relatedTo1;
    if (!relatedTo1) {
      toast.error(
        `Please select a ${formData.relatedType1 || "Lead/Account"}.`,
      );
      return;
    }

    if (!formData.assigned_to) {
      toast.error("Subject is required.");
      return;
    }

    const payload = {
      ...formData,
      duration_minutes: formData.duration_minutes
        ? parseInt(formData.duration_minutes, 10)
        : null,
      relatedTo1: formData.relatedTo1
        ? parseInt(formData.relatedTo1, 10)
        : null,
      relatedTo2:
        formData.relatedType1 === "Lead"
          ? null
          : formData.relatedTo2
            ? parseInt(formData.relatedTo2, 10)
            : null,
      relatedType2:
        formData.relatedType1 === "Lead" ? null : formData.relatedType2,
      assigned_to: formData.assigned_to
        ? parseInt(formData.assigned_to, 10)
        : null,
    };

    const actionType = isEditing && currentCallId ? "update" : "create";
    const name = (formData.subject || "").trim() || "Untitled Call";

    setConfirmModalData({
      title: actionType === "create" ? "Confirm New Call" : "Confirm Update",
      message:
        actionType === "create"
          ? `Create "${name}"?`
          : `Save changes to "${name}"?`,
      confirmLabel: actionType === "create" ? "Create Call" : "Update Call",
      cancelLabel: "Cancel",
      variant: "primary",
      action: {
        type: actionType,
        payload,
        targetId: currentCallId || null,
        name,
      },
    });
  };

  const handleCallClick = (call) => setSelectedCall(call);

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentCallId(null);
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
        await api.post(`/calls/create`, payload);
        toast.success(`Call "${name}" created successfully.`);
        setShowModal(false);
        setFormData(INITIAL_FORM_STATE);
        setIsEditing(false);
        setCurrentCallId(null);
        await fetchCalls();
      } else if (type === "update") {
        if (!targetId) throw new Error("Missing call identifier for update.");
        setIsSubmitting(true);
        await api.put(`/calls/${targetId}`, payload);
        toast.success(`Call "${name}" updated successfully.`);
        setShowModal(false);
        setFormData(INITIAL_FORM_STATE);
        setIsEditing(false);
        setCurrentCallId(null);
        await fetchCalls();
      } else if (type === "delete") {
        if (!targetId) throw new Error("Missing call identifier for archiving.");
        await api.put(`/calls/${targetId}`, { status: "INACTIVE" });
        toast.success(`Call "${name}" archived successfully.`);
        if (selectedCall?.id === targetId) setSelectedCall(null);
        await fetchCalls();
      } else if (type === "bulk-delete") {
        const { targetIds, count } = action;
        if (!targetIds || targetIds.length === 0) {
          throw new Error("Missing call identifiers for bulk archiving.");
        }
        setBulkDeleting(true);
        await api.put(`/calls/bulk-archive`, {
          call_ids: targetIds,
        });
        toast.success(
          `${count} call${count !== 1 ? "s" : ""} archived successfully.`,
        );
        setSelectedCallIds(new Set());
        await fetchCalls();
        if (selectedCall && selectedCallIds.has(selectedCall.id)) {
          setSelectedCall(null);
        }
      }
    } catch (err) {
      const defaultMessage =
        type === "create"
          ? "Failed to create call. Please review the details and try again."
          : type === "update"
            ? "Failed to update call. Please review the details and try again."
            : type === "bulk-delete"
              ? "Failed to archive calls. Please try again."
              : "Failed to archive call. Please try again.";

      const message = err?.response?.data?.detail || defaultMessage;
      toast.error(message);
    } finally {
      if (type === "create" || type === "update") setIsSubmitting(false);
      if (type === "bulk-delete") setBulkDeleting(false);
      setConfirmProcessing(false);
      setConfirmModalData(null);
    }
  };

  const handleCancelConfirm = () => {
    if (confirmProcessing) return;
    setConfirmModalData(null);
  };

  const handleSelectCall = (callId) => {
    const call = paginatedCalls.find((c) => c.id === callId);
    if (call && call.call_creator?.id === currentUser?.id) {
      setSelectedCallIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(callId)) {
          newSet.delete(callId);
        } else {
          newSet.add(callId);
        }
        return newSet;
      });
    }
  };

  const handleSelectAllCalls = () => {
    const selectableCalls = paginatedCalls.filter(
      (c) => c.call_creator?.id === currentUser?.id,
    );
    if (selectedCallIds.size === selectableCalls.length) {
      setSelectedCallIds(new Set());
    } else {
      setSelectedCallIds(new Set(selectableCalls.map((c) => c.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedCallIds.size === 0) return;

    const selectedCount = selectedCallIds.size;
    setConfirmModalData({
      title: "Archive Calls",
      message: (
        <span>
          Are you sure you want to archive{" "}
          <span className="font-semibold">{selectedCount}</span> call
          {selectedCount !== 1 ? "s" : ""}? You can restore them later if needed.
        </span>
      ),
      confirmLabel: `Archive ${selectedCount} Call${selectedCount !== 1 ? "s" : ""}`,
      cancelLabel: "Cancel",
      variant: "archive",
      action: {
        type: "bulk-delete",
        targetIds: Array.from(selectedCallIds),
        count: selectedCount,
      },
    });
  };

  const handleStatusUpdate = async () => {
    if (!selectedCall?.id) return;
    try {
      setUpdatingStatus(true);
      await api.put(`/calls/${selectedCall.id}`, { status: statusSelection });
      toast.success(
        `Status updated to ${formatAdminCallStatusLabel(statusSelection)}`,
      );
      setCalls((prev) =>
        Array.isArray(prev)
          ? prev.map((c) =>
              c.id === selectedCall.id ? { ...c, status: statusSelection } : c,
            )
          : prev,
      );
      setSelectedCall(null);
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to update status.";
      toast.error(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    if (selectedCall)
      setStatusSelection(toAdminCallStatus(selectedCall.status));
  }, [selectedCall]);

  // --- Detail View Modal ---
  const detailView = selectedCall ? (
    <div
      id="callModalBackdrop"
      onClick={(e) =>
        e.target.id === "callModalBackdrop" && setSelectedCall(null)
      }
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      {callsLoading && <LoadingSpinner message="Loading call details..." />}

      <div className="bg-white rounded-xl shadow-lg w-full max-w-full lg:max-w-4xl max-h-[95vh] overflow-y-auto hide-scrollbar relative box-border">
        <div className="bg-tertiary w-full rounded-t-xl p-3 lg:p-3 relative">
          <h1 className="lg:text-3xl text-xl text-white font-semibold text-center w-full">
            Calls
          </h1>
          <button
            onClick={() => setSelectedCall(null)}
            className="text-gray-500 hover:text-white transition cursor-pointer absolute top-3 right-3"
          >
            <HiX size={25} />
          </button>
        </div>

        <div className="mt-4 gap-2 px-2 lg:gap-4 lg:mx-7">
          <div className="flex flex-col md:flex-row md:justify-between lg:flex-row lg:items-center lg:justify-between mt-3 gap-2 px-2 md:items-center lg:gap-4 md:mx-7 lg:mx-7">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                {selectedCall.subject}
              </h1>
              <span
                className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full ${getCallStatusBadgeClass(
                  selectedCall.status,
                )}`}
              >
                {formatAdminCallStatusLabel(selectedCall.status)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
              {currentUser?.id === selectedCall.call_creator?.id && (
                <>
              <button
                className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => {
                  const toLocal = (iso) => {
                    if (!iso) return "";
                    const d = new Date(iso);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const dd = String(d.getDate()).padStart(2, "0");
                    const hh = String(d.getHours()).padStart(2, "0");
                    const min = String(d.getMinutes()).padStart(2, "0");
                    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
                  };

                  const relatedType1 = selectedCall.lead
                    ? "Lead"
                    : selectedCall.account
                      ? "Account"
                      : "Lead";

                  const relatedTo1 = selectedCall.lead
                    ? selectedCall.lead.id
                    : selectedCall.account
                      ? selectedCall.account.id
                      : null;

                  const relatedType2 =
                    relatedType1 === "Lead"
                      ? null
                      : selectedCall.contact
                        ? "Contact"
                        : selectedCall.deal
                          ? "Deal"
                          : selectedCall.quote
                            ? "Quote"
                            : "Contact";

                  const relatedTo2 =
                    relatedType1 === "Lead"
                      ? null
                      : selectedCall.contact
                        ? selectedCall.contact.id
                        : selectedCall.deal
                          ? selectedCall.deal.id
                          : selectedCall.quote
                            ? selectedCall.quote.id
                            : null;

                  setFormData({
                    subject: selectedCall.subject || "",
                    call_time: toLocal(selectedCall.call_time),
                    duration_minutes: selectedCall.duration_minutes
                      ? String(selectedCall.duration_minutes)
                      : "",
                    direction: selectedCall.direction || "Outgoing",
                    status: selectedCall.status || "Planned",
                    notes: selectedCall.notes || "",
                    relatedType1,
                    relatedType2,
                    relatedTo1: relatedTo1 ? String(relatedTo1) : "",
                    relatedTo2: relatedTo2 ? String(relatedTo2) : "",
                    assigned_to: selectedCall.call_assign_to?.id
                      ? String(selectedCall.call_assign_to.id)
                      : "",
                  });

                  setIsEditing(true);
                  setCurrentCallId(selectedCall.id);
                  setSelectedCall(null);
                  setShowModal(true);
                }}
              >
                <FiEdit className="mr-2" />
                Edit
              </button>

              <button
                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-orange-500 text-white hover:bg-orange-600 transition focus:outline-none focus:ring-2 focus:ring-orange-400"
                onClick={() => {
                  const name = selectedCall.subject || "this call";
                  setConfirmModalData({
                    title: "Archive Call",
                    message: `Are you sure you want to archive "${name}"? You can restore it later if needed.`,
                    confirmLabel: "Archive Call",
                    cancelLabel: "Cancel",
                    variant: "archive",
                    action: {
                      type: "delete",
                      targetId: selectedCall.id,
                      name,
                    },
                  });
                }}
              >
                <FiArchive className="mr-2" />
                Archive
              </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 my-5"></div>

        <div className="p-6 lg:p-4">
          <div className="flex w-full bg-[#6A727D] text-white mt-1 overflow-x-auto mb-6">
            {["Overview", "Notes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[90px] px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? "bg-paper-white text-[#6A727D] border-white"
                    : "text-white hover:bg-[#5c636d]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-3">
              {activeTab === "Overview" && (
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 text-sm text-gray-700">
                    <DetailRow
                      label="Call Time"
                      value={formattedDateTime(selectedCall.call_time)}
                    />
                    <DetailRow
                      label="Duration"
                      value={
                        selectedCall.duration_minutes
                          ? `${selectedCall.duration_minutes} min`
                          : null
                      }
                    />
                    <DetailRow
                      label="Direction"
                      value={selectedCall.direction || "--"}
                    />
                    <DetailRow
                      label="Assigned To"
                      value={`${selectedCall.call_assign_to.first_name} ${selectedCall.call_assign_to.last_name}`}
                    />

                    {selectedCall.lead && (
                      <DetailRow label="Lead" value={selectedCall.lead.title} />
                    )}
                    {selectedCall.account && (
                      <DetailRow
                        label="Account"
                        value={selectedCall.account.name}
                      />
                    )}
                    {selectedCall.contact && (
                      <DetailRow
                        label="Contact"
                        value={`${selectedCall.contact.first_name} ${selectedCall.contact.last_name}`}
                      />
                    )}
                    {selectedCall.deal && (
                      <DetailRow label="Deal" value={selectedCall.deal.name} />
                    )}
                    {selectedCall.quote && (
                      <DetailRow
                        label="Quote"
                        value={formatQuoteId(selectedCall.quote.quote_id)}
                      />
                    )}

                    <DetailRow
                      label="Created At"
                      value={formattedDateTime(selectedCall.created_at)}
                    />
                  </div>
                </div>
              )}

              {/* ------- Notes ------ */}
              {activeTab === "Notes" && (
                <div className="mt-4 w-full">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                    <h3 className="text-lg font-semibold text-gray-800 break-words">
                      Call Note
                    </h3>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm break-words">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800 break-words">
                          Note
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {selectedCall.notes || "No notes available."}
                    </div>
                  </div>

                  <CommentSection
                    comments={callComments}
                    onAddComment={addCallComment}
                  />
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm w-full">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                Status
              </h4>
              <select
                className="border border-gray-200 rounded-md px-2 py-1.5 w-full text-sm mb-2"
                value={statusSelection}
                onChange={(e) => setStatusSelection(e.target.value)}
              >
                <option value="PLANNED">PLANNED</option>
                <option value="HELD">HELD</option>
                <option value="NOT_HELD">NOT HELD</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={updatingStatus}
                className="w-full py-1.5 rounded-md text-sm bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {updatingStatus ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // --- Form Modal ---
  const formModal = showModal ? (
    <div
      id="modalBackdrop"
      onClick={(e) => e.target.id === "modalBackdrop" && handleCloseModal()}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh] hide-scrollbar">
        <button
          onClick={() => {
            handleCloseModal();
            setIsSubmitted(false);
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
        >
          <FiX size={22} />
        </button>

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
          {isEditing ? "Edit Call" : "Add New Call"}
        </h2>

        <form
          className="grid grid-cols-1 md:grid-cols-2 w-full gap-4 text-sm"
          onSubmit={handleSubmit}
          noValidate
        >
          <InputField
            label="Subject"
            className="md:col-span-2"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            isSubmitted={isSubmitted}
            required
          />

          {/* RELATED TYPE 1 + RELATED TO 1 */}
          <div className="w-full flex flex-col">
            <div className="relative w-25">
              <select
                name="relatedType1"
                onChange={handleInputChange}
                value={formData.relatedType1}
                className="outline-none cursor-pointer mb-1 w-22 text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <option value="Lead">Lead</option>
                <option value="Account">Account</option>
              </select>
              <span className="absolute left-10 md:pl-6 pl-6 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
                *
              </span>
            </div>

            <SearchableSelect
              items={Array.isArray(relatedTo1Values) ? relatedTo1Values : []}
              value={formData.relatedTo1 ?? ""}
              placeholder={`Search ${formData.relatedType1 || "here"}...`}
              getLabel={(item) =>
                formData.relatedType1 === "Lead"
                  ? item.title
                  : (item.name ?? "")
              }
              onChange={(newId) =>
                setFormData((prev) => ({
                  ...prev,
                  relatedTo1: newId, // keep string
                }))
              }
              required={true}
              isSubmitted={isSubmitted}
              disabled={isSubmitting}
            />
          </div>

          {/* ✅ RELATED TYPE 2 + SEARCHABLE RELATED TO 2 (CONTACT / DEAL) */}
          <div className="w-full flex flex-col">
            <select
              name="relatedType2"
              onChange={handleInputChange}
              value={formData.relatedType2 ?? "Contact"}
              className="text-gray-700 outline-none cursor-pointer mb-1 w-22 disabled:text-gray-400 disabled:cursor-not-allowed"
              disabled={formData.relatedType1 === "Lead" || isSubmitting}
            >
              <option value="Contact">Contact</option>
              <option value="Deal">Deal</option>
              <option value="Quote">Quote</option>
            </select>

            <SearchableSelect
              disabled={formData.relatedType1 === "Lead" || isSubmitting}
              items={Array.isArray(relatedTo2Values) ? relatedTo2Values : []}
              value={formData.relatedTo2 ?? ""}
              placeholder={
                formData.relatedType1 === "Lead"
                  ? ""
                  : Array.isArray(relatedTo2Values) &&
                      relatedTo2Values.length > 0
                    ? `Search ${formData.relatedType2 || "Contact"}...`
                    : `No ${formData.relatedType2 || ""} data found`
              }
              getLabel={(item) =>
                formData.relatedType2 === "Contact"
                  ? `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim()
                  : formData.relatedType2 === "Quote"
                    ? (formatQuoteId(item.quote_id) ?? "")
                    : (item.name ?? "")
              }
              onChange={(newId) =>
                setFormData((prev) => ({
                  ...prev,
                  relatedTo2: newId, // keep string
                }))
              }
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Call Time
            </label>
            <input
              type="datetime-local"
              value={formData.call_time}
              onChange={handleInputChange}
              name="call_time"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
            />
          </div>

          <div className="w-full">
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Duration
            </label>
            <div className="w-full rounded-md text-sm flex flex-row items-center justify-start">
              <input
                type="tel"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                name="duration_minutes"
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100 w-44 mr-3"
              />
              <p>minutes</p>
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Assign To <span className="text-red-600 font-semibold">*</span>
            </label>
            <SearchableSelect
              items={Array.isArray(team) ? team : []}
              value={formData.assigned_to ?? ""}
              placeholder={`Search an account...`}
              getLabel={(item) => `${item.first_name} ${item.last_name}`}
              onChange={(newId) =>
                setFormData((prev) => ({
                  ...prev,
                  assigned_to: newId, // keep string
                }))
              }
              required={true}
              isSubmitted={isSubmitted}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Direction
            </label>
            <select
              name="direction"
              onChange={handleInputChange}
              value={formData.direction}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
            >
              <option value="Incoming">Incoming</option>
              <option value="Outgoing">Outgoing</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Status
            </label>
            <select
              name="status"
              onChange={handleInputChange}
              value={formData.status}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
            >
              <option value="Planned">Planned</option>
              <option value="Held">Held</option>
              <option value="Not held">Not held</option>
            </select>
          </div>

          <TextAreaField
            className="col-span-2"
            label="Notes"
            value={formData.notes}
            onChange={handleInputChange}
            name="notes"
          />

          <div className="flex flex-col md:flex-row justify-end col-span-2 mt-4 gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                handleCloseModal(); // close the modal
                setIsSubmitted(false); // reset validation errors
              }}
              className="w-full sm:w-auto px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 text-white bg-tertiary border border-tertiary rounded hover:bg-secondary transition"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Update Call"
                  : "Save Call"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
            <FiPhoneCall className="mr-2 text-blue-600" /> Calls
          </h1>

          <div className="flex justify-center lg:justify-end w-full sm:w-auto">
            <button
              onClick={() => {
                setFormData(INITIAL_FORM_STATE);
                setIsEditing(false);
                setCurrentCallId(null);
                setShowModal(true);
                setIsSubmitted(false);
              }}
              className="flex items-center bg-black text-white px-3 sm:px-4 py-2 my-1 lg:my-0 rounded-md hover:bg-gray-800 text-sm sm:text-base mx-auto sm:ml-auto cursor-pointer"
            >
              <FiPlus className="mr-2" /> Add Call
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 w-full break-words overflow-hidden lg:overflow-visible">
          {metricCards.map((m) => (
            <MetricCard key={m.title} {...m} />
          ))}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center gap-3">
          <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500">
            <FiSearch size={20} className="text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search calls"
              className="focus:outline-none text-base w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row w-full lg:w-1/2 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 h-11 text-sm bg-white w-full"
            >
              <option value="Filter by Status">Filter by Status</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 h-11 text-sm bg-white w-full"
            >
              <option value="Filter by Users">Filter by Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm mb-4">
            <thead className="bg-gray-100 text-left text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedCallIds.size ===
                        paginatedCalls.filter(
                          (c) => c.call_creator?.id === currentUser?.id,
                        ).length &&
                      paginatedCalls.filter(
                        (c) => c.call_creator?.id === currentUser?.id,
                      ).length > 0
                    }
                    onChange={handleSelectAllCalls}
                    className="w-4 h-4 cursor-pointer rounded border-gray-300"
                  />
                </th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Related To</th>
                <th className="py-3 px-4">Call Time</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 w-12">
                  {selectedCallIds.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="text-orange-500 hover:text-orange-700 transition"
                      title="Archive selected calls"
                      disabled={bulkDeleting}
                    >
                      <FiArchive size={18} />
                    </button>
                  )}
                </th>
              </tr>
            </thead>

            <tbody>
              {callsLoading ? (
                <tr>
                  <td colSpan={6} className="py-10">
                    <LoadingSpinner message="Loading calls..." />
                  </td>
                </tr>
              ) : paginatedCalls.length > 0 ? (
                paginatedCalls.map((call) => (
                  <tr
                    key={call.id}
                    onClick={() => handleCallClick(call)}
                    className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {currentUser?.id === call.call_creator?.id && (
                        <input
                          type="checkbox"
                          checked={selectedCallIds.has(call.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectCall(call.id);
                          }}
                          className="w-4 h-4 cursor-pointer rounded border-gray-300"
                        />
                      )}
                    </td>
                    <td className="py-3 px-4 text-blue-600 font-medium">
                      {call.subject || "--"}
                    </td>

                    <td className="py-3 px-4">
                      {call.lead && (
                        <p className="font-medium text-blue-500 text-xs">
                          {call.lead.title}
                        </p>
                      )}
                      {call.account && (
                        <p className="font-medium text-blue-500 text-xs">
                          {call.account.name}
                        </p>
                      )}
                      {call.contact && (
                        <p className="font-medium text-blue-500 text-xs">
                          {call.contact.first_name} {call.contact.last_name}
                        </p>
                      )}
                      {call.deal && (
                        <p className="font-medium text-blue-500 text-xs">
                          {call.deal.name}
                        </p>
                      )}
                      {call.quote && (
                        <p className="font-medium text-blue-500 text-xs">
                          {formatQuoteId(call.quote.quote_id)}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-gray-800">
                      {call.call_time
                        ? new Date(call.call_time).toLocaleString()
                        : "--"}
                    </td>

                    <td className="py-3 px-4 text-gray-800">
                      {call?.call_assign_to
                        ? `${call.call_assign_to.first_name} ${call.call_assign_to.last_name}`
                        : "--"}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCallStatusBadgeClass(
                          call.status,
                        )}`}
                      >
                        {formatAdminCallStatusLabel(call.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No calls found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          totalItems={filteredCalls.length}
          pageSize={itemsPerPage}
          currentPage={currentPage}
          onPrev={handlePrevPage}
          onNext={handleNextPage}
          onPageSizeChange={setItemsPerPage}
          label="calls"
        />
      </div>

      {detailView}
      {formModal}

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
    </>
  );
}

// --- Sub Components ---

function MetricCard({ icon: Icon, title, value, color, bgColor }) {
  return (
    <div className="flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300">
      <div className={`p-3 rounded-full ${bgColor} ${color} mr-4`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = false,
  disabled = false,
  isSubmitted = false,
  className = "",
}) {
  const hasError = isSubmitted && required && !value;

  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-md px-2 py-1.5 text-sm outline-none border focus:ring-2 disabled:bg-gray-100
          ${
            hasError
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-400"
          }
        `}
      />
    </div>
  );
}

function TextAreaField(props) {
  return (
    <div className={props.className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {props.label}
      </label>
      <textarea
        {...props}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100 resize-none"
      />
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <p>
      <span className="font-semibold">{label}:</span> <br />
      <span className="break-words">{value || "--"}</span>
    </p>
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
      : variant === "archive"
      ? "bg-orange-500 hover:bg-orange-600 border border-orange-400"
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

/**
 * ✅ Searchable dropdown (for Contact/Deal)
 * - Works with big lists
 * - Filters client-side
 */
function SearchableSelect({
  items = [],
  value = "",
  onChange,
  getLabel,
  placeholder = "Search...",
  disabled = false,
  maxRender = 200,
  required = false,
  isSubmitted = false,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  const selectedItem = items.find((it) => String(it.id) === String(value));
  const selectedLabel = selectedItem ? getLabel(selectedItem) : "";

  // ✅ DEFINE hasError HERE
  const hasError = required && isSubmitted && !value;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query
      ? items.filter((it) => (getLabel(it) || "").toLowerCase().includes(query))
      : items;

    return base.slice(0, maxRender);
  }, [items, q, getLabel, maxRender]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        disabled={disabled}
        value={open ? q : selectedLabel}
        placeholder={placeholder}
        onFocus={() => !disabled && setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          if (!open) setOpen(true);
        }}
        className={`w-full border rounded-md px-2 py-1.5 text-sm outline-none focus:ring-2 disabled:bg-gray-100
          ${
            hasError
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-400"
          }`}
      />

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((it) => {
                const id = String(it.id);
                const label = getLabel(it);
                const active = String(value) === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onChange(id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      active ? "bg-blue-50" : ""
                    }`}
                  >
                    {label || "--"}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No results</div>
            )}
          </div>

          {items.length > maxRender && (
            <div className="px-3 py-2 text-[11px] text-gray-400 border-t">
              Showing first {maxRender} results — keep typing to narrow.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
