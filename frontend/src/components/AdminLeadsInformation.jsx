// AdminLeadsInformation.jsx
import React from "react";
import { HiArrowLeft } from "react-icons/hi";

export default function AdminLeadsInformation({ lead, onBack }) {
  if (!lead) return null;

  return (
    <div className="p-8 font-inter min-h-screen">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition mb-6 cursor-pointer"
      >
        <HiArrowLeft className="mr-1 w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{lead.name}</h1>
          <span className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
            {lead.status}
          </span>
          <div className="flex flex-wrap items-center ml-1">
            <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium">
              Convert
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
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-paper-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Address:</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {lead.addressLine1 || "123 Main Street"} <br />
            {lead.addressLine2 || "Suite 400"} <br />
            {lead.city || "New York"}, {lead.state || "NY"}{" "}
            {lead.zipCode || "10001"}
          </p>
        </div>

        <div className="bg-paper-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Notes:</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {lead.notes ||
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
              <p className="text-xs text-gray-500">
                Due: 2025-09-15 | In Progress
              </p>
              <p>Schedule follow-up call</p>
              <p className="text-xs text-gray-500">
                Due: 2025-09-18 | In Progress
              </p>
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
