import React, { useState } from "react";
import { HiArrowLeft } from "react-icons/hi";
import SalesLeadsConvert from "./SalesLeadsConvert";

// Mock lead data
const mockLead = {
  name: "Josh Vergara",
  status: "New",
  company: "Josh Inc.",
  title: "CEO",
  department: "Administration",
  email: "josh@joshinc.com",
  territory: "Cavite",
  assignedTo: "Admin",
  createdBy: "Admin",
  workPhone: "09253677323",
  phone1: "09253677323",
  phone2: "0907452874",
  source: "Website",
  addressLine1: "#1 Pilar Las Pinas",
  addressLine2: "Suite 400",
  city: "Las Pinas",
  state: "Metro Manila",
  zipCode: "1740",
  notes: "Interested in our premium plan.",
};

export default function SalesLeadsInformation({ lead = mockLead, onBack }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!lead) return null;

  return (
    <div className="p-4 sm:p-6 md:p-8 font-inter min-h-screen">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center text-sm sm:text-base text-gray-500 hover:text-gray-700 transition mb-4 sm:mb-6 cursor-pointer"
      >
        <HiArrowLeft className="mr-1 w-4 h-4 sm:w-5 sm:h-5" /> Back
      </button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8 gap-2 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold">{lead.name}</h1>
          <span className="bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
            {lead.status}
          </span>
          <div className="flex flex-wrap items-center ml-0 sm:ml-1">
            {/* Convert Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm"
            >
              Convert
            </button>
          </div>
        </div>

        <div className="mt-2 lg:mt-0 flex flex-wrap gap-2 sm:gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm">
            Edit
          </button>
          <button className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm">
            Delete
          </button>
        </div>
      </div>

      {/* Lead Details */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-200 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Lead Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 text-sm text-gray-700">
          <div>
            <p className="font-semibold">Name:</p>
            <p>{lead.name}</p>
          </div>
          <div>
            <p className="font-semibold">Company:</p>
            <p>{lead.company}</p>
          </div>
          <div>
            <p className="font-semibold">Title:</p>
            <p>{lead.title}</p>
          </div>
          <div>
            <p className="font-semibold">Department:</p>
            <p>{lead.department}</p>
          </div>
          <div>
            <p className="font-semibold">Email:</p>
            <p>{lead.email}</p>
          </div>
          <div>
            <p className="font-semibold">Territory:</p>
            <p>{lead.territory}</p>
          </div>
          <div>
            <p className="font-semibold">Assign To:</p>
            <p>{lead.assignedTo}</p>
          </div>
          <div>
            <p className="font-semibold">Created By:</p>
            <p>{lead.createdBy}</p>
          </div>
          <div>
            <p className="font-semibold">Work Phone:</p>
            <p>{lead.workPhone}</p>
          </div>
          <div>
            <p className="font-semibold">Mobile Phone 1:</p>
            <p>{lead.phone1}</p>
          </div>
          <div>
            <p className="font-semibold">Mobile Phone 2:</p>
            <p>{lead.phone2}</p>
          </div>
          <div>
            <p className="font-semibold">Source:</p>
            <p>{lead.source}</p>
          </div>
        </div>
      </div>

      {/* Address & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Address:</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {lead.addressLine1} <br />
            {lead.addressLine2} <br />
            {lead.city}, {lead.state} {lead.zipCode}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Notes:</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {lead.notes || "No notes available."}
          </p>
        </div>
      </div>

      {/* Related Activities */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4 sm:mb-6">Related Activities</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Tasks (2)</h4>
            <div className="space-y-1 text-gray-700">
              <p>Schedule follow-up call</p>
              <p className="text-xs text-gray-500">Due: 2025-09-15 | In Progress</p>
              <p>Schedule follow-up call</p>
              <p className="text-xs text-gray-500">Due: 2025-09-18 | In Progress</p>
            </div>
            <a href="#" className="text-blue-600 hover:underline text-xs font-medium mt-2 inline-block">
              View All Tasks
            </a>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Calls (2)</h4>
            <div className="space-y-1 text-gray-700">
              <p>Initial discovery call</p>
              <p className="text-xs text-gray-500">2025-09-10 | Completed</p>
              <p>Initial discovery call</p>
              <p className="text-xs text-gray-500">2025-09-11 | Completed</p>
            </div>
            <a href="#" className="text-blue-600 hover:underline text-xs font-medium mt-2 inline-block">
              View All Calls
            </a>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Meeting (0)</h4>
            <p className="text-gray-500">No meetings associated.</p>
            <a href="#" className="text-blue-600 hover:underline text-xs font-medium mt-2 inline-block">
              View All Meetings
            </a>
          </div>
        </div>
      </div>

      {/* Convert Lead Popup */}
      <SalesLeadsConvert
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
