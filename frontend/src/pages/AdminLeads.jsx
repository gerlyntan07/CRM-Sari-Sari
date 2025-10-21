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
import api from "../api";

export default function AdminLeads() {
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [leadData, setLeadData] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    title: "",
    department: "",
    email: "",
    work_phone: "",
    mobile_phone_1: "",
    mobile_phone_2: "",
    address: "",
    notes: "",
    source: "",
    territory_id: null,
    lead_owner: null,
    status: "New",
  });

  useEffect(() => {
    document.title = "Leads | Sari-Sari CRM";
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get(`/leads/getUsers`);
      setUsers(res.data);
    } catch (err) {
      console.error(`Error fetching users: ${err}`);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get(`/leads/admin/getLeads`);
      console.log(res.data);
      setLeads(res.data);
    } catch (err) {
      console.error(`Error fetching leads: ${err}`);
    }
  }

  useEffect(() => {
    fetchAccounts();
    fetchLeads();
  }, []);

  const handleLeadClick = (lead) => setSelectedLead(lead);
  const handleBackToList = () => setSelectedLead(null);
  const handleBackdropClick = () => setShowModal(false);

  if (selectedLead) {
    return (
      <AdminLeadsInformation lead={selectedLead} onBack={handleBackToList} />
    );
  }

  const handleLeadChange = (e) => {
    const { name, value } = e.target;
    setLeadData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === 'lead_owner') {
      const user = users.find((user) => user.id === parseInt(value));
      setSelectedUser(user);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalForm = {
      ...leadData,
      territory_id: selectedUser && selectedUser.territories && selectedUser.territories.length > 0 ? selectedUser.territories[0].id : null,
      lead_owner: parseInt(leadData.lead_owner),
    }

    try {
      const res = await api.post('/leads/create', finalForm);
      setShowModal(false);
      fetchLeads();
    } catch (err) {
      console.error("Error creating lead:", err);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h2 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiUserPlus className="mr-2 text-blue-600" /> Leads
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center border border-tertiary text-tertiary px-4 py-2 gap-2 rounded-md hover:bg-gray-800 hover:text-white transition w-full sm:w-auto"
          >
            <FiDownload /> Download
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition w-full sm:w-auto"
          >
            ＋ Add Leads
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-3 mb-8 gap-3">
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-full sm:w-1/3 shadow-sm">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search Leads..."
            className="ml-2 bg-transparent w-full outline-none text-sm"
          />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm w-full sm:w-auto">
          <option>All Leads</option>
          <option>Subject</option>
          <option>Assign To</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm overflow-x-auto rounded-md border border-gray-200">
        {/* Table Header */}
        <div className="grid grid-cols-9 min-w-[800px] bg-gray-100 font-medium text-gray-700 text-sm px-4 py-3">
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
        {(Array.isArray(leads) && leads.length > 0) ? (
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
              <div className="truncate">{lead.assigned_to.first_name} {lead.assigned_to.last_name}</div>
              <div className="truncate">
                {new Date(lead.updated_at || lead.created_at).toLocaleString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }).replace(",", "")}
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
          <p className="w-full text-center py-3">No leads</p>
        )}
      </div>

      {/* Add Leads Modal */}
      {showModal && (
        <div
          id="modalBackdrop"
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        >
          <div
            className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-5 sm:p-6 relative border border-gray-200 my-6 max-h-[90vh] overflow-y-auto"
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
                <label className="text-gray-700 font-medium mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={leadData.first_name}
                  onChange={handleLeadChange}
                  placeholder="Joe"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Last Name */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Smith"
                  name="last_name"
                  value={leadData.last_name}
                  onChange={handleLeadChange}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Company */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Company</label>
                <input
                  type="text"
                  placeholder="ABC Company"
                  name="company_name"
                  value={leadData.company_name}
                  onChange={handleLeadChange}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Title */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Title</label>
                <input
                  type="text"
                  placeholder="ABC Agenda"
                  name="title"
                  value={leadData.title}
                  onChange={handleLeadChange}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Department */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="Sales"
                  name="department"
                  value={leadData.department}
                  onChange={handleLeadChange}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="abc@gmail.com"
                  name="email"
                  value={leadData.email}
                  onChange={handleLeadChange}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Work Phone */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Work Phone
                </label>
                <input
                  type="text"
                  placeholder="09----------"
                  name="work_phone"
                  value={leadData.work_phone}
                  onChange={handleLeadChange}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Mobile Phone 1 */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Mobile Phone 1
                </label>
                <input
                  type="text"
                  placeholder="09----------"
                  name="mobile_phone_1"
                  value={leadData.mobile_phone_1}
                  onChange={handleLeadChange}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Mobile Phone 2 */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Mobile Phone 2
                </label>
                <input
                  type="text"
                  placeholder="09----------"
                  name="mobile_phone_2"
                  value={leadData.mobile_phone_2}
                  onChange={handleLeadChange}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Address */}
              <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="text-gray-700 font-medium mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={leadData.address}
                  onChange={handleLeadChange}
                  placeholder="Street No., Street Name, City, State/Province, Postal Code"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Assign To */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Assign To
                </label>
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  defaultValue=""
                  name="lead_owner"
                  value={leadData.lead_owner}
                  onChange={handleLeadChange}
                >
                  <option value="" disabled>
                    Select user
                  </option>
                  {Array.isArray(users) &&
                    users.length > 0 &&
                    users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Territory */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Territory
                </label>
                <input
                  type="text"
                  disabled
                  name="territory_id"
                  value={selectedUser && selectedUser.territories && selectedUser.territories.length > 0 ? selectedUser.territories.map(territory => territory.name).join(", ") : ""}
                  placeholder="Select Assign To first"
                  onChange={handleLeadChange}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Created By */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Source
                </label>
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  defaultValue=""
                  name="source"
                  value={leadData.source}
                  onChange={handleLeadChange}
                >
                  <option value="" disabled>
                    Select Source
                  </option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold call">Cold call</option>
                  <option value="Event">Event</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="text-gray-700 font-medium mb-1">Notes</label>
                <textarea
                  placeholder="Additional details..."
                  name="notes"
                  value={leadData.notes}
                  onChange={handleLeadChange}
                  rows={3}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                />
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-2 col-span-1 sm:col-span-2 lg:col-span-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
