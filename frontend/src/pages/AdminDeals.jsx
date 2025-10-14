import React, { useState } from "react";
import { FiEdit, FiTrash2, FiBriefcase, FiX, FiSearch, } from "react-icons/fi";
import AdminDealsInformation from "../components/AdminDealsInformation";


export default function AdminDeals() {
    const [searchQuery, setSearchQuery] = useState("");
    const [stageFilter, setStageFilter] = useState("");
    const [ownerFilter, setOwnerFilter] = useState("");
    const [selectedDeal, setSelectedDeal] = useState(null);
    const [activeTab, setActiveTab] = useState("Overview");
    const [showDealModal, setShowDealModal] = useState(false);

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

    const [deals, setDeals] = useState([
        {
            id: 1,
            name: "Enterprise ni Dinosaur Tuberow",
            account: "Gertan Corp.",
            contact: "Joshua M.",
            stage: "Proposal Stage",
            value: 200000,
            closeDate: "January 12, 2026",
            owner: "Dinosaur Roar",
            status: "Proposal",
            progress: 75,
            description:
                "Annual enterprise software license renewal with additional modules.",
            phone: "+6373737373",
            email: "jesselle@example.com",
        },
        {
            id: 2,
            name: "Enterprise ni Dinosaur Tuberow",
            account: "Gertan Corp.",
            contact: "Joshua M.",
            stage: "Proposal Stage",
            value: 200000,
            closeDate: "January 12, 2026",
            owner: "Dinosaur Roar",
            status: "Proposal",
            progress: 75,
            description:
                "Annual enterprise software license renewal with additional modules.",
            phone: "+6373737373",
            email: "jesselle@example.com",
        },
    ]);

    // Filtered deals
    const filteredDeals = deals.filter((deal) => {
        const matchesSearch =
            searchQuery === "" ||
            deal.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStage = stageFilter === "" || deal.stage === stageFilter;
        const matchesOwner = ownerFilter === "" || deal.owner === ownerFilter;
        return matchesSearch && matchesStage && matchesOwner;
    });

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
        setShowDealModal(true);
    };

    const openEditDealModal = (deal) => {
        setDealForm(deal);
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

    const handleDealSubmit = (e) => {
        e.preventDefault();
        if (dealForm.id) {
            setDeals((prev) =>
                prev.map((d) => (d.id === dealForm.id ? dealForm : d))
            );
        } else {
            setDeals([...deals, { ...dealForm, id: deals.length + 1 }]);
        }
        setShowDealModal(false);
    };

    return (
        <div className="min-h-screen p-6 font-inter">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                    <FiBriefcase className="text-blue-600" />
                    Deals Management
                </h1>
                <button
                    onClick={openNewDealModal}
                    className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
                >
                    + New Deal
                </button>
            </div>

            {/* Summary Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-start">
                    <span className="text-sm text-gray-500">Total Deals</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-start">
                    <span className="text-sm text-gray-500"></span>
                    <span className="text-xl font-semibold text-orange-500">
                    </span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-start">
                    <span className="text-sm text-gray-500"></span>
                    <span className="text-xl font-semibold text-blue-500">
                    </span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-start">
                    <span className="text-sm text-gray-500"></span>
                    <span className="text-xl font-semibold text-green-500">
                    </span>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
                <div className="relative w-full lg:w-1/3">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search Deals..."
                        className="border border-gray-300 bg-white rounded-md px-10 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-4">
                    <select
                        className="border border-gray-300 rounded-md px-4 py-2 text-sm bg-white"
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                    >
                        <option value="">Filter by Stage</option>
                        <option value="Proposal Stage">Proposal Stage</option>
                        <option value="Negotiation Stage">Negotiation Stage</option>
                    </select>
                    <select
                        className="border border-gray-300 rounded-md px-4 py-2 text-sm bg-white"
                        value={ownerFilter}
                        onChange={(e) => setOwnerFilter(e.target.value)}
                    >
                        <option value="">Filter by Owner</option>
                        <option value="Dinosaur Roar">Dinosaur Roar</option>
                        <option value="Marcus Lee">Marcus Lee</option>
                    </select>
                </div>
            </div>

            {/* Deals Table */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full bg-white text-left table-auto mt-5">
                    <thead className="bg-gray-100 text-sm text-gray-600 sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-4 font-medium">Deal Name</th>
                            <th className="py-3 px-4 font-medium">Account</th>
                            <th className="py-3 px-4 font-medium">Contact</th>
                            <th className="py-3 px-4 font-medium">Stage</th>
                            <th className="py-3 px-4 font-medium">Value</th>
                            <th className="py-3 px-4 font-medium">Close Date</th>
                            <th className="py-3 px-4 font-medium">Owner</th>
                            <th className="py-3 px-4 font-medium text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs">
                        {filteredDeals.length > 0 ? (
                            filteredDeals.map((deal, index) => {
                                const isEven = index % 2 === 0;
                                return (
                                    <tr
                                        key={deal.id}
                                        onClick={() => openDetailsModal(deal)}
                                        className={`border-b border-gray-200 cursor-pointer ${isEven ? "bg-white hover:bg-gray-200" : "bg-yellow-50 hover:bg-yellow-200"
                                            }`}
                                    >
                                        <td className="py-3 px-4">{deal.name}</td>
                                        <td className="py-3 px-4">{deal.account}</td>
                                        <td className="py-3 px-4">{deal.contact}</td>
                                        <td className="py-3 px-4 text-orange-500">{deal.stage}</td>
                                        <td className="py-3 px-4">₱ {deal.value.toLocaleString()}</td>
                                        <td className="py-3 px-4">{deal.closeDate}</td>
                                        <td className="py-3 px-4">{deal.owner}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditDealModal(deal);
                                                    }}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <FiEdit />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeals(deals.filter((d) => d.id !== deal.id));
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" className="text-center py-6 text-gray-500">
                                    No deals found
                                </td>
                            </tr>
                        )}
                    </tbody>



                </table>
            </div>

            {/* Deal Details Modal */}
            <AdminDealsInformation
                selectedDeal={selectedDeal}
                show={!!selectedDeal}
                onClose={closeDetailsModal}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* Add/Edit Deal Modal */}
            {showDealModal && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowDealModal(false)}
                >
                    <div
                        className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-5 sm:p-6 relative border border-gray-200 scale-[0.95]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowDealModal(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-black transition"
                        >
                            <FiX size={20} />
                        </button>

                        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                            {dealForm.id ? "Edit Deal" : "Add New Deal"}
                        </h2>

                        <form
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"
                            onSubmit={handleDealSubmit}
                        >
                            {[
                                { label: "Deal Name", key: "name", type: "text" },
                                { label: "Account", key: "account", type: "text" },
                                { label: "Contact", key: "contact", type: "text" },
                                {
                                    label: "Stage",
                                    key: "stage",
                                    type: "select",
                                    options: ["Proposal Stage", "Negotiation Stage", "Closed Won", "Closed Lost"],
                                },
                                { label: "Value", key: "value", type: "number" },
                                { label: "Close Date", key: "closeDate", type: "date" },
                                { label: "Owner", key: "owner", type: "text" },
                                {
                                    label: "Status",
                                    key: "status",
                                    type: "select",
                                    options: ["Proposal", "Negotiation", "Closed"],
                                },
                            ].map((field) => (
                                <div key={field.key} className="flex flex-col">
                                    <label className="font-medium text-gray-700 mb-1">{field.label}</label>
                                    {field.type === "select" ? (
                                        <select
                                            value={dealForm[field.key]}
                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                                        >
                                            {field.options.map((opt) => (
                                                <option key={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.type}
                                            value={dealForm[field.key]}
                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                                        />
                                    )}
                                </div>
                            ))}

                            {/* Description full width */}
                            <div className="flex flex-col sm:col-span-2">
                                <label className="font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={dealForm.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                                />
                            </div>

                            <div className="flex justify-end sm:col-span-2 mt-2 space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDealModal(false)}
                                    className="px-4 py-2 text-red-500 border border-red-300 rounded hover:bg-red-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-green-600 border border-green-300 rounded hover:bg-green-50 transition"
                                >
                                    {dealForm.id ? "Save Changes" : "Add Deal"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
