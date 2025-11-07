import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiUserPlus,
  FiDownload,
  FiX,
} from "react-icons/fi";
import SalesLeadsInformation from "../components/SalesLeadsInformation";
import api from "../api"; // ✅ your Axios instance with auth token

export default function SalesLeads() {
  const [selectedLead, setSelectedLead] = useState(null);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    document.title = "Leads | Sari-Sari CRM";
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.get("/leads/sales/getLeads"); // 👈 call the filtered endpoint
      setLeads(res.data);
    } catch (err) {
      console.error("Error fetching assigned leads:", err);
    }
  };

  const handleLeadClick = (lead) => setSelectedLead(lead);
  const handleBackToList = () => setSelectedLead(null);

  if (selectedLead) {
    return (
      <SalesLeadsInformation
        lead={selectedLead}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h2 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiUserPlus className="mr-2 text-blue-600" /> My Leads
        </h2>

        <button
          onClick={fetchLeads}
          className="flex items-center justify-center border border-tertiary text-tertiary px-4 py-2 gap-2 rounded-md hover:bg-gray-800 hover:text-white transition"
        >
          <FiDownload /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm overflow-x-auto rounded-md border border-gray-200">
        <div className="grid grid-cols-9 min-w-[800px] bg-gray-100 font-bold text-gray-600 text-sm px-4 py-3">
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

        {Array.isArray(leads) && leads.length > 0 ? (
          leads.map((lead, i) => (
            <div
              key={i}
              className="grid grid-cols-9 min-w-[800px] px-4 py-3 text-xs hover:bg-gray-100 transition cursor-pointer gap-x-4"
              onClick={() => handleLeadClick(lead)}
            >
              <div className="truncate">{lead.first_name} {lead.last_name}</div>
              <div className="truncate">{lead.company_name}</div>
              <div className="truncate">{lead.title}</div>
              <div className="truncate">{lead.department}</div>
              <div className="truncate">{lead.email}</div>
              <div className="truncate">{lead.work_phone}</div>
              <div className="truncate">
                {lead.assigned_to?.first_name} {lead.assigned_to?.last_name}
              </div>
              <div className="truncate">
                {new Date(lead.updated_at || lead.created_at).toLocaleString()}
              </div>
              <div className="flex justify-center space-x-2">
                <button className="text-blue-500 hover:text-blue-700">
                  <FiEdit />
                </button>
                <button className="text-red-500 hover:text-red-700">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="w-full text-center py-3 text-gray-500">
            No leads assigned to you
          </p>
        )}
      </div>
    </div>
  );
}
