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
import MarketingLeadsInformation from "../components/MarketingLeadsInformation";
import * as countryCodesList from "country-codes-list";

const allCountries = countryCodesList.all();
const COUNTRY_CODES = allCountries.map((country) => ({
  code: `+${country.countryCallingCode}`,
  name: country.countryCode,
}));

export default function MarketingLeads() {
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [users, setUsers] = useState([
    { id: 1, first_name: "Jane", last_name: "Doe" },
    { id: 2, first_name: "John", last_name: "Smith" },
    { id: 3, first_name: "Mary", last_name: "Johnson" },
  ]);

  const [leads, setLeads] = useState([
    {
      id: 1,
      name: "Joshua Vergara",
      status: "Qualified",
      title: "Marketing Director",
      email: "sarah.williams@innovateco.com",
      phone1: "9271229484",
      phone2: "---------",
      workPhone: "999123-4567",
      work_ccode: "+63",
      m1_ccode: "+63",
      m2_ccode: "+63",
      territory: "East Coast",
      department: "Marketing",
      company: "Innovate Co.",
      createdBy: "John Appleseed",
      createdAt: "2025-09-10 09:30",
      lastUpdated: "2025-09-12 14:45",
      source: "Website",
      assignedTo: "Jane Doe",
      address: "123 Main St, City, Country",
      notes: "Important client",
    },
  ]);

  const [leadData, setLeadData] = useState({
    work_ccode: "+63",
    work_phone: "",
    m1_ccode: "+63",
    mobile_phone_1: "",
    m2_ccode: "+63",
    mobile_phone_2: "",
  });

  useEffect(() => {
    document.title = "Leads | Sari-Sari CRM";
  }, []);

  const handleLeadClick = (lead) => setSelectedLead(lead);
  const handleBackToList = () => setSelectedLead(null);
  const [search, setSearch] = useState("");
  const [filterLeads, setFilterLeads] = useState("All Accounts");

  const handleBackdropClick = () => {
    setShowModal(false);
    setEditingLead(null);
    setLeadData({
      work_ccode: "+63",
      work_phone: "",
      m1_ccode: "+63",
      mobile_phone_1: "",
      m2_ccode: "+63",
      mobile_phone_2: "",
    });
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setShowModal(true);
    setLeadData({
      work_ccode: lead.work_ccode || "+63",
      work_phone: lead.workPhone || "",
      m1_ccode: lead.m1_ccode || "+63",
      mobile_phone_1: lead.phone1 || "",
      m2_ccode: lead.m2_ccode || "+63",
      mobile_phone_2: lead.phone2 || "",
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      setLeads(leads.filter((l) => l.id !== id));
    }
  };

  const handleLeadChange = (e) => {
    const { name, value } = e.target;
    setLeadData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    data.name = `${data.firstName} ${data.lastName}`;
    data.assignedTo =
      users.find((u) => u.id.toString() === data.assignedTo)?.first_name +
      " " +
      users.find((u) => u.id.toString() === data.assignedTo)?.last_name;

    data.work_ccode = leadData.work_ccode;
    data.workPhone = leadData.work_phone;
    data.m1_ccode = leadData.m1_ccode;
    data.phone1 = leadData.mobile_phone_1;
    data.m2_ccode = leadData.m2_ccode;
    data.phone2 = leadData.mobile_phone_2;

    if (editingLead) {
      setLeads(
        leads.map((l) => (l.id === editingLead.id ? { ...l, ...data } : l))
      );
    } else {
      setLeads([
        ...leads,
        {
          ...data,
          id: leads.length + 1,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        },
      ]);
    }

    handleBackdropClick();
  };

  if (selectedLead) {
    return (
      <MarketingLeadsInformation
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
          <FiUserPlus className="mr-2 text-blue-600" /> Leads
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-center border border-tertiary text-tertiary px-4 py-2 gap-2 rounded-md hover:bg-gray-800 hover:text-white transition w-full sm:w-auto">
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

      {/* ======= Search + Filters ======= */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        {/* Search Bar */}
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search Leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:outline-none text-base w-full"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="w-full lg:w-1/4">
          <select
            value={filterLeads}
            onChange={(e) => setFilterLeads(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option>All Leads</option>
            <option>New</option>
            <option>Contacted</option>
            <option>Qualified</option>
            <option>Converted</option>
            <option>Lost</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm overflow-x-auto rounded-md border border-gray-200">
        {/* Table Header */}
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

        {/* Table Rows */}
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="grid grid-cols-9 min-w-[800px] px-4 py-3 text-xs hover:bg-gray-100 transition cursor-pointer gap-x-4"
            onClick={() => handleLeadClick(lead)}
          >
            <div className="truncate">{lead.name}</div>
            <div className="truncate">{lead.company}</div>
            <div className="truncate">{lead.title}</div>
            <div className="truncate">{lead.department}</div>
            <div className="truncate">{lead.email}</div>
            <div className="truncate">
              {lead.work_ccode} {lead.workPhone}
            </div>
            <div className="truncate">{lead.assignedTo}</div>
            <div className="truncate">{lead.lastUpdated}</div>
            <div className="flex justify-center space-x-2">
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(lead);
                }}
              >
                <FiEdit />
              </button>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(lead.id);
                }}
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Leads Modal */}
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
              onClick={handleBackdropClick}
              className="absolute top-3 right-3 text-gray-400 hover:text-black transition"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">
              {editingLead ? "Edit Lead" : "Add New Lead"}
            </h2>

            <form
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm"
              onSubmit={handleSubmit}
            >
              {/* First Name */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  First Name
                </label>
                <input
                  name="firstName"
                  type="text"
                  placeholder="Joe"
                  defaultValue={
                    editingLead ? editingLead.name.split(" ")[0] : ""
                  }
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                />
              </div>

              {/* Last Name */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Last Name
                </label>
                <input
                  name="lastName"
                  type="text"
                  placeholder="Smith"
                  defaultValue={
                    editingLead ? editingLead.name.split(" ")[1] : ""
                  }
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                />
              </div>

              {/* Company */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Company
                </label>
                <input
                  name="company"
                  type="text"
                  placeholder="ABC Company"
                  defaultValue={editingLead?.company || ""}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Title */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Title</label>
                <input
                  name="title"
                  type="text"
                  placeholder="ABC Agenda"
                  defaultValue={editingLead?.title || ""}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Department */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Department
                </label>
                <input
                  name="department"
                  type="text"
                  placeholder="Sales"
                  defaultValue={editingLead?.department || ""}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Email</label>
                <input
                  name="email"
                  type="text"
                  placeholder="abc@gmail.com"
                  defaultValue={editingLead?.email || ""}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Work Phone */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Work Phone
                </label>
                <div className="border border-gray-300 rounded-md flex flex-row w-full gap-1">
                  <select
                    name="work_ccode"
                    value={leadData.work_ccode}
                    onChange={handleLeadChange}
                    className="outline-none cursor-pointer py-2 border-r border-gray-400 w-15"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="work_phone"
                    placeholder="9----------"
                    value={leadData.work_phone}
                    onChange={handleLeadChange}
                    className="w-full outline-none"
                  />
                </div>
              </div>

              {/* Mobile Phone 1 */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Mobile Phone 1
                </label>
                <div className="border border-gray-300 rounded-md flex flex-row w-full gap-1">
                  <select
                    name="m1_ccode"
                    value={leadData.m1_ccode}
                    onChange={handleLeadChange}
                    className="outline-none cursor-pointer py-2 border-r border-gray-400 w-15"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="mobile_phone_1"
                    placeholder="9----------"
                    value={leadData.mobile_phone_1}
                    onChange={handleLeadChange}
                    className="w-full outline-none"
                  />
                </div>
              </div>

              {/* Mobile Phone 2 */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Mobile Phone 2
                </label>
                <div className="border border-gray-300 rounded-md flex flex-row w-full gap-1">
                  <select
                    name="m2_ccode"
                    value={leadData.m2_ccode}
                    onChange={handleLeadChange}
                    className="outline-none cursor-pointer py-2 border-r border-gray-400 w-15"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="mobile_phone_2"
                    placeholder="9----------"
                    value={leadData.mobile_phone_2}
                    onChange={handleLeadChange}
                    className="w-full outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="text-gray-700 font-medium mb-1">
                  Address
                </label>
                <input
                  name="address"
                  type="text"
                  placeholder="Street No., Street Name, City, State/Province, Postal Code"
                  defaultValue={editingLead?.address || ""}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Assign To */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Assign To
                </label>
                <select
                  name="assignedTo"
                  defaultValue={
                    users.find(
                      (u) =>
                        `${u.first_name} ${u.last_name}` ===
                        editingLead?.assignedTo
                    )?.id || ""
                  }
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="" disabled>
                    Select user
                  </option>
                  {users.map((user) => (
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
                  placeholder="Assign a user"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Source */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Source</label>
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  defaultValue={editingLead?.source || ""}
                  name="source"
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
                  name="notes"
                  placeholder="Additional details..."
                  rows={3}
                  defaultValue={editingLead?.notes || ""}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                />
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-2 col-span-1 sm:col-span-2 lg:col-span-3">
                <button
                  type="button"
                  onClick={handleBackdropClick}
                  className="px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition"
                >
                  {editingLead ? "Update Lead" : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
