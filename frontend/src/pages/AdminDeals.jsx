import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiBriefcase, FiX, FiSearch } from "react-icons/fi";
import AdminDealsInformation from "../components/AdminDealsInformation";

export default function AdminDeals() {
    useEffect(() => {
        document.title = "Deals | Sari-Sari CRM";
    }, []);

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
            // Edit deal in local state
            setDeals((prev) =>
                prev.map((d) => (d.id === dealForm.id ? dealForm : d))
            );
        } else {
            // Add new deal to local state
            setDeals([...deals, { ...dealForm, id: deals.length + 1 }]);
        }
        setShowDealModal(false);
    };

    const handleDeleteDeal = (id) => {
        setDeals(deals.filter((d) => d.id !== id));
    };

    return (
      <div className="p-8 font-inter">
    {/* Header */}
    <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h2 className="flex items-center text-2xl font-semibold text-gray-800">
            <FiBriefcase className="mr-2 text-blue-600" /> Deals Management
        </h2>
        <button
            onClick={openNewDealModal}
            className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
            + New Deal
        </button>
    </div>

    {/* ✅ Top Summary Boxes */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-sm rounded-lg p-4 text-center font-semibold w-full">
            Deals
        </div>
        <div className="bg-white shadow-sm rounded-lg p-4 text-center font-semibold w-full"></div>
        <div className="bg-white shadow-sm rounded-lg p-4 text-center font-semibold w-full"></div>
        <div className="bg-white shadow-sm rounded-lg p-4 text-center font-semibold w-full"></div>
    </div>

    {/* Search & Filters */}
    <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative w-full lg:w-1/3 mb-2 lg:mb-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
                type="text"
                placeholder="Search Deals..."
                className="border border-gray-300 bg-white rounded-md px-10 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <select
                className="border border-gray-300 rounded-md px-4 py-2 text-sm bg-white w-full lg:w-auto"
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
            >
                <option value="">Filter by Stage</option>
                <option value="Proposal Stage">Proposal Stage</option>
                <option value="Negotiation Stage">Negotiation Stage</option>
            </select>
            <select
                className="border border-gray-300 rounded-md px-4 py-2 text-sm bg-white w-full lg:w-auto"
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
    <div className="overflow-x-auto w-full shadow-sm mt-7">
        <table className="min-w-full bg-white text-left table-auto">
            <thead className="bg-gray-100 text-sm text-gray-600 sticky top-0 z-10">
                <tr>
                    <th className="py-3 px-2 sm:px-4 font-medium">Deal Name</th>
                    <th className="py-3 px-2 sm:px-4 font-medium">Account</th>
                    <th className="py-3 px-2 sm:px-4 font-medium">Contact</th>
                    <th className="py-3 px-2 sm:px-4 font-medium">Stage</th>
                    <th className="py-3 px-2 sm:px-4 font-medium">Value</th>
                    <th className="py-3 px-2 sm:px-4 font-medium">Close Date</th>
                    <th className="py-3 px-2 sm:px-4 font-medium">Owner</th>
                    <th className="py-3 px-2 sm:px-4 font-medium text-center">Actions</th>
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
                                className={`border-b border-gray-200 cursor-pointer ${
                                    isEven ? "bg-white hover:bg-gray-200" : "bg-yellow-50 hover:bg-gray-200"
                                }`}
                            >
                                <td className="py-2 px-2 sm:px-4">{deal.name}</td>
                                <td className="py-2 px-2 sm:px-4">{deal.account}</td>
                                <td className="py-2 px-2 sm:px-4">{deal.contact}</td>
                                <td className="py-2 px-2 sm:px-4 text-orange-500">{deal.stage}</td>
                                <td className="py-2 px-2 sm:px-4">₱ {deal.value.toLocaleString()}</td>
                                <td className="py-2 px-2 sm:px-4">{deal.closeDate}</td>
                                <td className="py-2 px-2 sm:px-4">{deal.owner}</td>
                                <td className="py-2 px-2 sm:px-4 text-center">
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
                                                handleDeleteDeal(deal.id);
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

    {showDealModal && (
    <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-2 sm:px-0"
        onClick={() => setShowDealModal(false)}
    >
        <div
            className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-5 sm:p-6 relative border border-gray-200 my-10 scale-[0.95]"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => setShowDealModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-black transition"
            >
                <FiX size={20} />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">
                {dealForm.id ? "Edit Deal" : "Add New Deal"}
            </h2>

            <form
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm"
                onSubmit={handleDealSubmit}
            >
                {/* Deal Name */}
                <div className="flex flex-col w-full">
                    <label className="text-gray-700 font-medium mb-1">Deal Name</label>
                    <input
                        type="text"
                        placeholder="Enter deal name"
                        value={dealForm.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none w-full"
                    />
                </div>

                {/* Account */}
                <div className="flex flex-col w-full">
                    <label className="text-gray-700 font-medium mb-1">Account</label>
                    <select
                        value={dealForm.account}
                        onChange={(e) => handleInputChange("account", e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white w-full"
                    >
                        <option value="">Select Account</option>
                        <option value="Gertan Corp.">Gertan Corp.</option>
                        <option value="ABC Company">ABC Company</option>
                    </select>
                </div>

                {/* Primary Contact */}
                <div className="flex flex-col w-full">
                    <label className="text-gray-700 font-medium mb-1">Primary Contact</label>
                    <select
                        value={dealForm.contact}
                        onChange={(e) => handleInputChange("contact", e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white w-full"
                    >
                        <option value="">Select Contact</option>
                        <option value="Joshua M.">Joshua M.</option>
                        <option value="Marcus Lee">Marcus Lee</option>
                    </select>
                </div>

                {/* Stage */}
                <div className="flex flex-col w-full">
                    <label className="text-gray-700 font-medium mb-1">Stage</label>
                    <select
                        value={dealForm.stage}
                        onChange={(e) => handleInputChange("stage", e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white w-full"
                    >
                        <option>Proposal Stage</option>
                        <option>Negotiation Stage</option>
                        <option>Closed Won</option>
                        <option>Closed Lost</option>
                    </select>
                </div>

                {/* Amount */}
                <div className="flex flex-col w-full">
                    <label className="text-gray-700 font-medium mb-1">Amount</label>
                    <input
                        type="number"
                        placeholder="₱0"
                        value={dealForm.value}
                        onChange={(e) => handleInputChange("value", e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none w-full"
                    />
                </div>

                {/* Currency */}
                <div className="flex flex-col w-full">
                    <label className="text-gray-700 font-medium mb-1">Currency</label>
                    <select
                        value={dealForm.currency || ""}
                        onChange={(e) => handleInputChange("currency", e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white w-full"
                    >
                        <option value="">Select Currency</option>
                        <option value="PHP">PHP</option>
                        <option value="USD">USD</option>
                    </select>
                </div>

                {/* Assign To */}
                <div className="flex flex-col w-full">
                    <label className="text-gray-700 font-medium mb-1">Assign To</label>
                    <select
                        value={dealForm.owner}
                        onChange={(e) => handleInputChange("owner", e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white w-full"
                    >
                        <option value="">Assign To</option>
                        <option value="Dinosaur Roar">Dinosaur Roar</option>
                        <option value="Marcus Lee">Marcus Lee</option>
                    </select>
                </div>

                {/* Description (full width) */}
                <div className="flex flex-col col-span-1 sm:col-span-2 w-full">
                    <label className="text-gray-700 font-medium mb-1">Description</label>
                    <textarea
                        rows={3}
                        placeholder="Additional details..."
                        value={dealForm.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none w-full"
                    />
                </div>

                {/* Footer buttons */}
                <div className="flex flex-wrap justify-end gap-2 mt-2 col-span-1 sm:col-span-2">
                    <button
                        type="button"
                        onClick={() => setShowDealModal(false)}
                        className="px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition-100"
                    >
                        Save Deal
                    </button>
                </div>
            </form>
        </div>
    </div>
)}

</div>
    );
}