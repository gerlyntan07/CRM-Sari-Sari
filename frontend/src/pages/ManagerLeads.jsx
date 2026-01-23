import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiUserPlus,
  FiPlus,
  FiX,
  FiCheckCircle,
  FiClock,
  FiStar,
  FiDownload,
  FiPhone,
  FiXCircle,
} from "react-icons/fi";
import AdminLeadsInformation from "../components/ManagerLeadsInformation.jsx";
import PaginationControls from "../components/PaginationControls.jsx";
import { toast } from "react-toastify";
import api from "../api";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

import * as countryCodesList from "country-codes-list";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const allCountries = countryCodesList.all();

// Create an array like [{ code: "+63", name: "Philippines" }, ...]
const COUNTRY_CODES = allCountries.map((country, index) => ({
  code: `+${country.countryCallingCode}`,
  name: country.countryCode,
  id: `${country.countryCallingCode}-${country.countryCode}-${index}` // Unique identifier
}));

// --- HELPER FUNCTIONS ---
const formatStatusLabel = (status) => {
  if (!status) return "--";
  return status
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusBadgeClass = (status) => {
  const normalizedStatus = status ? status.toUpperCase() : "";
  switch (normalizedStatus) {
    case "NEW":
      return "bg-indigo-100 text-indigo-700";
    case "CONTACTED":
      return "bg-blue-100 text-blue-700";
    case "QUALIFIED":
      return "bg-green-100 text-green-700";
    case "CONVERTED":
      return "bg-emerald-100 text-emerald-700";
    case "LOST":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const INITIAL_FORM_STATE = {
  first_name: "",
  last_name: "",
  company_name: "",
  title: "",
  department: "",
  email: "",
  work_ccode: "+63",
  work_phone: "",
  m1_ccode: "+63",
  mobile_phone_1: "",
  m2_ccode: "+63",
  mobile_phone_2: "",
  address: "",
  notes: "",
  source: "",
  territory_id: null,
  lead_owner: null,
  status: "New",
};

export default function AdminLeads() {
  const navigate = useNavigate();
  const { leadID } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Filter by Status");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [leadData, setLeadData] = useState(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [relatedActs, setRelatedActs] = useState({});
  const editDataRef = useRef(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState(null);
  const [convertAccountData, setConvertAccountData] = useState({
    name: "",
    website: '',
    countryCode: '+63',
    phone_number: '',
    combinedPhoneNumbers: '',
    billing_address: '',
    shipping_address: '',
    industry: '',
    status: 'Prospect',
    territory_id: null,
    assigned_to: null,
    created_by: null,
  });
  const [convertContactData, setConvertContactData] = useState({
    last_name: "",
    first_name: "",
    account_id: null,
    title: "",
    department: "",
    email: "",
    work_phone: "",
    mobile_phone_1: "",
    mobile_phone_2: "",
    notes: '',
    assigned_to: null,
    created_by: null,
  });
  const [convertDealData, setConvertDealData] = useState({
    name: 'Converted from Lead',
    account_id: null,
    primary_contact_id: null,
    stage: 'PROSPECTING',
    probability: 10,
    amount: 0.0,
    currency: 'PHP',
    description: 'Initial deal from lead conversion.',
    assigned_to: null,
    created_by: null,
  });

  useEffect(() => {
    document.title = "Leads | Sari-Sari CRM";
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get(`/leads/getUsers`);
      setUsers(res.data);
    } catch (err) {
      console.error(`Error fetching users: ${err}`);
    }
  };

  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const res = await api.get(`/leads/admin/getLeads`);
      setLeads(res.data);
      console.log(res.data);
    } catch (err) {
      console.error(`Error fetching leads: ${err}`);
    } finally {
      setLeadsLoading(false);
    }
  }

  useEffect(() => {
    fetchAccounts();
    fetchLeads();
  }, []);

  useEffect(() => {
    // If there's a leadID in URL, set selectedLead (for direct URL access)
    if (leadID && leads.length > 0 && !showModal && !isEditing) {
      const found = leads.find((l) => l.id === Number(leadID));
      if (found) {
        setSelectedLead(found);
      }
    } else if (!leadID && !selectedLead) {
      // Clear selectedLead when navigating away from detail view
      setSelectedLead(null);
    }
  }, [leadID, leads, showModal, isEditing]);

  // Populate convert data when leadToConvert changes
  useEffect(() => {
    if (leadToConvert) {
      // Parse phone number from work_phone (format: "+63 9123456789")
      const parsePhone = (phone) => {
        if (!phone) return { code: "+63", number: "" };
        const match = phone.match(/^(\+\d+)\s(.+)$/);
        if (match) {
          return { code: match[1], number: match[2] };
        }
        // If no space, try to extract code from start
        if (phone.startsWith("+")) {
          const codeMatch = phone.match(/^(\+\d{1,3})/);
          if (codeMatch) {
            return { code: codeMatch[1], number: phone.substring(codeMatch[1].length).trim() };
          }
        }
        return { code: "+63", number: phone };
      };

      const workPhone = parsePhone(leadToConvert.work_phone);

      // Combine all three phone numbers from lead into one string for account
      const phoneNumbers = [];
      if (leadToConvert.work_phone) phoneNumbers.push(`Work: ${leadToConvert.work_phone}`);
      if (leadToConvert.mobile_phone_1) phoneNumbers.push(`Mobile 1: ${leadToConvert.mobile_phone_1}`);
      if (leadToConvert.mobile_phone_2) phoneNumbers.push(`Mobile 2: ${leadToConvert.mobile_phone_2}`);
      const combinedPhoneNumbers = phoneNumbers.length > 0 ? phoneNumbers.join(' | ') : '';

      setConvertAccountData({
        name: leadToConvert.company_name || "",
        website: '',
        countryCode: workPhone.code,
        phone_number: workPhone.number, // This will be the primary number for the input field
        combinedPhoneNumbers: combinedPhoneNumbers, // Store combined numbers separately
        billing_address: leadToConvert.address || '',
        shipping_address: leadToConvert.address || '',
        industry: '',
        status: 'Prospect',
        territory_id: leadToConvert.assigned_to?.territory?.id || null,
        assigned_to: leadToConvert.assigned_to?.id || null,
        created_by: leadToConvert.creator?.id || null,
      });

      setConvertContactData({
        last_name: leadToConvert.last_name || "",
        first_name: leadToConvert.first_name || "",
        account_id: null,
        title: leadToConvert.title || "",
        department: leadToConvert.department || "",
        email: leadToConvert.email || "",
        work_phone: leadToConvert.work_phone || "",
        mobile_phone_1: leadToConvert.mobile_phone_1 || "",
        mobile_phone_2: leadToConvert.mobile_phone_2 || "",
        notes: leadToConvert.notes || '',
        assigned_to: leadToConvert.assigned_to?.id || null,
        created_by: leadToConvert.creator?.id || null,
      });

      setConvertDealData({
        name: 'Converted from Lead',
        account_id: null,
        primary_contact_id: null,
        stage: 'PROSPECTING',
        probability: 10,
        amount: 0.0,
        currency: 'PHP',
        description: 'Initial deal from lead conversion.',
        assigned_to: leadToConvert.assigned_to?.id || null,
        created_by: leadToConvert.creator?.id || null,
      });
    }
  }, [leadToConvert]);


  const handleSearch = (event) => setSearchTerm(event.target.value);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const normalizedStatusFilter = statusFilter.trim().toUpperCase();

    return leads.filter((lead) => {
      // 1. Search Logic (Keep as is)
      const searchFields = [
        lead?.first_name,
        lead?.last_name,
        lead?.company_name,
        lead?.title,
        lead?.email,
        lead?.work_phone,
        lead?.assigned_to ? `${lead.assigned_to.first_name} ${lead.assigned_to.last_name}` : "",
      ];

      const matchesSearch =
        normalizedQuery === "" ||
        searchFields.some((field) => {
          if (field === null || field === undefined || field === "")
            return false;
          return field.toString().toLowerCase().includes(normalizedQuery);
        });

      // 2. UPDATED Status Logic
      let matchesStatus = false;

      if (normalizedStatusFilter === "FILTER BY STATUS") {
        // DEFAULT VIEW: Show everything EXCEPT 'Converted'
        matchesStatus = (lead.status ? lead.status.toUpperCase() : "") !== "CONVERTED";
      } else {
        // SPECIFIC VIEW: Show only what the user asked for (e.g., if they select Converted, show Converted)
        matchesStatus = (lead.status ? lead.status.toUpperCase() : "") === normalizedStatusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeads.length / itemsPerPage) || 1
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredLeads.length / itemsPerPage) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredLeads.length]);

  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLeads, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const fetchRelatedActivities = useCallback(async (lead_id) => {
        try {
          const res = await api.get(`/activities/lead/${lead_id}`);
          setRelatedActs(res.data && typeof res.data === "object" ? res.data : {});
        } catch (err) {
          console.error(err);
          if (err.response?.status === 404) {
            console.warn("No activities found for this account.");
            setRelatedActs({});
          }
        }
      }, []);

  const handleLeadClick = (lead) => {
    // Set selectedLead instead of navigating - this will show modal overlay
    setSelectedLead(lead);
    fetchRelatedActivities(lead.id);
  };
  const handleBackToList = () => {
    // Clear selectedLead and navigate to base URL
    setSelectedLead(null);
    if (leadID) {
      navigate(`/admin/leads`, { replace: true });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setLeadData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setCurrentLeadId(null);
    setIsSubmitting(false);
    setSelectedUser(null);
    // Clear any edit data from sessionStorage
    sessionStorage.removeItem('editLeadData');
  };

  const handleBackdropClick = (e) => {
    if (e.target.id === "modalBackdrop") closeModal();
  };

  const handleOpenAddModal = () => {
    setLeadData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setCurrentLeadId(null);
    setSelectedUser(null);
    setShowModal(true);
  };


  const handleEditClick = (lead) => {
    if (!lead) {
      console.error("handleEditClick: lead is null or undefined");
      return;
    }

    console.log("handleEditClick called with lead:", lead);
    console.log("Current state - leadID:", leadID, "selectedLead:", selectedLead, "showModal:", showModal);

    // Parse phone numbers to extract country code and number
    const parsePhone = (phone) => {
      if (!phone) return { code: "+63", number: "" };
      const match = phone.match(/^(\+\d+)\s(.+)$/);
      if (match) {
        return { code: match[1], number: match[2] };
      }
      return { code: "+63", number: phone };
    };

    const workPhone = parsePhone(lead.work_phone);
    const mobile1 = parsePhone(lead.mobile_phone_1);
    const mobile2 = parsePhone(lead.mobile_phone_2);

    // Find user ID from assigned_to
    let leadOwnerId = "";
    if (lead.assigned_to) {
      leadOwnerId = String(lead.assigned_to.id);
      const user = users?.find((u) => u.id === lead.assigned_to.id);
      setSelectedUser(user);
    }

    // Set form data FIRST
    setLeadData({
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      company_name: lead.company_name || "",
      title: lead.title || "",
      department: lead.department || "",
      email: lead.email || "",
      work_ccode: workPhone.code,
      work_phone: workPhone.number,
      m1_ccode: mobile1.code,
      mobile_phone_1: mobile1.number,
      m2_ccode: mobile2.code,
      mobile_phone_2: mobile2.number,
      address: lead.address || "",
      notes: lead.notes || "",
      source: lead.source || "",
      territory_id: lead.territory?.id || null,
      lead_owner: leadOwnerId,
      status: lead.status || "New",
    });
    setIsEditing(true);
    setCurrentLeadId(lead.id);

    // If coming from detail view, close detail modal and show edit form
    if (selectedLead) {
      console.log("Coming from detail view - closing detail modal and showing edit form");
      // Close detail modal
      setSelectedLead(null);
      // Show edit form
      setShowModal(true);
    } else {
      console.log("Already in list view - showing modal");
      // If already in list view, show edit form immediately
      setShowModal(true);
    }
  };

  const handleDelete = (lead) => {
    if (!lead) {
      console.error("handleDelete: lead is null or undefined");
      return;
    }

    console.log("handleDelete called with lead:", lead);
    const name = `${lead.first_name} ${lead.last_name}` || "this lead";
    setConfirmModalData({
      title: "Delete Lead",
      message: (
        <span>
          Are you sure you want to permanently delete{" "}
          <span className="font-semibold">{name}</span>? This action cannot be
          undone.
        </span>
      ),
      confirmLabel: "Delete Lead",
      cancelLabel: "Cancel",
      variant: "danger",
      action: {
        type: "delete",
        targetId: lead.id,
        name,
      },
    });
  };

  const handleLeadChange = (e) => {
    const { name, value } = e.target;
    setLeadData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === 'lead_owner') {
      const user = users.find((user) => user.id === parseInt(value));
      setSelectedUser(user);
    }
  }

  const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);       // mark that submit was attempted

    // Validation
      if (!leadData.last_name?.trim()) {
      toast.error("Last name is required.");
      return;
    }
    if (!leadData.company_name?.trim()) {
      toast.error("Company is required.");
      return;
    }
    
      if (!leadData.email?.trim()) {
          toast.error("Email is required.");
          return;
        }
       
        if (!leadData.email.includes("@")) {
          toast.error("Email must contain '@'.");
          return;
        }
    
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(leadData.email)) {
          toast.error("Please enter a valid email address with a dot in the domain.");
          return;
        }
        const emailLower = leadData.email.toLowerCase();
        const domain = emailLower.split("@")[1] || "";
    
        // Strict Gmail validation
        if (domain !== "gmail.com") {
          toast.error(`Please enter a valid Gmail address (must be gmail.com).`);
          return;
        }


    if (!leadData.lead_owner) {
      toast.error("Please assign a lead owner.");
      return;
    };

    const finalForm = {
      ...leadData,
      territory_id: leadData.territory_id ? parseInt(leadData.territory_id) : null,
      lead_owner: parseInt(leadData.lead_owner),
      work_phone: `${leadData.work_ccode} ${leadData.work_phone}`,
      mobile_phone_1: `${leadData.m1_ccode} ${leadData.mobile_phone_1}`,
      mobile_phone_2: `${leadData.m2_ccode} ${leadData.mobile_phone_2}`
    };

    const actionType = isEditing && currentLeadId ? "update" : "create";
    const leadName = `${leadData.first_name} ${leadData.last_name}`;

    setConfirmModalData({
      title: actionType === "create" ? "Confirm New Lead" : "Confirm Update",
      message:
        actionType === "create" ? (
          <span>
            Are you sure you want to create a new lead for{" "}
            <span className="font-semibold">{leadName}</span>?
          </span>
        ) : (
          <span>
            Save changes to <span className="font-semibold">{leadName}</span>?
          </span>
        ),
      confirmLabel: actionType === "create" ? "Create Lead" : "Update Lead",
      cancelLabel: "Cancel",
      variant: "primary",
      action: {
        type: actionType,
        payload: finalForm,
        targetId: currentLeadId || null,
        name: leadName,
      },
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModalData?.action) {
      setConfirmModalData(null);
      return;
    }

    const { action } = confirmModalData;
    const { type, payload, targetId, name, lead } = action;

    console.log(payload)
    setConfirmProcessing(true);

    try {
      if (type === "create") {
        setIsSubmitting(true);
        await api.post('/leads/create', payload);
        toast.success(`Lead "${name}" created successfully.`);
        closeModal();
        await fetchLeads();
      } else if (type === "update") {
        if (!targetId) {
          throw new Error("Missing lead identifier for update.");
        }
        setIsSubmitting(true);
        const res = await api.put(`/leads/${targetId}`, payload);
        toast.success(`Lead "${name}" updated successfully.`);

        // Update selectedLead if it's the one being edited
        if (selectedLead && selectedLead.id === targetId) {
          setSelectedLead(null);
        }

        closeModal();
        await fetchLeads();
      } else if (type === "delete") {
        if (!targetId) {
          throw new Error("Missing lead identifier for deletion.");
        }
        await api.delete(`/leads/${targetId}`);
        toast.success(`Lead "${name}" deleted successfully.`);
        if (selectedLead?.id === targetId) {
          setSelectedLead(null);
        }
        await fetchLeads();
      }
    } catch (err) {
      console.error(err);
      const defaultMessage =
        type === "create"
          ? "Failed to create lead. Please review the details and try again."
          : type === "update"
            ? "Failed to update lead. Please review the details and try again."
            : "Failed to delete lead. Please try again.";
      const message = err.response?.data?.detail || defaultMessage;
      toast.error(message);
    } finally {
      if (type === "create" || type === "update") {
        setIsSubmitting(false);
      }
      if (type !== "edit") {
        setConfirmProcessing(false);
        setConfirmModalData(null);
      }
    }
  };

  const handleCancelConfirm = () => {
    if (confirmProcessing) return;
    setConfirmModalData(null);
  };

  // Calculate metrics for cards
  const newLeads = leads.filter((l) => l.status === "New").length;
  const contacted = leads.filter((l) => l.status === "Contacted").length;
  const qualified = leads.filter((l) => l.status === "Qualified").length;
  const converted = leads.filter((l) => l.status === "Converted").length;
  const lost = leads.filter((l) => l.status === "Lost").length;

  const metricCards = [
    {
      title: "New",
      value: newLeads,
      icon: FiUserPlus,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Contacted",
      value: contacted,
      icon: FiPhone,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Qualified",
      value: qualified,
      icon: FiCheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Converted",
      value: converted,
      icon: FiStar,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Lost",
      value: lost,
      icon: FiXCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  // Note: We always render the list view, and show detail modal as overlay if selectedLead exists

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
      {leadsLoading && <LoadingSpinner message="Loading leads..." />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiUserPlus className="mr-2 text-blue-600" />
          Leads
        </h1>

        <div className="flex justify-center lg:justify-end gap-3 w-full sm:w-auto">
          <button
          onClick={() => {
          handleOpenAddModal();  // open the modal
          setIsSubmitted(false); // reset all error borders
        }}
            className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base self-end sm:self-auto cursor-pointer"
          >
            <FiPlus className="mr-2" /> Add Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 w-full break-words overflow-hidden lg:overflow-visible">
        {metricCards.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search leads"
            value={searchTerm}
            onChange={handleSearch}
            className="focus:outline-none text-base w-full"
          />
        </div>
        <div className="w-full lg:w-1/4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="Filter by Status">Filter by Status</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
          <thead className="bg-gray-100 text-left text-gray-600 text-sm tracking-wide font-semibold">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Job Title</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Assigned To</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length > 0 ? (
              paginatedLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-gray-50 text-sm cursor-pointer"
                  onClick={() => handleLeadClick(lead)}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-blue-600 hover:underline break-all text-sm">
                      {lead.first_name} {lead.last_name}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800 text-sm leading-tight">
                      {lead.company_name || "--"}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                    {lead.title || "--"}
                  </td>
                  <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                    {lead.email || "--"}
                  </td>
                  <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                    {lead.assigned_to
                      ? `${lead.assigned_to.first_name} ${lead.assigned_to.last_name}`
                      : "--"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeClass(
                        lead.status || "New"
                      )}`}
                    >
                      {formatStatusLabel(lead.status || "New")}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={7}
                >
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        className="mt-4"
        totalItems={filteredLeads.length}
        pageSize={itemsPerPage}
        currentPage={currentPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        onPageSizeChange={(newSize) => {
          setItemsPerPage(newSize);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 20, 30, 40, 50]}
        label="leads"
      />

      {/* Add Leads Modal */}
      {showModal && (
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
                 onClick={() => {
                closeModal();          // close the modal
                setIsSubmitted(false); // reset validation errors
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
            >
              <FiX size={22} />
            </button>

            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
              {isEditing ? "Edit Lead" : "Add New Lead"}
            </h2>

            {/* Form grid */}
            <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {/* First Name */}
              <div className="flex flex-col">
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={leadData.first_name}
                  onChange={handleLeadChange}
                  placeholder="Joe"
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Last Name */}
              <div className="flex flex-col">
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Smith"
                  name="last_name"
                  value={leadData.last_name}
                  onChange={handleLeadChange}
                    required
                className={`w-full rounded-md px-2 py-1.5 text-sm outline-none border
                      ${isSubmitted && !leadData.last_name?.trim()
                      ? "border-red-400 focus:ring-red-400"
                    : "border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"}
                  focus:ring-2`}
              />
              </div>

              {/* Company */}
              <div className="flex flex-col">
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Company <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="ABC Company"
                  name="company_name"
                  value={leadData.company_name}
                  onChange={handleLeadChange}
                 required
              className={`w-full rounded-md px-2 py-1.5 text-sm outline-none border
                       ${isSubmitted && !leadData.company_name?.trim()
                       ? "border-red-400 focus:ring-red-400"
                    : "border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"}
                  focus:ring-2`}/>
              </div>

              {/* Title */}
              <div className="flex flex-col">
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Job Title<span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="ABC Agenda"
                  name="title"
                  value={leadData.title}
                  onChange={handleLeadChange}
                   required
                    className={`w-full rounded-md px-2 py-1.5 text-sm outline-none border
                       ${isSubmitted && !leadData.title?.trim()
                       ? "border-red-400 focus:ring-red-400"
                      : "border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"}
                      focus:ring-2`}
                  />
              </div>

              {/* Department */}
              <div className="flex flex-col">
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="Sales"
                  name="department"
                  value={leadData.department}
                  onChange={handleLeadChange}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col">
                 <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Email<span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="abc@gmail.com"
                  name="email"
                  value={leadData.email}
                  onChange={handleLeadChange}
                   className={`w-full rounded-md px-2 py-1.5 text-sm outline-none border
                       ${isSubmitted && !leadData.email?.trim()
                       ? "border-red-400 focus:ring-red-400"
                      : "border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"}
                      focus:ring-2`}
                  />
              </div>

              {/* Work Phone */}
              <div className="flex flex-col">
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Work Phone
                </label>

                <div className="w-full border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-400 outline-none flex flex-row gap-1">
                  <select name="work_ccode" value={leadData.work_ccode} onChange={handleLeadChange} className="outline-none cursor-pointer py-1.5 px-2 border-r border-gray-400 text-sm">
                    {COUNTRY_CODES.map((c) => <option key={c.id} value={c.code}>{c.code}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="9----------"
                    name="work_phone"
                    value={leadData.work_phone}
                    onChange={handleLeadChange}
                    className="w-full outline-none px-2 py-1.5 text-sm"
                  />
                </div>

              </div>

              {/* Mobile Phone 1 */}
              <div className="flex flex-col">
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Mobile Phone 1
                </label>

                <div className="w-full border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-400 outline-none flex flex-row gap-1">
                  <select name="m1_ccode" value={leadData.m1_ccode} onChange={handleLeadChange} className="outline-none cursor-pointer py-1.5 px-2 border-r border-gray-400 text-sm">
                    {COUNTRY_CODES.map((c) => <option key={c.id} value={c.code}>{c.code}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="9----------"
                    name="mobile_phone_1"
                    value={leadData.mobile_phone_1}
                    onChange={handleLeadChange}
                    className="w-full outline-none px-2 py-1.5 text-sm"
                  />
                </div>
              </div>

              {/* Mobile Phone 2 */}
              <div className="flex flex-col">
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Mobile Phone 2
                </label>

                <div className="w-full border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-400 outline-none flex flex-row gap-1">
                  <select name="m2_ccode" value={leadData.m2_ccode} onChange={handleLeadChange} className="outline-none cursor-pointer py-1.5 px-2 border-r border-gray-400 text-sm">
                    {COUNTRY_CODES.map((c) => <option key={c.id} value={c.code}>{c.code}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="9----------"
                    name="mobile_phone_2"
                    value={leadData.mobile_phone_2}
                    onChange={handleLeadChange}
                    className="w-full outline-none px-2 py-1.5 text-sm"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-gray-700 font-medium mb-1 text-sm">Address</label>
                <input
                  type="text"
                  name="address"
                  value={leadData.address}
                  onChange={handleLeadChange}
                  placeholder="Street No., Street Name, City, State/Province, Postal Code"
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Assign To */}
              <div className="flex flex-col">
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Assign To <span className="text-red-500">*</span></label>
                  <div
                  className={`w-full rounded-lg ${
                    isSubmitted && !leadData.lead_owner
                      ? "border border-red-400"
                      : "border border-gray-300"
                  }`}
                >
                <SearchableSelect
                  items={Array.isArray(users) ? users : []}
                  value={leadData.lead_owner ?? ""}
                  placeholder={`Search a user...`}
                  getLabel={(item) => `${item.first_name} ${item.last_name}`}
                  onChange={(newId) => {
                    const user = users.find((u) => String(u.id) === String(newId));
                    setSelectedUser(user);

                    // Auto-select territory if user has exactly one, otherwise reset
                    let newTerritoryId = null;
                    if (user && user.assigned_territory && user.assigned_territory.length === 1) {
                      newTerritoryId = user.assigned_territory[0].id;
                    }

                    setLeadData((prev) => ({
                      ...prev,
                      lead_owner: newId,
                      territory_id: newTerritoryId // Reset or Auto-select
                    }));
                  }}
                />
              </div>
              </div>

              {/* Territory */}
              <div className="flex flex-col">
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Territory
                </label>
                <select
                  name="territory_id"
                  value={leadData.territory_id || ""}
                  onChange={handleLeadChange}
                  disabled={!selectedUser || !selectedUser.assigned_territory || selectedUser.assigned_territory.length === 0}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="" disabled>
                    {!selectedUser
                      ? "Select a user first"
                      : (selectedUser.assigned_territory && selectedUser.assigned_territory.length > 0)
                        ? "Select Territory"
                        : "No territories assigned to this user"
                    }
                  </option>

                  {selectedUser &&
                    selectedUser.assigned_territory &&
                    selectedUser.assigned_territory.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Source */}
              <div className="flex flex-col">
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Source
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  defaultValue=""
                  name="source"
                  value={leadData.source}
                  onChange={handleLeadChange}
                >
                  <option value="" disabled>
                    Select Source
                  </option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold call">Cold call</option>
                  <option value="Event">Event</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-gray-700 font-medium mb-1 text-sm">Notes</label>
                <textarea
                  placeholder="Additional details..."
                  name="notes"
                  value={leadData.notes}
                  onChange={handleLeadChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                />
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4 col-span-1 sm:col-span-2 lg:col-span-3">
                <button
                  type="button"
                  onClick={() => {
                    closeModal();       // close the modal
                    setIsSubmitted(false); // reset validation errors
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition disabled:opacity-70"
                  disabled={isSubmitting || confirmProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full sm:w-auto px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition disabled:opacity-70"
                  disabled={isSubmitting || confirmProcessing}
                >
                  {isSubmitting || confirmProcessing
                    ? "Processing..."
                    : isEditing
                      ? "Update Lead"
                      : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
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

      {/* Modal: Selected Lead Info - Overlay on top of list view */}
      {selectedLead && !showModal && !isEditing && (
        <AdminLeadsInformation
          relatedActs={relatedActs}
          lead={selectedLead}
          onBack={handleBackToList}
          fetchLeads={fetchLeads}
          setSelectedLead={setSelectedLead}
          onEdit={handleEditClick}
          onDelete={handleDelete}
        />
      )}
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

function SearchableSelect({
  items = [],
  value = "",
  onChange,
  getLabel,
  placeholder = "Search...",
  disabled = false,
  maxRender = 200,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  const selectedItem = items.find((it) => String(it.id) === String(value));
  const selectedLabel = selectedItem ? getLabel(selectedItem) : "";

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query
      ? items.filter((it) => (getLabel(it) || "").toLowerCase().includes(query))
      : items;

    return base.slice(0, maxRender);
  }, [items, q, getLabel, maxRender]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
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
 className="w-full rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"/>

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
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${active ? "bg-blue-50" : ""
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
