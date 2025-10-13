import React, { useState } from "react";
import { FiEdit, FiTrash2, FiPhone, FiMail, FiCalendar, FiFileText, FiX, FiBriefcase, } from "react-icons/fi";

export default function AdminDeals() {
    const [searchQuery, setSearchQuery] = useState("");
    const [stageFilter, setStageFilter] = useState("");
    const [ownerFilter, setOwnerFilter] = useState("");
    const [selectedDeal, setSelectedDeal] = useState(null);
    const [activeTab, setActiveTab] = useState("Overview");

    const deals = [
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
    ];

    const filteredDeals = deals.filter((deal) => {
        const matchesSearch =
            searchQuery === "" ||
            deal.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStage = stageFilter === "" || deal.stage === stageFilter;
        const matchesOwner = ownerFilter === "" || deal.owner === ownerFilter;
        return matchesSearch && matchesStage && matchesOwner;
    });

    const closeModal = () => {
        setSelectedDeal(null);
        setActiveTab("Overview");
    };

    return (
        <div className="min-h-screen bg-paper-white p-6 font-inter">
            {/* Header */}
            <div className="sticky top-0 bg-paper-white z-20 pb-3">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <FiBriefcase className="text-blue-600" />
                        Deals Management
                    </h1>

                    <button className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">
                        + New Deal
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
                <input
                    type="text"
                    placeholder="Search"
                    className="border border-gray-300 rounded-md px-4 py-2 w-full lg:w-1/3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="flex flex-wrap gap-4">
                    <select
                        className="border border-gray-300 rounded-md px-4 py-2 text-sm"
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                    >
                        <option value="">Filter by Stage</option>
                        <option value="Proposal Stage">Proposal Stage</option>
                        <option value="Negotiation Stage">Negotiation Stage</option>
                    </select>

                    <select
                        className="border border-gray-300 rounded-md px-4 py-2 text-sm"
                        value={ownerFilter}
                        onChange={(e) => setOwnerFilter(e.target.value)}
                    >
                        <option value="">Filter by Owner</option>
                        <option value="Jesselle R.">Roar Dinosaur</option>
                        <option value="Marcus Lee">Marcus Lee</option>
                    </select>
                </div>
            </div>

            {/* Deals Table */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full bg-white text-left table-auto mt-7">
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
                            filteredDeals.map((deal, index) => (
                                <tr
                                    key={deal.id}
                                    onClick={() => setSelectedDeal(deal)}
                                    className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? "bg-white" : "bg-[#F8F8F8]"
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
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                <FiEdit />
                                            </button>
                                            <button
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
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

            {/* MODAL */}
            {selectedDeal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] font-inter p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl h-[90vh] overflow-y-auto relative">
                        {/* Header */}
                        <div className="flex justify-between items-start p-6 border-b-gray-200 mt-6">
                            <div>
                                <h1 className="text-xl font-semibold">
                                    {selectedDeal.name}
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Created on {selectedDeal.closeDate}
                                </p>
                                <span className="mt-3 inline-block bg-yellow-100 text-yellow-700 text-sm font-medium px-3 py-1 rounded-full">
                                    {selectedDeal.status}
                                </span>
                            </div>

                            <div className="text-right">
                                <h2 className="text-3xl font-bold text-gray-900">
                                    ₱ {selectedDeal.value.toLocaleString()}
                                </h2>
                                <div className="w-40 bg-gray-200 rounded-full h-2 mt-1">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${selectedDeal.progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {selectedDeal.progress}% Complete
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex space-x-7 ml-5 border-b-gray-200 px-6 py-2 bg-gray-50 rounded-md w-[64%]">
                            {["Overview", "Activities", "Notes", "Edit"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-2 rounded-md text-sm font-medium transition border shadow ${activeTab === tab
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>



                        {/* Content */}
                        <div className="p-6 grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                {activeTab === "Overview" && (
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Deal Info */}
                                        <div className="bg-white border-gray-250 rounded-lg p-5 shadow-sm pb-20">
                                            <h4 className="font-semibold text-gray-800 mb-3">
                                                Deal Information
                                            </h4>
                                            <p className="text-sm text-gray-700 mb-2 py-10">
                                                <strong>Description:</strong>{" "}
                                                {selectedDeal.description}
                                            </p>
                                            <div className="h-px bg-gray-200 w-full" />

                                            <p className="text-sm text-gray-700 mb-2 py-5">
                                                <strong>Expected Close Date:</strong>{" "}
                                                {selectedDeal.closeDate}
                                            </p>
                                            <div className="h-px bg-gray-200 w-full" />

                                            {/* Progress bar */}
                                            <div className="mt-4 py-5 ">
                                                {/* Pipeline container */}
                                                <div className="relative flex items-center justify-between w-full">
                                                    {/* Circles and connectors */}
                                                    <div className="flex items-center justify-between w-full absolute top-0 left-0 right-0">
                                                        {["green", "green", "orange", "gray", "gray"].map((color, i) => (
                                                            <React.Fragment key={i}>
                                                                {/* Circle */}
                                                                <div
                                                                    className={`relative z-10 w-6 h-6 rounded-full border-2 ${color === "green"
                                                                        ? "bg-green-500 border-green-500"
                                                                        : color === "orange"
                                                                            ? "bg-orange-400 border-orange-400"
                                                                            : "bg-gray-300 border-gray-300"
                                                                        }`}
                                                                ></div>

                                                                {/* Line (between circles) */}
                                                                {i < 4 && <div className="flex-grow h-1 bg-gray-200 mx-1"></div>}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>

                                                    {/* Labels under circles */}
                                                    <div className="flex justify-between w-full mt-8 gap-5">
                                                        {[
                                                            "Prospecting",
                                                            "Qualification",
                                                            "Proposal",
                                                            "Negotiation",
                                                            "Closed",
                                                        ].map((label, i) => (
                                                            <span
                                                                key={i}
                                                                className="text-[9px] text-gray-600 text-center flex-1"
                                                            >
                                                                {label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Current stage */}
                                                <p className="text-sm text-orange-600 font-medium mt-6 text-center">
                                                    {selectedDeal.stage}
                                                </p>
                                            </div>



                                        </div>

                                        {/* Contact Info */}
                                        <div className="bg-white border-gray-250 rounded-lg p-5 shadow-sm">
                                            <h4 className="font-semibold text-gray-800 mb-10">
                                                Contact Information
                                            </h4>
                                            <div className="text-sm text-gray-700 space-y-5">
                                                <p>
                                                    <strong>Account:</strong> {selectedDeal.account}
                                                </p>
                                                <div className="h-px bg-gray-200 w-full" />
                                                <p>
                                                    <strong>Primary Contact:</strong>{" "}
                                                    {selectedDeal.contact}
                                                </p>
                                                <div className="h-px bg-gray-200 w-full" />
                                                <p>
                                                    <strong>Phone:</strong> {selectedDeal.phone}
                                                </p>
                                                <div className="h-px bg-gray-200 w-full" />
                                                <p>
                                                    <strong>Email:</strong> {selectedDeal.email}
                                                </p>
                                                <div className="h-px bg-gray-200 w-full" />
                                                <p>
                                                    <strong>Assigned To:</strong> {selectedDeal.owner}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right column */}
                            <div className="space-y-6">
                                {/* Quick Actions */}
                                <div className="bg-white border-gray-250 rounded-lg p-5 shadow-sm">
                                    <h4 className="font-semibold text-gray-800 mb-3">
                                        Quick Actions
                                    </h4>
                                    <div className="flex flex-col gap-2 text-sm">
                                        {[
                                            { icon: FiPhone, text: "Schedule Call" },
                                            { icon: FiMail, text: "Send E-mail" },
                                            { icon: FiCalendar, text: "Book Meeting" },
                                            { icon: FiFileText, text: "Create Quote" },
                                        ].map(({ icon: Icon, text }) => (
                                            <button
                                                key={text}
                                                className="flex items-center gap-2 border border-gray-100 rounded-md py-2 px-3 hover:bg-gray-50 transition"
                                            >
                                                <Icon className="text-gray-600 w-4 h-4" /> {text}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Promote Deal */}
                                <div className="bg-white border-gray-250 rounded-lg p-5 shadow-sm">
                                    <h4 className="font-semibold text-gray-800 mb-3">
                                        Promote Deal
                                    </h4>
                                    <select className="border border-gray-100 rounded-md px-3 py-2 w-full text-sm mb-3 focus:ring-2 focus:ring-gray-300">
                                        <option>Negotiation Stage</option>
                                        <option>Proposal Stage</option>
                                        <option>Closed Won</option>
                                        <option>Closed Lost</option>
                                    </select>
                                    <button className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800 transition">
                                        Update
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
