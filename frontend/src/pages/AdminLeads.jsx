import React, { useState, useEffect } from "react";
import {FiSearch, FiEdit, FiTrash2, FiUserPlus, FiDownload, FiX,} from "react-icons/fi";
import { HiArrowLeft } from "react-icons/hi";

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

  const handleLeadClick = (lead) => setSelectedLead(lead);
  const handleBackToList = () => setSelectedLead(null);
  const handleBackdropClick = () => setShowModal(false);

  // FULL PAGE LEAD VIEW =========== Here is the page if you click the data in the table lead
  if (selectedLead) {
    return (
      <div className="p-8 font-outfit min-h-screen">
        {/* Back Button */}
        <button
          onClick={handleBackToList}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition mb-6 cursor-pointer"
        >
          <HiArrowLeft className="mr-1 w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{selectedLead.name}</h1>
            <span className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
              {selectedLead.status}
            </span>
            <div className="flex flex-wrap items-center ml-1">
              <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium">
                Convert Lead
              </button>
            </div>
          </div>

          <div className="mt-4 lg:mt-0 flex flex-wrap gap-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium">
              Edit
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-medium">
              Delete
            </button>
          </div>
        </div>

        {/* Lead Details */}
        <div className="bg-paper-white rounded-xl shadow-sm p-8 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold mb-6">Lead Details</h2>

          <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <p className="font-semibold">Name:</p>
              <p>{selectedLead.name}</p>
            </div>
            <div>
              <p className="font-semibold">Status:</p>
              <p>{selectedLead.status}</p>
            </div>
            <div>
              <p className="font-semibold">Created By:</p>
              <p>
                {selectedLead.createdBy} on {selectedLead.createdAt}
              </p>
            </div>
            <div>
              <p className="font-semibold">Source:</p>
              <p>{selectedLead.source}</p>
            </div>
            <div>
              <p className="font-semibold">Title:</p>
              <p>{selectedLead.title}</p>
            </div>
            <div>
              <p className="font-semibold">Territory:</p>
              <p>{selectedLead.territory}</p>
            </div>
            <div>
              <p className="font-semibold">Last Updated:</p>
              <p>{selectedLead.lastUpdated}</p>
            </div>
            <div>
              <p className="font-semibold">Assigned To:</p>
              <p>{selectedLead.assignedTo}</p>
            </div>
            <div>
              <p className="font-semibold">Email:</p>
              <p>{selectedLead.email}</p>
            </div>
            <div>
              <p className="font-semibold">Work Phone:</p>
              <p>{selectedLead.workPhone}</p>
            </div>
            <div>
              <p className="font-semibold">Company:</p>
              <p>{selectedLead.company}</p>
            </div>
            <div>
              <p className="font-semibold">Department:</p>
              <p>{selectedLead.department}</p>
            </div>
            <div>
              <p className="font-semibold">Mobile Phone 1:</p>
              <p>{selectedLead.phone1}</p>
            </div>
            <div>
              <p className="font-semibold">Mobile Phone 2:</p>
              <p>{selectedLead.phone2}</p>
            </div>
          </div>
        </div>

        {/* Address & Notes */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-paper-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Address:</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {selectedLead.addressLine1 || "123 Main Street"} <br />
              {selectedLead.addressLine2 ? (
                <>
                  {selectedLead.addressLine2} <br />
                </>
              ) : (
                "Suite 400"
              )}
              {selectedLead.city || "New York"},{" "}
              {selectedLead.state || "NY"} {selectedLead.zipCode || "10001"}
            </p>

          </div>

          <div className="bg-paper-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Notes:</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {selectedLead.notes ||
                "No notes available. Add details about this lead’s background or communication history."}
            </p>
          </div>
        </div>

        {/* Related Activities */}
        <div className="bg-paper-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-6">Related Activities</h3>

          <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-8 text-sm">
            {/* Tasks */}
            <div>
              <h4 className="font-semibold mb-2">Task (2)</h4>
              <div className="space-y-1 text-gray-700">
                <p>Schedule follow-up call</p>
                <p className="text-xs text-gray-500">Due: 2025-09-15 | In Progress</p>
                <p>Schedule follow-up call</p>
                <p className="text-xs text-gray-500">Due: 2025-09-18 | In Progress</p>
              </div>
              <a
                href="#"
                className="text-blue-600 hover:underline text-xs font-medium mt-2 inline-block"
              >
                View All Tasks
              </a>
            </div>

            {/* Calls */}
            <div>
              <h4 className="font-semibold mb-2">Calls (2)</h4>
              <div className="space-y-1 text-gray-700">
                <p>Initial discovery call</p>
                <p className="text-xs text-gray-500">2025-09-10 | Completed</p>
                <p>Initial discovery call</p>
                <p className="text-xs text-gray-500">2025-09-11 | Completed</p>
              </div>
              <a
                href="#"
                className="text-blue-600 hover:underline text-xs font-medium mt-2 inline-block"
              >
                View All Calls
              </a>
            </div>

            {/* Meetings */}
            <div>
              <h4 className="font-semibold mb-2">Meeting (0)</h4>
              <p className="text-gray-500">No meetings associated.</p>
              <a
                href="#"
                className="text-blue-600 hover:underline text-xs font-medium mt-2 inline-block"
              >
                View All Meetings
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }


 {/* // MAIN TABLE VIEW ================================ */}
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
      <div className="bg-white shadow-sm overflow-hidden shadow-sm border-b border-gray-500">

        {/* Table Header */}
        <div className="grid grid-cols-9 bg-gray-100 font-medium text-gray-700 px-4 py-2 text-sm border-b border-gray-500 py-3 px-4">
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
            className="grid grid-cols-9 px-4 py-3 text-sm hover:bg-gray-100 transition cursor-pointer gap-x-6 py-3 px-4"
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


      {/* Add Leads Modal ======================================== FORM*/} 
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
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-black transition"
            >
              <FiX size={20} />
            </button>

            {/* Header */}
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">
              Add New Leads
            </h2>

            {/* Form */}
            <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Manager"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Email</label>
                <input
                  type="text"
                  placeholder="@email.com"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Mobile Phone</label>
                <input
                  type="text"
                  placeholder="09+"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Status</label>
                <input
                  type="text"
                  placeholder="Proposal"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Territory</label>
                <input
                  type="text"
                  placeholder="Luzon"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Work Phone</label>
                <input
                  type="text"
                  placeholder="09+"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Mobile Phone 2</label>
                <input
                  type="text"
                  placeholder="09+"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Created By</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Last Update</label>
                <input
                  type="text"
                  placeholder="2025-09-10"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Company</label>
                <input
                  type="text"
                  placeholder="ABC Corp"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Sales"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Source</label>
                <input
                  type="text"
                  placeholder="Website"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Assigned To</label>
                <input
                  type="text"
                  placeholder="Smith"
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
                  className="px-4 py-2 text-red-500 border border-red-300 rounded hover:bg-red-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-green-500 border border-green-300 rounded hover:bg-green-50 transition"
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
