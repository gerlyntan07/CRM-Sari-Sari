import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiBriefcase, FiX, FiSearch, FiPhoneCall } from "react-icons/fi";

export default function ManagerCalls() {
  useEffect(() => {
    document.title = "Calls | Sari-Sari CRM";
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [selectedCall, setSelectedCall] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [showCallModal, setShowCallModal] = useState(false);

  const [callForm, setCallForm] = useState({
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

  const [calls, setCalls] = useState([
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
  ]);

  // Filtered Calls
  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      searchQuery === "" ||
      call.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === "" || call.stage === stageFilter;
    const matchesOwner = ownerFilter === "" || call.owner === ownerFilter;
    return matchesSearch && matchesStage && matchesOwner;
  });

  // Handlers
  const openNewCallModal = () => {
    setCallForm({
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
    setShowCallModal(true);
  };


  const handleCallSubmit = (e) => {
    e.preventDefault();
    setShowCallModal(false);
  };

  return (
    <div className="p-8 font-inter">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h2 className="flex items-center text-2xl font-semibold text-gray-800">
          <FiPhoneCall className="mr-2 text-blue-600" /> Calls
        </h2>
        <button
          onClick={openNewCallModal}
          className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          + New Call
        </button>
      </div>

      {/* ✅ Top Summary Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white shadow-sm rounded-lg p-4 text-center font-semibold w-full">Calls</div>
        <div className="bg-white shadow-sm rounded-lg p-5 text-center font-semibold w-full"></div>
        <div className="bg-white shadow-sm rounded-lg p-5 text-center font-semibold w-full"></div>
        <div className="bg-white shadow-sm rounded-lg p-5 text-center font-semibold w-full"></div>
        <div className="bg-white shadow-sm rounded-lg p-5 text-center font-semibold w-full"></div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative w-full lg:w-1/3 mb-2 lg:mb-0">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Call..."
            className="border border-gray-300 bg-white rounded-md px-10 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white w-full lg:w-auto">
            <option value="">All Status</option>
            <option value="Proposal Stage">Status daw po</option>
          </select>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white w-full lg:w-auto">
            <option value="">All User</option>
            <option value="Proposal Stage">Dinosaur Roar</option>
          </select>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white w-full lg:w-auto">
            <option value="">All Priorities</option>
            <option value="Dinosaur Roar">High ganun?</option>
          </select>
        </div>
      </div>

      {/* Activities Table */}
      <div className="overflow-x-auto bg-white shadow border border-gray-100 rounded-md">
        <table className="min-w-[600px] w-full border border-gray-200 rounded-lg bg-white shadow-sm">
          <thead className="bg-gray-100 text-left text-sm text-gray-600 font-bold">
            <tr>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Activity</th>
              <th className="py-3 px-4">Related To</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Assigned To</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>

          <tbody className="text-xs text-gray-700">
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-3">
                <span className="bg-red-100 text-red-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  HIGH
                </span>
              </td>

              <td className="py-2 px-3">
                <div className="font-sm text-gray-900 text-[13px] leading-tight">
                  Enterprise ni Jesselle Tuberow
                </div>
                <div className="text-[11px] text-gray-500">
                  Discuss implementation timeline and pricing
                </div>
              </td>

              <td className="py-2 px-3">
                <div className="font-sm text-gray-800 text-[13px] leading-tight">
                  TechCorp Solutions - Enterprise Software
                </div>
                <div className="text-[11px] text-gray-500">Deals</div>
              </td>

              <td className="py-2 px-3 text-gray-800 font-medium text-[13px]">
                Dec 12, 2004
              </td>

              <td className="py-2 px-3 text-gray-800 font-medium text-[13px]">
                Lester Ciano
              </td>

              <td className="py-2 px-3">
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  PENDING
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {showCallModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3 sm:px-0 overflow-y-auto"
          onClick={() => setShowCallModal(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-xl shadow-lg p-6 sm:p-8 relative border border-gray-200 my-10 scale-[0.95] overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowCallModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition"
            >
              <FiX size={22} />
            </button>

            {/* Header */}
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center space-x-2">
              Schedule Call
            </h2>
            <p className="text-sm text-gray-500 mb-4">Create a new call</p>

            {/* Form */}
            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base"
              onSubmit={handleCallSubmit}
            >
              {/* Subject */}
              <div className="flex flex-col col-span-1 sm:col-span-2">
                <label className="text-gray-700 font-medium mb-1">Subject*</label>
                <input
                  type="text"
                  placeholder="e.g. Follow-up call with Client"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none w-full"
                />
              </div>

              {/* Primary Contact */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Primary Contact
                </label>
                <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white w-full">
                  <option value="">Select Contact</option>
                  <option value="Joshua M.">Joshua M.</option>
                  <option value="Marcus Lee">Marcus Lee</option>
                </select>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+63"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none w-full"
                />
              </div>

              {/* Call Time */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Call Time</label>
                <input
                  type="time"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none w-full"
                />
              </div>

              {/* Call Duration */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Call Duration</label>
                <input
                  type="number"
                  placeholder="30"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none w-full"
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col col-span-1 sm:col-span-2">
                <label className="text-gray-700 font-medium mb-1">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add call notes and key discussion points."
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none w-full"
                />
              </div>

              {/* Due Date */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Due Date*</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none w-full"
                />
              </div>

              {/* Assigned To */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Assigned To*</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white w-full">
                  <option value="">Select User</option>
                  <option value="Dinosaur Roar">Dinosaur Roar</option>
                  <option value="Marcus Lee">Marcus Lee</option>
                </select>
              </div>

              {/* Related Type */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Related Type</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white w-full">
                  <option value="">Select Type</option>
                  <option value="Deal">Deal</option>
                  <option value="Lead">Lead</option>
                  <option value="Contact">Contact</option>
                </select>
              </div>

              {/* Related To */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Related To</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none w-full"
                />
              </div>

              {/* Priority */}
              <div className="flex flex-col col-span-1 sm:col-span-2">
                <label className="text-gray-700 font-medium mb-1">Priority</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white w-full">
                  <option>Medium</option>
                  <option>High</option>
                  <option>Low</option>
                </select>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-2 mt-4 col-span-1 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="px-5 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-gray-900 rounded hover:bg-gray-800 transition"
                >
                  Create Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
