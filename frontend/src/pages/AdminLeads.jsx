// AdminLeads.jsx
import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiUserPlus,
  FiDownload,
  FiX,
} from "react-icons/fi";
import AdminLeadsInformation from "../components/AdminLeadsInformation";


export default function AdminLeads() {
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.title = "Leads | Sari-Sari CRM";
  }, []);

  const leads = [
    {
      name: "Joshua Vergara",
      status: "Qualified",
      title: "Marketing Director",
      email: "sarah.williams@innovateco.com",
      phone1: "09271229484",
      phone2: "---------",
      workPhone: "(555) 123-4567",
      territory: "East Coast",
      department: "Marketing",
      company: "Innovate Co.",
      createdBy: "John Appleseed",
      createdAt: "2025-09-10 09:30",
      lastUpdated: "2025-09-12 14:45",
      source: "Website",
      assignedTo: "Jane Doe",
    },
  ];

  // Handlers
  const handleLeadClick = (lead) => setSelectedLead(lead);
  const handleBackToList = () => setSelectedLead(null);
  const handleBackdropClick = () => setShowModal(false);

  // Full-page lead view
  if (selectedLead) {
    return (
      <AdminLeadsInformation lead={selectedLead} onBack={handleBackToList} />
    );
  }

  return (
    <div className="p-8 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center text-2xl font-semibold text-gray-800">
          <FiUserPlus className="mr-2 text-blue-600" /> Leads
        </h2>

        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center border border-tertiary text-tertiary px-4 py-2 gap-2 rounded-md hover:bg-gray-800 hover:text-white transition"
          >
            <FiDownload /> Download
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
          >
            ＋ Add Leads
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap items-center space-x-3 mb-8">
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-full sm:w-1/3 shadow-sm">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search Leads..."
            className="ml-2 bg-transparent w-full outline-none text-sm"
          />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm mt-2 sm:mt-0">
          <option>All Leads</option>
          <option>Subject</option>
          <option>Assign To</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm overflow-hidden">

        {/* Table Header */}
        <div className="grid grid-cols-9 bg-gray-100 font-medium text-gray-700 text-sm px-4 py-3">
          <div>Name</div>
          <div>Account</div>
          <div>Title</div>
          <div>Department</div>
          <div>Email</div>
          <div>Work Phone</div>
          <div>Assigned To</div>
          <div>Updated</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Table Rows */}
        {leads.map((lead, i) => (
          <div
            key={i}
            className="grid grid-cols-9 px-4 py-3 text-xs hover:bg-gray-100 transition cursor-pointer gap-x-6"
            onClick={() => handleLeadClick(lead)}
          >
            <div className="truncate">{lead.name}</div>
            <div className="truncate">{lead.company}</div>
            <div className="truncate">{lead.title}</div>
            <div className="truncate">{lead.department}</div>
            <div className="truncate">{lead.email}</div>
            <div className="truncate">{lead.workPhone}</div>
            <div className="truncate">{lead.assignedTo}</div>
            <div className="truncate">{lead.lastUpdated}</div>
            <div className="flex justify-center space-x-2">
              <button className="text-blue-500 hover:text-blue-700">
                <FiEdit />
              </button>
              <button className="text-red-500 hover:text-red-700">
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Leads Modal */}
      {showModal && (
        <div
          id="modalBackdrop"
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        >
          <div
            className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-5 sm:p-6 relative border border-gray-200 my-10 scale-[0.95]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-black transition"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">
              Add New Leads
            </h2>

            {/* Form grid */}
            <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
              {/* First Name */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">First Name</label>
                <input
                  type="text"
                  placeholder="Joe"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Last Name */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Smith"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Company */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Company</label>
                <input
                  type="text"
                  placeholder="ABC Company"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Title */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Title</label>
                <input
                  type="text"
                  placeholder="ABC Agenda"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Department */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Sales"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Email</label>
                <input
                  type="text"
                  placeholder="abc@gmail.com"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Work Phone */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Work Phone</label>
                <input
                  type="text"
                  placeholder="09----------"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Mobile Phone 1 */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Mobile Phone 1</label>
                <input
                  type="text"
                  placeholder="09----------"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Mobile Phone 2 */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Mobile Phone 2</label>
                <input
                  type="text"
                  placeholder="09----------"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Territory */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Territory</label>
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Territory
                  </option>
                  <option value="southern-luzon">Southern Luzon</option>
                  <option value="northern-luzon">Northern Luzon</option>
                  <option value="visayas">Visayas</option>
                  <option value="mindanao">Mindanao</option>
                </select>
              </div>

              {/* Assign To */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Assign To</label>
                <input
                  type="text"
                  placeholder="Smith"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Created By */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Created By</label>
                <input
                  type="text"
                  placeholder="William Doe"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="text-gray-700 font-medium mb-1">Notes</label>
                <textarea
                  placeholder="Additional details..."
                  rows={3}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-2 mt-2 col-span-1 sm:col-span-2 lg:col-span-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition-100"
                >
                  Save Leads
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
