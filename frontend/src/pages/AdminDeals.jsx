import React, { useState, useEffect, useMemo } from "react";
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
import AdminDealsInformation from "../components/AdminDealsInformation";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const ITEMS_PER_PAGE = 10;

export default function AdminDeals() {
    useEffect(() => {
        document.title = "Deals | Sari-Sari CRM";
    }, []);

    const [searchQuery, setSearchQuery] = useState("");
    const [stageFilter, setStageFilter] = useState("Filter by Stage");
    const [ownerFilter, setOwnerFilter] = useState("Filter by Owner");
    const [selectedDeal, setSelectedDeal] = useState(null);
    const [activeTab, setActiveTab] = useState("Overview");
    const [showDealModal, setShowDealModal] = useState(false);
    const [deals, setDeals] = useState(null);
    const [dealsLoading, setDealsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState(null);
    const [confirmProcessing, setConfirmProcessing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDealId, setCurrentDealId] = useState(null);

    const [dealForm, setDealForm] = useState({
        id: null,
        name: "",
        account: "",
        contact: "",
        stage: "Proposal Stage",
        value: "",
        closeDate: "",
        owner: "",
        status: "Proposal",
        progress: 0,
        description: "",
        phone: "",
        email: "",
    });


    // Filtered deals
    const stageMap = {
        "Prospecting Stage": "PROSPECTING",
        "Qualification Stage": "QUALIFICATION",
        "Proposal Stage": "PROPOSAL",
        "Negotiation Stage": "NEGOTIATION",
        "Closed Won Stage": "CLOSED_WON",
        "Closed Lost Stage": "CLOSED_LOST",
    };

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
                deal.stage === stageMap[normalizedStageFilter];

            const matchesOwner =
                normalizedOwnerFilter === "Filter by Owner" ||
                normalizedOwnerFilter === "" ||
                `${deal.assigned_deals?.first_name} ${deal.assigned_deals?.last_name}`.toLowerCase() ===
                normalizedOwnerFilter.toLowerCase();

            return matchesSearch && matchesStage && matchesOwner;
        });
    }, [deals, searchQuery, stageFilter, ownerFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredDeals.length / ITEMS_PER_PAGE) || 1
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, stageFilter, ownerFilter]);

    useEffect(() => {
        setCurrentPage((prev) => {
            const maxPage = Math.max(
                1,
                Math.ceil(filteredDeals.length / ITEMS_PER_PAGE) || 1
            );
            return prev > maxPage ? maxPage : prev;
        });
    }, [filteredDeals.length]);

    const paginatedDeals = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredDeals.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredDeals, currentPage]);

    const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () =>
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));



    // Handlers
    const openNewDealModal = () => {
        setDealForm({
            id: null,
            name: "",
            account: "",
            contact: "",
            stage: "Proposal Stage",
            value: "",
            closeDate: "",
            owner: "",
            status: "Proposal",
            progress: 0,
            description: "",
            phone: "",
            email: "",
        });
        setIsEditing(false);
        setCurrentDealId(null);
        setShowDealModal(true);
    };

    const fetchDeals = async () => {
        setDealsLoading(true);
        try {
            const res = await api.get(`/deals/admin/fetch-all`);
            setDeals(res.data)
        } catch (err) {
            if (err.response && err.response.status === 403) {
                toast.error("Permission denied. Only CEO, Admin, or Group Manager can access this page.");
            } else {
                toast.error("Failed to fetch accounts. Please try again later.");
            }
            console.error(err);
        } finally {
            setDealsLoading(false);
        }
    }

    useEffect(() => {
        fetchDeals();
    }, [])

    const openEditDealModal = (deal) => {
        if (!deal) return;
        setDealForm({
            id: deal.id || null,
            name: deal.name || "",
            account: deal.account?.name || "",
            contact: deal.contact?.first_name && deal.contact?.last_name 
                ? `${deal.contact.first_name} ${deal.contact.last_name}` 
                : deal.contact?.first_name || "",
            stage: deal.stage || "Proposal Stage",
            value: deal.amount?.toString() || "",
            closeDate: deal.close_date || "",
            owner: deal.assigned_deals?.first_name && deal.assigned_deals?.last_name
                ? `${deal.assigned_deals.first_name} ${deal.assigned_deals.last_name}`
                : deal.assigned_deals?.first_name || "",
            status: deal.status || "Proposal",
            progress: deal.progress || 0,
            description: deal.description || "",
            phone: deal.contact?.work_phone || "",
            email: deal.contact?.email || "",
        });
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

    const handleInputChange = (key, value) => {
        setDealForm({ ...dealForm, [key]: value });
    };

    const handleDealSubmit = (formDataFromModal) => {
        const trimmedName = formDataFromModal.name.trim();
        if (!trimmedName) {
            toast.error("Deal name is required.");
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
                // TODO: Replace with actual API call
                // await api.post(`/deals/create`, formData);
                setDeals([...(deals ?? []), { ...formData, id: (deals?.length ?? 0) + 1 }]);
                toast.success(`Deal "${name}" created successfully.`);
                setShowDealModal(false);
                await fetchDeals();
            } else if (type === "update") {
                if (!targetId) {
                    throw new Error("Missing deal identifier for update.");
                }
                setIsSubmitting(true);
                // TODO: Replace with actual API call
                // await api.put(`/deals/${targetId}`, formData);
                setDeals((prev) =>
                    prev.map((d) => (d.id === targetId ? { ...formData, id: targetId } : d))
                );
                toast.success(`Deal "${name}" updated successfully.`);
                setShowDealModal(false);
                await fetchDeals();
            } else if (type === "delete") {
                if (!targetId) {
                    throw new Error("Missing deal identifier for deletion.");
                }
                // TODO: Replace with actual API call
                // await api.delete(`/deals/${targetId}`);
                setDeals((prev) => prev.filter((d) => d.id !== targetId));
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
            account: "",
            contact: "",
            stage: "Proposal Stage",
            value: "",
            closeDate: "",
            owner: "",
            status: "Proposal",
            progress: 0,
            description: "",
            phone: "",
            email: "",
        });
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
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
            {dealsLoading && <LoadingSpinner message="Loading deals..." />}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
                    <FiBriefcase className="mr-2 text-blue-600" />
                    Deals
                </h1>

                <button
                    onClick={openNewDealModal}
                    className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base ml-auto sm:ml-0"
                >
                    <FiPlus className="mr-2" /> Add Deal
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
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
                            <th className="py-3 px-4">Deal Name</th>
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
                                    }}
                                >
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
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                            {deal.stage || "--"}
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
                                    colSpan={7}
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
                pageSize={ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPrev={handlePrevPage}
                onNext={handleNextPage}
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
                />
            )}

            {/* Modal: Selected Deal Info */}
            {selectedDeal && (
                <AdminDealsInformation
                    selectedDeal={selectedDeal}
                    show={!!selectedDeal}
                    onClose={() => setSelectedDeal(null)}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onEdit={openEditDealModal}
                    onDelete={handleDeleteDeal}
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

function CreateDealModal({
    onClose,
    formData: externalFormData,
    setFormData: setExternalFormData,
    isEditing = false,
    onSubmit,
    isSubmitting = false,
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(externalFormData);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target.id === "modalBackdrop") {
            onClose();
        }
    };

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
                >
                    <InputField
                        label="Deal Name"
                        name="name"
                        value={externalFormData.name}
                        onChange={(e) => setExternalFormData({ ...externalFormData, name: e.target.value })}
                        placeholder="Enter deal name"
                        required
                        disabled={isSubmitting}
                        className="md:col-span-2"
                    />
                    <SelectField
                        label="Account"
                        name="account"
                        value={externalFormData.account || ""}
                        onChange={(e) => setExternalFormData({ ...externalFormData, account: e.target.value })}
                        options={[
                            { value: "", label: "Select Account" },
                            { value: "Gertan Corp.", label: "Gertan Corp." },
                            { value: "ABC Company", label: "ABC Company" },
                        ]}
                        disabled={isSubmitting}
                    />
                    <SelectField
                        label="Primary Contact"
                        name="contact"
                        value={externalFormData.contact || ""}
                        onChange={(e) => setExternalFormData({ ...externalFormData, contact: e.target.value })}
                        options={[
                            { value: "", label: "Select Contact" },
                            { value: "Joshua M.", label: "Joshua M." },
                            { value: "Marcus Lee", label: "Marcus Lee" },
                        ]}
                        disabled={isSubmitting}
                    />
                    <SelectField
                        label="Stage"
                        name="stage"
                        value={externalFormData.stage}
                        onChange={(e) => setExternalFormData({ ...externalFormData, stage: e.target.value })}
                        options={[
                            { value: "Proposal Stage", label: "Proposal Stage" },
                            { value: "Negotiation Stage", label: "Negotiation Stage" },
                            { value: "Closed Won", label: "Closed Won" },
                            { value: "Closed Lost", label: "Closed Lost" },
                        ]}
                        disabled={isSubmitting}
                    />
                    <InputField
                        label="Amount"
                        name="value"
                        type="number"
                        value={externalFormData.value}
                        onChange={(e) => setExternalFormData({ ...externalFormData, value: e.target.value })}
                        placeholder="₱0"
                        disabled={isSubmitting}
                    />
                    <SelectField
                        label="Currency"
                        name="currency"
                        value={externalFormData.currency || ""}
                        onChange={(e) => setExternalFormData({ ...externalFormData, currency: e.target.value })}
                        options={[
                            { value: "", label: "Select Currency" },
                            { value: "PHP", label: "PHP" },
                            { value: "USD", label: "USD" },
                        ]}
                        disabled={isSubmitting}
                    />
                    <SelectField
                        label="Assign To"
                        name="owner"
                        value={externalFormData.owner}
                        onChange={(e) => setExternalFormData({ ...externalFormData, owner: e.target.value })}
                        options={[
                            { value: "", label: "Assign To" },
                            { value: "Dinosaur Roar", label: "Dinosaur Roar" },
                            { value: "Marcus Lee", label: "Marcus Lee" },
                        ]}
                        disabled={isSubmitting}
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