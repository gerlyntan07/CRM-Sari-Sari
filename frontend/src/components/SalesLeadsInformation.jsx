import React, { useState, useEffect } from "react";
import { HiArrowLeft } from "react-icons/hi";
import SalesLeadsConvert from "./SalesLeadsConvert";
import api from "../api"; // ✅ Make sure your Axios instance is imported

export default function SalesLeadsInformation({ lead, onBack }) {
  const [leadData, setLeadData] = useState(lead || null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Fetch lead details from backend if an ID is provided
  useEffect(() => {
    if (lead?.id) {
      setLoading(true);
      api
        .get(`/leads/${lead.id}`)
        .then((res) => setLeadData(res.data))
        .catch((err) => console.error("Failed to fetch lead details:", err))
        .finally(() => setLoading(false));
    }
  }, [lead?.id]);

  if (!leadData) return null;
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading lead details...
      </div>
    );

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
          <h1 className="text-xl sm:text-2xl font-semibold">
            {leadData.first_name} {leadData.last_name}
          </h1>
          <span className="bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
            {leadData.status || "New"}
          </span>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm"
          >
            Convert
          </button>
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
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
          Lead Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 text-sm text-gray-700">
          <div>
            <p className="font-semibold">Company:</p>
            <p>{leadData.company_name || "—"}</p>
          </div>
          <div>
            <p className="font-semibold">Title:</p>
            <p>{leadData.title || "—"}</p>
          </div>
          <div>
            <p className="font-semibold">Department:</p>
            <p>{leadData.department || "—"}</p>
          </div>
          <div>
            <p className="font-semibold">Email:</p>
            <p>{leadData.email || "—"}</p>
          </div>
          <div>
            <p className="font-semibold">Territory:</p>
            <p>{leadData.assigned_to.territory?.name || "—"}</p>
          </div>  
          <div>
            <p className="font-semibold">Assigned To:</p>
            <p>
              {leadData.assigned_to?.first_name
                ? `${leadData.assigned_to.first_name} ${leadData.assigned_to.last_name}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="font-semibold">Created By:</p>
            <p>
              {leadData.created_by?.first_name
                ? `${leadData.created_by.first_name} ${leadData.created_by.last_name}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="font-semibold">Work Phone:</p>
            <p>{leadData.work_phone || "—"}</p>
          </div>
          <div>
            <p className="font-semibold">Mobile Phone 1:</p>
            <p>{leadData.mobile_phone_1 || "—"}</p>
          </div>
          <div>
            <p className="font-semibold">Mobile Phone 2:</p>
            <p>{leadData.mobile_phone_2 || "—"}</p>
          </div>
          <div>
            <p className="font-semibold">Source:</p>
            <p>{leadData.source || "—"}</p>
          </div>
        </div>
      </div>

      {/* Address & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Address:</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {leadData.address || "—"} <br />

          </p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Notes:</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {leadData.notes || "No notes available."}
          </p>
        </div>
      </div>

      {/* Related Activities */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4 sm:mb-6">
          Related Activities
        </h3>
        <p className="text-gray-500 text-sm">
          (Coming soon — this section will show Tasks, Calls, and Meetings.)
        </p>
      </div>

      {/* Convert Lead Popup */}
      <SalesLeadsConvert
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
