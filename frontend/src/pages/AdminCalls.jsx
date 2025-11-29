import React, { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiPhoneCall,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiEdit,
  FiTrash2,
  FiPhone,
  FiMail,
  FiCalendar,
} from "react-icons/fi";
import { HiX } from "react-icons/hi";
import { toast } from "react-toastify";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "MISSED", label: "Missed" },
];

const PRIORITY_OPTIONS = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const INITIAL_FORM_STATE = {
  subject: "",
  primary_contact: "",
  phone_number: "",
  call_time: "",
  call_duration: "",
  notes: "",
  due_date: "",
  assigned_to: "",
  related_type: "",
  related_to: "",
  priority: "LOW",
};

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
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-gray-200 text-gray-700";
    case "MISSED":
      return "bg-red-100 text-red-700";
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

export default function AdminCalls() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const callIdFromQuery = searchParams.get('id');
  const isInfoRoute = location.pathname === '/admin/calls/info';

  useEffect(() => {
    document.title = "Calls | Sari-Sari CRM";
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [selectedCall, setSelectedCall] = useState(null);
  const [calls, setCalls] = useState([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Filter by Status");
  const [userFilter, setUserFilter] = useState("Filter by Users");
  const [priorityFilter, setPriorityFilter] = useState("Filter by Priority");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const total = calls.length;
  const pending = useMemo(
    () => calls.filter((call) => call.status?.toUpperCase() === "PENDING").length,
    [calls]
  );
  const completed = useMemo(
    () => calls.filter((call) => call.status?.toUpperCase() === "COMPLETED").length,
    [calls]
  );
  const cancelled = useMemo(
    () => calls.filter((call) => call.status?.toUpperCase() === "CANCELLED").length,
    [calls]
  );
  const missed = useMemo(
    () => calls.filter((call) => call.status?.toUpperCase() === "MISSED").length,
    [calls]
  );

  const metricCards = useMemo(
    () => [
      {
        title: "Total",
        value: total,
        icon: FiPhoneCall,
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
        title: "Completed",
        value: completed,
        icon: FiCheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        title: "Cancelled",
        value: cancelled,
        icon: FiXCircle,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
      },
      {
        title: "Missed",
        value: missed,
        icon: FiXCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
      },
    ],
    [total, pending, completed, cancelled, missed]
  );

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

  const fetchCalls = async () => {
    // Check if we have data from sessionStorage (instant access from dashboard)
    if (callIdFromQuery && isInfoRoute) {
      const storedData = sessionStorage.getItem('callDetailData');
      if (storedData) {
        try {
          const callData = JSON.parse(storedData);
          if (callData.id === parseInt(callIdFromQuery)) {
            setSelectedCall(callData);
            sessionStorage.removeItem('callDetailData'); // Clean up
            return; // Don't fetch all calls, use stored data
          }
        } catch (e) {
          console.error('Error parsing stored call data:', e);
        }
      }
    }
    
    setCallsLoading(true);
    try {
      const res = await api.get(`/calls/admin/fetch-all`);
      const data = Array.isArray(res.data) ? res.data : [];
      // Sort by created_at descending (most recent first)
      const sorted = [...data].sort((a, b) => {
        const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });
      setCalls(sorted);
      
      // If there's a call ID in query params, find and select it
      if (callIdFromQuery && !selectedCall) {
        const call = sorted.find(c => c.id === parseInt(callIdFromQuery));
        if (call) {
          setSelectedCall(call);
        }
      }
    } catch (err) {
      console.error(err);
      setCalls([]);
      if (err.response?.status === 403) {
        toast.error("Permission denied. Only CEO, Admin, or Group Manager can access this page.");
      } else {
        toast.error("Failed to fetch calls. Please try again later.");
      }
    } finally {
      setCallsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchContacts();
    fetchAccounts();
    fetchLeads();
    fetchDeals();
    fetchCalls();
  }, []);

  const filteredCalls = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedStatusFilter = statusFilter.trim().toUpperCase();
    const normalizedUserFilter = userFilter.trim();
    const normalizedPriorityFilter = priorityFilter.trim().toUpperCase();

    return calls.filter((call) => {
      // Format due_date for search
      const formattedDueDate = call.due_date 
        ? (typeof call.due_date === 'string' 
            ? new Date(call.due_date).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
              })
            : call.due_date)
        : '';

      // Search across all visible table fields
      const searchFields = [
        call?.subject,
        call?.notes,
        call?.primary_contact,
        call?.phone_number,
        call?.assigned_to,
        call?.related_to,
        call?.related_type,
        call?.priority ? formatStatusLabel(call.priority) : '',
        call?.status ? formatStatusLabel(call.status) : '',
        formattedDueDate,
      ];

      const matchesSearch =
        normalizedQuery === "" ||
        searchFields.some((field) => {
          if (field === null || field === undefined || field === '') return false;
          return field.toString().toLowerCase().includes(normalizedQuery);
        });

      const matchesStatus =
        normalizedStatusFilter === "FILTER BY STATUS" ||
        normalizeStatus(call.status || "PENDING") === normalizedStatusFilter;

      const matchesUser =
        normalizedUserFilter === "Filter by Users" ||
        (call.assigned_to && call.assigned_to.toLowerCase() === normalizedUserFilter.toLowerCase());

      const matchesPriority =
        normalizedPriorityFilter === "FILTER BY PRIORITY" ||
        normalizeStatus(call.priority || "LOW") === normalizedPriorityFilter;

      return matchesSearch && matchesStatus && matchesUser && matchesPriority;
    });
  }, [calls, searchQuery, statusFilter, userFilter, priorityFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCalls.length / ITEMS_PER_PAGE) || 1
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, userFilter, priorityFilter]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredCalls.length / ITEMS_PER_PAGE) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredCalls.length]);

  const paginatedCalls = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCalls.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCalls, currentPage]);

  const pageStart =
    filteredCalls.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredCalls.length);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleCallClick = (call) => {
    setSelectedCall(call);
    setActiveTab("Overview");
    setSelectedStatus(normalizeStatus(call?.status) || "PENDING");
  };

  const handleStatusUpdate = async () => {
    if (!selectedCall || !selectedStatus) return;

    const normalizedNewStatus = normalizeStatus(selectedStatus);
    const normalizedCurrentStatus = normalizeStatus(selectedCall.status);

    // Don't update if status hasn't changed
    if (normalizedNewStatus === normalizedCurrentStatus) {
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await api.put(`/calls/${selectedCall.id}`, {
        status: normalizedNewStatus,
      });
      
      toast.success(`Call status updated to ${formatStatusLabel(normalizedNewStatus)}`);
      
      // Update calls list in real-time without reloading
      setCalls((prevCalls) => {
        return prevCalls.map((call) => {
          if (call.id === selectedCall.id) {
            return {
              ...call,
              status: response.data.status || normalizedNewStatus,
            };
          }
          return call;
        });
      });
      
      // Close the popup after successful update
      setSelectedCall(null);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.detail || "Failed to update call status. Please try again.";
      toast.error(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBackToList = () => {
    setSelectedCall(null);
    // If accessed from dashboard via query param, navigate back
    if (callIdFromQuery) {
      navigate('/admin/dashboard');
    }
  };

  const handleCallModalBackdropClick = (e) => {
    if (e.target.id === "callModalBackdrop" && !confirmProcessing) {
      handleBackToList();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(INITIAL_FORM_STATE);
    setIsSubmitting(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target.id === "modalBackdrop") closeModal();
  };

  const formattedDateTime = (datetime) => {
    if (!datetime) return "";
    return new Date(datetime)
      .toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
      .replace(",", "");
  };

  // Get Related To options based on Related Type for dropdown
  const getRelatedToOptions = () => {
    if (!formData.related_type) return [];
    
    switch (formData.related_type) {
      case "Account":
        return accounts.map((account) => ({
          value: String(account.id),
          label: account.name || "Unnamed Account",
        }));
      case "Contact":
        return contacts.map((contact) => {
          const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
          return {
            value: String(contact.id),
            label: fullName || "Unnamed Contact",
          };
        });
      case "Lead":
        return leads.map((lead) => {
          const fullName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim();
          return {
            value: String(lead.id),
            label: fullName || "Unnamed Lead",
          };
        });
      case "Deal":
        return deals.map((deal) => ({
          value: String(deal.id),
          label: deal.name || "Unnamed Deal",
        }));
      default:
        return [];
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      
      // Auto-fill phone number only when primary contact is selected
      // DON'T auto-set Related Type - let user select manually
      if (name === "primary_contact" && value) {
        const selectedContact = contacts.find((c) => String(c.id) === value);
        if (selectedContact) {
          // Auto-fill phone number only
          updated.phone_number = selectedContact.work_phone || selectedContact.mobile_phone_1 || "";
          
          // If Related Type is already selected, auto-select connected Related To in dropdown
          if (updated.related_type) {
            if (updated.related_type === "Contact") {
              // Auto-select the primary contact in Related To dropdown
              updated.related_to = String(selectedContact.id);
            } else if (updated.related_type === "Account" && selectedContact.account_id) {
              // Auto-select the contact's account in Related To dropdown
              updated.related_to = String(selectedContact.account_id);
            } else if (updated.related_type === "Lead") {
              // Find lead connected to contact (by matching email or name)
              const contactEmail = selectedContact.email?.toLowerCase();
              const contactName = `${selectedContact.first_name || ""} ${selectedContact.last_name || ""}`.trim().toLowerCase();
              
              const connectedLead = leads.find((lead) => {
                const leadEmail = lead.email?.toLowerCase();
                const leadName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim().toLowerCase();
                return (leadEmail && leadEmail === contactEmail) || (leadName && leadName === contactName);
              });
              
              if (connectedLead) {
                updated.related_to = String(connectedLead.id);
              } else {
                updated.related_to = ""; // Clear if no lead found
              }
            } else if (updated.related_type === "Deal") {
              // Find deal connected to contact's account
              if (selectedContact.account_id) {
                const connectedDeal = deals.find((deal) => deal.account_id === selectedContact.account_id);
                if (connectedDeal) {
                  updated.related_to = String(connectedDeal.id);
                } else {
                  updated.related_to = ""; // Clear if no deal found
                }
              } else {
                updated.related_to = ""; // Clear if no account
              }
            }
          }
        }
      }
      
      // When Related Type is changed, auto-select connected item if Primary Contact exists
      if (name === "related_type") {
        // Clear Related To when changing Related Type
        updated.related_to = "";
        
        // If Primary Contact exists, auto-select connected item
        if (updated.primary_contact) {
          const selectedContact = contacts.find((c) => String(c.id) === updated.primary_contact);
          if (selectedContact) {
            if (value === "Contact") {
              // Auto-select the primary contact
              updated.related_to = String(selectedContact.id);
            } else if (value === "Account" && selectedContact.account_id) {
              // Auto-select the contact's account
              updated.related_to = String(selectedContact.account_id);
            } else if (value === "Lead") {
              // Find and auto-select connected lead
              const contactEmail = selectedContact.email?.toLowerCase();
              const contactName = `${selectedContact.first_name || ""} ${selectedContact.last_name || ""}`.trim().toLowerCase();
              
              const connectedLead = leads.find((lead) => {
                const leadEmail = lead.email?.toLowerCase();
                const leadName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim().toLowerCase();
                return (leadEmail && leadEmail === contactEmail) || (leadName && leadName === contactName);
              });
              
              if (connectedLead) {
                updated.related_to = String(connectedLead.id);
              }
            } else if (value === "Deal") {
              // Find and auto-select connected deal
              if (selectedContact.account_id) {
                const connectedDeal = deals.find((deal) => deal.account_id === selectedContact.account_id);
                if (connectedDeal) {
                  updated.related_to = String(connectedDeal.id);
                }
              }
            }
          }
        }
      }
      
      // If primary contact is cleared, optionally clear related fields
      if (name === "primary_contact" && !value) {
        // Don't auto-clear related_type and related_to to allow manual entry
      }
      
      return updated;
    });
  };

  const handleOpenAddModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmModalData?.action) {
      setConfirmModalData(null);
      return;
    }

    const { action } = confirmModalData;
    const { type, payload, name } = action;

    setConfirmProcessing(true);

    try {
      if (type === "create") {
        setIsSubmitting(true);
        const response = await api.post(`/calls/create`, payload);
        toast.success(`Call "${name}" created successfully.`);
        closeModal();
        await fetchCalls();
      }
    } catch (err) {
      console.error(err);
      const defaultMessage = "Failed to create call. Please review the details and try again.";
      toast.error(defaultMessage);
      setIsSubmitting(false);
    } finally {
      if (type === "create") {
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

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedSubject = formData.subject.trim();
    if (!trimmedSubject) {
      toast.error("Call subject is required.");
      return;
    }

    const selectedUser = users.find((u) => String(u.id) === formData.assigned_to);
    const assignedToName = selectedUser
      ? `${selectedUser.first_name} ${selectedUser.last_name}`
      : null;

    const selectedContact = contacts.find((c) => String(c.id) === formData.primary_contact);
    const primaryContactName = selectedContact
      ? `${selectedContact.first_name || ""} ${selectedContact.last_name || ""}`.trim()
      : null;
    const contactPhone = selectedContact?.work_phone || selectedContact?.mobile_phone_1 || null;

    // Get Related To text based on selected ID and Related Type
    let relatedToText = null;
    if (formData.related_type && formData.related_to) {
      const relatedToId = Number(formData.related_to);
      if (formData.related_type === "Account") {
        const account = accounts.find((a) => a.id === relatedToId);
        relatedToText = account?.name || null;
      } else if (formData.related_type === "Contact") {
        const contact = contacts.find((c) => c.id === relatedToId);
        relatedToText = contact ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim() : null;
      } else if (formData.related_type === "Lead") {
        const lead = leads.find((l) => l.id === relatedToId);
        relatedToText = lead ? `${lead.first_name || ""} ${lead.last_name || ""}`.trim() : null;
      } else if (formData.related_type === "Deal") {
        const deal = deals.find((d) => d.id === relatedToId);
        relatedToText = deal?.name || null;
      }
    }

    const payload = {
      subject: trimmedSubject,
      primary_contact: primaryContactName,
      primary_contact_id: formData.primary_contact ? Number(formData.primary_contact) : null,
      phone_number: formData.phone_number?.trim() || contactPhone || null,
      call_time: formData.call_time || null,
      call_duration: formData.call_duration || null,
      notes: formData.notes?.trim() || null,
      due_date: formData.due_date || null,
      assigned_to: assignedToName,
      assigned_to_id: formData.assigned_to ? Number(formData.assigned_to) : null,
      related_type: formData.related_type || null,
      related_to: relatedToText,
      related_to_id: formData.related_to ? Number(formData.related_to) : null,
      priority: formData.priority || "LOW",
      status: "PENDING",
    };

    setConfirmModalData({
      title: "Confirm New Call",
      message: (
        <span>
          Are you sure you want to create the call{" "}
          <span className="font-semibold">{trimmedSubject}</span>?
        </span>
      ),
      confirmLabel: "Create Call",
      cancelLabel: "Cancel",
      variant: "primary",
      action: {
        type: "create",
        payload,
        name: trimmedSubject,
      },
    });
  };

  const statusFilterOptions = [
    { label: "Filter by Status", value: "Filter by Status" },
    ...STATUS_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  ];

  const detailView = selectedCall ? (
    <div
      id="callModalBackdrop"
      onClick={handleCallModalBackdropClick}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-y-auto hide-scrollbar animate-scale-in p-4 sm:p-6 md:p-8 font-inter relative">
        {/* Close Button */}
        <div className="flex justify-end w-full">
          <button
            onClick={handleBackToList}
            className="text-gray-500 hover:text-gray-700 transition mb-5 cursor-pointer"
          >
            <HiX size={30} />
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-2 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {selectedCall.subject}
            </h1>
            <span
              className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${getStatusBadgeClass(
                selectedCall.status
              )}`}
            >
              {formatStatusLabel(selectedCall.status)}
            </span>
          </div>
        </div>
        <div className="border-b border-gray-200 mb-6"></div>

        {/* TABS */}
        <div className="flex w-full bg-[#6A727D] text-white mt-1 overflow-x-auto mb-6">
          {["Overview", "Notes", "Activities"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[90px] px-4 py-2.5 text-xs sm:text-sm font-medium text-center transition-all duration-200 border-b-2
        ${activeTab === tab
                  ? "bg-paper-white text-[#6A727D] border-white"
                  : "text-white hover:bg-[#5c636d]"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3">
            {activeTab === "Overview" && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold">Primary Contact:</p>
                    <p>{selectedCall.primary_contact || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Phone Number:</p>
                    <p>{selectedCall.phone_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Call Time:</p>
                    <p>
                      {selectedCall.call_time 
                        ? (typeof selectedCall.call_time === 'string' 
                            ? new Date(selectedCall.call_time).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })
                            : selectedCall.call_time)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Call Duration:</p>
                    <p>{selectedCall.call_duration ? `${selectedCall.call_duration} min` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Due Date:</p>
                    <p>
                      {selectedCall.due_date 
                        ? (typeof selectedCall.due_date === 'string' 
                            ? new Date(selectedCall.due_date).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric'
                              })
                            : selectedCall.due_date)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Assigned To:</p>
                    <p>{selectedCall.assigned_to || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Related Type:</p>
                    <p>{selectedCall.related_type || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Related To:</p>
                    <p>{selectedCall.related_to || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Priority:</p>
                    <p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(
                          selectedCall.priority
                        )}`}
                      >
                        {formatStatusLabel(selectedCall.priority)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Created At:</p>
                    <p>{formattedDateTime(selectedCall.created_at) || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

                 {/* ------- Notes ------ */}
            {activeTab === "Notes" && (
              <div className="mt-4 w-full">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                  <h3 className="text-lg font-semibold text-gray-800 break-words">Calls Note</h3>
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
                    {selectedCall.notes?.trim() || "No notes available."}
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVITIES */}
                        {activeTab === "Activities" && (
                          <div className="mt-4 space-y-4 w-full">
                            <h3 className="text-lg font-semibold text-gray-800 break-words">Recent Activities</h3>
            
                            {[{
                              icon: FiPhone,
                              title: "Schedule Call",
                              desc: "Discuss implementation timeline and pricing",
                              user: "Lester James",
                              date: "December 12, 2025 at 8:00 AM",
                            }, {
                              icon: FiCalendar,
                              title: "Meeting regarding Enterprise Software License",
                              desc: "Discuss implementation timeline and pricing",
                              user: "Lester James",
                              date: "December 12, 2025 at 8:00 AM",
                            }].map((act, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row justify-between items-start border border-gray-200 rounded-lg p-4 shadow-sm bg-white w-full break-words">
                                <div className="flex gap-4 mb-2 sm:mb-0 flex-1 min-w-0">
                                  <div className="text-gray-600 mt-1">
                                    <act.icon size={24} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 break-words">{act.title}</h4>
                                    <p className="text-sm text-gray-500 break-words">{act.desc}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0"></div>
                                      <p className="text-sm text-gray-700 break-words">{act.user}</p>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500 break-words">{act.date}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

          <div className="flex flex-col gap-4">
            {/* QUICK ACTIONS */}
            <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                Quick Actions
              </h4>

              <div className="flex flex-col gap-2 w-full">
                {[
                  { icon: FiPhone, text: "Schedule Call" },
                  { icon: FiMail, text: "Send E-mail" },
                  { icon: FiCalendar, text: "Book Meeting" },
                ].map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
                  >
                    <Icon className="text-gray-600 w-4 h-4 flex-shrink-0" />{" "}
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* STATUS */}
            <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm w-full">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                Status
              </h4>
              <select
                className="border border-gray-200 rounded-md px-2 sm:px-3 py-1.5 w-full text-sm mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={selectedStatus || selectedCall.status || "PENDING"}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleStatusUpdate}
                disabled={
                  updatingStatus || 
                  normalizeStatus(selectedStatus) === normalizeStatus(selectedCall.status)
                }
                className={`w-full py-1.5 rounded-md text-sm transition focus:outline-none focus:ring-2 ${
                  updatingStatus || 
                  normalizeStatus(selectedStatus) === normalizeStatus(selectedCall.status)
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-400"
                }`}
              >
                {updatingStatus ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const listView = (
    <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
      {callsLoading && !callIdFromQuery && <LoadingSpinner message="Loading calls..." />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiPhoneCall className="mr-2 text-blue-600" />
          Calls
        </h1>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base ml-auto sm:ml-0 cursor-pointer"
        >
          <FiPlus className="mr-2" /> Add Call
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6 w-full break-words overflow-hidden">
        {metricCards.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search calls"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:outline-none text-base w-full"
          />
        </div>
        <div className="w-full lg:w-auto flex flex-col lg:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full lg:w-40 focus:ring-2 focus:ring-indigo-500 transition"
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full lg:w-40 focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="Filter by Users">Filter by Users</option>
            {users.map((user) => (
              <option key={user.id} value={`${user.first_name} ${user.last_name}`}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full lg:w-40 focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="Filter by Priority">Filter by Priority</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
          <thead className="bg-gray-100 text-left text-gray-600 text-sm tracking-wide font-semibold">
            <tr>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Activity</th>
              <th className="py-3 px-4">Related To</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Assigned To</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {callsLoading && !callIdFromQuery ? (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={6}
                >
                  Loading calls...
                </td>
              </tr>
            ) : filteredCalls.length > 0 ? (
              paginatedCalls.map((call) => {
                return (
                  <tr
                    key={call.id}
                    className="hover:bg-gray-50 text-sm cursor-pointer"
                    onClick={() => handleCallClick(call)}
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(
                          call.priority || "LOW"
                        )}`}
                      >
                        {formatStatusLabel(call.priority || "LOW")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-blue-600 hover:underline break-all text-sm">
                          {call.subject}
                        </div>
                        <div className="text-gray-500 text-xs break-all">
                          {call.notes || "--"}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-800 text-sm leading-tight">
                          {call.related_to || "--"}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {call.related_type || "--"}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                      {call.due_date 
                        ? (typeof call.due_date === 'string' 
                            ? new Date(call.due_date).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric'
                              })
                            : call.due_date)
                        : "--"}
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                      {call.assigned_to || "--"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          call.status || "PENDING"
                        )}`}
                      >
                        {formatStatusLabel(call.status || "PENDING")}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={6}
                >
                  No calls found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        className="mt-4"
        totalItems={filteredCalls.length}
        pageSize={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        label="calls"
      />
    </div>
  );

  const formModal = showModal ? (
    <div
      id="modalBackdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white w-full max-w-full sm:max-w-3xl rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh] hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
          disabled={isSubmitting || confirmProcessing}
        >
          <FiX size={22} />
        </button>

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
          Add New Call
        </h2>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
          onSubmit={handleSubmit}
        >
          <InputField
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="e.g. Follow-up call with Client"
            required
            disabled={isSubmitting}
          />
          <TextAreaField
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Add call notes and key discussion points."
            disabled={isSubmitting}
            className="md:row-span-6"
            rows={12}
          />
          <SelectField
            label="Primary Contact"
            name="primary_contact"
            value={formData.primary_contact}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Select Contact" },
              ...contacts.map((contact) => ({
                value: String(contact.id),
                label: `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "Unnamed Contact",
              })),
            ]}
            disabled={isSubmitting || contacts.length === 0}
          />
          <InputField
            label="Phone Number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            placeholder="+63"
            type="tel"
            disabled={isSubmitting}
          />
          <InputField
            label="Call Time"
            name="call_time"
            value={formData.call_time}
            onChange={handleInputChange}
            placeholder="10:00 AM"
            type="time"
            disabled={isSubmitting}
          />
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 -mt-7">
            <InputField
              label="Call Duration (minutes)"
              name="call_duration"
              value={formData.call_duration}
              onChange={handleInputChange}
              placeholder="30"
              type="number"
              disabled={isSubmitting}
            />
            <InputField
              label="Due Date"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
              type="date"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Assigned To"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleInputChange}
              options={[
                { value: "", label: "Select User" },
                ...users.map((user) => ({
                  value: String(user.id),
                  label: `${user.first_name} ${user.last_name}`,
                })),
              ]}
              required
              disabled={isSubmitting || users.length === 0}
            />
            <SelectField
              label="Related Type"
              name="related_type"
              value={formData.related_type}
              onChange={handleInputChange}
              options={[
                { value: "", label: "Select Type" },
                { value: "Deal", label: "Deal" },
                { value: "Lead", label: "Lead" },
                { value: "Contact", label: "Contact" },
                { value: "Account", label: "Account" },
              ]}
              disabled={isSubmitting}
            />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Related To"
              name="related_to"
              value={formData.related_to}
              onChange={handleInputChange}
              options={[
                { value: "", label: formData.related_type ? `Select ${formData.related_type}` : "Select Related Type first" },
                ...getRelatedToOptions(),
              ]}
              disabled={isSubmitting || !formData.related_type}
            />
            <SelectField
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              options={PRIORITY_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 col-span-1 md:col-span-2 mt-4 w-full">
            <button
              type="button"
              onClick={closeModal}
              className="w-full sm:w-auto px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition disabled:opacity-70"
              disabled={isSubmitting || confirmProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition disabled:opacity-70"
              disabled={isSubmitting || confirmProcessing}
            >
              {isSubmitting ? "Saving..." : "Save Call"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

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

  // If accessed via /info route, only show detail modal (no loading, no list)
  if (isInfoRoute && callIdFromQuery) {
    if (!selectedCall) {
      // Still loading, return null (no loading spinner)
      return null;
    }
    return detailView;
  }

  return (
    <>
      {listView}
      {detailView}
      {formModal}
      {confirmationModal}
    </>
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

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  className = "",
}) {
  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}) {
  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label}
      </label>
      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  rows = 3,
}) {
  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label}
      </label>
      <textarea
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
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
