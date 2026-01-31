import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
    FiSearch,
    FiEdit,
    FiBriefcase,
    FiTrendingUp,
    FiCheckCircle,
    FiXCircle,
    FiTrash2,
    FiX,
    FiPlus
} from "react-icons/fi";
import { LuUserSearch } from "react-icons/lu";
import api from '../api'
import { toast } from "react-toastify";
import PaginationControls from "../components/PaginationControls.jsx";
import ManagerDealsInformation from "../components/ManagerDealsInformation";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useLocation, useNavigate } from "react-router-dom";

export default function ManagerDeals() {
    useEffect(() => {
        document.title = "Deals | Sari-Sari CRM";
    }, []);

    const navigate = useNavigate();
    const location = useLocation();

    const [searchQuery, setSearchQuery] = useState("");
    const [stageFilter, setStageFilter] = useState("Filter by Stage");
    const [ownerFilter, setOwnerFilter] = useState("Filter by Owner");
    const [selectedDeal, setSelectedDeal] = useState(null);
    const [activeTab, setActiveTab] = useState("Overview");
    const [showDealModal, setShowDealModal] = useState(false);
    const [deals, setDeals] = useState(null);
    const [dealsLoading, setDealsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState(null);
    const [confirmProcessing, setConfirmProcessing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDealId, setCurrentDealId] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [users, setUsers] = useState([]);
    const [relatedActs, setRelatedActs] = useState({});
    const [pendingDealId, setPendingDealId] = useState(null);

  useEffect(() => {
    const state = location.state;
    const dealIdFromState = state?.dealID;
    
    // Handle case where only dealID is passed (e.g., from AdminAccounts related activities)
    if (dealIdFromState && !state?.openDealModal) {
      setPendingDealId(dealIdFromState);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
  }, [location, navigate])

   useEffect(() => {
      if (pendingDealId && deals?.length > 0 && !dealsLoading) {
        const foundDeal = deals.find((deal) => deal.id === pendingDealId);
        if (foundDeal) {
          setSelectedDeal(foundDeal); // Open in view mode

        } else {
          toast.error("Deal not found.");
        }
        setPendingDealId(null); // Clear pending deal ID
      }
    }, [pendingDealId, deals, dealsLoading]);

    const [dealForm, setDealForm] = useState({
        id: null,
        name: "",
        account_id: "",
        primary_contact_id: "",
        stage: "PROPOSAL",
        amount: "",
        close_date: "",
        assigned_to: "",
        currency: "PHP",
        description: "",
    });
    const [currentAccount, setCurrentAccount] = useState(null);
    const [currentContact, setCurrentContact] = useState(null);


    // Filtered deals
    const stageMap = {
        "Prospecting Stage": "PROSPECTING",
        "Qualification Stage": "QUALIFICATION",
        "Proposal Stage": "PROPOSAL",
        "Negotiation Stage": "NEGOTIATION",
        "Closed Won Stage": "CLOSED_WON",
        "Closed Lost Stage": "CLOSED_LOST",
        "Closed Cancelled Stage": "CLOSED_CANCELLED",
    };

    const formatStageName = (stage) => {
        const stageNames = {
            "PROSPECTING": "Prospecting",
            "QUALIFICATION": "Qualification",
            "PROPOSAL": "Proposal",
            "NEGOTIATION": "Negotiation",
            "CLOSED_WON": "Closed Won",
            "CLOSED_LOST": "Closed Lost",
            "CLOSED_CANCELLED": "Closed Cancelled",
        };
        return stageNames[stage] || stage || "--";
    };

    const getStageBadgeClasses = (stage) => {
        const stageColors = {
            "PROSPECTING": "bg-blue-100 text-blue-700",
            "QUALIFICATION": "bg-yellow-100 text-yellow-700",
            "PROPOSAL": "bg-orange-100 text-orange-700",
            "NEGOTIATION": "bg-purple-100 text-purple-700",
            "CLOSED_WON": "bg-green-100 text-green-700",
            "CLOSED_LOST": "bg-red-100 text-red-700",
            "CLOSED_CANCELLED": "bg-red-100 text-red-700",
        };
        return stageColors[stage] || "bg-gray-100 text-gray-700";
    };

    const fetchRelatedActivities = useCallback(async (deal_id) => {
      try {
        const res = await api.get(`/activities/deal/${deal_id}`);
        setRelatedActs(res.data && typeof res.data === "object" ? res.data : {});
      } catch (err) {
        console.error(err);
        if (err.response?.status === 404) {
          console.warn("No activities found for this account.");
          setRelatedActs({});
        }
      }
    }, []);

    const filteredDeals = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const normalizedStageFilter = stageFilter.trim();
        const normalizedOwnerFilter = ownerFilter.trim();

        return (deals ?? []).filter((deal) => {
            const searchFields = [
                deal?.name,
                deal?.description,
                deal?.account?.name,
                deal?.contact?.first_name,
                deal?.contact?.last_name,
                deal?.assigned_deals?.first_name,
                deal?.assigned_deals?.last_name,
            ];

            const matchesSearch =
                normalizedQuery === "" ||
                searchFields.some((field) => {
                    if (field === null || field === undefined || field === "")
                        return false;
                    return field.toString().toLowerCase().includes(normalizedQuery);
                });

            const matchesStage =
                normalizedStageFilter === "Filter by Stage" ||
                normalizedStageFilter === "" ||
                deal.stage === stageMap[normalizedStageFilter] ||
                deal.stage === normalizedStageFilter;

            const matchesOwner =
                normalizedOwnerFilter === "Filter by Owner" ||
                normalizedOwnerFilter === "" ||
                `${deal.assigned_deals?.first_name || ""} ${deal.assigned_deals?.last_name || ""}`.trim().toLowerCase() ===
                normalizedOwnerFilter.toLowerCase();

            return matchesSearch && matchesStage && matchesOwner;
        });
    }, [deals, searchQuery, stageFilter, ownerFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredDeals.length / itemsPerPage) || 1
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, stageFilter, ownerFilter]);

    useEffect(() => {
        setCurrentPage((prev) => {
            const maxPage = Math.max(
                1,
                Math.ceil(filteredDeals.length / itemsPerPage) || 1
            );
            return prev > maxPage ? maxPage : prev;
        });
    }, [filteredDeals.length]);

    const paginatedDeals = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredDeals.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredDeals, currentPage]);

    const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () =>
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));



    // Handlers
    const openNewDealModal = () => {
        setDealForm({
            id: null,
            name: "",
            account_id: "",
            primary_contact_id: "",
            stage: "PROPOSAL",
            amount: "",
            close_date: "",
            assigned_to: "",
            currency: "PHP",
            description: "",
        });
        setIsEditing(false);
        setCurrentDealId(null);
        setShowDealModal(true);
    };

    const fetchDeals = async () => {
        setDealsLoading(true);
        try {
            const res = await api.get(`/deals/admin/fetch-all`);
            const data = Array.isArray(res.data) ? res.data : [];
            // Sort by created_at descending (most recent first)
            const sorted = [...data].sort((a, b) => {
                const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
                const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
                return bDate - aDate;
            });
            setDeals(sorted);
        } catch (err) {
            if (err.response && err.response.status === 403) {
                toast.error("Permission denied. Only CEO, Admin, or Group Manager can access this page.");
            } else {
                toast.error("Failed to fetch deals. Please try again later.");
            }
            console.error(err);
        } finally {
            setDealsLoading(false);
        }
    }

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

    const fetchUsers = async () => {
        try {
            const res = await api.get(`/users/all`);
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 403) {
                toast.warn("Unable to load users (permission denied).");
            }
        }
    };

    useEffect(() => {
        fetchDeals();
        fetchAccounts();
        fetchContacts();
        fetchUsers();
    }, [])

    const openEditDealModal = async(deal) => {
        if (!deal) return;

        setDealForm({
            id: deal.id || null,
            name: deal.name || "",
            account_id: deal.account_id?.toString() || "",
            primary_contact_id: deal.primary_contact_id?.toString() || "",
            stage: deal.stage || "PROPOSAL",
            amount: deal.amount?.toString() || "",
            close_date: deal.close_date ? new Date(deal.close_date).toISOString().split('T')[0] : "",
            assigned_to: deal.assigned_to?.toString() || "",
            currency: deal.currency || "PHP",
            description: deal.description || "",
        });
        // Store the full account and contact objects for display
        setCurrentAccount(deal.account || null);
        setCurrentContact(deal.contact || null);
        setIsEditing(true);
        setCurrentDealId(deal.id);
        setSelectedDeal(null);
        setShowDealModal(true);
    };

    const openDetailsModal = (deal) => {
        setSelectedDeal(deal);
        setActiveTab("Overview");
    };

    const closeDetailsModal = () => {
        setSelectedDeal(null);
        setActiveTab("Overview");
    };

    const handleStatusUpdate = async (keepModalClosed = false) => {
        try {
            // Fetch the updated deal data
            const res = await api.get(`/deals/admin/fetch-all`);
            const data = Array.isArray(res.data) ? res.data : [];
            // Sort by created_at descending (most recent first)
            const sorted = [...data].sort((a, b) => {
                const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
                const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
                return bDate - aDate;
            });

            // Update the deals list with sorted data
            setDeals(sorted);

            // Only update selectedDeal if modal should stay open (not when closing)
            if (!keepModalClosed && selectedDeal && selectedDeal.id) {
                const updatedDeal = sorted.find(d => d.id === selectedDeal.id);
                if (updatedDeal) {
                    setSelectedDeal({ ...updatedDeal });
                }
            }
        } catch (err) {
            console.error("Failed to refresh deal data:", err);
            // Still try to refresh the deals list
            await fetchDeals();
        }
    };

    const handleInputChange = (key, value) => {
        setDealForm({ ...dealForm, [key]: value });
    };

    const handleDealSubmit = (formDataFromModal) => {
        const trimmedName = formDataFromModal.name.trim();
        if (!trimmedName) {
            toast.error("Deal name is required.");
            return;
        }
        if (!formDataFromModal.account_id) {
            toast.error("Account is required.");
            return;
        }

        const actionType = isEditing && currentDealId ? "update" : "create";
        const dealName = trimmedName;

        setConfirmModalData({
            title: actionType === "create" ? "Confirm New Deal" : "Confirm Update",
            message:
                actionType === "create" ? (
                    <span>
                        Are you sure you want to create{" "}
                        <span className="font-semibold">{dealName}</span>?
                    </span>
                ) : (
                    <span>
                        Save changes to <span className="font-semibold">{dealName}</span>?
                    </span>
                ),
            confirmLabel: actionType === "create" ? "Create Deal" : "Update Deal",
            cancelLabel: "Cancel",
            variant: "primary",
            action: {
                type: actionType,
                formData: formDataFromModal,
                targetId: currentDealId || null,
                name: dealName,
            },
        });
    };

    const handleDeleteDeal = (deal) => {
        if (!deal) return;
        const name = deal.name || "this deal";
        setConfirmModalData({
            title: "Delete Deal",
            message: (
                <span>
                    Are you sure you want to permanently delete{" "}
                    <span className="font-semibold">{name}</span>? This action cannot be
                    undone.
                </span>
            ),
            confirmLabel: "Delete Deal",
            cancelLabel: "Cancel",
            variant: "danger",
            action: {
                type: "delete",
                targetId: deal.id,
                name,
            },
        });
    };

    const handleConfirmAction = async () => {
        if (!confirmModalData?.action) {
            setConfirmModalData(null);
            return;
        }

        const { action } = confirmModalData;
        const { type, formData, targetId, name } = action;

        setConfirmProcessing(true);

        try {
            if (type === "create") {
                setIsSubmitting(true);
                // Prepare payload
                const payload = {
                    name: formData.name.trim(),
                    account_id: parseInt(formData.account_id),
                    primary_contact_id: formData.primary_contact_id ? parseInt(formData.primary_contact_id) : null,
                    stage: formData.stage,
                    amount: formData.amount ? parseFloat(formData.amount) : null,
                    currency: formData.currency || "PHP",
                    close_date: formData.close_date || null,
                    description: formData.description || null,
                    assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
                };
                await api.post(`/deals/admin/create`, payload);
                toast.success(`Deal "${name}" created successfully.`);
                setShowDealModal(false);
                await fetchDeals();
            } else if (type === "update") {
                if (!targetId) {
                    throw new Error("Missing deal identifier for update.");
                }
                setIsSubmitting(true);
                // Prepare payload - only include fields that are provided
                const payload = {};
                if (formData.name !== undefined) payload.name = formData.name.trim();
                if (formData.account_id !== undefined && formData.account_id !== "") payload.account_id = parseInt(formData.account_id);
                if (formData.primary_contact_id !== undefined) {
                    payload.primary_contact_id = formData.primary_contact_id ? parseInt(formData.primary_contact_id) : null;
                }
                if (formData.stage !== undefined) payload.stage = formData.stage;
                if (formData.amount !== undefined && formData.amount !== "") payload.amount = parseFloat(formData.amount);
                if (formData.currency !== undefined) payload.currency = formData.currency;
                if (formData.close_date !== undefined) payload.close_date = formData.close_date || null;
                if (formData.description !== undefined) payload.description = formData.description || null;
                if (formData.assigned_to !== undefined) {
                    payload.assigned_to = formData.assigned_to ? parseInt(formData.assigned_to) : null;
                }
                await api.put(`/deals/admin/${targetId}`, payload);
                toast.success(`Deal "${name}" updated successfully.`);
                setShowDealModal(false);
                await fetchDeals();
            } else if (type === "delete") {
                if (!targetId) {
                    throw new Error("Missing deal identifier for deletion.");
                }
                await api.delete(`/deals/admin/${targetId}`);
                toast.success(`Deal "${name}" deleted successfully.`);
                if (selectedDeal?.id === targetId) {
                    setSelectedDeal(null);
                }
                await fetchDeals();
            }
        } catch (err) {
            console.error(err);
            const defaultMessage =
                type === "create"
                    ? "Failed to create deal. Please review the details and try again."
                    : type === "update"
                        ? "Failed to update deal. Please review the details and try again."
                        : "Failed to delete deal. Please try again.";
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

    const closeModal = () => {
        setShowDealModal(false);
        setDealForm({
            id: null,
            name: "",
            account_id: "",
            primary_contact_id: "",
            stage: "PROPOSAL",
            amount: "",
            close_date: "",
            assigned_to: "",
            currency: "PHP",
            description: "",
        });
        setCurrentAccount(null);
        setCurrentContact(null);
        setIsEditing(false);
        setCurrentDealId(null);
        setIsSubmitting(false);
    };

    const handleBackdropClick = (e) => {
        if (e.target.id === "modalBackdrop") closeModal();
    };

    const prospecting = (deals ?? []).filter((d) => d.stage === "PROSPECTING").length;
    const qualification = (deals ?? []).filter((d) => d.stage === "QUALIFICATION").length;
    const proposal = (deals ?? []).filter((d) => d.stage === "PROPOSAL").length;
    const negotiation = (deals ?? []).filter((d) => d.stage === "NEGOTIATION").length;
    const closedWon = (deals ?? []).filter((d) => d.stage === "CLOSED_WON").length;
    const closedLost = (deals ?? []).filter((d) => d.stage === "CLOSED_LOST").length;
    const closedCancelled = (deals ?? []).filter((d) => d.stage === "CLOSED_CANCELLED").length;


    const metricCards = [
        {
            title: "Prospecting",
            value: prospecting,
            icon: LuUserSearch,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            title: "Qualification",
            value: qualification,
            icon: FiEdit,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
        },
        {
            title: "Proposal",
            value: proposal,
            icon: FiBriefcase,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
        },
        {
            title: "Negotiation",
            value: negotiation,
            icon: FiTrendingUp,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
        },
        {
            title: "Closed Won",
            value: closedWon,
            icon: FiCheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            title: "Closed Lost",
            value: closedLost,
            icon: FiXCircle,
            color: "text-red-600",
            bgColor: "bg-red-100",
        },
        {
            title: "Closed Cancelled",
            value: closedCancelled,
            icon: FiXCircle,
            color: "text-gray-600",
            bgColor: "bg-gray-100",
        },
    ];


    return (
        <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
            {dealsLoading && <LoadingSpinner message="Loading deals..." />}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
                    <FiBriefcase className="mr-2 text-blue-600" />
                    Deals
                </h1>

                <div className="flex justify-center lg:justify-end w-full sm:w-auto">
                    <button
                        onClick={openNewDealModal}
                        className="flex items-center bg-black text-white px-3 sm:px-4 py-2 lg:my-0 rounded-md hover:bg-gray-800 text-sm sm:text-base mx-auto sm:ml-auto cursor-pointer"
                    >
                        <FiPlus className="mr-2" /> Add Deal
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 p-2 lg:grid-cols-4 gap-4 mb-6 w-full break-words overflow-hidden">
                {metricCards.map((metric) => (
                    <MetricCard key={metric.title} {...metric} />
                ))}
            </div>


            <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
                <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
                    <FiSearch size={20} className="text-gray-400 mr-3" />
                    <input
                        type="text"
                        placeholder="Search deals"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="focus:outline-none text-base w-full"
                    />
                </div>
                <div className="w-full lg:w-auto flex flex-col lg:flex-row gap-3">
                    <select
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full lg:w-40 focus:ring-2 focus:ring-indigo-500 transition"
                    >
                        <option value="Filter by Stage">Filter by Stage</option>
                        <option value="Prospecting Stage">Prospecting</option>
                        <option value="Qualification Stage">Qualification</option>
                        <option value="Proposal Stage">Proposal</option>
                        <option value="Negotiation Stage">Negotiation</option>
                        <option value="Closed Won Stage">Closed Won</option>
                        <option value="Closed Lost Stage">Closed Lost</option>
                        <option value="Closed Cancelled Stage">Closed Cancelled</option>

                    </select>
                    <select
                        value={ownerFilter}
                        onChange={(e) => setOwnerFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full lg:w-40 focus:ring-2 focus:ring-indigo-500 transition"
                    >
                        <option value="Filter by Owner">Filter by Owner</option>
                        {[...new Set((deals ?? []).map(
                            deal => `${deal.assigned_deals?.first_name} ${deal.assigned_deals?.last_name}`
                        ))].map((owner, i) => (
                            <option key={i} value={owner}>{owner}</option>
                        ))}
                    </select>
                </div>
            </div>


            <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
                    <thead className="bg-gray-100 text-left text-gray-600 text-sm tracking-wide font-semibold">
                        <tr>
                            <th className="py-3 px-4">Deal ID</th>
                            <th className="py-3 px-4 truncate">Deal Name</th>
                            <th className="py-3 px-4">Account</th>
                            <th className="py-3 px-4">Contact</th>
                            <th className="py-3 px-4">Stage</th>
                            <th className="py-3 px-4">Value</th>
                            <th className="py-3 px-4">Close Date</th>
                            <th className="py-3 px-4">Owner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDeals.length > 0 ? (
                            paginatedDeals.map((deal) => (
                                <tr
                                    key={deal.id}
                                    className="hover:bg-gray-50 text-sm cursor-pointer"
                                    onClick={() => {
                                        // Force re-render by creating a new object reference
                                        setSelectedDeal({ ...deal });
                                        fetchRelatedActivities(deal.id);
                                    }}
                                >
                                    <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                                        {deal.deal_id ? deal.deal_id.replace(/D(\d+)-\d+-/, "D$1-") : "--"}
                                    </td>

                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium text-blue-600 hover:underline break-all text-sm">
                                                {deal.name}
                                            </div>
                                            <div className="text-gray-500 text-xs break-all">
                                                {deal.description || "--"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                                        {deal.account?.name || "--"}
                                    </td>
                                    <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                                        {deal.contact?.first_name && deal.contact?.last_name
                                            ? `${deal.contact.first_name} ${deal.contact.last_name}`
                                            : deal.contact?.first_name || deal.contact?.last_name || "--"}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageBadgeClasses(deal.stage)}`}>
                                            {formatStageName(deal.stage)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                                        ₱ {deal.amount?.toLocaleString() || "0"}
                                    </td>
                                    <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                                        {deal.close_date || "--"}
                                    </td>
                                    <td className="py-3 px-4 text-gray-800 font-medium text-sm">
                                        {deal.assigned_deals?.first_name && deal.assigned_deals?.last_name
                                            ? `${deal.assigned_deals.first_name} ${deal.assigned_deals.last_name}`
                                            : deal.assigned_deals?.first_name || deal.assigned_deals?.last_name || "--"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    className="py-4 px-4 text-center text-sm text-gray-500"
                                    colSpan={8}
                                >
                                    No deals found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <PaginationControls
                className="mt-4"
                totalItems={filteredDeals.length}
                pageSize={itemsPerPage}
                currentPage={currentPage}
                onPrev={handlePrevPage}
                onNext={handleNextPage}
                onPageSizeChange={(newSize) => {
                  setItemsPerPage(newSize);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[10, 20, 30, 40, 50]}
                label="deals"
            />

            {/* Modal: Create/Edit Deal */}
            {showDealModal && (
                <CreateDealModal
                    onClose={closeModal}
                    formData={dealForm}
                    setFormData={setDealForm}
                    isEditing={isEditing}
                    onSubmit={handleDealSubmit}
                    isSubmitting={isSubmitting || confirmProcessing}
                    accounts={accounts}
                    contacts={contacts}
                    users={users}
                    currentAccount={currentAccount}
                    currentContact={currentContact}
                />
            )}

            {/* Modal: Selected Deal Info */}
            {selectedDeal && (
                <ManagerDealsInformation
                    relatedActs={relatedActs}
                    selectedDeal={selectedDeal}
                    show={!!selectedDeal}
                    onClose={() => setSelectedDeal(null)}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onEdit={openEditDealModal}
                    onDelete={handleDeleteDeal}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[10000]">
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

function CreateDealModal({
    onClose,
    formData: externalFormData,
    setFormData: setExternalFormData,
    isEditing = false,
    onSubmit,
    isSubmitting = false,
    accounts = [],
    contacts = [],
    users = [],
    currentAccount = null,
    currentContact = null,
}) {

    //validation 
const [isSubmitted, setIsSubmitted] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);  

       if (!externalFormData.name?.trim()) {
        toast.error("Deal name is required.");
        return;
    }

    const amount = Number(externalFormData.amount);
    if (!externalFormData.amount || isNaN(amount) || amount <= 0) {
        toast.error("Amount must be a number greater than 0.");
        return;
    }

    if (!externalFormData.account_id) {
        toast.error("Please select an account.");
        return;
    }

    if (!externalFormData.primary_contact_id) {
        toast.error("Please select a primary contact.");
        return;
    }

    if (!externalFormData.assigned_to) {
        toast.error("Please assign this deal to a user.");
        return;
    }

    onSubmit?.(externalFormData);
};

    const handleBackdropClick = (e) => {
        if (e.target.id === "modalBackdrop") {
            onClose();
        }
    };

    const filteredContacts = useMemo(() => {
        const selectedAccountId = String(externalFormData.account_id || "").trim();
        const base = Array.isArray(contacts) ? contacts : [];

        if (!selectedAccountId) return base;

        return base.filter((c) => {
            const candidates = [
                c?.account_id,
                c?.accountId,
                c?.account?.id,
                c?.account?.account_id,
                c?.account?.accountId,
            ];
            const found = candidates.find(
                (v) => v !== null && v !== undefined && String(v).trim() !== ""
            );
            return found ? String(found) === selectedAccountId : false;
        });
    }, [contacts, externalFormData.account_id]);

    useEffect(() => {
        const selectedAccountId = String(externalFormData.account_id || "").trim();
        const selectedContactId = String(
            externalFormData.primary_contact_id || ""
        ).trim();

        if (!selectedContactId) return;
        if (!selectedAccountId) return;

        const stillValid = filteredContacts.some(
            (c) => String(c?.id) === selectedContactId
        );

        if (!stillValid) {
            setExternalFormData((prev) => ({ ...prev, primary_contact_id: "" }));
        }
    }, [
        externalFormData.account_id,
        externalFormData.primary_contact_id,
        filteredContacts,
        setExternalFormData,
    ]);

    return (
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
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
                >
                    <FiX size={22} />
                </button>

                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
                    {isEditing ? "Edit Deal" : "Create Deal"}
                </h2>

                <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
                    onSubmit={handleSubmit}
                    noValidate  
                >
                    <InputField
                        label="Deal Name"
                        name="name"
                        value={externalFormData.name}
                        onChange={(e) => setExternalFormData({ ...externalFormData, name: e.target.value })}
                        placeholder="Enter deal name"
                        required
                        isSubmitted={isSubmitted}
                        className="md:col-span-2"
                    />
                    <SearchableSelectField
                        label="Account"
                        value={externalFormData.account_id || ""}
                        onChange={(newId) =>
                            setExternalFormData({
                                ...externalFormData,
                                account_id: newId,
                            })
                        }
                        items={accounts || []}
                        getLabel={(item) => item?.name ?? ""}
                        placeholder="Search account..."
                        disabled={isSubmitting}
                        currentItem={currentAccount}
                         required={true}               
                        isSubmitted={isSubmitted}     
                    />
                    <SearchableSelectField
                        label="Primary Contact"
                        value={externalFormData.primary_contact_id || ""}
                        onChange={(newId) =>
                            setExternalFormData({
                                ...externalFormData,
                                primary_contact_id: newId,
                            })
                        }
                        items={filteredContacts || []}
                        getLabel={(item) => {
                            const name = `${item?.first_name ?? ""} ${item?.last_name ?? ""}`.trim();
                            return name || item?.email || "";
                        }}
                        placeholder="Search contact..."
                        disabled={isSubmitting}
                        currentItem={currentContact}
                        required={true}               // <-- use required directly
                        isSubmitted={isSubmitted}     
                    />
                    
                    <SelectField
                        label="Stage"
                        name="stage"
                        value={externalFormData.stage}
                        onChange={(e) => setExternalFormData({ ...externalFormData, stage: e.target.value })}
                        options={[
                            { value: "PROSPECTING", label: "Prospecting" },
                            { value: "QUALIFICATION", label: "Qualification" },
                            { value: "PROPOSAL", label: "Proposal" },
                            { value: "NEGOTIATION", label: "Negotiation" },
                            { value: "CLOSED_WON", label: "Closed Won" },
                            { value: "CLOSED_LOST", label: "Closed Lost" },
                            { value: "CLOSED_CANCELLED", label: "Closed Cancelled" },

                        ]}
                        disabled={isSubmitting}
                    />
                    <InputField
                        label="Amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        value={externalFormData.amount}
                        onChange={(e) => setExternalFormData({ ...externalFormData, amount: e.target.value })}
                        placeholder="₱0"
                         required
                        isSubmitted={isSubmitted}
                    />
                    <SelectField
                        label="Currency"
                        name="currency"
                        value={externalFormData.currency || "PHP"}
                        onChange={(e) => setExternalFormData({ ...externalFormData, currency: e.target.value })}
                        options={[
                            { value: "PHP", label: "PHP" },
                            { value: "USD", label: "USD" },
                        ]}
                        disabled={isSubmitting}
                    />
                    <InputField
                        label="Close Date"
                        name="close_date"
                        type="date"
                        value={externalFormData.close_date || ""}
                        onChange={(e) => setExternalFormData({ ...externalFormData, close_date: e.target.value })}
                        disabled={isSubmitting}
                    />
                    <SearchableSelectField
                        label="Assign To"
                        value={externalFormData.assigned_to || ""}
                        onChange={(newId) =>
                            setExternalFormData({
                                ...externalFormData,
                                assigned_to: newId,
                            })
                        }
                        items={users || []}
                        getLabel={(item) => {
                            const name = `${item?.first_name ?? ""} ${item?.last_name ?? ""}`.trim();
                            return name || item?.email || "";
                        }}
                        placeholder="Search assignee..."
                        disabled={isSubmitting}
                        required={true}              
                        isSubmitted={isSubmitted}   
                        className="md:col-span-2"
                    />
                    <TextareaField
                        label="Description"
                        name="description"
                        value={externalFormData.description}
                        onChange={(e) => setExternalFormData({ ...externalFormData, description: e.target.value })}
                        placeholder="Additional details..."
                        rows={3}
                        className="md:col-span-2"
                        disabled={isSubmitting}
                    />

                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 md:col-span-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition disabled:opacity-70"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition disabled:opacity-70"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Saving..."
                                : isEditing
                                    ? "Update Deal"
                                    : "Save Deal"}
                        </button>
                    </div>
                </form>
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
    isSubmitted = false, 
}) {
     const hasError = isSubmitted && !value?.trim();

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
                required={required}
                disabled={disabled}
                  className={`w-full rounded-md px-2 py-1.5 text-sm outline-none border focus:ring-2
          ${hasError
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-400"
          }
          ${className}
        `}/>  
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
    className = "",
}) {
    return (
        <div className={className}>
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

function SearchableSelectField({
    label,
    items = [],
    value = "",
    onChange,
    getLabel,
    placeholder = "Search...",
    disabled = false,
    className = "",
    currentItem = null,
  required = false,
  isSubmitted = false,
}) {
  const hasError = isSubmitted && required && !value;

    return (
        <div className={className}>
            <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label} {required && <span className="text-red-500">*</span>}
            </label>
            <SearchableSelect
                items={items}
                value={value ?? ""}
                onChange={onChange}
                getLabel={getLabel}
                placeholder={placeholder}
                disabled={disabled}
                currentItem={currentItem}
                hasError={hasError} 
            />
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
    currentItem = null,
     hasError = false,  
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const wrapRef = useRef(null);

    const selectedItem = items.find((it) => String(it.id) === String(value));
    // Use currentItem if the selected item is not in the items list (e.g., due to permissions)
    const displayItem = selectedItem || currentItem;
    const selectedLabel = displayItem ? getLabel(displayItem) : "";

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
            className={`w-full border rounded-md px-2 py-1.5 text-sm outline-none focus:ring-2
          ${hasError
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-400"
          }`}/>


            {open && !disabled && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                    <div className="max-h-56 overflow-y-auto hide-scrollbar">
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

function TextareaField({
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
